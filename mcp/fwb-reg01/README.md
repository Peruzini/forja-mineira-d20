# FWB-REG-01 — Public submission staging

**NOT a publication package and NOT an OAuth implementation.**

This directory implements a fail-closed, offline readiness gate for the existing FWB-05 PoC manifest. The current result MUST be \`BLOCKED\`; it deliberately prevents treating the anonymous ping/public-status transport PoC as a working WordPress administrator.

Run from repository root:

\`\`\`bash
node --test mcp/fwb-reg01/readiness.test.mjs
node mcp/fwb-reg01/readiness.mjs --assert-blocked
node mcp/fwb-reg01/readiness.mjs --release    # expected to exit 2 until all requirements are proven
\`\`\`

This does not upload, connect, submit, publish, deploy, request payment, touch WordPress, or use WPVibe. Review \`docs/FWB-REG-01-PUBLICACAO-OFICIAL.md\` first.
