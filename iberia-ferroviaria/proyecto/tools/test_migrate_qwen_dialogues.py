"""Migration integrity fixtures; real tiny PCM/MP3, no Torch or neural inference."""
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import shutil
import sys
import unittest
from unittest import mock

import migrate_qwen_dialogues as migration

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location('migration_fixture_support', HERE / 'test_build_qwen_dialogues.py')
fixtures = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(fixtures)


class MigrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        fixtures.ContinuousDialogueTests.setUpClass.__func__(cls)

    write_catalogue = fixtures.ContinuousDialogueTests.write_catalogue
    args = fixtures.ContinuousDialogueTests.args
    plan = fixtures.ContinuousDialogueTests.plan
    stage_manifest = fixtures.ContinuousDialogueTests.stage_manifest

    def setUp(self):
        fixtures.ContinuousDialogueTests.setUp(self)
        mock.patch.object(migration, 'backend', fixtures.dialogues).start()
        self.destination = self.root / 'stage-new'
        self.source = self.root / 'original-producer.py'
        self.source.write_text('ORIGINAL INTEGRITY FIXTURE, NOT A MODEL\n')

    def original(self, *extra):
        plan = self.plan('--precision', 'mixed-bf16-talker', *extra)
        manifest = self.stage_manifest(plan)
        manifest['source_sha256'] = {str(self.source): fixtures.dialogues.core.digest(self.source)}
        fixtures.dialogues.core.atomic_json(self.stage / 'manifest.json', manifest)
        return plan, manifest

    def new_plan(self, *extra):
        args = self.args('--precision', 'mixed-bf16-talker', *extra)
        args.output = self.destination
        return fixtures.dialogues.build_plan(args)

    def original_bytes(self):
        return {path.name: path.read_bytes() for path in self.stage.iterdir() if path.is_file()}

    def assert_original_unchanged(self, before):
        self.assertEqual(self.original_bytes(), before)
        self.assertEqual(self.asset.read_text(), 'export const DIALOGUES = {"previous":"old"};\n')

    def change_paco_reference(self):
        # Separate valid PCM changes only the ninth fixture's physical identity.
        refs = self.root / 'new-references'
        shutil.copytree(self.references, refs)
        fixtures.pcm(refs / 'mayor.wav', 8.1)
        pack = json.loads((refs / 'prompts.json').read_text())
        pack['prompts']['mayor']['sha256'] = fixtures.dialogues.core.digest(refs / 'mayor.wav')
        pack['prompts']['mayor']['ref_text'] = 'La nueva referencia novena es diferente.'
        (refs / 'prompts.json').write_text(json.dumps(pack))
        mock.patch.object(fixtures.dialogues, 'REFERENCE_PACK_SHA256', fixtures.dialogues.core.digest(refs / 'prompts.json')).start()
        args = self.args('--precision', 'mixed-bf16-talker')
        args.references = refs / 'prompts.json'
        args.output = self.destination
        return fixtures.dialogues.build_plan(args)

    def test_default_audit_is_read_only_and_preserves_every_payload_and_seed(self):
        old, manifest = self.original()
        new = self.new_plan()
        before = self.original_bytes()
        report, _, raws, takes, conditioning = migration.audit_migration(self.stage, old, new)
        self.assertEqual(report['eligible_raw_count'], 9)
        self.assertEqual(report['eligible_encoded_count'], 9)
        self.assertEqual(len(conditioning), 9)
        self.assertEqual(raws, manifest['raw_takes'])
        self.assertEqual(takes, manifest['takes'])
        self.assertTrue(all(record['batch_seed'] == 424242 for record in report['records'].values()))
        self.assertFalse(self.destination.exists())
        self.assert_original_unchanged(before)
        self.assertFalse(any(name.startswith('torch') for name in sys.modules))

    def test_changed_body_invalidates_its_complete_cohort_but_preserves_other_roles(self):
        second = copy.deepcopy(self.catalogue[0])
        second.update(raw='Comprueba otro tren completo.', text='Comprueba otro tren completo.', source='induction:fixture:second')
        second['id'] = fixtures.dialogues.stable_clip_id(second['person'], second['text'])
        second['canonical_sha256'] = second['speech_sha256'] = fixtures.dialogues.text_sha(second['text'])
        self.catalogue.append(second)
        self.write_catalogue()
        mock.patch.object(fixtures.dialogues, 'SOURCE_COUNTS', {'induction': 10}).start()
        old, _ = self.original('--batch-size', '4')
        changed = self.catalogue[-1]
        changed.update(raw='Escucha primero esta presentación nueva. Comprueba otro tren completo.',
                       text='Escucha primero esta presentación nueva. Comprueba otro tren completo.')
        changed['id'] = fixtures.dialogues.stable_clip_id(changed['person'], changed['text'])
        changed['canonical_sha256'] = changed['speech_sha256'] = fixtures.dialogues.text_sha(changed['text'])
        self.write_catalogue()
        new = self.new_plan('--batch-size', '4')
        report = migration.audit_migration(self.stage, old, new)[0]
        self.assertEqual(report['eligible_raw_count'], 8)
        self.assertEqual(len(report['excluded_records']), 2)
        untouched_president = old['items'][0]['id']
        self.assertIn('inference_fingerprint', report['excluded_records'][untouched_president])

    def test_new_paco_reference_omits_only_paco_records_and_old_conditioning(self):
        old, manifest = self.original()
        new = self.change_paco_reference()
        report, _, raws, takes, conditioning = migration.audit_migration(self.stage, old, new)
        self.assertEqual(report['eligible_raw_count'], 8)
        self.assertEqual(report['eligible_encoded_count'], 8)
        self.assertNotIn('mayor', conditioning)
        self.assertEqual(len(conditioning), 8)
        paco = next(row['id'] for row in old['items'] if row['person'] == 'mayor')
        self.assertIn('reference_sha256', report['excluded_records'][paco])
        self.assertNotIn(paco, raws)
        for ident, record in takes.items():
            self.assertEqual(migration.record_bytes(record), migration.record_bytes(manifest['takes'][ident]))

    def test_apply_copies_exact_bytes_and_origin_but_leaves_previous_stage_untouched(self):
        old, original = self.original()
        new = self.change_paco_reference()
        before = self.original_bytes()
        report = migration.apply_migration(self.stage, old, new)
        result = migration.read_json(self.destination / 'manifest.json')
        self.assertEqual(report['status'], 'applied-verified-awaiting-explicit-generation')
        self.assertEqual(result['status'], 'migration-preflight')
        self.assertNotIn('mayor', result['conditioning'])
        self.assertEqual((self.destination / 'migration-origin/manifest.original.json').read_bytes(), before['manifest.json'])
        self.assertEqual((self.destination / 'migration-origin/original-producer.py').read_bytes(), self.source.read_bytes())
        for ident, record in result['raw_takes'].items():
            self.assertEqual(migration.record_bytes(record), migration.record_bytes(original['raw_takes'][ident]))
            self.assertEqual((self.destination / (ident + '.wav')).read_bytes(), before[ident + '.wav'])
            self.assertEqual((self.destination / (ident + '.mp3')).read_bytes(), before[ident + '.mp3'])
        self.assert_original_unchanged(before)

    def test_raw_only_recovery_ignores_unregistered_mp3(self):
        old, original = self.original()
        ident = old['items'][0]['id']
        original['takes'].pop(ident)
        fixtures.dialogues.core.atomic_json(self.stage / 'manifest.json', original)
        new = self.new_plan()
        report = migration.apply_migration(self.stage, old, new)
        self.assertEqual(report['eligible_raw_count'], 9)
        self.assertEqual(report['eligible_encoded_count'], 8)
        self.assertEqual(report['encode_only_ids'], [ident])
        self.assertTrue((self.destination / (ident + '.wav')).exists())
        self.assertFalse((self.destination / (ident + '.mp3')).exists())

    def test_corrupt_original_native_or_encoded_file_fails_without_destination(self):
        old, _ = self.original()
        new = self.new_plan()
        ident = old['items'][0]['id']
        for suffix in ('.wav', '.mp3'):
            path = self.stage / (ident + suffix)
            data = path.read_bytes()
            path.write_bytes(b'CORRUPT')
            with self.subTest(suffix=suffix), self.assertRaisesRegex(ValueError, 'Corrupt or invalid original'):
                migration.apply_migration(self.stage, old, new)
            self.assertFalse(self.destination.exists())
            path.write_bytes(data)

    def test_failed_copy_gate_removes_temporary_stage_without_touching_origin(self):
        old, _ = self.original()
        new = self.new_plan()
        before = self.original_bytes()
        real_copy = shutil.copyfile
        def corrupt_copy(source, destination, *args, **kwargs):
            result = real_copy(source, destination, *args, **kwargs)
            if Path(destination).suffix == '.mp3':
                Path(destination).write_bytes(b'CORRUPT COPY')
            return result
        with mock.patch.object(migration.shutil, 'copyfile', side_effect=corrupt_copy), self.assertRaisesRegex(ValueError, 'Copied MP3'):
            migration.apply_migration(self.stage, old, new)
        self.assertFalse(self.destination.exists())
        self.assertFalse(list(self.root.glob('.stage-new-migration-*')))
        self.assert_original_unchanged(before)

    def test_locked_existing_or_nested_destination_is_rejected(self):
        old, _ = self.original()
        new = self.new_plan()
        (self.stage / '.qwen-auditions.lock').write_text('{}')
        with self.assertRaisesRegex(ValueError, 'locked'):
            migration.audit_migration(self.stage, old, new)
        (self.stage / '.qwen-auditions.lock').unlink()
        self.destination.mkdir()
        with self.assertRaisesRegex(ValueError, 'already exists'):
            migration.audit_migration(self.stage, old, new)
        self.destination.rmdir()
        for target in (self.stage, self.stage / 'nested', self.root):
            with self.subTest(target=target), self.assertRaisesRegex(ValueError, 'separate'):
                migration.audit_migration(self.stage, old, {**new, 'output': str(target)})

    def test_original_dtypes_are_verified_and_exact_source_archive_is_required(self):
        old, manifest = self.original()
        new = self.new_plan()
        manifest['actual_execution']['codec']['dtypes'] = ['torch.bfloat16']
        fixtures.dialogues.core.atomic_json(self.stage / 'manifest.json', manifest)
        with self.assertRaisesRegex(ValueError, 'precision/device'):
            migration.audit_migration(self.stage, old, new)
        manifest['actual_execution']['codec']['dtypes'] = ['torch.float32']
        fixtures.dialogues.core.atomic_json(self.stage / 'manifest.json', manifest)
        archive = self.root / 'source-archive'
        archive.mkdir()
        shutil.copyfile(self.source, archive / self.source.name)
        self.source.write_text('REVIEWED NEW CODE; DIFFERENT ORIGIN\n')
        with self.assertRaisesRegex(ValueError, 'Exact original producer source unavailable'):
            migration.audit_migration(self.stage, old, new)
        report = migration.audit_migration(self.stage, old, new, archive)[0]
        self.assertEqual(report['eligible_raw_count'], 9)
        self.assertEqual(report['original_sources'][self.source.name]['path'], str(archive / self.source.name))

    def test_global_catalogue_sha_change_alone_preserves_original_take_fingerprints(self):
        old, _ = self.original()
        self.catalogue_file.write_text(json.dumps(self.catalogue, ensure_ascii=False, indent=4))
        new = self.new_plan()
        self.assertNotEqual(old['catalogue_sha256'], new['catalogue_sha256'])
        self.assertEqual([i['input_fingerprint'] for i in old['items']], [i['input_fingerprint'] for i in new['items']])
        self.assertEqual(migration.audit_migration(self.stage, old, new)[0]['eligible_raw_count'], 9)

    def test_explicit_retry_seed_invalidates_whole_affected_batch_without_relabelling(self):
        old, original = self.original()
        retry = self.root / 'retry.json'
        retry.write_text(json.dumps({'president-0': 424243}))
        new = self.new_plan('--retry-seeds-file', str(retry))
        report = migration.audit_migration(self.stage, old, new)[0]
        ident = next(row['id'] for row in old['items'] if row['person'] == 'president')
        self.assertEqual(report['eligible_raw_count'], 8)
        self.assertIn('batch_seed', report['excluded_records'][ident])
        self.assertEqual(original['raw_takes'][ident]['batch_seed'], 424242)

    def test_cli_defaults_to_audit_and_rebuilds_current_approved_complete_plan(self):
        old, _ = self.original()
        new = self.new_plan()
        old_file, new_file, report_file = (self.root / name for name in ('old.json', 'new.json', 'report.json'))
        old_file.write_text(json.dumps(old))
        new_file.write_text(json.dumps(new))
        with contextlib.redirect_stdout(io.StringIO()):
            migration.main(['--old-stage', str(self.stage), '--old-plan', str(old_file),
                            '--new-plan', str(new_file), '--report', str(report_file)])
        self.assertEqual(migration.read_json(report_file)['status'], 'audited-not-applied')
        self.assertFalse(self.destination.exists())
        tampered = copy.deepcopy(new)
        tampered['items'][0]['batch_seed'] = 999
        with self.assertRaisesRegex(ValueError, 'batch identity|current approved live'):
            migration.fresh_reviewed_plan(tampered)
        before = self.original_bytes()
        with self.assertRaisesRegex(ValueError, 'Report must be a new file'):
            migration.main(['--old-stage', str(self.stage), '--old-plan', str(old_file),
                            '--new-plan', str(new_file), '--report', str(self.stage / 'manifest.json')])
        self.assert_original_unchanged(before)

    def test_atomic_commit_never_overwrites_even_an_empty_concurrent_destination(self):
        source = self.root / 'temporary'
        source.mkdir()
        self.destination.mkdir()
        with self.assertRaises(FileExistsError):
            migration.commit_new_directory(source, self.destination)
        self.assertTrue(source.exists())
        self.assertTrue(self.destination.exists())

    def test_changed_original_reference_fails_instead_of_relabelling_origin(self):
        old, _ = self.original()
        new = self.new_plan()
        reference = Path(old['references']['mayor']['ref_audio'])
        original = reference.read_bytes()
        try:
            reference.write_bytes(b'CHANGED ORIGINAL REFERENCE')
            with self.assertRaisesRegex(ValueError, 'Original physical reference'):
                migration.audit_migration(self.stage, old, new)
            self.assertFalse(self.destination.exists())
        finally:
            reference.write_bytes(original)

    def test_changed_manifest_item_catalogue_or_run_is_rejected(self):
        old, manifest = self.original()
        new = self.new_plan()
        for field in ('items', 'run_items'):
            altered = copy.deepcopy(manifest)
            rows = copy.deepcopy(old['items'])
            rows[0]['text'] = 'UNRELATED HEADER BODY'
            if field == 'items':
                altered['items'] = rows
            else:
                altered['run']['items'] = rows
            fixtures.dialogues.core.atomic_json(self.stage / 'manifest.json', altered)
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, 'item catalogue or run'):
                migration.audit_migration(self.stage, old, new)
            self.assertFalse(self.destination.exists())

    def test_present_batch_trace_must_match_cohort_seed_cap_and_native_observations(self):
        second = copy.deepcopy(self.catalogue[0])
        second.update(raw='Comprueba otro tren completo.', text='Comprueba otro tren completo.', source='induction:fixture:second')
        second['id'] = fixtures.dialogues.stable_clip_id(second['person'], second['text'])
        second['canonical_sha256'] = second['speech_sha256'] = fixtures.dialogues.text_sha(second['text'])
        self.catalogue.append(second)
        self.write_catalogue()
        mock.patch.object(fixtures.dialogues, 'SOURCE_COUNTS', {'induction': 10}).start()
        old, manifest = self.original('--batch-size', '4')
        new = self.new_plan('--batch-size', '4')
        batch = next(batch for batch in old['all_batches'] if len(batch['items']) == 2)
        trace = {'id': batch['id'], 'clips': [row['id'] for row in batch['items']], 'seed': batch['seed'],
                 'max_new_tokens': batch['max_new_tokens'], 'precision': copy.deepcopy(old['precision']),
                 'eos_observations': [copy.deepcopy(manifest['raw_takes'][row['id']]['eos_observation']) for row in batch['items']],
                 'codec_observations': [copy.deepcopy(manifest['raw_takes'][row['id']]['codec_observation']) for row in batch['items']]}
        manifest['batches'] = {batch['id']: trace}
        fixtures.dialogues.core.atomic_json(self.stage / 'manifest.json', manifest)
        report = migration.audit_migration(self.stage, old, new)[0]
        self.assertEqual(report['eligible_raw_count'], 10)
        self.assertEqual(report['present_batch_traces_validated'], 1)
        # Eight native records legitimately have no trace after a prior resume.
        for field in ('id', 'clips', 'seed', 'cap', 'eos', 'codec', 'precision'):
            altered = copy.deepcopy(manifest)
            bad = altered['batches'][batch['id']]
            if field == 'id': bad['id'] = 'OTHER-BATCH'
            elif field == 'clips': bad['clips'].reverse()
            elif field == 'seed': bad['seed'] += 1
            elif field == 'cap': bad['max_new_tokens'] += 1
            elif field == 'eos': bad['eos_observations'][0]['first_eos_index'] += 1
            elif field == 'codec': bad['codec_observations'].reverse()
            else: bad['precision']['codec_dtype'] = 'bfloat16'
            fixtures.dialogues.core.atomic_json(self.stage / 'manifest.json', altered)
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, 'present batch trace'):
                migration.audit_migration(self.stage, old, new)
            self.assertFalse(self.destination.exists())

    def test_cached_fixture_resume_preserves_origin_sidecar_when_header_is_rebuilt(self):
        old, original = self.original()
        new = self.new_plan()
        migration.apply_migration(self.stage, old, new)
        sidecar = (self.destination / 'migration.json').read_bytes()
        original_manifest = (self.destination / 'migration-origin/manifest.original.json').read_bytes()
        resumed = fixtures.dialogues.run_generation(new)
        self.assertEqual(resumed['status'], 'complete')
        self.assertEqual((self.destination / 'migration.json').read_bytes(), sidecar)
        self.assertEqual((self.destination / 'migration-origin/manifest.original.json').read_bytes(), original_manifest)
        self.assertEqual(resumed['raw_takes'], original['raw_takes'])
        self.assertEqual(resumed['takes'], original['takes'])
        self.assertFalse(any(name.startswith('torch') for name in sys.modules))


if __name__ == '__main__':
    unittest.main(verbosity=2)
