
import {MODEL,MODELS} from './data.js';
let E;
export function bind(engine){E=engine;}
export const INTERIORS={
  "r465": {
    "id": "r465",
    "atlas": "interiores-01.png",
    "row": 0,
    "before": "assets/interiores/r465-actual.webp",
    "after": "assets/interiores/r465-reformado.webp",
    "layout": "Civia · salón abierto, asientos 2+2 y pasamanos",
    "concept": false,
    "references": [
      "https://www.renfe.com/es/es/cercanias/cercanias-madrid/rodajes/unidad-465",
      "https://vialibre-ffe.com/multi_galeria.asp?gal=257"
    ]
  },
  "r592": {
    "id": "r592",
    "atlas": "interiores-01.png",
    "row": 1,
    "before": "assets/interiores/r592-actual.webp",
    "after": "assets/interiores/r592-reformado.webp",
    "layout": "Camello · salón clásico de Media Distancia, 2+2",
    "concept": false,
    "references": [
      "https://commons.wikimedia.org/wiki/File:RENFE_592_-_Interior_-_2014-08-13_01.jpg"
    ]
  },
  "r599": {
    "id": "r599",
    "atlas": "interiores-02.png",
    "row": 0,
    "before": "assets/interiores/r599-actual.webp",
    "after": "assets/interiores/r599-reformado.webp",
    "layout": "Media Distancia · asientos azules 2+2",
    "concept": false,
    "references": [
      "https://www.renfe.com/es/es/grupo-renfe/grupo-renfe/flota-de-trenes/s-599"
    ]
  },
  "rdorf": {
    "id": "rdorf",
    "atlas": "interiores-02.png",
    "row": 1,
    "before": "assets/interiores/rdorf-actual.webp",
    "after": "assets/interiores/rdorf-reformado.webp",
    "layout": "Concepto regional inspirado en FLIRT · piso bajo, 2+2",
    "concept": true,
    "references": [
      "https://www.stadlerrail.com/solutions/references/flirt-db-arriva-nl-limburg",
      "https://www.bahnbilder.de/bild/Schweiz~Wagen~Inneneinrichtungen/1142282/blick-auf-zwei-sitze-der-2.html"
    ]
  },
  "rbcbb": {
    "id": "rbcbb",
    "atlas": "interiores-03.png",
    "row": 0,
    "before": "assets/interiores/rbcbb-actual.webp",
    "after": "assets/interiores/rbcbb-reformado.webp",
    "layout": "Concepto regional inspirado en Fuxing CR200J · 3+2",
    "concept": true,
    "references": [
      "https://www.crrcgc.cc/pz/2024-09/04/article_2024090408395645706.html",
      "https://commons.wikimedia.org/wiki/File:Interiors_of_CR200J_second_class_coach_20190218.jpg"
    ]
  },
  "av2030": {
    "id": "av2030",
    "atlas": "interiores-03.png",
    "row": 1,
    "before": "assets/interiores/av2030-actual.webp",
    "after": "assets/interiores/av2030-reformado.webp",
    "layout": "Concepto de alta velocidad inspirado en Velaro · 2+2",
    "concept": true,
    "references": [
      "https://grupo.renfe.com/es/es/conoce-renfe/nuestros-trenes",
      "https://europe-train-lab.jp/www/portfolio/europe/spain/train/ave/s103.html"
    ]
  },
  "s100": {
    "id": "s100",
    "atlas": "interiores-04.png",
    "row": 0,
    "before": "assets/interiores/s100-actual.webp",
    "after": "assets/interiores/s100-reformado.webp",
    "layout": "AVE de primera generación · salón Turista 2+2",
    "concept": false,
    "references": [
      "https://grupo.renfe.com/es/es/conoce-renfe/nuestros-trenes/s-100",
      "https://commons.wikimedia.org/wiki/File:202201_Turista_Class_Interior_of_Renfe_S-100.jpg"
    ]
  },
  "s103": {
    "id": "s103",
    "atlas": "interiores-04.png",
    "row": 1,
    "before": "assets/interiores/s103-actual.webp",
    "after": "assets/interiores/s103-reformado.webp",
    "layout": "Velaro · salón Estándar 2+2",
    "concept": false,
    "references": [
      "https://europe-train-lab.jp/www/portfolio/europe/spain/train/ave/s103.html"
    ]
  },
  "s112": {
    "id": "s112",
    "atlas": "interiores-05.png",
    "row": 0,
    "before": "assets/interiores/s112-actual.webp",
    "after": "assets/interiores/s112-reformado.webp",
    "layout": "Talgo Pato · coche corto, Turista 2+2",
    "concept": false,
    "references": [
      "https://vialibre-ffe.com/noticias.asp?not=37029"
    ]
  },
  "s120": {
    "id": "s120",
    "atlas": "interiores-05.png",
    "row": 1,
    "before": "assets/interiores/s120-actual.webp",
    "after": "assets/interiores/s120-reformado.webp",
    "layout": "CAF Alvia · salón Turista 2+2",
    "concept": false,
    "references": [
      "https://grupo.renfe.com/es/es/conoce-renfe/nuestros-trenes/s-120",
      "https://europe-train-lab.jp/www/portfolio/europe/spain/train/alvia/s120.html"
    ]
  },
  "s130": {
    "id": "s130",
    "atlas": "interiores-06.png",
    "row": 0,
    "before": "assets/interiores/s130-actual.webp",
    "after": "assets/interiores/s130-reformado.webp",
    "layout": "Talgo Patito · coche corto, Turista 2+2",
    "concept": false,
    "references": [
      "https://grupo.renfe.com/es/es/conoce-renfe/nuestros-trenes/s-130",
      "https://europe-train-lab.jp/www/portfolio/europe/spain/train/alvia/s130.html",
      "https://www.renfe.com/es/es/grupo-renfe/comunicacion/renfe-al-dia/sala-de-prensa/renfe-presenta-trabajos-renovacion-alvia-s-setecientos-treinta"
    ]
  },
  "s730": {
    "id": "s730",
    "atlas": "interiores-06.png",
    "row": 1,
    "before": "assets/interiores/s730-actual.webp",
    "after": "assets/interiores/s730-reformado.webp",
    "layout": "Talgo híbrido · coche de viajeros, Turista 2+2",
    "concept": false,
    "references": [
      "https://grupo.renfe.com/es/es/conoce-renfe/nuestros-trenes/s-730-dual",
      "https://www.trenvista.net/noticias/renfe-presenta-la-reforma-de-las-series-130-y-730/"
    ]
  },
  "s106f": {
    "id": "s106f",
    "atlas": "interiores-07.png",
    "row": 0,
    "before": "assets/interiores/s106f-actual.webp",
    "after": "assets/interiores/s106f-reformado.webp",
    "layout": "Avril fijo · caja ancha, Estándar 3+2",
    "concept": false,
    "references": [
      "https://www.renfe.com/es/es/viajar/el-viaje/a-bordo/tipos-asiento"
    ]
  },
  "s106v": {
    "id": "s106v",
    "atlas": "interiores-07.png",
    "row": 1,
    "before": "assets/interiores/s106v-actual.webp",
    "after": "assets/interiores/s106v-reformado.webp",
    "layout": "Avril variable · caja ancha, Estándar 3+2",
    "concept": false,
    "references": [
      "https://www.renfe.com/es/es/grupo-renfe/comunicacion/renfe-al-dia/sala-de-prensa/renfe-pone-venta-61000-billetes-semanales-servicios-alta-velocidad-asturias-galicia",
      "https://www.renfe.com/es/es/viajar/el-viaje/a-bordo/tipos-asiento"
    ]
  }
};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' M€';
export function isRefitted(f){return f?.interiorRefitted===true||/^Reforma /.test(f?.origin||'');}
export function photo(id,reformed=false,extra=''){
 const d=INTERIORS[id];if(!d)throw Error('Este modelo no tiene interior registrado.');
 const path=reformed?d.after:d.before,src=globalThis.TENFE_INTERIOR_IMAGES?.[path]||path;
 return '<img class="refit-photo '+extra+'" src="'+esc(src)+'" alt="'+esc(MODEL[id].name+' · '+(reformed?'interior reformado':'interior de serie'))+'" data-model="'+id+'" data-interior="'+(reformed?'reformado':'actual')+'" loading="lazy" decoding="async" width="768" height="512">';
}
export function comparison(id,currentReformed=false){
 return '<section class="refit-comparison" aria-label="Antes y después de la reforma"><div class="refit-scene" style="--refit-split:50%">'+photo(id,currentReformed,'refit-before')+'<div class="refit-after">'+photo(id,true)+'<i class="refit-stripes" aria-hidden="true"></i></div><i class="refit-divider" aria-hidden="true"><span>↔</span></i><span class="refit-badge current">ACTUAL</span><span class="refit-badge proposed">REFORMADO</span></div><label class="refit-slider"><span>Desliza para comparar</span><input type="range" min="0" max="100" value="50" step="1" data-refit-slider aria-label="Comparar interior actual y reformado"></label></section>';
}
function references(id){
 const d=INTERIORS[id];return '<details class="refit-references"><summary>Ver referencias del interior</summary><p>'+esc(d.layout)+'</p><p>Recreaciones con IA. La propuesta conserva la distribución de asientos, ventanas y pasillo del modelo.</p><ul>'+d.references.map((url,i)=>'<li><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Referencia '+(i+1)+' · '+esc(new URL(url).hostname)+'</a></li>').join('')+'</ul></details>';
}
export function catalogueHTML(){
 return '<div class="refit-catalogue">'+MODELS.map(m=>{const d=INTERIORS[m.id];return '<article><header><span class="kicker">'+esc(m.family)+(d.concept?' · CONCEPTO':'')+'</span><h3>'+esc(m.name)+'</h3></header><div class="refit-photo-pair"><figure>'+photo(m.id,false)+'<figcaption>De serie</figcaption></figure><figure>'+photo(m.id,true)+'<figcaption>Reformado</figcaption></figure></div><p>'+esc(d.layout)+'</p><button class="btn small" data-action="interior-preview" data-id="'+m.id+'">Comparar interiores →</button></article>';}).join('')+'</div>';
}
export function jobsHTML(s){
 const rows=s.refits.slice(-12).reverse();return '<section class="refit-jobs"><h3>El trabajo del taller</h3>'+(!rows.length?'<div class="refit-empty">Elige un lote libre para empezar. Mientras se reforma, sus unidades salen temporalmente del parque.</div>':rows.map(r=>{
 const started=r.started??r.due-5,progress=r.done?100:Math.max(0,Math.min(99,(s.month-started)/Math.max(1,r.due-started)*100));
 return '<article><div>'+photo(r.model,!!r.done)+'</div><div><span class="kicker">'+(r.done?'LISTO PARA CIRCULAR':'EN EL TALLER')+'</span><h4>'+esc(MODEL[r.model].name)+' · '+r.qty+' '+(r.qty===1?'unidad':'unidades')+'</h4><p>'+(r.done?'Interior renovado · unidades devueltas al parque':'Restan '+Math.max(0,r.due-s.month)+' '+(s.tenfe?.game?'turnos':'meses'))+'</p><div class="bar green" role="progressbar" aria-valuenow="'+Math.round(progress)+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+progress+'%"></span></div></div></article>';
 }).join(''))+'</section>';
}
export function pageHTML(s,view='workshop'){
 const jobs=s.refits.filter(r=>!r.done),lots=s.fleet.filter(f=>f.qty>0);
 return '<section class="refit-workshop"><div class="refit-intro"><span class="kicker">TALLER DE MATERIAL</span><h2>Una segunda vida para tus trenes.</h2><p>Renueva asientos, suelo e iluminación y devuelve el material al 98 % de estado. El ancho, la tracción y las plazas siguen siendo los del modelo.</p><div class="refit-overview"><span><b>'+jobs.reduce((n,r)=>n+r.qty,0)+'</b> unidades en reforma</span><span><b>5</b> '+(s.tenfe?.game?'turnos':'meses')+' de taller</span><span><b>12 %</b> del precio por unidad'+(s.tenfe?.game?.tech.includes('contrato')?' · descuento de investigación aplicado':'')+'</span></div></div>'+
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
