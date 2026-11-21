import { requireScope } from './auth.mjs';

export class EditorialFailure extends Error {
  constructor(code) { super(code); this.code = code; this.name = 'EditorialFailure'; }
}
function requirePositiveId(id) {
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) throw new EditorialFailure('invalid_post_id');
  return id;
}
function requireOpId(op) {
  if (typeof op !== 'string' || !/^[A-Za-z0-9_-]{12,80}$/.test(op)) {
    throw new EditorialFailure('invalid_operation_id');
  }
  return op;
}
function cleanDraft(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new EditorialFailure('invalid_draft');
  const obj = {};
  for (const name of ['title','content','excerpt','slug']) {
    if (Object.prototype.hasOwnProperty.call(data,name)) {
      const str = data[name];
      if (typeof str !== 'string' || str.length > (name === 'content' ? 80000 : 5000)) {
        throw new EditorialFailure('invalid_draft_' + name);
      }
      obj[name] = str;
    }
  }
  if (Object.keys(obj).length === 0) throw new EditorialFailure('empty_draft');
  return obj;
}
function summary(item) {
  if (!item || !Number.isSafeInteger(item.id) || item.id <= 0) {
    throw new EditorialFailure('upstream_invalid_data');
  }
  const val = (field) => typeof field === 'string' ? field.slice(0,40000) : '';
  return {
    id:item.id,
    status:val(item.status),
    slug:val(item.slug),
    title:val(item.title?.raw ?? item.title?.rendered ?? item.title),
    excerpt:val(item.excerpt?.raw ?? item.excerpt?.rendered ?? item.excerpt),
    modified_gmt:val(item.modified_gmt),
    link:val(item.link)
  };
}
export function makeEditorial({identity,config,fetcher=globalThis.fetch}) {
  async function call(method,path,{body,operationId}={}) {
    const headers = {
      Accept:'application/json',
      Authorization:'Basic '+Buffer.from(config.wpUser+':'+config.wpPassword,'utf8').toString('base64')
    };
    if (body !== undefined) headers['Content-Type']='application/json';
    if (operationId !== undefined) headers['X-FWB-Idempotency-Key']=requireOpId(operationId);
    const url = config.wpBase + '/wp-json/' + path;
    let response;
    try {
      response=await fetcher(url,{
        method,headers,redirect:'error',signal:AbortSignal.timeout(8000),
        ...(body === undefined ? {} : {body:JSON.stringify(body)})
      });
    } catch { throw new EditorialFailure('wordpress_unreachable'); }
    if (!response.ok) throw new EditorialFailure('wordpress_rejected_'+response.status);
    let data;
    try {
      const text=await response.text();
      if (text.length > 300000) throw Error('large');
      data=JSON.parse(text);
    } catch { throw new EditorialFailure('wordpress_invalid_response'); }
    return data;
  }
  async function listPosts(limit=5) {
    requireScope(identity,'posts:read');
    if (!Number.isInteger(limit) || limit<1 || limit>20) throw new EditorialFailure('invalid_limit');
    const params=new URLSearchParams({
      context:'edit',per_page:String(limit),
      _fields:'id,slug,status,link,title,excerpt,modified_gmt'
    });
    const result=await call('GET','wp/v2/posts?'+params.toString());
    if (!Array.isArray(result)) throw new EditorialFailure('wordpress_invalid_response');
    return {site:'staging',count:result.length,posts:result.map(summary)};
  }
  async function getPost(id) {
    requireScope(identity,'posts:read');
    const result=await call('GET','wp/v2/posts/'+requirePositiveId(id)+'?context=edit');
    return {site:'staging',post:{...summary(result),
      content:typeof result.content?.raw==='string'?result.content.raw.slice(0,80000):''}};
  }
  async function validateDraft(draft) {
    requireScope(identity,'posts:read');
    const fields=cleanDraft(draft);
    const result=await call('POST','forja-bridge/v1/drafts/validate',{body:{...fields,dry_run:true}});
    if (result?.valid!==true || result?.dry_run!==true) throw new EditorialFailure('wordpress_validation_failed');
    return {site:'staging',valid:true,dry_run:true,would_change:result.would_change||[]};
  }
  async function createDraft(draft,operationId) {
    requireScope(identity,'drafts:write');
    if (!config.enableWrites) throw new EditorialFailure('staging_writes_disabled');
    const fields=cleanDraft(draft);
    const idempotency=requireOpId(operationId);
    const created=await call('POST','forja-bridge/v1/drafts',{
      body:{...fields,dry_run:false},operationId:idempotency
    });
    if (!Number.isSafeInteger(created?.id) || created.status!=='draft') {
      throw new EditorialFailure('uncertain_write_verify_manually');
    }
    // If this verification fails, the write might have succeeded; NEVER retry blindly.
    let confirmed;
    try { confirmed=await call('GET','forja-bridge/v1/drafts/'+created.id); }
    catch { throw new EditorialFailure('uncertain_write_verify_manually'); }
    if (confirmed?.id!==created.id || confirmed?.status!=='draft') {
      throw new EditorialFailure('uncertain_write_verify_manually');
    }
    return {site:'staging',id:created.id,status:'draft',verified:true,replayed:created.replayed===true};
  }
  async function updateDraft(id,changes,expectedModifiedGmt,operationId) {
    requireScope(identity,'drafts:write');
    if (!config.enableWrites) throw new EditorialFailure('staging_writes_disabled');
    const postId=requirePositiveId(id);
    const fields=cleanDraft(changes);
    if (typeof expectedModifiedGmt!=='string'
      || !/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(expectedModifiedGmt)) {
      throw new EditorialFailure('expected_version_required');
    }
    const idem=requireOpId(operationId);
    const result=await call('POST','forja-bridge/v1/drafts/'+postId,{
      body:{...fields,dry_run:false,expected_modified_gmt:expectedModifiedGmt},operationId:idem
    });
    if (result?.id!==postId || result?.status!=='draft') {
      throw new EditorialFailure('uncertain_write_verify_manually');
    }
    let confirmed;
    try { confirmed=await call('GET','forja-bridge/v1/drafts/'+postId); }
    catch { throw new EditorialFailure('uncertain_write_verify_manually'); }
    if (confirmed?.id!==postId || confirmed?.status!=='draft') {
      throw new EditorialFailure('uncertain_write_verify_manually');
    }
    return {site:'staging',id:postId,status:'draft',verified:true,replayed:result.replayed===true};
  }
  return { listPosts,getPost,validateDraft,createDraft,updateDraft };
}
