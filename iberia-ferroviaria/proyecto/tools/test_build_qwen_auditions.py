#!/usr/bin/env python3
"""Integrity and dry-run tests for the local Qwen audition builder.

The fixtures contain tiny model files and synthetic PCM; no TTS weights,
network access, or generated speech are needed.
"""

import array
import builtins
import contextlib
import copy
import hashlib
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


def load_builder():
    spec = importlib.util.spec_from_file_location(
        "build_qwen_auditions", HERE / "build_qwen_auditions.py"
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_wav(path, seconds=10, rate=24000, channels=1, width=2, silent=False):
    samples = array.array("h", (
        0 if silent else round(7000 * math.sin(2 * math.pi * 173 * i / rate))
        for i in range(round(seconds * rate))
    ))
    if sys.byteorder != "little":
        samples.byteswap()
    data = samples.tobytes()
    if channels == 2:
        data = b"".join(data[i:i + 2] * 2 for i in range(0, len(data), 2))
    if width == 1:
        data = bytes([128] * (round(seconds * rate) * channels))
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(channels)
        wav.setsampwidth(width)
        wav.setframerate(rate)
        wav.writeframes(data)


class QwenBuilderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.builder = load_builder()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.model = self.root / "model"
        self.model.mkdir()
        self.weight = self.model / "model.safetensors"
        self.weight.write_bytes(b"small pinned fixture: not TTS weights")
        self.model_records = [{
            "path": self.weight.name,
            "bytes": self.weight.stat().st_size,
            "sha256": digest(self.weight),
        }]
        self.references = self.root / "references"
        self.references.mkdir()
        self.reference_wav = self.references / "president.wav"
        write_wav(self.reference_wav)
        self.ref = {
            "ref_audio": "president.wav",
            "ref_text": "Este es el texto completo de la referencia oficial.",
            "sha256": digest(self.reference_wav),
        }
        self.reference_json = self.references / "prompts.json"
        self.reference_pack = {"schema": 1, "prompts": {"president": self.ref}}
        self.write_references()
        self.paragraphs = [" ".join(["palabra"] * 45), " ".join(["segunda"] * 45)]
        self.line = {
            "id": "audition-president-fixture",
            "person": "president",
            "label": "Presidente de prueba",
            "mood": "proud",
            "paragraphs": self.paragraphs,
            "text": "\n\n".join(self.paragraphs),
        }
        self.scripts = self.root / "scripts.json"
        self.script_pack = {"schema": 1, "samples": [self.line]}
        self.write_scripts()
        self.output = self.root / "output"

    def write_references(self):
        self.reference_json.write_text(json.dumps(self.reference_pack), encoding="utf-8")

    def write_scripts(self):
        self.scripts.write_text(json.dumps(self.script_pack), encoding="utf-8")

    def args(self, *extra):
        return self.builder.parse_args([
            "--model", str(self.model), "--references", str(self.reference_json),
            "--scripts", str(self.scripts), "--output", str(self.output), *extra,
        ])

    def plan(self, *extra):
        with mock.patch.object(self.builder, "MODEL_FILES", self.model_records):
            return self.builder.build_plan(self.args(*extra))

    def raw_fixture(self, plan):
        self.output.mkdir(exist_ok=True)
        line = plan["items"][0]
        source = self.root / "source-pcm.wav"
        raw = self.output / f"{line['id']}.wav"
        write_wav(source, seconds=30)
        subprocess.run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(source),
            "-codec:a", "pcm_f32le", str(raw),
        ], check=True, capture_output=True)
        record = {
            **{key: line[key] for key in ("id", "person", "mood", "text")},
            "raw_validated": True, "raw_sha256": digest(raw), "raw_wav": raw.name,
            "input_fingerprint": line["fingerprint"], "duration_seconds": 30,
            "conditioning_seconds": 1.25, "inference_seconds": 9.5, "rtf": 9.5 / 30,
            "eos_observation": {"status": "observed", "ended_with_eos": True,
                                "eos_found": True, "token_limit_without_eos": False},
        }
        return line, raw, record

    def partial_resume_fixture(self):
        other = copy.deepcopy(self.line)
        other.update(id="audition-successor-fixture", person="successor", mood="angry")
        self.script_pack["samples"].append(other)
        other_audio = self.references / "successor.wav"
        shutil.copyfile(self.reference_wav, other_audio)
        self.reference_pack["prompts"]["successor"] = dict(
            self.ref, ref_audio=other_audio.name, ref_text="Texto de referencia del segundo personaje."
        )
        self.write_scripts()
        self.write_references()
        full = self.plan()
        previous = dict(full, takes={}, raw_takes={}, status="complete")
        for line in full["items"]:
            _, raw, record = self.raw_fixture(dict(full, items=[line]))
            record.update(
                model_fingerprint=full["model"]["fingerprint"],
                reference_sha256=full["references"][line["person"]]["sha256"],
                reference_text=full["references"][line["person"]]["ref_text"],
            )
            encoded = self.output / f"{line['id']}.mp3"
            subprocess.run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw),
                "-codec:a", "libmp3lame", "-b:a", "64k", str(encoded),
            ], check=True, capture_output=True)
            previous["raw_takes"][line["id"]] = record
            previous["takes"][line["id"]] = dict(
                record, validated=True, sha256=digest(encoded), mp3=encoded.name,
                duration=self.builder.decode_metrics(encoded)["duration"],
            )
        (self.output / "manifest.json").write_text(json.dumps(previous), encoding="utf-8")
        return previous, self.plan("--person", "president"), other_audio

    def assert_rejected(self, operation):
        with self.assertRaises((ValueError, RuntimeError, FileNotFoundError, SystemExit)):
            operation()

    def test_model_verification_rejects_same_size_tampering(self):
        verified = self.builder.verify_model(self.model, records=self.model_records)
        self.assertRegex(verified["fingerprint"], r"^[0-9a-f]{64}$")
        before_size = self.weight.stat().st_size
        self.weight.write_bytes(b"X" * before_size)
        self.assertEqual(self.weight.stat().st_size, before_size)
        self.assert_rejected(lambda: self.builder.verify_model(self.model, records=self.model_records))

    def test_model_missing_file_and_size_mismatch_fail_preflight(self):
        self.weight.write_bytes(self.weight.read_bytes() + b"extra")
        self.assert_rejected(lambda: self.builder.verify_model(self.model, records=self.model_records))
        self.weight.unlink()
        self.assert_rejected(lambda: self.builder.verify_model(self.model, records=self.model_records))

    def test_reference_same_size_tampering_fails_preflight(self):
        self.plan()
        data = bytearray(self.reference_wav.read_bytes())
        data[-2:] = bytes([data[-2] ^ 1, data[-1]])
        self.reference_wav.write_bytes(data)
        self.assert_rejected(self.plan)

    def test_reference_requires_checksum_and_nonempty_transcript(self):
        original = copy.deepcopy(self.ref)
        for change in ({"sha256": None}, {"sha256": ""}, {"ref_text": "   "}):
            with self.subTest(change=change):
                self.reference_pack["prompts"]["president"] = dict(original, **change)
                self.write_references()
                self.assert_rejected(self.plan)

    def test_reference_format_and_duration_are_enforced_even_with_correct_hash(self):
        for kwargs in ({"rate": 16000}, {"channels": 2}, {"width": 1},
                       {"seconds": 6}, {"seconds": 13}):
            with self.subTest(**kwargs):
                write_wav(self.reference_wav, **kwargs)
                self.ref["sha256"] = digest(self.reference_wav)
                self.write_references()
                self.assert_rejected(self.plan)

    def test_local_reference_paths_work_and_url_references_are_rejected(self):
        outside = self.root / "outside.wav"
        shutil.copyfile(self.reference_wav, outside)
        (self.references / "linked.wav").symlink_to(outside)
        original_fingerprint = self.plan()["items"][0]["fingerprint"]
        for location in ("../outside.wav", str(outside), "linked.wav"):
            with self.subTest(location=location):
                self.ref["ref_audio"] = location
                self.write_references()
                self.assertEqual(self.plan()["items"][0]["fingerprint"], original_fingerprint)
        for location in ("https://example.invalid/reference.wav", "http://example.invalid/a.wav",
                         outside.as_uri()):
            with self.subTest(location=location):
                self.ref["ref_audio"] = location
                self.write_references()
                self.assert_rejected(self.plan)

    def test_scripts_require_two_paragraphs_and_word_count_range(self):
        for paragraphs in ([" ".join(["palabra"] * 90)],
                           [" ".join(["palabra"] * 43), " ".join(["palabra"] * 44)],
                           [" ".join(["palabra"] * 51), " ".join(["palabra"] * 52)]):
            with self.subTest(paragraphs=len(paragraphs), words=len(" ".join(paragraphs).split())):
                self.line["paragraphs"] = paragraphs
                self.line["text"] = "\n\n".join(paragraphs)
                self.write_scripts()
                self.assert_rejected(self.plan)

    def test_script_text_must_agree_with_both_paragraphs(self):
        self.line["text"] = self.paragraphs[0]
        self.write_scripts()
        self.assert_rejected(self.plan)

    def test_duplicate_ids_and_unsafe_ids_are_rejected(self):
        self.script_pack["samples"] = [self.line, copy.deepcopy(self.line)]
        self.write_scripts()
        self.assert_rejected(self.plan)
        self.script_pack["samples"] = [self.line]
        for unsafe_id in ("../escape", "nested/name", "..", "/absolute"):
            with self.subTest(id=unsafe_id):
                self.line["id"] = unsafe_id
                self.write_scripts()
                self.assert_rejected(self.plan)

    def test_selected_person_requires_both_script_and_reference(self):
        self.assert_rejected(lambda: self.plan("--person", "successor"))
        self.reference_pack["prompts"] = {}
        self.write_references()
        self.assert_rejected(lambda: self.plan("--person", "president"))

    def test_reference_directory_and_json_prepare_the_same_take(self):
        direct = self.plan()
        args = self.args()
        args.references = self.references
        with mock.patch.object(self.builder, "MODEL_FILES", self.model_records):
            directory = self.builder.build_plan(args)
        self.assertEqual(direct["items"][0]["fingerprint"], directory["items"][0]["fingerprint"])

    def test_repeat_and_comma_person_selection_deduplicate(self):
        other = copy.deepcopy(self.line)
        other.update(id="audition-successor-fixture", person="successor")
        self.script_pack["samples"].append(other)
        self.reference_pack["prompts"]["successor"] = copy.deepcopy(self.ref)
        self.write_scripts()
        self.write_references()
        plan = self.plan("--person", "successor,president", "--person", "president")
        self.assertCountEqual([item["person"] for item in plan["items"]], ["president", "successor"])

    def test_each_speech_input_invalidates_fingerprint(self):
        parameters = {"temperature": 0.75, "max_new_tokens": 2048}
        fingerprint = self.builder.take_fingerprint(self.line, self.ref, "model-a", parameters)
        mutations = []
        changed_line = copy.deepcopy(self.line)
        changed_line["paragraphs"][1] += " diferente"
        changed_line["text"] = "\n\n".join(changed_line["paragraphs"])
        mutations.append((changed_line, self.ref, "model-a", parameters))
        changed_ref = dict(self.ref, ref_text=self.ref["ref_text"] + " cambiado")
        mutations.append((self.line, changed_ref, "model-a", parameters))
        changed_ref_audio = dict(self.ref, sha256="a" * 64)
        mutations.append((self.line, changed_ref_audio, "model-a", parameters))
        mutations.append((self.line, self.ref, "model-b", parameters))
        mutations.append((self.line, self.ref, "model-a", dict(parameters, temperature=0.8)))
        for inputs in mutations:
            with self.subTest(inputs=inputs):
                self.assertNotEqual(self.builder.take_fingerprint(*inputs), fingerprint)

    def test_dry_run_imports_no_tts_and_does_not_mutate_output(self):
        original_import = builtins.__import__
        forbidden = {"torch", "numpy", "qwen_tts", "transformers", "torchaudio"}

        def guard(name, *args, **kwargs):
            if name.split(".")[0] in forbidden:
                raise AssertionError(f"Dry-run imported heavy dependency: {name}")
            return original_import(name, *args, **kwargs)

        stdout = io.StringIO()
        args = ["--model", str(self.model), "--references", str(self.reference_json),
                "--scripts", str(self.scripts), "--output", str(self.output), "--dry-run"]
        with mock.patch("builtins.__import__", side_effect=guard):
            # Fresh import also detects dependencies imported at module scope.
            dry_builder = load_builder()
            with mock.patch.object(dry_builder, "MODEL_FILES", self.model_records), \
                    contextlib.redirect_stdout(stdout):
                dry_builder.main(args)
        plan = json.loads(stdout.getvalue())
        self.assertEqual(len(plan["items"]), 1)
        self.assertEqual(plan["items"][0]["paragraphs"], 2)
        self.assertEqual(plan["items"][0]["word_count"], 90)
        self.assertFalse(self.output.exists())

    def test_loudness_parser_handles_ffmpeg_logs_after_measurement_json(self):
        process = SimpleNamespace(stderr=(
            "[Parsed_loudnorm_0]\n{\n"
            '  "input_i": "-20.15",\n  "input_tp": "-3.28",\n'
            '  "input_lra": "4.10",\n  "input_thresh": "-30.19"\n}\n'
            "[out#0/null] video:0KiB audio:123KiB\n"
            "size=N/A time=00:00:30.00 bitrate=N/A speed=18.2x\n"
        ))
        with mock.patch.object(self.builder.subprocess, "run", return_value=process):
            stats = self.builder.measure_loudness(self.reference_wav)
        self.assertEqual(stats["lufs"], -20.15)
        self.assertEqual(stats["true_peak_dbfs"], -3.28)

    def test_talker_observer_preserves_result_and_restores_method(self):
        class Matrix:
            def __init__(self, rows):
                self.rows = rows

            def tolist(self):
                return self.rows

        result = SimpleNamespace(sequences=Matrix([[10, 11, 20, 21, 99]]))

        class Talker:
            def __init__(self):
                self.calls = []

            def generate(self, **kwargs):
                self.calls.append(kwargs)
                return result

        talker = Talker()
        original = talker.generate
        observations = []
        restore = self.builder.observe_talker(talker, observations)
        kwargs = {"input_ids": Matrix([[10, 11]]), "max_new_tokens": 8, "eos_token_id": 99}
        try:
            self.assertIs(talker.generate(**kwargs), result)
            self.assertEqual(talker.calls, [kwargs])
            self.assertEqual(len(observations), 1)
            seen = observations[0]
            self.assertEqual(seen["status"], "observed")
            self.assertEqual(seen["generated_tokens"], 3)
            self.assertTrue(seen["eos_found"])
            self.assertTrue(seen["ended_with_eos"])
            self.assertFalse(seen["token_limit_without_eos"])
        finally:
            restore()
        self.assertEqual(talker.generate, original)

    def test_talker_observer_detects_token_cap_without_eos(self):
        talker = SimpleNamespace(generate=lambda **kwargs: SimpleNamespace(sequences=[[1, 2, 3]]))
        observations = []
        restore = self.builder.observe_talker(talker, observations)
        try:
            talker.generate(max_new_tokens=3, eos_token_id=99)
        finally:
            restore()
        seen = observations[0]
        self.assertEqual(seen["status"], "observed")
        self.assertEqual(seen["generated_tokens"], 3)
        self.assertFalse(seen["eos_found"])
        self.assertFalse(seen["ended_with_eos"])
        self.assertTrue(seen["token_limit_without_eos"])

    def test_talker_missing_sequences_is_unknown_and_does_not_alter_result(self):
        result = SimpleNamespace(sequences=None)
        talker = SimpleNamespace(generate=lambda **kwargs: result)
        observations = []
        restore = self.builder.observe_talker(talker, observations)
        try:
            self.assertIs(talker.generate(max_new_tokens=3, eos_token_id=99), result)
        finally:
            restore()
        self.assertEqual(observations[0]["status"], "unknown")

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg/ffprobe required")
    def test_raw_reuse_checks_identity_hash_decode_and_token_cap(self):
        plan = self.plan()
        line, raw, record = self.raw_fixture(plan)
        self.assertTrue(self.builder.reusable_raw(record, line, line["fingerprint"], self.output))
        self.assertFalse((self.output / f"{line['id']}.mp3").exists())
        for change in ({"raw_validated": False}, {"raw_sha256": "0" * 64},
                       {"input_fingerprint": "old"}, {"text": "old script"},
                       {"duration_seconds": 31},
                       {"eos_observation": {"token_limit_without_eos": True}}):
            with self.subTest(change=change):
                self.assertFalse(self.builder.reusable_raw(dict(record, **change), line,
                                                          line["fingerprint"], self.output))
        raw.write_bytes(b"not a complete WAV")
        record["raw_sha256"] = digest(raw)
        self.assertFalse(self.builder.reusable_raw(record, line, line["fingerprint"], self.output))

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg/ffprobe required")
    def test_encoder_failure_recovers_raw_without_tts_and_preserves_inference_metrics(self):
        plan = self.plan()
        line, raw, record = self.raw_fixture(plan)
        manifest_path = self.output / "manifest.json"
        manifest_path.write_text(json.dumps({"takes": {}, "raw_takes": {line["id"]: record}}),
                                 encoding="utf-8")
        original_import = builtins.__import__

        def guard(name, *args, **kwargs):
            if name.split(".")[0] in {"torch", "numpy", "qwen_tts", "soundfile", "transformers"}:
                raise AssertionError(f"RAW recovery imported TTS dependency: {name}")
            return original_import(name, *args, **kwargs)

        with mock.patch("builtins.__import__", side_effect=guard), \
                mock.patch.object(self.builder, "validate_runtime", side_effect=AssertionError("TTS runtime used")), \
                contextlib.redirect_stdout(io.StringIO()):
            with mock.patch.object(self.builder, "encode_mp3", side_effect=RuntimeError("encoder unavailable")):
                with self.assertRaisesRegex(RuntimeError, "encoder unavailable"):
                    self.builder.generate(plan)
            failed = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(failed["status"], "failed")
            self.assertEqual(failed["raw_takes"][line["id"]]["raw_sha256"], digest(raw))
            self.assertFalse((self.output / ".qwen-auditions.lock").exists())
            recovered = self.builder.generate(plan)
        self.assertEqual(recovered["status"], "complete")
        take = recovered["takes"][line["id"]]
        self.assertTrue(take["validated"])
        for key in ("conditioning_seconds", "inference_seconds", "rtf", "raw_sha256"):
            self.assertEqual(take[key], record[key])
        self.assertTrue(self.builder.reusable_take(take, line, line["fingerprint"], self.output))
        self.assertFalse((self.output / ".qwen-auditions.lock").exists())

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg/ffprobe required")
    def test_force_skips_existing_raw_and_requests_new_inference(self):
        plan = self.plan()
        line, raw, record = self.raw_fixture(plan)
        (self.output / "manifest.json").write_text(
            json.dumps({"takes": {}, "raw_takes": {line["id"]: record}}), encoding="utf-8"
        )
        with mock.patch.object(self.builder, "validate_runtime", side_effect=RuntimeError("new inference requested")), \
                mock.patch.object(self.builder, "finish_raw_take", side_effect=AssertionError("forced run reused raw")), \
                contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(RuntimeError, "new inference requested"):
                self.builder.generate(plan, force=True)
        self.assertFalse((self.output / ".qwen-auditions.lock").exists())

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg/ffprobe required")
    def test_partial_resume_preserves_verified_unselected_audition(self):
        previous, selected, _ = self.partial_resume_fixture()
        with mock.patch.object(self.builder, "validate_runtime", side_effect=AssertionError("TTS runtime used")), \
                contextlib.redirect_stdout(io.StringIO()):
            resumed = self.builder.generate(selected)
        self.assertEqual(resumed["status"], "complete")
        self.assertCountEqual(resumed["takes"], previous["takes"])
        self.assertCountEqual(resumed["raw_takes"], previous["raw_takes"])
        self.assertCountEqual([item["person"] for item in resumed["items"]], ["president", "successor"])
        self.assertCountEqual(resumed["references"], ["president", "successor"])
        self.assertEqual(resumed["takes"]["audition-successor-fixture"],
                         previous["takes"]["audition-successor-fixture"])

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg/ffprobe required")
    def test_forced_partial_run_keeps_unselected_checkpoint_if_selected_inference_fails(self):
        previous, selected, _ = self.partial_resume_fixture()
        with mock.patch.object(self.builder, "validate_runtime", side_effect=RuntimeError("new selected inference")), \
                contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(RuntimeError, "new selected inference"):
                self.builder.generate(selected, force=True)
        saved = json.loads((self.output / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(saved["status"], "failed")
        self.assertEqual(saved["takes"]["audition-successor-fixture"],
                         previous["takes"]["audition-successor-fixture"])
        self.assertEqual(saved["raw_takes"]["audition-successor-fixture"],
                         previous["raw_takes"]["audition-successor-fixture"])
        self.assertNotIn("audition-president-fixture", saved["takes"])
        self.assertFalse((self.output / ".qwen-auditions.lock").exists())

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg/ffprobe required")
    def test_changed_reference_pack_does_not_publish_old_unselected_audition(self):
        previous, selected, _ = self.partial_resume_fixture()
        self.reference_pack["revision_note"] = "Changed pack, unchanged selected reference."
        self.write_references()
        changed = self.plan("--person", "president")
        self.assertNotEqual(changed["reference_pack_sha256"], previous["reference_pack_sha256"])
        self.assertEqual(changed["items"][0]["fingerprint"], selected["items"][0]["fingerprint"])
        with mock.patch.object(self.builder, "validate_runtime", side_effect=AssertionError("TTS runtime used")), \
                contextlib.redirect_stdout(io.StringIO()):
            resumed = self.builder.generate(changed)
        self.assertEqual(list(resumed["takes"]), ["audition-president-fixture"])
        self.assertEqual(list(resumed["references"]), ["president"])
        self.assertEqual([item["person"] for item in resumed["items"]], ["president"])

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg/ffprobe required")
    def test_tampered_unselected_source_is_not_preserved_despite_matching_pack_sha(self):
        previous, selected, other_audio = self.partial_resume_fixture()
        data = bytearray(other_audio.read_bytes())
        data[-1] ^= 1
        other_audio.write_bytes(data)
        self.assertEqual(self.plan("--person", "president")["reference_pack_sha256"],
                         previous["reference_pack_sha256"])
        with mock.patch.object(self.builder, "validate_runtime", side_effect=AssertionError("TTS runtime used")), \
                contextlib.redirect_stdout(io.StringIO()):
            resumed = self.builder.generate(selected)
        self.assertEqual(list(resumed["takes"]), ["audition-president-fixture"])
        self.assertNotIn("successor", resumed["references"])

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg/ffprobe required")
    def test_resume_requires_validated_hashes_and_decodable_non_silent_audio(self):
        self.output.mkdir()
        raw = self.output / f"{self.line['id']}.wav"
        encoded = self.output / f"{self.line['id']}.mp3"
        source = self.output / "source.wav"

        def float_wave(silent=False):
            write_wav(source, seconds=30, silent=silent)
            subprocess.run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(source),
                "-codec:a", "pcm_f32le", str(raw),
            ], check=True, capture_output=True)

        float_wave()
        subprocess.run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw),
            "-codec:a", "libmp3lame", "-b:a", "64k", str(encoded),
        ], check=True, capture_output=True)
        fingerprint = self.builder.take_fingerprint(self.line, self.ref, "model", {})
        record = {
            "validated": True,
            "id": self.line["id"], "person": self.line["person"], "mood": self.line["mood"],
            "text": self.line["text"], "input_fingerprint": fingerprint,
            "sha256": digest(encoded), "raw_sha256": digest(raw),
            "duration": self.builder.decode_metrics(encoded)["duration"],
        }
        self.assertTrue(self.builder.reusable_take(record, self.line, fingerprint, self.output))
        for change in ({"validated": False}, {"input_fingerprint": "old"},
                       {"text": "outdated speech"}, {"sha256": "0" * 64},
                       {"raw_sha256": "0" * 64}):
            with self.subTest(change=change):
                self.assertFalse(self.builder.reusable_take(dict(record, **change), self.line,
                                                           fingerprint, self.output))
        encoded.write_bytes(b"not decodable audio")
        # Matching a corrupt file's new hash must not be sufficient for reuse.
        record["sha256"] = digest(encoded)
        self.assertFalse(self.builder.reusable_take(record, self.line, fingerprint, self.output))
        float_wave(silent=True)
        record["raw_sha256"] = digest(raw)
        subprocess.run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw),
            "-codec:a", "libmp3lame", str(encoded),
        ], check=True, capture_output=True)
        record["sha256"] = digest(encoded)
        self.assertFalse(self.builder.reusable_take(record, self.line, fingerprint, self.output))


if __name__ == "__main__":
    unittest.main()
