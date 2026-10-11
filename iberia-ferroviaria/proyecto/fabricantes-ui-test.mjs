// Inspect the actual Trenes Pop cards and details, including freshly served image bytes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const root=path.resolve('..'),out=path.resolve('../outputs/tenfe-qa');
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);res.end();return;}
 const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;
 res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=process.env.GAME_TEST_URL||'http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],checks=[];let active;
const screenshot=async(page,name)=>{const b=await page.screenshot({type:'jpeg',quality:65});fs.writeFileSync(path.join(out,name+'.jpg'),b);console.log('QA_IMAGE:'+name+':'+b.toString('base64'));};
const loadImage=async(locator,photo)=>{
 await locator.waitFor({state:'visible'});
 const result=await locator.evaluate(async img=>{
  await img.decode();
  const r=await fetch(img.src);if(!r.ok)throw Error('HTTP '+r.status);
  const bytes=await r.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);
  return {src:img.src,width:img.naturalWidth,height:img.naturalHeight,hidden:img.hidden,sha256:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')};
 });
 assert.deepEqual([result.width,result.height],[1536,1024]);
 assert.equal(result.hidden,false,'la foto propia no ha caído en su sustituto');
 assert.equal(new URL(result.src).pathname.endsWith('/'+photo.url),true);
 assert.equal(new URL(result.src).searchParams.get('v'),manifest.version);
 assert.equal(result.sha256,photo.sha256,'la web sirve la edición actual: '+photo.id);
 return result.src;
};
let manifest;
try{
const response=await fetch(new URL('assets/fabricantes/manifest.json',url));
assert(response.ok,'procedencia publicada');manifest=await response.json();
assert.equal(manifest.version,JSON.parse(fs.readFileSync('dist/assets/fabricantes/manifest.json')).version);
 for(const size of [{width:1440,height:960},{width:390,height:844}]){
  const context=await browser.newContext({viewport:size});
  await context.addInitScript(()=>{localStorage.setItem('iberia-musica',JSON.stringify({enabled:false}));localStorage.setItem('iberia-efectos',JSON.stringify({enabled:false}));});
  const page=await context.newPage();active=page;page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>!!window.railwayGame);
  await page.locator('[data-action="new-game"]').click();await page.locator('#npSeed').fill('FABRICANTES-QA');await page.locator('#npGuide').uncheck();
  await page.locator('[data-action="np-difficulty"][data-id="relajada"]').click();await page.locator('[data-action="np-begin"]').click();await page.locator('[data-action="welcome-close"]').click();
  await page.locator('#navigation [data-screen="fleet"]').click();await page.locator('[data-action="fleet-tab"][data-id="market"]').click();
  const before=await page.evaluate(()=>{const s=window.railwayGame.snapshot();return {cash:s.cash,fleet:s.fleet,routes:s.routes,orders:s.orders};});
  for(const photo of manifest.photos){
   const maker=photo.id==='dorfler'?'Dörfler':'BCBB',ids=photo.id==='dorfler'?['new-rdorf','new-dorfler-s120']:['new-rbcbb','new-bcbb-s103'];
   await page.locator('#marketMaker').selectOption(maker);
   for(const id of ids){
    const card=page.locator('.tp-card[data-listing="'+id+'"]');await card.waitFor({state:'visible'});
    await card.scrollIntoViewIfNeeded();
    const thumb=card.locator('.tp-photo img:not([hidden])').first(),src=await loadImage(thumb,photo);
    await card.locator('[data-action="market-listing"]').first().click();
    assert.equal(await loadImage(page.locator('.tp-detail-photo img:not([hidden])').first(),photo),src,'misma foto en miniatura y ficha');
    assert(await page.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'ficha sin desbordamiento');
    if(id===ids[0])await screenshot(page,'fabricante-'+photo.id+'-'+size.width);
    await page.locator('#modal [data-action="close-modal"]').click();
   }
   assert(await page.locator('#drawer .body').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'catálogo sin desbordamiento');
   checks.push(maker+': ambos anuncios, miniatura, ficha y SHA actual en '+size.width+' px');console.log('✓ '+checks.at(-1));
  }
  const after=await page.evaluate(()=>{const s=window.railwayGame.snapshot();return {cash:s.cash,fleet:s.fleet,routes:s.routes,orders:s.orders};});
  assert.deepEqual(after,before,'ver fotos no modifica la partida');
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'fabricantes-ui.json'),JSON.stringify({ok:true,checks},null,2));console.log('FABRICANTES_UI_OK '+checks.length);
}catch(error){if(active&&!active.isClosed())await screenshot(active,'fallo-fabricantes');throw error;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
