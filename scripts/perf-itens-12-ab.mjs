// PERF-ITENS-12 — isolated A/B: defer non-critical item/related thumbnails.
// ZERO changes to WordPress, published plugin, CDN and source art.
import {createServer} from 'node:http';
import {mkdir, mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import puppeteer from 'puppeteer-core';
import lighthouse from 'lighthouse';

const upstream = 'https://forjamineirad20.com.br';
const target = '/itens-magicos-conjuradores-dnd-2024/';
const heroPath = '/wp-content/plugins/forja-mineira-guia-itens-conjuradores/assets/hero-vaeros-mobile-960-v1.0.7.webp';
const output = process.env.RUNNER_TEMP ? join(process.env.RUNNER_TEMP,'perf12') : join(process.cwd(),'perf12-output');
const evidence = join(output,'evidence');
const raw = join(output,'raw');
await mkdir(evidence,{recursive:true});
await mkdir(raw,{recursive:true});
const sha = data => createHash('sha256').update(data).digest('hex');
const saveJSON = (name,data) => writeFile(join(evidence,name),JSON.stringify(data,null,2));
const viewport = {width:412,height:823,deviceScaleFactor:1.75,isMobile:true,hasTouch:true};
const order = [['A','B'],['B','A'],['B','A'],['A','B']];
const startedAt = new Date().toISOString();
const chromePath = process.argv[2];
if(!chromePath) throw new Error('Chrome executable path is required');
const records=[];
const snapshot = new Map();
const external = new Set();
const misses = new Set();
let frozen = false;
let variant = 'A';
let origin = null;
let ua = null;
let deferredCount = 0;
let deferredURLs = [];

function deferredHTML(html) {
  const urls=[];
  const rewritten=html.replace(/<img\b[^>]*>/gi,(original)=>{
    if (!original.includes('/forja-mineira-guia-itens-conjuradores/assets/item-') &&
        !original.includes('/forja-mineira-clusters/assets/images/')) return original;
    const src=original.match(/\ssrc=["']([^"']+)/i)?.[1] ?? '';
    urls.push(src);
    let tag=original.replace(/\ssrcset=/i,' data-perf12-srcset=').replace(/\ssrc=/i,' data-perf12-src=');
    tag=tag.replace(/\sfetchpriority=["']high["']/i,' fetchpriority="low"');
    if (!/\sloading=/i.test(tag)) tag=tag.replace(/\s*\/?>$/, ' loading="lazy">');
    return tag;
  });
  if(!urls.length) throw new Error('No noncritical images found for B transformation');
  deferredCount=urls.length;deferredURLs=urls;
  const script = [
    '<script id="perf12-experimental-defer">',
    '(function(){',
    'var images=Array.from(document.querySelectorAll("img[data-perf12-src]"));',
    'function restore(img){',
    ' var set=img.getAttribute("data-perf12-srcset");',
    ' var src=img.getAttribute("data-perf12-src");',
    ' if(set)img.setAttribute("srcset",set);',
    ' if(src)img.setAttribute("src",src);',
    ' img.removeAttribute("data-perf12-srcset");img.removeAttribute("data-perf12-src");',
    '}',
    'if(!("IntersectionObserver" in window)){images.forEach(restore);return;}',
    'var observer=new IntersectionObserver(function(entries){',
    ' entries.forEach(function(entry){if(entry.isIntersecting){observer.unobserve(entry.target);restore(entry.target);}});',
    '},{rootMargin:"160px 0px",threshold:0});',
    'images.forEach(function(img){observer.observe(img);});',
    '})();',
    '</script>'
  ].join('');
  if(!rewritten.includes('</body>')) throw new Error('Cannot add deferred loader before closing body');
  return rewritten.replace('</body>',script+'</body>');
}

async function fetchResource(key) {
  const url = new URL(key,upstream);
  if(url.origin!==upstream) throw new Error('Unexpected upstream origin '+url.origin);
  const response=await fetch(url,{
    redirect:'manual',
    signal:AbortSignal.timeout(25000),
    headers:{'user-agent':ua || 'Mozilla/5.0', 'accept-language':'pt-BR,pt;q=0.9'}
  });
  const buffer=Buffer.from(await response.arrayBuffer());
  return {
    key, status:response.status, type:response.headers.get('content-type')||'application/octet-stream',
    raw:buffer, bytes:buffer.length, originalSha256:sha(buffer),
    redirect:response.headers.get('location')
  };
}

const server=createServer(async(req,res)=>{
  try {
    const path=new URL(req.url,origin);
    const key=path.pathname+path.search;
    if (!snapshot.has(key)) {
      if(frozen) {misses.add(key); res.writeHead(404).end('Frozen fixture: unknown '+key);return;}
      snapshot.set(key,fetchResource(key));
    }
    const stored=await snapshot.get(key);
    const isText=/text\/|javascript|json|xml|svg/i.test(stored.type);
    let buffer=stored.raw;
    let headers={'content-type':stored.type,'cache-control':'no-store','access-control-allow-origin':'*'};
    if(isText) {
      let s=buffer.toString('utf8').replaceAll(upstream,origin);
      s=s.replaceAll(upstream.replaceAll('/','\\/'),origin.replaceAll('/','\\/'));
      if(key===target && variant==='B') s=deferredHTML(s);
      buffer=gzipSync(s);
      headers['content-encoding']='gzip';
    }
    if(stored.redirect) headers.location=stored.redirect.replaceAll(upstream,origin);
    headers['content-length']=buffer.length;
    res.writeHead(stored.status,headers).end(buffer);
  } catch(e) {
    console.error('Fixture resource error',req.url,e.message);
    res.writeHead(502).end(e.message);
  }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
origin='http://127.0.0.1:'+server.address().port;
const url=origin+target;
const heroUrl=origin+heroPath;
const clientErrors=[];

async function withBrowser(operation) {
  const browser=await puppeteer.launch({
    executablePath:chromePath,headless:true,pipe:true,
    userDataDir:await mkdtemp(join(tmpdir(),'perf12-chrome-')),timeout:20000
  });
  try {
    const version=await browser.version();
    const major=version.match(/\/(\d+)/)?.[1] || '156';
    ua='Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/'+major+'.0.0.0 Mobile Safari/537.36';
    const page=await browser.newPage();
    await page.setUserAgent(ua);
    await page.setViewport(viewport);
    await page.setRequestInterception(true);
    page.on('request',request=>{
      const parsed=new URL(request.url());
      if(['http:','https:'].includes(parsed.protocol) && parsed.origin!==origin){
        external.add(parsed.origin+parsed.pathname);
        void request.abort().catch(()=>{});
      } else void request.continue().catch(()=>{});
    });
    page.on('pageerror',e=>clientErrors.push(String(e)));
    return await operation(page,version);
  } finally {await browser.close();}
}

function wait(ms) {return new Promise(resolve=>setTimeout(resolve,ms));}

async function scrollAll(page) {
  const height=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<height+850;y+=550){
    await page.evaluate(v=>window.scrollTo(0,v),y);
    await wait(65);
  }
  await wait(600);
  await page.evaluate(()=>window.scrollTo(0,0));
}

async function visualQA(name,fullScroll) {
  variant=name;
  return withBrowser(async(page,chrome)=>{
    const response=await page.goto(url,{waitUntil:'networkidle0',timeout:65000});
    if(response?.status()!==200) throw new Error(name+' fixture document '+response?.status());
    await page.waitForSelector('section.hero',{timeout:10000});
    const top=await page.evaluate((heroUrl)=>{
      const hero=document.querySelector('section.hero');
      const pseudo=getComputedStyle(hero,'::before');
      const preload=Array.from(document.querySelectorAll('link[rel="preload"]')).find(x=>x.href===heroUrl&&x.as==='image');
      const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
      return {
        heroRect:rect(hero),heroBG:pseudo.backgroundImage,
        heroPreload:Boolean(preload && matchMedia(preload.media).matches && preload.fetchPriority==='high'),
        title:hero.querySelector('h1')?.textContent.trim(),
        cardCount:document.querySelectorAll('#itemsGrid .item').length,
        imgCandidates:document.querySelectorAll('#itemsGrid img,#detailImage,.fmc-related-grid img').length,
        deferredPending:document.querySelectorAll('img[data-perf12-src]').length,
        scrollHeight:document.documentElement.scrollHeight
      };
    },heroUrl);
    if (!top.heroBG.includes(heroUrl) || !top.heroPreload || top.cardCount!==10) throw new Error(name+' hero/template invariant failed: '+JSON.stringify(top));
    await page.screenshot({path:join(evidence,name+'-first-viewport.png')});
    if(fullScroll) {
      await scrollAll(page);
      await wait(1200);
    }
    const images=await page.evaluate(()=>{
      const imgs=Array.from(document.querySelectorAll('#itemsGrid img,#detailImage,.fmc-related-grid img'));
      return {images:imgs.length,loaded:imgs.filter(x=>x.complete&&x.naturalWidth>0).length,
        pending:imgs.filter(x=>x.hasAttribute('data-perf12-src')).length,
        unloaded:imgs.filter(x=>!(x.complete&&x.naturalWidth>0)).map(x=>x.outerHTML.slice(0,240))};
    });
    const result={name,chrome,top,images};
    await saveJSON('visual-'+name+'.json',result);
    console.log('QA',JSON.stringify({...result,images:{images:images.images,loaded:images.loaded,pending:images.pending,unloadedCount:images.unloaded.length}}));
    if(fullScroll && (images.pending>0||images.loaded!==images.images)) throw new Error(name+' interactive/scroll image restoration incomplete: '+JSON.stringify(images));
    return result;
  });
}

const metric=(lhr,id)=>lhr.audits[id]?.numericValue??null;
function networkSummary(lhr) {
  const all=lhr.audits['network-requests']?.details?.items??[];
  const lcpMs=metric(lhr,'largest-contentful-paint')??0;
  const before=all.filter(x=>Number.isFinite(x.networkRequestTime)&&x.networkRequestTime<=lcpMs);
  const downloaded=before.reduce((acc,x)=>acc+(x.transferSize||0),0);
  const allImgs=before.filter(x=>/(image\/|\.png|\.webp|\.jpe?g|\.svg)/i.test(x.mimeType||x.url||''));
  const noncritical=allImgs.filter(x=>/assets\/item-|forja-mineira-clusters\/assets\/images\//.test(x.url));
  const hero=all.find(x=>x.url===heroUrl);
  return {
    beforeLcpRequests:before.length,beforeLcpTransfersBytes:downloaded,
    noncriticalBeforeLcp:noncritical.map(x=>({url:x.url,status:x.statusCode,start:x.networkRequestTime,end:x.networkEndTime,
      transfer:x.transferSize,priority:x.priority})),
    hero:hero?{http:hero.statusCode,priority:hero.priority,bytes:hero.resourceSize,transfer:hero.transferSize,
      start:hero.networkRequestTime,end:hero.networkEndTime,duration:hero.networkEndTime-hero.networkRequestTime}:null
  };
}
function median(values) {
  const s=values.filter(Number.isFinite).slice().sort((a,b)=>a-b);
  return s.length?(s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2):null;
}
const exported={};
async function capture(name,id){
  variant=name;
  await withBrowser(async(page,chrome)=>{
    const result=await lighthouse(url,{onlyCategories:['performance'],throttlingMethod:'devtools',
      emulatedUserAgent:ua,logLevel:'error'},undefined,page);
    if(!result?.lhr||result.lhr.runtimeError) throw Error(id+' Lighthouse error '+JSON.stringify(result?.lhr?.runtimeError||'No LHR'));
    const {lhr,artifacts}=result;
    const trace=artifacts.Trace;
    if (!trace?.traceEvents?.length) throw Error(id+' trace empty');
    const candidates=trace.traceEvents.filter(x=>x.name==='largestContentfulPaint::Candidate');
    const observed=lhr.audits.metrics?.details?.items?.[0]??{};
    const candidate=candidates.find(x=>x.ts===observed.observedLargestContentfulPaintTs)??candidates.at(-1);
    const image=trace.traceEvents.find(x=>x.name==='LargestImagePaint::Candidate' && x.ts===candidate?.ts);
    const lcpImage=image?.args?.data?.imageUrl??null;
    const lcpNode=lhr.audits['lcp-breakdown-insight']?.details?.items?.find(x=>x.type==='node')??null;
    const network=networkSummary(lhr);
    const metrics={
      id,scenario:name,startedAt:lhr.fetchTime,chrome,
      score:lhr.categories.performance.score*100,
      fcpMs:metric(lhr,'first-contentful-paint'),
      lcpMs:metric(lhr,'largest-contentful-paint'),
      tbtMs:metric(lhr,'total-blocking-time'),
      cls:metric(lhr,'cumulative-layout-shift'),
      speedIndexMs:metric(lhr,'speed-index'),
      lcpImage,lcpSelector:lcpNode?.selector??null,
      heroIsLcp:lcpImage===heroUrl && Boolean(lcpNode?.selector?.includes('section.hero')),
      breakdown:lhr.audits['lcp-breakdown-insight']?.details?.items?.find(x=>x.type==='table')?.items??null,
      ...network
    };
    for(const [file,data] of [
      [id+'-lighthouse.json',JSON.stringify(lhr)],
      [id+'-trace.json',JSON.stringify(trace)]
    ]){
      await writeFile(join(raw,file),data);
      exported[file]={bytes:Buffer.byteLength(data),sha256:sha(data)};
    }
    records.push(metrics);
    await saveJSON('measurements.json',records);
    console.log('MEASUREMENT',JSON.stringify(metrics));
    if(!metrics.heroIsLcp || metrics.hero?.http!==200||metrics.cls>0.001) {
      throw Error(id+' failed main LCP/HTTP/CLS invariants: '+JSON.stringify(metrics));
    }
  });
}

try {
  // Frozen local proxy: no live-origin access during the actual measured comparisons.
  variant='A';
  await withBrowser(async page=>{
    const response=await page.goto(url,{waitUntil:'networkidle0',timeout:65000});
    if(response?.status()!==200) throw Error('Fixture warmup failed: '+response?.status());
    await scrollAll(page);
    await wait(1000);
  });
  await Promise.all([...snapshot.values()]);
  frozen=true;
  console.log('FROZEN_SNAPSHOT',snapshot.size,'resources; upstream HTML, images, JS and CSS reused across variants.');
  const visualA=await visualQA('A',true);
  const visualB=await visualQA('B',true);
  if(JSON.stringify(visualA.top.heroRect)!==JSON.stringify(visualB.top.heroRect) ||
     visualA.top.title!==visualB.top.title ||visualA.top.scrollHeight!==visualB.top.scrollHeight){
    throw Error('A/B layout invariants violated');
  }
  if(visualB.top.deferredPending<10) throw Error('Expected B to defer 10+ offscreen images');
  if (misses.size) throw Error('Frozen snapshot missing resources during visual QA '+JSON.stringify([...misses]));
  for(let round=0;round<order.length;round++) {
    for(let position=0;position<order[round].length;position++) {
      const name=order[round][position],id=(round+1)+'-'+name;
      await capture(name,id);
    }
  }
  const a=records.filter(r=>r.scenario==='A'),b=records.filter(r=>r.scenario==='B');
  const medA=median(a.map(r=>r.lcpMs)), medB=median(b.map(r=>r.lcpMs));
  const summary={
    title:'PERF-ITENS-12 controlled A/B deferring noncritical images',
    upstreamUrl:upstream+target,fixtureUrl:url,
    startedAt,endedAt:new Date().toISOString(),runId:process.env.GITHUB_RUN_ID??null,
    methodology:'A baseline HTML, B only changes noncritical item and related <img> request timing via IntersectionObserver (160px rootMargin). All other frozen upstream assets and HTML content identical; loopback no-store; Chrome fresh profile per Lighthouse run; 412x823 DPR1.75, DevTools mobile throttling. 4 interleaved runs per variant, with alternating order.',
    warning:'This local frozen fixture cannot measure real CDN latency/MISS; tests only the marginal impact of noncritical browser-image competition under synthetic network. Results do not replace live PSI/CrUX.',
    browserCache:'fresh Chrome profile per run; no-store fixture; browser storage reset by Lighthouse',
    chrome:a[0]?.chrome,
    config:{viewport,throttlingMethod:'devtools',order},
    modifiedImagesCount:deferredCount,modifiedImageURLs:deferredURLs,
    sourceSnapshot:[...snapshot].map(([path,promise])=>({path})),
    heroSha256:(await snapshot.get(heroPath))?.originalSha256??null,
    firstViewportGeometryStable:true,firstViewportScreenshots:['A-first-viewport.png','B-first-viewport.png'],
    qa:{A:visualA.images,B:visualB.images},externalExcluded:[...external].sort(),snapshotMisses:[...misses].sort(),
    medians:{
      A:{lcpMs:medA,tbtMs:median(a.map(r=>r.tbtMs)),cls:median(a.map(r=>r.cls)),
        heroDurationMs:median(a.map(r=>r.hero?.duration)),networkBeforeLcpBytes:median(a.map(r=>r.beforeLcpTransfersBytes))},
      B:{lcpMs:medB,tbtMs:median(b.map(r=>r.tbtMs)),cls:median(b.map(r=>r.cls)),
        heroDurationMs:median(b.map(r=>r.hero?.duration)),networkBeforeLcpBytes:median(b.map(r=>r.beforeLcpTransfersBytes))}
    },
    deltaBminusA:{lcpMs:medB-medA,lcpPct:((medB-medA)/medA)*100},
    count:{A:a.length,B:b.length},measurements:records,exported,clientErrors
  };
  await saveJSON('summary.json',summary);
  console.log('FINAL_AB_SUMMARY',JSON.stringify({count:summary.count,medians:summary.medians,
    deltaBminusA:summary.deltaBminusA,modifiedImagesCount:summary.modifiedImagesCount,
    snapshotMisses:summary.snapshotMisses,firstViewportGeometryStable:true}));
} finally {
  await new Promise(resolve=>server.close(resolve));
}
