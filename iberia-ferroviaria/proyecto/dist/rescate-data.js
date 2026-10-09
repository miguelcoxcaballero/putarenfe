// Rescate de Tenfe: datos de la campaña de ocho años (2027–2034).
// Todo lo que el motor (rescate.js) necesita para simular y lo que la interfaz (rescate-ui.js) enseña.
// Unidades: dinero en millones de euros (M€), viajeros en miles por semana, puntualidad y estado en %.

export const RESCUE_VERSION = 1;
export const START_YEAR = 2027;
export const WEEKS = 416;
export const ELECTIONS = [208, 416];
export const ORDERS_PER_WEEK = 3;
export const MAX_PACTS = 2;

/** Cuatro intereses que votan. El peso es su parte del electorado. */
export const GROUPS = {
  viajeros: {name: 'Viajeros habituales', short: 'Viajeros', weight: .34, icon: 'ticket', drivers: 'puntualidad, precio y trenes llenos'},
  territorios: {name: 'Territorios desatendidos', short: 'Territorios', weight: .2, icon: 'map', drivers: 'servicio en la España vaciada y promesas a los alcaldes'},
  trabajadores: {name: 'Trabajadores', short: 'Plantilla', weight: .2, icon: 'helmet', drivers: 'empleo, carga de trabajo y convenio'},
  economia: {name: 'Actividad económica', short: 'Economía', weight: .26, icon: 'chart', drivers: 'corredores de negocio fiables, cuentas sanas y grandes obras'},
};

/**
 * Corredores. way: nodos de la red real (assets/infra.js) por los que pasa; la geometría sale de las vías.
 * pot: viajeros potenciales por semana (miles) con servicio perfecto; fare: billete medio de referencia (€).
 * track: estado de la vía al empezar; punct: puntualidad inicial; trains: trenes asignados al empezar.
 * segments: tramos reales en orden de marcha (segments.json); sustituyen a los de la red del juego en el mapa.
 */
/** Tramo real de un corredor (investigacion/modo-unico/datos/segments.json): km, ancho, tensión, velocidad y vía. Solo lo pinta el mapa. */
const seg = (from, to, km, gauge, elec, vmax, track) => ({from, to, km, gauge, elec, vmax, track});
export const CORRIDORS = [
  {id: 'norte', name: 'Corredor Norte', short: 'Norte', way: ['mad', 'avi', 'med', 'vll', 'vdb', 'pal', 'leo'], km: 345, pot: 31, fare: 17, elec: true,
    essential: true, business: false, open: true, track: 44, punct: 62, trains: 2,
    blurb: 'Madrid, Ávila, Valladolid, Palencia y León. Tiene viajeros de sobra; lo que no tiene es una vía decente.',
    segments: [seg('mad', 'avi', 121, 'ib', '3kv', 110, 'doble'), seg('avi', 'med', 86, 'ib', '3kv', 150, 'doble'), seg('med', 'vll', 42, 'ib', '3kv', 150, 'doble'), seg('vll', 'vdb', 37, 'ib', '3kv', 135, 'mixta'), seg('vdb', 'pal', 12, 'ib', '3kv', 130, 'doble'), seg('pal', 'leo', 123, 'ib', '3kv', 155, 'doble')]},
  {id: 'levante', name: 'Corredor de Levante', short: 'Levante', way: ['mad', 'alc', 'alb', 'enc', 'xat', 'vlc'], km: 390, pot: 32, fare: 19, elec: true,
    essential: true, business: true, open: true, track: 66, punct: 71, trains: 1,
    blurb: 'Madrid, Alcázar, Albacete, Xàtiva y València. Rentable si llega a su hora; los autocares lo saben.',
    segments: [seg('mad', 'alc', 148, 'ib', '3kv', 145, 'doble'), seg('alc', 'alb', 131, 'ib', '3kv', 170, 'doble'), seg('alb', 'enc', 98, 'ib', '3kv', 160, 'doble'), seg('enc', 'xat', 53, 'ib', '3kv', 135, 'unica'), seg('xat', 'vlc', 57, 'ib', '3kv', 140, 'doble')]},
  {id: 'sur', name: 'Corredor Sur', short: 'Sur', way: ['mad', 'alc', 'lin', 'cor', 'sev'], km: 470, pot: 29, fare: 21, elec: true,
    essential: true, business: true, open: true, track: 64, punct: 68, trains: 1,
    blurb: 'Madrid, Linares, Córdoba y Sevilla por la vía convencional. Mucho calor, mucha catenaria vieja.',
    segments: [seg('mad', 'alc', 148, 'ib', '3kv', 145, 'doble'), seg('alc', 'lin', 167, 'ib', '3kv', 130, 'mixta'), seg('lin', 'cor', 127, 'ib', '3kv', 150, 'unica'), seg('cor', 'sev', 129, 'ib', '3kv', 155, 'mixta')]},
  {id: 'mediterraneo', name: 'Corredor Mediterráneo', short: 'Mediterráneo', way: ['vlc', 'sag', 'cas', 'tar', 'bcn'], km: 350, pot: 36, fare: 20, elec: true,
    essential: false, business: true, open: false, track: 74, punct: 86, trains: 0, openCost: .6,
    blurb: 'València, Castelló, Tarragona y Barcelona. El tramo más rentable de España y todavía no es tuyo.',
    segments: [seg('vlc', 'sag', 33, 'mixto', '3kv', 160, 'doble'), seg('sag', 'cas', 40, 'mixto', '3kv', 200, 'doble'), seg('cas', 'tar', 190, 'ib', '3kv', 195, 'doble'), seg('tar', 'bcn', 84, 'ib', '3kv', 140, 'doble')]},
  {id: 'ebro', name: 'Corredor del Ebro', short: 'Ebro', way: ['bil', 'mir', 'log', 'cst', 'zar'], km: 300, pot: 19, fare: 16, elec: true,
    essential: false, business: true, open: false, track: 58, punct: 80, trains: 0, openCost: .4,
    blurb: 'Bilbao, Miranda, Logroño y Zaragoza. Industria, vino y mercancías que también quieren su surco.',
    segments: [seg('bil', 'mir', 104, 'ib', '3kv', 92, 'mixta'), seg('mir', 'log', 70.6, 'ib', '3kv', 100, 'unica'), seg('log', 'cst', 76, 'ib', '3kv', 125, 'unica'), seg('cst', 'zar', 90, 'ib', '3kv', 160, 'doble')]},
  {id: 'galicia', name: 'Eje Atlántico', short: 'Atlántico', way: ['aco', 'scq', 'pon', 'vig'], km: 160, pot: 17, fare: 9, elec: true,
    essential: false, business: false, open: false, track: 70, punct: 84, trains: 0, openCost: .3,
    blurb: 'A Coruña, Santiago, Pontevedra y Vigo. Corto, lleno y lluvioso.',
    segments: [seg('aco', 'scq', 61, 'ib', '25kv', 185, 'doble'), seg('scq', 'pon', 66, 'ib', '25kv', 170, 'doble'), seg('pon', 'vig', 28, 'ib', '25kv', 185, 'doble')]},
  {id: 'asturias', name: 'Rampa de Pajares', short: 'Asturias', way: ['leo', 'pol', 'ovi', 'gij'], km: 170, pot: 13, fare: 10, elec: true, feeds: 'norte',
    essential: false, business: false, open: false, track: 50, punct: 76, trains: 0, openCost: .3,
    blurb: 'León, Pola de Lena, Oviedo y Gijón. Si funciona, alimenta al Norte.',
    segments: [seg('leo', 'pol', 108, 'ib', '3kv', 115, 'mixta'), seg('pol', 'ovi', 31, 'ib', '3kv', 100, 'doble'), seg('ovi', 'gij', 31.6, 'ib', '3kv', 110, 'doble')]},
  {id: 'extremadura', name: 'Tren de Extremadura', short: 'Extremadura', way: ['mad', 'tal', 'pla', 'cac', 'mer', 'bad'], km: 440, pot: 12, fare: 15, elec: false,
    essential: false, business: false, open: false, track: 30, punct: 55, trains: 0, territory: 'extremadura', openCost: .2,
    blurb: 'Madrid, Talavera, Plasencia, Cáceres, Mérida y Badajoz. Famoso por pararse en mitad del campo.',
    segments: [seg('mad', 'tal', 134, 'ib', 'no', 155, 'mixta'), seg('tal', 'pla', 134, 'ib', 'no', 155, 'unica'), seg('pla', 'cac', 79, 'ib', '25kv', 200, 'mixta'), seg('cac', 'mer', 71, 'ib', '25kv', 200, 'mixta'), seg('mer', 'bad', 59, 'ib', '25kv', 200, 'mixta')]},
  {id: 'teruel', name: 'Teruel existe', short: 'Teruel', way: ['zar', 'ter', 'sag', 'vlc'], km: 330, pot: 8, fare: 12, elec: false,
    essential: false, business: false, open: false, track: 32, punct: 58, trains: 0, territory: 'teruel', openCost: .2,
    blurb: 'Zaragoza, Teruel, Sagunto y València. Una vía única, un tren al día y mucha paciencia.',
    segments: [seg('zar', 'ter', 182, 'ib', 'no', 160, 'unica'), seg('ter', 'sag', 138, 'ib', 'no', 90, 'unica'), seg('sag', 'vlc', 29, 'mixto', '3kv', 160, 'doble')]},
  {id: 'soria', name: 'Línea de Soria', short: 'Soria', way: ['mad', 'gua', 'trb', 'sor'], km: 250, pot: 7, fare: 11, elec: false,
    essential: false, business: false, open: false, track: 28, punct: 57, trains: 0, territory: 'soria', openCost: .2,
    blurb: 'Madrid, Guadalajara, Torralba y Soria. La capital de provincia con peor tren de España.',
    segments: [seg('mad', 'gua', 57, 'ib', '3kv', 160, 'doble'), seg('gua', 'trb', 99, 'ib', '3kv', 150, 'doble'), seg('trb', 'sor', 93, 'ib', 'no', 100, 'unica')]},
  {id: 'cantabria', name: 'Meseta — Cantabria', short: 'Cantabria', way: ['pal', 'san'], km: 200, pot: 10, fare: 13, elec: true,
    essential: false, business: false, open: false, track: 40, punct: 70, trains: 0, territory: 'cantabria', openCost: .2,
    blurb: 'Palencia, Reinosa y Santander. Túneles del siglo XIX y trenes del XXI que no siempre caben.',
    segments: [seg('pal', 'san', 217, 'ib', '3kv', 120, 'unica')]},
];
export const CORRIDOR = Object.fromEntries(CORRIDORS.map(c => [c.id, c]));

/** Territorios desatendidos: se «compran» como las parcelas de Cities: Skylines (licencia de servicio público). */
export const TERRITORIES = {
  extremadura: {name: 'Extremadura', corridor: 'extremadura', lon: -6.2, lat: 39.2, license: .5, people: '1,05 millones de habitantes',
    pitch: 'Si el tren llega a Badajoz sin pararse en un encinar, Extremadura te vota en bloque.'},
  teruel: {name: 'Teruel', corridor: 'teruel', lon: -1.1, lat: 40.5, license: .4, people: '134.000 habitantes',
    pitch: 'Teruel existe. Y tiene plataforma ciudadana, diputado propio y buena memoria.'},
  soria: {name: 'Soria', corridor: 'soria', lon: -2.47, lat: 41.6, license: .4, people: '89.000 habitantes',
    pitch: 'La provincia menos poblada de la península: cada viajero cuenta como tres en el telediario.'},
  cantabria: {name: 'Cantabria interior', corridor: 'cantabria', lon: -4.1, lat: 42.95, license: .4, people: '585.000 habitantes',
    pitch: 'Reinosa, Aguilar y los valles: llevan años esperando trenes que quepan en sus túneles.'},
};

/** Material que se puede comprar o alquilar. photo: clave de TRAIN_PHOTOS. */
export const TRAIN_OFFERS = [
  {id: 'kafka', maker: 'KAFKA', model: 'Civia Regional 463', price: 3.0, weeks: 4, seats: 290, reliability: .9, photo: '465',
    note: 'El tren regional de toda la vida: fiable, sin sorpresas, con baños que funcionan la mayoría de los días.'},
  {id: 'dorfler', maker: 'Dörfler', model: 'Dörfler LIRIO 4', price: 3.5, weeks: 6, seats: 310, reliability: .97, photo: 'dorfler',
    note: 'Suizo, puntual e insoportablemente bien acabado. Tarda más en llegar porque lo pulen a mano.'},
  {id: 'bcbb', maker: 'BCBB', model: 'BCBB Fuxing Regional', price: 2.1, weeks: 3, seats: 330, reliability: .78, photo: 'bcbb',
    note: 'Barato y rápido de entregar. El manual viene en mandarín y los repuestos, en barco.'},
  {id: 'used', maker: 'Trenespop', model: 'Serie 592 de segunda mano', price: 1.1, weeks: 1, seats: 220, reliability: .7, photo: '592', used: true,
    note: 'Treinta años, un dueño, siempre en garaje. Huele a gasóleo y a nostalgia.'},
];
export const OFFER = Object.fromEntries(TRAIN_OFFERS.map(o => [o.id, o]));
export const RENT = {weekly: .085, weeks: 12, label: 'Alquiler de un tren a otra operadora (12 semanas)'};
export const CREW = {hire: .12, weekly: .045, weeks: 2, sub: .09, subWeeks: 12};

/**
 * Obras de corredor. Tres fases: preparación y permisos, construcción y pruebas.
 * Cada fase pide sus requisitos (logros) además de dinero y cuadrillas, como los megaproyectos.
 * cost: M€ por km de corredor (con mínimo); weeks: duración base de cada fase.
 */
export const WORKS = {
  renovar: {name: 'Renovación de vía', verb: 'Renovar la vía', icon: 'rail', perKm: .0068, min: .9, crews: 1, phases: [1, 5, 1],
    effect: {track: 46}, text: 'Traviesas, carril y balasto nuevos. Sube el estado de la vía y con él la puntualidad.'},
  senalizacion: {name: 'Señalización y bloqueo automático', verb: 'Modernizar la señalización', icon: 'signal', perKm: .0085, min: 1.6, crews: 1, phases: [2, 6, 2],
    effect: {signal: 8}, text: 'Bloqueo automático y ASFA digital: menos esperas en los cruces y ocho puntos más de puntualidad máxima.'},
  apartaderos: {name: 'Vías de apartado y cruce', verb: 'Construir apartaderos', icon: 'siding', perKm: .004, min: .7, crews: 1, phases: [1, 4, 1],
    effect: {capacity: 3}, text: 'Más sitios donde cruzarse: caben tres trenes más sin atascos.'},
  electrificar: {name: 'Electrificación', verb: 'Electrificar', icon: 'bolt', perKm: .0105, min: 2.2, crews: 2, phases: [3, 9, 2],
    effect: {elec: true}, text: 'Catenaria nueva: energía más barata, trenes más fiables y adiós al gasóleo.'},
  apeadero: {name: 'Apeadero de Villanueva del Andén', verb: 'Construir el apeadero', icon: 'station', perKm: 0, min: 1.4, crews: 1, phases: [1, 3, 1], hidden: true,
    effect: {station: true}, text: 'Un andén, una marquesina y un alcalde feliz. Suma algo de demanda al Norte y resta un minuto a cada tren.'},
};
/** Formas de mantener el servicio durante la construcción. */
export const SERVICE_MODES = {
  fases: {name: 'Obra por fases', text: 'Se trabaja de noche y por tramos: el servicio sigue, más lento.', duration: 1.5, extra: 0, demand: .78, punct: -9},
  alternativa: {name: 'Autobuses alternativos', text: 'Se corta la vía y un autobús lleva a los viajeros. Rápido pero caro.', duration: 1, extra: .03, demand: .55, punct: 0, bus: true},
  cerrar: {name: 'Cerrar el tramo', text: 'Se corta la vía sin alternativa. Lo más rápido y barato; los viajeros se van.', duration: .85, extra: 0, demand: 0, punct: 0},
};
export const PHASES = [
  {id: 'prep', name: 'Preparación y permisos', crews: 0, share: .1},
  {id: 'build', name: 'Construcción', crews: 1, share: .8},
  {id: 'test', name: 'Pruebas y certificación', crews: 1, share: .1},
];

/** Ayudas ligadas a una obra concreta: «financiación prevista» hasta cumplir la condición. */
export const AIDS = [
  {id: 'feder-norte', corridor: 'norte', work: 'renovar', amount: 1.2, name: 'Fondos europeos de cohesión', condition: 'se cobran al certificar la renovación de vía del Norte'},
  {id: 'mitma-señal', corridor: 'levante', work: 'senalizacion', amount: 1.0, name: 'Plan de cercanías y regionales del Ministerio', condition: 'se cobran al certificar la señalización de Levante'},
  {id: 'ue-elec', corridor: 'extremadura', work: 'electrificar', amount: 2.5, name: 'Mecanismo «Conectar Europa»', condition: 'se cobran al electrificar Extremadura'},
  {id: 'teruel-fite', corridor: 'teruel', work: 'renovar', amount: 1.1, name: 'Fondo de Inversiones de Teruel', condition: 'se cobran al renovar la vía de Teruel'},
];

/** Hitos de viajeros semanales (como los de Cities: Skylines): cada uno desbloquea cosas. */
export const MILESTONES = [
  {id: 'm0', pax: 0, name: 'Compañía en apuros', unlocks: []},
  {id: 'm1', pax: 30, name: 'Andenes con gente', stars: 6, unlocks: ['Nivel 2 del árbol tecnológico', 'Licencias de territorios desatendidos', 'Cuadrillas subcontratadas', 'Préstamo de 8 M€']},
  {id: 'm2', pax: 44, name: 'Red regional', stars: 8, unlocks: ['Megaproyectos', 'Servicio Exprés']},
  {id: 'm3', pax: 62, name: 'Operador serio', stars: 10, unlocks: ['Nivel 3 del árbol tecnológico', 'Préstamo de 12 M€', 'Megaproyectos grandes']},
  {id: 'm4', pax: 80, name: 'Columna vertebral', stars: 12, unlocks: ['Nivel 4 del árbol tecnológico', 'Estación Central']},
  {id: 'm5', pax: 100, name: 'Orgullo ferroviario', stars: 16, unlocks: ['Placa conmemorativa en Atocha']},
];

/** Árbol tecnológico: se paga con puntos de popularidad (★) y dinero. Cada nodo tiene su foto IA. */
export const TECH_BRANCHES = {
  mantenimiento: 'Mantenimiento', operacion: 'Operación', material: 'Material', comercial: 'Comercial', comunicacion: 'Comunicación', fontaneria: 'Fontanería',
};
export const TECHS = [
  {id: 'ultrasonidos', branch: 'mantenimiento', tier: 1, stars: 8, cost: .4, name: 'Auscultación por ultrasonidos', effect: 'La vía se degrada un 30 % más despacio.', mods: {trackDecay: -.3}},
  {id: 'predictivo', branch: 'mantenimiento', tier: 2, stars: 14, cost: 1.0, needs: ['ultrasonidos'], name: 'Mantenimiento predictivo', effect: 'Un 40 % menos de averías de trenes.', mods: {breakdown: -.4}},
  {id: 'bateadora', branch: 'mantenimiento', tier: 3, stars: 22, cost: 1.8, needs: ['predictivo'], name: 'Bateadora automática', effect: 'La construcción de las obras dura un 20 % menos.', mods: {buildSpeed: .2}},
  {id: 'cadenciados', branch: 'operacion', tier: 1, stars: 8, cost: .3, name: 'Horarios cadenciados', effect: 'Salidas a la misma hora todos los días: +6 % de demanda.', mods: {demand: .06}},
  {id: 'regulacion', branch: 'operacion', tier: 2, stars: 15, cost: 1.2, needs: ['cadenciados'], name: 'Puesto de regulación único', effect: '+3 puntos de puntualidad en toda la red.', mods: {punct: 3}},
  {id: 'ertms', branch: 'operacion', tier: 3, stars: 26, cost: 2.6, needs: ['regulacion'], name: 'ERTMS nivel 2', effect: '+4 puntos de puntualidad y un tren más por corredor sin atascos.', mods: {punct: 4, capacity: 1}},
  {id: 'contrato', branch: 'material', tier: 1, stars: 7, cost: .5, name: 'Contrato de mantenimiento con fabricante', effect: 'Revisiones un 25 % más baratas y de una semana.', mods: {revisionCost: -.25, revisionWeeks: 1}},
  {id: 'segunda', branch: 'material', tier: 2, stars: 12, cost: .6, needs: ['contrato'], name: 'Mercado de segunda mano', effect: 'Trenes usados un 25 % más baratos y en mejor estado.', mods: {usedDiscount: .25}},
  {id: 'bimodo', branch: 'material', tier: 3, stars: 20, cost: 1.6, needs: ['segunda'], name: 'Trenes bimodo', effect: 'Las líneas sin catenaria gastan un 30 % menos de energía y fallan menos.', mods: {dieselEnergy: -.3}},
  {id: 'abono', branch: 'comercial', tier: 1, stars: 8, cost: .3, name: 'Abono único regional', effect: '+8 de apoyo de los viajeros habituales y +4 % de demanda.', mods: {demand: .04, groups: {viajeros: 8}}},
  {id: 'dinamico', branch: 'comercial', tier: 2, stars: 14, cost: .8, needs: ['abono'], name: 'Precio dinámico', effect: 'Los billetes rinden un 8 % más sin espantar a nadie.', mods: {yield: .08}},
  {id: 'app', branch: 'comercial', tier: 3, stars: 20, cost: 1.2, needs: ['dinamico'], name: 'App que funciona', effect: 'Venta online: -15 % de costes comerciales y +5 % de demanda.', mods: {demand: .05, staff: -.15}},
  {id: 'prensa', branch: 'comunicacion', tier: 1, stars: 6, cost: .2, name: 'Gabinete de prensa', effect: 'Los escándalos y las averías restan un 30 % menos de apoyo.', mods: {scandal: -.3}},
  {id: 'inauguraciones', branch: 'comunicacion', tier: 2, stars: 10, cost: .4, needs: ['prensa'], name: 'Inauguraciones con banda de música', effect: 'Cada obra terminada da 3 ★ y apoyo del territorio.', mods: {ribbon: 3}},
  {id: 'influencers', branch: 'comunicacion', tier: 3, stars: 18, cost: .9, needs: ['inauguraciones'], name: 'Influencers ferroviarios', effect: '+1 ★ cada semana que la red supera el 80 % de puntualidad.', mods: {starsOnTime: 1}},
  {id: 'contabilidad', branch: 'fontaneria', tier: 1, stars: 5, cost: .2, name: 'Contabilidad creativa', effect: 'Las comisiones dejan un 50 % más en la caja B.', mods: {kickback: .5}},
  {id: 'abogados', branch: 'fontaneria', tier: 2, stars: 10, cost: .6, needs: ['contabilidad'], name: 'Abogados del Estado amigos', effect: 'Los juzgados avanzan la mitad de rápido contra ti.', mods: {judicial: -.5}},
  {id: 'destructora', branch: 'fontaneria', tier: 3, stars: 16, cost: .5, needs: ['abogados'], name: 'Destructora industrial', effect: 'Las pruebas en tu contra desaparecen tres veces más rápido.', mods: {evidenceDecay: 2}},
];
export const TECH = Object.fromEntries(TECHS.map(t => [t.id, t]));
/** Hito necesario para cada nivel del árbol. */
export const TIER_MILESTONE = {1: 'm0', 2: 'm1', 3: 'm3', 4: 'm4'};

/**
 * Logros: condiciones comprobables que abren fases de megaproyectos y avisan de progreso.
 * kind/arg los interpreta rescate.js (achievement()).
 */
export const ACHIEVEMENTS = {
  norte80: {label: 'Corredor Norte por encima del 80 % de puntualidad', kind: 'punct', corridor: 'norte', value: 80},
  fiables3: {label: 'Tres corredores fiables (80 % o más)', kind: 'reliable', count: 3, value: 80},
  fiables5: {label: 'Cinco corredores fiables (85 % o más)', kind: 'reliable', count: 5, value: 85},
  flota6: {label: 'Seis trenes en la flota', kind: 'fleet', value: 6},
  flota9: {label: 'Nueve trenes en la flota', kind: 'fleet', value: 9},
  caja5: {label: 'Caja de 5 M€ o más al cerrar la semana', kind: 'cash', value: 5},
  pax48: {label: 'Hito «Red regional» (44.000 viajeros por semana)', kind: 'milestone', id: 'm2'},
  pax66: {label: 'Hito «Operador serio» (62.000 viajeros por semana)', kind: 'milestone', id: 'm3'},
  pax86: {label: 'Hito «Columna vertebral» (80.000 viajeros por semana)', kind: 'milestone', id: 'm4'},
  trab55: {label: 'Apoyo de los trabajadores del 55 % o más', kind: 'group', group: 'trabajadores', value: 55},
  eco55: {label: 'Apoyo de la actividad económica del 55 % o más', kind: 'group', group: 'economia', value: 55},
  terr50: {label: 'Apoyo de los territorios del 50 % o más', kind: 'group', group: 'territorios', value: 50},
  viaj60: {label: 'Apoyo de los viajeros del 60 % o más', kind: 'group', group: 'viajeros', value: 60},
  tech_predictivo: {label: 'Tecnología «Mantenimiento predictivo»', kind: 'tech', id: 'predictivo'},
  tech_regulacion: {label: 'Tecnología «Puesto de regulación único»', kind: 'tech', id: 'regulacion'},
  tech_ertms: {label: 'Tecnología «ERTMS nivel 2»', kind: 'tech', id: 'ertms'},
  med_open: {label: 'Corredor Mediterráneo en servicio', kind: 'open', corridor: 'mediterraneo'},
  med85: {label: 'Mediterráneo por encima del 85 % durante 8 semanas', kind: 'streak', corridor: 'mediterraneo', value: 85, weeks: 8},
  teruel_open: {label: 'Teruel con servicio diario', kind: 'open', corridor: 'teruel'},
  sinIncidencias: {label: 'Doce semanas seguidas sin incidencia grave', kind: 'calm', weeks: 12},
  resultado: {label: 'Resultado ordinario positivo las últimas 8 semanas', kind: 'ordinary', weeks: 8},
  pacto_ministra: {label: 'Pacto cumplido con la ministra', kind: 'pactDone', person: 'minister'},
  pacto_cualquiera: {label: 'Un pacto cumplido con quien sea', kind: 'pactDone'},
  limpio: {label: 'Sin diligencias judiciales abiertas', kind: 'clean'},
};

/**
 * Megaproyectos a lo SimCity 5: cuatro etapas, cada una abierta por logros y pagada con dinero y cuadrillas.
 * Cada etapa terminada ya da su parte del beneficio.
 */
export const MEGAPROJECTS = [
  {id: 'taller', name: 'Gran Taller de Valladolid', tier: 'm2', image: 'mega-taller', person: 'workshop',
    pitch: 'Un taller de verdad, con foso, torno de ruedas y café que no sepa a aceite.',
    stages: [
      {name: 'Proyecto y terrenos', needs: ['norte80'], cost: .8, weeks: 4, crews: 0, bonus: 'Las revisiones cuestan un 10 % menos.', mods: {revisionCost: -.1}},
      {name: 'Naves y foso', needs: ['flota6'], cost: 3.2, weeks: 9, crews: 1, bonus: 'Los trenes se desgastan un 20 % más despacio.', mods: {wear: -.2}},
      {name: 'Torno de ruedas y bancos de prueba', needs: ['tech_predictivo', 'trab55'], cost: 2.4, weeks: 7, crews: 1, bonus: 'Un 25 % menos de averías.', mods: {breakdown: -.25}},
      {name: 'Inauguración', needs: ['sinIncidencias'], cost: .5, weeks: 2, crews: 0, bonus: '+12 ★ y +8 de apoyo de la plantilla.', reward: {stars: 12, groups: {trabajadores: 8}}},
    ]},
  {id: 'ctc', name: 'Centro de Control de Atocha', tier: 'm2', image: 'mega-ctc', person: 'adif',
    pitch: 'Una sala con pantallas gigantes desde la que se ve llegar el retraso antes de que llegue.',
    stages: [
      {name: 'Proyecto', needs: ['fiables3'], cost: .6, weeks: 3, crews: 0, bonus: '+1 punto de puntualidad en toda la red.', mods: {punct: 1}},
      {name: 'Sala y servidores', needs: ['tech_regulacion'], cost: 2.8, weeks: 8, crews: 1, bonus: '+2 puntos más de puntualidad.', mods: {punct: 2}},
      {name: 'Integración de corredores', needs: ['caja5', 'resultado'], cost: 2.2, weeks: 8, crews: 2, bonus: 'Las incidencias se resuelven antes: -30 % de su efecto.', mods: {incident: -.3}},
      {name: 'Puesta en marcha', needs: ['sinIncidencias'], cost: .6, weeks: 2, crews: 1, bonus: '+2 puntos de puntualidad y +10 ★.', mods: {punct: 2}, reward: {stars: 10}},
    ]},
  {id: 'mediterraneo', name: 'Corredor Mediterráneo', tier: 'm3', image: 'mega-mediterraneo', person: 'successor',
    pitch: 'De Barcelona a València sin cruces, sin vía única y sin excusas. Lleva treinta años en los programas electorales.',
    stages: [
      {name: 'Estudio informativo', needs: ['med_open'], cost: .9, weeks: 4, crews: 0, bonus: '+4 de apoyo de la actividad económica.', reward: {groups: {economia: 4}}},
      {name: 'Variantes y doble vía', needs: ['eco55'], cost: 5.5, weeks: 14, crews: 2, bonus: 'El Mediterráneo admite cuatro trenes más.', corridorMods: {mediterraneo: {capacity: 4}}},
      {name: 'Tercer carril y velocidad', needs: ['med85', 'pacto_cualquiera'], cost: 4.5, weeks: 12, crews: 2, bonus: 'Demanda del Mediterráneo +35 %.', corridorMods: {mediterraneo: {pot: .35}}},
      {name: 'Inauguración con el ministro', needs: ['pax66'], cost: .7, weeks: 2, crews: 0, bonus: '+15 ★ y +8 de apoyo de la economía.', reward: {stars: 15, groups: {economia: 8}}},
    ]},
  {id: 'teruel', name: 'Teruel existe: vía nueva', tier: 'm2', image: 'mega-teruel', person: 'mayor',
    pitch: 'Doble vía y electrificación entre Sagunto, Teruel y Zaragoza. Las plataformas ciudadanas ya tienen la pancarta hecha.',
    stages: [
      {name: 'Declaración de impacto', needs: ['teruel_open'], cost: .5, weeks: 5, crews: 0, bonus: '+6 de apoyo de los territorios.', reward: {groups: {territorios: 6}}},
      {name: 'Plataforma y túneles', needs: ['terr50'], cost: 4.0, weeks: 12, crews: 2, bonus: 'La vía de Teruel sube al 90 %.', corridorMods: {teruel: {track: 90}}},
      {name: 'Electrificación', needs: ['resultado'], cost: 3.0, weeks: 9, crews: 2, bonus: 'Teruel pasa a ser una línea eléctrica.', corridorMods: {teruel: {elec: true}}},
      {name: 'Primer tren directo', needs: ['pacto_cualquiera'], cost: .4, weeks: 1, crews: 0, bonus: '+12 ★ y +10 de apoyo de los territorios.', reward: {stars: 12, groups: {territorios: 10}}},
    ]},
  {id: 'estacion', name: 'Estación Central de Madrid', tier: 'm4', image: 'mega-estacion', person: 'president',
    pitch: 'Una estación pasante bajo la Castellana: todos los corredores se cruzan sin cambiar de andén.',
    stages: [
      {name: 'Concurso de arquitectura', needs: ['pax86'], cost: 1.0, weeks: 4, crews: 0, bonus: '+6 ★.', reward: {stars: 6}},
      {name: 'Excavación del túnel', needs: ['flota9', 'tech_ertms'], cost: 7.0, weeks: 16, crews: 2, bonus: 'Los corredores de Madrid ganan un 8 % de demanda.', mods: {madrid: .08}},
      {name: 'Andenes pasantes', needs: ['fiables5'], cost: 5.0, weeks: 12, crews: 2, bonus: 'Otro 8 % para los corredores de Madrid.', mods: {madrid: .08}},
      {name: 'Inauguración', needs: ['viaj60'], cost: .8, weeks: 2, crews: 0, bonus: '+20 ★ y +6 de apoyo de todos.', reward: {stars: 20, groups: {viajeros: 6, territorios: 6, trabajadores: 6, economia: 6}}},
    ]},
  {id: 'monumento', name: 'Monumento al Ministro', tier: 'm1', image: 'mega-monumento', person: 'minister', vanity: true,
    pitch: 'Una rotonda en Villanueva del Andén con una locomotora de bronce y la cara de la ministra. No transporta a nadie. Da muchísimas fotos.',
    stages: [
      {name: 'Maqueta y primera piedra', needs: [], cost: .4, weeks: 2, crews: 0, bonus: '+5 ★.', reward: {stars: 5}},
      {name: 'Rotonda y pedestal', needs: ['pacto_cualquiera'], cost: 1.2, weeks: 5, crews: 1, bonus: '+6 ★ y +4 de los territorios.', reward: {stars: 6, groups: {territorios: 4}}},
      {name: 'Locomotora de bronce', needs: ['caja5'], cost: 1.5, weeks: 4, crews: 0, bonus: '+8 ★. La prensa empieza a preguntar cuánto ha costado.', reward: {stars: 8}, suspicion: 6},
      {name: 'Inauguración con banda y alcalde', needs: ['pacto_ministra'], cost: .6, weeks: 1, crews: 0, bonus: '+15 ★, +6 de los territorios y una ministra feliz.', reward: {stars: 15, groups: {territorios: 6}}},
    ]},
];
export const MEGA = Object.fromEntries(MEGAPROJECTS.map(m => [m.id, m]));

/** Etapas de la campaña: un objetivo principal con plazo, obstáculos y un dilema. */
export const STAGES = [
  {id: 's1', from: 1, to: 13, name: 'Primer trimestre', speaker: 'minister', mood: 'determined',
    goal: 'Tienes trece semanas para recuperar el corredor Norte y elevar su puntualidad del 62 % al 80 %, sin dejar de pagar ninguna obligación.',
    dilemma: '¿Reparar la vía o comprar trenes? Un tren nuevo tarda cuatro semanas y apenas sirve mientras la vía siga rota.',
    obstacles: ['Falta de mantenimiento en el Norte', 'Tramo deteriorado entre Ávila y Medina', 'Material insuficiente: cuatro trenes para tres corredores', 'Pagos a proveedores y un plazo de deuda este trimestre']},
  {id: 's2', from: 14, to: 52, name: 'Resto del primer año', speaker: 'treasury', mood: 'worried',
    goal: 'Antes de que acabe el año, deja fiables los tres corredores esenciales (Norte, Levante y Sur, al 80 %) y conserva una reserva de caja de 3 M€.',
    dilemma: '¿Concentrar las cuadrillas en un corredor o repartirlas entre los tres?',
    obstacles: ['Dos cuadrillas para tres corredores', 'Levante y Sur con catenaria y vía cansadas', 'Hacienda vigila tu reserva']},
  {id: 's3', from: 53, to: 208, name: 'Años 2 a 4', speaker: 'president', mood: 'proud',
    goal: 'Estabiliza las cuentas (resultado ordinario positivo), cumple el programa ferroviario y gana las elecciones de diciembre de 2030.',
    dilemma: '¿Financiar conexiones poco rentables que dan votos o sanear las que dan dinero?',
    obstacles: ['Corredores que pierden dinero', 'Territorios que exigen tren', 'Elecciones al final del cuarto año']},
  {id: 's4', from: 209, to: 312, name: 'Años 5 y 6', speaker: 'successor', mood: 'determined',
    goal: 'Lleva el tren a dos territorios desatendidos y mantén al menos el 60 % de los viajeros donde compite Lowgo.',
    dilemma: '¿Cobertura para quien no tiene tren o servicios rentables para quien ya lo tiene?',
    obstacles: ['Lowgo entra en tus corredores rentables', 'Territorios sin vía en condiciones', 'Cuadrillas limitadas']},
  {id: 's5', from: 313, to: 416, name: 'Años 7 y 8', speaker: 'president', mood: 'determined',
    goal: 'Consolida cinco corredores fiables (85 %) sin rescates extraordinarios y gana las elecciones de diciembre de 2034.',
    dilemma: '¿Terminar obras nuevas o conservar lo que ya funciona?',
    obstacles: ['La red envejece', 'Las obras a medias pesan', 'Nada de rescates de Hacienda']},
];

/** Programa ferroviario: lo que prometiste. Hay que cumplirlo entero para ganar. */
export const PROGRAM = [
  {id: 'p-norte', label: 'Recuperar el corredor Norte (80 %)', stage: 's1'},
  {id: 'p-esenciales', label: 'Tres corredores esenciales fiables', stage: 's2'},
  {id: 'p-cuentas', label: 'Cuentas saneadas: resultado ordinario positivo medio de 26 semanas', stage: 's3'},
  {id: 'p-territorios', label: 'Tren en dos territorios desatendidos', stage: 's4'},
  {id: 'p-cinco', label: 'Cinco corredores fiables (85 %)', stage: 's5'},
  {id: 'p-mega', label: 'Terminar un megaproyecto (que no sea el monumento)', stage: null},
];

/**
 * Pactos que proponen los personajes. Como mucho dos activos. benefit/obligation/consequence se enseñan tal cual.
 * check: lo que comprueba el motor al vencer el plazo. cheaper: versión negociada.
 */
export const PACTS = [
  {id: 'estacion-paco', person: 'mayor', mood: 'happy', earliest: 3, title: 'Un apeadero para Villanueva del Andén',
    line: 'paco-estacion',
    benefit: '+10 de apoyo de los territorios y 4 ★ al firmar', obligation: 'Construir un apeadero en el Norte (1,4 M€ y una cuadrilla cinco semanas) en 16 semanas',
    consequence: 'Si no cumples: -14 de los territorios y Paco se lo cuenta a quien quiera escuchar', weeks: 16,
    gives: {groups: {territorios: 10}, stars: 4}, task: {type: 'station', cost: 1.4, crewWeeks: 5}, penalty: {groups: {territorios: -14}, grudge: 'mayor'},
    cheaper: {obligation: 'Un apeadero prefabricado (0,9 M€, cinco semanas de cuadrilla) en 16 semanas', task: {type: 'station', cost: .9, crewWeeks: 5}, gives: {groups: {territorios: 6}, stars: 2}, chance: .65}},
  {id: 'convenio', person: 'workshop', mood: 'determined', earliest: 8, title: 'Convenio de talleres',
    line: 'fermin-convenio',
    benefit: '+10 de apoyo de la plantilla y nada de huelgas mientras dure', obligation: 'Subir un 6 % la nómina y no recortar cuadrillas ni trenes en 26 semanas',
    consequence: 'Si recortas: huelga de dos semanas y -15 de la plantilla', weeks: 26,
    gives: {groups: {trabajadores: 10}, noStrike: true}, upkeep: {payroll: .06}, rule: 'noCuts', penalty: {groups: {trabajadores: -15}, strike: 2},
    cheaper: {obligation: 'Subir un 3 % la nómina y no recortar en 26 semanas', upkeep: {payroll: .03}, gives: {groups: {trabajadores: 5}, noStrike: true}, chance: .55}},
  {id: 'contrato-programa', person: 'treasury', mood: 'worried', earliest: 20, title: 'Contrato-programa con Hacienda',
    line: 'charo-contrato',
    benefit: '0,8 M€ más de subvención cada trimestre mientras se cumpla', obligation: 'Resultado ordinario positivo en 2 de los próximos 3 trimestres y ningún préstamo nuevo',
    consequence: 'Si fallas: devuelves lo cobrado de más y Hacienda te audita', weeks: 39,
    gives: {ospBonus: .8}, rule: 'noLoans', check: 'ordinaryQuarters', penalty: {repayOsp: true, audit: true, groups: {economia: -6}},
    cheaper: {benefit: '0,5 M€ más cada trimestre', gives: {ospBonus: .5}, chance: .7}},
  {id: 'cuadrilla-adif', person: 'adif', mood: 'happy', earliest: 6, title: 'Adif te presta una cuadrilla',
    line: 'benito-cuadrilla',
    benefit: 'Una cuadrilla de Adif durante 12 semanas, sin nómina', obligation: 'Pagar 0,6 M€ de «gastos de coordinación» al terminar el plazo',
    consequence: 'Si no pagas: Adif retrasa tus permisos (preparación de obras +50 %) durante un año', weeks: 12,
    gives: {loanCrew: 12}, task: {type: 'pay', cost: .6}, penalty: {slowPermits: 52},
    cheaper: {obligation: 'Pagar 0,35 M€ al terminar', task: {type: 'pay', cost: .35}, chance: .5}},
  {id: 'carta-viajeros', person: 'riders', mood: 'determined', earliest: 10, title: 'Carta de compromisos con los viajeros',
    line: 'marisa-carta',
    benefit: '+12 de apoyo de los viajeros habituales al firmar', obligation: 'Norte, Levante y Sur por encima del 85 % de puntualidad antes de 20 semanas',
    consequence: 'Si fallas: -16 de los viajeros y 0,5 M€ de indemnizaciones', weeks: 20,
    gives: {groups: {viajeros: 12}}, check: 'essentials85', penalty: {groups: {viajeros: -16}, cash: -.5},
    cheaper: {obligation: 'Norte, Levante y Sur por encima del 80 % antes de 20 semanas', check: 'essentials80', gives: {groups: {viajeros: 7}}, chance: .6}},
  {id: 'inauguracion', person: 'minister', mood: 'proud', earliest: 40, title: 'Una inauguración antes de las elecciones',
    line: 'raquel-inauguracion',
    benefit: '6 ★ ahora y la ministra de tu lado (1 M€ de presupuesto extra al cumplir)', obligation: 'Terminar cualquier obra o etapa de megaproyecto en 14 semanas',
    consequence: 'Si no hay foto: -1 M€ del próximo pago trimestral y una ministra muy enfadada', weeks: 14,
    gives: {stars: 6}, check: 'finishAny', reward: {cash: 1}, penalty: {ospCut: 1, grudge: 'minister'},
    cheaper: {benefit: '4 ★ ahora y 0,6 M€ al cumplir', gives: {stars: 4}, reward: {cash: .6}, chance: .6}},
  {id: 'cohesion', person: 'president', mood: 'proud', earliest: 160, title: 'Plan de cohesión territorial',
    line: 'pedro-cohesion',
    benefit: '3 M€ de financiación prevista y +8 de los territorios', obligation: 'Servicio diario en un territorio desatendido en 30 semanas',
    consequence: 'Si no llegas: se pierde la financiación y -10 de los territorios', weeks: 30,
    gives: {groups: {territorios: 8}}, check: 'territoryOpen', reward: {cash: 3}, penalty: {groups: {territorios: -10}},
    cheaper: {obligation: 'Servicio en un territorio en 40 semanas', weeks: 40, reward: {cash: 2.2}, chance: .55}},
  {id: 'tuits', person: 'successor', mood: 'happy', earliest: 220, title: 'Plan de comunicación del ministro',
    line: 'oscar-tuits',
    benefit: '+6 ★ al firmar y +6 de los viajeros', obligation: 'Tres obras o etapas terminadas en 26 semanas',
    consequence: 'Si no cumples: el ministro te dedica un hilo. -10 de los viajeros', weeks: 26,
    gives: {stars: 6, groups: {viajeros: 6}}, check: 'finish3', penalty: {groups: {viajeros: -10}},
    cheaper: {obligation: 'Dos obras o etapas terminadas en 26 semanas', check: 'finish2', gives: {stars: 4, groups: {viajeros: 4}}, chance: .6}},
  {id: 'no-agresion', person: 'rival', mood: 'proud', earliest: 100, title: 'Pacto de no agresión con Autocares Meseta',
    line: 'inigo-noagresion',
    benefit: 'Autocares Meseta lleva viajeros a tus estaciones: +12 % de demanda en Soria y Teruel', obligation: 'No abrir el corredor de Extremadura en 52 semanas',
    consequence: 'Si lo abres: Íñigo filtra lo que sabe de ti', weeks: 52, corrupt: true,
    gives: {feeder: .12}, rule: 'noExtremadura', penalty: {leak: true},
    cheaper: {obligation: 'No abrir Extremadura en 30 semanas', weeks: 30, chance: .5}},
];
export const PACT = Object.fromEntries(PACTS.map(p => [p.id, p]));

/** Sobornos: a quién, para qué, cuánto y cuánto huele. */
export const BRIBES = [
  {id: 'alcalde', target: 'Alcaldes de la comarca', person: 'mayor', cost: .15, suspicion: 7, evidence: 6,
    effect: 'Permisos municipales exprés: la preparación de las obras dura la mitad durante 8 semanas. +6 de los territorios.', gives: {fastPermits: 8, groups: {territorios: 6}}},
  {id: 'inspector', target: 'Inspector de Adif', person: 'adif', cost: .1, suspicion: 6, evidence: 5,
    effect: 'Firma las pruebas sin mirar: las obras en pruebas terminan esta semana. Sube el riesgo de accidente.', gives: {skipTests: true, risk: 8}},
  {id: 'periodista', target: 'Redactor de La Gaceta del Raíl', person: null, cost: .2, suspicion: 5, evidence: 4,
    effect: 'El próximo escándalo sale en la página 47, entre los crucigramas: resta la mitad.', gives: {muffle: 1}},
  {id: 'diputados', target: 'Diputados de la Comisión de Presupuestos', person: 'president', cost: .45, suspicion: 10, evidence: 8,
    effect: 'Enmienda de última hora: +0,9 M€ en el próximo pago trimestral.', gives: {ospNext: .9}},
  {id: 'sindicato', target: 'Delegado sindical', person: 'workshop', cost: .2, suspicion: 8, evidence: 6,
    effect: 'Desconvoca huelgas y calma a la plantilla: +8 de los trabajadores.', gives: {endStrike: true, groups: {trabajadores: 8}}},
  {id: 'juez', target: 'Juez instructor', person: null, cost: .6, suspicion: 14, evidence: 12, needs: 'investigation',
    effect: 'El juzgado «pierde» un tomo: la investigación retrocede una fase. Si sale mal, es el final.', gives: {judgeBack: 1}},
  {id: 'tijera', target: 'Charo Tijera (Hacienda)', person: 'treasury', cost: .3, suspicion: 20, evidence: 15,
    effect: 'Intentar que Hacienda mire hacia otro lado. Charo es incorruptible. O eso dicen.', gives: {charo: true}},
];
export const BRIBE = Object.fromEntries(BRIBES.map(b => [b.id, b]));
/** Fases judiciales. Llegar a la condena es perder. */
export const JUDICIAL = ['Sin causa abierta', 'Diligencias previas', 'Imputación', 'Juicio oral', 'Condena e inhabilitación'];

/** Diálogos de la campaña. Una grabación entera por diálogo (assets/rescate-voces.js). */
export const LINES = {
  // Tutorial: una persona habla cada vez.
  't-1': {person: 'minister', mood: 'determined', text: 'Bienvenido a Tenfe. Te lo resumo: no hay dinero, no hay trenes y el Norte llega tarde hasta a su propio funeral. Tienes ocho años. Las primeras trece semanas deciden si llegas a la segunda.'},
  't-2': {person: 'riders', mood: 'angry', text: 'Soy Marisa, de la asociación de viajeros. Pincha en el corredor Norte del mapa. Ese que parpadea en rojo. Así llevamos meses.'},
  't-3': {person: 'adif', mood: 'happy', text: 'Benito, de obras. El problema es la vía entre Ávila y Medina. Pulsa «Renovar la vía»: siete semanas y una cuadrilla. Elige cómo mantienes el servicio mientras tanto.'},
  't-4': {person: 'treasury', mood: 'worried', text: 'Charo, de Presupuestos. Antes de firmar, mira la cuenta: lo que cuesta ahora, lo que cuesta cada semana y lo que tienes que pagar pronto. La ayuda europea es financiación prevista: no la cobras hasta certificar la obra.'},
  't-5': {person: 'workshop', mood: 'determined', text: 'Fermín, del taller. Un tren nuevo tarda cuatro semanas en llegar. Y un tren en revisión no circula. Si la vía sigue rota, un tren más es un tren más llegando tarde.'},
  't-6': {person: 'minister', mood: 'happy', text: 'Tienes tres órdenes por semana. Mirar, comparar y deshacer lo que no has confirmado es gratis. Cuando lo tengas, cierra la semana o avanza hasta la próxima decisión.'},
  't-7': {person: 'minister', mood: 'proud', text: 'Eso es. La semana se ha cerrado: trenes, billetes, nóminas y obra. A partir de aquí decides tú. Yo vuelvo cuando haya foto.'},
  // Etapas
  'stage-s1': {person: 'minister', mood: 'determined', text: 'Primer trimestre. Recupera el Norte: del sesenta y dos al ochenta por ciento de puntualidad en trece semanas. Y paga todo. Un impago en tu primer trimestre es un titular que no quiero leer.'},
  'stage-s2': {person: 'treasury', mood: 'worried', text: 'Ahora los tres esenciales: Norte, Levante y Sur fiables antes de fin de año. Y no bajes de tres millones en caja. No es una sugerencia, es mi tensión arterial.'},
  'stage-s3': {person: 'president', mood: 'proud', text: 'Querido presidente de Tenfe: sanea las cuentas, cumple el programa y gánanos las elecciones. En ese orden o en cualquier otro, pero las tres.'},
  'stage-s4': {person: 'successor', mood: 'determined', text: 'Nuevo ministro, nuevas prioridades. Quiero tren en dos territorios olvidados y que Lowgo no se coma tus corredores buenos. Lo quiero en hilo y con fotos.'},
  'stage-s5': {person: 'president', mood: 'determined', text: 'Última legislatura. Cinco corredores fiables, nada de rescates y otras elecciones. Si lo consigues, te ponemos una placa. Pequeña.'},
  'stage-fail': {person: 'treasury', mood: 'disappointed', text: 'No has cumplido el objetivo en plazo. Queda anotado en tu expediente como incumplimiento grave. Al tercero, el Ministerio os retira la concesión.'},
  'stage-pass': {person: 'minister', mood: 'proud', text: 'Objetivo cumplido. Lo voy a contar como si hubiera sido idea mía, que para eso estoy.'},
  // Pactos
  'paco-estacion': {person: 'mayor', mood: 'happy', text: 'Ministro, mi pueblo necesita una estación. Viajeros tenemos pocos; votantes, los suficientes para que me escuche.'},
  'fermin-convenio': {person: 'workshop', mood: 'determined', text: 'La plantilla firma la paz si subes la nómina un seis por ciento. Medio año sin huelgas. Y sin recortes, que nos conocemos.'},
  'charo-contrato': {person: 'treasury', mood: 'worried', text: 'Te ofrezco un contrato-programa: más subvención cada trimestre. A cambio, cuentas en positivo y ni un préstamo más. Si me fallas, me lo devuelves con intereses y con auditoría.'},
  'benito-cuadrilla': {person: 'adif', mood: 'happy', text: 'Te presto una cuadrilla de Adif tres meses. Gratis. Bueno, gratis no: luego me pagas unos gastos de coordinación. Así funciona esto.'},
  'marisa-carta': {person: 'riders', mood: 'determined', text: 'Firma una carta de compromisos: Norte, Levante y Sur al ochenta y cinco por ciento. Si cumples, te aplaudimos. Si no, te reclamamos hasta el último billete.'},
  'raquel-inauguracion': {person: 'minister', mood: 'proud', text: 'Necesito cortar una cinta antes de las elecciones. Me da igual qué. Una obra, un andén, un banco del parque. Tú termina algo y yo pongo la sonrisa.'},
  'pedro-cohesion': {person: 'president', mood: 'proud', text: 'España no se acaba en la Castellana. Tres millones si pones un tren diario en algún sitio que nadie sepa señalar en el mapa.'},
  'oscar-tuits': {person: 'successor', mood: 'happy', text: 'Tengo un plan de comunicación: tres inauguraciones en seis meses. Tú pones las obras, yo pongo los tuits. Si no hay obras, también habrá tuits. Sobre ti.'},
  'inigo-noagresion': {person: 'rival', mood: 'proud', text: 'Te propongo un trato entre caballeros. Mis autocares te llevan gente a Soria y a Teruel. Tú te olvidas de Extremadura un año. Nadie tiene por qué enterarse.'},
  'paco-inaugura': {person: 'mayor', mood: 'proud', text: 'Ya tenemos apeadero. Doscientos vecinos, un andén y una banda de música que solo se sabe dos canciones. Ministro, esto no se olvida en las urnas.'},
  'paco-sobre': {person: 'mayor', mood: 'happy', text: 'Lo del sobre, ni una palabra. Usted me arregla la comarca y yo le arreglo los permisos. Aquí las cosas se hacen como toda la vida.'},
  'pact-done': {person: 'minister', mood: 'happy', text: 'Pacto cumplido. Fíjate, una promesa política cumplida. Lo enmarco.'},
  'pact-broken': {person: 'treasury', mood: 'angry', text: 'Has incumplido un pacto firmado. La gente tiene memoria y yo tengo hojas de cálculo.'},
  'negotiate-ok': {person: 'treasury', mood: 'happy', text: 'Han aceptado la versión barata. No te acostumbres.'},
  'negotiate-no': {person: 'rival', mood: 'angry', text: 'No hay rebaja. O lo tomas o lo dejas. Y te aviso: dejarlo también tiene precio.'},
  // Incidencias y sucesos
  'ev-averia': {person: 'workshop', mood: 'worried', text: 'Se nos ha muerto un tren en plena rampa. Puedo arreglarlo rápido pagando horas extra, o lo meto en el taller tres semanas. Tú decides cuánto lloramos.'},
  'ev-cable': {person: 'adif', mood: 'angry', text: 'Nos han robado cuatro kilómetros de cable de cobre. Otra vez. El Sur va a ir con retrasos hasta que lo repongamos.'},
  'ev-calor': {person: 'riders', mood: 'angry', text: 'Cuarenta y cuatro grados y el aire acondicionado del tren en huelga. Hay gente abanicándose con el billete.'},
  'ev-nevada': {person: 'adif', mood: 'worried', text: 'Ha nevado en Pajares y en la meseta. Puedo sacar la quitanieves si pagas, o esperamos a que salga el sol.'},
  'ev-huelga': {person: 'workshop', mood: 'angry', text: 'La plantilla va a la huelga. Dicen que trabajan por tres y cobran por uno. Yo no digo nada, pero tienen razón.'},
  'ev-viral': {person: 'riders', mood: 'surprised', text: 'Un vídeo de una revisora cantando jotas en el Teruel tiene dos millones de visitas. Por una vez, hablan bien de nosotros.'},
  'ev-desprendimiento': {person: 'adif', mood: 'worried', text: 'Desprendimiento de rocas en la trinchera. Nadie herido, pero la vía está cortada. Lo despejo en una semana si me das una cuadrilla.'},
  'ev-auditoria': {person: 'treasury', mood: 'determined', text: 'Auditoría del Tribunal de Cuentas. Van a mirar cada factura. Si hay algo que no deba estar, es buen momento para preocuparse.'},
  'ev-lowgo': {person: 'rival', mood: 'proud', text: 'Lowgo empieza a operar en tus corredores buenos. Billetes a nueve euros, asientos de plástico y una sonrisa. Que gane el mejor. O el más barato.'},
  'ev-fondos': {person: 'president', mood: 'happy', text: 'Bruselas nos ha dado una propina. No es mucho, pero cuéntalo como si fuera el plan Marshall.'},
  'ev-visita': {person: 'minister', mood: 'happy', text: 'Vengo de visita al Norte con tres cámaras. Si el tren llega a su hora, sales en el telediario. Si no, también.'},
  'ev-tuneles': {person: 'riders', mood: 'surprised', text: 'Los trenes nuevos de BCBB no caben en los túneles de Cantabria. Han medido el gálibo con un metro de costurera.'},
  // Corrupción
  'cor-comision': {person: 'rival', mood: 'proud', text: 'El fabricante te ofrece una atención: un siete por ciento del contrato en una cuenta suiza. El contrato sube un poco, claro. Alguien lo tiene que pagar.'},
  'cor-traviesas': {person: 'adif', mood: 'happy', text: 'Te propongo una cosa. Certificamos dos kilómetros de traviesas que ya estaban puestas. Nadie las va a contar. La diferencia, a medias.'},
  'cor-yate': {person: 'rival', mood: 'happy', text: 'Este fin de semana salgo en el yate con los de BCBB. Gambas, champán y una propuesta de contrato. Vente, que el mar no graba.'},
  'cor-enchufe': {person: 'minister', mood: 'happy', text: 'Mi sobrino Borja necesita trabajo. Es muy espabilado: sabe de todo un poco. Hazle jefe de cuadrilla y te debo una.'},
  'cor-mariscada': {person: 'workshop', mood: 'happy', text: 'La cena de Navidad de la dirección: noventa mil euros en marisco. ¿Lo cargamos a «formación en seguridad»?'},
  'ext-inigo': {person: 'rival', mood: 'proud', text: 'Tengo unas fotos tuyas muy bonitas. Cuatrocientos mil euros y se quedan en mi cajón. Si no, en la portada del domingo.'},
  'ext-paco': {person: 'mayor', mood: 'angry', text: 'O mi estación sale adelante o le cuento a la prensa lo del sobre. Yo no tengo nada que perder. Tengo un pueblo de doscientos habitantes.'},
  'ext-benito': {person: 'adif', mood: 'worried', text: 'Me han llamado del juzgado. Si me subes el sueldo, me acuerdo de muy pocas cosas. Si no, me acuerdo de todas.'},
  'sc-traviesas': {person: 'riders', mood: 'angry', text: 'Ha salido el caso Traviesas: pagaste kilómetros de vía que no existen. La gente quiere saber dónde está el dinero. Yo también.'},
  'sc-yate': {person: 'riders', mood: 'surprised', text: 'Portada del domingo: tú en un yate con el fabricante chino y una langosta. Pie de foto: «Negociando a la baja».'},
  'sc-enchufe': {person: 'riders', mood: 'angry', text: 'El sobrino de la ministra es jefe de cuadrilla y no sabe lo que es una traviesa. Lo han grabado preguntando si el balasto se come.'},
  'sc-mariscada': {person: 'riders', mood: 'angry', text: 'Noventa mil euros en marisco cargados a formación en seguridad. La formación consistía en abrir nécoras sin cortarse.'},
  'sc-sobres': {person: 'riders', mood: 'angry', text: 'Caso Sobres: alcaldes, inspectores y diputados cobrando en mano. La Gaceta tiene una libreta con tus iniciales.'},
  'sc-juez': {person: 'treasury', mood: 'angry', text: 'Han pillado el soborno al juez. Esto ya no es un escándalo, es una película. Y tú sales en el cartel.'},
  'sc-charo': {person: 'treasury', mood: 'angry', text: '¿Un sobre? ¿A mí? Acabo de reenviar tu oferta a la Fiscalía Anticorrupción con copia a mi madre.'},
  'jud-1': {person: 'treasury', mood: 'worried', text: 'Un juzgado ha abierto diligencias previas. Todavía no te han llamado. Todavía.'},
  'jud-2': {person: 'treasury', mood: 'angry', text: 'Estás imputado. Cada semana que pase, los viajeros y los diputados te mirarán peor.'},
  'jud-3': {person: 'president', mood: 'angry', text: 'Juicio oral. No te conozco. No te he conocido nunca. ¿Quién eres?'},
  'jud-end': {person: 'president', mood: 'disappointed', text: 'Condenado e inhabilitado. Tenfe pasa a manos de un comisario de Hacienda. Lo siento mucho. Bueno, no tanto.'},
  // Finanzas y elecciones
  'fin-impago': {person: 'treasury', mood: 'angry', text: 'No llegas a los pagos. Elige ya: vender trenes, aplazar obras, renegociar la deuda o recortar servicios. Todo tiene un precio, y lo pagarás más tarde.'},
  'fin-quiebra': {person: 'treasury', mood: 'disappointed', text: 'Cuatro semanas sin poder pagar. Tenfe entra en concurso de acreedores. Yo ya lo había dicho.'},
  'fin-retirada': {person: 'minister', mood: 'angry', text: 'Demasiados incumplimientos graves. El Ministerio os retira la concesión. Recoge tus cosas y deja la tarjeta de embarque.'},
  'el-forecast': {person: 'president', mood: 'worried', text: 'Las encuestas están ahí. Mira qué grupos te sostienen y cuáles te van a dejar caer. Quedan pocos meses.'},
  'el-win': {person: 'president', mood: 'proud', text: 'Hemos ganado. Tú sigues en Tenfe, yo sigo en la Moncloa y todos seguimos llegando tarde, pero menos.'},
  'el-lose': {person: 'president', mood: 'disappointed', text: 'Hemos perdido las elecciones. El nuevo Gobierno ya tiene su presidente para Tenfe. Y no eres tú.'},
  'end-win': {person: 'minister', mood: 'proud', text: 'Ocho años, dos elecciones y una red que funciona sin rescates. Hay quien dice que es imposible. Tú lo has hecho.'},
  'end-partial': {person: 'treasury', mood: 'worried', text: 'Has aguantado ocho años, pero el programa no está completo o la red no se paga sola. Te recordarán como el que casi lo arregla.'},
  'milestone': {person: 'riders', mood: 'happy', text: 'Hay gente en los andenes. Gente de verdad, con maletas. Esto empieza a parecer una compañía ferroviaria.'},
  'mega-done': {person: 'president', mood: 'proud', text: 'Megaproyecto terminado. Esto sale en los libros de texto. O al menos en el telediario.'},
};
export const LINE_IDS = Object.keys(LINES);

/** Titulares de la Gaceta del Raíl (el «Chirper» del juego). Se eligen según lo que pasa. */
export const HEADLINES = {
  late: ['«He llegado antes andando»: un vecino de Ávila adelanta al regional del Norte', 'El Norte bate su récord: 47 minutos de retraso medio un martes cualquiera', 'Un jubilado de Palencia lleva un diario de los retrasos: ya va por el tomo III'],
  good: ['El Norte llega puntual tres días seguidos y un pasajero llama a la prensa', 'Récord de viajeros: los andenes de Valladolid vuelven a tener colas', 'Los viajeros ponen nota a Tenfe: aprueba por primera vez desde 2009'],
  broke: ['Tenfe paga las nóminas con lo que encuentra en los sofás de Atocha', 'Hacienda manda a un interventor con calculadora y mala cara', 'Proveedores de Tenfe se plantean cobrar en vales de cafetería'],
  works: ['Cortes por obras: «Cuando acaben será precioso», promete Adif', 'Autobuses por carretera: el tren más rápido del corredor', 'Inaugurada la obra. El alcalde corta la cinta dos veces por si acaso'],
  corruption: ['Un yate, una langosta y un contrato: la Gaceta investiga', 'Las facturas de Tenfe incluyen «traviesas emocionales»', 'Fuentes de la Fiscalía: «Hay sobres, pero también hay recibos»'],
  rival: ['Lowgo regala un bocadillo con cada billete', 'Autocares Meseta anuncia wifi «casi siempre»', 'Lowgo cobra 3 € por llevar la chaqueta puesta'],
  quiet: ['Semana tranquila en Tenfe: solo dos vacas en la vía', 'Un revisor encuentra un billete de 1998 todavía válido', 'Tenfe estrena uniformes. Los viajeros prefieren trenes'],
};

/**
 * Imágenes del rescate: nombre fijo en assets/rescate/<clave>.webp. La interfaz las muestra en cuanto existen
 * y, si faltan, se ve sin ellas. Lista y descripciones para quien las genere: docs/PROMPT-FOTOS.md.
 */
export const IMAGES = [
  {key: 'portada-rescate', size: '1600×900', use: 'Portada del modo y pantalla final', desc: 'Un tren regional blanco con franja morada de Tenfe, viejo y cansado, parado en un andén rural español al amanecer, viajeros esperando con abrigos, niebla baja.'},
  {key: 'tren-bcbb', size: '1536×1024', use: 'Trenespop y compra de trenes: BCBB', desc: 'Tren de alta velocidad inspirado en el CRRC CR400AF «Fuxing» (morro largo y afilado, faros rasgados), librea blanca con detalles morados, en el MISMO taller de vigas azules y grúa amarilla que las demás fotos de trenes.'},
  {key: 'tren-dorfler', size: '1536×1024', use: 'Trenespop y compra de trenes: Dörfler', desc: 'Tren regional eléctrico inspirado en el Stadler FLIRT (frontal corto y redondeado, parabrisas grande y curvo), librea blanca y morada, en el MISMO taller de vigas azules y grúa amarilla.'},
  ...[['ultrasonidos', 'Carretón amarillo de auscultación por ultrasonidos sobre la vía, técnico con chaleco naranja y tableta, campo castellano por la mañana.'],
    ['predictivo', 'Ingenieros de mantenimiento mirando gráficas de sensores de trenes en pantallas grandes; a través de una cristalera, trenes en un depósito.'],
    ['bateadora', 'Bateadora amarilla trabajando de noche sobre el balasto con focos, operarios con chalecos naranjas.'],
    ['cadenciados', 'Gran panel de salidas en el vestíbulo de una estación española, viajeros con maletas, luz natural.'],
    ['regulacion', 'Puesto de regulación ferroviaria: operadores frente a una pared de pantallas con el esquema de las líneas.'],
    ['ertms', 'Cabina de conducción de un tren moderno con pantallas digitales ETCS, asiento vacío, la vía al frente a través del parabrisas.'],
    ['contrato', 'Un técnico del fabricante y el jefe de taller se dan la mano junto a un tren regional blanco en el taller.'],
    ['segunda', 'Trenes regionales diésel viejos aparcados en una playa de vías con hierbajos, paisaje seco español.'],
    ['bimodo', 'Tren regional bimodo blanco y morado circulando por vía única sin catenaria entre colinas secas.'],
    ['abono', 'Mano sujetando una tarjeta-abono morada junto a un torniquete de validación de una estación.'],
    ['dinamico', 'Móvil en la mano de un viajero mostrando una gráfica de precios de billetes, andén desenfocado detrás.'],
    ['app', 'Joven escaneando un billete con código QR en su móvil en la puerta de un tren blanco.'],
    ['prensa', 'Sala de prensa vacía con muchos micrófonos en un atril de madera y fotógrafos.'],
    ['inauguraciones', 'Inauguración en una estación pequeña: banda de música de pueblo y políticos con unas tijeras enormes cortando una cinta.'],
    ['influencers', 'Joven influencer grabándose con un aro de luz dentro de un vagón de tren moderno.'],
    ['contabilidad', 'Mesa de despacho de noche con libros de cuentas, facturas, calculadora y un sobre marrón lleno de billetes de euro.'],
    ['abogados', 'Abogados con toga negra caminando por el pasillo de un juzgado español con carpetas gruesas.'],
    ['destructora', 'Destructora de papel industrial rebosante de documentos triturados en un despacho a oscuras.']].map(([id, desc]) => ({key: 'tech-' + id, size: '960×640', use: 'Árbol tecnológico', desc})),
  ...[['taller', 'Interior de un gran taller ferroviario nuevo con fosos, torno de ruedas y trenes blancos, vigas azules y grúa amarilla.'],
    ['ctc', 'Centro de control ferroviario futurista con una pared de vídeo curva gigante con el mapa de líneas y operadores.'],
    ['mediterraneo', 'Vista aérea de una doble vía nueva junto a la costa mediterránea, naranjos y mar azul, tren blanco y morado.'],
    ['teruel', 'Obra de un túnel y un viaducto de hormigón en montañas áridas de Teruel, grúas y operarios.'],
    ['estacion', 'Gran estación subterránea pasante moderna en Madrid, andenes largos, techo de madera y vidrio, viajeros.'],
    ['monumento', 'Rotonda de un pueblo español con una estatua de bronce de una locomotora de vapor sobre un pedestal y una cinta roja.']].map(([id, desc]) => ({key: 'mega-' + id, size: '1280×720', use: 'Megaproyectos', desc})),
  ...[['extremadura', 'Dehesa extremeña con encinas y una vía única sin electrificar; un tren diésel viejo detenido en mitad del campo.'],
    ['teruel', 'Estación pequeña de montaña en Teruel con pancartas de «Teruel existe» y vecinos esperando.'],
    ['soria', 'Estación de Soria casi vacía en invierno, paisaje de páramo nevado.'],
    ['cantabria', 'Boca de túnel antiguo de piedra en un valle verde de Cantabria interior con una vía estrecha.']].map(([id, desc]) => ({key: 'territorio-' + id, size: '1280×720', use: 'Territorios desatendidos', desc})),
  ...[['averia', 'Tren regional averiado en una rampa con el capó abierto y un mecánico con linterna.'],
    ['cable', 'Zanja de cables junto a la vía con el cable de cobre robado, cortes limpios, guardia civil al fondo.'],
    ['calor', 'Vagón de tren abarrotado en verano, viajeros abanicándose con billetes, sol intenso.'],
    ['nevada', 'Tren detenido en una vía nevada de montaña con una quitanieves al fondo.'],
    ['huelga', 'Trabajadores ferroviarios en huelga con pancartas delante de una estación.'],
    ['viral', 'Revisora sonriente cantando en un vagón mientras los viajeros graban con el móvil.'],
    ['desprendimiento', 'Rocas caídas sobre la vía en una trinchera, operarios inspeccionando.'],
    ['auditoria', 'Auditores con cajas de archivo revisando facturas en una sala de reuniones.'],
    ['fondos', 'Bandera de la Unión Europea junto a un cartel de obra ferroviaria financiada.'],
    ['visita', 'Andén con cámaras de televisión y periodistas esperando la llegada de un tren.'],
    ['tuneles', 'Tren nuevo atascado en la boca de un túnel antiguo demasiado estrecho, operarios midiendo con cinta.'],
    ['lowgo', 'Tren de una compañía low cost con colores chillones adelantando en un andén, cartel de billetes a 9 €.']].map(([id, desc]) => ({key: 'evento-' + id, size: '1280×720', use: 'Imprevistos', desc})),
  ...[['traviesas', 'Montón de traviesas de hormigón nuevas abandonadas en un descampado con hierba crecida.'],
    ['yate', 'Yate de lujo en un puerto mediterráneo con una mesa de marisco y champán en cubierta, sin personas reconocibles.'],
    ['enchufe', 'Casco de obra nuevo y reluciente sobre una mesa de despacho con una placa de «jefe de cuadrilla».'],
    ['mariscada', 'Mesa enorme de marisco con nécoras, gambas y botellas en un restaurante, restos de una cena.'],
    ['sobres', 'Libreta abierta con iniciales y cifras junto a sobres marrones sobre una mesa.'],
    ['juez', 'Mazo de juez sobre una mesa de juzgado con un sobre marrón medio escondido.'],
    ['charo', 'Despacho de Hacienda ordenadísimo con un sobre marrón cerrado sobre la mesa y una lámpara.']].map(([id, desc]) => ({key: 'escandalo-' + id, size: '1280×720', use: 'Escándalos y propuestas corruptas', desc})),
  ...[['extorsion', 'Fotos impresas sobre la mesa de un bar, una mano las empuja hacia el espectador.'],
    ['impago', 'Oficina de tesorería con facturas impagadas apiladas y una calculadora con números rojos.'],
    ['hito', 'Andén lleno de viajeros subiendo a un tren regional blanco y morado al atardecer.'],
    ['elecciones', 'Urna electoral transparente con papeletas en un colegio electoral español.'],
    ['juzgado', 'Fachada de un juzgado español con periodistas en la puerta.'],
    ['cloacas', 'Túnel de servicio oscuro bajo una estación con tuberías y una luz al fondo.']].map(([id, desc]) => ({key: id, size: '1280×720', use: 'Avisos y cloacas', desc})),
  ...[['s1', 'Corredor Norte: tren regional llegando tarde a la estación de Valladolid, viajeros mirando el reloj.'],
    ['s2', 'Tres trenes regionales en tres andenes de una gran estación, amanecer.'],
    ['s3', 'Despacho ministerial con carteles electorales y un mapa ferroviario de España en la pared.'],
    ['s4', 'Carretera vacía y vía abandonada en la España vaciada al atardecer, pueblo al fondo.'],
    ['s5', 'Tren regional moderno blanco y morado cruzando un viaducto al sol, red ferroviaria funcionando.']].map(([id, desc]) => ({key: 'etapa-' + id, size: '1280×720', use: 'Inicio de cada etapa', desc})),
  {key: 'fin-victoria', size: '1280×720', use: 'Final ganado', desc: 'Inauguración multitudinaria con confeti en una estación moderna y un tren nuevo blanco y morado.'},
  {key: 'fin-derrota', size: '1280×720', use: 'Final perdido', desc: 'Despacho vacío con cajas de mudanza y una placa de «Presidencia de Tenfe» en el suelo.'},
];
export const imageURL = key => 'assets/rescate/' + key + '.webp';
