import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const root=path.resolve('..'),out=path.resolve('../outputs/audio-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(p!==root&&!p.startsWith(root+path.sep))throw Error('path');const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=process.env.GAME_TEST_URL||'http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({headless:!process.env.AUDIO_SYSTEM_CAPTURE,ignoreDefaultArgs:['--mute-audio'],args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
function observe(){
 const connect=AudioNode.prototype.connect,taps=new WeakMap();
 window.__outputTaps=taps;window.__audioErrors=[];window.__outputEdges=0;const edges=new WeakMap();
 window.addEventListener('unhandledrejection',e=>window.__audioErrors.push(String(e.reason)));
 AudioNode.prototype.connect=function(dest,...rest){
  const result=connect.call(this,dest,...rest);
  if(dest===this.context.destination){
   window.__outputEdges++;edges.set(this.context,(edges.get(this.context)||0)+1);
   let tap=taps.get(this.context);if(!tap){tap=this.context.createMediaStreamDestination();taps.set(this.context,tap);}
   connect.call(this,tap,rest[0]||0);
  }
  return result;
 };
 window.recordOutput=async(seconds=3)=>{
  const g=window.railwayGame,ctx=g.music.ctx,tap=taps.get(ctx);
  if(!tap)return{rms:0,peak:0,bytes:0,state:ctx?.state};
  const rec=new MediaRecorder(tap.stream,{mimeType:'audio/webm;codecs=opus'}),chunks=[];
  rec.ondataavailable=e=>chunks.push(e.data);const done=new Promise(r=>rec.onstop=r);
  rec.start();await new Promise(r=>setTimeout(r,seconds*1000));rec.stop();await done;
  const bytes=await new Blob(chunks).arrayBuffer(),buf=await ctx.decodeAudioData(bytes.slice(0)),pcm=buf.getChannelData(0);let sq=0,peak=0;
  for(const x of pcm){sq+=x*x;peak=Math.max(peak,Math.abs(x));}
  return{rms:Math.sqrt(sq/pcm.length),peak,bytes:bytes.byteLength,duration:buf.duration,state:ctx.state,musicEnabled:g.music.enabled,musicVolume:g.music.volume,musicReady:g.music.current?.ready,musicPosition:g.music.position,outputEdges:edges.get(ctx),voiceEnabled:g.voices.enabled,sfxEnabled:g.sfx.enabled};
 };
}
const reports=[];
function wavLevels(file) {
 const b=fs.readFileSync(file);let offset=12,pcm;
 while(offset+8<=b.length){const size=b.readUInt32LE(offset+4);if(b.toString('ascii',offset,offset+4)==='data'){pcm=b.subarray(offset+8,Math.min(b.length,offset+8+size));break;}offset+=8+size+(size%2);}
 assert(pcm?.length>48000,'la grabación del sistema contiene audio PCM');
 let sum=0,peak=0;for(let i=0;i+1<pcm.length;i+=2){const x=pcm.readInt16LE(i)/32768;sum+=x*x;peak=Math.max(peak,Math.abs(x));}
 return {rms:Math.sqrt(sum/(pcm.length/2)),peak,bytes:b.length};
}
async function capture(page,label,stimulus=null,seconds=3) {
 let hardware=null;
 if(process.env.AUDIO_SYSTEM_CAPTURE){
  const file=path.join(out,label+'.wav');
  hardware=new Promise((resolve,reject)=>{
   const p=spawn('ffmpeg',['-nostdin','-loglevel','error','-y','-f','pulse','-i','tenfe.monitor','-t',String(seconds),'-ac','2','-ar','48000',file]);
   let err='';p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',code=>code===0?resolve(wavLevels(file)):reject(Error('ffmpeg: '+err)));
  });
 }
 const digital=page.evaluate(seconds=>recordOutput(seconds),seconds);
 if(stimulus){await page.waitForTimeout(450);await stimulus();}
 const mix=await digital,system=hardware?await hardware:null;
 const row={label,mix,system};reports.push(row);console.log('AUDIO_CAPTURE:'+JSON.stringify(row));
 assert.equal(mix.state,'running',label+': contexto activo');
 assert.equal(mix.outputEdges,1,label+': una única salida para los tres canales');
 assert(mix.rms>.00005&&mix.peak>.0003,label+': mezcla audible');
 if(system)assert(system.rms>.00005&&system.peak>.0003,label+': salida real del navegador audible en la grabación');
}
const gameReady=page=>page.waitForFunction(()=>window.railwayGame.music.current?.ready&&window.railwayGame.music.ctx.state==='running',null,{timeout:30000});
const voiceReady=page=>page.waitForFunction(()=>!!window.railwayGame.voices.source,null,{timeout:30000});
try{
 for(const method of ['pointer','keyboard','touch']){
  const context=await browser.newContext(method==='touch'?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1440,height:960}});
  await context.addInitScript(observe);const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE_ERROR:'+e.message);});
  await page.goto(url);await page.waitForFunction(()=>!!window.railwayGame);
  const newGame=page.locator('[data-action="new-game"]');
  if(method==='pointer')await newGame.click();
  else if(method==='touch')await newGame.tap();
  else {await newGame.focus();await page.keyboard.press('Enter');}
  await gameReady(page);await page.waitForTimeout(1200);await capture(page,method+'-musica-menu');

  // Una suspensión posterior al primer gesto no puede dejar los tres canales parados.
  await page.evaluate(()=>window.railwayGame.music.ctx.suspend());
  if(method==='touch')await page.locator('#npSeed').tap();
  else {await page.locator('#npSeed').focus();await page.keyboard.press('a');}
  await gameReady(page);await capture(page,method+'-recuperacion');

  await page.locator('#npGuide').uncheck();await page.locator('[data-action="np-difficulty"][data-id="relajada"]').click();
  await page.locator('[data-action="np-begin"]').click();await voiceReady(page);await capture(page,method+'-musica-y-bienvenida');
  if(method==='pointer'){
   await page.evaluate(async()=>{window.__interruptedCtx=window.railwayGame.music.ctx;await window.__interruptedCtx.close();});
   await page.locator('#entry-welcome').click({position:{x:24,y:24}});
   await gameReady(page);await voiceReady(page);
   assert.equal(await page.evaluate(()=>window.railwayGame.voices.source.context===window.railwayGame.music.ctx&&window.railwayGame.music.ctx!==window.__interruptedCtx),true,'la narración continúa en la nueva salida');
   await capture(page,'bienvenida-tras-interrupcion');
  }
  assert.equal(await page.evaluate(()=>window.railwayGame.music.ducked),true);

  if(method==='pointer'){
   // El volumen puede ajustarse mientras narra y mantiene la música atenuada.
   await page.evaluate(()=>window.railwayGame.music.setVolume(.65));
   await page.waitForTimeout(400);
   const duck=await page.evaluate(()=>window.railwayGame.music.master.gain.value);
   assert(Math.abs(duck-.65*.28)<.025,'el ajuste conserva la atenuación durante la voz');

   await page.evaluate(()=>{window.railwayGame.voices.stop();window.railwayGame.music.toggle();});
   await page.waitForTimeout(500);
   await page.locator('#entry-welcome [data-action="narration-replay"]').click();await voiceReady(page);
   await capture(page,'voz-sin-musica');
   assert.equal(await page.evaluate(()=>window.railwayGame.music.enabled),false,'la voz respeta música silenciada');

   await page.evaluate(()=>window.railwayGame.voices.stop());await page.waitForTimeout(1200);
   await capture(page,'efectos-sin-musica-ni-voz',()=>page.evaluate(()=>window.railwayGame.sfx.play('departure')));

   // Seleccionar directamente una pieza tras apagar la música restablece su ganancia.
   await page.evaluate(()=>{const g=window.railwayGame;g.music.play(g.music.pick());});
   await gameReady(page);await page.waitForTimeout(900);await capture(page,'musica-reactivada');
   await page.locator('#entry-welcome [data-action="narration-replay"]').click();await voiceReady(page);
   await capture(page,'tres-canales',()=>page.evaluate(()=>window.railwayGame.sfx.play('celebrate')));
   await page.evaluate(()=>window.railwayGame.voices.stop());await page.waitForTimeout(600);
   assert.equal(await page.evaluate(()=>window.railwayGame.music.ducked),false,'la música recupera su volumen al acabar la voz');
   await capture(page,'musica-tras-dialogo');
   await page.locator('[data-action="welcome-close"]').click();
   await page.locator('#musicBtn').click();
   for(const selector of ['#musicVolume','#voiceVolume','#sfxVolume'])assert.equal(await page.locator(selector).count(),1);
   await page.evaluate(()=>{const g=window.railwayGame;g.voices.enabled=false;g.voices.setVolume(0);g.sfx.enabled=false;g.sfx.setVolume(0);g.music.toggle();g.music.setVolume(0);});
   await page.evaluate(()=>{window.__oldCtx=window.railwayGame.music.ctx;});
   await page.locator('[data-action="audio-reset"]').click();await gameReady(page);
   assert.equal(await page.evaluate(()=>window.__oldCtx!==window.railwayGame.music.ctx&&window.__oldCtx.state==='closed'),true,'restablecer sustituye la salida bloqueada');
   const restored=await page.evaluate(()=>{const g=window.railwayGame;return [g.music.enabled,g.music.volume,g.voices.enabled,g.voices.volume,g.sfx.enabled,g.sfx.volume];});
   assert.deepEqual(restored,[true,.55,true,1,true,.7]);
   await page.waitForTimeout(700);await capture(page,'sonido-restablecido');

   // Cerrar la conexión del dispositivo antes de un gesto dejaba mudos todos los canales.
   await page.evaluate(async()=>{window.__oldCtx=window.railwayGame.music.ctx;await window.__oldCtx.close();});
   await page.locator('[data-action="close-modal"]').click();await gameReady(page);
   assert.equal(await page.evaluate(()=>window.__oldCtx!==window.railwayGame.music.ctx),true);
   assert.equal(await page.evaluate(()=>window.railwayGame.sfx.ctx===window.railwayGame.music.ctx),true);
   assert.equal(await page.evaluate(()=>document.getElementById('modal').open),false,'el clic para cerrar sobrevive a la reconexión');
   await capture(page,'musica-tras-salida-cerrada');
   await page.evaluate(()=>{const ctx=window.railwayGame.music.ctx,t=ctx.currentTime;Object.defineProperty(ctx,'currentTime',{get:()=>t});});
   await page.locator('#musicBtn').click();await page.waitForTimeout(2200);
   assert.equal(await page.evaluate(()=>window.railwayGame.music.needsRestart),true,'detecta una salida cuyo reloj no avanza');
   await page.locator('[data-action="close-modal"]').click();await gameReady(page);
   await capture(page,'musica-tras-reloj-bloqueado');
   await page.evaluate(()=>{window.railwayGame.music.toggle();window.railwayGame.voices.stop();});await page.waitForTimeout(1700);
   await capture(page,'efectos-tras-salida-cerrada',()=>page.evaluate(()=>window.railwayGame.sfx.play('departure')));

  }
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__audioErrors),[]);
  await context.close();
 }
 // Las preferencias corruptas recuperan niveles válidos; el silencio elegido se conserva.
 for(const preferences of [{music:null,voices:{volume:'roto'},sfx:{volume:-5}},{music:{enabled:false,volume:0},voices:{enabled:false,volume:0},sfx:{enabled:false,volume:0}}]){
  const context=await browser.newContext();await context.addInitScript(p=>{
   localStorage.setItem('iberia-musica',JSON.stringify(p.music));localStorage.setItem('iberia-voz',JSON.stringify(p.voices));localStorage.setItem('iberia-efectos',JSON.stringify(p.sfx));
  },preferences);
  const page=await context.newPage();await page.goto(url);await page.waitForFunction(()=>!!window.railwayGame);
  const levels=await page.evaluate(()=>{const g=window.railwayGame;return {music:[g.music.enabled,g.music.volume],voices:[g.voices.enabled,g.voices.volume],sfx:[g.sfx.enabled,g.sfx.volume]};});
  if(preferences.music===null)assert.deepEqual(levels,{music:[true,.55],voices:[true,1],sfx:[true,0]});
  else assert.deepEqual(levels,{music:[false,0],voices:[false,0],sfx:[false,0]});
  await context.close();
 }
 fs.writeFileSync(path.join(out,'salida-audio.json'),JSON.stringify(reports,null,2));
 console.log('PASS: música, voces y efectos audibles en la mezcla y en la grabación; ratón, teclado, táctil y recuperación.');
}finally{
 fs.writeFileSync(path.join(out,'salida-audio.json'),JSON.stringify(reports,null,2));
 await browser.close();await new Promise(r=>server.close(r));
}
