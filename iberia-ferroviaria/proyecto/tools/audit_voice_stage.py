"""Audit current staged dialogue identities, audio hashes and ASR coverage.

No model is loaded and no audio, manifest or game asset is changed. Results are
evidence for review, never an assertion that a voice sounds natural or faithful.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import re

from build_qwen_voices import spoken_costs, words as catalogue_words
from check_voice_transcripts import ANALYSIS_VERSION, atomic_json, digest


def effective_text_preserves_content(canonical, effective):
    """Allow acting punctuation and only the provider's two cost spellings.

    A take may retain the original numerals or use the exact spoken-cost
    variant. Plan fingerprints separately determine whether it is reusable.
    ASR's broad cardinal normalization is unsuitable for this integrity check.
    Decimal separators are content, even though ordinary punctuation is not.
    """
    actual_words = catalogue_words(effective)
    actual_decimals = re.findall(r'\d+(?:[.,]\d+)+', effective)
    return any(actual_words == catalogue_words(expected)
               and actual_decimals == re.findall(r'\d+(?:[.,]\d+)+', expected)
               for expected in (canonical, spoken_costs(canonical)))


def audit(folder, catalogue, manifest, transcripts):
    if not isinstance(catalogue, list) or not catalogue:
        raise ValueError('The full catalogue must be a non-empty list.')
    expected = {}
    for row in catalogue:
        ident = row.get('id')
        if not isinstance(ident, str) or not re.fullmatch(r'[A-Za-z0-9_-]+', ident) or ident in expected:
            raise ValueError('Unsafe or duplicate catalogue identifier: ' + str(ident))
        expected[ident] = row
    takes, qa = manifest.get('takes', {}), transcripts.get('items', {})
    rows, role_counts, priority_counts = {}, Counter(), Counter()
    for ident, script in expected.items():
        take, inspected = takes.get(ident, {}), qa.get(ident, {})
        path = folder / (ident + '.mp3')
        issues = []
        actual_sha = digest(path) if path.is_file() else None
        hash_matches = bool(actual_sha and actual_sha == take.get('sha256'))
        if not take:
            issues.append('missing_generation_record')
        if actual_sha is None:
            issues.append('missing_mp3')
        elif not hash_matches:
            issues.append('mp3_sha256_mismatch')
        for field in ('person', 'mood', 'text'):
            if take and take.get(field) != script.get(field):
                issues.append('catalogue_' + field + '_mismatch')
        if take and not effective_text_preserves_content(
                script.get('text', ''), take.get('effective_text', take.get('text', ''))):
            issues.append('effective_text_words_changed')
        reference = manifest.get('references', {}).get(script.get('person'), {})
        if take and reference and take.get('reference_sha256') != reference.get('sha256'):
            issues.append('reference_sha256_mismatch')
        current_qa = bool(hash_matches and inspected.get('sha256') == actual_sha
                          and inspected.get('expected') == script.get('text')
                          and inspected.get('model_sha256') == transcripts.get('model_sha256')
                          and inspected.get('analysis_version') == ANALYSIS_VERSION)
        if not current_qa:
            issues.append('missing_or_stale_asr_inspection')
        integrity = hash_matches and not any(issue.startswith(('catalogue_', 'effective_', 'reference_')) for issue in issues)
        if integrity:
            role_counts[script.get('person')] += 1
            priority_counts[str(script.get('priority', 5))] += 1
        rows[ident] = {'id': ident, 'person': script.get('person'), 'mood': script.get('mood'),
                       'priority': script.get('priority', 5), 'sha256': actual_sha,
                       'manifest_sha256': take.get('sha256'), 'integrity_matches_current_catalogue': integrity,
                       'signal_validation_reported': take.get('validated') is True,
                       'current_asr_inspection': current_qa, 'issues': issues,
                       'critical_text_notices': inspected.get('critical_text_notices', []) if current_qa else [],
                       'repetition_notices': inspected.get('repetition_notices', []) if current_qa else [],
                       'unresolved_differences': inspected.get('unresolved_differences', []) if current_qa else [],
                       'closing_words_check': inspected.get('closing_words_check') if current_qa else None}
    unknown = sorted(set(takes) - set(expected))
    missing_critical = [ident for ident, row in rows.items()
                        if row['priority'] <= 1 and not row['current_asr_inspection']]
    integrity_count = sum(row['integrity_matches_current_catalogue'] for row in rows.values())
    inspected_count = sum(row['current_asr_inspection'] for row in rows.values())
    review_ids = [ident for ident, row in rows.items() if row['current_asr_inspection']
                  and (row['critical_text_notices'] or row['repetition_notices']
                       or (row['closing_words_check'] or {}).get('status') == 'asr_mismatch_requires_review')]
    return {'schema': 1, 'human_listening': False,
            'purpose': 'Current catalogue/hash/ASR coverage evidence; no automatic acceptance or publication.',
            'summary': {'catalogue_count': len(expected), 'manifest_takes': len(takes),
                        'integrity_matches_current_catalogue': integrity_count,
                        'current_asr_inspections': inspected_count,
                        'signal_validation_reported': sum(row['signal_validation_reported'] for row in rows.values()),
                        'all_catalogue_audio_hashes_match': integrity_count == len(expected),
                        'all_catalogue_asr_inspections_current': inspected_count == len(expected),
                        'by_person': dict(role_counts), 'by_priority': dict(priority_counts),
                        'intro_tutorial_pending_asr': missing_critical,
                        'asr_listening_review_ids': review_ids, 'unknown_generation_ids': unknown},
            'items': rows}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder', type=Path)
    parser.add_argument('--catalogue', required=True, type=Path)
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--transcripts', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args(argv)
    manifest_path = args.manifest or args.folder / 'manifest.json'
    transcript_path = args.transcripts or args.folder / 'transcript-qa-base.json'
    output_path = args.output or args.folder / 'integrity-asr-audit.json'
    if output_path.resolve() in {manifest_path.resolve(), transcript_path.resolve(), args.catalogue.resolve()}:
        parser.error('The audit report cannot replace an input file.')
    catalogue = json.loads(args.catalogue.read_text(encoding='utf-8'))
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    transcripts = json.loads(transcript_path.read_text(encoding='utf-8')) if transcript_path.exists() else {}
    report = audit(args.folder, catalogue, manifest, transcripts)
    report.update(catalogue_sha256=digest(args.catalogue), manifest_sha256=digest(manifest_path),
                  transcript_report_sha256=digest(transcript_path) if transcript_path.exists() else None)
    atomic_json(output_path, report)
    print(json.dumps(report['summary'], ensure_ascii=False), flush=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
