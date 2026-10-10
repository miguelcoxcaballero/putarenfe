// Verifica el mapa jugable y la voz nativa desde los controles de una partida nueva.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const root=path.resolve('..'),out=path.resolve('../outputs/tenfe-qa');
fs.mkdirSync(out,{recursive:true});
const release=JSON.parse(fs.readFileSync('../release.json')),takes=new Map(release.recordings.map(x=>[x.id,x]));
const errors=[],checks=[],samples=[];
const server=http.createServer((req,res)=>{try{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);res.end();return;}
 const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;
 res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=process.env.GAME_TEST_URL||'http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
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
const screenshot=async(p,name)=>{await p.screenshot({path:path.join(out,name+'.png')});const b=await p.screenshot({type:'jpeg',quality:55});console.log('QA_IMAGE:'+name+':'+b.toString('base64'));};
const start=async page=>{
 await page.goto(url);await page.waitForFunction(()=>!!window.railwayGame);
 await page.locator('[data-action="new-game"]').click();await page.locator('#npSeed').fill('MAPA-VOCES');
 await page.locator('#npGuide').uncheck();await page.locator('[data-action="np-difficulty"][data-id="relajada"]').click();
 await page.locator('[data-action="np-begin"]').click();await page.locator('[data-action="welcome-close"]').click();
};
const waitVoice=async(page,index)=>{await page.waitForFunction(i=>window.__audioQA.starts.length>i,index,{timeout:45000});
 await page.waitForFunction(i=>!!window.__audioQA.starts[i].decode?.sha256,index);
 const sample=await page.evaluate(i=>window.__audioQA.starts[i],index),take=takes.get(sample.id);
 assert(take,'la voz corresponde a una grabación canónica');assert.equal(sample.mode,'dialogue');
 assert.equal(sample.rate,1);assert.equal(sample.detune,0);assert.equal(sample.context,'running');
 assert(sample.rms>.00001&&sample.peak>.0001);assert.equal(sample.decode.sha256,take.sha256);
 assert(Math.abs(sample.duration-take.duration)<.2);samples.push(sample);return sample;
};
let page;
try{
 const context=await browser.newContext({viewport:{width:1440,height:960}});await context.addInitScript(observe);
 page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
 await start(page);assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);
 assert.equal(await page.locator('#network-board').count(),0);assert(await page.locator('#map').isVisible());
 await page.waitForFunction(()=>window.railwayGame.map.cityPoints?.length>19);
 const before=await page.evaluate(()=>{const g=window.railwayGame,m=g.map;return {routes:g.state().routes.length,cities:m.cityPoints.length,zoom:m.zoom,pixels:Array.from(m.caches.base.getContext('2d').getImageData(0,0,m.caches.base.width,m.caches.base.height).data).filter((_,i)=>i%512===0)};});
 assert(before.routes>19);assert(before.cities>19);
 const fitting=await page.evaluate(()=>{const m=window.railwayGame.map,f=m.opts.getViewport();return m.opts.getCities().filter(c=>['mad','bcn','aco','mal','cad','sev'].includes(c.id)).map(c=>({id:c.id,p:m.project(c.lon,c.lat),f}));});assert(fitting.length>=5);assert(fitting.every(c=>c.p[0]>=c.f.left&&c.p[0]<=c.f.right&&c.p[1]>=c.f.top&&c.p[1]<=c.f.bottom),'capitales y sur dentro de la vista sin paneles encima');assert(new Set(before.pixels).size>10,'el mapa dibuja geografía, relieve y vías');
 await screenshot(page,'mapa-inicial');
 await page.locator('#zoomIn').click();assert(await page.evaluate(z=>window.railwayGame.map.zoom>z,before.zoom));
 await page.locator('#resetMap').click();assert.equal(await page.evaluate(()=>window.railwayGame.map.zoom),before.zoom);
 const point=await page.evaluate(()=>window.railwayGame.map.cityPoints.find(c=>c.id==='mad'));
 assert(point);const box=await page.locator('#map').boundingBox();await page.mouse.click(box.x+point.x,box.y+point.y);
 await page.waitForFunction(()=>document.querySelector('#inspector .city-title')?.textContent.includes('Madrid'));
 assert(await page.locator('#inspector [data-action="route"]').count()>0);await page.locator('[data-action="close-inspector"]').click();
 for(const layer of ['gauge','power','speed','works','network']){
  await page.locator('.map-layers summary').click();await page.locator('[data-layer="'+layer+'"]').click();
  assert.equal(await page.evaluate(()=>window.railwayGame.map.layer),layer);assert(await page.locator('#map').isVisible());
 }
 check('Mapa geográfico visible al entrar: red completa, ciudades pulsables, zoom y cinco capas funcionan.');
 await page.locator('#navigation [data-screen="story"]').click();
 assert(await page.locator('.desk-decision .say-btn').isVisible());
 const first=await waitVoice(page,0);assert.equal(first.where,'council');
 assert(await page.locator('.desk-decision .say-s.on').count()>0);assert.equal(await page.locator('.desk-decision .say-btn').getAttribute('aria-pressed'),'true');
 await screenshot(page,'consejo-con-voz');
 const count=await page.evaluate(()=>window.__audioQA.starts.length);await page.evaluate(()=>window.railwayGame.render());
 await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.__audioQA.starts.length),count,'redibujar no reinicia ni duplica la conversación');
 await page.locator('.desk-decision .say-btn').click();assert.equal(await page.evaluate(()=>window.railwayGame.voices.speaking),null);
 await page.locator('.desk-decision .say-btn').click();await waitVoice(page,count);
 await page.waitForFunction(i=>window.__audioQA.starts[i].ended,count,{timeout:Math.ceil(first.duration*1000)+15000});
 await page.waitForFunction(()=>!window.railwayGame.voices.speaking);
 assert.equal(await page.locator('.desk-decision .say-btn').getAttribute('aria-pressed'),'false');
 await page.evaluate(()=>window.railwayGame.voices.toggle());
 const manual=await page.evaluate(()=>window.__audioQA.starts.length);
 await page.locator('.desk-decision .say-btn').click();await waitVoice(page,manual);
 await page.evaluate(()=>window.railwayGame.render());await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>window.__audioQA.starts.length),manual+1,'escuchar tras silenciar no duplica la lectura al redibujar');
 await page.locator('.desk-decision .say-btn').click();
 check('Consejo: audio MP3 completo y PCM real, texto resaltado, detener, repetir y fin nativo sin cambio de tono ni velocidad.');
 const heard=new Set(samples.map(x=>x.person));
 const decisions=async()=>{for(let i=0;i<15;i++){
  const b=page.locator('.desk-decision [data-action="decision"]:not([disabled])');
  if(!await b.count())return;
  const count=await page.evaluate(()=>window.__audioQA.starts.length);
  if(await page.evaluate(()=>!!window.railwayGame.voices.speaking)&&!await page.evaluate(()=>window.railwayGame.voices.source))await waitVoice(page,count);
  const active=await page.evaluate(()=>window.__audioQA.starts.at(-1));if(active)heard.add(active.person);
  await b.first().click();
 }throw Error('Consejo sin salida');};
 await decisions();await page.locator('[data-action="close-drawer"]').click();
 await page.locator('[data-action="day-start"]').click();await page.waitForFunction(()=>window.railwayGame.state().ops.phase==='running');
 await page.evaluate(()=>{const g=window.railwayGame;g.pause();const trip=g.plan().filter(t=>t.arrival-t.dep>15).sort((a,b)=>Math.abs((a.dep+a.arrival)/2-720)-Math.abs((b.dep+b.arrival)/2-720))[0];if(!trip)throw Error('No hay salidas jugables');window.__movingMinute=Math.round((trip.dep+trip.arrival)/2);g.setMinute(window.__movingMinute);});
 await page.waitForFunction(()=>window.railwayGame.map.trainPoints.length>0);
 const trains=await page.evaluate(()=>window.railwayGame.map.trainPoints.map(t=>({...t})));await screenshot(page,'mapa-trenes');
 await page.evaluate(()=>window.railwayGame.setMinute(window.__movingMinute+5));await page.waitForTimeout(200);
 assert(await page.evaluate(old=>window.railwayGame.map.trainPoints.some(t=>{const p=old.find(x=>x.id===t.id);return p&&Math.hypot(t.x-p.x,t.y-p.y)>.1;}),trains),'los trenes avanzan según el reloj de la operación');
 await page.locator('[data-action="day-end"]').click();await page.locator('#modal [data-action="day-next"]').click();
 check('Trenes sobre la vía geográfica: posición vinculada al reloj, avance real y cierre de jornada.');
 for(let turn=0;turn<8;turn++){
  if(await page.locator('#modal [data-action="decision"]:not([disabled])').count()){
   await page.locator('#modal [data-action="decision"]:not([disabled])').first().click();continue;
  }
  await page.evaluate(()=>{const g=window.railwayGame;g.navigate('story');});
  if(!await page.locator('.desk-decision').count()&&!await page.locator('.game-event').count())await page.evaluate(()=>window.railwayGame.navigate('story'));
  const voiceCount=await page.evaluate(()=>window.__audioQA.starts.length);
  if(await page.locator('.desk-decision').count()){
   if(await page.evaluate(()=>!!window.railwayGame.voices.speaking&&!window.railwayGame.voices.source)){
    const x=await waitVoice(page,voiceCount);heard.add(x.person);
   }
   await decisions();
  }
  const ev=page.locator('.game-event [data-action="game-event"]:not([disabled])');
  if(await ev.count())await ev.first().click();
  if(await page.locator('.desk-decision').count())await decisions();
  if(await page.locator('[data-action="close-drawer"]').isVisible())await page.locator('[data-action="close-drawer"]').click();
  await page.locator('#daybar [data-action="skip-month"]').click();
 }
 assert(heard.size>=2,'conversaciones de distintos personajes durante los turnos');
 assert.equal(await page.evaluate(()=>window.railwayGame.voices.lastError),null);
 assert.deepEqual(await page.evaluate(()=>window.__audioQA.system),[]);
 check('Conversaciones del motor durante varios turnos, distintas voces y sucesos ilustrados conservados.');
 await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844}});await mobile.addInitScript(observe);
 page=await mobile.newPage();page.on('pageerror',e=>errors.push(e.message));await start(page);
 assert(await page.locator('#map').isVisible());await page.locator('#navigation [data-screen="story"]').click();
 await waitVoice(page,0);assert(await page.locator('.desk-decision .say-btn').isVisible());
 assert(await page.locator('#drawer .body').evaluate(e=>e.scrollWidth<=e.clientWidth+2));
 await screenshot(page,'consejo-movil');await page.locator('.desk-decision .say-btn').click();
 await page.locator('[data-action="close-drawer"]').click();await page.reload();await page.waitForFunction(()=>!!window.railwayGame);
 await page.locator('[data-action="continue"]').click();assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);
 assert(await page.locator('#map').isVisible());assert.equal(await page.locator('#network-board').count(),0);
 check('Móvil: mapa, conversación con controles visibles, voz nativa y continuación sin ventana inicial forzada.');
 await mobile.close();assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'mapa-voces-report.json'),JSON.stringify({status:'passed',checks,samples,errors},null,2));
}catch(error){if(page&&!page.isClosed())await screenshot(page,'fallo-mapa-voces').catch(()=>{});
 fs.writeFileSync(path.join(out,'mapa-voces-report.json'),JSON.stringify({status:'failed',checks,samples,errors,error:error.stack},null,2));throw error;
}finally{await browser.close();await new Promise(r=>server.close(r));}
