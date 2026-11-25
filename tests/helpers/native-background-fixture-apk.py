"""Repackage development APK code with isolated synthetic background assets."""
import json
import sys
import zipfile
from pathlib import Path

source, assets, destination = map(Path, sys.argv[1:])
manifest_path = assets / "bundle-proof.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
assert manifest["syntheticReceiptAuthority"] and manifest["sharedWebsite"]

with zipfile.ZipFile(source) as original, zipfile.ZipFile(destination, "x") as fixture:
    old_manifest = json.loads(original.read("assets/bundle-proof.json"))
    assert not old_manifest["syntheticReceiptAuthority"] and old_manifest["sharedWebsite"]
    for info in original.infolist():
        name = info.filename
        signature = name.startswith("META-INF/") and name.upper().endswith((".RSA", ".DSA", ".EC", ".SF", "/MANIFEST.MF"))
        if signature or name.startswith("assets/core/") or name == "assets/bundle-proof.json":
            continue
        fixture.writestr(info, original.read(info))
    fixture.write(manifest_path, "assets/bundle-proof.json", compress_type=zipfile.ZIP_DEFLATED)
    for entry in manifest["files"]:
        fixture.write(assets / entry["path"], "assets/" + entry["path"], compress_type=zipfile.ZIP_DEFLATED)
