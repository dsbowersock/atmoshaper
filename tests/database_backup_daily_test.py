"""Exercise daily failure/notification boundaries with no Docker or network access."""

import contextlib
import datetime
import io
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import types
import unittest
from unittest import mock
import urllib.parse


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts/database-backup'))
import backup
import daily
sys.path.pop(0)


class DailyBackupTests(unittest.TestCase):
    def setUp(self):
        self.parent = (ROOT / 'output/beta-readiness/daily-fixtures').resolve()
        self.parent.mkdir(parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(prefix='owned-', dir=self.parent)
        self.root = Path(self.temporary.name).resolve()
        self.root.chmod(0o700)
        for name in ['operation', 'backups']:
            (self.root / name).mkdir(mode=0o700)
        self.config = {'root': str(self.root), 'image': 'sha256:' + 'a'*64, 'uid': 1026, 'gid': 100,
                       'checkinUrl': 'https://o123.ingest.us.sentry.io/api/456/cron/invented-backup/' + 'b'*32 + '/'}
        self.now = datetime.datetime(2026, 11, 18, 12, tzinfo=datetime.timezone.utc)
        self.retention = {'verifiedCopies': 1, 'eligibleOldPairs': 0, 'deletedPairs': 0}

    def tearDown(self):
        self.assertEqual(self.root.parent, self.parent)
        self.temporary.cleanup()

    def run_fake(self, exported=None, notifications=None, retention_error=None):
        notify = mock.Mock(side_effect=notifications or [True, True])
        image = subprocess.CompletedProcess([], 0, stdout=self.config['image']+'\n', stderr='')
        exported = exported or subprocess.CompletedProcess([], 0, stdout=json.dumps({'state':'complete','runId':'c'*32}), stderr='')
        with mock.patch.object(daily, 'operation_deadline', side_effect=contextlib.nullcontext), \
             mock.patch.object(daily.subprocess, 'run', side_effect=[image, exported]) as invoke, \
             mock.patch.object(daily.maintenance, 'retention_after_success', return_value=self.retention,
                               side_effect=retention_error) as retain, \
             mock.patch.object(daily.shutil, 'disk_usage', return_value=types.SimpleNamespace(free=2**40)):
            result = daily.execute(self.config, now_fn=lambda:self.now, notify=notify)
        return result, invoke, retain, notify

    def test_success_binds_fresh_receipt_then_reports_ok(self):
        result, invoke, retain, notify = self.run_fake()
        self.assertEqual(result['state'], 'complete')
        self.assertEqual(retain.call_args.args[1:3], ('c'*32, self.now))
        self.assertTrue(retain.call_args.kwargs['execute'])
        self.assertEqual([call.args[1] for call in notify.call_args_list], ['in_progress','ok'])
        self.assertEqual(notify.call_args_list[0].args[2], notify.call_args_list[1].args[2])
        self.assertEqual(invoke.call_count, 2)

    def test_failed_export_never_invokes_retention_or_exposes_stderr(self):
        failed = subprocess.CompletedProcess([], 1, stdout='', stderr='invented-password-do-not-output')
        result, invoke, retain, notify = self.run_fake(exported=failed)
        self.assertEqual(result['code'], 'DAILY_EXPORT_FAILED')
        retain.assert_not_called()
        self.assertNotIn('invented-password', json.dumps(result))
        self.assertEqual(notify.call_args.args[1], 'error')

    def test_failure_receipt_cannot_be_replayed_same_day(self):
        self.run_fake(exported=subprocess.CompletedProcess([],1,stdout='',stderr=''))
        with mock.patch.object(daily.subprocess,'run') as invoke:
            with self.assertRaisesRegex(backup.BackupError,'DAILY_ATTEMPT_ALREADY_EXISTS'):
                daily.execute(self.config, now_fn=lambda:self.now, notify=mock.Mock())
        invoke.assert_not_called()

    def test_monitor_start_failure_preserves_older_copies(self):
        result, invoke, retain, notify = self.run_fake(notifications=[False,True])
        self.assertEqual(result['code'], 'MONITOR_START_FAILED')
        self.assertFalse(retain.call_args.kwargs['execute'])
        self.assertEqual(notify.call_args.args[1], 'error')

    def test_monitor_completion_failure_is_not_a_false_success(self):
        result, invoke, retain, notify = self.run_fake(notifications=[True,False])
        self.assertEqual(result['state'], 'failed')
        self.assertEqual(result['code'], 'MONITOR_COMPLETION_FAILED')
        self.assertEqual(invoke.call_count, 2)

    def test_monitor_failure_retains_the_original_export_failure(self):
        failed = subprocess.CompletedProcess([], 1, stdout='', stderr='')
        result, unused_invoke, unused_retain, unused_notify = self.run_fake(exported=failed, notifications=[True, False])
        self.assertEqual(result['code'], 'DAILY_EXPORT_FAILED')
        self.assertFalse(result['monitoringDelivered'])

    def test_final_monitor_timeout_still_persists_a_result(self):
        result, unused_invoke, unused_retain, unused_notify = self.run_fake(notifications=[True, daily.DeadlineExpired()])
        self.assertEqual(result['code'], 'MONITOR_COMPLETION_FAILED')
        self.assertFalse(result['monitoringDelivered'])
        persisted = json.loads(next((self.root/'operation').glob('*.result.json')).read_text())
        self.assertEqual(persisted['code'], result['code'])

    def test_final_monitor_call_has_a_wall_clock_alarm(self):
        # Supply a fake signal API so this contract runs on Windows without
        # installing an actual process-wide timer or making any network call.
        alarm = [0.0]
        fake_signal = types.SimpleNamespace(ITIMER_REAL=0, SIGALRM=14,
            getitimer=lambda unused: (alarm[0], 0.0), getsignal=lambda unused: 0,
            signal=lambda *unused: None,
            setitimer=lambda unused, seconds: alarm.__setitem__(0, seconds))
        observed = []
        def notify(unused_url, status, unused_id):
            observed.append((status, alarm[0] > 0))
            return True
        image = subprocess.CompletedProcess([], 0, stdout=self.config['image']+'\n', stderr='')
        exported = subprocess.CompletedProcess([], 0, stdout=json.dumps({'state':'complete','runId':'c'*32}), stderr='')
        with mock.patch.object(daily, 'signal', fake_signal), \
             mock.patch.object(daily.subprocess, 'run', side_effect=[image, exported]), \
             mock.patch.object(daily.maintenance, 'retention_after_success', return_value=self.retention), \
             mock.patch.object(daily.shutil, 'disk_usage', return_value=types.SimpleNamespace(free=2**40)):
            self.assertEqual(daily.execute(self.config, now_fn=lambda:self.now, notify=notify)['state'], 'complete')
        self.assertEqual(observed, [('in_progress', True), ('ok', True)])

    def test_retention_corruption_does_not_report_healthy_job(self):
        result, invoke, retain, notify = self.run_fake(retention_error=backup.BackupError('RECOVERY_CHECKSUM_MISMATCH'))
        self.assertEqual(result['code'], 'RECOVERY_CHECKSUM_MISMATCH')
        self.assertEqual(notify.call_args.args[1], 'error')

    def test_timeout_cleanup_refuses_other_label_or_image(self):
        row = 'd'*64+' '+self.config['image']+' '+ 'e'*32
        with mock.patch.object(daily.subprocess,'run',return_value=subprocess.CompletedProcess([],0,stdout=row,stderr='')) as invoke:
            self.assertFalse(daily.cleanup_timed_out(self.config,'f'*32,{}))
        self.assertEqual(invoke.call_count, 1)

    def test_timeout_cleanup_uses_exact_verified_container_id(self):
        row = 'd'*64+' '+self.config['image']+' '+ 'f'*32
        with mock.patch.object(daily.subprocess,'run',side_effect=[subprocess.CompletedProcess([],0,stdout=row,stderr=''),subprocess.CompletedProcess([],0)]) as invoke:
            self.assertTrue(daily.cleanup_timed_out(self.config,'f'*32,{}))
        self.assertEqual(invoke.call_args.args[0], daily.DOCKER_ARGS + ['rm','--force','d'*64])

    def test_deadline_during_export_records_failure_and_scoped_cleanup(self):
        notify = mock.Mock(return_value=True)
        image = subprocess.CompletedProcess([],0,stdout=self.config['image']+'\n',stderr='')
        with mock.patch.object(daily,'operation_deadline',side_effect=contextlib.nullcontext), \
             mock.patch.object(daily.subprocess,'run',side_effect=[image,daily.DeadlineExpired()]), \
             mock.patch.object(daily,'cleanup_timed_out',return_value=True) as cleanup, \
             mock.patch.object(daily.shutil,'disk_usage',return_value=types.SimpleNamespace(free=2**40)), \
             mock.patch.object(daily.maintenance,'retention_after_success') as retain:
            result = daily.execute(self.config,now_fn=lambda:self.now,notify=notify)
        self.assertEqual(result['code'],'DAILY_OPERATION_TIMEOUT')
        self.assertTrue(result['ownedContainerCleanupConfirmed'])
        cleanup.assert_called_once()
        retain.assert_not_called()
        self.assertEqual(notify.call_args.args[1],'error')

    def test_checkin_contains_only_operational_fields_and_no_upsert(self):
        response = mock.MagicMock()
        response.__enter__.return_value.status = 200
        opener = mock.Mock()
        opener.open.return_value = response
        with mock.patch.object(daily.urllib.request,'build_opener',return_value=opener):
            self.assertTrue(daily.check_in(self.config['checkinUrl'],'ok','f'*32))
        request = opener.open.call_args.args[0]
        query = urllib.parse.parse_qs(urllib.parse.urlsplit(request.full_url).query)
        self.assertEqual(query, {'status':['ok'],'check_in_id':['f'*32],'environment':['production']})
        self.assertIsNone(request.data)
        self.assertEqual(opener.open.call_args.kwargs['timeout'], 10)

    def test_invalid_checkin_destinations_never_open_a_network_connection(self):
        urls = ['http://example.com/','https://localhost/',self.config['checkinUrl']+'?token=unexpected',
                self.config['checkinUrl'].replace('sentry.io','sentry.io.example.com')]
        with mock.patch.object(daily.urllib.request,'build_opener') as build:
            for url in urls:
                self.assertFalse(daily.check_in(url,'ok','f'*32))
        build.assert_not_called()

    def test_redirects_are_rejected(self):
        with self.assertRaisesRegex(backup.BackupError,'MONITOR_REDIRECT_REJECTED'):
            daily.NoRedirect().redirect_request(None,None,302,'',{},'https://example.com/')

    def test_default_plan_never_reads_private_configuration_or_sends_requests(self):
        output = io.StringIO()
        with mock.patch.object(daily,'settings') as read, mock.patch.object(daily,'execute') as execute, contextlib.redirect_stdout(output):
            self.assertEqual(daily.main([]), 0)
        read.assert_not_called()
        execute.assert_not_called()
        self.assertEqual(json.loads(output.getvalue())['state'],'inert-plan')

    def private_config(self):
        for name in ['config','build','operator']:
            (self.root/name).mkdir(mode=0o700)
        source = (ROOT/'scripts/database-backup/backup.py').read_bytes()
        for path in [self.root/'build/backup.py',self.root/'operator/backup.py']:
            path.write_bytes(source)
            path.chmod(0o600)
        value = dict(self.config, schemaVersion=1, backupScriptSha256=hashlib.sha256(source).hexdigest())
        path = self.root/'config/daily.json'
        path.write_text(json.dumps(value))
        path.chmod(0o600)
        return path,value

    def read_settings(self,path):
        fake_os = types.SimpleNamespace(name='posix',getuid=lambda:1026,getgid=lambda:100)
        with mock.patch.object(daily,'os',fake_os), mock.patch.object(backup,'__file__',str(self.root/'operator/backup.py')):
            return daily.settings(path)

    def test_private_config_binds_both_host_helper_and_container_script(self):
        path,value = self.private_config()
        self.assertEqual(self.read_settings(path),value)
        (self.root/'operator/backup.py').write_bytes(b'Changed fixture helper')
        with self.assertRaisesRegex(backup.BackupError,'BACKUP_SCRIPT_CHANGED'):
            self.read_settings(path)

    def test_private_config_rejects_unknown_fields_and_monitor_redirect_destination(self):
        path,value = self.private_config()
        for changed in [dict(value,extra='unexpected'),dict(value,checkinUrl='https://example.com/private/')]:
            path.write_text(json.dumps(changed))
            with self.assertRaisesRegex(backup.BackupError,'INVALID_DAILY_CONFIG'):
                self.read_settings(path)

    def test_private_config_cannot_select_another_host_operator(self):
        path,value = self.private_config()
        value['uid'] = 0
        path.write_text(json.dumps(value))
        with self.assertRaisesRegex(backup.BackupError,'WRONG_DAILY_OPERATOR'):
            self.read_settings(path)

    def test_command_has_no_recovery_key_socket_or_provider_secret_mount(self):
        args = daily.command(self.config,'f'*32)
        self.assertIn('--log-driver',args)
        self.assertIn('none',args)
        self.assertIn('no-new-privileges:true',args)
        mounts = [args[index+1] for index,value in enumerate(args) if value == '--mount']
        self.assertNotIn('docker.sock',' '.join(mounts))
        self.assertEqual(args[:3], daily.DOCKER_ARGS)
        self.assertNotIn('identity',' '.join(args))
        self.assertEqual(args[-3:],[self.config['image'],'run','--execute'])


if __name__ == '__main__':
    unittest.main()
