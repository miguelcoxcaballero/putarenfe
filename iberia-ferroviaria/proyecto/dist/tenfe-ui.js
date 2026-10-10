import * as E from './engine.js';
import * as U from './tenfe.js';
import * as T from './tycoon.js';
import {CHARACTERS} from './story.js';
import {faceURL} from './faces.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=(n,d=0)=>Number(n||0).toLocaleString('es-ES',{maximumFractionDigits:d});
  const money=n=>number(n,1)+' M€';
  const button=(label,action,id='',disabled=false,extra='')=>`<button class="btn small" data-action="${action}" data-id="${esc(id)}" ${disabled?'disabled':''} ${extra}>${esc(label)}</button>`;
  export function nextHTML(s) {
    const n=U.nextAction(s);
    return `<div class="tenfe-next"><span>Siguiente</span>${button(n.label,'tenfe-next')}</div>`;
  }
  export function missionHTML(s) {
    const m=U.mission(s);
    if(!m)return '';
    return `<div class="kicker">El rescate · 2027–2034</div><h2>${esc(m.title)}</h2><ul>${m.rows.map(r=>`<li class="${r.ok?'done':''}"><i></i><span>${r.label}</span><span>${r.money?money(r.value):r.percent?number(r.value,1)+' %':number(r.value)+' / '+r.target}</span></li>`).join('')}</ul><p class="small muted">Las decisiones afectan a tu misma red, flota y caja.</p>`;
  }
  export function supportHTML(s) {
    const u=s.tenfe,days=Math.max(0,(U.electionMonth(s)-s.month)*30-(s.ops?.day||1)+1);
    const rows=[['riders','Viajeros',34],['territory','Territorios',20],['staff','Plantilla',20],['treasury','Economía',26]];
    return `<div class="tenfe-title"><span class="kicker">Las urnas miran tu red</span><h2>Un país que vota</h2></div>
      <dl class="figures"><div><dt>Encuesta de seis meses</dt><dd class="${U.forecast(s)>=50?'pos':'neg'}">${number(U.forecast(s),1)} %</dd></div><div><dt>Para renovar</dt><dd>50 %</dd></div><div><dt>Próxima elección</dt><dd>${E.dateOf(U.electionMonth(s)-1)}</dd></div></dl>
      <p class="small">El voto es la media de los últimos seis cierres. ${number(days)} días aproximados para las urnas.</p>
      <div class="tenfe-group-list">${rows.map(([id,name,weight])=>`<div><span><strong>${name}</strong><small>${weight} % del voto</small></span><div class="meter"><span style="width:${s.tycoon.groups[id]}%"></span></div><b>${number(s.tycoon.groups[id])} %</b></div>`).join('')}</div>
      <p class="small muted">Viajeros: satisfacción y tarifas. Plantilla: maquinistas y mantenimiento. Territorios: servicios abiertos. Economía: margen y caja.</p>
      <h3>Mandatos</h3>${u.elections.length?`<div class="rows">${u.elections.map(e=>`<div><span>${e.won?'✓':'×'}</span><div><h3>${E.dateOf(e.month-1)}</h3><p>${e.won?'Mandato renovado':'Derrota electoral'}</p></div><b>${number(e.support,1)} %</b></div>`).join('')}</div>`:'<p class="empty">Las primeras elecciones llegan al cerrar diciembre de 2030.</p>'}`;
  }
  export function pactsHTML(s) {
    const u=s.tenfe,full=u.pacts.filter(p=>p.status==='active').length>=2;
    return `<div class="tenfe-title"><span class="kicker">Beneficios con compromisos</span><h2>Dos pactos, muchas opiniones</h2></div>
      <p class="small">Los acuerdos pagan cuando cumples en tu red. Hasta dos activos.</p>
      <div class="tenfe-pacts">${U.PACTS.map(d=>{
        const p=u.pacts.find(p=>p.id===d.id),person=CHARACTERS[d.person];
        const reason=!u.milestones.length?'Primer hito pendiente':full?'Ya hay dos activos':s.cash<d.cost?'Falta caja':s.ended?'Mandato terminado':'';
        return `<article><img src="${faceURL(d.person,'happy')}" alt="${esc(person.name)}" width="56" height="72"><div><span class="kicker">${esc(person.name)}</span><h3>${d.name}</h3><p>${d.requirement}</p>
          <small>${d.advance?'Anticipo '+money(d.advance):'Coste '+money(d.cost)} · recompensa ${money(d.reward)} · ${d.months} meses</small>
          ${p?`<div class="tenfe-pact-state ${p.status==='lost'?'neg':'pos'}">${p.status==='active'?`${p.kept}/3 cierres · vence ${E.dateOf(p.until)}`:p.status==='won'?'Cumplido':'Incumplido'}</div>`:''}</div>
          <div>${p?p.status==='active'?button('Ver siguiente paso','tenfe-next'):'':button('Firmar pacto','tenfe-pact',d.id,!!reason)}
          ${!p&&reason?`<small class="action-reason">${reason}</small>`:''}</div></article>`;
      }).join('')}</div>`;
  }
  export function milestonesHTML(s) {
    const u=s.tenfe,b=E.balance(s);
    return `<div class="tenfe-title"><span class="kicker">Crece jugando</span><h2>La red se gana</h2></div>
      <dl class="figures"><div><dt>Viajeros / mes</dt><dd>${number(b.passengers)}</dd></div><div><dt>Hitos alcanzados</dt><dd>${u.milestones.length} / 4</dd></div></dl>
      <p class="small">Los objetivos crecen desde la red que recibiste. Se comprueban al cerrar el mes.</p>
      <div class="tenfe-hitos">${U.MILESTONES.map((m,i)=>{
        const target=Math.ceil(u.baseline*m.factor),done=u.milestones.includes(m.id);
        return `<article class="${done?'done':''}"><span class="tenfe-step">${done?'✓':String(i+1).padStart(2,'0')}</span><div><h3>${m.name}</h3><p>${m.unlock} · +${m.reward} M€</p><div class="meter"><span style="width:${Math.min(100,b.passengers/target*100)}%"></span></div><small>${number(Math.min(b.passengers,target))} / ${number(target)} viajeros por mes</small></div></article>`;
      }).join('')}</div>`;
  }
  export function megaHTML(s) {
    return `<div class="tenfe-title"><span class="kicker">Construye algo que se note</span><h2>Tres fases, un cambio real</h2></div>
      <p class="small">Cada fase se paga al encargarla. Un equipo dirige una fase a la vez.</p>
      <div class="tenfe-megas">${U.MEGAS.map(d=>{
        const p=s.tenfe.megas.find(p=>p.id===d.id),q=U.megaQuote(s,d.id),active=s.tenfe.megas.some(p=>p.due);
        const reason=q.reason||(active?'Equipo de proyecto ocupado':s.cash<q.cost?'Falta caja':s.ended?'Mandato terminado':'');
        return `<article><img src="assets/rescate/${d.image}.webp" alt="" width="640" height="360"><div><h3>${d.name}</h3><p>${d.effect}</p>
          <div class="tenfe-phase">${['Permisos','Construcción','Pruebas'].map((label,i)=>`<span class="${i<(p?.stage||0)?'done':i===(p?.stage||0)?'now':''}">${label}</span>`).join('')}</div>
          <small>${p?.due?'Termina '+E.dateOf(p.due):q.stage===3?'En servicio':q.phase+' · '+money(q.cost)+' · '+q.months+' meses'} · pagado ${money(p?.paid||0)}</small></div>
          <div>${button(q.stage===3?'Terminado':p?.due?'En marcha':'Encargar fase','tenfe-mega',d.id,!!reason)}
          ${reason&&q.stage!==3?`<small class="action-reason">${reason}</small>`:''}</div></article>`;
      }).join('')}</div>`;
  }
  export function scandalHTML(s) {
    const c=s.tenfe.scandal;
    return `<div class="tenfe-title"><span class="kicker">El precio del atajo</span><h2>Las cloacas</h2></div>
      <p>Una adjudicación amañada aporta 45 M€ ahora. La inspección encuentra el expediente seis meses después: Hacienda −20, Viajeros y Gobierno −15. A los doce meses, 60 M€ de restitución y multa, y reputación −12.</p>
      ${c?`<dl class="figures"><div><dt>Dinero recibido</dt><dd>45 M€</dd></div><div><dt>Expediente</dt><dd>${c.exposed?'Público':'En revisión'}</dd></div><div><dt>Inspección</dt><dd>${E.dateOf(c.from+6+c.delay)}</dd></div></dl>
        <div class="toolbar">${button('Restituir 45 M€','tenfe-restitute','',s.cash<45||s.ended)}${button('Revisión · 8 M€','tenfe-lawyer','',!!c.delay||s.cash<8||s.ended)}</div>
        <p class="small">Restituir cierra el expediente y resta 4 a Hacienda. La revisión aplaza tres meses la inspección y la sentencia.</p>`:
        `<div class="toolbar">${button('Aceptar el atajo','tenfe-shortcut','',s.ended||s.month<s.tenfe.cooldown)}</div>${s.month<s.tenfe.cooldown?`<p class="small">Expedientes bajo revisión hasta ${E.dateOf(s.tenfe.cooldown)}.</p>`:''}`}`;
  }
  export function reportHTML(s, report = s.tenfe.reports[0]) {
    if(!report)return '<p class="empty">Tu primer informe llega al cerrar el mes.</p>';
    return `<div class="tenfe-title"><span class="kicker">${E.dateOf(report.month)}</span><h2>Así cambió tu compañía</h2></div>
      <dl class="figures"><div><dt>Resultado</dt><dd class="${report.net>=0?'pos':'neg'}">${money(report.net)}</dd></div><div><dt>Caja final</dt><dd>${money(report.cash)}</dd></div><div><dt>Viajeros</dt><dd>${number(report.passengers)}</dd></div><div><dt>Puntualidad</dt><dd>${number(report.punctuality,1)} %</dd></div></dl>
      <div class="tenfe-report-news">${report.news.map(n=>`<div><strong>${esc(n.title)}</strong><p>${esc(n.body)}</p></div>`).join('')}</div>
      <div class="tenfe-report-foot"><span>${report.active} servicios · ${report.orders} pedidos pendientes</span><b>Apoyo ${number(report.support,1)} %</b></div>`;
  }
  export function forecastHTML(s) {
    const b=E.balance(s),orders=s.orders.filter(o=>!o.historical&&o.delivered<o.qty),three=s.cash+b.net*3;
    const obligations=orders.filter(o=>o.next<=s.month+3).reduce((sum,o)=>sum+Math.min(o.qty-o.delivered,Math.max(0,4-(o.next-s.month))*2)*o.unit*(1-(o.marketplace?.depositRate??.3)),0);
    return `<h2 class="section">Tres meses por delante</h2><dl class="figures"><div><dt>Caja proyectada</dt><dd class="${three-obligations>=0?'pos':'neg'}">${money(three-obligations)}</dd></div><div><dt>Entregas previstas</dt><dd>${money(obligations)}</dd></div></dl>
      <p class="small">Estimación con el margen actual y los lotes de pedidos previstos en tres meses. No incluye nuevas compras, averías ni recompensas por cumplir objetivos.</p>`;
  }
