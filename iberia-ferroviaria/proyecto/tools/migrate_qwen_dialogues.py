"""Audit and copy compatible continuous takes into a new, empty stage.

Default CLI operation is read-only. It compares a fresh approved whole plan,
uses the production validators unchanged, and never invokes a neural model.
--apply copies bytes to a temporary sibling and renames only after verification.
The old stage and all original record payloads remain unchanged.
"""
import argparse
import copy
import ctypes
import hashlib
import json
import os
from pathlib import Path
import shutil
import tempfile

import build_qwen_dialogues as backend


def digest_bytes(value):
    return hashlib.sha256(value).hexdigest()


def record_bytes(record):
    return json.dumps(record, ensure_ascii=False, separators=(',', ':')).encode('utf8')


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf8'))


def require_full_plan(plan):
    expected_count = sum(backend.SOURCE_COUNTS.values())
    rows = plan.get('items', [])
    if (plan.get('generation_unit') != 'one complete dialogue body per native uninterrupted take'
            or plan.get('selected_count') != expected_count or len(rows) != expected_count
            or rows != plan.get('available_items') or rows != plan.get('catalogue')
            or len({row['id'] for row in rows}) != expected_count
            or len(plan.get('references', {})) != 9
            or plan.get('missing_roles')
            or {batch['id']: batch for batch in plan.get('batches', [])}
               != {batch['id']: batch for batch in plan.get('all_batches', [])}):
        raise ValueError('Migration requires the complete unselected whole-dialogue plan')
    by_id = {row['id']: row for row in rows}
    seen = []
    batches = plan['all_batches']
    if len({batch['id'] for batch in batches}) != len(batches):
        raise ValueError('Whole-plan batch IDs must be unique and stable')
    for batch in batches:
        for index, row in enumerate(batch['items']):
            if (row != by_id.get(row['id']) or row['batch_id'] != batch['id']
                    or row['batch_index'] != index or row['batch_seed'] != batch['seed']
                    or row['planned_token_cap'] != batch['max_new_tokens']):
                raise ValueError('Whole-plan batch identity, index, seed or token cap is inconsistent')
            seen.append(row['id'])
    if sorted(seen) != sorted(by_id):
        raise ValueError('Whole-plan batches must cover each complete body exactly once')


def fresh_reviewed_plan(plan):
    """Rebuild the CLI input with current live bodies and approved physical pins."""
    require_full_plan(plan)
    precision = 'mixed-bf16-talker' if plan['inference_parameters']['dtype'] == 'mixed' else 'fp32'
    args = ['--model', plan['model']['directory'], '--references', plan['reference_pack_file'],
            '--catalogue', plan['catalogue_file'], '--output', plan['output'],
            '--asset', plan['asset'], '--batch-size', str(plan['parameters']['batch_size']),
            '--precision', precision, '--dry-run']
    if plan.get('retry_seed_file'):
        args += ['--retry-seeds-file', plan['retry_seed_file']]
    fresh = backend.build_plan(backend.parse_args(args))
    if fresh != plan:
        raise ValueError('Saved new plan differs from the current approved live complete plan')
    return fresh


def destination_paths(old_stage, plan):
    old_stage = Path(old_stage).resolve()
    target = Path(plan['output']).resolve()
    if old_stage == target or old_stage in target.parents or target in old_stage.parents:
        raise ValueError('New stage must be separate from the original stage and its ancestors')
    if target.exists() or target.is_symlink():
        raise ValueError('New stage already exists; migration never overwrites a stage')
    return old_stage, target


def commit_new_directory(source, target):
    """Linux atomic rename with NOREPLACE; even an empty destination is protected."""
    libc = ctypes.CDLL(None, use_errno=True)
    rename = getattr(libc, 'renameat2', None)
    if rename is None:
        raise ValueError('Atomic no-overwrite directory publication is unavailable')
    rename.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
    rename.restype = ctypes.c_int
    if rename(-100, os.fsencode(source), -100, os.fsencode(target), 1) != 0:
        error = ctypes.get_errno()
        raise OSError(error, os.strerror(error), str(target))


def original_sources(manifest, archive=None):
    """Locate exact source bytes; accept a frozen archive after a reviewed update."""
    result = {}
    for source, expected in manifest.get('source_sha256', {}).items():
        candidates = [Path(source)]
        if archive:
            candidates.insert(0, Path(archive) / Path(source).name)
        actual = next((path for path in candidates if path.is_file()
                       and digest_bytes(path.read_bytes()) == expected), None)
        if actual is None:
            raise ValueError('Exact original producer source unavailable: ' + source)
        if Path(source).name in result:
            raise ValueError('Original source filenames collide')
        result[Path(source).name] = {'path': str(actual), 'recorded_path': source, 'sha256': expected}
    if not result:
        raise ValueError('Original stage has no generation source provenance')
    return result


def compatible_conditioning(old_plan, new_plan, manifest):
    if new_plan['inference_parameters'].get('dtype') != 'mixed':
        return {}
    result = {}
    for person, ref in new_plan['references'].items():
        old_ref = old_plan['references'].get(person)
        conditioning = manifest.get('conditioning', {}).get(person)
        if (old_ref is None or old_ref['sha256'] != ref['sha256']
                or old_ref['ref_text'] != ref['ref_text'] or not isinstance(conditioning, dict)):
            continue
        item = next(row for row in new_plan['items'] if row['person'] == person)
        record = {'conditioning_identity_sha256': conditioning.get('identity_sha256')}
        if backend.valid_record_conditioning(item, new_plan, manifest, record):
            result[person] = copy.deepcopy(conditioning)
    return result


def mismatch_reason(old_item, new_item, old_plan, new_plan):
    if new_item is None:
        return ['body_id_absent_in_new_plan']
    fields = ('person', 'mood', 'raw', 'text', 'effective_text', 'canonical_sha256', 'speech_sha256',
              'source', 'kind', 'batch_id', 'batch_index', 'batch_seed', 'planned_token_cap',
              'inference_fingerprint', 'input_fingerprint')
    changed = [field for field in fields if old_item.get(field) != new_item.get(field)]
    person = new_item['person']
    for field in ('sha256', 'ref_text'):
        if old_plan['references'][person][field] != new_plan['references'][person][field]:
            changed.append('reference_' + field)
    for field in ('model', 'inference_parameters', 'mastering'):
        if old_plan[field] != new_plan[field]:
            changed.append(field)
    return changed


def validate_present_batch_traces(plan, manifest):
    """A resumed manifest legitimately omits earlier traces; validate every present one."""
    traces = manifest.get('batches', {})
    if not isinstance(traces, dict):
        raise ValueError('Original batch traces are malformed')
    batches = {batch['id']: batch for batch in plan['all_batches']}
    for ident, trace in traces.items():
        expected = batches.get(ident)
        if (expected is None or not isinstance(trace, dict) or trace.get('id') != ident
                or trace.get('clips') != [row['id'] for row in expected['items']]
                or trace.get('seed') != expected['seed']
                or trace.get('max_new_tokens') != expected['max_new_tokens']
                or trace.get('precision') != plan.get('precision')):
            raise ValueError('Original present batch trace differs from its stable plan: ' + ident)
        eos, codec = trace.get('eos_observations'), trace.get('codec_observations')
        if not isinstance(eos, list) or not isinstance(codec, list) or len(eos) != len(expected['items']) or len(codec) != len(expected['items']):
            raise ValueError('Original present batch trace observation count differs: ' + ident)
        for index, row in enumerate(expected['items']):
            if (not isinstance(eos[index], dict) or not isinstance(codec[index], dict)
                    or eos[index].get('batch_index') != index or codec[index].get('batch_index') != index
                    or eos[index].get('max_new_tokens') != expected['max_new_tokens']):
                raise ValueError('Original present batch trace observation index or cap differs: ' + ident)
            raw = manifest.get('raw_takes', {}).get(row['id'])
            if raw is not None and (raw.get('eos_observation') != eos[index] or raw.get('codec_observation') != codec[index]):
                raise ValueError('Original present batch trace disagrees with registered native RAW: ' + row['id'])


def audit_migration(old_stage, old_plan, new_plan, source_archive=None):
    require_full_plan(old_plan)
    require_full_plan(new_plan)
    old_stage, target = destination_paths(old_stage, new_plan)
    if Path(old_plan['output']).resolve() != old_stage:
        raise ValueError('Original plan does not belong to the original stage')
    if (old_stage / '.qwen-auditions.lock').exists():
        raise ValueError('Original stage is locked or generating')
    manifest_bytes = (old_stage / 'manifest.json').read_bytes()
    manifest = json.loads(manifest_bytes)
    if (manifest.get('status') not in {'complete', 'failed'} or not manifest.get('ended_at')
            or (manifest['status'] == 'failed' and manifest.get('error_type') != 'KeyboardInterrupt')
            or manifest.get('failures')):
        raise ValueError('Original stage must be closed with a clean complete or safe checkpoint state')
    for field in ('model', 'parameters', 'references', 'reference_pack_sha256', 'catalogue_sha256'):
        if manifest.get(field) != old_plan[field]:
            raise ValueError('Original stage profile differs from original plan: ' + field)
    if (manifest.get('items') != old_plan['available_items']
            or manifest.get('run', {}).get('items') != old_plan['items']
            or manifest.get('run', {}).get('model') != old_plan['model']
            or manifest.get('run', {}).get('parameters') != old_plan['parameters']):
        raise ValueError('Original stage item catalogue or run differs from original plan')
    validate_present_batch_traces(old_plan, manifest)
    if old_plan['inference_parameters'] != new_plan['inference_parameters']:
        raise ValueError('Migration preserves the approved inference parameters and precision')
    if old_plan['inference_parameters'].get('dtype') == 'mixed':
        backend.mixed.require_precision(old_plan)
        backend.mixed.require_precision(new_plan)
        if manifest.get('precision') != backend.mixed.PRECISION:
            raise ValueError('Original precision descriptor is missing or changed')
        backend.mixed.assert_precision(manifest.get('execution_before_conversion', {}), converted=False)
        backend.mixed.assert_precision(manifest.get('actual_execution', {}), converted=True)
    sources = original_sources(manifest, source_archive)
    for person, ref in old_plan['references'].items():
        if not Path(ref['ref_audio']).is_file() or backend.core.digest(ref['ref_audio']) != ref['sha256']:
            raise ValueError('Original physical reference is missing or changed: ' + person)
    old_items = {row['id']: row for row in old_plan['items']}
    new_items = {row['id']: row for row in new_plan['items']}
    raw_records, encoded_records, excluded, records = {}, {}, {}, {}
    if (not isinstance(manifest.get('raw_takes'), dict) or not isinstance(manifest.get('takes'), dict)
            or set(manifest['raw_takes']) - set(old_items)
            or set(manifest['takes']) - set(manifest['raw_takes'])):
        raise ValueError('Original registered records have unexpected IDs or missing native RAW')
    old_verify = {**old_plan, 'output': str(old_stage)}
    new_verify = {**new_plan, 'output': str(old_stage)}
    for ident, raw in manifest['raw_takes'].items():
        old_item = old_items[ident]
        if not backend.valid_continuous_raw(old_item, old_verify, manifest):
            raise ValueError('Corrupt or invalid original native RAW: ' + ident)
        take = manifest['takes'].get(ident)
        if take is not None and not backend.valid_continuous_take(old_item, old_verify, manifest):
            raise ValueError('Corrupt or invalid original encoded take: ' + ident)
        new_item = new_items.get(ident)
        reasons = mismatch_reason(old_item, new_item, old_plan, new_plan)
        if reasons:
            excluded[ident] = reasons
            continue
        if not backend.valid_continuous_raw(new_item, new_verify, manifest):
            excluded[ident] = ['current_metadata_conditioning_or_physical_gate_failed']
            continue
        raw_records[ident] = copy.deepcopy(raw)
        if take is not None:
            if not backend.valid_continuous_take(new_item, new_verify, manifest):
                raise ValueError('A matching encoded record fails current validation: ' + ident)
            encoded_records[ident] = copy.deepcopy(take)
        records[ident] = {'person': raw['person'], 'raw_record_payload_sha256': digest_bytes(record_bytes(raw)),
                          'encoded_record_payload_sha256': digest_bytes(record_bytes(take)) if take else None,
                          'raw_sha256': raw['raw_sha256'], 'mp3_sha256': take['sha256'] if take else None,
                          'inference_fingerprint': raw['inference_fingerprint'],
                          'input_fingerprint': raw['input_fingerprint'], 'batch_id': raw['batch_id'],
                          'batch_index': raw['batch_index'], 'batch_seed': raw['batch_seed'],
                          'planned_token_cap': raw['planned_token_cap']}
    conditioning = compatible_conditioning(old_plan, new_plan, manifest)
    if new_plan['inference_parameters'].get('dtype') == 'mixed':
        if any(record['person'] not in conditioning for record in raw_records.values()):
            raise ValueError('An inherited take lacks its unchanged original conditioning')
    if (old_stage / 'manifest.json').read_bytes() != manifest_bytes or (old_stage / '.qwen-auditions.lock').exists():
        raise ValueError('Original stage changed during migration audit')
    report = {'schema': 1, 'checked_utc': backend.core.utc(), 'status': 'audited-not-applied', 'old_stage': str(old_stage), 'new_stage': str(target),
              'original_manifest_sha256': digest_bytes(manifest_bytes), 'original_source_sha256': manifest['source_sha256'],
              'original_sources': sources, 'original_catalogue_sha256': old_plan['catalogue_sha256'],
              'new_catalogue_sha256': new_plan['catalogue_sha256'],
              'original_reference_pack_sha256': old_plan['reference_pack_sha256'],
              'new_reference_pack_sha256': new_plan['reference_pack_sha256'],
              'old_plan_payload_sha256': digest_bytes(record_bytes(old_plan)),
              'new_plan_payload_sha256': digest_bytes(record_bytes(new_plan)),
              'eligible_raw_count': len(raw_records), 'eligible_encoded_count': len(encoded_records),
              'encode_only_ids': sorted(set(raw_records) - set(encoded_records)),
              'retained_conditioning_people': sorted(conditioning), 'excluded_records': excluded,
              'present_batch_traces_validated': len(manifest.get('batches', {})),
              'records': records, 'old_stage_changed': False, 'record_payloads_changed': False,
              'asset_changed': False, 'neural_models_loaded': False,
              'origin_scope': 'Original manifest and source bytes are archived; every inherited audio byte, record payload, fingerprint, batch identity and seed is retained. The old source remains its origin.'}
    return report, manifest_bytes, raw_records, encoded_records, conditioning


def apply_migration(old_stage, old_plan, new_plan, source_archive=None, old_plan_bytes=None, new_plan_bytes=None):
    report, manifest_bytes, raw_records, takes, conditioning = audit_migration(old_stage, old_plan, new_plan, source_archive)
    old_stage, target = destination_paths(old_stage, new_plan)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix='.' + target.name + '-migration-', dir=target.parent))
    try:
        origin = temporary / 'migration-origin'
        origin.mkdir()
        (origin / 'manifest.original.json').write_bytes(manifest_bytes)
        old_plan_bytes = old_plan_bytes if old_plan_bytes is not None else record_bytes(old_plan)
        new_plan_bytes = new_plan_bytes if new_plan_bytes is not None else record_bytes(new_plan)
        if json.loads(old_plan_bytes) != old_plan or json.loads(new_plan_bytes) != new_plan:
            raise ValueError('Original or reviewed plan snapshot bytes do not match their audited payload')
        (origin / 'plan.original.json').write_bytes(old_plan_bytes)
        (origin / 'plan.reviewed-new.json').write_bytes(new_plan_bytes)
        report['original_plan_snapshot_sha256'] = digest_bytes(old_plan_bytes)
        report['new_plan_snapshot_sha256'] = digest_bytes(new_plan_bytes)
        for name, source in report['original_sources'].items():
            shutil.copyfile(source['path'], origin / name)
            if backend.core.digest(origin / name) != source['sha256']:
                raise ValueError('Original producer source changed before archival: ' + name)
        for ident, raw in raw_records.items():
            shutil.copyfile(old_stage / (ident + '.wav'), temporary / (ident + '.wav'))
            if ident in takes:
                shutil.copyfile(old_stage / (ident + '.mp3'), temporary / (ident + '.mp3'))
        manifest = {'schema': 1, 'provider': new_plan['provider'], 'status': 'migration-preflight',
                    'generation_unit': new_plan['generation_unit'], 'items': new_plan['available_items'],
                    'run': {'items': new_plan['items'], 'model': new_plan['model'], 'parameters': new_plan['parameters']},
                    'catalogue_sha256': new_plan['catalogue_sha256'], 'reference_pack_sha256': new_plan['reference_pack_sha256'],
                    'model': new_plan['model'], 'parameters': new_plan['parameters'], 'references': new_plan['references'],
                    'retry_seeds': new_plan.get('retry_seeds', {}), 'retry_seed_file': new_plan.get('retry_seed_file'),
                    'retry_seed_file_sha256': new_plan.get('retry_seed_file_sha256'), 'missing_roles': [],
                    'raw_takes': raw_records, 'takes': takes, 'conditioning': conditioning, 'failures': {}, 'batches': {},
                    'human_listening': False, 'migration_origin': 'migration.json',
                    'source_sha256': json.loads(manifest_bytes)['source_sha256']}
        if new_plan['inference_parameters'].get('dtype') == 'mixed':
            manifest['precision'] = copy.deepcopy(backend.mixed.PRECISION)
            original_manifest = json.loads(manifest_bytes)
            for key in ('execution_before_conversion', 'actual_execution'):
                manifest[key] = copy.deepcopy(original_manifest[key])
        backend.core.atomic_json(temporary / 'manifest.json', manifest)
        parsed = read_json(temporary / 'manifest.json')
        verification_plan = {**new_plan, 'output': str(temporary)}
        rows = {row['id']: row for row in new_plan['items']}
        for ident, raw in raw_records.items():
            if record_bytes(parsed['raw_takes'][ident]) != record_bytes(raw):
                raise ValueError('Native record payload changed during serialization: ' + ident)
            if not backend.valid_continuous_raw(rows[ident], verification_plan, parsed):
                raise ValueError('Copied native RAW failed current production validator: ' + ident)
            if ident in takes:
                if record_bytes(parsed['takes'][ident]) != record_bytes(takes[ident]):
                    raise ValueError('Encoded record payload changed during serialization: ' + ident)
                if not backend.valid_continuous_take(rows[ident], verification_plan, parsed):
                    raise ValueError('Copied MP3 failed current production validator: ' + ident)
        if (old_stage / 'manifest.json').read_bytes() != manifest_bytes or (old_stage / '.qwen-auditions.lock').exists():
            raise ValueError('Original stage changed before migration commit')
        report['status'] = 'applied-verified-awaiting-explicit-generation'
        backend.core.atomic_json(temporary / 'migration.json', report)
        if target.exists() or target.is_symlink():
            raise ValueError('Destination appeared during migration; refusing overwrite')
        commit_new_directory(temporary, target)
        return report
    except BaseException:
        shutil.rmtree(temporary)
        raise


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--old-stage', required=True, type=Path)
    parser.add_argument('--old-plan', required=True, type=Path)
    parser.add_argument('--new-plan', required=True, type=Path)
    parser.add_argument('--origin-sources', type=Path)
    parser.add_argument('--report', required=True, type=Path)
    parser.add_argument('--apply', action='store_true', help='Explicitly copy compatible records into the new empty stage')
    args = parser.parse_args(argv)
    old_plan_bytes, new_plan_bytes = args.old_plan.read_bytes(), args.new_plan.read_bytes()
    old_plan = json.loads(old_plan_bytes)
    new_plan = fresh_reviewed_plan(json.loads(new_plan_bytes))
    report_path = args.report.resolve()
    protected = [args.old_stage.resolve(), Path(new_plan['output']).resolve(), backend.core.PROJECT / 'dist']
    if args.origin_sources:
        protected.append(args.origin_sources.resolve())
    if (args.report.exists() or args.report.is_symlink()
            or report_path in {args.old_plan.resolve(), args.new_plan.resolve(), Path(new_plan['asset']).resolve()}
            or any(report_path == path or path in report_path.parents for path in protected)):
        raise ValueError('Report must be a new file outside original stage, new stage, assets and inputs')
    if args.apply:
        report = apply_migration(args.old_stage, old_plan, new_plan, args.origin_sources,
                                 old_plan_bytes=old_plan_bytes, new_plan_bytes=new_plan_bytes)
    else:
        report = audit_migration(args.old_stage, old_plan, new_plan, args.origin_sources)[0]
    report['old_plan_file_sha256'] = backend.core.digest(args.old_plan)
    report['new_plan_file_sha256'] = backend.core.digest(args.new_plan)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open('x', encoding='utf8') as target:
        target.write(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ('status', 'eligible_raw_count', 'eligible_encoded_count',
                                                   'encode_only_ids', 'retained_conditioning_people')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
