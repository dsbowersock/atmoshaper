"""Produce one encrypted database archive; scheduling and restore are separate operations.

The default CLI prints an inert plan. Live execution reads private libpq files
from /config, streams pg_dump into age, and persists ciphertext only. Errors
contain fixed codes, never subprocess stderr, connection details or row data.
"""

import configparser
import contextlib
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import threading
import time
import uuid


AGE_HEADER = b"age-encryption.org/v1\n"
TIMEOUT_SECONDS = 900
MAX_BYTES = 256 * 1024 * 1024


class BackupError(Exception):
    """A public-safe failure code suitable for owner-facing status reporting."""


def require_private_path(path, directory=False):
    """Reject linked, shared or differently owned private runtime paths."""
    path = Path(path)
    info = path.lstat()
    expected_type = stat.S_ISDIR if directory else stat.S_ISREG
    if path.is_symlink() or not expected_type(info.st_mode):
        raise BackupError("UNSAFE_PRIVATE_PATH")
    if os.name == "posix" and (info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) & 0o077):
        raise BackupError("UNSAFE_PRIVATE_PERMISSIONS")
    return path


@contextlib.contextmanager
def exclusive_lock(directory):
    """Use an OS-released lock so a crash cannot leave a stale scheduling lease."""
    lock_path = directory / ".backup.lock"
    if lock_path.is_symlink():
        raise BackupError("UNSAFE_PRIVATE_PATH")
    descriptor = os.open(lock_path, os.O_CREAT | os.O_RDWR | getattr(os, "O_NOFOLLOW", 0), 0o600)
    with os.fdopen(descriptor, "r+b", buffering=0) as handle:
        require_private_path(lock_path)
        if os.fstat(handle.fileno()).st_nlink != 1:
            raise BackupError("UNSAFE_PRIVATE_PATH")
        if os.fstat(handle.fileno()).st_size == 0:
            handle.write(b"0")
        handle.seek(0)
        try:
            if os.name == "posix":
                import fcntl
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            else:
                import msvcrt
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            raise BackupError("BACKUP_ALREADY_RUNNING") from None
        yield


def utc_now():
    """Return an aware UTC time for portable recovery receipts."""
    return datetime.datetime.now(datetime.timezone.utc)


def sync_directory(directory):
    """Make completed directory entries durable on the Linux backup runner."""
    if os.name == "posix":
        descriptor = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)


def run_backup(output_dir, exporter, encryptor, env, timeout_seconds=TIMEOUT_SECONDS, max_bytes=MAX_BYTES):
    """Stream an exporter through age and publish an archive/receipt only on full success.

    Commands are explicit argv arrays and never use a shell. Neither stderr nor
    plaintext is persisted. Any stderr makes the attempt fail conservatively.
    Only this invocation's newly created paths are removed after a failure.
    """
    directory = require_private_path(output_dir, directory=True)
    if not 0 < timeout_seconds <= TIMEOUT_SECONDS or not 0 < max_bytes <= MAX_BYTES:
        raise BackupError("INVALID_BACKUP_LIMITS")
    with exclusive_lock(directory):
        deadline = time.monotonic() + timeout_seconds
        started = utc_now()
        run_id = uuid.uuid4().hex
        basename = "atmoshaper-db-{}-{}".format(started.strftime("%Y%m%dT%H%M%SZ"), run_id)
        archive = directory / (basename + ".dump.age")
        receipt = directory / (basename + ".json")
        partial = directory / (basename + ".partial")
        receipt_partial = directory / (basename + ".json.partial")
        owned_paths = []
        processes = []
        readers = []
        stderr_seen = threading.Event()
        timed_out = threading.Event()
        timer = None
        success = False

        def check_deadline():
            """Include durable publication in the budget, even after children exit."""
            if timed_out.is_set() or time.monotonic() >= deadline:
                raise BackupError("BACKUP_TIMEOUT")

        def kill_children():
            for child in processes:
                if child.poll() is None:
                    try:
                        child.kill()
                    except OSError:
                        pass

        def expire():
            timed_out.set()
            kill_children()

        def discard_stderr(pipe):
            with pipe:
                while True:
                    block = pipe.read(8192)
                    if not block:
                        break
                    stderr_seen.set()

        try:
            flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0)
            descriptor = os.open(partial, flags, 0o600)
            owned_paths.append(partial)
            with os.fdopen(descriptor, "wb") as destination:
                dump = subprocess.Popen(exporter, env=env, stdin=subprocess.DEVNULL,
                                        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                processes.append(dump)
                dump_reader = threading.Thread(target=discard_stderr, args=(dump.stderr,), daemon=True)
                dump_reader.start()
                readers.append(dump_reader)
                try:
                    age = subprocess.Popen(encryptor, env=env, stdin=dump.stdout,
                                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    processes.append(age)
                finally:
                    dump.stdout.close()
                age_reader = threading.Thread(target=discard_stderr, args=(age.stderr,), daemon=True)
                age_reader.start()
                readers.append(age_reader)
                timer = threading.Timer(max(0, deadline - time.monotonic()), expire)
                timer.daemon = True
                timer.start()
                length = 0
                prefix = b""
                digest = hashlib.sha256()
                with age.stdout:
                    while True:
                        block = age.stdout.read(65536)
                        if not block:
                            break
                        length += len(block)
                        if length > max_bytes:
                            raise BackupError("ENCRYPTED_SIZE_LIMIT")
                        prefix = (prefix + block)[:len(AGE_HEADER)]
                        digest.update(block)
                        destination.write(block)
                for child in processes:
                    child.wait()
                for reader in readers:
                    reader.join()
                check_deadline()
                if dump.returncode != 0:
                    raise BackupError("DATABASE_EXPORT_FAILED")
                if age.returncode != 0:
                    raise BackupError("ENCRYPTION_FAILED")
                if stderr_seen.is_set():
                    raise BackupError("BACKUP_DIAGNOSTIC_REQUIRES_REVIEW")
                if prefix != AGE_HEADER or length <= len(AGE_HEADER):
                    raise BackupError("INVALID_ENCRYPTED_OUTPUT")
                destination.flush()
                os.fsync(destination.fileno())
                check_deadline()
            public_receipt = {
                "schemaVersion": 1, "state": "complete", "runId": run_id,
                "startedUtc": started.isoformat(), "completedUtc": utc_now().isoformat(),
                "encryptedBytes": length, "ciphertextSha256": digest.hexdigest(),
                "databaseToolMajor": 18, "encryptionTool": "age-1.3.2",
            }
            descriptor = os.open(receipt_partial, flags, 0o600)
            owned_paths.append(receipt_partial)
            with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
                json.dump(public_receipt, handle)
                handle.flush()
                os.fsync(handle.fileno())
            check_deadline()
            # Exclusive hard links publish complete files without replacing an
            # existing path; partial files never count as recovery points.
            os.link(partial, archive)
            owned_paths.append(archive)
            check_deadline()
            os.link(receipt_partial, receipt)
            owned_paths.append(receipt)
            partial.unlink()
            receipt_partial.unlink()
            sync_directory(directory)
            check_deadline()
            success = True
            return public_receipt
        except BackupError:
            raise
        except Exception:
            raise BackupError("BACKUP_IO_OR_TOOL_FAILURE") from None
        finally:
            if timer:
                timer.cancel()
            kill_children()
            for child in processes:
                child.wait()
            for reader in readers:
                reader.join()
            if not success:
                for path in reversed(owned_paths):
                    try:
                        path.unlink()
                    except FileNotFoundError:
                        pass


def live_commands(config_dir=Path("/config")):
    """Validate private libpq inputs without returning or logging their values."""
    require_private_path(config_dir, directory=True)
    service = require_private_path(config_dir / "pg_service.conf")
    passfile = require_private_path(config_dir / "pgpass")
    recipient = require_private_path(config_dir / "recipient.txt")
    # libpq preserves key whitespace/case at '='. ConfigParser normalizes it,
    # so validate the same original bytes before accepting the service file.
    service_text = service.read_text(encoding="utf-8")
    for raw_line in service_text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or line.startswith("["):
            continue
        key, separator, value = line.partition("=")
        if not separator or not re.fullmatch(r"[a-z_]+", key) or value != value.lstrip():
            raise BackupError("INVALID_DATABASE_SERVICE")
    parsed = configparser.ConfigParser(interpolation=None)
    parsed.read_string(service_text)
    if parsed.defaults() or parsed.sections() != ["backup"]:
        raise BackupError("INVALID_DATABASE_SERVICE")
    entry = parsed["backup"]
    allowed = {"host", "port", "dbname", "user", "sslmode", "sslrootcert", "channel_binding"}
    host = entry.get("host", "")
    if (set(entry) - allowed or not re.fullmatch(r"[a-z0-9][a-z0-9.-]*\.neon\.tech", host) or "-pooler" in host
            or any(not re.fullmatch(r"[A-Za-z0-9_][A-Za-z0-9_.-]{0,62}", entry.get(key, "")) for key in ("dbname", "user"))
            or not entry.get("port", "5432").isdigit() or not 0 < int(entry.get("port", "5432")) <= 65535
            or entry.get("sslmode") != "verify-full" or entry.get("sslrootcert") != "system"
            or entry.get("channel_binding") != "require"):
        raise BackupError("INVALID_DATABASE_SERVICE")
    if not re.fullmatch(r"age1[023456789acdefghjklmnpqrstuvwxyz]{58}", recipient.read_text().strip()):
        raise BackupError("INVALID_ENCRYPTION_RECIPIENT")
    for command, pattern in [(["pg_dump", "--version"], r"^pg_dump \(PostgreSQL\) 18\."),
                             (["age", "--version"], r"^v?1\.3\.2\s*$")]:
        result = subprocess.run(command, capture_output=True, text=True, timeout=10)
        if result.returncode or not re.search(pattern, result.stdout):
            raise BackupError("UNEXPECTED_TOOL_VERSION")
    # An invalid age recipient must fail before any database connection opens.
    result = subprocess.run(["age", "--encrypt", "-R", str(recipient)], input=b"",
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
    if result.returncode:
        raise BackupError("INVALID_ENCRYPTION_RECIPIENT")
    env = {key: os.environ[key] for key in ("PATH", "HOME", "LANG") if key in os.environ}
    env.update({"PGSERVICEFILE": str(service), "PGSERVICE": "backup", "PGPASSFILE": str(passfile),
                "PGCONNECT_TIMEOUT": "10", "PGAPPNAME": "atmoshaper_backup",
                "GOMAXPROCS": "1",
                "PGOPTIONS": "-c default_transaction_read_only=on -c statement_timeout=600000"})
    return (["pg_dump", "--format=custom", "--no-password", "--lock-wait-timeout=5000"],
            ["age", "--encrypt", "-R", str(recipient)], env)


def main(arguments):
    """Require an explicit execution flag; default use never opens a database."""
    if arguments in ([], ["plan"]):
        print(json.dumps({"state": "inert-plan", "scope": "shared hosted application database",
                          "timeoutSeconds": TIMEOUT_SECONDS, "maxEncryptedBytes": MAX_BYTES,
                          "schedulerInstalled": False, "pruningEnabled": False}))
        return 0
    if arguments != ["run", "--execute"]:
        print(json.dumps({"state": "failed", "code": "USE_PLAN_OR_RUN_EXECUTE"}))
        return 2
    try:
        exporter, encryptor, env = live_commands()
        print(json.dumps(run_backup(Path("/backups"), exporter, encryptor, env)))
        return 0
    except Exception as error:
        code = str(error) if isinstance(error, BackupError) else "BACKUP_PREFLIGHT_FAILED"
        print(json.dumps({"state": "failed", "code": code}))
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
