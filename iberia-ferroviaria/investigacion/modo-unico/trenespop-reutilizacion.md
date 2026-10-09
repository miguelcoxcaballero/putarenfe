# Trenespop dentro del Rescate de Tenfe: informe técnico

`marketplace.js` solo se puede aprovechar como capa de presentación. Los datos, el filtrado, el presupuesto y la validación dependen del estado clásico y del catálogo AVE/Alvia, que no sirve para corredores de ancho ibérico. Para reutilizar las vistas hay que hacerles antes una refactorización pequeña. Si no, al pulsar «Comprar» dentro del rescate se ejecutaría la compra en la partida clásica.

Lo que sigue se ha leído en `dist/`, que es la fuente editable: en `proyecto/` no hay `src/`.

**Aviso:** hay otro agente editando ahora mismo `rescate.js`, `rescate-ui.js` y `rescate-map.js` (cambiaron entre las 11:42 y las 11:43 UTC). Las líneas que cito de esos tres archivos son de las 11:46 y pueden haberse movido. Hay que releerlos antes de tocarlos.

## 0. Problemas que hay que resolver antes de nada

1. **Los clics del rescate llegarían a la partida clásica.** `app.js` escucha en todo el documento y reacciona a cualquier `[data-action]` y a ciertos `id` fijos, también dentro de `#rescate`, porque la capa del rescate cuelga de `document.body`.
   - `app.js:1268-1270` actúa sobre cualquier `[data-action]`.
   - `app.js:1373`: `confirm-buy` llama a `E.buy(state, …)`, que compra en la partida clásica.
   - `app.js:1372`: `market-favorite` llama a `E.marketplaceFavorite(state, …)`.
   - `app.js:1389-1390` (submit `marketSearchForm`), `app.js:1404` (`marketSearch`), `app.js:1406` (`buyQty`, que llama a `updateQuote()` y sobrescribe `#purchaseQuote` con un error del motor clásico) y `app.js:1417` (`marketState`, `marketDelivery`, `marketMaker`, `marketSort`).
   - `catalogueHTML` y `detailHTML` llevan esos atributos e `id` fijos. Por eso hay que poder cambiar el nombre del atributo (`data-a` en el rescate) y poner prefijo a los `id` (`rsMk*`).
2. **La red de los corredores tiene huecos.** `baseSegments()` (`rescate.js:73-99`, recién añadido por el otro agente) busca en `infra.js` el camino más corto y penaliza ×3 las líneas de alta velocidad (LAV). Pero en los datos no hay convencional entre Palencia y León ni entre Córdoba y Sevilla, así que el camino cae en la LAV:
   - Norte: `pal-leo-av`, ancho estándar, 25 kV, 280 km/h, 115 km.
   - Sur: `cor-sev-av`, ancho estándar, 25 kV, 240 km/h, 127 km.

   Con reglas de compatibilidad, ningún tren de ancho ibérico a 3 kV podría circular por esos dos corredores, incluida la flota inicial. Hay que fijar `segments` a mano en esos dos `CORRIDORS`; `baseSegments` ya lo admite (`rescate.js:77-78`). Haría falta un convencional ibérico a 3 kV de unos 120 a 130 km y de 140 a 160 km/h; esas cifras están por confirmar.

   Asturias toma `leo-pol` con su estado actual: ancho mixto, 25 kV y 220 km/h, que corresponde a la Variante de Pajares. El corredor se llama «Rampa de Pajares» y sus 170 km declarados no cuadran con los 132 del camino calculado. Hay que decidir cuál de las dos líneas modela y comprobar la tensión.
3. **Vender trenes usados daría beneficio.** `sellTrain` (`rescate.js:528-535`) calcula la venta como `OFFER[t.offer].price * .55 * condition`, a partir del precio de un tren nuevo. Con lotes usados baratos, comprar y revender ganaría dinero. La reventa tiene que depreciarse según `t.born` o según el precio pagado.
4. **Hay cosas que obligan a mantener `'kafka'` con 4 semanas de entrega.** El test hace `R.trainQuote(s,'kafka')` y espera `price 3` y `arrives 5` (`rescate-test.mjs:27-28`). Además, la frase grabada `t-5` (`rescate-data.js:375`) y el dilema de `s1` (`rescate-data.js:255`) dicen «un tren nuevo tarda cuatro semanas». Si se ponen plazos realistas, conviene que `kafka` quede como «unidad de stock / pedido cancelado» con entrega en 4 semanas, y que la «fabricación a medida» tarde de 52 a 130 semanas. Así no hay que volver a grabar voces.

## 1. `marketplace.js` (125 líneas): qué se puede reutilizar

### Se pueden reutilizar tal cual (puras, sin estado)

| Línea | Firma | Qué esperan o devuelven |
|---|---|---|
| L4 | `MANUFACTURERS = ['Tardo','KAFKA','Schlimmens','Dörfler','BCBB','Malstom']` | Coincide con `TRAIN_BRANDS` de `brands.js:5`. |
| L5 | `makerName(m) => brandName(m.maker)` | Cualquier objeto con `.maker` (traduce alias como CAF→KAFKA o Talgo→Tardo). |
| L103 | `deliveryText(lead)` | Dice «Envío en N meses». En el rescate habría que pasarlo a semanas, así que conviene parametrizarlo. |
| L8-13 | `esc`, `norm`, `money` e iconos `heart`, `search`, `truck` | Son privados; hay que exportarlos. `money` (L10) escribe «X M€» con 2 decimales; el rescate usa `R.fmt` (k€ por debajo de 1 M€). |
| L104-106 | `select(id, label, value, options:[[v,text]])` | Privado; hay que exportarlo. Genera `.tp-filter > select#id`. |

### Hay que adaptarlas (vista mezclada con el estado clásico)

`photoKey(item)` (L7) devuelve `'bcbb'`, `'dorfler'` o `item.model`. En el rescate debe usar `item.photo` y, si falta, la misma regla. `trainThumb` (`train3d.js:15`) acepta claves de serie (`'449'`, `'594'`, `'599'`, `'465'`, `'592'`, `'120'`, `'130'`, `'730'`, `'2700'`, `'3600'`, `'114'`…) y alias (`TRAIN_PHOTO_ALIASES`: 463/464→465, 596→594, 598→599, 448→449…). También acepta `'bcbb'` y `'dorfler'` (`MAKER_PHOTOS`, `train3d.js:13`).

`catalogueHTML(s, filters, quote, thumb)` (L107-121) depende de:
- `listings(s)` y `filterListings` (clásicos) y `2022 + Math.floor(s.month/12)` (L108).
- `s.marketplace?.favorites` (L110 y L117).
- `MODEL[item.model].speed/.seats` en `tp-spec` (L117).
- Categorías fijas AVE y Alvia, y botón `data-action="fleet-tab" data-id="orders"` (L113).
- Filtros fijos de estado, envío y marca (L114); el rescate necesita además tracción, ancho, tipo y compatibilidad.
- El pie: «seis meses… 30 % de anticipo» (L119).
- `data-action` en todos los botones y los `id` `marketSearchForm`, `marketSearch`, `marketState`, `marketDelivery`, `marketMaker`, `marketSort` y `marketResultCount`.

`detailHTML(s, item, thumb)` (L122-124) depende de:
- `MODEL[item.model]` (`desc`, `speed`, `seats`, `gauge`, `power`), además de `GAUGES` y `POWERS` de `data.js` (L88-89, que no tienen métrico ni 3 kV/25 kV).
- `s.ended` (compatible con el rescate), `s.marketplace.favorites`, la clase `content tp-detail` y los `id` `buyQty` y `purchaseQuote`.
- `data-action="confirm-buy|close-modal|market-favorite"`.
- La nota «se entregan hasta dos unidades al mes. El 70 %…».

### Ligadas al estado clásico (no sirven para el rescate)

- `initialMarketplace`/`ensureMarketplace` (L18-19) usan `s.marketplace`.
- `marketPeriod` (L20) usa `s.month/6`; `usedStock` (L21).
- `listings` (L24-37) usa `MODELS` (todos de ancho estándar o variable), `s.month` y `s.marketplace.sold`.
- `listing` (L38-42).
- `quoteListing(s, model, qty, id, standard)` (L43-52) necesita el `standard` que calcula `E.purchaseQuote` (`engine.js:93-100`).
- `favorite` (L53-59).
- `validMarketplace` (L60-75) y `validMarketplaceOrder` (L76-84) usan `s.orders` y el periodo de 6 meses.
- `filterListings` (L87-102) usa `MODEL[...].family` y `s.marketplace`.

El fragmento clave es L117: la ficha usa `MODEL` y emite `data-action`.
```js
117 <div class="tp-grid">${items.map(item => { const m = MODEL[item.model], liked = s.marketplace?.favorites?.includes(item.id); return `<article class="tp-card" data-listing="${item.id}"><button class="tp-photo" data-action="market-listing" ...<p class="tp-spec">${m.speed} km/h · ${m.seats} plazas...
```

### Refactorización propuesta (las salidas clásicas deben quedar idénticas)

Exportar un juego de piezas de vista que reciba un objeto de opciones `o`:
```js
export const TP_DEFAULTS = {attr: 'data-action', ids: {form:'marketSearchForm', search:'marketSearch', state:'marketState', delivery:'marketDelivery', maker:'marketMaker', sort:'marketSort', count:'marketResultCount', qty:'buyQty', quote:'purchaseQuote'}, money, logo: brandLogo};
export function tpSelect(id, label, value, options) {...}                 // = select() L104
export function tpCard(item, o) {...}   // item normalizado: {id,title,maker,state,condition,stock,place,photo,price,spec,delivery,liked,badge?}
export function tpCatalogue(items, o) {...} // o: {filters, selects:[[id,label,value,options]], categories:[[id,text,active]], breadcrumb, heading, count, footer, empty, favoriteCount, thumb, attr, ids, extraNav?}
export function tpDetail(item, o) {...}     // o: {tags:[], description, note, actions, qtyMax, qtyValue, extraHTML, thumb, attr, ids}
```
`catalogueHTML` y `detailHTML` pasarían a ser envoltorios de 2 o 3 líneas. Para garantizar que el clásico no cambia, añadir a `marketplace-test.mjs` una comprobación de que la salida es idéntica byte a byte a la actual, por ejemplo con un hash del HTML de `catalogueHTML(fresh(), filters, quote(s), k=>k)`.

## 2. `marketplace.css` (118 líneas)

**Se pueden reutilizar sin cambios** (solo dependen de estar dentro de `.trenespop` o son genéricas):
- `.trenespop` (L10, define `--tp-*`) y L11-14 (box-sizing y foco).
- `.tp-header`, `.tp-logo`, `.tp-search` y `.tp-favorites(.active)` (L15-26).
- `.tp-categories` (L27-32).
- `.tp-filters`, `.tp-filter` y `.tp-clear` (L33-37).
- `.tp-breadcrumb` y `.tp-results` (L38-44).
- `.tp-grid` y `.tp-card` (L45-46); `.tp-photo` (L47-51).
- `.tp-state(.new)` y `.tp-heart(.liked)` (L52-57).
- `.tp-card-body`, `.tp-price`, `.tp-title`, `.tp-spec`, `.tp-delivery` y `.tp-card-bottom` (L58-67).
- `.tp-empty`, `.tp-footer` y `.tp-sr` (L68-73).
- `.tp-back`, `.tp-detail-photo`, `.tp-seller*`, `.tp-detail h1`, `.tp-description` y `.tp-detail-tags` (L78-93).
- `.tp-primary`, `.tp-secondary` y `.tp-detail-note` (L101-105).
- Media queries L106, L110-115 y L118.

**Dependen del contenedor clásico:**
- `.drawer.trenespop-drawer*` (L2-9), que usa `--rail-w`, y L108-109.
- `.modal.trenespop-modal` y `dialog#modal:has(...)` (L74-75).
- `.trenespop-modal .content`, `label` e `input[type=number]` (L76-77 y L94-95). Se pueden reutilizar poniendo `trenespop-modal` en el `.inner` del `rs-modal`.
- `.trenespop-modal .figures*` (L96-100) y L116: es el `dl.figures` clásico. En el rescate se usa `rs-kpis`.

**Choques con `rescate.css`** (se carga después; `index.html` carga `marketplace.css` y luego `rescate.css`):
- `.rs h3{font:800 15px/1.2;margin:0}` (`rescate.css:119`) pisa `.tp-empty h3`. Se arregla con `.rs .tp-empty h3`.
- `.rs-modal>.inner` es oscuro y mide 720 px (`rescate.css:114-117`).
- `:where(.rs) button` (L7) no da problemas porque tiene especificidad 0.

**Reglas nuevas** (en un archivo `rescate-market.css` o al final de `marketplace.css`):
```css
.rs-modal.tp-wide>.inner{width:min(1240px,calc(100vw - 24px));background:#fff;color:#29363d;padding:0}
.rs-modal.tp-wide .tp-game-strip{display:flex;align-items:center;gap:12px;padding:8px 18px;border-bottom:1px solid #edf0f1;background:#f7faf9}
.rs-modal.tp-wide .rs-x{color:#40565d}  .rs .tp-empty h3{font-size:18px;margin:0 0 9px}
.tp-fit{position:absolute;top:11px;left:11px;...} .tp-fit.ok{background:#dff8f1;color:#087e6d} .tp-fit.bad{background:#fde8e8;color:#a3302a}
.tp-chip.e3{...} .tp-chip.e25{...} .tp-chip.diesel{...}   /* colores de ELEC_COLOR (rescate-map.js:61) */
.tp-compat{...}  /* tabla corredor ✓/✗ en la ficha */   .tp-orders{...} /* «Mis compras» */
```

## 3. Cómo lo conecta `app.js` (lo que hay que replicar en `rescate-ui.js`)

- L13: `import * as Marketplace`.
- L66-67: `freshMarketFilters()` da `{query, state, delivery, maker, family, sort, favorites}` y se guarda en `ui.market`, que sobrevive al cerrar la ventana.
- L749: la clase del cajón; L834: tira de juego `tp-game-strip` con «‹ Mi parque» y «×».
- L887: `Marketplace.catalogueHTML(state, ui.market, (model, qty, listing) => E.purchaseQuote(state, model, qty, listing), trainThumb)`.
- L1203-1206: `marketListingDialog(id)` llama a `showModal(detailHTML(...), 'single trenespop-modal')` y después a `updateQuote()`.
- L1207-1211: `updateQuote()` pinta Total, Anticipo o «A pagar ahora», y Primer lote o Último lote. Desactiva el botón si `state.cash < q.deposit`.
- L1368-1373: acciones `market-listing`, `market-reset`, `market-family`, `market-favorites`, `market-favorite` y `confirm-buy` (este último con `data-listing` y `data-immediate`).
- L1390, L1404 y L1417: buscador y selects por `id`. `renderDrawer` (L742-760) conserva el foco y el cursor (`focusId`/`selectionStart`). En el rescate, `openModal` reescribe el `innerHTML` (`rescate-ui.js:98`), así que hay que restaurar el foco a mano o actualizar solo `#rsMkCount` y la rejilla.
- `engine.js`: L93-100 `purchaseQuote`, L101-110 `buy` (escribe `o.marketplace = {listing, state, maker, condition, born, depositRate}` y descuenta `market.sold`), L187-193 `addPurchasedFleet` y L219-222 entregas.

## 4. Compras en el rescate hoy

- **Datos** (`rescate-data.js:75-85`): `TRAIN_OFFERS`. Son 4 ofertas `{id, maker, model, price, weeks, seats, reliability, photo, used?, note}`: `kafka` (3 M€, 4 semanas), `dorfler` (3,5 M€, 6 semanas), `bcbb` (2,1 M€, 3 semanas) y `used` (1,1 M€, 1 semana). `OFFER` es el índice por `id`. Ninguna tiene ancho, tensión ni velocidad.
- **Motor** (`rescate.js:508-526`):
```js
508 export function trainQuote(s, offerId, kickback = false) {
510   let price = o.price * (o.used ? 1 - mod(s, 'usedDiscount') : 1) * (kickback ? 1.1 : 1);
511   const deposit = round2(price * (o.used ? 1 : .4)), rest = round2(price - deposit);
513   return {offer: o, price, deposit, rest, arrives: s.week + o.weeks, weekly, condition: o.used ? Math.round(52 + mod(s,'usedDiscount')*60) : 100, reasons: deposit > s.cash ? ['No hay caja para la entrada.'] : []};
516 export function buyTrain(s, offerId, kickback = false) { ... needOrder(s,'compra'); spend(s,q.deposit);
521   if (q.rest) s.payments.push({week: q.arrives, amount: q.rest, label: 'Pago a la entrega · ' + q.offer.model, kind: 'compra'});
523   s.fleet.push({id:'t'+s.nextId++, name, offer: offerId, condition: q.condition, status:'arriving', corridor:null, weeks: q.offer.weeks});
524   if (kickback) takeKickback(s, q.price, 'compra', offerId);  525 if (offerId === 'bcbb') s.flags.bcbb = ...
```
- **Otros sitios que usan `OFFER[t.offer]`** y que obligan a que todo tipo comprable esté en `OFFER`: `seatsOf` (L164), llegada `OFFER[t.offer].model` (L1173), averías `.reliability` (L1203), `sellTrain` `.price` (L531), `validate` (L1356) y `rescate-ui.js:309` (`fleetPage`). `newGame` arranca con `['norte','kafka',58], ['norte','used',49], ['levante','kafka',66], ['sur','kafka',61]` (L64). `rentTrain` crea siempre `offer:'kafka'` (L502-506).
- **Interfaz** (`rescate-ui.js`):
  - L240: `planBuy(corr)` hace `ui.plan = {kind:'buy', corr, kick:false}`.
  - L241-252: `drawBuy()` muestra la ganancia de poner uno más en el corredor con `R.serviceForecast(s, corr, {trains: c.trains + 1})`, una rejilla `rs-grid` de `rs-tile` con `trainThumb(o.photo)`, una tesela de alquiler y el interruptor `buy-kick`.
  - Acciones en L506-508 (`plan-buy`, `confirm-buy`, `rent`) y L549 (`buy-kick`). Entradas en L188 (ficha de corredor) y L308 (página Flota).
  - `closeModal` (L99) borra `ui.plan`.
- **Lo que fija el test de interfaz** (`rescate-ui-test.mjs:70-74`): al pulsar `.rs-sheet [data-a=plan-buy]` aparece `.rs-modal img.train-photo` con `data-photo-series` `bcbb` y `dorfler`, y se cierra con `.rs-modal [data-a=close]`. Hay que abrir Trenespop en `.rs-modal` y que BCBB y Dörfler salgan con los filtros por defecto.

## 5. Realismo: estado real de cada corredor y reglas

Lo he calculado con el mismo camino que `rescate-map.js:9-27` y `rescate.js:86-99`, usando el estado final de los tramos (`t.gauge/elec/speed`, tras las obras de `infra.js:15-21`; el rescate empieza en 2027):

| Corredor | Ancho | Catenaria (km) | Velocidad máx. (km/h) | Nota |
|---|---|---|---|---|
| norte | ibérico 300 + **estándar 115** | 3 kV 300 + **25 kV 115** | 110-160 / 280 | El tramo Palencia–León de alta velocidad es el hueco del punto 0.2. |
| levante | ibérico 485 | 3 kV | 140-170 | |
| sur | ibérico 441 + **estándar 127** | 3 kV 441 + **25 kV 127** | 140-160 / 240 | El tramo Córdoba–Sevilla de alta velocidad es el hueco del punto 0.2. |
| mediterraneo | ibérico 275 + mixto 75 | 3 kV | 140-200 | |
| ebro | ibérico | 3 kV | 90-160 | |
| galicia | ibérico | **25 kV entero** | 180-190 | Sin trenes bitensión o de 25 kV no circula ningún eléctrico de 3 kV. |
| asturias | mixto 71 + ibérico 61 | 25 kV 71 + 3 kV 61 | 220 / 110 | Hay que comprobar la Variante frente a la Rampa. |
| extremadura | ibérico | **sin catenaria 272** + 25 kV 216 | 150 / 180 | |
| teruel | ibérico 327 + mixto 34 | sin catenaria 327 + 3 kV 34 | 160 | |
| soria | ibérico | 3 kV 158 + **sin catenaria 91** | 140 / 110 | |
| cantabria | ibérico | 3 kV | 110 | Túneles estrechos (gálibo). |

**Datos nuevos en `rescate-data.js`:**
```js
export const GAUGE_SHORT = {ib:'Ibérico', std:'Estándar', var:'Variable', met:'Métrico', mixto:'Mixto'};
export const POWER = {'3kv':'Eléctrico 3 kV', '25kv':'Eléctrico 25 kV', dual:'Bitensión 3/25 kV', diesel:'Diésel', bimodo:'Bimodo', bateria:'Batería'};
export const KIND = {cercanias:'Cercanías', regional:'Regional', md:'Media distancia', larga:'Larga distancia', ave:'Alta velocidad'};
// CORRIDORS: añadir tunnels:'estrecho' a cantabria (y asturias si es la Rampa); segments a mano en norte y sur.
```

**Tipos de tren.** `TRAIN_TYPES` sustituye a `TRAIN_OFFERS`, y `OFFER = índice de TRAIN_TYPES`. Hay que mantener el campo `model` (el nombre que se muestra) y los ids heredados. Las cifras técnicas son aproximadas y los precios están en la escala del juego:

| id | Nombre (fabricante) | Tipo | Ancho | Tracción | Velocidad | Plazas | Precio | Entrega | Foto |
|---|---|---|---|---|---|---|---|---|---|
| `kafka` | Civia Regional 463 (KAFKA) | cercanías | ib | 3kv | 120 | 290 | 3,0 | 4 semanas (stock) | 465 |
| `dorfler` | LIRIO 4 (Dörfler) | regional | ib | dual | 160 | 310 | 3,5 | 6 | dorfler |
| `bcbb` | Fuxing Regional (BCBB) | regional | ib | dual | 160 | 330 | 2,1 | 3 | bcbb |
| `used` | Serie 592 (heredado) | regional | ib | diesel | 120 | 220 | 1,1 | 1 | 592 |
| `kafka-md` | Serie 449-like | md | ib | 3kv | 160 | 236 | 3,6 | 26 | 449 |
| `kafka-dmu` | Serie 599-like | regional | ib | diesel | 160 | 190 | 3,2 | 20 | 599 |
| `dorfler-bimodo` | LIRIO Bimodo | regional | ib | bimodo | 160 (140 en diésel) | 220 | 4,2 | 30 | dorfler |
| `dorfler-akku` | LIRIO Akku, autonomía 80 km | regional | ib | bateria | 160 | 200 | 4,4 | 36 | dorfler |
| `tardo-730` | Alvia híbrido | larga | var | bimodo | 250 (180 en diésel) | 265 | 6,8 | 52 | 730 |
| `schlimmens-ave` | Velaro-like | ave | std | 25kv | 350 | 404 | 11 | 104 | 103 |

- `bcbb` tiene `galibo:'amplio'` y fiabilidad 0,78.
- `dorfler-bimodo` se desbloquea con la tecnología `bimodo` (`rescate-data.js:149`).
- `schlimmens-ave` es un señuelo: no circula por ningún corredor.
- Series de segunda mano: 592, 594, 599, 440, 446, 449, 465, 120, 130, y como señuelos 2700 (ancho métrico) y 114 (ancho estándar). Todas tienen foto en `assets/train-photos`.

**Compatibilidad** (función pura; usa el mismo 0,84 y el tope de 160 km/h sin catenaria que `infra.js:132-133`):
```js
const RUNS_ON = {ib:['ib','var'], std:['std','var'], mixto:['ib','std','var'], met:['met']};
const VOLTS = {'3kv':['3kv','dual','bimodo','bateria','diesel'], '25kv':['25kv','dual','bimodo','bateria','diesel'], no:['diesel','bimodo','bateria']};
export function compat(spec, segs, def) {
  const reasons = []; let minutes = 0, km = 0, thermalKm = 0, gap = 0, maxGap = 0;
  for (const x of segs) {
    km += x.km;
    if (!RUNS_ON[x.gauge]?.includes(spec.gauge)) reasons.push(`Ancho ${GAUGE_SHORT[x.gauge].toLowerCase()} y el tren es de ancho ${GAUGE_SHORT[spec.gauge].toLowerCase()}`);
    if (!VOLTS[x.elec].includes(spec.power)) reasons.push(x.elec === 'no' ? 'Hay tramos sin catenaria' : `Catenaria de ${x.elec === '3kv' ? '3 kV' : '25 kV'}`);
    gap = x.elec === 'no' ? gap + x.km : 0; maxGap = Math.max(maxGap, gap);
    const thermal = spec.power === 'diesel' || (x.elec === 'no' && spec.power === 'bimodo');
    if (thermal) thermalKm += x.km;
    const v = Math.min(x.vmax, x.elec === 'no' ? 160 : 999, thermal && spec.vmaxDiesel ? spec.vmaxDiesel : spec.vmax);
    minutes += x.km / Math.max(40, v * .84) * 60;
  }
  if (spec.power === 'bateria' && maxGap > spec.range) reasons.push(`${maxGap} km sin catenaria; la batería da ${spec.range}`);
  if (spec.galibo === 'amplio' && def.tunnels === 'estrecho') reasons.push('No cabe en los túneles (gálibo)');
  return {ok: !reasons.length, reasons: [...new Set(reasons)], minutes: Math.round(minutes), thermalShare: thermalKm / Math.max(1, km)};
}
```
Ejemplo: en Soria hay 91 km sin catenaria y la batería da 80, así que el Akku no llega. Electrificar o ampliar la autonomía lo resuelve.

**Dónde afecta en `rescate.js`:**
- `reorganize` (L434-444), `openCorridor` (L457) y `openQuote` (L446): `trainsIdle(s)` pasa a `compatibleIdle(s, id)`.
- `serviceQuote` (L422-432): nueva razón «Solo N trenes compatibles (ancho/tensión)».
- Regreso de taller o avería en `closeWeek` (L1174-1177): `t.back` solo si `canRun`.
- Barrido semanal: se quitan del corredor los trenes que hayan dejado de ser compatibles y se avisa en el informe.
- `corridorCost` (L220-232): energía por tren, `TRAIN_RUN.energy × (1 + .5·thermalShare) × spec.energy` en lugar del multiplicador `diesel` por corredor. El 592 diésel del Norte pasa a pagar gasóleo.
- Mantenimiento: `× (1 + max(0, edad − 20)·.02)`. Averías (L1203): `reliability − max(0, edad − 25)·.004`.
- `serviceForecast` (L188-218): `speedF = clamp((refMin/min)^.5, .8, 1.2)`, donde `refMin` son los minutos con el tren de la flota inicial, de modo que la línea base no cambie. Cercanías en corredores de más de 200 km: ×0,9. El exprés usa los trenes más rápidos y no los de más plazas; exige 160 km/h o más.
- El evento `tuneles` (L899, L914 y L960) promete «el BCBB no circula en Cantabria» pero hoy solo pone `flags.tuneles`. La regla de gálibo lo hace cumplir.
- `applyWork` y la electrificación del otro agente deben elegir tensión, 3 kV o 25 kV. Con 25 kV, Soria y Teruel quedarían mixtos (3 + 25) y harían falta trenes bitensión. Como decisión de juego, 25 kV es más barato por km (menos subestaciones).

## 6. Anuncios de segunda mano deterministas por semana

Reglas:
- La generación depende solo de la semilla de la partida y de la semana: `(s.seed, semana)`. No usa `s.rng` ni `Math.random`, así que mirar sigue siendo gratis y cargar la partida da lo mismo.
- Cada semana se publican de 1 a 3 anuncios, que duran de 2 a 5 semanas.
- Los anuncios vendidos se descuentan con `s.market.sold[id]`.
- Hay como mucho un señuelo incompatible por semana: probabilidad 0,25, solo si hay 2 o más anuncios y desde la semana 8.

```js
function hash32(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=seed>>>0;return()=>{let t=(a=(a+0x6D2B79F5)>>>0);t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};} // mismo mezclador que rand() en rescate.js:24-28
export function adsOfWeek(seed, w) {
  const r = rng(hash32(seed + '|tp|' + w)), n = 1 + Math.floor(r() * 3), decoy = w >= 8 && n >= 2 && r() < .25, out = [];
  for (let k = 0; k < n; k++) {
    const p = pickW(r, decoy && k === n - 1 ? USED_POOL.filter(x => x.decoy) : USED_POOL.filter(x => !x.decoy));
    const year = START_YEAR + Math.floor((w - 1) / 52), born = p.born[0] + Math.floor(r() * (p.born[1] - p.born[0] + 1)), age = year - born;
    const condition = Math.round(clamp(96 - age * .9 - r() * 22, 30, 92));
    const unit = round2(p.newPrice * clamp(1 - age / 45, .4, .85) * (.6 + condition / 250));
    const [seller, place] = SELLERS[Math.floor(r() * SELLERS.length)];
    out.push({id: `u${w}-${k}`, type: p.series, photo: p.series, maker: p.maker, title: p.name, state: 'used', born, age, condition,
      km: Math.round(age * (90 + r() * 70)) * 1000, unit, stock: r() < .3 ? 2 : 1, lead: [0,0,1,2,3][Math.floor(r()*5)], published: w,
      expires: w + 2 + Math.floor(r() * 4), seller, place});
  }
  return out;
}
export function usedListings(s, week = s.week) {
  const out = [];
  for (let w = Math.max(1, week - 5); w <= week; w++) for (const a of adsOfWeek(s.seed, w))
    if (a.expires >= week) { const stock = a.stock - (s.market?.sold?.[a.id] || 0); if (stock > 0) out.push({...a, stock}); }
  return out;
}
```

Pasos de aplicación al precio y al estado:
- La tecnología `segunda` (`mod(s,'usedDiscount')`) se aplica en el presupuesto, no en la generación: `unit × (1 − d)` y `condition + d·60`, igual que `rescate.js:510-513`.
- `SELLERS` son los talleres del clásico (`marketplace.js:15`) más «OuiOui · excedente» (operadora paródica de `brands.js`) y «Chatarrería ferroviaria de Mérida».
- Para que el mercado nunca quede vacío, hay un lote permanente `n-used`: el 592 heredado.

Lo he medido con un prototipo, semilla 11, semanas 1 a 416:
- Anuncios activos: de 1 a 15, con media 8,8. Se publican 1,97 por semana y el 8 % son señuelos.
- Precios por serie: 592 de 0,86 a 0,98 M€; 594 de 0,73 a 0,84; 599 de 1,09 a 1,83; 449 de 1,24 a 1,95; 465 de 0,95 a 1,63; 120 y 130 de 1,9 a 3,4.
- Las dos ejecuciones dieron el mismo resultado, y otra semilla da otro mercado.

El prototipo está en `/tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/proto.mjs` y no forma parte del proyecto.

Para validar la partida guardada (sustituye a L60-75 del clásico):
- Cada clave de `sold` cumple `/^u(\d+)-(\d+)$/`, con semana ≤ `s.week` y slot < `adsOfWeek(seed, w).length`.
- La cantidad es entera y está entre 1 y el stock del anuncio.
- Debe coincidir con la suma de `s.market.orders` de ese anuncio.
- `favorites` es una lista de como mucho 200 ids únicos que cumplen `/^(u\d+-\d+|n-[a-z0-9-]+)$/`.

## 7. API propuesta para el motor

Nuevo `dist/rescate-market.js`, sin DOM ni estado, que importa solo `rescate-data.js`: `TRAIN_TYPES`, `USED_POOL`, `SELLERS`, `adsOfWeek`, `usedListings`, `factoryListings(s)`, `compat`, `trainSpec`, `validMarket(s)`.

En `rescate.js` (necesita `needOrder`, `spend`, `takeKickback` y `segmentsOf`, que son privados o locales):
```js
export function ensureMarket(s)  // s.market ||= {v:1, sold:{}, favorites:[], orders:[]}  (las partidas viejas no lo tienen)
export function trainSpec(x)     // unidad de la flota | anuncio | id → {id,model,series,maker,kind,gauge,power,vmax,vmaxDiesel,range,seats,reliability,energy,galibo,photo,born}
export function canRun(s, trainOrSpec, corridorId)  // compat(trainSpec(x), segmentsOf(s, id), CORRIDOR[id])
export function compatibleIdle(s, corridorId)       // trainsIdle(s).filter(t => canRun(s,t,corridorId).ok)
export function marketListings(s)   // [...factoryListings(s), ...usedListings(s)] y n-used siempre
export function marketListing(s, id)  // lanza 'Este anuncio ya no está disponible. Revisa los nuevos lotes de Trenespop.'
export function marketFilter(s, f, quote) // f = {query,state,maker,power,gauge,kind,delivery,corridor,compatible,favorites,sort}
export function marketQuote(s, id, qty = 1, {kickback = false} = {})
  // → {item, spec, qty, unit, total, depositRate, deposit, rest, lead, arrives, last, condition, born, weekly,
  //    fits: {[corridorId]: compat}, runsOn: [ids abiertos y compatibles], reasons: []}   (puro; mirar es gratis)
  // depositRate: lead 0 → 1 (pago y servicio inmediato); usado con envío → .3; nuevo → .4 (lo de hoy, rescate.js:511)
  // qty: usado ≤ stock; nuevo 1..4; los nuevos llegan en cadencia: unidad k en lead + 2k semanas
  // reasons: caja < deposit, sin órdenes, modelo bloqueado (tecnología), qty fuera de rango; la incompatibilidad es un aviso, no bloquea
export function marketBuy(s, id, qty = 1, {kickback = false} = {})
  // needOrder(s,'compra'); spend(s, deposit); sold[id] += qty (usados);
  // una entrada en s.market.orders {id:'p'+nextId, listing, type, state, maker, qty, unit, total, deposit, rest, depositRate, week, arrives:[...], trains:[...], condition, born}
  // por unidad: s.payments.push({week: llegada, amount: unit*(1-depositRate), label:'Pago a la entrega · '+model, kind:'compra', order})
  // por unidad: s.fleet.push({id, name, offer: type, condition, born, maker, order, status: lead ? 'arriving' : 'service', corridor: null, weeks: lead})
  // kickback solo en los nuevos (takeKickback, rescate.js:756); flags.bcbb igual que hoy
export function marketFavorite(s, id)  // alterna y devuelve liked; marketListing antes (lanza si ya no existe)
// envoltorios heredados para los tests y el bot de rescate-test.mjs:
export function trainQuote(s, offerId, kickback) { const q = marketQuote(s, 'n-' + offerId, 1, {kickback}); return {offer: q.spec, price: q.total, deposit: q.deposit, rest: q.rest, arrives: q.arrives, weekly: q.weekly, condition: q.condition, reasons: q.reasons}; }
export function buyTrain(s, offerId, kickback) { return marketBuy(s, 'n-' + offerId, 1, {kickback}); }
```

Otros cambios en el motor:
- `sellTrain` usa el valor depreciado por edad, por ejemplo `price × clamp(1 − edad/45, .4, .85) × condition × .55`.
- `rentTrain(s, type = 'kafka')` debe permitir alquilar un diésel 599 para corredores sin catenaria.
- `validate` (L1349-1357): añadir `(!x.market || validMarket(x))` y `TRAIN_TYPES[t.offer]`.
- `closeWeek` no necesita otro cambio para las entregas: el bucle de L1172-1173 ya pasa los trenes `arriving` a servicio, y los pagos de L1252 cobran «a la entrega». Si no hay caja, se lanza el impago normal (L1290-1294).

## 8. Interfaz en `rescate-ui.js`

- `ui.market = {query:'', state:'all', maker:'all', power:'all', gauge:'all', kind:'all', delivery:'all', corridor:'all', compatible:true, favorites:false, sort:'recommended', view:'catalogue', id:null, qty:1, kick:false}`. Va fuera de `ui.plan` para que `closeModal` (L99) no lo borre.
- `planBuy(corr)` (L240): `ui.market.corridor = corr || 'all'; ui.market.view = 'catalogue'; drawMarket()`.
- `openModal(html, kind)` (L98): añadir `modal.classList.toggle('tp-wide', kind === 'market')` y `class="inner trenespop-modal"`.
- `drawMarket()`:
  - Llama a `tpCatalogue(items, {attr:'data-a', ids:{form:'rsMkForm', search:'rsMkSearch', …}, money:R.fmt, thumb:trainThumb, …})`.
  - Pone como cabecera una `tp-game-strip` con «‹ Volver al mapa», el texto «Compra material para tu red» y `${X}` (que mantiene `data-a="close"` para el test).
  - Categorías por tipo: Todos, Cercanías, Regional y media distancia, Larga distancia, y «Mis compras».
  - Selects: Estado, Marca, Tracción (3 kV, 25 kV, Bitensión, Diésel, Bimodo, Batería), Ancho (Ibérico, Variable, Estándar, Métrico), Entrega (Esta semana, ≤4, ≤12, ≤52 semanas), Corredor y un interruptor «Solo compatibles».
  - En la ficha, `tp-spec` muestra `vmax km/h · plazas · tracción · ancho`; en la foto va el distintivo `tp-fit` («Circula en Norte, Levante +2» o «No circula en tu red: ancho métrico»); abajo, `place · stock uds.` y `brandLogo(maker)`.
- `drawListing(id)`:
  - Llama a `tpDetail(item, …)` con etiquetas de velocidad, plazas, ancho, tracción, tipo, año, km, estado, fiabilidad ★ y gálibo.
  - Muestra la tabla `tp-compat` con cada corredor abierto: ✓ o ✗, el motivo, los minutos y Δ viajeros con `R.serviceForecast(s, id, {trains: c.trains + 1})`, que ya hace `drawBuy` en L243-244.
  - Cantidad en `#rsMkQty` (el evento `input` actualiza solo `#rsMkQuote` para no perder el foco). Presupuesto con `rs-kpis`: Total, Señal (o «A pagar ahora»), Llega la semana X y Resto a la entrega.
  - El interruptor `buy-kick` solo en anuncios nuevos.
- `drawOrders()`: `s.market.orders` con señal pagada, pendiente (los `s.payments` con `order`), semanas de llegada y estado.
- Acciones `data-a`: `market-reset`, `market-cat`, `market-favorites`, `market-favorite`, `market-listing`, `market-back`, `market-orders`, `market-buy` (`attempt(() => R.marketBuy(s, id, ui.market.qty, {kickback: ui.market.kick}), q => q.lead ? 'Llega en la semana ' + q.arrives : 'Ya está en tu flota', 'contract')`, y después `drawMarket()`) y `rent`.
- Eventos de entrada y cambio (L540-550): `rsMkSearch` (con antirrebote, conservando el cursor), los selects `rsMk*` y `rsMkQty`. El submit `rsMkForm` necesita su propio `root.addEventListener('submit')`, que ahora no existe.
- `fleetPage` (L305-312): mostrar `maker · tracción · ancho · año` y un aviso «sin corredor compatible».

## 9. Pruebas que habría que añadir o tocar

- `marketplace-test.mjs`: el HTML clásico es idéntico antes y después de la refactorización.
- `rescate-test.mjs`:
  - Determinismo: `adsOfWeek(seed, w)` igual en dos llamadas y entre guardar y cargar.
  - `marketQuote` no modifica `s` (comparar `JSON.stringify` antes y después).
  - Comprar un lote usado descuenta su stock.
  - `validate` rechaza un `sold` manipulado.
  - Compatibilidad: Civia en `galicia` da ✗ por 25 kV; 599 en `extremadura` da ✓; Akku en `soria` da ✗ (91 > 80); `bcbb` en `cantabria` da ✗ por gálibo; Civia en `norte` y `sur` da ✓, lo que obliga a corregir los tramos del punto 0.2.
  - Las aserciones de las líneas 27-28, 35, 63 y 104-105 siguen pasando gracias a los envoltorios.
- `rescate-ui-test.mjs:70-74`: siguen apareciendo `bcbb` y `dorfler` en `.rs-modal` con los filtros por defecto. Añadir un clic en `[data-a=market-listing]` y en `[data-a=market-buy]`, y comprobar que el estado clásico no cambia (protección contra el problema 0.1).