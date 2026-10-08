"""Stage one continuous Qwen recording per complete, unchanged game dialogue.

The legacy sentence catalogue/provider/reference pack remain untouched. Dry runs
verify all 412 live bodies and pinned local inputs without neural imports. Exact
--clip selectors permit a controlled audition; only --package with the complete
closed catalogue may publish DIALOGUES. Generation requires explicit --generate.
"""
import argparse
import base64
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys

SPEC = importlib.util.spec_from_file_location('iberia_sentence_provider', Path(__file__).with_name('build_qwen_voices.py'))
provider = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(provider)
core = provider.core
MIXED_SPEC = importlib.util.spec_from_file_location('iberia_continuous_mixed', Path(__file__).with_name('qwen_dialogue_mixed.py'))
mixed = importlib.util.module_from_spec(MIXED_SPEC)
MIXED_SPEC.loader.exec_module(mixed)
BASE_VALID_RAW = provider.valid_raw
BASE_VALID_TAKE = provider.valid_take
DEFAULT_ASSET = core.PROJECT / 'dist' / 'assets' / 'voice-dialogues.js'
SOURCE_COUNTS = {'induction': 36, 'feedback': 14, 'chapter': 5, 'arc': 5,
                 'decision': 15, 'event': 22, 'encounter': 315}
# Eight unchanged 3.6.2 references and the ROOT-approved real Torrente sample.
REFERENCE_PACK_SHA256 = '46ba5d81fc8a6f657f5f1cdab3951a39956bfd86a7fcc0798006ea8fa9c470bd'
PRESIDENT_REFERENCE_SHA256 = 'cedd0014d333783dbf4917d6a9433670e7bc312159fba974ee66a82bc1664ca4'


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    for name in ('model', 'references', 'catalogue', 'output'):
        parser.add_argument('--' + name, required=True, type=Path)
    parser.add_argument('--clip', action='append', default=[], help='Exact full-body IDs; the plan still verifies all 412 bodies')
    parser.add_argument('--batch-size', type=int, default=1, help='1–4 complete dialogue rows per inference; never sentence fragments')
    parser.add_argument('--precision', choices=('fp32', 'mixed-bf16-talker'), default='fp32',
                        help='Explicit precision; mixed keeps all reference prompts, speaker encoder and codec FP32')
    parser.add_argument('--retry-seeds-file', type=Path,
                        help='Explicit map of stable complete-body batch IDs to replacement seeds; no automatic ASR retries')
    parser.add_argument('--seed', type=int, default=424242)
    parser.add_argument('--max-new-tokens', type=int, default=1024)
    parser.add_argument('--max-priority', type=int, help='Optional initial production pass; full packaging prohibits this selector')
    parser.add_argument('--generate', action='store_true', help='Explicitly run local inference after the production plan is approved')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--package', action='store_true')
    parser.add_argument('--asset', type=Path, default=DEFAULT_ASSET)
    return parser.parse_args(argv)


def stable_clip_id(person, speech_text):
    value = 0x811c9dc5
    for char in person + '|' + speech_text:
        value = ((value ^ ord(char)) * 0x01000193) & 0xffffffff
    digits = '0123456789abcdefghijklmnopqrstuvwxyz'
    result = ''
    while value:
        value, remainder = divmod(value, 36)
        result = digits[remainder] + result
    return result or '0'


def text_sha(text):
    return core.hashlib.sha256(text.encode('utf-8')).hexdigest()


def live_catalogue():
    executable = os.environ.get('NODE_BINARY') or core.shutil.which('node')
    if not executable:
        raise ValueError('Node is required to verify the live full-body catalogue')
    command = [executable, str(Path(__file__).with_name('voice_dialogues.mjs'))]
    result = subprocess.run(command, cwd=core.PROJECT, capture_output=True, text=True,
                            check=True, timeout=60)
    return json.loads(result.stdout)


def validate_catalogue(catalogue, expected_live=None):
    if not isinstance(catalogue, list) or len(catalogue) != sum(SOURCE_COUNTS.values()):
        raise ValueError('Full continuous catalogue must contain all 412 bodies')
    ids, sources = set(), set()
    counts = dict.fromkeys(SOURCE_COUNTS, 0)
    for item in catalogue:
        if not isinstance(item, dict) or item.get('kind') not in counts:
            raise ValueError('Unknown continuous dialogue source kind')
        required = ('id', 'person', 'raw', 'text', 'mood', 'source', 'canonical_sha256', 'speech_sha256')
        if any(not isinstance(item.get(key), str) or not item[key].strip() for key in required):
            raise ValueError('Incomplete continuous dialogue identity/body')
        if (item['person'] not in core.ROLES or item['mood'] not in core.MOODS
                or type(item.get('priority')) is not int or item['priority'] < 0
                or item['id'] in ids or item['source'] in sources
                or item['canonical_sha256'] != text_sha(item['raw'])
                or item['speech_sha256'] != text_sha(item['text'])
                or item['id'] != stable_clip_id(item['person'], item['text'])):
            raise ValueError('Changed, duplicate or invalid full dialogue: ' + item.get('id', '?'))
        ids.add(item['id'])
        sources.add(item['source'])
        counts[item['kind']] += 1
    if counts != SOURCE_COUNTS or {item['person'] for item in catalogue} != set(core.ROLES):
        raise ValueError('The complete dialogue/source/voice coverage changed')
    if catalogue != (live_catalogue() if expected_live is None else expected_live):
        raise ValueError('Catalogue differs from the actual current game bodies; regenerate it')


def build_plan(args):
    if args.generate and (args.dry_run or args.package):
        raise ValueError('--generate cannot be combined with --dry-run or --package')
    if args.package and (args.clip or args.max_priority is not None):
        raise ValueError('Continuous publication requires the complete catalogue without selectors')
    if args.seed != 424242:
        raise ValueError('Continuous voices preserve the approved scalar seed 424242')
    if args.max_new_tokens != 1024:
        raise ValueError('Continuous token ceiling is fixed at 1024')
    catalogue = core.read_json(args.catalogue.resolve())
    validate_catalogue(catalogue)
    # The existing local provider supplies the model, conditioning, EOS/codec
    # observer, RAW recovery, master and decoder. Each row is a complete body.
    base_args = provider.parse_args([
        '--model', str(args.model), '--references', str(args.references),
        '--catalogue', str(args.catalogue), '--output', str(args.output),
        '--asset', str(args.asset), '--batch-size', str(args.batch_size), '--seed', str(args.seed),
        '--max-new-tokens', str(args.max_new_tokens), '--mastering', 'speech',
        '--target-lufs', '-21', '--peak-dbfs', '-1.5',
        *sum((['--clip', clip] for clip in args.clip), []),
        *(['--max-priority', str(args.max_priority)] if args.max_priority is not None else []),
        *(['--package'] if args.package else []),
    ])
    plan = provider.build_plan(base_args)
    if plan['missing_roles'] or len(plan['references']) != 9:
        raise ValueError('Continuous production requires all nine closed references')
    if (plan['reference_pack_sha256'] != REFERENCE_PACK_SHA256
            or plan['references']['president']['sha256'] != PRESIDENT_REFERENCE_SHA256):
        raise ValueError('Continuous voices require the approved final nine-reference pack and approved Pedro identity')
    plan['schema'] = 2
    plan['provider'] = 'Qwen3-TTS continuous full dialogues'
    plan['generation_unit'] = 'one complete dialogue body per native uninterrupted take'
    plan['inference_parameters'].update(continuous_dialogue_schema=1,
                                         generation_unit=plan['generation_unit'])
    plan['parameters'].update(continuous_dialogue_schema=1,
                                generation_unit=plan['generation_unit'])
    # Freeze the complete batch graph even when only two exact IDs are selected.
    all_batches = []
    for person in core.ROLES:
        ordered = sorted((item for item in plan['catalogue'] if item['person'] == person),
                         key=lambda item: (item['priority'], len(provider.words(item['effective_text'])), item['catalogue_index']))
        groups = []
        for priority in sorted({item['priority'] for item in ordered}):
            rows = [item for item in ordered if item['priority'] == priority]
            groups.extend(rows[offset:offset + args.batch_size] for offset in range(0, len(rows), args.batch_size))
        for ordinal, rows in enumerate(groups):
            context = [{'id': item['id'], 'person': item['person'], 'mood': item['mood'], 'effective_text': item['effective_text']} for item in rows]
            cap = provider.planned_token_cap(rows, args.max_new_tokens)
            batch = {'id': person + '-' + str(ordinal), 'context': context, 'items': rows,
                     'priority': rows[0]['priority'], 'ordinal': ordinal, 'seed': args.seed, 'max_new_tokens': cap}
            parameters = {**plan['inference_parameters'], 'max_new_tokens': cap}
            for index, item in enumerate(rows):
                item.update(batch_id=batch['id'], batch_index=index, batch_seed=args.seed, planned_token_cap=cap)
                baseline = provider.clip_fingerprint(item, plan['references'][person], plan['model'], parameters, context)
                item['inference_fingerprint'] = core.hash_json({'schema': 1, 'continuous_provider': baseline,
                    'canonical_sha256': item['canonical_sha256'], 'speech_sha256': item['speech_sha256'],
                    'source': item['source'], 'kind': item['kind']})
                item['input_fingerprint'] = core.hash_json({'inference_fingerprint': item['inference_fingerprint'], 'mastering': plan['mastering']})
            all_batches.append(batch)
    selected = {item['id'] for item in plan['items']}
    plan['all_batches'] = all_batches
    plan['batches'] = sorted((batch for batch in all_batches if any(item['id'] in selected for item in batch['items'])),
                            key=lambda batch: (batch['priority'], batch['ordinal'], core.ROLES.index(batch['items'][0]['person'])))
    plan['validation_scope'] = 'full unchanged dialogue bodies, pinned inputs, EOS, finite signal and complete decoding; acting/ASR review is separate'
    if args.retry_seeds_file:
        mixed.apply_retry_seeds(plan, provider, args.retry_seeds_file)
    if args.precision == 'mixed-bf16-talker':
        mixed.configure_precision(plan, provider)
    return plan


def valid_continuous_metadata(item, plan, record, encoded=False):
    if not isinstance(record, dict):
        return False
    if record.get('raw_validated') is not True:
        return False
    expected = {'reference_sha256': plan['references'][item['person']]['sha256'],
                'reference_text': plan['references'][item['person']]['ref_text'],
                'model_fingerprint': plan['model']['fingerprint'],
                'batch_seed': item['batch_seed'], 'batch_id': item['batch_id'],
                'planned_token_cap': item['planned_token_cap'], 'batch_index': item['batch_index'],
                'input_fingerprint': item['input_fingerprint'], 'inference_fingerprint': item['inference_fingerprint'],
                'sample_rate': 24000, 'finite': True}
    if encoded:
        expected['mastering'] = plan['mastering']
    if plan['inference_parameters'].get('dtype') == 'mixed':
        expected['precision'] = mixed.PRECISION
        if not re.fullmatch(r'[0-9a-f]{64}', str(record.get('conditioning_identity_sha256', ''))):
            return False
    elif record.get('precision') is not None:
        return False
    if any(record.get(key) != value for key, value in expected.items()):
        return False
    eos, codec = record.get('eos_observation'), record.get('codec_observation')
    if (not isinstance(eos, dict) or eos.get('max_new_tokens') != item['planned_token_cap']
            or type(eos.get('effective_generated_tokens')) is not int
            or not 0 < eos['effective_generated_tokens'] <= item['planned_token_cap']
            or eos.get('first_eos_index') != eos['effective_generated_tokens'] - 1
            or not isinstance(codec, dict) or codec.get('status') != 'observed'
            or codec.get('batch_index') != item['batch_index'] or type(codec.get('codec_frames')) is not int
            or codec['codec_frames'] < 1 or type(codec.get('codebooks')) is not int
            or codec['codebooks'] < 1 or not re.fullmatch(r'[0-9a-f]{64}', str(codec.get('sha256', '')))):
        return False
    return True


def valid_continuous_raw(item, plan, manifest):
    record = manifest.get('raw_takes', {}).get(item['id'])
    return (valid_continuous_metadata(item, plan, record)
            and valid_record_conditioning(item, plan, manifest, record)
            and BASE_VALID_RAW(item, plan['output'], manifest))


def valid_record_conditioning(item, plan, manifest, record):
    if plan['inference_parameters'].get('dtype') != 'mixed':
        return True
    conditioning = manifest.get('conditioning', {}).get(item['person'])
    if not isinstance(conditioning, dict):
        return False
    identity = conditioning.get('identity')
    ref = plan['references'][item['person']]
    if (not isinstance(identity, dict) or conditioning.get('reference_sha256') != ref['sha256']
            or conditioning.get('reference_text') != ref['ref_text'] or identity.get('ref_text') != ref['ref_text']
            or identity.get('x_vector_only_mode') is not False or identity.get('icl_mode') is not True
            or conditioning.get('formed_before_conversion') is not True
            or core.hash_json(identity) != conditioning.get('identity_sha256')
            or record.get('conditioning_identity_sha256') != conditioning['identity_sha256']):
        return False
    for key, dtype in (('ref_code', 'torch.int64'), ('ref_spk_embedding', 'torch.float32')):
        tensor = identity.get(key)
        if (not isinstance(tensor, dict) or tensor.get('dtype') != dtype
                or not isinstance(tensor.get('shape'), list) or not tensor['shape']
                or any(type(size) is not int or size < 1 for size in tensor['shape'])
                or not re.fullmatch(r'[0-9a-f]{64}', str(tensor.get('sha256', '')))):
            return False
    return True


def valid_continuous_take(item, plan, manifest):
    record = manifest.get('takes', {}).get(item['id'])
    raw = manifest.get('raw_takes', {}).get(item['id'])
    if (not valid_continuous_metadata(item, plan, record, encoded=True)
            or not valid_continuous_metadata(item, plan, raw)
            or not valid_record_conditioning(item, plan, manifest, record)
            or not valid_record_conditioning(item, plan, manifest, raw)):
        return False
    # The registered native RAW and encoded take must describe the same output.
    shared = ('raw_sha256', 'raw_wav', 'duration_seconds', 'eos_observation', 'codec_observation')
    if any(record.get(key) != raw.get(key) for key in shared):
        return False
    # BASE_VALID_TAKE builds a tiny synthetic RAW manifest from the encoded
    # record. Its RAW validator must also receive the frozen conditioning.
    if plan['inference_parameters'].get('dtype') == 'mixed':
        return BASE_VALID_RAW(item, plan['output'], {'raw_takes': {item['id']: record}}) and valid_encoded_audio(item, plan, record)
    return BASE_VALID_TAKE(item, plan['output'], manifest)


def valid_encoded_audio(item, plan, record):
    try:
        encoded = Path(plan['output']) / (item['id'] + '.mp3')
        if core.digest(encoded) != record['sha256']:
            return False
        metrics = core.decode_metrics(encoded)
        trim = record['trim']
        expected = (trim['end_sample'] - trim['start_sample']) / 24000
        return (metrics['codec'] == 'mp3' and metrics['peak'] < 1 and record.get('validated') is True
                and 0 <= trim['start_sample'] < trim['end_sample'] <= round(record['duration_seconds'] * 24000)
                and abs(metrics['duration'] - record['duration']) < .05
                and abs(metrics['duration'] - expected) < .15)
    except (OSError, ValueError, TypeError, KeyError, subprocess.SubprocessError):
        return False


def run_generation(plan):
    # Strengthen reuse checks only in this imported provider instance. An older
    # sentence take or altered conditioning metadata is never silently reused.
    original_raw, original_take, original_manifest = provider.valid_raw, provider.valid_take, provider.new_manifest
    provider.valid_raw = lambda item, stage, manifest: valid_continuous_raw(item, plan, manifest)
    provider.valid_take = lambda item, stage, manifest: valid_continuous_take(item, plan, manifest)
    def continuous_manifest(current, previous=None):
        result = original_manifest(current, previous)
        result.update(provider=plan['provider'], generation_unit=plan['generation_unit'])
        return result
    provider.new_manifest = continuous_manifest
    try:
        if plan['inference_parameters'].get('dtype') == 'mixed':
            return mixed.run_generation(plan, provider)
        return provider.run_generation(plan)
    finally:
        provider.valid_raw, provider.valid_take, provider.new_manifest = original_raw, original_take, original_manifest


def validate_manifest(plan, manifest):
    if (manifest.get('status') != 'complete' or not manifest.get('ended_at')
            or manifest.get('catalogue_sha256') != plan['catalogue_sha256']
            or manifest.get('reference_pack_sha256') != plan['reference_pack_sha256']
            or manifest.get('model') != plan['model'] or manifest.get('parameters') != plan['parameters']
            or manifest.get('references') != plan['references'] or manifest.get('items') != plan['available_items']
            or manifest.get('failures') or manifest.get('retry_seeds') != plan.get('retry_seeds', {})
            or manifest.get('retry_seed_file') != plan.get('retry_seed_file')
            or manifest.get('retry_seed_file_sha256') != plan.get('retry_seed_file_sha256')):
        raise ValueError('Continuous stage is open, stale, failed or has changed inputs; asset unchanged')
    if plan['inference_parameters'].get('dtype') == 'mixed':
        mixed.require_precision(plan)
        if manifest.get('precision') != mixed.PRECISION or set(manifest.get('conditioning', {})) != set(core.ROLES):
            raise ValueError('Mixed stage requires nine frozen FP32 conditioning records')
        mixed.assert_precision(manifest.get('execution_before_conversion', {}), converted=False)
        mixed.assert_precision(manifest.get('actual_execution', {}), converted=True)
    expected_ids = {item['id'] for item in plan['catalogue']}
    if set(manifest.get('takes', {})) != expected_ids or set(manifest.get('raw_takes', {})) != expected_ids:
        raise ValueError('Full continuous publication needs exactly all 412 current RAW/MP3 takes')
    for item in plan['catalogue']:
        if not valid_continuous_take(item, plan, manifest):
            raise ValueError('Continuous take failed fingerprint, EOS or decode validation: ' + item['id'])


def package_dialogues(plan):
    stage = Path(plan['output'])
    manifest = core.read_json(stage / 'manifest.json')
    validate_manifest(plan, manifest)
    clips = {item['id']: base64.b64encode((stage / (item['id'] + '.mp3')).read_bytes()).decode()
             for item in plan['catalogue']}
    asset = Path(plan['asset'])
    asset.parent.mkdir(parents=True, exist_ok=True)
    temporary = asset.with_name(asset.name + '.qwen.tmp')
    temporary.write_text('// Continuous Qwen dialogues: complete current catalogue, one native take per body.\nexport const DIALOGUES = '
                         + json.dumps(clips, separators=(',', ':')) + ';\n', encoding='utf-8')
    temporary.replace(asset)
    result = {'provider': plan['provider'], 'generation_unit': plan['generation_unit'], 'dialogues': len(clips),
              'catalogue': plan['catalogue_count'], 'partial': False, 'previous_kept': 0,
              'seconds': sum(float(manifest['takes'][item['id']]['duration']) for item in plan['catalogue']),
              'model_fingerprint': plan['model']['fingerprint'], 'catalogue_sha256': plan['catalogue_sha256'],
              'reference_pack_sha256': plan['reference_pack_sha256'], 'asset_sha256': core.digest(asset),
              'human_listening': False, 'validation_scope': plan['validation_scope']}
    core.atomic_json(stage / 'publication.json', result)
    return result


def main(argv=None):
    args = parse_args(argv)
    if not (args.dry_run or args.package or args.generate):
        raise ValueError('Choose --dry-run, --package or explicitly authorized --generate')
    plan = build_plan(args)
    if args.dry_run:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return 0
    if args.package:
        lock = core.acquire_lock(Path(plan['output']))
        try:
            print(json.dumps(package_dialogues(plan), ensure_ascii=False))
        finally:
            lock.unlink(missing_ok=True)
        return 0
    report = run_generation(plan)
    return 0 if report['status'] == 'complete' else 1


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        print('Continuous Qwen dialogue error: ' + str(error), file=sys.stderr)
        raise SystemExit(1)
