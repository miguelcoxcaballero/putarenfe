import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DIALOGUE_CATALOGUE} from './tools/voice_dialogues.mjs';
import {CURRENT_REFERENCE_PACK_SHA256, ACCEPTED_TORRENTE_SHA256, validateCurrentVoiceManifest, validateProductionReferenceWAV, currentPacoNote} from './tools/current_voice_pack.mjs';

const people = [...new Set(DIALOGUE_CATALOGUE.map(row => row.person))];
const pack = {directory:'/frozen/current-references', sha256:CURRENT_REFERENCE_PACK_SHA256, json:{prompts:Object.fromEntries(people.map(person => [person, {
  sha256:person === 'mayor' ? ACCEPTED_TORRENTE_SHA256 : createHash('sha256').update(person).digest('hex'),
  ref_audio:'./' + person + '.wav', ref_text:'Referencia de ' + person,
  provenance:{speaker:person === 'mayor' ? 'José Luis Torrente, interpretado por Santiago Segura' : person}
}]))}};
const catalogueSHA256 = 'c'.repeat(64);
const mayor = DIALOGUE_CATALOGUE.find(row => row.person === 'mayor');
const manifest = {reference_pack_sha256:pack.sha256, catalogue_sha256:catalogueSHA256,
  references:Object.fromEntries(people.map(person => [person, {...pack.json.prompts[person], ref_audio:path.resolve(pack.directory, pack.json.prompts[person].ref_audio)}])),
  takes:{[mayor.id]:{id:mayor.id,person:mayor.person,text:mayor.text,
    reference_sha256:ACCEPTED_TORRENTE_SHA256, reference_text:pack.json.prompts.mayor.ref_text}}};
const clone = value => structuredClone(value);
const rejected = (edit, pattern) => {
  const modified = clone(manifest); edit(modified);
  assert.throws(() => validateCurrentVoiceManifest(modified, pack, DIALOGUE_CATALOGUE, catalogueSHA256), pattern);
};
assert.equal(validateCurrentVoiceManifest(manifest, pack, DIALOGUE_CATALOGUE, catalogueSHA256), pack);
const oldPaco = '85372805acbd8b2ecc857f266d7912b88eacb759191a01c491732d965e5a7f84';
// The dialogue ID and body deliberately stay unchanged: provenance must still
// reject the previous synthetic Paco recording.
rejected(value => { value.takes[mayor.id].reference_sha256 = oldPaco; }, /take uses the current reference/);
rejected(value => { value.references.mayor.sha256 = oldPaco; }, /current reference hash/);
const previousFLOAT = '1d23f62631fbbed89a84cd8ae3f9aa9fb480a6fb172a6cbd2180f027d59a4fed';
rejected(value => { value.takes[mayor.id].reference_sha256 = previousFLOAT; }, /take uses the current reference/);
rejected(value => { value.reference_pack_sha256 = 'b'.repeat(64); }, /current physical source pack/);
rejected(value => { value.catalogue_sha256 = 'b'.repeat(64); }, /current complete dialogue bodies/);
rejected(value => { value.references.president.ref_audio = '/old-pack/president.wav'; }, /current pack WAV path/);
rejected(value => { value.references.president.ref_text += ' cambiado'; }, /current reference transcript/);
rejected(value => { value.takes[mayor.id].reference_text += ' cambiado'; }, /current reference transcript/);
rejected(value => { value.takes[mayor.id].text += ' cuerpo viejo'; }, /complete current body/);
rejected(value => { value.takes['obsolete-id'] = clone(value.takes[mayor.id]); }, /no obsolete dialogue/);
const oldPack = clone(pack); oldPack.json.prompts.mayor.sha256 = oldPaco;
assert.throws(() => validateCurrentVoiceManifest(manifest, oldPack, DIALOGUE_CATALOGUE, catalogueSHA256), /accepted actual Torrente reference/);
const floatPack = clone(pack); floatPack.sha256 = '3cc751f0c1b09d98e0aa54bf1946a0a6f06734fff27b18e9a5fb8b4fc8a63ced';
assert.throws(() => validateCurrentVoiceManifest(manifest, floatPack, DIALOGUE_CATALOGUE, catalogueSHA256), /accepted current physical source pack digest/);
assert.match(currentPacoNote(pack, []), /referencia real de José Luis Torrente.*siguen en producción/);
const recorded = {person:'mayor',referenceSHA256:ACCEPTED_TORRENTE_SHA256};
assert.match(currentPacoNote(pack, [recorded, {...recorded}, {person:'president'}]), /2 diálogos generados con la referencia real/);
assert.throws(() => currentPacoNote(pack, [{...recorded,referenceSHA256:oldPaco}]), assert.AssertionError);
const referenceWAV = (format = 1, sampleRate = 24000) => {
  const samples = 198720, bits = format === 3 ? 32 : 16, sampleBytes = bits / 8;
  const bytes = Buffer.alloc(44 + samples * sampleBytes);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(format, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * sampleBytes, 28);
  bytes.writeUInt16LE(sampleBytes, 32); bytes.writeUInt16LE(bits, 34); bytes.write('data', 36);
  bytes.writeUInt32LE(samples * sampleBytes, 40);
  return bytes;
};
const expectedFormat = {sample_rate:24000, channels:1, duration_seconds:8.28};
assert.deepEqual(validateProductionReferenceWAV(referenceWAV(), expectedFormat, 'mayor'), {format:'PCM16',sampleRate:24000,channels:1,samples:198720,duration:8.28});
assert.throws(() => validateProductionReferenceWAV(referenceWAV(3), expectedFormat, 'mayor'), /PCM16, not FLOAT/);
assert.throws(() => validateProductionReferenceWAV(referenceWAV(1, 48000), expectedFormat, 'mayor'), /24 kHz/);
assert.throws(() => validateProductionReferenceWAV(referenceWAV().subarray(0, 100), expectedFormat, 'mayor'), /complete RIFF container/);
console.log('PASS current voice pack: old source rejected even for an unchanged dialogue ID; PCM16 format, current references, complete bodies and truthful Paco note.');
