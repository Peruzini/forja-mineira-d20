import {createHash, createPrivateKey, sign} from 'node:crypto';
import * as z from 'zod/v4';

export const WRITE_SCOPE = 'drafts:write';
export const DRAFT_ROUTE = 'https://forjamineirad20.com.br/wp-json/forja-drafts/v1/create';
const signingContext = 'forja-draft-rsa-v1\n';

export const draftInput = z.object({
  title: z.string().min(1).max(180).refine(value => value === value.trim() && !/[<>\x00-\x1f\x7f]/u.test(value)),
  content: z.string().min(1).max(12000).refine(value => value.trim().length > 0 && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(value))
}).strict();

function draftBody({title, content}) {
  return JSON.stringify({title, content});
}

export function previewDraft(input) {
  return {...input, status: 'draft', approvalDigest: createHash('sha256').update(draftBody(input)).digest('hex')};
}

export function draftConfig(env, subjects) {
  if (env.FWB_ALT02_DRAFTS !== 'enabled') return null;
  const subject = env.FWB_ALT02_SUBJECT;
  const approvedDigest = env.FWB_ALT02_APPROVED_DIGEST;
  if (!subjects.includes(subject) || !env.FWB_ALT02_SIGNING_KEY ||
      typeof approvedDigest !== 'string' || !/^[a-f0-9]{64}$/u.test(approvedDigest)) {
    throw Error('forja_draft_config_invalid');
  }
  const key = createPrivateKey(env.FWB_ALT02_SIGNING_KEY);
  if (key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength !== 2048) {
    throw Error('forja_draft_config_invalid');
  }
  return Object.freeze({subject, key, approvedDigest});
}

export async function createDraft(input, {identity, config, fetcher}) {
  if (identity.sub !== config.subject || !identity.scopes.has(WRITE_SCOPE)) {
    throw Error('forja_draft_not_authorized');
  }
  const body = draftBody(input);
  if (createHash('sha256').update(body).digest('hex') !== config.approvedDigest) {
    throw Error('forja_draft_not_approved');
  }
  const signature = sign('RSA-SHA256', Buffer.from(signingContext + body), config.key).toString('base64');
  const response = await fetcher(DRAFT_ROUTE, {
    method: 'POST', headers: {'Content-Type': 'application/json', 'X-Forja-Draft-Signature': signature},
    body, signal: AbortSignal.timeout(8000)
  });
  if (response.status !== 201) throw Error('forja_draft_not_confirmed');
  const draft = await response.json();
  if (draft?.status !== 'draft' || !Number.isSafeInteger(draft.id) || draft.id < 1) {
    throw Error('forja_draft_not_confirmed');
  }
  const editUrl = new URL('/wp-admin/post.php', DRAFT_ROUTE);
  editUrl.search = new URLSearchParams({post: String(draft.id), action: 'edit'}).toString();
  return {id: draft.id, status: 'draft', editUrl: editUrl.href};
}
