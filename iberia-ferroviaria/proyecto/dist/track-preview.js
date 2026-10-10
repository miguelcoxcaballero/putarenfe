
import * as I from './infra.js';
export const GAUGES=['ib','std','mixto'];
export const POWERS=['no','3kv','25kv'];
export const LANES=[1,2,3];
export const gaugeName={ib:'Ibérico · 1.668 mm',std:'Estándar · 1.435 mm',mixto:'Mixto · tercer carril'};
export const powerName={no:'Sin catenaria','3kv':'Convencional · 3 kV','25kv':'Alta velocidad · 25 kV'};
export const laneName={1:'Vía única',2:'Vía doble',3:'Vía triple'};
export const configurations=LANES.flatMap(lanes=>POWERS.flatMap(e=>GAUGES.map(g=>({g,e,lanes}))));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const normalized=st=>({g:st?.g||'ib',e:st?.e||'no',lanes:st?.lanes||1});
export const label=st=>laneName[st.lanes]+' · '+gaugeName[st.g]+' · '+powerName[st.e];
export function photo(st,extra=''){
 const x=normalized(st),col=GAUGES.indexOf(x.g),row=POWERS.indexOf(x.e);
 return '<div class="track-photo '+extra+'" role="img" aria-label="'+esc(label(x))+'" data-gauge="'+x.g+'" data-power="'+x.e+'" data-lanes="'+x.lanes+'" style="--track-column:'+col*50+'%;--track-row:'+row*50+'%;--track-image:url(assets/vias/via-'+x.lanes+'.png)"></div>';
}
export function resulting(st,kind){return {...normalized(st),...(kind==='mixed'?{g:'mixto'}:kind==='standard'?{g:'std'}:kind==='electrify'?{e:'25kv'}:{})};}
export function comparison(before,after,options={}){
 const a=normalized(before),b=normalized(after),changed=label(a)!==label(b);
 return '<section class="track-comparison" aria-label="Comparación de la vía actual y la mejora"><div class="track-scene">'+photo(a,'track-before')+(changed?'<div class="track-proposal">'+photo(b,'track-after')+'<div class="track-yellow-bars" aria-hidden="true"></div><span class="track-badge">PREVIEW DE LA MEJORA</span></div>':'')+'<span class="track-current-label">VÍA ACTUAL</span></div><div class="track-captions"><div><small>Ahora</small><strong>'+esc(label(a))+'</strong></div><div><small>'+ (changed?'Después de la obra':'Configuración actual')+'</small><strong>'+esc(label(b))+'</strong></div></div><p class="small muted">Ilustración de la configuración. La ubicación y geometría reales del tramo se mantienen en el mapa.</p></section>';
}
export function designer(s,id,choice=null){
 const st=normalized(s.infra.t[id]),selected=choice||st;
 return '<section class="track-designer" data-track-id="'+esc(id)+'">'+comparison(st,selected)+'<h3>Diseña la mejora</h3><p class="small">Compara ancho, electrificación y número de vías antes de contratar.</p>'+
 [['lanes',LANES,laneName],['g',GAUGES,gaugeName],['e',POWERS,powerName]].map(([key,values,names])=>'<fieldset class="track-options"><legend>'+({lanes:'Número de vías',g:'Ancho',e:'Catenaria'})[key]+'</legend><div>'+values.map(v=>'<button type="button" class="'+(selected[key]===v?'selected':'')+'" data-action="track-select" data-key="'+key+'" data-value="'+v+'" aria-pressed="'+(selected[key]===v)+'">'+esc(names[v])+'</button>').join('')+'</div></fieldset>').join('')+'</section>';
}
export function quote(s,id,desired){
 const before=normalized(s.infra.t[id]),d=I.tramoDef(s,id),after=normalized(desired);
 if(!d||!s.infra.t[id]?.b)throw Error('La vía debe estar construida.');
 if(!GAUGES.includes(after.g)||!POWERS.includes(after.e)||!LANES.includes(after.lanes))throw Error('Configuración de vía inválida.');
 if(label(before)===label(after))throw Error('Esta es la configuración actual. Elige una mejora.');
 if(after.lanes<before.lanes)throw Error('La mejora debe conservar o aumentar el número de vías.');
 if(POWERS.indexOf(after.e)<POWERS.indexOf(before.e))throw Error('La mejora debe conservar o aumentar la electrificación.');
 if(before.g!=='ib'&&after.g==='ib')throw Error('Conserva el ancho estándar o añade ancho mixto.');
 if(s.projects.some(p=>!p.done&&p.type==='tramo'&&p.target===id))throw Error('Hay una obra en marcha en este tramo.');
 const gauge=before.g!==after.g,electric=before.e!==after.e,tracks=after.lanes-before.lanes;
 const cost=Math.round((gauge?8+d.km*.45:0)+(electric?6+d.km*.42:0)+(tracks?tracks*(12+d.km*.8):0));
 const months=s.tenfe?.game?Math.max(1,Math.ceil((2+d.km/80+tracks)*(s.tenfe.game.tech.includes('bateadora')?.8:1))):Math.ceil(8+d.km/14+tracks*8);
 return {before,after,cost,months,closes:gauge&&after.g!=='mixto',label:'Configuración de vía',affected:[]};
}
export function start(s,E,id,desired){
 E.ensurePlaying(s);const q=quote(s,id,desired);
 if(s.tenfe?.game&&s.projects.filter(p=>!p.done).length+s.tenfe.megas.filter(p=>p.due).length>=3)throw Error('Las tres cuadrillas están ocupadas.');
 E.spend(s,q.cost);
 const affected=s.routes.filter(r=>r.active&&E.routeUses(s,r,id)),job='w-configuration-'+id+'-'+s.nextId++;
 s.projects.push({id:job,type:'tramo',work:'configuration',target:id,configuration:q.after,closes:q.closes,started:s.month,due:s.month+q.months,originalDue:s.month+q.months,cost:q.cost,done:false,delay:0});
 if(q.closes)for(const r of affected){r.active=false;r.fleet=null;r.units=0;r.cut=job;}
 s.infra.ver++;E.log(s,'Mejora adjudicada',I.tramoDef(s,id).name+' · '+label(q.after));return job;
}
