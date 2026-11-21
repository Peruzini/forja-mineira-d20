import pg from 'pg';

// Persisted OAuth->WordPress bindings. No volatile Map in the deployed gateway.
// Migration is explicit, never run automatically from a serverless HTTP request.
const TABLE = 'fwb_site_connections';
const DDL = `CREATE TABLE IF NOT EXISTS fwb_site_connections (
 binding_key CHAR(64) PRIMARY KEY,
 envelope JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

function digestKey(key) {
  if(typeof key!=='string' || !/^[a-f0-9]{64}$/.test(key)) throw Error('invalid_binding_key');
  return key;
}
function envelope(value) {
  if(!value || typeof value!=='object' || value.version!==1 ||
    typeof value.iv!=='string' || typeof value.tag!=='string' || typeof value.data!=='string' ||
    value.iv.length>32 || value.tag.length>32 || value.data.length>8192) {
    throw Error('invalid_binding_envelope');
  }
  return value;
}
export class PostgresSiteStore {
  constructor(pool) {
    if(!pool?.query || !pool?.end) throw Error('postgres_pool_required');
    this.pool=pool;
  }
  async migrateForDisposableTest() {
    await this.pool.query(DDL);
  }
  async createIfAbsent(key, data) {
    digestKey(key); envelope(data);
    const r=await this.pool.query(
      `INSERT INTO ${TABLE} (binding_key,envelope) VALUES ($1,$2::jsonb)
       ON CONFLICT (binding_key) DO NOTHING RETURNING binding_key`,
      [key,JSON.stringify(data)]
    );
    return r.rowCount===1;
  }
  async get(key) {
    digestKey(key);
    const r=await this.pool.query(`SELECT envelope FROM ${TABLE} WHERE binding_key=$1`,[key]);
    return r.rows[0]?.envelope || null;
  }
  async delete(key) {
    digestKey(key);
    const r=await this.pool.query(`DELETE FROM ${TABLE} WHERE binding_key=$1`,[key]);
    return r.rowCount===1;
  }
  async close() { await this.pool.end(); }
}
export function createPostgresSiteStore(env=process.env) {
  if(env.FWB_REG04B_PG_STORAGE!=='enabled') throw Error('postgres_storage_disabled');
  const raw=env.FWB_REG04B_DATABASE_URL;
  let url;
  try{url=new URL(raw);}catch{throw Error('postgres_url_invalid');}
  if(!raw || !['postgres:','postgresql:'].includes(url.protocol) ||
    !url.hostname || !url.username || !url.password || url.hash || url.search ||
    url.pathname==='/' || url.pathname.length>128) throw Error('postgres_url_invalid');
  const testOnly=env.NODE_ENV==='test' && env.FWB_REG04B_INSECURE_DB_TEST_ONLY==='enabled'
    && ['localhost','127.0.0.1'].includes(url.hostname);
  if(!testOnly && (url.hostname==='localhost' || url.hostname==='127.0.0.1')) {
    throw Error('postgres_local_connection_prohibited');
  }
  const pool=new pg.Pool({
    connectionString:raw,
    ssl:testOnly?false:{rejectUnauthorized:true},
    max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:30000,
    application_name:'fwb-reg04b-staging-gateway'
  });
  return new PostgresSiteStore(pool);
}
let runtimeStore;
export function getRuntimePostgresStore(env=process.env) {
  if(!runtimeStore) runtimeStore=createPostgresSiteStore(env);
  return runtimeStore;
}
