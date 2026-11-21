'use strict';
/* SPELL-06E: browser validation of the original 1.0.9 guide; screenshots only. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'../..'), preview=path.join(__dirname,'index.html');
const out=path.join(__dirname,'output');
fs.mkdirSync(out,{recursive:true});
const evidence={phase:'SPELL-06E',mode:'standalone-browser-preview',source:'GitHub branch, WordPress template stripped only of PHP',time:null,checks:[],screenshots:[],knownFindings:[],approved:false};
function record(name,pass,details){evidence.checks.push({name,status:pass?'PASS':'FAIL',details:details||''});if(!pass)throw Error(name+' '+(details||''));}
const inc=(name,details)=>evidence.knownFindings.push({name,status:'RISK',details});
async function capture(page,name,fullPage=true) {
 const p=path.join(out,name+'.png');
 await page.screenshot({path:p,fullPage,animations:'disabled'});
 evidence.screenshots.push(name+'.png');
}
async function metrics(page){
 return page.evaluate(()=>{
  const doc=document.documentElement, guide=document.querySelector('.fmmg-guide');
  return {viewport:window.innerWidth,scrollWidth:doc.scrollWidth,scrollHeight:doc.scrollHeight,
    guideWidth:Math.round(guide?.getBoundingClientRect().width||0),
    results:document.querySelector('#fmmg-resultCount')?.textContent,
    heroBackground:getComputedStyle(document.querySelector('.hero')).backgroundImage,
    cssLoaded:getComputedStyle(guide).fontFamily.includes('Inter'),
    images:[...document.images].map(im=>({src:im.src,loaded:im.complete&&im.naturalWidth>0})),
    filterButton:(()=>{const btn=document.querySelector('#fmmg-openFilters'),catalog=document.querySelector('#fmmg-catalogo');if(!btn||!catalog)return null;const b=btn.getBoundingClientRect(),c=catalog.getBoundingClientRect();return {left:b.left,right:b.right,catalogRight:c.right,visibleWidth:Math.max(0,Math.min(b.right,c.right)-Math.max(b.left,c.left)),width:b.width,clipped:b.right>c.right+1};})()};
 });
}
async function main(){
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 try{
  for(const settings of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844},{name:'mobile-small',width:360,height:780}]){
   const page=await browser.newPage({viewport:{width:settings.width,height:settings.height},deviceScaleFactor:1,isMobile:settings.name!=='desktop',hasTouch:settings.name!=='desktop'});
   const errors=[], failures=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')failures.push(m.text());});
   page.on('requestfailed',req=>failures.push('requestfailed '+req.url()+' '+req.failure()?.errorText));
   await page.goto(pathToFileURL(preview).href,{waitUntil:'load'});
   await page.locator('#fmmg-spellList .spell-row').first().waitFor({state:'visible'});
   const m=await metrics(page);
   record(settings.name+' initial 94 results',m.results==='94 resultados',JSON.stringify(m));
   record(settings.name+' CSS loaded',m.cssLoaded,JSON.stringify(m));
   record(settings.name+' no JS runtime errors',errors.length===0,errors.join(';'));
   // Network console warnings (e.g. remote font blocked) remain visible in the evidence.
   evidence.checks.push({name:settings.name+' console/network issues',status:failures.length?'WARN':'PASS',details:failures});
   if(m.scrollWidth>settings.width+2)inc(settings.name+' horizontal overflow','scrollWidth '+m.scrollWidth+' vs viewport '+settings.width);
   if(settings.name!=='desktop' && m.filterButton?.clipped)
     inc(settings.name+' BOTÃO FILTROS CORTADO','Botão ultrapassa a borda do catálogo em '+Math.round(m.filterButton.right-m.filterButton.catalogRight)+' px; overflow:clip esconde parte do controle. BLOQUEIO VISUAL.');
   await capture(page,settings.name+'-initial');
   if(settings.name==='desktop'){
     const hof=page.locator('#fmmg-sourcePills button[data-value="HoF"]');
     await hof.click();
     record('desktop HoF filter 3',await page.locator('#fmmg-resultCount').textContent()==='3 resultados');
     await capture(page,'desktop-hof');
     await page.locator('#fmmg-search').fill('__SPELL06E_EMPTY__');
     record('desktop empty state',await page.locator('#fmmg-emptyState').evaluate(el=>el.classList.contains('show')));
     await capture(page,'desktop-empty',false);
     await page.locator('#fmmg-emptyReset').click();
     record('desktop reset 94',await page.locator('#fmmg-resultCount').textContent()==='94 resultados');
     await page.locator('#fmmg-spellList .spell-row').nth(1).click();
     record('desktop select detail',await page.locator('#fmmg-detail').textContent().then(s=>s.includes('Toque Arrepiante')));
     await capture(page,'desktop-detail',false);
   }else{
     const open=page.locator('#fmmg-openFilters');
     await open.click();
     record(settings.name+' filters open',await page.locator('#fmmg-filterSheet').evaluate(el=>el.classList.contains('open')));
     const ariaFilter=await page.locator('#fmmg-filterSheet').getAttribute('aria-hidden');
     if(ariaFilter==='true')inc(settings.name+' filter aria-hidden mismatch','Visible sheet still declares aria-hidden=true. Existing 1.0.9 UI accessibility issue.');
     await capture(page,settings.name+'-filters',false);
     await page.locator('#fmmg-mSourcePills button[data-value="HoF"]').click();
     record(settings.name+' HoF filter 3',await page.locator('#fmmg-resultCount').textContent()==='3 resultados');
     record(settings.name+' filter closes after selection',await page.locator('#fmmg-filterSheet').evaluate(el=>!el.classList.contains('open')));
     await page.locator('#fmmg-spellList .spell-row').first().click();
     record(settings.name+' detail opens',await page.locator('#fmmg-detailSheet').evaluate(el=>el.classList.contains('open')));
     const ariaDetail=await page.locator('#fmmg-detailSheet').getAttribute('aria-hidden');
     if(ariaDetail==='true')inc(settings.name+' detail aria-hidden mismatch','Visible detail sheet still declares aria-hidden=true. Existing 1.0.9 UI accessibility issue.');
     await capture(page,settings.name+'-detail',false);
     await page.locator('#fmmg-backdrop').click({position:{x:3,y:3}});
     record(settings.name+' detail closes',await page.locator('#fmmg-detailSheet').evaluate(el=>!el.classList.contains('open')));
     await page.locator('#fmmg-search').fill('__SPELL06E_EMPTY__');
     record(settings.name+' empty state',await page.locator('#fmmg-emptyState').evaluate(el=>el.classList.contains('show')));
     await capture(page,settings.name+'-empty',false);
     await page.locator('#fmmg-emptyReset').click();
     record(settings.name+' reset 94',await page.locator('#fmmg-resultCount').textContent()==='94 resultados');
   }
   evidence.checks.push({name:settings.name+' layout',status:m.scrollWidth<=settings.width+2?'PASS':'WARN',details:m});
   await page.close();
  }
 }finally {await browser.close();}
}
main().then(()=>{
 evidence.status=evidence.knownFindings.some(f=>f.name.includes('BOTÃO FILTROS CORTADO'))?'VISUAL_FAIL_WITH_TESTS_PASSING':evidence.knownFindings.length?'PASS_WITH_KNOWN_RISKS':'PASS';
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(evidence,null,2)+'\n');
 fs.writeFileSync(path.join(out,'REPORT.md'),[
 '# SPELL-06E — Evidência Playwright independente',
 '',
 '**Resultado:** '+evidence.status+' (não substitui homologação WordPress).',
 '',
 '## Testes',
 ...evidence.checks.map(t=>'- '+t.status+' — '+t.name+(t.details&&typeof t.details==='string'?' — '+t.details:'')),
 '',
 '## Riscos conhecidos',
 ...evidence.knownFindings.map(f=>'- '+f.name+': '+f.details),
 '',
 '## Capturas',
 ...evidence.screenshots.map(s=>'- '+s),
 '',
 'Sem merge e sem alteração de produção. Revisão visual humana das capturas ainda é obrigatória.'
 ].join('\n')+'\n');
 console.log('SPELL-06E SUCCESS '+JSON.stringify({checks:evidence.checks.length,screenshots:evidence.screenshots.length,knownRisks:evidence.knownFindings.length,status:evidence.status}));
}).catch(error=>{
 evidence.status='FAIL';evidence.error=String(error?.stack||error);
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(evidence,null,2)+'\n');
 console.error('SPELL-06E FAILED',error);
 process.exitCode=1;
});
