# FWB-05E — ChatGPT Sites adapter (reference implementation)

This folder is an isolated, read-only implementation blueprint for a **future ChatGPT Sites-hosted MCP server**. It is **not yet deployed to Sites** and does **not** connect a plugin merely by being present in GitHub.

## Exposed actions for the Site builder

- \`forja_ping\`: no network, proves the Sites-to-ChatGPT plugin route.
- \`forja_wp_public_status\`: GET only \`https://forjamineirad20.com.br/wp-json/\`.
- \`forja_wp_auth_probe\`: GET only \`https://forjamineirad20.com.br/wp-json/wp/v2/users/me?context=view\`, with Basic authentication from the Site's server-side secrets \`FWB_WP_USERNAME\` and \`FWB_WP_APP_PASSWORD\`. No personal fields, credentials, or raw error messages are returned.

If credentials are absent, the authenticated probe fails closed and does not call WordPress. The \`fwb-read\` Subscriber account can be used for this **read-only** test. Do not elevate its permissions for FWB-05E.

## Important deployment distinction

This is a normal Node ESM module exposing JavaScript functions, **not** a registered MCP service and **not** the Site itself. The Sites builder must use it as reference to register three read-only MCP tools, implement/test them **inside the Sites runtime**, publish the private Site, and install/connect the **Site-generated plugin**.

Do not add these tools or Application Passwords to the existing publicly accessible Vercel demo. Do not put Site secrets in GitHub or chat. Do not create publishing/editing/admin tools in FWB-05E.

## Run offline reference tests

\`\`\`sh
node --test mcp/fwb05-site/tests/site-tools.test.mjs
\`\`\`

See \`docs/FWB-05E-CHATGPT-SITES-POC.md\` for the exact Site builder brief and acceptance gates.
