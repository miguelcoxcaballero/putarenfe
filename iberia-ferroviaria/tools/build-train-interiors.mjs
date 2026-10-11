// Export individually approved, photograph-referenced image edits at full resolution.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export async function buildTrainInteriors(project,output){
 const sharp=createRequire(path.join(project,'package.json'))('sharp');
 const {INTERIORS}=await import(pathToFileURL(path.join(project,'dist/train-refit.js')).href);
 const dir=path.join(project,'dist'),rows=[],approved=new Map();
 const source=JSON.parse(fs.readFileSync(path.join(dir,'assets/interiores/source-manifest.json'),'utf8'));
 assert.equal(source.version,'6.4.0');assert.equal(source.sources.length,26);assert.equal(source.references.length,12);
 const refs=new Map(source.references.map(r=>[r.id,r]));
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const write=(url,bytes)=>{for(const destination of new Set([path.join(dir,url),path.join(output,url)])){fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);}};
 for(const item of source.sources){
  assert(/^assets\/interiores\/final\/[a-z0-9-]+\.png$/.test(item.path),'approved local source path');
  const bytes=fs.readFileSync(path.join(dir,item.path)),info=await sharp(bytes).metadata();
  const gitSHA=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
  assert.equal(gitSHA,item.gitBlobSHA,'approved source is unchanged: '+item.path);
  assert.equal(info.width,1536);assert.equal(info.height,1024);
  const ref=refs.get(item.referenceId);assert(ref&&/^[a-f0-9]{64}$/.test(ref.sha256)&&ref.page&&ref.author,'identified real photographic input');
  if(item.state==='before')assert.equal(item.input.sha256,ref.sha256,'actual attached photograph');
  else assert(source.sources.some(s=>s.state==='before'&&s.gitBlobSHA===item.input.gitBlobSHA&&s.referenceId===item.referenceId),'after uses its accepted before image');
  approved.set(item.path,{item,bytes,sha256:sha(bytes)});
 }
 for(const [id,meta] of Object.entries(INTERIORS)){
  for(const key of ['before','after']){
   const input=approved.get(key==='before'?meta.sourceBefore:meta.sourceAfter);
   assert(input&&input.item.referenceId===meta.referenceId,'model-specific photographic reference');
   const bytes=await sharp(input.bytes).webp({quality:90,effort:6}).toBuffer(),url=meta[key];
   write(url,bytes);
   rows.push({url,model:id,interior:key==='before'?'actual':'reformado',width:1536,height:1024,bytes:bytes.length,sha256:sha(bytes),sourceSHA256:input.sha256,referenceId:meta.referenceId,kind:'generated-train-interior'});
  }
 }
 assert.equal(rows.length,28);assert.equal(new Set(rows.map(r=>r.url)).size,28);
 const provenance={schema:1,version:source.version,method:source.method,reform:source.reform,references:source.references,sources:source.sources.map(({prompt,...s})=>({...s,sha256:approved.get(s.path).sha256})),images:rows};
 const bytes=Buffer.from(JSON.stringify(provenance,null,2)+'\n'),url='assets/interiores/manifest.json';write(url,bytes);
 return [...rows,{url,bytes:bytes.length,sha256:sha(bytes),kind:'interior-photo-provenance'}];
}
