"""Generate independent whole-message recordings without touching the frozen 412-dialogue producer.
The explicit workflow downloads the pinned model into /tmp. Game startup never downloads models.
"""
import argparse
import hashlib
import importlib.util
import json
import random
import shutil
import subprocess
import time
from pathlib import Path

HERE=Path(__file__).resolve().parent
PROJECT=HERE.parent
DIST=PROJECT/'dist'
REFS=PROJECT.parent/'investigacion/voces/referencias-qwen-3.6.3'
spec=importlib.util.spec_from_file_location('narration_provider',HERE/'build_qwen_voices.py')
provider=importlib.util.module_from_spec(spec)
spec.loader.exec_module(provider)
core=provider.core
SEED=424242

def digest(path):
 return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def catalogue():
 code="import {MESSAGES} from './dist/narration-data.js';import {clipId,speechText} from './dist/voice.js';console.log(JSON.stringify(Object.entries(MESSAGES).map(([key,m])=>({...m,key,id:clipId(m.person,m.text),raw:m.text,text:speechText(m.text)}))));"
 rows=json.loads(subprocess.run(['node','--input-type=module','-e',code],cwd=PROJECT,capture_output=True,text=True,check=True).stdout)
 unique={}
 for row in rows:
  row['effective_text']=provider.effective_text(row)
  row['input_fingerprint']=core.hash_json({k:row[k] for k in ('id','person','mood','text','effective_text')})
  if row['id'] in unique:
   old=unique[row['id']]
   if old['person']!=row['person'] or old['text']!=row['text']:raise ValueError('ID collision')
   old['keys'].append(row['key'])
  else:unique[row['id']]={**row,'keys':[row['key']]}
 return sorted(unique.values(),key=lambda x:x['id'])

def prepare(args):
 from huggingface_hub import snapshot_download
 snapshot_download(repo_id=core.MODEL_REPOSITORY,revision=core.MODEL_REVISION,local_dir=str(args.model),allow_patterns=[x['path'] for x in core.MODEL_FILES])
 verified=core.verify_model(args.model)
 print('PINNED_MODEL_VERIFIED',verified['fingerprint'],flush=True)

def valid(stage,take,item):
 return (take and take.get('input_fingerprint')==item['input_fingerprint'] and take.get('validated') is True and take.get('eos_observation',{}).get('eos_found') is True and (stage/(item['id']+'.mp3')).is_file() and digest(stage/(item['id']+'.mp3'))==take.get('sha256'))

def generate(args):
 items=catalogue()
 identity=core.hash_json(items)
 stage=args.stage
 stage.mkdir(parents=True,exist_ok=True)
 target=stage/'manifest.json'
 manifest=json.loads(target.read_text()) if target.exists() else {'schema':1,'takes':{},'catalogue_sha256':identity,'shard':args.shard}
 if manifest['catalogue_sha256']!=identity:raise ValueError('Catalogue changed while producing')
 selected=[row for i,row in enumerate(items) if i%args.shards==args.shard]
 pending=[row for row in selected if not valid(stage,manifest['takes'].get(row['id']),row)]
 print('NARRATION_SHARD',args.shard,'total',len(items),'selected',len(selected),'pending',len(pending),flush=True)
 if not pending:return
 model_info=core.verify_model(args.model)
 ref_pack=json.loads((REFS/'prompts.json').read_text())['prompts']
 refs={}
 for person in sorted({x['person'] for x in pending}):
  meta=ref_pack[person]
  audio=REFS/Path(meta['ref_audio']).name
  if digest(audio)!=meta['sha256']:raise ValueError('Reference changed: '+person)
  refs[person]={**meta,'ref_audio':str(audio)}
 master=json.loads((DIST/'assets/rescate-voces/manifest.json').read_text())['mastering']
 import numpy as np
 import soundfile as sf
 import torch
 from qwen_tts import Qwen3TTSModel
 torch.set_num_threads(3)
 torch.set_num_interop_threads(1)
 torch.use_deterministic_algorithms(True)
 model=Qwen3TTSModel.from_pretrained(str(args.model),device_map='cpu',dtype=torch.float32,attn_implementation='sdpa',local_files_only=True,low_cpu_mem_usage=True)
 prompts={}
 for person,ref in refs.items():
  random.seed(SEED);np.random.seed(SEED);torch.manual_seed(SEED)
  prompts[person]=model.create_voice_clone_prompt(ref_audio=ref['ref_audio'],ref_text=ref['ref_text'],x_vector_only_mode=False)[0]
  print('CAST_READY',person,flush=True)
 model.model.talker.to(dtype=torch.bfloat16)
 manifest.update(model={k:v for k,v in model_info.items() if k!='directory'},precision='mixed-bf16-talker',mastering=master,reference_pack='investigacion/voces/referencias-qwen-3.6.3')
 for index,item in enumerate(pending):
  start=time.monotonic()
  cap=provider.planned_token_cap([item],1024)
  for attempt,seed in enumerate((SEED,SEED+1,SEED+2)):
   random.seed(seed);np.random.seed(seed);torch.manual_seed(seed)
   eos_rows=[]
   restore=provider.observe_batch(model.model.talker,eos_rows)
   try:wavs,rate=model.generate_voice_clone(text=[item['effective_text']],language=['Spanish'],voice_clone_prompt=[prompts[item['person']]],max_new_tokens=cap)
   finally:restore()
   eos=eos_rows[0] if eos_rows else {}
   audio=np.asarray(wavs[0],dtype=np.float32)
   if eos.get('eos_found') and rate==24000 and audio.ndim==1 and np.isfinite(audio).all() and .2<len(audio)/rate<84 and float(np.sqrt(np.mean(audio.astype(np.float64)**2)))>.0001:break
   print('RETRY',item['id'],seed,flush=True)
  else:raise ValueError('No complete finite take: '+item['id'])
  raw=stage/(item['id']+'.wav')
  sf.write(str(raw),audio,rate,subtype='FLOAT')
  record={**item,'reference_sha256':refs[item['person']]['sha256'],'seed':seed,'attempt':attempt+1,'max_new_tokens':cap,'inference_seconds':round(time.monotonic()-start,2),'eos_observation':eos,'raw_sha256':digest(raw),'raw_validated':True,'finite':True,'sample_rate':rate}
  take=provider.finish_raw(record,item,str(stage),master)
  manifest['takes'][item['id']]=take
  target.write_text(json.dumps(manifest,ensure_ascii=False,indent=1)+'\n')
  raw.unlink()
  print('TAKE_OK',args.shard,index+1,'/',len(pending),item['id'],item['person'],round(take['duration'],2),'seconds; inference',record['inference_seconds'],flush=True)
 print('NARRATION_SHARD_COMPLETE',args.shard,len(selected),flush=True)

def package(args):
 items=catalogue()
 identity=core.hash_json(items)
 takes={}
 model=None
 for file in args.stage.rglob('manifest.json'):
  manifest=json.loads(file.read_text())
  if manifest.get('catalogue_sha256')!=identity:raise ValueError('Staged catalogue mismatch')
  model=manifest['model']
  for ident,take in manifest['takes'].items():
   if ident in takes:raise ValueError('Repeated take')
   takes[ident]=(file.parent,take)
 if set(takes)!={x['id'] for x in items}:raise ValueError('Incomplete narration pack: '+str(len(takes))+'/'+str(len(items)))
 out=DIST/'assets/narracion'
 out.mkdir(parents=True,exist_ok=True)
 mapping={}
 records=[]
 for item in items:
  stage,take=takes[item['id']]
  if not valid(stage,take,item):raise ValueError('Invalid whole take '+item['id'])
  name=item['id']+'-'+take['sha256'][:12]+'.mp3'
  shutil.copyfile(stage/(item['id']+'.mp3'),out/name)
  mapping[item['id']]={'url':'assets/narracion/'+name,'duration':take['duration'],'person':item['person']}
  records.append({**take,'file':name})
 meta={'schema':1,'catalogue_sha256':identity,'recorded':len(records),'expected':len(items),'model':model,'precision':'mixed-bf16-talker','reference_pack':'investigacion/voces/referencias-qwen-3.6.3','browser_speech_synthesis':False,'takes':records}
 (out/'manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=1)+'\n')
 (DIST/'assets/narration-voices.js').write_text('// Validated whole-message takes; no sentence fragments or browser synthesis.\nexport const NARRATION_VOICES='+json.dumps(mapping,ensure_ascii=False,separators=(',',':'))+';\n')
 print('NARRATION_PACK_COMPLETE',len(records),flush=True)

def main():
 p=argparse.ArgumentParser()
 p.add_argument('--model',type=Path)
 p.add_argument('--stage',type=Path)
 p.add_argument('--shard',type=int,default=0)
 p.add_argument('--shards',type=int,default=6)
 p.add_argument('--prepare',action='store_true')
 p.add_argument('--package',action='store_true')
 a=p.parse_args()
 if a.prepare:return prepare(a)
 if a.package:return package(a)
 return generate(a)

if __name__=='__main__':main()
