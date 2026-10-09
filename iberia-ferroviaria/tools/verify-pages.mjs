#!/usr/bin/env node
// Comprueba por HTTPS una publicación de GitHub Pages contra su release.json:
// páginas, assets actuales, grabaciones y assets conservados (estado HTTP, bytes y SHA-256).
// Uso: node tools/verify-pages.mjs [URL_BASE] [salida.json]
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const base = (process.argv[2] || 'https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/').replace(/\/?$/, '/');
const out = process.argv[3];
const sha = b => createHash('sha256').update(b).digest('hex');
async function get(url) {
  for (let attempt = 1; ; attempt++) {
    try { const r = await fetch(url, {cache: 'no-store'}); const b = Buffer.from(await r.arrayBuffer()); return {status: r.status, bytes: b, attempt}; }
    catch (e) { if (attempt >= 3) return {status: 0, bytes: Buffer.alloc(0), attempt, error: e.message}; await new Promise(r => setTimeout(r, 1500 * attempt)); }
  }
}
const rel = await get(base + 'release.json?nocache=' + Date.now());
if (rel.status !== 200) { console.error('release.json HTTP ' + rel.status); process.exit(1); }
const release = JSON.parse(rel.bytes.toString('utf8'));
const rows = [release.game, release.listening, ...release.assets, ...release.recordings, ...(release.retainedAssets || [])];
const results = [];
let next = 0;
async function worker() {
  while (next < rows.length) {
    const row = rows[next++], r = await get(base + row.url);
    results.push({url: row.url, status: r.status, ok: r.status === 200 && r.bytes.length === row.bytes && sha(r.bytes) === row.sha256, bytes: r.bytes.length, attempt: r.attempt});
  }
}
await Promise.all(Array.from({length: 8}, worker));
const bad = results.filter(r => !r.ok);
const proof = {checkedAt: new Date().toISOString(), base, version: release.version, releaseSHA256: sha(rel.bytes), checked: results.length + 1,
  ok: results.length - bad.length + 1, failed: bad, rescue: release.rescue, availableWholeDialogues: release.availableWholeDialogues};
if (out) fs.writeFileSync(out, JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify({...proof, failed: bad.length}, null, 2));
process.exit(bad.length ? 1 : 0);
