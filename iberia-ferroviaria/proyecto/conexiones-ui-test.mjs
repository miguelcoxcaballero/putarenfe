
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
const url='http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[],pages=[];
const check=s=>{checks.push(s);console.log('✓ '+s);};
const open=async(page,name)=>{await page.locator('#navigation [data-screen="'+name+'"]').click();if(await page.locator('#drawer').evaluate(el=>el.classList.contains('hidden')))await page.locator('#navigation [data-screen="'+name+'"]').click();};
const saveScreenshot=async(page,name)=>page.screenshot({path:path.join(out,name+'.png'),fullPage:false});
const start=async(page,guide=false)=>{
 await page.goto(url);await page.waitForFunction(()=>!!window.railwayGame);assert.equal(await page.locator('.menu-preview-note').count(),0,'sin aviso de producción al entrar');
 assert.equal(await page.locator('[data-action="new-game"]').count(),1);
 await page.locator('[data-action="new-game"]').click();await page.locator('#npSeed').fill('CONEXIONES-QA');
 if(!guide)await page.locator('#npGuide').uncheck();
 await page.locator('[data-action="np-difficulty"][data-id="relajada"]').click();await page.locator('[data-action="np-begin"]').click();
};
const pendingCouncil=async page=>{
 for(let i=0;i<15;i++){const buttons=page.locator('.desk-decision [data-action="decision"]:not([disabled])');if(!await buttons.count())return;await buttons.first().click();}
 throw Error('El consejo no termina');
};
const closeDialog=async page=>{if(await page.locator('#modal').evaluate(el=>el.open)){const close=page.locator('#modal [data-action="close-modal"]');assert(await close.count());await close.first().click();}};
try{
 for(const size of [{width:1440,height:960},{width:390,height:844}]){
  const context=await browser.newContext({viewport:size}),page=await context.newPage();pages.push(page);page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await start(page);
  assert.equal(await page.locator('#modal').evaluate(el=>el.open),false,'inicio sin decisión forzada ni aviso');
  assert.equal(await page.locator('#entry-welcome').count(),1);assert.equal(await page.locator('#network-board').count(),1);
  const state=await page.evaluate(()=>window.railwayGame.snapshot());assert(state.tenfe.game);assert.equal(state.routes.length,19);
  await saveScreenshot(page,'bienvenida-'+size.width);await page.locator('[data-action="welcome-close"]').click();
  for(const name of ['network','fleet','finance','story','progress','press']){
   await open(page,name);assert(await page.locator('#drawer .body').evaluate(el=>el.scrollWidth<=el.clientWidth+2),'sin desbordamiento en '+name+' a '+size.width);
  }
  await open(page,'progress');await page.locator('[data-action="progress-tab"][data-id="research"]').click();
  assert.equal(await page.locator('.game-research article').count(),18);
  await page.locator('[data-action="game-research"][data-id="cadenciados"]').click();
  assert.equal(await page.evaluate(()=>window.railwayGame.snapshot().tenfe.game.research.id),'cadenciados');
  await page.locator('[data-action="progress-tab"][data-id="proyectos"]').click();assert.equal(await page.locator('.game-megas article').count(),6);await saveScreenshot(page,'proyectos-'+size.width);
  await page.locator('[data-action="tenfe-mega"][data-id="control"]').click();
  assert.equal(await page.evaluate(()=>window.railwayGame.snapshot().tenfe.megas[0].id),'control');
  await open(page,'story');await page.locator('[data-action="tycoon-tab"][data-id="pactos"]').click();
  await page.locator('[data-action="tenfe-pact"][data-id="investigacion"]').click();
  await page.locator('[data-action="tycoon-tab"][data-id="agenda"]').click();await pendingCouncil(page);
  await page.locator('[data-action="close-drawer"]').click();await page.locator('[data-action="skip-month"]').click();
  // A dated encounter may still need one native council decision before the settlement.
  if(await page.locator('#modal [data-action="decision"]').count()){
   for(let i=0;i<10&&await page.locator('#modal [data-action="decision"]').count();i++)await page.locator('#modal [data-action="decision"]:not([disabled])').first().click();
   await page.locator('[data-action="skip-month"]').click();
  }
  await page.waitForFunction(()=>window.railwayGame.snapshot().month===1);
  assert.equal(await page.locator('.game-event').count(),1);assert.equal(await page.locator('.game-event img').evaluate(el=>el.complete&&el.naturalWidth>0),true);
  await saveScreenshot(page,'suceso-'+size.width);
  const oldId=await page.locator('[data-action="game-event"]').first().getAttribute('data-id');
  await page.locator('[data-action="game-event"]:not([disabled])').first().click();assert.equal(await page.evaluate(()=>window.railwayGame.snapshot().tenfe.game.event),null);
  assert(await page.evaluate(id=>window.railwayGame.snapshot().tenfe.game.news.some(x=>x.image===id),oldId));
  await page.evaluate(()=>{const s=window.railwayGame.state();s.cash=10000;window.railwayGame.render();});
  await open(page,'fleet');await page.locator('[data-action="fleet-tab"][data-id="market"]').click();
  assert.equal(await page.locator('.trenespop').count(),1);await saveScreenshot(page,'trenespop-'+size.width);
  await page.locator('[data-action="market-family"][data-id="Regional"]').click();await page.locator('[data-action="market-listing"][data-id="new-r599"]').first().click();
  await page.locator('#buyQty').fill('1');await page.locator('[data-action="confirm-buy"]').click();assert(await page.evaluate(()=>window.railwayGame.snapshot().orders.some(x=>x.model==='r599')));
  await closeDialog(page);
  await page.evaluate(()=>{const api=window.railwayGame;api.navigate('network');api.setLayer('gauge');const s=api.state(),id=Object.keys(s.infra.t).find(id=>s.infra.t[id].b&&s.infra.t[id].g==='ib');api.pick({type:'tramo',id});});
  await page.locator('[data-action="track-designer"]').click();assert.equal(await page.locator('.track-options button').count(),9);
  const before=await page.evaluate(()=>JSON.stringify(window.railwayGame.snapshot()));
  for(const lanes of [1,2,3])for(const g of ['ib','std','mixto'])for(const e of ['no','3kv','25kv']){
   await page.locator('[data-action="track-select"][data-key="lanes"][data-value="'+lanes+'"]').click();
   await page.locator('[data-action="track-select"][data-key="g"][data-value="'+g+'"]').click();
   await page.locator('[data-action="track-select"][data-key="e"][data-value="'+e+'"]').click();
   const selector='.track-proposal .track-photo';
   if(await page.locator(selector).count()){const image=page.locator(selector);assert.equal(await image.getAttribute('data-lanes'),String(lanes));assert.equal(await image.getAttribute('data-gauge'),g);assert.equal(await image.getAttribute('data-power'),e);}
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(window.railwayGame.snapshot())),before,'27 previews no gastan ni cambian estado');
  await page.locator('[data-action="track-select"][data-key="g"][data-value="mixto"]').click();await saveScreenshot(page,'vias-'+size.width);
  const assets=await page.evaluate(async()=>{return await Promise.all([1,2,3].map(async lanes=>{const img=new Image();img.src='assets/vias/via-'+lanes+'.png';await img.decode();return [img.naturalWidth,img.naturalHeight];}));});
  assert(assets.every(([w,h])=>w>=1024&&h>=768),'las tres escenas cargan con resolución útil');
  if(await page.locator('[data-action="track-confirm"]').isEnabled()){await page.locator('[data-action="track-confirm"]').click();assert(await page.evaluate(()=>window.railwayGame.snapshot().projects.some(p=>p.work==='configuration')));}else await closeDialog(page);
  check('Juego nuevo, sucesos ilustrados, laboratorio, 6 obras, pactos, Trenes Pop y 27 previews a '+size.width+' px.');
  await context.close();
 }
 // Exercise the guide through native panels and the ordinary day-report dialogue.
 const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();pages.push(page);page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
 await start(page,true);assert.equal(await page.locator('#modal').evaluate(el=>el.open),false);
 assert.equal(await page.locator('#coach').count(),1);assert.equal(await page.locator('#tour-shades i').count(),4);
 assert.equal(await page.locator('.induction-task,.induction-question').count(),0);
 const next=async()=>{await page.locator('#coach [data-action="tutorial-next"]').click();};
 await saveScreenshot(page,'guia-bienvenida');await next();
 await page.locator('#drawer [data-action="route"][data-id="madrid-valencia"]').first().click();await next();
 await page.locator('#frequency').fill('3');await page.locator('#fare').fill('25');
 await page.locator('#routeForm [type="submit"]').click();await next();
 await pendingCouncil(page);await next();await next();await next();
 assert.equal(await page.locator('#coach').getAttribute('data-step-id'),'infrastructure');
 await page.locator('#routeFleet').selectOption('f2');await page.locator('#frequency').fill('1');
 await page.locator('#routeForm [type="submit"]').click();assert(await page.evaluate(()=>window.railwayGame.snapshot().routes.find(r=>r.id==='madrid-salamanca').active));
 await next();await page.locator('[data-action="day-start"]').click();
 await page.waitForFunction(()=>!!document.querySelector('#drawer [data-action="respond"]'));
 await page.locator('#drawer [data-action="respond"]:not([disabled])').first().click();
 await page.locator('[data-action="day-end"]').click();await page.waitForFunction(()=>document.querySelector('#modal').open);
 assert.equal(await page.locator('#modal .induction-dialog').count(),0);
 assert.equal(await page.locator('#modal #coach').count(),1,'la anotación usa el parte real');
 await page.locator('[data-action="day-next"]').click();await next();
 assert.equal(await page.locator('#coach').getAttribute('data-step-id'),'handoff');
 await page.locator('[data-action="tycoon-public"]').first().click();await next();
 assert.equal(await page.locator('#coach,#tour-shades,#spot').count(),0);
 assert(await page.evaluate(()=>window.railwayGame.snapshot().tutorial.done));
 check('Guía completa sobre paneles reales: plan, consejo, laboratorio, apertura, incidencia, parte ordinario y encargo.');
 await context.close();
 // Mobile guide: focus ring, blur, native form, pause and reload.
 const mobile=await browser.newContext({viewport:{width:390,height:844}}),mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));
 await start(mp,true);await mp.locator('#coach [data-action="tutorial-next"]').click();await mp.locator('#drawer [data-action="route"][data-id="madrid-valencia"]').first().click();await mp.locator('#coach [data-action="tutorial-next"]').click();
 assert(await mp.locator('#frequency').isVisible());assert(await mp.locator('#fare').isVisible());await saveScreenshot(mp,'guia-mobile');
 await mp.locator('[data-action="tutorial-skip"]').click();assert.equal(await mp.locator('#coach,#tour-shades,#spot').count(),0);
 await mp.reload();await mp.waitForFunction(()=>!!window.railwayGame);await mp.locator('[data-action="continue"]').click();
 assert.equal(await mp.locator('#modal').evaluate(el=>el.open),false,'continuar no lanza un aviso ajeno a la guía');
 check('Guía móvil, controles reales visibles, pausa persistente y bienvenida al continuar.');
 await mobile.close();
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'conexiones-ui-report.json'),JSON.stringify({status:'passed',checks,errors},null,2));
}catch(error){for(let i=0;i<pages.length;i++)if(!pages[i].isClosed())await saveScreenshot(pages[i],'fallo-'+i).catch(()=>{});fs.writeFileSync(path.join(out,'conexiones-ui-report.json'),JSON.stringify({status:'failed',checks,errors,error:error.stack},null,2));throw error;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
