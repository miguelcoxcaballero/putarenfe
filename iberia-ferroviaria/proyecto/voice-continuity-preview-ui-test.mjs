// Escucha real de las cuatro alternativas completas; ningún audio/evento está simulado.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const input = path.resolve(process.env.CONTINUITY_HTML || path.join(root, '../outputs/Iberia-Ferroviaria-continuidad-voces-3.6.3.html'));
const out = path.resolve(process.env.CONTINUITY_OUT || path.join(root, '../investigacion/verificacion-continuidad-3.6.3'));
const sourceReportFile = path.join(root, '../investigacion/voces/reparto-3.6.3/continuity-preview.json');
const sha = value => createHash('sha256').update(value).digest('hex');
const original = fs.readFileSync(input, 'utf8'), sourceReport = JSON.parse(fs.readFileSync(sourceReportFile));
assert.equal(sha(original), sourceReport.html_sha256, 'HTML exacto construido y declarado');
const begin = original.indexOf('const people = ') + 'const people = '.length;
const end = original.indexOf(';\nconst player = ', begin);
assert(begin > 0 && end > begin, 'catálogo incrustado del reproductor');
const people = JSON.parse(original.slice(begin, end));
assert.equal(people.length, 2); assert(people.every(person => person.variants.length === 2), 'cuatro alternativas');
fs.mkdirSync(out, {recursive: true});
const report = {
  startedAt: new Date().toISOString(), htmlSHA256: sha(original), htmlBytes: Buffer.byteLength(original),
  testSourceSHA256: sha(fs.readFileSync(fileURLToPath(import.meta.url))),
  sourceReportSHA256: sha(fs.readFileSync(sourceReportFile)), productionFilesModified: false,
  textModified: false, originalHTMLServedUnchanged: true, nativeAudio: true,
  scope: 'Dos cuerpos íntegros, cuatro alternativas completas, controles reales y móviles 390/320.',
  limitation: 'Verifica procedencia, reproducción y controles; no sustituye escuchar naturalidad o parecido.',
  alternatives: [], mobile: [], errors: [], resourceErrors: [], failedRequests: [], unexpectedRequests: [], status: 'running'
};
let browser, server;
const save = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');

function observeNativeMedia() {
  const qa = window.__continuityQA = {plays: [], events: [], synthesis: []};
  let active = null;
  const digest = async src => {
    const base64 = src.split(',')[1], binary = atob(base64), bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
  };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function(...args) {
    if (this.id === 'player') {
      active = {
        index: qa.plays.length, at: performance.now(), mediaTag: this.tagName,
        nativeMedia: this instanceof HTMLAudioElement, sourceKind: this.src.startsWith('data:audio/mpeg;base64,') ? 'embedded-mp3' : 'other',
        preview: window.__continuityPreview.get(), startTime: this.currentTime,
        duration: this.duration, rate: this.playbackRate, defaultRate: this.defaultPlaybackRate,
        volume: this.volume, readyState: this.readyState, progress: []
      };
      const row = active; qa.plays.push(row);
      digest(this.src).then(hash => {row.mp3SHA256 = hash;}, error => {row.hashError = String(error);});
      const result = play.apply(this, args);
      result.then(() => {row.playPromiseFulfilled = true;}, error => {row.playError = String(error);});
      return result;
    }
    return play.apply(this, args);
  };
  for (const type of ['loadedmetadata', 'playing', 'pause', 'timeupdate', 'ended', 'error']) {
    document.addEventListener(type, event => {
      const player = event.target;
      if (!(player instanceof HTMLAudioElement) || player.id !== 'player') return;
      const entry = {type, at: performance.now(), trusted: event.isTrusted, currentTime: player.currentTime, duration: player.duration, rate: player.playbackRate};
      qa.events.push(entry);
      if (!active) return;
      if (type === 'playing') {active.playingAt = entry.at; active.nativePlaying = entry.trusted; active.duration = entry.duration;}
      if (type === 'timeupdate') active.progress.push({at: entry.at, time: entry.currentTime});
      if (type === 'pause') active.pauses = [...(active.pauses || []), entry];
      if (type === 'ended') {active.nativeEnded = entry.trusted; active.endedAt = entry.at; active.endTime = entry.currentTime;}
      if (type === 'error') active.mediaError = player.error?.message || 'native-media-error';
    }, true);
  }
  if (window.speechSynthesis) {
    const speak = window.speechSynthesis.speak;
    window.speechSynthesis.speak = function(utterance) {qa.synthesis.push(utterance.text); return speak.call(this, utterance);};
  }
}

try {
  server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') {res.writeHead(204); res.end(); return;}
    if (req.url !== '/preview.html') {res.writeHead(404); res.end(); return;}
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); res.end(original);
  });
  await new Promise((resolve, reject) => {server.once('error', reject); server.listen(0, '127.0.0.1', resolve);});
  const url = `http://127.0.0.1:${server.address().port}/preview.html`;
  const pw = process.env.PLAYWRIGHT_MODULE || 'playwright';
  const {chromium} = await import(pw.startsWith('/') ? pathToFileURL(pw).href : pw);
  browser = await chromium.launch({executablePath: '/usr/bin/chromium', args: ['--autoplay-policy=no-user-gesture-required']});
  report.browser = browser.version();
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, serviceWorkers: 'block'});
  await context.addInitScript(observeNativeMedia);
  const page = await context.newPage(); page.setDefaultTimeout(60000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') {
      report.errors.push(message.text()); report.resourceErrors.push({text: message.text(), location: message.location()});
    }
  });
  page.on('request', request => {if (/^https?:/.test(request.url()) && request.url() !== url && !request.url().endsWith('/favicon.ico')) report.unexpectedRequests.push(request.url());});
  page.on('requestfailed', request => report.failedRequests.push({url: request.url(), failure: request.failure()}));
  await page.goto(url, {waitUntil: 'load'}); await page.waitForFunction(() => window.__continuityPreview && window.__continuityQA);
  // Chromium solicita su favicon implícito después de load. Espera a que cierre
  // ese GET local antes de desactivar la red; no altera el HTML ni las voces.
  await page.waitForLoadState('networkidle');
  await context.setOffline(true); report.offlineDuringAllPlayback = true;
  assert.equal(await page.locator('audio').count(), 1, 'un único audio nativo');
  const texts = await page.locator('blockquote p').allTextContents();
  assert.deepEqual(texts, people.map(person => person.text), 'los dos diálogos completos están intactos');
  for (const person of people) assert.equal(sha(person.text), person.canonical_sha256);

  async function playFull(person, variant, label) {
    const before = await page.evaluate(() => window.__continuityQA.plays.length);
    await page.locator(`[data-choice="${person.id}:${variant.key}"]`).click();
    const total = variant.segments.reduce((sum, segment) => sum + segment.duration + segment.gap, 0);
    await page.waitForFunction(({n, count}) => {
      const rows = window.__continuityQA.plays.slice(n), state = window.__continuityPreview.get();
      return rows.length === count && rows.every(row => row.nativeEnded && row.mp3SHA256) && state.phase === 'ended' && !state.playing;
    }, {n: before, count: variant.segments.length}, {timeout: total * 1000 + 15000});
    const actual = await page.evaluate(n => window.__continuityQA.plays.slice(n), before);
    actual.forEach((row, i) => {
      const segment = variant.segments[i];
      assert.equal(row.mp3SHA256, segment.sha256, 'bytes MP3 realmente reproducidos');
      assert.equal(row.preview.selected, person.id); assert.equal(row.preview.variant, variant.key); assert.equal(row.preview.index, i);
      assert.equal(row.nativeMedia, true); assert.equal(row.sourceKind, 'embedded-mp3');
      assert.equal(row.playPromiseFulfilled, true); assert.equal(row.nativePlaying, true); assert.equal(row.nativeEnded, true);
      assert.equal(row.rate, 1); assert.equal(row.defaultRate, 1);
      assert(Math.abs(row.duration - segment.duration) < .15, 'duración del MP3 nativo y la toma declarada');
      assert(row.progress.length && row.progress.some(point => point.time > .2), 'el reloj del audio nativo avanzó');
      assert(row.endedAt - row.at >= row.duration * 1000 - 300, 'se escuchó hasta el final real');
      assert.equal(row.mediaError, undefined); assert.equal(row.playError, undefined); assert.equal(row.hashError, undefined);
    });
    const afterTexts = await page.locator('blockquote p').allTextContents(); assert.deepEqual(afterTexts, texts, 'no se recorta el texto al escuchar');
    report.alternatives.push({label, person: person.person, id: person.id, variant: variant.key, text: person.text, expected: variant.segments.map(({audio,...row}) => row), actual});
    save(); console.log(`PASS ${label}: ${variant.segments.length} MP3, ${total.toFixed(2)} s completos, ended nativo.`);
  }
  for (const person of people) for (const variant of person.variants) await playFull(person, variant, `${person.person}-${variant.key}`);
  await page.screenshot({path: path.join(out, 'desktop.png'), animations: 'disabled', fullPage: true});
  for (const width of [390, 320]) {
    await page.setViewportSize({width, height: 844});
    const dimensions = await page.evaluate(() => ({viewport: innerWidth, document: document.scrollingElement.scrollWidth}));
    assert(dimensions.document <= width + 1, 'sin overflow a ' + width);
    for (const selector of ['[data-choice]', '#playPause', '#stop', '#seek']) {
      const controls = page.locator(selector);
      for (let i = 0; i < await controls.count(); i++) {
        const control = controls.nth(i); await control.scrollIntoViewIfNeeded();
        const box = await control.boundingBox(); assert(box.width >= 44 && box.height >= 44, 'control táctil de 44 px');
        assert(await control.evaluate(el => {const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el||el.contains(hit);}), 'control sin superposición');
      }
    }
    await page.screenshot({path: path.join(out, `mobile-${width}.png`), animations: 'disabled', fullPage: true});
    report.mobile.push({width, dimensions});
  }
  const person = people[0], variant = person.variants.find(row => row.key === 'continuous');
  await page.locator(`[data-choice="${person.id}:${variant.key}"]`).click();
  await page.waitForFunction(() => document.getElementById('player').currentTime > .4);
  await page.locator('#playPause').click();
  const pauseTime = await page.locator('#player').evaluate(el => el.currentTime);
  await page.waitForTimeout(500);
  const paused = await page.locator('#player').evaluate(el => ({paused: el.paused, time: el.currentTime, rate: el.playbackRate}));
  assert.equal(paused.paused, true); assert(Math.abs(paused.time - pauseTime) < .05); assert.equal(paused.rate, 1);
  await page.locator('#playPause').click(); await page.waitForFunction(t => document.getElementById('player').currentTime > t + .2, pauseTime);
  await page.locator('#stop').click();
  const stopped = await page.evaluate(() => ({state: window.__continuityPreview.get(), paused: document.getElementById('player').paused, src: document.getElementById('player').getAttribute('src'), plays: window.__continuityQA.plays.length}));
  assert.equal(stopped.state.phase, 'idle'); assert.equal(stopped.state.position, 0); assert.equal(stopped.paused, true); assert.equal(stopped.src, null);
  await page.waitForTimeout(700); assert.equal(await page.evaluate(() => window.__continuityQA.plays.length), stopped.plays, 'no reaparece audio tras detener');
  report.controls = {paused, stopped};
  await playFull(person, variant, 'restored-after-pause-stop');
  const final = await page.evaluate(() => ({synthesis: window.__continuityQA.synthesis, events: window.__continuityQA.events, plays: window.__continuityQA.plays}));
  report.nativeEvents = final.events; report.allNativePlays = final.plays; report.speechSynthesisCalls = final.synthesis;
  assert.deepEqual(final.synthesis, []); assert.deepEqual(report.errors, []); assert.deepEqual(report.unexpectedRequests, []); assert.deepEqual(report.failedRequests, []);
  assert(final.events.every(event => event.trusted), 'los eventos de medios proceden del navegador');
  report.status = 'pass';
} catch (error) {
  report.status = 'fail'; report.failure = error.stack || String(error); process.exitCode = 1; console.error(report.failure);
} finally {
  report.finishedAt = new Date().toISOString(); save();
  await browser?.close(); if (server) await new Promise(resolve => server.close(resolve));
}
