import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium,firefox,webkit} from 'playwright';
const engines={chromium,firefox,webkit},base='https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/';
function levels(file){
 const b=fs.readFileSync(file);let p=12,data;while(p+8<b.length){const n=b.readUInt32LE(p+4);if(b.toString('ascii',p,p+4)==='data'){data=b.subarray(p+8,Math.min(b.length,p+8+n));break;}p+=8+n+(n%2);}
 let sq=0,peak=0;for(let i=0;i+1<data.length;i+=2){const x=data.readInt16LE(i)/32768;sq+=x*x;peak=Math.max(peak,Math.abs(x));}return{rms:Math.sqrt(sq/(data.length/2)),peak};
}
async function record(page,label,stimulus){
 const file='/tmp/'+label+'.wav',p=spawn('ffmpeg',['-nostdin','-loglevel','error','-y','-f','pulse','-i','tenfe.monitor','-t','4','-ac','2','-ar','48000',file]);
 const done=new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',code=>code===0?resolve():reject(Error('ffmpeg '+code)));});
 if(stimulus){await page.waitForTimeout(600);await stimulus();}
 await done;return levels(file);
}
for(const [name,engine] of Object.entries(engines)){
 let browser,context;
 try{
 browser=await engine.launch({headless:false,ignoreDefaultArgs:['--mute-audio'],...(name==='chromium'?{args:['--autoplay-policy=user-gesture-required','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
 context=await browser.newContext();const page=await context.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push([r.url(),r.status()]);});
 await page.goto(base+'?diagnose='+Date.now());await page.waitForFunction(()=>!!window.railwayGame);
 await page.locator('[data-action="new-game"]').click();
 await page.waitForFunction(()=>window.railwayGame.music.current?.ready,{timeout:45000});await page.waitForTimeout(1800);
 const music=await record(page,name+'-music');
 await page.locator('#npGuide').uncheck();await page.locator('[data-action="np-difficulty"][data-id="relajada"]').click();await page.locator('[data-action="np-begin"]').click();
 await page.waitForFunction(()=>!!window.railwayGame.voices.source,{timeout:30000});
 await page.evaluate(()=>{window.railwayGame.music.toggle();});await page.waitForTimeout(1800);
 const voices=await record(page,name+'-voices');
 await page.evaluate(()=>{window.railwayGame.voices.stop();});await page.waitForTimeout(1200);
 const sfx=await record(page,name+'-sfx',()=>page.evaluate(()=>window.railwayGame.sfx.play('departure')));
 const state=await page.evaluate(()=>{const g=window.railwayGame;return{ctx:g.music.ctx.state,clock:g.music.ctx.currentTime,lastError:String(g.music.lastError),voiceError:g.voices.lastError,audioSession:navigator.audioSession?.type};});
 console.log('BROWSER_AUDIO:'+JSON.stringify({name,music,voices,sfx,state,errors,missing}));
 }catch(e){console.log('BROWSER_FAILED:'+name+': '+e.stack);}
 finally{await context?.close();await browser?.close();}
}
