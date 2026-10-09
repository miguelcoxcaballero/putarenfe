Resumen de las reglas del clásico, con líneas de `/home/user/putarenfe/iberia-ferroviaria/proyecto/dist/`. He escrito las dos funciones pedidas y las he probado contra `plan()` del clásico: coinciden en los 129 casos (todas las rutas de `ROUTES` × los 3 perfiles, red a 2026-01-01). Coinciden en `ok`, en los minutos (±1) y en los nodos donde se cambia de ancho.

**1. Compatibilidad tren–vía (infra.js)**

Estado de cada tramo:
- `{g:'ib'|'std'|'mixto', e:'25kv'|'3kv'|'no', v:km/h, b:construido}`, en la línea 56.
- La definición estática del tramo tiene `km, kind:'lav'|'conv', gauge, elec, speed, start, hist, plan`.
- La red tiene 125 tramos: ancho std 51 / ib 70 / mixto 4; tensión 25 kV 61 / 3 kV 45 / sin electrificar 19.

Perfil del tren:
- Línea 104: `profileOf(m) { return {fixed: m.gauge === 'uic', electric: m.power === 'electric', speed: m.speed}; }`
- Línea 105: `PROFILES = {ave:{fixed:true,electric:true,speed:300}, alvia:{fixed:false,electric:true,speed:250}, hybrid:{fixed:false,electric:false,speed:250}}`

Recorrer un tramo, `traverse` (124-135):
- No construido → falta `build` (127).
- Cortado por obra → falta `closed` (128).
- `if (prof.electric && st.e === 'no')` → falta `elec` (129).
- **Ignora la tensión.** 3 kV y 25 kV valen igual y todo tren eléctrico es bitensión en la práctica. No hay tren diésel puro.
- Ancho, línea 130: `ok = st.g==='mixto' || (mode==='std' ? st.g==='std' : st.g==='ib')`.
  - Un tren de ancho fijo con ancho distinto da falta `gauge`.
  - Uno de ancho variable devuelve null: no puede ir por ancho ajeno, tiene que cambiar en un nodo (131).

Búsqueda de recorrido, `search` (138-180):
- Es un Dijkstra sobre el estado (nodo de paso, nodo, ancho).
- Ancho fijo: `modes=['std']`. El ancho fijo ibérico no existe en el clásico.
- Ancho variable: `['std','ib']`, y en el origen sale en cualquiera de los dos sin coste (145).
- Cambio de ancho (155-159): en un nodo con cambiador cuesta `CHANGE_MINUTES = 12` (línea 12). Sin cambiador, en modo relajado cuesta 12 + `PEN=60` y genera la falta `changer`.
- `hasChanger` (76) mira `s.infra.c`.
  - `initialInfra` (65) solo mete los nodos con `n.changer` (11 nodos).
  - `pol` y `bur` solo tienen `changerName` y entran por `hist` en 2022 y 2023 (línea 90).
  - **En el Rescate (2027) hay que usar `n.changer || n.changerName` (13 nodos).**

Planificación, `plan` (183-199):
- Primero busca en modo estricto.
- Un rodeo de más de `km físicos*1.3+40` cuenta como bloqueado (188).
- Si falla, repite en modo relajado para explicar qué falta y deja las faltas sin repetir.
- Devuelve `{ok, tramos, changes, faults, km, minutes}`.
- Los textos de las faltas están en `faultText` (222-233): build, closed, elec, gauge, changer, detour, nopath.

engine.js:
- `routeCheck` (32): `I.plan(s,r.via,I.profileOf(m))`.
- `routeOptions` (34): ave, alvia e hybrid.
- `canRun` (35): `!!m && routeCheck(...).ok`.
- `isUnlocked` (36) y `bestProduct` (39).
- `configureRoute` rechaza un tren incompatible (82-83) y `validateSave` también (293).

**2. Tiempo de viaje**

En el tramo (infra.js 132-133):
```js
const top = Math.min(st.v, prof.speed, st.e === 'no' ? 160 : 999);
const minutes = e.d.km / Math.max(40, top * .84) * 60;
```
El tope de 160 km/h sin catenaria es el modo diésel del híbrido. No hay tope por circular a 3 kV (en la red, ningún tramo de 3 kV pasa de 200). El total es la suma de tramos más 12 min por cambio, redondeado (173-179).

En el servicio, `metrics` (engine 47-49):
- Si no hay recorrido válido, `pathMin = p.ok ? p.minutes : km/1.5` (equivale a 90 km/h).
- `trainTime(h) = ((r.real&&r.minutes ? (r.minutes+pathMin)/2 : pathMin)/60 + .1) * tx.speed - changes*tx.changer/60`.
- `tx.speed` vale 0,95 con la tecnología ERTMS y `tx.changer` resta 3 min por cambio con el cambiador rápido (tycoon.js 33).
- Cada cambio quita 1,5 puntos de puntualidad (54).
- Coste de energía: `m.energy*2.8` por tren-km (64). El híbrido cuesta un 8 % menos con la tecnología de hidrógeno (65).
- `requiredUnits` (tycoon.js 42-47) también usa los minutos de `plan`.

**3. Obras (infra.js 252-277, engine.js 118-133 y 199-206)**

| Obra | base (M€) | €/km (M€) | meses | efecto |
|---|---|---|---|---|
| `renew` | 8 | 0,18 | `ceil(4+km/40)` | `v = max(v,220)` |
| `electrify` | 6 | 0,42 | `round(12+km/10)` | `e='25kv'` |
| `mixed` | 8 | 0,5 | `round(14+km/9)` | `g='mixto'` |
| `standard` | 5 | 0,3 | `round(8+km/14)` | `g='std'`, con `closes:true` |

- Coste: `round(base + perKm*km)` (269).
- Cuándo se ofrece cada obra, `tramoWorks` (261-270): solo en tramos construidos que no sean propios del jugador.
  - electrificar si `e==='no'`;
  - mixto o estándar si `g==='ib'`;
  - renovar si `v<220`.
- **Faltan obras:** no se puede pasar de 3 kV a 25 kV ni de mixto a estándar.
- Ejemplo pla-cac (unos 78 km): mixto 47 M€ / 23 meses, estándar 29 / 14, renovar 22 / 6.
- `standard` corta el tramo mientras dura la obra:
  - `closedTramos` (98-100);
  - `startWork` suspende los servicios afectados (engine 123 y 130);
  - la reputación baja 1 + nº de servicios afectados (131).
- `CHANGER_WORK = {cost:18, months:10}` (258).
- `changerPossible` (272-277): solo donde no hay ya cambiador, el nodo no es extranjero y confluyen tramos construidos `std` e `ib` (mixto no cuenta).
- Descuento: coste ×0,6 con el flag `eufunds` (engine 118).
- Retrasos: un 22 % de probabilidad de +3 a +9 meses en obras de tramo, nunca en el cambiador (226).
- Al terminar suben los contadores `infra.done.elec`/`conv` (km) y `changers` (201-202).
- Líneas propias (engine 134-139): km = distancia ortodrómica×1,2; coste km×1,1+25; plazo 42+km/10 meses; siempre std, 25 kV, 300 km/h.

**4. Campos de MODELS (data.js 57-67)**

- `family` ('AVE'|'Alvia')
- `gauge` ('uic'|'variable')
- `power` ('electric'|'hybrid')
- `speed` (km/h)
- `seats`, `price` (M€), `lead` (meses de entrega), `year`, `energy` (factor de coste), `maker`, `desc`

No hay campo de tensión: «doble tensión» del S130 solo aparece en `desc`. Etiquetas de texto en `GAUGES`, `POWERS` y `ELECS` (88-90). Ojo, el ancho del tren se escribe `'uic'` y el de la vía `'std'`.

Trenespop:
- En el clásico, los anuncios de Trenespop (marketplace.js 26-34) apuntan a ids de `MODEL`, así que heredan tracción, ancho y velocidad del modelo.
- En el Rescate, Trenespop es la oferta `used` (rescate-data.js 82). Las 4 `TRAIN_OFFERS` (75-84) no tienen tracción, tensión, ancho ni velocidad.
- `baseSegments` (rescate.js 80) ya da `{from,to,km,gauge,elec,vmax,track,key}` con los valores de la red, y las obras se guardan en `s.segs`.

Para esas 4 ofertas propongo estos datos, a confirmar:

| Oferta | tracción | tensiones | ancho | km/h |
|---|---|---|---|---|
| `kafka` (Civia 463) | eléctrico | 3 kV | ib | 120 |
| `used` (Trenespop, 592) | diésel | ninguna | ib | 120 |
| `dorfler` | híbrido | 3 kV y 25 kV | ib | 160 |
| `bcbb` | eléctrico | 25 kV | std | ? |

El `bcbb` tiene una contradicción: la oferta dice «Fuxing Regional», pero la imagen de la línea 466 describe un tren de alta velocidad, así que hay que decidir su velocidad.

**5. Funciones propuestas para rescate.js**

Son puras. Faltas en el formato de `faultText`, más la nueva `'tension'`.
```js
export const CAMBIO_ANCHO_MIN = 12, VMAX_SIN_CATENARIA = 160, VMAX_3KV = 220; // 220: regla nueva de realismo
const FACTOR_COMERCIAL = .84, VMEDIA_MIN = 40, PEN = 60;
const anchosTramo = g => g === 'mixto' ? ['ib','std'] : [g];
const anchosTren = tren => tren.ancho === 'variable' ? ['ib','std'] : [tren.ancho === 'uic' ? 'std' : tren.ancho];
const tieneCambiador = (c, n) => typeof c === 'function' ? c(n) : !!c?.has?.(n);
// tren: {traccion:'electrico'|'diesel'|'hibrido', tensiones:['3kv','25kv'], ancho:'ib'|'std'|'variable', vmax}
export function modoTraccion(tren, t) {
  if (t.elec !== 'no' && tren.traccion !== 'diesel' && (tren.tensiones||[]).includes(t.elec)) return 'catenaria';
  if (tren.traccion === 'diesel' || tren.traccion === 'hibrido') return 'diesel';
  return null;
}
export function velocidadEnTramo(tren, t) {
  const m = modoTraccion(tren, t);
  return Math.min(t.vmax, tren.vmax, m === 'diesel' ? VMAX_SIN_CATENARIA : m === 'catenaria' && t.elec === '3kv' ? VMAX_3KV : 999);
}
export const minutosTramo = (tren, t) => t.km / Math.max(VMEDIA_MIN, velocidadEnTramo(tren, t) * FACTOR_COMERCIAL) * 60;
export function compatibilidad(tren, tramos, cambiadores = new Set()) {
  const variable = tren.ancho === 'variable';
  let est = new Map(anchosTren(tren).map(m => [m, {coste: 0, cambios: [], faltas: [], anchos: []}]));
  tramos.forEach((t, i) => {
    if (i > 0 && variable) { const sig = new Map(est);
      for (const [m, x] of est) { const o = m === 'ib' ? 'std' : 'ib', hay = tieneCambiador(cambiadores, t.from);
        const y = {...x, coste: x.coste + CAMBIO_ANCHO_MIN + (hay ? 0 : PEN), cambios: [...x.cambios, t.from], faltas: hay ? x.faltas : [...x.faltas, {type:'changer', node:t.from}]};
        if (!sig.has(o) || y.coste <= sig.get(o).coste) sig.set(o, y); } // <=: cambia lo más tarde posible, como el clásico
      est = sig; }
    const sig = new Map();
    for (const [m, x] of est) { const ok = anchosTramo(t.gauge).includes(m);
      if (!ok && variable) continue;
      sig.set(m, ok ? {...x, anchos: [...x.anchos, m]} : {...x, coste: x.coste + PEN, faltas: [...x.faltas, {type:'gauge', tramo:t.key}], anchos: [...x.anchos, m]}); }
    est = sig;
  });
  const mejor = [...est.values()].sort((a, b) => a.coste - b.coste)[0] || {cambios: [], faltas: [{type:'nopath'}], anchos: []};
  const faltas = [...mejor.faltas];
  for (const t of tramos) {
    if (t.built === false) faltas.push({type:'build', tramo:t.key});
    if (t.closed) faltas.push({type:'closed', tramo:t.key});
    if (!modoTraccion(tren, t)) faltas.push({type: t.elec === 'no' ? 'elec' : 'tension', tramo:t.key, elec:t.elec});
  }
  return {ok: !faltas.length, faltas, cambios: mejor.cambios, anchos: mejor.anchos};
}
export function tiempoDeViaje(tren, tramos, cambiadores = new Set()) {
  const c = compatibilidad(tren, tramos, cambiadores);
  const porTramo = tramos.map(t => ({key: t.key, vmax: velocidadEnTramo(tren, t), minutos: minutosTramo(tren, t)}));
  return {ok: c.ok, minutos: Math.round(porTramo.reduce((n, x) => n + x.minutos, 0) + c.cambios.length * CAMBIO_ANCHO_MIN),
    km: Math.round(tramos.reduce((n, t) => n + t.km, 0)), cambios: c.cambios, porTramo};
}
```

Cómo funcionan:
- `compatibilidad` reproduce el Dijkstra del clásico sobre una lista fija de tramos, recorriendo los anchos posibles en cada nodo.
- Si no hay vía posible, explica qué falta igual que el modo relajado del clásico, penalizando con 60 cada falta.
- `tiempoDeViaje` aplica la misma fórmula del clásico: km / max(40, vmax×0,84) × 60, más 12 min por cada cambio de ancho.

Para reproducir exactamente el clásico, el tren se mapea así: `{traccion: electric?'electrico':'hibrido', tensiones:['3kv','25kv'], ancho: fixed?'std':'variable', vmax: speed}`.

Novedades respecto al clásico:
- Trenes de ancho fijo ibérico.
- Tracción diésel pura.
- Exigir que el tren tenga la tensión del tramo.
- Tope de 220 km/h con 3 kV, que no cambia ningún resultado de la red actual.

Cosas que conviene llevar al Rescate:
- Pasar los cambiadores como un conjunto de nodos con `changer || changerName`.
- Copiar `WORKS`/`CHANGER_WORK` con sus fórmulas y añadir dos obras que faltan: pasar de 3 kV a 25 kV y de mixto a estándar.
- La obra `standard` debe cortar el corredor mientras dure, como en el clásico.

Ejemplo inventado con tres tramos (ib/3 kV/160, ib/sin electrificar/140, mixto/25 kV/220):
- Civia: falta `elec` en el segundo tramo y `tension` en el tercero.
- 592 diésel: puede hacerlo, en 179 min.
- AVE solo de 25 kV: faltas `gauge` en los tramos 1 y 2, `tension` en el 1 y `elec` en el 2.

Archivos en /tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/compat:
- compat.mjs
- check.mjs