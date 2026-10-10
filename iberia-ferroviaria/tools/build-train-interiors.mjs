// Crop the seven final AI contact sheets into the 28 UI photographs.
// This does not synthesize or alter a scene: it exports its exact quadrant.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export async function buildTrainInteriors(project,output){
 const sharp=createRequire(path.join(project,'package.json'))('sharp');
 const {INTERIORS}=await import(pathToFileURL(path.join(project,'dist/train-refit.js')).href);
 const dir=path.join(project,'dist'),rows=[],atlases=new Map();
 for(const [id,meta] of Object.entries(INTERIORS)){
  if(!atlases.has(meta.atlas)){
   const bytes=fs.readFileSync(path.join(dir,'assets/interiores',meta.atlas)),info=await sharp(bytes).metadata();
   assert.equal(info.width,1536,'atlas width');assert.equal(info.height,1024,'atlas height');atlases.set(meta.atlas,bytes);
  }
  for(const [column,key] of ['before','after'].entries()){
   const bytes=await sharp(atlases.get(meta.atlas)).extract({left:column*768,top:meta.row*512,width:768,height:512}).webp({quality:88,effort:6}).toBuffer();
   const url=meta[key];
   for(const destination of new Set([path.join(dir,url),path.join(output,url)])){fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);}
   rows.push({url,model:id,interior:key==='before'?'actual':'reformado',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),kind:'generated-train-interior'});
  }
 }
 assert.equal(rows.length,28);return rows;
}
