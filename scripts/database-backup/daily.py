"""Bounded NAS job for an explicitly approved daily backup and Cron check-ins.

Default execution is inert. Private runtime inputs are provisioned separately;
this file never installs a schedule, creates a role, or holds a recovery key.
"""

import contextlib
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import uuid

import backup
import maintenance


DOCKER = "/usr/local/bin/docker"
DOCKER_ARGS = [DOCKER, "--host", "unix:///var/run/docker.sock"]
CONFIG_KEYS = {"schemaVersion", "root", "image", "uid", "gid", "backupScriptSha256", "checkinUrl"}
CHECKIN_URL = re.compile(r"https://o[0-9]+\.ingest(?:\.(?:us|de))?\.sentry\.io/api/[0-9]+/cron/[a-z0-9-]{1,64}/[0-9a-f]{32}/")


class DeadlineExpired(BaseException):
    """Escape broad library exception handlers when the NAS operation expires."""


@contextlib.contextmanager
def operation_deadline(seconds=1140):
    """Bound one phase without replacing another alarm; export reserves a minute."""
    if (not 0 < seconds <= 1140 or not hasattr(signal, "setitimer")
            or signal.getitimer(signal.ITIMER_REAL) != (0.0, 0.0)):
        raise backup.BackupError("DAILY_DEADLINE_UNAVAILABLE")
    previous = signal.getsignal(signal.SIGALRM)
    def expire(unused_signal, unused_frame):
        raise DeadlineExpired()
    signal.signal(signal.SIGALRM, expire)
    signal.setitimer(signal.ITIMER_REAL, seconds)
    try:
        yield
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, previous)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """Never forward a check-in's project key or operational data to a redirect."""

    def redirect_request(self, request, file, code, message, headers, new_url):
        raise backup.BackupError("MONITOR_REDIRECT_REJECTED")


def settings(path):
    """Read only the private, strictly shaped configuration for this owned root."""
    path = backup.require_private_path(Path(path))
    if path.stat().st_size > 8192:
        raise backup.BackupError("INVALID_DAILY_CONFIG")
    value = json.loads(path.read_text(encoding="utf-8"))
    if (set(value) != CONFIG_KEYS or type(value["schemaVersion"]) is not int or value["schemaVersion"] != 1
            or not re.fullmatch(r"sha256:[0-9a-f]{64}", value["image"])
            or not re.fullmatch(r"[0-9a-f]{64}", value["backupScriptSha256"])
            or not CHECKIN_URL.fullmatch(value["checkinUrl"])
            or type(value["uid"]) is not int or type(value["gid"]) is not int):
        raise backup.BackupError("INVALID_DAILY_CONFIG")
    root = Path(value["root"])
    if (not root.is_absolute() or root.resolve() != root or path.resolve() != root / "config/daily.json"
            or any(character in str(root) for character in [",", "\n", "\r", "\0"])):
        raise backup.BackupError("INVALID_DAILY_CONFIG")
    for directory in [root, root / "config", root / "backups", root / "operation", root / "build"]:
        backup.require_private_path(directory, directory=True)
    script = backup.require_private_path(root / "build/backup.py")
    helper = backup.require_private_path(Path(backup.__file__))
    if (hashlib.sha256(script.read_bytes()).hexdigest() != value["backupScriptSha256"]
            or hashlib.sha256(helper.read_bytes()).hexdigest() != value["backupScriptSha256"]):
        raise backup.BackupError("BACKUP_SCRIPT_CHANGED")
    if os.name != "posix" or value["uid"] != os.getuid() or value["gid"] != os.getgid():
        raise backup.BackupError("WRONG_DAILY_OPERATOR")
    return value


def check_in(url, status, check_id):
    """Send only the vendor's status/check-in fields, without proxies or retries."""
    if (not CHECKIN_URL.fullmatch(url) or status not in ["in_progress", "ok", "error"]
            or not re.fullmatch(r"[0-9a-f]{32}", check_id)):
        return False
    query = urllib.parse.urlencode({"status": status, "check_in_id": check_id, "environment": "production"})
    request = urllib.request.Request(url + "?" + query, headers={"User-Agent": "AtmoShaper-backup/1"})
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    try:
        with opener.open(request, timeout=10) as response:
            return 200 <= response.status < 300
    except Exception:
        return False


def command(config, run_id):
    """Use the already tested image/script with private readonly libpq mounts."""
    root = Path(config["root"])
    return DOCKER_ARGS + ["run", "--rm", "--pull", "never", "--name", "atmoshaper-backup-" + run_id,
            "--label", "atmoshaper.backup.run=" + run_id, "--log-driver", "none",
            "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true",
            "--memory", "256m", "--memory-swap", "256m",
            "--user", "{}:{}".format(config["uid"], config["gid"]),
            "--tmpfs", "/tmp:rw,size=16m,mode=1777",
            "--tmpfs", "/var/lib/postgresql:rw,size=1m,mode=0700",
            "--mount", "type=bind,source=" + str(root / "config") + ",target=/config,readonly",
            "--mount", "type=bind,source=" + str(root / "build/backup.py") + ",target=/app/backup.py,readonly",
            "--mount", "type=bind,source=" + str(root / "backups") + ",target=/backups",
            config["image"], "run", "--execute"]


def cleanup_timed_out(config, run_id, env):
    """Stop only the exact labelled/image-matched container this attempt created."""
    name = "atmoshaper-backup-" + run_id
    template = '{{.Id}} {{.Image}} {{index .Config.Labels "atmoshaper.backup.run"}}'
    try:
        result = subprocess.run(DOCKER_ARGS + ["inspect", "--format", template, name],
                                capture_output=True, text=True, env=env, timeout=10)
        parts = result.stdout.strip().split()
        if (result.returncode or len(parts) != 3 or not re.fullmatch(r"[0-9a-f]{64}", parts[0])
                or parts[1] != config["image"] or parts[2] != run_id):
            return False
        removed = subprocess.run(DOCKER_ARGS + ["rm", "--force", parts[0]], capture_output=True, env=env, timeout=15)
        return removed.returncode == 0
    except Exception:
        return False


def private_json(path, value):
    """Publish a non-replacing, owner-only operational record, never tool stderr."""
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0)
    with os.fdopen(os.open(path, flags, 0o600), "w", encoding="utf-8") as handle:
        json.dump(value, handle)
        handle.flush()
        os.fsync(handle.fileno())
    backup.sync_directory(path.parent)


def execute(config, now_fn=backup.utc_now, notify=check_in):
    """One attempt/day; a failed or ambiguous run cannot trigger an auto-retry."""
    root = Path(config["root"])
    with backup.exclusive_lock(root / "operation"):
        started = now_fn()
        day = started.strftime("%Y%m%d")
        run_id = uuid.uuid4().hex
        marker = root / "operation" / ("daily-" + day + ".attempt.json")
        if marker.exists():
            raise backup.BackupError("DAILY_ATTEMPT_ALREADY_EXISTS")
        private_json(marker, {"startedUtc": started.isoformat(), "attempts": 1})
        env = {key: os.environ[key] for key in ("PATH", "HOME", "LANG") if key in os.environ}
        tick = time.monotonic()
        monitored = False
        result = {"state": "failed", "code": "DAILY_OPERATION_FAILED"}
        try:
            with operation_deadline():
                monitored = notify(config["checkinUrl"], "in_progress", run_id)
                if shutil.disk_usage(root / "backups").free < 1024 * 1024 * 1024:
                    raise backup.BackupError("BACKUP_STORAGE_HEADROOM_LOW")
                image = subprocess.run(DOCKER_ARGS + ["image", "inspect", "--format", "{{.Id}}", config["image"]],
                                       capture_output=True, text=True, env=env, timeout=10)
                if image.returncode or image.stdout.strip() != config["image"]:
                    raise backup.BackupError("TESTED_IMAGE_NOT_AVAILABLE")
                exported = subprocess.run(command(config, run_id), capture_output=True, text=True, env=env, timeout=930)
                if exported.returncode or exported.stderr.strip() or len(exported.stdout) > 8192:
                    raise backup.BackupError("DAILY_EXPORT_FAILED")
                receipt = json.loads(exported.stdout)
                if receipt.get("state") != "complete" or not re.fullmatch(r"[0-9a-f]{32}", receipt.get("runId", "")):
                    raise backup.BackupError("DAILY_EXPORT_FAILED")
                retention = maintenance.retention_after_success(root / "backups", receipt["runId"], started,
                                                                  now_fn(), execute=monitored)
                result = {"state": "complete" if monitored else "failed",
                          "code": "OK" if monitored else "MONITOR_START_FAILED", "retention": retention}
        except DeadlineExpired:
            result = {"state": "failed", "code": "DAILY_OPERATION_TIMEOUT",
                      "ownedContainerCleanupConfirmed": cleanup_timed_out(config, run_id, env)}
        except subprocess.TimeoutExpired:
            result = {"state": "failed", "code": "DAILY_EXPORT_TIMEOUT",
                      "ownedContainerCleanupConfirmed": cleanup_timed_out(config, run_id, env)}
        except backup.BackupError as error:
            result = {"state": "failed", "code": str(error)}
        except Exception:
            result = {"state": "failed", "code": "DAILY_OPERATION_FAILED"}
        delivered = False
        try:
            # Socket timeouts do not bound a slow trickle response. Preserve a
            # wall-clock reporting budget and five seconds for the local receipt.
            remaining = 1200 - (time.monotonic() - tick) - 5
            if remaining > 0:
                with operation_deadline(min(30, remaining)):
                    delivered = notify(config["checkinUrl"], "ok" if result["state"] == "complete" else "error", run_id) is True
        except (DeadlineExpired, Exception):
            delivered = False
        result["monitoringDelivered"] = delivered
        if not delivered:
            result["monitoringFailureCode"] = "MONITOR_COMPLETION_FAILED"
            if result["state"] == "complete":
                result.update({"state": "failed", "code": "MONITOR_COMPLETION_FAILED"})
        result["elapsedSeconds"] = round(time.monotonic() - tick, 3)
        private_json(root / "operation" / ("daily-" + day + ".result.json"), result)
        return result


def main(arguments):
    """Require an explicit run/config packet; never contact NAS or Sentry by default."""
    if arguments in ([], ["plan"]):
        print(json.dumps({"state": "inert-plan", "schedulerInstalled": False,
                          "dailyAttempts": 1, "exportTimeoutSeconds": 900,
                          "retentionDays": 7, "minimumSuccessfulCopies": 7,
                          "monitoringData": "status and random check-in identifier only"}))
        return 0
    try:
        if len(arguments) != 4 or arguments[:3] != ["run", "--execute", "--config"]:
            raise backup.BackupError("USE_PLAN_OR_EXPLICIT_DAILY_CONFIG")
        result = execute(settings(arguments[3]))
        print(json.dumps(result))
        return 0 if result["state"] == "complete" else 1
    except Exception as error:
        print(json.dumps({"state": "failed", "code": str(error) if isinstance(error, backup.BackupError) else "DAILY_PREFLIGHT_FAILED"}))
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
