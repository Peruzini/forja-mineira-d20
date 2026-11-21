# Forja WordPress OAuth — REG-02B staging only

Experimental integration of GPL-2.0-or-later **wp-media/mcp-oauth v2.0** with the official **WordPress MCP Adapter**. The WordPress server owns OAuth tokens, user's capabilities, and execution. No Vercel-held WordPress password is required by this **direct WordPress** architecture.

**Do not install on production.** Default state has no live OAuth endpoints or callable abilities. To run in a disposable WordPress with WP >=6.9 and MCP Adapter installed:

1. Build vendor dependencies with Composer (`composer install --no-dev --prefer-dist`) and apply the reviewed CIMD compatibility patch (see `tools/patch-cimd.mjs`). Do not distribute an unpatched vendor tree as ChatGPT-ready.
2. Install as a standard WordPress plugin, then set `WP_ENVIRONMENT_TYPE=staging` / `local`; the hostname must not be the live Forja site.
3. Set `FWB_REG02B_OAUTH_STAGING=true` and `FWB_REG02B_CIMD_COMPAT_PATCHED=true` **only after** the patch and security tests pass.
4. Set `FWB_REG02B_CHATGPT_CIMD_URL` to the **exact metadata client ID supplied by OpenAI for the connection**, for example the stable `https://chatgpt.com/oauth/client.json` when officially applicable.
5. Connect the staging endpoint: `https://<staging-host>/wp-json/mcp/mcp-oauth-server`. Confirm discovery and login on a disposable account. The MCP Adapter's Basic-auth default server is deliberately disabled by this plugin.
6. Tool discovery should show three standard MCP Adapter meta-tools and three exposed abilities: `forja-bridge/list-posts`, `forja-bridge/get-post`, `forja-bridge/validate-draft` (names may appear under the adapter's standard execute tool).

No content changes are permitted by this addon. It is not a multi-tenant public gateway, and is **not** a substitute for the Vercel product architecture if the public ChatGPT directory requires a shared fixed endpoint. The upstream library is HS256; secrets remain within WordPress. It is **not compatible** with the separate Vercel RS256 resource server from REG-02; do not point that gateway at the local WordPress tokens.

License GPL-2.0-or-later, with upstream notices retained by Composer. Token formats and CIMD interpretation must be tested against a real ChatGPT connection before any release.
