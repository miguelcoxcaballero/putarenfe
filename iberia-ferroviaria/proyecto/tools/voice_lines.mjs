import {INDUCTION_STAGES} from '../dist/induction.js';
import {ENCOUNTERS} from '../dist/encounters.js';
import {ARCS} from '../dist/tycoon.js';
import {CHAPTERS, DECISIONS, EVENTS} from '../dist/story.js';
import {sentences, speechText, clipId} from '../dist/voice.js';
// Prioriza la primera partida y conserva la emoción del texto para la interpretación.
const scene=(person,text,mood='happy',priority=5)=>({person,text,mood,priority});
const tutorial=INDUCTION_STAGES.flatMap(s=>[
 scene(s.briefing[0].who,s.briefing[0].text,s.briefing[0].mood,1),
 ...s.debrief.map(x=>scene(x.who,x.text,x.mood,1)),
 ...s.briefing.slice(1).map(x=>scene(x.who,x.text,x.mood,2)),
]);
const feedback=INDUCTION_STAGES.flatMap(s=>(s.choice?.options||[]).map(o=>scene(s.briefing[0].who,o.feedback,'determined',3)));
const lines=[...DECISIONS.filter(d=>d.at===0).map(d=>scene(d.person,d.body,d.mood,0)),...tutorial,...feedback,
 ...CHAPTERS.map(c=>scene(c.speaker,c.text,c.mood,4)),...ARCS.map(a=>scene(a[1],a[2],'worried',4)),
 ...DECISIONS.filter(d=>d.at!==0).map(d=>scene(d.person,d.body,d.mood,5)),...EVENTS.map(e=>scene(e.person,e.body,e.mood,5)),
 ...ENCOUNTERS.map(e=>scene(e.person,e.body,e.mood,6))];
const seen=new Map(),out=[];
for(const {person,text,mood,priority} of lines)for(const raw of sentences(text)){
 const id=clipId(person,raw),old=seen.get(id);
 if(old){if(!old.moods.includes(mood))old.moods.push(mood);continue;}
 const item={id,person,raw,text:speechText(raw),mood,moods:[mood],priority};seen.set(id,item);out.push(item);
}
process.stdout.write(JSON.stringify(out,null,1)+'\n');
console.error(`${lines.length} diálogos, ${out.length} frases.`);
