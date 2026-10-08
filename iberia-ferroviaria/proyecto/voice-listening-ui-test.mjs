// Auditorio adicional: nueve cuerpos enteros y controles reales del único <audio>.
// No sustituye las suites del juego. Ejecutar sólo con GO de ROOT y un único navegador.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {DIALOGUE_CATALOGUE} from './tools/voice_dialogues.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const input=path.resolve(process.env.LISTENING_HTML||path.join(root,'../outputs/Iberia-Ferroviaria-dialogos-nuevos.html'));
const provenanceFile=path.resolve(process.env.LISTENING_PROVENANCE||path.join(root,'../investigacion/voces/auditorio-dialogos-3.6.3/latest.json'));
const out=path.resolve(process.env.LISTENING_OUT||path.join(root,'../investigacion/verificacion-auditorio-3.6.3'));
const full=process.env.LISTENING_ALLOW_PARTIAL!=='1';
const memoryLimitGiB=process.env.LISTENING_MEMORY_LIMIT_GIB===undefined?null:Number(process.env.LISTENING_MEMORY_LIMIT_GIB);
assert(memoryLimitGiB===null||(Number.isFinite(memoryLimitGiB)&&memoryLimitGiB>0),'límite de memoria opcional positivo en GiB');
const memoryCurrentFile='/sys/fs/cgroup/memory.current';
const sha=value=>createHash('sha256').update(value).digest('hex');
const original=fs.readFileSync(input,'utf8'),provenance=JSON.parse(fs.readFileSync(provenanceFile));
assert.equal(sha(original),provenance.outputSHA256,'HTML exacto del snapshot de escucha');
const match=original.match(/<script type="application\/json" id="dialogue-data">([\s\S]*?)<\/script>/);
assert(match,'catálogo incrustado');
const data=JSON.parse(match[1]),canonical=new Map(DIALOGUE_CATALOGUE.map(row=>[row.id,row])),records=new Map(provenance.recordings.map(row=>[row.id,row]));
assert.equal(data.rows.length,412);assert.equal(new Set(data.rows.map(row=>row.id)).size,412);assert.equal(data.characters.length,9);
assert.equal(Object.keys(data.audio).length,provenance.availableWholeDialogues);assert.equal(provenance.oldSentenceRecordings,0);assert.equal(provenance.systemVoiceFallback,false);
if(full){assert.equal(provenance.availableWholeDialogues,412,'el modo final exige las 412 grabaciones');assert.equal(provenance.sourceManifestStatus,'complete','producción final cerrada');}
for(const row of data.rows){
  const source=canonical.get(row.id);assert(source);assert.equal(row.person,source.person);assert.equal(row.text,source.raw,'cuerpo completo canónico sin recortes');
  assert.equal(row.available,!!data.audio[row.id]);
  if(row.available){const record=records.get(row.id);assert(record);assert.equal(sha(Buffer.from(data.audio[row.id],'base64')),row.sha256);assert.equal(row.sha256,record.sha256);assert.equal(record.raw,row.text);assert.equal(sha(fs.readFileSync(record.sourcePath)),record.sha256,'MP3 físico del snapshot');}
}
assert(/<link\b[^>]*rel="icon"[^>]*href="data:image\/svg\+xml,/.test(original),'favicon integrado sin petición HTTP');
assert(/id="stop"/.test(original),'control Detener real del producto');
fs.mkdirSync(out,{recursive:true});
const report={startedAt:new Date().toISOString(),htmlSHA256:sha(original),htmlBytes:Buffer.byteLength(original),provenanceSHA256:sha(fs.readFileSync(provenanceFile)),testSourceSHA256:sha(fs.readFileSync(fileURLToPath(import.meta.url))),finalCatalogueRequired:full,available:provenance.availableWholeDialogues,total:412,nativeAudio:true,HTMLServedUnmodified:true,sourceModified:false,textModified:false,scope:'Nueve personajes, cuerpos completos; cola, controles y filtros reales; móvil 320/390 sin conexión.',limitation:'Comprueba reproducción y procedencia; no evalúa naturalidad/parecido ni escucha todos los 412 cuerpos.',samples:[],mobile:[],errors:[],failedRequests:[],extraRequests:[],status:'running'};
let browser,server,page,memoryTimer,memoryFailure,ownedBrowserClose;
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
report.nodePID=process.pid;
report.memoryGuard={enabled:memoryLimitGiB!==null};
function closeOwnedBrowser(){
  if(!browser)return Promise.resolve();
  return ownedBrowserClose||=browser.close();
}
function sampleMemory(){
  const guard=report.memoryGuard;
  if(!guard.enabled||memoryFailure)return;
  try{
    const bytes=Number(fs.readFileSync(memoryCurrentFile,'utf8').trim());
    assert(Number.isSafeInteger(bytes)&&bytes>=0,'lectura real de cgroup memory.current');
    guard.sampleCount++;
    guard.lastSample={at:new Date().toISOString(),bytes};
    guard.peakBytes=Math.max(guard.peakBytes,bytes);
    if(bytes<guard.limitBytes)return;
    guard.reason='cgroup-memory-limit';guard.triggeredAt=guard.lastSample.at;guard.triggerBytes=bytes;
    memoryFailure=new Error(`Memoria cgroup ${bytes} bytes >= límite ${guard.limitBytes} bytes; se cierra sólo el navegador propio.`);
  }catch(error){
    guard.reason||='cgroup-memory-read-failed';guard.readError=guard.reason==='cgroup-memory-read-failed'?String(error):undefined;
    memoryFailure=error;
  }
  report.status='fail';process.exitCode=1;
  if(browser)void closeOwnedBrowser().catch(error=>{guard.browserCloseError=String(error);});
}

function observeNativeMedia(){
  const qa=window.__listeningQA={plays:[],events:[],synth:[],mediaSequence:0};
  const identities=new WeakMap();let active=null;
  const digest=async src=>{const bin=atob(src.split(',')[1]),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');};
  const play=HTMLMediaElement.prototype.play,pause=HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.play=function(...args){
    if(!identities.has(this))identities.set(this,++qa.mediaSequence);
    const row={index:qa.plays.length,mediaIdentity:identities.get(this),elementID:this.id,nativeAudio:this instanceof HTMLAudioElement,at:performance.now(),sourceKind:this.src.startsWith('data:audio/mpeg;base64,')?'embedded-mp3':'other',id:document.querySelector('.take.selected')?.dataset.id,startTime:this.currentTime,rate:this.playbackRate,defaultRate:this.defaultPlaybackRate,duration:this.duration,progress:[]};
    active=row;qa.plays.push(row);
    digest(this.src).then(hash=>row.mp3SHA256=hash,error=>row.hashError=String(error));
    const result=play.apply(this,args);result?.then(()=>row.playFulfilled=true,error=>row.playError=String(error));return result;
  };
  HTMLMediaElement.prototype.pause=function(...args){if(active&&!this.paused&&!active.nativeEnded)active.pausedByCallAt=performance.now();return pause.apply(this,args);};
  for(const type of ['playing','pause','timeupdate','ended','seeking','seeked','error'])document.addEventListener(type,event=>{
    if(!(event.target instanceof HTMLAudioElement))return;const player=event.target;
    const row={type,trusted:event.isTrusted,at:performance.now(),time:player.currentTime,duration:player.duration,id:document.querySelector('.take.selected')?.dataset.id};qa.events.push(row);
    if(!active)return;
    if(type==='playing'){
      const entry=active;entry.nativePlaying=event.isTrusted;entry.playingAt=row.at;entry.duration=row.duration;
      digest(player.currentSrc).then(hash=>entry.nativeSourceSHA256=hash,error=>entry.nativeSourceHashError=String(error));
    }
    if(type==='timeupdate')active.progress.push({time:row.time,at:row.at});
    if(type==='ended'){active.nativeEnded=event.isTrusted;active.endedAt=row.at;active.endTime=row.time;}
    if(type==='error')active.mediaError=player.error?.message||'native-media-error';
  },true);
  if(window.speechSynthesis){const speak=window.speechSynthesis.speak;window.speechSynthesis.speak=function(utterance){qa.synth.push(utterance.text);return speak.call(this,utterance);};}
}
const normalized=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const whitespaceOnly=value=>String(value).replace(/\s+/g,' ').trim();
async function assertDisplayedFull(row,selector){
  const displayed=await page.locator(selector).evaluate(element=>{
    const part=className=>{const matches=element.querySelectorAll(className),node=matches[0];if(!node)return {count:matches.length};const rect=node.getBoundingClientRect();return {count:matches.length,text:node.textContent,display:getComputedStyle(node).display,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height};};
    return {text:element.textContent,opener:part('.dialogue-opener'),main:part('.dialogue-main')};
  });
  assert.equal(whitespaceOnly(displayed.text),whitespaceOnly(row.text),'texto íntegro: sólo se normaliza whitespace');
  if(row.opener){
    assert.equal(whitespaceOnly(row.opener+' '+row.main),whitespaceOnly(row.text),'introducción y cuerpo conservan todo el texto canónico');
    for(const part of ['opener','main']){assert.equal(displayed[part].count,1);assert.equal(whitespaceOnly(displayed[part].text),whitespaceOnly(row[part]),part+' canónico íntegro');}
    if(row.text.split(/\n\s*\n/).filter(part=>part.trim()).length>=2){
      const [canonicalOpener,...canonicalMain]=canonical.get(row.id).raw.split(/\n\s*\n/);
      assert.equal(whitespaceOnly(row.opener),whitespaceOnly(canonicalOpener));assert.equal(whitespaceOnly(row.main),whitespaceOnly(canonicalMain.join('\n\n')));
      for(const part of ['opener','main']){assert.equal(displayed[part].display,'block');assert(displayed[part].width>0&&displayed[part].height>0);}
      assert(displayed.main.top>displayed.opener.bottom,'introducción y cuerpo separados visualmente');
    }
  }
  return displayed;
}
function assertSource(actual,row){assert.equal(actual.id,row.id);assert.equal(actual.mp3SHA256,row.sha256);assert.equal(actual.nativeSourceSHA256,row.sha256,'currentSrc del reproductor nativo coincide');assert.equal(actual.nativeAudio,true);assert.equal(actual.elementID,'player');assert.equal(actual.sourceKind,'embedded-mp3');assert.equal(actual.rate,1);assert.equal(actual.defaultRate,1);assert.equal(actual.playFulfilled,true);assert.equal(actual.nativePlaying,true);assert.equal(actual.hashError,undefined);assert.equal(actual.nativeSourceHashError,undefined);assert.equal(actual.mediaError,undefined);}
function assertComplete(actual,row){assertSource(actual,row);assert.equal(actual.nativeEnded,true);assert.equal(actual.pausedByCallAt,undefined);assert(Math.abs(actual.duration-row.duration)<.15);assert(actual.progress.some(point=>point.time>.2));assert(actual.endedAt-actual.at>=actual.duration*1000-300);assert.equal(actual.playError,undefined);}

try{
  if(memoryLimitGiB!==null){
    Object.assign(report.memoryGuard,{path:memoryCurrentFile,pollIntervalMs:500,limitGiB:memoryLimitGiB,limitBytes:memoryLimitGiB*2**30,sampleCount:0,peakBytes:0,closeScope:'Only this Playwright browser and its owned children; no TTS, BASE or unrelated process signals.'});
    sampleMemory();if(memoryFailure)throw memoryFailure;
    memoryTimer=setInterval(sampleMemory,500);
  }
  server=http.createServer((req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}if(req.url!=='/auditorio.html'){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(original);});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const url=`http://127.0.0.1:${server.address().port}/auditorio.html`;
  const pw=process.env.PLAYWRIGHT_MODULE||'playwright';const {chromium}=await import(pw.startsWith('/')?pathToFileURL(pw).href:pw);
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--autoplay-policy=no-user-gesture-required']});report.browser=browser.version();
  if(memoryFailure){await closeOwnedBrowser();throw memoryFailure;}
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});await context.addInitScript(observeNativeMedia);
  page=await context.newPage();page.setDefaultTimeout(60000);
  page.on('pageerror',e=>report.errors.push({text:e.message}));page.on('console',m=>{if(m.type()==='error')report.errors.push({text:m.text(),location:m.location()});});
  page.on('requestfailed',r=>report.failedRequests.push({url:r.url(),error:r.failure()}));page.on('request',r=>{if(/^https?:/.test(r.url())&&r.url()!==url&&!r.url().endsWith('/favicon.ico'))report.extraRequests.push(r.url());});
  await page.goto(url,{waitUntil:'load'});await page.waitForSelector('.take');await page.waitForLoadState('networkidle');await context.setOffline(true);report.offlineDuringAllPlayback=true;
  assert.equal(await page.locator('audio').count(),1);assert.equal(await page.locator('#list .take').count(),provenance.availableWholeDialogues);
  assert((await page.locator('.progress').textContent()).includes(provenance.availableWholeDialogues+'/412'));
  const samples=data.characters.map(person=>{
    const candidates=data.rows.filter(row=>row.available&&row.person===person.id&&row.text.length>=80&&row.text.split(/\s+/).length>=13).sort((a,b)=>a.duration-b.duration);
    assert(candidates.length,'diálogo completo representativo para '+person.id);
    const paragraphs=row=>row.text.split(/\n\s*\n/).filter(part=>part.trim()).length;
    const preferred=candidates.filter(row=>paragraphs(row)>=2);
    if(full)assert(preferred.length,'el modo final exige introducción y dos párrafos completos para '+person.id);
    const chosen=(preferred.length?preferred:candidates)[0];
    return {...chosen,paragraphCount:paragraphs(chosen),preferredIntroBody:preferred.length>0};
  });
  async function playFull(row,label,button=null){
    const before=await page.evaluate(()=>window.__listeningQA.plays.length);
    await page.locator(button||`[data-play="${row.id}"]`).click();
    await page.waitForFunction(n=>{const r=window.__listeningQA.plays[n];return r?.nativeEnded&&r.mp3SHA256&&r.nativeSourceSHA256;},before,{timeout:row.duration*1000+15000});
    const actual=await page.evaluate(n=>window.__listeningQA.plays.slice(n),before);assert.equal(actual.length,1,'una sola reproducción del cuerpo completo');assertComplete(actual[0],row);
    const sample={person:row.person,id:row.id,label,text:row.text,paragraphCount:row.paragraphCount,preferredIntroBody:row.preferredIntroBody,sha256:row.sha256,actual:actual[0],nativeChecks:'passed'};
    report.samples.push(sample);save();
    sample.displayed={player:await assertDisplayedFull(row,'#current-text'),card:await assertDisplayedFull(row,`#list [data-id="${row.id}"] .take-text`)};
    save();console.log(`PASS ${label}: ${row.person}, cuerpo completo ${actual[0].duration.toFixed(2)} s nativos, ${row.paragraphCount} párrafos.`);
  }
  for(const row of samples)await playFull(row,row.person);
  const available=data.rows.filter(row=>row.available),last=samples.at(-1);
  const navigation=samples.find(row=>{const index=available.findIndex(x=>x.id===row.id);return index>0&&index<available.length-1;});
  assert(navigation,'selección con anterior y siguiente reales');const navigationIndex=available.findIndex(row=>row.id===navigation.id),adjacent=available[navigationIndex+1];
  async function startPartial(row,selector){const before=await page.evaluate(()=>window.__listeningQA.plays.length);await page.locator(selector||`[data-play="${row.id}"]`).click();await page.waitForFunction(n=>{const r=window.__listeningQA.plays[n];return r?.nativePlaying&&r.mp3SHA256&&r.nativeSourceSHA256&&r.playFulfilled;},before);const actual=await page.evaluate(n=>window.__listeningQA.plays[n],before);assertSource(actual,row);return {index:before,actual};}
  if(last.id!==navigation.id){await startPartial(navigation);await page.locator('#stop').click();}
  await startPartial(adjacent,'#next');await page.locator('#stop').click();await assertDisplayedFull(adjacent,'#current-text');
  await startPartial(navigation,'#previous');await page.locator('#stop').click();
  await playFull(navigation,'repeat-complete','#repeat');
  const control=samples.find(row=>row.duration>=9)||samples[0];
  await startPartial(control);const audio=page.locator('#player');await page.waitForFunction(()=>document.getElementById('player').currentTime>.35);await audio.focus();await audio.press('Space');await page.waitForFunction(()=>document.getElementById('player').paused);
  const pausedAt=await audio.evaluate(el=>el.currentTime);await page.waitForTimeout(400);assert(Math.abs(await audio.evaluate(el=>el.currentTime)-pausedAt)<.05);
  await audio.press('ArrowRight');await page.waitForFunction(t=>document.getElementById('player').currentTime>t+.1,pausedAt);const seekAt=await audio.evaluate(el=>el.currentTime);
  await audio.press('Space');await page.waitForFunction(()=>!document.getElementById('player').paused);await page.locator('#stop').click();
  const stop=await page.evaluate(()=>({paused:document.getElementById('player').paused,time:document.getElementById('player').currentTime,continuous:document.getElementById('continuous').checked,text:document.getElementById('current-text').textContent,plays:window.__listeningQA.plays.length}));assert.equal(stop.paused,true);assert.equal(stop.time,0);assert.equal(stop.continuous,false);assert.equal(whitespaceOnly(stop.text),whitespaceOnly(control.text));await assertDisplayedFull(control,'#current-text');await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>window.__listeningQA.plays.length),stop.plays);
  report.nativeControls={pausedAt,seekAt,stop,interaction:'Espacio y flecha derecha sobre controles nativos; Detener es el botón real.'};
  const first=samples[0],second=samples[1];await startPartial(first);await page.waitForFunction(()=>document.getElementById('player').currentTime>.2);const rapid=await startPartial(second);await page.locator('#stop').click();report.rapidChange={first:first.id,second:second.id,secondActual:rapid.actual};
  let queue=null;
  for(const person of data.characters){const list=available.filter(row=>row.person===person.id);for(let i=0;i<list.length-1;i++){const pair={person:person.id,first:list[i],second:list[i+1]};if(!queue||pair.first.duration<queue.first.duration)queue=pair;}}
  assert(queue);await page.selectOption('#person',queue.person);await page.check('#continuous');
  const qBefore=await page.evaluate(()=>window.__listeningQA.plays.length);await page.locator(`[data-play="${queue.first.id}"]`).click();
  await page.waitForFunction(n=>{const a=window.__listeningQA.plays[n],b=window.__listeningQA.plays[n+1];return a?.nativeEnded&&a.mp3SHA256&&a.nativeSourceSHA256&&b?.nativePlaying&&b.mp3SHA256&&b.nativeSourceSHA256&&b.playFulfilled;},qBefore,{timeout:queue.first.duration*1000+15000});
  const pair=await page.evaluate(n=>window.__listeningQA.plays.slice(n,n+2),qBefore);assertComplete(pair[0],queue.first);assertSource(pair[1],queue.second);assert(pair[1].at>=pair[0].endedAt,'siguiente fuente sólo empieza tras ended auténtico');await page.locator('#stop').click();assert.equal(await page.isChecked('#continuous'),false);report.queue={first:queue.first.id,second:queue.second.id,actual:pair,secondStoppedAfterTransition:true};
  await page.selectOption('#person','');await page.selectOption('#emotion','');await page.fill('#search','');await page.check('#show-pending');assert.equal(await page.locator('#list .take').count(),412);
  const pending=data.rows.find(row=>!row.available);report.pending={applicable:!!pending};if(pending){const button=page.locator(`[data-play="${pending.id}"]`);assert(await button.isDisabled());report.pending.id=pending.id;report.pending.disabled=true;}
  const filterPerson=samples.find(row=>row.person==='treasury')||samples[0];await page.selectOption('#person',filterPerson.person);await page.selectOption('#emotion',filterPerson.mood);
  const query=filterPerson.name.normalize('NFD').replace(/\p{M}/gu,'').toUpperCase();await page.fill('#search',query);
  const filtered=data.rows.filter(row=>row.person===filterPerson.person&&row.mood===filterPerson.mood&&normalized(row.name+' '+row.title+' '+row.text).includes(normalized(query)));assert.equal(await page.locator('#list .take').count(),filtered.length);report.filters={person:filterPerson.person,emotion:filterPerson.mood,query,matches:filtered.length};
  await page.fill('#search',filterPerson.main||filterPerson.text);assert.equal(await page.locator('#list .take').count(),1);await page.selectOption('#emotion','');await page.uncheck('#show-pending');assert.equal(await page.locator('#list .take').count(),1);
  // Móvil muestra una sola ficha y el reproductor, sin capturar miles de líneas.
  await startPartial(filterPerson);await page.locator('#stop').click();
  for(const width of [390,320]){await page.setViewportSize({width,height:844});const dimensions=await page.evaluate(()=>({viewport:innerWidth,document:document.scrollingElement.scrollWidth}));assert(dimensions.document<=width+1);
    for(const selector of ['#person','#emotion','#search','#previous','#repeat','#next','#stop','#player','[data-play]']){const element=page.locator(selector);await element.scrollIntoViewIfNeeded();const box=await element.boundingBox();assert(box.width>=44&&box.height>=44);assert(await element.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el||el.contains(hit);}),selector+' accesible');}
    await page.screenshot({path:path.join(out,`mobile-${width}.png`),animations:'disabled',fullPage:true});report.mobile.push({width,dimensions});}
  const native=await page.evaluate(()=>window.__listeningQA);report.native=native;assert.equal(new Set(native.plays.map(row=>row.mediaIdentity)).size,1);assert(native.events.every(event=>event.trusted));assert.deepEqual(native.synth,[]);assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);assert.deepEqual(report.extraRequests,[]);
  sampleMemory();if(memoryFailure)throw memoryFailure;
  report.status=full?'full-listening-sample-pass':'partial-listening-sample-pass';
}catch(error){report.status='fail';report.failure=(memoryFailure||error).stack||String(memoryFailure||error);if(memoryFailure&&error!==memoryFailure)report.memoryGuard.interruptedOperationError=error.stack||String(error);try{if(page&&!page.isClosed())report.native=await page.evaluate(()=>window.__listeningQA);}catch(captureError){report.nativeCaptureError=String(captureError);}process.exitCode=1;console.error(report.failure);}finally{
  clearInterval(memoryTimer);
  try{await closeOwnedBrowser();report.browserClosed=!browser||!browser.isConnected();}
  catch(error){report.status='fail';report.browserCleanupError=error.stack||String(error);process.exitCode=1;}
  finally{if(server)await new Promise(resolve=>server.close(resolve));report.finishedAt=new Date().toISOString();save();}
}
