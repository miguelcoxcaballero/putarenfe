// Explicitly partial, standalone preview. It never publishes the official voice
// asset or changes the strict final builder; complete registered takes are frozen.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {DIALOGUE_CATALOGUE} from './voice_dialogues.mjs';
import {loadCurrentVoicePack} from './current_voice_pack.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(project, 'dist');
const outputs = path.resolve(project, '../outputs');
const stage = path.resolve(process.env.PLAYABLE_PREVIEW_STAGE || path.join(project, '../investigacion/voces/generadas-qwen-dialogos-3.6.3-torrente'));
const output = path.join(outputs, 'Iberia-Ferroviaria-avance-3.6.3.html');
const main = path.join(outputs, 'Iberia-Ferroviaria.html');
const limit = Number(process.env.PLAYABLE_PREVIEW_LIMIT || 72);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert(Number.isInteger(limit) && limit > 0 && limit <= DIALOGUE_CATALOGUE.length, 'preview voice limit');
assert.equal(DIALOGUE_CATALOGUE.length, 412);
const mainBefore = fs.existsSync(main) ? sha(fs.readFileSync(main)) : null;
const manifestBytes = fs.readFileSync(path.join(stage, 'manifest.json'));
const manifestSHA256 = sha(manifestBytes), manifest = JSON.parse(manifestBytes);
const referencePack = loadCurrentVoicePack(project, manifest, DIALOGUE_CATALOGUE);
const rows = DIALOGUE_CATALOGUE.filter(row => manifest.takes?.[row.id]).slice(0, limit);
assert.equal(rows.length, limit, 'the preview only freezes completed registered takes');
const time = new Date().toISOString();
const snapshot = path.resolve(project, '../investigacion/voces/avance-jugable-3.6.3', time.replace(/[:.]/g, '-') + '-' + manifestSHA256.slice(0, 8));
fs.mkdirSync(snapshot, {recursive:true});
fs.writeFileSync(path.join(snapshot, 'manifest-source.json'), manifestBytes, {flag:'wx', mode:0o444});
fs.writeFileSync(path.join(snapshot, 'reference-pack-source.json'), referencePack.bytes, {flag:'wx', mode:0o444});
const clips = {}, recordings = [];
for (const row of rows) {
  const take = manifest.takes[row.id];
  assert.equal(take.id, row.id); assert.equal(take.person, row.person);
  assert.equal(take.text, row.text, 'unchanged complete spoken body');
  assert.equal(take.validated, true); assert.equal(take.raw_validated, true);
  assert.equal(take.finite, true); assert.equal(take.eos_observation?.eos_found, true);
  assert(Number.isFinite(take.duration) && take.duration > 0);
  assert.match(take.sha256, /^[a-f0-9]{64}$/);
  assert.equal(take.mp3, row.id + '.mp3', 'a take cannot escape its source stage');
  const source = path.join(stage, take.mp3);
  assert(!fs.lstatSync(source).isSymbolicLink(), 'source take is a regular file');
  const bytes = fs.readFileSync(source);
  assert.equal(sha(bytes), take.sha256, 'MP3 bytes match the registered complete take');
  const frozen = path.join(snapshot, take.mp3);
  fs.writeFileSync(frozen, bytes, {flag:'wx', mode:0o444});
  assert.equal(sha(fs.readFileSync(frozen)), take.sha256, 'physical snapshot copy is exact');
  clips[row.id] = bytes.toString('base64');
  recordings.push({id:row.id, person:row.person, kind:row.kind, source:row.source,
    raw:row.raw, mp3:take.mp3, sourcePath:source, snapshotPath:frozen,
    bytes:bytes.length, sha256:take.sha256, duration:take.duration,
    referenceSHA256:take.reference_sha256, modelFingerprint:take.model_fingerprint});
}
const available = Object.keys(clips).length;
const label = `Avance en pruebas · ${available}/412 voces completas · resto con subtítulos`;
const order = ['assets/geography.js','assets/railways.js','assets/timetable.js','assets/infra.js','data.js','story.js','schedule.js','infra.js','network.js',
  'induction.js','induction-runtime.js','encounters.js','tycoon.js','engine.js','operations.js','map-v3.js','train-art.js','train3d.js','city-art.js','assets/samples-index.js','music.js','assets/voices.js','assets/voice-dialogues.js','voice.js','dialogue-presentation.js','sfx.js','assets/portraits.js','faces.js','tycoon-ui.js','main-menu.js','induction-task-ui.js','app.js'];
const sources = [];
const read = file => {
  const bytes = fs.readFileSync(path.join(dist, file));
  sources.push({file, bytes:bytes.length, sha256:sha(bytes)}); return bytes.toString('utf8');
};
function bundle(file) {
  let text = file === 'assets/voices.js' ? 'export const CLIPS = {};\n'
    : file === 'assets/voice-dialogues.js' ? 'export const DIALOGUES = ' + JSON.stringify(clips) + ';\n' : read(file);
  if (file === 'main-menu.js') {
    const anchor = '<h2 id="menu-departures-title">¿Adónde vamos?</h2>';
    assert.equal(text.split(anchor).length - 1, 1, 'unique illustrated menu notice placement');
    text = text.replace(anchor, anchor + `<p class="menu-preview-note" role="status">${label}</p>`);
  }
  if (file === 'app.js') {
    const anchor = "onerror: () => { clear();toast('No se ha podido reproducir la voz. Puedes seguir leyendo el diálogo o volver a escucharlo.'); }";
    assert.equal(text.split(anchor).length - 1, 1, 'only the preview adjusts the known missing-recording notice');
    text = 'let previewMissingNoticeShown = false;\n' + text.replace(anchor,
      "onerror: error => { clear(); if(error.code==='MISSING_RECORDING'){ if(!previewMissingNoticeShown){ previewMissingNoticeShown=true;toast('Esta voz aún está en producción. Puedes seguir jugando con el diálogo escrito.'); } return; } toast('No se ha podido reproducir la voz. Puedes seguir leyendo el diálogo o volver a escucharlo.'); }");
  }
  const dir = path.posix.dirname(file), resolve = spec => path.posix.normalize(path.posix.join(dir, spec));
  text = text.replace(/^import\s+\*\s+as\s+(\w+)\s+from\s+'([^']+)';?\s*$/gm, (_, name, spec) => `const ${name} = __m[${JSON.stringify(resolve(spec))}];`);
  text = text.replace(/^import\s+\{([^}]*)\}\s+from\s+'([^']+)';?\s*$/gm, (_, names, spec) => `const {${names.replace(/\s+as\s+/g, ': ')}} = __m[${JSON.stringify(resolve(spec))}];`);
  const exported = new Set();
  text = text.replace(/^export\s+\{([^}]*)\};?\s*$/gm, (_, names) => { names.split(',').map(x => x.trim()).filter(Boolean).forEach(x => exported.add(x)); return ''; });
  text = text.replace(/\bexport\s+((?:async\s+)?function\*?|const|let|class)\s+(\w+)/g, (_, kind, name) => { exported.add(name); return `${kind} ${name}`; });
  if (/^\s*(import|export)\s/m.test(text)) throw Error('Unsupported module syntax: ' + file);
  return `// ---- ${file}\n__m[${JSON.stringify(file)}] = (() => {\n${text}\nreturn {${[...exported].join(', ')}};\n})();\n`;
}
const code = 'const __m = {};\n' + order.map(bundle).join('\n');
new Function(code);
assert(code.includes('const CLIPS = {};'), 'no previous sentence recordings');
const voiceSource = fs.readFileSync(path.join(dist, 'voice.js'), 'utf8');
assert(!/speechSynthesis|SpeechSynthesisUtterance/.test(voiceSource), 'no automatic browser voices');
let html = read('index.html');
let css = read('style-v3.css') + '\n' + read('main-menu.css') + '\n' + read('induction.css');
css += '\n.menu-preview-note{padding:9px 12px;margin:10px 0 15px;border:1px solid #cda85d66;border-radius:8px;background:#f8e7ba;color:#493019;font-size:12px;line-height:1.5;}\n';
const mime = {png:'image/png',jpg:'image/jpeg',woff2:'font/woff2'};
css = css.replace(/url\('assets\/([^']+)'\)/g, (_, asset) => {
  const bytes = fs.readFileSync(path.join(dist, 'assets', asset));
  sources.push({file:'assets/'+asset, bytes:bytes.length, sha256:sha(bytes)});
  return `url('data:${mime[asset.split('.').pop()]};base64,${bytes.toString('base64')}')`;
});
html = html.replace('<link rel="stylesheet" href="main-menu.css">','').replace('<link rel="stylesheet" href="induction.css">','')
  .replace('<link rel="stylesheet" href="style-v3.css">', () => '<style>'+css+'</style>')
  .replace('<script src="assets/three.min.js"></script>', () => '<script>'+read('assets/three.min.js').replaceAll('</script','<\\/script')+'</script>')
  .replace('<script type="module" src="app.js"></script>', () => '<script>\n(() => {\n'+code.replaceAll('</script','<\\/script')+'\n})();\n</script>')
  .replace('</body>', () => '<script type="text/plain" id="geodata-license">'+fs.readFileSync(path.join(project,'LICENSE-GEODATA.txt'),'utf8').replaceAll('</script','<\\/script')+'</script></body>');
const base = "<script>globalThis.IBERIA_SAMPLE_BASE = 'assets/';</script>";
assert(html.includes(base));
html = html.replace(base, () => ['ui','orquesta','teclas','percusion'].map(group => '<script>'+read(`assets/muestras-${group}.js`).replaceAll('</script','<\\/script')+'</script>').join(''));
assert(html.includes(label));
assert(!/<script[^>]+\bsrc=|<link[^>]+rel="stylesheet"/.test(html), 'standalone scripts and styles');
for (const match of css.matchAll(/url\(([^)]+)\)/g)) assert(/^["']?(data:|blob:|#)/.test(match[1].trim()), 'standalone CSS assets');
fs.mkdirSync(outputs, {recursive:true});
const temporary = output+'.tmp'; fs.writeFileSync(temporary, html); fs.renameSync(temporary, output);
assert.equal(fs.existsSync(main) ? sha(fs.readFileSync(main)) : null, mainBefore, 'the delivered main HTML is unchanged');
const report = {schema:1, createdAt:time, status:'partial-preview-built', version:'3.6.3',
  warning:label, availableWholeDialogues:available, expectedWholeDialogues:412,
  missingWholeDialogues:DIALOGUE_CATALOGUE.filter(row => !clips[row.id]).map(row => row.id),
  noSentenceClips:true, noBrowserVoiceFallback:true, playback:'one unchanged complete recording per registered dialogue',
  missingAudioBehavior:'dialogue and choices remain playable; one notice per session; remaining bodies keep subtitles',
  sourceManifest:path.join(stage,'manifest.json'), sourceManifestStatus:manifest.status,
  sourceManifestSHA256:manifestSHA256, frozenManifest:path.join(snapshot,'manifest-source.json'), snapshot,
  sourceReferencePack:referencePack.source, sourceReferencePackSHA256:referencePack.sha256,
  frozenReferencePack:path.join(snapshot,'reference-pack-source.json'), references:referencePack.references,
  output, outputBytes:Buffer.byteLength(html), outputSHA256:sha(html), mainUnchanged:true, mainSHA256:mainBefore,
  catalogueSHA256:sha(fs.readFileSync(path.resolve(project,'../investigacion/voces/dialogos-3.6.3.json'))),
  validation:{registeredMP3Hashes:true, physicalCopiesExact:true, eosObserved:true, sourceSignalValidated:true,
    currentReferencePack:true, currentTakeReferenceHashes:true, currentCatalogue:true,
    bundleSyntax:true, standaloneAssets:true, browserTested:false, humanListening:false}, recordings, sources};
fs.writeFileSync(path.join(snapshot,'preview-provenance.json'), JSON.stringify(report,null,2)+'\n', {flag:'wx',mode:0o444});
fs.writeFileSync(path.resolve(project,'../investigacion/voces/avance-jugable-3.6.3/latest.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output, bytes:report.outputBytes, sha256:report.outputSHA256, voices:available, total:412, snapshot,
  mainUnchanged:true, browserTested:false},null,2));
