// Offline listening comparison of two unchanged game bodies; never publishes the game.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {CHARACTERS} from '../dist/story.js';
import {faceURL} from '../dist/faces.js';
import {CLIPS} from '../dist/assets/voices.js';
import {clipId, sentences, recordedPause} from '../dist/voice.js';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const voiceRoot = path.resolve(project, '../investigacion/voces');
const output = path.resolve(project, '../outputs/Iberia-Ferroviaria-continuidad-voces-3.6.3.html');
const reportFile = path.join(voiceRoot, 'reparto-3.6.3/continuity-preview.json');
const stage = path.join(voiceRoot, 'generadas-qwen-dialogos-bf16-comparacion-3.6.3');
const args = process.argv.slice(2);
assert(args.length === 0 || args.length === 2 && args[0] === '--trial-source-map',
  'Only --trial-source-map FILE is supported');
const trialSourceMap = args.length ? JSON.parse(fs.readFileSync(path.resolve(args[1]),'utf8')) : {
  [path.join(project,'tools/build_qwen_dialogues.py')]:path.join(voiceRoot,'reparto-3.6.3/baseline-sources/build_qwen_dialogues.py'),
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const safeJSON = data => JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const ids = ['jp9ve2', '83575r'];
const sentenceManifest = read(path.join(voiceRoot, 'generadas-qwen-3.6/manifest.json'));
const catalogue = read(path.join(voiceRoot, 'dialogos-3.6.3.json'));
assert.equal(catalogue.length, 412);
assert.equal(sentenceManifest.status, 'complete');

function continuousCollection(folder) {
  const manifestPath = path.join(folder, 'manifest.json'), asrPath = path.join(folder, 'transcript-qa-base.json');
  const manifest = read(manifestPath), asr = read(asrPath);
  assert.equal(manifest.status, 'complete', 'Continuous comparison must be closed');
  assert(manifest.ended_at);
  assert.equal(Object.keys(manifest.failures || {}).length, 0);
  assert.equal(manifest.reference_pack_sha256,'fc7d8d14b404d3c782e4878660fd4c3a968d969791545fcb9a0a43d00804cb40');
  assert.equal(manifest.parameters.batch_size,1);
  assert.equal(manifest.parameters.seed,424242);
  assert.equal(manifest.model.fingerprint,'3db3533efbdebdb25290007f64a4ec50b67c1661c0e4c1191db644b43803aeff');
  assert.equal(manifest.parameters.generation_unit,'one complete dialogue body per native uninterrupted take');
  const precision={schema:1,model_load_dtype:'float32',talker_dtype:'bfloat16',code_predictor_dtype:'bfloat16',
    speaker_encoder_dtype:'float32',codec_dtype:'float32',prompt_formation_dtype:'float32',
    all_nine_prompts_formed_before_cast:true,late_prompt_creation:'forbidden',native_waveform_dtype:'float32'};
  assert.deepEqual(manifest.precision,precision);
  assert.deepEqual(manifest.parameters.precision,precision);
  for(const [component,dtype] of Object.entries({talker:'torch.bfloat16',code_predictor:'torch.bfloat16',speaker_encoder:'torch.float32',codec:'torch.float32'})){
    assert.deepEqual(manifest.actual_execution[component],{devices:['cpu'],dtypes:[dtype]});
  }
  assert.equal(manifest.actual_execution.attention,'sdpa');
  const sourceVerification=Object.entries(manifest.source_sha256).map(([filename,expected])=>{
    const verifiedPath=trialSourceMap[filename]||filename;
    assert.equal(sha(fs.readFileSync(verifiedPath)),expected,'Exact trial source: '+filename);
    return {recorded_path:filename,verified_path:verifiedPath,sha256:expected};
  });
  const promptsFile=path.join(voiceRoot,'referencias-qwen-3.6.2/prompts.json');
  assert.equal(sha(fs.readFileSync(promptsFile)),manifest.reference_pack_sha256);
  const prompts=read(promptsFile).prompts;
  assert.equal(Object.keys(prompts).length,9);
  for(const [person,ref] of Object.entries(manifest.references)){
    assert.equal(ref.sha256,prompts[person].sha256);
    assert.equal(ref.ref_text,prompts[person].ref_text);
    assert.equal(sha(fs.readFileSync(ref.ref_audio)),ref.sha256);
    const conditioning=manifest.conditioning[person];
    assert.equal(conditioning.reference_sha256,ref.sha256);
    assert.equal(conditioning.reference_text,ref.ref_text);
    assert.equal(conditioning.formed_before_conversion,true);
    assert.equal(conditioning.identity.ref_spk_embedding.dtype,'torch.float32');
    assert.equal(conditioning.identity.ref_code.dtype,'torch.int64');
    assert.equal(conditioning.identity.ref_text,ref.ref_text);
    assert.equal(conditioning.identity.icl_mode,true);
    assert.equal(conditioning.identity.x_vector_only_mode,false);
  }
  assert.equal(Object.keys(manifest.conditioning).length,9);
  assert.equal(Object.keys(manifest.references).length,9);
  const takes = {};
  for (const id of ids) {
    const item = catalogue.find(row => row.id === id), take = manifest.takes[id], analysis = asr.items[id];
    const planned=manifest.items.find(row=>row.id===id);
    assert(item && take && analysis);
    assert.equal(take.validated, true);
    assert.equal(take.person, item.person);
    assert.equal(take.text, item.text, 'Continuous text is the unchanged game body');
    assert.equal(take.raw,item.raw);
    assert.equal(take.canonical_sha256,item.canonical_sha256);
    assert.equal(take.speech_sha256,item.speech_sha256);
    for(const field of ['input_fingerprint','inference_fingerprint','batch_seed','batch_id','batch_index','planned_token_cap','effective_text']){
      assert.equal(take[field],planned[field],'Immutable whole-body generation plan: '+field);
    }
    assert.equal(take.planned_token_cap,id==='jp9ve2'?373:389);
    assert.deepEqual(take.precision,precision);
    assert.deepEqual(take.actual_execution,manifest.actual_execution);
    assert.equal(take.conditioning_identity_sha256,manifest.conditioning[item.person].identity_sha256);
    const bytes = fs.readFileSync(path.join(folder, `${id}.mp3`));
    assert.equal(sha(bytes), take.sha256);
    const rawBytes=fs.readFileSync(path.join(folder,take.raw_wav));
    assert.equal(sha(rawBytes),take.raw_sha256);
    assert.equal(rawBytes.toString('ascii',0,4),'RIFF');
    assert.equal(rawBytes.toString('ascii',8,12),'WAVE');
    let audioFormat=null,audioData=null;
    for(let at=12;at+8<=rawBytes.length;){
      const chunk=rawBytes.toString('ascii',at,at+4),length=rawBytes.readUInt32LE(at+4);
      assert(at+8+length<=rawBytes.length);
      if(chunk==='fmt ')audioFormat=rawBytes.subarray(at+8,at+8+length);
      if(chunk==='data')audioData=rawBytes.subarray(at+8,at+8+length);
      at+=8+length+(length%2);
    }
    assert(audioFormat&&audioData);
    assert.equal(audioFormat.readUInt16LE(0),3,'Native IEEE FLOAT RAW');
    assert.equal(audioFormat.readUInt16LE(2),1);
    assert.equal(audioFormat.readUInt32LE(4),24000);
    assert.equal(audioFormat.readUInt16LE(14),32);
    assert.equal(audioData.length/4,take.samples);
    for(let at=0;at<audioData.length;at+=4)assert(Number.isFinite(audioData.readFloatLE(at)));
    const ref = manifest.references[item.person];
    assert.equal(take.reference_sha256, ref.sha256);
    assert.equal(take.reference_text, ref.ref_text);
    assert.equal(sha(fs.readFileSync(ref.ref_audio)), ref.sha256);
    assert.equal(take.model_fingerprint, manifest.model.fingerprint);
    assert.equal(take.eos_observation.eos_found, true);
    assert.equal(take.eos_observation.token_limit_without_eos, false);
    assert.equal(take.eos_observation.last_effective_token,2150);
    assert.equal(take.eos_observation.max_new_tokens,take.planned_token_cap);
    assert.equal(take.eos_observation.first_eos_index,take.eos_observation.effective_generated_tokens-1);
    assert.equal(take.codec_observation.status,'observed');
    assert.equal(take.codec_observation.codebooks,16);
    assert.equal(take.codec_observation.dtype,'<i8');
    assert.match(take.codec_observation.sha256,/^[a-f0-9]{64}$/);
    assert.equal(take.codec_observation.codec_frames*1920,take.samples);
    assert.equal(take.sample_rate,24000);
    assert.equal(take.finite,true);
    assert.deepEqual(take.mastering,manifest.parameters.mastering);
    assert.equal(take.mastering.mp3_bitrate,'160k');
    assert.equal(take.mastering.target_lufs,-21);
    assert.equal(take.mastering.maximum_true_peak_dbfs,-1.5);
    assert.equal(take.mastering.peak_guard.level,false);
    assert.equal(take.mastering.processing,'Exterior silence only, static gain and bounded lookahead peak guard; no internal pause removal, EQ, pitch, tempo or broadband compression.');
    assert(take.mp3_true_peak_dbfs<=-1.5);
    assert.equal(analysis.sha256, take.sha256, 'ASR must inspect this exact MP3');
    assert.equal(analysis.expected, take.text);
    assert.equal(analysis.analysis_version, 4);
    assert.equal(analysis.model_sha256, '07cadb9f25677c8d50df603e66a98fbd842cce45047139baeb16e6219a1e807b');
    takes[id] = {audio:`data:audio/mpeg;base64,${bytes.toString('base64')}`, duration:take.duration,
      sha256:take.sha256, reference_sha256:ref.sha256, raw_sha256:take.raw_sha256};
    assert(Number.isFinite(take.duration) && take.duration > 0);
  }
  return {takes, manifest_sha256:sha(fs.readFileSync(manifestPath)), asr_sha256:sha(fs.readFileSync(asrPath)),
    parameters:manifest.parameters, model_fingerprint:manifest.model.fingerprint,precision,
    actual_execution:manifest.actual_execution,source_verification:sourceVerification};
}
const continuous = continuousCollection(stage);
const people = ids.map(id => {
  const item = catalogue.find(row => row.id === id), portrait = faceURL(item.person, item.mood);
  assert(/^data:image\/jpeg;base64,/.test(portrait), 'Use the current photographic portrait');
  const previous = sentences(item.raw).map((text, index) => {
    const sentenceId = clipId(item.person, text), take = sentenceManifest.takes[sentenceId];
    assert(take && take.validated && CLIPS[sentenceId], 'Every old sentence must be recorded');
    const bytes = Buffer.from(CLIPS[sentenceId], 'base64');
    assert.equal(sha(bytes), take.sha256, 'Old montage must use actual current game MP3s');
    assert.equal(take.reference_sha256, continuous.takes[id].reference_sha256);
    return {id:sentenceId, audio:`data:audio/mpeg;base64,${CLIPS[sentenceId]}`, duration:take.duration,
      gap:recordedPause(text, item.mood, item.person) / 1000, sha256:take.sha256, text, index};
  });
  const variant = (key, label, take) => ({key,label,segments:[{id, audio:take.audio,duration:take.duration,gap:0,sha256:take.sha256,text:item.raw}]});
  return {id,person:item.person,name:CHARACTERS[item.person].name,role:CHARACTERS[item.person].role,
    text:item.raw,mood:item.mood,portrait,canonical_sha256:item.canonical_sha256,
    variants:[{key:'previous',label:'Montaje anterior',segments:previous},variant('continuous','Toma continua',continuous.takes[id])]};
});

const playerCode = `
const people = ${safeJSON(people)};
const player = document.getElementById('player');
const pause = document.getElementById('playPause');
const stopButton = document.getElementById('stop');
const seek = document.getElementById('seek');
const time = document.getElementById('time');
const now = document.getElementById('now');
const status = document.getElementById('status');
let selected = null, timeline = [], total = 0, cursor = 0, playing = false;
let segmentIndex = 0, phase = 'idle', gapDeadline = 0, timer = null, serial = 0;
const stamp = seconds => Math.floor(Math.max(0,seconds)/60)+':'+String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0');
function position() {
  if (!selected) return 0;
  if (phase === 'audio') return Math.min(total,timeline[segmentIndex].start + (player.currentTime || 0));
  if (phase === 'gap') return Math.min(total,timeline[segmentIndex].after - Math.max(0,gapDeadline-performance.now())/1000);
  return cursor;
}
function clearGap() { clearTimeout(timer); timer = null; }
function controls() {
  const current = position();
  seek.value = String(current); seek.max = String(total || 1);
  seek.setAttribute('aria-valuetext',stamp(current)+' de '+stamp(total));
  time.textContent = stamp(current)+' / '+stamp(total);
  pause.textContent = playing ? 'Pausar' : 'Reproducir';
  pause.disabled = stopButton.disabled = seek.disabled = !selected;
  document.querySelectorAll('[data-choice]').forEach(button => {
    const chosen = selected && button.dataset.choice === selected.person.id+':'+selected.variant.key;
    button.setAttribute('aria-pressed',chosen ? 'true':'false');
  });
}
function finish() {
  clearGap(); player.pause(); phase='ended';cursor=total;playing=false;
  status.textContent='Diálogo terminado.';controls();
}
function waitGap(index,remaining) {
  phase='gap';segmentIndex=index;gapDeadline=performance.now()+remaining*1000;
  const generation=serial;
  timer=setTimeout(()=>{if(generation!==serial||!playing)return; if(index+1>=timeline.length)finish();else at(timeline[index+1].start,true);},Math.max(0,remaining*1000));
}
function at(seconds,shouldPlay) {
  if(!selected)return;
  clearGap();player.pause();serial++;
  cursor=Math.max(0,Math.min(total,seconds));playing=shouldPlay;
  if(cursor>=total){finish();return;}
  const index=timeline.findIndex(segment=>cursor<segment.after);
  if(index<0){finish();return;}
  segmentIndex=index;const segment=timeline[index];
  if(cursor>=segment.end){
    if(shouldPlay)waitGap(index,segment.after-cursor);else phase='paused';
    status.textContent=shouldPlay?'Escuchando…':'En pausa.';controls();return;
  }
  phase=shouldPlay?'audio':'paused';
  const offset=cursor-segment.start,generation=serial;
  player.src=segment.audio;player.load();
  const start=()=>{
    if(generation!==serial)return;
    player.currentTime=Math.min(offset,Number.isFinite(player.duration)?Math.max(0,player.duration-.001):offset);
    if(shouldPlay)player.play().catch(error=>{if(generation!==serial||error.name==='AbortError')return;playing=false;phase='paused';status.textContent='Pulsa reproducir para escuchar.';controls();});
  };
  if(player.readyState>=1)start();else player.addEventListener('loadedmetadata',start,{once:true});
  status.textContent=shouldPlay?'Escuchando…':'En pausa.';controls();
}
function choose(person,variant) {
  clearGap();player.pause();serial++;selected={person,variant};
  let start=0;
  timeline=variant.segments.map(segment=>{const row={...segment,start,end:start+segment.duration,after:start+segment.duration+segment.gap};start=row.after;return row;});
  total=start;cursor=0;now.textContent=person.name+' · '+variant.label;
  at(0,true);
}
document.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
  const [id,key]=button.dataset.choice.split(':');const person=people.find(row=>row.id===id);
  choose(person,person.variants.find(variant=>variant.key===key));
}));
pause.addEventListener('click',()=>{
  if(!selected)return;
  if(playing){cursor=position();clearGap();player.pause();serial++;playing=false;phase='paused';status.textContent='En pausa.';controls();}
  else at(cursor>=total?0:cursor,true);
});
stopButton.addEventListener('click',()=>{
  if(!selected)return;
  clearGap();serial++;player.pause();player.removeAttribute('src');player.load();playing=false;phase='idle';cursor=0;status.textContent='Detenido.';controls();
});
seek.addEventListener('input',()=>at(Number(seek.value),playing));
player.addEventListener('ended',()=>{
  if(!playing||phase!=='audio')return;
  const segment=timeline[segmentIndex];cursor=segment.end;
  if(segment.gap>0)waitGap(segmentIndex,segment.gap);
  else if(segmentIndex+1<timeline.length)at(timeline[segmentIndex+1].start,true);
  else finish();controls();
});
player.addEventListener('error',()=>{
  if(!selected||!player.getAttribute('src'))return;
  clearGap();playing=false;phase='paused';status.textContent='No se pudo reproducir. Pulsa la versión para reintentarlo.';controls();
});
document.addEventListener('keydown',event=>{
  if(event.code==='Space'&&event.target===pause){event.preventDefault();pause.click();}
});
function frame(){if(playing)controls();requestAnimationFrame(frame);}
controls();frame();
window.__continuityPreview={get:()=>({selected:selected?.person.id||null,variant:selected?.variant.key||null,playing,phase,index:segmentIndex,position:position(),duration:total,segments:timeline.length,serial})};
`;
new Function(playerCode);
const fonts = ['figtree','fraunces'].map((name,index)=>`@font-face{font-family:${index?'Fraunces':'Figtree'};src:url('data:font/woff2;base64,${fs.readFileSync(path.join(project,'dist/assets/fonts/'+name+'.woff2')).toString('base64')}') format('woff2');font-weight:100 900;font-display:swap}`).join('\n');
const faviconTag=fs.readFileSync(path.join(project,'dist/index.html'),'utf8').match(/<link\s+rel="icon"\s+href="data:image\/svg\+xml,[^"]+">/)?.[0];
assert(faviconTag,'Reuse the current game inline railway favicon');
const cards=people.map(person=>`<article class="card"><header class="person"><img src="${person.portrait}" width="88" height="110" alt="Retrato de ${escape(person.name)}"><div><h2>${escape(person.name)}</h2><p>${escape(person.role)}</p></div></header><blockquote><p>${escape(person.text)}</p></blockquote><div class="versions">${person.variants.map(variant=>`<button data-choice="${escape(person.id+':'+variant.key)}" aria-pressed="false"><span class="triangle" aria-hidden="true">▷</span>${escape(variant.label)}</button>`).join('')}</div></article>`).join('');
const html=`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prueba de continuidad de voces · Iberia Ferroviaria</title>${faviconTag}<style>${fonts}
:root{color-scheme:light;--ink:#183e35;--muted:#596b61;--paper:#f6f1e7;--line:#d2d9ca;--green:#184f40}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 Figtree,system-ui,sans-serif}main{max-width:1090px;margin:auto;padding:38px 24px 24px}.brand{font-size:12px;font-weight:800;letter-spacing:.17em;text-transform:uppercase;color:var(--muted)}h1,h2{font-family:Fraunces,Georgia,serif;font-weight:650;line-height:1.12}h1{font-size:clamp(29px,4.8vw,48px);max-width:800px;margin:13px 0 11px}.intro{margin:0;color:var(--muted)}.cards{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:30px}.card{background:#fffdf8;border:1px solid var(--line);border-radius:19px;padding:22px;box-shadow:0 8px 32px #184f4008}.person{display:flex;align-items:center;gap:17px}.person img{display:block;width:88px;height:110px;object-fit:cover;border-radius:12px;flex-shrink:0}.person h2{margin:0 0 8px;font-size:27px}.person p{margin:0;color:var(--muted);font-size:14px}blockquote{margin:21px 0 23px;font-size:17px;line-height:1.65}blockquote p{margin:0}.versions{display:grid;gap:10px}button{font:inherit;font-size:15px;font-weight:700;cursor:pointer;min-height:48px;border-radius:10px;border:1px solid var(--green);padding:11px 14px;color:var(--green);background:#fffdf8;touch-action:manipulation}button:hover{background:#edf2e9}button[aria-pressed=true]{background:var(--green);color:white}.triangle{margin-right:9px}button:focus-visible,input:focus-visible{outline:3px solid #ad7315;outline-offset:3px}button:disabled{opacity:.5;cursor:default}.transport{background:#e9efdf;border:1px solid #c5d1bb;border-radius:15px;padding:18px;margin-top:24px}.transport-head{display:flex;gap:12px;justify-content:space-between;align-items:baseline;margin-bottom:8px}#now{font-weight:750}#time{font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--muted);font-size:14px}#seek{display:block;width:100%;height:44px;accent-color:var(--green);margin:0 0 7px}.control-row{display:flex;gap:10px;align-items:center}.control-row button{min-width:110px;background:#fffdf8}#status{font-size:14px;color:var(--muted);margin:0}footer{margin:18px 0 0;font-size:14px;color:var(--muted)}audio{display:none}@media(max-width:720px){main{padding:26px 16px 21px}.cards{grid-template-columns:1fr;gap:17px;margin-top:23px}.card{padding:19px}.person h2{font-size:26px}.transport-head{display:block}#time{display:block;margin-top:5px}.control-row{flex-wrap:wrap}#status{flex-basis:100%}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style></head><body><main><div class="brand">Iberia Ferroviaria · 3.6.3</div><h1>Prueba de continuidad de voces</h1><p class="intro">Raquel e Íñigo · diálogos de la partida</p><div class="cards">${cards}</div><section class="transport" aria-label="Reproductor de voces"><div class="transport-head"><span id="now">Selecciona una versión para escuchar.</span><span id="time">0:00 / 0:00</span></div><input id="seek" type="range" min="0" max="1" value="0" step="0.05" aria-label="Posición del diálogo" disabled><div class="control-row"><button id="playPause" disabled>Reproducir</button><button id="stop" disabled>Detener</button><p id="status" role="status" aria-live="polite">Un diálogo cada vez.</p></div></section><footer>Esta prueba contiene dos voces. El juego completo se está actualizando.</footer><audio id="player" preload="metadata"></audio></main><script>${playerCode.replaceAll('</script','<\\/script')}</script></body></html>\n`;
assert.equal((html.match(/<audio\b/g)||[]).length,1);
assert.equal((html.match(/data-choice=/g)||[]).length,people.reduce((sum,p)=>sum+p.variants.length,0));
assert(!/\bSpeechSynthesisUtterance\b|\bspeechSynthesis\b|(?:src|href)=["'](?!data:|#)/.test(html));
assert(html.includes(faviconTag));
for(const person of people){
  assert.equal(sha(Buffer.from(person.text)),person.canonical_sha256);
  assert(html.includes(escape(person.text)));
  for(const variant of person.variants)for(const segment of variant.segments){
    assert.equal(sha(Buffer.from(segment.audio.split(',')[1],'base64')),segment.sha256);
    assert(Number.isFinite(segment.duration)&&segment.duration>0);
  }
}
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);
const report={schema:1,status:'offline-continuity-preview-built',version:'3.6.3',people:people.length,
  alternatives_per_person:people[0].variants.length,html_file:path.relative(project,output),html_bytes:Buffer.byteLength(html),html_sha256:sha(Buffer.from(html)),
  game_catalogue_published:false,preview_is_complete_game:false,human_listening:false,native_browser_verification:false,
  single_media_element:true,no_system_synthesis:true,canonical_text_unchanged:true,
  continuous_manifest_sha256:continuous.manifest_sha256,continuous_asr_sha256:continuous.asr_sha256,
  continuous_stage:path.relative(voiceRoot,stage),continuous_precision:continuous.precision,
  continuous_actual_execution:continuous.actual_execution,continuous_source_verification:continuous.source_verification,
  sources:people.map(person=>({id:person.id,person:person.person,canonical_sha256:person.canonical_sha256,portrait_sha256:sha(Buffer.from(person.portrait.split(',')[1],'base64')),
    alternatives:person.variants.map(variant=>({key:variant.key,label:variant.label,segments:variant.segments.map(({audio,...record})=>record)}))}))};
fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,report:reportFile,bytes:report.html_bytes,sha256:report.html_sha256,people:report.people,alternatives:report.alternatives_per_person,native_browser_verification:false}));
