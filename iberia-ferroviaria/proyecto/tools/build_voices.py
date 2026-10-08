"""Produce XTTS-v2 takes, audition the cast, and publish validated clips atomically.

  python tools/build_voices.py generar MODEL --auditions --limit 9
  python tools/build_voices.py generar MODEL --person president --limit 20
  python tools/build_voices.py empaquetar --stage-dir AUDITIONS --package-partial
  python tools/build_voices.py generar MODEL --force

Auditions never alter production MP3s or assets. Partial publishing is explicit and
preserves the clips already embedded in the game. No synthetic pitch shifting is used.
IBERIA_VOICE_THREADS selects 1..4 CPU threads (default 3). An optional per-character
conditioning.json selects Spanish WAV style conditioning, with a studio timbre or
the WAV speaker embedding; its effective settings and WAV hashes identify the takes.
"""
import argparse
import base64
import glob
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
VOICES = ROOT.parent / 'investigacion' / 'voces'
REFS = Path(os.environ.get('IBERIA_VOICE_REFERENCES', str(VOICES / 'referencias')))
OUT = ROOT / 'dist' / 'assets' / 'voices.js'
RETRIES = 4
MOODS = ('happy', 'angry', 'worried', 'proud', 'surprised', 'disappointed', 'determined')
CAST = {
    'president': {'temperature': .68, 'speed': .94, 'repetition_penalty': 5.0},
    'minister': {'temperature': .77, 'speed': 1.0, 'repetition_penalty': 5.0},
    'successor': {'temperature': .73, 'speed': 1.01, 'repetition_penalty': 5.0},
    'treasury': {'temperature': .69, 'speed': .98, 'repetition_penalty': 5.0},
    'adif': {'temperature': .72, 'speed': .96, 'repetition_penalty': 5.0},
    'workshop': {'temperature': .73, 'speed': .94, 'repetition_penalty': 5.0},
    'riders': {'temperature': .77, 'speed': 1.04, 'repetition_penalty': 5.0},
    'mayor': {'temperature': .76, 'speed': 1.0, 'repetition_penalty': 5.0},
    'rival': {'temperature': .71, 'speed': 1.01, 'repetition_penalty': 5.0},
}
# Small delivery differences; the reference and the acoustic model retain the timbre.
EMOTION = {
    'happy': {'rate': 1.0, 'temperature': .01, 'target': 3.0},
    'angry': {'rate': 1.02, 'temperature': .015, 'target': 3.2},
    'worried': {'rate': .98, 'temperature': -.01, 'target': 2.4},
    'proud': {'rate': .98, 'temperature': -.015, 'target': 2.6},
    'surprised': {'rate': 1.03, 'temperature': .025, 'target': 3.5},
    'disappointed': {'rate': .96, 'temperature': -.02, 'target': 2.1},
    'determined': {'rate': .99, 'temperature': -.015, 'target': 2.6},
}


def atomic_json(path, value):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=path.parent, delete=False) as f:
        json.dump(value, f, ensure_ascii=False, indent=2); temp = Path(f.name)
    os.replace(temp, path)


def file_hash(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''): digest.update(chunk)
    return digest.hexdigest()


def voice_params(person, mood='happy', relative_rate=1.0):
    if person not in CAST: raise ValueError('Personaje desconocido: ' + person)
    if mood not in EMOTION: raise ValueError('Emoción desconocida: ' + mood)
    if not math.isfinite(relative_rate) or relative_rate <= 0: raise ValueError('Velocidad relativa inválida')
    p = dict(CAST[person]); emotion = EMOTION[mood]
    p['speed'] = max(.74, min(1.18, p['speed'] * emotion['rate'] * relative_rate))
    p['temperature'] = max(.6, min(.85, p['temperature'] + emotion['temperature']))
    return p


def speech_plan(item, direction):
    """Keep normal sentences whole; split only at the script's explicit delivery boundaries.

    Adjacent pieces with zero pause and the same rate remain one inference. A fragment
    under 35 characters ending in a comma joins its following clause to prevent an
    unfinished micro-utterance from stalling EOS. That merged sentence uses the
    character-weighted rate and its final pause; the tiny internal pause is traded for
    natural coarticulation. Complete sentences retain their explicitly scripted pauses.
    """
    chunks = direction.get(item.get('raw', item['text']))
    if not chunks: return [{'text': item['text'], 'rate': 1.0, 'pause_ms': 0}]
    plan = []
    for text, rate, pause in chunks:
        if not isinstance(text, str) or not text.strip(): raise ValueError('Trozo de dirección vacío')
        if not math.isfinite(float(rate)) or float(rate) <= 0 or not math.isfinite(float(pause)) or not 0 <= float(pause) <= 2000:
            raise ValueError('Dirección de voz inválida')
        part = {'text': text.strip(), 'rate': float(rate), 'pause_ms': int(round(float(pause)))}
        if plan and plan[-1]['pause_ms'] == 0 and plan[-1]['rate'] == part['rate']:
            plan[-1]['text'] += ' ' + part['text']; plan[-1]['pause_ms'] = part['pause_ms']
        else: plan.append(part)
    weights = [len(part['text']) for part in plan]
    i = 0
    while i < len(plan) - 1:
        first, following = plan[i:i + 2]
        if first['text'].endswith(',') and len(first['text']) < 35:
            weight = weights[i] + weights[i + 1]
            joined = {'text': first['text'] + ' ' + following['text'],
                      'rate': (first['rate'] * weights[i] + following['rate'] * weights[i + 1]) / weight,
                      'pause_ms': following['pause_ms']}
            plan[i:i + 2] = [joined]; weights[i:i + 2] = [weight]
        else: i += 1
    return plan


def directed(item, direction):
    """Readable planned text (generation uses the numeric plan, not punctuation guesses)."""
    return ' '.join(p['text'] for p in speech_plan(item, direction))


def input_hash(item, direction):
    payload = {'person': item['person'], 'mood': item.get('mood', 'happy'), 'plan': speech_plan(item, direction),
               'delivery': voice_params(item['person'], item.get('mood', 'happy')), 'pipeline': 2}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def voice_threads():
    """Keep inference within the four-core cloud budget; allow measured worker tuning."""
    value = os.environ.get('IBERIA_VOICE_THREADS', '3')
    if value not in ('1', '2', '3', '4'):
        raise ValueError('IBERIA_VOICE_THREADS debe ser un entero entre 1 y 4')
    return int(value)


def voice_reference(person, references=None):
    """Resolve optional Spanish style conditioning without loading the neural runtime.

    A conditioning.json explicitly uses WAV GPT conditioning. Its studio speaker is
    optional: null retains the WAV speaker embedding, while a name replaces only
    that embedding. Without this file, the previous named/WAV selection is intact.
    """
    refs = Path(references) if references is not None else REFS
    folder = refs / person
    files = sorted(str(p) for p in folder.glob('*.wav'))
    config_file = folder / 'conditioning.json'
    named = folder / 'xtts-speaker.txt'
    if config_file.exists():
        try: supplied = json.loads(config_file.read_text(encoding='utf-8'))
        except (ValueError, OSError) as e: raise ValueError('conditioning.json inválido para ' + person) from e
        allowed = {'schema', 'style_from_wav', 'timbre_speaker', 'gpt_cond_len', 'gpt_cond_chunk_len', 'max_ref_length'}
        if not isinstance(supplied, dict) or set(supplied) - allowed:
            raise ValueError('Esquema de conditioning.json inválido para ' + person)
        if type(supplied.get('schema', 1)) is not int or supplied.get('schema', 1) != 1 or supplied.get('style_from_wav') is not True:
            raise ValueError('conditioning.json requiere schema 1 y style_from_wav:true para ' + person)
        speaker = supplied.get('timbre_speaker')
        if speaker is not None and (not isinstance(speaker, str) or not speaker.strip()):
            raise ValueError('timbre_speaker debe ser un nombre no vacío o null para ' + person)
        speaker = speaker.strip() if speaker is not None else None
        config = {'schema': 1, 'style_from_wav': True, 'timbre_speaker': speaker,
                  'gpt_cond_len': supplied.get('gpt_cond_len', 12),
                  'gpt_cond_chunk_len': supplied.get('gpt_cond_chunk_len', 6),
                  'max_ref_length': supplied.get('max_ref_length', 30)}
        length, chunk, maximum = (config[k] for k in ('gpt_cond_len', 'gpt_cond_chunk_len', 'max_ref_length'))
        if any(type(v) is not int for v in (length, chunk, maximum)) or not (6 <= length <= 90 and 1 <= chunk <= length and 30 <= maximum <= 90 and maximum >= length):
            raise ValueError('Longitudes de conditioning.json incoherentes para ' + person)
        if not files: raise ValueError('conditioning.json requiere WAV para ' + person)
        for filename in files:
            try:
                with wave.open(filename, 'rb') as audio:
                    frames, rate, channels, width = audio.getnframes(), audio.getframerate(), audio.getnchannels(), audio.getsampwidth()
                    if rate < 8000 or channels not in (1, 2) or width not in (1, 2, 3, 4) or frames / rate < .33:
                        raise ValueError('WAV demasiado corto o formato no válido')
                    if len(audio.readframes(frames)) != frames * channels * width:
                        raise ValueError('WAV truncado')
            except (wave.Error, EOFError, OSError, ValueError) as e:
                raise ValueError('WAV de conditioning inválido para ' + person + ': ' + filename) from e
        return {'mode': 'conditioned', 'files': files, 'speaker': speaker, 'conditioning': config}
    if named.exists():
        speaker = named.read_text(encoding='utf-8').strip()
        if not speaker: raise ValueError('Locutor XTTS vacío para ' + person)
        return {'mode': 'named', 'files': files, 'speaker': speaker}
    if files: return {'mode': 'wav', 'files': files, 'speaker': None}
    raise ValueError('Sin referencias para ' + person + ': ' + str(folder))


def preflight(model_dir, people=(), references=None):
    """Check prerequisites without importing Torch or loading 2 GB of model weights."""
    folder = Path(model_dir); required = ('config.json', 'model.pth', 'speakers_xtts.pth', 'vocab.json')
    missing = [str(folder / name) for name in required if not (folder / name).is_file() or not (folder / name).stat().st_size]
    if missing: raise ValueError('Modelo XTTS incompleto: ' + ', '.join(missing))
    for name in ('config.json', 'vocab.json'):
        try:
            value = json.loads((folder / name).read_text(encoding='utf-8'))
            if not isinstance(value, dict): raise ValueError('Se esperaba un objeto JSON')
        except (ValueError, OSError) as e: raise ValueError('Modelo JSON inválido: ' + name) from e
    refs = Path(references) if references is not None else REFS
    plans = {person: voice_reference(person, refs) for person in people}
    threads = voice_threads()
    for tool in ('ffmpeg', 'ffprobe'):
        if not shutil.which(tool): raise ValueError('Falta ' + tool)
    return {'model_dir': str(folder.resolve()), 'files': {name: (folder / name).stat().st_size for name in required},
            'references': str(refs.resolve()), 'people': list(people), 'torch_threads': threads,
            'conditioning': {person: plan['conditioning'] for person, plan in plans.items() if plan['mode'] == 'conditioned'}}


def generation_signatures(model_dir, people, references=None):
    """Invalidate resumed takes after a model/reference change without rereading 2 GB per phrase."""
    model = Path(model_dir)
    model_stamp = [(name, (model / name).stat().st_size, (model / name).stat().st_mtime_ns)
                   for name in ('config.json', 'model.pth', 'speakers_xtts.pth', 'vocab.json')]
    model_key = hashlib.sha256(json.dumps(model_stamp).encode()).hexdigest()
    refs = Path(references) if references is not None else REFS
    reference_keys = {}
    for person in people:
        plan = voice_reference(person, refs)
        if plan['mode'] == 'conditioned':
            payload = {'conditioning': plan['conditioning'],
                       'wav': [(Path(p).name, file_hash(p)) for p in plan['files']]}
            reference_keys[person] = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        else:
            named = refs / person / 'xtts-speaker.txt'
            sources = [named] if plan['mode'] == 'named' else [Path(p) for p in plan['files']]
            reference_keys[person] = hashlib.sha256(json.dumps([(p.name, file_hash(p)) for p in sources]).encode()).hexdigest()
    return model_key, reference_keys


def expressiveness(x, sr):
    """F0 spread in semitones, or None for unreliable voicing / octave artifacts."""
    import numpy as np
    import librosa
    y = librosa.resample(x, orig_sr=sr, target_sr=16000)
    f0, _, _ = librosa.pyin(y, fmin=60, fmax=450, sr=16000, frame_length=1024)
    f = f0[~np.isnan(f0)]
    if len(f) < 8 or len(f) < .25 * len(f0): return None
    st = 12 * np.log2(f / np.median(f))
    if np.mean(np.abs(np.diff(st)) > 7) > .03 or np.std(st) > 7: return None
    return float(np.std(st))


class Engine:
    def __init__(self, model_dir):
        preflight(model_dir)
        import torch
        from TTS.tts.configs.xtts_config import XttsConfig
        from TTS.tts.models.xtts import Xtts
        torch.set_num_threads(voice_threads())
        cfg = XttsConfig(); cfg.load_json(str(Path(model_dir) / 'config.json'))
        self.model = Xtts.init_from_config(cfg)
        self.model.load_checkpoint(cfg, checkpoint_dir=str(model_dir), eval=True)
        self.sr = 24000; self.latents = {}

    def voice(self, person):
        if person not in self.latents:
            plan = voice_reference(person)
            speaker = None
            if plan['speaker'] is not None:
                name = plan['speaker']
                if name not in self.model.speaker_manager.speakers: raise ValueError('Locutor XTTS desconocido: ' + name)
                speaker = self.model.speaker_manager.speakers[name]
            if plan['mode'] == 'named':
                self.latents[person] = (speaker['gpt_cond_latent'], speaker['speaker_embedding'])
            elif plan['mode'] == 'conditioned':
                config = plan['conditioning']
                gpt, wav_speaker = self.model.get_conditioning_latents(audio_path=plan['files'],
                    gpt_cond_len=config['gpt_cond_len'], gpt_cond_chunk_len=config['gpt_cond_chunk_len'],
                    max_ref_length=config['max_ref_length'])
                self.latents[person] = (gpt, speaker['speaker_embedding'] if speaker is not None else wav_speaker)
            else:
                self.latents[person] = self.model.get_conditioning_latents(audio_path=plan['files'], gpt_cond_len=30, max_ref_length=60)
        return self.latents[person]

    def say(self, person, text, mood='happy', relative_rate=1.0):
        import numpy as np
        gpt, speaker = self.voice(person); p = voice_params(person, mood, relative_rate)
        result = self.model.inference(text, 'es', gpt, speaker, enable_text_splitting=True, **p)
        return np.asarray(result['wav'], dtype=np.float32)


def trim_clause(audio, sr):
    """Remove redundant boundary silence, retaining 40 ms for releases and breaths."""
    import numpy as np
    x = np.asarray(audio, dtype=np.float32)
    if not len(x) or not np.all(np.isfinite(x)): return x
    active = np.flatnonzero(np.abs(x) > max(1e-4, float(np.max(np.abs(x))) * .002))
    if not len(active): return x
    margin = int(sr * .04)
    return x[max(0, int(active[0]) - margin):min(len(x), int(active[-1]) + margin + 1)]


def synthesize_directed(engine, item, direction):
    import numpy as np
    plan = speech_plan(item, direction); pieces = []
    for i, part in enumerate(plan):
        x = engine.say(item['person'], part['text'], mood=item.get('mood', 'happy'), relative_rate=part['rate'])
        if len(plan) > 1: x = trim_clause(x, engine.sr)
        pieces.append(np.asarray(x, dtype=np.float32))
        if i < len(plan) - 1 and part['pause_ms']:
            pieces.append(np.zeros(round(engine.sr * part['pause_ms'] / 1000), dtype=np.float32))
    return np.concatenate(pieces) if pieces else np.empty(0, dtype=np.float32)


def assess_take(audio, sr, text, mood='happy', pause_seconds=0, score_fn=expressiveness):
    import numpy as np
    x = np.asarray(audio); duration = len(x) / sr; spoken = max(.01, duration - pause_seconds)
    result = {'valid': False, 'score': None, 'quality': None, 'duration': duration, 'spoken_seconds': spoken,
              'cps': len(text) / spoken, 'reasons': []}
    if not len(x) or not np.all(np.isfinite(x)): result['reasons'].append('empty_or_nonfinite'); return result
    rms = float(np.sqrt(np.mean(np.square(x.astype(np.float64))))); result['rms'] = rms
    if rms < 2e-4 or float(np.max(np.abs(x))) < .002: result['reasons'].append('silent'); return result
    if len(text.strip()) < 20:
        if not .15 <= spoken <= 3.6: result['reasons'].append('short_duration')
    elif not 4.5 <= result['cps'] <= 28: result['reasons'].append('duration')
    if result['reasons']: return result
    score = score_fn(x, sr)
    if score is None or not math.isfinite(float(score)): result['reasons'].append('unreliable_voicing'); return result
    result['score'] = float(score)
    # Wide F0 swings are not a proxy for good acting. Preserve a plausible range and choose near the mood target.
    if not .2 <= score <= 5.5: result['reasons'].append('intonation_out_of_range'); return result
    result['quality'] = max(0, 1 - abs(score - EMOTION[mood]['target']) / 5)
    result['valid'] = True
    return result


class InvalidTakeError(ValueError):
    def __init__(self, message, metrics):
        super().__init__(message); self.metrics = metrics


def best_take(engine, item, direction=None, score_fn=expressiveness):
    direction = direction or {}; takes = []; best = None
    plan = speech_plan(item, direction); text = ' '.join(p['text'] for p in plan)
    pauses = sum(p['pause_ms'] for p in plan[:-1]) / 1000
    for _ in range(RETRIES):
        x = synthesize_directed(engine, item, direction)
        measure = assess_take(x, engine.sr, text, item.get('mood', 'happy'), pauses, score_fn)
        takes.append(measure)
        if measure['valid'] and (best is None or measure['quality'] > best[0]): best = (measure['quality'], x)
        if measure['valid'] and 2 <= measure['score'] <= 4.5 and measure['quality'] >= .9: break
    if best is None: raise InvalidTakeError('Todas las tomas fueron rechazadas: ' + item['id'], takes)
    return best[1], takes


def clip_duration(path):
    p = Path(path)
    if not p.is_file() or p.stat().st_size < 128: raise ValueError('MP3 ausente o vacío: ' + str(p))
    result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)], capture_output=True, text=True, check=True)
    duration = float(result.stdout.strip())
    if not math.isfinite(duration) or duration <= 0: raise ValueError('MP3 sin duración válida: ' + str(p))
    return duration


def encode_take(audio, sr, destination):
    import soundfile as sf
    destination = Path(destination); destination.parent.mkdir(parents=True, exist_ok=True)
    wav = mp3 = None
    try:
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f: wav = Path(f.name)
        with tempfile.NamedTemporaryFile(suffix='.mp3', dir=destination.parent, delete=False) as f: mp3 = Path(f.name)
        sf.write(wav, audio, sr)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-af',
                        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-17:TP=-1.5:LRA=11',
                        '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k', str(mp3)], check=True)
        duration = clip_duration(mp3); os.replace(mp3, destination)
        return duration
    finally:
        for path in (wav, mp3):
            if path and path.exists(): path.unlink()


def load_manifest(stage_dir):
    path = Path(stage_dir) / 'manifest.json'
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'schema': 1, 'takes': {}, 'failures': {}}


def valid_staged(item, stage_dir, manifest, direction, expected_sources=None):
    record = manifest.get('takes', {}).get(item['id']); path = Path(stage_dir) / (item['id'] + '.mp3')
    if expected_sources is not None:
        model_key, reference_keys = expected_sources
        if not record or record.get('model_key') != model_key or record.get('reference_key') != reference_keys.get(item['person']): return False
    return bool(record and record.get('validated') and record.get('model_key') and record.get('reference_key')
                and record.get('input_hash') == input_hash(item, direction)
                and path.is_file() and record.get('sha256') == file_hash(path))


def existing_clips(out):
    path = Path(out)
    if not path.exists(): return {}
    match = re.search(r'export const CLIPS\s*=\s*(\{.*\})\s*;', path.read_text(encoding='utf-8'), re.S)
    if not match: raise ValueError('No se pudo conservar el catálogo actual: ' + str(path))
    clips = json.loads(match[1])
    if not isinstance(clips, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in clips.items()): raise ValueError('Catálogo CLIPS inválido')
    return clips


def package_clips(lines, stage_dir, out=OUT, partial=False, production_dir=VOICES, direction=None, expected_sources=None):
    """Validate the entire requested publication before replacing its JS asset."""
    direction = direction or {}; manifest = load_manifest(stage_dir)
    previous = existing_clips(out) if partial else {}; clips = dict(previous)
    if expected_sources is None:
        readiness = manifest.get('run', {}).get('readiness') or {}
        if readiness.get('model_dir') and readiness.get('references'):
            references = os.environ.get('IBERIA_VOICE_REFERENCES') or readiness['references']
            people = list(dict.fromkeys(item['person'] for item in lines
                                       if manifest.get('takes', {}).get(item['id'], {}).get('validated')))
            preflight(readiness['model_dir'], people, references)
            expected_sources = generation_signatures(readiness['model_dir'], people, references)
    new = changed = replaced = 0; missing = []; seconds = 0; staged_ids = set()
    for item in lines:
        if expected_sources is not None and valid_staged(item, stage_dir, manifest, direction, expected_sources):
            path = Path(stage_dir) / (item['id'] + '.mp3'); new += 1; staged_ids.add(item['id'])
        else: missing.append(item['id']); continue
        seconds += clip_duration(path); encoded = base64.b64encode(path.read_bytes()).decode()
        if previous.get(item['id']) != encoded: changed += 1
        if item['id'] in previous: replaced += 1
        clips[item['id']] = encoded
    if missing and not partial: raise ValueError(f'Faltan {len(missing)} clips; no se ha modificado {out}: ' + ', '.join(missing[:8]))
    if partial and not new: raise ValueError('No hay tomas nuevas validadas para empaquetar; se conserva el catálogo actual')
    destination = Path(out); destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=destination.parent, delete=False) as f:
        f.write('// Voces del juego: tomas XTTS-v2 verificadas y clips anteriores conservados en publicaciones parciales.\n')
        f.write('export const CLIPS = ' + json.dumps(clips, separators=(',', ':')) + ';\n'); temp = Path(f.name)
    os.replace(temp, destination)
    result = {'clips': len(clips), 'validated_new': new, 'validated_staged': new, 'changed_clips': changed,
              'replaced_previous': replaced, 'previous_kept': len(set(previous) - staged_ids),
              'partial': partial, 'missing': missing, 'staged_seconds': seconds}
    atomic_json(Path(stage_dir) / 'publication.json', result)
    return result


def audition_lines(lines, people):
    selected = []
    # Mood outermost: --limit 9 auditions every actor once before the second emotional round.
    for mood in MOODS:
        for person in people:
            candidates = [item for item in lines if item['person'] == person and item.get('mood', 'happy') == mood]
            if not candidates: raise ValueError('No hay frase para la audición ' + person + '/' + mood)
            candidate = min(candidates, key=lambda item: (item.get('priority', 5), not 35 <= len(item['text']) <= 120, len(item['text'])))
            selected.append(candidate)
    return selected


def parser():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('command', nargs='?', choices=('generar', 'empaquetar'), default='empaquetar')
    p.add_argument('model', nargs='?')
    p.add_argument('--person', action='append', default=[]); p.add_argument('--limit', type=int)
    p.add_argument('--clip', action='append', default=[], help='Regenera exactamente estos IDs; repetible o separados por comas, sin --auditions ni --limit')
    p.add_argument('--auditions', nargs='?', const=''); p.add_argument('--stage-dir', type=Path)
    p.add_argument('--force', action='store_true'); p.add_argument('--package-partial', action='store_true')
    p.add_argument('--dry-run', action='store_true')
    return p


def main(argv=None):
    args = parser().parse_args(argv)
    people = [part for value in args.person for part in value.split(',')] or list(CAST)
    if any(person not in CAST for person in people): raise ValueError('Personaje desconocido en --person')
    people = list(dict.fromkeys(people))
    requested_clips = list(dict.fromkeys(part.strip() for value in args.clip for part in value.split(',')))
    if requested_clips and args.command != 'generar': raise ValueError('--clip requiere generar MODEL; la publicación parcial se solicita explícitamente con --package-partial')
    if requested_clips and args.auditions is not None: raise ValueError('--clip no se combina con --auditions: selecciona tomas exactas o un reparto de audición')
    if requested_clips and args.limit is not None: raise ValueError('--clip no se combina con --limit: se regeneran todos los IDs solicitados')
    if args.limit is not None and args.limit <= 0: raise ValueError('--limit debe ser positivo')
    if args.auditions is not None and args.command != 'generar': raise ValueError('--auditions requiere generar MODEL')
    if args.auditions is not None and args.package_partial: raise ValueError('Las audiciones no publican assets; revisa y empaqueta en un segundo comando explícito')
    lines = json.loads((VOICES / 'frases.json').read_text(encoding='utf-8'))
    direction = json.loads((ROOT / 'tools' / 'voice_direction.json').read_text(encoding='utf-8'))
    for item in lines:
        if not re.fullmatch(r'[A-Za-z0-9_-]+', item['id']): raise ValueError('Identificador de clip inválido')
        voice_params(item['person'], item.get('mood', 'happy'))
    catalogue_ids = {item['id']: item for item in lines}
    unknown = [clip for clip in requested_clips if clip not in catalogue_ids]
    if unknown: raise ValueError('IDs de clip desconocidos: ' + ', '.join(unknown))
    if requested_clips:
        selected = [catalogue_ids[clip] for clip in requested_clips]
        if args.person and any(item['person'] not in people for item in selected): raise ValueError('--person excluye alguno de los IDs solicitados con --clip')
        people = list(dict.fromkeys(item['person'] for item in selected))
    else:
        selected = audition_lines(lines, people) if args.auditions is not None else sorted((i for i in lines if i['person'] in people), key=lambda item: item.get('priority', 5))
    if args.limit is not None: selected = selected[:args.limit]
    if args.auditions is not None:
        stage = Path(args.auditions) if args.auditions else VOICES / ('audiciones-' + datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f'))
    else: stage = args.stage_dir or VOICES / 'generadas-3.3'
    readiness = None
    if args.command == 'generar':
        if not args.model: raise ValueError('Falta la carpeta MODEL')
        readiness = preflight(args.model, list(dict.fromkeys(i['person'] for i in selected)))
    plan = {'command': args.command, 'auditions': args.auditions is not None, 'selected': len(selected), 'catalogue': len(lines),
            'stage_dir': str(stage), 'readiness': readiness, 'items': [{'id': i['id'], 'person': i['person'], 'mood': i.get('mood', 'happy'), 'text': i['text']} for i in selected]}
    if args.dry_run: print(json.dumps(plan, ensure_ascii=False, indent=2)); return 0
    if args.command == 'empaquetar':
        result = package_clips(lines, stage, OUT, args.package_partial, direction=direction); print(json.dumps(result, ensure_ascii=False)); return 0
    stage.mkdir(parents=True, exist_ok=True); manifest = load_manifest(stage)
    manifest['run'] = plan; manifest.setdefault('failures', {})
    model_key, reference_keys = generation_signatures(args.model, people)
    # Publish the actual run plan before loading weights so the transcript watcher
    # cannot mistake a seeded audition plan for a finished production run.
    atomic_json(stage / 'manifest.json', manifest)
    engine = None; made = failed = 0
    for item in selected:
        previous = manifest.get('takes', {}).get(item['id'], {})
        same_source = previous.get('model_key') == model_key and previous.get('reference_key') == reference_keys[item['person']]
        if not args.force and not requested_clips and same_source and valid_staged(item, stage, manifest, direction): print('REANUDAR', item['person'], item.get('mood'), item['id'], flush=True); continue
        if engine is None: engine = Engine(args.model)
        try:
            audio, takes = best_take(engine, item, direction)
            destination = stage / (item['id'] + '.mp3'); duration = encode_take(audio, engine.sr, destination)
            manifest['takes'][item['id']] = {'id': item['id'], 'person': item['person'], 'mood': item.get('mood', 'happy'), 'text': directed(item, direction),
                'validated': True, 'input_hash': input_hash(item, direction), 'sha256': file_hash(destination), 'duration': duration,
                'model_key': model_key, 'reference_key': reference_keys[item['person']],
                'takes': takes, 'plan': speech_plan(item, direction), 'parameters': voice_params(item['person'], item.get('mood', 'happy'))}
            manifest['failures'].pop(item['id'], None); made += 1
            print(f"NUEVA {item['person']:9} {item.get('mood', 'happy'):12} {duration:5.2f}s {item['id']} {item['text'][:75]}", flush=True)
        except InvalidTakeError as error:
            # A forced/source-changed regeneration that failed must not make its previous staged file look new.
            manifest['takes'].pop(item['id'], None)
            failed += 1; manifest['failures'][item['id']] = {'person': item['person'], 'mood': item.get('mood', 'happy'), 'error': str(error), 'takes': error.metrics}
            print('RECHAZADA', item['id'], str(error), flush=True)
        atomic_json(stage / 'manifest.json', manifest)
    print(f'{made} tomas nuevas, {failed} rechazadas → {stage}', flush=True)
    if requested_clips and not args.package_partial: print('Tomas exactas preparadas en staging; no se ha modificado el asset del juego.', flush=True)
    if args.auditions is None and (args.package_partial or (not failed and not requested_clips)):
        try:
            result = package_clips(lines, stage, OUT, args.package_partial, direction=direction); print(json.dumps(result, ensure_ascii=False))
        except ValueError:
            if args.package_partial or (not args.person and args.limit is None): raise
            print('Catálogo parcial preparado; el asset conserva sus voces. Publica explícitamente con --package-partial tras revisar las tomas.')
    return 1 if failed else 0


if __name__ == '__main__':
    try: sys.exit(main())
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print('ERROR:', error, file=sys.stderr); sys.exit(1)
