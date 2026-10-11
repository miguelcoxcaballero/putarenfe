import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
const sharp=createRequire(path.resolve('iberia-ferroviaria/proyecto/package.json'))('sharp');
const refs=JSON.parse(fs.readFileSync('iberia-ferroviaria/docs/interior-reference-sources.json','utf8'));
const headers={'User-Agent':'TenfeInteriorReferenceResearch/1.0 (https://github.com/miguelcoxcaballero/putarenfe)'};
const clean=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
async function request(url){const r=await fetch(url,{headers,signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(r.status+' '+url);return r;}
function emit(id,b){const s=b.toString('base64'),chunks=Math.ceil(s.length/12000);for(let i=0;i<chunks;i++)console.log('PHOTO_REF:'+id+':'+i+'/'+chunks+':'+s.slice(i*12000,(i+1)*12000));}
let failed=0;
for(const ref of refs){
 try{
 let image=ref.image,meta={...ref};
 if(ref.commons){
  const file=ref.commons.replace(/ /g,'_'),hash=createHash('md5').update(file).digest('hex');
  image='https://upload.wikimedia.org/wikipedia/commons/'+hash[0]+'/'+hash.slice(0,2)+'/'+encodeURIComponent(file);
  try{
   const api='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',titles:'File:'+ref.commons,prop:'imageinfo',iiprop:'url|extmetadata|size'});
   const j=await(await request(api)).json(),p=Object.values(j.query.pages)[0],info=p.imageinfo?.[0];
   if(info){image=info.url;meta.author=clean(info.extmetadata?.Artist?.value);meta.license=clean(info.extmetadata?.LicenseShortName?.value);meta.licenseUrl=info.extmetadata?.LicenseUrl?.value;meta.date=clean(info.extmetadata?.DateTimeOriginal?.value);meta.description=clean(info.extmetadata?.ImageDescription?.value);}
  }catch(e){console.log('METADATA_NOTICE:'+ref.id+':'+e.message);}
 }else if(!image){
  const html=await(await request(ref.page)).text();
  image=html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/)?.[1]||html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/)?.[1];
  if(!image)throw Error('No se encontró imagen de referencia');
  image=image.replace(/&amp;/g,'&');
 }
 if(ref.id==='s106')image=image.replace('/480x/','/1200x/');
 const b=Buffer.from(await(await request(image)).arrayBuffer()),m=await sharp(b).metadata();
 meta.image=image;meta.sha256=createHash('sha256').update(b).digest('hex');meta.width=m.width;meta.height=m.height;meta.bytes=b.length;
 console.log('REFERENCE_META:'+JSON.stringify(meta));
 const jpeg=await sharp(b).rotate().resize({width:1536,height:1200,fit:'inside',withoutEnlargement:true}).jpeg({quality:78}).toBuffer();
 fs.mkdirSync('/tmp/tenfe-interior-references',{recursive:true});fs.writeFileSync('/tmp/tenfe-interior-references/'+ref.id+'.jpg',jpeg);emit(ref.id,jpeg);
 }catch(e){failed++;console.log('REFERENCE_ERROR:'+ref.id+':'+e.message);}
}
const old=await sharp('iberia-ferroviaria/proyecto/dist/assets/interiores/interiores-01.png').jpeg({quality:70}).toBuffer();emit('old-atlas',old);
if(failed)console.log('REFERENCES_FAILED:'+failed);
