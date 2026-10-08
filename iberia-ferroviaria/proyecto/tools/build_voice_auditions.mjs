// Genera una audición autónoma de las tomas ya validadas; no sustituye voces del juego.
// Uso: node tools/build_voice_auditions.mjs [--manifest archivo.json] [--output archivo.html] [--scripts guiones.json]
// También acepta la carpeta del manifiesto, incluidas generadas-3.3 y colecciones completas.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {CHARACTERS} from '../dist/story.js';
import {faceURL} from '../dist/faces.js';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(name);
  if (at < 0) return fallback;
  if (!args[at + 1] || args[at + 1].startsWith('--')) throw Error(`Falta el valor de ${name}`);
  return path.resolve(args[at + 1]);
};
for (let at = 0; at < args.length; at += 2) {
  if (!['--manifest', '--output', '--scripts'].includes(args[at])) throw Error(`Opción desconocida: ${args[at]}`);
}
const manifestInput = option('--manifest', path.resolve(project, '../investigacion/voces/audiciones-3.3/manifest.json'));
const manifestPath = fs.statSync(manifestInput).isDirectory() ? path.join(manifestInput, 'manifest.json') : manifestInput;
const outputPath = option('--output', path.resolve(project, '../outputs/Iberia-Ferroviaria-voces-3.3.html'));
const version = path.basename(outputPath).match(/\d+\.\d+(?:\.\d+)*/)?.[0] || '3.3';
const source = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const scriptsPath = option('--scripts', null);
const pendingScripts = new Map();
if (scriptsPath) {
  const payload = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'));
  if (!Array.isArray(payload.samples)) throw Error('Los guiones deben contener una lista samples.');
  for (const sample of payload.samples) {
    if (!Object.hasOwn(CHARACTERS, sample.person) || pendingScripts.has(sample.person)
      || !Array.isArray(sample.paragraphs) || sample.paragraphs.length !== 2
      || sample.paragraphs.some(paragraph => typeof paragraph !== 'string' || !paragraph.trim())) {
      throw Error(`Guion de dos párrafos inválido: ${sample.person}`);
    }
    pendingScripts.set(sample.person, sample.paragraphs.join('\n\n'));
  }
}
const moods = {
  happy:'Contento', angry:'Cabreado', worried:'Preocupado', proud:'Orgulloso',
  surprised:'Sorprendido', disappointed:'Decepcionado', determined:'Decidido'
};
const moodOrder = Object.keys(moods);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const samples = [], ignored = [];
for (const [key, take] of Object.entries(manifest.takes || {})) {
  const id = take.id || key;
  if (take.validated !== true) { ignored.push(`${id}: no validada`); continue; }
  if (!/^[\w-]+$/.test(id) || !Object.hasOwn(CHARACTERS, take.person)) { ignored.push(`${id}: identidad desconocida`); continue; }
  const filename = path.join(source, `${id}.mp3`);
  if (!fs.existsSync(filename)) { ignored.push(`${id}: MP3 ausente`); continue; }
  const bytes = fs.readFileSync(filename);
  if (!take.sha256 || createHash('sha256').update(bytes).digest('hex') !== take.sha256) {
    ignored.push(`${id}: integridad no verificada`); continue;
  }
  if (!bytes.length || !take.text?.trim()) { ignored.push(`${id}: toma vacía`); continue; }
  samples.push({id, person:take.person, mood:take.mood || 'happy', text:take.text, provisional:take.provisional === true,
    duration:Number(take.duration) || 0, audio:`data:audio/mpeg;base64,${bytes.toString('base64')}`});
}
samples.sort((a, b) => Object.keys(CHARACTERS).indexOf(a.person) - Object.keys(CHARACTERS).indexOf(b.person)
  || moodOrder.indexOf(a.mood) - moodOrder.indexOf(b.mood));
const seconds = duration => `${duration.toLocaleString('es-ES', {maximumFractionDigits:1})} s`;
const peopleWithAudio = new Set(samples.map(sample => sample.person)).size;
const hasLongDialogues = samples.some(sample => sample.text.trim().split(/\n\s*\n/).length === 2);
const dialogueHTML = text => text.trim().split(/\n\s*\n/).map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('');
const rail = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3" width="12" height="15" rx="4"/><path d="M7 10h10M10 18l-3 3m7-3 3 3M9 6h6M9 14h.01M15 14h.01"/></svg>';
const card = ([id, person]) => {
  const takes = samples.filter(sample => sample.person === id);
  const groups = [...new Set(takes.map(sample => sample.mood))];
  return `<article class="character-card" id="person-${id}" aria-labelledby="name-${id}">
    <header><img src="${faceURL(id, takes[0]?.mood || 'happy')}" alt="Retrato de ${escapeHTML(person.name)}" width="62" height="79"><div><h2 id="name-${id}">${escapeHTML(person.name)}</h2><p>${escapeHTML(person.role)}</p><span class="sample-count">${takes.length ? `${takes.length} ${takes.length === 1 ? 'muestra disponible' : 'muestras disponibles'}` : 'Sin muestras disponibles'}</span></div></header>
    ${takes.some(take => take.provisional) ? '<p class="pending provisional">Voz provisional: todavía no utiliza la referencia de Torrente.</p>' : ''}
    ${takes.length ? `<button class="sequence person-sequence" data-sequence="${id}">Escuchar secuencia <span aria-hidden="true">→</span></button>${groups.map(mood => `<section class="mood-group" aria-labelledby="mood-${id}-${escapeHTML(mood)}"><h3 id="mood-${id}-${escapeHTML(mood)}">${escapeHTML(moods[mood] || mood)}</h3><ol>${takes.filter(take => take.mood === mood).map(take => `<li class="take" data-take="${take.id}"><blockquote>${dialogueHTML(take.text)}</blockquote><div class="take-actions"><button class="listen" data-play="${take.id}" aria-label="Escuchar a ${escapeHTML(person.name)}" aria-pressed="false"><span class="listen-label">Reproducir</span><span aria-hidden="true">▷</span></button><span>${seconds(take.duration)}</span></div></li>`).join('')}</ol></section>`).join('')}` : `<p class="pending">Voz pendiente. Este personaje todavía no tiene grabaciones en este archivo.</p>${pendingScripts.has(id) ? `<div class="take pending-script"><blockquote>${dialogueHTML(pendingScripts.get(id))}</blockquote></div>` : ''}`}
  </article>`;
};
const fonts = ['figtree', 'fraunces'].map((font, index) => `@font-face{font-family:${index ? 'Fraunces' : 'Figtree'};src:url('data:font/woff2;base64,${fs.readFileSync(path.join(project, `dist/assets/fonts/${font}.woff2`)).toString('base64')}') format('woff2');font-weight:100 900;font-display:swap}`).join('\n');
const css = `${fonts}
:root{--paper:#f6f0e4;--ink:#302b28;--muted:#746d63;--wine:#842b46;--rule:#ddd3c3;--green:#365d56;font-family:Figtree,system-ui,sans-serif;color:var(--ink);background:#e9e0d1;font-size:15px;line-height:1.5;color-scheme:light}*{box-sizing:border-box}html{scroll-padding-top:20px;scroll-padding-bottom:180px}body{margin:0}button,a,audio{font:inherit}button{cursor:pointer}button:disabled{cursor:default;opacity:.45}button:focus-visible,a:focus-visible,audio:focus-visible{outline:3px solid #b76d22;outline-offset:4px}a{color:inherit}.page{max-width:1220px;margin:auto;padding:36px 34px 200px}.masthead{display:flex;align-items:center;gap:10px;font-size:11px;font-weight:650;letter-spacing:1.7px;text-transform:uppercase;color:var(--wine);border-bottom:1px solid var(--rule);padding-bottom:18px}.masthead svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.masthead .version{margin-left:auto;font-weight:500;letter-spacing:.8px;color:var(--muted)}.intro{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:25px;align-items:center;margin:28px 0 22px}h1{font:550 clamp(33px,4vw,49px)/1.05 Fraunces,Georgia,serif;letter-spacing:-1px;margin:0 0 11px}.intro p{max-width:660px;margin:0;color:#665d53;font-size:14px;line-height:1.65}.intro .coverage{margin-top:9px;font-size:12px;color:var(--green);font-weight:650}.global-sequence{background:var(--wine);color:#fff5e5;border:0;border-radius:7px;padding:14px 21px;font-weight:700;white-space:nowrap}.global-sequence:hover{background:#a03556}.people-nav{display:flex;flex-wrap:wrap;gap:6px;margin:24px 0 26px}.people-nav a{text-decoration:none;border:1px solid #cabfac;border-radius:20px;padding:6px 13px;font-size:12px;color:#62574c}.people-nav a:hover{background:#f7f1e4;color:var(--wine)}.people-nav a.pending-link{color:#8b8275}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:start}.character-card{background:var(--paper);border:1px solid #d6cab8;border-radius:10px;padding:21px;scroll-margin-top:20px}.character-card>header{display:flex;gap:13px;align-items:center}.character-card img{object-fit:cover;object-position:center 20%;border:1px solid #c5bcae;border-radius:5px;flex:none}.character-card h2{font:550 21px/1.12 Fraunces,Georgia,serif;letter-spacing:-.25px;margin:0 0 5px}.character-card header p{margin:0;font-size:10.5px;line-height:1.4;color:var(--muted)}.sample-count{display:block;font-size:9.5px;color:var(--green);margin-top:6px}.person-sequence{display:flex;justify-content:space-between;width:100%;background:none;border:0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:11px 0;margin:17px 0;color:var(--wine);font-size:11.5px;font-weight:700;text-align:left}.person-sequence:hover{color:#ad3b5e}.mood-group+ .mood-group{margin-top:24px}.mood-group h3{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#88755e;margin:0 0 10px}.mood-group ol{list-style:none;padding:0;margin:0}.take+ .take{margin-top:17px;padding-top:17px;border-top:1px solid var(--rule)}.take blockquote{font-size:13.5px;line-height:1.6;margin:0;color:#473d35}.take blockquote p{margin:0}.take blockquote p+p{margin-top:14px}.take-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:10px}.take-actions>span{font-size:10px;color:#948775;font-variant-numeric:tabular-nums}.listen{display:flex;align-items:center;gap:10px;border:1px solid #bfac96;background:#fffaf0;color:var(--wine);border-radius:5px;padding:6px 11px;font-size:11px;font-weight:700}.listen:hover{background:#f1e2ce}.listen[aria-pressed=true]{border-color:var(--wine);background:var(--wine);color:#fff5e5}.take.is-current blockquote{color:var(--wine)}.pending{font-size:12px;line-height:1.65;color:#887c6e;margin:20px 0 0}.player-bar{position:fixed;bottom:0;left:0;right:0;background:rgba(37,45,44,.98);color:#fff3df;box-shadow:0 -5px 22px rgba(45,34,24,.16);padding:17px 24px 20px;z-index:10}.player-inner{max-width:1152px;margin:auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(230px,370px);gap:18px 30px;align-items:center}.now-label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#b8c6ba;margin:0 0 3px}.now-title{font:500 18px/1.25 Fraunces,Georgia,serif;margin:0 0 3px}.now-text{font-size:11px;color:#d3d8cc;line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.player-controls{display:flex;gap:6px;align-items:center;margin-top:9px}.player-controls button{border:1px solid #6b7d74;border-radius:5px;background:none;color:#ecf1e4;font-size:10.5px;padding:5px 10px}.player-controls button:hover:enabled{background:#3a544c}.sequence-position{font-size:10px;color:#b2c2b7;margin-left:4px}.player-audio{width:100%;height:42px}.notice{font-size:11px;color:#7e7263;margin:28px 0 0;max-width:710px}.player-status{font-size:10px;color:#b2c2b7;margin:4px 0 0}.player-bar[data-error=true] .player-status{color:#ffbeaa}@media(max-width:980px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.page{padding-left:26px;padding-right:26px}.intro{grid-template-columns:1fr}.global-sequence{justify-self:start;padding:12px 19px}}@media(max-width:620px){.listen,.person-sequence,.player-controls button{min-height:44px}html{scroll-padding-bottom:220px}.page{padding:23px 18px 255px}.masthead{font-size:9px;letter-spacing:1px}.masthead .version{font-size:9px}.intro{margin-top:23px;gap:17px}.intro p{font-size:12.5px}.intro .coverage{font-size:11px}.people-nav{gap:5px;margin:20px 0}.people-nav a{font-size:10.5px;padding:5px 11px}.cards{grid-template-columns:1fr;gap:13px}.character-card{padding:19px}.character-card h2{font-size:22px}.player-bar{padding:13px 18px 15px}.player-inner{grid-template-columns:1fr;gap:11px}.now-title{font-size:17px}.now-text{-webkit-line-clamp:1}.player-controls{margin-top:8px}.player-audio{height:36px}.player-status{font-size:9px}.sequence-position{font-size:9px}.notice{font-size:10.5px}}@media(prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}`;

const script = `
const SAMPLES = ${JSON.stringify(samples).replaceAll('<', '\\u003c')};
const NAMES = ${JSON.stringify(CHARACTERS).replaceAll('<', '\\u003c')};
const MOODS = ${JSON.stringify(moods).replaceAll('<', '\\u003c')};
const byId = new Map(SAMPLES.map(sample => [sample.id, sample]));
const audio = document.getElementById('auditionPlayer');
const bar = document.querySelector('.player-bar');
let current = null, sequence = [], position = -1, generation = 0;
const button = name => document.querySelector('[data-control="' + name + '"]');
function update() {
  for (const element of document.querySelectorAll('[data-play]')) {
    const active = element.dataset.play === current?.id && !audio.paused;
    element.setAttribute('aria-pressed', String(active));
    element.querySelector('.listen-label').textContent = active ? 'Pausar' : 'Reproducir';
    element.lastElementChild.textContent = active ? '||' : '▷';
  }
  for (const element of document.querySelectorAll('[data-take]')) element.classList.toggle('is-current', element.dataset.take === current?.id);
  document.getElementById('nowTitle').textContent = current ? NAMES[current.person].name + ' · ' + (MOODS[current.mood] || current.mood) : 'Elige un personaje';
  document.getElementById('nowText').textContent = current?.text || 'Reproduce una muestra o escucha una secuencia.';
  document.getElementById('sequencePosition').textContent = sequence.length > 1 ? (position + 1) + ' / ' + sequence.length : '';
  button('previous').disabled = position <= 0;
  button('next').disabled = position < 0 || position >= sequence.length - 1;
  button('stop').disabled = !current;
}
function status(text, error = false) {
  document.getElementById('playerStatus').textContent = text;
  bar.dataset.error = String(error);
}
async function loadAt(index) {
  const token = ++generation;
  audio.pause();
  audio.currentTime = 0;
  position = index;
  current = byId.get(sequence[position]);
  if (!current) { stop(); return; }
  audio.src = current.audio;
  update();
  status('Cargando muestra…');
  try {
    await audio.play();
    if (token === generation) { status('Reproduciendo ' + NAMES[current.person].name + '.'); update(); }
  } catch(error) {
    if (token !== generation) return;
    status(error.name === 'NotAllowedError' ? 'Pulsa reproducir en el control de audio para escuchar.' : 'Esta muestra no se pudo reproducir.', true);
    update();
  }
}
function stop() {
  generation++;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  current = null; sequence = []; position = -1;
  status('Reproducción detenida.'); update();
}
document.addEventListener('click', event => {
  const play = event.target.closest('[data-play]');
  if (play) {
    const sample = byId.get(play.dataset.play);
    if (!sample) return;
    if (current?.id === sample.id) {
      if (audio.paused) audio.play().catch(() => status('No se pudo reanudar esta muestra.', true));
      else audio.pause();
    } else { sequence = [sample.id]; loadAt(0); }
    return;
  }
  const start = event.target.closest('[data-sequence]');
  if (start) {
    const person = start.dataset.sequence;
    sequence = SAMPLES.filter(sample => person === 'all' || sample.person === person).map(sample => sample.id);
    if (sequence.length) loadAt(0);
    return;
  }
  const control = event.target.closest('[data-control]')?.dataset.control;
  if (control === 'stop') stop();
  else if (control === 'previous' && position > 0) loadAt(position - 1);
  else if (control === 'next' && position < sequence.length - 1) loadAt(position + 1);
});
audio.addEventListener('play', () => { update(); if (current) status('Reproduciendo ' + NAMES[current.person].name + '.'); });
audio.addEventListener('pause', () => { update(); if (current && !audio.ended) status('Muestra en pausa.'); });
audio.addEventListener('ended', () => {
  if (position >= 0 && position + 1 < sequence.length) loadAt(position + 1);
  else { update(); status('Secuencia terminada.'); }
});
audio.addEventListener('error', () => { if (current) { update(); status('Esta muestra no se pudo reproducir.', true); } });
update();
`;
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#252d2c"><title>Iberia Ferroviaria · Audición de voces ${escapeHTML(version)}</title><style>${css}</style></head><body>
<main class="page"><header class="masthead">${rail}<span>Iberia Ferroviaria</span><span class="version">Voces · ${escapeHTML(version)}</span></header><section class="intro" aria-labelledby="title"><div><h1 id="title">El consejo tiene voz.</h1><p>Escucha las muestras disponibles y compara cómo habla cada personaje. ${hasLongDialogues ? 'Las nuevas muestras incluyen dos párrafos para valorar claridad, preguntas y remates irónicos. ' : ''}Puedes reproducir una muestra, un personaje o toda la ronda.</p><p class="coverage">${samples.length} ${samples.length === 1 ? 'muestra' : 'muestras'} · ${peopleWithAudio} de ${Object.keys(CHARACTERS).length} personajes con audio en este archivo</p></div><button class="global-sequence" data-sequence="all" ${samples.length ? '' : 'disabled'}>Escuchar todas las muestras</button></section>
<nav class="people-nav" aria-label="Ir a un personaje">${Object.entries(CHARACTERS).map(([id, person]) => `<a href="#person-${id}" class="${samples.some(sample => sample.person === id) ? '' : 'pending-link'}">${escapeHTML(person.name.split(' ')[0])}</a>`).join('')}</nav><div class="cards">${Object.entries(CHARACTERS).map(card).join('')}</div><p class="notice">Esta es una audición de las grabaciones incluidas en este archivo. ${manifest.run?.game_catalogue_published === true ? 'El juego incorpora el reparto nuevo.' : 'Las voces completas del juego siguen en preparación.'} El audio está incorporado y se puede escuchar sin conexión.</p></main>
<footer class="player-bar"><div class="player-inner"><div><p class="now-label">En el micrófono</p><h2 class="now-title" id="nowTitle">Elige un personaje</h2><p class="now-text" id="nowText"></p><div class="player-controls"><button data-control="previous" disabled>Anterior</button><button data-control="stop" disabled>Detener</button><button data-control="next" disabled>Siguiente</button><span class="sequence-position" id="sequencePosition" aria-label="Posición en la secuencia"></span></div></div><div><audio class="player-audio" id="auditionPlayer" controls preload="none" aria-label="Reproductor de la muestra de voz"></audio><p class="player-status" id="playerStatus" role="status" aria-live="polite">Listo para escuchar.</p></div></div></footer><script>${script.replaceAll('</script', '<\\/script')}</script></body></html>`;
fs.mkdirSync(path.dirname(outputPath), {recursive:true});
fs.writeFileSync(outputPath, html);
console.log(`Audición: ${samples.length} muestras de ${peopleWithAudio}/${Object.keys(CHARACTERS).length} personajes, ${(Buffer.byteLength(html) / 1e6).toFixed(2)} MB.`);
console.log(outputPath);
if (ignored.length) console.warn(`Omitidas: ${ignored.join('; ')}`);
