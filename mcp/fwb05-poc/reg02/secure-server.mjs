import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { readConfig, verifyAccessToken, unauthorized, AccessDenied } from './auth.mjs';
import { makeEditorial } from './editorial.mjs';

function success(data) {
  return { structuredContent:data, content:[{type:'text',text:JSON.stringify(data)}] };
}
async function safe(operation) {
  try { return success(await operation()); }
  catch (e) {
    // Never expose upstream HTTP bodies, passwords, JWTs, or OAuth claims.
    const allowed = e?.name==='EditorialFailure' || e instanceof AccessDenied;
    return {isError:true,content:[{type:'text',text:allowed?e.code:'editorial_operation_failed'}]};
  }
}
const draftFields = {
  title:z.string().max(5000).optional(),
  content:z.string().max(80000).optional(),
  excerpt:z.string().max(5000).optional(),
  slug:z.string().max(5000).optional()
};
const opId = z.string().regex(/^[A-Za-z0-9_-]{12,80}$/);
function register(mcp,name,description,inputSchema,run,write=false) {
  mcp.registerTool(name,{
    title:description,description,inputSchema,
    annotations:{readOnlyHint:!write,destructiveHint:false,idempotentHint:write?true:true,openWorldHint:true}
  }, async (data)=>safe(()=>run(data)));
}
export function makeEditorialMcp({identity,config,fetcher=globalThis.fetch}) {
  const mcp = new McpServer({name:'forja-wp-bridge-editorial-staging',version:'0.2.0'});
  const api = makeEditorial({identity,config,fetcher});
  register(mcp,'forja_posts_list','Listar posts do WordPress de homologação autorizado.',
    z.object({limit:z.number().int().min(1).max(20).default(5)}),
    ({limit})=>api.listPosts(limit));
  register(mcp,'forja_post_get','Consultar conteúdo de um post por ID no WordPress de homologação.',
    z.object({id:z.number().int().positive()}),({id})=>api.getPost(id));
  register(mcp,'forja_draft_validate','Validar um rascunho sem gravar no WordPress de homologação.',
    z.object(draftFields),data=>api.validateDraft(data));
  register(mcp,'forja_draft_create','Criar somente rascunho no staging, com operação idempotente e confirmação.',
    z.object({...draftFields,operation_id:opId}),
    ({operation_id,...data})=>api.createDraft(data,operation_id),true);
  register(mcp,'forja_draft_update','Editar somente rascunho no staging, usando versão e idempotência.',
    z.object({...draftFields,id:z.number().int().positive(),operation_id:opId,
      expected_modified_gmt:z.string().regex(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/)}),
    ({id,operation_id,expected_modified_gmt,...data})=>
      api.updateDraft(id,data,expected_modified_gmt,operation_id),true);
  return mcp;
}
export async function handleSecureMcp(request, {
  env=process.env,fetcher=globalThis.fetch,keys,now=Date.now()
}={}) {
  let config;
  try { config=readConfig(env); }
  catch {
    return new Response(JSON.stringify({error:'secure_mcp_not_configured'}),{
      status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
    });
  }
  let identity;
  try {
    identity=await verifyAccessToken(request.headers.get('authorization'),config,
      {fetcher,keys,now});
  } catch (error) {
    return unauthorized(config,error instanceof AccessDenied?error.code:'invalid_token');
  }
  const handler=createMcpHandler(()=>makeEditorialMcp({identity,config,fetcher}));
  try { return await handler.fetch(request); }
  catch {
    return new Response(JSON.stringify({error:'mcp_dispatch_failed'}),{
      status:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
    });
  }
}
