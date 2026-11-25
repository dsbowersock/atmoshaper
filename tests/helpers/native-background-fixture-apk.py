"""Repackage development APK code with isolated synthetic background assets."""
import json
import hashlib
import re
import sys
import zipfile
from pathlib import Path

source, replacement, destination = map(Path, sys.argv[1:])
proof = "assets/bundle-proof.json"
trust = re.compile(
    rb'\[{"id":"backgrounds-20261122-cbad752f","jwk":{"kty":"EC",'
    rb'"x":"[A-Za-z0-9_-]{43}","y":"[A-Za-z0-9_-]{43}","crv":"P-256"}}\]'
)
public_key = replacement.read_bytes()
assert len(json.loads(public_key)) == 1

with zipfile.ZipFile(source) as original, zipfile.ZipFile(destination, "x") as fixture:
    manifest = json.loads(original.read(proof))
    assert not manifest["syntheticReceiptAuthority"] and manifest["sharedWebsite"]
    manifest["syntheticReceiptAuthority"] = True
    index = {value["path"]: value for value in manifest["files"]}
    entries = {"core/app.js"}
    projected_layout = "core/background-access-export.js" in index
    if projected_layout:
        entries.update(("core/background-access-export.js", "core/clock-effect.js"))
    # Preserve both binaries' verifier code and replace exactly the compiled
    # public trust in each known verifier entry. Inventory hashes cover the result.
    for entry in entries:
        raw = original.read("assets/" + entry)
        assert len(trust.findall(raw)) == 1
    for info in original.infolist():
        name = info.filename
        signature = name.startswith("META-INF/") and name.upper().endswith((".RSA", ".DSA", ".EC", ".SF", "/MANIFEST.MF"))
        if signature or name == proof:
            continue
        raw = original.read(info)
        entry = name.removeprefix("assets/")
        if entry in entries:
            raw = trust.sub(lambda _: public_key, raw, count=1)
            index[entry].update(bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
        fixture.writestr(info, raw)
    fixture.writestr(proof, json.dumps(manifest), compress_type=zipfile.ZIP_DEFLATED)
