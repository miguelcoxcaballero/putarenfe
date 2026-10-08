// Voces grabadas de los personajes. Las tomas completas conservan la interpretación
// de todo el diálogo; las frases también deben estar grabadas. Una ausencia se informa.
import {CLIPS} from './assets/voices.js';
import {DIALOGUES} from './assets/voice-dialogues.js';

export const CAST = {
  president: {sting: 'fanfare', label: 'solemne y pausado'},
  minister: {sting: 'ding', label: 'optimismo de rueda de prensa'},
  successor: {sting: 'tweet', label: 'a la velocidad de un tuit'},
  treasury: {sting: 'coins', label: 'seca y con tijera'},
  adif: {sting: 'anvil', label: 'ingeniero resignado'},
  workshop: {sting: 'anvil', label: 'mecánico de los de antes'},
  riders: {sting: 'ding', label: 'indignada'},
  mayor: {sting: 'bells', label: 'alcalde de pueblo'},
  rival: {sting: 'horn', label: 'ejecutivo encantado de sí mismo'},
};

/** Convierte el texto de pantalla en texto pronunciable. */
export function speechText(text) {
  return String(text)
    .replace(/<[^>]+>/g, ' ')
    // Los puntos de miles no son decimales: conserva, por ejemplo, 0.018 M€.
    .replace(/(?<![\d.,])\b([1-9]\d{0,2}(?:\.\d{3})+)(?![\d.])/g, amount => amount.replace(/\./g, ''))
    .replace(/(\d+(?:[.,]\d+)?)\s*M€/g, '$1 millones de euros')
    .replace(/(\d+(?:[.,]\d+)?)\s*€/g, '$1 euros')
    .replace(/(\d+)\s*×/g, '$1 por')
    .replace(/\bS(\d{3})\b/g, 'ese $1')
    .replace(/\bOuigo\b/g, 'Uigo')
    .replace(/\biryo\b/g, 'íryo')
    .replace(/\bAVE\b/g, 'Ave')
    .replace(/\bERTMS\b/g, 'e erre te eme ese')
    .replace(/\bM€\b/g, 'millones de euros')
    .replace(/(\p{L})–(\p{L})/gu, '$1, $2')
    .replace(/[«»"“”]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}☀-➿❗️]/gu, '')
    .replace(/\s+/g, ' ').trim();
}

/** Identificador estable de una frase de un personaje (FNV-1a), compartido con tools/voice_lines.mjs. */
export function clipId(person, sentence) {
  let h = 0x811c9dc5;
  for (const ch of person + '|' + speechText(sentence)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

/** Divide el subtítulo en frases, sin dividir las tomas completas de audio. */
export function sentences(text) {
  return (String(text).match(/(?:[^.!?…]|(?<=\d)\.(?=\d))+[.!?…]*(\s+|$)/g) || [String(text)]).map(s => s.trim()).filter(Boolean);
}

// Dirección de las grabaciones: el reproductor nunca altera su tono ni velocidad.
export const DELIVERY={happy:{label:'contento'},angry:{label:'enfadado'},worried:{label:'preocupado'},proud:{label:'orgulloso'},surprised:{label:'sorprendido'},disappointed:{label:'decepcionado'},determined:{label:'decidido'}};
// Mantén acotado el audio decodificado durante partidas de muchas horas.
export const BUFFER_LIMIT = 64;

/** Las grabaciones ya contienen respiración y entonación; evita sumar otra pausa larga. */
export function recordedPause(raw, mood='happy', person='minister') {
  const ending = String(raw).trim();
  const punctuation = /…$|\.\.\.$/.test(ending) ? 180 : /[?]$/.test(ending) ? 150 : /[!]$/.test(ending) ? 90 : 100;
  const reflection = mood === 'worried' || mood === 'disappointed' ? 35 : mood === 'proud' ? 20 : 0;
  return punctuation + reflection + (person === 'president' ? 15 : 0);
}

export class Voices {
  constructor(music) {
    this.music = music; this.token = 0; this.speaking = null; this.listeners = new Set(); this.source = null; this.output = null; this.guard = null; this.buffers = new Map(); this.log = [];
    this.timers = new Set(); this.stings = new Set(); this.lastError = null;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('iberia-voz') || '{}'); } catch {}
    this.enabled = saved.enabled ?? true; this.volume = saved.volume ?? 1;
  }
  get neural() { return Object.keys(DIALOGUES).length > 0 || Object.keys(CLIPS).length > 0; }
  get available() { return this.neural; }
  save() { try { localStorage.setItem('iberia-voz', JSON.stringify({enabled: this.enabled, volume: this.volume})); } catch {} }
  on(fn) { this.listeners.add(fn); }
  emit() { for (const fn of this.listeners) fn(this); }
  toggle() { this.enabled = !this.enabled; this.save(); if (!this.enabled) this.stop(); this.emit(); }
  later(fn, delay, token = this.token) {
    const timer = setTimeout(() => { this.timers.delete(timer); if (token === this.token) fn(); }, delay);
    this.timers.add(timer); return timer;
  }
  clearTimers() {
    clearTimeout(this.guard); this.guard = null;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }
  releaseSource(stop = true) {
    const src = this.source, out = this.output; this.source = null; this.output = null;
    if (src) { src.onended = null; if (stop) { try { src.stop(); } catch {} } try { src.disconnect?.(); } catch {} }
    try { out?.disconnect?.(); } catch {}
  }
  stop() {
    this.token++;
    this.clearTimers(); this.releaseSource();
    for (const cue of [...this.stings]) cue.stop();
    const speaking = this.speaking; this.speaking = null;
    this.duck(false); this.emit();
    speaking?.onend?.({reason:'stopped'});
  }
  duck(on) {
    const m = this.music;
    if (!m?.master || !m.ctx) return;
    m.master.gain.setTargetAtTime(on ? m.volume * .28 : m.volume, m.ctx.currentTime, .25);
  }
  sting(kind) {
    const m = this.music; if (!m) return 0;
    m.init?.(); const ctx = m.ctx; if (!ctx) return 0;
    const out = ctx.createGain(); out.gain.value = .22 * this.volume; out.connect(ctx.destination);
    let activeTones = 0; const tones = new Set();
    const cue = {stop: () => {
      for (const o of [...tones]) { const ended = o.onended; o.onended = null; try { o.stop(); } catch {} ended?.(); }
      if (!tones.size) { out.disconnect(); this.stings.delete(cue); }
    }};
    this.stings.add(cue);
    const t = ctx.currentTime + .03, tone = (f, at, len, type = 'sine', v = 1) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
      activeTones++; tones.add(o); let released = false;
      o.onended = () => { if (released) return; released = true; tones.delete(o); o.disconnect(); g.disconnect(); if (--activeTones === 0) { out.disconnect(); this.stings.delete(cue); } };
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + .015); g.gain.exponentialRampToValueAtTime(.001, at + len);
      o.connect(g); g.connect(out); o.start(at); o.stop(at + len + .05);
      return o;
    };
    if (kind === 'fanfare') { // trompetas de inauguración, algo desafinadas a propósito
      [[392, 0], [392, .14], [523, .28], [659, .5]].forEach(([f, d], i) => { tone(f, t + d, i === 3 ? .9 : .16, 'sawtooth', .35); tone(f * 1.006, t + d, i === 3 ? .9 : .16, 'square', .12); });
      return 1300;
    }
    if (kind === 'tweet') { // pío de notificación
      [0, .11].forEach(d => { const o = tone(2400, t + d, .09, 'sine', .7); o.frequency.setValueAtTime(1900, t + d); o.frequency.exponentialRampToValueAtTime(3400, t + d + .07); });
      return 380;
    }
    if (kind === 'coins') { [2093, 2637, 2349].forEach((f, i) => tone(f, t + i * .07, .22, 'triangle', .55)); return 420; } // monedas en la caja
    if (kind === 'anvil') { [0, .18].forEach(d => { tone(523, t + d, .3, 'square', .25); tone(1568, t + d, .2, 'triangle', .35); }); return 560; } // golpe de martillo
    if (kind === 'bells') { [[523, 0], [659, .32]].forEach(([f, d]) => { tone(f, t + d, 1.1, 'sine', .7); tone(f * 2.01, t + d, .7, 'sine', .2); }); return 900; } // campanas de la iglesia del pueblo
    if (kind === 'horn') { tone(311, t, .42, 'sawtooth', .3); tone(370, t, .42, 'sawtooth', .3); return 520; } // bocina de autobús
    [880, 1109, 1319].forEach((f, i) => tone(f, t + i * .1, .5, 'triangle', .8)); // «ding» de megafonía
    return 520;
  }
  /** Reutiliza audio reciente; distingue la toma completa de una frase con igual ID. */
  buffer(id, kind = 'S') {
    const key = `${kind}:${id}`;
    if (this.buffers.has(key)) {
      const recent = this.buffers.get(key);
      this.buffers.delete(key); this.buffers.set(key, recent);
      return recent;
    }
    const decoded = Promise.resolve().then(() => {
      const entry = (kind === 'D' ? DIALOGUES : CLIPS)[id], data = typeof entry === 'string' ? entry : entry?.src;
      if (!data) throw new Error('Grabación ausente');
      const bin = atob(data), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return this.music.ctx.decodeAudioData(bytes.buffer);
    });
    const cached = decoded.catch(error => {
      if (this.buffers.get(key) === cached) this.buffers.delete(key);
      throw error;
    });
    this.buffers.set(key, cached);
    while (this.buffers.size > BUFFER_LIMIT) this.buffers.delete(this.buffers.keys().next().value);
    return cached;
  }
  /**
   * Reproduce la toma completa con una sola fuente, a velocidad y tono originales.
   * En tomas completas, onSentence(i, {approximate:true}) estima el subtítulo por
   * longitud: nunca recorta ni vuelve a sintetizar el audio para sincronizarlo.
   * onerror recibe un error estructurado y onend se ejecuta una sola vez.
   */
  speak(person, text, {onSentence, onend, onerror, sting = true, mood='happy'} = {}) {
    this.stop();
    this.lastError = null;
    if (!this.enabled) { onend?.({reason:'disabled'}); return false; }
    const parts = sentences(text), ids = parts.map(p => clipId(person, p)), dialogueId = clipId(person, text);
    const whole = !!DIALOGUES[dialogueId], mode = whole ? 'dialogue' : 'fragments';
    const errorInfo = (code, message, extra = {}) => ({code, message, person, dialogueId, mode, ...extra});
    const reject = error => { this.lastError = error; this.emit(); onerror?.(error); onend?.({reason:'error', error}); return false; };
    if (!whole && (!parts.length || ids.some(id => !CLIPS[id]))) {
      return reject(errorInfo('MISSING_RECORDING', 'No está disponible la grabación de este diálogo.', {missingIds:ids.filter(id => !CLIPS[id])}));
    }
    try { this.music?.init?.(); } catch (error) { return reject(errorInfo('AUDIO_UNAVAILABLE', 'No se ha podido iniciar el audio.', {detail:String(error?.message || error)})); }
    const ctx = this.music?.ctx;
    if (!ctx) return reject(errorInfo('AUDIO_UNAVAILABLE', 'No se ha podido iniciar el audio.'));
    const token = ++this.token;
    this.speaking = {person, onend, mode, dialogueId, alignment:whole ? 'approximate' : 'sentence-start'};
    this.duck(true); this.emit();
    const finish = (error = null) => {
      if (token !== this.token) return;
      this.token++; this.clearTimers(); this.releaseSource(!!error);
      for (const cue of [...this.stings]) cue.stop();
      this.speaking = null; this.lastError = error; this.duck(false); this.emit();
      if (error) onerror?.(error);
      onend?.({reason:error ? 'error' : 'ended', ...(error ? {error} : {})});
    };
    const play = (buf, i = 0) => {
      if (token !== this.token) return;
      try {
        const src = ctx.createBufferSource(), g = ctx.createGain();
        this.source = src; this.output = g; src.buffer = buf;
        src.playbackRate.value = 1;
        if (src.detune) src.detune.value = 0;
        g.gain.value = this.volume; src.connect(g); g.connect(ctx.destination);
        this.guard = this.later(() => finish(errorInfo('AUDIO_TIMEOUT', 'La reproducción no ha podido terminar.')), buf.duration * 1000 + 5000, token);
        src.onended = () => {
          if (token !== this.token || this.source !== src) return;
          clearTimeout(this.guard); this.timers.delete(this.guard); this.guard = null;
          this.releaseSource(false);
          if (whole || i + 1 >= parts.length) return finish();
          this.later(() => loadFragment(i + 1), recordedPause(parts[i], mood, person), token);
        };
        src.start();
        this.log.push(whole ? speechText(text) : speechText(parts[i])); if (this.log.length > 60) this.log.shift();
        onSentence?.(i, {approximate:whole, mode});
        if (token !== this.token) return;
        if (whole && parts.length > 1) {
          const weights = parts.map(part => Math.max(1, speechText(part).split(/\s+/).length)), total = weights.reduce((sum, n) => sum + n, 0);
          let preceding = 0;
          for (let next = 1; next < parts.length; next++) {
            preceding += weights[next - 1];
            this.later(() => onSentence?.(next, {approximate:true, mode}), buf.duration * 1000 * preceding / total, token);
          }
        }
      } catch (error) { finish(errorInfo('AUDIO_PLAYBACK_FAILED', 'No se ha podido reproducir la grabación.', {detail:String(error?.message || error)})); }
    };
    const failed = error => finish(errorInfo('AUDIO_DECODE_FAILED', 'No se ha podido leer la grabación.', {detail:String(error?.message || error)}));
    const loadFragment = i => this.buffer(ids[i], 'S').then(buf => play(buf, i)).catch(failed);
    try {
      const wait = sting ? this.sting((CAST[person] || CAST.minister).sting) : 0;
      this.later(() => whole ? this.buffer(dialogueId, 'D').then(buf => play(buf)).catch(failed) : loadFragment(0), wait, token);
    } catch (error) { finish(errorInfo('AUDIO_PLAYBACK_FAILED', 'No se ha podido reproducir la grabación.', {detail:String(error?.message || error)})); return false; }
    return true;
  }
}
