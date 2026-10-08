"""Cases that distinguish current staged voices from stale/missing evidence."""
import tempfile
from pathlib import Path
import subprocess
import sys
import unittest

from audit_voice_stage import audit
from check_voice_transcripts import ANALYSIS_VERSION, digest


class StageAuditTests(unittest.TestCase):
    def test_auditor_import_does_not_load_neural_dependencies(self):
        probe = '''
import importlib.abc
import sys

class RejectNeuralImports(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname.split('.')[0] in {
            'torch', 'torchaudio', 'numpy', 'qwen_tts', 'transformers',
            'faster_whisper', 'ctranslate2',
        }:
            raise AssertionError('Unexpected neural import: ' + fullname)

sys.meta_path.insert(0, RejectNeuralImports())
import audit_voice_stage
'''
        result = subprocess.run([sys.executable, '-c', probe],
                                cwd=Path(__file__).resolve().parent,
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def audit_effective_text(self, canonical, effective):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            path = folder / 'cost.mp3'
            path.write_bytes(b'recording for manifest integrity test')
            sha = digest(path)
            script = {'id': 'cost', 'person': 'workshop', 'mood': 'determined',
                      'text': canonical, 'priority': 1}
            take = {**script, 'effective_text': effective, 'validated': True, 'sha256': sha}
            qa = {'model_sha256': 'base', 'items': {'cost': {
                'sha256': sha, 'model_sha256': 'base', 'expected': canonical,
                'analysis_version': ANALYSIS_VERSION}}}
            return audit(folder, [script], {'takes': {'cost': take}}, qa)

    def test_original_or_exact_spoken_cost_variant_preserves_integrity(self):
        canonical = 'El equipo cuesta 18000 euros; el autobús, 9000. No cambia el ancho.'
        # The provider deliberately leaves a number followed by a dot intact.
        variants = (canonical,
                    'El equipo cuesta dieciocho mil euros; el autobús, 9000! No cambia el ancho!')
        for effective in variants:
            with self.subTest(effective=effective):
                report = self.audit_effective_text(canonical, effective)
                self.assertTrue(report['summary']['all_catalogue_audio_hashes_match'])
                self.assertTrue(report['summary']['all_catalogue_asr_inspections_current'])
                self.assertEqual(report['items']['cost']['issues'], [])

    def test_both_costs_can_use_the_exact_authorized_spellings(self):
        canonical = 'El equipo cuesta 18000 euros y el autobús 9000 euros.'
        report = self.audit_effective_text(
            canonical, 'El equipo cuesta dieciocho mil euros y el autobús nueve mil euros!')
        self.assertTrue(report['items']['cost']['integrity_matches_current_catalogue'])
        self.assertNotIn('effective_text_words_changed', report['items']['cost']['issues'])

    def test_wrong_costs_or_other_cardinal_expansions_fail_integrity(self):
        canonical = 'Cuesta 18000 euros, o 9000 euros durante 4 meses.'
        variants = (
            'Cuesta ocho mil euros, o nueve mil euros durante 4 meses.',
            'Cuesta dieciocho mil euros, o ocho mil euros durante 4 meses.',
            'Cuesta 1800 euros, o 9000 euros durante 4 meses.',
            'Cuesta dieciocho mil euros, o nueve mil euros durante cuatro meses.',
            'Cuesta 18000 euros, o 9000 euros durante 5 meses.',
        )
        for effective in variants:
            with self.subTest(effective=effective):
                report = self.audit_effective_text(canonical, effective)
                self.assertIn('effective_text_words_changed', report['items']['cost']['issues'])
                self.assertFalse(report['summary']['all_catalogue_audio_hashes_match'])

    def test_decimal_and_grouped_numerals_remain_literal(self):
        canonical = ('Coste: 0.018 millones, 18000.0 euros, 9000,5 euros y 18.000 euros; '
                     'reserva 18000 euros y 9000 euros.')
        effective = ('Coste… 0.018 millones, 18000.0 euros, 9000,5 euros y 18.000 euros; '
                     'reserva dieciocho mil euros y nueve mil euros!')
        report = self.audit_effective_text(canonical, effective)
        self.assertTrue(report['items']['cost']['integrity_matches_current_catalogue'])

    def test_decimal_expansion_value_or_separator_changes_fail_integrity(self):
        cases = (
            ('Coste: 9000,5 euros.', 'Coste: nueve mil,5 euros.'),
            ('Coste: 18000.0 euros.', 'Coste: dieciocho mil.0 euros.'),
            ('Coste: 0.018 millones.', 'Coste: cero punto cero dieciocho millones.'),
            ('Coste: 0.018 millones.', 'Coste: 0.019 millones.'),
            ('Coste: 0.018 millones.', 'Coste: 0 018 millones.'),
            ('Coste: 0.018 millones.', 'Coste: 0,018 millones.'),
            ('Coste: 18.000 euros.', 'Coste: 18 000 euros.'),
        )
        for canonical, effective in cases:
            with self.subTest(canonical=canonical, effective=effective):
                report = self.audit_effective_text(canonical, effective)
                self.assertIn('effective_text_words_changed', report['items']['cost']['issues'])
                self.assertFalse(report['items']['cost']['integrity_matches_current_catalogue'])

    def test_authorized_cost_spelling_does_not_hide_changed_negation(self):
        canonical = 'Paga 9000 euros. No cambia el ancho ni evita los retrasos.'
        variants = (
            'Paga nueve mil euros. Cambia el ancho ni evita los retrasos.',
            'Paga nueve mil euros. Sí cambia el ancho ni evita los retrasos.',
            'Paga nueve mil euros. No cambia el ancho y evita los retrasos.',
        )
        for effective in variants:
            with self.subTest(effective=effective):
                report = self.audit_effective_text(canonical, effective)
                self.assertIn('effective_text_words_changed', report['items']['cost']['issues'])
                self.assertFalse(report['items']['cost']['integrity_matches_current_catalogue'])

    def test_changed_audio_invalidates_both_integrity_and_cached_asr(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            path = folder / 'intro.mp3'
            path.write_bytes(b'original recording')
            before = digest(path)
            script = {'id': 'intro', 'person': 'president', 'mood': 'happy', 'text': 'Abre la señal.', 'priority': 0}
            take = {**script, 'validated': True, 'sha256': before}
            qa = {'model_sha256': 'base', 'items': {'intro': {'sha256': before, 'model_sha256': 'base',
                  'expected': script['text'], 'analysis_version': ANALYSIS_VERSION}}}
            path.write_bytes(b'different recording')
            report = audit(folder, [script], {'takes': {'intro': take}}, qa)
            self.assertFalse(report['summary']['all_catalogue_audio_hashes_match'])
            self.assertFalse(report['summary']['all_catalogue_asr_inspections_current'])
            self.assertEqual(report['summary']['intro_tutorial_pending_asr'], ['intro'])

    def test_full_catalogue_includes_a_role_absent_from_partial_generation(self):
        with tempfile.TemporaryDirectory() as directory:
            scripts = [{'id': 'pedro', 'person': 'president', 'mood': 'happy', 'text': 'Buenos días.', 'priority': 0},
                       {'id': 'paco', 'person': 'mayor', 'mood': 'angry', 'text': 'Arregla el servicio.', 'priority': 1}]
            report = audit(Path(directory), scripts, {'takes': {}}, {})
            self.assertEqual(report['summary']['catalogue_count'], 2)
            self.assertFalse(report['summary']['all_catalogue_audio_hashes_match'])
            self.assertIn('paco', report['summary']['intro_tutorial_pending_asr'])

    def test_same_audio_with_changed_script_is_stale(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            path = folder / 'signal.mp3'
            path.write_bytes(b'same recording')
            sha = digest(path)
            old = {'id': 'signal', 'person': 'minister', 'mood': 'happy', 'text': 'Abre la señal.'}
            new = {**old, 'text': 'No abras la señal.'}
            qa = {'model_sha256': 'base', 'items': {'signal': {'sha256': sha, 'model_sha256': 'base',
                  'expected': old['text'], 'analysis_version': ANALYSIS_VERSION}}}
            report = audit(folder, [new], {'takes': {'signal': {**old, 'sha256': sha}}}, qa)
            self.assertIn('catalogue_text_mismatch', report['items']['signal']['issues'])
            self.assertFalse(report['items']['signal']['current_asr_inspection'])

    def test_matching_audio_with_old_analysis_needs_updated_alerts(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            path = folder / 'ertms.mp3'
            path.write_bytes(b'unchanged recording')
            sha = digest(path)
            script = {'id': 'ertms', 'person': 'successor', 'mood': 'neutral',
                      'text': 'ERTMS no cambia el ancho.', 'priority': 1}
            take = {**script, 'validated': True, 'sha256': sha}
            qa = {'model_sha256': 'base', 'items': {'ertms': {'sha256': sha, 'model_sha256': 'base',
                  'expected': script['text'], 'analysis_version': ANALYSIS_VERSION - 1}}}
            report = audit(folder, [script], {'takes': {'ertms': take}}, qa)
            self.assertTrue(report['summary']['all_catalogue_audio_hashes_match'])
            self.assertFalse(report['items']['ertms']['current_asr_inspection'])
            self.assertEqual(report['summary']['intro_tutorial_pending_asr'], ['ertms'])


if __name__ == '__main__':
    unittest.main()
