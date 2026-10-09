// Rescate de Tenfe: mapa. Reutiliza el mapa ilustrado (relieve, ríos, luces y rótulos) y dibuja encima
// los corredores del rescate sobre las vías reales, con capas de información a lo Cities: Skylines.
import {RailMap} from './map-v3.js';
import {TRAMOS, NODES, tramoGeom} from './infra.js';
import {CORRIDORS, CORRIDOR, TERRITORIES} from './rescate-data.js';

/** Recorrido de cada corredor por la red real: camino más corto entre sus nodos, prefiriendo vía convencional. */
const ADJ = {};
for (const t of TRAMOS) {
  if (t.plan) continue;
  const w = t.km * (t.kind === 'lav' ? 3 : 1);
  (ADJ[t.a] ||= []).push([t.b, w, t, false]); (ADJ[t.b] ||= []).push([t.a, w, t, true]);
}
function path(a, b) {
  const dist = {[a]: 0}, prev = {}, done = new Set();
  for (;;) {
    let n = null;
    for (const id in dist) if (!done.has(id) && (n === null || dist[id] < dist[n])) n = id;
    if (n === null || n === b) break;
    done.add(n);
    for (const [m, w, t, rev] of ADJ[n] || []) if (dist[n] + w < (dist[m] ?? Infinity)) { dist[m] = dist[n] + w; prev[m] = [n, t, rev]; }
  }
  const steps = [];
  for (let n = b; n !== a && prev[n]; n = prev[n][0]) steps.unshift(prev[n]);
  return steps;
}
export const GEOMETRY = {};
for (const c of CORRIDORS) {
  const pts = [];
  for (let k = 0; k + 1 < c.way.length; k++) for (const [, t, rev] of path(c.way[k], c.way[k + 1])) {
    const g = tramoGeom(t).pts, seg = rev ? [...g].reverse() : g;
    for (const p of seg) { const last = pts[pts.length - 1]; if (!last || last[0] !== p[0] || last[1] !== p[1]) pts.push(p); }
  }
  if (pts.length < 2) for (const id of c.way) if (NODES[id]) pts.push([NODES[id].lon, NODES[id].lat]);
  // longitud acumulada para colocar trenes y obras
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], (pts[i][1] - pts[i - 1][1]) * 1.3));
  GEOMETRY[c.id] = {pts, acc, length: acc[acc.length - 1]};
}
export function pointAt(id, f) {
  const g = GEOMETRY[id], d = Math.max(0, Math.min(1, f)) * g.length;
  let i = 1;
  while (i < g.acc.length - 1 && g.acc[i] < d) i++;
  const t = (d - g.acc[i - 1]) / Math.max(1e-9, g.acc[i] - g.acc[i - 1]), a = g.pts[i - 1], b = g.pts[i];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(-(b[1] - a[1]) * 1.3, b[0] - a[0])];
}

export const LAYERS = {
  puntualidad: {name: 'Puntualidad', legend: [['#2f8f4e', '85 % o más'], ['#c9a227', '75–85 %'], ['#d9772b', '65–75 %'], ['#c23b2f', 'menos del 65 %']]},
  via: {name: 'Estado de la vía', legend: [['#2f8f4e', 'Buena (80 %+)'], ['#c9a227', 'Regular'], ['#c23b2f', 'Mala (menos del 50 %)']]},
  demanda: {name: 'Viajeros', legend: [['#7a4fb0', 'Grosor = viajeros por semana'], ['#c23b2f', 'Rojo: gente sin plaza']]},
  obras: {name: 'Obras', legend: [['#f0b544', 'Obra en marcha'], ['#8a7c69', 'Sin obras']]},
  apoyo: {name: 'Territorios', legend: [['#a8385a', 'Territorio desatendido'], ['#3f7d4e', 'Con tren'], ['#c98a1c', 'Con licencia']]},
};
const ramp = (v, stops) => { for (const [lim, col] of stops) if (v >= lim) return col; return stops[stops.length - 1][1]; };
export const punctColor = p => ramp(p, [[85, '#2f8f4e'], [75, '#c9a227'], [65, '#d9772b'], [0, '#c23b2f']]);
export const trackColor = p => ramp(p, [[80, '#2f8f4e'], [50, '#c9a227'], [0, '#c23b2f']]);

export class RescueMap extends RailMap {
  constructor(canvas, opts) {
    super(canvas, {...opts, getView: () => ({minute: 13 * 60, date: opts.getDate?.() || new Date(), mode: 'rescate', networkKey: opts.getKey?.() || ''})});
    this.layer = 'puntualidad'; this.anim = new Map(); this.selected = null;
  }
  setLayer(l) { this.layer = l; this.dirty = true; }
  corridorColor(id) {
    const s = this.opts.getState(), c = s.corridors[id];
    if (!c.open) return '#9c8b74';
    if (this.layer === 'via') return trackColor(c.track);
    if (this.layer === 'demanda') return c.lost > .3 ? '#c23b2f' : '#7a4fb0';
    if (this.layer === 'obras') return s.works.some(w => w.corridor === id && w.status === 'active') ? '#f0b544' : '#8a7c69';
    if (this.layer === 'apoyo') return CORRIDOR[id].territory ? '#3f7d4e' : '#8a7c69';
    return punctColor(c.punct);
  }
  corridorWidth(id) {
    const s = this.opts.getState(), c = s.corridors[id], z = Math.min(2.4, Math.max(1, Math.pow(this.zoom, .3)));
    if (!c.open) return 2 * z;
    if (this.layer === 'demanda') return (2.5 + Math.sqrt(c.pax) * 1.6) * z;
    return (CORRIDOR[id].essential ? 6 : 4.5) * z;
  }
  // La capa de líneas cacheada: los corredores (se rehace al cambiar de capa, de zoom o de estado).
  drawLines(view, night) {
    const c = this.ctxOf('lines'), s = this.opts.getState();
    c.lineCap = 'round'; c.lineJoin = 'round';
    const stroke = (pts, color, width, dash = null) => {
      c.beginPath(); pts.forEach(([lon, lat], k) => { const p = this.project(lon, lat); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
      c.setLineDash(dash || []); c.strokeStyle = color; c.lineWidth = width; c.stroke(); c.setLineDash([]);
    };
    // territorios desatendidos (capa Territorios o siempre suave)
    for (const [id, t] of Object.entries(TERRITORIES)) {
      const p = this.project(t.lon, t.lat), r = Math.max(26, 60 * Math.sqrt(this.zoom)), cc = s.corridors[t.corridor];
      const col = cc.open && cc.trains ? '63,125,78' : s.territories[id] ? '201,138,28' : '168,56,90';
      const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      g.addColorStop(0, `rgba(${col},${this.layer === 'apoyo' ? .32 : .14})`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], r, 0, Math.PI * 2); c.fill();
    }
    const order = [...CORRIDORS].sort((a, b) => Number(s.corridors[a.id].open) - Number(s.corridors[b.id].open));
    for (const d of order) {
      const g = GEOMETRY[d.id], cc = s.corridors[d.id], w = this.corridorWidth(d.id);
      if (!cc.open) { stroke(g.pts, 'rgba(90,72,52,.55)', w, [3, 6]); continue; }
      stroke(g.pts, 'rgba(255,250,236,.92)', w + 4);
      stroke(g.pts, this.corridorColor(d.id), w);
      if (cc.works || cc.closed) stroke(g.pts, 'rgba(42,34,28,.55)', w * .45, [6, 7]);
    }
  }
  drawNodes() {}
  drawStations() {}
  drawSelected() {
    if (!this.selected) return;
    const g = GEOMETRY[this.selected]; if (!g) return;
    const c = this.ctx;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); g.pts.forEach(([lon, lat], k) => { const p = this.project(lon, lat); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
    c.strokeStyle = 'rgba(243,179,61,.5)'; c.lineWidth = this.corridorWidth(this.selected) + 12; c.stroke();
  }
  drawWorks(view, night, t) {
    const s = this.opts.getState(), c = this.ctx;
    this.workPoints = [];
    for (const w of s.works.filter(w => w.status === 'active' || w.status === 'commissioning')) {
      const [lon, lat] = pointAt(w.corridor, .42), p = this.project(lon, lat);
      const bob = Math.sin(t / 260) * 1.5;
      c.save(); c.translate(p[0], p[1] - 22 + bob);
      c.fillStyle = w.status === 'commissioning' ? '#3f7d4e' : '#f0b544'; c.strokeStyle = '#2a221c'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-11, 6); c.quadraticCurveTo(-11, -9, 0, -10); c.quadraticCurveTo(11, -9, 11, 6); c.closePath(); c.fill(); c.stroke();
      c.fillRect(-14, 5, 28, 4); c.strokeRect(-14, 5, 28, 4);
      c.restore();
      c.strokeStyle = 'rgba(42,34,28,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p[0], p[1] - 8 + bob); c.lineTo(p[0], p[1]); c.stroke();
      this.workPoints.push({id: w.corridor, x: p[0], y: p[1] - 22});
    }
    for (const [id, m] of Object.entries(s.megas)) if (m.active) {
      const where = {taller: 'vll', ctc: 'mad', mediterraneo: 'cas', teruel: 'ter', estacion: 'mad', monumento: 'avi'}[id], n = NODES[where];
      if (!n) continue;
      const p = this.project(n.lon + .25, n.lat + .18), sp = (t / 900) % (Math.PI * 2);
      c.save(); c.translate(p[0], p[1]);
      c.strokeStyle = '#c98a1c'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 14); c.lineTo(0, -16); c.lineTo(18 * Math.cos(sp * .2), -16); c.stroke();
      c.fillStyle = '#c98a1c'; c.fillRect(-4, 12, 8, 4);
      c.restore();
    }
  }
  drawCities(view, night, t) {
    const s = this.opts.getState(), c = this.ctx, seen = new Set();
    this.cityPoints = [];
    for (const d of CORRIDORS) for (const id of d.way) {
      if (seen.has(id) || !NODES[id]) continue; seen.add(id);
      const n = NODES[id], p = this.project(n.lon, n.lat), live = CORRIDORS.some(x => x.way.includes(id) && s.corridors[x.id].open);
      if (!this.visible(p, 20)) continue;
      const r = (['mad', 'bcn', 'vlc', 'sev'].includes(id) ? 6.5 : 4.5) * Math.min(1.5, Math.max(1, Math.pow(this.zoom, .15)));
      c.fillStyle = '#fffaf0'; c.strokeStyle = live ? '#2a221c' : '#9c8b74'; c.lineWidth = 2.2;
      c.beginPath(); c.arc(p[0], p[1], r, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    // etiquetas de los corredores
    c.font = `700 ${Math.round(12 + Math.min(4, this.zoom))}px Figtree, sans-serif`; c.textAlign = 'center';
    for (const d of CORRIDORS) {
      const cc = s.corridors[d.id];
      if (!cc.open && this.layer !== 'apoyo' && !d.territory && this.zoom < 1.6) continue;
      const [lon, lat] = pointAt(d.id, .5), p = this.project(lon, lat);
      const text = d.short + (cc.open ? ' · ' + Math.round(this.layer === 'via' ? cc.track : this.layer === 'demanda' ? cc.pax : cc.punct) + (this.layer === 'demanda' ? ' mil' : ' %') : '');
      const w = c.measureText(text).width + 14;
      c.fillStyle = cc.open ? 'rgba(255,250,240,.94)' : 'rgba(239,229,207,.8)'; c.strokeStyle = cc.open ? this.corridorColor(d.id) : 'rgba(90,72,52,.5)'; c.lineWidth = 2;
      c.beginPath(); c.roundRect(p[0] - w / 2, p[1] - 24, w, 20, 10); c.fill(); c.stroke();
      c.fillStyle = cc.open ? '#2a221c' : '#6d5f4d'; c.fillText(text, p[0], p[1] - 9.5);
      this.cityPoints.push({id: d.id, x: p[0], y: p[1] - 14, r: w / 2});
    }
    for (const [id, tt] of Object.entries(TERRITORIES)) {
      const cc = s.corridors[tt.corridor];
      if (cc.open && this.layer !== 'apoyo') continue;
      const p = this.project(tt.lon, tt.lat);
      c.font = '800 11px Figtree, sans-serif';
      const text = tt.name.toUpperCase(), w = c.measureText(text).width + 12;
      c.fillStyle = s.territories[id] ? '#c98a1c' : '#a8385a'; c.beginPath(); c.roundRect(p[0] - w / 2, p[1] + 8, w, 17, 8); c.fill();
      c.fillStyle = '#fff'; c.fillText(text, p[0], p[1] + 20.5);
      this.cityPoints.push({id: 'territory:' + id, x: p[0], y: p[1] + 16, r: w / 2});
    }
    c.textAlign = 'left';
  }
  drawTrains(view, night, t) {
    const s = this.opts.getState(), c = this.ctx;
    this.trainPoints = [];
    for (const d of CORRIDORS) {
      const cc = s.corridors[d.id];
      if (!cc.open || cc.closed || cc.works === 'cerrar' || cc.works === 'alternativa') continue;
      const n = s.fleet.filter(x => x.corridor === d.id && x.status === 'service').length;
      for (let k = 0; k < n; k++) {
        const speed = .000018 * (cc.punct / 90), phase = (k / n + t * speed + d.km * .001) % 2, f = phase < 1 ? phase : 2 - phase;
        const [lon, lat, ang] = pointAt(d.id, f), p = this.project(lon, lat);
        if (!this.visible(p, 20)) continue;
        c.save(); c.translate(p[0], p[1]); c.rotate(-ang + (phase < 1 ? 0 : Math.PI));
        const late = cc.punct < 70;
        c.fillStyle = '#ffffff'; c.strokeStyle = late ? '#c23b2f' : '#2a221c'; c.lineWidth = 1.6;
        c.beginPath(); c.roundRect(-10, -3.6, 20, 7.2, 3.6); c.fill(); c.stroke();
        c.fillStyle = '#7a2d8f'; c.fillRect(-8, -.8, 16, 1.6);
        c.restore();
        this.trainPoints.push({id: d.id, x: p[0], y: p[1]});
      }
    }
    // autobuses alternativos durante las obras
    for (const d of CORRIDORS) if (s.corridors[d.id].works === 'alternativa') {
      const f = (t * .00003 + d.km * .002) % 1, [lon, lat] = pointAt(d.id, f), p = this.project(lon, lat);
      c.fillStyle = '#f0b544'; c.strokeStyle = '#2a221c'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(p[0] - 7, p[1] - 4, 14, 8, 2); c.fill(); c.stroke();
    }
  }
  drawHover() {
    if (!this.hover) return;
    const c = this.ctx, h = this.hover;
    if (h.type === 'corridor' && GEOMETRY[h.id]) {
      c.beginPath(); GEOMETRY[h.id].pts.forEach(([lon, lat], k) => { const p = this.project(lon, lat); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = this.corridorWidth(h.id) + 8; c.lineCap = 'round'; c.stroke();
    }
  }
  hit(x, y) {
    for (const p of this.cityPoints || []) if (Math.abs(p.x - x) < p.r + 4 && Math.abs(p.y - y) < 14) return p.id.startsWith('territory:') ? {type: 'territory', id: p.id.slice(10)} : {type: 'corridor', id: p.id};
    for (const p of this.workPoints || []) if (Math.hypot(p.x - x, p.y - y) < 16) return {type: 'corridor', id: p.id};
    let best = null, bd = 12;
    for (const d of CORRIDORS) {
      const g = GEOMETRY[d.id];
      let prev = this.project(g.pts[0][0], g.pts[0][1]);
      for (let k = 1; k < g.pts.length; k += 1) {
        const q = this.project(g.pts[k][0], g.pts[k][1]), dx = q[0] - prev[0], dy = q[1] - prev[1], L = dx * dx + dy * dy || 1;
        const tt = Math.max(0, Math.min(1, ((x - prev[0]) * dx + (y - prev[1]) * dy) / L)), dd = Math.hypot(prev[0] + tt * dx - x, prev[1] + tt * dy - y);
        if (dd < bd) { bd = dd; best = {type: 'corridor', id: d.id}; }
        prev = q;
      }
    }
    return best;
  }
  drawPopups(view, night, t) { super.drawPopups(view, night, t); }
  render(t) {
    // misma cadena que el mapa del juego, con el sol fijo a media tarde
    super.render(t);
  }
}
