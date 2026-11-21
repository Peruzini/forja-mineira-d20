import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const files='infra/fwb-reg04d-r2b2-ops/';
const compose=readFileSync(files+'compose.staging.yaml','utf8');
const caddy=readFileSync(files+'Caddyfile','utf8');

function service(name){
 const marker='\n  '+name+':\n';
 const start=compose.indexOf(marker);
 assert.ok(start>=0,'service '+name+' not declared');
 const rest=compose.slice(start+marker.length);
 const end=rest.search(/\n  [a-z][a-z0-9-]*:|\nnetworks:/);
 return end<0?rest:rest.slice(0,end);
}

test('only public auth ingress publishes host ports',()=>{
 const ingress=service('auth-ingress');
 assert.match(ingress,/ports:\n/);
 assert.match(ingress,/FWB_PUBLIC_BIND_IP/);
 for(const name of ['keycloak','keycloak-db','journal-db','admin-internal-probe']){
   assert.doesNotMatch(service(name),/^    ports:/m,name+' cannot publish a socket');
 }
 assert.doesNotMatch(compose,/network_mode:\s*host|privileged:\s*true|0\.0\.0\.0:8080|0\.0\.0\.0:5432/);
});
test('database and Keycloak are separated into internal Docker networks',()=>{
 assert.match(compose,/auth-restricted:\n    internal: true/);
 assert.match(compose,/admin-private:\n    internal: true/);
 assert.match(service('keycloak'),/admin-private/);
 assert.match(service('keycloak'),/auth-restricted/);
 assert.match(service('journal-db'),/admin-private/);
 assert.doesNotMatch(service('auth-ingress'),/admin-private/);
 assert.doesNotMatch(service('admin-internal-probe'),/^    ports:/m);
});
test('proxy only exposes one realm and static resources, never master/admin',()=>{
 assert.match(caddy,/@realm path \/realms\/\{\$FWB_REALM\}/);
 assert.match(caddy,/@themes path \/resources\/\*/);
 assert.match(caddy,/respond 404/);
 assert.doesNotMatch(caddy,/reverse_proxy\s+\*|\/admin\/\*|\/realms\/master\/\*|handle_path \/\*/);
 assert.equal((caddy.match(/reverse_proxy /g)||[]).length,2);
});
test('backend passwords and the administrative realm are not embedded in config',()=>{
 assert.match(compose,/FWB_KC_VAULT_ENV_PATH:\?/);
 assert.match(compose,/FWB_PG_KC_VAULT_ENV_PATH:\?/);
 assert.match(compose,/FWB_PG_JOURNAL_VAULT_ENV_PATH:\?/);
 assert.doesNotMatch(compose,/(KC_BOOTSTRAP_ADMIN_PASSWORD|KC_DB_PASSWORD|POSTGRES_PASSWORD):\s*[^#\n]+/);
 assert.doesNotMatch(compose,/fwb-onboarding.*secret|admin-cli|only-temporary-ci-admin/);
});
