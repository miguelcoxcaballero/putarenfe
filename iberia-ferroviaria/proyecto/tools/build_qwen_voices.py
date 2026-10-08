"""Stage the complete railway dialogue catalogue with local Qwen voice clones.

Generation never publishes game assets. --package validates the whole catalogue;
--package --package-partial explicitly permits a fresh, incomplete CLIPS map.
No previous voice asset is used as a fallback. --dry-run never imports Torch.
"""
import argparse
from array import array
import base64
import importlib.util
import json
import math
import os
from pathlib import Path
import random
import re
import resource
import subprocess
import sys
import time

SPEC = importlib.util.spec_from_file_location('iberia_qwen_core', Path(__file__).with_name('build_qwen_auditions.py'))
core = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(core)
EMOTION_GRAMMAR = {
    'happy': {'ending': '!', 'pause': None},
    'angry': {'ending': '!', 'pause': None},
    'worried': {'ending': '…', 'pause': '…'},
    'proud': {'ending': '.', 'pause': None},
    'surprised': {'ending': '!', 'pause': None},
    'disappointed': {'ending': '…', 'pause': '…'},
    'determined': {'ending': '.', 'pause': None},
}
DEFAULT_ASSET = core.PROJECT / 'dist' / 'assets' / 'voices.js'


def parse_args(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    for name in ('model', 'references', 'catalogue', 'output'):
        p.add_argument('--' + name, required=True, type=Path)
    p.add_argument('--person', action='append', default=[], help='Repeated or comma-separated; default: available reference roles')
    p.add_argument('--clip', action='append', default=[], help='Optional exact IDs to regenerate; stable full batches retain their other rows')
    p.add_argument('--batch-size', type=int, default=4)
    p.add_argument('--seed', type=int, default=424242)
    p.add_argument('--retry-seeds-file', type=Path,
                   help='Local JSON map of stable batch ID to replacement seed; changes only those batches')
    p.add_argument('--max-new-tokens', type=int, default=1024)
    p.add_argument('--max-priority', type=int, help='Optional initial pass, e.g. 1 for intro/tutorial; later calls resume the same batches')
    p.add_argument('--mastering', choices=('constant', 'speech'), default='constant',
                   help='Constant gain, or static speech gain with a bounded lookahead peak guard')
    p.add_argument('--target-lufs', type=float, default=-17)
    p.add_argument('--peak-dbfs', type=float, default=-1.5)
    p.add_argument('--force', action='store_true')
    p.add_argument('--dry-run', action='store_true')
    p.add_argument('--package', action='store_true', help='Validate and write the CLIPS asset instead of generating')
    p.add_argument('--package-partial', action='store_true', help='Explicitly permit incomplete packaging; never preserves older clips')
    p.add_argument('--asset', type=Path, default=DEFAULT_ASSET)
    return p.parse_args(argv)


def words(text):
    return re.findall(r'\w+', text, flags=re.UNICODE)


def planned_token_cap(rows, global_cap):
    """Allow slow speech and five seconds of headroom, while bounding loops."""
    longest = max(len(words(item['effective_text'])) for item in rows)
    return min(global_cap, max(128, math.ceil(longest / 1.5 * 12.5 + 64)))


def spoken_costs(text):
    """Spell the two incident amounts; keep decimals and other numerals intact."""
    amounts = {'18000': 'dieciocho mil', '9000': 'nueve mil'}
    return re.sub(r'(?<![\w.,])(?:18000|9000)(?![\w.]|,\d)',
                  lambda match: amounts[match.group()], text)


def effective_text(item):
    """Direct acting and unambiguous incident costs without changing meaning."""
    expected_text = spoken_costs(item['text'])
    text = expected_text.replace('e erre te eme ese', 'e, erre, te, eme, ese')
    grammar = EMOTION_GRAMMAR[item['mood']]
    if text.rstrip().endswith('.') and not text.rstrip().endswith('...'):
        text = text.rstrip()[:-1] + grammar['ending']
    if grammar['pause'] and ':' in text:
        text = text.replace(':', grammar['pause'], 1)
    # One modest setup/remate pause for Pedro; his approved identity is retained.
    if item['person'] == 'president' and ':' in text:
        text = text.replace(':', '…', 1)
    if words(text) != words(expected_text):
        raise ValueError('Acting grammar changed catalogue words: ' + item['id'])
    return text


def clip_fingerprint(item, ref, model, parameters, batch):
    return core.hash_json({'schema': 1, 'id': item['id'], 'person': item['person'],
                          'mood': item['mood'], 'canonical_text': item['text'],
                          'effective_text': item['effective_text'],
                          'emotion_grammar': EMOTION_GRAMMAR[item['mood']],
                          'reference_sha256': ref['sha256'], 'reference_text': ref['ref_text'],
                          'model_fingerprint': model['fingerprint'], 'parameters': parameters,
                          'batch': batch})


def build_plan(args):
    if args.package_partial and not args.package:
        raise ValueError('--package-partial requires explicit --package')
    if not 1 <= args.batch_size <= 4:
        raise ValueError('--batch-size must be between 1 and 4')
    if not 0 <= args.seed < 2 ** 32 or args.max_new_tokens < 128:
        raise ValueError('Invalid seed or catalogue token ceiling; at least 128 tokens are required')
    if not math.isfinite(args.target_lufs) or not -40 <= args.target_lufs <= -12 or not math.isfinite(args.peak_dbfs) or not -12 <= args.peak_dbfs <= -1:
        raise ValueError('Invalid mastering loudness or peak target')
    for binary in ('ffmpeg', 'ffprobe'):
        if not core.shutil.which(binary):
            raise ValueError('Missing executable: ' + binary)
    catalogue_file = args.catalogue.resolve()
    catalogue = core.read_json(catalogue_file)
    if not isinstance(catalogue, list) or not catalogue:
        raise ValueError('Catalogue must be a non-empty list')
    ids, items = set(), []
    for index, source in enumerate(catalogue):
        if not isinstance(source, dict):
            raise ValueError('Invalid catalogue row')
        item = dict(source)
        item.setdefault('mood', 'happy')
        if (not isinstance(item.get('id'), str) or not re.fullmatch(r'[A-Za-z0-9_-]+', item['id'])
                or item['id'] in ids or item.get('person') not in core.ROLES
                or item['mood'] not in core.MOODS or not isinstance(item.get('text'), str)
                or not item['text'].strip()):
            raise ValueError('Unknown, empty or duplicate catalogue identity/text')
        priority = item.get('priority', 5)
        if type(priority) is not int or priority < 0:
            raise ValueError('Invalid catalogue priority')
        ids.add(item['id'])
        item.update(priority=priority, catalogue_index=index)
        item['effective_text'] = effective_text(item)
        items.append(item)
    reference_file = args.references / 'prompts.json' if args.references.is_dir() else args.references
    reference_file = reference_file.resolve()
    payload = core.read_json(reference_file)
    prompts = payload.get('prompts') if isinstance(payload, dict) else None
    if not isinstance(prompts, dict) or not prompts or any(role not in core.ROLES for role in prompts):
        raise ValueError('Reference pack needs named game-role prompts')
    refs = {person: core.prepare_reference(person, ref, reference_file.parent) for person, ref in prompts.items()}
    people = list(dict.fromkeys(part.strip() for value in args.person for part in value.split(','))) if args.person else [p for p in core.ROLES if p in refs]
    if not people or any(person not in refs for person in people):
        raise ValueError('Missing or unknown selected voice reference')
    full_package = args.package and not args.package_partial
    missing_roles = [person for person in core.ROLES if person not in refs]
    if full_package and missing_roles:
        raise ValueError('Full packaging requires all nine current references: ' + ', '.join(missing_roles))
    if full_package and (args.person or args.clip or args.max_priority is not None):
        raise ValueError('Full packaging checks the whole catalogue; remove subset selectors')
    model = core.verify_model(args.model)
    output = args.output.resolve()
    if output.is_relative_to(core.PROJECT / 'dist') or output.is_relative_to(Path(model['directory'])) or output == reference_file.parent:
        raise ValueError('Staging must be separate from game assets, models and references')
    inference_parameters = {'provider_schema': 1, 'device': 'cpu', 'dtype': 'float32', 'attention': 'sdpa',
                  'threads': 3, 'interop_threads': 1, 'seed': args.seed, 'seed_scope': 'stable whole batch',
                  'deterministic_algorithms': True,
                  'batch_size': args.batch_size, 'max_new_tokens': args.max_new_tokens,
                  'token_cap_policy': {'minimum': 128, 'slow_words_per_second': 1.5,
                                       'codec_frames_per_second': 12.5, 'safety_frames': 64,
                                       'ceiling': '--max-new-tokens'},
                  'language': 'Spanish', 'x_vector_only_mode': False,
                  'runtime_versions': core.RUNTIME_VERSIONS, 'emotion_grammar_schema': 1,
                  'batch_order': 'role, priority, effective word count, catalogue index; separate priority groups',
                  'eos_observer_schema': 1, 'sample_rate': 24000, 'wav_subtype': 'FLOAT'}
    mastering = {'schema': 1, 'mode': args.mastering, 'mp3_bitrate': '160k', 'target_lufs': args.target_lufs,
                 'maximum_true_peak_dbfs': args.peak_dbfs, 'outer_silence_threshold_relative_db': -60,
                 'leading_margin_ms': 80, 'trailing_margin_ms': 120,
                 'processing': 'Exterior silence only, then constant gain; no internal pause removal, EQ, pitch, tempo, compressor or limiter.'}
    if args.mastering == 'speech':
        mastering.update(peak_guard={'threshold_dbfs': args.peak_dbfs - .3,
                                    'maximum_peak_reduction_db': 6,
                                    'attack_ms': 5, 'release_ms': 80,
                                    'level': False, 'latency': True},
                         processing='Exterior silence only, static gain and bounded lookahead peak guard; no internal pause removal, EQ, pitch, tempo or broadband compression.')
    parameters = {**inference_parameters, 'mastering': mastering}
    retry_file = args.retry_seeds_file.resolve() if args.retry_seeds_file else None
    retry_seeds = core.read_json(retry_file) if retry_file else {}
    if (not isinstance(retry_seeds, dict)
            or any(not isinstance(key, str) or type(seed) is not int or not 0 <= seed < 2 ** 32
                   for key, seed in retry_seeds.items())):
        raise ValueError('Retry seeds must map stable batch IDs to uint32 integers')
    # Per-role batches remain stable when a blocked ninth role becomes available.
    batches = []
    for person in core.ROLES:
        role_items = sorted((i for i in items if i['person'] == person),
                            key=lambda i: (i['priority'], len(words(i['effective_text'])), i['catalogue_index']))
        grouped_rows = []
        for priority in sorted({i['priority'] for i in role_items}):
            priority_items = [i for i in role_items if i['priority'] == priority]
            grouped_rows.extend(priority_items[offset:offset + args.batch_size]
                                for offset in range(0, len(priority_items), args.batch_size))
        for ordinal, rows in enumerate(grouped_rows):
            context = [{'id': i['id'], 'person': i['person'], 'mood': i['mood'],
                        'effective_text': i['effective_text']} for i in rows]
            batch = {'id': person + '-' + str(ordinal), 'context': context,
                     'items': rows, 'priority': min(i['priority'] for i in rows), 'ordinal': ordinal}
            batch['seed'] = retry_seeds.get(batch['id'], args.seed)
            batch['max_new_tokens'] = planned_token_cap(rows, args.max_new_tokens)
            batch_parameters = {**inference_parameters, 'seed': batch['seed'],
                                'max_new_tokens': batch['max_new_tokens']}
            batches.append(batch)
            if person in refs:
                for batch_index, item in enumerate(rows):
                    item['batch_id'] = batch['id']
                    item['batch_index'] = batch_index
                    item['batch_seed'] = batch['seed']
                    item['planned_token_cap'] = batch['max_new_tokens']
                    item['inference_fingerprint'] = clip_fingerprint(item, refs[person], model, batch_parameters, context)
                    item['input_fingerprint'] = core.hash_json({'inference_fingerprint': item['inference_fingerprint'], 'mastering': mastering})
    unknown_retry_ids = set(retry_seeds) - {b['id'] for b in batches}
    if unknown_retry_ids:
        raise ValueError('Unknown retry batch IDs: ' + ', '.join(sorted(unknown_retry_ids)))
    available = [i for i in items if i['person'] in refs]
    requested_ids = list(dict.fromkeys(part.strip() for value in args.clip for part in value.split(',')))
    if requested_ids and any(ident not in ids for ident in requested_ids):
        raise ValueError('Unknown catalogue --clip ID')
    selected = [i for i in available if i['person'] in people
                and (not requested_ids or i['id'] in requested_ids)
                and (args.max_priority is None or i['priority'] <= args.max_priority)]
    if requested_ids and {i['id'] for i in selected} != set(requested_ids):
        raise ValueError('A selector excludes one of the requested clips')
    if not selected:
        raise ValueError('No selected catalogue clips')
    selected_ids = {i['id'] for i in selected}
    # A new batch seed changes every row. Retry the full affected group even
    # when one bad line was selected, so its neighbours remain packageable.
    retry_selected_ids = {i['id'] for b in batches if b['id'] in retry_seeds
                          and any(i['id'] in selected_ids for i in b['items'])
                          for i in b['items'] if i['person'] in refs}
    selected_ids |= retry_selected_ids
    selected = [i for i in available if i['id'] in selected_ids]
    batches = sorted((b for b in batches if any(i['id'] in selected_ids for i in b['items'])),
                     key=lambda b: (b['priority'], b['ordinal'], core.ROLES.index(b['items'][0]['person'])))
    return {'schema': 1, 'model': model, 'parameters': parameters, 'inference_parameters': inference_parameters, 'mastering': mastering, 'references': refs,
            'reference_pack_file': str(reference_file), 'reference_pack_sha256': core.digest(reference_file),
            'retry_seeds': retry_seeds, 'retry_seed_file': str(retry_file) if retry_file else None,
            'retry_seed_file_sha256': core.digest(retry_file) if retry_file else None,
            'catalogue_file': str(catalogue_file), 'catalogue_sha256': core.digest(catalogue_file),
            'catalogue': items, 'available_items': available, 'items': selected, 'batches': batches,
            'missing_roles': missing_roles, 'catalogue_count': len(items), 'selected_count': len(selected),
            'output': str(output), 'asset': str(args.asset.resolve()),
            'human_listening': False, 'validation_scope': 'signal, full decode and EOS; ASR/acting review is separate'}


def observe_batch(talker, observations):
    """Count each row only through its first EOS; completed rows contain pads."""
    original = talker.generate

    def wrapped(*args, **kwargs):
        result = original(*args, **kwargs)
        try:
            rows = result.sequences.tolist() if hasattr(result.sequences, 'tolist') else result.sequences
            input_ids = kwargs.get('input_ids')
            inputs = input_ids.tolist() if hasattr(input_ids, 'tolist') else input_ids
            if args and inputs is None:
                raise ValueError('Unknown positional input prefix')
            cap = kwargs.get('max_new_tokens')
            eos = kwargs.get('eos_token_id')
            eos_ids = list(eos) if isinstance(eos, (list, tuple)) else [eos]
            if not isinstance(rows, list) or not rows or not eos_ids or any(type(e) is not int for e in eos_ids) or type(cap) is not int:
                raise ValueError('Unobservable token sequences or EOS/cap')
            for index, row in enumerate(rows):
                prefix = len(inputs[index]) if inputs is not None else 0
                tokens = row[prefix:]
                first = next((n for n, token in enumerate(tokens) if token in eos_ids), None)
                effective = first + 1 if first is not None else len(tokens)
                observations.append({'status': 'observed', 'batch_index': index, 'input_tokens': prefix,
                    'sequence_tokens': len(row), 'generated_tokens_including_padding': len(tokens),
                    'effective_generated_tokens': effective, 'first_eos_index': first,
                    'eos_found': first is not None, 'last_effective_token': tokens[effective - 1] if effective else None,
                    'padding_tokens_after_eos': len(tokens) - effective, 'max_new_tokens': cap,
                    'token_limit_without_eos': first is None and len(tokens) >= cap})
        except (AttributeError, ValueError, TypeError, IndexError) as error:
            observations.append({'status': 'unknown', 'reason': str(error)})
        return result

    talker.generate = wrapped
    return lambda: setattr(talker, 'generate', original)


def observe_codec(model, observations):
    """Record effective code rows before decode, without altering model output."""
    original = model.generate

    def wrapped(*args, **kwargs):
        result = original(*args, **kwargs)
        try:
            for index, codes in enumerate(result[0]):
                values = codes.detach().cpu().contiguous().numpy()
                observations.append({'status': 'observed', 'batch_index': index,
                    'codec_frames': int(values.shape[0]), 'codebooks': int(values.shape[1]),
                    'dtype': values.dtype.str, 'sha256': core.hashlib.sha256(values.tobytes()).hexdigest()})
        except (AttributeError, ValueError, TypeError, IndexError) as error:
            observations.append({'status': 'unknown', 'reason': str(error)})
        return result

    model.generate = wrapped
    return lambda: setattr(model, 'generate', original)


def valid_take(item, stage, manifest):
    record = manifest.get('takes', {}).get(item['id'])
    if not isinstance(record, dict) or record.get('validated') is not True or record.get('input_fingerprint') != item['input_fingerprint']:
        return False
    if not valid_raw(item, stage, {'raw_takes': {item['id']: record}}):
        return False
    try:
        encoded = Path(stage) / (item['id'] + '.mp3')
        if core.digest(encoded) != record['sha256']:
            return False
        metrics = core.decode_metrics(encoded)
        trim = record['trim']
        raw_duration = float(record['duration_seconds'])
        expected = (trim['end_sample'] - trim['start_sample']) / 24000
        return (metrics['codec'] == 'mp3' and metrics['peak'] < 1
                and 0 <= trim['start_sample'] < trim['end_sample'] <= round(raw_duration * 24000)
                and abs(metrics['duration'] - float(record['duration'])) < .05
                and abs(metrics['duration'] - expected) < .15)
    except (OSError, ValueError, TypeError, KeyError, subprocess.SubprocessError):
        return False


def valid_raw(item, stage, manifest):
    record = manifest.get('raw_takes', {}).get(item['id'])
    if not isinstance(record, dict) or record.get('raw_validated') is not True or record.get('inference_fingerprint') != item['inference_fingerprint']:
        return False
    if any(record.get(key) != item[key] for key in ('id', 'person', 'mood', 'text', 'effective_text')):
        return False
    eos = record.get('eos_observation')
    if (not isinstance(eos, dict) or eos.get('status') != 'observed' or eos.get('eos_found') is not True
            or eos.get('batch_index') != item['batch_index'] or record.get('batch_index') != item['batch_index']
            or eos.get('last_effective_token') != 2150 or eos.get('token_limit_without_eos') is not False):
        return False
    try:
        path = Path(stage) / (item['id'] + '.wav')
        if core.digest(path) != record['raw_sha256']:
            return False
        metrics = core.decode_metrics(path)
        return metrics['codec'] == 'pcm_f32le' and abs(metrics['duration'] - float(record['duration_seconds'])) < .02
    except (OSError, ValueError, TypeError, KeyError, subprocess.SubprocessError):
        return False


def silence_bounds(values, mastering, sample_rate=24000):
    """Remove only the empty outside edges; preserve low-energy breaths and gaps."""
    if not values or not all(math.isfinite(v) for v in values):
        raise ValueError('Invalid raw samples for silence inspection')
    peak = max(abs(v) for v in values)
    threshold = peak * 10 ** (mastering['outer_silence_threshold_relative_db'] / 20)
    first = next((i for i, v in enumerate(values) if abs(v) > threshold), None)
    last = next((len(values) - 1 - i for i, v in enumerate(reversed(values)) if abs(v) > threshold), None)
    if first is None:
        raise ValueError('Raw waveform is silent')
    start = max(0, first - round(mastering['leading_margin_ms'] * sample_rate / 1000))
    end = min(len(values), last + 1 + round(mastering['trailing_margin_ms'] * sample_rate / 1000))
    return {'start_sample': start, 'end_sample': end, 'raw_samples': len(values),
            'threshold_amplitude': threshold, 'threshold_relative_db': mastering['outer_silence_threshold_relative_db'],
            'leading_removed_seconds': start / sample_rate,
            'trailing_removed_seconds': (len(values) - end) / sample_rate}


def decode_samples(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-protocol_whitelist', 'file,pipe',
                          '-i', str(path), '-map', '0:a:0', '-f', 'f32le', '-codec:a', 'pcm_f32le', '-'],
                         capture_output=True, check=True, timeout=60).stdout
    values = array('f', raw)
    if sys.byteorder != 'little':
        values.byteswap()
    return values


def loudness(path, filters=''):
    chain = (filters + ',' if filters else '') + 'loudnorm=I=-17:TP=-1.5:LRA=50:print_format=json'
    result = subprocess.run(['ffmpeg', '-v', 'info', '-protocol_whitelist', 'file,pipe', '-i', str(path),
                             '-af', chain, '-f', 'null', '-'], capture_output=True, text=True, check=True, timeout=60)
    stats, _ = json.JSONDecoder().raw_decode(result.stderr[result.stderr.rfind('{'):])
    measured = {'lufs': float(stats['input_i']), 'true_peak_dbfs': float(stats['input_tp'])}
    if not all(math.isfinite(v) for v in measured.values()):
        raise ValueError('Non-finite loudness measurement')
    return measured


def mastering_gain(source, mastering):
    peak_ceiling = mastering['maximum_true_peak_dbfs']
    if mastering.get('mode') == 'speech':
        guard = mastering['peak_guard']
        peak_ceiling = guard['threshold_dbfs'] + guard['maximum_peak_reduction_db']
    return min(mastering['target_lufs'] - source['lufs'], peak_ceiling - source['true_peak_dbfs'])


def mastering_filter(gain, mastering):
    filters = 'volume=' + str(gain) + 'dB'
    if mastering.get('mode') == 'speech':
        guard = mastering['peak_guard']
        threshold = 10 ** (guard['threshold_dbfs'] / 20)
        filters += (f",alimiter=limit={threshold}:attack={guard['attack_ms']}"
                    f":release={guard['release_ms']}:level=false:latency=true")
    return filters


def finish_raw(record, item, stage, mastering):
    raw, encoded = (Path(stage) / (item['id'] + suffix) for suffix in ('.wav', '.mp3'))
    before = core.digest(raw)
    trim = silence_bounds(decode_samples(raw), mastering)
    filters = f"atrim=start_sample={trim['start_sample']}:end_sample={trim['end_sample']},asetpts=PTS-STARTPTS"
    source = loudness(raw, filters)
    gain = mastering_gain(source, mastering)
    for attempt in range(3):
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-protocol_whitelist', 'file,pipe', '-i', str(raw),
                        '-af', filters + ',' + mastering_filter(gain, mastering), '-codec:a', 'libmp3lame',
                        '-b:a', '160k', '-ac', '1', '-ar', '24000', str(encoded)], check=True, timeout=60)
        measured = loudness(encoded)
        if measured['true_peak_dbfs'] <= mastering['maximum_true_peak_dbfs'] and measured['lufs'] <= mastering['target_lufs'] + .05:
            break
        gain -= max(measured['true_peak_dbfs'] - mastering['maximum_true_peak_dbfs'], measured['lufs'] - mastering['target_lufs'], 0) + .05
    else:
        raise ValueError('MP3 mastering did not satisfy loudness/true-peak targets')
    metrics = core.decode_metrics(encoded)
    if before != core.digest(raw) or metrics['codec'] != 'mp3' or metrics['peak'] >= 1:
        raise ValueError('Raw mutated or MP3 clipped/failed decoding')
    return {**record, 'input_fingerprint': item['input_fingerprint'], 'sha256': core.digest(encoded),
            'mp3': encoded.name, 'duration': metrics['duration'], 'validated': True,
            'trim': trim, 'raw_lufs_after_outer_trim': source['lufs'], 'raw_true_peak_dbfs': source['true_peak_dbfs'],
            'constant_gain_db': gain, 'mp3_lufs': measured['lufs'], 'mp3_true_peak_dbfs': measured['true_peak_dbfs'],
            'mastering': mastering, 'processing': mastering['processing'], 'encoded_at': core.utc()}


def new_manifest(plan, previous=None):
    previous = previous or {}
    if not isinstance(previous.get('takes', {}), dict) or not isinstance(previous.get('raw_takes', {}), dict):
        raise ValueError('Malformed staged takes/checkpoints')
    stage = Path(plan['output'])
    current = {i['id']: i for i in plan['available_items']}
    takes = {ident: record for ident, record in previous.get('takes', {}).items()
             if ident in current and valid_take(current[ident], stage, previous)}
    raws = {ident: record for ident, record in previous.get('raw_takes', {}).items()
            if ident in current and valid_raw(current[ident], stage, previous)}
    return {'schema': 1, 'provider': 'Qwen3-TTS catalogue', 'started_at': core.utc(), 'status': 'preflight',
            'run': {'items': plan['items'], 'model': plan['model'], 'parameters': plan['parameters']},
            'items': plan['available_items'], 'catalogue_sha256': plan['catalogue_sha256'],
            'model': plan['model'], 'parameters': plan['parameters'], 'references': plan['references'],
            'retry_seeds': plan.get('retry_seeds', {}),
            'retry_seed_file': plan.get('retry_seed_file'), 'retry_seed_file_sha256': plan.get('retry_seed_file_sha256'),
            'reference_pack_sha256': plan['reference_pack_sha256'], 'missing_roles': plan['missing_roles'],
            'takes': takes, 'raw_takes': raws, 'failures': {}, 'batches': {},
            'human_listening': False, 'validation_scope': plan['validation_scope'],
            'cast_feedback': {'president': {'first_long_qwen_voice_identity_accepted_by_user': True,
                                           'individual_production_clips_listened': False}}}


def run_generation(plan, force=False):
    stage = Path(plan['output'])
    stage.mkdir(parents=True, exist_ok=True)
    lock = core.acquire_lock(stage)
    target = stage / 'manifest.json'
    manifest = None
    try:
        previous = core.read_json(target) if target.exists() else {}
        manifest = new_manifest(plan, previous)
        selected_ids = {i['id'] for i in plan['items']}
        if force:
            for ident in selected_ids:
                manifest['takes'].pop(ident, None)
                manifest['raw_takes'].pop(ident, None)
        core.atomic_json(target, manifest)
        pending = []
        for batch in plan['batches']:
            needed = []
            for item in batch['items']:
                if item['id'] not in selected_ids or item['id'] in manifest['takes']:
                    continue
                if item['id'] in manifest['raw_takes']:
                    manifest['takes'][item['id']] = finish_raw(manifest['raw_takes'][item['id']], item, stage, plan['mastering'])
                    core.atomic_json(target, manifest)
                    core.event('raw_take_reused', id=item['id'])
                else:
                    needed.append(item)
            if needed:
                pending.append((batch, needed))
        if not pending:
            manifest.update(status='complete', ended_at=core.utc())
            core.atomic_json(target, manifest)
            return manifest
        core.offline_environment()
        manifest['runtime_versions'] = core.validate_runtime()
        import numpy as np
        import soundfile as sf
        import torch
        from qwen_tts import Qwen3TTSModel
        torch.set_num_threads(3)
        torch.set_num_interop_threads(1)
        torch.use_deterministic_algorithms(True)
        model = Qwen3TTSModel.from_pretrained(plan['model']['directory'], device_map='cpu', dtype=torch.float32,
            attn_implementation='sdpa', local_files_only=True, low_cpu_mem_usage=True)
        if ({str(p.device) for p in model.model.parameters()} != {'cpu'}
                or {str(p.dtype) for p in model.model.parameters()} != {'torch.float32'}
                or model.model.config._attn_implementation != 'sdpa'
                or str(model.model.speech_tokenizer.device) != 'cpu'
                or str(model.model.speech_tokenizer.model.dtype) != 'torch.float32'):
            raise ValueError('Unexpected production model/codec execution settings')
        prompt_cache = {}
        manifest.update(status='running', generation_defaults=model.generate_defaults)
        core.atomic_json(target, manifest)
        for batch, needed in pending:
            rows = batch['items']
            prompt_items = []
            for item in rows:
                person = item['person']
                ref = plan['references'][person]
                if core.digest(ref['ref_audio']) != ref['sha256']:
                    raise ValueError('Reference changed while running: ' + person)
                if person not in prompt_cache:
                    prompt_cache[person] = model.create_voice_clone_prompt(ref_audio=ref['ref_audio'], ref_text=ref['ref_text'], x_vector_only_mode=False)
                if len(prompt_cache[person]) != 1:
                    raise ValueError('Expected one conditioning item per role')
                prompt_items.append(prompt_cache[person][0])
            random.seed(batch['seed'])
            np.random.seed(batch['seed'])
            torch.manual_seed(batch['seed'])
            observations = []
            restore = observe_batch(model.model.talker, observations)
            codec_observations = []
            restore_codec = observe_codec(model.model, codec_observations)
            start = time.monotonic()
            core.event('batch_started', id=batch['id'], clips=[i['id'] for i in rows], needed=[i['id'] for i in needed],
                       seed=batch['seed'], max_new_tokens=batch['max_new_tokens'])
            try:
                wavs, sr = model.generate_voice_clone(text=[i['effective_text'] for i in rows],
                    language=['Spanish'] * len(rows), voice_clone_prompt=prompt_items,
                    max_new_tokens=batch['max_new_tokens'])
            finally:
                restore_codec()
                restore()
            elapsed = time.monotonic() - start
            if sr != 24000 or len(wavs) != len(rows) or len(observations) != len(rows) or len(codec_observations) != len(rows):
                raise ValueError('Batch output count, sample rate or token accounting changed')
            batch_record = {'id': batch['id'], 'clips': [i['id'] for i in rows], 'inference_seconds': elapsed,
                            'seed': batch['seed'],
                            'max_new_tokens': batch['max_new_tokens'],
                            'latency_scope': 'whole batch; no individual inference time is asserted',
                            'eos_observations': observations, 'codec_observations': codec_observations, 'ended_at': core.utc()}
            manifest['batches'][batch['id']] = batch_record
            needed_ids = {i['id'] for i in needed}
            valid_duration_sum = 0
            # Persist every usable RAW before starting any encoder in the batch.
            for index, (item, output, eos) in enumerate(zip(rows, wavs, observations)):
                if item['id'] not in needed_ids:
                    continue
                try:
                    if eos.get('status') != 'observed' or eos.get('batch_index') != index or not eos.get('eos_found'):
                        raise ValueError('EOS missing, unknown or token cap reached without EOS')
                    audio = np.asarray(output, dtype=np.float32)
                    if audio.ndim != 1 or not len(audio) or not np.isfinite(audio).all():
                        raise ValueError('Invalid batch waveform')
                    duration = len(audio) / sr
                    rms = float(np.sqrt(np.mean(audio.astype(np.float64) ** 2)))
                    if not .2 <= duration < core.MAX_SECONDS or rms < .0001:
                        raise ValueError('Silent or excessive batch waveform')
                    raw = stage / (item['id'] + '.wav')
                    sf.write(raw, audio, sr, subtype='FLOAT')
                    metrics = core.decode_metrics(raw)
                    if metrics['codec'] != 'pcm_f32le':
                        raise ValueError('Raw native float waveform did not decode')
                    raw_record = {'id': item['id'], 'person': item['person'], 'mood': item['mood'],
                        'text': item['text'], 'effective_text': item['effective_text'],
                        'duration_seconds': duration, 'raw_wav': raw.name, 'raw_sha256': core.digest(raw),
                        'raw_validated': True, 'input_fingerprint': item['input_fingerprint'], 'inference_fingerprint': item['inference_fingerprint'],
                        'reference_sha256': plan['references'][item['person']]['sha256'],
                        'reference_text': plan['references'][item['person']]['ref_text'],
                        'model_fingerprint': plan['model']['fingerprint'], 'batch_id': batch['id'],
                        'batch_seed': batch['seed'],
                        'planned_token_cap': batch['max_new_tokens'],
                        'batch_index': index, 'batch_inference_seconds': elapsed, 'latency_scope': batch_record['latency_scope'],
                        'eos_observation': eos, 'samples': len(audio), 'sample_rate': sr, 'finite': True,
                        'codec_observation': codec_observations[index],
                        'rms': rms, 'peak': float(np.max(np.abs(audio))), 'generated_at': core.utc(),
                        'human_listening': False, 'validation_scope': plan['validation_scope'],
                        'processing': 'Native float32 Qwen waveform; trimming, gain and peak guard apply only to the MP3.'}
                    manifest['raw_takes'][item['id']] = raw_record
                    manifest['failures'].pop(item['id'], None)
                    valid_duration_sum += duration
                except (ValueError, OSError, subprocess.SubprocessError) as error:
                    manifest['failures'][item['id']] = {'person': item['person'], 'error': str(error), 'eos_observation': eos}
                core.atomic_json(target, manifest)
            batch_record['needed_raw_duration_seconds'] = valid_duration_sum
            for item in needed:
                record = manifest['raw_takes'].get(item['id'])
                if record is None:
                    continue
                manifest['status'] = 'encoding'
                core.atomic_json(target, manifest)
                manifest['takes'][item['id']] = finish_raw(record, item, stage, plan['mastering'])
                manifest['status'] = 'running'
                core.atomic_json(target, manifest)
                core.event('clip_finished', id=item['id'], person=item['person'], duration=record['duration_seconds'], sha256=manifest['takes'][item['id']]['sha256'])
            core.event('batch_finished', id=batch['id'], seconds=elapsed, peak_rss_bytes=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024)
        missing = [i['id'] for i in plan['items'] if i['id'] not in manifest['takes']]
        manifest.update(status='incomplete' if missing else 'complete', missing_selected=missing, ended_at=core.utc())
        core.atomic_json(target, manifest)
        return manifest
    except BaseException as error:
        if manifest is not None:
            manifest.update(status='failed', error_type=type(error).__name__, error=str(error), ended_at=core.utc())
            core.atomic_json(target, manifest)
        raise
    finally:
        lock.unlink(missing_ok=True)


def package_clips(plan, partial=False):
    """Validate first; never merge old assets into a new Qwen publication."""
    stage = Path(plan['output'])
    manifest = core.read_json(stage / 'manifest.json')
    by_id = {i['id']: i for i in plan['available_items']}
    missing, clips, seconds = [], {}, 0
    for item in plan['catalogue']:
        if item['id'] not in by_id or not valid_take(by_id[item['id']], stage, manifest):
            missing.append(item['id'])
            continue
        encoded = stage / (item['id'] + '.mp3')
        clips[item['id']] = base64.b64encode(encoded.read_bytes()).decode()
        seconds += float(manifest['takes'][item['id']]['duration'])
    if not partial and (missing or plan['missing_roles']):
        raise ValueError('Full catalogue is incomplete or stale; asset unchanged: ' + ', '.join(missing[:8]))
    if not clips:
        raise ValueError('No current verified Qwen clips to package')
    asset = Path(plan['asset'])
    asset.parent.mkdir(parents=True, exist_ok=True)
    temporary = asset.with_name(asset.name + '.qwen.tmp')
    temporary.write_text('// Qwen voices: current verified clips, no earlier voice fallback.\nexport const CLIPS = '
                         + json.dumps(clips, separators=(',', ':')) + ';\n', encoding='utf-8')
    temporary.replace(asset)
    result = {'provider': 'Qwen3-TTS', 'clips': len(clips), 'catalogue': len(plan['catalogue']),
              'partial': partial, 'missing': missing, 'previous_kept': 0, 'seconds': seconds,
              'model_fingerprint': plan['model']['fingerprint'], 'catalogue_sha256': plan['catalogue_sha256'],
              'human_listening': False, 'validation_scope': plan['validation_scope']}
    core.atomic_json(stage / 'publication.json', result)
    return result


def main(argv=None):
    args = parse_args(argv)
    plan = build_plan(args)
    if args.dry_run:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return 0
    if args.package:
        lock = core.acquire_lock(Path(plan['output']))
        try:
            print(json.dumps(package_clips(plan, partial=args.package_partial), ensure_ascii=False))
        finally:
            lock.unlink(missing_ok=True)
        return 0
    report = run_generation(plan, force=args.force)
    return 0 if report['status'] == 'complete' else 1


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        print('Qwen catalogue error: ' + str(error), file=sys.stderr)
        raise SystemExit(1)
