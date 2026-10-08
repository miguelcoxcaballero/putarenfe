// Empaqueta las fotos ya generadas. --import acepta un registro local de imagegen;
// sin argumentos reconstruye el módulo desde los WebP versionados.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(root, 'dist/assets/train-photos');
const manifestPath = path.join(folder, 'manifest.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
fs.mkdirSync(folder, {recursive:true});
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath)) : {
  schema:1, method:'image_gen.imagegen', setting:'Taller compartido, vigas azules y grúa amarilla',
  photos:[], aliases:{'102':'112','112M':'112','107':'112','121':'120','114':'104','106avlo':'106',
    '448':'449','480':'449','490':'449','470':'592','596':'594','598':'599','442':'440','447':'446',
    '451':'450','453':'452','462':'465','463':'465','464':'465','2600':'2700',
    '2900':'3600','3300':'3600','3500':'3600','3800':'3600','401':'3600','402':'402'}
};
const args = process.argv.slice(2);
for (let i=0; i<args.length; i+=2) {
  assert.equal(args[i], '--import', 'Argumento desconocido');
  const source = JSON.parse(fs.readFileSync(args[i+1]));
  const rows = source.items || source.records;
  assert(Array.isArray(rows));
  const provenance = JSON.parse(fs.readFileSync('/workspace/tools/train-photo-references/reference-provenance-extended.json'));
  for (const row of rows) {
    const series = String(row.series || row.id), original = row.path || row.generatedPath;
    assert(/^(\d{3,4}|future|106avlo)$/.test(series));
    const originalBytes = fs.readFileSync(original), originalSHA = sha(originalBytes);
    const references = provenance.images.filter(p => (row.references || []).includes(p.path)).map(p => ({
      series:p.series,sourceURL:p.url,sourcePage:p.commonsPage || p.sourcePage || null,
      sourceSHA256:p.sha256,artist:p.artistPlain || null,license:p.license || null
    }));
    const prior = manifest.photos.find(p => p.series===series);
    if (prior?.generatedSHA256===originalSHA) {
      if (row.label) prior.label = row.label;
      prior.references = references;
      if (row.workshopReference) prior.workshopGeneratedFile = path.basename(row.workshopReference);
      if (row.derivedFrom) prior.derivedFrom = row.derivedFrom;
      continue;
    }
    const file = series+'.webp', target = path.join(folder,file);
    const result = spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-threads','1','-i',original,
      '-frames:v','1','-c:v','libwebp','-lossless','0','-compression_level','6','-q:v','84','-threads','1','-y',target],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    const bytes = fs.readFileSync(target);
    assert.equal(bytes.subarray(0,4).toString(),'RIFF');
    assert.equal(bytes.subarray(8,12).toString(),'WEBP');
    const record = {series,file,bytes:bytes.length,sha256:sha(bytes),generatedSHA256:originalSHA,
      generatedFile:path.basename(original),generated:true,fictional:series==='future',
      label:row.label || (series==='future'?'AV 2030 · Nueva generación':`Tenfe · Serie ${series}`),references};
    if (row.workshopReference) record.workshopGeneratedFile = path.basename(row.workshopReference);
    if (row.editedFrom) record.editedFrom = row.editedFrom;
    if (row.changes) record.changes = row.changes;
    if (row.derivedFrom) record.derivedFrom = row.derivedFrom;
    if (prior) manifest.photos[manifest.photos.indexOf(prior)]=record; else manifest.photos.push(record);
    // Una foto específica sustituye cualquier alias de familia anterior.
    delete manifest.aliases[series];
  }
}
manifest.photos.sort((a,b)=>a.series.localeCompare(b.series,'es',{numeric:true}));
const photos = {};
for (const item of manifest.photos) {
  const bytes=fs.readFileSync(path.join(folder,item.file));
  assert.equal(sha(bytes),item.sha256);assert.equal(bytes.length,item.bytes);
  photos[item.series]={src:'data:image/webp;base64,'+bytes.toString('base64'),label:item.label,series:item.series,generated:true};
}
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(root,'dist/assets/train-photos.js'),
  '// Fotografías originales generadas; fuentes y créditos en train-photos/manifest.json.\n'+
  'export const TRAIN_PHOTOS = '+JSON.stringify(photos)+';\n'+
  'export const TRAIN_PHOTO_ALIASES = '+JSON.stringify(manifest.aliases)+';\n');
console.log(JSON.stringify({photos:manifest.photos.length,webpBytes:manifest.photos.reduce((n,p)=>n+p.bytes,0),manifestSHA256:sha(fs.readFileSync(manifestPath))}));
