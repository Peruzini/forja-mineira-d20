'use strict';
// Explicitly deny all MCP methods until Keycloak, WordPress and PostgreSQL
// staging have been separately deployed, verified and authorized.
// This path MUST NOT expose a mock OAuth discovery or fake capabilities.
module.exports = function denied(req,res){
  res.statusCode=503;
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  return res.end(JSON.stringify({error:'staging_mcp_disabled'}));
};
