"""Compare staged voice clips with Whisper transcriptions for manual review.

From proyecto/:
  python tools/check_voice_transcripts.py ../investigacion/voces/audiciones-3.3 \
    --model /workspace/tools/whisper-tiny-http
  python tools/check_voice_transcripts.py ../investigacion/voces/generadas-3.3 \
    --model /workspace/tools/whisper-tiny-http --watch

The report resumes by audio SHA256 and model SHA256. It never changes audio,
accepts a take, deletes a take, or publishes assets. Whisper-tiny can mishear;
differences and repetition notices are listening prompts, not quality verdicts.
Long clips with differences receive additional overlapping ASR windows so a
word cut by an ASR chunk is not mistaken for a word missing from the audio.
"""
import argparse
from collections import Counter
import difflib
import hashlib
import json
import os
from pathlib import Path
import re
import time
import unicodedata

ANALYSIS_VERSION = 4
NEGATIONS = {'no', 'nunca', 'sin', 'tampoco', 'jamas'}
INSTRUCTIONS = set(('compra conecta asigna abre pulsa revisa refuerza cambia repara '
                    'contrata ajusta desbloquea cancela guarda pausa elige selecciona '
                    'anade investiga construye licita renueva vende retira manten '
                    'circule arregla confirma mira calcula espera pon deja consulta '
                    'informa ofrece reduce sube baja distribuye comprueba compara lee '
                    'aumenta invierte inspecciona pide electrifica abra consulte').split())
GAME_TERMS = set(('ancho via vias flota linea lineas senal tren trenes estacion '
                  'estaciones taller talleres maquinistas catenaria caja costes '
                  'demanda servicio servicios reparaciones licitar comprar '
                  'ertms ave alvia tarifa tarifas frecuencia frecuencias '
                  'electrificacion electrificar').split())
# These places distinguish actual routes and works in the opening tutorial.
# A transcription such as Salamanca -> "a la maca" stays a discrepancy; this
# vocabulary only draws attention to it, without repairing or accepting ASR.
GAME_LOCATIONS = {'madrid', 'valencia', 'salamanca', 'soria', 'torralba'}


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def cardinal(number):
    small = ('cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece '
             'catorce quince dieciseis diecisiete dieciocho diecinueve veinte veintiuno '
             'veintidos veintitres veinticuatro veinticinco veintiseis veintisiete '
             'veintiocho veintinueve').split()
    if number < len(small):
        return small[number]
    if number >= 1000:
        thousands, rest = divmod(number, 1000)
        prefix = 'mil' if thousands == 1 else cardinal(thousands) + ' mil'
        return prefix + (' ' + cardinal(rest) if rest else '')
    if number >= 100:
        if number == 100:
            return 'cien'
        hundreds = ('', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos',
                    'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos')
        base, rest = divmod(number, 100)
        return hundreds[base] + (' ' + cardinal(rest) if rest else '')
    tens = {30: 'treinta', 40: 'cuarenta', 50: 'cincuenta', 60: 'sesenta',
            70: 'setenta', 80: 'ochenta', 90: 'noventa'}
    base, rest = divmod(number, 10)
    return tens[base * 10] + (' y ' + small[rest] if rest else '')


def words(text):
    text = ''.join(character for character in unicodedata.normalize('NFKD', text.lower())
                   if not unicodedata.combining(character))
    tokens = re.findall(r'[a-z0-9]+', text)
    # Common ASR spelling: "40 por ciento" and "cuarenta por ciento".
    # Spanish railway gauges such as 1668 and the actual audition's 300 riders
    # are equivalent to their spoken cardinal spelling. Decimals stay visible.
    out = []
    for token in tokens:
        out.extend(cardinal(int(token)).split() if token.isdigit() and int(token) < 1000000 else [token])
    return out


def compare(expected, recognized):
    left, right = words(expected), words(recognized)
    differences = []
    for kind, a, b, c, d in difflib.SequenceMatcher(None, left, right, autojunk=False).get_opcodes():
        if kind != 'equal':
            differences.append({'kind': kind, 'expected': ' '.join(left[a:b]),
                                'recognized': ' '.join(right[c:d]),
                                'expected_range': [a, b], 'recognized_range': [c, d]})
    repeated = []
    for size in range(2, 5):
        want = Counter(tuple(left[i:i + size]) for i in range(max(0, len(left) - size + 1)))
        got = Counter(tuple(right[i:i + size]) for i in range(max(0, len(right) - size + 1)))
        for phrase, count in got.items():
            if count >= 3 and count > want[phrase]:
                repeated.append({'phrase': ' '.join(phrase), 'recognized_count': count,
                                 'expected_count': want[phrase]})
    prompts = []
    if not right:
        prompts.append('ASR returned no words; inspect the audio.')
    if any(item['kind'] == 'delete' for item in differences):
        prompts.append('Possible omitted words according to ASR; inspect the marked text.')
    if any(item['kind'] == 'replace' for item in differences):
        prompts.append('ASR differs from the script; this may be a recognition error.')
    if any(item['kind'] == 'insert' for item in differences):
        prompts.append('Possible extra words according to ASR; inspect the marked text.')
    if repeated:
        prompts.append('ASR contains repeated phrases absent from the script; inspect for a loop.')
    return {'normalized_equal': left == right, 'expected_normalized': ' '.join(left),
            'recognized_normalized': ' '.join(right), 'differences': differences,
            'repetition_notices': repeated, 'review_prompts': prompts}


def occurrences(sequence, phrase):
    if not phrase:
        return []
    return [index for index in range(len(sequence) - len(phrase) + 1)
            if sequence[index:index + len(phrase)] == phrase]


def inspect_transcript(expected, recognized, overlap_checks=(), duration_seconds=None):
    """Keep primary evidence and identify discrepancies corroborated by another window.

    Alternative ASR must match the missing/replaced words AND their unique
    surrounding context. An isolated common word is never enough. This is an
    inspection aid, not an assertion about what a listener hears in the clip.
    """
    result = compare(expected, recognized)
    left, right = words(expected), words(recognized)
    corroborated, unresolved = [], []
    for change in result['differences']:
        start, end = change['expected_range']
        context = left[max(0, start - 2):min(len(left), end + 2)]
        evidence = []
        if (change['kind'] in {'delete', 'replace'} and context
                and len(context) >= min(5, len(left))
                and len(occurrences(left, context)) == 1):
            for check in overlap_checks:
                if occurrences(words(check['recognized']), context):
                    evidence.append({'start_seconds': check['start_seconds'],
                                     'end_seconds': check['end_seconds'],
                                     'recognized': check['recognized']})
        if evidence:
            corroborated.append({**change, 'expected_context': ' '.join(context),
                                 'alternative_asr_evidence': evidence})
        else:
            unresolved.append(change)
    critical = []
    numeric = set(words(' '.join(cardinal(number) for number in range(101))))
    numeric.discard('y')
    numeric.update('ciento doscientos trescientos cuatrocientos quinientos seiscientos setecientos ochocientos novecientos mil'.split())
    for change in unresolved:
        changed_words = set(words(change['expected']) + words(change['recognized']))
        categories = []
        if changed_words & NEGATIONS:
            categories.append('negation')
        if changed_words & INSTRUCTIONS:
            categories.append('game_instruction')
        if changed_words & GAME_TERMS:
            categories.append('game_term')
        if changed_words & GAME_LOCATIONS:
            categories.append('game_location')
        if changed_words & numeric or any(token.isdigit() for token in changed_words):
            categories.append('number')
        if categories:
            a, b = change['expected_range']
            critical.append({**change, 'categories': categories,
                             'expected_context': ' '.join(left[max(0, a - 5):min(len(left), b + 5)]),
                             'notice': 'ASR discrepancy in consequential text; inspect audio, including adjacent words.'})
    ending = left[-min(8, len(left)):]
    primary_ending = bool(ending and right[-len(ending):] == ending)
    ending_windows = [{'start_seconds': check['start_seconds'], 'end_seconds': check['end_seconds']}
                      for check in overlap_checks
                      if (ending and words(check['recognized'])[-len(ending):] == ending
                          and (check.get('covers_audio_end') or
                               duration_seconds is not None and check['end_seconds'] >= duration_seconds))]
    status = ('corroborated_primary' if primary_ending else
              'corroborated_overlap' if ending_windows else 'asr_mismatch_requires_review')
    result.update({'analysis_version': ANALYSIS_VERSION,
                   'boundary_overlap_checks': list(overlap_checks),
                   'boundary_corroborated_differences': corroborated,
                   'unresolved_differences': unresolved,
                   'critical_text_notices': critical,
                   'closing_words_check': {'status': status,
                                           'expected': ' '.join(ending),
                                           'recognized_primary_final': ' '.join(right[-12:]),
                                           'overlap_evidence_windows': ending_windows}})
    if corroborated:
        result['review_prompts'].append('Some primary ASR discrepancies are corroborated in overlapping windows; preserve both readings.')
    if critical:
        result['review_prompts'].append('Inspect consequential text: negations, instructions, game terms, route locations or numbers differ in ASR.')
    if status == 'asr_mismatch_requires_review':
        result['review_prompts'].append('The script ending is not corroborated exactly by ASR; inspect the final phrase.')
    return result


def upgrade_cached_inspection(expected, previous):
    """Reanalyse cached evidence without running Whisper when no new window is needed.

    The caller must first verify the audio hash, model hash and expected text.
    Older v2 evidence with a missing ending still needs the terminal window
    introduced in v3. V4 changes only alert vocabulary, so all valid v3 evidence
    can be reused, including an unconfirmed ending; that warning stays visible.
    """
    checks = previous.get('boundary_overlap_checks', [])
    version = previous.get('analysis_version', 0)
    if (previous.get('expected') != expected or version < 2
            or not isinstance(previous.get('recognized'), str)
            or (version < 3 and previous.get('closing_words_check', {}).get('status') not in
                {'corroborated_primary', 'corroborated_overlap'})
            or not isinstance(checks, list)
            or any(not all(key in check for key in ('start_seconds', 'end_seconds', 'recognized'))
                   for check in checks)):
        return None
    recognized = previous['recognized']
    return {'recognized': recognized, 'duration_seconds': previous.get('duration_seconds'),
            **inspect_transcript(expected, recognized, checks, previous.get('duration_seconds'))}


class Transcriber:
    def __init__(self, model_dir):
        import torch
        from transformers import WhisperForConditionalGeneration, WhisperProcessor
        torch.set_num_threads(1)
        self.torch = torch
        self.processor = WhisperProcessor.from_pretrained(model_dir, local_files_only=True)
        self.model = WhisperForConditionalGeneration.from_pretrained(model_dir, local_files_only=True).eval()

    def decode(self, audio):
        inputs = self.processor(audio, sampling_rate=16000, return_tensors='pt',
                                return_attention_mask=True)
        with self.torch.inference_mode():
            ids = self.model.generate(inputs.input_features, attention_mask=inputs.attention_mask,
                                      language='es', task='transcribe', num_beams=5,
                                      repetition_penalty=1.1, max_new_tokens=240)
        return self.processor.batch_decode(ids, skip_special_tokens=True)[0].strip()

    def inspect(self, path, expected, cached_recognized=None):
        import librosa
        audio, _ = librosa.load(path, sr=16000, mono=True)
        if cached_recognized is None:
            # Keep every part of long speeches; never silently truncate at 30s.
            parts = [self.decode(audio[offset:offset + 16000 * 25])
                     for offset in range(0, len(audio), 16000 * 25)]
            recognized = ' '.join(part for part in parts if part)
        else:
            recognized = cached_recognized
        checks = []
        if compare(expected, recognized)['differences']:
            for boundary in range(16000 * 25, len(audio), 16000 * 25):
                start, end = max(0, boundary - 16000 * 8), min(len(audio), boundary + 16000 * 8)
                checks.append({'start_seconds': start / 16000, 'end_seconds': end / 16000,
                               'recognized': self.decode(audio[start:end]),
                               'covers_audio_end': end == len(audio),
                               'reason': 'Primary ASR differs; inspect words around a 25-second chunk boundary.'})
        preliminary = inspect_transcript(expected, recognized, checks, len(audio) / 16000)
        if (preliminary['closing_words_check']['status'] == 'asr_mismatch_requires_review'
                and len(audio) > 16000 * 12 and not any(check['covers_audio_end'] for check in checks)):
            start = max(0, len(audio) - 16000 * 12)
            checks.append({'start_seconds': start / 16000, 'end_seconds': len(audio) / 16000,
                           'recognized': self.decode(audio[start:]), 'covers_audio_end': True,
                           'reason': 'Primary ASR does not corroborate the script ending; inspect the final 12 seconds independently.'})
        return {'recognized': recognized, 'duration_seconds': len(audio) / 16000,
                **inspect_transcript(expected, recognized, checks, len(audio) / 16000)}

    def transcribe(self, path):
        import librosa
        audio, _ = librosa.load(path, sr=16000, mono=True)
        return ' '.join(self.decode(audio[offset:offset + 16000 * 25])
                        for offset in range(0, len(audio), 16000 * 25))


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, path)


def load_report(path):
    if not path.exists():
        return {'schema': 1, 'items': {}}
    report = json.loads(path.read_text(encoding='utf-8'))
    if report.get('schema') != 1 or not isinstance(report.get('items'), dict):
        raise ValueError('Unsupported transcript report schema: ' + str(path))
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('folder', type=Path)
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--model', type=Path,
                        default=Path(os.environ.get('IBERIA_ASR_MODEL', '/workspace/tools/whisper-tiny-http')))
    parser.add_argument('--watch', action='store_true')
    parser.add_argument('--poll', type=float, default=3)
    parser.add_argument('--idle-timeout', type=float, default=180)
    parser.add_argument('--expected-count', type=int,
                        help='Keep watching across successive subset runs until this many current audios have ASR reports.')
    args = parser.parse_args(argv)
    if not 0 < args.poll <= 60 or args.idle_timeout <= 0:
        parser.error('--poll must be between 0 and 60 seconds; --idle-timeout must be positive.')
    if args.expected_count is not None and args.expected_count <= 0:
        parser.error('--expected-count must be positive.')
    manifest_path = args.manifest or args.folder / 'manifest.json'
    output_path = args.output or args.folder / 'transcript-qa.json'
    if output_path.resolve() == manifest_path.resolve():
        parser.error('The report cannot replace the generation manifest.')
    model_path = args.model / 'model.safetensors'
    if not model_path.is_file():
        parser.error('No local Whisper weights: ' + str(model_path))
    model_hash = digest(model_path)
    report = load_report(output_path)
    report.update({'model_dir': str(args.model), 'model_sha256': model_hash,
                   'threads': 1, 'human_listening': False,
                   'purpose': 'Inspection report only; no automatic acceptance or deletion.',
                   'analysis_version': ANALYSIS_VERSION,
                   'normalization': 'Case, accents, punctuation and cardinal numbers from 0 to 999999.'})
    transcriber = None
    changed_at = time.monotonic()
    while True:
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        available = manifest.get('takes', {})
        if not isinstance(available, dict):
            raise ValueError('The generation manifest must contain a takes mapping.')
        items = manifest.get('run', {}).get('items', [])
        planned = {item['id'] for item in items}
        observed = {}
        for clip_id, take in available.items():
            if not re.fullmatch(r'[A-Za-z0-9_-]+', clip_id):
                raise ValueError('Unsafe clip identifier in manifest: ' + clip_id)
            if not take.get('validated'):
                continue
            audio_path = args.folder / (clip_id + '.mp3')
            if not audio_path.is_file():
                continue
            audio_hash = digest(audio_path)
            # A replaced file and its new manifest must agree before reading it.
            if take.get('sha256') and take['sha256'] != audio_hash:
                continue
            observed[clip_id] = audio_hash
            previous = report['items'].get(clip_id, {})
            expected = take.get('text', '')
            cached = previous.get('sha256') == audio_hash and previous.get('model_sha256') == model_hash
            if cached and previous.get('expected') == expected and previous.get('analysis_version') == ANALYSIS_VERSION:
                continue
            analysis = upgrade_cached_inspection(expected, previous) if cached else None
            if analysis is None:
                if transcriber is None:
                    transcriber = Transcriber(args.model)
                analysis = transcriber.inspect(audio_path, expected, previous['recognized'] if cached else None)
            if digest(audio_path) != audio_hash:
                # Generation replaced this clip while ASR was reading it.
                observed.pop(clip_id, None)
                continue
            row = {'id': clip_id, 'person': take.get('person'), 'mood': take.get('mood'),
                   'sha256': audio_hash, 'model_sha256': model_hash,
                   'expected': expected, 'effective_text': take.get('effective_text', expected),
                   **analysis}
            report['items'][clip_id] = row
            changed_at = time.monotonic()
            atomic_json(output_path, report)
            print(json.dumps({'id': clip_id, 'person': row['person'], 'expected': expected,
                              'recognized': row['recognized'], 'review_prompts': row['review_prompts']},
                             ensure_ascii=False), flush=True)
        checked = {clip_id for clip_id, take in available.items()
                   if observed.get(clip_id) == take.get('sha256')
                   and report['items'].get(clip_id, {}).get('sha256') == take.get('sha256')
                   and report['items'].get(clip_id, {}).get('model_sha256') == model_hash}
        failed = set(manifest.get('failures', {}))
        listening_review_ids = [clip_id for clip_id in checked
                                if (report['items'][clip_id].get('critical_text_notices')
                                    or report['items'][clip_id].get('repetition_notices')
                                    or report['items'][clip_id].get('closing_words_check', {}).get('status')
                                    == 'asr_mismatch_requires_review')]
        report['summary'] = {'planned': len(planned), 'available': len(available),
                             'checked_current_audio': len(checked),
                             'expected_count': args.expected_count,
                             'asr_listening_review_ids': sorted(listening_review_ids),
                             'generation_failures': sorted(failed),
                             'waiting_for': sorted(planned - checked - failed)}
        atomic_json(output_path, report)
        done = (len(checked) >= args.expected_count if args.expected_count is not None
                else planned and planned <= checked | failed)
        if not args.watch or done:
            break
        if time.monotonic() - changed_at >= args.idle_timeout:
            print('Stopped watching after inactivity; pending clips remain in the report.', flush=True)
            break
        time.sleep(args.poll)
    print(json.dumps(report['summary'], ensure_ascii=False), flush=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
