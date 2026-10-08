"""Small byte fixtures for the immutable Qwen archive; no audio/model runtime."""
import builtins
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_archiver():
    spec = importlib.util.spec_from_file_location('archive_qwen_takes', HERE / 'archive_qwen_takes.py')
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class ArchiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.archiver = load_archiver()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.stage = self.root / 'stage'
        self.stage.mkdir()
        self.plan_file = self.root / 'fresh-plan.json'
        self.output = self.root / 'archive'
        self.manifest = {
            'status': 'complete', 'takes': {},
            'failures': {'missing': {'error': 'No valid audio', 'person': 'president'}},
            'model': {'fingerprint': sha(b'old model')},
            'references': {'president': {'sha256': sha(b'old reference'), 'ref_audio': '/missing/old.wav',
                                         'ref_text': 'Texto de referencia original.'}},
            'reference_pack_sha256': sha(b'old refs'), 'catalogue_sha256': sha(b'old catalogue'),
            'retry_seeds': {'president-0': 424242},
        }
        for ident in ('changed', 'neighbor', 'unchanged', 'removed'):
            raw, encoded = (ident + ':wav').encode(), (ident + ':mp3').encode()
            (self.stage / (ident + '.wav')).write_bytes(raw)
            (self.stage / (ident + '.mp3')).write_bytes(encoded)
            self.manifest['takes'][ident] = {
                'id': ident, 'person': 'president', 'mood': 'angry',
                'text': 'The neighbor text stays the same.',
                'effective_text': 'The neighbor text stays the same!',
                'input_fingerprint': sha(('old:' + ident).encode()),
                'inference_fingerprint': sha(('inference:' + ident).encode()),
                'batch_id': 'president-7' if ident == 'removed' else 'president-0',
                'batch_index': 0, 'batch_seed': 424242, 'planned_token_cap': 600,
                'model_fingerprint': self.manifest['model']['fingerprint'],
                'reference_sha256': self.manifest['references']['president']['sha256'],
                'reference_text': self.manifest['references']['president']['ref_text'],
                'raw_validated': True, 'duration_seconds': 1.0, 'samples': 24000,
                'sample_rate': 24000, 'finite': True,
                'eos_observation': {'status': 'observed', 'batch_index': 0, 'eos_found': True},
                'batch_inference_seconds': 2.5,
                'raw_wav': ident + '.wav', 'raw_sha256': sha(raw),
                'mp3': ident + '.mp3', 'sha256': sha(encoded), 'validated': True,
            }
        rows = [
            {'id': ident, 'person': 'president', 'batch_id': 'president-1',
             'text': self.manifest['takes'][ident]['text'],
             'input_fingerprint': (self.manifest['takes'][ident]['input_fingerprint']
                                   if ident == 'unchanged' else sha(('new:' + ident).encode()))}
            for ident in ('changed', 'neighbor', 'unchanged')
        ]
        self.plan = {
            'available_items': rows, 'catalogue': copy.deepcopy(rows), 'catalogue_count': 3,
            'items': [rows[0]],  # A selector must not hide the reordered neighbor.
            'model': {'fingerprint': sha(b'new model'), 'directory': '/missing/model'},
            'references': {'president': {'sha256': sha(b'new reference'), 'ref_audio': '/missing/new.wav'}},
            'reference_pack_sha256': sha(b'new refs'), 'catalogue_sha256': sha(b'new catalogue'),
            'retry_seeds': {'president-1': 424243},
        }
        self.asr = {'items': {ident: {'recognized': 'complete ASR row', 'sha256': record['sha256']}
                              for ident, record in self.manifest['takes'].items()},
                    'model_sha256': sha(b'whisper'), 'summary': {'checked_current_audio': 4}}
        self.write_inputs()

    def write_inputs(self):
        (self.stage / 'manifest.json').write_text(json.dumps(self.manifest, indent=2), encoding='utf-8')
        (self.stage / 'transcript-qa-base.json').write_text(json.dumps(self.asr, indent=2), encoding='utf-8')
        self.plan_file.write_text(json.dumps(self.plan, indent=2), encoding='utf-8')

    def add_raw(self, ident, current=True, unchanged=False, batch_id='president-3'):
        raw = (ident + ':raw-only').encode()
        (self.stage / (ident + '.wav')).write_bytes(raw)
        record = copy.deepcopy(self.manifest['takes']['neighbor'])
        record.update(id=ident, raw_wav=ident + '.wav', raw_sha256=sha(raw),
                      input_fingerprint=sha(('old:' + ident).encode()),
                      inference_fingerprint=sha(('inference:' + ident).encode()),
                      batch_id=batch_id, processing='Native raw waveform.')
        for field in ('mp3', 'sha256', 'validated'):
            record.pop(field)
        self.manifest.setdefault('raw_takes', {})[ident] = record
        if current:
            fresh = {key: record[key] for key in ('id', 'person', 'mood', 'text', 'effective_text')}
            fresh.update(batch_id='president-4', batch_index=0,
                         input_fingerprint=(record['input_fingerprint'] if unchanged
                                            else sha(('new:' + ident).encode())))
            self.plan['available_items'].append(fresh)
            self.plan['catalogue'].append(copy.deepcopy(fresh))
            self.plan['catalogue_count'] += 1
        return record

    def add_duplicate(self, ident='neighbor'):
        raw = copy.deepcopy(self.manifest['takes'][ident])
        for field in ('mp3', 'sha256', 'validated'):
            raw.pop(field)
        raw['processing'] = 'Native raw waveform.'
        self.manifest.setdefault('raw_takes', {})[ident] = raw
        return raw

    def archive(self):
        return self.archiver.archive(self.stage, self.plan_file, self.output)

    def assert_rejected(self):
        with self.assertRaises((OSError, ValueError)):
            self.archive()
        self.assertFalse(self.output.exists())

    def test_selects_every_stale_neighbor_and_removed_take_from_full_plan(self):
        before = {p.name: p.read_bytes() for p in self.stage.iterdir()}
        report = self.archive()
        self.assertEqual(report['current_stale'], ['changed', 'neighbor'])
        self.assertEqual(report['obsolete'], ['removed'])
        self.assertEqual(report['archived_count'], 3)
        self.assertEqual(report['archived_take_count'], 3)
        self.assertEqual(report['raw_only_count'], 0)
        self.assertEqual(report['batches']['current']['president-1'], ['changed', 'neighbor'])
        self.assertEqual(report['roles']['president'], ['changed', 'neighbor', 'removed'])
        self.assertFalse((self.output / 'unchanged.wav').exists())
        self.assertFalse((self.output / 'missing.wav').exists())
        self.assertEqual(json.loads((self.output / 'manifest.json').read_text())['failures'],
                         self.manifest['failures'])
        self.assertEqual((self.output / 'transcript-qa-base.json').read_bytes(),
                         before['transcript-qa-base.json'])
        self.assertEqual(json.loads((self.output / 'transcript-qa-base.json').read_text())['items'],
                         self.asr['items'])
        self.assertEqual((self.output / 'plan.json').read_bytes(), self.plan_file.read_bytes())
        self.assertEqual({p.name: p.read_bytes() for p in self.stage.iterdir()}, before)
        self.assertEqual(report['old_provenance']['model']['fingerprint'], self.manifest['model']['fingerprint'])
        self.assertEqual(report['current_provenance']['catalogue_sha256'], self.plan['catalogue_sha256'])

    def test_archives_raw_only_stale_reordered_neighbor_and_obsolete_without_mp3(self):
        neighbor = self.add_raw('raw-neighbor')
        removed = self.add_raw('raw-removed', current=False, batch_id='president-9')
        self.add_raw('raw-unchanged', unchanged=True)
        self.write_inputs()
        before = {p.name: p.read_bytes() for p in self.stage.iterdir()}
        report = self.archive()
        self.assertEqual(report['schema'], 2)
        self.assertEqual(report['archived_count'], 5)
        self.assertEqual(report['archived_take_count'], 3)
        self.assertEqual(report['raw_only_count'], 2)
        self.assertEqual(report['current_stale'], ['changed', 'neighbor', 'raw-neighbor'])
        self.assertEqual(report['obsolete'], ['raw-removed', 'removed'])
        entries = {entry['id']: entry for entry in report['takes']}
        for ident, record in (('raw-neighbor', neighbor), ('raw-removed', removed)):
            self.assertEqual(entries[ident]['storage_kind'], 'raw_only')
            self.assertEqual(set(entries[ident]['files']), {'raw_wav'})
            self.assertEqual((self.output / (ident + '.wav')).read_bytes(), before[ident + '.wav'])
            self.assertEqual(report['files'][ident + '.wav']['sha256'], record['raw_sha256'])
            self.assertFalse((self.output / (ident + '.mp3')).exists())
        self.assertFalse((self.output / 'raw-unchanged.wav').exists())
        self.assertEqual(report['batches']['old']['president-9'], ['raw-removed'])
        self.assertEqual(report['cohorts']['old']['president-3'], ['raw-neighbor', 'raw-unchanged'])
        self.assertEqual(report['cohorts']['current']['president-4'], ['raw-neighbor', 'raw-unchanged'])
        self.assertEqual({p.name: p.read_bytes() for p in self.stage.iterdir()}, before)

    def test_cohort_report_includes_unproduced_neighbor_from_manifest_and_full_fresh_plan(self):
        self.add_raw('raw-neighbor')
        old = copy.deepcopy(self.manifest['raw_takes']['raw-neighbor'])
        old.update(id='unproduced', batch_index=1)
        self.manifest['items'] = [old]
        fresh = dict(self.plan['available_items'][-1], id='unproduced', batch_index=1,
                     input_fingerprint=sha(b'new unproduced'))
        self.plan['available_items'].append(fresh)
        self.plan['catalogue'].append(copy.deepcopy(fresh))
        self.plan['catalogue_count'] += 1
        self.write_inputs()
        report = self.archive()
        self.assertEqual(report['cohorts']['old']['president-3'], ['raw-neighbor', 'unproduced'])
        self.assertEqual(report['cohorts']['current']['president-4'], ['raw-neighbor', 'unproduced'])
        self.assertFalse((self.output / 'unproduced.wav').exists())

    def test_raw_only_copies_are_independent_and_rerun_is_immutable(self):
        self.add_raw('raw-neighbor')
        self.write_inputs()
        first = self.archive()
        before = {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in self.output.iterdir()}
        self.assertEqual(self.archive(), first)
        self.assertEqual({p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in self.output.iterdir()}, before)
        source, copied = self.stage / 'raw-neighbor.wav', self.output / 'raw-neighbor.wav'
        self.assertNotEqual((source.stat().st_dev, source.stat().st_ino),
                            (copied.stat().st_dev, copied.stat().st_ino))
        source.write_bytes(b'Restarted producer overwrites its WAV.')
        self.assertEqual(copied.read_bytes(), before['raw-neighbor.wav'][0])
        self.assert_rejected_without_removing_archive()

    def assert_rejected_without_removing_archive(self):
        before = {p.name: p.read_bytes() for p in self.output.iterdir()}
        with self.assertRaises((OSError, ValueError)):
            self.archive()
        self.assertEqual({p.name: p.read_bytes() for p in self.output.iterdir()}, before)

    def test_coherent_full_raw_duplicate_is_copied_and_counted_once(self):
        self.add_duplicate()
        self.write_inputs()
        copied = []
        original = self.archiver.write_copy

        def count_copy(source, destination):
            copied.append(destination.name)
            original(source, destination)

        with mock.patch.object(self.archiver, 'write_copy', side_effect=count_copy):
            report = self.archive()
        self.assertEqual(report['archived_count'], 3)
        self.assertEqual(report['archived_take_count'], 3)
        self.assertEqual(report['raw_only_count'], 0)
        self.assertEqual(copied.count('neighbor.wav'), 1)
        self.assertEqual(copied.count('neighbor.mp3'), 1)
        self.assertEqual({e['storage_kind'] for e in report['takes']}, {'full_take'})

    def test_duplicate_full_raw_metadata_conflicts_are_rejected_before_any_copy(self):
        raw = self.add_duplicate()
        for field, bad in (
                ('person', 'minister'), ('mood', 'smug'), ('text', 'Different canonical text.'),
                ('effective_text', 'Different spoken text!'), ('raw_sha256', sha(b'other raw')),
                ('input_fingerprint', sha(b'other input')), ('inference_fingerprint', sha(b'other inference')),
                ('model_fingerprint', sha(b'other model')), ('reference_sha256', sha(b'other reference')),
                ('reference_text', 'Different reference words.'), ('batch_id', 'president-99'),
                ('batch_index', 1), ('batch_seed', 7), ('planned_token_cap', 700),
                ('duration_seconds', 2.0), ('eos_observation', {'status': 'unknown'}),
                ('batch_inference_seconds', 7.0)):
            with self.subTest(field=field):
                self.manifest['raw_takes']['neighbor'] = dict(raw, **{field: bad})
                self.write_inputs()
                with mock.patch.object(self.archiver, 'write_copy',
                                       side_effect=AssertionError('Conflict reached copy')):
                    self.assert_rejected()

    def test_raw_metadata_missing_or_malformed_is_rejected(self):
        original = self.add_raw('raw-neighbor')
        for field, bad in (('input_fingerprint', None), ('inference_fingerprint', 'generic'),
                           ('reference_sha256', 'invalid'), ('model_fingerprint', None),
                           ('raw_sha256', '0'), ('raw_validated', False), ('text', ''),
                           ('reference_text', '  '), ('batch_id', '../unsafe'),
                           ('batch_index', -1), ('batch_seed', True), ('planned_token_cap', 0),
                           ('batch_seed', 2 ** 40), ('duration_seconds', float('nan')),
                           ('duration_seconds', 2.0), ('samples', -1), ('sample_rate', 0),
                           ('finite', False), ('rms', float('nan')), ('peak', -2.0),
                           ('eos_observation', {'batch_index': 9}),
                           ('eos_observation', {'batch_index': False}),
                           ('codec_observation', {'batch_index': 8}),
                           ('codec_observation', {'sha256': 'not-a-sha'})):
            with self.subTest(field=field):
                self.manifest['raw_takes']['raw-neighbor'] = dict(original, **{field: bad})
                self.write_inputs()
                self.assert_rejected()

    def test_duplicate_missing_inference_metadata_is_rejected(self):
        original = self.add_duplicate()
        for field in ('effective_text', 'inference_fingerprint', 'reference_text',
                      'batch_seed', 'duration_seconds', 'eos_observation'):
            with self.subTest(field=field):
                self.manifest['raw_takes']['neighbor'] = copy.deepcopy(original)
                del self.manifest['raw_takes']['neighbor'][field]
                self.write_inputs()
                self.assert_rejected()

    def test_inconsistent_old_catalogue_cohort_metadata_is_rejected(self):
        raw = self.add_raw('raw-neighbor')
        self.manifest['items'] = [dict(raw, batch_id='president-99')]
        self.write_inputs()
        self.assert_rejected()

    def test_raw_checkpoint_report_preserves_optional_observations_without_certifying_eos(self):
        raw = self.add_raw('raw-neighbor')
        raw['eos_observation'] = {'status': 'unknown', 'reason': 'Historical observation'}
        self.write_inputs()
        report = self.archive()
        self.assertIn('no audio decode, ASR or inference', report['validation_scope'])
        self.assertEqual(json.loads((self.output / 'manifest.json').read_text())['raw_takes']['raw-neighbor'], raw)

    def test_raw_only_corrupt_missing_or_symlinked_wav_fails_closed(self):
        record = self.add_raw('raw-neighbor')
        self.write_inputs()
        raw = self.stage / record['raw_wav']
        data = raw.read_bytes()
        raw.write_bytes(b'Corrupt RAW')
        self.assert_rejected()
        raw.unlink()
        self.assert_rejected()
        outside = self.root / 'outside-raw.wav'
        outside.write_bytes(data)
        raw.symlink_to(outside)
        self.assert_rejected()

    def test_raw_only_record_identity_and_path_are_rejected(self):
        original = self.add_raw('raw-neighbor')
        for field, bad in (('id', 'different-id'), ('person', '../minister'),
                           ('raw_wav', '../raw-neighbor.wav'), ('raw_wav', 'neighbor.wav')):
            with self.subTest(field=field, bad=bad):
                self.manifest['raw_takes']['raw-neighbor'] = dict(original, **{field: bad})
                self.write_inputs()
                self.assert_rejected()
        self.manifest['raw_takes'] = {'../escape': dict(original, id='../escape')}
        self.write_inputs()
        self.assert_rejected()

    def test_raw_only_source_change_during_copy_aborts_atomically(self):
        self.add_raw('raw-neighbor')
        self.write_inputs()
        original = self.archiver.write_copy

        def mutate_source(source, destination):
            original(source, destination)
            if source['path'].name == 'raw-neighbor.wav':
                source['path'].write_bytes(b'New raw checkpoint races copy')

        with mock.patch.object(self.archiver, 'write_copy', side_effect=mutate_source):
            self.assert_rejected()
        self.assertFalse(list(self.root.glob('.archive-*')))

    def test_raw_only_lock_appearing_during_copy_aborts_atomically(self):
        self.add_raw('raw-neighbor')
        self.write_inputs()
        original = self.archiver.write_copy

        def restart_producer(source, destination):
            original(source, destination)
            if source['path'].name == 'raw-neighbor.wav':
                (self.stage / self.archiver.LOCK_NAME).write_text('{}')

        with mock.patch.object(self.archiver, 'write_copy', side_effect=restart_producer):
            self.assert_rejected()
        self.assertFalse(list(self.root.glob('.archive-*')))

    def test_raw_only_full_plan_coverage_remains_required(self):
        self.add_raw('raw-neighbor')
        self.plan['available_items'] = self.plan['available_items'][:1]
        self.write_inputs()
        self.assert_rejected()

    def test_copies_are_independent_and_survive_source_overwrite(self):
        self.archive()
        source, archived = self.stage / 'neighbor.wav', self.output / 'neighbor.wav'
        original = archived.read_bytes()
        self.assertNotEqual((source.stat().st_dev, source.stat().st_ino),
                            (archived.stat().st_dev, archived.stat().st_ino))
        source.write_bytes(b'new live take after archive')
        self.assertEqual(archived.read_bytes(), original)
        with self.assertRaisesRegex(ValueError, 'SHA256 mismatch'):
            self.archive()
        self.assertEqual(archived.read_bytes(), original)

    def test_identical_rerun_is_idempotent_without_rewriting_files(self):
        first = self.archive()
        before = {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in self.output.iterdir()}
        self.assertEqual(self.archive(), first)
        self.assertEqual({p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in self.output.iterdir()}, before)

    def test_existing_different_archive_fails_without_overwrite(self):
        self.archive()
        target = self.output / 'neighbor.mp3'
        target.write_bytes(b'altered archive')
        with self.assertRaisesRegex(ValueError, 'immutable archive differs'):
            self.archive()
        self.assertEqual(target.read_bytes(), b'altered archive')

    def test_corrupt_selected_source_fails_before_publishing_snapshot(self):
        (self.stage / 'neighbor.mp3').write_bytes(b'corruption')
        self.assert_rejected()

    def test_expected_audio_checksums_are_required(self):
        del self.manifest['takes']['neighbor']['raw_sha256']
        self.write_inputs()
        self.assert_rejected()

    def test_active_lock_and_unclosed_statuses_are_rejected(self):
        lock = self.stage / self.archiver.LOCK_NAME
        lock.write_text('{}')
        self.assert_rejected()
        lock.unlink()
        for status in ('running', 'preflight', 'encoding', 'failed', 'incomplete'):
            with self.subTest(status=status):
                self.manifest['status'] = status
                self.write_inputs()
                self.assert_rejected()

    def test_partial_closed_stage_and_missing_asr_are_supported(self):
        self.manifest['status'] = 'partial'
        self.write_inputs()
        (self.stage / 'transcript-qa-base.json').unlink()
        report = self.archive()
        self.assertEqual(report['source_status'], 'partial')
        self.assertEqual(report['asr_files'], [])

    def test_ended_incomplete_and_failed_producer_manifests_can_be_archived(self):
        for status, ended_at in (('incomplete', '2026-10-08T12:34:56.123456+00:00'),
                                 ('failed', '2026-10-08T12:34:56Z')):
            with self.subTest(status=status):
                self.manifest.update(status=status, ended_at=ended_at,
                                     missing_selected=['missing'])
                if status == 'failed':
                    self.manifest.update(error_type='ValueError', error='EOS missing')
                self.write_inputs()
                self.output = self.root / ('archive-' + status)
                report = self.archive()
                self.assertEqual(report['source_status'], status)
                self.assertEqual(report['archived_count'], 3)
                copied = json.loads((self.output / 'manifest.json').read_text())
                self.assertEqual(copied['ended_at'], ended_at)
                self.assertEqual(copied['failures'], self.manifest['failures'])
                self.assertEqual(copied['missing_selected'], ['missing'])

    def test_incomplete_or_failed_without_a_valid_timezone_aware_end_is_rejected(self):
        for status in ('incomplete', 'failed'):
            for ended_at in (None, '', '   ', 'not-a-date', '2026-10-08',
                             '2026-10-08T12:34:56', '2026-10-08T12:34:56+25:00', 123):
                with self.subTest(status=status, ended_at=ended_at):
                    self.manifest['status'] = status
                    if ended_at is None:
                        self.manifest.pop('ended_at', None)
                    else:
                        self.manifest['ended_at'] = ended_at
                    self.write_inputs()
                    self.assert_rejected()

    def test_active_producer_status_is_rejected_even_with_valid_end_time(self):
        self.manifest['ended_at'] = '2026-10-08T12:34:56+00:00'
        for status in ('running', 'preflight', 'encoding', 'loading'):
            with self.subTest(status=status):
                self.manifest['status'] = status
                self.write_inputs()
                self.assert_rejected()

    def test_unsafe_audio_paths_and_ids_are_rejected(self):
        original = copy.deepcopy(self.manifest['takes']['neighbor'])
        for bad in ('../neighbor.wav', '/tmp/neighbor.wav', 'other.wav', 'https://example.invalid/a.wav'):
            with self.subTest(path=bad):
                self.manifest['takes']['neighbor'] = dict(original, raw_wav=bad)
                self.write_inputs()
                self.assert_rejected()
        self.manifest['takes']['neighbor'] = original
        self.manifest['takes']['../escape'] = dict(original, id='../escape')
        self.write_inputs()
        self.assert_rejected()

    def test_audio_symlink_outside_stage_is_rejected_even_with_matching_bytes(self):
        source = self.stage / 'neighbor.wav'
        outside = self.root / 'outside.wav'
        outside.write_bytes(source.read_bytes())
        source.unlink()
        source.symlink_to(outside)
        self.assert_rejected()

    def test_incomplete_or_generic_fingerprint_plan_is_rejected(self):
        original = copy.deepcopy(self.plan)
        for mutate in ('missing', 'generic', 'subset', 'empty'):
            with self.subTest(mutate=mutate):
                self.plan = copy.deepcopy(original)
                if mutate == 'missing':
                    del self.plan['available_items'][0]['input_fingerprint']
                elif mutate == 'generic':
                    row = self.plan['available_items'][0]
                    row['fingerprint'] = row.pop('input_fingerprint')
                elif mutate == 'subset':
                    self.plan['available_items'] = self.plan['available_items'][:1]
                else:
                    self.plan['available_items'] = []
                self.write_inputs()
                self.assert_rejected()

    def test_fully_fingerprinted_catalogue_is_a_supported_fallback(self):
        del self.plan['available_items']
        self.write_inputs()
        self.assertEqual(self.archive()['current_stale'], ['changed', 'neighbor'])

    def test_changed_source_during_copy_aborts_atomically(self):
        original_copy = self.archiver.write_copy

        def mutate_source(source, destination):
            original_copy(source, destination)
            if source['path'].name == 'neighbor.wav':
                source['path'].write_bytes(b'replaced while copying')

        with mock.patch.object(self.archiver, 'write_copy', side_effect=mutate_source):
            self.assert_rejected()
        self.assertFalse(list(self.root.glob('.archive-*')))

    def test_producer_lock_appearing_during_copy_aborts_atomically(self):
        original_copy = self.archiver.write_copy

        def start_producer(source, destination):
            original_copy(source, destination)
            if source['path'].name == 'manifest.json':
                (self.stage / self.archiver.LOCK_NAME).write_text('{}')

        with mock.patch.object(self.archiver, 'write_copy', side_effect=start_producer):
            self.assert_rejected()
        self.assertFalse(list(self.root.glob('.archive-*')))

    def test_output_cannot_be_inside_stage(self):
        self.output = self.stage / 'archive'
        self.assert_rejected()

    def test_cli_needs_neither_references_models_neural_imports_processes_nor_network(self):
        original_import = builtins.__import__

        def guard(name, *args, **kwargs):
            if name.split('.')[0] in {'torch', 'numpy', 'qwen_tts', 'transformers', 'soundfile'}:
                raise AssertionError('Neural import during byte archive: ' + name)
            return original_import(name, *args, **kwargs)

        stdout = io.StringIO()
        with mock.patch('builtins.__import__', side_effect=guard), \
                mock.patch.object(subprocess, 'run', side_effect=AssertionError('Subprocess used')), \
                mock.patch.object(socket, 'socket', side_effect=AssertionError('Network used')), \
                contextlib.redirect_stdout(stdout):
            archiver = load_archiver()
            self.assertEqual(archiver.main(['--stage', str(self.stage), '--plan', str(self.plan_file),
                                            '--output', str(self.output)]), 0)
        self.assertEqual(json.loads(stdout.getvalue())['archived_count'], 3)


if __name__ == '__main__':
    unittest.main()
