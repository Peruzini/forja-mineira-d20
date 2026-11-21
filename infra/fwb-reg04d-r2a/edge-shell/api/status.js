'use strict';
// Public infrastructure probe ONLY. Never reveals secrets, user, host or
// OAuth metadata. It is not evidence of a functional MCP or Keycloak service.
module.exports = function status(req,res) {
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    res.statusCode=405;
    return res.end(JSON.stringify({error:'method_not_allowed'}));
  }
  res.statusCode=200;
  return res.end(JSON.stringify({
    project:'fwb-reg04d-r2a',
    component:'isolated_https_shell',
    status:'SHELL_ONLY',
    oauth:'NOT_CONFIGURED',
    mcp:'DISABLED',
    production_wordpress:'NOT_CONNECTED'
  }));
};
