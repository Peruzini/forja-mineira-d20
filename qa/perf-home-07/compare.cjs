#!/usr/bin/env node
/*
 * PERF-HOME-07 — visual regression on the isolated Home preview.
 * Tests the same DOM and same repository images with the approved CSS and candidate CSS.
 * Production WordPress and site security protections are not accessed or modified.
 * This is NOT a substitute for end-to-end staging WordPress.
 */
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {PNG}=require('/tmp/forja-perf-home-07/node_modules/pngjs');
const puppeteer=require('/tmp/forja-perf-home-07/node_modules/puppeteer-core');
const ROOT=path.resolve(__dirname,'../..');
const original=path.join(ROOT,'qa/perf-home-05/index.html');
const outputDir=path.join(ROOT,'reports/perf-home-07');
fs.mkdirSync(outputDir,{recursive:true});
let html=fs.readFileSync(original,'utf8');
html=html.replace(/<link rel="stylesheet" href="https:\/\/forjamineirad20\.com\.br\/wp-content\/themes\/forja-mineira-d20\/style\.css">/,'');
html=html.replaceAll('https://forjamineirad20.com.br/wp-content/plugins/forja-mineira-builds/assets/images/','../../plugins/forja-mineira-builds/assets/images/');
const local=path.join(ROOT,'qa/perf-home-05/index.offline.html');
fs.writeFileSync(local,html);
const selectList=[
'.fmb-home-hero','.fmb-home-hero-copy','.fmb-home-hero-landscape',
'.fmb-forja-now','.fmb-forja-now-art','.fmb-forja-now-list',
'.fmb-build-cycle','.fmb-cycle-card','.fmb-cycle-current',
'.fmb-cycle-next','.fmb-cycle-vote','.fmb-cycle-candidate',
'.fmb-featured-guide','.fmb-featured-guide-card','.fmb-featured-guide-content'
];
const props=['display','position','boxSizing','width','height','fontFamily','fontSize','fontWeight','lineHeight','color','backgroundColor','backgroundImage','padding','margin','borderRadius','border','transform','opacity','visibility','gridTemplateColumns','flexDirection','gap','overflow'];
function styleSnapshot(selectors,properties){const result={};for(const selector of selectors){const el=document.querySelector(selector);if(!el){result[selector]={missing:true};continue}const styles=getComputedStyle(el);result[selector]=Object.fromEntries(properties.map(p=>[p,styles[p]]));}return result;}
(async()=>{
const pixelmatch=(await import(pathToFileURL('/tmp/forja-perf-home-07/node_modules/pixelmatch/index.js').href)).default;
const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-gpu','--no-first-run']});
let rows=[],anomalies=[];
try{
for(const width of [360,390,768,1440]){
const page=await browser.newPage();
await page.setViewport({width,height:900,deviceScaleFactor:1});
await page.setRequestInterception(true);
page.on('request',r=>r.url().startsWith('file:')?r.continue():r.abort());
await page.goto(pathToFileURL(local).href,{waitUntil:'load',timeout:30000});
await page.addStyleTag({content:'*, *::before, *::after{animation:none !important; transition:none !important; scroll-behavior:auto !important; caret-color:transparent !important}'});
await page.evaluate(async()=>{
const imgs=[...document.images];
imgs.forEach(img=>img.loading='eager');
await Promise.all(imgs.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,5000);})));
});
const imgs=await page.evaluate(()=>[...document.images].map(x=>({src:x.currentSrc||x.src,ok:x.complete&&x.naturalWidth>0})));
const failed=imgs.filter(i=>!i.ok);
if(failed.length) anomalies.push({width,failedImages:failed.slice(0,15)});
async function applyStyle(name){
await page.evaluate(async(filename)=>{
 const link=document.getElementById('fmb-preview-style');
 await new Promise((resolve,reject)=>{
 const timeout=setTimeout(()=>reject(new Error('CSS timeout: '+filename)),10000);
 link.onload=()=>{clearTimeout(timeout);resolve();};
 link.onerror=()=>{clearTimeout(timeout);reject(new Error('CSS failed: '+filename))};
 link.setAttribute('href','../../plugins/forja-mineira-builds/assets/css/'+filename);
 });
},name);
}
await applyStyle('builds.css');
const beforeStyle=await page.evaluate(styleSnapshot,selectList,props);
const beforePath=path.join(outputDir,'original-'+width+'.png');
await page.screenshot({path:beforePath,fullPage:true,animations:'disabled'});
await applyStyle('home.css');
const afterStyle=await page.evaluate(styleSnapshot,selectList,props);
const afterPath=path.join(outputDir,'candidate-'+width+'.png');
await page.screenshot({path:afterPath,fullPage:true,animations:'disabled'});
const b=PNG.sync.read(fs.readFileSync(beforePath)),a=PNG.sync.read(fs.readFileSync(afterPath));
const w=Math.max(b.width,a.width),h=Math.max(b.height,a.height);
const diff=new PNG({width:w,height:h});
const bd=new PNG({width:w,height:h}),ad=new PNG({width:w,height:h});
PNG.bitblt(b,bd,0,0,b.width,b.height,0,0);
PNG.bitblt(a,ad,0,0,a.width,a.height,0,0);
const mismatched=pixelmatch(bd.data,ad.data,diff.data,w,h,{threshold:0.1});
fs.writeFileSync(path.join(outputDir,'diff-'+width+'.png'),PNG.sync.write(diff));
const styleChanges=[];
for(const selector of selectList){
const old=beforeStyle[selector],now=afterStyle[selector];
if(old.missing||now.missing){styleChanges.push({selector,missing:true});continue}
for(const key of props)if(old[key]!==now[key])styleChanges.push({selector,prop:key,from:old[key],to:now[key]});
}
rows.push({width,originalHeight:b.height,candidateHeight:a.height,pixelDifferencePct:Number((mismatched/(w*h)*100).toFixed(4)),pixelDifference:mismatched,styleChangeCount:styleChanges.length,styleChanges:styleChanges.slice(0,30),imagesChecked:imgs.length,failedImages:failed.length});
await page.close();
}
}catch(e){anomalies.push({fatal:String(e),stack:e.stack});process.exitCode=2}
finally{await browser.close();}
const report={test:'PERF-HOME-07',kind:'synthetic visual parity (not actual WordPress)',baseCss:'builds.css',candidateCss:'home.css',rows,anomalies,generatedAt:new Date().toISOString()};
fs.writeFileSync(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
const md=[
'# PERF-HOME-07 — CSS synthetic visual parity',
'**Comparação isolada, não validação de WordPress staging.**',
'',
'| Largura | Alteração visual | Diferenças de estilo | Imagens com falha |',
'|---:|---:|---:|---:|',
...rows.map(x=>`| ${x.width}px | ${x.pixelDifferencePct}% | ${x.styleChangeCount} | ${x.failedImages} |`),
'',
'**Anomalias:** '+(anomalies.length?JSON.stringify(anomalies):'nenhuma'),
'',
'Arquivos PNG (original, candidata, diff) e JSON: artefato deste job. Nenhum deploy.'
].join('\n');
console.log(md);
for(const row of rows){if(row.styleChanges.length)console.log('Computed-style diff '+row.width+': '+JSON.stringify(row.styleChanges.slice(0,15)))}
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md+'\n');
if(rows.length!==4 || anomalies.length || rows.some(x=>x.pixelDifferencePct>0.25||x.styleChangeCount>0))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(2)});
