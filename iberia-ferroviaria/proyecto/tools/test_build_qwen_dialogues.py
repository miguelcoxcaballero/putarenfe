"""Continuous dialogue integrity tests with tiny pinned fixtures and real audio.

No model, Torch, ASR or network is used. Synthetic tone fixtures test only input,
EOS/decode integrity and atomic complete publication, never acting or likeness.
"""
import array
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
import unittest
from unittest import mock
import wave

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location('continuous_dialogues_under_test', HERE / 'build_qwen_dialogues.py')
dialogues = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(dialogues)


def pcm(path, seconds):
    samples = array.array('h', (round(6000 * math.sin(2 * math.pi * 173 * n / 24000)) for n in range(round(seconds * 24000))))
    if sys.byteorder != 'little':
        samples.byteswap()
    with wave.open(str(path), 'wb') as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(24000)
        target.writeframes(samples.tobytes())


class ContinuousDialogueTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.fixtures.cleanup)
        root = Path(cls.fixtures.name)
        cls.model = root / 'model'
        cls.model.mkdir()
        cls.records = []
        for i, actual in enumerate(dialogues.core.MODEL_FILES):
            path = cls.model / actual['path']
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(('TINY PINNED FIXTURE ' + str(i)).encode())
            cls.records.append({'path': actual['path'], 'bytes': path.stat().st_size, 'sha256': dialogues.core.digest(path)})
        cls.references = root / 'references'
        cls.references.mkdir()
        prompts = {}
        template = root / 'reference.wav'
        pcm(template, 8)
        for person in dialogues.core.ROLES:
            path = cls.references / (person + '.wav')
            shutil.copyfile(template, path)
            prompts[person] = {'ref_audio': path.name, 'ref_text': 'Referencia española de prueba.', 'sha256': dialogues.core.digest(path)}
        (cls.references / 'prompts.json').write_text(json.dumps({'prompts': prompts}), encoding='utf8')
        raw_source = root / 'source.wav'
        pcm(raw_source, 1)
        cls.raw = root / 'raw.wav'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw_source), '-c:a', 'pcm_f32le', str(cls.raw)], check=True, capture_output=True)
        cls.mp3 = root / 'encoded.mp3'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw_source), '-af', 'volume=-6dB', '-c:a', 'libmp3lame', '-b:a', '160k', str(cls.mp3)], check=True, capture_output=True)
        cls.duration = dialogues.core.decode_metrics(cls.mp3)['duration']

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.stage = self.root / 'stage'
        self.asset = self.root / 'dialogues.js'
        self.asset.write_text('export const DIALOGUES = {"previous":"old"};\n')
        self.catalogue = []
        for person in dialogues.core.ROLES:
            text = 'Primero revisa los trenes. Después decide con criterio.'
            self.catalogue.append({'id': dialogues.stable_clip_id(person, text), 'person': person,
                'raw': text, 'text': text, 'mood': 'determined', 'priority': 1,
                'kind': 'induction', 'source': 'induction:fixture:' + person,
                'canonical_sha256': dialogues.text_sha(text), 'speech_sha256': dialogues.text_sha(text)})
        self.catalogue_file = self.root / 'catalogue.json'
        self.write_catalogue()
        self.addCleanup(mock.patch.stopall)
        mock.patch.object(dialogues, 'SOURCE_COUNTS', {'induction': 9}).start()
        mock.patch.object(dialogues, 'live_catalogue', side_effect=lambda: copy.deepcopy(self.catalogue)).start()
        mock.patch.object(dialogues.core, 'MODEL_FILES', self.records).start()
        mock.patch.object(dialogues, 'REFERENCE_PACK_SHA256', dialogues.core.digest(self.references / 'prompts.json')).start()
        mock.patch.object(dialogues, 'PRESIDENT_REFERENCE_SHA256', dialogues.core.digest(self.references / 'president.wav')).start()

    def write_catalogue(self):
        self.catalogue_file.write_text(json.dumps(self.catalogue, ensure_ascii=False), encoding='utf8')

    def args(self, *extra):
        return dialogues.parse_args(['--model', str(self.model), '--references', str(self.references),
            '--catalogue', str(self.catalogue_file), '--output', str(self.stage), '--asset', str(self.asset), *extra])

    def plan(self, *extra):
        return dialogues.build_plan(self.args(*extra))

    def stage_manifest(self, plan):
        self.stage.mkdir(exist_ok=True)
        manifest = dialogues.provider.new_manifest(plan)
        if plan['inference_parameters'].get('dtype') == 'mixed':
            manifest['precision'] = copy.deepcopy(dialogues.mixed.PRECISION)
            manifest['conditioning'] = {}
            for person, ref in plan['references'].items():
                identity = {'ref_code': {'dtype': 'torch.int64', 'shape': [10, 16], 'sha256': 'c' * 64},
                    'ref_spk_embedding': {'dtype': 'torch.float32', 'shape': [1024], 'sha256': 'd' * 64},
                    'ref_text': ref['ref_text'], 'x_vector_only_mode': False, 'icl_mode': True}
                manifest['conditioning'][person] = {'reference_sha256': ref['sha256'], 'reference_text': ref['ref_text'],
                    'identity': identity, 'identity_sha256': dialogues.core.hash_json(identity), 'formed_before_conversion': True}
            for key, converted in (('execution_before_conversion', False), ('actual_execution', True)):
                manifest[key] = {name: {'devices': ['cpu'], 'dtypes': ['torch.bfloat16' if converted and name in ('talker', 'code_predictor') else 'torch.float32']}
                    for name in ('talker', 'code_predictor', 'speaker_encoder', 'codec')}
                manifest[key].update(model_dtype_property='torch.bfloat16' if converted else 'torch.float32', attention='sdpa')
        for item in plan['catalogue']:
            raw = self.stage / (item['id'] + '.wav')
            mp3 = self.stage / (item['id'] + '.mp3')
            shutil.copyfile(self.raw, raw)
            shutil.copyfile(self.mp3, mp3)
            ref = plan['references'][item['person']]
            record = {key: item[key] for key in ('id', 'person', 'mood', 'text', 'effective_text', 'input_fingerprint', 'inference_fingerprint', 'batch_id', 'batch_index', 'batch_seed', 'planned_token_cap')}
            record.update(raw_sha256=dialogues.core.digest(raw), raw_validated=True,
                duration_seconds=1, raw_wav=raw.name, reference_sha256=ref['sha256'],
                reference_text=ref['ref_text'], model_fingerprint=plan['model']['fingerprint'],
                sample_rate=24000, finite=True,
                eos_observation={'status': 'observed', 'batch_index': item['batch_index'], 'eos_found': True,
                    'last_effective_token': 2150, 'token_limit_without_eos': False,
                    'max_new_tokens': item['planned_token_cap'], 'effective_generated_tokens': 14,
                    'first_eos_index': 13},
                codec_observation={'status': 'observed', 'batch_index': item['batch_index'], 'codec_frames': 13,
                    'codebooks': 16, 'sha256': 'a' * 64})
            manifest['raw_takes'][item['id']] = copy.deepcopy(record)
            if plan['inference_parameters'].get('dtype') == 'mixed':
                record.update(precision=copy.deepcopy(dialogues.mixed.PRECISION),
                    conditioning_identity_sha256=manifest['conditioning'][item['person']]['identity_sha256'])
                manifest['raw_takes'][item['id']] = copy.deepcopy(record)
            manifest['takes'][item['id']] = {**record, 'sha256': dialogues.core.digest(mp3),
                'mp3': mp3.name, 'duration': self.duration, 'validated': True,
                'trim': {'start_sample': 0, 'end_sample': 24000}, 'mastering': plan['mastering']}
        manifest.update(status='complete', ended_at='2026-10-08T12:00:00+00:00')
        dialogues.core.atomic_json(self.stage / 'manifest.json', manifest)
        return manifest

    def test_dry_run_never_imports_neural_dependencies_or_writes_stage(self):
        original = builtins.__import__
        def guarded(name, *args, **kwargs):
            if name.split('.')[0] in {'torch', 'numpy', 'qwen_tts', 'transformers', 'soundfile'}:
                raise AssertionError('Forbidden neural import: ' + name)
            return original(name, *args, **kwargs)
        argv = ['--model', str(self.model), '--references', str(self.references), '--catalogue', str(self.catalogue_file), '--output', str(self.stage), '--asset', str(self.asset), '--dry-run']
        with mock.patch('builtins.__import__', side_effect=guarded), contextlib.redirect_stdout(io.StringIO()) as output:
            self.assertEqual(dialogues.main(argv), 0)
        self.assertEqual(json.loads(output.getvalue())['catalogue_count'], 9)
        self.assertFalse(self.stage.exists())
        self.assertIn('previous', self.asset.read_text())

    def test_default_is_scalar_complete_body_with_approved_master(self):
        plan = self.plan()
        self.assertEqual(plan['parameters']['batch_size'], 1)
        self.assertEqual(plan['parameters']['seed'], 424242)
        self.assertEqual(plan['mastering']['mode'], 'speech')
        self.assertEqual(plan['mastering']['target_lufs'], -21)
        self.assertEqual(plan['mastering']['maximum_true_peak_dbfs'], -1.5)
        self.assertEqual(plan['mastering']['mp3_bitrate'], '160k')
        self.assertTrue(all('Después decide' in item['effective_text'] for item in plan['items']))
        self.assertTrue(all(len(batch['items']) == 1 for batch in plan['batches']))

    def test_exact_selector_keeps_complete_graph_and_fingerprints(self):
        full = self.plan()
        partial = self.plan('--clip', self.catalogue[2]['id'])
        self.assertEqual(partial['selected_count'], 1)
        self.assertEqual(len(partial['catalogue']), 9)
        self.assertEqual(len(partial['all_batches']), 9)
        self.assertEqual([item['input_fingerprint'] for item in full['catalogue']], [item['input_fingerprint'] for item in partial['catalogue']])

    def test_batch_four_is_stable_and_every_row_remains_a_complete_body(self):
        # Two complete bodies per role exercise actual multirow grouping.
        for original in list(self.catalogue):
            item = copy.deepcopy(original)
            item['raw'] = item['text'] = 'Otro cuerpo completo. Conserva sus dos frases.'
            item['id'] = dialogues.stable_clip_id(item['person'], item['text'])
            item['source'] += ':second'
            item['canonical_sha256'] = item['speech_sha256'] = dialogues.text_sha(item['text'])
            self.catalogue.append(item)
        self.write_catalogue()
        with mock.patch.object(dialogues, 'SOURCE_COUNTS', {'induction': 18}):
            full = self.plan('--batch-size', '4')
            selected = self.plan('--batch-size', '4', '--clip', self.catalogue[0]['id'])
        self.assertEqual(len(full['all_batches']), 9)
        self.assertTrue(all(len(batch['items']) == 2 for batch in full['all_batches']))
        self.assertEqual(full['catalogue'][0]['input_fingerprint'], selected['catalogue'][0]['input_fingerprint'])
        self.assertEqual(selected['selected_count'], 1)

    def test_stale_body_rejected_even_when_hashes_and_id_are_recomputed(self):
        original = copy.deepcopy(self.catalogue)
        self.catalogue[0]['raw'] = self.catalogue[0]['text'] = 'Otra instrucción inventada.'
        self.catalogue[0]['id'] = dialogues.stable_clip_id(self.catalogue[0]['person'], self.catalogue[0]['text'])
        self.catalogue[0]['canonical_sha256'] = self.catalogue[0]['speech_sha256'] = dialogues.text_sha(self.catalogue[0]['text'])
        self.write_catalogue()
        with mock.patch.object(dialogues, 'live_catalogue', return_value=original), self.assertRaisesRegex(ValueError, 'actual current'):
            self.plan()

    def test_changed_hash_duplicate_id_and_missing_body_are_rejected(self):
        for change in ('hash', 'duplicate', 'missing'):
            altered = copy.deepcopy(self.catalogue)
            if change == 'hash': altered[0]['canonical_sha256'] = 'b' * 64
            elif change == 'duplicate': altered[1]['id'] = altered[0]['id']
            else: altered.pop()
            with self.subTest(change=change), self.assertRaises(ValueError):
                dialogues.validate_catalogue(altered, altered)

    def test_unknown_selector_and_partial_publication_are_rejected(self):
        for extra in (('--clip', 'missing'), ('--package', '--clip', self.catalogue[0]['id']), ('--package', '--max-priority', '1')):
            with self.subTest(extra=extra), self.assertRaises(ValueError):
                self.plan(*extra)

    def test_seed_cap_and_batch_changes_fail_closed(self):
        for extra in (('--seed', '424243'), ('--max-new-tokens', '512'), ('--batch-size', '0'), ('--batch-size', '5')):
            with self.subTest(extra=extra), self.assertRaises(ValueError):
                self.plan(*extra)

    def test_model_and_reference_corruption_are_rejected(self):
        with mock.patch.object(dialogues.core, 'MODEL_FILES', [{**self.records[0], 'sha256': '0' * 64}]), self.assertRaisesRegex(ValueError, 'model SHA256'):
            self.plan()
        with mock.patch.object(dialogues.core, 'prepare_reference', side_effect=ValueError('Reference SHA256 mismatch')), self.assertRaisesRegex(ValueError, 'Reference SHA256'):
            self.plan()

    def test_generation_requires_explicit_flag_before_loading_any_input(self):
        with mock.patch.object(dialogues, 'build_plan', side_effect=AssertionError('Should not load inputs')), self.assertRaisesRegex(ValueError, 'explicitly authorized'):
            dialogues.main(['--model', str(self.model), '--references', str(self.references), '--catalogue', str(self.catalogue_file), '--output', str(self.stage)])

    def test_different_selected_pack_or_president_identity_is_rejected(self):
        for constant in ('REFERENCE_PACK_SHA256', 'PRESIDENT_REFERENCE_SHA256'):
            with self.subTest(constant=constant), mock.patch.object(dialogues, constant, 'b' * 64), self.assertRaisesRegex(ValueError, 'approved Pedro'):
                self.plan()

    def test_raw_metadata_and_codec_accounting_are_checked_before_reuse(self):
        plan = self.plan()
        good = self.stage_manifest(plan)
        item = plan['catalogue'][0]
        for changed in ('reference', 'codec', 'different_raw', 'raw_flag'):
            manifest = copy.deepcopy(good)
            if changed == 'reference': manifest['raw_takes'][item['id']]['reference_sha256'] = 'b' * 64
            elif changed == 'codec': manifest['takes'][item['id']]['codec_observation']['batch_index'] = 3
            elif changed == 'different_raw': manifest['raw_takes'][item['id']]['eos_observation']['effective_generated_tokens'] = 15
            else: manifest['raw_takes'][item['id']]['raw_validated'] = False
            with self.subTest(changed=changed):
                self.assertFalse(dialogues.valid_continuous_take(item, plan, manifest))
                with mock.patch.object(dialogues, 'BASE_VALID_RAW', return_value=True), mock.patch.object(dialogues, 'BASE_VALID_TAKE', return_value=True), mock.patch.object(dialogues.provider, 'run_generation', side_effect=lambda current: dialogues.provider.new_manifest(current, manifest)):
                    resumed = dialogues.run_generation(plan)
                self.assertNotIn(item['id'], resumed['takes'])
                self.assertEqual(resumed['provider'], plan['provider'])
                self.assertEqual(resumed['generation_unit'], plan['generation_unit'])

    def test_closed_current_stage_publishes_only_dialogue_map(self):
        plan = self.plan('--package')
        self.stage_manifest(plan)
        report = dialogues.package_dialogues(plan)
        self.assertEqual(report['dialogues'], 9)
        self.assertFalse(report['partial'])
        self.assertEqual(report['previous_kept'], 0)
        self.assertIn('export const DIALOGUES', self.asset.read_text())
        self.assertNotIn('previous', self.asset.read_text())

    def test_open_stage_missing_takes_and_stale_manifest_never_change_asset(self):
        plan = self.plan('--package')
        original = self.asset.read_bytes()
        good = self.stage_manifest(plan)
        for alteration in ('open', 'missing', 'stale', 'failed'):
            manifest = copy.deepcopy(good)
            if alteration == 'open': manifest['status'] = 'running'
            elif alteration == 'missing': manifest['takes'].pop(plan['catalogue'][0]['id'])
            elif alteration == 'stale': manifest['catalogue_sha256'] = 'b' * 64
            else: manifest['failures'] = {'bad': {'error': 'missing EOS'}}
            dialogues.core.atomic_json(self.stage / 'manifest.json', manifest)
            with self.subTest(alteration=alteration), self.assertRaises(ValueError):
                dialogues.package_dialogues(plan)
            self.assertEqual(self.asset.read_bytes(), original)

    def test_reference_model_seed_cap_or_eos_tampering_rejects_publication(self):
        plan = self.plan('--package')
        good = self.stage_manifest(plan)
        item = plan['catalogue'][0]
        changes = {'reference_sha256': 'b' * 64, 'model_fingerprint': 'b' * 64,
                   'batch_seed': 1, 'planned_token_cap': 999, 'sample_rate': 48000,
                   'finite': False, 'input_fingerprint': 'b' * 64}
        for key, value in changes.items():
            manifest = copy.deepcopy(good)
            manifest['takes'][item['id']][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                dialogues.validate_manifest(plan, manifest)
        for key, value in {'eos_found': False, 'max_new_tokens': 999, 'first_eos_index': 4,
                           'token_limit_without_eos': True, 'last_effective_token': 4}.items():
            manifest = copy.deepcopy(good)
            manifest['takes'][item['id']]['eos_observation'][key] = value
            with self.subTest(eos=key), self.assertRaises(ValueError):
                dialogues.validate_manifest(plan, manifest)

    def test_corrupt_mp3_and_raw_bytes_reject_complete_publication(self):
        plan = self.plan('--package')
        manifest = self.stage_manifest(plan)
        item = plan['catalogue'][0]
        for suffix in ('.mp3', '.wav'):
            path = self.stage / (item['id'] + suffix)
            original = path.read_bytes()
            path.write_bytes(b'corrupt audio')
            with self.subTest(suffix=suffix), self.assertRaises(ValueError):
                dialogues.validate_manifest(plan, manifest)
            path.write_bytes(original)

    def test_fp32_default_plan_and_empty_retry_map_preserve_current_fingerprints(self):
        ordinary = self.plan()
        empty = self.root / 'empty-seeds.json'
        empty.write_text('{}')
        explicit = self.plan('--precision', 'fp32', '--retry-seeds-file', str(empty))
        self.assertEqual(ordinary['parameters'], explicit['parameters'])
        self.assertEqual([x['inference_fingerprint'] for x in ordinary['catalogue']], [x['inference_fingerprint'] for x in explicit['catalogue']])
        self.assertEqual([x['input_fingerprint'] for x in ordinary['catalogue']], [x['input_fingerprint'] for x in explicit['catalogue']])

    def test_mixed_precision_changes_every_fingerprint_and_keeps_master_reference_and_words(self):
        fp32 = self.plan()
        mixed = self.plan('--precision', 'mixed-bf16-talker')
        self.assertEqual(fp32['mastering'], mixed['mastering'])
        self.assertEqual(fp32['references'], mixed['references'])
        self.assertEqual(fp32['model'], mixed['model'])
        self.assertEqual([x['effective_text'] for x in fp32['catalogue']], [x['effective_text'] for x in mixed['catalogue']])
        self.assertEqual(mixed['parameters']['precision']['codec_dtype'], 'float32')
        self.assertEqual(mixed['parameters']['precision']['speaker_encoder_dtype'], 'float32')
        self.assertTrue(all(a['input_fingerprint'] != b['input_fingerprint'] for a, b in zip(fp32['catalogue'], mixed['catalogue'])))

    def test_retry_map_changes_only_its_stable_whole_batch(self):
        baseline = self.plan('--precision', 'mixed-bf16-talker')
        file = self.root / 'seeds.json'
        affected = baseline['all_batches'][3]
        file.write_text(json.dumps({affected['id']: 424243}))
        corrected = self.plan('--precision', 'mixed-bf16-talker', '--retry-seeds-file', str(file))
        affected_ids = {x['id'] for x in affected['items']}
        changed = {a['id'] for a, b in zip(baseline['catalogue'], corrected['catalogue']) if a['input_fingerprint'] != b['input_fingerprint']}
        self.assertEqual(changed, affected_ids)
        self.assertEqual(corrected['retry_seeds'], {affected['id']: 424243})
        self.assertEqual(corrected['retry_seed_file_sha256'], dialogues.core.digest(file))
        self.assertEqual(corrected['parameters'], baseline['parameters'])

    def test_unknown_or_malformed_retry_seed_maps_are_rejected(self):
        path = self.root / 'seeds.json'
        batch = self.plan()['all_batches'][0]['id']
        for value in ({'unknown': 1}, {batch: True}, {batch: -1}, {batch: 2**32}, []):
            path.write_text(json.dumps(value))
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.plan('--retry-seeds-file', str(path))

    def test_batch_four_retry_selects_neighbors_and_changes_only_that_complete_context(self):
        for original in list(self.catalogue):
            item = copy.deepcopy(original)
            item['raw'] = item['text'] = 'Otro cuerpo completo. Conserva sus dos frases.'
            item['id'] = dialogues.stable_clip_id(item['person'], item['text'])
            item['source'] += ':second'
            item['canonical_sha256'] = item['speech_sha256'] = dialogues.text_sha(item['text'])
            self.catalogue.append(item)
        self.write_catalogue()
        with mock.patch.object(dialogues, 'SOURCE_COUNTS', {'induction': 18}):
            full = self.plan('--batch-size', '4', '--precision', 'mixed-bf16-talker')
            batch = full['all_batches'][0]
            file = self.root / 'retry.json'
            file.write_text(json.dumps({batch['id']: 424243}))
            selected = self.plan('--batch-size', '4', '--precision', 'mixed-bf16-talker',
                '--retry-seeds-file', str(file), '--clip', batch['items'][0]['id'])
        affected = {item['id'] for item in batch['items']}
        self.assertEqual({item['id'] for item in selected['items']}, affected)
        changed = {a['id'] for a, b in zip(full['catalogue'], selected['catalogue']) if a['input_fingerprint'] != b['input_fingerprint']}
        self.assertEqual(changed, affected)

    def test_mixed_current_stage_packages_strictly_and_rejects_fp32_or_mutated_conditioning(self):
        mixed = self.plan('--precision', 'mixed-bf16-talker', '--package')
        good = self.stage_manifest(mixed)
        self.assertEqual(dialogues.package_dialogues(mixed)['dialogues'], 9)
        for change in ('codec_dtype', 'conditioning', 'raw_precision', 'retry_map'):
            manifest = copy.deepcopy(good)
            if change == 'codec_dtype': manifest['actual_execution']['codec']['dtypes'] = ['torch.bfloat16']
            elif change == 'conditioning': manifest['conditioning']['minister']['identity']['ref_spk_embedding']['dtype'] = 'torch.bfloat16'
            elif change == 'raw_precision': manifest['raw_takes'][mixed['catalogue'][0]['id']]['precision']['codec_dtype'] = 'bfloat16'
            else: manifest['retry_seeds'] = {'president-0': 1}
            with self.subTest(change=change), self.assertRaises(ValueError):
                dialogues.validate_manifest(mixed, manifest)
        fp32 = self.plan('--package')
        with self.assertRaises(ValueError):
            dialogues.validate_manifest(fp32, good)

    def test_mixed_closed_resume_uses_no_neural_imports_and_preserves_conditioning(self):
        plan = self.plan('--precision', 'mixed-bf16-talker')
        good = self.stage_manifest(plan)
        original = builtins.__import__
        def guarded(name, *args, **kwargs):
            if name.split('.')[0] in {'torch', 'numpy', 'qwen_tts', 'soundfile', 'transformers'}:
                raise AssertionError('Neural import during completed reuse: ' + name)
            return original(name, *args, **kwargs)
        with mock.patch('builtins.__import__', side_effect=guarded):
            resumed = dialogues.run_generation(plan)
        self.assertEqual(resumed['conditioning'], good['conditioning'])
        self.assertEqual(resumed['actual_execution'], good['actual_execution'])
        self.assertEqual(resumed['status'], 'complete')
        dialogues.validate_manifest(plan, resumed)

    def test_mixed_eos_and_fp32_native_raw_recovery_remain_strict(self):
        plan = self.plan('--precision', 'mixed-bf16-talker')
        manifest = self.stage_manifest(plan)
        item = plan['catalogue'][0]
        manifest['takes'][item['id']]['eos_observation']['eos_found'] = False
        self.assertFalse(dialogues.valid_continuous_take(item, plan, manifest))
        manifest = self.stage_manifest(plan)
        manifest['takes'].pop(item['id'])
        dialogues.core.atomic_json(self.stage / 'manifest.json', manifest)
        original = builtins.__import__
        def guarded(name, *args, **kwargs):
            if name.split('.')[0] in {'torch', 'numpy', 'qwen_tts', 'soundfile', 'transformers'}:
                raise AssertionError('Neural import during native RAW recovery: ' + name)
            return original(name, *args, **kwargs)
        with mock.patch('builtins.__import__', side_effect=guarded):
            resumed = dialogues.run_generation(plan)
        self.assertEqual(resumed['status'], 'complete')
        self.assertEqual(resumed['raw_takes'][item['id']]['raw_sha256'], manifest['raw_takes'][item['id']]['raw_sha256'])
        dialogues.validate_manifest(plan, resumed)


if __name__ == '__main__':
    unittest.main()
