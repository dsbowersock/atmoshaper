"""Repackage development APK code with isolated synthetic background assets."""
import json
import hashlib
import re
import sys
import zipfile
from pathlib import Path

source, replacement, destination = map(Path, sys.argv[1:])
proof = "assets/bundle-proof.json"
earlier_entry = "assets/core/app.js"
earlier_trust = re.compile(
    rb'\[{"id":"backgrounds-20261122-cbad752f","jwk":{"kty":"EC",'
    rb'"x":"[A-Za-z0-9_-]{43}","y":"[A-Za-z0-9_-]{43}","crv":"P-256"}}\]'
)

with zipfile.ZipFile(source) as original, zipfile.ZipFile(destination, "x") as fixture:
    old_manifest = json.loads(original.read(proof))
    assert not old_manifest["syntheticReceiptAuthority"] and old_manifest["sharedWebsite"]
    replace_earlier_key = replacement.is_file()
    if replace_earlier_key:
        # Preserve the pinned predecessor's application and verifier code.
        # Substitute only its bundled public trust in the isolated fixture.
        public_key = replacement.read_bytes()
        assert len(json.loads(public_key)) == 1
        earlier_app = original.read(earlier_entry)
        assert len(earlier_trust.findall(earlier_app)) == 1
        earlier_app = earlier_trust.sub(lambda _: public_key, earlier_app, count=1)
        manifest = old_manifest
        manifest["syntheticReceiptAuthority"] = True
        entry = next(value for value in manifest["files"] if value["path"] == "core/app.js")
        entry.update(bytes=len(earlier_app), sha256=hashlib.sha256(earlier_app).hexdigest())
    else:
        manifest_path = replacement / "bundle-proof.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        assert manifest["syntheticReceiptAuthority"] and manifest["sharedWebsite"]
    for info in original.infolist():
        name = info.filename
        signature = name.startswith("META-INF/") and name.upper().endswith((".RSA", ".DSA", ".EC", ".SF", "/MANIFEST.MF"))
        if signature or name == proof or (not replace_earlier_key and name.startswith("assets/core/")):
            continue
        fixture.writestr(info, earlier_app if replace_earlier_key and name == earlier_entry else original.read(info))
    fixture.writestr(proof, json.dumps(manifest), compress_type=zipfile.ZIP_DEFLATED)
    if not replace_earlier_key:
        for entry in manifest["files"]:
            fixture.write(replacement / entry["path"], "assets/" + entry["path"], compress_type=zipfile.ZIP_DEFLATED)
