
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const root=path.resolve('..'),out=path.resolve('../outputs/tenfe-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);res.end();return;}
 const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;
 res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=process.env.GAME_TEST_URL||'http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});

import {MESSAGES} from './dist/narration-data.js';
import {clipId} from './dist/voice.js';
const release=JSON.parse(fs.readFileSync('../release.json')),takes=new Map(release.narration.recordings.map(t=>[t.id,t]));
const errors=[],checks=[],samples=[];
const check=s=>{checks.push(s);console.log('✓ '+s);};
function observe(){
 localStorage.setItem('iberia-musica',JSON.stringify({enabled:false}));
 localStorage.setItem('iberia-efectos',JSON.stringify({enabled:false}));
 localStorage.setItem('iberia-voz',JSON.stringify({enabled:true,volume:.73}));
 const qa=window.__audioQA={starts:[],decodes:[],system:[]},decoded=new WeakMap();
 const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const decode=BaseAudioContext.prototype.decodeAudioData;
 BaseAudioContext.prototype.decodeAudioData=function(bytes,...args){
  const row={bytes:bytes.byteLength};qa.decodes.push(row);hash(bytes.slice(0)).then(x=>row.sha256=x);
  const result=decode.call(this,bytes,...args);result?.then?.(b=>{row.duration=b.duration;decoded.set(b,row);});return result;
 };
 const start=AudioBufferSourceNode.prototype.start;
 AudioBufferSourceNode.prototype.start=function(...args){
  const v=window.railwayGame?.voices;
  if(v?.source===this){const b=this.buffer,pcm=b.getChannelData(0);let sq=0,peak=0,n=0;
   for(let i=0;i<pcm.length;i+=16){sq+=pcm[i]*pcm[i];peak=Math.max(peak,Math.abs(pcm[i]));n++;}
   const row={id:v.speaking.dialogueId,person:v.speaking.person,mode:v.speaking.mode,where:v.speaking.where,duration:b.duration,rate:this.playbackRate.value,detune:this.detune.value,context:this.context.state,rms:Math.sqrt(sq/n),peak,decode:decoded.get(b),ended:false};
   qa.starts.push(row);this.addEventListener('ended',()=>row.ended=true,{once:true});
  }
  return start.apply(this,args);
 };
 if(window.speechSynthesis){const speak=speechSynthesis.speak;speechSynthesis.speak=function(u){qa.system.push(u.text);return speak.call(this,u);};}
}

const start=async(page,guide=false)=>{
 await page.goto(url);await page.waitForFunction(()=>!!window.railwayGame);
 await page.locator('[data-action="new-game"]').click();await page.locator('#npSeed').fill('VOCES-DEL-EQUIPO');
 if(!guide)await page.locator('#npGuide').uncheck();
 await page.locator('[data-action="np-difficulty"][data-id="relajada"]').click();await page.locator('[data-action="np-begin"]').click();
};
const heard=async(page,key,after=0)=>{
 const id=clipId(MESSAGES[key].person,MESSAGES[key].text);
 await page.waitForFunction(({id,after})=>window.__audioQA.starts.slice(after).some(x=>x.id===id&&x.decode?.sha256),{id,after},{timeout:60000});
 const sample=await page.evaluate(({id,after})=>window.__audioQA.starts.slice(after).find(x=>x.id===id),{id,after}),take=takes.get(id);
 assert.equal(sample.person,MESSAGES[key].person);assert.equal(sample.mode,'dialogue');
 assert.equal(sample.rate,1);assert.equal(sample.detune,0);assert.equal(sample.context,'running');
 assert(sample.rms>.00001&&sample.peak>.0001);assert.equal(sample.decode.sha256,take.sha256);
 assert(Math.abs(sample.duration-take.duration)<.2);samples.push(sample);return sample;
};
const fit=async(page,selector)=>{
 for(const box of await page.locator(selector).all()){
  const r=await box.evaluate(e=>({w:e.clientWidth,scroll:e.scrollWidth,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}));
  assert(r.scroll<=r.w+2,selector+' has no horizontal overflow');
  assert(r.left>=-1&&r.right<=page.viewportSize().width+1,selector+' stays inside viewport');
 }
};
const screenshot=async(page,name)=>{const bytes=await page.screenshot({type:'jpeg',quality:55});fs.writeFileSync(path.join(out,name+'.jpg'),bytes);console.log('QA_IMAGE:'+name+':'+bytes.toString('base64'));};
let page;
try{
 for(const size of [{width:1440,height:960},{width:390,height:844}]){
  const context=await browser.newContext({viewport:size});await context.addInitScript(observe);page=await context.newPage();
  page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push(e.message));
  await start(page);await heard(page,'welcome');
  assert.equal(await page.locator('#entry-welcome .narration-speaker strong').textContent(),'Raquel Sanz');
  await fit(page,'#entry-welcome');await screenshot(page,'narracion-bienvenida-'+size.width);
  await page.locator('#entry-welcome [data-action="narration-replay"]').click();
  await page.waitForFunction(()=>!window.railwayGame.voices.speaking);
  assert.equal(await page.locator('#entry-welcome').count(),1,'replay/stop keeps the welcome visible');
  const index=await page.evaluate(()=>window.__audioQA.starts.length);
  await page.locator('#entry-welcome [data-action="narration-replay"]').click();await heard(page,'welcome',index);
  await page.locator('[data-action="welcome-close"]').click();await page.waitForFunction(()=>!window.railwayGame.voices.speaking);
  const before=await page.evaluate(()=>window.railwayGame.snapshot());
  await page.evaluate(()=>window.railwayGame.narrator.toast('Material enviado al taller.'));
  await heard(page,'refit-started');assert.equal(await page.locator('#toast .narration-speaker strong').textContent(),'Fermín Bogie');
  await fit(page,'.narration-toast');await screenshot(page,'narracion-taller-'+size.width);
  assert.deepEqual(await page.evaluate(()=>window.railwayGame.snapshot()),before,'listening never changes the economy');
  await page.locator('#toast [data-action="narration-dismiss"]').click();await page.waitForFunction(()=>!window.railwayGame.voices.speaking);
  await page.evaluate(()=>window.railwayGame.narrator.toast('No hay caja suficiente.',{error:true}));
  await heard(page,'error-money');assert.equal(await page.locator('#toast .narration-speaker strong').textContent(),'Charo Tijera');
  await page.evaluate(()=>window.railwayGame.voices.toggle());await page.waitForFunction(()=>!window.railwayGame.voices.speaking);
  const muted=await page.evaluate(()=>window.__audioQA.starts.length);
  await page.evaluate(()=>window.railwayGame.narrator.toast('Investigación financiada.'));
  await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.__audioQA.starts.length),muted);
  await page.locator('#toast [data-narration-key="research-funded"] [data-action="narration-replay"]').click();
  await heard(page,'research-funded',muted);assert(await page.evaluate(()=>window.railwayGame.voices.enabled));
  await page.evaluate(()=>window.railwayGame.narrator.reset());
  await page.locator('#navigation [data-screen="story"]').click();
  // Real event cards keep their whole bodies and choices.
  await page.evaluate(()=>{const g=window.railwayGame;g.state().tenfe.game.event={id:'evento-auditoria'};g.render();});
  assert.equal(await page.locator('.game-event').count(),1);
  {
   const key=await page.locator('.game-event').getAttribute('data-narration-key');
   assert(MESSAGES[key]);assert.equal(await page.locator('.game-event .narration-card [data-say]').getAttribute('data-say'),MESSAGES[key].text);
   await page.locator('.game-event [data-action="narration-replay"]').click();await heard(page,key);
   await page.evaluate(()=>window.railwayGame.narrator.reset());
  }
  await page.evaluate(()=>window.railwayGame.voices.stop());
  // Confirm an actual refit: its success message must survive the dialog closing.
  await page.evaluate(()=>{const g=window.railwayGame;g.narrator.reset();g.state().cash=1000;g.state().tenfe.game.event=null;});
  await page.locator('#navigation [data-screen="fleet"]').click();
  await page.locator('[data-action="fleet-tab"][data-id="refits"]').click();
  const freeId=await page.evaluate(()=>{const g=window.railwayGame,s=g.state();return s.fleet.find(f=>g.engine.available(s,f)>0)?.id;});assert(freeId,'a free unit can actually be renovated');
  const button=page.locator('[data-action="refit-detail"][data-id="'+freeId+'"]');assert(await button.count());
  await button.click();await heard(page,'refit-info');
  const cashBefore=await page.evaluate(()=>window.railwayGame.state().cash);
  const refitIndex=await page.evaluate(()=>window.__audioQA.starts.length);
  await page.locator('[data-action="refit-confirm"]').click();
  assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);
  await heard(page,'refit-started',refitIndex);
  assert(await page.evaluate(before=>window.railwayGame.state().cash<before,cashBefore),'the actual refit is charged once');
  assert.equal(await page.locator('#toast .narration-card[data-narration-key="refit-started"]').count(),1,'confirmation survives closing the workshop');
  await page.locator('#toast [data-action="narration-dismiss"]').click();
  assert.deepEqual(await page.evaluate(()=>window.__audioQA.system),[]);
  await context.close();
 }
 check('Desktop and mobile: native welcome audio, portraits, full MP3 bytes, replay/stop, dismiss, financial errors and persistent mute.');
 const context=await browser.newContext({viewport:{width:1440,height:960}});await context.addInitScript(observe);page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));await start(page,true);await heard(page,'guide-welcome');
 assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);
 assert.equal(await page.locator('#tour-shades i').count(),4);assert.equal(await page.locator('.induction-task,.induction-question').count(),0);
 await page.locator('#coach [data-action="tutorial-next"]').click();await heard(page,'guide-network');
 const renders=await page.evaluate(()=>window.__audioQA.starts.length);await page.evaluate(()=>window.railwayGame.render());await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>window.__audioQA.starts.length),renders,'repainting never restarts the guide');
 await fit(page,'#coach');await screenshot(page,'narracion-guia');
 await page.locator('[data-action="tutorial-skip"]').click();await heard(page,'guide-paused');
 assert.equal(await page.locator('#coach,#tour-shades').count(),0);
 await context.close();
 check('Guide talks over actual highlighted game panels; redraw deduplicates speech and pause cancels the previous explanation.');
 // Decode every extra recording through Chromium, including every cast member and every event.
 const auditContext=await browser.newContext(),audit=await auditContext.newPage();await audit.goto(url);
 const pcm=await audit.evaluate(async rows=>{
  const ctx=new AudioContext(),results=[];
  for(const row of rows){const response=await fetch(row.url);if(!response.ok)throw Error(row.url+' HTTP '+response.status);const b=await ctx.decodeAudioData(await response.arrayBuffer()),v=b.getChannelData(0);let sq=0,n=0;
   for(let i=0;i<v.length;i+=24){if(!Number.isFinite(v[i]))throw Error('Nonfinite PCM '+row.id);sq+=v[i]*v[i];n++;}
   results.push({id:row.id,duration:b.duration,rms:Math.sqrt(sq/n),person:row.person});
  }await ctx.close();return results;
 },release.narration.recordings);
 assert.equal(pcm.length,takes.size);assert(pcm.every(x=>x.rms>.00001));assert.equal(new Set(pcm.map(x=>x.person)).size,9);
 await auditContext.close();check('Every '+pcm.length+' extra whole recording decodes to finite audible PCM; all nine characters are present.');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'narracion-informe.json'),JSON.stringify({status:'passed',url,checks,samples,errors,decoded:pcm},null,2));
}catch(error){if(page&&!page.isClosed())await screenshot(page,'fallo-narracion').catch(()=>{});throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
