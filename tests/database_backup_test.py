"""Exercise backup failure/ownership boundaries with invented local subprocesses."""

import contextlib
import datetime
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("atmoshaper_database_backup", ROOT / "scripts/database-backup/backup.py")
backup = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(backup)
PAYLOAD = b"Invented local backup fixture. No production data.\n" * 200
FAKE_ENCRYPT = "import base64,sys;sys.stdout.buffer.write(b'age-encryption.org/v1\\n'+base64.b64encode(sys.stdin.buffer.read()))"


class DatabaseBackupTests(unittest.TestCase):
    def setUp(self):
        self.fixture_parent = (ROOT / "output/beta-readiness/backup-fixtures").resolve()
        self.fixture_parent.mkdir(parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(prefix="atmoshaper-owned-", dir=self.fixture_parent)
        self.directory = Path(self.temporary.name).resolve()
        self.assertEqual(self.directory.parent, self.fixture_parent)
        self.directory.chmod(0o700)
        self.env = {key: os.environ[key] for key in ("PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP") if key in os.environ}

    def tearDown(self):
        # Check the resolved ownership boundary before recursive fixture cleanup.
        self.assertEqual(self.directory.parent, self.fixture_parent)
        self.assertTrue(self.directory.name.startswith("atmoshaper-owned-"))
        self.temporary.cleanup()

    def command(self, program):
        return [sys.executable, "-c", program]

    def run_fixture(self, export=None, encrypt=None, **limits):
        exporter = self.command(export or "import sys;sys.stdout.buffer.write({!r})".format(PAYLOAD))
        encryptor = self.command(encrypt or FAKE_ENCRYPT)
        return backup.run_backup(self.directory, exporter, encryptor, self.env, **limits)

    def data_files(self):
        return sorted(path.name for path in self.directory.iterdir() if path.name != ".backup.lock")

    def test_publishes_paired_ciphertext_and_receipt_without_plaintext_or_partials(self):
        receipt = self.run_fixture()
        files = list(self.directory.glob("*.dump.age"))
        self.assertEqual(len(files), 1)
        ciphertext = files[0].read_bytes()
        self.assertNotIn(PAYLOAD[:48], ciphertext)
        self.assertEqual(receipt["ciphertextSha256"], hashlib.sha256(ciphertext).hexdigest())
        self.assertEqual(receipt["encryptedBytes"], len(ciphertext))
        self.assertEqual(json.loads(next(self.directory.glob("*.json")).read_text()), receipt)
        self.assertFalse(list(self.directory.glob("*.partial")))

    def test_partial_export_cannot_be_published_when_encryption_exits_successfully(self):
        with self.assertRaisesRegex(backup.BackupError, "DATABASE_EXPORT_FAILED"):
            self.run_fixture(export="import sys;sys.stdout.buffer.write(b'partial');sys.exit(3)")
        self.assertEqual(self.data_files(), [])

    def test_encryptor_failure_preserves_an_existing_completed_copy(self):
        previous = self.directory / "previous-good.dump.age"
        previous.write_bytes(b"keep this existing fixture")
        with self.assertRaisesRegex(backup.BackupError, "ENCRYPTION_FAILED"):
            self.run_fixture(encrypt="import sys;sys.stdin.buffer.read();sys.exit(4)")
        self.assertEqual(self.data_files(), [previous.name])
        self.assertEqual(previous.read_bytes(), b"keep this existing fixture")

    def test_secret_shaped_stderr_is_not_retained_or_included_in_failure(self):
        canary = "postgresql://invented:fixture-secret@fixture.invalid/fake"
        with self.assertRaises(backup.BackupError) as raised:
            self.run_fixture(export="import sys;sys.stderr.write({!r});sys.stdout.buffer.write(b'fixture')".format(canary))
        self.assertEqual(str(raised.exception), "BACKUP_DIAGNOSTIC_REQUIRES_REVIEW")
        self.assertNotIn(canary, str(raised.exception))
        self.assertEqual(self.data_files(), [])

    def test_ciphertext_limit_aborts_without_leaving_recovery_points(self):
        with self.assertRaisesRegex(backup.BackupError, "ENCRYPTED_SIZE_LIMIT"):
            self.run_fixture(max_bytes=64)
        self.assertEqual(self.data_files(), [])

    def test_hung_export_is_killed_and_lock_is_reusable(self):
        with self.assertRaisesRegex(backup.BackupError, "BACKUP_TIMEOUT"):
            self.run_fixture(export="import time;time.sleep(30)", timeout_seconds=0.25)
        self.assertEqual(self.data_files(), [])
        self.assertEqual(self.run_fixture()["state"], "complete")

    def test_empty_and_unencrypted_outputs_are_rejected(self):
        for program in ("import sys;sys.stdin.buffer.read()", "import sys;sys.stdout.buffer.write(sys.stdin.buffer.read())"):
            with self.subTest(program=program):
                with self.assertRaisesRegex(backup.BackupError, "INVALID_ENCRYPTED_OUTPUT"):
                    self.run_fixture(encrypt=program)
                self.assertEqual(self.data_files(), [])

    def test_missing_encryption_tool_cleans_only_the_new_attempt(self):
        prior = self.directory / "unrelated.txt"
        prior.write_text("preserve")
        with self.assertRaisesRegex(backup.BackupError, "BACKUP_IO_OR_TOOL_FAILURE"):
            backup.run_backup(self.directory, self.command("print('fixture')"),
                              [str(self.directory / "nonexistent-encryptor")], self.env)
        self.assertEqual(self.data_files(), [prior.name])

    def test_overlapping_attempt_does_not_replace_the_active_lock(self):
        with backup.exclusive_lock(self.directory):
            with self.assertRaisesRegex(backup.BackupError, "BACKUP_ALREADY_RUNNING"):
                self.run_fixture()
        self.assertEqual(self.run_fixture()["state"], "complete")

    def test_preexisting_destination_is_never_overwritten(self):
        timestamp = datetime.datetime(2026, 11, 18, 0, 0, tzinfo=datetime.timezone.utc)
        run_id = "a" * 32
        previous = self.directory / ("atmoshaper-db-20261118T000000Z-" + run_id + ".dump.age")
        previous.write_bytes(b"existing immutable fixture")
        with mock.patch.object(backup, "utc_now", return_value=timestamp), mock.patch.object(backup.uuid, "uuid4") as identifier:
            identifier.return_value.hex = run_id
            with self.assertRaisesRegex(backup.BackupError, "BACKUP_IO_OR_TOOL_FAILURE"):
                self.run_fixture()
        self.assertEqual(previous.read_bytes(), b"existing immutable fixture")
        self.assertEqual(self.data_files(), [previous.name])

    def test_limits_cannot_be_disabled_or_expanded(self):
        for limits in ({"max_bytes":0}, {"max_bytes":backup.MAX_BYTES+1}, {"timeout_seconds":0}, {"timeout_seconds":901}):
            with self.subTest(limits=limits), self.assertRaisesRegex(backup.BackupError, "INVALID_BACKUP_LIMITS"):
                self.run_fixture(**limits)
        self.assertEqual(self.data_files(), [])

    def test_plan_and_unknown_arguments_never_read_credentials(self):
        for arguments, code in (([],0), (["plan"],0), (["run"],2), (["postgresql://invented.invalid/fake"],2)):
            with self.subTest(arguments=arguments), mock.patch.object(backup, "live_commands", side_effect=AssertionError("must not read")):
                captured = io.StringIO()
                with contextlib.redirect_stdout(captured):
                    self.assertEqual(backup.main(arguments), code)
                self.assertNotIn("postgresql", captured.getvalue())

    def test_missing_live_config_reports_only_a_fixed_failure_code(self):
        captured = io.StringIO()
        with mock.patch.object(backup, "live_commands", side_effect=OSError("invented private detail")), contextlib.redirect_stdout(captured):
            self.assertEqual(backup.main(["run", "--execute"]), 1)
        self.assertEqual(json.loads(captured.getvalue()), {"state":"failed", "code":"BACKUP_PREFLIGHT_FAILED"})

    def test_untrusted_service_overrides_are_rejected_before_any_tool_starts(self):
        recipient = "age1" + "a" * 58
        base = "[backup]\nhost=ep-invented.us-east-2.aws.neon.tech\ndbname=neondb\nuser=backup_reader\nsslmode=verify-full\nsslrootcert=system\nchannel_binding=require\n"
        service = self.directory / "pg_service.conf"
        (self.directory / "pgpass").write_text("invented only")
        (self.directory / "recipient.txt").write_text(recipient)
        for path in self.directory.iterdir():
            path.chmod(0o600)
        variants = [base+"password=do-not-load\n", base.replace("ep-invented", "ep-invented-pooler"),
                    base.replace("ep-invented", "other.invalid,ep-invented"),
                    base.replace("verify-full", "disable"), base+"port=70000\n", "[DEFAULT]\nhost=other.invalid\n"+base]
        for content in variants:
            service.write_text(content)
            service.chmod(0o600)
            with self.subTest(content=content), mock.patch.object(backup.subprocess, "run", side_effect=AssertionError("must not start")):
                with self.assertRaisesRegex(backup.BackupError, "INVALID_DATABASE_SERVICE"):
                    backup.live_commands(self.directory)

    def test_live_preflight_never_puts_connection_values_in_argv_or_inherits_other_secrets(self):
        (self.directory / "pg_service.conf").write_text(
            "[backup]\nhost=ep-invented.us-east-2.aws.neon.tech\ndbname=neondb\n"
            "user=backup_reader\nsslmode=verify-full\nsslrootcert=system\nchannel_binding=require\n")
        (self.directory / "pgpass").write_text("invented-password-file-only")
        (self.directory / "recipient.txt").write_text("age1" + "a" * 58)
        for path in self.directory.iterdir():
            path.chmod(0o600)
        results = [subprocess.CompletedProcess([],0,"pg_dump (PostgreSQL) 18.7\n",""),
                   subprocess.CompletedProcess([],0,"v1.3.2\n",""),
                   subprocess.CompletedProcess([],0)]
        with mock.patch.dict(backup.os.environ,{"PGPASSWORD":"invented-inherited-secret", "SENTRY_AUTH_TOKEN":"invented-unrelated-secret"}), \
                mock.patch.object(backup.subprocess,"run",side_effect=results):
            exporter, encryptor, env = backup.live_commands(self.directory)
        self.assertNotIn("PGPASSWORD",env)
        self.assertNotIn("SENTRY_AUTH_TOKEN",env)
        self.assertNotIn("ep-invented",json.dumps([exporter,encryptor,env]))
        self.assertNotIn("invented-password-file-only",json.dumps([exporter,encryptor,env]))
        self.assertEqual(env["GOMAXPROCS"],"1")
        self.assertEqual(env["PGSERVICE"],"backup")
        self.assertIn("default_transaction_read_only=on",env["PGOPTIONS"])

    def test_old_host_database_tools_are_rejected(self):
        (self.directory / "pg_service.conf").write_text(
            "[backup]\nhost=ep-invented.us-east-2.aws.neon.tech\ndbname=neondb\n"
            "user=backup_reader\nsslmode=verify-full\nsslrootcert=system\nchannel_binding=require\n")
        (self.directory / "pgpass").write_text("invented")
        (self.directory / "recipient.txt").write_text("age1" + "a" * 58)
        for path in self.directory.iterdir():
            path.chmod(0o600)
        with mock.patch.object(backup.subprocess,"run",return_value=subprocess.CompletedProcess([],0,"pg_dump (PostgreSQL) 11.11\n","")) as command:
            with self.assertRaisesRegex(backup.BackupError,"UNEXPECTED_TOOL_VERSION"):
                backup.live_commands(self.directory)
        self.assertEqual(command.call_count,1)

    @unittest.skipUnless(os.environ.get("ATMOSHAPER_TEST_AGE"), "Optional official-age fixture tool not supplied")
    def test_real_age_encrypt_decrypt_and_wrong_key_rejection(self):
        age = Path(os.environ["ATMOSHAPER_TEST_AGE"])
        keygen = age.with_name("age-keygen" + age.suffix)
        key = subprocess.run([str(keygen)], capture_output=True, check=True)
        identity = self.directory / "fixture-identity.txt"
        identity.write_bytes(key.stdout)
        identity.chmod(0o600)
        recipient = re.search(rb"age1[023456789acdefghjklmnpqrstuvwxyz]{58}", key.stdout+key.stderr).group().decode()
        backup.run_backup(self.directory, self.command("import sys;sys.stdout.buffer.write({!r})".format(PAYLOAD)),
                          [str(age), "--encrypt", "--recipient", recipient], self.env)
        archive = next(self.directory.glob("*.dump.age"))
        restored = subprocess.run([str(age), "--decrypt", "--identity", str(identity), str(archive)], capture_output=True, check=True)
        self.assertEqual(restored.stdout, PAYLOAD)
        wrong_identity = self.directory / "wrong-fixture-identity.txt"
        wrong_identity.write_bytes(subprocess.run([str(keygen)], capture_output=True, check=True).stdout)
        wrong_identity.chmod(0o600)
        rejected = subprocess.run([str(age), "--decrypt", "--identity", str(wrong_identity), str(archive)], capture_output=True)
        self.assertNotEqual(rejected.returncode, 0)
        self.assertEqual(rejected.stdout, b"")


if __name__ == "__main__":
    unittest.main()
