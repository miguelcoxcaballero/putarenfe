// Red real y compatibilidad: tensión de la catenaria (3 kV y 25 kV), velocidad con gasóleo, tramos reales nuevos
// (Palencia — León y Córdoba — Sevilla convencionales, rampa de Pajares aparte de la variante), nodo de Motilla,
// velocidades de segments.json, migración de partidas guardadas con la red anterior y tramos reales del rescate.
// Uso: node red-test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import * as E from './dist/engine.js';
import * as I from './dist/infra.js';
import {MODEL, MODELS} from './dist/data.js';
import {CORRIDOR} from './dist/rescate-data.js';
import {baseSegments} from './dist/rescate.js';

const ok = [];
const fresh = () => { const s = E.initialState(); s.started = true; return s; };
const decideAll = s => { for (let d; (d = E.pendingDecision(s));) E.decide(s, d.id, 0); };
const route = (s, id) => s.routes.find(r => r.id === id);
const lotOf = (s, model) => s.fleet.find(f => f.model === model && f.qty > 0);
const SEGMENTS = JSON.parse(fs.readFileSync('../investigacion/modo-unico/datos/segments.json', 'utf8'));
const realSeg = (a, b) => Object.values(SEGMENTS).flat().find(x => (x.from === a && x.to === b) || (x.from === b && x.to === a));
const kmTo = ([x, y], [lon, lat]) => Math.hypot((x - lon) * 111.32 * Math.cos(lat * Math.PI / 180), (y - lat) * 110.57);
const passesNear = (id, point, km) => I.tramoGeom(I.TRAMO[id]).pts.some(p => kmTo(p, point) < km);
const fixture = name => JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('./fixtures/' + name, import.meta.url))));

// 1. Cada modelo dice qué tensiones admite.
{
  for (const m of MODELS) assert(Array.isArray(m.voltages) && m.voltages.length && m.voltages.every(v => ['3kv', '25kv'].includes(v)), 'tensiones de ' + m.id);
  for (const id of ['s112', 's103', 'av2030']) assert.deepEqual(MODEL[id].voltages, ['25kv'], id + ': AVE de ancho estándar, solo 25 kV');
  for (const id of ['s100', 's106f', 's120', 's130', 's730', 's106v']) assert.deepEqual([...MODEL[id].voltages].sort(), ['25kv', '3kv'], id + ' es bitensión');
  assert.equal(MODEL.s730.dieselSpeed, 180, 'el S730 va a 180 km/h con gasóleo');
  assert.deepEqual(I.profileOf(MODEL.s112).volts, ['25kv']);
  ok.push('Tensiones por modelo: S103, S112 y AV 2030 solo 25 kV; S100, Avril, S120, S130 y S730 bitensión; S730 a 180 con gasóleo.');
}
// 2. Un tren eléctrico no entra donde la tensión no es la suya.
{
  const s = fresh(), cas = route(s, 'madrid-castellon');
  const p = E.routeCheck(s, cas, MODEL.s112);
  assert(!p.ok, 'el S112 no llega a Castelló');
  assert(p.faults.some(f => f.type === 'tension' && ['sag-vlc', 'sag-cas'].includes(f.tramo)), 'la falta es la tensión del tercer carril de Sagunt');
  const f = p.faults.find(f => f.type === 'tension');
  assert.equal(I.faultText(s, f), `${I.TRAMO[f.tramo].name}: 3 kV, este tren solo admite 25 kV`);
  assert.equal(I.faultText(s, f, true), `${I.TRAMO[f.tramo].name}: 3 kV`);
  assert(E.canRun(s, cas, MODEL.s106f) && E.canRun(s, cas, MODEL.s100), 'los AVE bitensión sí llegan');
  assert(!E.canRun(s, cas, MODEL.s103) && !E.canRun(s, cas, MODEL.av2030));
  const o = E.routeOptions(s, cas);
  assert(o.ave.ok && !I.plan(s, cas.via, I.PROFILES.ave25).ok, 'la vía admite AVE, pero solo bitensión');
  assert.throws(() => E.configureRoute(s, 'madrid-castellon', lotOf(s, 's112').id, 2, 40), /AVE no puede ir por ahí\. Sagunt — València: 3 kV/);
  // Alvia y S730 son bitensión: la tensión no les cambia nada
  for (const m of ['s120', 's130', 's730']) assert(E.canRun(s, cas, MODEL[m]), m + ' a Castelló');
  ok.push('Tensión: S112, S103 y AV 2030 no pasan por los 3 kV de Sagunt («Sagunt — València: 3 kV, este tren solo admite 25 kV»); S100 y Avril sí.');
}
// 3. El híbrido tira de gasóleo a su velocidad donde no hay catenaria (o no es su tensión).
{
  const s = fresh();
  s.infra.t['trb-sor'].v = 250; s.infra.ver++;
  const km = I.TRAMO['trb-sor'].km, way = ['trb', 'sor'];
  assert.equal(I.plan(s, way, I.profileOf(MODEL.s730)).minutes, Math.round(km / (180 * .84) * 60), 'S730 a 180 km/h sin catenaria');
  assert.equal(I.plan(s, way, {...I.profileOf(MODEL.s730), diesel: 0}).minutes, Math.round(km / (I.DIESEL_SPEED * .84) * 60), 'sin dato, 160 km/h');
  const only25 = {fixed: false, electric: false, speed: 250, volts: ['25kv'], diesel: 120}, trb = I.TRAMO['gua-trb'];
  const q = I.plan(s, ['gua', 'trb'], only25);
  assert(q.ok && q.faults.length === 0 && s.infra.t['gua-trb'].e === '3kv', 'un bimodo sin la tensión de la vía va con gasóleo, sin falta');
  assert.equal(q.minutes, Math.round(trb.km / (Math.min(s.infra.t['gua-trb'].v, 120) * .84) * 60));
  ok.push('Híbrido: gasóleo a su velocidad (S730, 180 km/h) sin catenaria o con otra tensión; nunca una falta de tensión.');
}
// 4. La red de enero de 2022 sigue moviendo los ocho servicios con su material.
{
  const s = fresh(), active = s.routes.filter(r => r.active);
  assert.deepEqual(active.map(r => r.id).sort(), ['madrid-alicante', 'madrid-badajoz', 'madrid-barcelona', 'madrid-malaga', 'madrid-pamplona', 'madrid-santander', 'madrid-sevilla', 'madrid-valencia']);
  for (const r of active) assert(E.canRun(s, r, MODEL[s.fleet.find(f => f.id === r.fleet).model]), r.id);
  assert(E.validateSave(JSON.parse(JSON.stringify(s))).infra.rev === I.NET_REVISION);
  ok.push('Los ocho servicios de enero de 2022 siguen siendo posibles con su tren.');
}
// 5. Tramos reales nuevos, con su trazado por las estaciones intermedias.
{
  const want = {'pal-leo': ['pal', 'leo', 155, [[-5.0285, 42.3712]]], 'cor-sev': ['cor', 'sev', 155, [[-5.5331, 37.6607]]], 'leo-pol-rampa': ['leo', 'pol', 115, [[-5.703, 42.985], [-5.79, 43.06]]]};
  for (const [id, [a, b, speed, points]] of Object.entries(want)) {
    const d = I.TRAMO[id], st = fresh().infra.t[id], real = realSeg(a, b);
    assert(d && d.kind === 'conv' && d.a === a && d.b === b, 'tramo ' + id);
    assert.deepEqual([st.g, st.e, st.v, st.b], ['ib', '3kv', speed, true], 'ibérico, 3 kV y su velocidad: ' + id);
    assert(Math.abs(d.km - real.km) <= 3, `${id}: ${d.km} km frente a ${real.km}`);
    assert(!d.approx, 'trazado sobre las vías: ' + id);
    for (const p of points) assert(passesNear(id, p, 6), `${id} pasa por ${p}`);
    const g = I.tramoGeom(d).pts;
    assert(kmTo(g[0], [I.NODES[a].lon, I.NODES[a].lat]) < 3 && kmTo(g.at(-1), [I.NODES[b].lon, I.NODES[b].lat]) < 3, 'empieza y acaba en sus nodos: ' + id);
  }
  // la rampa y la variante no comparten trazado
  assert(!passesNear('leo-pol', [-5.703, 42.985], 2), 'la variante va por los túneles, no por Busdongo');
  ok.push('Palencia — León (122 km), Córdoba — Sevilla (129 km) y la rampa de Pajares (108 km): ibérico, 3 kV, trazados por Sahagún, Lora del Río y Busdongo.');
}
// 6. La variante de Pajares sigue abriendo el 29 de noviembre de 2023; la rampa sigue ahí.
{
  const s = fresh(), gij = route(s, 'madrid-gijon');
  assert.equal(s.infra.t['leo-pol'].b, false, 'en 2022 la variante no existe');
  assert(E.routeCheck(s, gij, MODEL.s130).tramos.some(t => t.id === 'leo-pol-rampa'), 'el Alvia sube por la rampa');
  assert(I.faultText(s, {type: 'build', tramo: 'leo-pol'}).includes('29 de noviembre de 2023'));
  for (let k = 0; k < 22; k++) { decideAll(s); E.step(s); }
  assert(!s.infra.h.includes('leo-pol@2023-11-29') && !s.infra.c.includes('pol'), 'octubre de 2023: todavía no');
  decideAll(s); E.step(s);
  assert(s.infra.h.includes('leo-pol@2023-11-29') && s.infra.t['leo-pol'].b && s.infra.c.includes('pol'), 'abre en noviembre de 2023 con su cambiador');
  assert(s.log.some(l => /Pajares/.test(l.title)));
  assert(s.infra.t['leo-pol-rampa'].b, 'la rampa sigue en servicio');
  assert(E.routeCheck(s, gij, MODEL.s130).tramos.some(t => t.id === 'leo-pol'), 'el Alvia ya va por la variante');
  ok.push('Variante de Pajares en su fecha (29-11-2023) con cambiador en Pola; antes y después, la rampa clásica sigue disponible.');
}
// 7. Motilla en su sitio y velocidades de los tramos reales.
{
  const s = fresh(), mot = I.NODES.mot;
  assert(kmTo([mot.lon, mot.lat], [-1.881, 39.565]) < 10, 'la bifurcación está junto a Motilla del Palancar');
  assert(mot.lon > I.NODES.cue.lon, 'al este de Cuenca, no al oeste');
  const vlc = E.routeCheck(s, route(s, 'madrid-valencia'), MODEL.s103);
  assert(vlc.ok && vlc.km >= 385 && vlc.km <= 400, 'Madrid — València por la LAV: ' + vlc.km + ' km (antes 499)');
  for (const [id, v] of Object.entries({'ter-sag': 90, 'vdb-pal': 130, 'mad-gua': 160, 'trb-sor': 100, 'pal-san': 120})) assert.equal(s.infra.t[id].v, v, 'velocidad real de ' + id);
  assert.equal(I.TRAMO['pla-cac'].speed, 180, 'Extremadura sigue a 180 km/h como dice su hito de 2022');
  assert.equal(s.infra.t['mot-alb-av'].v, 300, 'la LAV Motilla — Albacete sigue a 300 km/h');
  ok.push(`Motilla junto a Motilla del Palancar: Madrid — València ${vlc.km} km (antes 499); Teruel — Sagunt 90, Venta de Baños — Palencia 130, Madrid — Guadalajara 160 km/h.`);
}
// 7b. Si el camino más rápido es un rodeo, vale el más corto; y el motivo que se cuenta en una línea es el del tren.
{
  const s = fresh();
  for (const id of ['mad-alc', 'alc-lin', 'lin-cor']) s.infra.t[id].g = 'mixto';
  s.infra.ver++;
  const r = route(s, E.createService(s, 'mad', 'lin')), p = E.routeCheck(s, r, MODEL.s106f);
  assert(p.ok && p.km < 330 && p.tramos.map(t => t.id).join() === 'mad-alc,alc-lin', 'Madrid — Linares por Alcázar, no por Córdoba: ' + p.km + ' km');
  const gij = route(fresh(), 'madrid-gijon'), q = E.routeCheck(fresh(), gij, MODEL.s112);
  assert(q.faults.some(f => f.type === 'build' && f.tramo === 'leo-pol'), 'la variante aún no existe');
  assert.equal(I.faultText(fresh(), I.keyFault(fresh(), q.faults), true), 'Pola de Lena — Oviedo: ancho ibérico', 'el motivo es el ancho, no la fecha de la variante');
  ok.push('Rodeos: si el más rápido da la vuelta por Córdoba, el AVE va por Alcázar; el motivo corto es el del tren (ancho), no la fecha de la variante.');
}
// 8. Partidas guardadas con la red anterior (fixtures generados con el código previo) se cargan y quedan coherentes.
{
  const a = fixture('partida-v4-red1-2023-01.json.gz'), b = fixture('partida-v4-red1-2025-07.json.gz');
  for (const raw of [a, b]) { assert.equal(raw.infra.rev, undefined); assert(!raw.infra.t['pal-leo'] && !raw.infra.t['leo-pol-rampa'], 'guardado sin los tramos nuevos'); }
  // enero de 2023: antes de la variante, con obra de tercer carril en la rampa y AVE S112 a Castelló
  assert.equal(a.projects.find(p => !p.done && p.work === 'mixed').target, 'leo-pol');
  const s = E.validateSave(a);
  assert.equal(s.infra.rev, I.NET_REVISION);
  for (const t of I.TRAMOS) assert(s.infra.t[t.id], 'tramo migrado ' + t.id);
  assert.deepEqual(s.infra.t['leo-pol'], {g: 'mixto', e: '25kv', v: 220, b: false}, 'la variante queda por abrir');
  assert.deepEqual(s.infra.t['leo-pol-rampa'], {g: 'ib', e: '3kv', v: 115, b: true}, 'la rampa hereda el estado guardado');
  assert.equal(s.projects.find(p => !p.done && p.work === 'mixed').target, 'leo-pol-rampa', 'la obra en curso pasa a la rampa');
  assert.equal(s.infra.t['ter-sag'].v, 90, 'velocidad corregida');
  const cas = route(s, 'madrid-castellon'), lot = s.fleet.find(f => f.id === cas.fleet);
  assert(cas.active && MODEL[lot.model].voltages.includes('3kv'), 'el AVE de Castelló pasa a un lote bitensión');
  assert(/Madrid — Castelló/.test(s.log[0].body) && /3 kV/.test(s.log[0].body), 'el diario lo cuenta');
  for (const r of s.routes.filter(r => r.active)) assert(E.canRun(s, r, MODEL[s.fleet.find(f => f.id === r.fleet).model]), 'servicio posible ' + r.id);
  assert(E.validateSave(JSON.parse(JSON.stringify(s))), 'se vuelve a guardar y cargar');
  for (let k = 0; s.month < 23 && k < 40; k++) { decideAll(s); assert(E.step(s)); }
  assert(s.infra.t['leo-pol'].b && s.infra.c.includes('pol'), 'la variante abre en la partida migrada');
  // sin lote bitensión libre, el servicio se suspende y se avisa
  const c = JSON.parse(JSON.stringify(a));
  for (const f of c.fleet) if (MODEL[f.model].voltages.includes('3kv')) f.condition = 20;
  for (const r of c.routes) if (r.active && MODEL[c.fleet.find(f => f.id === r.fleet).model].voltages.includes('3kv')) { r.active = false; r.fleet = null; r.units = 0; }
  const s2 = E.validateSave(c), cas2 = route(s2, 'madrid-castellon');
  assert(!cas2.active && cas2.fleet === null && cas2.units === 0, 'suspendido');
  assert.equal(s2.log[0].title, 'Servicio suspendido');
  // julio de 2025: variante abierta; el S103 de Castelló pasa a un AVE bitensión
  const s3 = E.validateSave(b);
  assert.deepEqual(s3.infra.t['leo-pol'], b.infra.t['leo-pol'], 'la variante abierta se conserva');
  assert.deepEqual(s3.infra.t['leo-pol-rampa'], {g: 'ib', e: '3kv', v: 115, b: true});
  assert(MODEL[s3.fleet.find(f => f.id === route(s3, 'madrid-castellon').fleet).model].voltages.includes('3kv'));
  assert(E.routeCheck(s3, route(s3, 'madrid-gijon'), MODEL.s130).ok);
  // una partida actual manipulada no se «repara»: se rechaza
  const t = JSON.parse(JSON.stringify(s3)); route(t, 'madrid-castellon').fleet = t.fleet.find(f => f.model === 's103').id;
  assert.throws(() => E.validateSave(t), /no puede circular|dos veces/);
  ok.push('Guardados v4 del código anterior (2023 y 2025): tramos nuevos, rampa con su obra en curso, variante en su fecha, velocidades y AVE de Castelló a un lote bitensión o suspendido con aviso.');
}
// 9. Rescate: los corredores pintan los tramos reales.
{
  const norte = baseSegments('norte'), sur = baseSegments('sur'), ast = baseSegments('asturias');
  assert.deepEqual(norte.find(x => x.key === 'leo-pal'), {from: 'pal', to: 'leo', km: 123, gauge: 'ib', elec: '3kv', vmax: 155, track: 'doble', key: 'leo-pal'});
  assert.deepEqual(sur.find(x => x.key === 'cor-sev'), {from: 'cor', to: 'sev', km: 129, gauge: 'ib', elec: '3kv', vmax: 155, track: 'mixta', key: 'cor-sev'});
  assert.deepEqual(ast[0], {from: 'leo', to: 'pol', km: 108, gauge: 'ib', elec: '3kv', vmax: 115, track: 'mixta', key: 'leo-pol'});
  for (const [id, list] of Object.entries(SEGMENTS)) assert.deepEqual(CORRIDOR[id].segments, list, 'tramos reales de ' + id);
  assert(norte.every(x => x.gauge === 'ib') && !norte.some(x => x.elec === '25kv'), 'el Norte del rescate es convencional');
  // y el mapa del rescate dibuja esos corredores por la vía convencional (rampa por Busdongo, Sahagún, Lora del Río)
  const {GEOMETRY} = await import('./dist/rescate-map.js');
  const near = (id, p) => Math.min(...GEOMETRY[id].pts.map(q => kmTo(q, p)));
  assert(near('asturias', [-5.703, 42.985]) < 1 && near('norte', [-5.0285, 42.3712]) < 1 && near('sur', [-5.5331, 37.6607]) < 1, 'trazado de los corredores');
  ok.push('Rescate: los once corredores usan los tramos reales de segments.json (Palencia — León, Córdoba — Sevilla y la rampa: ibérico, 3 kV).');
}
console.log(ok.map(x => '✓ ' + x).join('\n'));
