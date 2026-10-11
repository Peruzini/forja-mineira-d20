#!/usr/bin/env python3
"""PERF-HOME-05: static safety checks. No WordPress or production writes."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
plugin = ROOT / "plugins" / "forja-mineira-builds"
full_css = (plugin / "assets/css/builds.css").read_text(encoding="utf-8")
home_css = (plugin / "assets/css/home.css").read_text(encoding="utf-8")
shortcodes = (plugin / "includes/class-build-shortcode.php").read_text(encoding="utf-8")
header = (plugin / "forja-mineira-builds.php").read_text(encoding="utf-8")
begin = "/* ===== HOME · ÚLTIMO DA FORJA ===== */"
end = "/* ===== HUB BUILDS v2.3.28 · PRODUÇÃO APROVADA ===== */"
assert full_css.count(begin) == 1 and full_css.count(end) == 1
expected = full_css[full_css.index(begin):full_css.index(end)]
assert home_css.endswith(expected), "Extracted Home CSS differs from original ordered rules"
assert "PERF-HOME-05" in home_css[:400], "Missing RC source marker"

def balanced(text):
    depth = 0
    in_comment = False
    quote = None
    escaped = False
    i = 0
    while i < len(text):
        ch = text[i]
        following = text[i+1] if i+1 < len(text) else ""
        if in_comment:
            if ch == "*" and following == "/":
                in_comment = False
                i += 2
                continue
        elif quote:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == quote:
                quote = None
        elif ch == "/" and following == "*":
            in_comment = True
            i += 2
            continue
        elif ch in ("'", '"'):
            quote = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            assert depth >= 0, "Unexpected closing CSS brace"
        i += 1
    assert depth == 0 and not in_comment and quote is None, "Unclosed CSS structure"

balanced(home_css)
for selector in [".fmb-home-hero", ".fmb-forja-now", ".fmb-build-cycle", ".fmb-cycle-vote", ".fmb-featured-guide"]:
    assert selector in home_css, f"Missing Home selector {selector}"
for name in ["render_home_featured_guide", "render_home_build_cycle", "render_home_next_build", "render_home_hero", "render_home_featured"]:
    start = shortcodes.index("public static function " + name + "(")
    next_start = shortcodes.find("\n    public static function ", start + 20)
    if next_start < 0:
        next_start = len(shortcodes)
    section = shortcodes[start:next_start]
    assert section.count("self::enqueue_assets( 'home' );") == 1, f"Home enqueue missing for {name}"
assert shortcodes.count("self::enqueue_assets();") == 1, "Build must use original stylesheet"
assert shortcodes.count("self::enqueue_assets( 'hub' );") == 1, "Hub must use dedicated stylesheet"
assert "'assets/css/home.css'" in shortcodes, "Missing Home CSS file reference"
assert "file_exists( $home_css )" in shortcodes, "Missing full CSS fallback"

hub_css = (plugin / "assets/css/hub.css").read_text(encoding="utf-8")
full_lines = full_css.splitlines(keepends=True)
assert len(full_lines) in (9156, 9157), 'Approved CSS line count drifted; check anchors'
assert "HUB DE BUILDS" in full_lines[5546] and "HOME" in full_lines[6033]
assert "HUB BUILDS v2.3.28" in full_lines[8838]
expected_hub = "".join(full_lines[5545:6033]) + "\n" + "".join(full_lines[8838:])
assert hub_css.endswith(expected_hub), "Hub CSS did not preserve both original blocks in order"
balanced(hub_css)
assert "file_exists( $hub_css )" in shortcodes, "Hub fallback missing"
assert "if ( $is_hub )" in shortcodes, "Hub-only JS skip missing"
for sel in (".fmb-hub", ".fmb-featured-build", ".fmb-build-grid", ".fmb-builds-continue"):
    assert sel in hub_css, "Hub class not present: " + sel

assert "Version: 2.3.30-rc.1" in header
assert "define( 'FMB_VERSION', '2.3.30-rc.1' )" in header
print("PASS — Home CSS is a byte-for-byte ordered extraction (aside from prefatory comment)")
print("PASS — CSS braces/comments/strings balanced and all five Home modules present")
print("PASS — five Home contexts, one Hub context, Build full CSS, fallback exists")
print("PASS — staging candidate version 2.3.30-rc.1")
