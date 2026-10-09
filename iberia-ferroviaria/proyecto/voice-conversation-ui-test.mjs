// Conversaciones completas del HTML publicado. Nunca recorta data-say ni simula audio.
// Recorre la campaña y sus nueve tareas con acciones reales y escucha cada mensaje hasta ended.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const input = path.resolve(process.env.VOICE_CONVERSATION_HTML || path.join(root, '../outputs/Iberia-Ferroviaria.html'));
const out = path.resolve(process.env.VOICE_CONVERSATION_OUT || path.join(root, '../investigacion/verificacion-conversaciones-3.6.3'));
const manifestFile = path.resolve(process.env.VOICE_CONVERSATION_MANIFEST || path.join(root, '../investigacion/voces/generadas-qwen-dialogos-3.6.3-torrente/manifest.json'));
const maxMessages = Number(process.env.VOICE_CONVERSATION_MAX_MESSAGES || 0);
const requireWhole = process.env.VOICE_CONVERSATION_REQUIRE_WHOLE === '1';
const checkControls = process.env.VOICE_CONVERSATION_CONTROLS === '1';
const expectedDialogues = Number(process.env.VOICE_CONVERSATION_EXPECTED_DIALOGUES || 412);
const timeout = 60000;
const sha = value => createHash('sha256').update(value).digest('hex');
const original = fs.readFileSync(input, 'utf8');
const manifest = JSON.parse(fs.readFileSync(manifestFile));
const anchor = 'window.railwayGame = {';
assert.equal(original.split(anchor).length - 1, 1, 'punto único de observación');
const observed = original.replace(anchor, `globalThis.__conversationRuntime = {
  CLIPS: __m["assets/voices.js"].CLIPS,
  DIALOGUES: __m["assets/voice-dialogues.js"]?.DIALOGUES || {},
  Voices: __m["voice.js"].Voices,
  sentences: __m["voice.js"].sentences,
  clipId: __m["voice.js"].clipId,
  stages: __m["induction.js"].INDUCTION_STAGES
};\n${anchor}`);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'iberia-conversation-'));
fs.mkdirSync(out, {recursive: true});
const report = {
  startedAt: new Date().toISOString(), html: path.basename(input), htmlSHA256: sha(original),
  testSourceSHA256: sha(fs.readFileSync(fileURLToPath(import.meta.url))),
  manifestSHA256: sha(fs.readFileSync(manifestFile)), nativeAudio: true,
  requireWholeDialogues: requireWhole, replayAndStopRequested: checkControls,
  expectedWholeDialogueCount: requireWhole ? expectedDialogues : null,
  productionFilesModified: false, textOrDialogueModified: false,
  fixturesUsed: false, transport: 'local HTTP followed by offline playback',
  scope: 'Campaña nueva: apertura, introducciones, feedback y resultados completos; nueve tareas mediante acciones reales.',
  limitation: 'La reproducción y procedencia se comprueban técnicamente; la naturalidad, interpretación y parecido requieren escuchar.',
  messages: [], taskActions: [], errors: [], unexpectedRequests: [], status: 'running'
};
let browser, server;
const saveReport = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');

function observeNativeAudio() {
  const qa = window.__conversationQA = {starts: [], decodes: [], speechCalls: [], speakRequests: [], sequence: 0};
  const nodes = new WeakMap(), edges = new WeakMap(), bufferIds = new WeakMap(), bufferDecodes = new WeakMap(), playing = new WeakMap();
  const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
  const identity = node => {
    if (!nodes.has(node)) nodes.set(node, ++qa.sequence);
    return {id: nodes.get(node), type: node.constructor.name};
  };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(destination, ...args) {
    const result = connect.call(this, destination, ...args);
    const links = edges.get(this) || [];
    links.push(destination); edges.set(this, links); return result;
  };
  const pathFrom = source => {
    const result = [], seen = new Set();
    for (let node = source; node && !seen.has(node);) {
      seen.add(node); const links = edges.get(node) || [];
      result.push({...identity(node), outgoing: links.length, ...(node instanceof GainNode ? {gain: node.gain.value} : {})});
      if (links.length !== 1) break;
      node = links[0];
    }
    return result;
  };
  const decode = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function(bytes, ...args) {
    const entry = {bytes: bytes.byteLength, at: performance.now()};
    qa.decodes.push(entry);
    digest(bytes.slice(0)).then(hash => {entry.mp3SHA256 = hash;}, error => {entry.hashError = String(error);});
    const result = decode.call(this, bytes, ...args);
    result?.then?.(buffer => {
      bufferDecodes.set(buffer, entry);
      Object.assign(entry, {duration: buffer.duration, sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, nativeBuffer: buffer instanceof AudioBuffer});
    }, error => {entry.error = String(error);});
    return result;
  };
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function(...args) {
    const voice = window.railwayGame?.voices;
    if (voice?.source === this) {
      const buffer = this.buffer, pcm = buffer.getChannelData(0);
      let square = 0, peak = 0, n = 0;
      for (let i = 0; i < pcm.length; i += 8) {square += pcm[i] ** 2; peak = Math.max(peak, Math.abs(pcm[i])); n++;}
      const entry = {
        index: qa.starts.length, source: identity(this), clipId: bufferIds.get(buffer)?.id,
        clipKind: bufferIds.get(buffer)?.kind,
        person: voice.speaking?.person, at: performance.now(), duration: buffer.duration,
        speakingMode: voice.speaking?.mode,
        nativeBuffer: buffer instanceof AudioBuffer, sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels, contextState: this.context.state,
        playbackRate: this.playbackRate.value, detune: this.detune.value,
        rms: Math.sqrt(square / n), peak, path: pathFrom(this), volume: voice.volume,
        decode: bufferDecodes.get(buffer)
      };
      digest(pcm.slice().buffer).then(hash => {entry.pcmSHA256 = hash;}, error => {entry.hashError = String(error);});
      qa.starts.push(entry); playing.set(this, entry);
      this.addEventListener('ended', () => {entry.nativeEnded = true; entry.endedAt = performance.now();}, {once: true});
    }
    return start.apply(this, args);
  };
  const stop = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.stop = function(...args) {
    const entry = playing.get(this); if (entry) entry.stoppedAt = performance.now();
    return stop.apply(this, args);
  };
  if (window.speechSynthesis) {
    const speak = window.speechSynthesis.speak;
    window.speechSynthesis.speak = function(utterance) {
      qa.speechCalls.push({text: utterance.text, at: performance.now()}); return speak.call(this, utterance);
    };
  }
  qa.attach = () => {
    const player = window.railwayGame.voices, buffer = player.buffer;
    player.buffer = function(id, ...args) {
      const result = buffer.call(this, id, ...args);
      result.then(value => bufferIds.set(value, {id, kind: args[0] || 'S'}), () => {});
      return result;
    };
    const speak = player.speak;
    player.speak = function(person, text, options = {}) {
      const request = {person, text, at: performance.now(), sentenceEvents: []};
      qa.speakRequests.push(request);
      const result = speak.call(this, person, text, {...options,
        onSentence: (index, ...args) => {
          request.sentenceEvents.push({index, at: performance.now(), detail: args[0]});
          return options.onSentence?.(index, ...args);
        },
        onend: (...args) => {request.endedAt = performance.now(); return options.onend?.(...args);}
      });
      request.mode = this.speaking?.mode; return result;
    };
  };
  // Los ajustes son controles del producto; el motor y el texto quedan intactos.
  localStorage.setItem('iberia-musica', JSON.stringify({enabled: false}));
  localStorage.setItem('iberia-efectos', JSON.stringify({enabled: false}));
  localStorage.setItem('iberia-voz', JSON.stringify({enabled: true, volume: .73}));
}

function assertNative(entry, expected, person) {
  assert.equal(entry.clipId, expected.id, 'clip realmente reproducido en orden');
  assert.equal(entry.clipKind, expected.kind, 'catálogo realmente seleccionado por buffer');
  if (expected.kind === 'D') assert.equal(entry.speakingMode, 'dialogue', 'motor de diálogo completo');
  assert.equal(entry.person, person, 'personaje del párrafo completo');
  assert.equal(entry.decode?.mp3SHA256, expected.sha256, 'bytes decodificados del MP3 incrustado');
  if (expected.productionSHA256) assert.equal(entry.decode.mp3SHA256, expected.productionSHA256, 'MP3 de la producción final declarada');
  assert.match(entry.pcmSHA256, /^[a-f0-9]{64}$/, 'huella del PCM nativo reproducido');
  assert.equal(entry.nativeBuffer, true); assert.equal(entry.contextState, 'running');
  assert.equal(entry.playbackRate, 1); assert.equal(entry.detune, 0);
  assert(entry.duration > .2 && Number.isFinite(entry.duration));
  assert(entry.rms > .00001 && entry.peak > .0001, 'PCM real con señal');
  assert.deepEqual(entry.path.map(x => x.type), ['AudioBufferSourceNode', 'GainNode', 'AudioDestinationNode']);
  assert.deepEqual(entry.path.map(x => x.outgoing), [1, 1, 0]);
  assert(Math.abs(entry.path[1].gain - entry.volume) < 1e-6);
  assert.equal(entry.nativeEnded, true, 'cada frase llega al ended nativo');
  assert.equal(entry.stoppedAt, undefined, 'no se corta el cuerpo para aprobar el test');
  assert(entry.endedAt - entry.at >= entry.duration * 1000 - 250, 'se reproduce la duración completa');
}

try {
  server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') {res.writeHead(204); res.end(); return;}
    if (req.url !== '/Iberia-Ferroviaria.html') {res.writeHead(404); res.end(); return;}
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); res.end(observed);
  });
  await new Promise((resolve, reject) => {server.once('error', reject); server.listen(0, '127.0.0.1', resolve);});
  const url = `http://127.0.0.1:${server.address().port}/Iberia-Ferroviaria.html`;
  const pw = process.argv[2] || process.env.PLAYWRIGHT_MODULE || 'playwright';
  const {chromium} = await import(pw.startsWith('/') ? pathToFileURL(pw).href : pw);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: [
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'
  ]});
  report.browser = browser.version();
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, serviceWorkers: 'block'});
  await context.addInitScript(observeNativeAudio);
  const page = await context.newPage(); page.setDefaultTimeout(timeout);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') report.errors.push(message.text());});
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && request.url() !== url && !request.url().endsWith('/favicon.ico')) report.unexpectedRequests.push(request.url());
  });
  await page.goto(url, {waitUntil: 'load', timeout});
  await page.waitForFunction(() => window.railwayGame && window.__conversationRuntime && window.__conversationQA);
  await context.setOffline(true); report.offlineDuringAllPlayback = true;
  await page.evaluate(() => {
    const g = window.railwayGame;
    g.music.enabled = false; g.music.stop?.(); g.sfx.enabled = false;
    g.voices.enabled = true; g.voices.volume = .73; window.__conversationQA.attach();
  });
  assert(await page.evaluate(() => window.railwayGame.voices instanceof window.__conversationRuntime.Voices), 'motor Voices real');
  report.assets = await page.evaluate(() => ({sentenceClips: Object.keys(window.__conversationRuntime.CLIPS).length, wholeDialogues: Object.keys(window.__conversationRuntime.DIALOGUES).length}));
  if (requireWhole) {
    assert.equal(report.assets.sentenceClips, 0, 'el HTML final no incluye las grabaciones fragmentadas anteriores');
    assert.equal(report.assets.wholeDialogues, expectedDialogues, 'catálogo completo de diálogos incrustado');
  }
  const stages = await page.evaluate(() => window.__conversationRuntime.stages);
  let cursor = 0;
  const snap = () => page.evaluate(() => window.railwayGame.snapshot());
  const click = async selector => {
    const button = page.locator(selector);
    assert.equal(await button.count(), 1, 'control inequívoco ' + selector);
    assert(await button.isVisible(), 'control visible ' + selector);
    assert(await button.isEnabled(), 'control disponible ' + selector);
    await button.scrollIntoViewIfNeeded(); await button.click();
    report.taskActions.push({selector, at: new Date().toISOString()});
  };
  const task = async id => {
    await page.waitForSelector(`#coach[data-step-id="${id}"][data-kind="task"]`);
    assert.equal((await snap()).tutorial.phase, 'task');
  };

  async function fullMessage(label) {
    await page.waitForSelector('#modal[open] [data-say]');
    const message = await page.evaluate(() => {
      const rt = window.__conversationRuntime, modal = document.getElementById('modal');
      const paragraph = modal.querySelector('[data-say]'), button = modal.querySelector('[data-action=say]');
      const person = button.dataset.person, body = paragraph.dataset.say;
      const fragments = rt.sentences(body), wholeId = rt.clipId(person, body);
      const wholeAvailable = !!rt.DIALOGUES[wholeId];
      const ids = wholeAvailable ? [wholeId] : fragments.map(text => rt.clipId(person, text));
      return {
        person, body, title: modal.querySelector('h1')?.textContent,
        stage: modal.querySelector('.induction-dialog')?.dataset.stepId,
        kind: modal.querySelector('.induction-dialog')?.dataset.kind || 'decision',
        fragments, plan: wholeAvailable ? 'whole-paragraph' : 'sentence-clips',
        clips: ids.map((id, i) => ({id, kind: wholeAvailable ? 'D' : 'S', raw: wholeAvailable ? body : fragments[i], base64: (wholeAvailable ? rt.DIALOGUES[id] : rt.CLIPS[id]) || null})),
        displayedText: paragraph.textContent, displayedSentences: [...paragraph.querySelectorAll('.say-s')].map(x => x.textContent)
      };
    });
    assert.equal(message.displayedText.replace(/\s+/g, ' ').trim(), message.body.replace(/\s+/g, ' ').trim(), 'el texto en pantalla es el mensaje entero');
    assert(message.body.length > 50, 'se escucha un mensaje completo, no una muestra recortada');
    if (requireWhole) assert.equal(message.plan, 'whole-paragraph', 'cada cuerpo usa DIALOGUES en la versión final');
    const expected = message.clips.map(({base64, ...row}) => {
      assert(base64, 'falta audio grabado para ' + row.id + ': ' + row.raw);
      const take = manifest.takes?.[row.id];
      if (requireWhole) {
        assert(take, 'toma completa declarada en el manifiesto ' + row.id);
        assert.match(take.sha256, /^[a-f0-9]{64}$/, 'huella de producción del diálogo completo');
        assert.equal(take.person, message.person, 'personaje declarado en la producción del diálogo');
      }
      return {...row, sha256: sha(Buffer.from(base64, 'base64')), productionSHA256: take?.sha256 || null, declaredReferenceSHA256: take?.reference_sha256 || null};
    });
    const duration = expected.reduce((sum, row) => sum + Number(manifest.takes?.[row.id]?.duration || 20), 0);
    await page.waitForFunction(({n, count}) => {
      const qa = window.__conversationQA, g = window.railwayGame;
      return qa.starts.length >= n + count && qa.starts.slice(n, n + count).every(x => x.nativeEnded && x.pcmSHA256 && x.decode?.mp3SHA256) && !g.voices.speaking;
    }, {n: cursor, count: expected.length}, {timeout: Math.max(timeout, duration * 1000 + 15000)});
    const actual = await page.evaluate(n => window.__conversationQA.starts.slice(n), cursor);
    assert.equal(actual.length, expected.length, 'todas y sólo las frases del mensaje completo');
    actual.forEach((entry, i) => assertNative(entry, expected[i], message.person));
    assert.equal(await page.locator('#modal .say-s.on').count(), 0, 'subtítulos limpios al acabar el mensaje');
    assert.equal(await page.locator('#modal .portrait.talking').count(), 0, 'retrato limpio al acabar');
    const after = await page.locator('#modal [data-say]').getAttribute('data-say');
    assert.equal(after, message.body, 'QA no cambió data-say durante la conversación');
    cursor += actual.length;
    report.messages.push({...message, clips: expected, label, actual, textSHA256: sha(message.body)});
    saveReport();
    console.log(`PASS mensaje ${report.messages.length}: ${message.person}, ${message.kind}, ${expected.length} clips, cuerpo ${message.body.length} caracteres, ${actual.reduce((sum, row) => sum + row.duration, 0).toFixed(2)} s completos.`);
    if (report.messages.length === 4) {
      await page.screenshot({path: path.join(out, '04-conversacion-consecutiva.png'), animations: 'disabled'});
      console.log('FIRST_FOUR_COMPLETE');
    }
    if (maxMessages && report.messages.length >= maxMessages) throw new Error('QA_REQUESTED_MESSAGE_LIMIT');
  }
  async function replayAndStop(message) {
    assert.equal(message.plan, 'whole-paragraph', 'se comprueba parar dentro de un diálogo completo');
    const selector = `#modal [data-action=say][data-person=${message.person}]`;
    const before = cursor;
    await click(selector);
    await page.waitForFunction(n => window.__conversationQA.starts.length === n + 1, before);
    await click(selector);
    await page.waitForFunction(n => {
      const entry = window.__conversationQA.starts[n], g = window.railwayGame;
      return entry?.nativeEnded && entry.pcmSHA256 && entry.decode?.mp3SHA256 && !g.voices.speaking && !g.voices.source;
    }, before);
    const stopped = await page.evaluate(n => window.__conversationQA.starts[n], before);
    assert.equal(stopped.clipId, message.clips[0].id); assert.equal(stopped.clipKind, 'D');
    assert.equal(stopped.decode.mp3SHA256, message.clips[0].sha256);
    assert.equal(stopped.playbackRate, 1); assert.equal(stopped.detune, 0);
    assert(Number.isFinite(stopped.stoppedAt), 'el botón real detiene la fuente nativa');
    assert(stopped.stoppedAt - stopped.at < stopped.duration * 1000, 'se detiene dentro del cuerpo completo');
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => window.__conversationQA.starts.length), before + 1, 'no vuelve una frase después de parar');
    assert.equal(await page.locator('#modal .say-s.on, #modal .portrait.talking').count(), 0, 'parar limpia retrato y subtítulos');
    cursor++;
    await click(selector);
    await page.waitForFunction(n => {
      const entry = window.__conversationQA.starts[n], g = window.railwayGame;
      return entry?.nativeEnded && entry.pcmSHA256 && entry.decode?.mp3SHA256 && !g.voices.speaking;
    }, cursor, {timeout: Math.max(timeout, stopped.duration * 1000 + 10000)});
    const replay = await page.evaluate(n => window.__conversationQA.starts[n], cursor);
    assertNative(replay, message.clips[0], message.person);
    assert.equal(await page.locator('#modal [data-say]').getAttribute('data-say'), message.body, 'repetir conserva todo el mensaje');
    report.controls = {person: message.person, bodySHA256: message.textSHA256, stopped, replay};
    cursor++; saveReport(); console.log('PASS controles: parar dentro del diálogo completo y repetirlo hasta ended.');
  }
  async function answer(id, choice) {
    await click(`#coach [data-action=tutorial-answer][data-choice="${choice}"]`);
    await page.waitForSelector(`.induction-dialog[data-step-id="${id}"][data-kind="feedback"]`);
    await fullMessage(id + '-feedback-' + choice);
    await click('#modal [data-action=tutorial-next]'); await task(id);
    assert.equal((await snap()).tutorial.answers[id], choice, 'respuesta real guardada');
  }
  async function debrief(stage) {
    await task(stage.id); await page.waitForSelector('#coach [data-action=tutorial-next]');
    await click('#coach [data-action=tutorial-next]');
    for (let line = 0; line < stage.debrief.length; line++) {
      await page.waitForSelector(`.induction-dialog[data-step-id="${stage.id}"][data-kind="debrief"]`);
      await fullMessage(stage.id + '-debrief-' + line);
      if (checkControls && stage.id === 'handoff' && line === stage.debrief.length - 1) await replayAndStop(report.messages.at(-1));
      await click('#modal [data-action=tutorial-next]');
    }
  }
  await click('.main-menu [data-action=new-game]');
  await page.fill('#npSeed', '72022'); // 2022 · La herencia con la semilla de siempre
  await click('.np-screen [data-action=np-begin]');
  await fullMessage('campaign-opening');
  await click('#modal [data-action=decision][data-choice="0"]');
  await fullMessage('mandate-briefing');
  await click('#modal [data-action=tutorial-next]'); await task('mandate');
  await answer('mandate', 'balanced'); await debrief(stages[0]);

  for (const stage of stages.slice(1)) {
    await page.waitForSelector(`.induction-dialog[data-step-id="${stage.id}"][data-kind="briefing"]`);
    await fullMessage(stage.id + '-briefing');
    await click('#modal [data-action=tutorial-next]'); await task(stage.id);
    switch (stage.id) {
      case 'diagnosis':
        for (const view of ['gauge', 'power', 'salamanca']) await click(`#coach [data-action=tutorial-view][data-id=${view}]`);
        await answer(stage.id, 'variable'); break;
      case 'offer': {
        const route = (await snap()).routes.find(x => x.id === 'madrid-valencia');
        await page.locator('#frequency').focus(); await page.locator('#frequency').press('ArrowRight');
        await page.locator('#fare').fill(String(route.fare + 1));
        await click('#routeForm button[type=submit]'); break;
      }
      case 'people':
        await click('#coach [data-action=tutorial-view][data-id=people]');
        await answer(stage.id, 'pipeline'); break;
      case 'competition':
        await click('#coach [data-action=tutorial-view][data-id=market]');
        await click('#coach [data-action=tutorial-view][data-id=research]');
        await click('#coach [data-action=tycoon-research][data-id=online]'); break;
      case 'infrastructure':
        await click('#coach [data-action=open-route][data-id=madrid-salamanca]');
        await click('#coach [data-action=tutorial-quote]'); await answer(stage.id, 'power'); break;
      case 'incident': {
        await click('#coach [data-action=day-start]');
        const incident = (await snap()).ops.incidents.find(x => x.id === 'inc-tut');
        assert(incident, 'avería de una circulación real');
        await click(`#coach [data-action=respond][data-id="${incident.trip}"][data-option=team]`); break;
      }
      case 'review':
        await click('#coach [data-action=day-end]'); await click('#coach [data-action=day-next]'); break;
      case 'handoff':
        await click('#coach [data-action=tycoon-public]'); await answer(stage.id, 'public'); break;
      default: assert.fail('falta una tarea real para ' + stage.id);
    }
    await debrief(stage);
  }
  await page.waitForSelector('.induction-finish');
  assert.equal((await snap()).tutorial.done, true, 'nueve tareas completadas con reglas reales');
  const roles = new Set(report.messages.map(x => x.person));
  assert.equal(roles.size, 9, 'los nueve personajes hablan en mensajes completos');
  const final = await page.evaluate(() => ({speechCalls: window.__conversationQA.speechCalls, decodes: window.__conversationQA.decodes, speakRequests: window.__conversationQA.speakRequests}));
  report.speechSynthesisCalls = final.speechCalls;
  report.nativeDecoder = final.decodes;
  report.fullSpeakRequests = final.speakRequests;
  for (const message of report.messages) assert(final.speakRequests.some(request => request.person === message.person && request.text === message.body), 'el motor recibió el mensaje entero sin cambios');
  assert.deepEqual(final.speechCalls, [], 'ningún mensaje completo vuelve a SpeechSynthesis');
  assert(final.decodes.every(x => !x.error && !x.hashError), 'sin fallos de audio o huella');
  assert.deepEqual(report.errors, [], 'sin errores JavaScript');
  assert.deepEqual(report.unexpectedRequests, [], 'sin dependencias de red durante la conversación');
  await page.screenshot({path: path.join(out, 'tutorial-completo.png'), animations: 'disabled'});
  report.status = 'pass';
} catch (error) {
  if (error.message === 'QA_REQUESTED_MESSAGE_LIMIT') report.status = 'requested-partial-pass';
  else {report.status = 'fail'; report.failure = error.stack || String(error); process.exitCode = 1;}
  console.error(error.stack || String(error));
} finally {
  report.finishedAt = new Date().toISOString(); saveReport();
  await browser?.close(); if (server) await new Promise(resolve => server.close(resolve));
  fs.rmSync(scratch, {recursive: true, force: true});
}
