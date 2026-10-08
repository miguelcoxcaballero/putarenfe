"""Audition mastering tests: real lightweight helpers, fake audio/encoder only.

python3 tools/master-qwen-auditions-test.py
No Torch, model, audio decoding or encoder process is used.
"""
import builtins
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest import mock

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("audition_master", HERE / "master_qwen_auditions.py")
MASTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MASTER)
PROVIDER = MASTER.load_provider(MASTER.DEFAULT_PROVIDER)
CORE = PROVIDER.core


class Fixture(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.selection = self.root / "selection.json"
        self.references = self.root / "refs" / "prompts.json"
        self.references.parent.mkdir()
        self.output = self.root / "mastered"
        self.sources, self.rows, self.reports, self.prompts = [], {}, {}, {}
        for person in CORE.ROLES:
            directory = self.root / "baseline" / person
            directory.mkdir(parents=True)
            ident = "audition-" + person + "-long-qwen-v2"
            raw, mp3 = directory / (ident + ".wav"), directory / (ident + ".mp3")
            raw.write_bytes(("RAW fixture for " + person).encode())
            mp3.write_bytes(("old MP3 fixture for " + person).encode())
            reference = self.references.parent / (person + ".wav")
            reference.write_bytes(("reference fixture for " + person).encode())
            self.prompts[person] = {"ref_audio": reference.name, "sha256": CORE.digest(reference)}
            row = {"id": ident, "person": person, "text": "First paragraph.\n\nSecond paragraph.",
                   "raw_wav": raw.name, "mp3": mp3.name, "raw_sha256": CORE.digest(raw),
                   "mp3_sha256": CORE.digest(mp3), "duration_seconds": 10.0,
                   "mp3_duration_seconds": 10.05, "reference_sha256": CORE.digest(reference),
                   "token_observation": {"eos_observed": True, "last_effective_token": 2150,
                                         "limit_reached_without_eos": False}}
            report = {"status": "complete", "model_repository": CORE.MODEL_REPOSITORY,
                      "model_revision": CORE.MODEL_REVISION, "clips": [row]}
            path = directory / "report.json"
            self.rows[person], self.reports[person] = row, report
            self.sources.append({"person": person, "id": ident,
                                 "report": str(path.relative_to(self.root))})
        self.persist()
        self.original_files = {path: path.read_bytes() for path in (self.root / "baseline").rglob("*") if path.is_file()}

    def persist(self):
        self.selection.write_text(json.dumps({"sources": self.sources}), encoding="utf-8")
        self.references.write_text(json.dumps({"prompts": self.prompts}), encoding="utf-8")
        for person, report in self.reports.items():
            (self.root / "baseline" / person / "report.json").write_text(json.dumps(report), encoding="utf-8")

    def fake_metrics(self, path):
        return {"codec": "pcm_f32le", "peak": 0.2, "duration": 10.0, "finite": True,
                "samples": 240_000, "sample_rate": 24_000, "channels": 1, "rms": 0.02}

    def fake_finish(self, row, item, stage, policy):
        encoded = stage / (item["id"] + ".mp3")
        encoded.write_bytes(("mastered fixture " + item["id"]).encode())
        return {**row, "mp3": encoded.name, "sha256": CORE.digest(encoded), "duration": 9.4,
                "mp3_lufs": -21.0, "mp3_true_peak_dbfs": -1.5, "validated": True}

    def run_main(self, extra=(), output=None, finish=None):
        with mock.patch.object(MASTER, "load_provider", return_value=PROVIDER), \
                mock.patch.object(CORE, "decode_metrics", side_effect=self.fake_metrics), \
                mock.patch.object(PROVIDER, "finish_raw", side_effect=finish or self.fake_finish) as encoder, \
                mock.patch.object(CORE, "event"), contextlib.redirect_stdout(io.StringIO()):
            self.last_encoder = encoder
            result = MASTER.main(["--selection", str(self.selection), "--references", str(self.references),
                                  "--output", str(output or self.output), *extra])
        return result, encoder

    def read_rows(self):
        with mock.patch.object(CORE, "decode_metrics", side_effect=self.fake_metrics):
            return MASTER.read_selection(self.selection, self.references, self.output, PROVIDER)

    def assert_sources_unchanged(self):
        for path, data in self.original_files.items():
            self.assertEqual(path.read_bytes(), data, str(path))


class PolicyTests(Fixture):
    def test_policy_is_identical_to_production_plan_including_json_hash(self):
        catalogue = self.root / "catalogue.json"
        catalogue.write_text(json.dumps([{**row, "mood": "happy"} for row in self.rows.values()]))
        args = PROVIDER.parse_args(["--model", str(self.root / "model"), "--references", str(self.references),
                                   "--catalogue", str(catalogue), "--output", str(self.output),
                                   "--mastering", "speech", "--target-lufs", "-21", "--peak-dbfs", "-1.5"])
        with mock.patch.object(CORE.shutil, "which", return_value="/test/encoder"), \
                mock.patch.object(CORE, "prepare_reference", side_effect=lambda person, ref, directory: {**ref, "ref_text": "Reference words"}), \
                mock.patch.object(CORE, "verify_model", return_value={"directory": str(self.root / "model"), "fingerprint": "model-fixture"}):
            production = PROVIDER.build_plan(args)["mastering"]
        self.assertEqual(MASTER.policy(), production)
        self.assertEqual(CORE.hash_json(MASTER.policy()), CORE.hash_json(production))
        self.assertEqual(json.dumps(MASTER.policy(), sort_keys=True), json.dumps(production, sort_keys=True))

    def test_real_provider_import_does_not_load_neural_or_audio_runtime(self):
        original = builtins.__import__

        def lightweight(name, *args, **kwargs):
            if name.split(".", 1)[0] in {"torch", "qwen_tts", "numpy", "soundfile", "librosa"}:
                raise AssertionError("Heavy import: " + name)
            return original(name, *args, **kwargs)

        with mock.patch("builtins.__import__", side_effect=lightweight):
            loaded = MASTER.load_provider(MASTER.DEFAULT_PROVIDER)
        self.assertTrue(callable(loaded.finish_raw))

    def test_real_finish_raw_uses_production_trim_and_guard_without_touching_raw(self):
        stage = self.root / "helper-fixture"
        stage.mkdir()
        row = {**self.rows["adif"], "duration_seconds": 4.0}
        raw = stage / (row["id"] + ".wav")
        raw.write_bytes(b"untouched raw fixture")
        before = raw.read_bytes()
        values = ([0.0] * 24_000 + [0.1] * 12_000 + [0.0] * 24_000
                  + [0.1] * 12_000 + [0.0] * 24_000)
        calls = []

        def encode(command, **kwargs):
            calls.append(command)
            Path(command[-1]).write_bytes(b"fake encoded output")

        with mock.patch.object(PROVIDER, "decode_samples", return_value=values), \
                mock.patch.object(PROVIDER, "loudness", side_effect=[{"lufs": -25.0, "true_peak_dbfs": -6.0},
                                                                  {"lufs": -21.0, "true_peak_dbfs": -1.6}]), \
                mock.patch.object(CORE, "decode_metrics", return_value={"codec": "mp3", "peak": 0.2, "duration": 2.25}), \
                mock.patch.object(PROVIDER.subprocess, "run", side_effect=encode):
            result = PROVIDER.finish_raw(row, {"id": row["id"], "input_fingerprint": "fixture"}, stage, MASTER.policy())
        self.assertEqual(raw.read_bytes(), before)
        self.assertEqual(len(calls), 1)
        filters = calls[0][calls[0].index("-af") + 1]
        self.assertIn("atrim=start_sample=22080:end_sample=74880,asetpts=PTS-STARTPTS", filters)
        self.assertIn("volume=4.0dB,alimiter=", filters)
        self.assertIn("attack=5:release=80:level=false:latency=true", filters)
        self.assertNotIn("acompressor", filters)
        self.assertNotIn("atempo", filters)
        self.assertNotIn("silenceremove", filters)
        self.assertEqual(result["duration_seconds"], 4.0)
        self.assertEqual(result["duration"], 2.25)
        self.assertEqual(result["trim"]["end_sample"] - result["trim"]["start_sample"], 52_800)


class InputTests(Fixture):
    def test_portable_relative_paths_cover_exactly_nine_roles(self):
        rows = self.read_rows()
        self.assertEqual([row["person"] for row in rows], list(CORE.ROLES))
        for row in rows:
            self.assertEqual(Path(row["source_report"]), self.root / "baseline" / row["person"] / "report.json")
            self.assertEqual(Path(row["source_raw_wav"]).parent, self.root / "baseline" / row["person"])

    def test_missing_or_repeated_role_fails_before_output_is_created(self):
        for replacement in (self.sources[:-1], [self.sources[0], *self.sources[1:-1], self.sources[0]]):
            with self.subTest(count=len(replacement)):
                self.selection.write_text(json.dumps({"sources": replacement}))
                with self.assertRaises(ValueError):
                    self.run_main()
                self.assertFalse(self.output.exists())

    def test_changed_source_sha_fails_before_output_is_created(self):
        path = self.root / "baseline" / "adif" / self.rows["adif"]["raw_wav"]
        path.write_bytes(b"source changed")
        with self.assertRaisesRegex(ValueError, "source recording changed"):
            self.run_main()
        self.assertFalse(self.output.exists())

    def test_reference_disagreement_fails_before_output_is_created(self):
        self.rows["adif"]["reference_sha256"] = "old-reference"
        self.persist()
        with self.assertRaisesRegex(ValueError, "reference pack disagree"):
            self.run_main()
        self.assertFalse(self.output.exists())

    def test_invalid_eos_or_limit_fails_before_output_is_created(self):
        for eos in ({}, {"eos_observed": False, "last_effective_token": 2150},
                    {"eos_observed": True, "last_generated_token": 2149},
                    {"eos_observed": True, "last_effective_token": 2150, "limit_reached_without_eos": True}):
            with self.subTest(eos=eos):
                self.rows["adif"]["token_observation"] = eos
                self.persist()
                with self.assertRaises(ValueError):
                    self.run_main()
                self.assertFalse(self.output.exists())

    def test_active_source_producer_is_rejected(self):
        self.reports["adif"]["producer_pid"] = os.getpid()
        self.persist()
        with self.assertRaisesRegex(ValueError, "producer must finish"):
            self.run_main()
        self.assertFalse(self.output.exists())

    def test_closed_valid_adif_clip_is_usable_in_historical_running_report(self):
        self.reports["adif"]["status"] = "running"
        self.persist()
        rows = self.read_rows()
        self.assertEqual(next(row for row in rows if row["person"] == "adif")["source_report_status"], "running")

    def test_changed_model_identity_fails_before_output_is_created(self):
        self.reports["adif"]["model_revision"] = "another-model"
        self.persist()
        with self.assertRaisesRegex(ValueError, "pinned Qwen model"):
            self.run_main()
        self.assertFalse(self.output.exists())

    def test_dist_output_and_source_directory_are_rejected(self):
        for output in (CORE.PROJECT / "dist" / "mastering-test", self.root / "baseline" / "adif"):
            with self.subTest(output=output), self.assertRaises(ValueError):
                self.run_main(output=output)

    def test_dry_run_does_not_create_output_or_call_encoder(self):
        _, encoder = self.run_main(["--dry-run"])
        encoder.assert_not_called()
        self.assertFalse(self.output.exists())


class OutputTests(Fixture):
    def test_direct_finish_raw_reuse_preserves_raw_sources_and_duration_meanings(self):
        calls = []

        def finish(row, item, stage, policy):
            self.assertEqual(policy, MASTER.policy())
            self.assertTrue((stage / "report.json").is_file(), "Report must exist before encoding")
            copied = stage / (item["id"] + ".wav")
            self.assertEqual(copied.read_bytes(), Path(row["source_raw_wav"]).read_bytes())
            calls.append(item["id"])
            return self.fake_finish(row, item, stage, policy)

        _, encoder = self.run_main(finish=finish)
        self.assertEqual(encoder.call_count, 9)
        self.assertEqual(set(calls), {row["id"] for row in self.rows.values()})
        self.assert_sources_unchanged()
        report = CORE.read_json(self.output / "report.json")
        self.assertEqual(report["status"], "complete")
        self.assertEqual(len(report["source_records"]), 9)
        self.assertEqual(report["model_revision"], CORE.MODEL_REVISION)
        for clip in report["clips"]:
            self.assertEqual(clip["original_duration_seconds"], 10.0)
            self.assertEqual(clip["mastered_duration_seconds"], 9.4)
            self.assertEqual(clip["mp3_duration_seconds"], 9.4)
            self.assertEqual(clip["original_mp3_duration_seconds"], 10.05)
            self.assertFalse(clip["generation_repeated"])

    def test_encoder_failure_saves_prior_progress_and_keeps_sources(self):
        attempts = []

        def finish(row, item, stage, policy):
            attempts.append(item["id"])
            if len(attempts) == 2:
                raise RuntimeError("fake encoder failure")
            return self.fake_finish(row, item, stage, policy)

        with self.assertRaisesRegex(RuntimeError, "fake encoder failure"):
            self.run_main(finish=finish)
        report = CORE.read_json(self.output / "report.json")
        self.assertEqual(report["status"], "failed")
        self.assertEqual(len(report["clips"]), 1)
        self.assertEqual(len(report["source_records"]), 9)
        self.assertEqual(report["error_type"], "RuntimeError")
        self.assertFalse((self.output / ".qwen-auditions.lock").exists())
        self.assert_sources_unchanged()

    def test_raw_copy_corruption_is_detected_before_encoder(self):
        def bad_copy(source, destination):
            Path(destination).write_bytes(b"corrupt copied bytes")

        with mock.patch.object(MASTER.shutil, "copyfile", side_effect=bad_copy):
            with self.assertRaisesRegex(ValueError, "Copied raw"):
                self.run_main()
        self.last_encoder.assert_not_called()
        self.assertEqual(CORE.read_json(self.output / "report.json")["status"], "failed")
        self.assert_sources_unchanged()

    def check_link(self, hard=False):
        self.output.mkdir()
        first = self.rows[CORE.ROLES[0]]
        source = self.root / "baseline" / first["person"] / first["mp3"]
        target = self.output / first["mp3"]
        if hard:
            os.link(source, target)
        else:
            target.symlink_to(source)
        with self.assertRaisesRegex(ValueError, "must not link"):
            self.run_main()
        self.last_encoder.assert_not_called()
        self.assertFalse((self.output / "report.json").exists())
        self.assert_sources_unchanged()

    def test_symlink_cannot_overwrite_baseline(self):
        self.check_link()

    def test_hardlink_cannot_overwrite_baseline(self):
        self.check_link(hard=True)

    def test_linked_report_temporary_cannot_overwrite_baseline_report(self):
        self.output.mkdir()
        source = self.root / "baseline" / "adif" / "report.json"
        (self.output / "report.json.tmp").symlink_to(source)
        with self.assertRaisesRegex(ValueError, "must not link"):
            self.run_main()
        self.last_encoder.assert_not_called()
        self.assert_sources_unchanged()


if __name__ == "__main__":
    unittest.main(verbosity=2)
