// Sesiones largas: memoria de audio acotada, reutilización y recuperación de fallos.
import assert from 'node:assert/strict';
import {Voices, BUFFER_LIMIT, recordedPause, clipId} from './dist/voice.js';
import {CLIPS} from './dist/assets/voices.js';
import {DIALOGUES} from './dist/assets/voice-dialogues.js';

// Audio local determinista; el adaptador de Web Audio se simula abajo. Estas
// pruebas verifican el runtime sin depender del catálogo de grabaciones publicado.
const fixtureWAV = Buffer.alloc(44 + 32 * 2);
fixtureWAV.write('RIFF', 0); fixtureWAV.writeUInt32LE(fixtureWAV.length - 8, 4);
fixtureWAV.write('WAVEfmt ', 8); fixtureWAV.writeUInt32LE(16, 16);
fixtureWAV.writeUInt16LE(1, 20); fixtureWAV.writeUInt16LE(1, 22);
fixtureWAV.writeUInt32LE(24000, 24); fixtureWAV.writeUInt32LE(48000, 28);
fixtureWAV.writeUInt16LE(2, 32); fixtureWAV.writeUInt16LE(16, 34);
fixtureWAV.write('data', 36); fixtureWAV.writeUInt32LE(64, 40);
for (let i = 0; i < 32; i++) fixtureWAV.writeInt16LE((i % 8 - 4) * 256, 44 + i * 2);
const sample = fixtureWAV.toString('base64');
const ids = Array.from({length: BUFFER_LIMIT + 2}, (_, i) => 'runtime-test-cache-' + i);
const oldCacheEntries = ids.map(id => DIALOGUES[id]);
ids.forEach(id => { DIALOGUES[id] = sample; });
try {
let decodes = 0, failNext = false;
const player = new Voices({ctx: {decodeAudioData(bytes) {
  assert.deepEqual(Buffer.from(bytes), fixtureWAV, 'se entregan íntegros los bytes del audio local');
  decodes++;
  if (failNext) { failNext = false; return Promise.reject(new Error('fallo transitorio')); }
  return Promise.resolve({duration: 1, decoded: decodes});
}}});
const first = await player.buffer(ids[0], 'D');
assert.equal(await player.buffer(ids[0], 'D'), first, 'repetir un diálogo no vuelve a decodificarlo');
assert.equal(decodes, 1);
for (const id of ids.slice(1, BUFFER_LIMIT)) await player.buffer(id, 'D');
await player.buffer(ids[0], 'D'); // Repetir un personaje protege su diálogo reciente.
await player.buffer(ids[BUFFER_LIMIT], 'D');
assert.equal(player.buffers.size, BUFFER_LIMIT, 'el caché permanece acotado tras recorrer muchos diálogos');
assert.equal(await player.buffer(ids[0], 'D'), first, 'el diálogo recién escuchado se conserva');
assert(!player.buffers.has('D:' + ids[1]), 'se libera un diálogo antiguo');
assert.notEqual(await player.buffer(ids[1], 'D'), first, 'un diálogo liberado se puede escuchar de nuevo');
assert.equal(player.buffers.size, BUFFER_LIMIT);
const recoverId = ids[BUFFER_LIMIT + 1];
failNext = true;
await assert.rejects(player.buffer(recoverId, 'D'), /fallo transitorio/);
const beforeRetry = decodes;
await player.buffer(recoverId, 'D');
assert.equal(decodes, beforeRetry + 1, 'un fallo temporal no silencia permanentemente el diálogo');
assert.equal(player.buffers.size, BUFFER_LIMIT);
let sourceStopped = 0, sourceReleased = 0, outputReleased = 0, ended = 0;
player.source = {stop(){sourceStopped++;}, disconnect(){sourceReleased++;}};
player.output = {disconnect(){outputReleased++;}};
player.speaking = {onend(){ended++;}};
player.guard = setTimeout(() => { throw new Error('un temporizador detenido no debe continuar el diálogo'); }, 0);
player.stop();
await new Promise(resolve => setTimeout(resolve, 5));
assert.equal(sourceStopped, 1);
assert.equal(sourceReleased, 1);
assert.equal(outputReleased, 1, 'detener libera los nodos de audio de la frase');
assert.equal(ended, 1);
assert.equal(player.guard, null);
} finally {
  ids.forEach((id, i) => { if (oldCacheEntries[i] === undefined) delete DIALOGUES[id]; else DIALOGUES[id] = oldCacheEntries[i]; });
}
assert(recordedPause('¿Otra vez?', 'happy', 'successor') > recordedPause('¡Ahora!', 'angry', 'successor'));
assert(recordedPause('Ya veremos…', 'worried', 'president') < 300, 'no añade una segunda pausa larga a la grabación');
// Las cortinillas tampoco conservan conexiones tras cientos de conversaciones.
const oscillators = [], gains = [];
const cuePlayer = new Voices({ctx: {
  currentTime: 0, destination: {},
  createGain() {
    const node = {released: false, connect(){}, disconnect(){this.released = true;},
      gain: {setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}}};
    gains.push(node); return node;
  },
  createOscillator() {
    const node = {released: false, connect(){}, disconnect(){this.released = true;}, start(){}, stop(){},
      frequency: {setValueAtTime(){}, exponentialRampToValueAtTime(){}}};
    oscillators.push(node); return node;
  }
}});
for (let round = 0; round < 20; round++) {
  for (const kind of ['fanfare','tweet','coins','anvil','bells','horn','ding']) cuePlayer.sting(kind);
}
for (const node of oscillators) node.onended();
assert(oscillators.every(node => node.released) && gains.every(node => node.released),
  'cada cortinilla terminada libera osciladores y ganancias');

// Detener durante la cortinilla cancela también sus osciladores y el inicio pendiente.
cuePlayer.sting('fanfare');
assert.equal(cuePlayer.stings.size, 1);
cuePlayer.stop();
assert.equal(cuePlayer.stings.size, 0);
assert(oscillators.every(node => node.released) && gains.every(node => node.released));

// Prueba el recorrido entero, no una frase corta seleccionada del diálogo.
let systemAccess = 0;
const oldWindow = globalThis.window;
globalThis.window = {get speechSynthesis() { systemAccess++; throw new Error('La voz del sistema no debe utilizarse'); }};
const tick = ms => new Promise(resolve => setTimeout(resolve, ms));
const fixturePerson = 'minister';
const wholeText = 'Primera frase de la intervención completa. Segunda frase con otra entonación. Tercera frase, el remate final.';
const wholeId = clipId(fixturePerson, wholeText);
const partTexts = ['Primera frase de la intervención completa.', 'Segunda frase con otra entonación.', 'Tercera frase, el remate final.'];
const fixtureIds = partTexts.map(text => clipId(fixturePerson, text));
const oldWhole = DIALOGUES[wholeId], oldSingle = DIALOGUES[fixtureIds[0]], oldFragments = fixtureIds.map(id => CLIPS[id]);

function fakeAudio({duration = .06, decode} = {}) {
  const starts = [], outputs = [];
  const ctx = {currentTime:0, destination:{}, decodeAudioData(bytes) {
      assert.deepEqual(Buffer.from(bytes), fixtureWAV, 'el runtime entrega la toma completa al decodificador');
      return decode ? decode(bytes) : Promise.resolve({duration});
    },
    createGain() {
      const node = {gain:{value:1}, connected:false, released:false, connect(){this.connected = true;}, disconnect(){this.released = true;}};
      outputs.push(node); return node;
    },
    createBufferSource() {
      const src = {playbackRate:{value:9}, detune:{value:999}, released:false, stopped:0,
        connect(){}, disconnect(){this.released = true;}, start(){starts.push(this);}, stop(){this.stopped++;}};
      return src;
    }};
  return {music:{ctx}, starts, outputs};
}
try {
  fixtureIds.forEach((id, i) => { if (i === 1) delete CLIPS[id]; else CLIPS[id] = sample; });
  DIALOGUES[wholeId] = sample;
  const audio = fakeAudio(), full = new Voices(audio.music), highlighted = [], errors = [], finishes = [];
  full.volume = .73;
  assert(full.speak(fixturePerson, wholeText, {sting:false, mood:'angry',
    onSentence:(index, metadata) => highlighted.push({index, metadata}), onerror:e => errors.push(e), onend:e => finishes.push(e)}));
  await tick(10);
  assert.equal(full.speaking.mode, 'dialogue');
  assert.equal(full.speaking.dialogueId, wholeId);
  assert.equal(audio.starts.length, 1, 'una toma continua conserva todo el diálogo aunque falte una frase aislada');
  assert.equal(audio.starts[0].playbackRate.value, 1, 'ninguna emoción modifica la velocidad');
  assert.equal(audio.starts[0].detune.value, 0, 'ninguna emoción modifica el tono');
  assert.equal(audio.outputs[0].gain.value, .73, 'se respeta el volumen guardado');
  assert(full.buffers.has('D:' + wholeId));
  await tick(65);
  assert.deepEqual(highlighted.map(x => x.index), [0,1,2]);
  assert(highlighted.every(x => x.metadata.approximate && x.metadata.mode === 'dialogue'), 'el resaltado se declara aproximado');
  assert.equal(audio.starts.length, 1, 'el subtítulo no corta la toma ni inicia nuevas voces');
  audio.starts[0].onended();
  assert.equal(finishes.length, 1);
  assert.equal(finishes[0].reason, 'ended');
  assert.equal(full.speaking, null);
  assert.equal(full.source, null);
  assert.equal(full.timers.size, 0);
  assert(audio.starts[0].released && audio.outputs[0].released);
  assert.equal(errors.length, 0);

  // Repetir usa el mismo buffer, y stop cancela callbacks tardíos del audio anterior.
  assert(full.speak(fixturePerson, wholeText, {sting:false, onSentence:i => highlighted.push({index:i}), onend:e => finishes.push(e)}));
  await tick(10);
  const second = audio.starts[1], staleEnd = second.onended, beforeStopHighlight = highlighted.length;
  assert.equal(full.buffers.size, 1, 'repetir no acumula tomas decodificadas');
  full.stop(); staleEnd(); await tick(80);
  assert.equal(finishes.length, 2, 'el diálogo detenido termina una sola vez');
  assert.equal(finishes[1].reason, 'stopped');
  assert.equal(highlighted.length, beforeStopHighlight, 'no quedan subtítulos tardíos de la toma detenida');
  assert.equal(audio.starts.length, 2);
  assert.equal(second.stopped, 1);

  // Sin una toma completa, una segunda frase ausente no cambia a una voz antigua.
  delete DIALOGUES[wholeId];
  const missingAudio = fakeAudio(), missing = new Voices(missingAudio.music), missingErrors = [], missingEnds = [];
  assert.equal(missing.speak(fixturePerson, wholeText, {sting:false, onerror:e => missingErrors.push(e), onend:e => missingEnds.push(e)}), false);
  await tick(10);
  assert.equal(missingAudio.starts.length, 0, 'no se inicia el mensaje parcialmente grabado');
  assert.equal(missingErrors.length, 1);
  assert.equal(missingErrors[0].code, 'MISSING_RECORDING');
  assert.deepEqual(missingErrors[0].missingIds, [fixtureIds[1]]);
  assert.equal(missing.lastError, missingErrors[0]);
  assert.equal(missingEnds.length, 1);
  assert.equal(missing.speaking, null);

  // Cuando solo hay frases grabadas, reproduce cada una en orden sin otra voz.
  CLIPS[fixtureIds[1]] = sample;
  const fragmentsAudio = fakeAudio(), fragments = new Voices(fragmentsAudio.music), fragmentSentences = [], fragmentEnds = [];
  assert(fragments.speak(fixturePerson, wholeText, {sting:false,
    onSentence:i => fragmentSentences.push(i), onend:e => fragmentEnds.push(e)}));
  await tick(10);
  assert.equal(fragments.speaking.mode, 'fragments');
  for (let i = 0; i < 3; i++) {
    assert.equal(fragmentsAudio.starts.length, i + 1);
    assert.equal(fragmentsAudio.starts[i].playbackRate.value, 1);
    assert.equal(fragmentsAudio.starts[i].detune.value, 0);
    fragmentsAudio.starts[i].onended();
    if (i < 2) await tick(115);
  }
  assert.deepEqual(fragmentSentences, [0,1,2]);
  assert.equal(fragmentEnds.length, 1);
  assert.equal(fragmentEnds[0].reason, 'ended');
  assert.equal(fragments.source, null);
  assert.equal(fragments.timers.size, 0);

  // Un MP3 posterior dañado detiene el mensaje; no salta a la tercera frase.
  let fragmentDecodes = 0;
  const corruptAudio = fakeAudio({decode:() => ++fragmentDecodes === 2
    ? Promise.reject(new Error('Segunda frase dañada')) : Promise.resolve({duration:.06})});
  const corrupt = new Voices(corruptAudio.music), corruptErrors = [], corruptEnds = [];
  corrupt.speak(fixturePerson, wholeText, {sting:false, onerror:e => corruptErrors.push(e), onend:e => corruptEnds.push(e)});
  await tick(10); corruptAudio.starts[0].onended(); await tick(115);
  assert.equal(corruptErrors.length, 1);
  assert.equal(corruptErrors[0].code, 'AUDIO_DECODE_FAILED');
  assert.equal(corruptAudio.starts.length, 1, 'no reemplaza ni omite la frase dañada');
  assert.equal(fragmentDecodes, 2, 'no continúa con la tercera frase');
  assert.equal(corruptEnds.length, 1);
  assert.equal(corrupt.speaking, null);
  assert.equal(corrupt.timers.size, 0);

  // El mismo ID en ambos catálogos nunca comparte accidentalmente el caché.
  DIALOGUES[fixtureIds[0]] = {src:sample};
  const single = new Voices(fakeAudio().music);
  const sentenceBuffer = await single.buffer(fixtureIds[0], 'S');
  const wholeBuffer = await single.buffer(fixtureIds[0], 'D');
  assert.notEqual(sentenceBuffer, wholeBuffer);
  assert(single.buffers.has('S:' + fixtureIds[0]) && single.buffers.has('D:' + fixtureIds[0]));
  if (oldSingle === undefined) delete DIALOGUES[fixtureIds[0]]; else DIALOGUES[fixtureIds[0]] = oldSingle;

  // Una decodificación rechazada se notifica; repetir permite reintentarlo.
  DIALOGUES[wholeId] = sample;
  let rejected = true;
  const failingAudio = fakeAudio({decode:() => rejected ? Promise.reject(new Error('MP3 dañado')) : Promise.resolve({duration:.06})});
  const failing = new Voices(failingAudio.music), decodeErrors = [], decodeEnds = [];
  assert(failing.speak(fixturePerson, wholeText, {sting:false, onerror:e => decodeErrors.push(e), onend:e => decodeEnds.push(e)}));
  await tick(10);
  assert.equal(decodeErrors[0].code, 'AUDIO_DECODE_FAILED');
  assert.equal(decodeEnds.length, 1);
  assert.equal(failing.speaking, null);
  assert.equal(failing.buffers.size, 0);
  assert.equal(failingAudio.starts.length, 0);
  rejected = false;
  assert(failing.speak(fixturePerson, wholeText, {sting:false}));
  await tick(10);
  assert.equal(failingAudio.starts.length, 1);
  assert.equal(failing.lastError, null);
  failing.stop();

  // Detener antes de que termine la decodificación no inicia audio ni emite otro end.
  let releaseDecode;
  const delayedAudio = fakeAudio({decode:() => new Promise(resolve => { releaseDecode = resolve; })});
  const delayed = new Voices(delayedAudio.music); let delayedEnds = 0;
  delayed.speak(fixturePerson, wholeText, {sting:false, onend:() => delayedEnds++});
  await tick(10); delayed.stop(); releaseDecode({duration:.06}); await tick(10);
  assert.equal(delayedAudio.starts.length, 0);
  assert.equal(delayedEnds, 1);
  assert.equal(delayed.source, null);
  assert.equal(delayed.speaking, null);

  // También respeta stop() llamado por el consumidor del primer subtítulo.
  const callbackAudio = fakeAudio(), callbackStop = new Voices(callbackAudio.music); let callbackEnds = 0;
  callbackStop.speak(fixturePerson, wholeText, {sting:false,
    onSentence:() => callbackStop.stop(), onend:() => callbackEnds++});
  await tick(10);
  assert.equal(callbackAudio.starts.length, 1);
  assert.equal(callbackAudio.starts[0].stopped, 1);
  assert.equal(callbackStop.speaking, null);
  assert.equal(callbackStop.timers.size, 0, 'detener desde el callback tampoco deja subtítulos pendientes');
  assert.equal(callbackEnds, 1);

  const mutedAudio = fakeAudio(), muted = new Voices(mutedAudio.music); let mutedEnd;
  muted.enabled = false;
  assert.equal(muted.speak(fixturePerson, wholeText, {sting:false, onend:e => mutedEnd = e}), false);
  assert.equal(mutedEnd.reason, 'disabled');
  assert.equal(mutedAudio.starts.length, 0);
  assert.equal(muted.lastError, null);

  const unavailable = new Voices(null); let unavailableError;
  assert.equal(unavailable.speak(fixturePerson, wholeText, {sting:false, onerror:e => unavailableError = e}), false);
  assert.equal(unavailableError.code, 'AUDIO_UNAVAILABLE');

  assert.equal(systemAccess, 0, 'ni el primer mensaje ni los siguientes acceden a voces del sistema');
} finally {
  if (oldWhole === undefined) delete DIALOGUES[wholeId]; else DIALOGUES[wholeId] = oldWhole;
  if (oldSingle === undefined) delete DIALOGUES[fixtureIds[0]]; else DIALOGUES[fixtureIds[0]] = oldSingle;
  fixtureIds.forEach((id, i) => { if (oldFragments[i] === undefined) delete CLIPS[id]; else CLIPS[id] = oldFragments[i]; });
  globalThis.window = oldWindow;
}
console.log('Voces: toma continua, segunda frase ausente sin síntesis, error visible, stop/repetir, caché y liberación PASS.');
