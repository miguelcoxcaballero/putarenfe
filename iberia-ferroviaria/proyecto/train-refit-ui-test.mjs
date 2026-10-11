import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const root=path.resolve('..'),out=path.resolve('../outputs/tenfe-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);res.end();return;}const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=process.env.GAME_TEST_URL||('http://127.0.0.1:'+server.address().port+'/');
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[],checks=[];
const check=m=>{checks.push(m);console.log('✓ '+m);};
const screenshot=async(page,name)=>{await page.screenshot({path:path.join(out,name+'.png')});console.log('QA_IMAGE:'+name+':'+(await page.screenshot({type:'jpeg',quality:40})).toString('base64'));};
const decode=async(page,selector)=>{await page.locator(selector).evaluateAll(async imgs=>{await Promise.all(imgs.map(async img=>{const view=new Image();view.src=img.src;await view.decode();if(view.naturalWidth!==1536||view.naturalHeight!==1024)throw Error('Imagen de interior incompleta: '+img.src);}));});};
const snap=page=>page.evaluate(()=>window.railwayGame.snapshot());
const noOverflow=async page=>assert(await page.locator('#drawer .body').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'el taller cabe en su ventana');
let active;
try{
 for(const size of [{width:1440,height:960},{width:390,height:844}]){
  const context=await browser.newContext({viewport:size}),page=await context.newPage();active=page;page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>!!window.railwayGame);
  await page.locator('[data-action="new-game"]').click();await page.locator('#npSeed').fill('REFORMAS-QA');await page.locator('#npGuide').uncheck();await page.locator('[data-action="np-difficulty"][data-id="relajada"]').click();await page.locator('[data-action="np-begin"]').click();await page.locator('[data-action="welcome-close"]').click();
  await page.locator('#navigation [data-screen="fleet"]').click();await page.locator('#drawer .tabs [data-action="fleet-tab"][data-id="refits"]').click();
  await decode(page,'.refit-lots img');await noOverflow(page);await screenshot(page,'reformas-'+size.width);
  await page.locator('[data-action="refit-view"][data-id="catalogue"]').click();assert.equal(await page.locator('.refit-catalogue article').count(),14);assert.equal(await page.locator('.refit-catalogue img').count(),28);await decode(page,'.refit-catalogue img');await noOverflow(page);
  if(size.width===1440){
   const response=await page.request.get(new URL('assets/interiores/manifest.json?v=6.4.0',url).href);assert(response.ok());const manifest=await response.json();
   assert.equal(manifest.version,'6.4.0');assert.equal(manifest.references.length,12);assert.equal(manifest.sources.length,26);assert.equal(manifest.images.length,28);
   const images=await page.locator('.refit-catalogue img').evaluateAll(imgs=>imgs.map(img=>({url:img.src,model:img.dataset.model,interior:img.dataset.interior})));
   await Promise.all(images.map(async img=>{const record=manifest.images.find(r=>r.model===img.model&&r.interior===img.interior);assert(record);assert.equal(new URL(img.url).searchParams.get('v'),record.sha256.slice(0,12),'la caché identifica la imagen actual');const response=await page.request.get(img.url);assert(response.ok());assert.equal(createHash('sha256').update(await response.body()).digest('hex'),record.sha256,'fotografía publicada exacta: '+img.model);}));
   check('28 imágenes actuales a 1536 × 1024, procedencia y caché verificadas por SHA-256');
  }
  const beforeCatalogue=JSON.stringify(await snap(page));
  for(const id of ['r465','r599','r592','rdorf','rbcbb','s100','s112','s103','s106f','av2030','s120','s130','s730','s106v']){
   await page.locator('[data-action="interior-preview"][data-id="'+id+'"]').click();await decode(page,'#modal .refit-photo');assert.equal(await page.locator('#modal [data-action="refit-confirm"]').count(),0);
   const slider=page.locator('#modal [data-refit-slider]');await slider.evaluate(el=>{el.value='73';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await page.locator('#modal .refit-scene').evaluate(el=>el.style.getPropertyValue('--refit-split')),'73%');
   assert(await page.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'comparador sin desbordamiento');
   await page.locator('#modal .refit-references summary').click();assert(await page.locator('#modal .refit-references a').first().getAttribute('href'));assert((await page.locator('#modal .refit-references').innerText()).includes('Fotografía de referencia:'));
   if(id==='s106f'||(size.width===1440&&['r465','r599','rdorf','rbcbb','s130'].includes(id)))await screenshot(page,'interior-'+id+'-'+size.width);
   await page.locator('#modal [data-action="close-modal"]').click();
  }
  assert.equal(JSON.stringify(await snap(page)),beforeCatalogue,'ver y deslizar interiores no gasta ni modifica trenes');check('14 parejas visibles y comparador en '+size.width);
  await page.locator('[data-action="refit-view"][data-id="workshop"]').click();
  const s=await snap(page),lot=await page.evaluate(()=>{const api=window.railwayGame;return api.state().fleet.find(f=>api.engine.available(api.state(),f)>=2).id;});
  await page.locator('[data-action="refit-detail"][data-id="'+lot+'"]').click();await decode(page,'#modal .refit-photo');await page.locator('#refitQty').fill('2');assert.equal(await page.locator('[data-action="refit-confirm"]').isDisabled(),false);
  const q=await page.evaluate(id=>window.railwayGame.engine.refurbishQuote(window.railwayGame.state(),id,2),lot);
  await page.locator('#refitQty').fill(String(q.free+1));assert(await page.locator('[data-action="refit-confirm"]').isDisabled());assert.equal(JSON.stringify(await snap(page)),JSON.stringify(s));
  await page.locator('#refitQty').fill('2');await screenshot(page,'reforma-confirmar-'+size.width);
  await page.locator('[data-action="refit-confirm"]').click();const after=await snap(page);assert.equal(after.refits.length,s.refits.length+1);assert.equal(after.cash,s.cash-q.total);assert.equal(after.fleet.find(x=>x.id===lot).qty,s.fleet.find(x=>x.id===lot).qty-2);assert.deepEqual(after.routes,s.routes);
  await page.reload();await page.waitForFunction(()=>!!window.railwayGame);await page.locator('[data-action="continue"]').click();await page.locator('[data-action="welcome-close"]').click();assert.equal((await snap(page)).refits.at(-1).qty,2);
  await page.evaluate(()=>{const api=window.railwayGame,s=api.state();for(let i=0;i<5;i++){
   if(s.tenfe.game.event){const e=api.campaign.EVENTS.find(x=>x.id===s.tenfe.game.event.id);api.campaign.decide(s,e.id,e.choices.findIndex(x=>x.cost<=s.cash));}
   let d,n=0;while((d=api.engine.pendingDecision(s))){if(++n>100)throw Error('Consejo en bucle');api.engine.decide(s,d.id,d.choices.findIndex(x=>!x.disabled&&(x.cost||0)<=s.cash));}
   if(!api.engine.step(s))throw Error('El turno no avanzó');
  }api.render();});
  const complete=await snap(page),job=complete.refits.at(-1),returned=complete.fleet.find(f=>f.origin==='Reforma '+job.id);assert(job.done);assert.equal(returned.qty,2);assert.equal(returned.condition,98);assert(returned.interiorRefitted);
  await page.evaluate(()=>window.railwayGame.navigate('fleet'));await page.locator('#drawer .tabs [data-action="fleet-tab"][data-id="refits"]').click();
  const card=page.locator('.refit-lots article').filter({has:page.locator('[data-action="refit-detail"][data-id="'+returned.id+'"]')});assert.equal(await card.locator('img').getAttribute('data-interior'),'reformado');
  await decode(page,'.refit-lots img');check('cotización, confirmación, guardado y retorno con interior renovado en '+size.width);
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'reformas-ui.json'),JSON.stringify({ok:true,checks},null,2));console.log('REFORMAS_UI_OK '+checks.length);
}catch(error){if(active&&!active.isClosed())await screenshot(active,'fallo-reformas');throw error;}finally{await browser.close();await new Promise(r=>server.close(r));}
