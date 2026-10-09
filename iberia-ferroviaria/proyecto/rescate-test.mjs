// Rescate de Tenfe: reglas del motor y partidas completas de ocho años jugadas por un jugador automático
// que solo usa órdenes legales. Uso: node rescate-test.mjs [--verbose] [--seeds N]
import assert from 'node:assert/strict';
import * as R from './dist/rescate.js';
import {CORRIDORS, CORRIDOR, TERRITORIES, STAGES, MEGAPROJECTS, TECHS, PACT, LINES, WORKS} from './dist/rescate-data.js';

const verbose = process.argv.includes('--verbose');
const seedsArg = process.argv.indexOf('--seeds');
const SEEDS = seedsArg > 0 ? Number(process.argv[seedsArg + 1]) : 6;
const tryDo = fn => { try { fn(); return true; } catch { return false; } };

// ------------------------------------------------------------------ reglas básicas
{
  const s = R.newGame(7);
  assert.equal(s.cash, 12); assert.equal(s.fleet.length, 4); assert.equal(s.crews.own, 2);
  assert.equal(Math.round(s.corridors.norte.punct), 62, 'el Norte empieza al 62 %');
  const q = R.workQuote(s, 'norte', 'renovar');
  assert.equal(q.cost, 2.35, 'renovar el Norte cuesta 2,4 M€');
  assert.equal(q.weeks, 7, 'siete semanas con autobuses alternativos');
  assert.equal(q.crews, 1);
  assert(q.aid && q.aid.amount === 1.2, 'la ayuda de 1,2 M€ aparece como financiación prevista');
  assert(q.punctAfter >= 80, 'tras la obra el Norte puede llegar al 80 %');
  const fases = R.workQuote(s, 'norte', 'renovar', 'fases');
  assert(R.punctProjection(s, 'norte', q, 13) >= 80, 'con autobuses llega al 80 % en la semana 13');
  assert(R.punctProjection(s, 'norte', fases, 13) < 80, 'por fases no llega');
  assert(fases.weeks > q.weeks, 'por fases dura más');
  const tq = R.trainQuote(s, 'kafka');
  assert.equal(tq.price, 3); assert.equal(tq.arrives, 5, 'el tren nuevo llega en cuatro semanas');
  const plan3 = R.serviceForecast(s, 'norte', {trains: 3}), plan2 = R.serviceForecast(s, 'norte', {trains: 2});
  assert(plan3.pax - plan2.pax < 1.2, 'un tren más en el Norte apenas suma mientras la vía siga rota');
  // tres órdenes por semana
  R.startWork(s, 'norte', 'renovar');
  R.takeLoan(s, 4);
  R.reorganize(s, 'levante', {trains: 1, express: 0, fare: 18});
  assert.throws(() => R.buyTrain(s, 'kafka'), /tres órdenes/);
  assert.throws(() => R.startWork(s, 'sur', 'renovar'), /cuadrilla|tres órdenes/);
  // consultar y comparar es gratis
  R.workQuote(s, 'sur', 'renovar'); R.serviceQuote(s, 'sur', {trains: 2, express: 0}); R.trainQuote(s, 'dorfler');
  assert.equal(R.ordersLeft(s), 0);
  const r = R.closeWeek(s);
  assert.equal(s.week, 2); assert.equal(R.ordersLeft(s), 3);
  assert(r.paid.length === 0 && Number.isFinite(r.ordinary));
  assert(R.validate(JSON.parse(R.serialize(s))), 'la partida se guarda y se carga');
  // la ayuda se cobra al certificar
  for (let k = 0; k < 9; k++) { while (s.decisions.length) R.answer(s, 0, 0); R.closeWeek(s); }
  assert(s.flags['aid-feder-norte'], 'la ayuda europea se cobra al terminar la obra');
  assert(s.corridors.norte.track > 80, 'la vía del Norte queda renovada');
  console.log('✓ Reglas: obra de 2,4 M€ y 7 semanas, tren en 4 semanas, ayuda al certificar, tres órdenes por semana, guardado.');
}
// pactos: como mucho dos
{
  const s = R.newGame(3);
  s.week = 60; s.offers = [{id: 'convenio', week: 60, expires: 63}, {id: 'carta-viajeros', week: 60, expires: 63}];
  s.pacts.push({id: 'cuadrilla-adif', cheap: false, start: 50, deadline: 70, status: 'active', quarters: []}, {id: 'inauguracion', cheap: false, start: 50, deadline: 70, status: 'active', quarters: []});
  assert.throws(() => R.respondPact(s, 'convenio', 'accept'), /dos pactos/);
  R.respondPact(s, 'convenio', 'reject');
  assert.equal(s.offers.length, 1);
  console.log('✓ Pactos: máximo dos activos; rechazar no gasta órdenes.');
}
// corrupción: sobornos, sospecha y escándalo
{
  const s = R.newGame(11);
  R.buyTrain(s, 'bcbb', true);
  assert(s.cloacas.cajaB > 0, 'la comisión llena la caja B');
  const out = R.bribe(s, 'alcalde');
  assert(out.ok && s.cloacas.suspicion > 10);
  assert.throws(() => R.bribe(s, 'juez'), /juez/);
  for (let k = 0; k < 40 && !s.cloacas.exposed.length; k++) { s.cloacas.suspicion = 80; s.cloacas.evidence = 60; while (s.decisions.length) R.answer(s, 0, 0); if (s.cash < 1) s.cash = 5; R.closeWeek(s); }
  assert(s.cloacas.exposed.length > 0, 'con mucha sospecha el escándalo acaba saliendo');
  console.log('✓ Cloacas: comisiones a caja B, sobornos, sospecha y escándalos.');
}
// diálogos: todas las líneas referenciadas existen
{
  for (const st of STAGES) assert(LINES['stage-' + st.id], 'línea de etapa ' + st.id);
  for (const p of Object.values(PACT)) assert(LINES[p.line], 'línea del pacto ' + p.id);
  console.log('✓ Diálogos: todas las etapas y pactos tienen su línea.');
}

// ------------------------------------------------------------------ jugador automático
function bot(seed) {
  const s = R.newGame(seed), log = [];
  const say = (...x) => { if (verbose) console.log('S' + s.week, ...x); log.push(x.join(' ')); };
  const reserve = () => s.week < 52 ? .8 : 1.5;
  const loans = () => s.loans.reduce((n, l) => n + l.balance, 0);
  const free = () => R.cashProjection(s, 13).min - reserve();
  const decide = () => {
    for (let guard = 0; guard < 20 && s.decisions.length; guard++) {
      const d = s.decisions[0];
      let ix = 0;
      if (d.kind === 'insolvency') ix = d.choices.findIndex(c => c.fx === (s.flags.restructured && s.week - s.flags.restructured < 26 ? 'sell' : 'restructure'));
      if (d.kind === 'corruption') ix = d.choices.findIndex(c => c.fx === 'none' || c.fx.endsWith('-no')); // el bot honrado
      if (d.kind === 'event' && /M€/.test(d.choices?.[0]?.label || '') && s.cash < reserve()) ix = Math.min(1, d.choices.length - 1);
      if (d.choices?.[ix]?.fx === 'strike-bribe') ix = 0;
      const note = R.answer(s, 0, Math.max(0, ix)); if (verbose) console.log('   decide', d.kind, d.id || d.title, '→', d.choices?.[Math.max(0, ix)]?.fx, note || '');
    }
  };
  const renovate = (id, mode = 'alternativa') => {
    const q = R.workQuote(s, id, 'renovar', mode);
    if (q.ok && free() > Math.min(q.cost, q.cost * 13 / q.weeks) && tryDo(() => R.startWork(s, id, 'renovar', mode))) { say('renovar', id, q.cost); return true; }
    return false;
  };
  const buy = () => {
    if (s.fleet.some(t => t.status === 'arriving') || R.ordersLeft(s) < 1) return false;
    const q = R.trainQuote(s, 'kafka');
    if (free() > q.price) return tryDo(() => R.buyTrain(s, 'kafka')) && (say('compra'), true);
    return false;
  };
  for (let guard = 0; guard < 500 && !s.ended; guard++) {
    decide();
    // pactos sensatos
    for (const o of [...s.offers]) {
      const ok = ['convenio', 'carta-viajeros', 'inauguracion', 'cohesion', 'tuits', 'estacion-paco'].includes(o.id) && R.activePacts(s).length < 2 && R.ordersLeft(s) > 0 && s.week > 13;
      if (ok) { tryDo(() => R.respondPact(s, o.id, o.id === 'estacion-paco' ? 'negotiate' : 'accept')) && say('pacto', o.id); }
    }
    if (s.flags.stationTask && !s.flags.stationTask.started && R.crewsFree(s) > 0 && free() > 1) tryDo(() => R.buildStation(s)) && say('apeadero');
    // financiación: un préstamo si la caja aprieta y hay obras por hacer
    if (s.week >= 14 && (free() < 0) && loans() < 16 && R.ordersLeft(s) > 0 && !R.pactActive(s, 'contrato-programa')) {
      for (const amount of [12, 8, 4]) if (tryDo(() => R.takeLoan(s, amount))) { say('préstamo', amount); break; }
    }
    // territorios desatendidos (a partir del hito «Red regional»)
    if (s.milestones.includes('m1') && R.ordersLeft(s) > 0 && s.week > 60 && s.corridors.mediterraneo.open && R.weeklyAccounts(s).ordinary > .12) {
      const owned = Object.keys(s.territories);
      for (const [tid, t] of Object.entries(TERRITORIES)) {
        if (owned.length >= 2 && !s.territories[tid]) continue;
        if (!s.territories[tid] && owned.some(o => !s.corridors[TERRITORIES[o].corridor].open)) continue;
        if (R.ordersLeft(s) < 1) break;
        const c = s.corridors[t.corridor];
        if (!s.territories[tid]) { if (free() > 1) tryDo(() => R.licenseTerritory(s, tid)) && say('licencia', tid); break; }
        if (!c.open && c.track < 40) { renovate(t.corridor, 'cerrar'); continue; }
        if (!c.open) { if (R.trainsIdle(s).length) tryDo(() => R.openCorridor(s, t.corridor, 1)) && say('abre territorio', tid); else buy(); }
      }
    }
    const focus = MEGAPROJECTS.filter(m => !m.vanity && !R.megaState(s, m.id).done && s.milestones.includes(m.tier));
    for (const m of focus.slice(0, 2)) { const st = R.megaState(s, m.id); if (st.ok && R.ordersLeft(s) > 0 && free() > Math.min(st.next.cost, st.next.cost * 13 / st.next.weeks) + .5 && tryDo(() => R.startMegaStage(s, m.id))) say('mega', m.id, st.stage); }
    // obras: vía mala primero; el primer trimestre solo el Norte
    const open = CORRIDORS.filter(d => s.corridors[d.id].open).sort((a, b) => s.corridors[a.id].track - s.corridors[b.id].track);
    for (const d of open) {
      if (R.ordersLeft(s) < 1) break;
      const c = s.corridors[d.id];
      if (s.week <= 13 && d.id !== 'norte') continue;
      if (c.track < 74) renovate(d.id);
      else if (s.week > 80 && c.signal < 8 && c.trains >= 2 && free() > 4) { const q = R.workQuote(s, d.id, 'senalizacion', 'fases'); if (q.ok) tryDo(() => R.startWork(s, d.id, 'senalizacion', 'fases')) && say('señal', d.id); }
    }
    // trenes donde la gente se queda en tierra
    const crowded = CORRIDORS.filter(d => s.corridors[d.id].open && s.corridors[d.id].lost > .8 && s.corridors[d.id].track > 70).sort((a, b) => s.corridors[b.id].lost - s.corridors[a.id].lost);
    for (const d of crowded) {
      if (R.ordersLeft(s) < 1) break;
      if (R.trainsIdle(s).length) tryDo(() => R.reorganize(s, d.id, {trains: s.corridors[d.id].trains + 1, express: s.corridors[d.id].express})) && say('más trenes', d.id);
      else if (s.week > 13) buy();
      break;
    }
    // trenes parados: a un corredor
    if (R.trainsIdle(s).length && R.ordersLeft(s) > 0) {
      const target = CORRIDORS.filter(d => s.corridors[d.id].open && (s.corridors[d.id].trains === 0 || s.corridors[d.id].capacityLoad > .9)).sort((a, b) => s.corridors[b.id].capacityLoad - s.corridors[a.id].capacityLoad)[0];
      if (target) tryDo(() => R.reorganize(s, target.id, {trains: s.corridors[target.id].trains + 1, express: s.corridors[target.id].express})) && say('asigna', target.id);
    }
    // crecer: corredores rentables cuando los esenciales ya van
    const essOk = ['norte', 'levante', 'sur'].every(id => s.corridors[id].track > 75);
    if (essOk && R.ordersLeft(s) > 0) for (const id of ['mediterraneo', 'ebro', 'galicia', 'asturias']) {
      if (s.corridors[id].open) continue;
      if (R.trainsIdle(s).length >= 1) { tryDo(() => R.openCorridor(s, id, Math.min(2, R.trainsIdle(s).length))) && say('abre', id); }
      else buy();
      break;
    }
    // cuadrillas
    if (R.crewsFree(s) === 0 && s.crews.own < 5 && free() > 2 && R.ordersLeft(s) > 0 && s.week > 20 && !s.crews.hiring.length) tryDo(() => R.hireCrew(s)) && say('cuadrilla');
    // tecnología y megaproyectos
    for (const t of TECHS) if (t.branch !== 'fontaneria' && R.techState(s, t.id).ok && s.week > 13 && free() > t.cost + 1) { R.research(s, t.id); say('tecnología', t.id); }
    // revisiones
    for (const t of s.fleet.filter(t => t.status === 'service' && t.condition < 48)) { if (R.ordersLeft(s) < 1 || free() < .5) break; tryDo(() => R.sendRevision(s, t.id)) && say('revisión', t.name); }
    // mantener la vía en el último tramo
    decide();
    s.flags.maxCalm = Math.max(s.flags.maxCalm || 0, s.incidentFree);
    if (s.week === 311) s.flags.s4dbg = R.stageProgress(s).rows.map(r => r.label + ' ' + r.value);
    const nBefore = s.fleet.length;
    try { R.closeWeek(s); } catch (e) { decide(); R.closeWeek(s); }
    if (verbose && s.fleet.length < nBefore) console.log('   flota', nBefore, '→', s.fleet.length, JSON.stringify(s.decisions.map(d => d.kind)), s.lastReport.events.join('|'));
    if (verbose && s.week % 26 === 1) { const a = R.weeklyAccounts(s), f = R.electionForecast(s); console.log(`  S${s.week} caja ${s.cash.toFixed(1)} deuda ${loans().toFixed(1)} ord ${a.ordinary.toFixed(3)} pax ${R.totalPax(s).toFixed(1)} voto ${f.vote.toFixed(1)} ${Object.entries(s.groups).map(([k, v]) => k.slice(0, 4) + Math.round(v)).join(' ')} ★${s.stars} hitos ${s.milestones.join(',')} etapa ${s.stageIdx} techs ${s.techs.length} tren ${s.fleet.length} ${Object.entries(s.corridors).filter(([, c]) => c.open).map(([k, c]) => k.slice(0, 3) + c.trains + '/' + Math.round(c.punct) + '/' + Math.round(c.track)).join(' ')}`); }
  }
  return {s, log};
}
const results = [];
const only = process.argv.indexOf('--seed'); for (let seed = only > 0 ? Number(process.argv[only + 1]) : 1; seed <= (only > 0 ? Number(process.argv[only + 1]) : SEEDS); seed++) {
  const {s} = bot(seed);
  if (verbose) console.log(JSON.stringify(s.flags.s4dbg || ''), Object.keys(s.territories), Object.fromEntries(Object.entries(s.megas).map(([k, m]) => [k, m.stage])));
  const v = R.finalVerdict(s);
  results.push({seed, end: s.ended?.kind, reason: s.ended?.reason, week: s.week, cash: Math.round(s.cash * 10) / 10, elections: s.elections.map(e => Math.round(e.vote)),
    program: Object.keys(s.program).map(k => k.slice(2, 6)).join(','), st: Object.values(s.stageResults).map(x => x[0]).join(''), milestones: s.milestones.length - 1, techs: s.techs.length, megas: Object.values(s.megas).reduce((n, m) => n + m.stage, 0), ordinary: Math.round(v.ordinary * 100) / 100, calm: s.flags.maxCalm, megaSt: Object.entries(s.megas).map(([k, m]) => k.slice(0, 3) + m.stage).join(' ')});
}
console.table(results);
assert(results.filter(r => r.end === 'win').length >= Math.ceil(SEEDS / 2), 'un jugador sensato gana la mayoría de partidas');
assert(results.every(r => r.st[0] === 'p'), 'el primer trimestre se puede superar renovando el Norte');
console.log('✓ Partidas completas de ocho años con órdenes legales.');
