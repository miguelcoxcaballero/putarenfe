// «Lo que se dice, pasa»: los diálogos solo se juegan cuando lo que dicen es verdad y cada respuesta hace lo que promete.
// Uso: node verdad-test.mjs (10 secciones)
import assert from 'node:assert/strict';
import * as E from './dist/engine.js';
import * as O from './dist/operations.js';
import * as T from './dist/tycoon.js';
import * as V from './dist/verdad.js';
import * as I from './dist/infra.js';
import {DECISIONS, EVENTS} from './dist/story.js';
import {ENCOUNTERS, ENCOUNTER, EMOTIONS, RETIRED} from './dist/encounters.js';
import {MODEL} from './dist/data.js';

const ok = [];
const fresh = (seed = 72022) => { const s = E.initialState(seed); s.started = true; O.ensureOps(s); return s; };
const playable = (s, c) => !c.disabled && (!c.cost || c.deferred || s.cash >= c.cost);
const decideAll = (s, pick = 0) => { for (let d, n = 0; (d = E.pendingDecision(s)) && n < 20; n++) { const list = d.choices.map((c, i) => [c, i]).filter(([c]) => playable(s, c)); E.decide(s, d.id, list[pick % list.length][1]); } };
const month = (s, pick = 0) => { decideAll(s, pick); assert(O.skipMonth(s), 'el mes avanza'); };
/** Deja pendiente una decisión con fecha concreta (las anteriores, resueltas). */
function dated(s, id) {
  const d = DECISIONS.find(x => x.id === id);
  s.decided = DECISIONS.filter(x => x.id !== id).map(x => x.id); s.event = null; s.tycoon.encounter = null;
  s.month = Math.max(s.month, d.at); if (d.when === 'summer') while (![5, 6, 7].includes(s.month % 12)) s.month++;
  if (d.after) I.applyHistoric(s, '2024-01-01');
  const view = E.pendingDecision(s); assert.equal(view?.id, id, 'decisión preparada: ' + id); return view;
}
/** Deja pendiente un imprevisto, fijado como en el juego (instancia y tirada al aparecer). */
function event(s, id) { const e = EVENTS.find(x => x.id === id); s.decided = DECISIONS.map(x => x.id); s.tycoon.encounter = null; s.event = id; V.freezeEvent(s, e); return E.pendingDecision(s); }
const choiceIndex = (d, label) => { const i = d.choices.findIndex(c => c.label === label); assert(i >= 0, 'opción ' + label); return i; };
const fareOf = (s, r) => { const m = E.metrics(s, r); return m.passengers ? m.revenue * 1e6 / m.passengers : 0; };
const route = (s, id) => s.routes.find(r => r.id === id);
/** Texto de opción limpio: sin huecos de cálculo, signos tipográficos (−3, no -3) y «1 línea», no «1 líneas». */
const cleanText = x => typeof x === 'string' && x.length > 0 && !/undefined|NaN|null|(^|[\s(])-\d|\b1 (líneas|ciudades)\b/.test(x);
/** Prepara un encuentro verdadero de ese personaje y conflicto (con el ánimo que sea cierto ahora). */
function stageAny(s, person, topic) {
  s.decided = DECISIONS.map(d => d.id); s.event = null;
  for (const mood of EMOTIONS) if (E.stageScene(s, `scene-${person}-${mood}-${topic}`)) return E.pendingDecision(s);
  return null;
}

// 1. Apuestas: se deciden una vez, con el estado y una tirada fijada al aparecer; no se pueden repetir.
{
  const s = fresh(); s.month = 20;
  const d = event(s, 'audit'), g = d.choices.findIndex(c => c.gamble), frozen = s.verdad.frozen;
  assert(Number.isFinite(frozen.draw) && frozen.draw >= 0 && frozen.draw < 1, 'la tirada se fija al aparecer');
  // La probabilidad sale de las cuentas: con pérdidas y deuda, peor.
  const solid = fresh(); solid.month = 20; event(solid, 'audit');
  const weak = fresh(); weak.month = 20; weak.debt = 1400; weak.history = Array.from({length: 12}, (_, i) => ({month: i + 8, net: -5}));
  event(weak, 'audit');
  assert(weak.verdad.frozen.chance < solid.verdad.frozen.chance, 'auditoría: unas cuentas peores dan menos probabilidad');
  assert(/% de que salga bien/.test(d.choices[g].detail) && d.instance, 'la probabilidad se ve antes de elegir');
  const a = structuredClone(s), b = structuredClone(s), seed = a.seed;
  assert.equal(E.decide(a, 'audit', g), E.decide(b, 'audit', g), 'mismo estado, mismo resultado');
  assert.equal(a.seed, seed, 'decidir no vuelve a tirar los dados');
  // Sin caja: la multa se cobra igual (crédito puente al cerrar el mes) y no hay excepción que permita repetir.
  const broke = structuredClone(s); broke.cash = 5; broke.verdad.frozen.draw = .999;
  assert.equal(E.decide(broke, 'audit', g), false); assert.equal(broke.cash, 5 - 20, 'la multa se cobra aunque deje la caja en negativo');
  // Un gasto que no se puede pagar falla antes de tocar nada: ni dinero, ni semilla, ni tirada.
  const poor = structuredClone(s); poor.cash = 1; const before = JSON.stringify(poor);
  assert.throws(() => E.decide(poor, 'audit', 0)); assert.equal(JSON.stringify(poor), before, 'un fallo no cambia el estado');
  // Visita de Estado: la probabilidad es la puntualidad del AVE elegido, fijada al aparecer.
  const r = fresh(); r.month = 10; const royal = event(r, 'royal'), fr = r.verdad.frozen, line = route(r, fr.route);
  assert(line?.active && E.product(r, line) === 'AVE');
  assert(Math.abs(fr.chance - E.metrics(r, line).punctuality / 100 * (.8 + .2 * r.fleet.find(f => f.id === line.fleet).condition / 100)) < 1e-9);
  const ra = structuredClone(r), rb = structuredClone(r), rg = royal.choices.findIndex(c => c.gamble);
  assert.equal(E.decide(ra, 'royal', rg), E.decide(rb, 'royal', rg));
  ok.push('Apuestas: auditoría y visita según cuentas y puntualidad, tirada fija al aparecer, sin repetición y sin excepción tras tirar.');
}

// 2. Sin bloqueos: toda decisión e imprevisto ofrece al menos una opción jugable, con o sin caja y con la flota inútil.
{
  let checked = 0;
  for (const variant of ['rich', 'broke', 'negative', 'worn']) {
    const setup = s => { if (variant === 'broke') s.cash = 0; if (variant === 'negative') s.cash = -40; if (variant === 'worn') { s.cash = 2; for (const f of s.fleet) f.condition = 20; } };
    for (const d of DECISIONS) {
      const s = fresh(); setup(s); const view = dated(s, d.id);
      const i = view.choices.findIndex(c => playable(s, c)); assert(i >= 0, `${d.id} (${variant}) tiene salida`);
      for (const c of view.choices) assert(cleanText(c.detail) && (!c.disabled || cleanText(c.reason)), `texto de ${d.id}: ${c.detail}`);
      E.decide(s, d.id, i); assert(E.validateSave(structuredClone(s))); checked++;
    }
    for (const e of EVENTS) {
      const s = fresh(); s.month = 40; setup(s); const view = event(s, e.id);
      const i = view.choices.findIndex(c => playable(s, c)); assert(i >= 0, `${e.id} (${variant}) tiene salida`);
      for (const c of view.choices) assert(cleanText(c.detail) && (!c.disabled || cleanText(c.reason)), `texto de ${e.id}: ${c.detail}`);
      E.decide(s, e.id, i); assert(E.validateSave(structuredClone(s))); checked++;
    }
  }
  // Hacienda congela fondos: nunca pide caja por adelantado; la retención se ve en las transferencias del año.
  const s = fresh(); s.cash = 0; s.month = 30; const view = event(s, 'freeze');
  assert(view.choices.every(c => !c.cost && !c.disabled), 'ninguna opción exige pagar ya');
  const before = E.balance(s).subsidy; E.decide(s, 'freeze', 0);
  assert(Math.abs(E.balance(s).subsidy - before * .7) < 1e-6, 'transferencias −30 % de verdad');
  for (let k = 0; k < 12; k++) month(s); assert(Math.abs(E.balance(s).subsidy - before) / before < .25, 'la retención termina al año');
  // Si no hay caja para nada, la opción más barata se paga a plazos y la partida sigue.
  const t = fresh(); t.cash = 3; const s106 = dated(t, 's106'), i = s106.choices.findIndex(c => c.deferred);
  assert(i >= 0 && playable(t, s106.choices[i]) && /cuotas/.test(s106.choices[i].detail));
  E.decide(t, 's106', i); assert.equal(t.cash, 3, 'nada se paga hoy'); assert.equal(t.verdad.dues.length, 1);
  const cash = t.cash; month(t); assert(t.cash < cash + E.balance(t).net + 1e-6, 'la cuota se cobra al cerrar el mes');
  ok.push(`Sin bloqueos: ${checked} decisiones e imprevistos con caja, sin caja, en negativo y con la flota en el taller tienen salida; la congelación no pide caja y lo impagable va a plazos.`);
}

// 3. Peticiones: se cobran tras tres cierres con el servicio pedido; deshacerlo antes pierde el premio. Sin «trenes llenos» falsos.
{
  const s = fresh(); s.requests = [];
  const r = s.routes.find(r => r.active && r.frequency < E.maxFrequency(r) && E.available(s, s.fleet.find(f => f.id === r.fleet), r.id) >= E.requiredUnits(s, r, MODEL[s.fleet.find(f => f.id === r.fleet).model], r.frequency + 1));
  s.requests.push({type: 'more', id: 'q900', city: r.ends[1], route: r.id, until: s.month + 4, target: r.frequency + 1, reward: 10});
  assert.equal(E.checkRequests(s).started.length, 0);
  E.configureRoute(s, r.id, r.fleet, r.frequency + 1, r.fare);
  const paid = s.stats.requests, cash = s.cash, started = E.checkRequests(s);
  assert.equal(started.started.length, 1); assert.equal(s.cash, cash, 'cumplir no paga en el acto');
  for (let k = 1; k <= 2; k++) { month(s); assert.equal(s.stats.requests, paid, 'aún no se cobra en el cierre ' + k); assert.equal(s.requests.find(q => q.id === 'q900').kept, k); }
  month(s); assert.equal(s.stats.requests, paid + 1, 'se cobra al tercer cierre'); assert(!s.requests.some(q => q.id === 'q900'));
  assert(s.log.some(l => l.title === 'Petición cumplida'));
  const b = fresh(); b.requests = []; const rb = route(b, r.id);
  b.requests.push({type: 'more', id: 'q901', city: rb.ends[1], route: rb.id, until: b.month + 4, target: rb.frequency + 1, reward: 10});
  E.configureRoute(b, rb.id, rb.fleet, rb.frequency + 1, rb.fare); E.checkRequests(b); month(b);
  E.configureRoute(b, rb.id, rb.fleet, rb.frequency - 1, rb.fare);
  assert.equal(E.checkRequests(b).broken.length, 1, 'quitar el tren pedido antes de cobrar cancela la petición');
  assert.equal(b.stats.requests, 0); assert(!b.requests.some(q => q.id === 'q901'));
  const app = (await import('node:fs')).readFileSync(new URL('./dist/app.js', import.meta.url), 'utf8');
  assert(!app.includes("<span class=\"flag\">Petición</span><span><i class=\"crowd\">▮▮▮</i>Trenes llenos</span>"), 'la tarjeta de petición ya no dice «trenes llenos» sin mirar');
  assert(/Ocupación \$\{n\(mt\.occupancy \* 100\)\} %/.test(app), 'la tarjeta enseña la ocupación real');
  ok.push('Peticiones: arrancan al cumplirse, se cobran al tercer cierre mensual y se pierden si se deshacen; la tarjeta enseña la ocupación real.');
}

// 4. Primer encargo: cuenta los viajeros por encima de lo que llevaría la red firmada; no se cumple solo en un mes.
{
  const s = fresh(); decideAll(s); const q = s.tycoon.contracts[0];
  assert.equal(q.id, 'mission-0'); assert.equal(q.goal, 'passengers'); T.accept(s, q.id, 'public');
  month(s);
  assert.equal(q.status, 'active', 'no se gana al primer cierre');
  assert(T.missionValue(s, q) < q.target * .05, 'sin cambios, la red firmada no suma viajeros nuevos: ' + T.missionValue(s, q));
  const grow = structuredClone(s), gq = grow.tycoon.contracts[0];
  for (const r of grow.routes.filter(r => r.active)) { const f = grow.fleet.find(f => f.id === r.fleet); for (let k = Math.min(E.maxFrequency(r), r.frequency + 3); k > r.frequency; k--) try { E.configureRoute(grow, r.id, f.id, k, r.fare); break; } catch {} }
  const v0 = T.missionValue(grow, gq); month(grow);
  assert(T.missionValue(grow, gq) > v0, 'más oferta sí suma viajeros por encima de la previsión');
  const c = fresh(); decideAll(c); const cq = c.tycoon.contracts[0]; T.accept(c, cq.id, 'commercial'); assert.equal(cq.target, 250000 * 1.25, 'la rama comercial exige un 25 % más');
  ok.push('Primer encargo: la previsión orgánica de la red firmada se descuenta mes a mes; crecer de verdad cuenta.');
}

// 5. Hitos con fecha: solo después de su obra, y la historia se aplica el día real (también al cambiar de mes).
{
  const KEYS = {burgos: 'vdb-bur-av@2022-07-21', murcia: 'elx-mur-av@2022-12-20', pajares: 'leo-pol@2023-11-29', extremadura: 'pla-cac@2023-12-14'};
  // Jornada a jornada: Burgos sale el 21 de julio, no el 1.
  const s = fresh(); s.decided = DECISIONS.filter(d => d.at < 6).map(d => d.id); s.month = 5; s.ops.day = 30;
  s.ops.phase = 'review'; O.nextDay(s);
  assert.equal(s.month, 6); assert.equal(s.ops.day, 1); assert(!s.infra.h.includes(KEYS.burgos), 'el 1 de julio Burgos aún no ha abierto');
  assert.notEqual(E.pendingDecision(s)?.id, 'burgos');
  let opened = null;
  for (let day = 1; day < 31; day++) {
    s.ops.phase = 'review'; O.nextDay(s);
    if (E.pendingDecision(s)?.id === 'burgos') { opened = E.gameDate(s); break; }
  }
  assert.equal(opened, '2022-07-21', 'la decisión de Burgos sale el día que abre la línea');
  // Delegar desde el día 17 no adelanta la historia del mes siguiente.
  const d = fresh(); d.month = 5; d.ops.day = 17; decideAll(d); O.skipMonth(d);
  assert.equal(d.ops.day, 1); assert(!d.infra.h.includes(KEYS.burgos), 'delegar junio no abre Burgos el 1 de julio');
  // Y en cualquier partida delegada, cada hito aparece solo con su obra hecha.
  for (const seed of [1, 2, 3, 4, 5]) {
    const g = fresh(seed);
    for (let k = 0; k < 30; k++) {
      for (let p, n = 0; (p = E.pendingDecision(g)) && n < 20; n++) {
        if (KEYS[p.id]) assert(g.infra.h.includes(KEYS[p.id]), `${p.id} antes de su obra (semilla ${seed}, mes ${g.month})`);
        const list = p.choices.map((c, i) => [c, i]).filter(([c]) => playable(g, c)); E.decide(g, p.id, list[(k + seed) % list.length][1]);
      }
      O.skipMonth(g);
    }
    for (const id of Object.keys(KEYS)) assert(g.decided.includes(id), `${id} se decide (semilla ${seed})`);
  }
  ok.push('Hitos con fecha: Burgos, Murcia, Pajares y Extremadura salen tras su obra; la historia se aplica en su día real, también al cambiar de mes o al delegar.');
}

// 6. Lo que dice cada opción, pasa, se mide y se ve.
{
  // Huelga: servicios mínimos reales un mes.
  const s = fresh(); s.month = 20; const before = O.servicePlan(s).length, ave = s.routes.find(r => r.active && E.product(s, r) === 'AVE');
  const capBefore = E.metrics(s, ave).passengers, strike = event(s, 'strike');
  E.decide(s, 'strike', choiceIndex(strike, 'Aguantar el pulso'));
  assert(O.servicePlan(s).length < before * .8, 'servicios mínimos: menos circulaciones en el día');
  assert(E.metrics(s, ave).passengers < capBefore * .75, 'el AVE lleva la mitad de plazas');
  assert(V.ongoing(s).some(x => /Servicios mínimos/.test(x.label)), 'se ve en curso');
  month(s); const plain = structuredClone(s); plain.verdad.mods = [];
  assert.equal(O.servicePlan(s).length, O.servicePlan(plain).length, 'al mes siguiente vuelve el servicio completo');
  // Autobús a cinco euros: «Bajar tarifas» baja tarifas de verdad durante 6 meses y se restauran solas.
  const b = fresh(); b.month = 30; const short = b.routes.find(r => r.active && r.km < 400), far = b.routes.find(r => r.active && r.km >= 400);
  const fare = fareOf(b, short), farFare = fareOf(b, far), bus = event(b, 'busprice');
  assert(/Tarifas −15 %/.test(bus.choices[0].detail) && bus.choices[0].estimate < 0, 'la rebaja dice lo que cuesta');
  E.decide(b, 'busprice', choiceIndex(bus, 'Bajar tarifas un tiempo'));
  assert(Math.abs(fareOf(b, short) / fare - .85) < .02, 'tarifa media −15 % en las líneas cortas');
  assert(Math.abs(fareOf(b, far) / farFare - 1) < .02, 'las largas no cambian');
  assert(b.flags.buswar > b.month && b.flags.busfive > b.month, 'el autobús rebaja precios en cualquier caso');
  for (let k = 0; k < 6; k++) month(b);
  assert(Math.abs(fareOf(b, short) / fare - 1) < .05, 'a los seis meses la tarifa vuelve sola');
  // Calor: «Reducir la oferta» recorta trenes en el sur y protege la puntualidad.
  const c = fresh(); const climate = dated(c, 'climate'), hotRoute = c.routes.find(r => r.active && r.via.includes('cor'));
  const punct = E.metrics(c, hotRoute).punctuality, trips = O.servicePlan(c).filter(t => t.route === hotRoute.id).length;
  E.decide(c, 'climate', choiceIndex(climate, 'Reducir la oferta'));
  assert(O.servicePlan(c).filter(t => t.route === hotRoute.id).length < trips, 'menos trenes por Córdoba');
  assert(E.metrics(c, hotRoute).punctuality >= punct, 'la puntualidad no empeora');
  // Descuentos del Gobierno: reforzar añade salidas donde hay trenes; sin trenes, opción desactivada con motivo.
  const a = fresh(); const disc = dated(a, 'discounts'), alvia = a.routes.filter(r => r.active && E.product(a, r) === 'Alvia').map(r => [r.id, r.frequency]);
  E.decide(a, 'discounts', choiceIndex(disc, 'Reforzar los Alvia'));
  assert(alvia.some(([id, f]) => route(a, id).frequency === f + 1), '+1 salida en algún Alvia');
  assert(a.flags.passes > a.month);
  const n = fresh(); for (const f of n.fleet) if (MODEL[f.model].family === 'Alvia') f.condition = 20;
  const none = dated(n, 'discounts'), boost = none.choices[choiceIndex(none, 'Reforzar los Alvia')];
  assert(boost.disabled && /Alvia/.test(boost.reason), 'sin Alvia libres, desactivada con su motivo');
  assert(playable(n, none.choices[choiceIndex(none, 'Ir tirando')]));
  // Wifi: la opción enciende la directriz y su efecto se ve en la calidad.
  const w = fresh(); w.month = 30; const r0 = w.routes.find(r => r.active), q0 = E.metrics(w, r0).punctuality, wifi = event(w, 'wifi');
  E.decide(w, 'wifi', 0); assert(w.tycoon.policies.includes('wifi')); assert(E.metrics(w, r0).punctuality > q0);
  assert.equal(EVENTS.find(e => e.id === 'wifi').when, 'wifiOff'); assert(!V.eventEligible(w, EVENTS.find(e => e.id === 'wifi')), 'con wifi ya no sale');
  // Luz: el seguro cuesta menos que la subida que evita, y la subida se paga de verdad.
  const e1 = fresh(); const energy = dated(e1, 'energy'), hedge = energy.choices[0], none2 = energy.choices[1];
  assert(hedge.cost > 0 && -none2.estimate > hedge.cost, '«las dos duelen, y la segunda, más»');
  const e2 = structuredClone(e1), r1 = e1.routes.find(r => r.active);
  E.decide(e1, 'energy', 0); E.decide(e2, 'energy', 1);
  assert(E.metrics(e2, r1).cost > E.metrics(e1, r1).cost, 'sin seguro, la energía cuesta más');
  // Ola de calor: limitar velocidades alarga los viajes en el sur.
  const h = fresh(); h.month = 30; const south = h.routes.find(r => r.active && r.via.includes('cor')), tt = E.metrics(h, south).trainTime;
  const heat = event(h, 'heatwave'); E.decide(h, 'heatwave', choiceIndex(heat, 'Limitar velocidades'));
  assert(E.metrics(h, south).trainTime > tt * 1.1, 'trayecto más largo');
  assert(O.servicePlan(h).filter(t => t.route === south.id && !t.bus).every(t => t.delay > 0), 'los trenes del día llegan más tarde');
  // Vacas: vallar reduce de verdad los arrollamientos.
  const count = fencedOn => { let total = 0; for (const seed of [11, 12, 13, 14]) { const s2 = fresh(seed); decideAll(s2); if (fencedOn) s2.flags.fenced = 1e6; for (let day = 0; day < 40; day++) { s2.ops.phase = 'planning'; O.startDay(s2); total += s2.ops.incidents.filter(x => x.type === 'trespass').length; s2.ops.minute = O.dayBounds(O.servicePlan(s2)).last; O.endDay(s2); s2.ops.phase = 'planning'; } } return total; };
  const open = count(false), fenced = count(true);
  assert(fenced < open, `menos arrollamientos con vallas: ${fenced} frente a ${open}`);
  // Promesas que crean algo concreto o un compromiso con plazo y castigo.
  const x = fresh(); x.cash = 400; const ex = dated(x, 'extremadura'), cash = x.cash;
  E.decide(x, 'extremadura', choiceIndex(ex, 'Plan Extremadura'));
  assert(['mad-tal', 'tal-pla'].every(id => x.projects.some(p => !p.done && p.type === 'tramo' && p.work === 'electrify' && p.target === id)), 'obras de catenaria en marcha');
  assert.equal(cash - x.cash, 20, 'Tenfe paga 20 M€; el resto, el Ministerio');
  const te = fresh(); te.month = 40; const teruel = event(te, 'teruel'); E.decide(te, 'teruel', choiceIndex(teruel, 'Prometer catenaria'));
  const promise = te.verdad.promises.find(p => p.kind === 'electrify'); assert(promise && promise.due === te.month + 12);
  const kept = structuredClone(te); kept.cash = 500; E.startWork(kept, 'electrify', 'zar-ter'); month(kept); assert.equal(kept.verdad.promises.find(p => p.kind === 'electrify').status, 'kept');
  const terr = te.tycoon.groups.territory; for (let k = 0; k < 13; k++) month(te);
  assert.equal(te.verdad.promises.find(p => p.kind === 'electrify').status, 'broken', 'sin obra en 12 meses, promesa rota');
  assert(te.log.some(l => l.title === 'Compromiso incumplido'));
  const as = fresh(); const pj = dated(as, 'pajares'), lines = as.routes.filter(r => r.ends.some(c => ['gij', 'ovi', 'avl'].includes(c))).map(r => [r.id, r.active, r.frequency]);
  E.decide(as, 'pajares', choiceIndex(pj, 'Lanzar los Alvia a Asturias'));
  const launched = lines.some(([id, active, f]) => route(as, id).active && (!active || route(as, id).frequency > f));
  assert(launched || as.verdad.promises.some(p => p.kind === 'asturias' && !p.status), 'Alvia a Asturias en servicio, o compromiso con plazo');
  ok.push('Opciones con efecto: servicios mínimos, rebaja de tarifas que se restaura, recorte de verano sin perder puntualidad, refuerzo de Alvia o motivo, wifi, seguro de la luz, limitación de velocidad, vallas y promesas con obra o plazo.');
}

// 7. Encuentros: efectos concretos sobre la instancia, re-validación y cuerpos retirados.
{
  // Revisión: solo el tren señalado mejora (no toda la flota).
  const s = fresh(); s.month = 10; const lot = s.fleet.find(f => s.routes.some(r => r.active && r.fleet === f.id)); lot.condition = 35;
  const d = stageAny(s, 'workshop', 2) || stageAny(s, 'treasury', 2) || stageAny(s, 'minister', 2);
  assert(d && d.instance, 'encuentro de tren gastado con su instancia visible');
  const others = s.fleet.filter(f => f.id !== lot.id).map(f => [f.id, f.condition]), cash = s.cash, cost = d.choices[0].cost;
  E.decide(s, d.id, 0);
  assert.equal(lot.condition, 60, 'el tren señalado sale del taller');
  assert(others.every(([id, c]) => s.fleet.find(f => f.id === id).condition === c), 'el resto de la flota no cambia');
  assert(Math.abs(cash - cost - s.cash) < 1e-9 && cost > 0);
  // Campaña de descuentos: rebaja real temporal en las líneas en disputa.
  const t = fresh(); t.month = 24; t.flags.buswar = t.month + 6; t.verdad.busWarFrom = t.month;
  const dd = stageAny(t, 'treasury', 1); assert(dd, 'Charo y los descuentos con una guerra de precios en marcha');
  const targets = t.verdad.scene.inst.routes.map(id => route(t, id)), fare = fareOf(t, targets[0]);
  E.decide(t, dd.id, 0);
  assert(Math.abs(fareOf(t, targets[0]) / fare - .85) < .02, 'tarifa −15 %');
  for (let k = 0; k < 3; k++) month(t); assert(Math.abs(fareOf(t, targets[0]) / fare - 1) < .05, 'a los tres meses vuelve');
  // Horas extra: cuestan dinero y cubren el horario un mes.
  const o = fresh(); o.month = 12; o.tycoon.drivers = 10;
  const od = stageAny(o, 'treasury', 0) || stageAny(o, 'rival', 0); assert(od);
  const ocash = o.cash, ocost = od.choices[0].cost; E.decide(o, od.id, 0);
  assert(ocost > 0 && Math.abs(ocash - ocost - o.cash) < 1e-9); assert.equal(T.staffing(o), 1, 'todo el horario con maquinista');
  month(o); assert(T.staffing(o) < 1, 'al mes siguiente vuelve a faltar gente');
  // Re-validación: si el hecho deja de ser cierto antes de enseñarlo, se descarta en silencio.
  const g = fresh(); g.month = 12; g.tycoon.drivers = 10; assert(stageAny(g, 'treasury', 0)); g.tycoon.drivers = 1000;
  assert.equal(E.revalidateScene(g), false); assert.equal(E.pendingDecision(g), null);
  // Un cuerpo forzado sin comprobar no se juega, y los cinco retirados nunca se preparan.
  const f = fresh(); f.tycoon.encounter = 'scene-president-happy-1'; assert.equal(E.revalidateScene(f), false);
  for (const id of RETIRED) { const r = fresh(); r.month = 30; r.tycoon.drivers = 5; assert.equal(E.stageScene(r, id), false, 'retirado: ' + id); }
  assert.equal(RETIRED.size, 5); assert(ENCOUNTERS.filter(x => x.retired).length === 5);
  ok.push('Encuentros: revisión del tren nombrado, rebaja temporal en las líneas en disputa, horas extra con coste real, re-validación y cinco cuerpos retirados.');
}

// 8. Muchas partidas: cada encuentro que se enseña es verdad en ese momento, nunca se repite y respeta los plazos.
{
  const checks = {
    0: (s, d, i) => d.person === 'adif' ? s.projects.filter(p => !p.done && p.type !== 'upgrade').length >= 3 : d.person === 'workshop' ? s.refits.filter(r => !r.done).length >= 2
      : d.person === 'president' ? E.metrics(s, route(s, i.route)).occupancy >= .95 && s.tycoon.drivers - T.driverNeed(s) < 4 : s.tycoon.drivers < T.driverNeed(s),
    1: (s, d, i) => d.person === 'riders' ? s.tycoon.policies.includes('dynamic') : d.person === 'president' ? i.routes.some(id => (E.metrics(s, route(s, id)).rivalShares.lowgo || 0) >= .15)
      : d.person === 'mayor' ? E.metrics(s, route(s, i.route)).occupancy < .4 : (s.flags.buswar > s.month || s.routes.some(r => r.active && T.competition(s, r).some(c => c.war))),
    2: (s, d, i) => i.lot ? s.fleet.find(f => f.id === i.lot).condition < 55 && s.routes.some(r => r.active && r.fleet === i.lot) : !!i.route && route(s, i.route).active && E.metrics(s, route(s, i.route)).punctuality < 85,
    3: (s, d, i) => i.city ? !V.liveMods(s, 'staffed').some(x => x.city === i.city) : !!i.route && (!route(s, i.route).active || route(s, i.route).frequency <= 1),
    4: (s, d, i) => !s.tycoon.tech.includes(i.tech) && s.tycoon.research?.id !== i.tech && T.TECHS[i.tech].requires.every(x => s.tycoon.tech.includes(x)),
  };
  let shown = 0, days = 0;
  const topics = new Set(), people = new Set();
  for (const seed of [1, 2, 3, 72022, 4242, 99]) {
    const s = fresh(seed), seen = new Set();
    let last = -99;
    for (let k = 0; k < 150 && !s.ended; k++) {
      // Situaciones reales distintas: falta de maquinistas, un lote gastado, obras y su arreglo.
      if (k === 20) s.tycoon.drivers = Math.floor(T.driverNeed(s) * .6);
      if (k === 34) T.hire(s, 200);
      if (k === 44) { const f = s.fleet.find(f => s.routes.some(r => r.active && r.fleet === f.id)); f.condition = 37; }
      if (k === 50) { s.cash += 300; for (const id of ['trb-sor', 'zar-ter', 'mad-tal']) try { E.startWork(s, 'electrify', id); } catch {} }
      if (k === 70 && seed % 2) T.setPolicy(s, 'dynamic');
      for (let d, n = 0; (d = E.pendingDecision(s)) && n < 20; n++) {
        if (d.tycoon) {
          const sc = s.verdad.scene, i = sc.inst, F = V.facts(s);
          assert(!RETIRED.has(d.id), 'cuerpo retirado jugado: ' + d.id);
          assert(!seen.has(d.id), 'cuerpo repetido: ' + d.id); seen.add(d.id);
          assert(s.month - last >= V.COOLDOWN.gap, 'dos encuentros demasiado seguidos');
          assert(V.openerTrue(F, d.person, d.mood), `arranque falso: ${d.id} en el mes ${s.month}`);
          assert(V.topicInstance(F, d.person, d.topic), `conflicto falso: ${d.id} en el mes ${s.month}`);
          assert(checks[d.topic](s, d, i), `comprobación independiente del conflicto: ${d.id} · ${i.label}`);
          assert(typeof d.instance === 'string' && d.instance.length > 3 && d.instance.length < 160, 'línea de instancia breve');
          assert(d.choices.every(c => cleanText(c.detail)), 'detalles calculados: ' + d.choices.map(c => c.detail).join(' | '));
          last = s.month; shown++; topics.add(d.topic); people.add(d.person);
        }
        const list = d.choices.map((c, j) => [c, j]).filter(([c]) => playable(s, c));
        assert(list.length, 'siempre hay una opción: ' + d.id);
        E.decide(s, d.id, list[(k + seed + n) % list.length][1]);
      }
      // Algunas jornadas jugadas: incidencias, averías y el cambio de mes día a día.
      if (seed === 1 && k < 14) {
        const m0 = s.month;
        while (s.month === m0 && !E.pendingDecision(s)) { O.startDay(s); s.ops.minute = O.dayBounds(O.servicePlan(s)).last; O.endDay(s); O.nextDay(s); days++; }
        continue;
      }
      if (!E.pendingDecision(s)) O.skipMonth(s);
    }
    assert(E.validateSave(structuredClone(s)), 'partida válida tras ' + s.month + ' meses');
  }
  assert(shown >= 40, 'suficientes encuentros para comprobar: ' + shown);
  assert.equal(topics.size, 5, 'los cinco conflictos aparecen');
  assert(people.size >= 7, 'casi todo el reparto habla: ' + [...people].join(', '));
  ok.push(`Partidas simuladas (6 semillas, ${days} jornadas jugadas): ${shown} encuentros, todos ciertos al enseñarse, sin repetir cuerpo ni retirados, con plazos y una opción siempre jugable.`);
}

// 9. Guardado: el registro se valida y una partida anterior sin él se migra.
{
  const s = fresh(); for (let k = 0; k < 12; k++) month(s);
  assert(E.validateSave(structuredClone(s)));
  const bad = structuredClone(s); bad.verdad.mods.push({kind: 'teleport', until: 99}); assert.throws(() => E.validateSave(bad), /compromisos/);
  const old = structuredClone(s); delete old.verdad; old.tycoon.encounter = 'scene-rival-proud-1';
  const loaded = E.validateSave(old); assert(loaded.verdad && loaded.tycoon.encounter === null, 'un encuentro antiguo sin comprobar no se juega al cargar');
  ok.push('Guardado: registro validado, partidas anteriores migradas y encuentros antiguos sin comprobar descartados.');
}
// 10. Revisión: lo que se cobra se dice, una escena caducada no bloquea el mes y los guardados anteriores se completan.
{
  // La auditoría avisa de todo lo que cuesta salir mal, también la confianza de Hacienda.
  const a = fresh(); a.month = 20; const audit = event(a, 'audit'), g = audit.choices.findIndex(c => c.gamble);
  assert(/Hacienda −8/.test(audit.choices[g].detail)); a.verdad.frozen.draw = .999; const h = a.tycoon.groups.treasury;
  E.decide(a, 'audit', g); assert.equal(a.tycoon.groups.treasury, h - 8, 'la penalización anunciada es la que se aplica');
  // La huelga aguantada dice lo que cuesta a la plantilla.
  const st = fresh(); st.month = 20; const strike = event(st, 'strike'), hold = choiceIndex(strike, 'Aguantar el pulso'), staff = st.tycoon.groups.staff;
  assert(/Plantilla −10/.test(strike.choices[hold].detail)); E.decide(st, 'strike', hold); assert.equal(st.tycoon.groups.staff, staff - 10);
  // Un encuentro que deja de ser verdad no impide cerrar el mes: se descarta y el mes avanza.
  const s = fresh(); s.month = 12; s.decided = DECISIONS.map(d => d.id); s.tycoon.drivers = 10; assert(stageAny(s, 'treasury', 0));
  s.tycoon.drivers = 1000; const m = s.month; assert(E.step(s), 'el cierre no se bloquea'); assert.equal(s.month, m + 1);
  // Partida anterior con un imprevisto pendiente sin fijar: al cargar se fija su instancia y su tirada.
  const old = fresh(); old.month = 30; old.decided = DECISIONS.map(d => d.id); old.event = 'cable'; old.verdad.frozen = null;
  const loaded = E.validateSave(structuredClone(old)); assert.equal(loaded.verdad.frozen?.id, 'cable'); assert(loaded.verdad.frozen.tramo, 'tramo afectado fijado');
  const audit2 = fresh(); audit2.month = 30; audit2.decided = DECISIONS.map(d => d.id); audit2.event = 'audit'; audit2.verdad.frozen = null;
  const l2 = E.validateSave(structuredClone(audit2)); assert(Number.isFinite(l2.verdad.frozen.draw), 'tirada fijada al cargar');
  // Y un primer encargo firmado sin foto de la red la recibe al cargar: no se cumple solo.
  const c = fresh(); decideAll(c); const q = c.tycoon.contracts[0]; T.accept(c, q.id, 'public'); delete q.snap; delete q.organic;
  const lc = E.validateSave(structuredClone(c)), lq = lc.tycoon.contracts[0]; assert(Array.isArray(lq.snap) && lq.organic === 0);
  O.ensureOps(lc); month(lc); assert.equal(lq.status, 'active', 'sin crecer, no se gana');
  // Guardados manipulados: errores claros, nunca una excepción de tipos.
  for (const patch of [v => { v.credit = null; }, v => { v.scene = {id: 'scene-treasury-happy-2', inst: null}; }, v => { v.frozen = {id: 'cable', tramo: 'no-existe'}; }, v => { v.busWarAt = 'x'; }]) {
    const bad = structuredClone(c); patch(bad.verdad); assert.throws(() => E.validateSave(bad), /compromisos/);
  }
  // Dos avisos del taller sobre el mismo tren no generan incidencias duplicadas.
  const w = fresh(); const lot = w.routes.find(r => r.active).fleet;
  V.addMod(w, {kind: 'risk', fleet: lot, value: 1.25, until: w.month + 1}); V.addMod(w, {kind: 'risk', fleet: lot, value: 1.5, until: w.month + 2});
  assert.deepEqual(V.riskyLots(w), [{fleet: lot, value: 1.5}]);
  // Ajustar turnos nunca recorta una línea que una ciudad ha pedido reforzar.
  const r = fresh(); r.month = 12; r.decided = DECISIONS.map(d => d.id); r.tycoon.drivers = 10; r.requests = [];
  for (const x of r.routes.filter(x => x.active)) r.requests.push({type: 'more', id: 'q' + r.nextId++, city: x.ends[1], route: x.id, until: r.month + 4, target: x.frequency + 1, reward: 10});
  const freq = new Map(r.routes.filter(x => x.active).map(x => [x.id, x.frequency])), sc = stageAny(r, 'treasury', 0);
  assert(sc && /sin salidas que recortar/.test(sc.choices[1].detail)); E.decide(r, sc.id, 1);
  assert(r.routes.filter(x => x.active).every(x => x.frequency === freq.get(x.id)), 'las líneas pedidas no pierden salidas');
  // Competir en servicio frente a YaIré vale también en las líneas a las que llega después.
  const y = fresh(); const rossa = dated(y, 'Rossa'); E.decide(y, 'Rossa', choiceIndex(rossa, 'Competir en servicio'));
  y.month = 24; const vlc = route(y, 'madrid-valencia'); assert(T.competition(y, vlc).some(c => c.id === 'rossa'));
  const plainY = structuredClone(y); plainY.verdad.mods = []; assert(E.metrics(y, vlc).punctuality > E.metrics(plainY, vlc).punctuality, '+3 de calidad donde YaIré llega en 2024');
  assert(V.routeEffects(y, vlc.id).some(x => /YaIré/.test(x.label)), 'se ve en la ficha de la línea');
  ok.push('Revisión: penalizaciones anunciadas, escenas caducadas que no bloquean el cierre, guardados anteriores completados y validados, avisos de taller sin duplicar, recortes que respetan las peticiones y la calidad frente a YaIré allí donde compite.');
}
console.log(ok.map(x => '✓ ' + x).join('\n'));
