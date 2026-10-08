"""Explicit continuous Qwen engine: BF16 talker, FP32 prompts/speaker/codec.

Importing this module is neural-free; inference requires an explicit mixed plan.
The verified sentence provider is passed as an argument and remains unchanged.
No automatic ASR decisions, downloads, publication or reference substitution.
"""
import math
from pathlib import Path
import random
import resource
import subprocess
import time

PRECISION = {
    'schema': 1, 'model_load_dtype': 'float32', 'talker_dtype': 'bfloat16',
    'code_predictor_dtype': 'bfloat16', 'speaker_encoder_dtype': 'float32',
    'codec_dtype': 'float32', 'prompt_formation_dtype': 'float32',
    'all_nine_prompts_formed_before_cast': True, 'late_prompt_creation': 'forbidden',
    'native_waveform_dtype': 'float32',
}


def recalculate_fingerprints(plan, provider):
    core = provider.core
    for batch in plan['all_batches']:
        parameters = {**plan['inference_parameters'], 'seed': batch['seed'],
                      'max_new_tokens': batch['max_new_tokens']}
        for index, item in enumerate(batch['items']):
            item.update(batch_id=batch['id'], batch_index=index, batch_seed=batch['seed'],
                        planned_token_cap=batch['max_new_tokens'])
            baseline = provider.clip_fingerprint(item, plan['references'][item['person']],
                                                 plan['model'], parameters, batch['context'])
            item['inference_fingerprint'] = core.hash_json({'schema': 1, 'continuous_provider': baseline,
                'canonical_sha256': item['canonical_sha256'], 'speech_sha256': item['speech_sha256'],
                'source': item['source'], 'kind': item['kind']})
            item['input_fingerprint'] = core.hash_json({'inference_fingerprint': item['inference_fingerprint'],
                                                       'mastering': plan['mastering']})


def configure_precision(plan, provider):
    plan['inference_parameters'].update(dtype='mixed', precision=PRECISION, precision_schema=1)
    plan['parameters'].update(dtype='mixed', precision=PRECISION, precision_schema=1)
    plan['precision'] = PRECISION
    plan['provider'] = 'Qwen3-TTS continuous mixed-precision full dialogues'
    recalculate_fingerprints(plan, provider)
    return plan


def apply_retry_seeds(plan, provider, retry_file=None):
    """Change only declared stable batches; an empty map preserves every FP."""
    core = provider.core
    retry_file = Path(retry_file).resolve() if retry_file else None
    seeds = core.read_json(retry_file) if retry_file else {}
    known = {batch['id'] for batch in plan['all_batches']}
    if (not isinstance(seeds, dict) or any(not isinstance(key, str) or key not in known
            or type(value) is not int or not 0 <= value < 2**32 for key, value in seeds.items())):
        raise ValueError('Retry seeds must name existing stable batches and uint32 values')
    selected = {item['id'] for item in plan['items']}
    for batch in plan['all_batches']:
        batch['seed'] = seeds.get(batch['id'], plan['inference_parameters']['seed'])
        if batch['id'] in seeds and any(item['id'] in selected for item in batch['items']):
            selected.update(item['id'] for item in batch['items'])
    plan['retry_seeds'] = seeds
    plan['retry_seed_file'] = str(retry_file) if retry_file else None
    plan['retry_seed_file_sha256'] = core.digest(retry_file) if retry_file else None
    plan['items'] = [item for item in plan['available_items'] if item['id'] in selected]
    plan['selected_count'] = len(plan['items'])
    plan['batches'] = sorted((batch for batch in plan['all_batches'] if any(item['id'] in selected for item in batch['items'])),
        key=lambda batch: (batch['priority'], batch['ordinal'], core.ROLES.index(batch['items'][0]['person'])))
    recalculate_fingerprints(plan, provider)
    return plan


def require_precision(plan):
    for key in ('parameters', 'inference_parameters'):
        current = plan[key]
        if current.get('dtype') != 'mixed' or current.get('precision') != PRECISION or current.get('precision_schema') != 1:
            raise ValueError('Mixed engine requires its explicit, unchanged precision descriptor')


def module_execution(module):
    return {'devices': sorted({str(value.device) for value in module.parameters()}),
            'dtypes': sorted({str(value.dtype) for value in module.parameters()})}


def precision_state(model):
    return {'talker': module_execution(model.model.talker),
            'code_predictor': module_execution(model.model.talker.code_predictor),
            'speaker_encoder': module_execution(model.model.speaker_encoder),
            'codec': module_execution(model.model.speech_tokenizer.model),
            'model_dtype_property': str(model.model.dtype),
            'attention': model.model.config._attn_implementation}


def assert_precision(state, converted):
    for name in ('talker', 'code_predictor', 'speaker_encoder', 'codec'):
        expected = 'torch.bfloat16' if converted and name in ('talker', 'code_predictor') else 'torch.float32'
        if state.get(name) != {'devices': ['cpu'], 'dtypes': [expected]}:
            raise ValueError('Unexpected precision/device for ' + name)
    expected_property = 'torch.bfloat16' if converted else 'torch.float32'
    if state.get('model_dtype_property') != expected_property or state.get('attention') != 'sdpa':
        raise ValueError('Unexpected Qwen dtype property or attention implementation')


def prompt_identity(prompt, core):
    def identity(tensor):
        tensor = tensor.detach().cpu().contiguous()
        return {'dtype': str(tensor.dtype), 'shape': list(tensor.shape),
                'sha256': core.hashlib.sha256(tensor.numpy().tobytes()).hexdigest()}
    return {'ref_code': identity(prompt.ref_code), 'ref_spk_embedding': identity(prompt.ref_spk_embedding),
            'ref_text': prompt.ref_text, 'x_vector_only_mode': prompt.x_vector_only_mode,
            'icl_mode': prompt.icl_mode}


def forbid_late_conditioning(*args, **kwargs):
    raise ValueError('New conditioning is forbidden after BF16 talker conversion')


def assert_inputs_unchanged(plan, core, sources):
    if core.digest(plan['catalogue_file']) != plan['catalogue_sha256']:
        raise ValueError('Complete catalogue changed while running')
    if core.digest(plan['reference_pack_file']) != plan['reference_pack_sha256']:
        raise ValueError('Reference pack changed while running')
    for person, ref in plan['references'].items():
        if core.digest(ref['ref_audio']) != ref['sha256']:
            raise ValueError('Physical reference changed while running: ' + person)
    if plan.get('retry_seed_file') and core.digest(plan['retry_seed_file']) != plan['retry_seed_file_sha256']:
        raise ValueError('Retry-seed map changed while running')
    for path, expected in sources.items():
        if core.digest(path) != expected:
            raise ValueError('Generation implementation changed while running: ' + path)


def run_generation(plan, provider):
    """Resume current native takes, then explicitly generate full-body batches."""
    core = provider.core
    require_precision(plan)
    stage = Path(plan['output'])
    stage.mkdir(parents=True, exist_ok=True)
    lock = core.acquire_lock(stage)
    target, manifest = stage / 'manifest.json', None
    sources = {str(Path(path).resolve()): core.digest(path)
               for path in (Path(__file__), Path(provider.__file__), Path(core.__file__),
                            core.PROJECT / 'tools' / 'build_qwen_dialogues.py')}
    try:
        previous = core.read_json(target) if target.exists() else {}
        manifest = provider.new_manifest(plan, previous)
        manifest.update(provider=plan['provider'], generation_unit=plan['generation_unit'],
                        precision=PRECISION, source_sha256=sources, conditioning=previous.get('conditioning', {}))
        for key in ('execution_before_conversion', 'actual_execution'):
            if key in previous:
                manifest[key] = previous[key]
        selected = {item['id'] for item in plan['items']}
        core.atomic_json(target, manifest)
        assert_inputs_unchanged(plan, core, sources)
        pending = []
        for batch in plan['batches']:
            needed = []
            for item in batch['items']:
                if item['id'] not in selected or item['id'] in manifest['takes']:
                    continue
                if item['id'] in manifest['raw_takes']:
                    manifest['status'] = 'encoding'
                    core.atomic_json(target, manifest)
                    manifest['takes'][item['id']] = provider.finish_raw(manifest['raw_takes'][item['id']], item, stage, plan['mastering'])
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
        manifest['execution_before_conversion'] = precision_state(model)
        assert_precision(manifest['execution_before_conversion'], converted=False)
        prompts = {}
        manifest['status'] = 'conditioning'
        core.atomic_json(target, manifest)
        for person in core.ROLES:
            ref = plan['references'][person]
            assert_inputs_unchanged(plan, core, sources)
            random.seed(424242); np.random.seed(424242); torch.manual_seed(424242)
            native = model.create_voice_clone_prompt(ref_audio=ref['ref_audio'], ref_text=ref['ref_text'], x_vector_only_mode=False)
            if (len(native) != 1 or native[0].ref_spk_embedding.dtype != torch.float32
                    or native[0].ref_code is None or native[0].ref_code.dtype != torch.int64
                    or native[0].ref_text != ref['ref_text'] or native[0].x_vector_only_mode or not native[0].icl_mode):
                raise ValueError('Conditioning differs from the closed FP32 reference: ' + person)
            prompts[person] = native[0]
            identity = prompt_identity(native[0], core)
            old = manifest['conditioning'].get(person)
            if old is not None and old.get('identity_sha256') != core.hash_json(identity):
                raise ValueError('Recreated frozen conditioning differs from the previous run: ' + person)
            manifest['conditioning'][person] = {'reference_sha256': ref['sha256'], 'reference_text': ref['ref_text'],
                'identity': identity, 'identity_sha256': core.hash_json(identity), 'formed_before_conversion': True}
            core.atomic_json(target, manifest)
            core.event('conditioning_ready', person=person)
        model.model.talker.to(dtype=torch.bfloat16)
        manifest['actual_execution'] = precision_state(model)
        assert_precision(manifest['actual_execution'], converted=True)
        model.create_voice_clone_prompt = forbid_late_conditioning
        model.model.extract_speaker_embedding = forbid_late_conditioning
        model.model.speech_tokenizer.encode = forbid_late_conditioning
        manifest.update(status='running', generation_defaults=model.generate_defaults)
        core.atomic_json(target, manifest)
        for batch, needed in pending:
            assert_inputs_unchanged(plan, core, sources)
            assert_precision(precision_state(model), converted=True)
            rows, conditioning = batch['items'], []
            for item in rows:
                person = item['person']
                if core.hash_json(prompt_identity(prompts[person], core)) != manifest['conditioning'][person]['identity_sha256']:
                    raise ValueError('Frozen FP32 conditioning mutated: ' + person)
                conditioning.append(prompts[person])
            random.seed(batch['seed']); np.random.seed(batch['seed']); torch.manual_seed(batch['seed'])
            eos_rows, codec_rows = [], []
            restore_eos = provider.observe_batch(model.model.talker, eos_rows)
            restore_codec = provider.observe_codec(model.model, codec_rows)
            start = time.monotonic()
            core.event('batch_started', id=batch['id'], clips=[item['id'] for item in rows],
                       needed=[item['id'] for item in needed], seed=batch['seed'], max_new_tokens=batch['max_new_tokens'], precision=PRECISION)
            try:
                wavs, rate = model.generate_voice_clone(text=[item['effective_text'] for item in rows],
                    language=['Spanish'] * len(rows), voice_clone_prompt=conditioning, max_new_tokens=batch['max_new_tokens'])
            finally:
                restore_codec(); restore_eos()
            elapsed = time.monotonic() - start
            assert_precision(precision_state(model), converted=True)
            if rate != 24000 or len(wavs) != len(rows) or len(eos_rows) != len(rows) or len(codec_rows) != len(rows):
                raise ValueError('Native output count/rate/EOS accounting changed')
            batch_record = {'id': batch['id'], 'clips': [item['id'] for item in rows], 'inference_seconds': elapsed,
                'seed': batch['seed'], 'max_new_tokens': batch['max_new_tokens'], 'precision': PRECISION,
                'latency_scope': 'whole batch; no individual inference time is asserted',
                'eos_observations': eos_rows, 'codec_observations': codec_rows, 'ended_at': core.utc()}
            manifest['batches'][batch['id']] = batch_record
            wanted, duration_sum = {item['id'] for item in needed}, 0
            # Register every valid native RAW before starting any encoder.
            for index, (item, waveform, eos) in enumerate(zip(rows, wavs, eos_rows)):
                if item['id'] not in wanted:
                    continue
                try:
                    if (eos.get('status') != 'observed' or eos.get('batch_index') != index
                            or not eos.get('eos_found') or eos.get('token_limit_without_eos') is not False):
                        raise ValueError('Unknown/missing EOS or cap without EOS')
                    audio = np.asarray(waveform)
                    if audio.dtype != np.float32 or audio.ndim != 1 or not len(audio) or not np.isfinite(audio).all():
                        raise ValueError('Native codec waveform is not finite float32 mono')
                    duration = len(audio) / rate
                    rms = float(np.sqrt(np.mean(audio.astype(np.float64) ** 2)))
                    if not .2 <= duration < core.MAX_SECONDS or not math.isfinite(rms) or rms < .0001:
                        raise ValueError('Silent or excessive native waveform')
                    raw = stage / (item['id'] + '.wav')
                    sf.write(raw, audio, rate, subtype='FLOAT')
                    if core.decode_metrics(raw)['codec'] != 'pcm_f32le':
                        raise ValueError('Native RAW float waveform failed decoding')
                    ref = plan['references'][item['person']]
                    record = {key: item[key] for key in ('id', 'person', 'mood', 'text', 'effective_text',
                        'input_fingerprint', 'inference_fingerprint', 'batch_id', 'batch_seed', 'planned_token_cap')}
                    record.update(duration_seconds=duration, raw_wav=raw.name, raw_sha256=core.digest(raw), raw_validated=True,
                        reference_sha256=ref['sha256'], reference_text=ref['ref_text'], model_fingerprint=plan['model']['fingerprint'],
                        batch_index=index, batch_inference_seconds=elapsed, latency_scope=batch_record['latency_scope'],
                        eos_observation=eos, codec_observation=codec_rows[index], samples=len(audio), sample_rate=rate, finite=True,
                        rms=rms, peak=float(np.max(np.abs(audio))), generated_at=core.utc(), human_listening=False,
                        validation_scope=plan['validation_scope'], precision=PRECISION,
                        conditioning_identity_sha256=manifest['conditioning'][item['person']]['identity_sha256'],
                        processing='Native float32 codec waveform; outer trim/gain/peak guard apply only to MP3.')
                    manifest['raw_takes'][item['id']] = record
                    manifest['failures'].pop(item['id'], None)
                    duration_sum += duration
                except (ValueError, OSError, subprocess.SubprocessError) as error:
                    manifest['failures'][item['id']] = {'person': item['person'], 'error': str(error), 'eos_observation': eos}
                core.atomic_json(target, manifest)
            batch_record['needed_raw_duration_seconds'] = duration_sum
            for item in needed:
                record = manifest['raw_takes'].get(item['id'])
                if record is None:
                    continue
                manifest['status'] = 'encoding'
                core.atomic_json(target, manifest)
                manifest['takes'][item['id']] = provider.finish_raw(record, item, stage, plan['mastering'])
                manifest['status'] = 'running'
                core.atomic_json(target, manifest)
                core.event('clip_finished', id=item['id'], person=item['person'], duration=record['duration_seconds'],
                           sha256=manifest['takes'][item['id']]['sha256'])
            core.event('batch_finished', id=batch['id'], seconds=elapsed,
                       peak_rss_bytes=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024)
        missing = [item['id'] for item in plan['items'] if item['id'] not in manifest['takes']]
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
