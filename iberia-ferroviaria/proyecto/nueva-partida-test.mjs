// Una sola partida, sin navegador: semilla, arranques, partidas guardadas y HTML de la portada y de «Nueva partida».
import assert from 'node:assert/strict';
import * as E from './dist/engine.js';
import * as T from './dist/tycoon.js';
import * as O from './dist/operations.js';
import * as R from './dist/rescate.js';
import {STARTS, MAQUETA_CASH, normalizeSeed, seedFromCode, randomSeedCode, seedCodeOf, savedGames, overwrittenBy, newGameHTML} from './dist/nueva-partida.js';
import {menuHTML} from './dist/main-menu.js';

// Semilla: mismo código, mismo entero; los números cortos valen tal cual.
assert.equal(seedFromCode('72022'), 72022, '72022 sigue siendo la campaña de siempre');
assert.equal(seedFromCode('  norte   80 '), seedFromCode('NORTE 80'), 'espacios y mayúsculas no cambian la partida');
assert.notEqual(seedFromCode('NORTE'), seedFromCode('SUR'));
for (const code of ['A', 'ÑANDÚ', 'x'.repeat(40), '1234567890']) { const seed = seedFromCode(code); assert(Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32, code); }
assert.equal(normalizeSeed('x'.repeat(40)).length, 24);
assert.equal(randomSeedCode(() => 0), 'AAAAAA');
assert.match(randomSeedCode(), /^[A-HJ-NP-Z2-9]{6}$/);
assert.equal(seedCodeOf({seedCode: 'abc'}), 'ABC');
assert.equal(seedCodeOf({v: 1, seed: 4242}), '4242', 'los rescates anteriores se repiten con su número');
assert.equal(seedCodeOf(E.initialState()), '', 'una clásica antigua no inventa su código');

// Misma semilla, mismo arranque (La herencia, Maqueta y El rescate).
const classic = (seed, maqueta) => { const s = E.initialState(seed); if (maqueta) T.freeGame(s, maqueta.cash, maqueta.rivals); O.ensureOps(s); s.ops.day = 3; s.started = true; return s; };
assert.deepEqual(classic(seedFromCode('REPETIBLE')), classic(seedFromCode('repetible')));
assert.notEqual(classic(seedFromCode('A')).seed, classic(seedFromCode('B')).seed);
for (const cash of MAQUETA_CASH) for (const rivals of [true, false]) {
  const s = classic(1, {cash, rivals});
  assert.equal(s.cash, cash); assert.equal(s.tycoon.rivals, rivals); assert.equal(s.tycoon.mode, 'free'); assert(E.validateSave(s));
}
assert.deepEqual(R.newGame(seedFromCode('NORTE')), R.newGame(seedFromCode('norte')), 'mismo rescate con la misma semilla');
const savedClassic = {...classic(7), savedAt: 2000, seedCode: 'X'};
assert.equal(E.validateSave(savedClassic).savedAt, 2000, 'savedAt viaja con la partida clásica');
assert(R.validate({...R.newGame(7), savedAt: 1, seedCode: 'X'}), 'y con la del rescate');

// Partidas guardadas: la más reciente primero; sin fecha, empate a favor del rescate.
const rescue = {week: 12, savedAt: 1000};
assert.deepEqual(savedGames(savedClassic, rescue).map(g => g.game + ':' + g.title + ':' + g.where), ['classic:La herencia:enero de 2022', 'rescue:El rescate:semana 12']);
assert.deepEqual(savedGames({...savedClassic, savedAt: 10}, rescue).map(g => g.game), ['rescue', 'classic']);
assert.deepEqual(savedGames({...savedClassic, savedAt: undefined}, {week: 3}).map(g => g.game), ['rescue', 'classic'], 'guardados antiguos');
assert.equal(savedGames(classic(1, {cash: 500, rivals: true}))[0].title, 'Maqueta');
assert.deepEqual(savedGames(), []);
assert.equal(overwrittenBy('herencia', savedClassic, rescue), 'La herencia');
assert.equal(overwrittenBy('maqueta', savedClassic, null), 'La herencia', 'la Maqueta comparte guardado con la campaña');
assert.equal(overwrittenBy('rescate', savedClassic, null), null, 'el rescate no sustituye la clásica');
assert.equal(overwrittenBy('rescate', null, rescue), 'El rescate');

// HTML: tres arranques, reglas solo en la Maqueta, confirmación en línea y texto escapado.
assert.deepEqual(STARTS.map(s => s.id), ['herencia', 'rescate', 'maqueta']);
const screen = newGameHTML({seed: '"><b>'});
assert.equal(screen.match(/data-action="np-pick"/g).length, 3);
assert(/class="np-rules" hidden/.test(screen) && !screen.includes('"><b>'), 'reglas ocultas y semilla escapada');
assert(!/class="np-rules" hidden/.test(newGameHTML({pick: 'maqueta'})));
assert(newGameHTML({confirm: 'Maqueta'}).includes('Hay una partida guardada de Maqueta. ¿Empezar otra?'));
assert(newGameHTML({pick: 'maqueta', cash: 1500}).includes('data-action="np-cash" data-id="1500" aria-pressed="true">1.500 M€'));
const menu = menuHTML(savedClassic, '', rescue);
assert.equal(menu.split('<h2 id="menu-departures-title">¿Adónde vamos?</h2>').length - 1, 1, 'ancla del publicador');
assert.equal(menu.match(/data-action="new-game"[^>]*autofocus/g).length, 1, 'un único «Nueva partida» con el foco');
assert(menu.includes('data-action="continue" data-game="classic"') && menu.includes('<time>enero de 2022</time>'));
assert(menu.includes('data-action="continue-other" data-game="rescue"') && menu.includes('El rescate · semana 12'));
assert(!/data-action="(begin|free-setup|rescue-new|rescue-continue)"/.test(menuHTML(savedClassic, '', rescue)));
assert(!menuHTML().includes('data-action="continue'), 'sin guardado no hay Continuar');
console.log('✓ Nueva partida: semilla repetible (72022 = campaña de siempre), tres arranques, reglas de la Maqueta, savedAt, Continuar por fecha y portada con un solo botón.');
