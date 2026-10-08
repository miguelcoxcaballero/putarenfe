// An opener changes only layout: full voice text and subtitle indices stay intact.
import assert from 'node:assert/strict';
import {dialoguePresentation, dialogueHtml} from './dist/dialogue-presentation.js';
import {sentences, speechText} from './dist/voice.js';
import {ENCOUNTERS} from './dist/encounters.js';
import {DIALOGUE_CATALOGUE} from './tools/voice_dialogues.mjs';

let explicit = 0;
for (const row of DIALOGUE_CATALOGUE) {
  const view = dialoguePresentation(row.raw, row.person), html = dialogueHtml(row.raw, row.person);
  assert.deepEqual(view.parts, sentences(row.raw), 'original subtitle order: ' + row.id);
  assert.equal(speechText([view.opener, view.main].filter(Boolean).join(' ')), row.text, 'full spoken body retained: ' + row.id);
  assert.equal(view.parts.join(' '), row.raw.replace(/\s+/g, ' ').trim(), 'no displayed words dropped: ' + row.id);
  assert.equal((html.match(/class="say-s"/g) || []).length, view.parts.length, 'one original subtitle per index: ' + row.id);
  assert(!/<p\b|<div\b|data-say/.test(html), 'formatter never adds a window or nests the paragraph');
  if (row.raw.includes('\n\n')) {
    explicit++;
    assert.equal(view.source, 'explicit-context');
    assert.equal(view.opener, row.raw.split('\n\n')[0].replace(/\s+/g, ' ').trim(), 'context precedes original main body');
    assert(view.main.length > 0);
  }
}
assert.equal(DIALOGUE_CATALOGUE.length, 412);
assert.equal(explicit, 31, 'all 31 contextual introductions are presented before the main text');
for (const scene of ENCOUNTERS) {
  const view = dialoguePresentation(scene.body, scene.person);
  assert.equal(view.source, 'existing-mood-prefix');
  assert(view.opener && view.main, 'each playable scene keeps both existing mood entry and the conflict');
}
const scene = ENCOUNTERS.find(row => row.id === 'scene-president-happy-0');
const happy = dialoguePresentation(scene.body, scene.person);
assert.equal(happy.opener, 'Hoy hasta los sondeos sonríen. No lo jodas.', 'the complete existing two-sentence mood entry stays together');
assert.equal(happy.main, 'Quiero más salidas en hora punta. Y maquinistas, no asesores fingiendo conducir.');
assert.equal(happy.openerCount, 2);
const short = dialoguePresentation('Una sola frase.', 'minister');
assert.equal(short.opener, ''); assert.equal(short.main, 'Una sola frase.');
const hostile = dialogueHtml('Lee <img src=x onerror=alert(1)>. Después seguimos.', 'minister');
assert(!hostile.includes('<img')); assert(hostile.includes('&lt;img'));
console.log('Presentación: 412 cuerpos íntegros, 31 introducciones, 315 prefijos existentes y mismos índices de subtítulos PASS.');
