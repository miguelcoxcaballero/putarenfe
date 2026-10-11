import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const root=path.resolve('..'),out=path.resolve('../outputs/audio-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(p!==root&&!p.startsWith(root+path.sep))throw Error('path');const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=process.env.GAME_TEST_URL||'http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
function observe(){
 const connect=AudioNode.prototype.connect,taps=new WeakMap();
 window.__outputTaps=taps;window.__audioErrors=[];
 window.addEventListener('unhandledrejection',e=>window.__audioErrors.push(String(e.reason)));
 AudioNode.prototype.connect=function(dest,...rest){
  const result=connect.call(this,dest,...rest);
  if(dest===this.context.destination){
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
  return{rms:Math.sqrt(sq/pcm.length),peak,bytes:bytes.byteLength,duration:buf.duration,state:ctx.state,musicEnabled:g.music.enabled,musicVolume:g.music.volume,musicReady:g.music.current?.ready,musicPosition:g.music.position,voiceEnabled:g.voices.enabled,sfxEnabled:g.sfx.enabled};
 };
}
const reports=[];
try{
 for(const method of ['pointer','keyboard']){
  const context=await browser.newContext();await context.addInitScript(observe);const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE_ERROR:'+e.message);});await page.goto(url);await page.waitForFunction(()=>!!window.railwayGame);
  if(method==='pointer')await page.locator('[data-action="new-game"]').click();
  else {await page.locator('[data-action="new-game"]').focus();await page.keyboard.press('Enter');}
  await page.waitForTimeout(7000);
  const menu=await page.evaluate(()=>recordOutput(3));
  await page.locator('#npGuide').uncheck();await page.locator('[data-action="np-difficulty"][data-id="relajada"]').click();await page.locator('[data-action="np-begin"]').click();
  await page.waitForTimeout(2000);const welcome=await page.evaluate(()=>recordOutput(4));
  reports.push({method,menu,welcome,errors,unhandled:await page.evaluate(()=>window.__audioErrors)});
  console.log(JSON.stringify(reports.at(-1)));await context.close();
 }
 fs.writeFileSync(path.join(out,'diagnostico.json'),JSON.stringify(reports,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}