// Explicit asset preparation, never run by the game. Reuses the committed photo.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from '../proyecto/node_modules/sharp/lib/index.js';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../proyecto/dist/assets');
const file=path.join(dir,'menu-paracuellos.jpg');
const source='https://upload.wikimedia.org/wikipedia/commons/6/6c/RENFE_Class_103_Paracuellos_de_la_Ribera.jpg';
const digest=b=>createHash('sha256').update(b).digest('hex');
if(fs.existsSync(file)){console.log('Using committed menu photograph: '+digest(fs.readFileSync(file)));process.exit(0);}
const response=await fetch(source,{headers:{'User-Agent':'Tenfe-Conexiones/6.3 (railway game; Wikimedia Commons CC BY-SA photograph)'},signal:AbortSignal.timeout(45000)});
assert(response.ok,'photograph download HTTP '+response.status);
assert(response.headers.get('content-type')?.includes('image/jpeg'),'JPEG content');
const bytes=Buffer.from(await response.arrayBuffer());assert(bytes.length<12000000);
const meta=await sharp(bytes).metadata();assert.equal(meta.width,5602);assert.equal(meta.height,3458);
const photo=await sharp(bytes).rotate().resize({width:2560,withoutEnlargement:true}).jpeg({quality:87,progressive:true}).toBuffer();
fs.writeFileSync(file,photo);
fs.writeFileSync(path.join(dir,'menu-paracuellos-provenance.json'),JSON.stringify({
 title:'RENFE Class 103 Paracuellos de la Ribera',author:'David Gubler / Kabelleger',captured:'2012-10-03',
 sourcePage:'https://commons.wikimedia.org/wiki/File:RENFE_Class_103_Paracuellos_de_la_Ribera.jpg',sourceURL:source,
 license:'CC BY-SA 3.0',licenseURL:'https://creativecommons.org/licenses/by-sa/3.0/',
 sourceSHA256:digest(bytes),sha256:digest(photo),file:'menu-paracuellos.jpg',
 changes:'Scaled from 5602 × 3458 to 2560 px wide, JPEG progressive quality 87. No generative edits. CSS crops to viewport and overlays a dark gradient.'
},null,2)+'\n');
console.log('Prepared local photograph: '+digest(photo));
