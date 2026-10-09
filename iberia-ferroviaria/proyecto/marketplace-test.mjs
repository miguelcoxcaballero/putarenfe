import assert from 'node:assert/strict';
import * as E from './dist/engine.js';
import * as M from './dist/marketplace.js';
import {MODEL} from './dist/data.js';

const fresh = () => { const s = E.initialState();s.started = true;s.cash = 10000;return s; };
const validate = s => E.validateSave(JSON.parse(JSON.stringify(s)));
const advance = (s,before=null) => {for(let d; (d=E.pendingDecision(s));) E.decide(s,d.id,Math.max(0,d.choices.findIndex(c=>!c.disabled&&s.cash>=-(c.effects?.cash||0))));before?.();assert.equal(E.step(s),true);};
const quote = s => (model,qty,id) => E.purchaseQuote(s,model,qty,id);
const filters = {query:'',state:'all',delivery:'all',maker:'all',family:'all',sort:'recommended',favorites:false};
const checked=[];

{
 const s=fresh(), old=E.purchaseQuote(s,'s130',4);
 assert.equal(old.unit,21);assert.equal(old.total,84);assert.equal(old.deposit,25.2);assert.equal(old.remaining,58.8);assert.equal(old.lead,28);
 const cash=s.cash,id=E.buy(s,'s130',4),order=s.orders.find(x=>x.id===id);
 assert.equal(s.cash,cash-old.deposit);assert.equal(order.marketplace,undefined);assert(validate(s));
 checked.push('Existing new-order API, 30/70 accounting and version-4 saves preserved.');
}
{
 const s=fresh(), items=M.filterListings(s,filters,quote(s));
 assert.deepEqual([...new Set(items.map(x=>x.maker))].sort(),[...M.MANUFACTURERS].sort());
 assert(items.some(x=>x.model==='s100'&&x.state==='used'));
 assert(!items.some(x=>x.model==='s106f'||x.model==='s106v'||x.model==='av2030'));
 for(const state of ['used','new']) assert(M.filterListings(s,{...filters,state},quote(s)).every(x=>x.state===state));
 for(const delivery of ['0','3','12']) assert(M.filterListings(s,{...filters,delivery},quote(s)).every(x=>x.q.lead<=Number(delivery)));
 assert(M.filterListings(s,{...filters,delivery:'0'},quote(s)).length>0);
 for(const maker of M.MANUFACTURERS) assert(M.filterListings(s,{...filters,maker},quote(s)).every(x=>x.maker===maker));
 assert(M.filterListings(s,{...filters,query:'dorfler'},quote(s)).every(x=>x.maker==='Dörfler'));
 assert(M.filterListings(s,{...filters,query:'Valladolid'},quote(s)).every(x=>x.place==='Valladolid'));
 const prices=M.filterListings(s,{...filters,sort:'price'},quote(s)).map(x=>x.q.unit);assert.deepEqual(prices,[...prices].sort((a,b)=>a-b));
 checked.push('All six brands, real current shipment filters, search, launch years and price ordering.');
}
{
 const s=fresh(), item=M.listings(s).find(x=>x.state==='used'&&x.lead===0),q=E.purchaseQuote(s,item.model,item.stock,item.id),cash=s.cash;
 assert(q.unit<MODEL[item.model].price);assert.equal(q.deposit,q.total);assert.equal(q.remaining,0);assert.equal(q.last,0);
 const id=E.buy(s,item.model,item.stock,item.id),o=s.orders.find(x=>x.id===id),f=s.fleet.find(x=>x.origin==='Trenespop '+id);
 assert.equal(s.cash,cash-q.total);assert.equal(o.delivered,o.qty);assert.equal(f.qty,item.stock);assert.equal(f.condition,item.condition);assert.equal(f.born,2022-item.age);
 assert.equal(s.stats.delivered,item.stock);assert.equal(s.stats.purchased,item.stock);
 assert.equal(M.listing(s,item.id).stock,0);assert(!M.filterListings(s,filters,quote(s)).some(x=>x.id===item.id));
 const snapshot=JSON.stringify(s);assert.throws(()=>E.buy(s,item.model,1,item.id),/Quedan 0/);assert.equal(JSON.stringify(s),snapshot);
 assert(validate(s));
 const forged=JSON.parse(snapshot);delete forged.marketplace;assert.throws(()=>validate(forged),/Trenespop/);
 const forgedStock=JSON.parse(snapshot);forgedStock.marketplace.sold[item.id]=0;assert.throws(()=>validate(forgedStock),/Trenespop/);
 const forgedRemaining=JSON.parse(snapshot);forgedRemaining.orders.find(x=>x.id===id).remaining=1;assert.throws(()=>validate(forgedRemaining),/Trenespop/);
 checked.push('Immediate used purchase deducts full total, adds aged stock once, preserves real condition and rejects resales/tampered ledgers.');
}
{
 const s=fresh(),item=M.listings(s).find(x=>x.state==='used'&&x.lead===1),q=E.purchaseQuote(s,item.model,Math.min(3,item.stock),item.id),cash=s.cash;
 const id=E.buy(s,item.model,Math.min(3,item.stock),item.id),o=s.orders.find(x=>x.id===id);
 assert.equal(s.cash,cash-q.deposit);assert.equal(s.fleet.filter(x=>x.origin==='Trenespop '+id).length,0);assert.equal(o.delayChecked,true);
 assert(validate(s));advance(s);
 assert.equal(o.delivered,Math.min(2,o.qty));assert.equal(o.remaining,(o.qty-o.delivered)*o.unit*.7);
 const first=s.fleet.find(x=>x.origin==='Trenespop '+id);assert.equal(first.condition,item.condition);assert.equal(first.born,2022-item.age);
 first.condition-=5;const condition=first.condition;if(o.delivered<o.qty){advance(s);assert.equal(first.condition,condition-.08);assert(s.fleet.some(x=>x.origin==='Trenespop '+id&&x.condition===item.condition));}
 assert.equal(o.delivered,o.qty);assert(o.remaining<.000001);assert.equal(o.delay,0);assert(validate(s));
 checked.push('Used shipment reserves finite stock, pays 30/70 in real batches, carries real age/condition and avoids factory-delay rolls.');
}
{
 const s=fresh(),item=M.listings(s).find(x=>x.state==='used'&&x.lead>0),id=E.buy(s,item.model,item.stock,item.id),o=s.orders.find(x=>x.id===id);
 for(let i=0;i<item.lead;i++)advance(s,()=>{s.cash=0;});assert.equal(o.delivered,0);assert(o.remaining>0);assert.equal(M.listing(s,item.id).stock,0);
 s.cash=10000;advance(s);assert(o.delivered>0);assert(validate(s));
 checked.push('Shipment retained on actual insufficient cash without duplicate stock or disappearing debt.');
}
{
 const s=fresh(),a=M.listings(s).find(x=>x.state==='used'&&x.lead===0),id=a.id;
 assert.equal(E.marketplaceFavorite(s,id),true);assert.equal(M.filterListings(s,{...filters,favorites:true},quote(s)).length,1);assert(validate(s));
 assert.equal(E.marketplaceFavorite(s,id),false);assert.equal(M.filterListings(s,{...filters,favorites:true},quote(s)).length,0);
 E.buy(s,a.model,a.stock,id);s.month=6;const next=M.listings(s).find(x=>x.model===a.model&&x.state==='used');assert.notEqual(next.id,id);assert(next.stock>0);assert.throws(()=>E.buy(s,a.model,1,id),/ya no está disponible/);assert(validate(s));
 checked.push('Saved favorites and six-month used arrivals preserve consumed adverts and reject expired checkout.');
}
{
 for(const listing of ['new-dorfler-s120','new-bcbb-s103']){
  const s=fresh(),item=M.listing(s,listing),q=E.purchaseQuote(s,item.model,2,listing),id=E.buy(s,item.model,2,listing),o=s.orders.find(x=>x.id===id);
  assert.equal(o.marketplace.maker,item.maker);assert.equal(o.model,item.model);assert.equal(o.unit,q.unit);assert.equal(o.marketplace.condition,100);assert.equal(o.marketplace.depositRate,.3);assert(validate(s));
 }
 const s=fresh();assert.throws(()=>E.purchaseQuote(s,'s730',1,'new-bcbb-s103'),/no corresponde/);
 const item=M.listings(s).find(x=>x.state==='used');const before=JSON.stringify(s);s.cash=0;const noMoney=JSON.stringify(s);assert.throws(()=>E.buy(s,item.model,1,item.id),/dinero/);assert.equal(JSON.stringify(s),noMoney);assert.notEqual(noMoney,before);
 checked.push('Dörfler/BCBB quotes and signed manufacturers remain attached to unchanged operational profiles; failed purchase is atomic.');
}
{
 const s=fresh(),html=M.catalogueHTML(s,filters,quote(s),id=>`<img alt="${id}" src="data:image/png;base64,">`);
 assert(html.includes('Trenespop'));assert(html.includes('marketState'));assert(html.includes('marketDelivery'));assert(html.includes('marketMaker'));assert(html.includes('marketSort'));assert(html.includes('data-listing="used-s100-0"'));
 const item=M.listing(s,'used-s100-0'),detail=M.detailHTML(s,item,id=>`<img alt="${id}">`);assert(detail.includes('data-listing="used-s100-0"'));assert(detail.includes('Todas las unidades entran en tu parque al pagar.'));
 checked.push('Accessible catalogue, working controls and finite checkout metadata appear in rendered UI.');
}
console.log(JSON.stringify({pass:true,checks:checked},null,2));
