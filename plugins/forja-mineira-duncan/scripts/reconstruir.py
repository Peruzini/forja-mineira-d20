#!/usr/bin/env python3
"""Reconstroi os dois arquivos maiores do plugin Duncan v0.1.12.

A fragmentacao ocorre apenas por limite operacional de envio ao GitHub.
Os arquivos finais devem coincidir byte a byte com os incluidos no ZIP
homologado no Drive; qualquer divergencia aborta o processo.
"""
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[1]
sources = {'assets/css/duncan.css': {'sha256': 'be0e87e13d8c40292f9359307dc7746a9fde175f8951a906bbc7d5e6b88ac5d2', 'bytes': 3798213, 'parts': ['assets_css_duncan_css.part00', 'assets_css_duncan_css.part01', 'assets_css_duncan_css.part02', 'assets_css_duncan_css.part03']}, 'templates/duncan.html': {'sha256': 'bb1f480f1817e6af17e1082beba5e4658138244178e30d634ca0681d7dd536ac', 'bytes': 4058529, 'parts': ['templates_duncan_html.part00', 'templates_duncan_html.part01', 'templates_duncan_html.part02', 'templates_duncan_html.part03', 'templates_duncan_html.part04']}}

for relative, info in sources.items():
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    content = b"".join((root / "source-parts" / name).read_bytes() for name in info["parts"])
    actual = hashlib.sha256(content).hexdigest()
    if len(content) != info["bytes"] or actual != info["sha256"]:
        raise SystemExit(f"Integridade invalida: {relative}: {actual}")
    target.write_bytes(content)
    print(f"RECONSTRUIDO {relative} | bytes={len(content)} | sha256={actual}")
