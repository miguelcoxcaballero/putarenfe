#!/usr/bin/env node
// Refresh the publishable game from the editable project, without embedding a
// recording. The builder supplies its verified whole-dialogue URL map later.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

const ownRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const replaceOne=(text,before,after,label)=>{
  assert.equal(text.split(before).length-1,1,label);return text.replace(before,()=>after);
};
export async function refreshGameSource({project=path.join(ownRoot,'proyecto'),source=path.join(ownRoot,'web-source')}={}){
  project=path.resolve(project);source=path.resolve(source);
  const releasePath=path.join(source,'source-release.json');
  const release=JSON.parse(fs.readFileSync(releasePath,'utf8'));
  const catalogueModule=await import(pathToFileURL(path.join(project,'tools/voice_dialogues.mjs')).href);
  const catalogueBytes=Buffer.from(JSON.stringify(catalogueModule.DIALOGUE_CATALOGUE,null,1)+'\n');
  assert.equal(sha(catalogueBytes),release.sourceCatalogueSHA256,
    'dialogue text changed: regenerate and validate its whole recordings before publishing');
  assert.equal(catalogueModule.DIALOGUE_CATALOGUE.length,412);
  const dist=path.join(project,'dist'),sources=[];
  const read=file=>{const bytes=fs.readFileSync(path.join(dist,file));sources.push({file,bytes:bytes.length,sha256:sha(bytes)});return bytes.toString('utf8');};
  const baselineOrder=['assets/geography.js','assets/railways.js','assets/timetable.js','assets/infra.js','data.js','story.js','schedule.js','infra.js','network.js',
    'induction.js','induction-runtime.js','encounters.js','tycoon.js','engine.js','operations.js','map-v3.js','train-art.js','train3d.js','city-art.js','assets/samples-index.js','music.js','assets/voices.js','assets/voice-dialogues.js','voice.js','dialogue-presentation.js','sfx.js','assets/portraits.js','faces.js','tycoon-ui.js','main-menu.js','induction-task-ui.js','app.js'];
  const optionalBefore={'data.js':['brands.js'],'tycoon.js':['marketplace.js'],'engine.js':['verdad.js','rescate-data.js','conexiones.js','tenfe.js','track-preview.js'],'train3d.js':['assets/train-photos.js'],'main-menu.js':['nueva-partida.js'],
    'app.js':['partidas-anteriores.js','conexiones-ui.js','tenfe-ui.js','train-refit.js']};
  const order=baselineOrder.flatMap(file=>[...(optionalBefore[file]||[]).filter(extra=>fs.existsSync(path.join(dist,extra))),file]);
  function bundle(file){
    let text=file==='assets/voices.js'?'export const CLIPS = {};\n':file==='assets/voice-dialogues.js'?'export const DIALOGUES = __WEB_DIALOGUES__;\n':read(file);
    if(file==='main-menu.js'){
      const anchor='<footer class="menu-council">';
      text=replaceOne(text,anchor,'<p class="menu-audio-status">__WEB_PREVIEW_LABEL__ · <a href="dialogos.html">Auditorio</a></p>'+anchor,'menu preview placement');
    }
    if(file==='app.js'){
      const anchor="onerror: () => { clear();toast('No se ha podido reproducir la voz. Puedes seguir leyendo el diálogo o volver a escucharlo.'); }";
      text='let previewMissingNoticeShown = false;\n'+replaceOne(text,anchor,
        "onerror: error => { clear(); if(error.code==='MISSING_RECORDING'){ if(!previewMissingNoticeShown){ previewMissingNoticeShown=true;toast('Esta voz aún está en producción. Puedes seguir jugando con el diálogo escrito.'); } return; } toast('No se ha podido reproducir la voz. Puedes seguir leyendo el diálogo o volver a escucharlo.'); }",'missing voice notice');
    }
    if(file==='voice.js'){
      assert(!/speechSynthesis|SpeechSynthesisUtterance/.test(text),'no browser voice fallback');
      text=replaceOne(text,'const decoded = Promise.resolve().then(() => {','const decoded = Promise.resolve().then(async () => {','decode promise');
      text=replaceOne(text,
        "const entry = (kind === 'D' ? DIALOGUES : CLIPS)[id], data = typeof entry === 'string' ? entry : entry?.src;",
        "const entry = (kind === 'D' ? DIALOGUES : CLIPS)[id];\n      if (entry?.url) {\n        const response = await fetch(new URL(entry.url, document.baseURI));\n        if (!response.ok) throw new Error('No se ha podido descargar la grabación: HTTP ' + response.status);\n        return this.music.ctx.decodeAudioData(await response.arrayBuffer());\n      }\n      const data = typeof entry === 'string' ? entry : entry?.src;",'web URL bytes');
    }
    const dir=path.posix.dirname(file),resolve=spec=>path.posix.normalize(path.posix.join(dir,spec));
    text=text.replace(/^import\s+\*\s+as\s+(\w+)\s+from\s+'([^']+)';?\s*$/gm,(_,name,spec)=>`const ${name} = __m[${JSON.stringify(resolve(spec))}];`);
    text=text.replace(/^import\s+\{([^}]*)\}\s+from\s+'([^']+)';?\s*$/gm,(_,names,spec)=>`const {${names.replace(/\s+as\s+/g,': ')}} = __m[${JSON.stringify(resolve(spec))}];`);
    const exported=new Set();
    text=text.replace(/^export\s+\{([^}]*)\};?\s*$/gm,(_,names)=>{names.split(',').map(x=>x.trim()).filter(Boolean).forEach(x=>exported.add(x));return '';});
    text=text.replace(/\bexport\s+((?:async\s+)?function\*?|const|let|class)\s+(\w+)/g,(_,kind,name)=>{exported.add(name);return `${kind} ${name}`;});
    if(/^\s*(import|export)\s/m.test(text))throw Error('Unsupported module syntax: '+file);
    return `// ---- ${file}\n__m[${JSON.stringify(file)}] = (() => {\n${text}\nreturn {${[...exported].join(', ')}};\n})();\n`;
  }
  const code='const __m = {};\n'+order.map(bundle).join('\n');
  const gameCode='\n(() => {\n'+code.replaceAll('</script','<\\/script')+'\n})();\n';
  new vm.Script(gameCode,{filename:'editable-game.js'});
  assert(gameCode.includes('const CLIPS = {};'),'no old recordings');
  assert.equal(gameCode.split('__WEB_DIALOGUES__').length-1,1);
  let css=read('style-v3.css')+'\n'+read('main-menu.css')+'\n'+read('induction.css');
  if(fs.existsSync(path.join(dist,'marketplace.css')))css+='\n'+read('marketplace.css');
  css+='\n'+read('train-refit.css');
  

  const mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',woff2:'font/woff2'};
  css=css.replace(/url\('assets\/([^']+)'\)/g,(_,asset)=>{
    const bytes=fs.readFileSync(path.join(dist,'assets',asset));sources.push({file:'assets/'+asset,bytes:bytes.length,sha256:sha(bytes)});
    assert(mime[asset.split('.').pop()],'known local CSS asset');return `url('data:${mime[asset.split('.').pop()]};base64,${bytes.toString('base64')}')`;
  });
  for(const match of css.matchAll(/url\(([^)]+)\)/g))assert(/^["']?(data:|blob:|#)/.test(match[1].trim()),'CSS asset is embedded');
  let html=read('index.html');
  const threeTag='<script src="assets/three.min.js"></script>';
  const includeThree=html.includes(threeTag);
  const scripts=['ui','orquesta','teclas','percusion'].map(group=>read('assets/muestras-'+group+'.js'));
  if(includeThree)scripts.push(read('assets/three.min.js').replaceAll('</script','<\\/script'));
  scripts.push(gameCode);
  const gameLabels=scripts.map((body,index)=>({filename:'game-script-'+index+'.js',token:'__WEB_GAME_SCRIPT_'+index+'__'}));
  for(let index=0;index<scripts.length;index++)new vm.Script(scripts[index],{filename:gameLabels[index].filename});
  html=replaceOne(html,'<link rel="stylesheet" href="main-menu.css">','','main menu CSS link');
  html=replaceOne(html,'<link rel="stylesheet" href="induction.css">','','induction CSS link');
  html=replaceOne(html,'<link rel="stylesheet" href="train-refit.css">','','train refit stylesheet link');
  const marketplaceLink='<link rel="stylesheet" href="marketplace.css">';
  if(html.includes(marketplaceLink)){
    assert(fs.existsSync(path.join(dist,'marketplace.css')),'the market stylesheet exists');
    html=replaceOne(html,marketplaceLink,'','market stylesheet link');
  }
  const rescueLink='<link rel="stylesheet" href="rescate.css">';
  if(html.includes(rescueLink))html=replaceOne(html,rescueLink,'','rescue stylesheet link');
  html=replaceOne(html,'<link rel="stylesheet" href="style-v3.css">','<link rel="stylesheet" href="__WEB_GAME_STYLE_0__">','game stylesheet');
  html=replaceOne(html,"<script>globalThis.IBERIA_SAMPLE_BASE = 'assets/';</script>",gameLabels.slice(0,4).map(row=>'<script src="'+row.token+'"></script>').join(''),'music samples');
  if(includeThree)html=replaceOne(html,threeTag,'<script src="'+gameLabels[4].token+'"></script>','three source');
  html=replaceOne(html,'<script type="module" src="app.js"></script>','<script src="'+gameLabels.at(-1).token+'"></script>','game runtime source');
  const licenseBytes=fs.readFileSync(path.join(project,'LICENSE-GEODATA.txt'));
  const licenseText=licenseBytes.toString('utf8').replace(/\n*$/,'\n\n');
  html=replaceOne(html,'</body>','<script type="text/plain" id="geodata-license">'+licenseText.replaceAll('</script','<\\/script')+'</script></body>','geography attribution');
  sources.push({file:'LICENSE-GEODATA.txt',bytes:licenseBytes.length,sha256:sha(licenseBytes)});
  // All parsing and catalogue checks finish before replacing any source file.
  fs.mkdirSync(source,{recursive:true});
  scripts.forEach((body,index)=>fs.writeFileSync(path.join(source,gameLabels[index].filename),body));
  fs.writeFileSync(path.join(source,'game-style-0.css'),css);
  fs.writeFileSync(path.join(source,'game.template.html'),html);
  release.labels.game=gameLabels;release.labels.gameStyles=[{filename:'game-style-0.css',token:'__WEB_GAME_STYLE_0__'}];
  release.editableProjectSources=sources;
  fs.writeFileSync(releasePath,JSON.stringify(release,null,2)+'\n');
  return {source,project,catalogueSHA256:sha(catalogueBytes),gameCodeSHA256:sha(gameCode),styleSHA256:sha(css),gameTemplateSHA256:sha(html),sourceFiles:sources.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const args=new Map();for(let index=2;index<process.argv.length;index+=2)args.set(process.argv[index].replace(/^--/,''),process.argv[index+1]);
  console.log(JSON.stringify(await refreshGameSource({project:args.get('project'),source:args.get('source')}),null,2));
}
