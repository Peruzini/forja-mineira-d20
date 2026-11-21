'use strict';
// SPELL-06E: static preview generated from unchanged template and original CSS/JS.
// Only WordPress guard and dynamic cluster slot are omitted; no spell data rewritten.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const rel='plugins/forja-mineira-guia-magias/';
const template=fs.readFileSync(path.join(root,rel,'templates/guide-spells.php'),'utf8');
const chunks=[...template.matchAll(/<\?php[\s\S]*?\?>/g)];
if(chunks.length!==2 || !chunks[0][0].includes("defined( 'ABSPATH' )") ||
  !chunks[1][0].includes("do_action( 'forja_d20_cluster_slot'"))
  throw new Error('PHP template mudou: prévia estática bloqueada');
let markup=template.replace(chunks[0][0],'').replace(chunks[1][0],
  '<!-- SLOT de clusters: executado apenas pelo WordPress; omitido nesta prévia. -->');
if(markup.includes('<?php') || !markup.includes('id="fmmg-spellList"'))
  throw new Error('HTML gerado inválido');
const html='<!doctype html>\n<html lang="pt-BR"><head>\n'+
  '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n'+
  '<meta name="robots" content="noindex,nofollow">\n'+
  '<title>Forja Mineira D20 — SPELL-06E | Preview isolado do Guia</title>\n'+
  '<style>html,body{margin:0;min-height:100%;background:#f5f0e6}.spell06e-banner{padding:9px 18px;background:#112b26;color:#f9f1dd;font:600 12px/1.5 system-ui;text-align:center}.spell06e-banner strong{color:#e2c687}</style>\n'+
  '<link rel="stylesheet" href="../../plugins/forja-mineira-guia-magias/assets/css/guide-spells.css">\n'+
  '</head><body>\n'+
  '<div class="spell06e-banner"><strong>PRÉVIA ISOLADA — SPELL-06E</strong> · HTML/CSS/JS originais do Guia · Sem WordPress · Não publicado</div>\n'+
  markup+
  '\n<script src="../../plugins/forja-mineira-guia-magias/assets/js/guide-spells.js"></script>\n'+
  '</body></html>\n';
const target=path.join(__dirname,'index.html');
if(process.argv.includes('--verify')){
 const current=fs.readFileSync(target,'utf8');
 if(current!==html)throw new Error('index.html divergiu do template: execute node qa/spell-06e/build-static.cjs');
 console.log('SPELL-06E PREVIEW_REPRODUCIBLE SHA256 '+crypto.createHash('sha256').update(html).digest('hex'));
}else{
 fs.writeFileSync(target,html);
 console.log('SPELL-06E preview generated: '+target);
}
