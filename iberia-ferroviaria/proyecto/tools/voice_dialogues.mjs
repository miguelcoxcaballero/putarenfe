import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {INDUCTION_STAGES} from '../dist/induction.js';
import {ENCOUNTERS} from '../dist/encounters.js';
import {ARCS} from '../dist/tycoon.js';
import {CHAPTERS, DECISIONS, EVENTS} from '../dist/story.js';
import {speechText, clipId} from '../dist/voice.js';

// One complete body is one recording: sentence boundaries are never takes.
const hash=text=>createHash('sha256').update(text,'utf8').digest('hex');
const scene=(kind,source,person,raw,mood='happy',priority=5)=>({
 id:clipId(person,raw),person,raw,text:speechText(raw),mood,priority,kind,source,
 canonical_sha256:hash(raw),speech_sha256:hash(speechText(raw)),
});
const initial=DECISIONS.filter(d=>d.at===0).map(d=>scene('decision',`decision:${d.id}`,d.person,d.body,d.mood,0));
const tutorial=INDUCTION_STAGES.flatMap(s=>[
 scene('induction',`induction:${s.id}:briefing:0`,s.briefing[0].who,s.briefing[0].text,s.briefing[0].mood,1),
 ...s.debrief.map((x,i)=>scene('induction',`induction:${s.id}:debrief:${i}`,x.who,x.text,x.mood,1)),
 ...s.briefing.slice(1).map((x,i)=>scene('induction',`induction:${s.id}:briefing:${i+1}`,x.who,x.text,x.mood,2)),
]);
const feedback=INDUCTION_STAGES.flatMap(s=>(s.choice?.options||[]).map(o=>
 scene('feedback',`feedback:${s.id}:${o.id}`,s.briefing[0].who,o.feedback,'determined',3)));
export const DIALOGUE_CATALOGUE=[...initial,...tutorial,...feedback,
 ...CHAPTERS.map((c,i)=>scene('chapter',`chapter:${c.id??i}`,c.speaker,c.text,c.mood,4)),
 ...ARCS.map((a,i)=>scene('arc',`arc:${i}`,a[1],a[2],'worried',4)),
 ...DECISIONS.filter(d=>d.at!==0).map(d=>scene('decision',`decision:${d.id}`,d.person,d.body,d.mood,5)),
 ...EVENTS.map(e=>scene('event',`event:${e.id}`,e.person,e.body,e.mood,5)),
 ...ENCOUNTERS.map(e=>scene('encounter',`encounter:${e.id}`,e.person,e.body,e.mood,6)),
];
const counts={induction:36,feedback:14,chapter:5,arc:5,decision:15,event:22,encounter:315};
for(const [kind,count] of Object.entries(counts))if(DIALOGUE_CATALOGUE.filter(x=>x.kind===kind).length!==count)throw Error(`Unexpected ${kind} dialogue count`);
for(const field of ['id','source'])if(new Set(DIALOGUE_CATALOGUE.map(x=>x[field])).size!==DIALOGUE_CATALOGUE.length)throw Error(`Duplicate complete-dialogue ${field}`);
if(DIALOGUE_CATALOGUE.length!==412)throw Error('Unexpected complete dialogue catalogue size');
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 process.stdout.write(JSON.stringify(DIALOGUE_CATALOGUE,null,1)+'\n');
 console.error(`${DIALOGUE_CATALOGUE.length} complete continuous dialogues, nine voices.`);
}
