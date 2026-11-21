#!/usr/bin/env node
// Stage-only fix: wp-media/mcp-oauth v2.0 ignores ChatGPT CIMD plural auth methods.
// Negotiate public method 'none' only if the document explicitly supports it.
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const files=[
 [resolve(root,'vendor/wp-media/mcp-oauth/inc/Auth/CimdResolver.php'),
  "$auth_method = isset( $doc['token_endpoint_auth_method'] ) ? (string) $doc['token_endpoint_auth_method'] : 'none';"],
 [resolve(root,'vendor/wp-media/mcp-oauth/inc/Auth/ClaudeClientVerifier.php'),
  "$auth_method = (string) ( $doc['token_endpoint_auth_method'] ?? 'none' );"]
];
const replacement=[
 "$supported_methods = isset( $doc['token_endpoint_auth_methods_supported'] ) && is_array( $doc['token_endpoint_auth_methods_supported'] )",
 "            ? $doc['token_endpoint_auth_methods_supported']",
 "            : [ isset( $doc['token_endpoint_auth_method'] ) ? (string) $doc['token_endpoint_auth_method'] : 'none' ];",
 "        $auth_method = in_array( 'none', $supported_methods, true ) ? 'none' : '';"
].join('\n');
for(const [file,from] of files){
 const content=readFileSync(file,'utf8');
 if(content.includes(replacement))continue;
 const count=content.split(from).length-1;
 if(count!==1)throw Error('PATCH_UNSUPPORTED_UPSTREAM_VERSION: '+file+' count='+count);
 writeFileSync(file,content.replace(from,replacement));
}
console.log('FWB_REG02B_CIMD_COMPATIBILITY_PATCH_APPLIED');
