"""Archive every obsolete Qwen take against a fresh, fully fingerprinted plan.

Use only after generation has stopped:
  python tools/archive_qwen_takes.py --stage STAGE --plan fresh-plan.json --output ARCHIVE

The archive contains byte copies of the closed manifest, optional ASR reports,
the fresh plan, both audio files of every stale/removed full take, and the WAV
of every stale/removed RAW-only checkpoint. This tool does
not load models, inspect reference files, decode audio, or change the live stage.
An existing archive must match exactly; it is never updated in place.
"""
import argparse
from datetime import datetime
import hashlib
import json
import math
import os
from pathlib import Path
import re
import stat
import sys
import tempfile


ID_PATTERN = re.compile(r'[A-Za-z0-9_-]+')
SHA_PATTERN = re.compile(r'[0-9a-f]{64}')
LOCK_NAME = '.qwen-auditions.lock'
CLOSED_STATES = {'complete', 'partial', 'incomplete', 'failed'}
EXPLICIT_END_STATES = {'incomplete', 'failed'}
RAW_COHERENCE_FIELDS = (
    'id', 'person', 'mood', 'text', 'effective_text', 'raw_wav', 'raw_sha256',
    'raw_validated', 'input_fingerprint', 'inference_fingerprint',
    'reference_sha256', 'reference_text', 'model_fingerprint',
    'batch_id', 'batch_index', 'batch_seed', 'planned_token_cap',
    'duration_seconds', 'samples', 'sample_rate', 'finite', 'rms', 'peak',
    'eos_observation', 'codec_observation', 'batch_inference_seconds',
    'latency_scope', 'conditioning_seconds', 'inference_seconds', 'rtf',
    'started_at', 'ended_at', 'generated_at',
)


def valid_id(value):
    return isinstance(value, str) and ID_PATTERN.fullmatch(value) is not None


def valid_sha(value):
    return isinstance(value, str) and SHA_PATTERN.fullmatch(value) is not None


def read_json(data, label):
    try:
        value = json.loads(data)
    except (ValueError, UnicodeError) as error:
        raise ValueError('Invalid JSON: ' + label) from error
    if not isinstance(value, dict):
        raise ValueError('Expected JSON object: ' + label)
    return value


def signature(info):
    return (info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns)


def read_source(path):
    """Read one regular file without following a final symlink or hiding a race."""
    path = Path(path)
    before = path.lstat()
    if not stat.S_ISREG(before.st_mode):
        raise ValueError('Expected regular source file: ' + str(path))
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(descriptor, 'rb') as stream:
        if signature(os.fstat(stream.fileno())) != signature(before):
            raise ValueError('Source changed before reading: ' + str(path))
        data = stream.read()
        after = os.fstat(stream.fileno())
    if signature(before) != signature(after) or signature(path.lstat()) != signature(before):
        raise ValueError('Source changed while reading: ' + str(path))
    return {'path': path, 'signature': signature(before), 'data': data,
            'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}


def assert_unchanged(source):
    current = read_source(source['path'])
    if current['signature'] != source['signature'] or current['sha256'] != source['sha256']:
        raise ValueError('Source changed during archive: ' + str(source['path']))


def assert_closed(stage, manifest=None):
    lock = stage / LOCK_NAME
    if lock.exists() or lock.is_symlink():
        raise ValueError('Stage is locked; finish the producer first: ' + str(lock))
    if manifest is not None:
        status = manifest.get('status')
        if status not in CLOSED_STATES:
            raise ValueError('Stage must have a closed producer status')
        if status in EXPLICIT_END_STATES:
            ended_at = manifest.get('ended_at')
            try:
                if not isinstance(ended_at, str) or not ended_at.strip():
                    raise ValueError('Missing end time')
                if datetime.fromisoformat(ended_at).utcoffset() is None:
                    raise ValueError('End time has no timezone')
            except (ValueError, OverflowError) as error:
                raise ValueError('Closed incomplete/failed stage requires timezone-aware ISO ended_at') from error


def rows_by_id(rows, label, fingerprints=False):
    if not isinstance(rows, list) or not rows:
        raise ValueError('Missing non-empty ' + label)
    result = {}
    for row in rows:
        if not isinstance(row, dict) or not valid_id(row.get('id')) or row['id'] in result:
            raise ValueError('Unsafe or duplicate identity in ' + label)
        if not valid_id(row.get('person')):
            raise ValueError('Missing role in ' + label + ': ' + row['id'])
        if fingerprints and not valid_sha(row.get('input_fingerprint')):
            raise ValueError('Missing valid input_fingerprint in ' + label + ': ' + row['id'])
        result[row['id']] = row
    return result


def current_items(plan):
    """A subset selector must never make other current catalogue IDs obsolete."""
    if 'available_items' in plan:
        current = rows_by_id(plan['available_items'], 'plan.available_items', True)
    else:
        current = rows_by_id(plan.get('catalogue'), 'plan.catalogue', True)
    if 'catalogue' in plan:
        catalogue = rows_by_id(plan['catalogue'], 'plan.catalogue')
        if set(catalogue) != set(current):
            raise ValueError('Plan lacks fingerprints for the full catalogue')
        for ident, row in catalogue.items():
            if row['person'] != current[ident]['person']:
                raise ValueError('Plan role differs between catalogue and available_items')
            if 'input_fingerprint' in row and row['input_fingerprint'] != current[ident]['input_fingerprint']:
                raise ValueError('Plan fingerprints disagree: ' + ident)
    if 'catalogue_count' in plan and plan['catalogue_count'] != len(current):
        raise ValueError('Plan catalogue_count differs from fingerprinted rows')
    return current


def audio_name(record, ident, field, suffix):
    name = record.get(field)
    # Production records use these exact basenames. Reject directories, URLs,
    # absolute paths and another ID's audio rather than normalizing them.
    if not isinstance(name, str) or name != ident + suffix:
        raise ValueError('Unsafe or mismatched ' + field + ': ' + ident)
    return name


def validate_record(ident, record, manifest, raw_only=False):
    if (not valid_id(ident) or not isinstance(record, dict)
            or record.get('id') != ident or not valid_id(record.get('person'))):
        raise ValueError('Unsafe or malformed old take: ' + str(ident))
    audio_name(record, ident, 'raw_wav', '.wav')
    for field in ('raw_sha256', 'input_fingerprint'):
        if not valid_sha(record.get(field)):
            raise ValueError('Missing expected ' + field + ': ' + ident)
    for field in ('mood', 'text', 'effective_text', 'reference_text'):
        if (raw_only and field in ('mood', 'text', 'reference_text')) or field in record:
            if not isinstance(record.get(field), str) or not record[field].strip():
                raise ValueError('Malformed raw metadata ' + field + ': ' + ident)
    for field in ('inference_fingerprint', 'reference_sha256', 'model_fingerprint'):
        if (raw_only and field != 'inference_fingerprint') or field in record:
            if not valid_sha(record.get(field)):
                raise ValueError('Malformed raw metadata ' + field + ': ' + ident)
    if raw_only and record.get('raw_validated') is not True:
        raise ValueError('RAW checkpoint lacks raw_validated: ' + ident)
    if 'duration_seconds' in record:
        duration = record['duration_seconds']
        if (isinstance(duration, bool) or not isinstance(duration, (int, float))
                or not math.isfinite(duration) or duration <= 0):
            raise ValueError('Malformed raw duration: ' + ident)
    for field in ('samples', 'sample_rate'):
        if field in record and (type(record[field]) is not int or record[field] <= 0):
            raise ValueError('Malformed raw ' + field + ': ' + ident)
    if all(field in record for field in ('samples', 'sample_rate', 'duration_seconds')):
        if not math.isclose(record['samples'] / record['sample_rate'], record['duration_seconds'],
                            rel_tol=0, abs_tol=1 / record['sample_rate']):
            raise ValueError('Raw sample count differs from duration: ' + ident)
    if 'finite' in record and record['finite'] is not True:
        raise ValueError('RAW checkpoint declares nonfinite samples: ' + ident)
    for field in ('rms', 'peak', 'batch_inference_seconds', 'conditioning_seconds',
                  'inference_seconds', 'rtf'):
        if field in record:
            number = record[field]
            if (isinstance(number, bool) or not isinstance(number, (int, float))
                    or not math.isfinite(number) or number < 0
                    or (field in ('rms', 'peak') and number == 0)):
                raise ValueError('Malformed raw ' + field + ': ' + ident)
    batch_fields = ('batch_id', 'batch_index', 'batch_seed', 'planned_token_cap')
    if any(field in record for field in batch_fields):
        if not valid_id(record.get('batch_id')):
            raise ValueError('Malformed raw batch identity: ' + ident)
        # Legacy full takes can carry only a batch ID. A RAW checkpoint needs
        # the complete inference context to be a coherent production record.
        for field in batch_fields[1:]:
            if raw_only or field in record:
                number = record.get(field)
                if type(number) is not int or number < (1 if field == 'planned_token_cap' else 0):
                    raise ValueError('Malformed raw ' + field + ': ' + ident)
                if field == 'batch_seed' and number >= 2 ** 32:
                    raise ValueError('Raw batch_seed exceeds uint32: ' + ident)
        if raw_only and not valid_sha(record.get('inference_fingerprint')):
            raise ValueError('Missing raw inference_fingerprint: ' + ident)
    for field in ('eos_observation', 'codec_observation'):
        if field in record:
            observation = record[field]
            if not isinstance(observation, dict):
                raise ValueError('Malformed raw ' + field + ': ' + ident)
            if 'batch_index' in observation:
                index = observation['batch_index']
                if type(index) is not int or index < 0 or index != record.get('batch_index'):
                    raise ValueError('Raw observation batch_index differs: ' + ident)
            if 'sha256' in observation and not valid_sha(observation['sha256']):
                raise ValueError('Malformed raw observation SHA: ' + ident)
    model = manifest.get('model')
    if 'model_fingerprint' in record and isinstance(model, dict):
        if model.get('fingerprint') != record['model_fingerprint']:
            raise ValueError('Raw model provenance differs from manifest: ' + ident)
    references = manifest.get('references')
    reference = references.get(record['person']) if isinstance(references, dict) else None
    if 'reference_sha256' in record and isinstance(references, dict) and not isinstance(reference, dict):
        raise ValueError('Missing raw role reference in manifest: ' + ident)
    if 'reference_sha256' in record and isinstance(reference, dict):
        if reference.get('sha256') != record['reference_sha256']:
            raise ValueError('Raw reference provenance differs from manifest: ' + ident)
        if 'ref_text' in reference and record.get('reference_text') != reference['ref_text']:
            raise ValueError('Raw reference text differs from manifest: ' + ident)
    if not raw_only:
        audio_name(record, ident, 'mp3', '.mp3')


def old_records(manifest):
    takes, raws = manifest.get('takes'), manifest.get('raw_takes', {})
    if not isinstance(takes, dict) or not isinstance(raws, dict):
        raise ValueError('Manifest must contain takes and raw_takes objects')
    records = {}
    for ident in sorted(set(takes) | set(raws), key=str):
        if ident in takes:
            validate_record(ident, takes[ident], manifest)
        if ident in raws:
            validate_record(ident, raws[ident], manifest, raw_only=True)
        if ident in takes and ident in raws:
            full, raw = takes[ident], raws[ident]
            # Full records inherit the inference metadata; only the encoded
            # processing description is expected to differ after mastering.
            fields = set(RAW_COHERENCE_FIELDS) | (set(raw) - {'processing'})
            for field in fields:
                if ((field in full) != (field in raw)
                        or full.get(field) != raw.get(field)):
                    raise ValueError('Conflicting full/RAW metadata ' + field + ': ' + ident)
        records[ident] = {'record': takes[ident] if ident in takes else raws[ident],
                          'storage_kind': 'full_take' if ident in takes else 'raw_only'}
    return records


def select_takes(manifest, plan):
    current = current_items(plan)
    selected = []
    for ident, old in old_records(manifest).items():
        record = old['record']
        fresh = current.get(ident)
        if fresh is None or record.get('input_fingerprint') != fresh['input_fingerprint']:
            selected.append({'id': ident, 'record': record, 'current': fresh,
                             'storage_kind': old['storage_kind'],
                             'classification': 'obsolete' if fresh is None else 'current_stale'})
    return selected


def provenance(value):
    model = value.get('model') if isinstance(value.get('model'), dict) else {}
    refs = value.get('references') if isinstance(value.get('references'), dict) else {}
    return {'model': {key: model.get(key) for key in ('repository', 'revision', 'fingerprint')},
            'reference_pack_sha256': value.get('reference_pack_sha256'),
            'reference_audio_sha256': {role: ref.get('sha256') for role, ref in refs.items()
                                      if isinstance(ref, dict)},
            'catalogue_sha256': value.get('catalogue_sha256'),
            'retry_seed_file_sha256': value.get('retry_seed_file_sha256'),
            'retry_seeds': value.get('retry_seeds', {})}


def asr_sources(stage):
    result = []
    for path in sorted(stage.glob('*.json')):
        if path.name == 'manifest.json':
            continue
        named = any(marker in path.name.lower() for marker in ('asr', 'transcript'))
        source = read_source(path)
        try:
            payload = read_json(source['data'], path.name)
        except ValueError:
            if named:
                raise
            continue
        recognized = isinstance(payload.get('items'), dict) and 'model_sha256' in payload
        if named or recognized:
            result.append(source)
    return result


def group_ids(entries, field):
    groups = {}
    for entry in entries:
        value = entry.get(field)
        if value is not None:
            groups.setdefault(value, []).append(entry['id'])
    return dict(sorted(groups.items()))


def cohort_members(value, records, affected):
    """Show complete known cohorts, including members that need no archive."""
    rows = value.get('items', [])
    if not isinstance(rows, list):
        raise ValueError('Malformed old manifest.items')
    known = {}
    for row in rows:
        if (not isinstance(row, dict) or not valid_id(row.get('id'))
                or row['id'] in known or not valid_id(row.get('person'))):
            raise ValueError('Unsafe or duplicate old cohort member')
        known[row['id']] = row
    for ident, old in records.items():
        record = old['record']
        row = known.get(ident)
        if row is not None:
            for field in ('person', 'mood', 'text', 'effective_text',
                          'input_fingerprint', 'inference_fingerprint',
                          'batch_id', 'batch_index', 'batch_seed', 'planned_token_cap'):
                if field in row and row[field] != record.get(field):
                    raise ValueError('Raw cohort metadata differs from manifest.items ' + field + ': ' + ident)
        else:
            known[ident] = record
    groups = {}
    for ident, row in known.items():
        batch_id = row.get('batch_id')
        if batch_id is not None and not valid_id(batch_id):
            raise ValueError('Malformed cohort batch identity: ' + ident)
        if batch_id in affected:
            groups.setdefault(batch_id, []).append(row)
    return {batch_id: [row['id'] for row in sorted(rows, key=lambda row: (
                row.get('batch_index') if type(row.get('batch_index')) is int else sys.maxsize,
                row['id']))]
            for batch_id, rows in sorted(groups.items())}


def write_copy(source, destination):
    with destination.open('xb') as stream:
        stream.write(source['data'])
    copied = read_source(destination)
    if copied['sha256'] != source['sha256'] or copied['bytes'] != source['bytes']:
        raise ValueError('Archive copy differs: ' + str(destination))
    if copied['signature'][:2] == source['signature'][:2]:
        raise ValueError('Archive must contain independent copies, not hard links')


def archive(stage, plan_file, output):
    stage, plan_file, output = (Path(path).resolve() for path in (stage, plan_file, output))
    if not stage.is_dir():
        raise ValueError('Stage directory does not exist')
    if output.is_relative_to(stage) or stage.is_relative_to(output):
        raise ValueError('Archive output must be separate from the live stage')
    assert_closed(stage)
    manifest_source, plan_source = read_source(stage / 'manifest.json'), read_source(plan_file)
    manifest = read_json(manifest_source['data'], 'manifest.json')
    plan = read_json(plan_source['data'], 'plan')
    assert_closed(stage, manifest)
    selected = select_takes(manifest, plan)
    sources = {'manifest.json': manifest_source, 'plan.json': plan_source}
    asr = asr_sources(stage)
    for source in asr:
        if source['path'].name in sources or source['path'].name == 'archive-report.json':
            raise ValueError('Conflicting ASR archive name')
        sources[source['path'].name] = source
    entries = []
    for selection in selected:
        ident, record, fresh = selection['id'], selection['record'], selection['current']
        entry = {'id': ident, 'person': record['person'], 'classification': selection['classification'],
                 'storage_kind': selection['storage_kind'],
                 'old_input_fingerprint': record.get('input_fingerprint'),
                 'current_input_fingerprint': fresh['input_fingerprint'] if fresh else None,
                 'old_batch_id': record.get('batch_id'), 'current_batch_id': fresh.get('batch_id') if fresh else None,
                 'files': {}}
        audio_fields = [('raw_wav', '.wav', 'raw_sha256')]
        if selection['storage_kind'] == 'full_take':
            audio_fields.append(('mp3', '.mp3', 'sha256'))
        for field, suffix, hash_field in audio_fields:
            name = audio_name(record, ident, field, suffix)
            expected = record.get(hash_field)
            if not valid_sha(expected):
                raise ValueError('Missing expected ' + hash_field + ': ' + ident)
            source = read_source(stage / name)
            if source['sha256'] != expected:
                raise ValueError('Old audio SHA256 mismatch: ' + name)
            sources[name] = source
            entry['files'][field] = {'path': name, 'sha256': expected, 'bytes': source['bytes']}
        entries.append(entry)
    report = {'schema': 2, 'kind': 'obsolete-qwen-takes', 'source_stage': str(stage),
              'source_status': manifest['status'], 'source_manifest_sha256': manifest_source['sha256'],
              'fresh_plan_sha256': plan_source['sha256'], 'current_count': len(current_items(plan)),
              'current_stale': [e['id'] for e in entries if e['classification'] == 'current_stale'],
              'obsolete': [e['id'] for e in entries if e['classification'] == 'obsolete'],
              'archived_count': len(entries),
              'archived_take_count': sum(e['storage_kind'] == 'full_take' for e in entries),
              'raw_only_count': sum(e['storage_kind'] == 'raw_only' for e in entries),
              'roles': group_ids(entries, 'person'),
              'batches': {'old': group_ids(entries, 'old_batch_id'), 'current': group_ids(entries, 'current_batch_id')},
              'cohorts': {
                  'old': cohort_members(manifest, old_records(manifest),
                                        {e['old_batch_id'] for e in entries if e['old_batch_id'] is not None}),
                  'current': cohort_members({'items': list(current_items(plan).values())}, {},
                                            {e['current_batch_id'] for e in entries if e['current_batch_id'] is not None}),
              },
              'old_provenance': provenance(manifest), 'current_provenance': provenance(plan),
              'asr_files': [s['path'].name for s in asr], 'takes': entries,
              'files': {name: {'sha256': source['sha256'], 'bytes': source['bytes']}
                        for name, source in sorted(sources.items())},
              'human_listening': False,
              'validation_scope': 'Fingerprint selection and byte integrity; no audio decode, ASR or inference.'}
    report_data = (json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2) + '\n').encode()

    def check_sources():
        assert_closed(stage, manifest)
        for source in sources.values():
            assert_unchanged(source)
        if [s['path'].name for s in asr_sources(stage)] != report['asr_files']:
            raise ValueError('ASR report set changed during archive')
        assert_closed(stage)

    if output.exists():
        if not output.is_dir() or output.is_symlink():
            raise ValueError('Existing archive is not a regular directory')
        expected_names = set(sources) | {'archive-report.json'}
        if {path.name for path in output.iterdir()} != expected_names:
            raise ValueError('Existing immutable archive has a different file set')
        for name, source in sources.items():
            archived = read_source(output / name)
            if archived['sha256'] != source['sha256']:
                raise ValueError('Existing immutable archive differs: ' + name)
            if archived['signature'][:2] == source['signature'][:2]:
                raise ValueError('Existing archive contains a hard link: ' + name)
        if read_source(output / 'archive-report.json')['data'] != report_data:
            raise ValueError('Existing immutable archive report differs')
        check_sources()
        return report

    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.' + output.name + '-', dir=output.parent) as temporary:
        staged = Path(temporary) / 'snapshot'
        staged.mkdir()
        for name, source in sources.items():
            write_copy(source, staged / name)
        (staged / 'archive-report.json').write_bytes(report_data)
        check_sources()
        if output.exists() or output.is_symlink():
            raise ValueError('Archive output appeared during copying')
        staged.rename(output)
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    for name in ('stage', 'plan', 'output'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args(argv)
    report = archive(args.stage, args.plan, args.output)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError) as error:
        print('Qwen archive error: ' + str(error), file=sys.stderr)
        raise SystemExit(1)
