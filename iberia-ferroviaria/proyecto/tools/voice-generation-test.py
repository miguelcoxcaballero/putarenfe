"""Pruebas de dirección, selección y publicación de voces sin cargar XTTS.

Ejecutar desde proyecto: python3 tools/voice-generation-test.py
Las ondas de prueba comprueban las guardas de audio; no simulan que XTTS suene bien.
"""
import importlib.util
import builtins
import base64
import contextlib
import io
import json
import os
from pathlib import Path
import re
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock
import wave

import numpy as np


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("voice_generation", HERE / "build_voices.py")
VOICES = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VOICES)
SR = 24_000


def tone(seconds, amplitude=0.1, frequency=180):
    t = np.arange(round(seconds * SR), dtype=np.float32) / SR
    return (amplitude * np.sin(2 * np.pi * frequency * t)).astype(np.float32)


def item(text="Esta línea ferroviaria necesita un plan de mantenimiento", mood="happy", person="adif"):
    return {"id": "test-adif-01", "person": person, "raw": text, "text": text, "mood": mood}


class FakeEngine:
    """Conserva las llamadas para verificar velocidad, emoción y troceado."""
    sr = SR

    def __init__(self, takes):
        self.takes = list(takes)
        self.calls = []

    def say(self, person, text, mood="happy", relative_rate=1):
        self.calls.append({"person": person, "text": text, "mood": mood, "rate": relative_rate})
        return self.takes[min(len(self.calls) - 1, len(self.takes) - 1)].copy()


def read_clips(path):
    source = Path(path).read_text(encoding="utf-8")
    match = re.search(r"export const CLIPS\s*=\s*(\{.*\})\s*;", source, re.S)
    if not match:
        raise AssertionError("El empaquetado debe exportar un mapa CLIPS JSON.")
    return json.loads(match.group(1))


class TakeValidationTests(unittest.TestCase):
    def assess(self, audio, text=None, score=2.1, **kwargs):
        return VOICES.assess_take(audio, SR, text or item()["text"],
                                 score_fn=lambda audio, sr: score, **kwargs)

    def test_silence_is_not_a_valid_take(self):
        result = self.assess(np.zeros(3 * SR, dtype=np.float32))
        self.assertFalse(result["valid"])

    def test_non_finite_audio_is_not_a_valid_take(self):
        audio = tone(3)
        audio[len(audio) // 2] = np.nan
        result = self.assess(audio)
        self.assertFalse(result["valid"])

    def test_impossibly_fast_take_is_rejected(self):
        result = self.assess(tone(0.1))
        self.assertFalse(result["valid"])

    def test_short_natural_response_does_not_need_long_sentence_duration(self):
        result = self.assess(tone(0.8), "En público.")
        self.assertTrue(result["valid"], result)

    def test_invalid_attempts_never_fall_back_to_first_bad_audio(self):
        engine = FakeEngine([np.zeros(3 * SR, dtype=np.float32)])
        with self.assertRaises(VOICES.InvalidTakeError) as caught:
            VOICES.best_take(engine, item(), {}, score_fn=lambda audio, sr: 2)
        self.assertEqual(len(engine.calls), VOICES.RETRIES)
        self.assertEqual(len(caught.exception.metrics), VOICES.RETRIES)
        self.assertTrue(all(not metric["valid"] for metric in caught.exception.metrics))

    def test_selection_does_not_reward_extreme_pitch_variation(self):
        moderate, extreme, balanced, quiet = (tone(3, a) for a in (0.08, 0.12, 0.10, 0.06))
        engine = FakeEngine([moderate, extreme, balanced, quiet])
        scores = iter([1.6, 6.5, 2.3, 1.4])
        selected, metrics = VOICES.best_take(engine, item(), {}, score_fn=lambda audio, sr: next(scores))
        self.assertLess(float(np.max(np.abs(selected))), 0.11, "La variación máxima no equivale a calidad.")
        self.assertLessEqual(len(metrics), VOICES.RETRIES)
        self.assertTrue(any(metric["valid"] for metric in metrics))


class DirectionTests(unittest.TestCase):
    def test_microfragment_before_a_punchline_remains_one_grammatical_clause(self):
        for start, end in [("Que en política,", "es la eternidad."),
                           ("La paciencia de los viajeros,", "regular.")]:
            with self.subTest(start=start):
                line = item(start + " " + end)
                plan = VOICES.speech_plan(line, {line["raw"]: [[start, 1, 260], [end, .82, 120]]})
                self.assertEqual(len(plan), 1)
                self.assertEqual(plan[0]["text"], line["text"])
                self.assertEqual(plan[0]["pause_ms"], 120)
                self.assertAlmostEqual(plan[0]["rate"], (len(start) + len(end) * .82) / (len(start) + len(end)))

    def test_chained_incomplete_microfragments_keep_all_the_words(self):
        chunks = [["Y España,", .88, 300], ["modestamente,", .8, 360], ["soy un poco yo.", .84, 0]]
        line = item(" ".join(chunk[0] for chunk in chunks))
        plan = VOICES.speech_plan(line, {line["raw"]: chunks})
        self.assertEqual(plan[0]["text"], line["text"])
        self.assertEqual(len(plan), 1)
        self.assertEqual(plan[0]["pause_ms"], 0)
        self.assertAlmostEqual(plan[0]["rate"], sum(len(c[0]) * c[1] for c in chunks) / sum(len(c[0]) for c in chunks))

    def test_complete_sentences_preserve_their_rates_and_pauses(self):
        line = item("Es un contrato a cinco años. Es la eternidad.")
        direction = {line["raw"]: [["Es un contrato a cinco años.", 1, 260], ["Es la eternidad.", .86, 0]]}
        expected = [{"text": "Es un contrato a cinco años.", "rate": 1., "pause_ms": 260},
                    {"text": "Es la eternidad.", "rate": .86, "pause_ms": 0}]
        self.assertEqual(VOICES.speech_plan(line, direction), expected)
        self.assertEqual(VOICES.speech_plan(line, direction), VOICES.speech_plan(line, direction))

    def test_grammar_guard_changes_only_hashes_of_affected_plans(self):
        line = item("Que en política, es la eternidad.")
        unsafe = {line["raw"]: [["Que en política,", .95, 260], ["es la eternidad.", .86, 0]]}
        original_plan = [{"text": p[0], "rate": p[1], "pause_ms": p[2]} for p in unsafe[line["raw"]]]
        with mock.patch.object(VOICES, "speech_plan", return_value=original_plan): old_hash = VOICES.input_hash(line, unsafe)
        self.assertNotEqual(old_hash, VOICES.input_hash(line, unsafe))
        unaffected = item("Es un contrato a cinco años.")
        plan = [{"text": unaffected["text"], "rate": 1., "pause_ms": 0}]
        with mock.patch.object(VOICES, "speech_plan", return_value=plan): old_hash = VOICES.input_hash(unaffected, {})
        self.assertEqual(old_hash, VOICES.input_hash(unaffected, {}))

    def test_explicit_direction_controls_rate_and_real_pause(self):
        line = item("Las vías siguen ahí; la paciencia, regular.", mood="worried")
        direction = {line["raw"]: [["Las vías siguen ahí.", 1.0, 300], ["La paciencia, regular.", 0.82, 0]]}
        plan = VOICES.speech_plan(line, direction)
        self.assertEqual([chunk["text"] for chunk in plan], ["Las vías siguen ahí.", "La paciencia, regular."])
        self.assertEqual([chunk["rate"] for chunk in plan], [1.0, 0.82])
        self.assertEqual([chunk["pause_ms"] for chunk in plan], [300, 0])
        engine = FakeEngine([tone(1), tone(1)])
        audio = VOICES.synthesize_directed(engine, line, direction)
        self.assertEqual([call["rate"] for call in engine.calls], [1.0, 0.82])
        self.assertTrue(all(call["mood"] == "worried" for call in engine.calls))
        self.assertEqual(len(audio), round(2.3 * SR))
        self.assertTrue(np.all(audio[SR:round(1.3 * SR)] == 0), "La pausa debe existir en el audio.")

    def test_default_plan_keeps_normal_speech_together(self):
        line = item("La vía ya está. La paciencia también se paga.", mood="determined")
        plan = VOICES.speech_plan(line, {})
        self.assertEqual(plan, [{"text": line["text"], "rate": 1.0, "pause_ms": 0}])

    def test_adjacent_unpaused_clauses_keep_coarticulation(self):
        line = item("Aquí hay una frase completa.")
        direction = {line["raw"]: [["Aquí hay", 0.95, 0], ["una frase completa.", 0.95, 0]]}
        self.assertEqual(VOICES.speech_plan(line, direction),
                         [{"text": line["text"], "rate": 0.95, "pause_ms": 0}])

    def test_direction_changes_invalidate_old_take_hashes(self):
        line = item()
        original = VOICES.input_hash(line, {})
        direction = {line["raw"]: [[line["text"], 0.9, 0]]}
        self.assertNotEqual(original, VOICES.input_hash(line, direction))
        self.assertNotEqual(original, VOICES.input_hash({**line, "mood": "angry"}, {}))

    def test_character_and_emotion_have_distinct_delivery(self):
        solemn = VOICES.voice_params("president", "worried")
        quick = VOICES.voice_params("successor", "angry")
        self.assertNotEqual(solemn, quick)
        self.assertLess(solemn["speed"], quick["speed"])
        base = VOICES.voice_params("adif", "happy")
        slow = VOICES.voice_params("adif", "happy", relative_rate=0.85)
        self.assertLess(slow["speed"], base["speed"])


class ImportSafetyTests(unittest.TestCase):
    def test_validation_helpers_do_not_load_the_neural_runtime(self):
        original = builtins.__import__

        def lightweight_import(name, *args, **kwargs):
            if name.split(".", 1)[0] in {"torch", "TTS", "librosa"}:
                raise AssertionError(f"Se intentó cargar {name} antes de generar audio.")
            return original(name, *args, **kwargs)

        spec = importlib.util.spec_from_file_location("voice_generation_lightweight", HERE / "build_voices.py")
        module = importlib.util.module_from_spec(spec)
        with mock.patch("builtins.__import__", side_effect=lightweight_import):
            spec.loader.exec_module(module)
            params = module.voice_params("president", "happy")
            self.assertGreater(params["speed"], 0)


class PreflightTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.model = self.folder / "model"
        self.model.mkdir()
        self.refs = self.folder / "references"
        (self.refs / "adif").mkdir(parents=True)
        (self.refs / "adif" / "xtts-speaker.txt").write_text("A studio speaker", encoding="utf-8")
        self.files = {"config.json": b"{}", "model.pth": b"model weights",
                      "speakers_xtts.pth": b"speaker weights", "vocab.json": b"{}"}
        for name, content in self.files.items():
            (self.model / name).write_bytes(content)

    def test_each_model_file_is_required_before_loading_weights(self):
        for name, content in self.files.items():
            with self.subTest(file=name):
                (self.model / name).unlink()
                with self.assertRaisesRegex(ValueError, re.escape(name)):
                    VOICES.preflight(self.model, ["adif"], self.refs)
                (self.model / name).write_bytes(content)

    def test_model_json_must_parse(self):
        (self.model / "config.json").write_text("not json", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "config.json"):
            VOICES.preflight(self.model, ["adif"], self.refs)

    def test_selected_character_needs_a_reference(self):
        with self.assertRaisesRegex(ValueError, "president"):
            VOICES.preflight(self.model, ["adif", "president"], self.refs)

    def test_encoder_tools_are_checked_without_neural_imports(self):
        with mock.patch.object(VOICES.shutil, "which", return_value=None):
            with self.assertRaisesRegex(ValueError, "ffmpeg"):
                VOICES.preflight(self.model, ["adif"], self.refs)

    def test_ready_preflight_reports_selected_cast(self):
        with mock.patch.object(VOICES.shutil, "which", return_value="/test/encoder"):
            readiness = VOICES.preflight(self.model, ["adif"], self.refs)
        self.assertEqual(readiness["people"], ["adif"])
        self.assertEqual(set(readiness["files"]), set(self.files))

    def test_model_and_reference_changes_invalidate_resumed_sources(self):
        with mock.patch.object(VOICES, "REFS", self.refs):
            original_model, original_refs = VOICES.generation_signatures(self.model, ["adif"])
            (self.refs / "adif" / "xtts-speaker.txt").write_text("A different actor", encoding="utf-8")
            same_model, changed_refs = VOICES.generation_signatures(self.model, ["adif"])
            self.assertEqual(original_model, same_model)
            self.assertNotEqual(original_refs, changed_refs)
            (self.model / "model.pth").write_bytes(b"new model weights with a different size")
            changed_model, same_refs = VOICES.generation_signatures(self.model, ["adif"])
            self.assertNotEqual(original_model, changed_model)
            self.assertEqual(changed_refs, same_refs)


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.stage = self.folder / "auditions"
        self.stage.mkdir()
        self.production = self.folder / "production"
        self.production.mkdir()
        self.out = self.folder / "voices.js"
        self.original = 'export const CLIPS = {"legacy":"b2xk"};\n'
        self.out.write_text(self.original, encoding="utf-8")
        self.manifest = {"schema": 1, "takes": {}}

    def staged(self, clip_id, *, validated=True, stale=False):
        line = {**item(), "id": clip_id}
        path = self.stage / (clip_id + ".mp3")
        path.write_bytes(("test MP3 payload " + clip_id).encode())
        self.manifest["takes"][clip_id] = {
            "validated": validated,
            "input_hash": "obsolete input" if stale else VOICES.input_hash(line, {}),
            "sha256": VOICES.file_hash(path),
            "model_key": "current-model",
            "reference_key": "current-reference",
        }
        (self.stage / "manifest.json").write_text(json.dumps(self.manifest), encoding="utf-8")
        return line

    def publish(self, lines, partial=True):
        # Package integrity and atomic writes are independent of the ffprobe decoder.
        with mock.patch.object(VOICES, "clip_duration", return_value=1.0):
            return VOICES.package_clips(lines, self.stage, self.out, partial=partial,
                                        production_dir=self.production, direction={},
                                        expected_sources=("current-model", {"adif": "current-reference"}))

    def test_partial_publication_keeps_older_clips_and_only_adds_validated_takes(self):
        good = self.staged("new-valid")
        unvalidated = self.staged("new-rejected", validated=False)
        stale = self.staged("new-stale", stale=True)
        (self.production / "new-rejected.mp3").write_bytes(b"production fallback must not bypass validation")
        result = self.publish([good, unvalidated, stale])
        clips = read_clips(self.out)
        self.assertEqual(clips["legacy"], "b2xk")
        self.assertEqual(base64.b64decode(clips["new-valid"]), (self.stage / "new-valid.mp3").read_bytes())
        self.assertEqual(set(clips), {"legacy", "new-valid"})
        self.assertEqual(result["validated_new"], 1)
        self.assertEqual(result["previous_kept"], 1)
        self.assertEqual(result["changed_clips"], 1)
        self.assertEqual(set(result["missing"]), {"new-rejected", "new-stale"})

    def test_modified_staged_audio_is_not_trusted_by_an_old_manifest(self):
        line = self.staged("tampered")
        (self.stage / "tampered.mp3").write_bytes(b"modified after validation")
        with self.assertRaisesRegex(ValueError, "validadas"):
            self.publish([line])
        self.assertEqual(self.out.read_text(encoding="utf-8"), self.original)

    def test_full_publication_with_missing_clip_preserves_original_asset(self):
        good = self.staged("new-valid")
        missing = {**item(), "id": "not-generated"}
        with self.assertRaisesRegex(ValueError, "Faltan"):
            self.publish([good, missing], partial=False)
        self.assertEqual(self.out.read_text(encoding="utf-8"), self.original)

    def test_decoder_failure_preserves_original_asset(self):
        lines = [self.staged("first"), self.staged("second")]
        with mock.patch.object(VOICES, "clip_duration", side_effect=[1.0, ValueError("invalid MP3")]):
            with self.assertRaisesRegex(ValueError, "invalid MP3"):
                VOICES.package_clips(lines, self.stage, self.out, partial=True,
                                    production_dir=self.production, direction={},
                                    expected_sources=("current-model", {"adif": "current-reference"}))
        self.assertEqual(self.out.read_text(encoding="utf-8"), self.original)

    def test_old_production_mp3_cannot_fill_a_new_full_generation_gap(self):
        line = item()
        (self.production / (line["id"] + ".mp3")).write_bytes(b"old actor MP3 must not masquerade as a new take")
        with self.assertRaisesRegex(ValueError, "Faltan"):
            self.publish([line], partial=False)
        self.assertEqual(self.out.read_text(encoding="utf-8"), self.original)

    def test_staged_take_from_an_old_reference_or_model_cannot_be_published(self):
        line = self.staged("old-reference")
        self.manifest["takes"][line["id"]]["reference_key"] = "an-old-actor"
        (self.stage / "manifest.json").write_text(json.dumps(self.manifest))
        with self.assertRaisesRegex(ValueError, "validadas"):
            self.publish([line])
        self.assertEqual(self.out.read_text(encoding="utf-8"), self.original)


class CommandTests(unittest.TestCase):
    def test_clip_ids_select_exactly_the_requested_lines_without_loading_engine(self):
        lines = [{**item(person="president"), "id": "president-line", "priority": 1},
                 {**item(person="adif"), "id": "adif-line", "priority": 0},
                 {**item(person="adif"), "id": "other-adif-line", "priority": 0}]
        with tempfile.TemporaryDirectory() as directory:
            catalogue = Path(directory); (catalogue / "frases.json").write_text(json.dumps(lines))
            output = io.StringIO()
            with mock.patch.object(VOICES, "VOICES", catalogue), \
                    mock.patch.object(VOICES, "preflight", return_value={}) as preflight, \
                    mock.patch.object(VOICES, "Engine", side_effect=AssertionError("Clip dry run loaded XTTS")), \
                    contextlib.redirect_stdout(output):
                result = VOICES.main(["generar", "model", "--clip", "adif-line,president-line", "--clip", "adif-line", "--dry-run"])
            self.assertEqual(result, 0)
            selected = json.loads(output.getvalue())["items"]
            self.assertEqual([line["id"] for line in selected], ["adif-line", "president-line"])
            preflight.assert_called_once_with("model", ["adif", "president"])

    def test_unknown_clip_fails_before_preflight_or_engine(self):
        with tempfile.TemporaryDirectory() as directory:
            catalogue = Path(directory); (catalogue / "frases.json").write_text(json.dumps([item()]))
            with mock.patch.object(VOICES, "VOICES", catalogue), \
                    mock.patch.object(VOICES, "preflight") as preflight, \
                    mock.patch.object(VOICES, "Engine") as engine:
                with self.assertRaisesRegex(ValueError, "desconocidos"):
                    VOICES.main(["generar", "model", "--clip", "absent-id"])
            preflight.assert_not_called(); engine.assert_not_called()

    def test_clip_selection_cannot_be_silently_truncated_or_replaced_by_auditions(self):
        for extra in (["--limit", "1"], ["--auditions"]):
            with self.subTest(extra=extra), self.assertRaisesRegex(ValueError, "--clip no se combina"):
                VOICES.main(["generar", "model", "--clip", "a-real-id", *extra])

    def test_failed_source_changed_regeneration_does_not_republish_the_old_staged_take(self):
        line = item()
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            catalogue = folder / "catalogue"; catalogue.mkdir()
            (catalogue / "frases.json").write_text(json.dumps([line]), encoding="utf-8")
            stage = folder / "auditions"; stage.mkdir()
            audio = stage / (line["id"] + ".mp3"); audio.write_bytes(b"a previous validated actor recording")
            old = {"validated": True, "input_hash": VOICES.input_hash(line, {}), "sha256": VOICES.file_hash(audio),
                   "model_key": "old-model", "reference_key": "old-reference"}
            (stage / "manifest.json").write_text(json.dumps({"schema": 1, "takes": {line["id"]: old}}))
            with mock.patch.object(VOICES, "VOICES", catalogue), \
                    mock.patch.object(VOICES, "preflight", return_value={}), \
                    mock.patch.object(VOICES, "audition_lines", return_value=[line]), \
                    mock.patch.object(VOICES, "generation_signatures", return_value=("new-model", {"adif": "new-reference"})), \
                    mock.patch.object(VOICES, "Engine") as engine, \
                    mock.patch.object(VOICES, "best_take", side_effect=VOICES.InvalidTakeError("invalid new actor take", [{"valid": False}])):
                result = VOICES.main(["generar", "model", "--person", "adif", "--auditions", str(stage)])
            engine.assert_called_once_with("model")
            self.assertEqual(result, 1)
            manifest = json.loads((stage / "manifest.json").read_text())
            self.assertNotIn(line["id"], manifest["takes"])
            self.assertIn(line["id"], manifest["failures"])
            self.assertTrue(audio.exists(), "The previous file remains available for comparison, without publication trust.")

    def test_dry_run_filters_cast_and_limit_without_creating_stage_or_engine(self):
        lines = [{**item(person="president"), "id": "president-test", "priority": 1},
                 {**item(person="adif"), "id": "adif-test", "priority": 1}]
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            catalogue = folder / "catalogue"
            catalogue.mkdir()
            (catalogue / "frases.json").write_text(json.dumps(lines), encoding="utf-8")
            stage = folder / "not-created"
            output = io.StringIO()
            with mock.patch.object(VOICES, "VOICES", catalogue), \
                    mock.patch.object(VOICES, "preflight", return_value={"test": "ready"}) as preflight, \
                    mock.patch.object(VOICES, "Engine", side_effect=AssertionError("Dry run loaded XTTS")), \
                    contextlib.redirect_stdout(output):
                result = VOICES.main(["generar", "model", "--person", "president", "--limit", "1",
                                      "--stage-dir", str(stage), "--dry-run"])
            self.assertEqual(result, 0)
            plan = json.loads(output.getvalue())
            self.assertEqual(plan["selected"], 1)
            self.assertEqual(plan["items"][0]["person"], "president")
            preflight.assert_called_once_with("model", ["president"])
            self.assertFalse(stage.exists())

    def test_auditions_cover_every_actor_before_repeating_emotional_round(self):
        people = ["president", "adif", "riders"]
        lines = [{**item(mood=mood, person=person), "id": f"{person}-{mood}"}
                 for person in people for mood in VOICES.MOODS]
        selected = VOICES.audition_lines(lines, people)
        self.assertEqual([line["person"] for line in selected[:3]], people)
        self.assertTrue(all(line["mood"] == "happy" for line in selected[:3]))
        self.assertEqual({(line["person"], line["mood"]) for line in selected},
                         {(person, mood) for person in people for mood in VOICES.MOODS})

    def test_auditions_cannot_publish_assets_in_same_command(self):
        with self.assertRaisesRegex(ValueError, "no publican"):
            VOICES.main(["generar", "model", "--auditions", "--package-partial"])


class ConditioningTests(unittest.TestCase):
    """Sentinel latents check source selection without instantiating Torch or XTTS."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.refs = self.folder / "references"
        self.person = self.refs / "adif"
        self.person.mkdir(parents=True)
        self.wav = self.person / "reference.wav"
        self.write_wave(self.wav)
        self.gpt_wav, self.embedding_wav = object(), object()
        self.gpt_studio, self.embedding_studio = object(), object()
        self.fake_model = SimpleNamespace(
            speaker_manager=SimpleNamespace(speakers={
                "Studio Actor": {"gpt_cond_latent": self.gpt_studio,
                                 "speaker_embedding": self.embedding_studio}}),
            get_conditioning_latents=mock.Mock(return_value=(self.gpt_wav, self.embedding_wav)),
        )
        self.engine = object.__new__(VOICES.Engine)
        self.engine.model = self.fake_model
        self.engine.sr = SR
        self.engine.latents = {}
        patcher = mock.patch.object(VOICES, "REFS", self.refs)
        patcher.start()
        self.addCleanup(patcher.stop)

    def write_wave(self, path, seconds=0.5, sample_rate=24_000, channels=1):
        pcm = np.rint(tone(seconds) * 32_000).astype("<i2")
        if channels == 2:
            pcm = np.column_stack([pcm, pcm])
        with wave.open(str(path), "wb") as output:
            output.setnchannels(channels)
            output.setsampwidth(2)
            output.setframerate(sample_rate)
            output.writeframes(pcm.tobytes())

    def config(self, **overrides):
        value = {"schema": 1, "style_from_wav": True, "timbre_speaker": "Studio Actor"}
        value.update(overrides)
        (self.person / "conditioning.json").write_text(json.dumps(value), encoding="utf-8")
        return value

    def model_files(self):
        model = self.folder / "model"
        model.mkdir(exist_ok=True)
        for name, content in {"config.json": b"{}", "model.pth": b"weights",
                              "speakers_xtts.pth": b"speakers", "vocab.json": b"{}"}.items():
            (model / name).write_bytes(content)
        return model

    def test_conditioned_voice_uses_wav_style_and_named_timbre_and_caches_once(self):
        self.config()
        (self.person / "xtts-speaker.txt").write_text("Ignored Legacy Actor", encoding="utf-8")
        original_import = builtins.__import__

        def lightweight_import(name, *args, **kwargs):
            if name.split(".", 1)[0] in {"torch", "TTS", "librosa"}:
                raise AssertionError(f"La prueba de condicionamiento intentó cargar {name}.")
            return original_import(name, *args, **kwargs)

        with mock.patch("builtins.__import__", side_effect=lightweight_import):
            result = self.engine.voice("adif")
            self.assertIs(self.engine.voice("adif"), result)
        self.assertIs(result[0], self.gpt_wav)
        self.assertIs(result[1], self.embedding_studio)
        self.fake_model.get_conditioning_latents.assert_called_once_with(
            audio_path=[str(self.wav)], gpt_cond_len=12, gpt_cond_chunk_len=6, max_ref_length=30)

    def test_conditioned_voice_without_named_timbre_preserves_both_wav_latents(self):
        for optional in ({"timbre_speaker": None}, {}):
            with self.subTest(optional=optional):
                config = {"schema": 1, "style_from_wav": True, **optional}
                (self.person / "conditioning.json").write_text(json.dumps(config), encoding="utf-8")
                (self.person / "xtts-speaker.txt").write_text("Ignored Legacy Actor", encoding="utf-8")
                self.engine.latents.clear()
                result = self.engine.voice("adif")
                self.assertIs(result[0], self.gpt_wav)
                self.assertIs(result[1], self.embedding_wav)

    def test_conditioning_parameters_are_forwarded_without_guessing(self):
        self.config(gpt_cond_len=6, gpt_cond_chunk_len=3, max_ref_length=40)
        self.engine.voice("adif")
        self.fake_model.get_conditioning_latents.assert_called_once_with(
            audio_path=[str(self.wav)], gpt_cond_len=6, gpt_cond_chunk_len=3, max_ref_length=40)

    def test_unknown_timbre_speaker_is_rejected_without_falling_back(self):
        self.config(timbre_speaker="Unknown Actor")
        with self.assertRaisesRegex(ValueError, "Unknown Actor"):
            self.engine.voice("adif")
        self.fake_model.get_conditioning_latents.assert_not_called()
        self.assertNotIn("adif", self.engine.latents)

    def test_legacy_named_voice_keeps_both_studio_latents(self):
        (self.person / "xtts-speaker.txt").write_text("Studio Actor", encoding="utf-8")
        result = self.engine.voice("adif")
        self.assertIs(result[0], self.gpt_studio)
        self.assertIs(result[1], self.embedding_studio)
        self.fake_model.get_conditioning_latents.assert_not_called()
        self.assertEqual(VOICES.voice_reference("adif")["mode"], "named")

    def test_legacy_wav_voice_keeps_its_original_conditioning_parameters(self):
        result = self.engine.voice("adif")
        self.assertIs(result[0], self.gpt_wav)
        self.assertIs(result[1], self.embedding_wav)
        self.fake_model.get_conditioning_latents.assert_called_once_with(
            audio_path=[str(self.wav)], gpt_cond_len=30, max_ref_length=60)
        self.assertEqual(VOICES.voice_reference("adif")["mode"], "wav")

    def test_malformed_or_invalid_conditioning_does_not_use_legacy_fallback(self):
        (self.person / "xtts-speaker.txt").write_text("Studio Actor", encoding="utf-8")
        cases = ["not json", "[]", "null", json.dumps({"schema": 1, "style_from_wav": False}),
                 json.dumps({"schema": 2, "style_from_wav": True}),
                 json.dumps({"schema": True, "style_from_wav": True}),
                 json.dumps({"schema": 1, "style_from_wav": 1}),
                 json.dumps({"schema": 1, "style_from_wav": True, "unknown_parameter": 6}),
                 json.dumps({"schema": 1, "style_from_wav": True, "timbre_speaker": ""}),
                 json.dumps({"schema": 1, "style_from_wav": True, "timbre_speaker": "  "}),
                 json.dumps({"schema": 1, "style_from_wav": True, "timbre_speaker": 7})]
        for source in cases:
            with self.subTest(source=source):
                (self.person / "conditioning.json").write_text(source, encoding="utf-8")
                with self.assertRaises(ValueError):
                    VOICES.voice_reference("adif")

    def test_invalid_numeric_conditioning_parameters_are_rejected(self):
        for parameters in ({"gpt_cond_len": 5}, {"gpt_cond_len": 91}, {"gpt_cond_len": True},
                           {"gpt_cond_len": "12"}, {"gpt_cond_chunk_len": 0},
                           {"gpt_cond_chunk_len": 13}, {"max_ref_length": 29},
                           {"max_ref_length": 91}, {"gpt_cond_len": 40, "max_ref_length": 30}):
            with self.subTest(parameters=parameters):
                self.config(**parameters)
                with self.assertRaises(ValueError):
                    VOICES.voice_reference("adif")

    def test_conditioned_preflight_requires_readable_nontrivial_wav(self):
        self.config()
        model = self.model_files()
        for failure in ("missing", "short", "low-rate", "corrupt", "truncated"):
            with self.subTest(failure=failure):
                if self.wav.exists():
                    self.wav.unlink()
                if failure == "short":
                    self.write_wave(self.wav, seconds=0.1)
                elif failure == "low-rate":
                    self.write_wave(self.wav, sample_rate=4_000)
                elif failure == "corrupt":
                    self.wav.write_bytes(b"not a PCM WAV")
                elif failure == "truncated":
                    self.write_wave(self.wav)
                    self.wav.write_bytes(self.wav.read_bytes()[:-100])
                with mock.patch.object(VOICES.shutil, "which", return_value="/test/encoder"):
                    with self.assertRaises(ValueError):
                        VOICES.preflight(model, ["adif"], self.refs)

    def test_conditioning_accepts_stereo_pcm(self):
        self.config()
        self.write_wave(self.wav, channels=2)
        resolved = VOICES.voice_reference("adif", self.refs)
        self.assertEqual(resolved["mode"], "conditioned")
        self.assertEqual(resolved["files"], [str(self.wav)])

    def test_signatures_track_normalized_config_and_wav_content_not_ignored_named_file(self):
        self.config()
        named = self.person / "xtts-speaker.txt"
        named.write_text("Ignored Original", encoding="utf-8")
        model = self.model_files()
        original_model, original_keys = VOICES.generation_signatures(model, ["adif"], self.refs)
        named.write_text("Ignored Change", encoding="utf-8")
        self.assertEqual((original_model, original_keys), VOICES.generation_signatures(model, ["adif"], self.refs))
        self.config(gpt_cond_len=12, gpt_cond_chunk_len=6, max_ref_length=30)
        self.assertEqual((original_model, original_keys), VOICES.generation_signatures(model, ["adif"], self.refs),
                         "Writing explicit default values must not invalidate a take.")
        (self.person / "conditioning.json").write_text(json.dumps({"style_from_wav": True,
            "timbre_speaker": "Studio Actor"}), encoding="utf-8")
        self.assertEqual((original_model, original_keys), VOICES.generation_signatures(model, ["adif"], self.refs),
                         "Omitting schema 1 must preserve the normalized signature.")
        self.config(gpt_cond_len=6)
        same_model, changed_config = VOICES.generation_signatures(model, ["adif"], self.refs)
        self.assertEqual(same_model, original_model)
        self.assertNotEqual(changed_config, original_keys)
        original_stat = self.wav.stat()
        payload = bytearray(self.wav.read_bytes())
        payload[-1] ^= 1
        self.wav.write_bytes(payload)
        os.utime(self.wav, ns=(original_stat.st_atime_ns, original_stat.st_mtime_ns))
        same_model, changed_audio = VOICES.generation_signatures(model, ["adif"], self.refs)
        self.assertEqual(same_model, original_model)
        self.assertNotEqual(changed_audio, changed_config, "A same-size WAV content change must invalidate the source.")


class VoiceThreadTests(unittest.TestCase):
    def test_default_and_supported_thread_counts(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertEqual(VOICES.voice_threads(), 3)
        for count in range(1, 5):
            with self.subTest(count=count), mock.patch.dict(os.environ, {"IBERIA_VOICE_THREADS": str(count)}):
                self.assertEqual(VOICES.voice_threads(), count)

    def test_invalid_thread_counts_fail_before_loading_runtime(self):
        for value in ("", "0", "5", "-1", "1.5", "many"):
            with self.subTest(value=value), mock.patch.dict(os.environ, {"IBERIA_VOICE_THREADS": value}):
                with self.assertRaises(ValueError):
                    VOICES.voice_threads()

    def test_preflight_rejects_invalid_thread_configuration(self):
        with tempfile.TemporaryDirectory() as directory:
            model = Path(directory)
            for name in ("config.json", "model.pth", "speakers_xtts.pth", "vocab.json"):
                (model / name).write_bytes(b"{}")
            with mock.patch.dict(os.environ, {"IBERIA_VOICE_THREADS": "5"}), \
                    mock.patch.object(VOICES.shutil, "which", return_value="/test/encoder"):
                with self.assertRaisesRegex(ValueError, "IBERIA_VOICE_THREADS"):
                    VOICES.preflight(model)


if __name__ == "__main__":
    unittest.main(verbosity=2)
