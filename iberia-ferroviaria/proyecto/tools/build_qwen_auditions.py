"""Reproduce long Spanish Qwen auditions from verified, local inputs.

This tool stages WAV/MP3 files and a manifest for build_voice_auditions.mjs.
It never downloads weights or publishes game assets. --dry-run uses only the
standard library and ffmpeg/ffprobe; it does not import Torch or load the model.
"""
import argparse
from array import array
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import random
import re
import resource
import shutil
import subprocess
import sys
import time
import wave

MODEL_REPOSITORY = 'Qwen/Qwen3-TTS-12Hz-0.6B-Base'
MODEL_REVISION = '5d83992436eae1d760afd27aff78a71d676296fc'
MODEL_FILES = [
    {'path': '.gitattributes', 'bytes': 1519, 'sha256': '11ad7efa24975ee4b0c3c3a38ed18737f0658a5f75a0a96787b576a78a023361'},
    {'path': 'README.md', 'bytes': 3640, 'sha256': '181187b6057906bd960bc7f938d0b7a16652509776a0d52c4885b4ae5ccda0ea'},
    {'path': 'config.json', 'bytes': 4494, 'sha256': '2e714c787c8edb98b05432685cddb634add2de4d4e645f653d68251ef72ba011'},
    {'path': 'generation_config.json', 'bytes': 245, 'sha256': 'f1b90b4513f3b34c62851049e2492d7b4c5940daf1276f89c82b8ef04127f3aa'},
    {'path': 'merges.txt', 'bytes': 1671839, 'sha256': '599bab54075088774b1733fde865d5bd747cbcc7a547c5bc12610e874e26f5e3'},
    {'path': 'model.safetensors', 'bytes': 1829344272, 'sha256': '180b3b10eb1c9f1b4db7806d5475bae3071c0243c299d49926bab1da3b6946f6'},
    {'path': 'preprocessor_config.json', 'bytes': 127, 'sha256': 'efdde1022ea9d76928bf7a9cd53139138f5ba2e466e837f08f6105ab1af1c119'},
    {'path': 'speech_tokenizer/config.json', 'bytes': 2336, 'sha256': 'ee65bb901c876664ab8707c487157aa1a6ee57c65969b28fb5ec9dc211e68167'},
    {'path': 'speech_tokenizer/configuration.json', 'bytes': 76, 'sha256': '6bc26d64eb5024b4d1dab5a52371958b429256d6c9d59787f1f5294a54e0cebd'},
    {'path': 'speech_tokenizer/model.safetensors', 'bytes': 682293092, 'sha256': '836b7b357f5ea43e889936a3709af68dfe3751881acefe4ecf0dbd30ba571258'},
    {'path': 'speech_tokenizer/preprocessor_config.json', 'bytes': 234, 'sha256': 'fcb3805e597e786d4067706e602f6688524640f8d3396790e2e09b5942fcbdfb'},
    {'path': 'tokenizer_config.json', 'bytes': 7344, 'sha256': 'dc3c31c3bdaedd5016382bb3cbe07323026775ad51f5a4fb564505992ae4a670'},
    {'path': 'vocab.json', 'bytes': 2776833, 'sha256': 'ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910'},
]
RUNTIME_VERSIONS = {'qwen-tts': '0.1.1', 'transformers': '4.57.3',
                    'accelerate': '1.12.0', 'torch': '2.6.0+cpu',
                    'torchaudio': '2.6.0+cpu', 'numpy': '2.5.3',
                    'soundfile': '0.14.0'}
ROLES = ('president', 'successor', 'minister', 'treasury', 'adif',
         'workshop', 'riders', 'mayor', 'rival')
MOODS = ('happy', 'angry', 'worried', 'proud', 'surprised',
         'disappointed', 'determined')
PROJECT = Path(__file__).resolve().parent.parent
SAMPLE_RATE = 24000
MAX_SECONDS = 84


def utc():
    return datetime.now(timezone.utc).isoformat()


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def hash_json(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                    separators=(',', ':')).encode()).hexdigest()


def atomic_json(path, value):
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def event(kind, **values):
    print(json.dumps({'event': kind, 'utc': utc(), **values}, ensure_ascii=False), flush=True)


def read_json(path):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as error:
        raise ValueError('Cannot read JSON: ' + str(path)) from error


def verify_model(model_dir, records=None):
    """Check the pinned model/codec bytes; no neural imports or remote lookup."""
    model_dir = Path(model_dir).resolve()
    records = MODEL_FILES if records is None else records
    files = []
    for record in records:
        relative = Path(record['path'])
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError('Unsafe model file path')
        path = model_dir / relative
        if not path.is_file() or path.stat().st_size != record['bytes']:
            raise ValueError('Missing or incomplete pinned model file: ' + str(relative))
        if digest(path) != record['sha256']:
            raise ValueError('Pinned model SHA256 mismatch: ' + str(relative))
        files.append({'path': str(relative), 'bytes': record['bytes'], 'sha256': record['sha256']})
    if not files:
        raise ValueError('The pinned model manifest is empty')
    identity = {'repository': MODEL_REPOSITORY, 'revision': MODEL_REVISION, 'files': files}
    return {**identity, 'fingerprint': hash_json(identity), 'directory': str(model_dir)}


def reference_audio(path):
    """Inspect the closed PCM reference without NumPy, Torch or soundfile."""
    try:
        with wave.open(str(path), 'rb') as source:
            if (source.getnchannels(), source.getsampwidth(), source.getframerate()) != (1, 2, SAMPLE_RATE):
                raise ValueError('Reference must be PCM16 mono 24 kHz: ' + str(path))
            frames = source.getnframes()
            duration = frames / source.getframerate()
            if not 7 <= duration <= 12:
                raise ValueError('Reference must contain 7–12 seconds: ' + str(path))
            raw = source.readframes(frames)
    except (OSError, EOFError, wave.Error) as error:
        raise ValueError('Unreadable PCM reference: ' + str(path)) from error
    if len(raw) != frames * 2:
        raise ValueError('Truncated reference WAV: ' + str(path))
    values = array('h', raw)
    if sys.byteorder != 'little':
        values.byteswap()
    rms = math.sqrt(math.fsum(float(v) ** 2 for v in values) / len(values)) / 32768
    if not math.isfinite(rms) or rms < .0001:
        raise ValueError('Silent reference: ' + str(path))
    return {'duration_seconds': duration, 'sample_rate': SAMPLE_RATE, 'channels': 1, 'rms': rms}


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--model', required=True, type=Path, help='Local verified 0.6B-Base model directory')
    parser.add_argument('--references', required=True, type=Path, help='Closed prompts JSON, or directory containing prompts.json')
    parser.add_argument('--scripts', required=True, type=Path, help='JSON with samples[], two paragraphs and 88–102 words each')
    parser.add_argument('--output', required=True, type=Path, help='Audition staging directory; never a game asset directory')
    parser.add_argument('--person', action='append', default=[], help='Role id, repeated or comma-separated; default: roles in the reference pack')
    parser.add_argument('--seed', type=int, default=424242)
    parser.add_argument('--max-new-tokens', type=int, default=1024)
    parser.add_argument('--force', action='store_true', help='Regenerate rather than reuse matching valid takes')
    parser.add_argument('--dry-run', action='store_true', help='Verify local inputs and print the plan without loading the model or writing output')
    return parser.parse_args(argv)


def take_fingerprint(line, ref, model_fingerprint, parameters):
    return hash_json({'schema': 1, 'id': line['id'], 'person': line['person'],
                      'mood': line['mood'], 'text': line['text'],
                      'reference_sha256': ref['sha256'], 'reference_text': ref['ref_text'],
                      'model_fingerprint': model_fingerprint, 'parameters': parameters})


def prepare_reference(person, ref, directory):
    if not isinstance(ref, dict) or not isinstance(ref.get('ref_audio'), str) or not isinstance(ref.get('ref_text'), str) or not ref['ref_text'].strip():
        raise ValueError('Missing local audio or exact reference text: ' + person)
    if re.match(r'^[A-Za-z][A-Za-z0-9+.-]*://', ref['ref_audio']):
        raise ValueError('Remote reference audio is forbidden: ' + person)
    path = Path(ref['ref_audio'])
    if not path.is_absolute():
        path = directory / path
    path = path.resolve()
    expected = ref.get('sha256')
    if not isinstance(expected, str) or not re.fullmatch(r'[0-9a-f]{64}', expected):
        raise ValueError('Reference SHA256 is required: ' + person)
    if not path.is_file() or digest(path) != expected:
        raise ValueError('Reference SHA256 mismatch: ' + person)
    return {**ref, 'ref_audio': str(path), **reference_audio(path)}


def build_plan(args):
    if not 0 <= args.seed < 2 ** 32:
        raise ValueError('Seed must be an unsigned 32-bit integer')
    if args.max_new_tokens < 1024:
        raise ValueError('Long auditions require at least 1024 new tokens')
    for binary in ('ffmpeg', 'ffprobe'):
        if not shutil.which(binary):
            raise ValueError('Missing required executable: ' + binary)
    references_file = args.references / 'prompts.json' if args.references.is_dir() else args.references
    references_file = references_file.resolve()
    payload = read_json(references_file)
    prompts = payload.get('prompts') if isinstance(payload, dict) else None
    if not isinstance(prompts, dict) or not prompts:
        raise ValueError('Reference pack must contain a non-empty prompts object')
    scripts_file = args.scripts.resolve()
    scripts = read_json(scripts_file)
    samples = scripts.get('samples') if isinstance(scripts, dict) else None
    if not isinstance(samples, list) or not samples:
        raise ValueError('Scripts must contain a non-empty samples list')
    people = list(dict.fromkeys(part.strip() for value in args.person for part in value.split(','))) if args.person else list(prompts)
    if not people or any(person not in ROLES for person in people):
        raise ValueError('Unknown or empty --person role')
    lines = {}
    ids = set()
    for sample in samples:
        if not isinstance(sample, dict) or sample.get('person') not in ROLES:
            raise ValueError('Unknown script role')
        line = dict(sample)
        person = line['person']
        if person in lines:
            raise ValueError('Duplicate script role: ' + person)
        line.setdefault('id', 'audition-' + person + '-long-qwen-v1')
        line.setdefault('mood', 'happy')
        if not isinstance(line['id'], str) or not re.fullmatch(r'[A-Za-z0-9_-]+', line['id']) or line['id'] in ids:
            raise ValueError('Unsafe or duplicate script id')
        ids.add(line['id'])
        if line['mood'] not in MOODS:
            raise ValueError('Unknown script mood')
        text = line.get('text')
        if not isinstance(text, str) or len([p for p in re.split(r'\n\s*\n', text) if p.strip()]) != 2:
            raise ValueError('Exactly two paragraphs required: ' + person)
        if 'paragraphs' in line and (not isinstance(line['paragraphs'], list) or len(line['paragraphs']) != 2
                                     or not all(isinstance(p, str) and p.strip() for p in line['paragraphs'])
                                     or text != '\n\n'.join(line['paragraphs'])):
            raise ValueError('Paragraph metadata differs from text: ' + person)
        count = len(text.split())
        if not 88 <= count <= 102:
            raise ValueError('Audition must contain 88–102 words: ' + person)
        line.update(word_count=count, paragraphs=2)
        lines[person] = line
    parameters = {'generator_schema': 2, 'device': 'cpu', 'dtype': 'float32',
                  'attention': 'sdpa', 'threads': 3, 'interop_threads': 1,
                  'seed': args.seed, 'max_new_tokens': args.max_new_tokens,
                  'language': 'Spanish', 'x_vector_only_mode': False,
                  'eos_observer_schema': 1,
                  'sample_rate': SAMPLE_RATE, 'wav_subtype': 'FLOAT', 'mp3_bitrate': '160k',
                  'target_lufs': -17, 'maximum_true_peak_dbfs': -1.5,
                  'processing': 'Constant gain only; no EQ, compressor, limiter, pitch or tempo changes.',
                  'runtime_versions': RUNTIME_VERSIONS}
    prepared = {}
    for person in people:
        if person not in lines or person not in prompts:
            raise ValueError('Missing selected script or reference: ' + person)
        prepared[person] = prepare_reference(person, prompts[person], references_file.parent)
    model = verify_model(args.model)
    output = args.output.resolve()
    if output.is_relative_to(PROJECT / 'dist') or output.is_relative_to(Path(model['directory'])) or output == references_file.parent:
        raise ValueError('Output must be separate from game assets, weights and references')
    items = [lines[person] for person in people]
    for item in items:
        item['fingerprint'] = take_fingerprint(item, prepared[item['person']], model['fingerprint'], parameters)
    return {'schema': 1, 'model': model, 'parameters': parameters, 'references': prepared,
            'reference_pack_file': str(references_file), 'available_items': list(lines.values()),
            'reference_pack_sha256': digest(references_file), 'scripts_sha256': digest(scripts_file),
            'items': items, 'output': str(output), 'human_listening': False}


def decode_metrics(path):
    """Fully decode local audio, so resume cannot trust a hash/manifest alone."""
    probe = subprocess.run(['ffprobe', '-v', 'error', '-protocol_whitelist', 'file,pipe',
                            '-select_streams', 'a', '-show_entries',
                            'stream=codec_name,sample_rate,channels:format=duration',
                            '-of', 'json', str(path)], capture_output=True, text=True, check=True, timeout=60)
    metadata = json.loads(probe.stdout)
    streams = metadata.get('streams', [])
    if len(streams) != 1 or int(streams[0]['sample_rate']) != SAMPLE_RATE or streams[0]['channels'] != 1:
        raise ValueError('Expected one mono 24 kHz audio stream')
    duration = float(metadata['format']['duration'])
    if not math.isfinite(duration) or not .2 <= duration < MAX_SECONDS:
        raise ValueError('Invalid audio duration')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-protocol_whitelist', 'file,pipe',
                          '-i', str(path), '-map', '0:a:0', '-f', 'f32le', '-codec:a',
                          'pcm_f32le', '-'], capture_output=True, check=True, timeout=60).stdout
    if not raw or len(raw) % 4:
        raise ValueError('Audio did not decode completely')
    values = array('f', raw)
    if sys.byteorder != 'little':
        values.byteswap()
    if not all(math.isfinite(v) for v in values):
        raise ValueError('Non-finite decoded audio')
    rms = math.sqrt(math.fsum(float(v) ** 2 for v in values) / len(values))
    if rms < .0001:
        raise ValueError('Silent decoded audio')
    if abs(len(values) / SAMPLE_RATE - duration) > .15:
        raise ValueError('Decoded audio length differs from metadata')
    return {'duration': duration, 'rms': rms, 'peak': max(abs(v) for v in values),
            'samples': len(values), 'sample_rate': SAMPLE_RATE, 'channels': 1,
            'codec': streams[0]['codec_name'], 'finite': True}


def reusable_take(record, line, fingerprint, output_dir):
    if not isinstance(record, dict) or record.get('validated') is not True:
        return False
    if any(record.get(key) != line[key] for key in ('id', 'person', 'mood', 'text')) or record.get('input_fingerprint') != fingerprint:
        return False
    if isinstance(record.get('eos_observation'), dict) and record['eos_observation'].get('token_limit_without_eos') is True:
        return False
    try:
        duration = float(record['duration'])
        if not math.isfinite(duration) or duration <= 0:
            return False
        output_dir = Path(output_dir)
        encoded, raw = (output_dir / (line['id'] + suffix) for suffix in ('.mp3', '.wav'))
        if digest(encoded) != record['sha256'] or digest(raw) != record['raw_sha256']:
            return False
        encoded_metrics, raw_metrics = decode_metrics(encoded), decode_metrics(raw)
        return (encoded_metrics['codec'] == 'mp3' and raw_metrics['codec'] == 'pcm_f32le'
                and abs(encoded_metrics['duration'] - duration) < .05
                and abs(raw_metrics['duration'] - encoded_metrics['duration']) < .15)
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
        return False


def reusable_raw(record, line, fingerprint, output_dir):
    """A failed encoder must not require another expensive, identical inference."""
    if not isinstance(record, dict) or record.get('raw_validated') is not True:
        return False
    if any(record.get(key) != line[key] for key in ('id', 'person', 'mood', 'text')) or record.get('input_fingerprint') != fingerprint:
        return False
    if isinstance(record.get('eos_observation'), dict) and record['eos_observation'].get('token_limit_without_eos') is True:
        return False
    try:
        raw = Path(output_dir) / (line['id'] + '.wav')
        if digest(raw) != record['raw_sha256']:
            return False
        metrics = decode_metrics(raw)
        return (metrics['codec'] == 'pcm_f32le'
                and abs(metrics['duration'] - float(record['duration_seconds'])) < .02)
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
        return False


def preserve_unselected(previous, plan, output):
    """Regenerating one role must not discard other verified work in the pack."""
    kept = {'items': [], 'references': {}, 'takes': {}, 'raw_takes': {}}
    if (not isinstance(previous.get('model'), dict)
            or previous['model'].get('fingerprint') != plan['model']['fingerprint']
            or previous.get('parameters') != plan['parameters']
            or previous.get('scripts_sha256') != plan['scripts_sha256']
            or previous.get('reference_pack_sha256') != plan['reference_pack_sha256']):
        return kept
    pack = Path(plan['reference_pack_file'])
    if digest(pack) != plan['reference_pack_sha256']:
        raise ValueError('Reference pack changed after preflight')
    prompts = read_json(pack)['prompts']
    selected = {line['id'] for line in plan['items']}
    for line in plan['available_items']:
        person = line['person']
        if line['id'] in selected or person not in prompts:
            continue
        try:
            ref = prepare_reference(person, prompts[person], pack.parent)
            fingerprint = take_fingerprint(line, ref, plan['model']['fingerprint'], plan['parameters'])
            old_take = previous.get('takes', {}).get(line['id'])
            old_raw = previous.get('raw_takes', {}).get(line['id'])
            if reusable_take(old_take, line, fingerprint, output):
                kept['takes'][line['id']] = old_take
            if reusable_raw(old_raw, line, fingerprint, output):
                kept['raw_takes'][line['id']] = old_raw
            if line['id'] in kept['takes'] or line['id'] in kept['raw_takes']:
                kept['items'].append({**line, 'fingerprint': fingerprint})
                kept['references'][person] = ref
        except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
            continue
    return kept


def observe_talker(talker, observations):
    """Observe codec token termination, returning the unmodified model result.

    Qwen's public audio API discards the tokens. The pinned implementation calls
    talker.generate with inputs_embeds, so returned sequences contain new tokens.
    Unknown observability is recorded explicitly and is not evidence of EOS.
    """
    original = talker.generate

    def wrapped(*args, **kwargs):
        result = original(*args, **kwargs)
        try:
            sequences = result.sequences
            rows = sequences.tolist() if hasattr(sequences, 'tolist') else sequences
            if not isinstance(rows, list) or len(rows) != 1 or not isinstance(rows[0], list):
                raise ValueError('Expected a single token sequence')
            input_ids = kwargs.get('input_ids')
            if input_ids is not None:
                inputs = input_ids.tolist() if hasattr(input_ids, 'tolist') else input_ids
                prefix = len(inputs[0])
            elif args:
                raise ValueError('Positional input token count is unknown')
            else:
                prefix = 0
            tokens = rows[0][prefix:]
            cap = kwargs.get('max_new_tokens')
            eos = kwargs.get('eos_token_id')
            eos_ids = eos if isinstance(eos, (list, tuple)) else [eos]
            if not tokens or not isinstance(cap, int) or cap <= 0 or any(not isinstance(v, int) for v in eos_ids):
                raise ValueError('Token cap or EOS id is not observable')
            found = any(token in eos_ids for token in tokens)
            observations.append({'status': 'observed', 'input_tokens': prefix,
                                 'generated_tokens': len(tokens), 'max_new_tokens': cap,
                                 'last_token': tokens[-1], 'eos_token_ids': list(eos_ids),
                                 'eos_found': found, 'ended_with_eos': tokens[-1] in eos_ids,
                                 'token_limit_without_eos': len(tokens) >= cap and not found})
        except (AttributeError, ValueError, TypeError, IndexError) as error:
            observations.append({'status': 'unknown', 'reason': str(error),
                                 'eos_found': None, 'token_limit_without_eos': None})
        return result

    talker.generate = wrapped

    def restore():
        talker.generate = original

    return restore


def measure_loudness(path):
    process = subprocess.run(['ffmpeg', '-v', 'info', '-protocol_whitelist', 'file,pipe',
                              '-i', str(path), '-af', 'loudnorm=I=-17:TP=-1.5:LRA=50:print_format=json',
                              '-f', 'null', '-'], capture_output=True, text=True, check=True, timeout=60)
    # ffmpeg may emit progress/summary lines after loudnorm's JSON object.
    stats, _ = json.JSONDecoder().raw_decode(process.stderr[process.stderr.rfind('{'):])
    result = {'lufs': float(stats['input_i']), 'true_peak_dbfs': float(stats['input_tp'])}
    if not all(math.isfinite(value) for value in result.values()):
        raise ValueError('Non-finite loudness measurement')
    return result


def encode_mp3(raw, encoded):
    """One constant gain; recalculate for MP3 peak overshoot, never compress."""
    source = measure_loudness(raw)
    gain = min(-17 - source['lufs'], -1.5 - source['true_peak_dbfs'])
    for attempt in range(3):
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-protocol_whitelist', 'file,pipe',
                        '-i', str(raw), '-af', 'volume=' + str(gain) + 'dB', '-ac', '1',
                        '-ar', str(SAMPLE_RATE), '-codec:a', 'libmp3lame', '-b:a', '160k',
                        str(encoded)], check=True, timeout=60)
        output = measure_loudness(encoded)
        if output['true_peak_dbfs'] <= -1.5 and output['lufs'] <= -16.95:
            return {'raw_lufs': source['lufs'], 'raw_true_peak_dbfs': source['true_peak_dbfs'],
                    'constant_gain_db': gain, 'expected_output_lufs': source['lufs'] + gain,
                    'mp3_lufs': output['lufs'], 'mp3_true_peak_dbfs': output['true_peak_dbfs'],
                    'mp3_bitrate': '160k', 'encoding_passes': attempt + 1}
        gain -= max(output['true_peak_dbfs'] + 1.5, output['lufs'] + 17, 0) + .05
    raise ValueError('Encoded MP3 still exceeds its loudness or peak target')


def finish_raw_take(record, line, output):
    raw = output / (line['id'] + '.wav')
    encoded = output / (line['id'] + '.mp3')
    loudness = encode_mp3(raw, encoded)
    raw_metrics, encoded_metrics = decode_metrics(raw), decode_metrics(encoded)
    if raw_metrics['codec'] != 'pcm_f32le' or encoded_metrics['codec'] != 'mp3' or abs(raw_metrics['duration'] - encoded_metrics['duration']) > .15:
        raise ValueError('Unexpected encoded audio or duration')
    return {**record, 'duration': encoded_metrics['duration'], 'sha256': digest(encoded),
            'mp3': encoded.name, 'validated': True, 'encoded_at': utc(), **loudness}


def validate_runtime():
    actual = {name: importlib.metadata.version(name) for name in RUNTIME_VERSIONS}
    if actual != RUNTIME_VERSIONS:
        raise ValueError('Runtime differs from requirements-qwen-voices.txt: ' + json.dumps(actual))
    return actual


def offline_environment():
    for name in ('HF_HUB_OFFLINE', 'TRANSFORMERS_OFFLINE', 'HF_DATASETS_OFFLINE', 'HF_HUB_DISABLE_TELEMETRY'):
        os.environ[name] = '1'
    os.environ['OMP_NUM_THREADS'] = '3'
    os.environ['MKL_NUM_THREADS'] = '3'


def acquire_lock(output):
    lock = output / '.qwen-auditions.lock'
    try:
        descriptor = os.open(lock, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        try:
            previous = read_json(lock)
            os.kill(int(previous['pid']), 0)
        except ProcessLookupError:
            lock.unlink()
            return acquire_lock(output)
        except (OSError, ValueError, KeyError, TypeError):
            raise ValueError('Existing audition lock needs inspection: ' + str(lock))
        raise ValueError('Another process is using the output directory: ' + str(lock))
    with os.fdopen(descriptor, 'w') as stream:
        json.dump({'pid': os.getpid(), 'started_at': utc()}, stream)
    return lock


def generate(plan, force=False):
    output = Path(plan['output'])
    output.mkdir(parents=True, exist_ok=True)
    lock = acquire_lock(output)
    manifest_path = output / 'manifest.json'
    manifest = {'schema': 1, 'generator': 'Qwen long auditions', 'model': plan['model'],
                'parameters': plan['parameters'], 'references': plan['references'],
                'reference_pack_sha256': plan['reference_pack_sha256'],
                'scripts_sha256': plan['scripts_sha256'], 'items': plan['items'],
                'status': 'preflight', 'started_at': utc(), 'takes': {}, 'raw_takes': {},
                'human_listening': False, 'validation_scope': 'signal and full decode only; script coverage and acting are not certified'}
    try:
        preserved = {'items': [], 'references': {}, 'takes': {}, 'raw_takes': {}}
        if manifest_path.exists():
            previous = read_json(manifest_path)
            takes = previous.get('takes') if isinstance(previous, dict) else None
            if not isinstance(takes, dict):
                raise ValueError('Existing manifest has no valid takes object')
            manifest['takes'] = dict(takes)
            raw_takes = previous.get('raw_takes', {})
            if not isinstance(raw_takes, dict):
                raise ValueError('Existing manifest has an invalid raw_takes object')
            manifest['raw_takes'] = dict(raw_takes)
            preserved = preserve_unselected(previous, plan, output)
        pending, recovered = [], []
        for line in plan['items']:
            record = manifest['takes'].get(line['id'])
            if not force and reusable_take(record, line, line['fingerprint'], output):
                event('take_reused', id=line['id'])
            else:
                manifest['takes'].pop(line['id'], None)
                raw_record = manifest['raw_takes'].get(line['id'])
                if not force and reusable_raw(raw_record, line, line['fingerprint'], output):
                    recovered.append(line)
                else:
                    manifest['raw_takes'].pop(line['id'], None)
                    pending.append(line)
        # Retain unselected work only after checking the closed pack and audio.
        selected_ids = {line['id'] for line in plan['items']}
        manifest['takes'] = {**preserved['takes'], **{key: value for key, value in manifest['takes'].items() if key in selected_ids}}
        manifest['raw_takes'] = {**preserved['raw_takes'], **{key: value for key, value in manifest['raw_takes'].items() if key in selected_ids}}
        manifest['items'] = [*preserved['items'], *plan['items']]
        manifest['references'] = {**preserved['references'], **plan['references']}
        manifest['status'] = 'encoding' if recovered else 'loading' if pending else 'complete'
        atomic_json(manifest_path, manifest)
        for line in recovered:
            event('raw_take_reused', id=line['id'])
            take = finish_raw_take(manifest['raw_takes'][line['id']], line, output)
            manifest['takes'][line['id']] = take
            atomic_json(manifest_path, manifest)
        if not pending:
            manifest.update(status='complete', ended_at=utc())
            atomic_json(manifest_path, manifest)
            return manifest
        offline_environment()
        manifest['runtime_versions'] = validate_runtime()
        import numpy as np
        import soundfile as sf
        import torch
        from qwen_tts import Qwen3TTSModel
        torch.set_num_threads(3)
        torch.set_num_interop_threads(1)
        torch.use_deterministic_algorithms(True)
        event('model_load_started')
        start = time.monotonic()
        model = Qwen3TTSModel.from_pretrained(plan['model']['directory'], device_map='cpu',
            dtype=torch.float32, attn_implementation='sdpa', local_files_only=True, low_cpu_mem_usage=True)
        manifest['model_load_seconds'] = time.monotonic() - start
        devices = sorted({str(p.device) for p in model.model.parameters()})
        dtypes = sorted({str(p.dtype) for p in model.model.parameters()})
        if devices != ['cpu'] or dtypes != ['torch.float32'] or model.model.config._attn_implementation != 'sdpa':
            raise ValueError('Unexpected Qwen device, dtype or attention implementation')
        if str(model.model.speech_tokenizer.device) != 'cpu' or str(model.model.speech_tokenizer.model.dtype) != 'torch.float32':
            raise ValueError('Unexpected codec device or dtype')
        manifest.update(status='running', actual_devices=devices, actual_dtypes=dtypes,
                        actual_attention='sdpa', generation_defaults=model.generate_defaults)
        atomic_json(manifest_path, manifest)
        event('model_loaded', seconds=manifest['model_load_seconds'])
        for line in pending:
            ref = plan['references'][line['person']]
            # Recheck the actual inputs immediately before each expensive take.
            if digest(ref['ref_audio']) != ref['sha256']:
                raise ValueError('Reference changed since preflight: ' + line['person'])
            random.seed(plan['parameters']['seed'])
            np.random.seed(plan['parameters']['seed'])
            torch.manual_seed(plan['parameters']['seed'])
            start = time.monotonic()
            prompt = model.create_voice_clone_prompt(ref_audio=ref['ref_audio'], ref_text=ref['ref_text'], x_vector_only_mode=False)
            conditioning_seconds = time.monotonic() - start
            started_at = utc()
            start = time.monotonic()
            event('inference_started', id=line['id'], person=line['person'], word_count=line['word_count'])
            observations = []
            restore = observe_talker(model.model.talker, observations)
            try:
                wavs, sr = model.generate_voice_clone(text=line['text'], language='Spanish',
                    voice_clone_prompt=prompt, max_new_tokens=plan['parameters']['max_new_tokens'])
            finally:
                restore()
            inference_seconds = time.monotonic() - start
            eos = observations[-1] if len(observations) == 1 else {'status': 'unknown', 'reason': 'Expected one talker call', 'observations': observations}
            manifest['last_generation'] = {'id': line['id'], 'inference_seconds': inference_seconds,
                                           'eos_observation': eos, 'ended_at': utc()}
            atomic_json(manifest_path, manifest)
            if any(row.get('token_limit_without_eos') is True for row in observations):
                raise ValueError('Generation reached max_new_tokens without EOS: ' + line['id'])
            audio = np.asarray(wavs[0], dtype=np.float32)
            if sr != SAMPLE_RATE or audio.ndim != 1 or not len(audio) or not np.isfinite(audio).all():
                raise ValueError('Invalid native Qwen waveform')
            duration = len(audio) / sr
            rms = float(np.sqrt(np.mean(audio.astype(np.float64) ** 2)))
            if rms < .0001 or not .2 <= duration < MAX_SECONDS:
                raise ValueError('Silent or excessive Qwen waveform')
            raw = output / (line['id'] + '.wav')
            sf.write(raw, audio, sr, subtype='FLOAT')
            raw_metrics = decode_metrics(raw)
            if raw_metrics['codec'] != 'pcm_f32le' or abs(raw_metrics['duration'] - duration) > .02:
                raise ValueError('Unexpected raw WAV or duration')
            raw_record = {'id': line['id'], 'person': line['person'], 'mood': line['mood'], 'text': line['text'],
                    'duration_seconds': duration, 'raw_sha256': digest(raw),
                    'raw_wav': raw.name, 'raw_validated': True, 'eos_observation': eos,
                    'input_fingerprint': line['fingerprint'], 'reference_sha256': ref['sha256'],
                    'reference_text': ref['ref_text'], 'model_fingerprint': plan['model']['fingerprint'],
                    'started_at': started_at, 'ended_at': utc(),
                    'conditioning_seconds': conditioning_seconds, 'inference_seconds': inference_seconds,
                    'rtf': inference_seconds / duration, 'word_count': line['word_count'], 'paragraphs': 2,
                    'sample_rate': sr, 'samples': len(audio), 'finite': True, 'rms': rms,
                    'peak': float(np.max(np.abs(audio))), 'raw_samples_at_or_above_one': int(np.count_nonzero(np.abs(audio) >= 1)),
                    'peak_rss_bytes': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024,
                    'human_listening': False, 'validation_scope': manifest['validation_scope'],
                    'processing': plan['parameters']['processing']}
            # Persist inference, identity and raw SHA before invoking the encoder.
            manifest['raw_takes'][line['id']] = raw_record
            manifest['status'] = 'encoding'
            atomic_json(manifest_path, manifest)
            take = finish_raw_take(raw_record, line, output)
            manifest['takes'][line['id']] = take
            manifest['status'] = 'running'
            atomic_json(manifest_path, manifest)
            event('inference_finished', id=line['id'], duration=duration, seconds=inference_seconds, sha256=take['sha256'])
        manifest.update(status='complete', ended_at=utc())
        atomic_json(manifest_path, manifest)
        return manifest
    except BaseException as error:
        manifest.update(status='failed', ended_at=utc(), error_type=type(error).__name__, error=str(error))
        atomic_json(manifest_path, manifest)
        raise
    finally:
        lock.unlink(missing_ok=True)


def main(argv=None):
    args = parse_args(argv)
    plan = build_plan(args)
    if args.dry_run:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return 0
    generate(plan, force=args.force)
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        print('Qwen audition error: ' + str(error), file=sys.stderr)
        raise SystemExit(1)
