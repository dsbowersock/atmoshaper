"""Prove retention preserves recovery points across corruption and failed runs."""

import datetime
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts/database-backup"))
import backup
import maintenance
sys.path.pop(0)


class BackupMaintenanceTests(unittest.TestCase):
    def setUp(self):
        self.parent = (ROOT / "output/beta-readiness/maintenance-fixtures").resolve()
        self.parent.mkdir(parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(prefix="owned-", dir=self.parent)
        self.directory = Path(self.temporary.name).resolve()
        self.directory.chmod(0o700)
        self.now = datetime.datetime(2026, 11, 18, 12, tzinfo=datetime.timezone.utc)
        self.started = self.now - datetime.timedelta(minutes=1)

    def tearDown(self):
        self.assertEqual(self.directory.parent, self.parent)
        self.temporary.cleanup()

    def pair(self, days=0, number=1, seconds=0):
        """Create invented runs with explicit recency, independent of file order."""
        started = self.started - datetime.timedelta(days=days) + datetime.timedelta(seconds=seconds)
        completed = started + datetime.timedelta(seconds=10)
        run_id = format(number, "032x")
        stem = "atmoshaper-db-{}-{}".format(started.strftime("%Y%m%dT%H%M%SZ"), run_id)
        archive, receipt = self.directory / (stem + ".dump.age"), self.directory / (stem + ".json")
        data = backup.AGE_HEADER + b"Invented ciphertext fixture, not real user data."
        archive.write_bytes(data)
        archive.chmod(0o600)
        value = {"schemaVersion": 1, "state": "complete", "runId": run_id,
                 "startedUtc": started.isoformat(), "completedUtc": completed.isoformat(),
                 "encryptedBytes": len(data), "ciphertextSha256": hashlib.sha256(data).hexdigest(),
                 "databaseToolMajor": 18, "encryptionTool": "age-1.3.2"}
        receipt.write_text(json.dumps(value))
        receipt.chmod(0o600)
        return run_id, archive, receipt

    def retain(self, run_id, execute=False):
        return maintenance.retention_after_success(self.directory, run_id, self.started, self.now, execute)

    def test_dry_run_and_execution_keep_seven_successful_copies(self):
        pairs = [self.pair(days=n, number=n+1) for n in range(10)]
        original = set(self.directory.iterdir())
        plan = self.retain(pairs[0][0])
        self.assertEqual(plan['eligibleOldPairs'], 3)
        self.assertEqual(set(self.directory.iterdir()), original)
        result = self.retain(pairs[0][0], execute=True)
        self.assertEqual(result['deletedPairs'], 3)
        self.assertEqual(len(maintenance.verified_copies(self.directory, self.now)), 7)
        self.assertTrue(pairs[0][1].exists())

    def test_sparse_history_keeps_seven_successes_even_when_older_than_week(self):
        pairs = [self.pair(days=n*3, number=n+1) for n in range(6)]
        self.assertEqual(self.retain(pairs[0][0], execute=True)['deletedPairs'], 0)

    def test_recent_copies_are_not_deleted_even_when_more_than_seven(self):
        pairs = [self.pair(days=0, number=n+1, seconds=n) for n in range(10)]
        # The designated success must be strictly newest in either directory
        # order; all ten recent recovery points must survive retention.
        paths = sorted(self.directory.iterdir())
        for reverse in (False, True):
            with self.subTest(reverse=reverse):
                order = list(reversed(paths)) if reverse else paths
                with mock.patch.object(Path, 'iterdir', return_value=iter(order)):
                    self.assertEqual(self.retain(pairs[-1][0], execute=True)['deletedPairs'], 0)
                self.assertEqual(set(self.directory.iterdir()), set(paths))

    def test_previous_success_cannot_authorize_pruning_after_failed_export(self):
        old, unused, receipt = self.pair(days=1)
        original = set(self.directory.iterdir())
        with self.assertRaisesRegex(backup.BackupError, 'FRESH_SUCCESS_REQUIRED'):
            self.retain(old, execute=True)
        self.assertEqual(set(self.directory.iterdir()), original)

    def test_corrupt_archive_prevents_all_deletion(self):
        fresh, unused, unused_receipt = self.pair()
        unused_id, old, receipt = self.pair(days=10, number=2)
        old.write_bytes(old.read_bytes()[:-1] + b'!')
        with self.assertRaisesRegex(backup.BackupError, 'CHECKSUM_MISMATCH'):
            self.retain(fresh, execute=True)
        self.assertTrue(old.exists())
        self.assertTrue(receipt.exists())

    def test_orphan_archive_is_held(self):
        fresh, archive, receipt = self.pair()
        receipt.unlink()
        with self.assertRaises(backup.BackupError):
            self.retain(fresh, execute=True)
        self.assertTrue(archive.exists())

    def test_orphan_receipt_is_held(self):
        fresh, archive, receipt = self.pair()
        archive.unlink()
        with self.assertRaisesRegex(backup.BackupError, 'ORPHANED_RECOVERY_RECEIPT'):
            self.retain(fresh, execute=True)
        self.assertTrue(receipt.exists())

    def test_hard_linked_archive_is_held(self):
        fresh, archive, receipt = self.pair()
        companion = self.directory / 'held-fixture'
        os.link(archive, companion)
        with self.assertRaisesRegex(backup.BackupError, 'LINKED_RECOVERY_FILE'):
            self.retain(fresh, execute=True)
        self.assertTrue(companion.exists())

    def test_unknown_files_and_partial_files_are_preserved(self):
        fresh, archive, receipt = self.pair()
        held = self.directory / 'unrelated.dump.age'
        partial = self.directory / 'atmoshaper-db-owned.partial'
        held.write_bytes(b'Keep this foreign fixture unchanged.')
        partial.write_bytes(b'Keep this unfinished fixture unchanged.')
        before = {p: p.read_bytes() for p in [held, partial]}
        self.retain(fresh, execute=True)
        self.assertEqual(before, {p: p.read_bytes() for p in before})

    def test_future_or_naive_receipt_time_is_rejected(self):
        fresh, archive, receipt = self.pair()
        value = json.loads(receipt.read_text())
        for invalid in ['2026-11-19T00:00:00+00:00', '2026-11-18T12:00:00']:
            value['completedUtc'] = invalid
            receipt.write_text(json.dumps(value))
            with self.assertRaises(backup.BackupError):
                self.retain(fresh, execute=True)

    def test_changed_candidate_aborts_before_any_delete(self):
        pairs = [self.pair(days=n, number=n+1) for n in range(9)]
        original = set(self.directory.iterdir())
        real = maintenance.identity
        calls = {}
        def changed(path):
            calls[path] = calls.get(path, 0) + 1
            bound = real(path)
            if path == pairs[-1][1] and calls[path] >= 3:
                return bound[:-1] + (bound[-1]+1,)
            return bound
        with mock.patch.object(maintenance, 'identity', side_effect=changed):
            with self.assertRaisesRegex(backup.BackupError, 'RECOVERY_FILE_CHANGED'):
                self.retain(pairs[0][0], execute=True)
        self.assertEqual(set(self.directory.iterdir()), original)

    def test_freshness_is_missing_fresh_or_stale(self):
        self.assertEqual(maintenance.freshness(self.directory, self.now)['state'], 'missing')
        self.pair(days=2)
        self.assertEqual(maintenance.freshness(self.directory, self.now)['state'], 'stale')
        self.pair(number=2)
        self.assertEqual(maintenance.freshness(self.directory, self.now)['state'], 'fresh')


if __name__ == '__main__':
    unittest.main()
