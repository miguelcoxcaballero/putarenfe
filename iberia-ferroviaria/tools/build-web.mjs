#!/usr/bin/env node
// Publish one frozen, whole-dialogue release. This script never synthesizes audio
// or touches the producer: it verifies existing MP3 bytes before copying them.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {refreshGameSource} from './extract-game-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map();
for (let i=2;i<process.argv.length;i+=2) {
  assert(process.argv[i].startsWith('--') && process.argv[i+1], 'arguments are --name value pairs');
  args.set(process.argv[i].slice(2), process.argv[i+1]);
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = file => fs.readFileSync(file, 'utf8');
const source = path.resolve(args.get('source') || path.join(root,'web-source'));
const output = path.resolve(args.get('out') || root);
const write = (name,bytes) => {
  const file=path.join(output,name); fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,bytes); return file;
};
const oneReplace = (text, before, after, label) => {
  assert.equal(text.split(before).length-1,1,label);return text.replace(before,()=>after);
};
const gameInput=args.get('game'), listeningInput=args.get('auditorio');
assert.equal(!!gameInput,!!listeningInput,'bootstrap requires both exact frozen HTMLs');

if (gameInput) {
  assert(args.get('snapshot'),'bootstrap requires the registered physical snapshot');
  const snapshot=path.resolve(args.get('snapshot'));
  const manifestBytes=fs.readFileSync(path.join(snapshot,'manifest.json'));
  const manifest=JSON.parse(manifestBytes);
  const canonicalBytes=fs.readFileSync(path.join(snapshot,'dialogue-catalogue-source.json'));
  const canonical=JSON.parse(canonicalBytes),canonicalRows=new Map(canonical.map(row=>[row.id,row]));
  const referenceBytes=fs.readFileSync(path.join(snapshot,'reference-pack-source.json'));
  const referencePack=JSON.parse(referenceBytes);
  assert.equal(manifest.catalogue_sha256,sha(canonicalBytes),'current complete spoken catalogue');
  assert.equal(manifest.reference_pack_sha256,sha(referenceBytes),'current nine-person reference pack');
  const gameBytes=fs.readFileSync(gameInput),listeningBytes=fs.readFileSync(listeningInput);
  if(args.has('game-sha'))assert.equal(sha(gameBytes),args.get('game-sha'),'frozen game SHA');
  if(args.has('auditorio-sha'))assert.equal(sha(listeningBytes),args.get('auditorio-sha'),'frozen listening SHA');
  const game=gameBytes.toString('utf8'), listening=listeningBytes.toString('utf8');
  const listeningMatch=listening.match(/<script type="application\/json" id="dialogue-data">([\s\S]*?)<\/script>/);
  assert(listeningMatch,'exact frozen listening data');
  const data=JSON.parse(listeningMatch[1]);
  assert.equal(data.rows.length,412,'all catalogue texts');
  const ids=Object.keys(manifest.takes||{}).sort();
  assert.deepEqual(Object.keys(data.audio).sort(),ids,'frozen listening IDs match registered manifest');
  const gameMap=game.match(/const DIALOGUES = (\{[^\n]*\});/);
  assert(gameMap,'unique complete-recording map');
  const clips=JSON.parse(gameMap[1]);
  assert.deepEqual(Object.keys(clips).sort(),ids,'both HTMLs use the same frozen recording IDs');
  const rows=new Map(data.rows.map(row=>[row.id,row]));
  for(const id of ids){
    const take=manifest.takes[id],row=rows.get(id);
    assert.equal(take.id,id);assert.equal(take.person,row.person);
    assert.equal(take.text,canonicalRows.get(id).text,'unchanged complete spoken body');
    assert.equal(row.text,canonicalRows.get(id).raw,'unchanged complete displayed body');
    assert.equal(row.sha256,take.sha256);assert.equal(take.mp3,id+'.mp3');
    assert.equal(clips[id],data.audio[id],'same exact whole recording in both pages');
    assert.equal(sha(Buffer.from(clips[id],'base64')),take.sha256,'embedded recording SHA');
  }
  fs.mkdirSync(source,{recursive:true});
  const save=(name,bytes)=>fs.writeFileSync(path.join(source,name),bytes);
  const labels={game:[],listening:[],gameStyles:[],listeningStyles:[]};
  function stripScripts(html,kind){
    let index=0;
    return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g,(all,attrs,body)=>{
      if(/type="text\/plain"/.test(attrs))return all; // Embedded geographic attribution.
      if(/id="dialogue-data"/.test(attrs))return '<script type="application/json" id="dialogue-data">__WEB_DIALOGUE_DATA__</script>';
      assert(!attrs.trim(),'only known classic executable scripts');
      const filename=kind+'-script-'+index+'.js',token='__WEB_'+kind.toUpperCase()+'_SCRIPT_'+index+'__';
      if(kind==='game'&&body.includes('const DIALOGUES = ')){
        body=oneReplace(body,gameMap[0],'const DIALOGUES = __WEB_DIALOGUES__;','one complete-dialogue map');
        body=oneReplace(body,'const decoded = Promise.resolve().then(() => {','const decoded = Promise.resolve().then(async () => {','one decode promise');
        body=oneReplace(body,
          "const entry = (kind === 'D' ? DIALOGUES : CLIPS)[id], data = typeof entry === 'string' ? entry : entry?.src;",
          "const entry = (kind === 'D' ? DIALOGUES : CLIPS)[id];\n      if (entry?.url) {\n        const response = await fetch(new URL(entry.url, document.baseURI));\n        if (!response.ok) throw new Error('No se ha podido descargar la grabación: HTTP ' + response.status);\n        return this.music.ctx.decodeAudioData(await response.arrayBuffer());\n      }\n      const data = typeof entry === 'string' ? entry : entry?.src;",
          'one web-only URL branch');
        const oldLabel=`Avance en pruebas · ${ids.length}/412 voces completas · resto con subtítulos`;
        body=oneReplace(body,oldLabel,'__WEB_PREVIEW_LABEL__','one visible game preview label');
        body=oneReplace(body,'__WEB_PREVIEW_LABEL__</p>','__WEB_PREVIEW_LABEL__ <a href="dialogos.html">Escuchar los diálogos</a></p>','menu listening link');
        assert(body.includes('const CLIPS = {};'),'no old sentence recordings');
        assert(!/speechSynthesis|SpeechSynthesisUtterance/.test(body),'no system voice fallback');
      }
      if(kind==='listening'){
        body=oneReplace(body,"$('download').href='data:audio/mpeg;base64,'+data.audio[selected.id];","$('download').href=data.audio[selected.id];",'listening download URL');
        body=oneReplace(body,"player.src='data:audio/mpeg;base64,'+data.audio[id];","player.src=data.audio[id];",'listening playback URL');
      }
      new vm.Script(body,{filename});save(filename,body);
      labels[kind].push({filename,token});index++;
      return '<script src="'+token+'"></script>';
    });
  }
  function stripStyles(html,kind){
    let index=0;
    return html.replace(/<style>([\s\S]*?)<\/style>/g,(all,body)=>{
      const filename=kind+'-style-'+index+'.css',token='__WEB_'+kind.toUpperCase()+'_STYLE_'+index+'__';
      save(filename,body);labels[kind+'Styles'].push({filename,token});index++;
      return '<link rel="stylesheet" href="'+token+'">';
    });
  }
  let gameTemplate=stripStyles(stripScripts(game,'game'),'game');
  let listeningTemplate=stripStyles(stripScripts(listening,'listening'),'listening');
  listeningTemplate=oneReplace(listeningTemplate,data.label,'__WEB_LISTENING_LABEL__','one listening count label');
  listeningTemplate=oneReplace(listeningTemplate,`diálogos pendientes (${412-ids.length})`,'diálogos pendientes (__WEB_PENDING__)','pending count');
  listeningTemplate=oneReplace(listeningTemplate,
    'Tomas completas, sin el juego. Puedes escuchar sin conexión y filtrar por personaje, emoción o texto.',
    'Tomas completas, sin el juego. Las grabaciones se cargan al escucharlas. Filtra por personaje, emoción o texto.',
    'web listening network description');
  listeningTemplate=listeningTemplate.replace(/Paco: \d+ diálogos generados/g,'Paco: __WEB_PACO_COUNT__ diálogos generados');
  listeningTemplate=oneReplace(listeningTemplate,'<div class="eyebrow">Iberia Ferroviaria · Sala de escucha</div>',
    '<div class="eyebrow">Iberia Ferroviaria · Sala de escucha</div><p class="note"><a href="index.html">← Volver al juego</a></p>','listening return link');
  save('game.template.html',gameTemplate);save('listening.template.html',listeningTemplate);
  delete data.audio;for(const row of data.rows){row.available=false;row.duration=null;row.sha256=null;}
  save('dialogue-catalogue.json',JSON.stringify(data,null,2)+'\n');
  save('canonical-catalogue.json',canonicalBytes);
  save('reference-pack-source.json',referenceBytes);
  save('manifest-source.json',manifestBytes);
  save('source-release.json',JSON.stringify({schema:1,version:'3.6.3',expectedWholeDialogues:412,
    gameSourceSHA256:sha(gameBytes),listeningSourceSHA256:sha(listeningBytes),manifestSourceSHA256:sha(manifestBytes),
    sourceFrozenWholeDialogues:ids.length,sourceCreatedAt:data.createdAt,
    sourceCatalogueSHA256:sha(canonicalBytes),referencePackSHA256:sha(referenceBytes),
    modelFingerprint:manifest.model.fingerprint,labels},null,2)+'\n');
}

const editableProject=path.resolve(args.get('project')||path.join(root,'proyecto'));
if(args.has('project'))assert(fs.existsSync(editableProject),'the explicitly selected editable project exists');
if(fs.existsSync(editableProject))await refreshGameSource({project:editableProject,source});
const sourceRelease=JSON.parse(read(path.join(source,'source-release.json')));
const manifestPath=path.resolve(args.get('manifest') || path.join(source,'manifest-source.json'));
const manifestBytes=fs.readFileSync(manifestPath),manifest=JSON.parse(manifestBytes);
if(!args.has('manifest'))assert.equal(sha(manifestBytes),sourceRelease.currentManifestSHA256||sourceRelease.manifestSourceSHA256,
  'default rebuild uses the last accepted frozen manifest');
const catalogue=JSON.parse(read(path.join(source,'dialogue-catalogue.json')));
const canonicalBytes=fs.readFileSync(path.join(source,'canonical-catalogue.json'));
const canonical=JSON.parse(canonicalBytes),canonicalRows=new Map(canonical.map(row=>[row.id,row]));
const referenceBytes=fs.readFileSync(path.join(source,'reference-pack-source.json'));
const referencePack=JSON.parse(referenceBytes);
assert.equal(sha(canonicalBytes),sourceRelease.sourceCatalogueSHA256,'pinned spoken catalogue source');
assert.equal(manifest.catalogue_sha256,sourceRelease.sourceCatalogueSHA256,'current manifest catalogue');
assert.equal(sha(referenceBytes),sourceRelease.referencePackSHA256,'pinned reference pack source');
assert.equal(manifest.reference_pack_sha256,sourceRelease.referencePackSHA256,'current manifest reference pack');
assert.equal(manifest.model.fingerprint,sourceRelease.modelFingerprint,'current manifest model');
assert.equal(catalogue.rows.length,412);
assert.equal(new Set(catalogue.rows.map(row=>row.id)).size,412);
const priorRelease=fs.existsSync(path.join(output,'release.json'))?JSON.parse(read(path.join(output,'release.json'))):null;
const audioStage=args.has('audio-stage')?path.resolve(args.get('audio-stage')):args.has('snapshot')?path.resolve(args.get('snapshot')):null;
const rows=new Map(catalogue.rows.map(row=>[row.id,row]));
const audio={},dialogues={},recordings=[];
for(const [id,take] of Object.entries(manifest.takes||{})){
  const row=rows.get(id);assert(row,'no obsolete recording ID');
  assert.equal(take.id,id);assert.equal(take.person,row.person);
  assert.equal(take.text,canonicalRows.get(id).text,'unchanged complete spoken body');
  assert.equal(row.text,canonicalRows.get(id).raw,'unchanged complete displayed body');
  assert.equal(take.reference_sha256,referencePack.prompts[row.person].sha256,'current person reference');
  assert.equal(take.model_fingerprint,sourceRelease.modelFingerprint,'current take model');
  assert.equal(take.mp3,id+'.mp3');assert.match(take.sha256,/^[a-f0-9]{64}$/);
  assert.equal(take.validated,true);assert.equal(take.raw_validated,true);assert.equal(take.finite,true);
  assert.equal(take.eos_observation?.eos_found,true);
  assert(Number.isFinite(take.duration)&&take.duration>0);
  const previous=priorRelease?.recordings?.find(item=>item.id===id&&item.sha256===take.sha256);
  const input=audioStage?path.join(audioStage,take.mp3):previous?path.join(output,previous.url):null;
  assert(input,'new recordings require --audio-stage pointing to their frozen physical snapshot');
  assert(!fs.lstatSync(input).isSymbolicLink(),'physical MP3 is not a link');
  const bytes=fs.readFileSync(input);assert.equal(sha(bytes),take.sha256,'registered whole MP3 hash');
  const url='assets/voces/'+id+'-'+take.sha256.slice(0,12)+'.mp3';
  write(url,bytes);audio[id]=url;dialogues[id]={url};
  row.available=true;row.duration=take.duration;row.sha256=take.sha256;
  recordings.push({id,person:row.person,kind:row.kind,url,bytes:bytes.length,sha256:take.sha256,
    duration:take.duration,referenceSHA256:take.reference_sha256});
}
recordings.sort((a,b)=>a.id.localeCompare(b.id));
const available=recordings.length,pending=412-available;
assert(available>0&&available<=412);
const partial=available!==412;
const gameLabel=partial?`Avance en pruebas · ${available}/412 voces completas · resto con subtítulos`:'Catálogo completo · 412/412 diálogos con voz';
const listeningLabel=`${available}/412 diálogos grabados · ${partial?'el resto está en producción':'catálogo completo'}`;
catalogue.audio=audio;catalogue.label=listeningLabel;
const pacoCount=recordings.filter(row=>row.person==='mayor').length;
const assets=[];
const photoAssets=new Map();
const manufacturerLogoAssets=new Map();
function externalizeTrainPhotos(script){
  const marker='// ---- assets/train-photos.js\n';
  const start=script.indexOf(marker);if(start===-1)return script;
  assert.equal(script.split(marker).length-1,1,'one train-photo module');
  const next=script.indexOf('\n// ---- ',start+marker.length);
  assert(next!==-1,'the train-photo module has its own bounded scope');
  const module=script.slice(start,next).replace(/data:image\/(webp|png|jpeg|jpg);base64,([A-Za-z0-9+/]+={0,2})/g,(data,extension,encoded)=>{
    const bytes=Buffer.from(encoded,'base64');
    assert(bytes.length>0&&bytes.toString('base64')===encoded,'exact photo base64 payload');
    const digest=sha(bytes),suffix=extension==='jpeg'?'jpg':extension;
    const url='assets/fotos/train-'+digest.slice(0,12)+'.'+suffix;
    if(!photoAssets.has(url)){
      write(url,bytes);
      const row={url,bytes:bytes.length,sha256:digest,kind:'generated-train-photo'};
      photoAssets.set(url,row);assets.push(row);
    }
    return url;
  });
  return script.slice(0,start)+module+script.slice(next);
}
function externalizeManufacturerLogos(script){
  const marker='// ---- brands.js\n';
  const start=script.indexOf(marker);if(start===-1)return script;
  assert.equal(script.split(marker).length-1,1,'one brand module');
  const next=script.indexOf('\n// ---- ',start+marker.length);
  assert(next!==-1,'the brand module has its own bounded scope');
  let converted=0;
  const module=script.slice(start,next).replace(/data:image\/webp;base64,([A-Za-z0-9+/]+={0,2})/g,(data,encoded)=>{
    const bytes=Buffer.from(encoded,'base64');
    assert(bytes.length>0&&bytes.toString('base64')===encoded,'exact generated logo payload');
    const digest=sha(bytes),url='assets/logos/logo-'+digest.slice(0,12)+'.webp';
    if(!manufacturerLogoAssets.has(url)){
      write(url,bytes);
      const row={url,bytes:bytes.length,sha256:digest,kind:'generated-brand-logo'};
      manufacturerLogoAssets.set(url,row);assets.push(row);
    }
    converted++;return url;
  });
  if(converted)assert.equal(manufacturerLogoAssets.size,6,'six independently generated manufacturer logos');
  return script.slice(0,start)+module+script.slice(next);
}
function publishSource(entry,kind){
  let bytes=fs.readFileSync(path.join(source,entry.filename));
  if(kind==='game'&&bytes.includes(Buffer.from('__WEB_DIALOGUES__'))){
    let script=bytes.toString('utf8');
    script=oneReplace(script,'__WEB_DIALOGUES__',JSON.stringify(dialogues),'one complete web recording map');
    script=oneReplace(script,'__WEB_PREVIEW_LABEL__',gameLabel,'one generated game label');
    script=externalizeTrainPhotos(script);
    script=externalizeManufacturerLogos(script);
    new vm.Script(script,{filename:entry.filename});bytes=Buffer.from(script);
  }
  if(entry.filename.endsWith('.js'))new vm.Script(bytes.toString('utf8'),{filename:entry.filename});
  const name='assets/'+entry.filename.replace(/\.(js|css)$/, '-'+sha(bytes).slice(0,12)+'.$1');
  write(name,bytes);assets.push({url:name,bytes:bytes.length,sha256:sha(bytes)});return name;
}
let gameHTML=read(path.join(source,'game.template.html'));
let listeningHTML=read(path.join(source,'listening.template.html'));
for(const entry of [...sourceRelease.labels.game,...sourceRelease.labels.gameStyles])
  gameHTML=oneReplace(gameHTML,entry.token,publishSource(entry,'game'),'one game asset placeholder');
for(const entry of [...sourceRelease.labels.listening,...sourceRelease.labels.listeningStyles])
  listeningHTML=oneReplace(listeningHTML,entry.token,publishSource(entry,'listening'),'one listening asset placeholder');
listeningHTML=oneReplace(listeningHTML,'__WEB_DIALOGUE_DATA__',JSON.stringify(catalogue).replaceAll('<','\\u003c'),'one complete listening catalogue');
listeningHTML=oneReplace(listeningHTML,'__WEB_LISTENING_LABEL__',listeningLabel,'one listening label');
listeningHTML=oneReplace(listeningHTML,'__WEB_PENDING__',String(pending),'one listening pending count');
listeningHTML=oneReplace(listeningHTML,'__WEB_PACO_COUNT__',String(pacoCount),'one current Paco count');
assert(!/__WEB_[A-Z_0-9]+__/.test(gameHTML+listeningHTML),'no unexpanded HTML token');
assert(!/<base\b/i.test(gameHTML+listeningHTML),'all asset URLs use the document folder');
assert.equal((listeningHTML.match(/<audio\b/g)||[]).length,1,'one native listening player');
write('index.html',gameHTML);write('dialogos.html',listeningHTML);
write('.nojekyll','');
const release={schema:1,version:'3.6.3',status:partial?'partial-preview':'complete-catalogue',
  availableWholeDialogues:available,expectedWholeDialogues:412,pendingWholeDialogues:pending,pacoWholeDialogues:pacoCount,
  sourceFrozenHTMLs:{gameSHA256:sourceRelease.gameSourceSHA256,listeningSHA256:sourceRelease.listeningSourceSHA256},
  sourceManifestSHA256:sha(manifestBytes),sourceCatalogueSHA256:sourceRelease.sourceCatalogueSHA256,
  sameWholeRecordingsOnBothPages:true,sentenceRecordings:0,systemVoiceFallback:false,
  webPlayback:'whole unchanged MP3 downloaded on demand; one source at original rate and pitch',
  game:{url:'index.html',bytes:Buffer.byteLength(gameHTML),sha256:sha(gameHTML)},
  listening:{url:'dialogos.html',bytes:Buffer.byteLength(listeningHTML),sha256:sha(listeningHTML)},
  assets,recordings,validation:{physicalMP3Hashes:true,pairedFrozenHTMLHashes:true,registeredEOS:true,
    javascriptSyntax:true,relativeURLs:true,browserTested:false,humanListening:false}};
// Preserve the rollout cache while local previews are rebuilt before publication.
// The first public preview remains useful to clients that still have its HTML.
const keep=new Set([...assets.map(row=>row.url),...recordings.map(row=>row.url)]);
const historicalAssets=[{url:'assets/game-script-5-8dfb0e86a8df.js',bytes:11320929,
  sha256:'8dfb0e86a8dfeb8e61cf6358898ab9d96b4f6ef64553849f3b4619b56fb60f4f'}]
  .filter(row=>fs.existsSync(path.join(output,row.url)));
const previousAssets=[...(priorRelease?.assets||[]),...(priorRelease?.recordings||[]),
  ...(priorRelease?.retainedAssets||[]),...historicalAssets];
const retainedAssets=[];
for(const row of previousAssets){
  if(keep.has(row.url))continue;
  assert(row.url.startsWith('assets/')&&!row.url.split('/').includes('..'),'previous asset remains within publication');
  const file=path.join(output,row.url);
  assert(!fs.lstatSync(file).isSymbolicLink(),'previous published asset is a physical file');
  const bytes=fs.readFileSync(file);
  assert.equal(sha(bytes),row.sha256,'previous published asset hash');
  retainedAssets.push({url:row.url,bytes:bytes.length,sha256:row.sha256});keep.add(row.url);
}
if(retainedAssets.length)release.retainedAssets=retainedAssets;
write('release.json',JSON.stringify(release,null,2)+'\n');
function cleanAssets(dir){
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())cleanAssets(file);
    else if(!keep.has(path.relative(output,file).split(path.sep).join('/')))fs.unlinkSync(file);
  }
}
cleanAssets(path.join(output,'assets'));
for(const row of [...assets,...recordings,...retainedAssets])assert(row.bytes<100*1024*1024,'every asset fits GitHub file limit');
// Accept an external manifest only after the whole publication succeeds. The
// next default rebuild follows it while keeping the original HTML provenance.
if(args.has('manifest')){
  fs.writeFileSync(path.join(source,'manifest-source.json'),manifestBytes);
  sourceRelease.currentManifestSHA256=sha(manifestBytes);
  sourceRelease.currentWholeDialogues=available;
  fs.writeFileSync(path.join(source,'source-release.json'),JSON.stringify(sourceRelease,null,2)+'\n');
}
console.log(JSON.stringify({output,status:release.status,availableWholeDialogues:available,pacoWholeDialogues:pacoCount,
  bytes:[...assets,...recordings].reduce((sum,row)=>sum+row.bytes,0)+release.game.bytes+release.listening.bytes,
  releaseSHA256:sha(fs.readFileSync(path.join(output,'release.json'))),gameSHA256:release.game.sha256,
  listeningSHA256:release.listening.sha256,physicalMP3Hashes:true,javascriptSyntax:true,browserTested:false},null,2));
