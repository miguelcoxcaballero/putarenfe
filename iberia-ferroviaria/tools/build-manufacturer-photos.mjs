// Export the two approved final edits without cropping or changing their scenes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
export async function buildManufacturerPhotos(project,output){
 const sharp=createRequire(path.join(project,'package.json'))('sharp');
 const dir=path.join(project,'dist'),folder=path.join(dir,'assets/fabricantes');
 const manifestPath=path.join(folder,'manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestPath));
 const hash=b=>createHash('sha256').update(b).digest('hex');
 assert.equal(hash(fs.readFileSync(path.join(dir,manifest.backgroundReference.editableSource.replace(/^dist\//,'')))),manifest.backgroundReference.sha256,'unchanged S112 workshop reference');
 assert.deepEqual(manifest.photos.map(p=>p.id).sort(),['bcbb','dorfler']);
 for(const row of manifest.photos){
  const input=fs.readFileSync(path.join(folder,row.finalImage));
  const blob=createHash('sha1').update(Buffer.concat([Buffer.from('blob '+input.length+'\0'),input])).digest('hex');
  assert.equal(blob,row.sourceGitBlob,'approved final source: '+row.id);
  const info=await sharp(input).metadata();assert.equal(info.width,1536);assert.equal(info.height,1024);
  const bytes=await sharp(input).webp({quality:84,effort:6}).toBuffer();
  row.sourceSHA256=hash(input);row.bytes=bytes.length;row.sha256=hash(bytes);
  for(const target of new Set([path.join(dir,row.url),path.join(output,row.url)])){
   fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  }
 }
 const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n'),url='assets/fabricantes/manifest.json';
 fs.writeFileSync(manifestPath,bytes);fs.mkdirSync(path.join(output,'assets/fabricantes'),{recursive:true});fs.writeFileSync(path.join(output,url),bytes);
 console.log('Fotos de fabricantes: '+manifest.photos.map(p=>p.id+' '+p.bytes+' bytes').join(', '));
 return [{url,bytes:bytes.length,sha256:hash(bytes),kind:'manufacturer-photo-provenance'}];
}
