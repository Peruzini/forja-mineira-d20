import { readCentralConfig, verifyCentralIdentity, makeOnboardingService } from './onboarding.mjs';
import { makeEditorialMcp } from '../reg02/secure-server.mjs';
import { createMcpHandler } from '@modelcontextprotocol/server';

export function centralMetadata(config) {
  return {resource:config.resource,authorization_servers:[config.issuer],
    scopes_supported:['posts:read']};
}

const failure=(status,code,challenge)=>Response.json({error:code},{status,headers:{
  'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
  ...(challenge?{'WWW-Authenticate':challenge}:{})
}});

export async function handleCentralMcp(request,{
  env=process.env,store,keys,fetcher=globalThis.fetch,now=Date.now()
}={}) {
  let config,service;
  try {
    config=readCentralConfig(env);
    if(!store) throw Error('durable datastore unavailable');
    service=makeOnboardingService({config,store,fetcher});
  } catch { return failure(503,'central_gateway_not_configured'); }
  let identity,binding;
  try {
    identity=await verifyCentralIdentity(request.headers.get('authorization'),config,
      {keys,fetcher,now,scope:'posts:read'});
    if(!identity.siteId) throw Error('missing site binding');
    binding=await service.resolve(identity,identity.siteId);
  } catch {
    return failure(401,'invalid_token','Bearer resource_metadata="' +
      new URL('/.well-known/oauth-protected-resource/api/gateway-mcp',config.resource).href+
      '", scope="posts:read"');
  }
  try {
    // Only this one authorized site's decrypted credentials reach the request handler.
    const handler=createMcpHandler(()=>makeEditorialMcp({
      identity,config:{...binding},fetcher
    }));
    return await handler.fetch(request);
  } catch {
    return failure(502,'central_gateway_dispatch_failed');
  }
}
