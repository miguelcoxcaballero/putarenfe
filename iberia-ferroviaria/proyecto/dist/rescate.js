// Rescate de Tenfe: motor semanal. Sin DOM: lo usan la interfaz (rescate-ui.js) y las pruebas (rescate-test.mjs).
// Una semana = planificar con el tiempo parado (tres órdenes) + cerrar la semana (servicios, billetes, costes y obras).
import {RESCUE_VERSION, START_YEAR, WEEKS, ELECTIONS, ORDERS_PER_WEEK, MAX_PACTS, GROUPS, CORRIDORS, CORRIDOR, TERRITORIES, TRAIN_OFFERS, OFFER, RENT, CREW,
  WORKS, SERVICE_MODES, PHASES, AIDS, MILESTONES, TECHS, TECH, TIER_MILESTONE, ACHIEVEMENTS, MEGAPROJECTS, MEGA, STAGES, PROGRAM, PACTS, PACT,
  BRIBES, BRIBE, JUDICIAL, LINES, HEADLINES} from './rescate-data.js';

export const SAVE_KEY = 'tenfe-rescate-v1';
const OSP_BASE = 4.8;            // subvención trimestral por obligaciones de servicio público (M€)
const STAFF_BASE = .18;          // estructura, oficinas y atención (M€/semana)
const DEBT_RATE = .045;          // interés anual de la deuda heredada
const TRAIN_RUN = {crew: .03, energy: .022, upkeep: .012, idle: .008};
const CANON_KM = .00011, TRACK_KM = .00009;
const SEAT_TURNS = 14 * 1.8 / 1000; // plazas por semana → miles de viajeros
const BASE_CAPACITY = 4;         // trenes por corredor sin atascos
const START_DATE = Date.UTC(START_YEAR, 0, 4); // lunes 4 de enero de 2027

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const round2 = x => Math.round(x * 100) / 100;
const sum = (list, f = x => x) => list.reduce((n, x) => n + f(x), 0);
const avg = list => list.length ? sum(list) / list.length : 0;

// ------------------------------------------------------------------ azar reproducible
function rand(s) {
  let t = (s.rng = (s.rng + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
const pick = (s, list) => list[Math.floor(rand(s) * list.length)];

// ------------------------------------------------------------------ fechas
export function dateOf(week) { return new Date(START_DATE + (week - 1) * 7 * 86400000); }
export function dateLabel(week, opts = {day: 'numeric', month: 'long', year: 'numeric'}) { return dateOf(week).toLocaleDateString('es-ES', {...opts, timeZone: 'UTC'}); }
export const yearOf = week => Math.floor((week - 1) / 52) + 1;
export const quarterEnd = week => week % 13 === 0;
export function stageOf(week) { return STAGES.findIndex(st => week >= st.from && week <= st.to); }

// ------------------------------------------------------------------ partida nueva
export function newGame(seed = Date.now() % 1e9) {
  const s = {
    v: RESCUE_VERSION, seed, rng: seed >>> 0, week: 1, cash: 12, stars: 6, ordersUsed: 0, orderLog: [],
    debt: 18, loans: [], payments: [
      {week: 5, amount: 2.5, label: 'Facturas atrasadas de proveedores', kind: 'deuda'},
      {week: 9, amount: .4, label: 'Seguro anual de la flota', kind: 'seguro'},
      {week: 13, amount: 2.0, label: 'Plazo de la deuda heredada', kind: 'deuda'},
      ...[26, 39, 52].map(w => ({week: w, amount: 1.0, label: 'Plazo de la deuda heredada', kind: 'deuda'})),
    ],
    sliders: {track: 1, fleet: 1, service: 1},
    corridors: {}, fleet: [], crews: {own: 2, hiring: [], sub: [], loan: []}, works: [], nextId: 1,
    megas: {}, techs: [], milestones: ['m0'], territories: {},
    groups: {viajeros: 31, territorios: 26, trabajadores: 46, economia: 39}, groupHist: {viajeros: [], territorios: [], trabajadores: [], economia: []},
    bonus: {viajeros: 0, territorios: 0, trabajadores: 0, economia: 0},
    pacts: [], offers: [], pactLog: [], decisions: [], gaceta: [], reports: [],
    cloacas: {cajaB: 0, suspicion: 0, evidence: 0, stage: 0, calm: 0, secrets: [], exposed: [], muffle: 0, fastPermits: 0, skipTests: false, risk: 0, ospNext: 0, grudges: []},
    breaches: {grave: 0, leve: 0}, stageIdx: 0, stageResults: {}, program: {}, elections: [], rescues: [],
    hist: [], negativeWeeks: 0, incidentFree: 0, finished: 0, flags: {}, ospBonus: 0, ospCut: 0, slowPermits: 0, strike: 0, rival: null,
    tutorial: {step: 0, done: false}, ended: null, lastReport: null,
  };
  for (const c of CORRIDORS) s.corridors[c.id] = {
    open: c.open, track: c.track, punct: c.punct, trains: 0, express: 0, fare: c.fare, fareX: Math.round(c.fare * 1.5), elec: c.elec,
    signal: 0, capacity: 0, potBonus: 0, pax: 0, paxR: 0, paxX: 0, lost: 0, revenue: 0, cost: 0, streak: 0, hist: [], rivalShare: 0, works: null, closed: false,
  };
  const names = ['Pucela', 'La Abuela', 'Guadiana', 'Turia'];
  const start = [['norte', 'kafka', 58], ['norte', 'used', 49], ['levante', 'kafka', 66], ['sur', 'kafka', 61]];
  start.forEach(([corr, offer, cond], i) => { s.fleet.push({id: 't' + s.nextId++, name: names[i], offer, condition: cond, status: 'service', corridor: corr, weeks: 0}); s.corridors[corr].trains++; });
  for (const c of CORRIDORS) operate(s, c.id, true);
  pushGaceta(s, 'late', 'El Norte llega tarde. Otra vez.');
  record(s, 0);
  return s;
}

// ------------------------------------------------------------------ utilidades de estado
export const corridorDef = id => CORRIDOR[id];
export const isOpen = (s, id) => s.corridors[id].open;
export const ordersLeft = s => ORDERS_PER_WEEK - s.ordersUsed;
export function hasTech(s, id) { return s.techs.includes(id); }
/** Suma de un modificador sobre tecnologías y etapas de megaproyecto terminadas. */
export function mod(s, key) {
  let n = 0;
  for (const id of s.techs) n += TECH[id].mods?.[key] || 0;
  for (const m of MEGAPROJECTS) for (let i = 0; i < (s.megas[m.id]?.stage || 0); i++) n += m.stages[i].mods?.[key] || 0;
  return n;
}
function crewTotal(s) { return s.crews.own + s.crews.sub.length + s.crews.loan.length; }
export function crewsBusy(s) {
  return sum(s.works.filter(w => w.status === 'active'), w => w.crews) + sum(Object.values(s.megas).filter(m => m.active), m => m.active.crews) + (s.flags.slideCrew > 0 ? 1 : 0);
}
export function crewsFree(s) { return crewTotal(s) - crewsBusy(s); }
export function crewInfo(s) { return {own: s.crews.own, sub: s.crews.sub.length, loan: s.crews.loan.length, total: crewTotal(s), busy: crewsBusy(s), free: crewsFree(s), hiring: s.crews.hiring.length}; }
export function trainsAvailable(s) { return s.fleet.filter(t => t.status === 'service').length; }
export function trainsIdle(s) { return s.fleet.filter(t => t.status === 'service' && !t.corridor); }
function payWeek(s) { return s.payments.filter(p => p.week === s.week); }
export function upcoming(s, weeks = 8) {
  const rows = s.payments.filter(p => p.week >= s.week && p.week < s.week + weeks).map(p => ({...p}));
  for (const w of s.works.filter(w => w.status === 'active')) {
    const plan = workSchedule(s, w);
    for (const row of plan) if (row.week < s.week + weeks) rows.push({week: row.week, amount: row.amount, label: WORKS[w.type].name + ' · ' + CORRIDOR[w.corridor].short, kind: 'obra'});
  }
  for (const [id, m] of Object.entries(s.megas)) if (m.active) {
    const per = m.active.cost / m.active.total;
    for (let k = 0; k < m.active.left && k < weeks; k++) rows.push({week: s.week + k, amount: round2(per), label: MEGA[id].name, kind: 'megaproyecto'});
  }
  return rows.sort((a, b) => a.week - b.week);
}
/** Caja prevista semana a semana: operación actual, subvención trimestral y pagos programados. */
export function cashProjection(s, weeks = 13) {
  const acc = weeklyAccounts(s), ops = acc.tickets - acc.costs;
  const osp = OSP_BASE * ospCompliance(s).factor + s.ospBonus + territoryOsp(s) + s.cloacas.ospNext - s.ospCut;
  const up = upcoming(s, weeks), rows = [];
  let cash = s.cash;
  for (let k = 0; k < weeks; k++) {
    const w = s.week + k;
    cash += ops - sum(up.filter(p => p.week === w), p => p.amount);
    if (quarterEnd(w)) cash += osp;
    rows.push({week: w, cash: round2(cash)});
  }
  return {rows, min: Math.min(...rows.map(r => r.cash)), minWeek: rows.reduce((a, b) => b.cash < a.cash ? b : a).week, ops: round2(ops), osp: round2(osp)};
}
/** Lo que hay que pagar en las próximas semanas (deuda, compras, obras y megaproyectos). */
export function dueWithin(s, weeks = 8) { return round2(sum(upcoming(s, weeks), p => Math.max(0, p.amount))); }
/** Dinero comprometido: lo que falta por pagar de obras, megaproyectos, compras y deuda programada. */
export function committed(s) {
  return round2(sum(s.works.filter(w => w.status === 'active'), w => w.cost - w.paid) + sum(Object.values(s.megas).filter(m => m.active), m => m.active.cost - m.active.paid)
    + sum(s.payments.filter(p => p.week >= s.week), p => p.amount));
}
/** Ayudas pendientes de una condición: se muestran como «financiación prevista». */
export function plannedAid(s) {
  const rows = [];
  for (const a of AIDS) if (!s.flags['aid-' + a.id]) rows.push({...a, active: s.works.some(w => w.corridor === a.corridor && w.type === a.work && w.status === 'active')});
  for (const p of s.pacts.filter(p => p.status === 'active')) { const r = pactTerms(p).reward; if (r?.cash) rows.push({id: 'pact-' + p.id, amount: r.cash, name: PACT[p.id].title, condition: 'al cumplir el pacto', active: true}); }
  return rows;
}

// ------------------------------------------------------------------ operación de un corredor
function seatsOf(t) { return OFFER[t.offer].seats; }
function trainsOn(s, id) { return s.fleet.filter(t => t.corridor === id && t.status === 'service'); }
/** Puntualidad objetivo con lo que hay hoy. Devuelve también sus causas para enseñarlas. */
export function punctTarget(s, id, extra = {}) {
  const c = s.corridors[id], def = CORRIDOR[id], trains = extra.trains ?? trainsOn(s, id).length;
  const track = extra.track ?? c.track, causes = [];
  const fleet = trainsOn(s, id), cond = fleet.length ? avg(fleet.map(t => t.condition)) : 80;
  let p = 97;
  const trackLoss = (100 - track) * .5; p -= trackLoss; causes.push({label: 'Estado de la vía (' + Math.round(track) + ' %)', value: -trackLoss});
  const fleetLoss = (100 - cond) * .12; p -= fleetLoss; causes.push({label: 'Trenes desgastados', value: -fleetLoss});
  const cap = BASE_CAPACITY + c.capacity + mod(s, 'capacity'), jam = Math.max(0, trains - cap) * 4;
  if (jam) { p -= jam; causes.push({label: 'Atascos: más trenes que vías de cruce', value: -jam}); }
  if (!(extra.elec ?? c.elec)) { p -= 3; causes.push({label: 'Sin electrificar', value: -3}); }
  const crowd = c.capacityLoad > 1.05 ? Math.min(10, (c.capacityLoad - 1) * 25) : 0;
  if (crowd) { p -= crowd; causes.push({label: 'Trenes llenos: subidas y bajadas lentas', value: -crowd}); }
  const w = s.works.find(w => w.corridor === id && w.status === 'active' && w.phase === 1);
  if (w && w.mode === 'fases') { p -= 9; causes.push({label: 'Obras por fases', value: -9}); }
  const bonus = (extra.signal ?? c.signal) + mod(s, 'punct');
  if (bonus) { p += bonus; causes.push({label: 'Señalización y control', value: bonus}); }
  if (c.incident) { p -= c.incident; causes.push({label: 'Incidencia de esta semana', value: -c.incident}); }
  if (def.id === 'norte' && s.flags.stationNorte) { p -= 1; causes.push({label: 'Parada nueva en Villanueva', value: -1}); }
  return {value: clamp(p, 25, 98.5), causes};
}
/** Demanda y viajeros de un corredor con un plan de servicio (sin tocar el estado). */
export function serviceForecast(s, id, plan = null) {
  const c = s.corridors[id], def = CORRIDOR[id];
  const nAll = plan?.trains ?? trainsOn(s, id).length, nX = Math.min(nAll, plan?.express ?? c.express), nR = nAll - nX;
  const fare = plan?.fare ?? c.fare, fareX = plan?.fareX ?? c.fareX;
  const punct = plan?.punct ?? c.punct;
  let pot = def.pot * (1 + c.potBonus + mod(s, 'demand') + (def.way.includes('mad') ? mod(s, 'madrid') : 0));
  if (def.id === 'norte' && s.corridors.asturias.open && s.corridors.asturias.trains > 0) pot *= 1.08;
  if (def.id === 'norte' && s.flags.stationNorte) pot *= 1.03;
  if ((def.id === 'soria' || def.id === 'teruel') && pactActive(s, 'no-agresion')) pot *= 1 + PACT['no-agresion'].gives.feeder;
  const freq = n => 1 - Math.exp(-n / 1.8);
  const uR = Math.pow(def.fare / fare, 1.1) * freq(nR), uX = nX ? 1.35 * Math.pow(def.fare * 1.5 / fareX, 1.3) * freq(nX) : 0;
  const U = uR + uX, rel = clamp(Math.pow(punct / 100, 2), .15, 1);
  const rival = s.rival?.corridors?.includes(id) ? rivalShare(s, id, {rel, fare}) : 0;
  const mode = c.works && SERVICE_MODES[c.works];
  const service = mode ? mode.demand : 1;
  let want = U ? pot * rel * U / (U + .35) * (1 - rival) * service : 0;
  const wantR = U ? want * uR / U : 0, wantX = U ? want * uX / U : 0;
  const seats = list => sum(list, t => seatsOf(t)) * SEAT_TURNS;
  const fleet = trainsOn(s, id).sort((a, b) => seatsOf(b) - seatsOf(a));
  const capX = plan ? nX * 300 * SEAT_TURNS : seats(fleet.slice(0, nX)), capR = plan ? nR * 300 * SEAT_TURNS : seats(fleet.slice(nX));
  const paxR = Math.min(wantR, capR), paxX = Math.min(wantX, capX), lost = Math.max(0, wantR - capR) + Math.max(0, wantX - capX);
  const yieldF = 1 + mod(s, 'yield');
  const revenue = (paxR * fare + paxX * fareX) / 1000 * yieldF;
  const onlyR = nR ? pot * rel * uR / (uR + .35) * (1 - rival) * service : 0;
  return {pax: paxR + paxX, paxR, paxX, lost, want, revenue, load: want / Math.max(.01, capR + capX), rival, cannibal: Math.max(0, onlyR - paxR), rel, pot};
}
function rivalShare(s, id, {rel, fare}) {
  const def = CORRIDOR[id], mine = rel * Math.pow(def.fare / fare, 1.2) * (1 - Math.exp(-(s.corridors[id].trains + .5) / 1.8));
  const theirs = s.rival.strength;
  return clamp(theirs / (mine + theirs), 0, .7);
}
/** Coste semanal de un corredor (M€) con sus trenes y su vía. */
export function corridorCost(s, id, trains = null) {
  const c = s.corridors[id], def = CORRIDOR[id];
  if (!c.open && !c.trains) return {total: 0, rows: []};
  const n = trains ?? trainsOn(s, id).length, diesel = c.elec ? 1 : 1.5 * (1 + mod(s, 'dieselEnergy'));
  const rows = [
    {label: 'Personal de a bordo', value: n * TRAIN_RUN.crew},
    {label: 'Energía', value: n * TRAIN_RUN.energy * diesel},
    {label: 'Mantenimiento de trenes', value: n * TRAIN_RUN.upkeep * s.sliders.fleet},
    {label: 'Canon de infraestructura', value: c.open ? def.km * CANON_KM : 0},
    {label: 'Conservación de vía', value: c.open ? def.km * TRACK_KM * s.sliders.track : 0},
  ];
  if (c.works === 'alternativa') rows.push({label: 'Autobuses alternativos', value: SERVICE_MODES.alternativa.extra * def.km / 300});
  return {total: sum(rows, r => r.value), rows};
}
function operate(s, id, quiet = false) {
  const c = s.corridors[id];
  c.trains = trainsOn(s, id).length;
  c.express = Math.min(c.express, c.trains);
  if (!c.open) { c.pax = c.paxR = c.paxX = c.revenue = c.lost = 0; c.cost = 0; return; }
  const closed = c.works === 'cerrar' || c.works === 'alternativa' || c.closed;
  if (!closed) {
    const t = punctTarget(s, id).value;
    c.punct = c.punct + (t - c.punct) * (quiet ? 0 : .38);
  }
  const f = serviceForecast(s, id);
  Object.assign(c, {pax: f.pax, paxR: f.paxR, paxX: f.paxX, lost: f.lost, revenue: f.revenue, capacityLoad: f.load, rivalShare: f.rival});
  if (c.closed) { c.pax = c.paxR = c.paxX = c.revenue = 0; }
  c.cost = corridorCost(s, id).total;
  // indemnizaciones por retraso
  c.refunds = c.pax * Math.max(0, 75 - c.punct) / 100 * c.fare * .5 / 1000;
}

// ------------------------------------------------------------------ cuentas
export function weeklyAccounts(s) {
  const open = CORRIDORS.filter(d => s.corridors[d.id].open);
  const tickets = sum(open, d => s.corridors[d.id].revenue);
  const refunds = sum(open, d => s.corridors[d.id].refunds || 0);
  const staffMult = (1 - mod(s, 'staff')) * (s.sliders.service);
  const payroll = 1 + sum(s.pacts.filter(p => p.status === 'active'), p => pactTerms(p).upkeep?.payroll || 0);
  const idle = s.fleet.filter(t => !t.corridor || t.status !== 'service').length;
  const rows = {
    personal: STAFF_BASE * staffMult * payroll + s.crews.own * CREW.weekly * payroll + s.crews.sub.length * CREW.sub + sum(open, d => trainsOn(s, d.id).length * TRAIN_RUN.crew) * payroll,
    energia: sum(open, d => corridorCost(s, d.id).rows[1].value),
    mantenimiento: sum(open, d => corridorCost(s, d.id).rows[2].value) + idle * TRAIN_RUN.idle + s.fleet.filter(t => t.rented).length * RENT.weekly,
    infraestructura: sum(open, d => corridorCost(s, d.id).rows[3].value + corridorCost(s, d.id).rows[4].value + (corridorCost(s, d.id).rows[5]?.value || 0)),
    intereses: s.debt * DEBT_RATE / 52,
    indemnizaciones: refunds,
  };
  const costs = sum(Object.values(rows));
  const osp = ospWeekly(s);
  return {tickets, osp, costs, rows, ordinary: tickets + osp - costs};
}
/** Subvención trimestral repartida por semanas (para el resultado ordinario). */
/** Contrato territorial: cada territorio desatendido con tren diario cobra su parte del servicio público. */
export const TERRITORY_OSP = .6;
export function territoryOsp(s) { return TERRITORY_OSP * Object.values(TERRITORIES).filter(t => s.corridors[t.corridor].open && s.corridors[t.corridor].trains > 0).length; }
export function ospWeekly(s) { return (OSP_BASE * ospCompliance(s).factor + s.ospBonus + territoryOsp(s)) / 13; }
export function ospCompliance(s) {
  const ess = CORRIDORS.filter(d => d.essential).map(d => s.corridors[d.id]);
  const bad = ess.filter(c => c.punct < 70 || !c.open || c.trains < 1).length;
  return {factor: 1 - bad * .12, bad};
}

// ------------------------------------------------------------------ órdenes
function needOrder(s, kind) {
  if (s.ended) throw new Error('La partida ha terminado.');
  if (s.ordersUsed >= ORDERS_PER_WEEK) throw new Error('Ya has dado las tres órdenes de esta semana. Cierra la semana para seguir.');
  s.ordersUsed++; s.orderLog.push({week: s.week, kind});
}
function spend(s, amount, label) {
  if (amount > s.cash + 1e-9) throw new Error(`No hay caja: necesitas ${fmt(amount)} y tienes ${fmt(s.cash)}.`);
  s.cash = round2(s.cash - amount);
}
export function fmt(m) { const a = Math.abs(m); return (m < 0 ? '−' : '') + (a < 1 ? Math.round(a * 1000).toLocaleString('es-ES') + ' k€' : a.toLocaleString('es-ES', {maximumFractionDigits: 2, minimumFractionDigits: a < 10 ? 1 : 0}) + ' M€'); }

// ---- obras
export function workQuote(s, corridor, type, mode = 'alternativa', accelerate = false, kickback = false) {
  const def = CORRIDOR[corridor], w = WORKS[type], c = s.corridors[corridor];
  if (!w) throw new Error('Obra desconocida.');
  const reasons = [];
  if (!c.open && !s.territories[def.territory] && def.territory) reasons.push('Primero consigue la licencia del territorio.');
  if (s.works.some(x => x.corridor === corridor && x.status === 'active')) reasons.push('Ya hay una obra en marcha en este corredor.');
  if (s.works.some(x => x.corridor === corridor && x.status === 'commissioning')) reasons.push('Acaba de terminar una obra aquí: entra en servicio al cerrar esta semana.');
  if (type === 'electrificar' && c.elec) reasons.push('Ya está electrificado.');
  if (type === 'renovar' && c.track >= 92) reasons.push('La vía ya está en buen estado.');
  if (type === 'senalizacion' && c.signal >= 8) reasons.push('Ya tiene señalización moderna.');
  if (type === 'apartaderos' && c.capacity >= 6) reasons.push('No caben más apartaderos.');
  let cost = Math.max(w.min, def.km * w.perKm);
  if (kickback) cost *= 1.1;
  const m = SERVICE_MODES[c.open ? mode : 'cerrar'];
  const speed = 1 - mod(s, 'buildSpeed');
  let prep = w.phases[0] * (s.slowPermits > s.week ? 1.5 : 1) * (s.cloacas.fastPermits > s.week ? .5 : 1);
  let build = w.phases[1] * m.duration * speed;
  if (accelerate) { build *= .75; cost *= 1.25; }
  const phases = [Math.max(1, Math.round(prep)), Math.max(1, Math.round(build)), w.phases[2]];
  const crews = w.crews + (accelerate ? 1 : 0);
  if (crewsFree(s) < crews) reasons.push(`Necesita ${crews} cuadrilla${crews > 1 ? 's' : ''} libre${crews > 1 ? 's' : ''} y tienes ${crewsFree(s)}.`);
  cost = round2(cost);
  const extra = round2((m.extra || 0) * def.km / 300 * phases[1]);
  const aid = AIDS.find(a => a.corridor === corridor && a.work === type && !s.flags['aid-' + a.id]);
  const weeks = phases[0] + phases[1] + phases[2];
  const schedule = [];
  for (let k = 0, wk = s.week; k < 3; k++) for (let j = 0; j < phases[k]; j++, wk++) schedule.push({week: wk, amount: round2(cost * PHASES[k].share / phases[k])});
  // efecto previsto en puntualidad
  const after = {track: type === 'renovar' ? Math.min(98, c.track + w.effect.track) : c.track, signal: c.signal + (w.effect.signal || 0), elec: w.effect.elec || c.elec};
  const now = punctTarget(s, corridor).value, later = punctTarget(s, corridor, after).value;
  const fNow = serviceForecast(s, corridor), fLater = serviceForecast(s, corridor, {punct: later});
  return {corridor, type, mode: c.open ? mode : 'cerrar', accelerate, kickback, cost, extra, crews, phases, weeks, schedule, aid, reasons, ok: !reasons.length && ordersLeft(s) > 0,
    punctNow: now, punctAfter: later, paxGain: fLater.pax - fNow.pax, revenueGain: fLater.revenue - fNow.revenue, firstWeek: schedule[0]?.amount || 0, during: m,
    doneWeek: s.week + weeks - 1, serviceWeek: s.week + weeks};
}
/** Puntualidad prevista de un corredor al cerrar la semana `until` si se aprueba la obra `q` (misma regla que el motor). */
export function punctProjection(s, id, q, until) {
  const now = punctTarget(s, id).value;
  let p = s.corridors[id].punct;
  for (let w = s.week; w <= until; w++) {
    let target = null;
    if (w < s.week + q.phases[0]) target = now;
    else if (w < s.week + q.phases[0] + q.phases[1]) target = q.mode === 'fases' ? now - 9 : null;
    else if (w <= q.doneWeek) target = q.mode === 'fases' ? now : null;
    else target = q.punctAfter;
    if (target !== null) p += (target - p) * .38;
  }
  return p;
}
export function startWork(s, corridor, type, mode = 'alternativa', accelerate = false, kickback = false) {
  const q = workQuote(s, corridor, type, mode, accelerate, kickback);
  if (q.reasons.length) throw new Error(q.reasons[0]);
  needOrder(s, 'obra');
  const w = {id: 'w' + s.nextId++, corridor, type, mode: q.mode, phases: q.phases, phase: 0, inPhase: 0, cost: q.cost, paid: 0, crews: q.crews, status: 'active', started: s.week, accelerated: accelerate, kickback};
  s.works.push(w);
  if (kickback) takeKickback(s, q.cost, 'obra');
  if (s.week > 4 && type === 'renovar' && !s.flags.traviesasOffered) { s.flags.traviesasOffered = true; s.flags.traviesasWork = w.id; }
  return w;
}
/** Calendario de pagos que le quedan a una obra. */
export function workSchedule(s, w) {
  const rows = []; let wk = s.week;
  for (let k = w.phase; k < 3; k++) {
    const left = w.phases[k] - (k === w.phase ? w.inPhase : 0);
    for (let j = 0; j < left; j++, wk++) rows.push({week: wk, amount: round2(w.cost * PHASES[k].share / w.phases[k]), phase: k});
  }
  return rows;
}
export function workStatus(s, w) {
  const total = sum(w.phases), done = sum(w.phases.slice(0, w.phase)) + w.inPhase;
  const req = workRequirements(s, w);
  return {total, done, left: total - done, phase: PHASES[w.phase], req, stalled: req.some(r => !r.ok)};
}
/** Requisitos de la fase actual: como en un megaproyecto, cada fase tiene su lista. */
export function workRequirements(s, w) {
  const ph = w.phase, rows = [];
  const weekly = round2(w.cost * PHASES[ph].share / w.phases[ph]);
  rows.push({label: `Pago semanal de ${fmt(weekly)}`, ok: s.cash >= weekly});
  if (ph === 0) rows.push({label: s.slowPermits > s.week ? 'Permisos de Adif (van lentos: no pagaste a Benito)' : 'Permisos de Adif y del ayuntamiento', ok: true});
  if (ph >= 1) rows.push({label: `${w.crews} cuadrilla${w.crews > 1 ? 's' : ''} en el tajo`, ok: true});
  if (ph === 1 && w.type === 'electrificar') rows.push({label: 'Subestación contratada', ok: true});
  if (ph === 2) rows.push({label: 'Inspector de Adif disponible para certificar', ok: true});
  return rows;
}
export function accelerateWork(s, id) {
  const w = s.works.find(w => w.id === id && w.status === 'active');
  if (!w) throw new Error('No hay obra que acelerar.');
  if (w.accelerated) throw new Error('Esta obra ya va acelerada.');
  if (w.phase > 1) throw new Error('Ya está en pruebas: acelerar no sirve de nada.');
  if (crewsFree(s) < 1) throw new Error('Acelerar necesita una cuadrilla más libre.');
  const left = w.phases[1] - (w.phase === 1 ? w.inPhase : 0), cut = Math.max(1, Math.floor(left * .25));
  const extra = round2((w.cost - w.paid) * .3);
  needOrder(s, 'obra');
  w.phases[1] -= cut; w.cost = round2(w.cost + extra); w.crews += 1; w.accelerated = true;
  return {cut, extra};
}
/** Reanudar una obra aplazada por un impago: vuelve con un 10 % de sobrecoste sobre lo pendiente. */
export function resumeWork(s, id) {
  const w = s.works.find(w => w.id === id && w.status === 'paused');
  if (!w) throw new Error('No hay ninguna obra aplazada con ese nombre.');
  if (s.works.some(x => x.corridor === w.corridor && x.status === 'active')) throw new Error('Ya hay otra obra en marcha en ese corredor.');
  if (crewsFree(s) < w.crews) throw new Error(`Necesita ${w.crews} cuadrilla${w.crews > 1 ? 's' : ''} libre${w.crews > 1 ? 's' : ''}.`);
  needOrder(s, 'obra');
  const extra = round2((w.cost - w.paid) * .1);
  w.cost = round2(w.cost + extra); w.status = 'active'; w.resumed = s.week;
  return {extra};
}
export function cancelQuote(s, id) {
  const w = s.works.find(w => w.id === id && w.status === 'active');
  const st = workStatus(s, w), builtShare = w.phase === 1 ? w.inPhase / w.phases[1] : w.phase > 1 ? 1 : 0;
  return {saved: round2(w.cost - w.paid), penalty: w.phase >= 1 ? round2(w.cost * .12) : 0, incomplete: builtShare >= .5, builtShare, st};
}
export function cancelWork(s, id) {
  const w = s.works.find(w => w.id === id && w.status === 'active');
  if (!w) throw new Error('No hay obra que cancelar.');
  const q = cancelQuote(s, id);
  needOrder(s, 'obra');
  w.status = 'cancelled';
  if (q.penalty) s.payments.push({week: s.week + 1, amount: q.penalty, label: 'Penalización por rescindir ' + WORKS[w.type].name.toLowerCase(), kind: 'penalizacion'});
  const c = s.corridors[w.corridor];
  c.works = null;
  if (q.incomplete) { c.track = Math.max(10, c.track - 6); s.flags['halfwork-' + w.corridor] = true; addGroups(s, {territorios: -3, economia: -3}); pushGaceta(s, 'works', `Obra a medias en el ${CORRIDOR[w.corridor].short}: «el puente a ninguna parte» ya tiene club de fans.`); }
  return q;
}

// ---- servicio
export function serviceQuote(s, id, plan) {
  const c = s.corridors[id], now = serviceForecast(s, id), later = serviceForecast(s, id, plan);
  const costNow = corridorCost(s, id).total, costLater = corridorCost(s, id, plan.trains).total;
  const reasons = [];
  const free = trainsIdle(s).length + trainsOn(s, id).length;
  if (plan.trains > free) reasons.push(`Solo hay ${free} trenes disponibles para este corredor.`);
  if (plan.express > 0 && !s.milestones.includes('m2')) reasons.push('El servicio Exprés se desbloquea con el hito «Red regional».');
  if (!c.open) reasons.push('El corredor no está en servicio.');
  if (plan.trains < c.trains && pactActive(s, 'convenio')) reasons.push('El convenio de talleres prohíbe recortar trenes.');
  const later2 = {...later, punct: punctTarget(s, id, {trains: plan.trains}).value};
  return {now, later, costNow, costLater, netNow: now.revenue - costNow, netLater: later.revenue - costLater, reasons, ok: !reasons.length && ordersLeft(s) > 0, punctLater: later2.punct};
}
export function reorganize(s, id, plan) {
  const q = serviceQuote(s, id, plan);
  if (q.reasons.length) throw new Error(q.reasons[0]);
  needOrder(s, 'servicio');
  const c = s.corridors[id];
  let on = trainsOn(s, id);
  while (on.length > plan.trains) { const t = on.sort((a, b) => a.condition - b.condition)[0]; t.corridor = null; on = trainsOn(s, id); }
  for (const t of trainsIdle(s).sort((a, b) => b.condition - a.condition)) { if (on.length >= plan.trains) break; t.corridor = id; on = trainsOn(s, id); }
  Object.assign(c, {express: plan.express || 0, fare: plan.fare ?? c.fare, fareX: plan.fareX ?? c.fareX});
  operate(s, id, true);
  return q;
}
export function openQuote(s, id) {
  const def = CORRIDOR[id], c = s.corridors[id], reasons = [];
  if (c.open) reasons.push('Ya está en servicio.');
  if (def.territory && !s.territories[def.territory]) reasons.push('Necesitas la licencia de ' + TERRITORIES[def.territory].name + '.');
  if (!def.territory && !s.milestones.includes('m1') && id !== 'mediterraneo') reasons.push('Se abre con el hito «Andenes con gente».');
  if (c.track < 40) reasons.push(`La vía está al ${Math.round(c.track)} %: hay que renovarla antes (mínimo 40 %).`);
  if (!trainsIdle(s).length) reasons.push('No tienes ningún tren libre.');
  if (pactActive(s, 'no-agresion') && id === 'extremadura') reasons.push('Rompería el pacto con Autocares Meseta (puedes romperlo: Íñigo filtrará).');
  const f = serviceForecast(s, id, {trains: Math.min(2, trainsIdle(s).length), express: 0, punct: punctTarget(s, id, {trains: 2}).value});
  return {cost: def.openCost || 0, reasons, forecast: f, costWeekly: corridorCost({...s, corridors: {...s.corridors, [id]: {...c, open: true}}}, id, Math.min(2, trainsIdle(s).length)).total};
}
export function openCorridor(s, id, trains = 1, force = false) {
  const q = openQuote(s, id), blocking = q.reasons.filter(r => !(force && r.startsWith('Rompería')));
  if (blocking.length) throw new Error(blocking[0]);
  spend(s, q.cost, 'apertura');
  needOrder(s, 'servicio');
  const c = s.corridors[id]; c.open = true;
  c.punct = punctTarget(s, id, {trains}).value - 6;
  for (const t of trainsIdle(s).sort((a, b) => b.condition - a.condition).slice(0, trains)) t.corridor = id;
  operate(s, id, true);
  if (id === 'extremadura' && pactActive(s, 'no-agresion')) breakPact(s, s.pacts.find(p => p.id === 'no-agresion' && p.status === 'active'), 'Abriste Extremadura');
  pushGaceta(s, 'good', `Tenfe abre el ${CORRIDOR[id].name}: «Llevábamos años esperando», dice una señora con un bocadillo.`);
  return q;
}
export function sendRevision(s, trainId) {
  const t = s.fleet.find(t => t.id === trainId);
  if (!t || t.status !== 'service') throw new Error('Ese tren no está disponible para revisión.');
  const cost = revisionCost(s);
  if (cost > s.cash) throw new Error('No hay caja para la revisión.');
  needOrder(s, 'servicio');
  spend(s, cost);
  const corr = t.corridor;
  Object.assign(t, {status: 'revision', weeks: revisionWeeks(s), corridor: null, back: corr});
  if (corr) operate(s, corr, true);
  return {cost, weeks: t.weeks};
}
export const revisionCost = s => round2(.18 * (1 + mod(s, 'revisionCost')));
export const revisionWeeks = s => hasTech(s, 'contrato') ? 1 : 2;

// ---- capacidad
export function hireCrew(s, kind = 'own') {
  if (kind === 'sub' && !s.milestones.includes('m1')) throw new Error('Las cuadrillas subcontratadas se desbloquean con el hito «Andenes con gente».');
  const upfront = kind === 'own' ? CREW.hire : 0;
  if (upfront > s.cash) throw new Error('No hay caja para contratar.');
  needOrder(s, 'capacidad');
  spend(s, upfront);
  if (kind === 'own') { s.crews.hiring.push({week: s.week + CREW.weeks}); addGroups(s, {trabajadores: 3}); }
  else s.crews.sub.push({until: s.week + CREW.subWeeks});
}
export function fireCrew(s) {
  if (s.crews.own <= 1) throw new Error('No puedes quedarte sin cuadrillas propias.');
  if (crewsFree(s) < 1) throw new Error('Todas las cuadrillas están trabajando en una obra.');
  if (pactActive(s, 'convenio')) throw new Error('El convenio de talleres prohíbe despidos.');
  needOrder(s, 'capacidad');
  s.crews.own--; addGroups(s, {trabajadores: -8}); spend(s, Math.min(s.cash, .15));
}
export function rentTrain(s) {
  needOrder(s, 'capacidad');
  s.fleet.push({id: 't' + s.nextId++, name: 'Alquilado ' + (s.fleet.filter(t => t.rented).length + 1), offer: 'kafka', condition: 78, status: 'service', corridor: null, weeks: 0, rented: true, until: s.week + RENT.weeks});
}

// ---- compras
export function trainQuote(s, offerId, kickback = false) {
  const o = OFFER[offerId];
  let price = o.price * (o.used ? 1 - mod(s, 'usedDiscount') : 1) * (kickback ? 1.1 : 1);
  const deposit = round2(price * (o.used ? 1 : .4)), rest = round2(price - deposit);
  const weekly = TRAIN_RUN.crew + TRAIN_RUN.energy + TRAIN_RUN.upkeep;
  return {offer: o, price: round2(price), deposit, rest, arrives: s.week + o.weeks, weekly, condition: o.used ? Math.round(52 + mod(s, 'usedDiscount') * 60) : 100,
    reasons: deposit > s.cash ? ['No hay caja para la entrada.'] : []};
}
export function buyTrain(s, offerId, kickback = false) {
  const q = trainQuote(s, offerId, kickback);
  if (q.reasons.length) throw new Error(q.reasons[0]);
  needOrder(s, 'compra');
  spend(s, q.deposit);
  if (q.rest) s.payments.push({week: q.arrives, amount: q.rest, label: 'Pago a la entrega · ' + q.offer.model, kind: 'compra'});
  const names = ['Meseta', 'Duero', 'Ebro', 'Tajo', 'Sil', 'Júcar', 'Segura', 'Pisuerga', 'Miño', 'Genil', 'Turia', 'Esla', 'Arlanza', 'Jalón', 'Huerva', 'Cinca'];
  s.fleet.push({id: 't' + s.nextId++, name: names[s.fleet.length % names.length], offer: offerId, condition: q.condition, status: 'arriving', corridor: null, weeks: q.offer.weeks});
  if (kickback) takeKickback(s, q.price, 'compra', offerId);
  if (offerId === 'bcbb') s.flags.bcbb = (s.flags.bcbb || 0) + 1;
  return q;
}
export function sellTrain(s, trainId) {
  const t = s.fleet.find(t => t.id === trainId);
  if (!t || t.rented) throw new Error('Ese tren no se puede vender.');
  const value = round2(OFFER[t.offer].price * .55 * t.condition / 100);
  const corr = t.corridor;
  s.fleet = s.fleet.filter(x => x !== t); s.cash = round2(s.cash + value);
  if (corr) operate(s, corr, true);
  return value;
}

// ---- acuerdos: préstamos, deuda, territorios y pactos
export const LOANS = [{amount: 4, years: 3, rate: .05, need: 'm0'}, {amount: 8, years: 4, rate: .055, need: 'm1'}, {amount: 12, years: 5, rate: .06, need: 'm3'}];
export function loanQuote(s, amount) {
  const l = LOANS.find(l => l.amount === amount);
  if (!l) throw new Error('Importe de préstamo no disponible.');
  const q = l.years * 4, per = round2(amount / q * (1 + l.rate * l.years / 2));
  const reasons = [];
  if (!s.milestones.includes(l.need)) reasons.push('Este préstamo se desbloquea con el hito «' + MILESTONES.find(m => m.id === l.need).name + '».');
  if (pactActive(s, 'contrato-programa')) reasons.push('El contrato-programa con Hacienda prohíbe préstamos nuevos.');
  if (sum(s.loans, x => x.balance) + amount > 20) reasons.push('El banco no presta más de 20 M€ en total.');
  return {amount, installments: q, per, first: s.week + 13, rate: l.rate, total: round2(per * q), reasons};
}
export function takeLoan(s, amount) {
  const q = loanQuote(s, amount);
  if (q.reasons.length) throw new Error(q.reasons[0]);
  needOrder(s, 'acuerdo');
  s.cash = round2(s.cash + amount);
  const id = 'L' + s.nextId++;
  s.loans.push({id, amount, balance: amount, rate: q.rate, installments: q.installments, week: s.week});
  s.flags.lastLoan = s.week;
  for (let k = 0; k < q.installments; k++) s.payments.push({week: q.first + k * 13, amount: q.per, label: `Préstamo de ${fmt(amount)} · cuota ${k + 1}/${q.installments}`, kind: 'prestamo', loan: id});
  return q;
}
export function licenseTerritory(s, id) {
  const t = TERRITORIES[id];
  if (!s.milestones.includes('m1')) throw new Error('Las licencias se desbloquean con el hito «Andenes con gente».');
  if (s.territories[id]) throw new Error('Ya tienes esa licencia.');
  if (t.license > s.cash) throw new Error('No hay caja para la licencia.');
  needOrder(s, 'acuerdo');
  spend(s, t.license); s.territories[id] = s.week;
  addGroups(s, {territorios: 3});
  pushGaceta(s, 'good', `Tenfe pide la licencia para operar en ${t.name}. Los alcaldes sacan las bandas de música por si acaso.`);
}

// ---- pactos
export function pactTerms(p) { const d = PACT[p.id]; return p.cheap ? {...d, ...d.cheaper, gives: d.cheaper.gives || d.gives, task: d.cheaper.task || d.task, reward: d.cheaper.reward || d.reward, upkeep: d.cheaper.upkeep || d.upkeep, check: d.cheaper.check || d.check} : d; }
export function pactActive(s, id) { return s.pacts.some(p => p.id === id && p.status === 'active'); }
export const activePacts = s => s.pacts.filter(p => p.status === 'active');
export function respondPact(s, id, answer) {
  const offer = s.offers.find(o => o.id === id);
  if (!offer) throw new Error('Esa propuesta ya no está sobre la mesa.');
  const d = PACT[id];
  if (answer === 'reject') { s.offers = s.offers.filter(o => o !== offer); s.pactLog.push({id, week: s.week, result: 'rechazado'}); if (d.person === 'mayor') addGroups(s, {territorios: -2}); return {result: 'rejected'}; }
  if (activePacts(s).length >= MAX_PACTS) throw new Error('Ya tienes dos pactos activos: cumple o rompe uno antes.');
  if (answer === 'negotiate' && offer.negotiated) throw new Error('Ya habéis negociado: ahora es sí o no.');
  needOrder(s, 'acuerdo');
  if (answer === 'negotiate') {
    offer.negotiated = true;
    if (rand(s) < d.cheaper.chance + (s.groups[groupOfPerson(d.person)] - 45) / 200) {
      s.offers = s.offers.filter(o => o !== offer); return {result: 'cheaper', pact: signPact(s, id, true)};
    }
    return {result: 'refused'};
  }
  s.offers = s.offers.filter(o => o !== offer);
  return {result: 'accepted', pact: signPact(s, id, false)};
}
function groupOfPerson(p) { return {mayor: 'territorios', workshop: 'trabajadores', treasury: 'economia', adif: 'economia', riders: 'viajeros', minister: 'viajeros', successor: 'viajeros', president: 'territorios', rival: 'economia'}[p] || 'viajeros'; }
function signPact(s, id, cheap) {
  const p = {id, cheap, start: s.week, deadline: s.week + (cheap && PACT[id].cheaper.weeks || PACT[id].weeks), status: 'active', progress: 0, finishedAtStart: s.finished, quarters: []};
  s.pacts.push(p);
  const t = pactTerms(p);
  applyGives(s, t.gives);
  if (t.task?.type === 'station') s.flags.stationTask = {pact: id, cost: t.task.cost, crewWeeks: t.task.crewWeeks, started: false};
  if (t.gives?.loanCrew) s.crews.loan.push({until: s.week + t.gives.loanCrew});
  if (t.gives?.ospBonus) s.ospBonus += t.gives.ospBonus;
  s.pactLog.push({id, week: s.week, result: cheap ? 'firmado (rebajado)' : 'firmado'});
  return p;
}
function applyGives(s, g = {}) {
  if (g.groups) addGroups(s, g.groups, true);
  if (g.stars) s.stars += g.stars;
  if (g.cash) s.cash = round2(s.cash + g.cash);
}
/** Construir el apeadero de Paco (orden de obra). */
export function buildStation(s) {
  const t = s.flags.stationTask;
  if (!t || t.started) throw new Error('No hay ningún apeadero pendiente.');
  if (crewsFree(s) < 1) throw new Error('Necesitas una cuadrilla libre cinco semanas.');
  if (t.cost / t.crewWeeks > s.cash) throw new Error('No hay caja para el apeadero.');
  needOrder(s, 'obra');
  t.started = s.week;
  s.works.push({id: 'w' + s.nextId++, corridor: 'norte', type: 'apeadero', mode: 'fases', phases: [1, t.crewWeeks - 2, 1], phase: 0, inPhase: 0, cost: t.cost, paid: 0, crews: 1, status: 'active', started: s.week, station: true});
}
function breakPact(s, p, why) {
  if (!p) return;
  p.status = 'broken'; p.why = why;
  const t = pactTerms(p), pen = t.penalty || {};
  if (pen.groups) addGroups(s, pen.groups, true);
  if (pen.cash) s.payments.push({week: s.week + 1, amount: -pen.cash, label: 'Indemnización por incumplir: ' + PACT[p.id].title, kind: 'penalizacion'});
  if (pen.grudge) s.cloacas.grudges.push(pen.grudge);
  if (pen.strike) s.strike = s.week + pen.strike;
  if (pen.slowPermits) s.slowPermits = s.week + pen.slowPermits;
  if (pen.ospCut) s.ospCut += pen.ospCut;
  if (pen.repayOsp && p.quarters.length) s.payments.push({week: s.week + 2, amount: round2(sum(p.quarters, q => q.bonus)), label: 'Devolución del contrato-programa', kind: 'penalizacion'});
  if (pen.audit) s.flags.audit = s.week + 2;
  if (pen.leak) exposeSecret(s, s.cloacas.secrets.find(x => !s.cloacas.exposed.includes(x)) || 'pacto', true);
  if (t.gives?.ospBonus) s.ospBonus = Math.max(0, s.ospBonus - t.gives.ospBonus);
  s.pactLog.push({id: p.id, week: s.week, result: 'incumplido'});
  s.decisions.push({kind: 'notice', line: 'pact-broken', title: 'Pacto incumplido: ' + PACT[p.id].title, text: (why ? why + '. ' : '') + t.consequence});
  if (PACT[p.id].person === 'mayor') s.cloacas.grudges.push('mayor');
}
function fulfilPact(s, p) {
  p.status = 'done'; p.doneWeek = s.week;
  const t = pactTerms(p);
  if (t.reward?.cash) { s.cash = round2(s.cash + t.reward.cash); }
  if (t.gives?.ospBonus) s.ospBonus = Math.max(0, s.ospBonus - t.gives.ospBonus);
  s.stars += 3;
  s.pactLog.push({id: p.id, week: s.week, result: 'cumplido'});
  s.decisions.push({kind: 'notice', line: 'pact-done', title: 'Pacto cumplido: ' + PACT[p.id].title, text: t.reward?.cash ? `Cobras ${fmt(t.reward.cash)} y 3 ★.` : 'Ganas 3 ★ y la confianza de ' + personName(PACT[p.id].person) + '.'});
}
function pactCheck(s, p) {
  const t = pactTerms(p), ess = ['norte', 'levante', 'sur'];
  switch (t.check) {
    case 'essentials85': return ess.every(id => s.corridors[id].punct >= 85);
    case 'essentials80': return ess.every(id => s.corridors[id].punct >= 80);
    case 'finishAny': return s.finished > p.finishedAtStart;
    case 'finish3': return s.finished >= p.finishedAtStart + 3;
    case 'finish2': return s.finished >= p.finishedAtStart + 2;
    case 'territoryOpen': return Object.values(TERRITORIES).some(t => s.corridors[t.corridor].open && s.corridors[t.corridor].trains > 0);
    case 'ordinaryQuarters': return p.quarters.filter(q => q.ordinary >= 0).length >= 2;
    default: return true;
  }
}
function updatePacts(s, acc) {
  for (const p of activePacts(s)) {
    const t = pactTerms(p);
    if (t.check === 'ordinaryQuarters' && quarterEnd(s.week)) p.quarters.push({week: s.week, ordinary: sum(s.hist.slice(-13), h => h.ordinary), bonus: t.gives.ospBonus || 0});
    if (t.rule === 'noLoans' && s.flags.lastLoan >= p.start) { breakPact(s, p, 'Pediste un préstamo'); continue; }
    if (t.rule === 'noCuts' && s.flags.cut > p.start) { breakPact(s, p, 'Recortaste trenes o cuadrillas'); continue; }
    if (t.task?.type === 'station') {
      const st = s.flags.stationTask;
      if (st?.done) { fulfilPact(s, p); s.flags.stationTask = null; continue; }
    }
    if (t.check && t.check !== 'ordinaryQuarters' && pactCheck(s, p) && !t.task) { fulfilPact(s, p); continue; }
    if (s.week >= p.deadline) {
      if (t.task?.type === 'pay') {
        if (s.cash >= t.task.cost) { s.cash = round2(s.cash - t.task.cost); fulfilPact(s, p); } else breakPact(s, p, 'No pagaste los gastos de coordinación');
      } else if (t.rule && !t.check && !t.task) fulfilPact(s, p);
      else if (pactCheck(s, p) && !t.task) fulfilPact(s, p);
      else breakPact(s, p, 'Se acabó el plazo');
    }
  }
}
function offerPacts(s) {
  if (s.offers.length >= 2) return;
  if (s.week === 3 && !s.pactLog.length) { s.offers.push({id: 'estacion-paco', week: s.week, expires: s.week + 3}); return; }
  if (s.week < 6 || rand(s) > .09) return;
  const used = new Set([...s.pacts.map(p => p.id), ...s.offers.map(o => o.id), ...s.pactLog.filter(l => l.result === 'rechazado' && s.week - l.week < 40).map(l => l.id)]);
  const list = PACTS.filter(p => p.earliest <= s.week && !used.has(p.id) && !(p.person === 'successor' && s.week < 209) && !(p.person === 'minister' && s.week > 208));
  if (!list.length) return;
  s.offers.push({id: pick(s, list).id, week: s.week, expires: s.week + 3});
}

// ---- tecnología
export function techState(s, id) {
  const t = TECH[id], reasons = [];
  if (hasTech(s, id)) return {owned: true, reasons};
  if (!s.milestones.includes(TIER_MILESTONE[t.tier])) reasons.push('Nivel ' + t.tier + ': necesita el hito «' + MILESTONES.find(m => m.id === TIER_MILESTONE[t.tier]).name + '».');
  for (const n of t.needs || []) if (!hasTech(s, n)) reasons.push('Antes: ' + TECH[n].name + '.');
  if (s.stars < t.stars) reasons.push(`Faltan ${t.stars - s.stars} ★.`);
  if (s.cash < t.cost) reasons.push('Falta caja.');
  return {owned: false, reasons, ok: !reasons.length};
}
export function research(s, id) {
  const st = techState(s, id), t = TECH[id];
  if (st.owned) throw new Error('Ya la tienes.');
  if (st.reasons.length) throw new Error(st.reasons[0]);
  s.stars -= t.stars; spend(s, t.cost); s.techs.push(id);
  if (t.mods?.groups) addGroups(s, t.mods.groups, true);
  pushGaceta(s, 'good', `Tenfe estrena «${t.name}». Un portavoz asegura que «es tecnología de verdad».`);
}

// ---- megaproyectos
export function achievement(s, id) {
  const a = ACHIEVEMENTS[id];
  const c = a.corridor && s.corridors[a.corridor];
  switch (a.kind) {
    case 'punct': return {ok: c.open && c.punct >= a.value, value: Math.round(c.punct) + ' %'};
    case 'reliable': { const n = CORRIDORS.filter(d => s.corridors[d.id].open && s.corridors[d.id].trains > 0 && s.corridors[d.id].punct >= a.value).length; return {ok: n >= a.count, value: n + '/' + a.count}; }
    case 'fleet': { const n = s.fleet.filter(t => !t.rented && t.status !== 'arriving').length; return {ok: n >= a.value, value: n + '/' + a.value}; }
    case 'cash': return {ok: s.cash >= a.value, value: fmt(s.cash)};
    case 'milestone': return {ok: s.milestones.includes(a.id), value: Math.round(totalPax(s)) + ' mil/sem'};
    case 'group': return {ok: s.groups[a.group] >= a.value, value: Math.round(s.groups[a.group]) + ' %'};
    case 'tech': return {ok: hasTech(s, a.id), value: hasTech(s, a.id) ? 'sí' : 'no'};
    case 'open': return {ok: c.open && c.trains > 0, value: c.open ? 'en servicio' : 'sin servicio'};
    case 'streak': return {ok: c.streak >= a.weeks, value: c.streak + '/' + a.weeks + ' sem'};
    case 'calm': return {ok: s.incidentFree >= a.weeks, value: s.incidentFree + '/' + a.weeks + ' sem'};
    case 'ordinary': { const h = s.hist.slice(-a.weeks); return {ok: h.length >= a.weeks && h.every(x => x.ordinary >= 0), value: h.filter(x => x.ordinary >= 0).length + '/' + a.weeks}; }
    case 'pactDone': { const ok = s.pacts.some(p => p.status === 'done' && (!a.person || PACT[p.id].person === a.person)); return {ok, value: ok ? 'sí' : 'no'}; }
    case 'clean': return {ok: s.cloacas.stage === 0, value: JUDICIAL[s.cloacas.stage]};
  }
  return {ok: false, value: '?'};
}
export function megaState(s, id) {
  const m = MEGA[id], st = s.megas[id] || {stage: 0}, next = m.stages[st.stage];
  const reasons = [];
  if (!s.milestones.includes(m.tier)) reasons.push('Se desbloquea con el hito «' + MILESTONES.find(x => x.id === m.tier).name + '».');
  if (!next) return {done: true, stage: st.stage, reasons: [], m};
  const needs = next.needs.map(n => ({id: n, label: ACHIEVEMENTS[n].label, ...achievement(s, n)}));
  if (st.active) return {active: st.active, stage: st.stage, next, needs, reasons, m};
  for (const n of needs) if (!n.ok) reasons.push('Logro pendiente: ' + n.label + '.');
  if (crewsFree(s) < next.crews) reasons.push(`Necesita ${next.crews} cuadrilla${next.crews > 1 ? 's' : ''} libre${next.crews > 1 ? 's' : ''}.`);
  if (s.cash < next.cost / next.weeks) reasons.push('Falta caja para el primer pago.');
  return {stage: st.stage, next, needs, reasons, ok: !reasons.length, m};
}
export function startMegaStage(s, id, kickback = false) {
  const st = megaState(s, id);
  if (st.done) throw new Error('Megaproyecto terminado.');
  if (st.active) throw new Error('Esta etapa ya está en obras.');
  if (st.reasons.length) throw new Error(st.reasons[0]);
  needOrder(s, 'obra');
  const cost = round2(st.next.cost * (kickback ? 1.1 : 1));
  s.megas[id] ||= {stage: 0};
  s.megas[id].active = {cost, paid: 0, left: st.next.weeks, total: st.next.weeks, crews: st.next.crews, started: s.week};
  if (kickback) takeKickback(s, cost, 'megaproyecto');
}

// ---- corrupción
function takeKickback(s, base, kind, offer) {
  const k = s.cloacas, amount = round2(base * .07 * (1 + mod(s, 'kickback')));
  k.cajaB = round2(k.cajaB + amount); k.suspicion += 6; k.evidence += 5;
  if (!k.secrets.includes('comision')) k.secrets.push('comision');
  if (offer === 'bcbb' && !s.flags.yateOffered) s.flags.yateNext = s.week + 2;
  return amount;
}
export function bribeState(s, id) {
  const b = BRIBE[id], reasons = [];
  if (b.needs === 'investigation' && !s.cloacas.stage) reasons.push('No hay ningún juez al que sobornar (todavía).');
  if (s.cloacas.cajaB < b.cost && s.cash < b.cost) reasons.push('Ni caja B ni caja A llegan.');
  return {reasons, ok: !reasons.length, fromB: s.cloacas.cajaB >= b.cost};
}
export function bribe(s, id) {
  const b = BRIBE[id], st = bribeState(s, id), k = s.cloacas;
  if (st.reasons.length) throw new Error(st.reasons[0]);
  if (st.fromB) k.cajaB = round2(k.cajaB - b.cost); else s.cash = round2(s.cash - b.cost);
  const factor = st.fromB ? 1 : 1.8; // pagar con caja A deja factura de «asesoría»
  k.suspicion += b.suspicion; k.evidence += b.evidence * factor;
  if (!k.secrets.includes('sobres')) k.secrets.push('sobres');
  const g = b.gives, out = {ok: true, text: b.effect};
  if (g.fastPermits) k.fastPermits = s.week + g.fastPermits;
  if (g.groups) addGroups(s, g.groups);
  if (g.skipTests) { k.skipTests = true; k.risk += g.risk; }
  if (g.muffle) k.muffle += g.muffle;
  if (g.ospNext) k.ospNext += g.ospNext;
  if (g.endStrike) s.strike = 0;
  if (g.judgeBack) {
    if (rand(s) < .3) { exposeSecret(s, 'juez', true); out.ok = false; out.text = 'El juez ha grabado la conversación. Muy mal.'; }
    else { k.stage = Math.max(0, k.stage - 1); k.evidence = Math.max(0, k.evidence - 10); }
  }
  if (g.charo) {
    if (rand(s) < .75) { exposeSecret(s, 'charo', true); out.ok = false; out.text = 'Charo ha reenviado tu sobre a Anticorrupción.'; }
    else { k.ospNext += 1.4; out.text = 'Charo acepta… y lo apunta en su libreta. +1,4 M€ el próximo trimestre.'; }
  }
  s.flags.bribes = (s.flags.bribes || 0) + 1;
  return out;
}
const SCANDALS = {
  comision: {line: 'sc-yate', title: 'Caso Comisiones', hit: 9}, traviesas: {line: 'sc-traviesas', title: 'Caso Traviesas', hit: 12}, yate: {line: 'sc-yate', title: 'Caso Yate', hit: 10},
  enchufe: {line: 'sc-enchufe', title: 'Caso Enchufe', hit: 8}, mariscada: {line: 'sc-mariscada', title: 'La Mariscada de Navidad', hit: 7}, sobres: {line: 'sc-sobres', title: 'Caso Sobres de la Catenaria', hit: 11},
  juez: {line: 'sc-juez', title: 'Caso Toga', hit: 18}, charo: {line: 'sc-charo', title: 'El sobre a Hacienda', hit: 14}, pacto: {line: 'sc-sobres', title: 'El pacto secreto con Autocares Meseta', hit: 9},
};
function exposeSecret(s, secret, now = false) {
  const k = s.cloacas, sc = SCANDALS[secret] || SCANDALS.sobres;
  if (!k.exposed.includes(secret)) k.exposed.push(secret);
  const hit = sc.hit * (1 + mod(s, 'scandal')) * (k.muffle > 0 ? .5 : 1);
  if (k.muffle > 0) k.muffle--;
  addGroups(s, {viajeros: -hit, territorios: -hit * .6, trabajadores: -hit * .5, economia: -hit * .8});
  k.suspicion += 15; k.evidence += 10; s.stars = Math.max(0, s.stars - 4);
  if (secret === 'juez') { k.stage = Math.min(3, k.stage + 2); k.suspicion += 20; }
  if (secret === 'charo') { k.stage = Math.max(k.stage, 1); }
  s.incidentFree = 0;
  pushGaceta(s, 'corruption', `${sc.title}: la Gaceta del Raíl publica los papeles.`);
  s.decisions.push({kind: 'scandal', id: secret, line: sc.line, title: sc.title, text: LINES[sc.line].text, choices: [
    {label: 'Negarlo todo', note: 'A veces cuela. A veces no.', fx: 'deny'},
    {label: 'Cesar a Benito Balasto', note: 'Las pruebas bajan, la plantilla se enfada y Benito no olvida.', fx: 'scapegoat'},
    {label: 'Comisión de investigación interna', note: 'Menos daño ahora, más sospecha luego.', fx: 'commission'},
    ...(k.cajaB >= .3 ? [{label: 'Comprar el silencio del periodista (0,3 M€ de caja B)', note: 'Se acaba la noticia. Otra persona más lo sabe.', fx: 'buy'}] : []),
  ]});
}
/** Suceso corrupto propuesto por un personaje. */
function offerCorruption(s) {
  const k = s.cloacas, f = s.flags;
  if (f.traviesasWork && !f.traviesasAsked && s.works.some(w => w.id === f.traviesasWork && w.status === 'active' && w.phase === 1)) {
    f.traviesasAsked = true;
    return {kind: 'corruption', id: 'traviesas', line: 'cor-traviesas', title: 'Una propuesta de Benito', choices: [
      {label: 'Certificar las traviesas «fantasma»', note: '+0,5 M€ en caja B. Sospecha y pruebas suben.', fx: 'traviesas'},
      {label: 'Decirle que no', note: 'Benito se lo toma mal, pero sin pruebas.', fx: 'none'}]};
  }
  if (f.yateNext && s.week >= f.yateNext && !f.yateOffered) {
    f.yateOffered = true;
    return {kind: 'corruption', id: 'yate', line: 'cor-yate', title: 'Una invitación de Íñigo', choices: [
      {label: 'Subir al yate', note: '+0,3 M€ en caja B y 3 ★ de buen humor. Puede haber fotos.', fx: 'yate'},
      {label: 'Quedarte en tierra', note: 'Íñigo te llama aburrido.', fx: 'none'}]};
  }
  if (s.week > 30 && s.week < 200 && !f.enchufeAsked && rand(s) < .02) {
    f.enchufeAsked = true;
    return {kind: 'corruption', id: 'enchufe', line: 'cor-enchufe', title: 'El sobrino de la ministra', choices: [
      {label: 'Contratar a Borja como jefe de cuadrilla', note: 'La ministra te deberá una (+0,6 M€ el próximo trimestre). Tus obras irán algo más lentas.', fx: 'enchufe'},
      {label: 'Decirle a la ministra que no hay plaza', note: 'Ministra disgustada: -4 de los viajeros.', fx: 'enchufe-no'}]};
  }
  if (s.week % 52 === 50 && !f['mariscada' + yearOf(s.week)] && rand(s) < .6) {
    f['mariscada' + yearOf(s.week)] = true;
    return {kind: 'corruption', id: 'mariscada', line: 'cor-mariscada', title: 'La cena de Navidad', choices: [
      {label: 'Cargarla a «formación en seguridad»', note: '-0,09 M€, +6 de la plantilla. Puede salir en la prensa.', fx: 'mariscada'},
      {label: 'Cena de empresa en el bar de la estación', note: '-0,01 M€ y algo de mal humor.', fx: 'mariscada-no'}]};
  }
  return null;
}
function extortion(s) {
  const k = s.cloacas, f = s.flags;
  const secret = k.secrets.find(x => !k.exposed.includes(x));
  if (!secret) return null;
  if (s.week < (f.nextExtortion || 0)) return null;
  const who = k.grudges.includes('mayor') && !f.extPaco ? 'paco' : (secret === 'traviesas' && k.stage >= 1 && !f.extBenito) ? 'benito' : (k.suspicion > 18 && !f.extInigo) ? 'inigo' : null;
  if (!who || rand(s) > .25) return null;
  f.nextExtortion = s.week + 20;
  const price = {paco: .25, benito: .3, inigo: .4}[who];
  f['ext' + who[0].toUpperCase() + who.slice(1)] = true;
  return {kind: 'extortion', id: who, secret, line: 'ext-' + who, title: {paco: 'Paco amenaza con hablar', benito: 'Benito quiere un aumento', inigo: 'Íñigo tiene fotos'}[who], price, choices: [
    {label: `Pagar ${fmt(price)}${k.cajaB >= price ? ' de caja B' : ' de caja A'}`, note: 'Silencio. Por ahora.', fx: 'pay'},
    {label: 'No pagar', note: 'Lo publicará.', fx: 'refuse'},
    ...(hasTech(s, 'abogados') ? [{label: 'Mandarle a los abogados', note: '50 %: se asusta y calla. 50 %: lo publica igual.', fx: 'lawyers'}] : []),
  ]};
}
function judicialWeek(s) {
  const k = s.cloacas;
  k.suspicion = Math.max(0, k.suspicion - .6);
  k.evidence = Math.max(0, k.evidence - .25 * (1 + mod(s, 'evidenceDecay')));
  if (k.risk > 0 && rand(s) < k.risk / 900) { // accidente por pruebas firmadas sin mirar
    s.decisions.push({kind: 'notice', line: 'sc-sobres', title: 'Descarrilamiento leve en una obra recién certificada', text: 'Nadie herido, por suerte. El inspector dice que no se acuerda de nada. La Gaceta sí.'});
    exposeSecret(s, 'sobres'); k.risk = 0;
  }
  for (const secret of k.secrets) if (!k.exposed.includes(secret) && rand(s) < .002 + k.suspicion / 3000 + k.evidence / 3500) { exposeSecret(s, secret); break; }
  if (k.stage === 0) {
    if (k.suspicion >= 35 && rand(s) < (k.suspicion - 30) / 160) { k.stage = 1; k.calm = 0; s.decisions.push({kind: 'notice', line: 'jud-1', title: 'Diligencias previas', text: LINES['jud-1'].text}); }
    return;
  }
  if (k.evidence < 8) { if (++k.calm >= 10) { k.stage = 0; k.calm = 0; s.decisions.push({kind: 'notice', line: 'stage-pass', title: 'Causa archivada', text: 'El juzgado archiva la causa por falta de pruebas. Respira.'}); } return; }
  k.calm = 0;
  const p = k.evidence / 420 * (1 + mod(s, 'judicial'));
  if (rand(s) < p) {
    k.stage++;
    if (k.stage === 2) { addGroups(s, {viajeros: -6, territorios: -6, trabajadores: -6, economia: -6}); s.decisions.push({kind: 'notice', line: 'jud-2', title: 'Imputado', text: LINES['jud-2'].text}); }
    if (k.stage === 3) { addGroups(s, {viajeros: -10, territorios: -10, trabajadores: -10, economia: -10}); s.decisions.push({kind: 'notice', line: 'jud-3', title: 'Juicio oral', text: LINES['jud-3'].text}); }
    if (k.stage >= 4) endGame(s, 'lose', 'condena', 'Condenado e inhabilitado por corrupción.');
  }
  if (k.stage >= 2) addGroups(s, {viajeros: -.3, economia: -.3});
}

// ------------------------------------------------------------------ sucesos y decisiones
const EVENTS = [
  {id: 'averia', line: 'ev-averia', title: 'Avería grave', when: s => s.fleet.some(t => t.status === 'service' && t.corridor), weight: 3},
  {id: 'cable', line: 'ev-cable', title: 'Robo de cable', when: s => s.corridors.sur.open && s.corridors.sur.elec, weight: 1},
  {id: 'calor', line: 'ev-calor', title: 'Ola de calor', when: s => { const w = (s.week - 1) % 52; return w >= 25 && w <= 34; }, weight: 2},
  {id: 'nevada', line: 'ev-nevada', title: 'Nevada en la meseta', when: s => { const w = (s.week - 1) % 52; return w <= 7 || w >= 48; }, weight: 2},
  {id: 'huelga', line: 'ev-huelga', title: 'Huelga', when: s => s.groups.trabajadores < 38 && !pactActive(s, 'convenio') && !(s.strike > s.week), weight: 3},
  {id: 'viral', line: 'ev-viral', title: 'Un vídeo viral', when: s => s.week > 8, weight: 1},
  {id: 'desprendimiento', line: 'ev-desprendimiento', title: 'Desprendimiento', when: s => s.week > 10, weight: 1},
  {id: 'auditoria', line: 'ev-auditoria', title: 'Auditoría', when: s => s.cloacas.evidence > 12 || s.flags.audit, weight: 2},
  {id: 'fondos', line: 'ev-fondos', title: 'Fondos de Bruselas', when: s => s.week > 20, weight: 1},
  {id: 'visita', line: 'ev-visita', title: 'Visita de la ministra', when: s => s.week > 6 && s.week < 200, weight: 1},
  {id: 'tuneles', line: 'ev-tuneles', title: 'Trenes que no caben', when: s => s.flags.bcbb && s.corridors.cantabria.open && !s.flags.tuneles, weight: 4},
];
export function eventChoices(s, id) {
  const corr = s.fleet.find(t => t.status === 'service' && t.corridor)?.corridor || 'norte';
  switch (id) {
    case 'averia': return [{label: 'Horas extra en el taller (0,25 M€)', note: 'El tren vuelve la semana que viene.', fx: 'fix-fast'}, {label: 'Al taller tres semanas', note: 'Gratis, pero sin ese tren.', fx: 'fix-slow'}];
    case 'cable': return [{label: 'Reponer el cable ya (0,3 M€)', note: 'Sin retrasos.', fx: 'cable-fix'}, {label: 'Esperar al seguro', note: 'El Sur pierde 10 puntos de puntualidad dos semanas.', fx: 'cable-wait'}];
    case 'calor': return [{label: 'Reparar el aire acondicionado (0,2 M€)', note: '+2 de los viajeros.', fx: 'heat-fix'}, {label: 'Repartir abanicos con el logo', note: '-4 de los viajeros.', fx: 'heat-wait'}];
    case 'nevada': return [{label: 'Sacar la quitanieves (0,15 M€)', note: 'Pocas pérdidas.', fx: 'snow-fix'}, {label: 'Esperar a que salga el sol', note: 'El Norte pierde 15 puntos esta semana.', fx: 'snow-wait'}];
    case 'huelga': return [{label: 'Negociar: +2 % de nómina', note: 'Se acaba la huelga. +6 de la plantilla.', fx: 'strike-deal'}, {label: 'Aguantar', note: 'Dos semanas con el 40 % de ingresos.', fx: 'strike-hold'}, {label: 'Un sobre al delegado (0,2 M€)', note: 'Funciona. Huele.', fx: 'strike-bribe'}];
    case 'viral': return [{label: 'Contratarla para la campaña', note: '+5 de los viajeros y 3 ★.', fx: 'viral'}];
    case 'desprendimiento': return [{label: 'Mandar una cuadrilla (0,1 M€)', note: 'Una cuadrilla ocupada una semana; la vía abre enseguida.', fx: 'slide-crew'}, {label: 'Esperar a Adif', note: 'Corredor cortado tres semanas.', fx: 'slide-wait'}];
    case 'auditoria': return [{label: 'Colaborar con los auditores', note: s.cloacas.evidence > 20 ? 'Van a encontrar cosas.' : 'No hay nada que esconder. ¿No?', fx: 'audit-ok'}, ...(hasTech(s, 'destructora') ? [{label: 'Encender la destructora', note: 'Pruebas -15, sospecha +10.', fx: 'audit-shred'}] : [])];
    case 'fondos': return [{label: 'Aceptar y anunciarlo a bombo y platillo', note: '+0,5 M€ y 2 ★.', fx: 'funds'}];
    case 'visita': return [{label: 'Recibirla en Valladolid', note: s.corridors.norte.punct >= 80 ? 'El Norte va bien: +4 ★ y +4 de los viajeros.' : 'El Norte va mal: -4 de los viajeros.', fx: 'visit'}, {label: 'Inventarse una avería para que no venga', note: 'Ministra mosqueada.', fx: 'visit-no'}];
    case 'tuneles': return [{label: 'Pedir perdón y recortar los trenes', note: '-5 de los territorios, el BCBB no circula en Cantabria.', fx: 'tunnels'}];
  }
  return [{label: 'Entendido', fx: 'none'}];
}
function event(s, id) {
  const e = EVENTS.find(e => e.id === id);
  if (!e) return null;
  return {kind: 'event', id, line: e.line, title: e.title, text: LINES[e.line]?.text, choices: eventChoices(s, id)};
}
function randomEvent(s) {
  if (s.week === 2) return event(s, 'averia'); // la avería temprana que enseña la flota
  if (s.week < 5 || rand(s) > .2) return null;
  const list = EVENTS.filter(e => e.when(s));
  const total = sum(list, e => e.weight);
  let r = rand(s) * total;
  for (const e of list) { r -= e.weight; if (r <= 0) return event(s, e.id); }
  return null;
}
/** Responder a una decisión pendiente (sucesos, escándalos, extorsiones, impagos). No gasta órdenes. */
export function answer(s, index, choiceIndex) {
  const d = s.decisions[index];
  if (!d) throw new Error('No hay decisión.');
  const c = (d.choices || [{fx: 'none'}])[choiceIndex] ?? {fx: 'none'};
  const k = s.cloacas, payA = x => { s.cash = round2(s.cash - x); };
  let note = '';
  const trainHit = () => s.fleet.filter(t => t.status === 'service' && t.corridor).sort((a, b) => a.condition - b.condition)[0];
  switch (c.fx) {
    case 'fix-fast': { const t = trainHit(); if (t) { const corr = t.corridor; Object.assign(t, {status: 'broken', weeks: 1, corridor: null, back: corr}); operate(s, corr, true); } payA(.25); break; }
    case 'fix-slow': { const t = trainHit(); if (t) { const corr = t.corridor; Object.assign(t, {status: 'broken', weeks: 3, corridor: null, back: corr}); operate(s, corr, true); } break; }
    case 'cable-fix': payA(.3); break;
    case 'cable-wait': s.corridors.sur.incidentWeeks = 2; break;
    case 'heat-fix': payA(.2); addGroups(s, {viajeros: 2}); break;
    case 'heat-wait': addGroups(s, {viajeros: -4}); break;
    case 'snow-fix': payA(.15); s.corridors.norte.incidentNow = 3; break;
    case 'snow-wait': s.corridors.norte.incidentNow = 15; if (s.corridors.asturias.open) s.corridors.asturias.incidentNow = 15; break;
    case 'strike-deal': s.flags.payrollExtra = (s.flags.payrollExtra || 0) + .02; addGroups(s, {trabajadores: 6}); break;
    case 'strike-hold': s.strike = s.week + 2; addGroups(s, {trabajadores: -4, viajeros: -4}); break;
    case 'strike-bribe': payA(.2); k.suspicion += 8; k.evidence += 8; if (!k.secrets.includes('sobres')) k.secrets.push('sobres'); break;
    case 'viral': addGroups(s, {viajeros: 5}); s.stars += 3; break;
    case 'slide-crew': payA(.1); s.flags.slideCrew = 1; break;
    case 'slide-wait': { const open = CORRIDORS.filter(x => s.corridors[x.id].open && !s.corridors[x.id].works); const corr = pick(s, open).id; s.corridors[corr].closedUntil = s.week + 3; s.corridors[corr].closed = true; note = CORRIDOR[corr].name + ' cortado tres semanas.'; break; }
    case 'audit-ok': if (k.evidence > 20) { k.suspicion += 15; addGroups(s, {economia: -5}); } else { addGroups(s, {economia: 3}); } s.flags.audit = 0; break;
    case 'audit-shred': k.evidence = Math.max(0, k.evidence - 15); k.suspicion += 10; s.flags.audit = 0; break;
    case 'funds': s.cash = round2(s.cash + .5); s.stars += 2; break;
    case 'visit': if (s.corridors.norte.punct >= 80) { s.stars += 4; addGroups(s, {viajeros: 4}); } else addGroups(s, {viajeros: -4}); break;
    case 'visit-no': s.cloacas.grudges.push('minister'); break;
    case 'tunnels': addGroups(s, {territorios: -5}); s.flags.tuneles = true; break;
    // corrupción
    case 'traviesas': k.cajaB = round2(k.cajaB + .5 * (1 + mod(s, 'kickback'))); k.suspicion += 8; k.evidence += 10; k.secrets.push('traviesas'); break;
    case 'yate': k.cajaB = round2(k.cajaB + .3); s.stars += 3; k.suspicion += 6; k.evidence += 6; k.secrets.push('yate'); break;
    case 'enchufe': k.ospNext += .6; k.secrets.push('enchufe'); k.suspicion += 4; s.flags.borja = true; break;
    case 'enchufe-no': addGroups(s, {viajeros: -4}); s.cloacas.grudges.push('minister'); break;
    case 'mariscada': payA(.09); addGroups(s, {trabajadores: 6}); k.secrets.push('mariscada'); k.suspicion += 3; k.evidence += 4; break;
    case 'mariscada-no': payA(.01); addGroups(s, {trabajadores: -2}); break;
    case 'pay': { if (k.cajaB >= d.price) k.cajaB = round2(k.cajaB - d.price); else { payA(d.price); k.evidence += 4; } break; }
    case 'refuse': exposeSecret(s, d.secret); break;
    case 'lawyers': if (rand(s) < .5) exposeSecret(s, d.secret); else note = 'Se ha asustado. Por ahora.'; break;
    // escándalos
    case 'deny': if (rand(s) < .45) { addGroups(s, {viajeros: 4, economia: 3}); note = 'Ha colado. Más o menos.'; } else { addGroups(s, {viajeros: -6, territorios: -4, trabajadores: -3, economia: -5}); k.suspicion += 8; note = 'No ha colado: había fotos.'; } break;
    case 'scapegoat': k.evidence = Math.max(0, k.evidence - 15); addGroups(s, {trabajadores: -6}); k.grudges.push('adif'); s.slowPermits = Math.max(s.slowPermits, s.week + 26); note = 'Benito, cesado. Adif tardará más en darte permisos.'; break;
    case 'commission': addGroups(s, {viajeros: 3, economia: 2}); k.suspicion += 6; break;
    case 'buy': k.cajaB = round2(k.cajaB - .3); addGroups(s, {viajeros: 5, territorios: 3, trabajadores: 2, economia: 4}); k.evidence += 3; break;
    // impago
    case 'sell': { const t = s.fleet.filter(t => !t.rented && t.status !== 'arriving').sort((a, b) => a.condition - b.condition)[0]; if (t) note = 'Vendido ' + t.name + ' por ' + fmt(sellTrain(s, t.id)) + '.'; s.flags.cut = s.week; break; }
    case 'defer': { const w = s.works.find(w => w.status === 'active' && w.phase < 2); if (w) { w.status = 'paused'; s.corridors[w.corridor].works = null; w.pausedAt = s.week; note = WORKS[w.type]?.name + ' aplazada: se reanudará con un 10 % de sobrecoste.'; } break; }
    case 'restructure': { const due = s.payments.filter(p => p.week >= s.week && p.week < s.week + 13 && p.amount > 0); for (const p of due) { p.week += 13; p.amount = round2(p.amount * 1.08); } addGroups(s, {economia: -6}); s.flags.restructured = s.week; note = due.length + ' pagos aplazados un trimestre con un 8 % de recargo.'; break; }
    case 'cut': { const c2 = CORRIDORS.filter(x => s.corridors[x.id].open && s.corridors[x.id].trains > 1).sort((a, b) => (s.corridors[a.id].revenue - s.corridors[a.id].cost) - (s.corridors[b.id].revenue - s.corridors[b.id].cost))[0]; if (c2) { const t = trainsOn(s, c2.id)[0]; t.corridor = null; operate(s, c2.id, true); note = 'Un tren menos en el ' + c2.short + '.'; } addGroups(s, {viajeros: -4, territorios: -3}); s.flags.cut = s.week; break; }
    case 'rescue': { s.cash = round2(s.cash + 4); s.rescues.push({week: s.week, amount: 4}); for (let q = 1; q <= 4; q++) s.payments.push({week: s.week + 26 * q, amount: 1.1, label: 'Devolución del rescate de Hacienda', kind: 'rescate'}); addGroups(s, {economia: -8}); note = 'Hacienda te rescata con 4 M€. Queda en tu expediente.'; break; }
  }
  s.decisions.splice(index, 1);
  return note;
}
function insolvencyDecision(s) {
  return {kind: 'insolvency', line: 'fin-impago', title: 'Impago: no llegas a los pagos', text: LINES['fin-impago'].text, choices: [
    {label: 'Vender el tren en peor estado', note: 'Dinero hoy, menos capacidad mañana.', fx: 'sell'},
    {label: 'Aplazar una obra', note: 'Deja de pagarla; volverá con sobrecoste.', fx: 'defer'},
    {label: 'Renegociar la deuda', note: 'Los pagos del trimestre se aplazan 13 semanas con un 8 % de recargo.', fx: 'restructure'},
    {label: 'Recortar servicios', note: 'Un tren menos en el corredor que más pierde.', fx: 'cut'},
    {label: 'Pedir un rescate a Hacienda (4 M€)', note: 'Rescate extraordinario: no cuenta para ganar y Charo lo apunta.', fx: 'rescue'},
  ]};
}

// ------------------------------------------------------------------ apoyo, elecciones y popularidad
function addGroups(s, g, permanent = false) {
  for (const [k, v] of Object.entries(g)) { s.groups[k] = clamp(s.groups[k] + v, 0, 100); if (permanent) s.bonus[k] += v * .6; }
}
export function groupTargets(s) {
  const open = CORRIDORS.filter(d => s.corridors[d.id].open && s.corridors[d.id].trains > 0);
  const pax = sum(open, d => s.corridors[d.id].pax) || 1;
  const punct = sum(open, d => s.corridors[d.id].punct * s.corridors[d.id].pax) / pax;
  const fareIdx = sum(open, d => s.corridors[d.id].fare / d.fare * s.corridors[d.id].pax) / pax;
  const crowd = sum(open, d => s.corridors[d.id].lost) / pax;
  const terrOpen = Object.values(TERRITORIES).filter(t => s.corridors[t.corridor].open && s.corridors[t.corridor].trains > 0 && s.corridors[t.corridor].punct > 55).length;
  const terrLic = Object.keys(s.territories).length;
  const busyRatio = crewsBusy(s) / Math.max(1, crewTotal(s));
  const biz = open.filter(d => d.business);
  const bizPunct = biz.length ? avg(biz.map(d => s.corridors[d.id].punct)) : 60;
  const ord = s.hist.slice(-8), ordAvg = ord.length ? avg(ord.map(h => h.ordinary)) : 0;
  const rival = s.rival ? avg(s.rival.corridors.map(id => s.corridors[id].rivalShare || 0)) : 0;
  const megaStages = sum(Object.values(s.megas), m => m.stage || 0);
  const T = {
    viajeros: [['Base', 30], ['Puntualidad media ' + Math.round(punct) + ' %', (punct - 65) * 1.2], ['Precio de los billetes', (1 - fareIdx) * 40], ['Viajeros que se quedan en tierra', -Math.min(15, crowd * 60)]],
    territorios: [['Base', 25], ['Territorios con tren: ' + terrOpen, terrOpen * 10], ['Licencias pedidas: ' + terrLic, terrLic * 2], ['Apeadero de Villanueva', s.flags.stationNorte ? 4 : 0], ['Rencor de Paco', s.cloacas.grudges.includes('mayor') ? -5 : 0]],
    trabajadores: [['Base', 44], ['Cuadrillas propias: ' + s.crews.own, (s.crews.own - 2) * 4], ['Carga de trabajo', busyRatio > .99 && crewsBusy(s) > 0 ? -5 : 0], ['Subcontratas', -s.crews.sub.length * 2], ['Huelga en curso', s.strike > s.week ? -8 : 0], ['Mejoras de nómina', (s.flags.payrollExtra || 0) * 150]],
    economia: [['Base', 30], ['Corredores de negocio al ' + Math.round(bizPunct) + ' %', (bizPunct - 65) * .8], ['Resultado ordinario', ordAvg >= 0 ? 8 : Math.max(-12, ordAvg * 40)], ['Caja', s.cash >= 3 ? 4 : s.cash < 0 ? -15 : 0], ['Mediterráneo en servicio', s.corridors.mediterraneo.open ? 6 : 0], ['Etapas de megaproyecto: ' + megaStages, megaStages * 1.5], ['Cuota de Lowgo', -rival * 25]],
  };
  const out = {};
  for (const [g, rows] of Object.entries(T)) {
    if (s.bonus[g]) rows.push(['Pactos y medidas', s.bonus[g]]);
    if (s.cloacas.stage >= 2) rows.push(['Imputación judicial', -6 * (s.cloacas.stage - 1)]);
    out[g] = {value: clamp(sum(rows, r => r[1]), 0, 100), rows: rows.filter(r => Math.abs(r[1]) >= .5).map(([label, value]) => ({label, value}))};
  }
  return out;
}
export function support(s) { return sum(Object.entries(GROUPS), ([g, d]) => s.groups[g] * d.weight); }
export function electionForecast(s) {
  const t = groupTargets(s);
  const rows = Object.entries(GROUPS).map(([id, d]) => {
    const h = s.groupHist[id].slice(-26), mean = h.length ? avg(h) : s.groups[id];
    return {id, name: d.name, weight: d.weight, avg: mean, now: s.groups[id], target: t[id].value, contribution: mean * d.weight, causes: t[id].rows};
  });
  const vote = sum(rows, r => r.contribution);
  const next = ELECTIONS.find(w => w >= s.week);
  return {vote, rows, needed: 50, next, weeksLeft: next ? next - s.week : 0, win: vote >= 50};
}
function updateGroups(s) {
  const t = groupTargets(s);
  for (const g of Object.keys(GROUPS)) {
    s.groups[g] = clamp(s.groups[g] + (t[g].value - s.groups[g]) * .07, 0, 100);
    s.groupHist[g].push(round2(s.groups[g])); if (s.groupHist[g].length > 60) s.groupHist[g].shift();
  }
  for (const g of Object.keys(s.bonus)) s.bonus[g] *= .995;
}

// ------------------------------------------------------------------ hitos, etapas y programa
export function totalPax(s) { return sum(CORRIDORS, d => s.corridors[d.id].open ? s.corridors[d.id].pax : 0); }
export function nextMilestone(s) { return MILESTONES.find(m => !s.milestones.includes(m.id)); }
function checkMilestones(s, report) {
  const pax4 = avg(s.hist.slice(-4).map(h => h.pax));
  for (const m of MILESTONES) if (!s.milestones.includes(m.id) && pax4 >= m.pax) {
    s.milestones.push(m.id); s.stars += m.stars || 0; report.milestone = m;
    s.decisions.push({kind: 'milestone', line: 'milestone', title: 'Hito: ' + m.name, text: `Superas los ${m.pax}.000 viajeros por semana. Ganas ${m.stars} ★ y desbloqueas: ${m.unlocks.join(', ')}.`});
  }
}
export function stageProgress(s, idx = s.stageIdx) {
  const st = STAGES[idx], c = s.corridors, rows = [];
  if (!st) return null;
  const ess = ['norte', 'levante', 'sur'];
  switch (st.id) {
    case 's1': rows.push({label: 'Norte', value: Math.round(c.norte.punct) + ' %', target: '80 %', ok: c.norte.punct >= 80, pct: clamp((c.norte.punct - 62) / 18, 0, 1)});
      rows.push({label: 'Sin impagos', value: s.flags.defaulted ? 'impago' : 'al día', target: 'al día', ok: !s.flags.defaulted, pct: s.flags.defaulted ? 0 : 1}); break;
    case 's2': for (const id of ess) rows.push({label: CORRIDOR[id].short, value: Math.round(c[id].punct) + ' %', target: '80 %', ok: c[id].punct >= 80, pct: clamp((c[id].punct - 60) / 20, 0, 1)});
      rows.push({label: 'Reserva', value: fmt(s.cash), target: '3 M€', ok: s.cash >= 3, pct: clamp(s.cash / 3, 0, 1)}); break;
    case 's3': { const h = s.hist.slice(-26), m = avg(h.map(x => x.ordinary)); rows.push({label: 'Resultado (26 sem)', value: fmt(m) + '/sem', target: '≥ 0', ok: m >= 0 && h.length >= 26, pct: clamp(.5 + m * 2, 0, 1)});
      const f = electionForecast(s); rows.push({label: 'Encuestas', value: Math.round(f.vote) + ' %', target: '50 %', ok: f.vote >= 50, pct: clamp(f.vote / 50, 0, 1)});
      const done = PROGRAM.filter(p => s.program[p.id]).length; rows.push({label: 'Programa', value: done + '/' + PROGRAM.length, target: 'todo al final', ok: done >= 3, pct: done / PROGRAM.length}); break; }
    case 's4': { const n = Object.values(TERRITORIES).filter(t => c[t.corridor].open && c[t.corridor].trains > 0).length; rows.push({label: 'Territorios con tren', value: n + '/2', target: '2', ok: n >= 2, pct: n / 2});
      const share = s.rival ? 1 - avg(s.rival.corridors.map(id => c[id].open ? c[id].rivalShare : 1)) : 1; rows.push({label: 'Cuota frente a Lowgo', value: Math.round(share * 100) + ' %', target: '60 %', ok: share >= .6, pct: clamp(share / .6, 0, 1)}); break; }
    case 's5': { const n = CORRIDORS.filter(d => c[d.id].open && c[d.id].trains > 0 && avg(c[d.id].hist.slice(-12)) >= 85 && c[d.id].hist.length >= 12).length; rows.push({label: 'Corredores al 85 %', value: n + '/5', target: '5', ok: n >= 5, pct: n / 5});
      const r = s.rescues.filter(x => x.week >= 313).length; rows.push({label: 'Rescates', value: String(r), target: '0', ok: r === 0, pct: r ? 0 : 1});
      const f = electionForecast(s); rows.push({label: 'Encuestas', value: Math.round(f.vote) + ' %', target: '50 %', ok: f.vote >= 50, pct: clamp(f.vote / 50, 0, 1)}); break; }
  }
  return {stage: st, rows, weeksLeft: st.to - s.week + 1, ok: rows.every(r => r.ok)};
}
/** Obstáculos vivos de la misión: cada uno lleva a la decisión que lo resuelve. */
export function obstacles(s) {
  const out = [], c = s.corridors, st = STAGES[s.stageIdx];
  const focus = st.id === 's1' ? ['norte'] : st.id === 's2' ? ['norte', 'levante', 'sur'] : CORRIDORS.filter(d => c[d.id].open).map(d => d.id);
  for (const id of focus) {
    const x = c[id], work = s.works.find(w => w.corridor === id && w.status === 'active');
    if (work) { const ws = workStatus(s, work); out.push({kind: 'work', corridor: id, severity: 1, label: `Obra en el ${CORRIDOR[id].short} · ${ws.left} sem`, action: 'works'}); continue; }
    if (x.track < 70) out.push({kind: 'track', corridor: id, severity: 3, label: `Vía del ${CORRIDOR[id].short} al ${Math.round(x.track)} %`, action: 'work:renovar'});
    if (x.capacityLoad > 1.05) out.push({kind: 'crowd', corridor: id, severity: 2, label: `${CORRIDOR[id].short}: faltan plazas`, action: 'service'});
    if (x.open && x.trains === 0) out.push({kind: 'notrain', corridor: id, severity: 3, label: `${CORRIDOR[id].short} sin trenes`, action: 'service'});
  }
  const bad = s.fleet.filter(t => t.status === 'service' && t.condition < 45);
  if (bad.length) out.push({kind: 'fleet', severity: 2, label: `${bad.length} tren${bad.length > 1 ? 'es' : ''} gastado${bad.length > 1 ? 's' : ''}`, action: 'fleet'});
  const broken = s.fleet.filter(t => t.status === 'broken' || t.status === 'revision');
  if (broken.length) out.push({kind: 'fleet', severity: 1, label: `${broken.length} tren${broken.length > 1 ? 'es' : ''} en el taller`, action: 'fleet'});
  if (crewsFree(s) === 0) out.push({kind: 'crews', severity: 2, label: 'Sin cuadrillas libres', action: 'crews'});
  const pay = upcoming(s, 4).filter(p => p.kind !== 'obra' && p.kind !== 'megaproyecto' && p.amount > 0);
  const due = sum(pay, p => p.amount);
  if (due > s.cash * .6 && due > .5) out.push({kind: 'cash', severity: 3, label: `Pagos de ${fmt(due)} en 4 sem`, action: 'finance'});
  if (s.cloacas.stage) out.push({kind: 'judge', severity: 3, label: JUDICIAL[s.cloacas.stage], action: 'cloacas'});
  if (s.rival && st.id === 's4') for (const id of s.rival.corridors) if (c[id].rivalShare > .4) out.push({kind: 'rival', corridor: id, severity: 2, label: `Lowgo: ${Math.round(c[id].rivalShare * 100)} % del ${CORRIDOR[id].short}`, action: 'service'});
  if (st.id === 's4') for (const t of Object.values(TERRITORIES)) if (!c[t.corridor].open) { out.push({kind: 'territory', corridor: t.corridor, severity: 1, label: `${t.name} sin tren`, action: s.territories[Object.keys(TERRITORIES).find(k => TERRITORIES[k] === t)] ? (c[t.corridor].track < 40 ? 'work:renovar' : 'open') : 'license'}); }
  return out.sort((a, b) => b.severity - a.severity).slice(0, 6);
}
function checkProgram(s) {
  const c = s.corridors;
  const set = id => { if (!s.program[id]) { s.program[id] = s.week; pushGaceta(s, 'good', 'Promesa cumplida: «' + PROGRAM.find(p => p.id === id).label + '».'); } };
  if (c.norte.punct >= 80) set('p-norte');
  if (['norte', 'levante', 'sur'].every(id => c[id].punct >= 80)) set('p-esenciales');
  const h = s.hist.slice(-26); if (h.length >= 26 && avg(h.map(x => x.ordinary)) >= 0) set('p-cuentas');
  if (Object.values(TERRITORIES).filter(t => c[t.corridor].open && c[t.corridor].trains > 0).length >= 2) set('p-territorios');
  if (CORRIDORS.filter(d => c[d.id].open && c[d.id].trains > 0 && c[d.id].hist.length >= 12 && avg(c[d.id].hist.slice(-12)) >= 85).length >= 5) set('p-cinco');
  if (MEGAPROJECTS.some(m => !m.vanity && (s.megas[m.id]?.stage || 0) >= m.stages.length)) set('p-mega');
}
function evaluateStage(s, report) {
  const st = STAGES[s.stageIdx];
  if (!st || s.week !== st.to) return;
  const p = stageProgress(s);
  const ok = st.id === 's3' ? p.rows[0].ok : st.id === 's5' ? p.rows[0].ok && p.rows[1].ok : p.ok;
  s.stageResults[st.id] = ok ? 'pass' : 'fail';
  report.stage = {id: st.id, ok};
  if (ok) { s.stars += 8; s.decisions.push({kind: 'stage', line: 'stage-pass', title: 'Objetivo cumplido: ' + st.name, text: LINES['stage-pass'].text + ' Ganas 8 ★.'}); }
  else { s.breaches.grave++; addGroups(s, {economia: -5, viajeros: -3}); s.decisions.push({kind: 'stage', line: 'stage-fail', title: 'Objetivo incumplido: ' + st.name, text: LINES['stage-fail'].text + ` Llevas ${s.breaches.grave} de 3.`}); }
  if (s.breaches.grave >= 3) endGame(s, 'lose', 'retirada', 'El Ministerio retira la concesión por incumplimientos graves.');
  if (s.stageIdx < STAGES.length - 1) {
    s.stageIdx++;
    const next = STAGES[s.stageIdx];
    s.decisions.push({kind: 'stage-intro', line: 'stage-' + next.id, title: next.name, text: next.goal});
  }
}
function election(s, report) {
  const f = electionForecast(s);
  const won = f.vote >= 50;
  s.elections.push({week: s.week, vote: round2(f.vote), won});
  report.election = {vote: f.vote, won};
  if (!won) { endGame(s, 'lose', 'elecciones', `Derrota electoral con el ${Math.round(f.vote)} % de apoyo.`); return; }
  s.stars += 10;
  if (s.week < WEEKS) s.decisions.push({kind: 'election', line: 'el-win', title: 'Elecciones ganadas', text: `${Math.round(f.vote)} % de apoyo. Empieza la segunda legislatura: conservas red, deudas, pactos, obras y… secretos.`});
}
function endGame(s, kind, reason, text) {
  if (s.ended) return;
  s.ended = {kind, reason, text, week: s.week};
}
export function finalVerdict(s) {
  const prog = PROGRAM.every(p => s.program[p.id]);
  const last = s.hist.slice(-52), ordinary = avg(last.map(h => h.ordinary));
  const rescues = s.rescues.filter(r => r.week > WEEKS - 104).length;
  const elections = s.elections.length === 2 && s.elections.every(e => e.won);
  return {program: prog, ordinary, ordinaryOk: ordinary >= 0, rescues, elections, win: prog && ordinary >= 0 && !rescues && elections};
}

// ------------------------------------------------------------------ cierre de semana
function record(s, week = s.week) {
  const acc = weeklyAccounts(s);
  const open = CORRIDORS.filter(d => s.corridors[d.id].open && s.corridors[d.id].trains > 0);
  s.hist.push({week, cash: s.cash, ordinary: round2(acc.ordinary), tickets: round2(acc.tickets), costs: round2(acc.costs), pax: round2(totalPax(s)),
    punct: round2(open.length ? avg(open.map(d => s.corridors[d.id].punct)) : 0), support: round2(support(s))});
  if (s.hist.length > 120) s.hist.shift();
}
function pushGaceta(s, kind, text) {
  s.gaceta.unshift({week: s.week, kind, text: text || pick(s, HEADLINES[kind] || HEADLINES.quiet)});
  if (s.gaceta.length > 40) s.gaceta.pop();
}
export function personName(p) { return {president: 'Pedro Sancho', minister: 'Raquel Sanz', successor: 'Óscar del Puente', treasury: 'Charo Tijera', adif: 'Benito Balasto', workshop: 'Fermín Bogie', riders: 'Marisa Andén', mayor: 'Paco Terruño', rival: 'Íñigo Asfalto'}[p] || p; }

/** Cierra la semana: opera, cobra, paga, avanza obras y decide qué pasa después. */
export function closeWeek(s) {
  if (s.ended) throw new Error('La partida ha terminado.');
  if (s.decisions.some(d => d.kind === 'insolvency')) throw new Error('Antes de cerrar la semana, resuelve el impago.');
  if (s.decisions.some(d => d.choices && d.kind !== 'insolvency')) throw new Error('Tienes una decisión pendiente.');
  s.decisions = s.decisions.filter(d => d.choices); // los avisos ya leídos se van
  const report = {week: s.week, finished: [], arrived: [], events: [], paid: [], aid: [], stops: []};
  const cashStart = s.cash;
  // 1. Lo que llega esta semana: trenes, cuadrillas y obras que entran en servicio
  for (const t of s.fleet) {
    if (t.status === 'arriving' && --t.weeks <= 0) { t.status = 'service'; t.condition = Math.max(t.condition, 40); report.arrived.push(t.name + ' · ' + OFFER[t.offer].model); }
    else if ((t.status === 'revision' || t.status === 'broken') && --t.weeks <= 0) {
      if (t.status === 'revision') t.condition = 95; else t.condition = Math.max(t.condition, 60);
      t.status = 'service'; if (t.back && trainsOn(s, t.back).length < BASE_CAPACITY + s.corridors[t.back].capacity + 2 && s.corridors[t.back].open) t.corridor = t.back; t.back = null;
    }
  }
  const returned = s.fleet.filter(t => t.rented && t.until <= s.week);
  if (returned.length) { s.fleet = s.fleet.filter(t => !returned.includes(t)); report.arrived.push(returned.length + ' tren alquilado devuelto'); }
  s.crews.hiring = s.crews.hiring.filter(h => { if (h.week <= s.week) { s.crews.own++; report.arrived.push('Cuadrilla nueva'); return false; } return true; });
  s.crews.sub = s.crews.sub.filter(c => c.until > s.week);
  s.crews.loan = s.crews.loan.filter(c => c.until > s.week);
  for (const w of s.works.filter(w => w.status === 'commissioning')) { applyWork(s, w); w.status = 'done'; }
  if (s.flags.slideCrew) s.flags.slideCrew = 0;
  for (const id of Object.keys(s.corridors)) { const c = s.corridors[id]; if (c.closedUntil && c.closedUntil <= s.week) { c.closed = false; c.closedUntil = 0; } }
  // 2. Operación
  const cloacasSkip = s.cloacas.skipTests;
  for (const d of CORRIDORS) {
    const c = s.corridors[d.id];
    c.incident = (c.incidentNow || 0) + (c.incidentWeeks > 0 ? 10 : 0);
    c.incidentNow = 0; if (c.incidentWeeks > 0) c.incidentWeeks--;
    operate(s, d.id);
    if (s.strike > s.week) { c.revenue *= .4; c.pax *= .4; }
    c.hist.push(round2(c.punct)); if (c.hist.length > 30) c.hist.shift();
    c.streak = c.open && c.punct >= 85 ? c.streak + 1 : 0;
    // desgaste de la vía
    if (c.open) c.track = Math.max(5, c.track - .055 * (2 - s.sliders.track) * (1 + c.trains / 6) * (1 + mod(s, 'trackDecay')));
  }
  // 3. Averías y desgaste de trenes
  for (const t of s.fleet.filter(t => t.status === 'service')) {
    t.condition = Math.max(10, t.condition - (t.corridor ? .45 : .1) * (2 - s.sliders.fleet) * (1 + mod(s, 'wear')));
    const p = (1 - OFFER[t.offer].reliability) * .05 * (1 + (100 - t.condition) / 50) * (1 + mod(s, 'breakdown'));
    if (t.corridor && s.week > 3 && rand(s) < p) { const corr = t.corridor; Object.assign(t, {status: 'broken', weeks: 2, corridor: null, back: corr}); report.events.push(`Avería del ${t.name} en el ${CORRIDOR[corr].short}: dos semanas en el taller.`); s.incidentFree = -1; }
  }
  // 4. Obras y megaproyectos
  const works = s.works.filter(w => w.status === 'active');
  for (const w of works) {
    const weekly = round2(w.cost * PHASES[w.phase].share / w.phases[w.phase]);
    if (weekly > s.cash) { report.events.push(`Obra parada por falta de caja: ${WORKS[w.type].name} en el ${CORRIDOR[w.corridor].short}.`); continue; }
    s.cash = round2(s.cash - weekly); w.paid = round2(w.paid + weekly);
    w.inPhase++;
    s.corridors[w.corridor].works = w.phase === 1 && !w.station ? w.mode : null;
    if (w.phase === 2 && cloacasSkip) w.inPhase = w.phases[2];
    else if (w.phase === 2 && w.inPhase >= w.phases[2] && rand(s) < .12 && !w.retested) { w.retested = true; w.inPhase--; report.events.push(`Las pruebas de ${WORKS[w.type].name.toLowerCase()} en el ${CORRIDOR[w.corridor].short} fallan: una semana más.`); }
    while (w.phase < 3 && w.inPhase >= w.phases[w.phase]) { w.phase++; w.inPhase = 0; }
    if (w.phase >= 3) {
      w.status = 'commissioning'; w.doneWeek = s.week; s.corridors[w.corridor].works = null; s.finished++;
      report.finished.push(WORKS[w.type].name + ' · ' + CORRIDOR[w.corridor].short);
      if (hasTech(s, 'inauguraciones')) { s.stars += 3; addGroups(s, {territorios: 2}); }
    } else if (w.phase === 1) s.corridors[w.corridor].works = w.station ? null : w.mode;
  }
  s.cloacas.skipTests = false;
  for (const [id, m] of Object.entries(s.megas)) if (m.active) {
    const per = round2(m.active.cost / m.active.total);
    if (per > s.cash) { report.events.push(`${MEGA[id].name}: etapa parada por falta de caja.`); continue; }
    s.cash = round2(s.cash - per); m.active.paid = round2(m.active.paid + per);
    if (--m.active.left <= 0) {
      const stage = MEGA[id].stages[m.stage];
      m.stage++; m.active = null; s.finished++;
      if (stage.reward) applyGives(s, stage.reward);
      if (stage.suspicion) s.cloacas.suspicion += stage.suspicion;
      for (const [corr, cm] of Object.entries(stage.corridorMods || {})) {
        const c = s.corridors[corr];
        if (cm.capacity) c.capacity += cm.capacity; if (cm.pot) c.potBonus += cm.pot; if (cm.track) c.track = Math.max(c.track, cm.track); if (cm.elec) c.elec = true;
      }
      report.finished.push(MEGA[id].name + ' · ' + stage.name);
      if (m.stage >= MEGA[id].stages.length) s.decisions.push({kind: 'mega', line: 'mega-done', title: MEGA[id].name + ' terminado', text: LINES['mega-done'].text});
      if (hasTech(s, 'inauguraciones')) s.stars += 3;
    }
  }
  // 5. Cuentas de la semana
  const acc = weeklyAccounts(s);
  s.cash = round2(s.cash + acc.tickets - acc.costs);
  if (quarterEnd(s.week)) {
    const comp = ospCompliance(s);
    const osp = round2(OSP_BASE * comp.factor + s.ospBonus + territoryOsp(s) + s.cloacas.ospNext - s.ospCut);
    s.cash = round2(s.cash + osp); s.cloacas.ospNext = 0; s.ospCut = 0;
    report.osp = {amount: osp, bad: comp.bad};
    if (comp.bad) { s.breaches.leve++; if (s.breaches.leve >= 3) { s.breaches.leve = 0; s.breaches.grave++; report.events.push('Tres incumplimientos leves del servicio público suman uno grave.'); if (s.breaches.grave >= 3) endGame(s, 'lose', 'retirada', 'El Ministerio retira la concesión por incumplimientos graves.'); } }
  }
  for (const p of payWeek(s)) {
    if (s.stageIdx === 0 && p.amount > s.cash && !s.flags.defaulted) s.flags.defaulted = s.week;
    s.cash = round2(s.cash - p.amount); report.paid.push(p);
    if (p.loan) { const l = s.loans.find(l => l.id === p.loan); if (l) l.balance = Math.max(0, round2(l.balance - l.amount / l.installments)); }
    if (p.label.startsWith('Plazo de la deuda')) s.debt = Math.max(0, round2(s.debt - p.amount * .8));
  }
  s.payments = s.payments.filter(p => p.week > s.week);
  s.loans = s.loans.filter(l => s.payments.some(p => p.loan === l.id));
  // ayudas condicionadas que se cumplen esta semana
  for (const a of AIDS) if (!s.flags['aid-' + a.id] && s.works.some(w => w.corridor === a.corridor && w.type === a.work && (w.status === 'commissioning' || w.status === 'done'))) {
    s.flags['aid-' + a.id] = s.week; s.cash = round2(s.cash + a.amount); report.aid.push(a);
  }
  // 6. Apoyo, popularidad y pactos
  updateGroups(s);
  const sup = support(s);
  s.stars += sup >= 62 ? 2 : sup >= 48 ? 1 : 0;
  if (hasTech(s, 'influencers') && avg(CORRIDORS.filter(d => s.corridors[d.id].open).map(d => s.corridors[d.id].punct)) >= 80) s.stars += 1;
  updatePacts(s, acc);
  s.offers = s.offers.filter(o => o.expires > s.week);
  offerPacts(s);
  if (s.flags.stationTask?.started && !s.flags.stationTask.done && s.works.some(w => w.station && (w.status === 'commissioning' || w.status === 'done'))) { s.flags.stationTask.done = true; s.flags.stationNorte = true; s.decisions.push({kind: 'notice', line: 'paco-inaugura', title: 'Apeadero de Villanueva del Andén', text: 'El Norte tiene parada nueva: algo más de demanda y un alcalde feliz.'}); }
  // 7. Sucesos, corrupción y justicia
  if (report.events.length) s.incidentFree = 0; else s.incidentFree++;
  judicialWeek(s);
  const ev = randomEvent(s) || offerCorruption(s) || extortion(s);
  if (ev) { s.decisions.push(ev); if (ev.kind === 'event' && ev.id !== 'viral' && ev.id !== 'fondos') s.incidentFree = 0; }
  if (s.week === 208 && !s.rival) s.rival = {since: 209, corridors: ['levante', 'sur', 'mediterraneo'], strength: .2};
  if (s.week === 209 - 1) s.decisions.push({kind: 'notice', line: 'ev-lowgo', title: 'Llega Lowgo', text: LINES['ev-lowgo'].text});
  if (s.rival) s.rival.strength = Math.min(.4, s.rival.strength + .0006);
  // 8. Registro, hitos, programa y plazos
  record(s);
  const last = s.hist.at(-1);
  report.ordinary = last.ordinary; report.tickets = acc.tickets; report.costs = acc.costs; report.cashDelta = round2(s.cash - cashStart); report.pax = last.pax;
  checkMilestones(s, report);
  checkProgram(s);
  if (s.week === 182 || s.week === 390) s.decisions.push({kind: 'review', line: 'el-forecast', title: 'Revisión política: quedan seis meses', text: 'Las elecciones son en ' + (ELECTIONS.find(w => w > s.week) - s.week) + ' semanas. Mira la previsión.'});
  evaluateStage(s, report);
  if (ELECTIONS.includes(s.week)) election(s, report);
  // 9. Caja: impago y quiebra
  if (s.cash < 0) {
    s.negativeWeeks++;
    if (s.negativeWeeks >= 4) endGame(s, 'lose', 'quiebra', 'Cuatro semanas seguidas sin poder pagar: concurso de acreedores.');
    else s.decisions.push(insolvencyDecision(s));
    pushGaceta(s, 'broke');
  } else s.negativeWeeks = 0;
  // 10. Titular de la semana
  if (!s.gaceta.length || s.gaceta[0].week !== s.week) {
    const p = last.punct;
    pushGaceta(s, report.finished.length ? 'works' : p < 70 ? 'late' : p > 82 ? 'good' : s.rival && rand(s) < .3 ? 'rival' : 'quiet');
  }
  if (s.week >= WEEKS && !s.ended) {
    const v = finalVerdict(s);
    endGame(s, v.win ? 'win' : 'partial', 'final', v.win ? 'Programa cumplido, dos elecciones ganadas y una red que se paga sola.' : 'Has llegado al final, pero no has cumplido todo lo prometido.');
  }
  s.week++; s.ordersUsed = 0;
  report.stops = stopReasons(s, report);
  s.lastReport = report; s.reports.unshift(report); if (s.reports.length > 12) s.reports.pop();
  return report;
}
function applyWork(s, w) {
  const c = s.corridors[w.corridor], e = WORKS[w.type]?.effect || {};
  if (e.track) c.track = Math.min(98, c.track + e.track);
  if (e.signal) c.signal += e.signal;
  if (e.capacity) c.capacity += e.capacity;
  if (e.elec) c.elec = true;
  if (s.flags.borja) c.track -= 3;
}
/** Por qué conviene pararse a decidir después de esta semana. */
export function stopReasons(s, report = s.lastReport || {}) {
  const r = [];
  if (s.ended) r.push('Fin de la partida');
  if (s.decisions.length) r.push('Decisión pendiente');
  if (s.offers.some(o => o.week === s.week - 1)) r.push('Propuesta de pacto');
  if (report.finished?.length) r.push('Obra terminada');
  if (report.arrived?.length) r.push('Llegada de material o cuadrillas');
  if (report.milestone) r.push('Hito alcanzado');
  const st = STAGES[s.stageIdx];
  if (st && st.to - s.week <= 2 && st.to >= s.week) r.push('Plazo de la misión');
  if (activePacts(s).some(p => p.deadline - s.week <= 2 && p.deadline >= s.week)) r.push('Vence un pacto');
  if (ELECTIONS.some(w => w - s.week <= 4 && w >= s.week)) r.push('Elecciones cerca');
  const next = sum(upcoming(s, 2).filter(p => p.week === s.week), p => p.amount);
  if (s.cash - next < 0) r.push('La caja no llega al próximo pago');
  if (crewsFree(s) > 0 && !s.works.some(w => w.status === 'active') && report.finished?.length) r.push('Cuadrillas libres');
  return r;
}
/** «Avanzar hasta la próxima decisión»: cierra semanas hasta que haya algo que decidir (máximo 13). */
export function advance(s, max = 13) {
  const reports = [];
  for (let k = 0; k < max && !s.ended; k++) {
    const r = closeWeek(s); reports.push(r);
    if (r.stops.length) break;
  }
  return reports;
}

// ------------------------------------------------------------------ guardar y cargar
export function serialize(s) { return JSON.stringify(s); }
export function validate(x) {
  if (!x || typeof x !== 'object' || x.v !== RESCUE_VERSION) return false;
  if (!Number.isInteger(x.week) || x.week < 1 || x.week > WEEKS + 1) return false;
  if (!Number.isFinite(x.cash) || !Number.isFinite(x.stars) || !Array.isArray(x.fleet) || !Array.isArray(x.works) || !Array.isArray(x.decisions)) return false;
  for (const d of CORRIDORS) { const c = x.corridors?.[d.id]; if (!c || !Number.isFinite(c.track) || !Number.isFinite(c.punct)) return false; }
  for (const g of Object.keys(GROUPS)) if (!Number.isFinite(x.groups?.[g])) return false;
  if (!x.cloacas || !Number.isFinite(x.cloacas.suspicion)) return false;
  return x.fleet.every(t => OFFER[t.offer] && typeof t.status === 'string');
}
export function load(text) { const x = JSON.parse(text); if (!validate(x)) throw new Error('La partida guardada no es válida.'); return x; }
