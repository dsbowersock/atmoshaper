"""Validate encrypted recovery points and plan narrowly owned retention.

No key or database connection is needed. Retention requires the current run's
fresh, verified receipt; failures never authorize deletion of an older copy.
"""

import datetime
import hashlib
import json
import os
from pathlib import Path
import re

from backup import AGE_HEADER, BackupError, MAX_BYTES, require_private_path, sync_directory


ARCHIVE_NAME = re.compile(r"atmoshaper-db-(\d{8}T\d{6}Z)-([0-9a-f]{32})\.dump\.age")
RECEIPT_KEYS = {"schemaVersion", "state", "runId", "startedUtc", "completedUtc",
                "encryptedBytes", "ciphertextSha256", "databaseToolMajor", "encryptionTool"}


def timestamp(value):
    """Require an explicitly UTC receipt time; reject naive/local interpretations."""
    try:
        parsed = datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.utcoffset() != datetime.timedelta(0):
            raise ValueError()
        return parsed
    except (AttributeError, TypeError, ValueError):
        raise BackupError("INVALID_RECOVERY_RECEIPT") from None


def identity(path):
    """Bind an unlink decision to the same private, single-link regular file."""
    require_private_path(path)
    info = path.lstat()
    if info.st_nlink != 1:
        raise BackupError("LINKED_RECOVERY_FILE")
    return (info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns)


def read_pair(archive, now):
    """Verify filename, strict receipt, complete ciphertext and unchanged files."""
    match = ARCHIVE_NAME.fullmatch(archive.name)
    receipt = archive.with_name(archive.name[:-9] + ".json")
    try:
        before = {path: identity(path) for path in (archive, receipt)}
        if not len(AGE_HEADER) < before[archive][2] <= MAX_BYTES or before[receipt][2] > 8192:
            raise BackupError("INVALID_RECOVERY_RECEIPT")
        data = json.loads(receipt.read_text(encoding="utf-8"))
        if (set(data) != RECEIPT_KEYS or data["schemaVersion"] != 1 or data["state"] != "complete"
                or data["runId"] != match.group(2) or data["databaseToolMajor"] != 18
                or data["encryptionTool"] != "age-1.3.2" or type(data["encryptedBytes"]) is not int
                or data["encryptedBytes"] != before[archive][2]
                or not re.fullmatch(r"[0-9a-f]{64}", data["ciphertextSha256"])):
            raise BackupError("INVALID_RECOVERY_RECEIPT")
        started, completed = timestamp(data["startedUtc"]), timestamp(data["completedUtc"])
        if (started.strftime("%Y%m%dT%H%M%SZ") != match.group(1) or completed < started
                or completed > now + datetime.timedelta(minutes=5)):
            raise BackupError("INVALID_RECOVERY_TIME")
        digest = hashlib.sha256()
        flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0)
        with os.fdopen(os.open(archive, flags), "rb") as handle:
            if handle.read(len(AGE_HEADER)) != AGE_HEADER:
                raise BackupError("INVALID_ENCRYPTED_OUTPUT")
            handle.seek(0)
            for block in iter(lambda: handle.read(65536), b""):
                digest.update(block)
        if digest.hexdigest() != data["ciphertextSha256"]:
            raise BackupError("RECOVERY_CHECKSUM_MISMATCH")
        if any(identity(path) != bound for path, bound in before.items()):
            raise BackupError("RECOVERY_FILE_CHANGED")
        return {"runId": data["runId"], "started": started, "completed": completed,
                "paths": before}
    except BackupError:
        raise
    except Exception:
        raise BackupError("INVALID_RECOVERY_PAIR") from None


def verified_copies(directory, now):
    """Fail closed on orphaned/malformed owned pairs; leave foreign files alone."""
    directory = require_private_path(directory, directory=True)
    paths = []
    for path in directory.iterdir():
        paths.append(path)
        if len(paths) > 256:
            raise BackupError("RECOVERY_DIRECTORY_LIMIT")
    archives = [path for path in paths if ARCHIVE_NAME.fullmatch(path.name)]
    expected_receipts = {path.name[:-9] + ".json" for path in archives}
    for path in paths:
        if (re.fullmatch(r"atmoshaper-db-\d{8}T\d{6}Z-[0-9a-f]{32}\.json", path.name)
                and path.name not in expected_receipts):
            raise BackupError("ORPHANED_RECOVERY_RECEIPT")
    return sorted((read_pair(path, now) for path in archives), key=lambda item: item["completed"])


def retention_after_success(directory, new_run_id, run_started, now, execute=False):
    """Keep seven successes and seven days; delete only verified older pairs.

    Caller must hold the daily operator lock. A previous day's receipt cannot
    be used as permission to prune after today's failed or ambiguous export.
    Every candidate is rebound before the first deletion and again per pair.
    """
    copies = verified_copies(directory, now)
    fresh = next((item for item in copies if item["runId"] == new_run_id), None)
    if (fresh is None or fresh is not copies[-1] or fresh["started"] < run_started
            or fresh["completed"] > now or now - fresh["completed"] > datetime.timedelta(minutes=20)):
        raise BackupError("FRESH_SUCCESS_REQUIRED_FOR_RETENTION")
    cutoff = now - datetime.timedelta(days=7)
    candidates = [item for item in copies[:-7] if item["completed"] < cutoff]
    for item in copies:
        if any(identity(path) != bound for path, bound in item["paths"].items()):
            raise BackupError("RECOVERY_FILE_CHANGED")
    deleted = 0
    if execute:
        for item in candidates:
            if any(identity(path) != bound for path, bound in item["paths"].items()):
                raise BackupError("RECOVERY_FILE_CHANGED")
            # Archive first: interruption may leave a harmless orphan receipt,
            # which the next run holds for review instead of silently sweeping.
            for path in item["paths"]:
                path.unlink()
            deleted += 1
        sync_directory(Path(directory))
    return {"verifiedCopies": len(copies), "eligibleOldPairs": len(candidates),
            "deletedPairs": deleted, "minimumSuccessfulCopyTarget": 7}


def freshness(directory, now):
    """Report only coarse freshness; a same-host check cannot detect host loss."""
    copies = verified_copies(directory, now)
    if not copies:
        return {"state": "missing", "verifiedCopies": 0}
    age = (now - copies[-1]["completed"]).total_seconds()
    return {"state": "fresh" if 0 <= age <= 26 * 3600 else "stale",
            "verifiedCopies": len(copies), "newestAgeSeconds": round(age)}
