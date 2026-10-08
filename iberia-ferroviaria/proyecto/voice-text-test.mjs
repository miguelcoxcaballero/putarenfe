// Regresiones de instrucciones habladas: importes completos y siglas legibles.
// Sólo texto/datos; no reproduce audio ni necesita tener todas las voces listas.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {INDUCTION_STAGES} from './dist/induction.js';
import {RESPONSES} from './dist/operations.js';
import {sentences, speechText, clipId} from './dist/voice.js';

const catalogue = JSON.parse(fs.readFileSync(new URL('../investigacion/voces/frases.json', import.meta.url), 'utf8'));
const incident = INDUCTION_STAGES.find(stage => stage.id === 'incident');
let completeCostSentences = 0;
for (const person of ['workshop', 'adif']) {
  const paragraph = incident.briefing.find(line => line.who === person).text;
  const parts = sentences(paragraph);
  assert.equal(parts.join(' '), paragraph.replace(/\s+/g, ' ').trim(),
    'el diálogo real conserva los importes, la puntuación y todas sus palabras: ' + person);
  const spoken = parts.map(speechText).join(' ');
  for (const response of [RESPONSES.team, RESPONSES.bus]) {
    const euros = Math.round(response.cost * 1e6);
    assert.match(spoken, new RegExp('\\b' + euros + '\\b'), 'el coste hablado coincide con la respuesta real: ' + euros);
  }
  for (const raw of parts.filter(part => /\d\.\d/.test(part))) {
    const canonical = catalogue.find(line => line.person === person && line.raw === raw);
    assert(canonical, 'el catálogo contiene la instrucción completa de ' + person);
    assert.equal(canonical.text, speechText(raw), 'texto de voz vigente del importe completo');
    assert.equal(canonical.id, clipId(person, raw), 'el reproductor y el catálogo comparten su ID vigente');
    completeCostSentences++;
  }
}
assert.equal(completeCostSentences, 3, 'las tres instrucciones de costes tienen frases canónicas completas');

assert.deepEqual(sentences('Cuesta 18.000 €. El otro cuesta 9.000 €. Espera 0.018 meses. Versión 3.6.2.'), [
  'Cuesta 18.000 €.', 'El otro cuesta 9.000 €.', 'Espera 0.018 meses.', 'Versión 3.6.2.'
], 'los puntos numéricos no borran importes, decimales o versiones; los finales de frase siguen separándose');
for (const [raw, expected] of [
  ['18.000 €', '18000 euros'],
  ['160.000 €', '160000 euros'],
  ['9.000 €', '9000 euros'],
  ['1.234.567,89 €', '1234567,89 euros'],
  ['18.000,50 €', '18000,50 euros'],
  ['−18.000 €', '−18000 euros'],
  ['0.018 M€', '0.018 millones de euros'],
  ['0,018 M€', '0,018 millones de euros'],
  ['1.2345 €', '1.2345 euros'],
  ['Versión 3.6.2.', 'Versión 3.6.2.']
]) assert.equal(speechText(raw), expected, 'valor numérico completo y sin cambio de escala: ' + raw);

assert.equal(speechText('ERTMS'), 'e erre te eme ese', 'se pronuncian las cinco letras, incluida la E inicial');
const technical = catalogue.filter(line => /\bERTMS\b/.test(line.raw));
assert.equal(technical.length, 2, 'las dos instrucciones reales sobre ERTMS siguen presentes');
for (const line of technical) {
  assert.match(line.text, /\be erre te eme ese\b/, 'pronunciación explícita en el catálogo');
  assert.equal(line.id, clipId(line.person, line.raw), 'ID de la instrucción con ERTMS');
  assert.equal(clipId(line.person, line.raw), clipId(line.person, line.raw.replace('ERTMS', 'e erre te eme ese')), 'la forma visible y pronunciable seleccionan la misma grabación');
}
console.log('Voces/texto: costes reales íntegros, miles/decimales/versiones y cinco letras de ERTMS PASS.');
