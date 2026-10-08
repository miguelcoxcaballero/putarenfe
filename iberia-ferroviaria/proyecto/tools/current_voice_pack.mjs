// Every new preview uses the current source pack, including Paco's actual
// Torrente reference. An environment stage override cannot select an old voice.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const CURRENT_REFERENCE_PACK_SHA256 = '46ba5d81fc8a6f657f5f1cdab3951a39956bfd86a7fcc0798006ea8fa9c470bd';
export const ACCEPTED_TORRENTE_SHA256 = '26667538b41ee7e1f4ba65e4867aaf28278ce9d54fdd72bd323768268f8c8964';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export function validateProductionReferenceWAV(bytes, prompt, person) {
  assert(Buffer.isBuffer(bytes) && bytes.length >= 12, person + ': physical WAV bytes');
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  const end = bytes.readUInt32LE(4) + 8;
  assert(end <= bytes.length && end >= 12, 'complete RIFF container');
  let format, dataSize;
  for (let offset = 12; offset + 8 <= end;) {
    const name = bytes.toString('ascii', offset, offset + 4), size = bytes.readUInt32LE(offset + 4);
    assert(offset + 8 + size <= end, 'complete WAV chunk');
    if (name === 'fmt ') { assert(!format && size >= 16); format = bytes.subarray(offset + 8, offset + 8 + size); }
    if (name === 'data') { assert.equal(dataSize, undefined); dataSize = size; }
    offset += 8 + size + (size % 2);
  }
  assert(format && Number.isInteger(dataSize), 'WAV format and audio data are present');
  assert.equal(format.readUInt16LE(0), 1, person + ': production reference must be PCM16, not FLOAT');
  assert.equal(format.readUInt16LE(2), 1, 'mono production reference');
  assert.equal(format.readUInt32LE(4), 24000, '24 kHz production reference');
  assert.equal(format.readUInt32LE(8), 48000, 'PCM16 byte rate');
  assert.equal(format.readUInt16LE(12), 2, 'PCM16 sample frame');
  assert.equal(format.readUInt16LE(14), 16, 'PCM16 sample width');
  assert.equal(dataSize % 2, 0, 'complete sample frames');
  const samples = dataSize / 2, duration = samples / 24000;
  assert(duration >= 7 && duration <= 12, 'reference duration is between seven and twelve seconds');
  assert.equal(prompt.sample_rate, 24000); assert.equal(prompt.channels, 1);
  assert(Math.abs(prompt.duration_seconds - duration) <= 1 / 24000, 'declared duration matches physical samples');
  return {format:'PCM16', sampleRate:24000, channels:1, samples, duration};
}

export function validateCurrentVoiceManifest(manifest, pack, catalogue, catalogueSHA256) {
  assert.equal(pack.sha256, CURRENT_REFERENCE_PACK_SHA256, 'accepted current physical source pack digest');
  assert.equal(catalogue.length, 412, 'current full dialogue catalogue');
  const people = [...new Set(catalogue.map(row => row.person))].sort();
  assert.equal(people.length, 9);
  assert.deepEqual(Object.keys(pack.json.prompts || {}).sort(), people, 'current pack contains all nine references');
  assert.equal(pack.json.prompts.mayor.sha256, ACCEPTED_TORRENTE_SHA256, 'Paco uses the accepted actual Torrente reference');
  assert.equal(manifest.reference_pack_sha256, pack.sha256, 'stage is registered against the current physical source pack');
  assert.equal(manifest.catalogue_sha256, catalogueSHA256, 'stage uses the current complete dialogue bodies');
  assert.deepEqual(Object.keys(manifest.references || {}).sort(), people, 'stage declares all nine current references');
  for (const person of people) {
    const prompt = pack.json.prompts[person], reference = manifest.references[person];
    assert.match(prompt.sha256, /^[a-f0-9]{64}$/);
    assert.equal(reference.sha256, prompt.sha256, person + ': current reference hash');
    assert.equal(reference.ref_text, prompt.ref_text, person + ': current reference transcript');
    assert.equal(path.resolve(reference.ref_audio), path.resolve(pack.directory, prompt.ref_audio), person + ': current pack WAV path');
  }
  const known = new Map(catalogue.map(row => [row.id, row]));
  for (const [id, take] of Object.entries(manifest.takes || {})) {
    const row = known.get(id);
    assert(row, 'no obsolete dialogue in the current registry: ' + id);
    assert.equal(take.id, row.id); assert.equal(take.person, row.person);
    assert.equal(take.text, row.text, 'registered take contains the complete current body');
    assert.equal(take.reference_sha256, pack.json.prompts[row.person].sha256, id + ': take uses the current reference, even when its dialogue ID is unchanged');
    assert.equal(take.reference_text, pack.json.prompts[row.person].ref_text, id + ': take uses the current reference transcript');
  }
  return pack;
}

export function loadCurrentVoicePack(project, manifest, catalogue) {
  const directory = path.resolve(project, '../investigacion/voces/referencias-qwen-3.6.3');
  const source = path.join(directory, 'prompts.json'), bytes = fs.readFileSync(source);
  const pack = {source, directory, bytes, sha256:sha(bytes), json:JSON.parse(bytes)};
  const catalogueBytes = fs.readFileSync(path.resolve(project, '../investigacion/voces/dialogos-3.6.3.json'));
  validateCurrentVoiceManifest(manifest, pack, catalogue, sha(catalogueBytes));
  pack.references = Object.fromEntries(Object.entries(pack.json.prompts).map(([person, prompt]) => {
    assert.equal(prompt.ref_audio, './' + person + '.wav', 'current source stays inside the frozen pack');
    const sourcePath = path.resolve(directory, prompt.ref_audio);
    assert(fs.lstatSync(sourcePath).isFile() && !fs.lstatSync(sourcePath).isSymbolicLink(), 'reference is a regular physical WAV');
    const referenceBytes = fs.readFileSync(sourcePath);
    assert.equal(sha(referenceBytes), prompt.sha256, person + ': physical WAV matches the current prompt');
    const format = validateProductionReferenceWAV(referenceBytes, prompt, person);
    return [person, {sourcePath, sha256:prompt.sha256, ref_text:prompt.ref_text, bytes:referenceBytes.length, ...format, provenance:prompt.provenance}];
  }));
  return pack;
}

export function currentPacoNote(pack, recordings) {
  const prompt = pack.json.prompts.mayor, takes = recordings.filter(take => take.person === 'mayor');
  assert.equal(prompt.sha256, ACCEPTED_TORRENTE_SHA256);
  for (const take of takes) assert.equal(take.referenceSHA256, prompt.sha256);
  const speaker = prompt.provenance?.speaker;
  assert(typeof speaker === 'string' && /Torrente/.test(speaker), 'source identity is declared by the accepted pack');
  return takes.length
    ? `Paco: ${takes.length} diálogos generados con la referencia real de ${speaker}.`
    : `Paco: referencia real de ${speaker}; sus diálogos siguen en producción.`;
}
