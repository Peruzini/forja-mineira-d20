#!/usr/bin/env python3
"""PERF-ITENS-13: read-only CDN diagnostics via normal public HTTPS GET requests.
Does not require WPVibe, WordPress admin, plugin code or credentials.
Uses exact published asset URL and no cache-busting query strings.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import pathlib
import platform
import re
import subprocess
import time

SITE = "https://forjamineirad20.com.br"
BASE = SITE + "/wp-content/plugins/forja-mineira-guia-itens-conjuradores/assets/"
TARGET = BASE + "hero-vaeros-mobile-960-v1.0.7.webp"
CONTROLS = {
    "control-css": BASE + "r6-perf.css?ver=1.0.7",
    "control-art": BASE + "guia-itens-hero-conjuradores-128.webp",
}
OUT = pathlib.Path(os.environ.get("PERF13_OUTPUT", "/tmp/perf13"))
OUT.mkdir(parents=True, exist_ok=True)
AGENT = (
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36"
)
FIELDS = (
    "server", "x-hcdn-cache-status", "x-hcdn-upstream-rt", "x-hcdn-request-id",
    "x-hcdn-pop", "cache-control", "age", "etag", "last-modified",
    "vary", "content-length", "content-type", "via", "cf-cache-status",
    "x-litespeed-cache", "x-cache", "x-hostinger-cache-status",
)

def parse_final_headers(data: str) -> dict:
    blocks = re.split(r"\r?\n\r?\n", data.strip())
    final = None
    for block in blocks:
        if block.startswith("HTTP/"):
            rows = block.splitlines()
            parsed = {}
            for line in rows[1:]:
                if ":" in line:
                    k, v = line.split(":", 1)
                    parsed[k.lower().strip()] = v.strip()
            final = {"statusLine": rows[0], **parsed}
    return final or {}

info = subprocess.check_output(["curl", "--version"], text=True)
print("CURL_VERSION", info.splitlines()[0], flush=True)
http2 = "HTTP2" in info
rows = []
started = dt.datetime.now(dt.timezone.utc).isoformat()
run_id = os.environ.get("GITHUB_RUN_ID")
for label, url in [("hero-1", TARGET), ("hero-2", TARGET), ("hero-3", TARGET)] + list(CONTROLS.items()):
    headers_path = OUT / (label + "-headers.txt")
    body_path = OUT / (label + "-body.tmp")
    cmd = [
        "curl", "--silent", "--show-error", "--location", "--compressed",
        "--max-time", "35", "--connect-timeout", "15",
        "--user-agent", AGENT,
        "--header", "Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "--dump-header", str(headers_path),
        "--output", str(body_path),
        "--write-out", "%{json}",
    ]
    if http2:
        cmd.append("--http2")
    cmd.append(url)
    completed = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45)
    if completed.returncode != 0:
        raise RuntimeError(f"{label}: curl exit={completed.returncode}: {completed.stderr[-800:]}")
    try:
        timing = json.loads(completed.stdout)
    except Exception:
        raise RuntimeError(f"{label}: curl write-out not JSON: {completed.stdout[:400]!r}")
    headers = parse_final_headers(headers_path.read_text(errors="replace"))
    body = body_path.read_bytes()
    digest = hashlib.sha256(body).hexdigest()
    row = {
        "label": label, "requestedUrl": url,
        "observedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "httpCode": timing.get("http_code"),
        "httpVersion": timing.get("http_version"),
        "remoteIp": timing.get("remote_ip"),
        "remotePort": timing.get("remote_port"),
        "numRedirects": timing.get("num_redirects"),
        "sizeDownload": timing.get("size_download"),
        "bodyBytes": len(body), "sha256": digest,
        "timeNameLookupMs": round(1000*timing.get("time_namelookup", 0), 3),
        "timeConnectMs": round(1000*timing.get("time_connect", 0), 3),
        "timeAppConnectMs": round(1000*timing.get("time_appconnect", 0), 3),
        "timeStartTransferMs": round(1000*timing.get("time_starttransfer", 0), 3),
        "timeTotalMs": round(1000*timing.get("time_total", 0), 3),
        "timeBodyAfterTtfbMs": round(
            1000 * (timing.get("time_total", 0)-timing.get("time_starttransfer",0)), 3
        ),
        "headerStatus": headers.get("statusLine"),
        "headers": {field: headers.get(field) for field in FIELDS},
        "webpSignatureValid": body[:4] == b"RIFF" and body[8:12] == b"WEBP"
        if url.lower().split("?")[0].endswith(".webp") else None,
    }
    rows.append(row)
    # Keep raw HTTP headers, JSON and SHA. Do not artifact raw body; it is already public.
    body_path.unlink(missing_ok=True)
    print("CDN_REQUEST", json.dumps(row, ensure_ascii=False), flush=True)
    if label in ("hero-1", "hero-2"):
        time.sleep(2.0)

image_rows = rows[:3]
fingerprints = {row["sha256"] for row in image_rows}
sizes = {row["bodyBytes"] for row in image_rows}
codes = {row["httpCode"] for row in image_rows}
edge_states = [row["headers"]["x-hcdn-cache-status"] for row in image_rows]
conclusions = {
    "allHero200": codes == {200},
    "sameHeroBytesAcrossGets": len(fingerprints) == 1 and len(sizes) == 1,
    "allWebpSignaturesValid": all(x["webpSignatureValid"] for x in image_rows),
    "edgeCacheStatusesInOrder": edge_states,
    "repeatHITObserved": any(x and x.upper() == "HIT" for x in edge_states[1:]),
    "repeatedMISSObserved": all(x and x.upper() == "MISS" for x in edge_states),
    "cdnCacheIssueConfirmed": False,
}
report = {
    "title": "PERF-ITENS-13 — CDN delivery, read-only public HTTP",
    "startedUtc": started,
    "finishedUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
    "githubRunId": run_id,
    "runner": platform.platform(),
    "curl": info.splitlines()[0],
    "http2Supported": http2,
    "networkMethod": "5 public GETs: three exact-URL hero fetches, CSS and small artwork controls; 2 seconds between hero GETs; no HEAD, no cache-busting, no forced cache-control; no WordPress plugin/admin access; requests may naturally populate the CDN cache",
    "limitation": "GitHub-hosted runner egress location may differ from Brazil; HTTP/2 curl measurements without Lighthouse mobile throttling are not comparable to browser HTTP/3 LCP or CrUX. A single edge and three sequential requests cannot diagnose all CDN POPs or user geography.",
    "requests": rows,
    "conclusions": conclusions,
}
(OUT / "summary.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print("PERF13_FINAL", json.dumps(conclusions, ensure_ascii=False), flush=True)
if not conclusions["allHero200"] or not conclusions["sameHeroBytesAcrossGets"] or not conclusions["allWebpSignaturesValid"]:
    raise RuntimeError("PERF13: public image integrity/status failed; inspect reports")
