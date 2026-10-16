import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=path.resolve('../..'),game=path.join(root,'iberia-ferroviaria');
const specs=[['autobus-tenfe',1536,1024],['autobus-aume',1280,720],['autobus-tenfe-rescate',1280,720],['viajeros-tirados',1280,720]];
const sha=b=>createHash('sha256').update(b).digest('hex');
const rows=[];
for(const[name,width,height]of specs){
 const input=fs.readFileSync(path.join(root,'.codex-averias/inputs',name+'.png'));
 const original=await sharp(input).metadata();
 let bytes,quality=80;
 for(const q of [80,82,85,88,90,92,95,78,75,72]){
  const candidate=await sharp(input).resize(width,height,{fit:'cover',position:'centre'}).webp({quality:q,effort:6}).toBuffer();
  if(candidate.length>=120000&&candidate.length<=350000){bytes=candidate;quality=q;break;}
 }
 assert(bytes,name+' must be 120–350 KB');
 const targets=[path.join(game,'proyecto/dist/assets/rescate',name+'.webp'),path.join(game,'assets/rescate',name+'.webp')];
 for(const target of targets){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
 const metadata=await sharp(bytes).metadata();
 assert.equal(metadata.format,'webp');assert.equal(metadata.width,width);assert.equal(metadata.height,height);
 assert.deepEqual(fs.readFileSync(targets[0]),fs.readFileSync(targets[1]));
 const row={name:name+'.webp',width,height,bytes:bytes.length,quality,sha256:sha(bytes),copies:targets.map(p=>path.relative(root,p)),source:{ai_generated:true,tool:'image_gen',sha256:sha(input),width:original.width,height:original.height}};
 rows.push(row);console.log('IMAGE_VERIFIED:'+JSON.stringify(row));
}
fs.writeFileSync(path.join(game,'investigacion/voces/narracion-averias/images-report.json'),JSON.stringify({schema:1,images:rows},null,1)+'\n');
