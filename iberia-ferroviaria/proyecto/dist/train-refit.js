
import {MODEL,MODELS} from './data.js';
let E;
export function bind(engine){E=engine;}
export const INTERIORS={
  "r465": {
    "id": "r465",
    "before": "assets/interiores/r465-actual.webp",
    "after": "assets/interiores/r465-reformado.webp",
    "layout": "Civia · salón abierto, asientos 2+2 y pasamanos",
    "concept": false,
    "references": [
      "https://commons.wikimedia.org/wiki/File:RENFE_Civia_-_Interior_-_2014-07-24.jpg",
      "https://www.renfe.com/es/es/cercanias/cercanias-madrid/rodajes/unidad-465",
      "https://vialibre-ffe.com/multi_galeria.asp?gal=257"
    ],
    "referenceId": "r465",
    "sourceBefore": "assets/interiores/final/r465-actual.png",
    "sourceAfter": "assets/interiores/final/r465-reformado.png",
    "referenceNote": "",
    "referenceCredit": "Mike1979 Russia",
    "referenceLicense": "CC BY-SA 3.0",
    "referenceLicenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  "r592": {
    "id": "r592",
    "before": "assets/interiores/r592-actual.webp",
    "after": "assets/interiores/r592-reformado.webp",
    "layout": "Camello · salón clásico de Media Distancia, 2+2",
    "concept": false,
    "references": [
      "https://commons.wikimedia.org/wiki/File:CP_Class_0592_interior_(24588476403).jpg"
    ],
    "referenceId": "r592",
    "sourceBefore": "assets/interiores/final/r592-actual.png",
    "sourceAfter": "assets/interiores/final/r592-reformado.png",
    "referenceNote": "La fotografía muestra un 592 de origen Renfe en servicio con CP: se conserva su salón regional y sus asientos reversibles.",
    "referenceCredit": "tak.wing",
    "referenceLicense": "CC BY-SA 2.0",
    "referenceLicenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
  },
  "r599": {
    "id": "r599",
    "before": "assets/interiores/r599-actual.webp",
    "after": "assets/interiores/r599-reformado.webp",
    "layout": "Media Distancia · asientos azules 2+2",
    "concept": false,
    "references": [
      "https://commons.wikimedia.org/wiki/File:J28_705_Renfe-599%2C_innen.jpg",
      "https://www.renfe.com/es/es/grupo-renfe/grupo-renfe/flota-de-trenes/s-599"
    ],
    "referenceId": "r599",
    "sourceBefore": "assets/interiores/final/r599-actual.png",
    "sourceAfter": "assets/interiores/final/r599-reformado.png",
    "referenceNote": "",
    "referenceCredit": "Falk2",
    "referenceLicense": "CC BY-SA 4.0",
    "referenceLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "rdorf": {
    "id": "rdorf",
    "before": "assets/interiores/rdorf-actual.webp",
    "after": "assets/interiores/rdorf-reformado.webp",
    "layout": "Concepto regional inspirado en FLIRT · piso bajo, 2+2",
    "concept": true,
    "references": [
      "https://commons.wikimedia.org/wiki/File:Interior_Stadler_FLIRT_of_Go-Ahead_Baden-W%C3%BCrttemberg.jpg",
      "https://www.stadlerrail.com/solutions/references/flirt-db-arriva-nl-limburg"
    ],
    "referenceId": "rdorf",
    "sourceBefore": "assets/interiores/final/rdorf-actual.png",
    "sourceAfter": "assets/interiores/final/rdorf-reformado.png",
    "referenceNote": "Concepto del juego basado en un salón real de Stadler FLIRT.",
    "referenceCredit": "Smiley.toerist",
    "referenceLicense": "CC BY-SA 4.0",
    "referenceLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "rbcbb": {
    "id": "rbcbb",
    "before": "assets/interiores/rbcbb-actual.webp",
    "after": "assets/interiores/rbcbb-reformado.webp",
    "layout": "Concepto inspirado en Fuxing CR400AF · segunda clase 3+2",
    "concept": true,
    "references": [
      "https://commons.wikimedia.org/wiki/File:Second_Class_interior_of_CR400AF-B-2208_20230920.jpg"
    ],
    "referenceId": "rbcbb",
    "sourceBefore": "assets/interiores/final/rbcbb-actual.png",
    "sourceAfter": "assets/interiores/final/rbcbb-reformado.png",
    "referenceNote": "Concepto del juego basado en un salón real de Fuxing CR400AF.",
    "referenceCredit": "颐园居",
    "referenceLicense": "CC BY-SA 4.0",
    "referenceLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "av2030": {
    "id": "av2030",
    "before": "assets/interiores/av2030-actual.webp",
    "after": "assets/interiores/av2030-reformado.webp",
    "layout": "Concepto de alta velocidad inspirado en Velaro · 2+2",
    "concept": true,
    "references": [
      "https://commons.wikimedia.org/wiki/File:202112_Turista_Class_at_Renfe_S-103.jpg",
      "https://grupo.renfe.com/es/es/conoce-renfe/nuestros-trenes",
      "https://europe-train-lab.jp/www/portfolio/europe/spain/train/ave/s103.html"
    ],
    "referenceId": "s103",
    "sourceBefore": "assets/interiores/final/av2030-actual.png",
    "sourceAfter": "assets/interiores/final/av2030-reformado.png",
    "referenceNote": "Concepto del juego basado en el salón real del S103 Velaro, con otros acabados.",
    "referenceCredit": "MNXANL",
    "referenceLicense": "CC BY-SA 4.0",
    "referenceLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "s100": {
    "id": "s100",
    "before": "assets/interiores/s100-actual.webp",
    "after": "assets/interiores/s100-reformado.webp",
    "layout": "AVE de primera generación · salón Turista 2+2",
    "concept": false,
    "references": [
      "https://commons.wikimedia.org/wiki/File:202201_Turista_Class_Interior_of_Renfe_S-100.jpg",
      "https://grupo.renfe.com/es/es/conoce-renfe/nuestros-trenes/s-100"
    ],
    "referenceId": "s100",
    "sourceBefore": "assets/interiores/final/s100-actual.png",
    "sourceAfter": "assets/interiores/final/s100-reformado.png",
    "referenceNote": "",
    "referenceCredit": "MNXANL",
    "referenceLicense": "CC BY-SA 4.0",
    "referenceLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "s103": {
    "id": "s103",
    "before": "assets/interiores/s103-actual.webp",
    "after": "assets/interiores/s103-reformado.webp",
    "layout": "Velaro · salón Estándar 2+2",
    "concept": false,
    "references": [
      "https://commons.wikimedia.org/wiki/File:202112_Turista_Class_at_Renfe_S-103.jpg",
      "https://europe-train-lab.jp/www/portfolio/europe/spain/train/ave/s103.html"
    ],
    "referenceId": "s103",
    "sourceBefore": "assets/interiores/final/s103-actual.png",
    "sourceAfter": "assets/interiores/final/s103-reformado.png",
    "referenceNote": "",
    "referenceCredit": "MNXANL",
    "referenceLicense": "CC BY-SA 4.0",
    "referenceLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "s112": {
    "id": "s112",
    "before": "assets/interiores/s112-actual.webp",
    "after": "assets/interiores/s112-reformado.webp",
    "layout": "Talgo Pato · coche corto, Turista 2+2",
    "concept": false,
    "references": [
      "https://www.flickr.com/photos/39820345@N06/5640733426/",
      "https://vialibre-ffe.com/noticias.asp?not=37029"
    ],
    "referenceId": "s112",
    "sourceBefore": "assets/interiores/final/s112-actual.png",
    "sourceAfter": "assets/interiores/final/s112-reformado.png",
    "referenceNote": "",
    "referenceCredit": "Costa Martínez",
    "referenceLicense": "Todos los derechos reservados; referencia visual, original no redistribuido",
    "referenceLicenseUrl": null
  },
  "s120": {
    "id": "s120",
    "before": "assets/interiores/s120-actual.webp",
    "after": "assets/interiores/s120-reformado.webp",
    "layout": "CAF Alvia · salón Turista 2+2",
    "concept": false,
    "references": [
      "https://europe-train-lab.jp/www/portfolio/europe/spain/train/alvia/s120.html",
      "https://grupo.renfe.com/es/es/conoce-renfe/nuestros-trenes/s-120"
    ],
    "referenceId": "s120",
    "sourceBefore": "assets/interiores/final/s120-actual.png",
    "sourceAfter": "assets/interiores/final/s120-reformado.png",
    "referenceNote": "",
    "referenceCredit": "Europe / World Train Lab",
    "referenceLicense": "Copyright; referencia visual, original no redistribuido",
    "referenceLicenseUrl": null
  },
  "s130": {
    "id": "s130",
    "before": "assets/interiores/s130-actual.webp",
    "after": "assets/interiores/s130-reformado.webp",
    "layout": "Talgo Patito · coche corto, Turista 2+2",
    "concept": false,
    "references": [
      "https://commons.wikimedia.org/wiki/File:Alvia-Mad-Gijon-150913.jpg",
      "https://grupo.renfe.com/es/es/conoce-renfe/nuestros-trenes/s-130",
      "https://europe-train-lab.jp/www/portfolio/europe/spain/train/alvia/s130.html",
      "https://www.renfe.com/es/es/grupo-renfe/comunicacion/renfe-al-dia/sala-de-prensa/renfe-presenta-trabajos-renovacion-alvia-s-setecientos-treinta"
    ],
    "referenceId": "s130",
    "sourceBefore": "assets/interiores/final/s130-actual.png",
    "sourceAfter": "assets/interiores/final/s130-reformado.png",
    "referenceNote": "",
    "referenceCredit": "FDV",
    "referenceLicense": "CC BY-SA 3.0",
    "referenceLicenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  "s730": {
    "id": "s730",
    "before": "assets/interiores/s730-actual.webp",
    "after": "assets/interiores/s730-reformado.webp",
    "layout": "Talgo híbrido · coche de viajeros, Turista 2+2",
    "concept": false,
    "references": [
      "https://commons.wikimedia.org/wiki/File:2025-08-06%2C_Interior_of_Renfe_S-730.jpg",
      "https://grupo.renfe.com/es/es/conoce-renfe/nuestros-trenes/s-730-dual",
      "https://www.trenvista.net/noticias/renfe-presenta-la-reforma-de-las-series-130-y-730/"
    ],
    "referenceId": "s730",
    "sourceBefore": "assets/interiores/final/s730-actual.png",
    "sourceAfter": "assets/interiores/final/s730-reformado.png",
    "referenceNote": "",
    "referenceCredit": "Patrycja Rosa (ptrcnull)",
    "referenceLicense": "CC BY 4.0",
    "referenceLicenseUrl": "https://creativecommons.org/licenses/by/4.0"
  },
  "s106f": {
    "id": "s106f",
    "before": "assets/interiores/s106f-actual.webp",
    "after": "assets/interiores/s106f-reformado.webp",
    "layout": "Avril fijo · caja ancha, Estándar 3+2",
    "concept": false,
    "references": [
      "https://zdopravy.cz/obrazem-novy-spanelsky-rychlovlak-na-startu-vyjede-ve-dvou-verzich-lisit-se-budou-barvou-a-poctem-mist-204857/",
      "https://www.renfe.com/es/es/viajar/el-viaje/a-bordo/tipos-asiento"
    ],
    "referenceId": "s106",
    "sourceBefore": "assets/interiores/final/s106-actual.png",
    "sourceAfter": "assets/interiores/final/s106-reformado.png",
    "referenceNote": "Detalle del bloque de tres asientos del salón Estándar 3+2. Los Avril fijo y variable comparten el mismo interior.",
    "referenceCredit": "Renfe",
    "referenceLicense": "Fotografía de prensa Renfe; referencia visual, original no redistribuido",
    "referenceLicenseUrl": null
  },
  "s106v": {
    "id": "s106v",
    "before": "assets/interiores/s106v-actual.webp",
    "after": "assets/interiores/s106v-reformado.webp",
    "layout": "Avril variable · caja ancha, Estándar 3+2",
    "concept": false,
    "references": [
      "https://zdopravy.cz/obrazem-novy-spanelsky-rychlovlak-na-startu-vyjede-ve-dvou-verzich-lisit-se-budou-barvou-a-poctem-mist-204857/",
      "https://www.renfe.com/es/es/grupo-renfe/comunicacion/renfe-al-dia/sala-de-prensa/renfe-pone-venta-61000-billetes-semanales-servicios-alta-velocidad-asturias-galicia",
      "https://www.renfe.com/es/es/viajar/el-viaje/a-bordo/tipos-asiento"
    ],
    "referenceId": "s106",
    "sourceBefore": "assets/interiores/final/s106-actual.png",
    "sourceAfter": "assets/interiores/final/s106-reformado.png",
    "referenceNote": "Detalle del bloque de tres asientos del salón Estándar 3+2. Los Avril fijo y variable comparten el mismo interior.",
    "referenceCredit": "Renfe",
    "referenceLicense": "Fotografía de prensa Renfe; referencia visual, original no redistribuido",
    "referenceLicenseUrl": null
  }
};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' M€';
export function isRefitted(f){return f?.interiorRefitted===true||/^Reforma /.test(f?.origin||'');}
export function photo(id,reformed=false,extra=''){
 const d=INTERIORS[id];if(!d)throw Error('Este modelo no tiene interior registrado.');
 const path=reformed?d.after:d.before,src=globalThis.TENFE_INTERIOR_IMAGES?.[path]||(path+'?v=6.4.0');
 return '<img class="refit-photo '+extra+'" src="'+esc(src)+'" alt="'+esc(MODEL[id].name+' · '+(reformed?'interior reformado':'interior de serie'))+'" data-model="'+id+'" data-interior="'+(reformed?'reformado':'actual')+'" loading="lazy" decoding="async" width="1536" height="1024">';
}
export function comparison(id,currentReformed=false){
 return '<section class="refit-comparison" aria-label="Antes y después de la reforma"><div class="refit-scene" style="--refit-split:50%">'+photo(id,currentReformed,'refit-before')+'<div class="refit-after">'+photo(id,true)+'<i class="refit-stripes" aria-hidden="true"></i></div><i class="refit-divider" aria-hidden="true"><span>↔</span></i><span class="refit-badge current">ACTUAL</span><span class="refit-badge proposed">REFORMADO</span></div><label class="refit-slider"><span>Desliza para comparar</span><input type="range" min="0" max="100" value="50" step="1" data-refit-slider aria-label="Comparar interior actual y reformado"></label></section>';
}
function references(id){
 const d=INTERIORS[id],license=d.referenceLicenseUrl?'<a href="'+esc(d.referenceLicenseUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(d.referenceLicense)+'</a>':esc(d.referenceLicense);
 return '<details class="refit-references"><summary>Ver referencias del interior</summary><p>'+esc(d.layout)+'</p><p>Recreación con IA basada en una fotografía real. La reforma es una propuesta del juego y conserva la distribución del salón.</p>'+(d.referenceNote?'<p>'+esc(d.referenceNote)+'</p>':'')+'<p>Fotografía de referencia: '+esc(d.referenceCredit)+' · '+license+'</p><ul>'+d.references.map((url,i)=>'<li><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+(i===0?'Fotografía utilizada':'Ficha del modelo')+' · '+esc(new URL(url).hostname)+'</a></li>').join('')+'</ul></details>';
}
export function catalogueHTML(){
 return '<div class="refit-catalogue">'+MODELS.filter(m=>!m.road).map(m=>{const d=INTERIORS[m.id];return '<article><header><span class="kicker">'+esc(m.family)+(d.concept?' · CONCEPTO':'')+'</span><h3>'+esc(m.name)+'</h3></header><div class="refit-photo-pair"><figure>'+photo(m.id,false)+'<figcaption>De serie</figcaption></figure><figure>'+photo(m.id,true)+'<figcaption>Reformado</figcaption></figure></div><p>'+esc(d.layout)+'</p><button class="btn small" data-action="interior-preview" data-id="'+m.id+'">Comparar interiores →</button></article>';}).join('')+'</div>';
}
export function jobsHTML(s){
 const rows=s.refits.slice(-12).reverse();return '<section class="refit-jobs"><h3>El trabajo del taller</h3>'+(!rows.length?'<div class="refit-empty">Elige un lote libre para empezar. Mientras se reforma, sus unidades salen temporalmente del parque.</div>':rows.map(r=>{
 const started=r.started??r.due-5,progress=r.done?100:Math.max(0,Math.min(99,(s.month-started)/Math.max(1,r.due-started)*100));
 return '<article><div>'+photo(r.model,!!r.done||!!r.interiorBefore)+'</div><div><span class="kicker">'+(r.done?'LISTO PARA CIRCULAR':'EN EL TALLER')+'</span><h4>'+esc(MODEL[r.model].name)+' · '+r.qty+' '+(r.qty===1?'unidad':'unidades')+'</h4><p>'+(r.done?'Interior renovado · unidades devueltas al parque':'Restan '+Math.max(0,r.due-s.month)+' '+(s.tenfe?.game?'turnos':'meses'))+'</p><div class="bar green" role="progressbar" aria-valuenow="'+Math.round(progress)+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+progress+'%"></span></div></div></article>';
 }).join(''))+'</section>';
}
export function pageHTML(s,view='workshop'){
 const jobs=s.refits.filter(r=>!r.done),lots=s.fleet.filter(f=>f.qty>0);
 return '<section class="refit-workshop"><div class="refit-intro"><h2>Una segunda vida para tus trenes.</h2><div class="refit-overview"><span><b>'+jobs.reduce((n,r)=>n+r.qty,0)+'</b> unidades en reforma</span><span><b>5</b> '+(s.tenfe?.game?'turnos':'meses')+' de taller</span><span><b>12 %</b> del precio por unidad'+(s.tenfe?.game?.tech.includes('contrato')?' · descuento de investigación aplicado':'')+'</span></div></div>'+
 '<div class="refit-views" role="group" aria-label="Vista del taller"><button class="'+(view==='workshop'?'selected':'')+'" data-action="refit-view" data-id="workshop">Tus trenes</button><button class="'+(view==='catalogue'?'selected':'')+'" data-action="refit-view" data-id="catalogue">Los 14 interiores</button></div>'+
 (view==='catalogue'?catalogueHTML():'<div class="refit-lots">'+lots.map(f=>'<article>'+photo(f.model,isRefitted(f))+'<div><span class="kicker">'+esc(MODEL[f.model].family)+' · '+(isRefitted(f)?'INTERIOR RENOVADO':'INTERIOR DE SERIE')+'</span><h3>'+esc(MODEL[f.model].name)+'</h3><p>'+Math.round(f.condition)+' % de estado · '+E.available(s,f)+' libres de '+f.qty+'</p><button class="btn small" data-action="refit-detail" data-id="'+f.id+'">Comparar reforma →</button></div></article>').join('')+'</div>'+(!lots.length?'<p class="refit-empty">Tu parque está vacío. Puedes ver todos los interiores o comprar material en Trenes Pop.</p>':'')+jobsHTML(s))+'</section>';
}
export function previewHTML(id){const d=INTERIORS[id];if(!d)throw Error('Modelo desconocido.');return '<div class="content refit-modal"><span class="kicker">INTERIORES · '+(d.concept?'CONCEPTO DEL JUEGO':'REFERENCIA DEL MODELO')+'</span><h1>'+esc(MODEL[id].name)+'</h1>'+comparison(id)+'<p class="small">'+esc(d.layout)+'</p><p>Tapicería nueva, suelo renovado, iluminación LED y equipamiento actualizado. La reforma mantiene las plazas y la distribución.</p>'+references(id)+'<div class="actions"><button class="btn" data-action="close-modal">Volver al taller</button></div></div>';}
export function detailHTML(s,id,qty=1){
 const f=s.fleet.find(f=>f.id===id);if(!f)throw Error('Lote desconocido.');
 const free=E.available(s,f),d=INTERIORS[f.model];
 return '<div class="content refit-modal"><span class="kicker">REFORMA DE TU FLOTA'+(d.concept?' · CONCEPTO':'')+'</span><h1>'+esc(MODEL[f.model].name)+'</h1>'+comparison(f.model,isRefitted(f))+'<p class="small">'+esc(d.layout)+'</p>'+
 '<div class="refit-benefits"><span>Asientos y tapicería</span><span>Suelo e iluminación</span><span>Revisión integral</span></div>'+
 '<label for="refitQty">Unidades a reformar</label><input id="refitQty" data-fleet="'+esc(id)+'" type="number" min="1" max="'+Math.max(1,free)+'" value="'+Math.max(1,Math.min(free,qty))+'" '+(!free?'disabled':'')+'>'+
 '<p class="small">'+free+' libres de '+f.qty+'. Las unidades asignadas siguen circulando. Para reformarlas, libéralas antes en el plan de servicio.</p>'+
 '<div id="refitQuote" aria-live="polite"></div>'+(isRefitted(f)?'<p class="small">Este lote ya tiene interior renovado. Otra reforma recupera el estado mecánico y conserva su interior.</p>':'')+references(f.model)+
 '<div class="actions"><button class="btn primary" data-action="refit-confirm" data-id="'+esc(id)+'">Enviar al taller</button><button class="btn" data-action="close-modal">Cancelar</button></div></div>';
}
export function quoteHTML(s,id,qty){
 try{const q=E.refurbishQuote(s,id,qty),f=s.fleet.find(f=>f.id===id);const affordable=s.cash>=q.total,blocked=!!s.ended||!affordable;
 return {disabled:blocked,html:'<dl class="figures refit-quote"><div><dt>Coste total</dt><dd>'+money(q.total)+'</dd><em>'+money(q.perUnit)+' por unidad</em></div><div><dt>Plazo</dt><dd>'+q.duration+' '+(s.tenfe?.game?'turnos':'meses')+'</dd></div><div><dt>Estado al volver</dt><dd>98 %</dd><em>Ahora '+Math.round(f.condition)+' %</em></div></dl><p class="refit-quote-note">'+(q.discount?'Descuento del contrato de mantenimiento: 25 %. ':'')+'Se mantienen '+MODEL[f.model].seats+' plazas por unidad, el ancho y la tracción.</p>'+
 (s.ended?'<p class="callout">El mandato ha terminado.</p>':!affordable?'<p class="callout">Faltan '+money(q.total-s.cash)+' de caja.</p>':'<p class="small">Se abonan '+money(q.total)+' ahora; vuelven tras '+q.duration+' '+(s.tenfe?.game?'turnos':'meses')+'.</p>')};
 }catch(error){return {disabled:true,html:'<p class="callout">'+esc(error.message)+'</p>'};}
}
