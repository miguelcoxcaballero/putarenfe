// Reproducción real del HTML autónomo, con observación de Web Audio nativo.
// No cambia voces/diálogos de producción ni simula decodeAudioData, start o ended.
// Uso: node voice-game-ui-test.mjs [ruta a Playwright]
// VOICE_GAME_ALLOW_PARTIAL=1 prepara un ensayo sin certificar el catálogo final.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const input = path.resolve(process.env.VOICE_GAME_HTML || path.join(root, '../outputs/Iberia-Ferroviaria.html'));
const catalogFile = path.join(root, '../investigacion/voces/dialogos-3.6.3.json');
const manifestFile = path.resolve(process.env.VOICE_GAME_MANIFEST || path.join(root, '../investigacion/voces/generadas-qwen-dialogos-3.6.3-torrente/manifest.json'));
const out = path.resolve(process.env.VOICE_GAME_OUT || path.join(root, '../investigacion/verificacion-voces-juego-3.6.3'));
const partial = process.env.VOICE_GAME_ALLOW_PARTIAL === '1';
const transport = process.env.VOICE_GAME_TRANSPORT || 'file';
const timeout = Number(process.env.VOICE_GAME_TIMEOUT || 60000);
const sha = value => createHash('sha256').update(value).digest('hex');
const original = fs.readFileSync(input, 'utf8');
const catalogBytes = fs.readFileSync(catalogFile);
const catalog = JSON.parse(catalogBytes);
const manifestBytes = fs.readFileSync(manifestFile);
const manifest = JSON.parse(manifestBytes);
assert.equal(catalog.length, 412, 'el catálogo final contiene 412 diálogos completos');
assert.equal(new Set(catalog.map(x => x.id)).size, 412, 'IDs canónicos únicos');
if (!partial) {
  assert.equal(manifest.status, 'complete', 'la producción completa ha terminado');
  assert(manifest.ended_at, 'la producción final tiene un cierre registrado');
  assert.deepEqual(Object.keys(manifest.takes || {}).sort(), catalog.map(x => x.id).sort(), 'el manifiesto declara cada diálogo completo');
  assert.deepEqual(manifest.failures || {}, {}, 'sin errores de producción pendientes');
}
assert(['file', 'http'].includes(transport), 'transporte explícito file o http');
const anchor = 'window.railwayGame = {';
assert.equal(original.split(anchor).length - 1, 1, 'punto único de observación del juego real');
const observed = original.replace(anchor, `globalThis.__voiceRuntime = {
  CLIPS: __m["assets/voices.js"].CLIPS,
  DIALOGUES: __m["assets/voice-dialogues.js"]?.DIALOGUES || {},
  Voices: __m["voice.js"].Voices, CAST: __m["voice.js"].CAST,
  sentences: __m["voice.js"].sentences, clipId: __m["voice.js"].clipId,
  encounters: __m["encounters.js"].ENCOUNTERS
};\n${anchor}`);
// La copia temporal sólo expone los módulos que ya están dentro del mismo HTML.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'iberia-voice-game-'));
fs.mkdirSync(out, {recursive: true});
const report = {
  startedAt: new Date().toISOString(), html: path.basename(input), htmlSHA256: sha(original),
  catalogSHA256: sha(catalogBytes), manifestSHA256: sha(manifestBytes), manifest: path.basename(path.dirname(manifestFile)),
  testSourceSHA256: sha(fs.readFileSync(fileURLToPath(import.meta.url))),
  expectedWholeDialogues: 412, partialRehearsal: partial,
  transport, nativeAudio: true, productionFilesModified: false,
  textOrDialogueModified: false, scenarioStateFixture: true,
  scope: 'Nueve diálogos canónicos completos, controles reales de escuchar/repetir/parar; móvil 320 y 390.',
  limitation: 'Comprueba decodificación y reproducción; no evalúa naturalidad, acento ni parecido de la voz.',
  samples: [], mobile: [], errors: [], unexpectedRequests: [], status: 'running'
};
let browser, server;

// Se conserva el comportamiento nativo. Las envolturas sólo registran conexiones,
// las fuentes reales de Voices y el evento ended emitido por Chromium.
function observeNativeAudio() {
  const qa = window.__voiceQA = {starts: [], decodes: [], speechCalls: [], connections: [], sequence: 0};
  const nodeIds = new WeakMap(), edges = new WeakMap(), buffers = new WeakMap(), bufferDecodes = new WeakMap(), playing = new WeakMap();
  const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
  const identity = node => {
    if (!nodeIds.has(node)) nodeIds.set(node, ++qa.sequence);
    return {id: nodeIds.get(node), type: node.constructor.name};
  };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(destination, ...args) {
    const result = connect.call(this, destination, ...args);
    const links = edges.get(this) || [];
    links.push(destination); edges.set(this, links);
    qa.connections.push({from: identity(this), to: identity(destination)});
    return result;
  };
  const pathFrom = source => {
    const nodes = [], seen = new Set();
    for (let node = source; node && !seen.has(node);) {
      seen.add(node); const links = edges.get(node) || [];
      nodes.push({...identity(node), outgoing: links.length,
        ...(node instanceof GainNode ? {gain: node.gain.value} : {})});
      if (links.length !== 1) break;
      node = links[0];
    }
    return nodes;
  };
  const decode = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function(bytes, ...args) {
    const entry = {bytes: bytes.byteLength, at: performance.now()}; qa.decodes.push(entry);
    digest(bytes.slice(0)).then(hash => {entry.mp3SHA256 = hash;}, error => {entry.hashError = String(error);});
    const result = decode.call(this, bytes, ...args);
    result?.then?.(buffer => {
      bufferDecodes.set(buffer, entry);
      Object.assign(entry, {duration: buffer.duration, sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels, nativeBuffer: buffer instanceof AudioBuffer});
    }, error => { entry.error = String(error); });
    return result;
  };
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function(...args) {
    const voice = window.railwayGame?.voices;
    if (voice?.source === this) {
      const buf = this.buffer, pcm = buf.getChannelData(0);
      let square = 0, peak = 0, n = 0;
      for (let i = 0; i < pcm.length; i += 8) { square += pcm[i] ** 2; peak = Math.max(peak, Math.abs(pcm[i])); n++; }
      const entry = {
        index: qa.starts.length, source: identity(this), clipId: buffers.get(buf)?.id,
        clipKind: buffers.get(buf)?.kind, speakingMode: voice.speaking?.mode,
        person: voice.speaking?.person, at: performance.now(), duration: buf.duration,
        sampleRate: buf.sampleRate, channels: buf.numberOfChannels,
        nativeBuffer: buf instanceof AudioBuffer, contextState: this.context.state,
        playbackRate: this.playbackRate.value, detune: this.detune.value,
        rms: Math.sqrt(square / n), peak, path: pathFrom(this), volume: voice.volume,
        decode: bufferDecodes.get(buf)
      };
      digest(pcm.slice().buffer).then(hash => {entry.pcmSHA256 = hash;}, error => {entry.hashError = String(error);});
      qa.starts.push(entry); playing.set(this, entry);
      this.addEventListener('ended', () => { entry.endedAt = performance.now(); entry.nativeEnded = true; }, {once: true});
    }
    return start.apply(this, args);
  };
  const stop = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.stop = function(...args) {
    const entry = playing.get(this);
    if (entry) entry.stoppedAt = performance.now();
    return stop.apply(this, args);
  };
  if (window.speechSynthesis) {
    const speak = window.speechSynthesis.speak;
    window.speechSynthesis.speak = function(utterance) {
      qa.speechCalls.push({text: utterance.text, at: performance.now()});
      return speak.call(this, utterance);
    };
  }
  qa.attach = () => {
    const player = window.railwayGame.voices, buffer = player.buffer;
    player.buffer = function(id, ...args) {
      const result = buffer.call(this, id, ...args);
      result.then(buf => buffers.set(buf, {id, kind:args[0] || 'S'}), () => {});
      return result;
    };
  };
  // Evita que música/SFX y lectura automática oculten los botones bajo prueba.
  // Voices, su AudioContext y las cortinillas conservan su implementación real.
  try {
    localStorage.setItem('iberia-musica', JSON.stringify({enabled: false}));
    localStorage.setItem('iberia-efectos', JSON.stringify({enabled: false}));
    localStorage.setItem('iberia-voz', JSON.stringify({enabled: false, volume: .73}));
  } catch {}
}

function assertVoicePath(entry) {
  assert.equal(entry.nativeBuffer, true, 'AudioBuffer nativo decodificado');
  assert.equal(entry.contextState, 'running', 'contexto activo al empezar');
  assert(entry.duration > .2 && Number.isFinite(entry.duration), 'duración de audio real');
  assert(entry.rms > .00001 && entry.peak > .0001, 'PCM decodificado contiene señal');
  assert.equal(entry.playbackRate, 1, 'sin cambio de velocidad de la grabación');
  assert.equal(entry.detune, 0, 'sin cambio de tono de la grabación');
  assert.deepEqual(entry.path.map(x => x.type), ['AudioBufferSourceNode', 'GainNode', 'AudioDestinationNode'], 'voz directa al volumen y salida, sin EQ/compresor');
  assert.deepEqual(entry.path.map(x => x.outgoing), [1, 1, 0], 'una sola ruta de salida');
  assert(Math.abs(entry.path[1].gain - entry.volume) < 1e-6, 'ganancia respeta el volumen real de Voices (AudioParam float32)');
}

try {
  let url;
  if (transport === 'file') {
    const tempHTML = path.join(scratch, 'Iberia-Ferroviaria-observada.html');
    fs.writeFileSync(tempHTML, observed); url = pathToFileURL(tempHTML).href;
  } else {
    server = http.createServer((req, res) => {
      if (req.url !== '/Iberia-Ferroviaria.html') { res.writeHead(404); res.end(); return; }
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); res.end(observed);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${server.address().port}/Iberia-Ferroviaria.html`;
  }
  const pw = process.argv[2] || process.env.PLAYWRIGHT_MODULE || 'playwright';
  const {chromium} = await import(pw.startsWith('/') ? pathToFileURL(pw).href : pw);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: [
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--autoplay-policy=no-user-gesture-required'
  ]});
  report.browser = browser.version();
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, serviceWorkers: 'block'});
  await context.addInitScript(observeNativeAudio);
  const page = await context.newPage(); page.setDefaultTimeout(timeout);
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && request.url() !== url) report.unexpectedRequests.push(request.url());
  });
  if (transport === 'file') await context.setOffline(true);
  await page.goto(url, {waitUntil: 'load', timeout});
  await page.waitForFunction(() => window.railwayGame && window.__voiceRuntime && window.__voiceQA);
  await context.setOffline(true);
  report.offlineDuringAllPlayback = true;
  const packageCheck = await page.evaluate(expected => {
    const rt = window.__voiceRuntime, g = window.railwayGame, ids = Object.keys(rt.DIALOGUES), wanted = new Set(expected.map(x => x.id));
    return {
      usesRealVoicesClass: g.voices instanceof rt.Voices,
      wholeDialogueCount: ids.length, sentenceClipCount: Object.keys(rt.CLIPS).length,
      missing: expected.filter(x => !rt.DIALOGUES[x.id]).map(x => x.id),
      stale: ids.filter(id => !wanted.has(id)), invalid: expected.filter(x => rt.clipId(x.person, x.raw) !== x.id).map(x => x.id),
      externalScripts: [...document.querySelectorAll('script[src]')].map(el => el.src),
      externalStyles: [...document.querySelectorAll('link[rel="stylesheet"]')].map(el => el.href),
      externalCSS: [...document.querySelectorAll('style')].flatMap(el => [...el.textContent.matchAll(/url\(([^)]+)\)/g)]
        .map(m => m[1].trim().replace(/^['"]|['"]$/g, '')).filter(value => !/^(data:|blob:|#)/.test(value)))
    };
  }, catalog);
  report.package = packageCheck;
  assert.equal(packageCheck.usesRealVoicesClass, true, 'se prueba la instancia real de Voices usada por la app');
  assert.deepEqual(packageCheck.invalid, [], 'IDs del HTML coinciden con los textos canónicos');
  for (const field of ['externalScripts', 'externalStyles', 'externalCSS']) assert.deepEqual(packageCheck[field], [], field + ' incrustados');
  if (!partial) {
    assert.equal(packageCheck.wholeDialogueCount, 412, 'paquete final de diálogos completos');
    assert.equal(packageCheck.sentenceClipCount, 0, 'el HTML final no incluye las tomas fragmentadas anteriores');
    assert.deepEqual(packageCheck.missing, [], 'todos los diálogos actuales tienen una toma completa');
    assert.deepEqual(packageCheck.stale, [], 'sin diálogos obsoletos en el paquete final');
  }
  await page.evaluate(() => {
    const g = window.railwayGame; g.voices.enabled = false; g.voices.volume = .73;
    g.music.enabled = false; g.music.stop?.(); g.sfx.enabled = false;
    window.__voiceQA.attach();
  });
  await page.click('[data-action=free-setup]');
  await page.selectOption('#freeCash', '500'); await page.uncheck('#freeRivals');
  await page.click('[data-action=free-begin]');
  const samples = await page.evaluate(expected => {
    const rt = window.__voiceRuntime, canon = new Map(expected.map(x => [x.id, x]));
    return Object.keys(rt.CAST).map(person => {
      for (const scene of rt.encounters.filter(x => x.person === person)) {
        const raw = scene.body, parts = rt.sentences(raw), id = rt.clipId(person, raw), canonical = canon.get(id);
        if (!canonical || canonical.raw !== raw || parts.length < 2) continue;
        const whole = !!rt.DIALOGUES[id], ids = whole ? [id] : parts.map(part => rt.clipId(person, part));
        const clips = ids.map((clip, i) => ({id:clip, kind:whole ? 'D' : 'S', raw:whole ? raw : parts[i],
          base64:(whole ? rt.DIALOGUES[clip] : rt.CLIPS[clip]) || null}));
        if (clips.every(clip => clip.base64)) return {person, raw, id, scene:scene.id, parts, plan:whole ? 'dialogue' : 'fragments', clips};
      }
      throw Error('Falta un diálogo canónico completo y grabado de ' + person);
    });
  }, catalog);
  assert.equal(samples.length, 9, 'los nueve personajes tienen un diálogo actual completo');
  for (const sample of samples) {
    if (!partial) assert.equal(sample.plan, 'dialogue', 'el cuerpo entero de cada personaje usa una sola toma');
    sample.clips = sample.clips.map(({base64, ...clip}) => {
      const take = manifest.takes?.[clip.id], hash = sha(Buffer.from(base64, 'base64'));
      if (!partial) {
        assert(take, 'toma declarada en el manifiesto final: ' + clip.id);
        assert.equal(take.person, sample.person, 'personaje de la toma continua');
        assert.equal(take.sha256, hash, 'bytes del diálogo publicados iguales a la producción final');
      }
      return {...clip, sha256:hash, productionSHA256:take?.sha256 || null,
        declaredReferenceSHA256:take?.reference_sha256 || null, declaredDuration:take?.duration || null};
    });
  }

  async function playSample(sample, label) {
    await page.evaluate(({scene, raw, parts}) => {
      const g = window.railwayGame; g.voices.enabled = false;
      g.state().tycoon.encounter = scene; g.navigate('ops'); g.render();
      // play() abre la decisión real, con la misma UI que encuentra el jugador.
      g.play();
      const paragraph = document.querySelector('#modal [data-say]');
      if (!paragraph) throw Error('La decisión no abrió su diálogo');
      if (paragraph.dataset.say !== raw) throw Error('La decisión no abrió el cuerpo canónico completo');
      if (paragraph.textContent.replace(/\s+/g, ' ').trim() !== raw.replace(/\s+/g, ' ').trim()) throw Error('El texto mostrado no coincide con el cuerpo entero');
      if (paragraph.querySelectorAll('.say-s').length !== parts.length) throw Error('Faltan subtítulos del diálogo completo');
      g.voices.enabled = true;
    }, sample);
    const button = page.locator(`#modal [data-action=say][data-person=${sample.person}]`);
    const portrait = page.locator('#modal .portrait');
    const image = await portrait.evaluate(async el => {
      const bg = getComputedStyle(el).backgroundImage;
      const uri = bg.match(/url\(["']?(data:image\/[\s\S]*?)["']?\)/)?.[1];
      if (!uri) throw Error('Retrato sin fotografía incrustada');
      const img = new Image(); img.src = uri; await img.decode();
      return {embedded: true, width: img.naturalWidth, height: img.naturalHeight};
    });
    assert(image.width > 0 && image.height > 0, 'retrato decodificado sin red');
    const before = await page.evaluate(() => window.__voiceQA.starts.length);
    await button.click();
    await page.waitForFunction(n => window.__voiceQA.starts.length === n + 1, before, {timeout});
    assert.equal(await page.locator('#modal .say-s.on').count(), 1, 'subtítulo activo al comenzar');
    assert(await portrait.evaluate(el => el.classList.contains('talking')), 'retrato responde a la lectura');
    const first = await page.evaluate(n => window.__voiceQA.starts[n], before);
    assert.equal(first.person, sample.person); assert.equal(first.clipId, sample.clips[0].id); assert.equal(first.clipKind, sample.clips[0].kind); assertVoicePath(first);
    if (!partial) assert.equal(first.speakingMode, 'dialogue');
    const expectedDuration = sample.clips.reduce((sum, clip) => sum + Number(clip.declaredDuration || 20), 0);
    await page.waitForFunction(({n, count}) => {
      const qa = window.__voiceQA, voice = window.railwayGame.voices;
      return qa.starts.length >= n + count && qa.starts.slice(n, n + count).every(entry => entry.nativeEnded && entry.pcmSHA256 && entry.decode?.mp3SHA256) && !voice.speaking;
    }, {n:before, count:sample.clips.length}, {timeout: Math.max(timeout, expectedDuration * 1000 + 10000)});
    assert.equal(await page.locator('#modal .say-s.on').count(), 0, 'subtítulo limpio al acabar');
    assert(!await portrait.evaluate(el => el.classList.contains('talking')), 'retrato limpio al acabar');
    const completed = await page.evaluate(n => window.__voiceQA.starts.slice(n), before);
    assert.equal(completed.length, sample.clips.length, 'se reproduce exactamente el cuerpo entero, sin cambiar de fuente en tomas continuas');
    for (let i = 0; i < completed.length; i++) {
      const entry = completed[i], expected = sample.clips[i];
      assert.equal(entry.clipId, expected.id); assert.equal(entry.clipKind, expected.kind); assert.equal(entry.person, sample.person); assertVoicePath(entry);
      assert.equal(entry.decode.mp3SHA256, expected.sha256, 'MP3 realmente decodificado de la toma esperada');
      assert.match(entry.pcmSHA256, /^[a-f0-9]{64}$/, 'huella del PCM realmente reproducido');
      assert.equal(entry.stoppedAt, undefined, 'primera lectura termina de forma natural');
      assert(entry.endedAt - entry.at >= entry.duration * 1000 - 250, 'ended se produce después de reproducir la grabación completa');
    }
    assert.equal(await page.locator('#modal [data-say]').getAttribute('data-say'), sample.raw, 'QA conserva data-say completo al terminar');
    const replayIndex = before + completed.length;
    await button.click();
    await page.waitForFunction(n => window.__voiceQA.starts.length === n + 1, replayIndex, {timeout});
    const replay = await page.evaluate(n => window.__voiceQA.starts[n], replayIndex);
    assert.equal(replay.clipId, sample.clips[0].id, 'repetir comienza el mismo diálogo real'); assert.equal(replay.clipKind, sample.clips[0].kind); assertVoicePath(replay);
    await button.click();
    await page.waitForFunction(n => window.__voiceQA.starts[n]?.nativeEnded && !window.railwayGame.voices.speaking && !window.railwayGame.voices.source, replayIndex, {timeout});
    const stopped = await page.evaluate(n => window.__voiceQA.starts[n], replayIndex);
    assert(Number.isFinite(stopped.stoppedAt), 'botón real llama a stop');
    assert(stopped.stoppedAt - stopped.at < stopped.duration * 1000, 'el control detiene dentro del diálogo completo');
    assert.equal(await page.locator('#modal .say-s.on').count(), 0, 'parar limpia el subtítulo');
    assert(!await portrait.evaluate(el => el.classList.contains('talking')), 'parar limpia el retrato');
    await page.waitForTimeout(450);
    assert.equal(await page.evaluate(() => window.__voiceQA.starts.length), replayIndex + 1, 'no continúa el diálogo cancelado');
    assert.equal(await page.locator('#modal [data-say]').getAttribute('data-say'), sample.raw, 'repetir y parar tampoco recortan data-say');
    const dimensions = await page.evaluate(() => ({viewport: innerWidth, document: document.scrollingElement.scrollWidth,
      dialog: document.getElementById('modal').scrollWidth, dialogClient: document.getElementById('modal').clientWidth}));
    assert(dimensions.document <= dimensions.viewport + 1, 'diálogo sin desbordamiento horizontal');
    assert(dimensions.dialog <= dimensions.dialogClient + 1, 'contenido del diálogo sin desbordamiento horizontal');
    const result = {...sample, label, portrait: image, dimensions, completed, replayStopped: stopped};
    await page.screenshot({path: path.join(out, `${label}.png`), animations: 'disabled', timeout});
    await page.click('#modal .choice >> nth=0');
    await page.waitForFunction(() => !document.getElementById('modal').open);
    return result;
  }

  for (const sample of samples) {
    report.samples.push(await playSample(sample, 'desktop-' + sample.person));
    console.log(`PASS ${sample.person}: diálogo completo (${sample.parts.length} frases), ended nativo, repetir/parar y salida directa.`);
  }
  for (const [width, height, person] of [[320, 740, 'president'], [390, 844, 'successor']]) {
    await page.setViewportSize({width, height});
    const result = await playSample(samples.find(x => x.person === person), 'mobile-' + width);
    const dimensions = result.dimensions;
    assert(dimensions.document <= width + 1, 'sin desplazamiento horizontal en móvil ' + width);
    report.mobile.push({width, height, dimensions, sample: result});
    console.log(`PASS móvil ${width}: escuchar/repetir/parar sin red y sin desbordamiento horizontal.`);
  }
  const final = await page.evaluate(() => ({
    speechCalls: window.__voiceQA.speechCalls, decodes: window.__voiceQA.decodes,
    context: window.railwayGame.music.ctx.state,
    images: [...document.images].map(img => ({embedded: /^(data:|blob:)/.test(img.currentSrc || img.src), loaded: img.complete && img.naturalWidth > 0}))
  }));
  report.nativeDecoder = final.decodes; report.speechSynthesisCalls = final.speechCalls.length;
  assert.deepEqual(final.speechCalls, [], 'ninguna frase utiliza SpeechSynthesis.speak');
  assert(final.decodes.some(x => x.nativeBuffer && x.bytes > 0), 'se ejecutó el decodificador nativo sobre el audio incrustado');
  assert(final.decodes.every(x => !x.error), 'sin fallos de decodificación');
  assert(final.images.every(x => x.embedded && x.loaded), 'imágenes del juego incrustadas y cargadas');
  assert.deepEqual(report.unexpectedRequests, [], 'ninguna dependencia HTTP de scripts/imágenes/voces');
  assert.deepEqual(report.errors, [], 'sin errores JavaScript ni errores de recursos');
  report.status = partial ? 'partial-rehearsal-pass' : 'pass';
} catch (error) {
  report.status = 'fail'; report.failure = error.stack || String(error); throw error;
} finally {
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  fs.rmSync(scratch, {recursive: true, force: true});
  console.log(`Informe: ${path.join(out, 'report.json')} (${report.status}).`);
}
