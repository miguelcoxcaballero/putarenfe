#!/usr/bin/env python3
"""Production-catalogue integrity checks using synthetic audio, never TTS.

The model manifest consists of small pinned fixture files. Reference PCM,
RAW float WAV and encoded MP3 are real local files; no Torch or network is
required. These tests do not certify acting, identity or speech intelligibility.
"""
import array
import base64
import builtins
import contextlib
import copy
import importlib.util
import io
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock
import wave


HERE = Path(__file__).resolve().parent


def load_provider():
    spec = importlib.util.spec_from_file_location('qwen_catalogue_under_test', HERE / 'build_qwen_voices.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def pcm(path, seconds=10, silence_edges=False):
    rate = 24000
    samples = array.array('h')
    for i in range(round(seconds * rate)):
        t = i / rate
        silence = silence_edges and (t < .5 or 1.3 <= t < 2.3 or t >= 3.4)
        samples.append(0 if silence else round(6500 * math.sin(2 * math.pi * 173 * t)))
    if sys.byteorder != 'little':
        samples.byteswap()
    with wave.open(str(path), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(samples.tobytes())


class ProductionQwenTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.provider = load_provider()
        cls.fixture_tmp = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.fixture_tmp.cleanup)
        cls.fixtures = Path(cls.fixture_tmp.name)
        model = cls.fixtures / 'model'
        model.mkdir()
        cls.model_records = []
        for index, real in enumerate(cls.provider.core.MODEL_FILES):
            path = model / real['path']
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(('PINNED TEST FIXTURE, NOT TTS WEIGHTS ' + str(index)).encode())
            cls.model_records.append({'path': real['path'], 'bytes': path.stat().st_size, 'sha256': cls.provider.core.digest(path)})
        references = cls.fixtures / 'refs'
        references.mkdir()
        template = cls.fixtures / 'reference.wav'
        pcm(template)
        prompts = {}
        for person in cls.provider.core.ROLES:
            path = references / (person + '.wav')
            shutil.copyfile(template, path)
            prompts[person] = {'ref_audio': path.name, 'ref_text': 'Una referencia española para la prueba de integridad.', 'sha256': cls.provider.core.digest(path)}
        (references / 'prompts.json').write_text(json.dumps({'schema': 1, 'prompts': prompts}), encoding='utf8')
        source = cls.fixtures / 'raw-source.wav'
        pcm(source, seconds=4, silence_edges=True)
        cls.raw_template = cls.fixtures / 'raw-float.wav'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(source), '-c:a', 'pcm_f32le', str(cls.raw_template)], check=True, capture_output=True)

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.model = self.root / 'model'
        self.references = self.root / 'refs'
        shutil.copytree(self.fixtures / 'model', self.model)
        shutil.copytree(self.fixtures / 'refs', self.references)
        self.catalogue = [{'id': 'fixture-' + role, 'person': role, 'mood': 'happy', 'text': 'Gestiona esta línea: calcula el gasto y revisa los trenes.', 'priority': 1} for role in self.provider.core.ROLES]
        self.catalogue_file = self.root / 'catalogue.json'
        self.write_catalogue()
        self.output = self.root / 'stage'
        self.asset = self.root / 'voices.js'
        self.asset.write_text('export const CLIPS = {"old-voice":"old-bytes"};\n')

    def write_catalogue(self):
        self.catalogue_file.write_text(json.dumps(self.catalogue, ensure_ascii=False), encoding='utf8')

    def args(self, *extra):
        return self.provider.parse_args(['--model', str(self.model), '--references', str(self.references), '--catalogue', str(self.catalogue_file), '--output', str(self.output), '--asset', str(self.asset), *extra])

    def plan(self, *extra):
        with mock.patch.object(self.provider.core, 'MODEL_FILES', self.model_records):
            return self.provider.build_plan(self.args(*extra))

    def raw_record(self, item):
        self.output.mkdir(exist_ok=True)
        path = self.output / (item['id'] + '.wav')
        shutil.copyfile(self.raw_template, path)
        return {**{k: item[k] for k in ('id', 'person', 'mood', 'text', 'effective_text', 'input_fingerprint', 'inference_fingerprint', 'batch_id', 'batch_index')},
                'raw_wav': path.name, 'raw_sha256': self.provider.core.digest(path), 'raw_validated': True, 'duration_seconds': 4,
                'eos_observation': {'status': 'observed', 'batch_index': item['batch_index'], 'eos_found': True, 'last_effective_token': 2150, 'token_limit_without_eos': False},
                'sample_rate': 24000, 'human_listening': False}

    def stage(self, plan, count=None):
        items = plan['available_items'][:count]
        records, takes, prototype = {}, {}, None
        for item in items:
            record = self.raw_record(item)
            if prototype is None:
                prototype = self.provider.finish_raw(record, item, self.output, plan['mastering'])
                encoded = (self.output / (item['id'] + '.mp3')).read_bytes()
            else:
                (self.output / (item['id'] + '.mp3')).write_bytes(encoded)
            take = {**prototype, **record, 'mp3': item['id'] + '.mp3', 'input_fingerprint': item['input_fingerprint']}
            records[item['id']] = record
            takes[item['id']] = take
        manifest = {'takes': takes, 'raw_takes': records}
        self.provider.core.atomic_json(self.output / 'manifest.json', manifest)
        return manifest

    def deny_neural_imports(self):
        original = builtins.__import__
        def guarded(name, *args, **kwargs):
            if name.split('.')[0] in {'torch', 'qwen_tts', 'transformers', 'soundfile'}:
                raise AssertionError('Neural import during pure integrity/RAW recovery: ' + name)
            return original(name, *args, **kwargs)
        return mock.patch('builtins.__import__', side_effect=guarded)

    def test_dry_run_validates_nine_roles_without_model_import_or_writes(self):
        with self.deny_neural_imports(), mock.patch.object(self.provider.core, 'MODEL_FILES', self.model_records), contextlib.redirect_stdout(io.StringIO()) as out:
            self.assertEqual(self.provider.main(['--model', str(self.model), '--references', str(self.references), '--catalogue', str(self.catalogue_file), '--output', str(self.output), '--asset', str(self.asset), '--dry-run']), 0)
        plan = json.loads(out.getvalue())
        self.assertEqual(plan['catalogue_count'], 9)
        self.assertEqual(plan['missing_roles'], [])
        self.assertFalse(self.output.exists())
        self.assertIn('old-voice', self.asset.read_text())

    def test_punctuation_preserves_words_for_every_role_and_emotion(self):
        for person in self.provider.core.ROLES:
            for mood in self.provider.core.MOODS:
                item = {'id': 'fixture', 'person': person, 'mood': mood, 'text': 'Primero: revisa el coste. Después, decide.'}
                self.assertEqual(self.provider.words(self.provider.effective_text(item)), self.provider.words(item['text']))

    def test_incident_costs_are_spoken_as_complete_spanish_amounts(self):
        item = {'person': 'workshop', 'mood': 'determined',
                'text': 'El equipo cuesta 18000 euros; el autobús cuesta 9000 y protege al viajero.'}
        original = dict(item)
        self.assertEqual(self.provider.effective_text(item),
                         'El equipo cuesta dieciocho mil euros; el autobús cuesta nueve mil y protege al viajero.')
        self.assertEqual(item, original, 'Canonical text and IDs are not rewritten')

    def test_incident_amount_normalization_preserves_other_numbers_and_decimals(self):
        text = '0.18000 18000.5 9000,50 1,18000 19000 90000 r18000 0.018 0,009 30%'
        self.assertEqual(self.provider.spoken_costs(text), text)
        self.assertEqual(self.provider.spoken_costs('18000, 9000; 18000 euros.'),
                         'dieciocho mil, nueve mil; dieciocho mil euros.')

    def test_ertms_spelling_separates_all_five_letters_without_changing_words(self):
        item = {'person': 'successor', 'mood': 'determined',
                'text': 'El wifi no arregla la catenaria y e erre te eme ese no cambia el ancho.'}
        effective = self.provider.effective_text(item)
        self.assertIn('e, erre, te, eme, ese', effective)
        self.assertEqual(self.provider.words(effective), self.provider.words(item['text']))
        self.assertEqual(self.provider.effective_text({'person': 'successor', 'mood': 'determined',
                                                      'text': 'No cambia el ancho.'}), 'No cambia el ancho.')

    def test_planned_token_cap_has_short_line_margin_and_respects_global_ceiling(self):
        rows = lambda count: [{'effective_text': ' '.join(['palabra'] * count)}]
        self.assertEqual(self.provider.planned_token_cap(rows(6), 1024), 128)
        self.assertEqual(self.provider.planned_token_cap(rows(23), 1024), 256)
        self.assertEqual(self.provider.planned_token_cap(rows(500), 1024), 1024)
        self.assertEqual(self.provider.planned_token_cap(rows(23), 128), 128)
        override = self.plan('--max-new-tokens', '128')
        self.assertTrue(all(batch['max_new_tokens'] == 128 for batch in override['batches']))
        self.assertTrue(all(item['planned_token_cap'] == 128 for item in override['items']))
        with self.assertRaisesRegex(ValueError, '128'):
            self.plan('--max-new-tokens', '127')

    def test_longest_row_changes_token_cap_and_fingerprints_only_within_its_batch(self):
        for item in self.catalogue:
            item['text'] = 'Revisa la línea y su coste.'
        self.catalogue.extend({'id': 'cap-president-' + str(index), 'person': 'president',
                               'mood': 'happy', 'priority': 1,
                               'text': 'Revisa la línea y su coste.'} for index in range(3))
        self.write_catalogue()
        original = self.plan()
        group = next(batch for batch in original['batches'] if batch['items'][0]['person'] == 'president')
        affected = {item['id'] for item in group['items']}
        self.assertEqual(len(affected), 4)
        self.assertEqual(group['max_new_tokens'], 128)
        self.catalogue[0]['text'] = ' '.join(['palabra'] * 23)
        self.write_catalogue()
        changed = self.plan()
        previous = {item['id']: item for item in original['available_items']}
        current = {item['id']: item for item in changed['available_items']}
        for key in ('input_fingerprint', 'inference_fingerprint'):
            self.assertEqual({ident for ident in previous if previous[ident][key] != current[ident][key]}, affected)
        self.assertTrue(all(current[ident]['planned_token_cap'] == 256 for ident in affected))
        self.assertTrue(all(current[ident]['planned_token_cap'] == 128 for ident in current if ident not in affected))
        self.assertEqual(changed['parameters']['max_new_tokens'], 1024)
        self.assertEqual(changed['mastering'], original['mastering'])

    def test_batched_eos_counts_each_row_until_its_first_end_token(self):
        rows = [[99, 88, 11, 2150, 0, 0], [99, 88, 12, 13, 2150, 0], [99, 88, 14, 15, 16, 17], [99, 88, 18, 2150, 0, 0]]
        talker = SimpleNamespace(generate=lambda *a, **kw: SimpleNamespace(sequences=rows))
        original, observations = talker.generate, []
        restore = self.provider.observe_batch(talker, observations)
        talker.generate(input_ids=[[99, 88]] * 4, max_new_tokens=4, eos_token_id=[2150])
        restore()
        self.assertIs(talker.generate, original)
        self.assertEqual([x['batch_index'] for x in observations], [0, 1, 2, 3])
        self.assertEqual([x['effective_generated_tokens'] for x in observations], [2, 3, 4, 2])
        self.assertEqual([x['padding_tokens_after_eos'] for x in observations], [2, 1, 0, 2])
        self.assertEqual([x['token_limit_without_eos'] for x in observations], [False, False, True, False])
        self.assertEqual(observations[0]['last_effective_token'], 2150)

    def test_unknown_sequence_observation_is_explicit(self):
        talker = SimpleNamespace(generate=lambda **kw: object())
        observations = []
        restore = self.provider.observe_batch(talker, observations)
        talker.generate(max_new_tokens=1024, eos_token_id=2150)
        restore()
        self.assertEqual(observations[0]['status'], 'unknown')

    def test_codec_observer_records_distinct_rows_without_changing_inputs_or_result(self):
        class FakeCodes:
            def __init__(self, frames, payload):
                self.shape = (frames, 2)
                self.dtype = SimpleNamespace(str='<i8')
                self.payload = payload
            def detach(self): return self
            def cpu(self): return self
            def contiguous(self): return self
            def numpy(self): return self
            def tobytes(self): return self.payload
        first = FakeCodes(2, b'first-code-row')
        second = FakeCodes(3, b'second-code-row')
        output = ([first, second], object())
        calls, observations = [], []
        def original(*args, **kwargs):
            calls.append((args, kwargs))
            return output
        model = SimpleNamespace(generate=original)
        marker = object()
        restore = self.provider.observe_codec(model, observations)
        returned = model.generate(marker, untouched=marker)
        restore()
        self.assertIs(returned, output)
        self.assertIs(model.generate, original)
        self.assertIs(calls[0][0][0], marker)
        self.assertIs(calls[0][1]['untouched'], marker)
        self.assertEqual([x['batch_index'] for x in observations], [0, 1])
        self.assertEqual([x['codec_frames'] for x in observations], [2, 3])
        self.assertEqual([x['codebooks'] for x in observations], [2, 2])
        self.assertEqual([x['dtype'] for x in observations], ['<i8', '<i8'])
        self.assertEqual(observations[0]['sha256'], self.provider.core.hashlib.sha256(first.payload).hexdigest())
        self.assertEqual(observations[1]['sha256'], self.provider.core.hashlib.sha256(second.payload).hexdigest())
        self.assertNotEqual(observations[0]['sha256'], observations[1]['sha256'])

    def test_stale_text_mood_reference_and_model_change_inference_identity(self):
        first = self.plan()['items'][0]['inference_fingerprint']
        for key, value in [('text', 'Otro texto completo.'), ('mood', 'worried')]:
            original = self.catalogue[0][key]
            self.catalogue[0][key] = value
            self.write_catalogue()
            self.assertNotEqual(self.plan()['items'][0]['inference_fingerprint'], first)
            self.catalogue[0][key] = original
            self.write_catalogue()
        pack = json.loads((self.references / 'prompts.json').read_text())
        old_pack = copy.deepcopy(pack)
        pack['prompts']['president']['ref_text'] += ' Otra frase.'
        (self.references / 'prompts.json').write_text(json.dumps(pack))
        self.assertNotEqual(self.plan()['items'][0]['inference_fingerprint'], first)
        (self.references / 'prompts.json').write_text(json.dumps(old_pack))
        records = copy.deepcopy(self.model_records)
        path = self.model / records[0]['path']
        path.write_bytes(path.read_bytes() + b'new pinned fixture')
        records[0].update(bytes=path.stat().st_size, sha256=self.provider.core.digest(path))
        with mock.patch.object(self.provider.core, 'MODEL_FILES', records):
            changed = self.provider.build_plan(self.args())
        self.assertNotEqual(changed['items'][0]['inference_fingerprint'], first)

    def test_reference_audio_checksum_change_changes_identity(self):
        first = self.plan()['items'][0]['inference_fingerprint']
        pack_path = self.references / 'prompts.json'
        pack = json.loads(pack_path.read_text())
        path = self.references / 'president.wav'
        with wave.open(str(path), 'rb') as wav:
            payload = bytearray(wav.readframes(wav.getnframes()))
        payload[100:102] = (1234).to_bytes(2, 'little', signed=True)
        with wave.open(str(path), 'wb') as wav:
            wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(24000); wav.writeframes(payload)
        pack['prompts']['president']['sha256'] = self.provider.core.digest(path)
        pack_path.write_text(json.dumps(pack))
        self.assertNotEqual(self.plan()['items'][0]['inference_fingerprint'], first)

    def test_retry_seed_changes_only_its_four_rows_and_expands_one_clip_selection(self):
        roles = self.provider.core.ROLES
        self.catalogue = [{'id': 'retry-fixture-' + str(index), 'person': roles[index % len(roles)],
                           'mood': 'happy', 'priority': 1, 'text': 'Revisa esta línea y calcula su coste.'}
                          for index in range(526)]
        self.write_catalogue()
        original = self.plan()
        batch = next(b for b in original['batches'] if len(b['items']) == 4)
        affected = {item['id'] for item in batch['items']}
        retry_file = self.root / 'retry-seeds.json'
        retry_file.write_text(json.dumps({batch['id']: original['inference_parameters']['seed'] + 1}))
        changed = self.plan('--retry-seeds-file', str(retry_file))
        previous = {item['id']: item for item in original['available_items']}
        current = {item['id']: item for item in changed['available_items']}
        self.assertEqual(len(previous), 526)
        for key in ('input_fingerprint', 'inference_fingerprint'):
            self.assertEqual({ident for ident in previous if previous[ident][key] != current[ident][key]}, affected)
        self.assertEqual(sum(previous[ident]['inference_fingerprint'] == current[ident]['inference_fingerprint']
                             for ident in previous), 522)
        self.assertEqual(changed['mastering'], original['mastering'])
        self.assertEqual(changed['references'], original['references'])
        one = next(iter(affected))
        subset = self.plan('--clip', one, '--retry-seeds-file', str(retry_file))
        self.assertEqual({item['id'] for item in subset['items']}, affected)
        self.assertEqual(subset['selected_count'], 4)
        for ident in (one, next(ident for ident in previous if ident not in affected)):
            raw = self.raw_record(previous[ident])
            manifest = {'raw_takes': {ident: raw}}
            self.assertTrue(self.provider.valid_raw(previous[ident], self.output, manifest))
            self.assertEqual(self.provider.valid_raw(current[ident], self.output, manifest), ident not in affected)

    def test_retry_seed_map_rejects_unknown_batches_and_non_uint32_values(self):
        valid_batch = self.plan()['batches'][0]['id']
        retry_file = self.root / 'retry-seeds.json'
        for payload in ([], {valid_batch: True}, {valid_batch: -1}, {valid_batch: 2 ** 32},
                        {valid_batch: 1.5}, {'unknown-person-999': 12}):
            with self.subTest(payload=payload):
                retry_file.write_text(json.dumps(payload))
                with self.assertRaisesRegex(ValueError, 'Retry seeds|Unknown retry batch'):
                    self.plan('--retry-seeds-file', str(retry_file))

    def test_mastering_change_keeps_inference_but_invalidates_encoded_identity(self):
        initial, changed = self.plan(), self.plan('--target-lufs', '-20', '--peak-dbfs', '-2')
        self.assertEqual(initial['items'][0]['inference_fingerprint'], changed['items'][0]['inference_fingerprint'])
        self.assertNotEqual(initial['items'][0]['input_fingerprint'], changed['items'][0]['input_fingerprint'])
        manifest = self.stage(initial, count=1)
        item = changed['items'][0]
        self.assertTrue(self.provider.valid_raw(item, self.output, manifest))
        self.assertFalse(self.provider.valid_take(item, self.output, manifest))

    def test_speech_mode_reuses_raw_but_has_a_distinct_mastering_identity(self):
        constant = self.plan('--target-lufs', '-21')
        speech = self.plan('--mastering', 'speech', '--target-lufs', '-21')
        self.assertEqual(constant['items'][0]['inference_fingerprint'], speech['items'][0]['inference_fingerprint'])
        self.assertNotEqual(constant['items'][0]['input_fingerprint'], speech['items'][0]['input_fingerprint'])
        record = self.raw_record(constant['items'][0])
        self.assertTrue(self.provider.valid_raw(speech['items'][0], self.output, {'raw_takes': {record['id']: record}}))
        before = (self.output / (record['id'] + '.wav')).read_bytes()
        take = self.provider.finish_raw(record, speech['items'][0], self.output, speech['mastering'])
        self.assertEqual((self.output / (record['id'] + '.wav')).read_bytes(), before)
        self.assertTrue(self.provider.valid_take(speech['items'][0], self.output, {'takes': {record['id']: take}}))

    def test_speech_gain_caps_peak_reduction_and_has_no_broadband_filters(self):
        constant = self.plan('--target-lufs', '-21')['mastering']
        speech = self.plan('--mastering', 'speech', '--target-lufs', '-21')['mastering']
        source = {'lufs': -27.93, 'true_peak_dbfs': -2.5}
        self.assertAlmostEqual(self.provider.mastering_gain(source, constant), 1)
        gain = self.provider.mastering_gain(source, speech)
        self.assertAlmostEqual(gain, 6.7)
        guard = speech['peak_guard']
        self.assertLessEqual(source['true_peak_dbfs'] + gain - guard['threshold_dbfs'], guard['maximum_peak_reduction_db'] + 1e-9)
        chain = self.provider.mastering_filter(gain, speech)
        self.assertIn('alimiter=', chain)
        for token in ('attack=5', 'release=80', 'level=false', 'latency=true'):
            self.assertIn(token, chain)
        self.assertNotIn('alimiter', self.provider.mastering_filter(1, constant))
        for forbidden in ('equalizer', 'highpass', 'lowpass', 'acompressor', 'loudnorm', 'atempo', 'asetrate'):
            self.assertNotIn(forbidden, chain)

    def test_subset_keeps_stable_batch_context_and_other_role_identity(self):
        self.catalogue[:0] = [{'id': 'extra-' + str(i), 'person': 'president', 'mood': 'angry', 'text': 'Revisa este servicio con cuidado.', 'priority': 0} for i in range(5)]
        self.write_catalogue()
        full = self.plan()
        subset = self.plan('--clip', 'extra-1')
        item = next(i for i in full['items'] if i['id'] == 'extra-1')
        self.assertEqual(subset['items'][0]['inference_fingerprint'], item['inference_fingerprint'])
        self.assertEqual([i['id'] for i in subset['batches'][0]['items']], ['extra-0', 'extra-1', 'extra-2', 'extra-3'])
        refs = self.references / 'prompts.json'
        pack = json.loads(refs.read_text()); pack['prompts'].pop('mayor'); refs.write_text(json.dumps(pack))
        without_mayor = self.plan()
        self.assertEqual(next(i for i in without_mayor['items'] if i['id'] == 'extra-1')['inference_fingerprint'], item['inference_fingerprint'])

    def test_missing_paco_blocks_full_preflight_and_preserves_asset(self):
        refs = self.references / 'prompts.json'
        pack = json.loads(refs.read_text()); pack['prompts'].pop('mayor'); refs.write_text(json.dumps(pack))
        before = self.asset.read_bytes()
        with self.assertRaisesRegex(ValueError, 'all nine.*mayor'):
            self.plan('--package')
        self.assertEqual(self.asset.read_bytes(), before)
        self.assertIn('mayor', self.plan()['missing_roles'])

    def test_full_preflight_forbids_subset_and_partial_requires_explicit_package(self):
        for selector in [('--person', 'president'), ('--clip', 'fixture-president'), ('--max-priority', '1')]:
            with self.subTest(selector=selector), self.assertRaisesRegex(ValueError, 'whole catalogue'):
                self.plan('--package', *selector)
        with self.assertRaisesRegex(ValueError, 'requires explicit'):
            self.plan('--package-partial')

    def test_missing_one_take_blocks_full_package_without_touching_asset(self):
        plan = self.plan('--package')
        self.stage(plan, count=8)
        before = self.asset.read_bytes()
        with self.assertRaisesRegex(ValueError, 'incomplete or stale'):
            self.provider.package_clips(plan)
        self.assertEqual(self.asset.read_bytes(), before)
        self.assertFalse(self.asset.with_name(self.asset.name + '.qwen.tmp').exists())

    def test_explicit_partial_contains_only_current_verified_clips_no_fallback(self):
        plan = self.plan('--package', '--package-partial')
        self.stage(plan, count=1)
        result = self.provider.package_clips(plan, partial=True)
        self.assertEqual(result['clips'], 1)
        self.assertEqual(result['previous_kept'], 0)
        self.assertEqual(len(result['missing']), 8)
        content = self.asset.read_text()
        self.assertNotIn('old-voice', content)
        clips = json.loads(content.split('export const CLIPS = ', 1)[1].rstrip(';\n'))
        self.assertEqual(list(clips), ['fixture-president'])
        self.assertEqual(base64.b64decode(clips['fixture-president']), (self.output / 'fixture-president.mp3').read_bytes())

    def test_complete_package_covers_exact_catalogue_and_records_provenance(self):
        plan = self.plan('--package')
        self.stage(plan)
        result = self.provider.package_clips(plan)
        self.assertEqual(result['clips'], 9)
        self.assertEqual(result['missing'], [])
        self.assertFalse(result['partial'])
        self.assertEqual(json.loads((self.output / 'publication.json').read_text())['catalogue_sha256'], plan['catalogue_sha256'])

    def test_raw_validity_requires_observed_eos_matching_row_and_end_token(self):
        plan = self.plan(); item = plan['items'][0]; record = self.raw_record(item)
        self.assertTrue(self.provider.valid_raw(item, self.output, {'raw_takes': {item['id']: record}}))
        changes = [None, {'status': 'unknown'}, {'eos_found': False}, {'batch_index': 7}, {'last_effective_token': 123}, {'token_limit_without_eos': True}]
        for change in changes:
            broken = copy.deepcopy(record)
            if change is None:
                broken.pop('eos_observation')
            else:
                broken['eos_observation'].update(change)
            with self.subTest(change=change):
                self.assertFalse(self.provider.valid_raw(item, self.output, {'raw_takes': {item['id']: broken}}))

    def test_corrupt_raw_and_encoded_files_are_not_reused(self):
        plan = self.plan(); manifest = self.stage(plan, count=1); item = plan['items'][0]
        self.assertTrue(self.provider.valid_take(item, self.output, manifest))
        encoded = self.output / (item['id'] + '.mp3')
        encoded.write_bytes(encoded.read_bytes()[:20])
        self.assertFalse(self.provider.valid_take(item, self.output, manifest))
        raw = self.output / (item['id'] + '.wav')
        raw.write_bytes(raw.read_bytes()[:20])
        self.assertFalse(self.provider.valid_raw(item, self.output, manifest))

    def test_outer_silence_trim_keeps_internal_pause_and_margins(self):
        mastering = self.plan()['mastering']
        samples = [0.] * 100 + [.1] * 20 + [0.] * 300 + [.2] * 20 + [0.] * 100
        original = samples[:]
        bounds = self.provider.silence_bounds(samples, mastering, sample_rate=1000)
        self.assertEqual(bounds['start_sample'], 20)
        self.assertEqual(bounds['end_sample'], 540)
        self.assertEqual(samples[bounds['start_sample']:bounds['end_sample']][100:400], [0.] * 300)
        self.assertEqual(samples, original)

    def test_trim_rejects_empty_silent_and_nonfinite_waveforms(self):
        mastering = self.plan()['mastering']
        for samples in [[], [0.] * 100, [0., float('nan'), .1], [.1, float('inf')]]:
            with self.subTest(samples=samples), self.assertRaises(ValueError):
                self.provider.silence_bounds(samples, mastering)

    def test_mastering_preserves_raw_sha_and_encodes_only_exterior_trim(self):
        plan = self.plan(); item = plan['items'][0]; record = self.raw_record(item)
        raw = self.output / (item['id'] + '.wav'); before = raw.read_bytes()
        take = self.provider.finish_raw(record, item, self.output, plan['mastering'])
        self.assertEqual(raw.read_bytes(), before)
        self.assertGreater(take['trim']['start_sample'], 0)
        self.assertLess(take['trim']['end_sample'], 4 * 24000)
        self.assertAlmostEqual(take['duration'], 3.1, delta=.1)
        self.assertLessEqual(take['mp3_true_peak_dbfs'], plan['mastering']['maximum_true_peak_dbfs'])
        self.assertTrue(self.provider.valid_take(item, self.output, {'takes': {item['id']: take}}))

    def test_valid_raw_recovery_encodes_without_loading_torch(self):
        plan = self.plan('--person', 'president'); item = plan['items'][0]; record = self.raw_record(item)
        self.provider.core.atomic_json(self.output / 'manifest.json', {'takes': {}, 'raw_takes': {item['id']: record}})
        before = (self.output / (item['id'] + '.wav')).read_bytes()
        with self.deny_neural_imports(), contextlib.redirect_stdout(io.StringIO()):
            result = self.provider.run_generation(plan)
        self.assertEqual(result['status'], 'complete')
        self.assertTrue(self.provider.valid_take(item, self.output, result))
        self.assertEqual((self.output / (item['id'] + '.wav')).read_bytes(), before)
        self.assertFalse((self.output / '.qwen-auditions.lock').exists())

    def test_recovery_failure_keeps_raw_checkpoint_and_releases_lock(self):
        plan = self.plan('--person', 'president'); item = plan['items'][0]; record = self.raw_record(item)
        self.provider.core.atomic_json(self.output / 'manifest.json', {'takes': {}, 'raw_takes': {item['id']: record}})
        with self.deny_neural_imports(), mock.patch.object(self.provider, 'finish_raw', side_effect=ValueError('encoder test failure')):
            with self.assertRaisesRegex(ValueError, 'encoder test failure'):
                self.provider.run_generation(plan)
        checkpoint = json.loads((self.output / 'manifest.json').read_text())
        self.assertEqual(checkpoint['status'], 'failed')
        self.assertIn(item['id'], checkpoint['raw_takes'])
        self.assertFalse((self.output / '.qwen-auditions.lock').exists())


if __name__ == '__main__':
    unittest.main()
