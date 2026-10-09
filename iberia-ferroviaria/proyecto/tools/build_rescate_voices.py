"""Graba una toma entera por diálogo del Rescate de Tenfe.

Usa el mismo modelo (Qwen3-TTS 12Hz 0.6B Base, revisión fijada), las mismas nueve
referencias de investigacion/voces/referencias-qwen-3.6.3, la misma gramática de
emociones y el mismo masterizado que las 412 tomas del catálogo principal. No toca
ese catálogo ni su manifiesto. Nunca descarga modelos ni usa síntesis del navegador.

  python build_rescate_voices.py --model DIR --stage DIR [--only ID ...]   # graba lo que falte
  python build_rescate_voices.py --stage DIR --package                      # publica en dist/assets

--package solo copia tomas validadas (texto idéntico, EOS observado, MP3 masterizado
con su SHA-256) a dist/assets/rescate-voces/ y escribe dist/assets/rescate-voices.js.
"""
import argparse
import hashlib
import importlib.util
import json
import random
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent
DIST = PROJECT / 'dist'
REFERENCES = PROJECT.parent / 'investigacion' / 'voces' / 'referencias-qwen-3.6.3'
SPEC = importlib.util.spec_from_file_location('iberia_sentence_provider', HERE / 'build_qwen_voices.py')
provider = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(provider)
core = provider.core
MODEL_REPOSITORY = 'Qwen/Qwen3-TTS-12Hz-0.6B-Base'
MODEL_REVISION = '5d83992436eae1d760afd27aff78a71d676296fc'
MODEL_FILES = {'model.safetensors': '180b3b10eb1c9f1b4db7806d5475bae3071c0243c299d49926bab1da3b6946f6',
               'speech_tokenizer/model.safetensors': '836b7b357f5ea43e889936a3709af68dfe3751881acefe4ecf0dbd30ba571258'}
SEED = 424242
PRECISION = 'mixed-bf16-talker'


def sha_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def load_lines():
    code = "import(process.argv[1]).then(m => console.log(JSON.stringify(m.LINES)))"
    out = subprocess.run(['node', '--input-type=module', '-e', code, (DIST / 'rescate-data.js').as_uri()],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def mastering():
    manifest = json.loads((PROJECT.parent / 'web-source' / 'manifest-source.json').read_text())
    return next(iter(manifest['takes'].values()))['mastering']


def references():
    refs, prompts = {}, json.loads((REFERENCES / 'prompts.json').read_text())['prompts']
    for person in core.ROLES:
        meta = prompts[person]
        audio = REFERENCES / Path(meta['ref_audio']).name
        if sha_file(audio) != meta['sha256']:
            raise ValueError('La referencia ha cambiado: ' + person)
        refs[person] = {'ref_audio': str(audio), 'ref_text': meta['ref_text'], 'sha256': meta['sha256']}
    return refs


def item_of(line_id, line):
    item = {'id': line_id, 'person': line['person'], 'mood': line['mood'], 'text': line['text']}
    item['effective_text'] = provider.effective_text(item)
    item['input_fingerprint'] = core.hash_json({'text': item['text'], 'effective': item['effective_text'], 'person': item['person'],
                                                'mood': item['mood'], 'model': MODEL_REVISION, 'seed': SEED, 'precision': PRECISION})
    return item


def valid(stage, take, item):
    mp3 = stage / (item['id'] + '.mp3')
    return (take and take.get('input_fingerprint') == item['input_fingerprint'] and take.get('validated')
            and take.get('eos_observation', {}).get('eos_found') and mp3.exists() and sha_file(mp3) == take.get('sha256'))


def generate(args, lines):
    stage = args.stage
    stage.mkdir(parents=True, exist_ok=True)
    manifest_path = stage / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'schema': 1, 'takes': {}}
    items = [item_of(i, l) for i, l in lines.items() if not args.only or i in args.only]
    pending = [it for it in items if not valid(stage, manifest['takes'].get(it['id']), it)]
    print(f'{len(items)} diálogos, {len(pending)} por grabar', flush=True)
    if not pending:
        return
    for name, digest in MODEL_FILES.items():
        if sha_file(args.model / name) != digest:
            raise ValueError('Los pesos no coinciden con la revisión fijada: ' + name)
    refs = references()
    import numpy as np
    import soundfile as sf
    import torch
    from qwen_tts import Qwen3TTSModel
    torch.set_num_threads(args.threads)
    torch.set_num_interop_threads(1)
    model = Qwen3TTSModel.from_pretrained(str(args.model), device_map='cpu', dtype=torch.float32,
                                          attn_implementation='sdpa', local_files_only=True, low_cpu_mem_usage=True)
    prompts = {}
    for person in sorted({it['person'] for it in pending}):
        random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
        prompts[person] = model.create_voice_clone_prompt(ref_audio=refs[person]['ref_audio'], ref_text=refs[person]['ref_text'], x_vector_only_mode=False)[0]
    model.model.talker.to(dtype=torch.bfloat16)
    master = mastering()
    manifest.update(model={'repository': MODEL_REPOSITORY, 'revision': MODEL_REVISION, 'files': MODEL_FILES},
                    precision=PRECISION, reference_pack=str(REFERENCES.relative_to(PROJECT.parent)), mastering=master)
    for it in pending:
        cap = provider.planned_token_cap([it], 1024)
        for attempt, seed in enumerate((SEED, SEED + 1, SEED + 2)):
            random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)
            eos_rows = []
            restore = provider.observe_batch(model.model.talker, eos_rows)
            start = time.monotonic()
            try:
                wavs, rate = model.generate_voice_clone(text=[it['effective_text']], language=['Spanish'], voice_clone_prompt=[prompts[it['person']]], max_new_tokens=cap)
            finally:
                restore()
            eos = eos_rows[0] if eos_rows else {'status': 'unknown'}
            if eos.get('eos_found') and rate == 24000:
                break
            print('  sin EOS, reintento', it['id'], seed, flush=True)
        else:
            print('  FALLO', it['id'], flush=True)
            continue
        raw = stage / (it['id'] + '.wav')
        sf.write(str(raw), np.asarray(wavs[0], dtype=np.float32), 24000, subtype='PCM_16')
        record = {'id': it['id'], 'person': it['person'], 'mood': it['mood'], 'text': it['text'], 'effective_text': it['effective_text'],
                  'reference_sha256': refs[it['person']]['sha256'], 'seed': seed, 'attempt': attempt + 1, 'max_new_tokens': cap,
                  'inference_seconds': round(time.monotonic() - start, 1), 'eos_observation': eos, 'raw_sha256': sha_file(raw)}
        record = provider.finish_raw(record, it, str(stage), master)
        manifest['takes'][it['id']] = record
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n')
        print(f"  {it['id']}: {record['duration']:.1f} s en {record['inference_seconds']} s", flush=True)


def package(args, lines):
    stage = args.stage
    manifest = json.loads((stage / 'manifest.json').read_text())
    out = DIST / 'assets' / 'rescate-voces'
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('*.mp3'):
        old.unlink()
    voices, rows = {}, []
    for line_id, line in lines.items():
        it = item_of(line_id, line)
        take = manifest['takes'].get(line_id)
        if not valid(stage, take, it):
            continue
        name = f"{line_id}-{take['sha256'][:12]}.mp3"
        shutil.copyfile(stage / (line_id + '.mp3'), out / name)
        voices[line_id] = {'url': 'assets/rescate-voces/' + name, 'duration': round(take['duration'], 2), 'person': line['person']}
        rows.append({'id': line_id, 'person': line['person'], 'mood': line['mood'], 'text': line['text'], 'file': name,
                     'sha256': take['sha256'], 'duration': take['duration'], 'reference_sha256': take['reference_sha256'],
                     'seed': take['seed'], 'eos_found': True})
    meta = {'schema': 1, 'model': manifest['model'], 'precision': manifest['precision'], 'reference_pack': manifest['reference_pack'],
            'mastering': manifest['mastering'], 'recorded': len(rows), 'expected': len(lines), 'browser_speech_synthesis': False,
            'note': 'Una grabación entera por diálogo, generada localmente; sin escucha humana certificada.', 'takes': rows}
    (out / 'manifest.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1) + '\n')
    body = json.dumps(voices, ensure_ascii=False, separators=(',', ':'))
    (DIST / 'assets' / 'rescate-voices.js').write_text(
        '// Grabaciones enteras de los diálogos del Rescate de Tenfe (una por diálogo). Procedencia en assets/rescate-voces/manifest.json.\n'
        f'// {len(rows)}/{len(lines)} diálogos grabados.\nexport const RESCUE_VOICES = {body};\n')
    print(f'{len(rows)}/{len(lines)} tomas publicadas en {out}')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--model', type=Path)
    parser.add_argument('--stage', type=Path, required=True)
    parser.add_argument('--only', nargs='*', default=[])
    parser.add_argument('--threads', type=int, default=3)
    parser.add_argument('--package', action='store_true')
    args = parser.parse_args(argv)
    lines = load_lines()
    if args.package:
        return package(args, lines)
    if not args.model:
        parser.error('--model es obligatorio para grabar')
    generate(args, lines)


if __name__ == '__main__':
    sys.exit(main())
