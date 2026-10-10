import {MODELS, MODEL, GAUGES, POWERS, VOLTAGE_TEXT} from './data.js';
import {brandLogo, brandName} from './brands.js';
import {plan, profileOf, faultText, keyFault} from './infra.js';

export const MANUFACTURERS = ['Tardo', 'KAFKA', 'Schlimmens', 'Dörfler', 'BCBB', 'Malstom'];
export const makerName = m => brandName(m.maker);
/** Foto del material: Dörfler y BCBB enseñan su propio tren, no el de la serie equivalente. */
export const photoKey = item => item.maker === 'BCBB' ? 'bcbb' : item.maker === 'Dörfler' ? 'dorfler' : MODEL[item.model]?.photo || item.model;
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = x => String(x ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const money = x => x.toLocaleString('es-ES', {maximumFractionDigits: 2}) + ' M€';
const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.7 4.9a5.3 5.3 0 0 0-7.5 0L12 6.1l-1.2-1.2a5.3 5.3 0 0 0-7.5 7.5L12 21l8.7-8.6a5.3 5.3 0 0 0 0-7.5Z"/></svg>';
const search = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 4.5 4.5"/></svg>';
const truck = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v11H3zM14 10h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>';
const usedModels = ['s100', 's112', 's103', 's120', 's130', 's730', 's106f', 's106v', 'r465', 'r599', 'r592'];
const yards = ['Talleres de Valladolid', 'Material de La Sagra', 'Depósito de Fuencarral', 'Cocheras de Zaragoza'];
const AVAILABLE_YEAR = {s100: 2022};

export function initialMarketplace() { return {version: 1, sold: {}, favorites: []}; }
export function ensureMarketplace(s) { return s.marketplace ||= initialMarketplace(); }
export const marketPeriod = s => Math.floor(s.month / 6);
export const usedStock = (model, period) => 2 + (usedModels.indexOf(model) + period * 3) % 5;

/** Each used advert is a finite lot. Six-month arrivals create new lots, never refill a sold advert. */
export function listings(s) {
  const year = 2022 + Math.floor(s.month / 12), period = marketPeriod(s);
  const fresh = MODELS.filter(m => m.year < 2099).map(m => ({id: 'new-' + m.id, model: m.id, maker: makerName(m), title: m.name, state: 'new', condition: 100, age: 0, priceFactor: 1, leadAdjustment: 0, seller: makerName(m) + ' · fábrica', place: 'Venta de fábrica', year: m.year, stock: 30, equivalent: false}));
  fresh.push(
    {id: 'new-dorfler-s120', model: 's120', maker: 'Dörfler', title: 'Dörfler · Alvia a medida', state: 'new', condition: 100, age: 0, priceFactor: 1.04, leadAdjustment: -4, seller: 'Dörfler · fábrica', place: 'Venta de fábrica', year: MODEL.s120.year, stock: 30, equivalent: true},
    {id: 'new-bcbb-s103', model: 's103', maker: 'BCBB', title: 'BCBB · Alta velocidad', state: 'new', condition: 100, age: 0, priceFactor: .76, leadAdjustment: -8, seller: 'BCBB · fábrica', place: 'Venta de fábrica', year: MODEL.s103.year, stock: 30, equivalent: true}
  );
  const secondHand = usedModels.filter(id => year >= (AVAILABLE_YEAR[id] || MODEL[id].year)).map((id, i) => {
    const m = MODEL[id], condition = 59 + (i * 7 + period * 5) % 29, stock = usedStock(id, period);
    const listingId = `used-${id}-${period}`;
    return {id: listingId, model: id, maker: makerName(m), title: m.name, state: 'used', condition, age: id === 's100' ? Math.max(8, year - 1992) : 6 + (i + period) % 8, priceFactor: .30 + condition * .0035, lead: [0, 1, 3, 6][(i + period) % 4], seller: yards[(i + period) % yards.length], place: ['Valladolid', 'Toledo', 'Madrid', 'Zaragoza'][(i + period) % 4], year: AVAILABLE_YEAR[id] || m.year, stock: Math.max(0, stock - (s.marketplace?.sold?.[listingId] || 0)), originalStock: stock, equivalent: false};
  });
  return [...secondHand, ...fresh];
}
export function listing(s, id) {
  const item = listings(s).find(x => x.id === id);
  if (!item) throw Error('Este anuncio ya no está disponible. Revisa los nuevos lotes de Trenespop.');
  return item;
}
export function quoteListing(s, model, qty, id, standard) {
  const item = listing(s, id);
  if (item.model !== model) throw Error('El anuncio no corresponde a ese tren.');
  if (2022 + Math.floor(s.month / 12) < item.year) throw Error('Este tren todavía no se vende.');
  if (qty > item.stock) throw Error(`Quedan ${item.stock} unidades en este anuncio.`);
  const unit = standard.unit * item.priceFactor, total = unit * qty;
  const lead = item.state === 'used' ? item.lead : Math.max(MODEL[model].family === 'Regional' ? 1 : 16, standard.lead + item.leadAdjustment);
  const immediate = lead === 0, depositRate = immediate ? 1 : .3;
  return {total, unit, lead, last: immediate ? 0 : lead + Math.ceil(qty / 2) - 1, deposit: total * depositRate, remaining: total * (1 - depositRate), depositRate, item};
}
export function favorite(s, id) {
  listing(s, id);
  const m = ensureMarketplace(s), index = m.favorites.indexOf(id);
  if (index >= 0) m.favorites.splice(index, 1);
  else { m.favorites.push(id); if (m.favorites.length > 200) m.favorites.shift(); }
  return index < 0;
}
export function validMarketplace(s) {
  if (s.marketplace === undefined) return !s.orders.some(o => o.marketplace?.state === 'used'); // Existing version-4 saves remain valid.
  const m = s.marketplace;
  if (!m || m.version !== 1 || !m.sold || typeof m.sold !== 'object' || Array.isArray(m.sold) || !Array.isArray(m.favorites) || m.favorites.length > 200 || new Set(m.favorites).size !== m.favorites.length) return false;
  const validId = id => /^new-(?:dorfler-|bcbb-)?[a-z0-9]+$/.test(id) || /^used-[a-z0-9]+-\d+$/.test(id);
  if (m.favorites.some(id => typeof id !== 'string' || !validId(id))) return false;
  const reserved = {};
  for (const o of s.orders) if (o.marketplace?.state === 'used') reserved[o.marketplace.listing] = (reserved[o.marketplace.listing] || 0) + o.qty;
  if (Object.keys(m.sold).length > 17000) return false;
  for (const [id, qty] of Object.entries(m.sold)) {
    const match = /^used-([a-z0-9]+)-(\d+)$/.exec(id), period = match && Number(match[2]);
    if (!match || !usedModels.includes(match[1]) || !Number.isSafeInteger(period) || period > marketPeriod(s) || !Number.isInteger(qty) || qty < 1 || qty > usedStock(match[1], period) || qty !== reserved[id]) return false;
    delete reserved[id];
  }
  return Object.keys(reserved).length === 0;
}
export function validMarketplaceOrder(o, s) {
  if (o.marketplace === undefined) return true;
  const p = o.marketplace;
  if (!p || o.historical || !['new', 'used'].includes(p.state) || ![...MANUFACTURERS, 'Tenfe', 'Licitación de Renfe'].includes(p.maker) || !Number.isInteger(p.condition) || p.condition < 1 || p.condition > 100 || !Number.isInteger(p.born) || p.born < 1950 || p.born > 2022 + Math.floor(o.start / 12) || !Number.isInteger(o.start) || o.start < 0 || o.start > s.month || !Number.isFinite(o.total) || o.total <= 0 || ![.3, 1].includes(p.depositRate)) return false;
  if (Math.abs(o.total - o.unit * o.qty) > .000001 || Math.abs(o.remaining - (o.qty - o.delivered) * o.unit * (1 - p.depositRate)) > .000001) return false;
  if (p.state === 'new') return p.condition === 100 && p.depositRate === .3 && (p.listing === 'new-' + o.model || p.listing === 'new-dorfler-s120' && o.model === 's120' || p.listing === 'new-bcbb-s103' && o.model === 's103');
  const match = /^used-([a-z0-9]+)-(\d+)$/.exec(p.listing || '');
  return !!match && match[1] === o.model && usedModels.includes(o.model) && Number(match[2]) === Math.floor(o.start / 6) && (p.depositRate !== 1 || o.delivered === o.qty);
}

// «Circula en»: si un modelo puede ir hoy por una relación (ancho, catenaria y su tensión, cambiadores y obras).
const routeOf = (s, id) => (s.routes || []).find(r => r.id === id) || null;
/** ¿Puede circular el modelo por la relación con la red de hoy? {ok, reason}: el primer motivo en corto, o null si no hay relación. */
export function routeFit(s, routeId, model) {
  const r = routeOf(s, routeId), m = MODEL[model];
  if (!r || !m) return null;
  const p = plan(s, r.via, profileOf(m)), f = p.ok ? null : keyFault(s, p.faults);
  return {ok: p.ok, reason: p.ok ? '' : f ? faultText(s, f, true) : 'No hay vías'};
}
/** En cuántas relaciones del juego puede circular hoy el modelo. */
export function routeReach(s, model) {
  const m = MODEL[model], prof = m && profileOf(m), routes = s.routes || [];
  return {ok: prof ? routes.filter(r => plan(s, r.via, prof).ok).length : 0, total: routes.length};
}
const fitBadge = fit => fit ? `<p class="tp-fit ${fit.ok ? 'ok' : 'no'}">${fit.ok ? '✓ Circula' : '✗ ' + esc(fit.reason)}</p>` : '';
function routeSelect(s, value) {
  const routes = [...(s.routes || [])].sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), 'es')), mine = routes.filter(r => r.active), rest = routes.filter(r => !r.active);
  const opt = r => `<option value="${esc(r.id)}"${r.id === value ? ' selected' : ''}>${esc(r.name || r.id)}</option>`;
  return `<label class="tp-filter tp-route"><span class="tp-sr">Circula en</span><select id="marketRoute" aria-label="Circula en"><option value=""${value ? '' : ' selected'}>Circula en</option>${mine.length ? `<optgroup label="En servicio">${mine.map(opt).join('')}</optgroup>` : ''}<optgroup label="${mine.length ? 'Otras relaciones' : 'Relaciones'}">${rest.map(opt).join('')}</optgroup></select></label>`;
}

/** Filtering uses the same current quote as checkout, including backlog and reserved stock. */
export function filterListings(s, filters, quote) {
  const query = norm(filters.query).trim(), year = 2022 + Math.floor(s.month / 12);
  const route = filters.route && routeOf(s, filters.route) ? filters.route : null;
  const items = listings(s).filter(item => item.stock > 0 && item.year <= year).map(item => ({...item, q: quote(item.model, 1, item.id), fit: route ? routeFit(s, route, item.model) : null})).filter(item => {
    if (filters.state !== 'all' && filters.state && item.state !== filters.state) return false;
    if (filters.maker !== 'all' && filters.maker && item.maker !== filters.maker) return false;
    if (filters.family !== 'all' && filters.family && MODEL[item.model].family !== filters.family) return false;
    if (filters.delivery !== 'all' && filters.delivery !== undefined && item.q.lead > Number(filters.delivery)) return false;
    if (filters.favorites && !s.marketplace?.favorites?.includes(item.id)) return false;
    if (query && !norm([item.title, item.maker, MODEL[item.model].family, item.seller, item.place].join(' ')).includes(query)) return false;
    return item.stock > 0 && item.year <= year;
  });
  if (filters.sort === 'price') items.sort((a,b) => a.q.unit - b.q.unit);
  if (filters.sort === 'delivery') items.sort((a,b) => a.q.lead - b.q.lead || a.q.unit - b.q.unit);
  if (filters.sort === 'condition') items.sort((a,b) => b.condition - a.condition || a.q.unit - b.q.unit);
  // con «Circula en», primero los que pueden ir por esa relación (el orden elegido se mantiene dentro de cada grupo)
  if (route) items.sort((a, b) => Number(b.fit.ok) - Number(a.fit.ok));
  return items;
}
export function deliveryText(lead) { return lead === 0 ? 'Entrega inmediata' : `Envío en ${lead} ${lead === 1 ? 'mes' : 'meses'}`; }
function select(id, label, value, options) {
  return `<label class="tp-filter"><span class="tp-sr">${label}</span><select id="${id}" aria-label="${label}">${options.map(([v, text]) => `<option value="${v}"${String(value) === String(v) ? ' selected' : ''}>${esc(text)}</option>`).join('')}</select></label>`;
}
export function catalogueHTML(s, filters, quote, thumb) {
  const all = listings(s), available = all.filter(x => x.stock > 0 && x.year <= 2022 + Math.floor(s.month / 12));
  // Locked factory models appear in the ordinary catalogue again when their launch year arrives.
  const items = filterListings(s, filters, quote), favoriteCount = s.marketplace?.favorites?.filter(id => available.some(x => x.id === id)).length || 0;
  const route = filters.route ? routeOf(s, filters.route) : null, fits = route ? items.filter(x => x.fit?.ok).length : 0;
  return `<section class="trenespop" aria-label="Trenespop, compra y venta de trenes">
    <header class="tp-header"><a class="tp-logo" href="#" data-action="market-reset" aria-label="Trenespop, todos los trenes">${brandLogo('Trenespop')}</a><form id="marketSearchForm" class="tp-search">${search}<input type="search" id="marketSearch" value="${esc(filters.query)}" placeholder="Buscar trenes, marcas y talleres" aria-label="Buscar en Trenespop"><button type="submit" aria-label="Buscar trenes">Buscar</button></form><button class="tp-favorites${filters.favorites ? ' active' : ''}" data-action="market-favorites" aria-label="${filters.favorites ? 'Salir de favoritos' : 'Ver favoritos'}" aria-pressed="${!!filters.favorites}">${heart}<span>Favoritos${favoriteCount ? ` (${favoriteCount})` : ''}</span></button></header>
    <nav class="tp-categories" aria-label="Categorías de trenes"><span>España</span><button data-action="market-family" data-id="all" class="${filters.family === 'all' ? 'active' : ''}">Todos los trenes</button><button data-action="market-family" data-id="AVE" class="${filters.family === 'AVE' ? 'active' : ''}">Alta velocidad</button><button data-action="market-family" data-id="Alvia" class="${filters.family === 'Alvia' ? 'active' : ''}">Ancho variable</button><button data-action="market-family" data-id="Regional" class="${filters.family === 'Regional' ? 'active' : ''}">Regionales</button><button data-action="fleet-tab" data-id="orders">Mis compras</button></nav>
    <div class="tp-filters">${select('marketState', 'Estado del tren', filters.state, [['all','Estado'],['new','Nuevo'],['used','Usado']])}${select('marketDelivery', 'Tiempo hasta el primer envío', filters.delivery, [['all','Tiempo de envío'],['0','Inmediato'],['3','Hasta 3 meses'],['12','Hasta 12 meses']])}${select('marketMaker', 'Fabricante', filters.maker, [['all','Marca'],...MANUFACTURERS.map(x => [x,x])])}${routeSelect(s, route?.id || '')}<button class="tp-clear" data-action="market-reset">Limpiar filtros</button></div>
    <div class="tp-breadcrumb">Trenespop <span>›</span> Trenes <span>›</span> ${filters.favorites ? 'Tus favoritos' : filters.state === 'used' ? 'Segunda mano' : filters.state === 'new' ? 'Nuevos' : 'Todos'}</div>
    <div class="tp-results"><div><h2>${filters.favorites ? 'Tus trenes favoritos' : 'Trenes que buscan nueva vía'}</h2><p><b id="marketResultCount">${items.length}</b> anuncios · ${route ? `<span id="marketRouteCount">${fits}</span> circulan por ${esc(route.name || route.id)}` : 'precios por unidad'}</p></div>${select('marketSort', 'Ordenar anuncios', filters.sort, [['recommended','Más relevantes'],['price','Precio: menor primero'],['delivery','Entrega más rápida'],['condition','Mejor estado']])}</div>
    <div class="tp-grid">${items.map(item => { const m = MODEL[item.model], liked = s.marketplace?.favorites?.includes(item.id); return `<article class="tp-card" data-listing="${item.id}"><button class="tp-photo" data-action="market-listing" data-id="${item.id}" aria-label="Ver ${esc(item.title)}">${thumb(photoKey(item))}<span class="tp-state${item.state === 'new' ? ' new' : ''}">${item.state === 'new' ? 'Nuevo' : 'Usado · ' + item.condition + ' %'}</span></button><button class="tp-heart${liked ? ' liked' : ''}" data-action="market-favorite" data-id="${item.id}" aria-label="${liked ? 'Quitar de' : 'Añadir a'} favoritos: ${esc(item.title)}" aria-pressed="${!!liked}">${heart}</button><div class="tp-card-body"><div class="tp-price">${money(item.q.unit)}</div><button class="tp-title" data-action="market-listing" data-id="${item.id}">${esc(item.title)}</button><p class="tp-spec">${m.speed} km/h · ${m.seats} plazas${item.equivalent ? ' · equivalente' : ''}</p>${fitBadge(item.fit)}<div class="tp-delivery">${truck}<span>${deliveryText(item.q.lead)}</span></div><div class="tp-card-bottom"><span>${esc(item.place)}${item.state === 'used' ? ' · ' + item.stock + ' uds.' : ''}</span>${brandLogo(item.maker)}</div></div></article>`; }).join('')}</div>
    ${items.length ? '' : '<div class="tp-empty"><h3>No hay trenes con estos filtros.</h3><p>Prueba otra marca, un plazo más amplio o los anuncios nuevos.</p><button data-action="market-reset" class="tp-primary">Ver todos los trenes</button></div>'}
    <footer class="tp-footer"><strong>Una segunda vida. Un nuevo destino.</strong><span>Los lotes de ocasión se renuevan cada seis meses. La entrega inmediata se paga al completo; los demás pedidos, con un 30 % de anticipo.</span></footer>
  </section>`;
}
export function detailHTML(s, item, thumb, routeId = null) {
  const m = MODEL[item.model], quantity = Math.min(item.state === 'used' ? item.stock : 4, 4), favoriteSelected = s.marketplace?.favorites?.includes(item.id);
  const reach = routeReach(s, item.model), route = routeId ? routeOf(s, routeId) : null, fit = route && routeFit(s, route.id, item.model);
  const fitLine = fit ? `<p class="tp-fit ${fit.ok ? 'ok' : 'no'}">${fit.ok ? '✓ Circula por ' + esc(route.name || route.id) : '✗ ' + esc(route.name || route.id) + ' · ' + esc(fit.reason)}</p>` : '';
  return `<div class="content tp-detail"><button class="tp-back" data-action="close-modal">‹ Volver a Trenespop</button><div class="tp-detail-photo">${thumb(photoKey(item))}<span class="tp-state${item.state === 'new' ? ' new' : ''}">${item.state === 'new' ? 'Nuevo de fábrica' : 'Segunda mano'}</span></div><div class="tp-seller"><div class="tp-seller-mark">${brandLogo(item.maker)}</div><div><strong>${esc(item.seller)}</strong><span>Vendedor verificado · ${esc(item.place)}</span></div><button class="tp-heart${favoriteSelected ? ' liked' : ''}" data-action="market-favorite" data-id="${item.id}" aria-label="Guardar anuncio" aria-pressed="${!!favoriteSelected}">${heart}</button></div><h1>${esc(item.title)}</h1><p class="tp-description">${item.equivalent ? `Configuración equivalente al ${esc(m.name)}: conserva su ancho, plazas, tracción y velocidad. ` : ''}${esc(m.desc)}</p><div class="tp-detail-tags"><span>${m.speed} km/h</span><span>${m.seats} plazas</span><span>${esc(GAUGES[m.gauge])}</span><span>${esc(POWERS[m.power])}</span><span>${esc(VOLTAGE_TEXT(m.voltages || ['3kv', '25kv']))}</span>${m.dieselSpeed ? `<span>Gasóleo · ${m.dieselSpeed} km/h</span>` : ''}<span id="marketReach">Circula en ${reach.ok} de ${reach.total} relaciones</span><span>${item.condition} % de estado</span>${item.state === 'used' ? `<span>${item.age} años · ${item.stock} disponibles</span>` : ''}</div>${fitLine}<label for="buyQty">Unidades${item.state === 'used' ? ' del lote' : ' a encargar'}</label><input id="buyQty" type="number" min="1" max="${item.stock}" value="${quantity}" data-model="${item.model}" data-listing="${item.id}"><div id="purchaseQuote"></div><div class="actions"><button class="tp-primary" data-action="confirm-buy" data-id="${item.model}" data-listing="${item.id}" data-immediate="${item.lead === 0}"${s.ended ? ' disabled' : ''}>${item.lead === 0 ? 'Comprar y recibir' : 'Comprar con envío'}</button><button class="tp-secondary" data-action="close-modal">Seguir mirando</button></div><p class="tp-detail-note">${item.state === 'used' ? 'Lote de ocasión revisado. Recibes su estado real; una reforma cuesta dinero y tarda cinco meses.' : 'Se fabrican bajo pedido. Pueden retrasarse de dos a seis meses.'} ${item.lead === 0 ? 'Todas las unidades entran en tu parque al pagar.' : 'Se entregan hasta dos unidades al mes. El 70 % pendiente se paga con cada lote.'}</p></div>`;
}
