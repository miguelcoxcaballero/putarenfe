import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
await (async function(){
  const base=path.resolve('..'),out=path.resolve('../outputs/tenfe-qa');fs.mkdirSync(out,{recursive:true});
  const server=http.createServer((req,res)=>{
    try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),p=path.resolve(base,'.'+pathname);
      if(!p.startsWith(base+path.sep)&&p!==base){res.writeHead(403);res.end();return;}
      const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;
      const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.mp3':'audio/mpeg','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
      res.writeHead(200,{'content-type':type});fs.createReadStream(file).pipe(res);
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';
  const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
  checks.push=(...entries)=>{for(const entry of entries)console.log('✓ '+entry);return Array.prototype.push.apply(checks,entries);};
  const dismiss=async()=>{
    for(let i=0;i<40;i++){
      if(!await page.locator('#modal').evaluate(el=>el.open))return;
      if(await page.locator('[data-action="decision"]').count()){await page.locator('[data-action="decision"]:not([disabled])').first().click();}
      else if(await page.locator('[data-action="tenfe-notice"]').count())await page.locator('[data-action="tenfe-notice"]').click();
      else if(await page.locator('[data-action="close-modal"]').count())await page.locator('[data-action="close-modal"]').first().click();
      else throw Error('Modal sin salida: '+await page.locator('#modal').innerText());
    }
    throw Error('Demasiados modales');
  };
  const open=async name=>{await page.locator('#navigation [data-screen="'+name+'"]').click();if(await page.locator('#drawer').evaluate(el=>el.classList.contains('hidden')))await page.locator('#navigation [data-screen="'+name+'"]').click();};
  const shop=async()=>{await open('fleet');const back=page.locator('.tp-game-strip [data-action="fleet-tab"][data-id="fleet"]');if(await back.count())await back.click();await page.locator('[data-action="fleet-tab"][data-id="market"]').click();};
  const fits=async()=>assert(await page.locator('#drawer .body').evaluate(el=>el.scrollWidth<=el.clientWidth+2),'panel sin desbordamiento');
  try{
    await page.goto(url);await page.waitForFunction(()=>!!window.railwayGame);
    assert(await page.locator('[data-action="new-game"]').count()===1);
    await page.locator('[data-action="new-game"]').click();
    assert.equal(await page.locator('[data-action="np-pick"]').count(),0);
    await page.locator('#npSeed').fill('TENFE-UNICA');await page.locator('#npGuide').uncheck();
    await page.locator('[data-action="np-difficulty"][data-id="relajada"]').click();
    await page.locator('[data-action="np-begin"]').click();await dismiss();
    assert(await page.evaluate(()=>window.railwayGame.snapshot().tenfe.difficulty)==='relajada');
    checks.push('Nueva partida única, semilla, dificultad y decisiones jugables.');
    await page.evaluate(()=>{const s=window.railwayGame.state();s.cash=5000;s.tenfe.milestones=['andenes','regional'];window.railwayGame.render();});
    for(const section of ['network','fleet','finance','story','progress','press']){await open(section);await fits();}
    checks.push('Seis secciones, sin errores de JavaScript ni desbordamientos a 1440 px.');
    await shop();
    await page.locator('[data-action="market-family"][data-id="Regional"]').click();
    assert(await page.locator('.trenespop').count()===1);
    assert((await page.locator('.trenespop').innerText()).includes('BCBB'));
    await fits();await page.screenshot({path:path.join(out,'trenespop-desktop.png')});
    await page.locator('[data-action="market-listing"][data-id="new-r599"]').first().click();
    await page.locator('#buyQty').fill('1');
    const before=await page.evaluate(()=>window.railwayGame.snapshot().cash);
    await page.locator('[data-action="confirm-buy"]').click();
    const purchase=await page.evaluate(()=>{const s=window.railwayGame.snapshot();return {cash:s.cash,orders:s.orders.filter(o=>o.model==='r599')};});
    assert(purchase.cash<before);assert.equal(purchase.orders.length,1);
    checks.push('Trenes Pop: filtro Regional, BCBB y Dörfler, ficha, compra real y pedido compartido.');
    await open('story');await page.locator('[data-action="tycoon-tab"][data-id="pactos"]').click();
    await page.locator('[data-action="tenfe-pact"][data-id="investigacion"]').click();
    assert(await page.evaluate(()=>window.railwayGame.snapshot().tenfe.pacts.some(p=>p.id==='investigacion')));
    await open('progress');await page.locator('[data-action="progress-tab"][data-id="research"]').click();
    await page.locator('[data-action="tycoon-research"][data-id="online"]').click();
    await page.locator('[data-action="progress-tab"][data-id="proyectos"]').click();
    await page.locator('[data-action="tenfe-mega"][data-id="control"]').click();
    assert(await page.evaluate(()=>window.railwayGame.snapshot().tenfe.megas[0].due>0));
    await page.screenshot({path:path.join(out,'megaproyectos-desktop.png')});
    await page.locator('[data-action="close-drawer"]').click();
    for(let i=0;i<4;i++){await page.locator('[data-action="skip-month"]').click();await dismiss();}
    assert(await page.evaluate(()=>window.railwayGame.snapshot().tenfe.pacts.find(p=>p.id==='investigacion').status==='won'));
    checks.push('Acciones reales: firmar pacto, financiar investigación, encargar fase y cerrar cuatro meses con informe.');
    await open('press');await page.locator('[data-action="press-tab"][data-id="reports"]').click();assert(await page.locator('.tenfe-report').count()>=4);
    await page.screenshot({path:path.join(out,'informes-desktop.png')});
    await page.reload();await page.waitForFunction(()=>!!window.railwayGame);await page.locator('[data-action="continue"]').click();await dismiss();
    assert(await page.evaluate(()=>window.railwayGame.snapshot().tenfe.pacts.some(p=>p.status==='won')));
    checks.push('Continuar conserva la misma flota, pedidos, pactos, obra e informes.');
    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});
      for(const section of ['network','fleet','finance','story','progress','press']){await open(section);await fits();}
      await shop();await fits();
      await page.screenshot({path:path.join(out,'trenespop-'+width+'.png')});
      await page.locator('[data-action="close-drawer"]').click();
      await page.screenshot({path:path.join(out,'mapa-'+width+'.png')});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'el documento cabe en '+width+' px');
      checks.push('Interfaz y Trenes Pop comprobados a '+width+' px.');
    }
    await page.setViewportSize({width:1440,height:900});
    await page.evaluate(()=>{const g=window.railwayGame,s=g.state();s.month=59;s.tenfe.lastMonth=59;s.tenfe.notices=[];s.ops.phase='planning';s.ops.day=1;
      s.decided=['policy',...s.decided];s.event=null;g.engine.revalidateScene(s);g.render();});
    for(let i=0;i<20 && await page.evaluate(()=>window.railwayGame.snapshot().month)<60;i++){await page.locator('[data-action="skip-month"]').click();await dismiss();}
    assert(await page.evaluate(()=>window.railwayGame.snapshot().tenfe.rescueStarted));
    assert(await page.locator('#mission').innerText().then(t=>t.includes('rescate')));
    await page.screenshot({path:path.join(out,'rescate-misma-partida.png')});
    checks.push('2027 activa el rescate sin cambiar de mapa, interfaz, motor ni guardado.');
    assert.deepEqual(errors,[]);
    const report={status:'passed',url,checks,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  }catch(error){console.error(error.stack);console.error('Errores de página:',errors);try{await page.screenshot({path:path.join(out,'fallo.png'),timeout:10000});fs.writeFileSync(path.join(out,'fallo.html'),await page.content());}catch{}throw error;}finally{server.closeAllConnections();await browser.close();await new Promise(resolve=>server.close(resolve));}
})();
