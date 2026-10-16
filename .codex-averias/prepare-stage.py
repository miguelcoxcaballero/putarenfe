import importlib.util
import json
import shutil
from pathlib import Path

project=Path.cwd()
spec=importlib.util.spec_from_file_location('narration',project/'tools/build_narration_voices.py')
producer=importlib.util.module_from_spec(spec);spec.loader.exec_module(producer)
stage=project.parent/'investigacion/voces/narracion-averias'
stage.mkdir(parents=True,exist_ok=True)
old_path=project/'dist/assets/narracion/manifest.json'
old=json.loads(old_path.read_text())
items=producer.catalogue();by_id={r['id']:r for r in items}
assert len(items)==130
assert old['recorded']==old['expected']==126
assert old['precision']=='mixed-bf16-talker'
assert old['model']['fingerprint']=='3db3533efbdebdb25290007f64a4ec50b67c1661c0e4c1191db644b43803aeff'
refs=json.loads((producer.REFS/'prompts.json').read_text())['prompts']
takes={};preserved=[]
for take in old['takes']:
 item=by_id[take['id']]
 assert take['reference_sha256']==refs[take['person']]['sha256']
 assert take['input_fingerprint']==item['input_fingerprint']
 assert take['seed'] in (424242,424243,424244)
 assert take['raw_validated'] is True and take['finite'] is True
 source=old_path.parent/take['file']
 shutil.copyfile(source,stage/(take['id']+'.mp3'))
 assert producer.valid(stage,take,item)
 takes[take['id']]=take
 preserved.append({'id':take['id'],'file':take['file'],'sha256':take['sha256'],'bytes':source.stat().st_size,'duration':take['duration']})
pending=[r for r in items if r['id'] not in takes]
assert {r['key'] for r in pending}=={'breakdown-alert','breakdown-aume','breakdown-abandon','breakdown-ownbus'}
manifest={'schema':1,'catalogue_sha256':producer.core.hash_json(items),'shard':0,'model':old['model'],'precision':old['precision'],'mastering':old['takes'][0]['mastering'],'reference_pack':old['reference_pack'],'takes':takes}
(stage/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=1)+'\n')
report={'schema':1,'old_manifest_sha256':producer.digest(old_path),'old_catalogue_sha256':old['catalogue_sha256'],'new_catalogue_sha256':manifest['catalogue_sha256'],'preserved_count':len(preserved),'pending_count':len(pending),'preserved':preserved,'pending':[{'key':r['key'],'id':r['id'],'person':r['person'],'raw':r['raw'],'mood':r['mood'],'effective_text':r['effective_text']} for r in pending]}
(stage/'migration-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=1)+'\n')
print('STAGE_PREPARED preserved=126 pending=4; the frozen 412-dialogue producer is untouched',flush=True)
