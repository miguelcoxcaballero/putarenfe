// Avería en ruta: el tren se queda parado en el mapa y el jugador elige qué hacer con los viajeros.
import assert from 'node:assert/strict';
import * as E from './dist/engine.js';
import * as O from './dist/operations.js';
import {MODEL, MODELS} from './dist/data.js';
import {MESSAGES} from './dist/narration-data.js';
import {brandLogo, brandName} from './dist/brands.js';

const bus = MODELS.find(m => m.road);
assert(bus && bus.family === 'Bus' && MODEL.bus === bus, 'hay un autobús en el catálogo');

const decideAll = s => { for (let d; (d = E.pendingDecision(s));) { const i = d.choices.findIndex(c => !c.disabled && s.cash >= -(c.effects?.cash || 0)); E.decide(s, d.id, Math.max(0, i)); } };
function fresh() { const s = E.initialState(72023); s.started = true; s.cash = 500; decideAll(s); s.cash = 500; return s; }
function dayWithBreakdown(s) {
  O.ensureOps(s);
  O.startDay(s);
  const op = s.ops;
  op.incidents = op.incidents.filter(x => x.type !== 'breakdown');
  const x = O.injectIncident(s, op.minute + 30);
  assert(x, 'hay un tren al que averiar');
  x.id = 'inc-test'; // no es el tutorial: se decide qué hacer con los viajeros
  O.servicePlan(s, true);
  return x;
}

// 1. El autobús no sirve para abrir servicios: no circula por vía.
{
  const s = fresh();
  for (const r of s.routes) assert.equal(E.canRun(s, r, bus), false, 'un autobús nunca cubre una relación');
}

// 2. Sin autobuses propios no se pueden mandar; Autocares Meseta siempre acepta el encargo (y lo cobra).
{
  const s = fresh();
  const x = dayWithBreakdown(s);
  s.ops.minute = x.at + 1;
  const options = O.responsesFor(s, x).map(([k]) => k);
  assert.deepEqual(options, ['abandon', 'ownbus', 'aume']);
  assert.throws(() => O.resolveIncident(s, x.trip, 'team'), /viajeros/);
  assert.throws(() => O.resolveIncident(s, x.trip, 'ownbus'), /autobús/i);
  const cash = s.cash;
  O.resolveIncident(s, x.trip, 'aume');
  assert.equal(s.ops.choices[x.trip], 'aume');
  assert(s.cash < cash, 'Íñigo cobra');
  assert.equal(MESSAGES['breakdown-aume'].person, 'rival');
}

// 3. El tren averiado se queda quieto mientras dura la avería y luego sigue con el retraso.
{
  const s = fresh();
  const x = dayWithBreakdown(s);
  const trip = O.servicePlan(s).find(t => t.id === x.target);
  assert(trip.broken && trip.broken.at === x.at && trip.broken.until > x.at, 'el viaje sabe cuándo se para');
  const a = O.tripPosition(trip, x.at + 1), b = O.tripPosition(trip, trip.broken.until - 1), c = O.tripPosition(trip, trip.broken.until + 20);
  assert(a && b && c);
  assert.equal(a.lon, b.lon); assert.equal(a.lat, b.lat);
  assert(Math.hypot(c.lon - a.lon, c.lat - a.lat) > 0, 'después de la avería vuelve a moverse');
  assert.equal(a.broken, true); assert.equal(c.broken, false);
}

// 4. Con autobuses en la flota, mandarlos protege a los viajeros; dejarlos tirados los enfada.
{
  const s = fresh();
  const quote = E.purchaseQuote(s, 'bus', 2);
  assert.equal(quote.lead, 1, 'los autobuses se entregan en un mes');
  s.fleet.push({id: 'fbus', model: 'bus', qty: 2, condition: 100, born: 2022, origin: 'Compra en Trenes Pop'});
  assert(O.hasBuses(s), 'los autobuses cuentan en la flota');
  const x = dayWithBreakdown(s);
  s.ops.minute = x.at + 1;
  O.resolveIncident(s, x.trip, 'ownbus');
  assert.equal(s.ops.choices[x.trip], 'ownbus');

  const t = fresh();
  const y = dayWithBreakdown(t);
  t.ops.minute = y.at + 1;
  O.resolveIncident(t, y.trip, 'abandon');
  t.ops.minute = O.dayBounds(O.servicePlan(t)).last + 1;
  const before = t.satisfaction;
  O.endDay(t);
  assert(t.satisfaction < before, 'dejar a los viajeros tirados pasa factura');
}

// 5. El tutorial conserva sus tres respuestas clásicas (su diálogo grabado las describe).
{
  const s = fresh();
  O.ensureOps(s); O.startDay(s);
  const x = O.injectIncident(s, s.ops.minute + 30);
  assert.deepEqual(O.responsesFor(s, x).map(([k]) => k), ['team', 'bus', 'wait']);
}

// 6. Autocares Meseta tiene marca propia.
assert.equal(brandName('Autocares Meseta'), 'AUME');
assert(/aume/i.test(brandLogo('AUME')));
console.log('✓ Avería: tren parado en el mapa, viajeros tirados, autobuses propios o Autocares Meseta, y tutorial intacto.');
