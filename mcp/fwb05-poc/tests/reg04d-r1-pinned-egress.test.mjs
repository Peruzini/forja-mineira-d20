import test from 'node:test';
import assert from 'node:assert/strict';
import {isGlobalRoutableIP,requirePublicAnswers,makeStrictEgressPolicy,
  makePinnedEgressFetcher} from '../reg04d-r1/pinned-egress.mjs';

const policy=makeStrictEgressPolicy({issuer:'https://auth.stage.example.org/realms/stage',
  wpHosts:['wp.stage.example.org']});
test('reject private, metadata, IP-mapped, documentation, multicast and ambiguous DNS',()=>{
 const blocked=['0.0.0.0','10.5.6.7','100.64.5.4','127.0.0.1',
  '169.254.169.254','172.21.5.7','192.168.10.1','192.0.2.5',
  '198.18.0.1','198.51.100.12','203.0.113.1','224.0.0.1','240.1.1.1',
  '::1','::','fe80::1','fc00::123','2001:db8::1','2002:c000:0201::1',
  '::ffff:127.0.0.1','::ffff:8.8.8.8'];
 blocked.forEach(ip=>assert.equal(isGlobalRoutableIP(ip),false,ip));
 assert.equal(isGlobalRoutableIP('8.8.8.8'),true);
 assert.equal(isGlobalRoutableIP('1.1.1.1'),true);
 assert.equal(isGlobalRoutableIP('2606:4700:4700::1111'),true);
 assert.throws(()=>requirePublicAnswers([{address:'8.8.8.8',family:4},
   {address:'127.0.0.1',family:4}]),/egress_nonpublic_dns_rejected/);
 assert.throws(()=>requirePublicAnswers([]));
 assert.deepEqual(requirePublicAnswers([{address:'8.8.8.8',family:4}]),
   {address:'8.8.8.8',family:4});
});
test('only pinned HTTPS issuer JWKS or explicitly configured WP REST routes, no redirects',()=>{
 const accepted=[
  'https://auth.stage.example.org/realms/stage/protocol/openid-connect/certs',
  'https://wp.stage.example.org/wp-json/wp/v2/users/me?context=edit',
  'https://wp.stage.example.org/wp-json/wp/v2/posts?context=edit&author=22&status=any&per_page=10',
  'https://wp.stage.example.org/wp-json/wp/v2/posts/17?context=edit'
 ];
 accepted.forEach(u=>assert.ok(policy.assertUrl(u)));
 const denied=[
   'http://wp.stage.example.org/wp-json/wp/v2/posts',
   'https://10.0.0.1/wp-json/wp/v2/posts',
   'https://wp.stage.example.org.evil.org/wp-json/wp/v2/posts',
   'https://wp.stage.example.org:8443/wp-json/wp/v2/posts',
   'https://wp.stage.example.org/wp-admin',
   'https://wp.stage.example.org/wp-json/wp/v2/users',
   'https://wp.stage.example.org/wp-json/wp/v2/users/me?context=view',
   'https://wp.stage.example.org/wp-json/wp/v2/posts?per_page=100',
   'https://auth.stage.example.org/admin/realms/stage/users',
   'https://auth.stage.example.org/realms/stage/protocol/openid-connect/token'
 ];
 denied.forEach(url=>assert.throws(()=>policy.assertUrl(url),undefined,url));
});
test('strict egress wrapper prohibits redirect follow and sets undici pinned dispatcher',async()=>{
 let called=0;
 const f=makePinnedEgressFetcher({policy,
   resolver:async()=>[{address:'8.8.8.8',family:4}],
   fetcher:async(url,opts)=>{
     called++;
     assert.equal(opts.redirect,'error');
     assert.ok(opts.dispatcher);
     assert.ok(url.startsWith('https://wp.stage.example.org/'));
     return {ok:true};
   }
 });
 try{
   await assert.rejects(()=>f.fetcher('https://attacker.example.org/'));
   await assert.rejects(()=>f.fetcher('https://wp.stage.example.org/wp-json/wp/v2/posts',{redirect:'follow'}));
   assert.equal((await f.fetcher('https://wp.stage.example.org/wp-json/wp/v2/posts',
     {method:'GET'})).ok,true);
   assert.equal(called,1);
 }finally{await f.close();}
});
