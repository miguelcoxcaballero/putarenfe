"""Master nine explicitly selected, completed Qwen auditions; never infer or publish."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil

DEFAULT_PROVIDER = Path(__file__).resolve().with_name('build_qwen_voices.py')
APPROVED_FIRST_PEDRO_RAW = '04b4e5f30a41f66f2d04cad480dc43d3b492f3e58a63faa62ae795e8cdd6a07a'


def load_provider(path):
    spec = importlib.util.spec_from_file_location('qwen_audition_master_provider', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def policy():
    return {'schema': 1, 'mode': 'speech', 'mp3_bitrate': '160k', 'target_lufs': -21.0,
            'maximum_true_peak_dbfs': -1.5, 'outer_silence_threshold_relative_db': -60,
            'leading_margin_ms': 80, 'trailing_margin_ms': 120,
            'peak_guard': {'threshold_dbfs': -1.8, 'maximum_peak_reduction_db': 6,
                           'attack_ms': 5, 'release_ms': 80, 'level': False, 'latency': True},
            'processing': 'Exterior silence only, static gain and bounded lookahead peak guard; no internal pause removal, EQ, pitch, tempo or broadband compression.'}


def read_selection(selection, references, output, provider):
    core = provider.core
    payload = core.read_json(selection)
    sources = payload.get('sources')
    if not isinstance(sources, list) or len(sources) != 9:
        raise ValueError('The selection must name exactly nine source report/ID pairs')
    if {s.get('person') for s in sources} != set(core.ROLES):
        raise ValueError('The selection must include every actor exactly once')
    prompts = core.read_json(references)['prompts']
    rows = []
    for source in sources:
        person, ident = source['person'], source['id']
        if not re.fullmatch(r'audition-' + re.escape(person) + r'-long-qwen-v[0-9]+', ident):
            raise ValueError('Invalid long audition ID: ' + ident)
        report_path = Path(source['report'])
        if not report_path.is_absolute():
            report_path = selection.parent / report_path
        report_path = report_path.resolve()
        report = core.read_json(report_path)
        if report.get('model_repository') != core.MODEL_REPOSITORY or report.get('model_revision') != core.MODEL_REVISION:
            raise ValueError('Selected source report does not declare the pinned Qwen model: ' + person)
        pid = report.get('producer_pid')
        if pid and Path('/proc', str(pid)).exists():
            raise ValueError('Source producer must finish before mastering: ' + person)
        matches = [c for c in report.get('clips', []) if c.get('person') == person and c.get('id') == ident]
        if len(matches) != 1:
            raise ValueError('The source report does not contain exactly one selected clip: ' + ident)
        row = dict(matches[0])
        raw = Path(row['raw_wav'])
        original_mp3 = Path(row['mp3'])
        if not raw.is_absolute():
            raw = report_path.parent / raw
        if not original_mp3.is_absolute():
            original_mp3 = report_path.parent / original_mp3
        raw, original_mp3 = raw.resolve(), original_mp3.resolve()
        if output == raw.parent or output == original_mp3.parent:
            raise ValueError('Mastering requires a new directory outside the source recordings')
        if core.digest(raw) != row['raw_sha256'] or core.digest(original_mp3) != row['mp3_sha256']:
            raise ValueError('A selected source recording changed: ' + ident)
        metrics = core.decode_metrics(raw)
        if metrics['codec'] != 'pcm_f32le' or metrics['peak'] >= 1 or abs(metrics['duration'] - row['duration_seconds']) > .02:
            raise ValueError('Selected raw audio failed native float32/finite/unclipped validation: ' + ident)
        if len([p for p in row['text'].split('\n\n') if p.strip()]) != 2:
            raise ValueError('Selected audition does not contain two paragraphs: ' + ident)
        ref = prompts[person]
        ref_path = Path(ref['ref_audio'])
        if not ref_path.is_absolute():
            ref_path = references.parent / ref_path
        ref_sha = core.digest(ref_path)
        if ref_sha != ref['sha256'] or ref_sha != row['reference_sha256']:
            raise ValueError('Selected audition and chosen reference pack disagree: ' + person)
        eos = row.get('token_observation') or {}
        observed = eos.get('eos_observed') is True and (eos.get('last_effective_token', eos.get('last_generated_token')) == 2150)
        baseline_exception = (source.get('allow_unobserved_eos_for_accepted_baseline') is True
                              and person == 'president' and row['raw_sha256'] == APPROVED_FIRST_PEDRO_RAW)
        if not observed and not baseline_exception:
            raise ValueError('The selected audition lacks an observed EOS: ' + ident)
        if eos.get('limit_reached_without_eos') is True:
            raise ValueError('The selected audition reached its generation limit: ' + ident)
        row.update(source_report=str(report_path), source_report_sha256=core.digest(report_path),
                   source_raw_wav=str(raw), source_mp3=str(original_mp3),
                   source_mp3_sha256=row['mp3_sha256'], source_report_status=report.get('status'),
                   accepted_baseline_without_eos_observation=baseline_exception,
                   validated_native_raw=metrics, reference_pack=str(references))
        row['mastering_input_fingerprint'] = core.hash_json({
            'id': ident, 'person': person, 'text': row['text'], 'raw_sha256': row['raw_sha256'],
            'reference_sha256': ref_sha, 'mastering': policy()})
        rows.append(row)
    return rows


def validate_output_targets(rows, output):
    targets = [output / 'report.json', output / 'report.json.tmp', output / '.qwen-auditions.lock']
    for row in rows:
        for suffix in ('.wav', '.mp3'):
            targets.append(output / (row['id'] + suffix))
    for target in targets:
        if target.is_symlink() or (target.exists() and target.stat().st_nlink > 1):
            raise ValueError('Output must not link to another recording: ' + str(target))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--selection', required=True, type=Path)
    parser.add_argument('--references', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--provider', type=Path, default=DEFAULT_PROVIDER)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args(argv)
    output = args.output.resolve()
    provider = load_provider(args.provider.resolve())
    core = provider.core
    if output.is_relative_to(core.PROJECT / 'dist'):
        raise ValueError('This encoder never writes production assets')
    rows = read_selection(args.selection.resolve(), args.references.resolve(), output, provider)
    validate_output_targets(rows, output)
    manifest = {'schema': 1, 'status': 'preflight', 'provider': 'Qwen3-TTS long auditions · speech mastering',
                'started_at': core.utc(), 'producer_pid': os.getpid(), 'mastering': policy(),
                'model_repository': core.MODEL_REPOSITORY, 'model_revision': core.MODEL_REVISION,
                'selection_sha256': core.digest(args.selection), 'reference_pack_sha256': core.digest(args.references),
                'mastering_provider': str(args.provider.resolve()), 'mastering_provider_sha256': core.digest(args.provider),
                'source_records': rows, 'clips': [], 'human_listening': False,
                'note': 'New MP3 mastering from the same immutable native waveform; no inference or identity change.'}
    if args.dry_run:
        print(json.dumps({'status': 'dry-run', 'voices': [r['person'] for r in rows],
                          'mastering': policy(), 'output': str(output)}, ensure_ascii=False, indent=2))
        return
    if output.exists() and any(output.iterdir()) and not (output / 'report.json').exists():
        raise ValueError('Mastering requires an empty new directory or a matching previous report')
    output.mkdir(parents=True, exist_ok=True)
    target = output / 'report.json'
    if target.exists():
        previous = core.read_json(target)
        if previous.get('selection_sha256') != manifest['selection_sha256'] or previous.get('mastering') != policy():
            raise ValueError('Existing output belongs to a different selection or mastering policy')
    lock = core.acquire_lock(output)
    try:
        core.atomic_json(target, manifest)
        for row in rows:
            validate_output_targets([row], output)
            raw = output / (row['id'] + '.wav')
            if raw.exists() and core.digest(raw) != row['raw_sha256']:
                raise ValueError('Existing raw copy has a different SHA: ' + row['id'])
            if not raw.exists():
                shutil.copyfile(row['source_raw_wav'], raw)
            if core.digest(raw) != row['raw_sha256']:
                raise ValueError('Copied raw does not match its immutable source: ' + row['id'])
            item = {'id': row['id'], 'input_fingerprint': row['mastering_input_fingerprint']}
            mastered = provider.finish_raw(row, item, output, policy())
            encoded = output / mastered['mp3']
            if core.digest(row['source_raw_wav']) != row['raw_sha256'] or core.digest(row['source_mp3']) != row['source_mp3_sha256']:
                raise ValueError('A baseline recording changed during mastering')
            mastered.update(raw_wav=str(raw), mp3=str(encoded), mp3_sha256=mastered['sha256'],
                            mastered_duration_seconds=mastered['duration'], original_duration_seconds=row['duration_seconds'],
                            original_mp3_duration_seconds=row.get('mp3_duration_seconds'),
                            mp3_duration_seconds=mastered['duration'],
                            reencoded_from_same_raw=True, generation_repeated=False)
            manifest['clips'].append(mastered)
            core.atomic_json(target, manifest)
            core.event('mastered', id=row['id'], person=row['person'], lufs=mastered['mp3_lufs'],
                       true_peak_dbfs=mastered['mp3_true_peak_dbfs'], sha256=mastered['mp3_sha256'])
        manifest.update(status='complete', ended_at=core.utc())
        core.atomic_json(target, manifest)
    except Exception as error:
        manifest.update(status='failed', error_type=type(error).__name__, error=str(error), ended_at=core.utc())
        core.atomic_json(target, manifest)
        raise
    finally:
        lock.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
