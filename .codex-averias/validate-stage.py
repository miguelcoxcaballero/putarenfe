import importlib.util,json
from pathlib import Path
project=Path.cwd()
spec=importlib.util.spec_from_file_location('narration',project/'tools/build_narration_voices.py')
producer=importlib.util.module_from_spec(spec);spec.loader.exec_module(producer)
stage=project.parent/'investigacion/voces/narracion-averias'
migration=json.loads((stage/'migration-report.json').read_text())
manifest=json.loads((stage/'manifest.json').read_text())
pack=json.loads((project/'dist/assets/narracion/manifest.json').read_text())
assert pack['recorded']==pack['expected']==130
new={t['id']:t for t in pack['takes']}
for old in migration['preserved']:
 current=new[old['id']]
 assert current['sha256']==old['sha256'] and current['duration']==old['duration']
 assert producer.digest(project/'dist/assets/narracion'/current['file'])==old['sha256']
results=[]
for item in migration['pending']:
 take=new[item['id']]
 assert producer.valid(stage,take,{**item,'input_fingerprint':take['input_fingerprint']})
 assert take['seed'] in (424242,424243,424244) and take['eos_observation']['eos_found']
 assert take['sample_rate']==24000 and take['raw_validated'] and take['finite']
 assert take['mp3_true_peak_dbfs']<=-1.5 and take['mp3_lufs']<=-20.95
 metrics=producer.core.decode_metrics(project/'dist/assets/narracion'/take['file'])
 assert metrics['codec']=='mp3' and metrics['peak']<1 and metrics['duration']>0
 results.append({**item,'file':take['file'],'duration':take['duration'],'bytes':(stage/(take['id']+'.mp3')).stat().st_size,'sha256':take['sha256'],'seed':take['seed'],'eos':take['eos_observation'],'mp3_lufs':take['mp3_lufs'],'mp3_true_peak_dbfs':take['mp3_true_peak_dbfs']})
report={'schema':1,'recorded':130,'preserved':126,'new':results,'precision':pack['precision'],'model':pack['model'],'reference_pack':pack['reference_pack'],'mastering':manifest['mastering'],'literal_texts_preserved':True}
(stage/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=1)+'\n')
print('VERIFIED_130:'+json.dumps({'preserved':126,'new':results},ensure_ascii=False),flush=True)
