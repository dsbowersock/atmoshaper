"""Inspect only the built APK's declared core assets; no extraction or mutation."""
import hashlib
import json
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as archive:
    manifest = json.loads(archive.read("assets/bundle-proof.json"))
    for item in manifest["files"]:
        data = archive.read("assets/" + item["path"])
        if len(data) != item["bytes"] or hashlib.sha256(data).hexdigest() != item["sha256"]:
            raise ValueError("APK core asset does not match its build manifest")
    print(json.dumps(manifest))
