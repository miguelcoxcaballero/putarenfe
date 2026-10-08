// Native audio QA for the standalone nine-character audition page.
// PLAYWRIGHT_MODULE=/path/to/index.mjs node voice-audition-ui-test.mjs
// TARGET_HTML/TARGET_URL/MANIFEST_PATH/OUT override the final 3.6.2 defaults.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const target=path.resolve(process.env.TARGET_HTML||path.join(root,'../outputs/Iberia-Ferroviaria-voces-3.6.2.html'));
const url=process.env.TARGET_URL||pathToFileURL(target).href;
const manifestPath=path.resolve(process.env.MANIFEST_PATH||path.join(root,'../investigacion/voces/audiciones-3.6.2/manifest.json'));
const out=path.resolve(process.env.OUT||path.join(root,'../investigacion/verificacion-audiciones-3.6.2'));
const resultPath=process.env.RESULT_JSON||path.join(out,'resultado.json');
const expected=process.env.EXPECTED_TAKES?Number(process.env.EXPECTED_TAKES):9;
assert(Number.isInteger(expected)&&expected>=1&&expected<=9,'EXPECTED_TAKES válido');
const fixture=process.env.FIXTURE_ONLY==='1';
const source=fs.readFileSync(target,'utf8');
const match=source.match(/const SAMPLES = (.+);\r?\nconst NAMES/);assert(match,'catálogo de audio embebido');
const samples=JSON.parse(match[1]),scripts=JSON.parse(fs.readFileSync(path.join(root,'tools/voice_audition_scripts.json'),'utf8')).samples;
assert.equal(new Set(samples.map(item=>item.id)).size,samples.length,'IDs únicos');
assert.equal(new Set(samples.map(item=>item.person)).size,samples.length,'una toma larga por personaje');
if(expected===9)assert.deepEqual(samples.map(item=>item.person).sort(),scripts.map(item=>item.person).sort(),'los nueve personajes del reparto tienen audio real');
assert.equal(samples.length,expected);const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));for(const item of samples){const take=manifest.takes[item.id];assert(take,'toma presente en el manifest: '+item.id);assert.equal(take.validated,true,'toma técnicamente validada');assert.equal(take.person,item.person,'personaje del audio validado');const bytes=Buffer.from(item.audio.split(',',2)[1],'base64');assert.equal(createHash('sha256').update(bytes).digest('hex'),take.sha256,'SHA exacto del MP3 embebido');}
for(const item of samples){const text=scripts.find(script=>script.person===item.person);assert.equal(item.text,text.text);assert.equal(item.text.split(/\n\s*\n/).length,2);}
const modulePath=process.argv[2]||process.env.PLAYWRIGHT_MODULE||'playwright';
const {chromium}=await import(modulePath.startsWith('/')?pathToFileURL(modulePath).href:modulePath);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--autoplay-policy=no-user-gesture-required']});
const errors=[],result={target,url,html_sha256:createHash('sha256').update(source).digest('hex'),manifest:manifestPath,manifest_sha256:createHash('sha256').update(fs.readFileSync(manifestPath)).digest('hex'),fixture_only:fixture,expected_takes:expected,human_listening:false,viewports:[]};
const sha=value=>createHash('sha256').update(value).digest('hex');
async function reaches(page,selector){const control=page.locator(selector);await control.scrollIntoViewIfNeeded();assert(await control.evaluate(el=>{const rect=el.getBoundingClientRect(),hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);return hit===el||el.contains(hit);}),selector+' libre de solapamientos');}
async function play(page,index){await page.click(`[data-play="${samples[index].id}"]`);await page.waitForFunction(id=>{const a=document.getElementById('auditionPlayer'),b=document.querySelector(`[data-play="${id}"]`);return !a.paused&&a.readyState>=3&&b.getAttribute('aria-pressed')==='true';},samples[index].id);const data=await page.evaluate(()=>{const a=document.getElementById('auditionPlayer');return {src:a.src,duration:a.duration,playing:[...document.querySelectorAll('audio')].filter(x=>!x.paused).length};});assert.equal(data.playing,1);assert(Number.isFinite(data.duration)&&data.duration>0);assert.equal(sha(Buffer.from(data.src.split(',',2)[1],'base64')),sha(Buffer.from(samples[index].audio.split(',',2)[1],'base64')));return data;}
try{
 for(const [label,viewport] of [['desktop',{width:1440,height:900}],['mobile390',{width:390,height:844}],['mobile320',{width:320,height:844}]]){
  const context=await browser.newContext({viewport,...(label.startsWith('mobile')?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{})});
  await context.route('**/favicon.ico',route=>route.fulfill({status:204}));const page=await context.newPage();page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(label+': '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push(label+': '+m.text());});
  await page.addInitScript(()=>{window.voiceUiAudit={speech_calls:0,play_calls:0,max_concurrent_audio:0};const speak=window.speechSynthesis?.speak.bind(window.speechSynthesis);if(speak)window.speechSynthesis.speak=function(u){window.voiceUiAudit.speech_calls++;return speak(u);};const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.voiceUiAudit.play_calls++;return play.apply(this,args);};document.addEventListener('play',()=>{window.voiceUiAudit.max_concurrent_audio=Math.max(window.voiceUiAudit.max_concurrent_audio,[...document.querySelectorAll('audio')].filter(a=>!a.paused).length);},true);});
  if(url.startsWith('file:')&&!fixture)await context.setOffline(true);
  await page.goto(url);
  assert.equal(await page.locator('.character-card').count(),9);assert.equal(await page.locator('audio').count(),1);assert.equal(await page.locator('.cards blockquote p').count(),18);for(const script of scripts){const paragraphs=page.locator('#person-'+script.person+' blockquote p');assert.equal(await paragraphs.count(),2);assert.deepEqual(await paragraphs.allTextContents(),script.paragraphs);}if(!fixture){assert.equal(await page.locator('.character-card .pending:not(.provisional)').count(),9-samples.length,'sólo faltan las tomas sin audio');assert.equal(await page.locator('.character-card .provisional').count(),samples.filter(sample=>sample.provisional).length,'referencias provisionales señaladas aunque el audio esté completo');await context.setOffline(true);}
  assert(await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1),'sin desplazamiento horizontal');
  for(const item of samples){
   const paragraphs=page.locator(`[data-take="${item.id}"] blockquote p`);assert.equal(await paragraphs.count(),2);assert.deepEqual(await paragraphs.allTextContents(),item.text.split(/\n\s*\n/));
   for(let i=0;i<2;i++){await paragraphs.nth(i).scrollIntoViewIfNeeded();assert(await paragraphs.nth(i).evaluate(el=>{const style=getComputedStyle(el),r=el.getBoundingClientRect();return style.overflow!=='hidden'&&r.width>0&&r.height>0;}),'párrafo visible sin truncar');}
   const button=`[data-play="${item.id}"]`;await reaches(page,button);assert((await page.locator(button).getAttribute('aria-label')).length<80,'etiqueta de reproducción concisa');
  }
  for(let index=0;index<samples.length;index++){await play(page,index);await page.waitForFunction(()=>document.getElementById("auditionPlayer").currentTime>=.2&&!document.getElementById("auditionPlayer").paused);}
  const first=await play(page,0);if(!fixture)await page.waitForFunction(()=>document.getElementById('auditionPlayer').currentTime>=3&&!document.getElementById('auditionPlayer').paused);await page.click(`[data-play="${samples[0].id}"]`);assert(await page.evaluate(()=>document.getElementById('auditionPlayer').paused),'pausa nativa');const pausedTime=await page.evaluate(()=>document.getElementById('auditionPlayer').currentTime);await page.waitForTimeout(200);assert(Math.abs(await page.evaluate(()=>document.getElementById('auditionPlayer').currentTime)-pausedTime)<.02,'la pausa detiene el avance');await play(page,0);assert(await page.evaluate(()=>document.getElementById('auditionPlayer').currentTime)>=pausedTime-.02,'reanudar conserva el punto de escucha');
  if(samples.length>1){await play(page,1);assert.equal(await page.locator('[data-play][aria-pressed=true]').count(),1,'una muestra activa');}
  await page.evaluate(()=>{document.getElementById('auditionPlayer').currentTime=2;});
  const current=samples[Math.min(1,samples.length-1)];await page.click(`[data-sequence="${current.person}"]`);await page.waitForFunction(()=>{const a=document.getElementById('auditionPlayer');return !a.paused&&a.currentTime<1;});
  await reaches(page,'[data-control=stop]');await page.click('[data-control=stop]');assert(await page.evaluate(()=>{const a=document.getElementById('auditionPlayer');return a.paused&&!a.hasAttribute('src');}));assert.equal(await page.locator('#nowTitle').textContent(),'Elige un personaje');
  await page.click('[data-sequence=all]');await page.waitForFunction(()=>document.getElementById('auditionPlayer').readyState>=3&&!document.getElementById('auditionPlayer').paused);
  assert.equal(await page.locator('#sequencePosition').textContent(),samples.length>1?'1 / '+samples.length:'');
  if(samples.length>1){await page.evaluate(()=>{const a=document.getElementById('auditionPlayer');a.currentTime=a.duration-.08;});await page.waitForFunction(total=>document.getElementById('sequencePosition').textContent==='2 / '+total,samples.length);await page.click('[data-control=previous]');await page.waitForFunction(total=>document.getElementById('sequencePosition').textContent==='1 / '+total,samples.length);await page.click('[data-control=next]');await page.waitForFunction(total=>document.getElementById('sequencePosition').textContent==='2 / '+total,samples.length);}
  await page.click('[data-control=stop]');const audit=await page.evaluate(()=>window.voiceUiAudit);assert.equal(audit.speech_calls,0);assert.equal(audit.max_concurrent_audio,1);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,label+'.png'),animations:'disabled',timeout:60000});
  result.viewports.push({label,width:viewport.width,paragraphs:18,audit,first_duration:first.duration,offline_playback:!fixture,real_audio_samples:samples.length});await context.close();
 }
 assert.deepEqual(errors,[]);result.passed=true;result.errors=errors;fs.writeFileSync(resultPath,JSON.stringify(result,null,2));console.log(`✓ ${fixture?'FIXTURE UI (audio antiguo, no audición Qwen): ':''}${samples.length} muestras, dos párrafos por muestra, escritorio/móvil390/320, un solo audio, pausa/repetición/detención y secuencia; sin SpeechSynthesis ni errores JavaScript.`);
}catch(e){result.passed=false;result.errors=errors;result.failure=e.message;fs.writeFileSync(resultPath,JSON.stringify(result,null,2));throw e;}finally{await browser.close();}
