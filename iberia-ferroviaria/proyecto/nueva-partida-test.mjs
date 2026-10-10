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

// Una compañía activa; el rescate anterior se ofrece solo para recuperar.
const rescue = {week: 12, savedAt: 1000};
assert.deepEqual(savedGames(savedClassic, rescue).map(g => g.game + ':' + g.title + ':' + g.where), ['classic:Tenfe:enero de 2022', 'rescue:Rescate anterior:semana 12']);
assert.deepEqual(savedGames({...savedClassic, savedAt: 10}, rescue).map(g => g.game), ['classic', 'rescue'], 'Continuar conserva la compañía activa, aunque el original sea más reciente');
assert.equal(savedGames(classic(1, {cash: 500, rivals: true}))[0].title, 'Tenfe');
assert.deepEqual(savedGames(), []);
assert.equal(overwrittenBy('tenfe', savedClassic), 'Tenfe');
assert.equal(overwrittenBy('tenfe', null, rescue), null, 'Nueva partida no elimina el rescate original');

// Un solo arranque, dificultad y guía; confirmación en línea y texto escapado.
assert.deepEqual(STARTS.map(s => s.id), ['tenfe']);
const screen = newGameHTML({seed: '"><b>'});
assert(!screen.includes('data-action="np-pick"'));
assert(!screen.includes('"><b>'), 'semilla escapada');
assert.equal(screen.match(/data-action="np-difficulty"/g).length, 2);
assert(screen.includes('id="npGuide"'));
assert(newGameHTML({confirm:'Tenfe'}).includes('Hay una partida de Tenfe guardada. ¿Empezar otra?'));
assert(newGameHTML({difficulty:'relajada'}).includes('data-id="relajada" class="on" aria-pressed="true"'));
const menu = menuHTML(savedClassic, '', rescue);
assert.equal(menu.split('<h2 id="menu-departures-title">¿Adónde vamos?</h2>').length - 1, 1, 'ancla del publicador');
assert.equal(menu.match(/data-action="new-game"[^>]*autofocus/g).length, 1, 'un único «Nueva partida» con el foco');
assert(menu.includes('data-action="continue" data-game="classic"') && menu.includes('<time>enero de 2022</time>'));
assert(menu.includes('data-action="legacy-preview"') && menu.includes('Rescate anterior · semana 12'));
assert(!/data-action="(begin|free-setup|rescue-new|rescue-continue|continue-other)"/.test(menu));
assert(!menuHTML().includes('data-action="continue'), 'sin guardado no hay Continuar');
console.log('✓ Nueva partida única: semilla repetible, dificultad, guía, confirmación y recuperación del original.');
