#!/usr/bin/env python3
"""Reconstitui de forma determinística o ZIP exato do plugin 1.0.7.
Lê os 44 arquivos preservados no GitHub; valida hashes individuais;
só aceita o arquivo final se SHA-256 e tamanho coincidirem com o pacote da Biblioteca.
Não acessa nem altera o WordPress.
"""
import hashlib
import json
import pathlib
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/plugins/itens-conjuradores-v1.0.7-file-manifest.json"
OUTPUT = ROOT / "releases/forja-mineira-guia-itens-conjuradores-v1.0.7-CANDIDATA.zip"
PROOF = ROOT / "docs/plugins/itens-conjuradores-v1.0.7-zip-verified.json"

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def main() -> None:
    m = json.loads(MANIFEST.read_text(encoding="utf-8"))
    members = m["zip_entry_order_and_integrity"]
    assert len(members) == 44
    assert members[-1]["path"].endswith("/assets/hero-vaeros-mobile-960-v1.0.7.webp")
    source_root = (ROOT / "plugins/forja-mineira-guia-itens-conjuradores").resolve()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT, "w") as archive:
        for j, f in enumerate(members):
            assert j == f["i"], f
            fullpath = (ROOT / "plugins" / f["path"]).resolve()
            if not fullpath.is_relative_to(source_root):
                raise RuntimeError("Unsafe member path: "+f["path"])
            data = fullpath.read_bytes()
            if len(data) != f["size_bytes"] or digest(data) != f["sha256"]:
                raise RuntimeError("Source integrity mismatch: "+f["path"])
            d = (2026, 11, 12, 15, 58, 26) if j == 43 else (2026, 11, 7, 2, 14, 16)
            info = zipfile.ZipInfo(f["path"], d)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0x01800000 if j == 43 else 0x81A40000
            archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED)
    zip_data = OUTPUT.read_bytes()
    actual_hash = digest(zip_data)
    if actual_hash != m["original_zip_sha256"] or len(zip_data) != m["original_zip_bytes"]:
        OUTPUT.unlink(missing_ok=True)
        raise RuntimeError("FAIL: ZIP differs from original Library package (sha="+actual_hash+")")
    with zipfile.ZipFile(OUTPUT) as archive:
        if archive.testzip() is not None:
            raise RuntimeError("ZIP CRC validation failed")
        assert archive.namelist() == [f["path"] for f in members]
    result = {
        "status":"EXACT_MATCH",
        "version":"1.0.7",
        "original_zip_name":m["original_zip_name"],
        "snapshot_file":str(OUTPUT.relative_to(ROOT)),
        "sha256":actual_hash,
        "bytes":len(zip_data),
        "members_verified":len(members),
        "all_member_sha256_verified":True,
        "site_modified":False,
    }
    PROOF.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("ZIP_EXACT_MATCH",json.dumps(result,ensure_ascii=False),flush=True)

if __name__ == "__main__":
    main()
