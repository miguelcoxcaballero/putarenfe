// «Lo que se dice, pasa»: hechos de la partida, efectos con plazo, compromisos y encuentros que solo se juegan si son verdad.
// Las 412 grabaciones no cambian: aquí se decide cuándo es cierto lo que dicen y qué hace de verdad cada respuesta.
import {CITY, POP, MODEL, PROJECTS} from './data.js';
import {EVENTS} from './story.js';
import {ENCOUNTERS, ENCOUNTER, EMOTIONS, RETIRED} from './encounters.js';
import * as T from './tycoon.js';
import * as I from './infra.js';
import {ROUTE_DEF} from './network.js';

// El motor (engine.js) se enlaza al cargarse: así este módulo no lo importa y no hay ciclos en el empaquetado.
let X = null;
export function bind(engine) { X = engine; }

export const TERRITORY = ['sal', 'bad', 'sor', 'lug', 'fer', 'avi', 'jae', 'hue', 'alg', 'ter'];
const HOT = ['cor', 'sev', 'bad', 'mer', 'cac', 'pla', 'jae', 'lin'];
const PEOPLE = ['president', 'minister', 'successor', 'treasury', 'adif', 'workshop', 'riders', 'mayor', 'rival'];
const MOD_KINDS = ['fare', 'demand', 'service', 'speed', 'rel', 'risk', 'overtime', 'staffed', 'unstaffed', 'pilot', 'inspected', 'oncall', 'nocrew', 'transfer', 'wear'];
const NEWS_KINDS = ['claim', 'won', 'lost', 'declined', 'work', 'workStart', 'delay', 'accel', 'promise', 'broken', 'kept', 'refit', 'breakdown', 'incident', 'cut', 'open', 'fare', 'affront', 'concession', 'grant', 'eu', 'misuse', 'reqExpired', 'preventive', 'event', 'dither', 'station', 'vanity'];
const safeId = x => typeof x === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(x);
const fmt = x => Number(x).toLocaleString('es-ES', {maximumFractionDigits: Math.abs(x) < 10 ? 2 : 1});
const pct = x => Math.round(x * 100);
/** Número con su signo tipográfico (−3, +2). */
const signed = x => `${x < 0 ? '−' : '+'}${fmt(Math.abs(x))}`;
/** «1 línea», «3 líneas». */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const r2 = x => Math.round(x * 100) / 100;
const routeOf = (s, id) => s.routes.find(r => r.id === id) || null;
const nameOf = r => r ? (r.name || r.ends.map(id => CITY[id]?.name || id).join(' — ')) : '';
const cityName = id => CITY[id]?.name || id;
const isTerr = r => r.ends.some(c => TERRITORY.includes(c));
export const isTerritory = r => isTerr(r);
const terrCity = r => r.ends.find(c => TERRITORY.includes(c));
const hot = r => r.via.some(n => HOT.includes(n)) || r.ends.some(c => HOT.includes(c));
const lotName = f => MODEL[f.model]?.name.split(' · ')[0] || f.model;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- estado
export function fresh() {
  return {mods: [], promises: [], news: [], inc: [], hist: [], dues: [], spent: [], access: [], credit: {}, frozen: null, scene: null, election: null, rural: null,
    busWarFrom: null, busWarAt: null, answered: null,
    enc: {last: -99, person: {}, mood: {}, pt: {}, topic: {}, inst: {}, used: [], warned: {}, lastMood: {}, cool: {}, planted: null}};
}
export function ensure(s) { if (!s.verdad || typeof s.verdad !== 'object') s.verdad = fresh(); return s.verdad; }
const OPS_KINDS = new Set(['incident', 'breakdown']);
/** Hechos del mes: las incidencias de cada jornada van aparte para no desplazar a los hechos raros. */
export function note(s, k, x = {}) {
  const v = ensure(s);
  if (OPS_KINDS.has(k)) { (v.inc ||= []).push({k, m: s.month, ...x}); if (v.inc.length > 200) v.inc = v.inc.slice(-150); return; }
  v.news.push({k, m: s.month, ...x}); if (v.news.length > 400) v.news = v.news.slice(-300);
}
export function noteSpend(s, amount) {
  if (!(amount > 0)) return;
  const v = ensure(s), last = v.spent.at(-1);
  if (last && last.m === s.month) last.x = r2(last.x + amount); else v.spent.push({m: s.month, x: r2(amount)});
  v.spent = v.spent.slice(-6);
}
const trust = (s, deltas = {}) => { for (const [k, d] of Object.entries(deltas || {})) if (Object.hasOwn(s.tycoon.groups, k)) s.tycoon.groups[k] = clamp(s.tycoon.groups[k] + d, 0, 100); };

// ---------------------------------------------------------------- efectos con plazo
/** Un efecto activo desde `from` (incluido) hasta `until` (excluido): cuenta en esos cierres mensuales. */
export function addMod(s, m) { const v = ensure(s); v.mods.push({from: s.month, ...m}); v.mods = v.mods.slice(-80); return m; }
const live = (s, x) => x.until > s.month && (x.from ?? 0) <= s.month;
export function liveMods(s, kind) { return (s.verdad?.mods || []).filter(x => (!kind || x.kind === kind) && live(s, x)); }
const hits = (x, r) => !x.routes || x.routes.includes(r.id);
/** Modificadores de una relación: tarifa, demanda, servicio prestado, tiempo de viaje y puntualidad. */
export function routeMods(s, r, family) {
  const out = {fare: 1, demand: 1, service: 1, speed: 1, rel: 0};
  const list = s.verdad?.mods;
  if (list?.length) for (const x of list) {
    if (!live(s, x)) continue;
    if (x.kind === 'fare' && hits(x, r)) out.fare *= x.value;
    else if (x.kind === 'demand' && hits(x, r)) out.demand *= x.value;
    else if (x.kind === 'service' && hits(x, r)) out.service *= x.byFamily ? (x.byFamily[family] ?? 1) : x.value;
    else if (x.kind === 'speed' && hits(x, r)) out.speed *= x.value;
    else if (x.kind === 'rel' && (x.rival ? T.competition(s, r).some(c => c.id === x.rival) : hits(x, r))) out.rel += x.value;
    else if ((x.kind === 'staffed' || x.kind === 'unstaffed') && r.ends.includes(x.city)) out.demand *= x.value;
  }
  if (s.verdad?.access?.some(c => r.ends.includes(c))) out.demand *= 1.02;
  out.rel += heatPenalty(s, r);
  return out;
}
/** Verano a partir de 2030 en las líneas del sur: la vía se dilata. El plan de resiliencia lo reduce a la mitad. */
export function heatPenalty(s, r) {
  const month = s.month % 12, year = 2022 + Math.floor(s.month / 12);
  if (year < 2030 || month < 5 || month > 7 || !hot(r)) return 0;
  return s.flags?.resilience > s.month ? -2 : -4;
}
export const ENERGY_SPIKE = 1.5;
export const energyFactor = s => s.flags?.energy > s.month && !(s.flags?.hedge > s.month) ? ENERGY_SPIKE : 1;
export const transferFactor = s => liveMods(s, 'transfer').reduce((n, x) => n * x.value, 1);
export function wearFactor(s, f) {
  const pilot = !s.tycoon.tech.includes('predictive') && liveMods(s, 'pilot').some(x => x.tech === 'predictive' && s.routes.some(r => r.active && r.fleet === f.id && x.routes?.includes(r.id)));
  return liveMods(s, 'wear').reduce((n, x) => n * (!x.fleet || x.fleet === f.id ? x.value : 1), 1) * (pilot ? .8 : 1);
}
export function ruralOk(s) { return s.verdad?.rural?.ok ?? true; }
/** Factor de salidas que se prestan (servicios mínimos, recortes o refuerzos temporales). */
export function serviceFactor(s, r, family) { return routeMods(s, r, family).service; }
export const fenced = s => s.flags?.fenced > s.month;
export const inspected = (s, routeId) => liveMods(s, 'inspected').some(x => x.routes?.includes(routeId));
export function incidentFactor(s) { return liveMods(s, 'oncall').length ? .5 : liveMods(s, 'nocrew').length ? 1.25 : 1; }
export function riskyLots(s) { const by = new Map(); for (const x of liveMods(s, 'risk')) by.set(x.fleet, Math.max(by.get(x.fleet) || 0, x.value)); return [...by].map(([fleet, value]) => ({fleet, value})); }

// ---------------------------------------------------------------- hechos
const within = (v, m, k, n, pred) => (OPS_KINDS.has(k) ? v.inc || [] : v.news).filter(e => e.k === k && e.m >= m - n && (!pred || pred(e)));
function dueOrders(s, n) {
  let total = 0;
  for (const o of s.orders) if (!o.historical && o.delivered < o.qty && o.next <= s.month + n) total += Math.min(2, o.qty - o.delivered) * (o.unit || 0) * (1 - (o.marketplace?.depositRate ?? .3));
  return total;
}
function freeUnits(s, family, minCondition = 30) {
  return s.fleet.filter(f => MODEL[f.model]?.family === family && f.condition >= minCondition).reduce((n, f) => n + Math.max(0, X.available(s, f)), 0);
}
/** Plan para una salida más (o abrir) en una relación; null si no hay material o ya está al máximo. */
function morePlan(s, r, families = null, used = new Map()) {
  if (r.cut) return null;
  if (r.active) {
    if (r.frequency >= X.maxFrequency(r)) return null;
    const f = s.fleet.find(f => f.id === r.fleet), m = f && MODEL[f.model];
    if (!m || f.condition < 30 || (families && !families.includes(m.family))) return null;
    const need = X.requiredUnits(s, r, m, r.frequency + 1);
    if (X.available(s, f, r.id) - (used.get(f.id) || 0) < need) return null;
    return {route: r.id, fleet: f.id, frequency: r.frequency + 1, open: false, units: need - r.units};
  }
  if (!X.isUnlocked(s, r)) return null;
  const frequency = Math.min(2, X.maxFrequency(r)), fams = families || (X.routeOptions(s, r).ave.ok ? ['AVE', 'Alvia'] : ['Alvia']);
  for (const fam of fams) for (const f of s.fleet) {
    const m = MODEL[f.model];
    if (!m || m.family !== fam || f.qty <= 0 || f.condition < 30 || !X.canRun(s, r, m)) continue;
    const need = X.requiredUnits(s, r, m, frequency);
    if (X.available(s, f, r.id) - (used.get(f.id) || 0) >= need) return {route: r.id, fleet: f.id, frequency, open: true, units: need};
  }
  return null;
}
/** Varias salidas nuevas a la vez sin reservar dos veces las mismas unidades libres. */
function plansFor(s, routes, max, families = null) {
  const used = new Map(), out = [];
  for (const r of routes) {
    if (out.length >= max) break;
    const p = morePlan(s, r, families, used);
    if (p) { out.push(p); used.set(p.fleet, (used.get(p.fleet) || 0) + p.units); }
  }
  return out;
}
/** Cambio del resultado mensual de la línea si se aplica el plan (M€/mes; negativo = pierde dinero). */
function planDelta(s, p) {
  const r = routeOf(s, p.route), f = s.fleet.find(f => f.id === p.fleet);
  if (!r || !f) return 0;
  const before = r.active ? X.metrics(s, r).net : 0;
  const after = X.metrics(s, r, {active: true, fleet: f.id, frequency: p.frequency, units: X.requiredUnits(s, r, MODEL[f.model], p.frequency)}).net;
  return r2(after - before);
}
const perMonth = x => `${x >= 0 ? '+' : '−'}${fmt(Math.abs(x))} M€ al mes`;
function runPlan(s, p) {
  const r = routeOf(s, p.route), f = s.fleet.find(f => f.id === p.fleet);
  r.active = true; r.fleet = f.id; r.frequency = p.frequency; r.units = X.requiredUnits(s, r, MODEL[f.model], p.frequency); delete r.cut;
  if (p.open) { X.log(s, 'Servicio en marcha', nameOf(r) + ' · ' + MODEL[f.model].family); note(s, 'open', {route: r.id, terr: isTerr(r)}); }
}
function pilotables(s) {
  const t = s.tycoon, v = ensure(s);
  return Object.entries(T.TECHS).filter(([id, q]) => !t.tech.includes(id) && t.research?.id !== id && q.requires.every(x => t.tech.includes(x)) && !((v.enc.cool[id] ?? -1) > s.month) && !liveMods(s, 'pilot').some(x => x.tech === id) && q.cost * .3 <= s.cash - 5)
    .sort((a, b) => a[1].cost - b[1].cost).map(([id]) => id);
}
/** Fotografía de la partida para comprobar si un diálogo es verdad ahora. */
export function facts(s) {
  const v = ensure(s), t = s.tycoon, m = s.month, F = {s, v, m};
  F.office = m < 22 ? 'minister' : 'successor';
  F.g = t.groups;
  F.active = s.routes.filter(r => r.active);
  F.met = new Map(F.active.map(r => [r.id, X.metrics(s, r)]));
  F.fam = new Map(F.active.map(r => [r.id, X.product(s, r)]));
  F.need = T.driverNeed(s); F.drivers = t.drivers; F.raw = Math.min(1, t.drivers / Math.max(1, F.need));
  F.overtime = liveMods(s, 'overtime').length > 0;
  F.trains = X.dailyTrains(s);
  F.punct = s.last?.punctuality || 0; F.net = s.last?.net || 0;
  const hist = v.hist, back = n => hist[hist.length - 1 - n];
  F.ago = (k, n) => back(n)?.g?.[k] ?? F.g[k];
  F.punctAgo = n => back(n)?.punct ?? F.punct;
  F.bus = back(0)?.bus ?? 0; F.busAgo = n => back(n)?.bus ?? F.bus;
  // Sin cambio de campaña del autobús en la ventana: así una subida o bajada no es obra suya ni tuya por casualidad.
  F.sameBus = n => hist.length > n && hist.slice(-n - 1).every(h => !!h.bw === F.busWarNow);
  F.share = back(0)?.share ?? 0; F.shareAgo = n => back(n)?.share ?? F.share;
  F.trainsAgo = n => back(n)?.trains ?? F.trains;
  F.n = (k, n, pred) => within(v, m, k, n, pred).length;
  F.cashMin3 = s.cash + 3 * Math.min(0, F.net) - dueOrders(s, 3) - v.dues.reduce((n, d) => n + Math.min(d.left, d.left / Math.max(1, d.months) * 3), 0);
  F.dueOrders = n => dueOrders(s, n);
  F.spent = n => v.spent.filter(x => x.m >= m - n).reduce((a, x) => a + x.x, 0);
  // Material en servicio: lotes con su estado y sus relaciones.
  const lots = new Map();
  for (const r of F.active) { const f = s.fleet.find(f => f.id === r.fleet); if (!f) continue; if (!lots.has(f.id)) lots.set(f.id, {f, routes: [], cond: f.condition}); lots.get(f.id).routes.push(r); }
  F.lots = [...lots.values()].sort((a, b) => a.cond - b.cond);
  F.low = x => F.lots.filter(l => l.cond < x);
  F.free = fam => freeUnits(s, fam);
  const units = s.fleet.reduce((n, f) => n + f.qty, 0);
  F.fleetAvg = units ? s.fleet.reduce((n, f) => n + f.condition * f.qty, 0) / units : 0;
  F.works = s.projects.filter(p => !p.done);
  F.crewsFree = Math.max(0, 3 - F.works.filter(p => p.type !== 'upgrade').length);
  F.refits = s.refits.filter(r => !r.done);
  // Competencia: guerras de precio de OuiOui y YaIré, y campaña del autobús.
  F.comp = new Map(F.active.map(r => [r.id, T.competition(s, r)]));
  F.warRoutes = rival => F.active.filter(r => F.comp.get(r.id).some(c => c.id === rival && c.war));
  F.busWar = s.flags.buswar > m; F.busWarNow = F.busWar;
  F.answered = v.answered != null && v.answered === v.busWarFrom;
  F.anyWar = F.warRoutes('lowgo').length > 0 || F.warRoutes('rossa').length > 0 || F.busWar;
  F.strike = liveMods(s, 'service').some(x => x.tag === 'strike');
  F.electionIn = v.election != null && v.election >= m ? v.election - m : 99;
  F.terrServed = F.active.filter(isTerr);
  F.cityPax = city => F.active.filter(r => r.ends.includes(city)).reduce((n, r) => n + F.met.get(r.id).passengers / 30, 0);
  F.staffed = city => liveMods(s, 'staffed').some(x => x.city === city);
  F.pilotables = pilotables(s);
  F.busiest = [...F.active].sort((a, b) => F.met.get(b.id).passengers - F.met.get(a.id).passengers)[0] || null;
  F.lost = r => { const x = F.met.get(r.id); return x?.wanted > 0 ? Math.max(0, 1 - x.passengers / x.wanted) : 0; };
  F.lostMax = F.active.reduce((n, r) => Math.max(n, F.lost(r)), 0);
  return F;
}

// ---------------------------------------------------------------- arranques (63): cuándo es verdad cada estado de ánimo
const vanityLive = F => F.n('vanity', 6) > 0;
const chapterOpen = F => { const s = F.s; if (s.tycoon.mode === 'free') return false; return X.chapterTight(s); };
const obstacles = F => {
  const h = F.v.hist.slice(-2), held = pred => h.length === 2 && h.every(pred);
  return [held(x => x.staff < 1), held(x => x.net < 0), held(x => x.punct < 80), F.low(45).length > 0,
    (F.s.requests || []).some(q => !q.serving && F.m - (q.until - 4) >= 2)].filter(Boolean).length;
};
const serious = F => [F.raw < .9, F.net < -5, F.punct > 0 && F.punct < 75, F.lots.some(l => l.cond < 30)].filter(Boolean).length;
const territoryRisk = F => F.terrServed.some(r => { const l = F.lots.find(l => l.routes.includes(r)), x = F.met.get(r.id); return (l && l.cond < 45) || x.punctuality < 55 || (x.net < 0 && F.cashMin3 < 0); });
const breakdownsByFleet = (F, n) => { const c = {}; for (const e of within(F.v, F.m, 'breakdown', n)) if (e.fleet) c[e.fleet] = (c[e.fleet] || 0) + 1; return c; };
const lastMoodIs = (F, person, list, n) => { const x = F.v.enc.lastMood[person]; return !!x && list.includes(x.mood) && F.m - x.m <= n; };
const quarterNet = (s, from, to) => s.history.filter(h => h.month >= from && h.month <= to).reduce((n, h) => n + h.net, 0);
const bigMilestone = F => F.works.some(p => {
  if (p.delay || !['infrastructure', 'custom', 'changer'].includes(p.type) && !(p.type === 'tramo' && ['electrify', 'standard', 'mixed'].includes(p.work))) return false;
  const span = Math.max(1, p.due - p.started), now = (F.m - p.started) / span, before = (F.m - 1 - p.started) / span;
  return now >= .8 && before < .8;
});
export const OPENERS = {
  president: {
    happy: ['state', F => F.g.government >= 55 && F.g.government - F.ago('government', 2) >= 1],
    angry: ['state', F => F.punct > 0 && F.punct < 75 && F.g.government < 45],
    worried: ['state', F => F.cashMin3 < 0 || F.s.debt >= 1000 || (F.electionIn <= 6 && F.g.government < 52)],
    proud: ['recent', F => (F.n('claim', 1) + F.n('won', 1)) > 0 && F.g.government >= 50],
    surprised: ['event', F => F.n('work', 1) > 0],
    disappointed: ['recent', F => F.n('lost', 1) > 0 || F.g.government - F.ago('government', 2) <= -10],
    determined: ['attitude', F => (F.works.some(p => p.type === 'infrastructure') || F.electionIn <= 12 || chapterOpen(F)) && F.g.government >= 40],
  },
  minister: {
    happy: ['state', F => !F.n('event', 1) && !F.s.event && F.punct >= 80 && !F.n('incident', 1)],
    angry: ['recent', F => F.n('delay', 3) >= 2 && F.g.government < 45],
    worried: ['state', F => F.g.government < 40 || lastMoodIs(F, 'president', ['angry', 'disappointed', 'worried'], 2) || !!F.s.event],
    proud: ['event', F => (F.n('claim', 1) + F.n('eu', 1) + F.n('grant', 1) + F.n('won', 1)) > 0],
    surprised: ['event', F => F.n('work', 1, e => !e.delay) > 0],
    disappointed: ['recent', F => (F.n('lost', 1) + F.n('broken', 1)) > 0],
    determined: ['attitude', F => (F.n('declined', 3) + F.n('dither', 3)) > 0 && F.g.government >= 35],
  },
  successor: {
    happy: ['state', F => F.punct >= 88 && !F.n('incident', 1)],
    angry: ['recent', F => { const c = {}; for (const e of within(F.v, F.m, 'incident', 1)) c[e.route] = (c[e.route] || 0) + 1; return F.n('incident', 1) >= 3 || Object.values(c).some(x => x >= 2); }],
    worried: ['state', F => F.lots.some(l => l.cond < 25)],
    proud: ['event', F => (F.n('claim', 1) + F.n('won', 1)) > 0 || (F.punct >= 85 && F.v.hist.slice(-13, -1).length >= 3 && F.v.hist.slice(-13, -1).every(h => h.punct < 85))],
    surprised: ['recent', F => F.n('work', 1, e => !e.delay) > 0 || (F.punct >= 85 && Math.min(F.punctAgo(1), F.punctAgo(2), F.punctAgo(3)) < 75)],
    disappointed: ['state', F => obstacles(F) >= 3],
    determined: ['attitude', F => (F.m - 22 <= 6 || serious(F) >= 2) && F.g.government >= 35],
  },
  treasury: {
    happy: ['state', F => F.cashMin3 >= 50 && F.net >= 0 && F.g.treasury >= 50],
    angry: ['state', F => F.cashMin3 < 0 && F.spent(1) >= .5],
    worried: ['state', F => F.s.cash < 30 || (F.dueOrders(2) > .6 * F.s.cash && F.dueOrders(2) > .5)],
    proud: ['event', F => F.m % 3 === 0 && F.m >= 6 && quarterNet(F.s, F.m - 3, F.m - 1) >= 0 && quarterNet(F.s, F.m - 6, F.m - 4) < 0],
    surprised: ['state', F => F.s.cash >= 300 && F.spent(1) === 0 && !F.works.length],
    disappointed: ['recent', F => F.n('misuse', 1) > 0 && F.g.treasury < 55],
    determined: ['attitude', F => F.dueOrders(1) > 0 && liveMods(F.s).some(x => x.kind === 'fare' || x.kind === 'pilot' || (x.kind === 'demand' && x.vanity))],
  },
  adif: {
    happy: ['event', F => F.n('work', 0) > 0 && !F.n('accel', 1)],
    angry: ['recent', F => F.n('accel', 1) > 0],
    worried: ['event', F => F.n('delay', 0, e => e.work) > 0],
    proud: ['recent', F => F.n('work', 1) > 0],
    surprised: ['event', F => bigMilestone(F)],
    disappointed: ['recent', F => F.n('promise', 1, e => e.mud) >= 1 && F.n('promise', 6, e => e.mud) >= 2],
    determined: ['state', F => F.crewsFree === 0 && !!trackNeed(F)],
  },
  workshop: {
    happy: ['state', F => F.fleetAvg >= 75 && !F.n('breakdown', 1) && !F.low(45).length],
    angry: ['state', F => F.refits.some(r => r.due - F.m >= 1 && F.free(MODEL[r.model].family) === 0)],
    worried: ['state', F => { const l = F.low(45)[0]; return !!l && F.free(MODEL[l.f.model].family) <= 1; }],
    proud: ['recent', F => F.n('refit', 1) > 0],
    surprised: ['recent', F => F.n('preventive', 1) > 0 && F.n('breakdown', 6) >= 1],
    disappointed: ['event', F => F.n('breakdown', 1, e => F.v.enc.warned[e.fleet] != null && F.m - F.v.enc.warned[e.fleet] <= 3) > 0],
    determined: ['recent', F => Object.values(breakdownsByFleet(F, 3)).some(x => x >= 2)],
  },
  riders: {
    happy: ['event', F => F.punct >= 85 && F.v.hist.length >= 3 && (F.punctAgo(1) + F.punctAgo(2)) / 2 < 80],
    angry: ['recent', F => F.strike || F.n('incident', 1, e => e.delay >= 30 && (F.met.get(e.route)?.occupancy || 0) >= .9) > 0],
    worried: ['state', F => F.punct > 0 && (F.punct + F.punctAgo(1)) / 2 < 75 && ((F.s.requests || []).length > 0 || F.v.promises.some(p => !p.status) || F.works.length > 0)],
    proud: ['recent', F => Math.min(F.ago('riders', 1), F.ago('riders', 2)) < 40 && F.n('concession', 1) > 0],
    surprised: ['recent', F => F.punct >= 85 && F.v.hist.length >= 4 && Math.min(F.punctAgo(1), F.punctAgo(2), F.punctAgo(3)) < 75],
    disappointed: ['recent', F => F.n('affront', 1) > 0 && F.n('affront', 6) >= 2],
    determined: ['attitude', F => F.g.riders < 35 && ((F.punct > 0 && F.punct < 75 && F.punctAgo(1) < 75) || F.lostMax >= .1)],
  },
  mayor: {
    happy: ['event', F => (F.n('open', 1, e => e.terr) + F.n('workStart', 1, e => e.terr)) > 0],
    angry: ['recent', F => F.n('cut', 1, e => e.terr) > 0],
    worried: ['state', F => territoryRisk(F)],
    proud: ['event', F => F.n('station', 2, e => e.terr) > 0],
    surprised: ['recent', F => F.n('workStart', 1, e => e.terr) > 0],
    disappointed: ['recent', F => (F.n('reqExpired', 3, e => e.terr) + F.n('broken', 3, e => e.terr)) > 0],
    determined: ['attitude', F => (F.g.territory < 35 && TERRITORY.some(c => !F.active.some(r => r.ends.includes(c)) && F.s.routes.some(r => r.ends.includes(c)))) || (F.v.enc.planted != null && F.m - F.v.enc.planted <= 2)],
  },
  rival: {
    happy: ['state', F => F.strike || (F.sameBus(2) && F.bus - F.busAgo(2) >= .03)],
    angry: ['recent', F => (F.n('fare', 1, e => e.pct <= -.1) + F.n('open', 1, e => e.terr)) > 0 && F.sameBus(1) && F.bus - F.busAgo(1) <= -.02 && !F.answered],
    worried: ['state', F => F.sameBus(2) && F.bus - F.busAgo(2) <= -.05],
    proud: ['state', F => (F.busWar && F.v.busWarAt && F.bus - F.v.busWarAt.bus >= .03) || F.lostMax >= .1 || F.strike],
    surprised: ['recent', F => (F.answered && F.busWar && F.v.busWarAt && F.share - F.v.busWarAt.share >= .02) || (F.sameBus(2) && F.share - F.shareAgo(2) >= .05)],
    disappointed: ['attitude', F => F.busWar && F.v.busWarFrom != null && F.m - F.v.busWarFrom >= 1 && !F.answered],
    determined: ['event', F => F.v.busWarFrom === F.m],
  },
};
const GUARD = {president: 'government', minister: 'government', successor: 'government', treasury: 'treasury', workshop: 'staff', riders: 'riders', mayor: 'territory'};
export function openerTrue(F, person, mood) {
  const o = OPENERS[person]?.[mood];
  if (!o || !o[1](F)) return false;
  const g = GUARD[person];
  if (g && ['happy', 'proud'].includes(mood) && F.g[g] < 40) return false;
  if (g && ['angry', 'disappointed'].includes(mood) && F.g[g] > 60) return false;
  return true;
}
const available = (person, F) => person === 'minister' ? F.office === 'minister' : person === 'successor' ? F.office === 'successor' : true;

// ---------------------------------------------------------------- conflictos (45): cuándo es verdad cada línea y de qué habla
function trackNeed(F) {
  const justBuilt = new Set(within(F.v, F.m, 'work', 1).map(e => F.s.projects.find(p => p.id === e.id)?.target).filter(Boolean));
  for (const r of F.active) {
    const x = F.met.get(r.id); if (x.punctuality >= 85) continue;
    const f = F.s.fleet.find(f => f.id === r.fleet), path = f && X.routeCheck(F.s, r, MODEL[f.model]);
    const t = path?.tramos.map(t => I.tramoDef(F.s, t.id)).find(d => d && d.kind !== 'lav' && F.s.infra.t[d.id]?.v <= 160 && !justBuilt.has(d.id) && !F.works.some(p => p.target === d.id));
    if (t) return {route: r.id, tramo: t.id, km: t.km};
  }
  return null;
}
const instWar = (F, routes, rival) => routes.length ? {key: 'war:' + rival, routes: routes.slice(0, 6).map(r => r.id), rival,
  label: `${rival === 'bus' ? 'Autocares Meseta' : rival === 'rossa' ? 'YaIré' : 'OuiOui'} en ${nameOf(routes[0])}${routes.length > 1 ? ` y ${routes.length - 1} más` : ''}`, sev: Math.min(1, .45 + .08 * routes.length)} : null;
function warTargets(F) {
  const lowgo = F.warRoutes('lowgo'), rossa = F.warRoutes('rossa');
  if (lowgo.length || rossa.length) { const set = [...new Set([...lowgo, ...rossa])]; return {routes: set, rival: lowgo.length ? 'lowgo' : 'rossa'}; }
  if (F.busWar) return {routes: F.active.filter(r => r.km < 400), rival: 'bus'};
  return null;
}
const instLot = (l, why = '') => ({key: 'lot:' + l.f.id, lot: l.f.id, route: l.routes[0].id, cond: Math.round(l.cond), label: `${lotName(l.f)} · ${nameOf(l.routes[0])} · estado ${Math.round(l.cond)} %${why}`, sev: clamp(1 - l.cond / 100, .3, 1)});
const instDrivers = F => ({key: 'drivers', gap: Math.max(0, F.need - F.drivers), label: `Faltan ${F.need - F.drivers} maquinistas · ${Math.round(F.trains * (1 - F.raw))} trenes al día sin cubrir`, sev: clamp((1 - F.raw) * 4, .5, 1)});
function busyStation(F, maxLevel, minPax, needAccess = false) {
  const cities = [...new Set(F.active.flatMap(r => r.ends))].filter(c => !['mad', 'bcn'].includes(c) && CITY[c] && (F.s.stations[c] || 0) <= maxLevel && !F.staffed(c) && (!needAccess || !F.v.access.includes(c)));
  const best = cities.map(c => [c, F.cityPax(c)]).filter(([, p]) => p >= minPax).sort((a, b) => b[1] - a[1])[0];
  return best ? {key: 'city:' + best[0], city: best[0], label: `Estación de ${cityName(best[0])} · ${['Apeadero', 'Estación renovada', 'Intercambiador', 'Gran estación'][F.s.stations[best[0]] || 0]} · ${Math.round(best[1]).toLocaleString('es-ES')} viajeros al día`, sev: clamp(best[1] / 4000, .4, 1)} : null;
}
function terrStation(F) {
  const city = [...new Set(F.terrServed.map(terrCity))].find(c => !F.staffed(c));
  return city ? {key: 'city:' + city, city, label: `Estación de ${cityName(city)} · sin personal`, sev: .6} : null;
}
function terrOpening(F, weakOnly = false) {
  for (const r of F.s.routes.filter(isTerr).sort((a, b) => b.demand - a.demand)) {
    if (r.active && (weakOnly ? r.frequency > 1 : true)) continue;
    const p = morePlan(F.s, r);
    if (p) return {key: 'route:' + r.id, route: r.id, plan: p, label: `${nameOf(r)} · ${r.active ? r.frequency + ' salida por sentido' : 'sin tren'}`, sev: r.active ? .55 : .7};
  }
  return null;
}
function pilotInst(F, list, route) {
  const tech = F.pilotables.find(id => !list || list.includes(id)), r = route || F.busiest;
  return tech && r ? {key: 'tech:' + tech, tech, route: r.id, label: `Piloto: ${T.TECHS[tech].name} en ${nameOf(r)}`, sev: .5} : null;
}
const base0 = F => F.raw < 1 && !F.overtime;
export const TOPICS = {
  president: [
    F => { if (F.overtime || F.drivers - F.need >= 4) return null; const r = F.active.find(r => F.met.get(r.id).occupancy >= .95 && F.lost(r) >= .05 && morePlan(F.s, r)); return r ? {key: 'route:' + r.id, route: r.id, gap: Math.max(0, F.need - F.drivers), label: `${nameOf(r)} · ${pct(F.met.get(r.id).occupancy)} % de ocupación · ${Math.max(0, F.drivers - F.need)} maquinistas de margen`, sev: clamp(F.lost(r) * 3, .5, 1)} : null; },
    F => { const routes = F.active.filter(r => (F.met.get(r.id).rivalShares?.lowgo || 0) >= .15); return routes.length ? {...instWar(F, routes, 'lowgo'), label: `OuiOui: ${pct(F.met.get(routes[0].id).rivalShares.lowgo)} % en ${nameOf(routes[0])}${routes.length > 1 ? ` y ${routes.length - 1} más` : ''}`} : null; },
    F => { const p = upcomingOpening(F); return p; },
    F => F.electionIn <= 12 ? terrOpening(F, true) : null,
    F => F.electionIn <= 12 ? pilotInst(F) : null,
  ],
  minister: [
    F => base0(F) && F.trains > F.trainsAgo(2) ? instDrivers(F) : null,
    F => { if (!(F.net < 0 || F.g.treasury < 50)) return null; const w = warTargets(F); return w ? instWar(F, w.routes, w.rival) : null; },
    F => { const l = F.low(45)[0]; return l ? instLot(l) : null; },
    F => busyStation(F, 1, 800),
    F => pilotInst(F),
  ],
  successor: [
    F => F.raw < .95 && !F.overtime ? instDrivers(F) : null,
    F => { const now = F.warRoutes('rossa'); const started = now.filter(r => !T.competition({...F.s, month: F.m - 1}, r).some(c => c.id === 'rossa' && c.war)); return started.length ? instWar(F, now, 'rossa') : null; },
    F => { const month = F.m % 12; if (month < 4 || month > 7 || !F.n('event', 12, e => e.id === 'heatwave')) return null; const l = F.low(55)[0]; return l ? {...instLot(l, ' · climatización'), lots: F.low(55).slice(0, 3).map(l => l.f.id)} : null; },
    F => (F.v.enc.grudge || F.g.territory < 35 || lastMoodIs(F, 'mayor', ['angry', 'determined'], 2)) ? terrStation(F) : null,
    F => pilotInst(F, ['ertms', 'predictive', 'online']),
  ],
  treasury: [
    F => base0(F) ? instDrivers(F) : null,
    F => { const w = warTargets(F); return w ? instWar(F, w.routes, w.rival) : null; },
    F => { const l = F.low(40)[0]; return l && F.s.cash >= revisionCost(F.s, l.f) ? instLot(l) : null; },
    F => vanityLive(F) ? terrStation(F) : null,
    () => null,
  ],
  adif: [
    F => F.crewsFree === 0 && (F.n('incident', 1) > 0 || trackNeed(F)) ? {key: 'crew', label: `Sin cuadrilla libre: ${F.works.filter(p => p.type !== 'upgrade').length} obras ocupan las 3`, sev: .7} : null,
    F => { const w = warTargets(F); if (!w) return null; const routes = w.routes.filter(r => F.met.get(r.id).occupancy >= .9); return routes.length ? instWar(F, routes, w.rival) : null; },
    F => { if (F.crewsFree < 1) return null; const n = trackNeed(F); return n ? {key: 'route:' + n.route, ...n, label: `${nameOf(routeOf(F.s, n.route))} · ${I.tramoDef(F.s, n.tramo).name} a ${F.s.infra.t[n.tramo].v} km/h · puntualidad ${pct(F.met.get(n.route).punctuality / 100)} %`, sev: .55} : null; },
    F => busyStation(F, 0, 500, true),
    F => pilotInst(F, ['predictive', 'ertms']),
  ],
  workshop: [
    F => F.refits.length >= 2 && F.low(50).length ? {key: 'shop', label: `${F.refits.length} reformas en el taller · ${lotName(F.low(50)[0].f)} al ${Math.round(F.low(50)[0].cond)} %`, sev: .65} : null,
    F => { const w = warTargets(F); if (!w) return null; const routes = w.routes.filter(r => (F.lots.find(l => l.routes.includes(r))?.cond ?? 100) < 60); return routes.length ? instWar(F, routes, w.rival) : null; },
    F => { const l = F.low(40)[0]; return l ? instLot(l) : null; },
    () => null,
    F => pilotInst(F, ['predictive']),
  ],
  riders: [
    F => base0(F) ? instDrivers(F) : null,
    F => F.s.tycoon.policies.includes('dynamic') && F.busiest ? {key: 'dynamic', routes: [F.busiest.id], label: `Tarifas dinámicas activas · ${nameOf(F.busiest)}`, sev: .5} : null,
    F => { const l = F.lots.find(l => l.cond < 50 && l.routes.some(r => F.met.get(r.id).passengers >= 30000)); return l ? instLot(l) : null; },
    F => busyStation(F, 1, 800),
    () => null,
  ],
  mayor: [
    F => base0(F) && F.terrServed.length ? {...instDrivers(F), label: `${instDrivers(F).label} · ${nameOf(F.terrServed[0])}`} : null,
    F => { const r = F.terrServed.find(r => F.met.get(r.id).occupancy < .4 && r.fare >= (ROUTE_DEF[r.id]?.fare ?? r.fare)); return r ? {key: 'route:' + r.id, route: r.id, routes: [r.id], label: `${nameOf(r)} · ${pct(F.met.get(r.id).occupancy)} % de ocupación · ${fmt(r.fare)} €`, sev: .6} : null; },
    F => { const l = F.lots.find(l => l.routes.some(isTerr) && (l.cond < 45 || F.n('breakdown', 1, e => e.fleet === l.f.id) > 0)); return l ? instLot(l) : null; },
    () => null,
    F => { const r = F.terrServed[0]; if (!r) return null; return pilotInst(F, ['ertms', 'predictive'], r); },
  ],
  rival: [
    F => base0(F) ? instDrivers(F) : null,
    F => F.busWar && F.v.busWarFrom != null && F.m - F.v.busWarFrom <= 1 && !F.answered ? instWar(F, F.active.filter(r => r.km < 400), 'bus') : null,
    F => F.n('breakdown', 1) > 0 && F.low(45).length ? instLot(F.low(45)[0]) : null,
    F => { const o = terrOpening(F); return o && !routeOf(F.s, o.route).active ? {...o, label: `${o.label} · solo autobús`} : null; },
    F => (F.busWar || F.active.some(r => F.met.get(r.id).busShare >= .3)) ? pilotInst(F, ['online', 'loyalty']) : null,
  ],
};
function upcomingOpening(F) {
  for (const p of F.works.filter(p => p.due <= F.m + 1 && p.type !== 'upgrade')) {
    const nodes = p.type === 'changer' ? [p.target] : p.type === 'tramo' ? [I.tramoDef(F.s, p.target)?.a, I.tramoDef(F.s, p.target)?.b] : [];
    const r = F.active.find(r => nodes.some(n => n && r.via.includes(n)));
    const l = r && F.lots.find(l => l.routes.includes(r));
    if (l && l.cond < 50) return {...instLot(l, ' · inauguración'), work: p.id};
  }
  return null;
}
const revisionCost = (s, f) => r2(Math.max(.4, .12 * f.qty));
/** Cuerpos que este motor no puede hacer verdad (no modela la cuadrilla de reserva de provincias, el apeadero de Villanueva,
 *  la partida de pilotos de Hacienda ni los fallos de la aplicación) o cuyo arranque contradice al conflicto. */
const RETIRED_HERE = new Set(['scene-minister-happy-0', 'scene-riders-happy-0']);
const RETIRED_TOPICS = new Set(['treasury|4', 'workshop|3', 'riders|4', 'mayor|3']);
export function selectable(id) { const e = ENCOUNTER[id]; return !!e && !RETIRED.has(id) && !RETIRED_HERE.has(id) && !RETIRED_TOPICS.has(e.person + '|' + e.topic); }
export function topicInstance(F, person, k) { const fn = TOPICS[person]?.[k]; return fn ? fn(F) : null; }

// ---------------------------------------------------------------- respuestas de los encuentros: efecto real, coste y plazo
function sceneOptions(s, sc) {
  const p = sc.person, k = sc.topic, i = sc.inst || {}, m = s.month;
  const r = i.route ? routeOf(s, i.route) : null, lot = i.lot ? s.fleet.find(f => f.id === i.lot) : null;
  if (k === 0) {
    if (p === 'adif') return [
      {cost: .36, detail: '−0,36 M€ · cuadrilla de guardia subcontratada un mes: incidencias con la mitad de demora', apply: () => addMod(s, {kind: 'oncall', until: m + 1, label: 'Cuadrilla de guardia'})},
      {detail: 'Sin coste · sin cuadrilla de guardia: incidencias un 25 % más largas durante un mes', apply: () => addMod(s, {kind: 'nocrew', until: m + 1, label: 'Sin cuadrilla de guardia'})}];
    if (p === 'workshop') return [
      {cost: .6, detail: `−0,6 M€ · turno de noche un mes: ${count(s.refits.filter(r => !r.done && r.due - 1 >= m + 1).length, 'reforma sale', 'reformas salen')} un mes antes · Plantilla +4`, trust: {staff: 4}, apply: () => { for (const x of s.refits.filter(r => !r.done && r.due - 1 >= m + 1)) x.due--; X.log(s, 'Turno de noche en el taller', 'Las reformas en curso salen un mes antes.'); }},
      {detail: 'Sin coste · las reformas en curso tardan un mes más y los trenes gastados fallan más · Plantilla −3', trust: {staff: -3}, apply: () => { for (const x of s.refits.filter(r => !r.done)) x.due++; for (const l of s.fleet.filter(f => f.condition < 50 && s.routes.some(r => r.active && r.fleet === f.id))) addMod(s, {kind: 'risk', fleet: l.id, value: 1.25, until: m + 1, label: 'Taller saturado'}); }}];
    const gap = Math.max(0, T.driverNeed(s) - s.tycoon.drivers), extra = p === 'president' && r ? morePlan(s, r) : null;
    const cost = r2(Math.max(.3, gap * .02)), delta = extra ? planDelta(s, extra) : 0;
    const A = {cost, loss: -delta * 12, trust: {staff: 4}, detail: `−${fmt(cost)} M€ · horas extra un mes: todos los trenes con maquinista${extra ? ` y +1 salida en ${nameOf(r)} (${perMonth(delta)})` : ''} · Plantilla +4`,
      apply: () => { addMod(s, {kind: 'overtime', until: m + 1, label: 'Horas extra de maquinistas'}); if (extra) runPlan(s, extra); if (gap > 0) { trust(s, {riders: 2}); s.satisfaction = clamp(s.satisfaction + 1, 0, 100); } }};
    if (p === 'successor' || p === 'treasury') {
      const cuts = trimPlan(s);
      return [A, {detail: `Sin coste · ${cuts.length ? `recorta ${cuts.length} salidas en las líneas que menos dejan` : 'sin salidas que recortar'} · Viajeros −2${p === 'treasury' ? ' · Hacienda +2' : ''}`, trust: p === 'treasury' ? {riders: -2, treasury: 2} : {riders: -2},
        apply: () => { for (const c of cuts) { const x = routeOf(s, c); const f = s.fleet.find(f => f.id === x.fleet); x.frequency = Math.max(1, x.frequency - 1); x.units = X.requiredUnits(s, x, MODEL[f.model], x.frequency); } if (cuts.length) X.log(s, 'Oferta ajustada a la plantilla', `${cuts.length} salidas menos en las líneas que menos dejan.`); }}];
    }
    const extraTrust = p === 'mayor' ? {territory: -4} : p === 'riders' ? {riders: -3} : {};
    return [A, {detail: `Sin coste · se suprimen los trenes sin maquinista y −2 de puntualidad un mes · −1 de reputación · Plantilla −3${p === 'mayor' ? ' · Territorio −4' : p === 'riders' ? ' · Viajeros −3' : ''}`, trust: {staff: -3, ...extraTrust}, reputation: -1,
      apply: () => addMod(s, {kind: 'rel', value: -2, until: m + 1, label: 'Turnos estirados'})}];
  }
  if (k === 1) {
    if (p === 'mayor' && r) {
      const loss = r2((X.metrics(s, r).revenue || 0) * .2 * 6);
      return [{cost: .1, loss, detail: `−0,1 M€ · billete rural: ${nameOf(r)} −20 % durante 6 meses (≈ −${fmt(loss)} M€ en billetes) · Territorio +4`, trust: {territory: 4, riders: 1},
        apply: () => { addMod(s, {kind: 'fare', value: .8, routes: [r.id], until: m + 6, label: 'Billete rural −20 %'}); note(s, 'concession'); note(s, 'fare', {route: r.id, pct: -.2}); }},
      {detail: 'Tarifa sin cambios · Territorio −4', trust: {territory: -4}, apply: () => note(s, 'affront')}];
    }
    const routes = (i.routes || []).map(id => routeOf(s, id)).filter(x => x && x.active);
    const loss = r2(routes.reduce((n, x) => n + X.metrics(s, x).revenue, 0) * .15 * 3);
    const hTrust = p === 'minister' ? -4 : p === 'treasury' ? -3 : -2;
    return [{cost: .3, loss, detail: `−0,3 M€ de campaña · tarifas −15 % tres meses en ${routes.length} línea${routes.length === 1 ? '' : 's'} (≈ −${fmt(loss)} M€ en billetes)${p === 'riders' ? ' · precio fijo, sin tarifas dinámicas' : ''}${p === 'workshop' ? ' · esos trenes se gastan un 15 % más' : ''} · Viajeros +3 · Hacienda ${signed(hTrust)}`,
      trust: {riders: 3, treasury: hTrust}, reason: routes.length ? null : 'Ya no hay líneas en disputa',
      apply: () => {
        addMod(s, {kind: 'fare', value: .85, routes: routes.map(x => x.id), until: m + 3, label: 'Campaña de descuentos'});
        if (p === 'workshop') for (const id of new Set(routes.map(x => x.fleet))) addMod(s, {kind: 'wear', fleet: id, value: 1.15, until: m + 3, label: 'Trenes más llenos'});
        if (p === 'riders') s.tycoon.policies = s.tycoon.policies.filter(x => x !== 'dynamic');
        const v = ensure(s); if (i.rival === 'bus' && v.busWarFrom != null) v.answered = v.busWarFrom;
        note(s, 'concession'); for (const x of routes) note(s, 'fare', {route: x.id, pct: -.15});
      }},
    {detail: `Tarifas sin cambios${p === 'riders' ? ' y tarifas dinámicas · Viajeros −3' : ' · Hacienda +2 · Viajeros −1'}`, trust: p === 'riders' ? {riders: -3} : {treasury: 2, riders: -1}, apply: () => { if (p === 'riders') note(s, 'affront'); }}];
  }
  if (k === 2) {
    if (p === 'adif' && r) {
      const km = i.km || 100, cost = r2(Math.max(.1, km * .0003));
      return [{cost, detail: `−${fmt(cost)} M€ · vía inspeccionada: sin averías de señalización y +2 de puntualidad en ${nameOf(r)} durante 3 meses`,
        apply: () => { addMod(s, {kind: 'inspected', routes: [r.id], until: m + 3, label: 'Vía inspeccionada'}); addMod(s, {kind: 'rel', value: 2, routes: [r.id], until: m + 3, label: 'Vía inspeccionada'}); }},
      {detail: `Sin coste · el mes que viene, limitación de velocidad en ${nameOf(r)}: trayectos un 10 % más lentos`,
        apply: () => addMod(s, {kind: 'speed', value: 1.1, routes: [r.id], from: m + 1, until: m + 2, label: 'Limitación temporal de velocidad'})}];
    }
    const lots = (i.lots || (lot ? [lot.id] : [])).map(id => s.fleet.find(f => f.id === id)).filter(Boolean);
    const cost = r2(lots.reduce((n, f) => n + revisionCost(s, f), 0));
    const names = lots.map(f => `${lotName(f)} ${Math.round(f.condition)} % → ${Math.round(Math.min(95, f.condition + 25))} %`).join(', ');
    const B = p === 'mayor' ? {territory: -3, riders: -2} : {riders: -2};
    return [{cost, trust: {staff: 3}, reputation: 1, reason: lots.length ? null : 'Ese tren ya no está en servicio',
      detail: `−${fmt(cost)} M€ · revisión de ${names || 'el tren señalado'} · Plantilla +3`,
      apply: () => { for (const f of lots) { if (f.condition >= 45) note(s, 'preventive', {fleet: f.id}); f.condition = Math.min(95, f.condition + 25); } X.log(s, 'Revisión extraordinaria', names); }},
    {detail: `Sin coste · ${lots.map(lotName).join(', ') || 'el tren'} sigue en servicio con más riesgo de avería dos meses · ${p === 'mayor' ? 'Territorio −3 · ' : ''}Viajeros −2`, trust: B,
      apply: () => { const v = ensure(s); for (const f of lots) { v.enc.warned[f.id] = m; addMod(s, {kind: 'risk', fleet: f.id, value: 1.5, until: m + 2, label: 'Aviso del taller'}); } note(s, 'affront'); }}];
  }
  if (k === 3) {
    if (i.plan) {
      const target = routeOf(s, i.route), plan = morePlan(s, target), cost = r2((plan?.open ? 4 : 0) + .12), city = terrCity(target), delta = plan ? planDelta(s, plan) : 0;
      return [{cost, loss: -delta * 12, trust: {territory: 5}, reason: plan ? null : 'Ya no hay material libre para esa línea',
        detail: `−${fmt(cost)} M€ · ${plan?.open ? `abre ${nameOf(target)} con ${plan.frequency} salidas` : `+1 salida en ${nameOf(target)}`} (${perMonth(delta)}) y personal en la estación de ${cityName(city)} 6 meses · Territorio +5`,
        apply: () => { runPlan(s, plan); addMod(s, {kind: 'staffed', city, value: 1.03, until: m + 6, label: 'Atención en ' + cityName(city)}); }},
      {detail: `Sin coste · ${cityName(city)} sigue igual: −2 % de viajeros 6 meses · −1 de reputación · Territorio −4`, trust: {territory: -4}, reputation: -1,
        apply: () => addMod(s, {kind: 'unstaffed', city, value: .98, until: m + 6, label: 'Información a distancia en ' + cityName(city)})}];
    }
    const city = i.city, access = p === 'adif', cost = access ? .37 : .12;
    return [{cost, trust: {territory: 5, riders: 1}, reason: city ? null : 'Sin estación',
      detail: `−${fmt(cost)} M€ · personal en la estación de ${cityName(city)} 6 meses: +3 % de viajeros${access ? ' y accesos nuevos (+2 % para siempre)' : ''} · Territorio +5`,
      apply: () => { addMod(s, {kind: 'staffed', city, value: 1.03, until: m + 6, label: 'Atención en ' + cityName(city)}); if (access) ensure(s).access.push(city); if (p === 'successor') ensure(s).enc.grudge = false; note(s, 'concession'); }},
    {detail: `Sin coste · información a distancia en ${cityName(city)}: −2 % de viajeros 6 meses · −1 de reputación · Territorio −4${p === 'successor' ? ' · el alcalde se planta (−6 más)' : ''}`,
      trust: p === 'successor' ? {territory: -10} : {territory: -4}, reputation: -1,
      apply: () => { addMod(s, {kind: 'unstaffed', city, value: .98, until: m + 6, label: 'Información a distancia en ' + cityName(city)}); if (p === 'successor') { ensure(s).enc.planted = m; X.log(s, 'El alcalde acampa en el ministerio', 'Paco Terruño ha traído silla.'); } note(s, 'affront'); }}];
  }
  const tech = i.tech, q = T.TECHS[tech], cost = q ? r2(q.cost * .3) : 0;
  return [{cost, trust: {government: 3}, reason: q && r?.active ? null : 'El piloto ya no tiene dónde probarse',
    detail: `−${fmt(cost)} M€ · ${q?.name || 'la mejora'} en ${nameOf(r)} durante 2 meses (${q?.note || ''}); si luego la investigas, se descuenta · Gobierno +3`,
    apply: () => { addMod(s, {kind: 'pilot', tech, routes: [r.id], until: m + 2, label: 'Piloto: ' + q.name}); ensure(s).credit[tech] = {amount: cost, until: m + 5}; X.log(s, 'Piloto en marcha', `${q.name} en ${nameOf(r)} durante dos meses.`); }},
  {detail: `Sin coste · ${q?.name || 'la mejora'} no se puede probar en 3 meses · Gobierno −2${p === 'mayor' ? ' · Territorio −2' : ''}${p === 'rival' ? ' · Autocares Meseta la copia: −2 % de viajeros en tus líneas cortas 6 meses' : ''}`,
    trust: p === 'mayor' ? {government: -2, territory: -2} : {government: -2},
    apply: () => { ensure(s).enc.cool[tech] = m + 3; note(s, 'dither'); if (p === 'rival') addMod(s, {kind: 'demand', value: .98, routes: s.routes.filter(x => x.km < 400).map(x => x.id), until: m + 6, label: 'Autocares Meseta copia la mejora'}); }}];
}
/** Salidas que sobran para que la plantilla cubra el horario, empezando por las líneas que menos dejan. */
function trimPlan(s) {
  const plan = [], freq = new Map(s.routes.filter(r => r.active).map(r => [r.id, r.frequency]));
  const need = () => Math.ceil([...freq.values()].reduce((n, f) => n + f * 2, 0) * .55);
  // Nunca recorta una línea con una petición de más trenes de la ciudad: eso la incumpliría.
  const asked = new Set((s.requests || []).filter(q => q.type === 'more').map(q => q.route));
  const order = s.routes.filter(r => r.active && !asked.has(r.id)).map(r => [r, X.metrics(s, r).net / Math.max(1, r.frequency)]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
  for (let guard = 0; need() > s.tycoon.drivers && guard < 200; guard++) {
    const r = order.find(r => freq.get(r.id) > 1); if (!r) break;
    freq.set(r.id, freq.get(r.id) - 1); plan.push(r.id);
  }
  return plan;
}
function sceneView(s, d) {
  const v = ensure(s), sc = v.scene?.id === d.id ? v.scene : null, base = ENCOUNTER[d.id];
  if (!sc) return {...base, instance: null, choices: base.choices.map((c, i) => ({...c, cost: 0, disabled: i === 0, reason: i === 0 ? 'Ya no aplica' : null, effects: {}}))};
  const opts = sceneOptions(s, sc);
  return {...base, instance: sc.inst?.label || null, choices: base.choices.map((c, i) => ({label: c.label, kind: c.kind, detail: opts[i].detail, cost: opts[i].cost || 0, estimate: r2(-(opts[i].cost || 0) - (opts[i].loss || 0)), disabled: !!opts[i].reason, reason: opts[i].reason || null, effects: {cash: -(opts[i].cost || 0)}}))};
}
function applyScene(s, d, index) {
  const v = ensure(s), sc = v.scene?.id === d.id ? v.scene : null, c = d.choices[index];
  if (c.disabled) throw Error(c.reason || 'Esa opción ya no está disponible.');
  if (c.cost > 0 && c.cost > s.cash) throw Error('No hay dinero. Ni para eso ni para casi nada: mira Finanzas.');
  if (sc) {
    const o = sceneOptions(s, sc)[index];
    if (c.cost) { s.cash -= c.cost; noteSpend(s, c.cost); }
    s.reputation = clamp(s.reputation + (o.reputation || 0), 5, 100);
    trust(s, o.trust);
    o.apply();
    const e = v.enc, m = s.month;
    e.last = m; e.person[sc.person] = m; e.mood[sc.person + '|' + sc.mood] = m; e.pt[sc.person + '|' + sc.topic] = m; e.topic[sc.topic] = m;
    if (sc.inst?.key) e.inst[sc.inst.key] = m;
    if (!e.used.includes(sc.id)) e.used.push(sc.id);
    e.lastMood[sc.person] = {mood: sc.mood, m};
  }
  s.tycoon.encounter = null; v.scene = null;
  return null;
}

// ---------------------------------------------------------------- selección de encuentros
const TIER_W = {event: 1, recent: .8, state: .6, attitude: .4}, TIER_RANK = {event: 0, recent: 1, state: 2, attitude: 3};
const STAKE = [{workshop: 1, adif: 1, riders: 1, treasury: 1}, {rival: 1, treasury: 1, riders: 1, mayor: 1, president: .7, successor: .7, minister: .7, adif: .5, workshop: .5},
  {workshop: 1, adif: 1, riders: .7, mayor: .7, treasury: .7}, {mayor: 1, riders: 1, adif: 1}, {minister: 1, successor: 1, adif: 1, workshop: 1}];
const stakeOf = (k, p) => STAKE[k][p] ?? [.5, .5, .5, .6, .6][k];
export const COOLDOWN = {gap: 2, person: 3, personMood: 9, personTopic: 9, topic: 2, instance: 4};
const INDEX = new Map(ENCOUNTERS.map((x, i) => [x.id, i]));
function feasible(s, sc) { const o = sceneOptions(s, sc)[0]; return !o.reason && (o.cost || 0) <= s.cash - 2; }
/** Candidatos verdaderos ahora mismo (para elegir, comprobar o probar). */
export function candidates(s, F = facts(s)) {
  const v = ensure(s), e = v.enc, m = s.month, out = [];
  for (const person of PEOPLE) {
    if (!available(person, F) || m - (e.person[person] ?? -99) < COOLDOWN.person) continue;
    const moods = EMOTIONS.filter(mood => openerTrue(F, person, mood) && m - (e.mood[person + '|' + mood] ?? -99) >= COOLDOWN.personMood)
      .sort((a, b) => TIER_RANK[OPENERS[person][a][0]] - TIER_RANK[OPENERS[person][b][0]] || (e.mood[person + '|' + a] ?? -99) - (e.mood[person + '|' + b] ?? -99) || EMOTIONS.indexOf(a) - EMOTIONS.indexOf(b));
    if (!moods.length) continue;
    for (let k = 0; k < 5; k++) {
      if (m - (e.topic[k] ?? -99) < COOLDOWN.topic || m - (e.pt[person + '|' + k] ?? -99) < COOLDOWN.personTopic) continue;
      const inst = topicInstance(F, person, k);
      if (!inst || m - (e.inst[inst.key] ?? -99) < COOLDOWN.instance) continue;
      const mood = moods.find(md => { const id = `scene-${person}-${md}-${k}`; return selectable(id) && !e.used.includes(id); });
      if (!mood) continue;
      const sc = {id: `scene-${person}-${mood}-${k}`, person, mood, topic: k, inst, m};
      if (!feasible(s, sc)) continue;
      out.push({...sc, score: .55 * inst.sev + .25 * stakeOf(k, person) + .2 * TIER_W[OPENERS[person][mood][0]]});
    }
  }
  return out.sort((a, b) => b.score - a.score || INDEX.get(a.id) - INDEX.get(b.id));
}
/** Al cerrar el mes: como mucho un encuentro, y solo si su arranque y su conflicto son ciertos. Si nada lo es, silencio. */
export function pickEncounter(s) {
  const v = ensure(s), m = s.month;
  if (s.ended || m < 3 || s.tycoon.encounter || s.event || X.storyPending(s) || m - v.enc.last < COOLDOWN.gap) return null;
  const best = candidates(s)[0];
  if (!best || (best.score < .45 && m - v.enc.last < 4)) return null;
  s.tycoon.encounter = best.id; s.tycoon.encounterCount++;
  v.scene = {id: best.id, person: best.person, mood: best.mood, topic: best.topic, inst: best.inst, m};
  return best;
}
/** Antes de enseñarlo: si ya no es verdad, se descarta en silencio. */
export function revalidate(s) {
  const v = ensure(s), id = s.tycoon.encounter;
  if (!id) return true;
  const sc = v.scene;
  let ok = !!sc && sc.id === id && selectable(id) && !v.enc.used.includes(id);
  if (ok) {
    const F = facts(s);
    ok = available(sc.person, F) && openerTrue(F, sc.person, sc.mood);
    const inst = ok ? topicInstance(F, sc.person, sc.topic) : null;
    ok = !!inst;
    if (ok) sc.inst = inst;
  }
  if (!ok) { s.tycoon.encounter = null; v.scene = null; }
  return ok;
}
/** Prepara un encuentro concreto si ahora es verdad (pruebas y herramientas); nunca fuerza uno falso. */
export function stage(s, id) {
  const e = ENCOUNTER[id]; if (!e || !selectable(id)) return false;
  const F = facts(s);
  if (!available(e.person, F) || !openerTrue(F, e.person, e.mood)) return false;
  const inst = topicInstance(F, e.person, e.topic); if (!inst) return false;
  s.tycoon.encounter = id; ensure(s).scene = {id, person: e.person, mood: e.mood, topic: e.topic, inst, m: s.month};
  return true;
}

// ---------------------------------------------------------------- decisiones e imprevistos con efecto real
const WHEN = {
  summer: s => [5, 6, 7].includes(s.month % 12),
  wifiOff: s => !s.tycoon.policies.includes('wifi'),
  aveWanted: s => !!aveWantedCity(s),
  punctualRoute: s => !!punctualRoute(s),
  workAhead: s => !!workAhead(s),
  aveRoute: s => !!bestAve(s),
  teruelDiesel: s => ['zar-ter', 'ter-sag'].some(id => s.infra.t[id]?.e === 'no') && !ensure(s).promises.some(p => p.kind === 'electrify' && !p.status) && !s.projects.some(p => !p.done && p.type === 'tramo' && p.work === 'electrify' && ['zar-ter', 'ter-sag'].includes(p.target)),
};
export function dueNow(s, d) { return (!d.after || s.infra.h.includes(d.after)) && (!d.when || WHEN[d.when](s)); }
export function eventEligible(s, e) { return !e.when || WHEN[e.when](s); }
function aveWantedCity(s) {
  const ave = X.aveCities(s);
  const r = s.routes.filter(r => r.active && X.product(s, r) === 'Alvia').map(r => [r, r.ends.find(c => POP[c] && !['mad', 'bcn'].includes(c) && !ave.has(c))]).filter(x => x[1]).sort((a, b) => POP[b[1]] - POP[a[1]])[0];
  return r ? {city: r[1], route: r[0].id} : null;
}
function punctualRoute(s) { return s.routes.filter(r => r.active).map(r => [r, X.metrics(s, r)]).filter(([, x]) => x.punctuality >= 95).sort((a, b) => b[1].passengers - a[1].passengers)[0]?.[0] || null; }
function workAhead(s) { return s.projects.filter(p => !p.done && p.type !== 'upgrade' && !p.delay && (s.month - p.started) / Math.max(1, p.due - p.started) >= .5).sort((a, b) => a.due - b.due)[0] || null; }
function bestAve(s) { return s.routes.filter(r => r.active && X.product(s, r) === 'AVE').map(r => [r, X.metrics(s, r)]).sort((a, b) => b[1].passengers - a[1].passengers)[0]?.[0] || null; }
const workName = (s, p) => p.type === 'infrastructure' ? (PROJECTS.find(x => x.id === p.id)?.name || 'Línea de alta velocidad') : p.type === 'changer' ? 'Cambiador de ancho en ' + (I.NODES[p.target]?.name || p.target) : p.type === 'tramo' || p.type === 'custom' ? (I.WORKS[p.work]?.label ? I.WORKS[p.work].label + ' · ' : '') + (I.tramoDef(s, p.target)?.name || p.target) : p.id;
function chanceOf(s, kind, inst) {
  if (kind === 'audit') {
    const year = s.history.slice(-12), bad = year.filter(h => h.net < 0).length, lev = s.debt / Math.max(1, s.cash + s.debt);
    return clamp(.85 - .05 * bad - .3 * lev, .15, .9);
  }
  const r = inst?.route ? routeOf(s, inst.route) : bestAve(s);
  if (!r?.active) return .5;
  const f = s.fleet.find(f => f.id === r.fleet);
  return clamp(X.metrics(s, r).punctuality / 100 * (.8 + .2 * (f?.condition ?? 70) / 100), .05, .97);
}
/** Lo que un imprevisto necesita fijar al aparecer: su instancia y, si es una apuesta, la tirada. */
export function freezeEvent(s, e) {
  const v = ensure(s), inst = {};
  if (e.id === 'cable') {
    const use = new Map();
    for (const r of s.routes.filter(r => r.active)) { const f = s.fleet.find(f => f.id === r.fleet); for (const t of X.routeCheck(s, r, MODEL[f.model]).tramos) { const d = I.tramoDef(s, t.id); if (d && d.kind !== 'lav') use.set(t.id, (use.get(t.id) || 0) + 1); } }
    const best = [...use].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (best) { inst.tramo = best[0]; inst.label = 'Tramo afectado: ' + I.tramoDef(s, best[0]).name; }
  } else if (e.id === 'mayorchain') { const w = aveWantedCity(s); if (w) { inst.city = w.city; inst.route = w.route; inst.label = cityName(w.city) + ' quiere AVE'; } }
  else if (e.id === 'influencer') { const r = punctualRoute(s); if (r) { inst.route = r.id; inst.label = `${nameOf(r)} · ${Math.round(X.metrics(s, r).punctuality)} % de puntualidad`; } }
  else if (e.id === 'adifdelay') { const p = s.projects.filter(p => !p.done && p.type !== 'upgrade').sort((a, b) => b.due - a.due || a.id.localeCompare(b.id))[0]; if (p) { inst.work = p.id; inst.label = 'Obra: ' + workName(s, p); } }
  else if (e.id === 'adifboost') { const p = workAhead(s); if (p) { inst.work = p.id; inst.label = 'Obra: ' + workName(s, p); } }
  else if (e.id === 'royal') { const r = bestAve(s); if (r) inst.route = r.id; }
  const gamble = e.choices.find(c => c.gamble)?.gamble;
  if (gamble) { inst.chance = chanceOf(s, gamble.chance, inst); inst.draw = X.random(s); }
  if (e.id === 'royal' && inst.route) inst.label = `${nameOf(routeOf(s, inst.route))} · ${pct(inst.chance)} % de que todo salga bien`;
  if (e.id === 'audit') inst.label = `${pct(inst.chance)} % de que tus cuentas aguanten la revisión`;
  v.frozen = {id: e.id, ...inst};
}
function launchRoutes(s, city) { return s.routes.filter(r => r.ends.includes(city) || r.via.includes(city)).map(r => r.id); }
function energyBill(s) {
  let bill = 0;
  for (const r of s.routes.filter(r => r.active)) { const f = s.fleet.find(f => f.id === r.fleet), m = f && MODEL[f.model]; if (!m) continue; const p = X.routeCheck(s, r, m), km = r.real ? r.km : (p.km || r.km); bill += r.frequency * 2 * 30 * km * m.energy * 2.8 * X.costIndex(s) / 1e6; }
  return bill;
}
const exposure = s => r2(12 * energyBill(s) * (ENERGY_SPIKE - 1));
const hedgeCost = s => Math.max(1, Math.round(exposure(s) * .5 * 10) / 10);
function alviaPlans(s) {
  const routes = s.routes.filter(r => r.active && X.product(s, r) === 'Alvia').map(r => [r, X.metrics(s, r).occupancy]).sort((a, b) => b[1] - a[1] || a[0].id.localeCompare(b[0].id)).map(x => x[0]);
  return plansFor(s, routes, 4, ['Alvia']);
}
function asturiasPlan(s) { return plansFor(s, s.routes.filter(r => r.ends.some(c => ['gij', 'ovi', 'avl'].includes(c))).sort((a, b) => b.ends.includes('mad') - a.ends.includes('mad') || b.demand - a.demand || a.id.localeCompare(b.id)), 2, ['Alvia']); }
function extremaduraTramos(s) { return ['mad-tal', 'tal-pla'].filter(id => s.infra.t[id]?.e === 'no' && I.tramoWorks(s, id).some(w => w.work === 'electrify' && !w.busy)); }
const servedTerr = s => TERRITORY.filter(c => s.routes.some(r => r.active && r.frequency >= 2 && r.ends.includes(c))).length;
function hasFreeAve(s) { return freeUnits(s, 'AVE') >= 1; }
const ACT = {
  hedge: {cost: s => hedgeCost(s), loss: () => 0, detail: s => `−${fmt(hedgeCost(s))} M€ ahora · precio de la luz fijo un año (sin seguro: ≈ −${fmt(exposure(s))} M€)`,
    apply: s => { s.flags.energy = s.month + 12; s.flags.hedge = s.month + 12; }},
  nohedge: {loss: s => exposure(s), detail: s => `Sin pagar ahora · la luz sube un ${pct(ENERGY_SPIKE - 1)} % durante un año: ≈ −${fmt(exposure(s))} M€`, apply: s => { s.flags.energy = s.month + 12; }},
  launch: {detail: (s, c) => { const n = launchRoutes(s, c.city).filter(id => routeOf(s, id).active).length; return `${c.detail.split(' · +10')[0]} · +10 % de viajeros en ${n ? count(n, 'línea', 'líneas') : 'las líneas que abras'} por ${cityName(c.city)} durante 6 meses`; },
    apply: (s, c) => { addMod(s, {kind: 'demand', value: 1.1, routes: launchRoutes(s, c.city), until: s.month + 6, label: 'Campaña en ' + cityName(c.city), vanity: true}); note(s, 'vanity'); }},
  launchAve: {detail: s => `−15 M€ · +6 de reputación · +10 % de viajeros en ${count(s.routes.filter(r => r.active && X.product(s, r) === 'AVE').length, 'línea AVE', 'líneas AVE')} durante 6 meses`,
    apply: s => { addMod(s, {kind: 'demand', value: 1.1, routes: s.routes.filter(r => r.active && X.product(s, r) === 'AVE').map(r => r.id), until: s.month + 6, label: 'Relanzamiento del AVE', vanity: true}); note(s, 'vanity'); }},
  alviaBoost: {reason: s => alviaPlans(s).length ? null : 'Sin Alvia libres para reforzar ninguna línea',
    loss: s => -r2(alviaPlans(s).reduce((n, p) => n + planDelta(s, p), 0) * 18),
    detail: s => `+65 M€ · +1 salida en ${alviaPlans(s).length} Alvia (${alviaPlans(s).map(p => nameOf(routeOf(s, p.route))).join(', ') || 'ninguno'}; ${perMonth(r2(alviaPlans(s).reduce((n, p) => n + planDelta(s, p), 0)))}) · +15 % de demanda en los Alvia durante año y medio`,
    apply: s => { for (const p of alviaPlans(s)) runPlan(s, p); s.flags.passes = s.month + 18; X.log(s, 'Alvia reforzados', 'Una salida más por sentido donde había trenes libres.'); }},
  passes: {apply: s => { s.flags.passes = s.month + 18; }},
  // Allí donde compita YaIré durante los dos años, también en las líneas a las que llegue después.
  rossaQuality: {apply: s => { addMod(s, {kind: 'rel', value: 3, rival: 'rossa', until: s.month + 24, label: 'Servicio a bordo frente a YaIré'}); }},
  asturias: {cost: s => { const p = asturiasPlan(s); return 12 + 4 * p.filter(x => x.open).length; },
    loss: s => -r2(asturiasPlan(s).reduce((n, p) => n + planDelta(s, p), 0) * 12),
    detail: s => { const p = asturiasPlan(s); return p.length ? `−${12 + 4 * p.filter(x => x.open).length} M€ · +5 de reputación · ${p.map(x => (x.open ? 'abre ' : '+1 salida en ') + nameOf(routeOf(s, x.route)) + ` (${perMonth(planDelta(s, x))})`).join(' · ')}` : `−12 M€ · +5 de reputación · sin Alvia libres: compromiso de Alvia a Asturias antes de ${X.dateOf(s.month + 6)}`; },
    apply: s => { const p = asturiasPlan(s); if (p.length) { for (const x of p) runPlan(s, x); X.log(s, 'Alvia a Asturias', p.map(x => nameOf(routeOf(s, x.route))).join(', ')); } else promise(s, {kind: 'asturias', due: s.month + 6, label: 'Alvia a Asturias', penalty: {reputation: -5, territory: -8}}); }},
  extremadura: {reason: s => extremaduraTramos(s).length ? null : 'La catenaria hasta Plasencia ya está en obras o terminada',
    detail: s => { const t = extremaduraTramos(s); const months = Math.max(0, ...t.map(id => I.tramoWorks(s, id).find(w => w.work === 'electrify').duration)); return `−20 M€ · +6 de reputación · catenaria en ${t.map(id => I.tramoDef(s, id).name).join(' y ') || 'ningún tramo'} (${months} meses); el resto lo paga el Ministerio`; },
    apply: s => { const t = extremaduraTramos(s); for (const id of t) X.startWork(s, 'electrify', id, 0); X.log(s, 'Plan Extremadura', 'Obras de catenaria hasta Plasencia, cofinanciadas por el Ministerio.'); }},
  resilience: {apply: s => { s.flags.resilience = 1e6; }},
  heatCut: {detail: s => `Sin coste · −4 de reputación · −20 % de trenes en ${count(s.routes.filter(r => r.active && hot(r)).length, 'línea', 'líneas')} del sur este verano, sin perder puntualidad`,
    apply: s => { const routes = s.routes.filter(r => r.active && hot(r)).map(r => r.id); addMod(s, {kind: 'service', value: .8, routes, until: s.month + 3, label: 'Oferta de verano reducida'}); addMod(s, {kind: 'rel', value: 4, routes, until: s.month + 3, label: 'Oferta de verano reducida'}); }},
  rural: {loss: () => -6 * 60, detail: s => `+6 M€ al mes durante 5 años si mantienes ${count(Math.max(1, servedTerr(s)), 'ciudad rural', 'ciudades rurales')} con 2 salidas · +3 de reputación`,
    apply: s => { s.flags.rural = s.month + 60; ensure(s).rural = {base: Math.max(1, servedTerr(s)), miss: 0, ok: true}; }},
  pledgeNetwork: {apply: s => promise(s, {kind: 'network', target: s.routes.filter(r => r.active).length, due: 347, label: 'Red para todos: no cerrar servicios', penalty: {reputation: -10, government: -15}, score: true})},
  pledgeAccounts: {apply: s => promise(s, {kind: 'solvent', due: 347, label: 'Cuentas saneadas en 2050', penalty: {reputation: -10, treasury: -15}, score: true})},
  cable: {detail: (s, c, d, fr) => fr?.tramo ? `Sin coste · −10 de puntualidad 2 meses en las líneas por ${I.tramoDef(s, fr.tramo).name}` : c.detail,
    apply: (s, c, d, fr) => { if (!fr?.tramo) return; const routes = s.routes.filter(r => r.active && X.routeUses(s, r, fr.tramo)).map(r => r.id); addMod(s, {kind: 'rel', value: -10, routes, until: s.month + 2, label: 'Cable robado: ' + I.tramoDef(s, fr.tramo).name}); }},
  minimum: {apply: s => { addMod(s, {kind: 'service', byFamily: {AVE: .5, Alvia: .75}, until: s.month + 1, tag: 'strike', label: 'Servicios mínimos por huelga'}); X.log(s, 'Servicios mínimos', 'AVE al 50 % y Alvia al 75 % durante la huelga.'); }},
  wifiOn: {apply: s => { if (!s.tycoon.policies.includes('wifi')) s.tycoon.policies.push('wifi'); }},
  freeze: {loss: (s, c) => r2(estimateSubsidy(s) * c.cut * 12), detail: (s, c) => { const loss = r2(estimateSubsidy(s) * c.cut * 12); return `Sin pago inmediato · transferencias −${pct(c.cut)} % durante un año (≈ −${fmt(loss)} M€)${c.trust?.government ? ` · ${signed(c.effects?.reputation || 0)} de reputación · Gobierno ${signed(c.trust.government)}` : ''}`; },
    apply: (s, c) => addMod(s, {kind: 'transfer', value: 1 - c.cut, until: s.month + 12, label: `Transferencias −${pct(c.cut)} %`})},
  study: {detail: (s, c, d, fr) => fr?.city ? `−3 M€ · +2 de reputación · estudio del AVE a ${cityName(fr.city)}: en 6 meses, petición formal con premio` : c.detail,
    apply: (s, c, d, fr) => { if (fr?.city) promise(s, {kind: 'study', city: fr.city, route: fr.route, due: s.month + 6, label: 'Estudio del AVE a ' + cityName(fr.city), terr: TERRITORY.includes(fr.city)}); }},
  busWar: {apply: s => { const v = ensure(s); s.flags.buswar = s.month + 6; s.flags.busfive = s.month + 6; v.busWarFrom = s.month; v.busWarAt = {bus: s.last?.busShare ?? 0, share: s.last?.share ?? 0}; }},
  fareCut: {loss: s => r2(s.routes.filter(r => r.active && r.km < 400).reduce((n, r) => n + X.metrics(s, r).revenue, 0) * .15 * 6), detail: s => { const routes = s.routes.filter(r => r.active && r.km < 400); return `Tarifas −15 % durante 6 meses en ${count(routes.length, 'línea', 'líneas')} de menos de 400 km (≈ −${fmt(r2(routes.reduce((n, r) => n + X.metrics(s, r).revenue, 0) * .15 * 6))} M€ en billetes) · +2 de reputación`; },
    apply: s => { const routes = s.routes.filter(r => r.active && r.km < 400).map(r => r.id), v = ensure(s); addMod(s, {kind: 'fare', value: .85, routes, until: s.month + 6, label: 'Rebaja frente al autobús'}); v.answered = v.busWarFrom; note(s, 'concession'); for (const id of routes) note(s, 'fare', {route: id, pct: -.15}); }},
  speedLimit: {detail: s => `Sin coste · trayectos un 12 % más lentos en ${count(s.routes.filter(r => r.active && hot(r)).length, 'línea', 'líneas')} del sur durante 2 meses`,
    apply: s => addMod(s, {kind: 'speed', value: 1.12, routes: s.routes.filter(r => r.active && hot(r)).map(r => r.id), until: s.month + 2, label: 'Limitación de velocidad por calor'})},
  fence: {apply: s => { s.flags.fenced = s.month + 60; }},
  wear: {apply: s => addMod(s, {kind: 'wear', value: 1.5, until: s.month + 6, label: 'Taller a medio gas'})},
  hype: {detail: (s, c, d, fr) => fr?.route ? `−5 M€ · +10 % de viajeros en ${nameOf(routeOf(s, fr.route))} durante 6 meses` : c.detail,
    apply: (s, c, d, fr) => { if (fr?.route) addMod(s, {kind: 'demand', value: 1.1, routes: [fr.route], until: s.month + 6, label: 'El vídeo del tren puntual', vanity: true}); note(s, 'vanity'); }},
  tourism: {apply: s => { s.flags.tourism = s.month + 3; }},
  summerBoost: {apply: s => { const routes = s.routes.filter(r => r.active).sort((a, b) => X.metrics(s, b).passengers - X.metrics(s, a).passengers).slice(0, 5).map(r => r.id); addMod(s, {kind: 'service', value: 1.15, routes, until: s.month + 3, label: 'Refuerzo de verano'}); }},
  delayOne: {detail: (s, c, d, fr) => { const p = s.projects.find(p => p.id === fr?.work); return p ? `+4 meses en ${workName(s, p)}` : c.detail; },
    apply: (s, c, d, fr) => { const p = s.projects.find(p => p.id === fr?.work && !p.done); if (!p) return; p.due += 4; p.delay = (p.delay || 0) + 4; note(s, 'delay', {work: p.id}); }},
  accelOne: {cost: (s, c, d, fr) => { const p = s.projects.find(p => p.id === fr?.work); return p ? Math.max(5, Math.round((p.cost || 50) * .1)) : 15; },
    reason: (s, c, d, fr) => s.projects.some(p => p.id === fr?.work && !p.done) ? null : 'Esa obra ya ha terminado',
    detail: (s, c, d, fr) => { const p = s.projects.find(p => p.id === fr?.work); return p ? `−${Math.max(5, Math.round((p.cost || 50) * .1))} M€ · ${workName(s, p)} termina 3 meses antes` : c.detail; },
    apply: (s, c, d, fr) => { const p = s.projects.find(p => p.id === fr?.work && !p.done); if (!p) return; p.due = Math.max(s.month + 1, p.due - 3); p.delayChecked = true; note(s, 'accel', {work: p.id}); note(s, 'misuse'); }},
  royalSpecial: {reason: s => hasFreeAve(s) ? null : 'No queda ningún AVE libre para el tren especial'},
  inaugurate: {reason: s => (ensure(s).news.some(e => (e.k === 'work' || e.k === 'open') && e.m >= s.month - 12)) ? null : 'No hay nada terminado que inaugurar'},
  election: {apply: s => { ensure(s).election = s.month + 3; X.log(s, 'Elecciones convocadas', 'Votación en ' + X.dateOf(s.month + 3) + '.'); }},
  punctualDrive: {apply: s => { addMod(s, {kind: 'rel', value: 3, until: s.month + 1, label: 'Refuerzo de puntualidad'}); if (s.ops) s.ops.priority = 'punctual'; }},
  promiseTeruel: {apply: s => promise(s, {kind: 'electrify', tramos: ['zar-ter', 'ter-sag'], due: s.month + 12, label: 'Obra de catenaria a Teruel', terr: true, penalty: {territory: -15, reputation: -3}, reward: {territory: 10}})},
};
function estimateSubsidy(s) { try { return X.balance(s).subsidy - (s.flags.rural > s.month && ruralOk(s) ? 6 : 0); } catch { return 4; } }
function promise(s, p) { const v = ensure(s); v.promises.push({...p, made: s.month, status: null}); v.promises = v.promises.slice(-30); note(s, 'promise', {mud: s.projects.some(x => !x.done && x.delay > 0), terr: !!p.terr}); X.log(s, 'Compromiso', p.label + ' · antes de ' + X.dateOf(p.due)); }
function storyInstance(s, d, fr) {
  if (fr?.label) return fr.label;
  if (d.id === 'energy') return `Factura eléctrica: ${fmt(r2(energyBill(s)))} M€ al mes`;
  if (d.id === 'pajares' || d.id === 'extremadura' || d.id === 'burgos' || d.id === 'murcia') return null;
  if (d.id === 'climate') return `${count(s.routes.filter(r => r.active && hot(r)).length, 'línea', 'líneas')} por Córdoba, Sevilla y Extremadura`;
  if (d.id === 'busprice') return `${count(s.routes.filter(r => r.active && r.km < 400).length, 'línea tuya', 'líneas tuyas')} de menos de 400 km`;
  if (d.id === 'freeze') return `Transferencias del Estado: ${fmt(r2(estimateSubsidy(s)))} M€ al mes`;
  return null;
}
function storyView(s, d) {
  const v = ensure(s), fr = v.frozen?.id === d.id ? v.frozen : null;
  const choices = d.choices.map(c => {
    const a = c.do ? ACT[c.do] : null;
    const cost = a?.cost ? a.cost(s, c, d, fr) : Math.max(0, -(c.effects?.cash || 0));
    const reason = a?.reason ? a.reason(s, c, d, fr) : null;
    let detail = a?.detail ? a.detail(s, c, d, fr) : c.detail;
    if (c.gamble) { const chance = fr?.chance ?? chanceOf(s, c.gamble.chance, fr); detail = `${c.gamble.chance === 'audit' ? 'Según tus cuentas' : 'Según la puntualidad de tus AVE'}: ${pct(chance)} % de que salga bien · ${c.gamble.bad.cash ? `si sale mal, ${signed(c.gamble.bad.cash)} M€ y ` : 'si sale mal, '}${signed(c.gamble.bad.reputation)} de reputación${c.gamble.chance === 'audit' ? ' · Hacienda −8' : ''}`; }
    const gain = Math.max(0, c.effects?.cash || 0), loss = a?.loss ? a.loss(s, c, d, fr) : 0;
    // estimate: efecto total en caja que se conoce al decidir (pago, ingreso y lo que se deja de cobrar).
    return {...c, detail, cost, estimate: r2((gain || -cost) - loss), disabled: !!reason, reason, effects: {...(c.effects || {}), cash: gain || (cost ? -cost : 0)}};
  });
  // Ninguna decisión bloquea la partida: si nada se puede pagar, la opción más barata se paga a plazos.
  if (!choices.some(c => !c.disabled && (!c.cost || c.cost <= s.cash))) {
    const cand = choices.filter(c => !c.disabled).sort((a, b) => a.cost - b.cost)[0] || choices.at(-1);
    if (cand) { cand.disabled = false; cand.reason = null; cand.deferred = true; cand.detail = `${cand.detail} · sin caja: se paga en 6 cuotas de ${fmt(r2(cand.cost / 6))} M€`; cand.effects = {...cand.effects, cash: 0}; }
  }
  return {...d, instance: storyInstance(s, d, fr), choices};
}
/** Decisión pendiente con sus opciones reales: coste, detalle, motivo si no se puede y la instancia de la que habla. */
export function view(s, d) { return d.tycoon ? sceneView(s, d) : storyView(s, d); }
/** Aplica una elección ya validada: primero comprueba todo, luego cambia el estado, sin tiradas repetibles. */
export function apply(s, d, index) {
  if (d.tycoon) return applyScene(s, d, index);
  const v = ensure(s), c = d.choices[index], fr = v.frozen?.id === d.id ? v.frozen : null;
  if (c.disabled) throw Error(c.reason || 'Esa opción no está disponible.');
  if (!c.deferred && c.cost > 0 && c.cost > s.cash) throw Error('No hay dinero. Ni para eso ni para casi nada: mira Finanzas.');
  if (c.cost) { if (c.deferred) { v.dues.push({label: d.title, left: c.cost, months: 6}); X.log(s, 'Pago aplazado', `${d.title}: ${fmt(c.cost)} M€ en 6 cuotas.`); } else { s.cash -= c.cost; noteSpend(s, c.cost); } }
  const e = c.effects || {};
  if (e.cash > 0) { s.cash += e.cash; note(s, 'grant', {id: d.id}); }
  s.reputation = clamp(s.reputation + (e.reputation || 0), 5, 100); s.satisfaction = clamp(s.satisfaction + (e.satisfaction || 0), 0, 100);
  if (c.policy) s.policy = c.policy;
  if (c.flag === 'fleetcare') { s.fleet.forEach(f => { if (f.condition >= 45) note(s, 'preventive', {fleet: f.id}); f.condition = clamp(f.condition + 8, 0, 100); }); }
  else if (c.flag) s.flags[c.flag] = s.month + (c.months || {passes: 18, rural: 60, factory: 36, backlog: 18}[c.flag] || 12);
  if (c.fleet && MODEL[c.fleet.model]) s.fleet.push({id: 'f' + s.nextId++, model: c.fleet.model, qty: c.fleet.qty, condition: c.fleet.condition || 80, born: X.yearOf(s) - 6, origin: 'Segunda mano'});
  if (c.fleetDamage) s.fleet.forEach(f => f.condition = clamp(f.condition - c.fleetDamage, 15, 100));
  if (c.changer && !s.infra.c.includes(c.changer) && I.NODES[c.changer]) { s.infra.c.push(c.changer); s.infra.ver++; }
  trust(s, c.trust);
  if (d.onDecide) ACT[d.onDecide].apply(s, c, d, fr);
  if (c.do && ACT[c.do].apply) ACT[c.do].apply(s, c, d, fr);
  if (c.tag) note(s, c.tag, {id: d.id});
  if (d.event) note(s, 'event', {id: d.id});
  let win = null;
  if (c.gamble) {
    const chance = fr?.chance ?? chanceOf(s, c.gamble.chance, fr), draw = fr?.draw ?? X.random(s);
    win = draw < chance;
    const out = win ? c.gamble.good : c.gamble.bad;
    // Una multa no se elige: se cobra aunque deje la caja en negativo (el cierre del mes pide el crédito puente).
    s.cash += out.cash || 0; s.reputation = clamp(s.reputation + (out.reputation || 0), 5, 100);
    if (!win && c.gamble.chance === 'audit') trust(s, {treasury: -8});
  }
  v.frozen = null;
  return win;
}

// ---------------------------------------------------------------- cierre del mes
/** Antes de pasar de mes: cuotas, compromisos, contrato rural y pilotos que terminan. */
export function closeMonth(s) {
  const v = ensure(s), m = s.month;
  for (const d of v.dues) { const pay = d.left / Math.max(1, d.months); s.cash -= pay; d.left = r2(d.left - pay); d.months--; }
  v.dues = v.dues.filter(d => d.months > 0 && d.left > .001);
  for (const p of v.promises.filter(p => !p.status)) checkPromise(s, p);
  if (s.flags.rural > m && v.rural) {
    const ok = servedTerr(s) >= v.rural.base; v.rural.ok = ok; v.rural.miss = ok ? 0 : v.rural.miss + 1;
    if (v.rural.miss >= 3) { s.flags.rural = m; trust(s, {territory: -15}); X.log(s, 'Contrato rural cancelado', 'Tres meses sin el servicio comprometido: las comarcas dejan de pagar.'); note(s, 'broken', {terr: true}); }
  }
  for (const x of v.mods.filter(x => x.kind === 'pilot' && x.until === m + 1)) {
    const r = routeOf(s, x.routes[0]);
    if (!r?.active) continue;
    const withPilot = X.metrics(s, r); x.until = m; const without = X.metrics(s, r); x.until = m + 1;
    X.log(s, 'Piloto terminado', `${T.TECHS[x.tech].name} en ${nameOf(r)}: ${withPilot.passengers - without.passengers >= 0 ? '+' : ''}${Math.round(withPilot.passengers - without.passengers).toLocaleString('es-ES')} viajeros y ${fmt(r2(withPilot.net - without.net))} M€ al mes frente a no probarlo.`);
  }
  v.mods = v.mods.filter(x => x.until > m);
  v.news = v.news.filter(e => e.m >= m - 36); v.inc = (v.inc || []).filter(e => e.m >= m - 12);
  for (const [k, w] of Object.entries(v.enc.inst)) if (m - w > 24) delete v.enc.inst[k];
  for (const [k, c] of Object.entries(v.credit)) if (c.until < m) delete v.credit[k];
  if (v.election != null && v.election < m) v.election = null;
}
function checkPromise(s, p) {
  const m = s.month;
  let done = false;
  if (p.kind === 'electrify') done = p.tramos.some(id => s.infra.t[id]?.e !== 'no' || s.projects.some(x => x.type === 'tramo' && x.work === 'electrify' && x.target === id));
  else if (p.kind === 'asturias') done = s.routes.some(r => r.active && r.ends.some(c => ['gij', 'ovi', 'avl'].includes(c)) && r.frequency >= 2);
  else if (p.kind === 'study' && m >= p.due) {
    const r = routeOf(s, p.route) || s.routes.find(r => r.ends.includes(p.city));
    if (r && !s.requests.some(q => q.route === r.id) && s.requests.length < 6) { s.requests.push({type: 'ave', id: 'q' + s.nextId++, city: p.city, route: r.id, until: m + 36, reward: Math.round(30 + Math.min(25, Math.sqrt(POP[p.city] || 50)))}); }
    X.log(s, 'Estudio terminado', `${cityName(p.city)} ya tiene su estudio del AVE y una petición formal.`); p.status = 'kept'; note(s, 'kept', {terr: !!p.terr}); return;
  } else if (p.kind === 'network' && m >= p.due) done = s.routes.filter(r => r.active).length >= p.target;
  else if (p.kind === 'solvent' && m >= p.due) done = s.cash > s.debt;
  if (done) { p.status = 'kept'; trust(s, p.reward); note(s, 'kept', {terr: !!p.terr}); X.log(s, 'Compromiso cumplido', p.label); return; }
  if (m >= p.due) { p.status = 'broken'; s.reputation = clamp(s.reputation + (p.penalty?.reputation || 0), 5, 100); trust(s, {...p.penalty, reputation: undefined}); note(s, 'broken', {terr: !!p.terr}); X.log(s, 'Compromiso incumplido', p.label); }
}
/** Después de pasar de mes: memoria del mes cerrado y, si toca, un encuentro verdadero. */
export function afterMonth(s, b) {
  const v = ensure(s), t = s.tycoon;
  v.hist.push({m: s.month, g: Object.fromEntries(Object.entries(t.groups).map(([k, x]) => [k, Math.round(x * 10) / 10])), punct: Math.round((b.punctuality || 0) * 10) / 10,
    bus: Math.round((b.busShare || 0) * 1000) / 1000, share: Math.round((b.share || 0) * 1000) / 1000, bw: s.flags.buswar > s.month - 1, trains: X.dailyTrains(s), net: r2(b.net), staff: Math.round(Math.min(1, t.drivers / Math.max(1, T.driverNeed(s))) * 100) / 100});
  v.hist = v.hist.slice(-24);
  if (!s.ended) pickEncounter(s);
}
/** Penalización por compromisos de fin de mandato incumplidos (puntuación final). */
export const brokenPledges = s => (s.verdad?.promises || []).filter(p => p.score && p.status === 'broken').length;
/** Lo que está en marcha, para enseñarlo donde el jugador lo busca. */
export function ongoing(s) {
  const v = s.verdad;
  if (!v) return [];
  const out = [];
  const seen = new Set();
  for (const x of v.mods) {
    if (x.until <= s.month || !x.label) continue;
    const key = x.label + '|' + x.until;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({label: x.label, until: x.until, from: x.from, route: x.routes?.length === 1 ? x.routes[0] : null, city: x.city || null, count: x.routes?.length || 0, kind: x.kind, rival: x.rival || null});
  }
  for (const p of v.promises.filter(p => !p.status)) out.push({label: 'Compromiso: ' + p.label, until: p.due + 1, promise: true, city: p.city || null});
  for (const d of v.dues) out.push({label: `Cuotas: ${d.label}`, until: s.month + d.months, amount: r2(d.left)});
  if (s.flags.rural > s.month && v.rural) out.push({label: v.rural.ok ? 'Contrato rural: cumpliendo' : `Contrato rural: incumpliendo (${v.rural.miss}/3)`, until: s.flags.rural});
  return out.sort((a, b) => a.until - b.until);
}
export function routeEffects(s, id) { const r = routeOf(s, id); return ongoing(s).filter(x => x.route === id || (x.count > 1 && s.verdad.mods.some(m => m.label === x.label && m.until === x.until && m.routes?.includes(id))) || (x.rival && r?.active && T.competition(s, r).some(c => c.id === x.rival))); }

// ---------------------------------------------------------------- guardado
export function valid(v, s) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const arr = (x, max) => Array.isArray(x) && x.length <= max, num = x => Number.isFinite(x);
  if (!arr(v.mods, 80) || !arr(v.promises, 30) || !arr(v.news, 400) || (v.inc !== undefined && !arr(v.inc, 200)) || !arr(v.hist, 24) || !arr(v.dues, 20) || !arr(v.spent, 6) || !arr(v.access, 200)) return false;
  const routeIds = new Set(s.routes.map(r => r.id));
  for (const x of v.mods) if (!x || !MOD_KINDS.includes(x.kind) || !num(x.until) || !num(x.from ?? 0) || (x.kind === 'rel' ? !(num(x.value) && Math.abs(x.value) <= 20) : x.value !== undefined && !(num(x.value) && x.value > 0 && x.value < 10))
    || (x.routes !== undefined && (!Array.isArray(x.routes) || x.routes.length > 400 || !x.routes.every(id => routeIds.has(id)))) || (x.city !== undefined && !CITY[x.city]) || (x.fleet !== undefined && !safeId(x.fleet))
    || (x.tech !== undefined && !Object.hasOwn(T.TECHS, x.tech)) || (x.rival !== undefined && !['rossa', 'lowgo'].includes(x.rival)) || (x.byFamily !== undefined && (typeof x.byFamily !== 'object' || !Object.values(x.byFamily).every(y => num(y) && y > 0 && y <= 2))) || (x.label !== undefined && (typeof x.label !== 'string' || x.label.length > 120))) return false;
  const obj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  for (const p of v.promises) if (!p || !['electrify', 'asturias', 'study', 'network', 'solvent'].includes(p.kind) || !num(p.due) || ![null, 'kept', 'broken'].includes(p.status) || typeof p.label !== 'string' || p.label.length > 120 || (p.city !== undefined && !CITY[p.city]) || (p.route !== undefined && p.route !== null && !routeIds.has(p.route))) return false;
  for (const e of v.news) if (!e || !NEWS_KINDS.includes(e.k) || !num(e.m)) return false;
  for (const e of v.inc || []) if (!e || !OPS_KINDS.has(e.k) || !num(e.m) || (e.route !== undefined && !routeIds.has(e.route))) return false;
  for (const h of v.hist) if (!h || !num(h.m) || !num(h.punct) || !num(h.bus) || !num(h.net)) return false;
  for (const d of v.dues) if (!d || !num(d.left) || d.left < 0 || d.left > 1000 || !Number.isInteger(d.months) || d.months < 0 || d.months > 12) return false;
  if (!v.access.every(c => CITY[c]) || !v.spent.every(x => num(x.m) && num(x.x) && x.x >= 0)) return false;
  if (!obj(v.credit) || !Object.entries(v.credit).every(([k, c]) => Object.hasOwn(T.TECHS, k) && num(c.amount) && c.amount >= 0 && c.amount < 100 && num(c.until))) return false;
  if (v.election !== null && !num(v.election)) return false;
  if (v.rural !== null && (!obj(v.rural) || !num(v.rural.base) || !num(v.rural.miss) || typeof v.rural.ok !== 'boolean')) return false;
  const e = v.enc;
  if (!obj(e) || !num(e.last) || !arr(e.used, 315) || !e.used.every(id => ENCOUNTER[id]) || ['person', 'mood', 'pt', 'topic', 'inst', 'warned', 'lastMood', 'cool'].some(k => !obj(e[k]))) return false;
  if (Object.keys(e.inst).length > 400 || Object.keys(e.warned).length > 400) return false;
  if (v.scene !== null && (!obj(v.scene) || !ENCOUNTER[v.scene.id] || !obj(v.scene.inst) || (v.scene.inst.route !== undefined && !routeIds.has(v.scene.inst.route)) || (v.scene.inst.lot !== undefined && !safeId(v.scene.inst.lot))
    || (v.scene.inst.city !== undefined && !CITY[v.scene.inst.city]) || (v.scene.inst.tech !== undefined && !Object.hasOwn(T.TECHS, v.scene.inst.tech)) || (v.scene.inst.routes !== undefined && !(Array.isArray(v.scene.inst.routes) && v.scene.inst.routes.every(id => routeIds.has(id))))
    || (v.scene.inst.label !== undefined && (typeof v.scene.inst.label !== 'string' || v.scene.inst.label.length > 160)))) return false;
  if (v.frozen !== null && (!obj(v.frozen) || !EVENTS.some(x => x.id === v.frozen.id) || (v.frozen.draw !== undefined && !(num(v.frozen.draw) && v.frozen.draw >= 0 && v.frozen.draw < 1))
    || (v.frozen.chance !== undefined && !(num(v.frozen.chance) && v.frozen.chance >= 0 && v.frozen.chance <= 1)) || (v.frozen.route !== undefined && !routeIds.has(v.frozen.route))
    || (v.frozen.city !== undefined && !CITY[v.frozen.city]) || (v.frozen.tramo !== undefined && !I.tramoDef(s, v.frozen.tramo)) || (v.frozen.work !== undefined && typeof v.frozen.work !== 'string')
    || (v.frozen.label !== undefined && (typeof v.frozen.label !== 'string' || v.frozen.label.length > 160)))) return false;
  if ([v.busWarFrom, v.answered].some(x => x != null && !num(x)) || (v.busWarAt != null && (!obj(v.busWarAt) || !num(v.busWarAt.bus) || !num(v.busWarAt.share)))) return false;
  return true;
}
