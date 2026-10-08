"""Regression cases for the transcript inspection helper; no Torch needed."""
import unittest

from check_voice_transcripts import compare, inspect_transcript, upgrade_cached_inspection, ANALYSIS_VERSION


class TranscriptInspectionTests(unittest.TestCase):
    def test_actual_audition_number_is_not_a_content_change(self):
        expected = 'Durante dos años, tus obras de catenaria y de ancho saldrán un cuarenta por ciento más baratas.'
        recognized = 'durante dos años tus obras de catenaria y de ancho saldrán un 40 por ciento más baratas'
        result = compare(expected, recognized)
        self.assertTrue(result['normalized_equal'])
        self.assertEqual(result['review_prompts'], [])

    def test_accent_and_punctuation_variations_do_not_hide_new_words(self):
        expected = 'Piénsalo rápido, que tengo una inauguración.'
        self.assertTrue(compare(expected, 'piensalo rapido que tengo una inauguracion')['normalized_equal'])
        self.assertFalse(compare(expected, 'piensalo rapido que no tengo una inauguracion')['normalized_equal'])

    def test_a_missing_instruction_remains_visible(self):
        result = compare('Ponte al mando. Contrata maquinistas y renueva las vías antes de acelerar.',
                         'Ponte al mando, antes de acelerar.')
        missing = [change['expected'] for change in result['differences'] if change['kind'] == 'delete']
        self.assertIn('contrata maquinistas y renueva las vias', missing)
        self.assertTrue(any('omitted' in prompt for prompt in result['review_prompts']))

    def test_actual_asr_loop_pattern_requests_inspection(self):
        result = compare('Respecto de aquella cifra del año 2019.',
                         'de la ley de la ley de la ley')
        notices = result['repetition_notices']
        self.assertTrue(any(notice['phrase'] == 'de la ley' and notice['recognized_count'] == 3
                            for notice in notices))
        self.assertTrue(any('loop' in prompt for prompt in result['review_prompts']))

    def test_intended_repetition_is_not_reported_as_an_unexpected_loop(self):
        expected = 'El tren sale. El tren sale. El tren sale.'
        result = compare(expected, expected)
        self.assertTrue(result['normalized_equal'])
        self.assertEqual(result['repetition_notices'], [])

    def test_actual_qwen_boundary_omission_keeps_primary_and_overlap_evidence(self):
        expected = 'Mi discurso ha llegado puntual. Haz que circule de una vez, por favor. El marrón ya lleva tu nombre.'
        recognized = 'Mi discurso ha llegado puntual. Que circule de una vez, por favor. El marrón ya lleva tu nombre.'
        result = inspect_transcript(expected, recognized, [{'start_seconds': 17, 'end_seconds': 30.16,
                                    'recognized': expected, 'covers_audio_end': True}], 30.16)
        self.assertTrue(any(change['expected'] == 'haz' for change in result['differences']))
        self.assertEqual(result['unresolved_differences'], [])
        self.assertEqual(result['boundary_corroborated_differences'][0]['expected'], 'haz')

    def test_negation_cannot_be_corroborated_by_a_different_context(self):
        result = inspect_transcript('El tren no pasa hasta que abras la señal.',
                                    'El tren nos pasa hasta que abras la señal.',
                                    [{'start_seconds': 17, 'end_seconds': 33,
                                      'recognized': 'La factura no pasa por la mesa del ministro.'}])
        self.assertEqual(result['boundary_corroborated_differences'], [])
        self.assertTrue(any('negation' in notice['categories'] for notice in result['critical_text_notices']))

    def test_consequential_instruction_and_missing_ending_need_review(self):
        result = inspect_transcript('Abre la señal cuando las vías estén conectadas. Después contrata maquinistas.',
                                    'Abre la señal cuando las vías estén conectadas.')
        self.assertEqual(result['closing_words_check']['status'], 'asr_mismatch_requires_review')
        self.assertTrue(any('game_instruction' in notice['categories'] for notice in result['critical_text_notices']))

    def test_earlier_copy_of_final_words_does_not_prove_the_ending(self):
        result = inspect_transcript('El tren sale puntual. Ahora cambia la señal. El tren sale puntual.',
                                    'El tren sale puntual. Ahora cambia la señal.')
        self.assertEqual(result['closing_words_check']['status'], 'asr_mismatch_requires_review')

    def test_real_raquel_three_hundred_and_railway_gauge_normalize(self):
        self.assertTrue(compare('Transporta trescientos pasajeros en ancho de mil seiscientos sesenta y ocho milímetros.',
                                'Transporta 300 pasajeros en ancho de 1668 milímetros.')['normalized_equal'])

    def test_overlap_does_not_erase_primary_repetition_warning(self):
        result = inspect_transcript('Arregla el servicio y después hacemos la foto.',
                                    'Arregla el servicio el servicio el servicio y después hacemos la foto.',
                                    [{'start_seconds': 17, 'end_seconds': 30,
                                      'recognized': 'Arregla el servicio y después hacemos la foto.', 'covers_audio_end': True}])
        self.assertTrue(result['repetition_notices'])
        self.assertTrue(any(change['kind'] == 'insert' for change in result['unresolved_differences']))

    def test_actual_marisa_command_difference_requests_listening(self):
        result = inspect_transcript('Pon un tren que llegue y deja el eslogan para las servilletas.',
                                    'Pone un tren que llegue y dejar eslogan para las servilletas.')
        self.assertTrue(any(notice['expected'] == 'pon' and 'game_instruction' in notice['categories']
                            for notice in result['critical_text_notices']))

    def test_nonterminal_overlap_cannot_prove_a_missing_final_phrase(self):
        expected = 'Consulta la incidencia. Pon un tren que llegue y no cierres el taller.'
        result = inspect_transcript(expected, 'Consulta la incidencia.',
                                    [{'start_seconds': 17, 'end_seconds': 33,
                                      'recognized': expected, 'covers_audio_end': False}], 35.2)
        self.assertEqual(result['closing_words_check']['status'], 'asr_mismatch_requires_review')

    def test_cached_old_evidence_gets_new_command_notices_without_losing_asr(self):
        expected = 'Pon un tren que llegue y deja el eslogan para las servilletas.'
        recognized = 'Pone un tren que llegue y dejar eslogan para las servilletas.'
        previous = {'analysis_version': 2, 'expected': expected, 'recognized': recognized, 'duration_seconds': 15,
                    'boundary_overlap_checks': [], 'closing_words_check': {'status': 'corroborated_primary'}}
        upgraded = upgrade_cached_inspection(expected, previous)
        self.assertEqual(upgraded['analysis_version'], ANALYSIS_VERSION)
        self.assertEqual(upgraded['recognized'], recognized)
        self.assertTrue(any(notice['expected'] == 'pon' for notice in upgraded['critical_text_notices']))

    def test_unconfirmed_cached_ending_still_requires_new_audio_inspection(self):
        expected = 'Consulta la incidencia y repara el tren.'
        previous = {'analysis_version': 2, 'expected': expected, 'recognized': 'Consulta la incidencia.',
                    'boundary_overlap_checks': [], 'duration_seconds': 15,
                    'closing_words_check': {'status': 'asr_mismatch_requires_review'}}
        self.assertIsNone(upgrade_cached_inspection(expected, previous))

    def test_real_ertms_transposition_is_a_game_term_notice(self):
        result = inspect_transcript('El wifi no arregla la catenaria y ERTMS no cambia el ancho.',
                                    'El wifi no arregla la catenaria y RETMS no cambia el ancho.')
        self.assertFalse(result['normalized_equal'])
        self.assertTrue(any(notice['expected'] == 'ertms' and notice['recognized'] == 'retms'
                            and 'game_term' in notice['categories']
                            for notice in result['critical_text_notices']))

    def test_real_comprueba_and_compara_readings_remain_instruction_discrepancies(self):
        for expected, recognized in [
            ('Antes de abrir servicios, comprueba qué tren admite la vía.',
             'Antes de abrir servicios, compreva qué tren admite la vía.'),
            ('Compara el gasto mensual con los ingresos previstos.',
             'Con para el gasto mensual con los ingresos previstos.')]:
            result = inspect_transcript(expected, recognized)
            self.assertFalse(result['normalized_equal'])
            self.assertTrue(any('game_instruction' in notice['categories']
                                for notice in result['critical_text_notices']))

    def test_real_salamanca_and_soria_readings_are_route_notices(self):
        result = inspect_transcript('Salamanca tiene servicio; Soria, un presupuesto que puedes comparar.',
                                    'A la maca tiene servicios, o sea, un presupuesto que puedes comparar.')
        self.assertFalse(result['normalized_equal'])
        self.assertTrue(any('salamanca' in notice['expected'] and 'game_location' in notice['categories']
                            for notice in result['critical_text_notices']))
        self.assertTrue(any('soria' in notice['expected'] and 'game_location' in notice['categories']
                            for notice in result['critical_text_notices']))

    def test_phonetic_spacing_remains_visible_without_a_changed_instruction_notice(self):
        result = inspect_transcript('Soy Paco Terruño, alcalde.', 'Soy Paco Teruño al calde.')
        self.assertFalse(result['normalized_equal'])
        self.assertTrue(result['differences'])
        self.assertEqual(result['critical_text_notices'], [])

    def test_v3_unconfirmed_ending_reuses_asr_and_keeps_warning_in_v4(self):
        expected = 'El wifi no arregla la catenaria y ERTMS no cambia el ancho.'
        recognized = 'El wifi no arregla la catenaria y RETMS no cambia el ancho.'
        previous = {'expected': expected, 'recognized': recognized, 'duration_seconds': 5,
                    **inspect_transcript(expected, recognized, [], 5), 'analysis_version': 3}
        previous['critical_text_notices'] = []
        upgraded = upgrade_cached_inspection(expected, previous)
        self.assertEqual(upgraded['analysis_version'], ANALYSIS_VERSION)
        self.assertEqual(upgraded['recognized'], recognized)
        self.assertEqual(upgraded['differences'], previous['differences'])
        self.assertEqual(upgraded['boundary_overlap_checks'], previous['boundary_overlap_checks'])
        self.assertEqual(upgraded['closing_words_check'], previous['closing_words_check'])
        self.assertEqual(upgraded['closing_words_check']['status'], 'asr_mismatch_requires_review')
        self.assertTrue(any('game_term' in notice['categories'] for notice in upgraded['critical_text_notices']))


if __name__ == '__main__':
    unittest.main()
