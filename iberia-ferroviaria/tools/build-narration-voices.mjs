import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function buildNarrationVoices(project,output){
 const dist=path.join(project,'dist'),dir=path.join(dist,'assets/narracion');
 const {MESSAGES}=await import(pathToFileURL(path.join(dist,'narration-data.js')).href);
 const {clipId,speechText}=await import(pathToFileURL(path.join(dist,'voice.js')).href);
 const {NARRATION_VOICES}=await import(pathToFileURL(path.join(dist,'assets/narration-voices.js')).href);
 const meta=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 const refs=JSON.parse(fs.readFileSync(path.join(project,'../investigacion/voces/referencias-qwen-3.6.3/prompts.json'),'utf8')).prompts;
 const expected=new Map();
 for(const [key,m]of Object.entries(MESSAGES)){
  const id=clipId(m.person,m.text);assert(m.text.trim()&&refs[m.person],'every message has a known speaker');
  if(expected.has(id))assert.deepEqual([expected.get(id).person,expected.get(id).text],[m.person,m.text],'no colliding message IDs');
  else expected.set(id,{...m,id,key});
 }
 assert.equal(meta.expected,expected.size);assert.equal(meta.recorded,expected.size);
 assert.equal(meta.takes.length,expected.size);assert.equal(meta.browser_speech_synthesis,false);
 assert.equal(meta.model.repository,'Qwen/Qwen3-TTS-12Hz-0.6B-Base');
 assert.equal(meta.model.revision,'5d83992436eae1d760afd27aff78a71d676296fc');
 const frozen=JSON.parse(fs.readFileSync(path.join(project,'../web-source/source-release.json'),'utf8'));
 assert.equal(meta.model.fingerprint,frozen.modelFingerprint,'same pinned cast model');
 assert.equal(meta.model.files.length,13);assert.equal(meta.precision,'mixed-bf16-talker');
 const write=(url,bytes)=>{const file=path.join(output,url);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);};
 const assets=[],recordings=[],rows=[],dialogues={};
 for(const take of meta.takes){
  const m=expected.get(take.id);assert(m,'no obsolete message recording');expected.delete(take.id);
  assert.equal(take.person,m.person);assert.equal(take.raw,m.text);assert.equal(take.text,speechText(m.text));
  assert.equal(take.reference_sha256,refs[m.person].sha256);
  assert.equal(take.validated,true);assert.equal(take.raw_validated,true);assert.equal(take.finite,true);
  assert.equal(take.eos_observation.eos_found,true);assert.equal(take.sample_rate,24000);
  assert(Number.isFinite(take.duration)&&take.duration>.2&&take.duration<84);
  assert(take.mp3_true_peak_dbfs<=take.mastering.maximum_true_peak_dbfs);
  assert.equal(take.file,take.id+'-'+take.sha256.slice(0,12)+'.mp3');
  const input=path.join(dir,take.file);assert(!fs.lstatSync(input).isSymbolicLink());
  const bytes=fs.readFileSync(input);assert.equal(sha(bytes),take.sha256,'whole recording bytes');
  const url='assets/narracion/'+take.file;assert.equal(NARRATION_VOICES[take.id].url,url);
  write(url,bytes);const record={id:take.id,person:take.person,kind:'character-narration',url,bytes:bytes.length,sha256:take.sha256,duration:take.duration,referenceSHA256:take.reference_sha256};
  assets.push(record);recordings.push(record);dialogues[take.id]={url};
  rows.push({id:take.id,person:take.person,mood:m.mood,kind:'Narración del equipo',title:(m.text.split(/[.!?]/,1)[0].slice(0,85)),messageKey:m.key,text:m.text,available:true,duration:take.duration,sha256:take.sha256});
 }
 assert.equal(expected.size,0,'every message has a complete take');
 assert.equal(Object.keys(NARRATION_VOICES).length,recordings.length);
 const manifestBytes=fs.readFileSync(path.join(dir,'manifest.json')),url='assets/narracion/manifest.json';
 write(url,manifestBytes);assets.push({url,bytes:manifestBytes.length,sha256:sha(manifestBytes),kind:'character-narration-manifest'});
 return {assets,recordings,rows,dialogues,messages:recordings.length,aliases:Object.keys(MESSAGES).length,characters:[...new Set(recordings.map(r=>r.person))]};
}
