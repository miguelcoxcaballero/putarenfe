// Reusable visual checker for the in-game UI of Tenfe: Conexiones.
//
// Usage from a Playwright driver:
//   import {check, summarize, problems, launch} from './checker.mjs';
//   const report = await check(page, 'step-name', {outDir, focus: ['#frequency'], screenshot: true});
//   console.log(summarize(report));               // human-readable lines
//   assert.deepEqual(problems(report, {allowOverlap: [['#drawer', '#legend']]}), []);
//
// What it reports (all computed inside the page at the moment of the call):
//   (a) overlaps   : every pair of visible top-level UI containers whose boxes intersect
//                    (fixed/absolute/sticky boxes, open dialogs, coach, toasts, panels, HUD bars),
//                    ignoring DOM nesting; each pair carries names, intersection area and a kind
//                    ('issue' or 'modal-cover' when an open modal simply covers the base layer).
//   (b) dimmed     : visible text/controls that are blurred or dimmed: under a backdrop-filter
//                    overlay painted above them (guide shades), under an open modal ::backdrop,
//                    with a filter on themselves/an ancestor, or with effective opacity < .85.
//                    'concurrent' marks boxes that are shown at the same time to be read
//                    (toasts, narration, welcome, alert pills, coach, inspector/drawer) — the
//                    actual problem the user reported.
//   (c) text       : visible words and visible numbers on screen (only text inside the viewport
//                    and inside every scroll/clip ancestor), total and per container.
//   (d) overflow   : horizontal page overflow and the visible elements that stick out.
//   (e) offscreen  : containers that are partly outside the viewport.
//   (f) focus      : for selectors passed in opts.focus, whether each is visible, inside the
//                    viewport, not covered by anything else and not blurred.
//
// CLI (quick look at any URL, desktop + phone):
//   node checker.mjs http://127.0.0.1:8150/ [outDir]

import fs from 'node:fs';
import path from 'node:path';

const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs';

export async function launch() {
  const {chromium} = await import(PW);
  const exe = process.env.CHROMIUM_PATH || (() => {
    const base = '/opt/pw-browsers';
    const dir = fs.existsSync(base) ? fs.readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort().pop() : null;
    return dir ? path.join(base, dir, 'chrome-linux/chrome') : undefined;
  })();
  return chromium.launch({
    executablePath: exe,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
}

// ---------------------------------------------------------------- in-page probe
function probe(opts) {
  const W = innerWidth, H = innerHeight;
  const vp = {left: 0, top: 0, right: W, bottom: H};
  const area = r => Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);
  const inter = (a, b) => ({left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom)});
  const R = el => { const r = el.getBoundingClientRect(); return {left: r.left, top: r.top, right: r.right, bottom: r.bottom}; };
  const round = r => ({x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.right - r.left), h: Math.round(r.bottom - r.top)});
  const cs = el => getComputedStyle(el);

  const openDialog = [...document.querySelectorAll('dialog[open]')].find(d => { try { return d.matches(':modal'); } catch { return true; } }) || null;
  // Measure the settled state: finish every finite CSS animation/transition (entry fades, slides).
  if (opts.finishAnimations !== false) for (const a of document.getAnimations()) { try { const t = a.effect?.getComputedTiming?.(); if (t && Number.isFinite(t.endTime)) a.finish(); } catch {} }
  // Visible part of an element: viewport ∩ every clipping ancestor (scroll panes).
  function clipRect(el) {
    let b = inter(R(el), vp);
    if (getComputedStyle(el).position === 'fixed') return b;
    for (let e = el.parentElement; e && e !== document.documentElement && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (/(hidden|auto|scroll|clip)/.test(s.overflowX + s.overflowY)) b = inter(b, R(e));
      if (s.position === 'fixed') break;
    }
    return b;
  }
  const isFrame = el => el.id === 'spot' || el.classList?.contains('tour-ring');

  // Effective visibility (display, visibility, opacity chain, size, viewport).
  function opacityChain(el) {
    let o = 1;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = cs(e); o *= parseFloat(s.opacity); if (o < 0.02) break; }
    return o;
  }
  function shown(el) {
    if (!el.isConnected) return false;
    if (el.closest('[hidden]')) return false;
    const s = cs(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse') return false;
    if (typeof el.checkVisibility === 'function' && !el.checkVisibility({checkOpacity: false, checkVisibilityCSS: true})) return false;
    const r = R(el);
    if (r.right - r.left < 1 || r.bottom - r.top < 1) return false;
    if (area(inter(r, vp)) < 1) return false;
    if (opacityChain(el) < 0.05) return false;
    // Base-layer elements are still "shown" when a modal is open (they are just covered).
    return true;
  }

  function nameOf(el) {
    if (!el || el.nodeType !== 1) return String(el);
    if (el === document.body) return 'body';
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = [...el.classList].filter(c => !/^(visible|show|active|hidden|on|in-dialog)$/.test(c)).slice(0, 3);
    if (cls.length) s += '.' + cls.join('.');
    const label = el.getAttribute('aria-label') || el.dataset?.stepId || el.dataset?.action || '';
    if (label) s += '[' + label.slice(0, 40) + ']';
    return s;
  }
  function pathOf(el) {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) parts.unshift(nameOf(e));
    return parts.join(' > ');
  }
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
  const textOf = el => (el.innerText || el.value || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();

  // ---------------------------------------------------------- (a) containers
  const roots = new Set([document.documentElement, document.body, document.getElementById('game')].filter(Boolean));
  const all = [...document.body.querySelectorAll('*')];
  const isLayer = el => {
    if (roots.has(el)) return false;
    if (el.tagName === 'DIALOG') return el.open;
    if (['SCRIPT', 'STYLE', 'TEMPLATE', 'svg', 'path'].includes(el.tagName)) return false;
    const s = cs(el);
    return s.position === 'fixed' || s.position === 'absolute' || s.position === 'sticky';
  };
  let candidates = all.filter(el => isLayer(el) && shown(el));
  // Ignore decorative atoms (tiny badges, icons) and full-screen roots (map canvas, shade wrapper, backgrounds).
  candidates = candidates.filter(el => {
    const r = inter(R(el), vp), a = area(r);
    if (a < 600) return false;
    if (el.tagName === 'CANVAS' && a > W * H * 0.9) return false; // the map itself
    if (el.id === 'tour-shades' || isFrame(el)) return false; // wrapper/ring: decoration of the guide, reported in guide{}
    if (el.closest('#tour-shades')) return false;
    if (el.classList.contains('main-menu-art')) return false;
    return true;
  });
  const candSet = new Set(candidates);
  const topOf = el => { let top = null; for (let e = el.parentElement; e; e = e.parentElement) if (candSet.has(e)) top = e; return top; };
  const topLevel = candidates.filter(el => !topOf(el));
  const inModal = el => !!(openDialog && openDialog.contains(el));
  const fullScreen = el => area(inter(R(el), vp)) >= W * H * 0.92;

  const containers = topLevel.map(el => {
    const r = inter(R(el), vp);
    return {name: nameOf(el), path: pathOf(el), box: round(R(el)), visibleBox: round(r), z: cs(el).zIndex, position: el.tagName === 'DIALOG' ? 'top-layer' : cs(el).position, layer: el.tagName === 'DIALOG' || inModal(el) ? 'modal' : 'base', full: fullScreen(el)};
  });

  // Paint order probe with pointer-events forced on, so pointer-transparent boxes (toasts, shades) count.
  const style = document.createElement('style');
  style.textContent = '*,*::before,*::after{pointer-events:auto!important}';
  document.head.appendChild(style);
  const stackAt = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? document.elementsFromPoint(x, y) : [];

  const overlaps = [];
  for (let i = 0; i < topLevel.length; i++) for (let j = i + 1; j < topLevel.length; j++) {
    const A = topLevel[i], B = topLevel[j];
    if (A.contains(B) || B.contains(A)) continue;
    const ra = inter(R(A), vp), rb = inter(R(B), vp), ri = inter(ra, rb), a = area(ri);
    if (a < 64) continue;
    const la = A.tagName === 'DIALOG' || inModal(A) ? 'modal' : 'base', lb = B.tagName === 'DIALOG' || inModal(B) ? 'modal' : 'base';
    let kind = 'issue';
    if (la !== lb) kind = 'modal-cover';
    // Which one is painted on top at the centre of the intersection?
    const cx = (ri.left + ri.right) / 2, cy = (ri.top + ri.bottom) / 2;
    const st = stackAt(cx, cy);
    const ia = st.findIndex(e => A.contains(e)), ib = st.findIndex(e => B.contains(e));
    const onTop = ia < 0 && ib < 0 ? null : ib < 0 || (ia >= 0 && ia < ib) ? nameOf(A) : nameOf(B);
    overlaps.push({a: nameOf(A), b: nameOf(B), area: Math.round(a), box: round(ri), pctOfSmaller: Math.round(100 * a / Math.max(1, Math.min(area(ra), area(rb)))), onTop, kind});
  }
  overlaps.sort((x, y) => (x.kind === y.kind ? 0 : x.kind === 'issue' ? -1 : 1) || y.area - x.area);

  // ---------------------------------------------------------- (b) blurred / dimmed readable things
  const backdropOf = openDialog ? getComputedStyle(openDialog, '::backdrop') : null;
  const modalBackdrop = backdropOf ? {filter: backdropOf.backdropFilter || backdropOf.webkitBackdropFilter || 'none', background: backdropOf.backgroundColor} : null;
  const overlayEls = all.filter(el => { if (!shown(el)) return false; const s = cs(el); const bf = s.backdropFilter || s.webkitBackdropFilter; return bf && bf !== 'none'; });
  const isOverlay = el => overlayEls.includes(el);
  const interactive = el => el.matches('button,a[href],input:not([type=hidden]),select,textarea,summary,[role=button],[data-action],[tabindex]:not([tabindex="-1"])');
  const readables = all.filter(el => {
    if (el.closest('svg') && el.tagName !== 'svg') return false;
    if (['SCRIPT', 'STYLE', 'OPTION', 'BR'].includes(el.tagName)) return false;
    if (!interactive(el) && !ownText(el)) return false;
    if (!interactive(el) && el.closest('button,a,summary,[data-action]') && el.closest('button,a,summary,[data-action]') !== el) return false; // count the control, not its spans
    return shown(el);
  });
  const concurrentSel = '#toast,.narration-toast,.alert-pill,#entry-welcome,#coach,.tour-coach,#inspector,#drawer,dialog[open],.celebrate,.popup';
  const dimmed = [];
  let disabledCount = 0;
  for (const el of readables) {
    const r = clipRect(el); if (area(r) < 4) continue;
    const reasons = [];
    // own filter on self or ancestor
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const f = cs(e).filter; if (f && f !== 'none') { reasons.push('filter:' + f + ' on ' + nameOf(e)); break; } }
    const op = opacityChain(el);
    const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true' || !!el.closest('fieldset[disabled]');
    if (disabled) disabledCount++;
    if (op < 0.6 && !disabled) reasons.push('opacity:' + op.toFixed(2));
    // overlay above (paint order) at centre
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    const st = stackAt(cx, cy);
    const k = st.findIndex(e => e === el || el.contains(e) || e.contains(el) && e !== document.body && e !== document.documentElement);
    const above = k < 0 ? st : st.slice(0, k);
    const ov = above.find(e => isOverlay(e) && !e.contains(el) && !isFrame(e));
    if (ov) reasons.push('under overlay ' + nameOf(ov) + ' (' + (cs(ov).backdropFilter || cs(ov).webkitBackdropFilter) + ')');
    if (openDialog && !openDialog.contains(el) && modalBackdrop && (modalBackdrop.filter !== 'none' || !/rgba?\(0, 0, 0, 0\)|transparent/.test(modalBackdrop.background))) reasons.push('under modal ::backdrop (' + modalBackdrop.filter + ', ' + modalBackdrop.background + ')');
    // occluded by another opaque box (not an overlay, not its own subtree)
    const myTop = topOf(el) || el;
    const occ = k < 0 ? null : above.find(e => !isOverlay(e) && !isFrame(e) && !e.contains(el) && !el.contains(e) && e !== document.body && e.id !== 'tour-shades' && (topOf(e) || e) !== myTop && !(openDialog && openDialog.contains(e) && !openDialog.contains(el)));
    if (!reasons.length && !occ) continue;
    const conc = el.closest(concurrentSel);
    dimmed.push({el: nameOf(el), text: textOf(el).slice(0, 60), container: nameOf(topOf(el) || el), concurrent: conc ? nameOf(conc) : null, interactive: interactive(el), disabled, reasons, occludedBy: occ ? nameOf(occ) : null});
  }
  // Per-container coverage: sample a 6×4 grid and see what is painted above each point.
  const concurrentBox = el => el.matches?.('#toast,.narration-toast,.alert-pill,#entry-welcome,#coach,.tour-coach,#inspector,#drawer,.celebrate,.popup');
  topLevel.forEach((el, i) => {
    const r = inter(R(el), vp); if (area(r) < 64) return;
    let total = 0, blurred = 0, covered = 0; const by = new Set();
    for (let gx = 0; gx < 6; gx++) for (let gy = 0; gy < 4; gy++) {
      const x = r.left + (gx + 0.5) * (r.right - r.left) / 6, y = r.top + (gy + 0.5) * (r.bottom - r.top) / 4;
      const st = stackAt(x, y); const k = st.findIndex(e => el.contains(e));
      if (k < 0 && !st.some(e => e === el)) continue; // transparent part of a sparse container
      total++;
      const above = st.slice(0, k);
      if (above.some(e => isOverlay(e) && !isFrame(e) && !e.contains(el))) blurred++;
      const occ = above.find(e => !isOverlay(e) && !isFrame(e) && !el.contains(e) && !e.contains(el) && e.id !== 'tour-shades' && !['HTML', 'BODY'].includes(e.tagName) && e.id !== 'game');
      if (occ) { covered++; by.add(nameOf(topOf(occ) || occ)); }
    }
    const c = containers[i];
    c.samples = total; c.blurredPct = total ? Math.round(100 * blurred / total) : 0; c.coveredPct = total ? Math.round(100 * covered / total) : 0; c.coveredBy = [...by];
    c.concurrent = !!concurrentBox(el) && !el.classList.contains('tour-target');
    c.underModal = !!(openDialog && !openDialog.contains(el) && el !== openDialog);
  });

  // Group by container for readability.
  const dimGroups = {};
  for (const d of dimmed) {
    const key = d.container + ' :: ' + (d.reasons.length ? d.reasons.map(x => x.replace(/ on .*$/, '').replace(/\(.*\)/, '')).join('+') : 'occluded by ' + d.occludedBy);
    (dimGroups[key] ||= {container: d.container, why: d.reasons.length ? d.reasons : ['occluded by ' + d.occludedBy], concurrent: d.concurrent, count: 0, interactive: 0, samples: []});
    const g = dimGroups[key]; g.count++; if (d.interactive) g.interactive++; if (g.samples.length < 4 && d.text) g.samples.push(d.text);
  }

  // ---------------------------------------------------------- (c) words & numbers in view
  const clipAncestors = el => {
    const out = [];
    for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) {
      const s = cs(e);
      if (/(hidden|auto|scroll|clip)/.test(s.overflow + s.overflowX + s.overflowY)) out.push(R(e));
    }
    return out;
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let words = 0, numbers = 0; const per = {}; const numberSamples = [];
  const NUM = /\d+(?:[.,:/]\d+)*/g;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.replace(/\s+/g, ' ').trim(); if (!t) continue;
    const p = n.parentElement; if (!p || ['SCRIPT', 'STYLE', 'TEMPLATE', 'OPTION', 'TITLE', 'NOSCRIPT'].includes(p.tagName)) continue;
    if (p.closest('select') && p.tagName !== 'SELECT') { /* only selected option is visible */ continue; }
    if (!shown(p)) continue;
    if (openDialog && !openDialog.contains(p) && opts.skipUnderModal !== false) continue; // covered by the modal: not readable
    const range = document.createRange(); range.selectNodeContents(n);
    const rects = [...range.getClientRects()]; if (!rects.length) continue;
    const clips = clipAncestors(p);
    const visible = rects.some(rc => { let b = inter({left: rc.left, top: rc.top, right: rc.right, bottom: rc.bottom}, vp); for (const c of clips) b = inter(b, c); return area(b) >= 2; });
    if (!visible) continue;
    const w = t.split(' ').filter(x => /[A-Za-zÀ-ÿ]/.test(x)).length, nums = t.match(NUM) || [];
    words += w; numbers += nums.length;
    const key = nameOf(topOf(p) || p.closest('dialog') || p);
    (per[key] ||= {words: 0, numbers: 0}); per[key].words += w; per[key].numbers += nums.length;
    if (nums.length && numberSamples.length < 60) numberSamples.push(t.slice(0, 50));
  }
  // select elements show their current option
  for (const s of document.querySelectorAll('select')) if (shown(s) && !(openDialog && !openDialog.contains(s))) { const t = s.selectedOptions[0]?.textContent || ''; words += t.split(/\s+/).filter(x => /[A-Za-zÀ-ÿ]/.test(x)).length; numbers += (t.match(NUM) || []).length; }

  // ---------------------------------------------------------- (d) horizontal overflow
  const scrollW = document.scrollingElement.scrollWidth;
  const sticking = [];
  for (const el of all) {
    if (!shown(el)) continue;
    const r = R(el);
    if (r.right > W + 1 || r.left < -1) {
      // ignore if an ancestor scrolls horizontally / clips it
      let clipped = false;
      for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const s = cs(e); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { const pr = R(e); if (pr.right <= W + 1 && pr.left >= -1) { clipped = true; break; } } }
      if (!clipped) sticking.push({el: pathOf(el), left: Math.round(r.left), right: Math.round(r.right)});
    }
  }

  // ---------------------------------------------------------- (e) partly offscreen containers
  const offscreen = topLevel.filter(el => { const r = R(el); return !fullScreen(el) && (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1) && cs(el).position !== 'sticky'; }).map(el => ({name: nameOf(el), box: round(R(el))}));

  // ---------------------------------------------------------- (f) focus targets
  const focus = (opts.focus || []).map(sel => {
    const el = document.querySelector(sel);
    if (!el) return {sel, found: false};
    if (!shown(el)) return {sel, found: true, visible: false};
    const r = R(el), c = clipRect(el), inside = r.left >= -1 && r.top >= -1 && r.right <= W + 1 && r.bottom <= H + 1;
    const shownPct = Math.round(100 * area(c) / Math.max(1, area(r)));
    if (area(c) < 4) return {sel, found: true, visible: false, scrolledOut: true, box: round(r)};
    const cx = (c.left + c.right) / 2, cy = (c.top + c.bottom) / 2;
    const st = stackAt(cx, cy), k = st.findIndex(e => e === el || el.contains(e));
    const above = (k < 0 ? st.slice(0, 3) : st.slice(0, k)).filter(e => !e.contains(el) && !isFrame(e) && e.id !== 'tour-shades');
    return {sel, found: true, visible: true, inside, shownPct, box: round(r), coveredBy: above.length ? above.slice(0, 3).map(nameOf) : null, blurred: above.some(isOverlay)};
  });

  style.remove();

  // Guide geometry (coach / ring / target) if present.
  const coach = document.getElementById('coach'), ring = document.getElementById('spot'), target = document.querySelector('.tour-target,.tour-dialog');
  const guide = coach ? {
    step: coach.dataset.stepId, inDialog: coach.classList.contains('in-dialog'), coach: round(R(coach)), ring: ring ? round(R(ring)) : null, target: target ? nameOf(target) : null,
    coachOverRing: ring ? Math.round(area(inter(R(coach), R(ring)))) : 0, targetBox: target ? round(R(target)) : null,
    coachOverTarget: target && !coach.classList.contains('in-dialog') ? Math.round(area(inter(inter(R(coach), vp), inter(R(target), vp)))) : 0,
    title: coach.querySelector('h2')?.textContent || '', status: coach.querySelector('footer>span')?.textContent || '', next: coach.querySelector('[data-action="tutorial-next"]')?.textContent || '', nextEnabled: !coach.querySelector('[data-action="tutorial-next"]')?.disabled,
  } : null;

  const texts = {};
  for (const el of topLevel) { if (el.id === 'map') continue; const t = (el.innerText || '').replace(/\s+/g, ' ').trim(); if (t) texts[nameOf(el)] = t.slice(0, 900); }
  return {
    texts,
    viewport: {w: W, h: H}, modal: openDialog ? nameOf(openDialog.firstElementChild || openDialog) : null, modalBackdrop,
    containers, overlaps, dimGroups: Object.values(dimGroups), dimmedCount: dimmed.length, disabledCount,
    words, numbers, perContainer: per, numberSamples,
    overflow: {scrollWidth: scrollW, innerWidth: W, overflowing: scrollW > W + 1, sticking: sticking.slice(0, 15)},
    offscreen, focus, guide,
  };
}

// ---------------------------------------------------------------- Node side
export async function check(page, label, opts = {}) {
  const {outDir, screenshot = true, focus = [], fullPage = false} = opts;
  await page.waitForTimeout(opts.settle ?? 350);
  const report = await page.evaluate(probe, {focus, skipUnderModal: opts.skipUnderModal});
  report.label = label;
  if (outDir) {
    fs.mkdirSync(outDir, {recursive: true});
    if (screenshot) {
      const file = path.join(outDir, label + '.png');
      for (let attempt = 0; attempt < 2; attempt++) {
        try { await page.screenshot({path: file, fullPage, animations: 'disabled', timeout: 90000}); delete report.screenshotError; break; }
        catch (e) { report.screenshotError = e.message.split('\n')[0]; }
      }
      report.screenshot = file;
    }
    fs.writeFileSync(path.join(outDir, label + '.json'), JSON.stringify(report, null, 1));
  }
  return report;
}

/** One-line summary plus the notable findings, for console logs and markdown. */
export function summarize(rep) {
  const issues = rep.overlaps.filter(o => o.kind === 'issue');
  const lines = [`${rep.label} · ${rep.viewport.w}×${rep.viewport.h} · ${rep.words} palabras · ${rep.numbers} números · ${rep.containers.length} cajas · ${issues.length} solapes${rep.overflow.overflowing ? ' · DESBORDA ' + rep.overflow.scrollWidth + 'px' : ''}${rep.modal ? ' · modal ' + rep.modal : ''}${rep.guide ? ' · guía ' + rep.guide.step : ''}`];
  for (const o of issues) lines.push(`  solape: ${o.a} ∩ ${o.b} = ${o.area}px² (${o.pctOfSmaller}% de la menor; encima ${o.onTop})`);
  for (const c of rep.containers) if (c.concurrent && !c.underModal && (c.blurredPct > 0 || c.coveredPct >= 10)) lines.push(`  CAJA ${c.name}: ${c.blurredPct ? c.blurredPct + '% BORROSA ' : ''}${c.coveredPct >= 10 ? c.coveredPct + '% tapada por ' + c.coveredBy.join(', ') : ''}`);
  for (const g of rep.dimGroups) if (g.concurrent || g.interactive) lines.push(`  ${g.concurrent ? 'BORROSO/TAPADO (a la vez)' : 'atenuado'}: ${g.container} ×${g.count} (${g.interactive} controles) — ${g.why[0]}${g.samples.length ? ' — «' + g.samples.slice(0, 2).join('», «') + '»' : ''}`);
  for (const f of rep.focus || []) if (!f.found || !f.visible || !f.inside || f.coveredBy || f.blurred || f.shownPct < 60) lines.push(`  foco ${f.sel}: ${!f.found ? 'NO EXISTE' : !f.visible ? (f.scrolledOut ? 'fuera de la zona visible (hay que desplazar)' : 'invisible') : (f.blurred ? 'BORROSO ' : '') + (f.coveredBy ? 'tapado por ' + f.coveredBy.join(', ') + ' ' : '') + (f.shownPct < 60 ? 'solo ' + f.shownPct + '% visible ' : '') + (f.inside ? '' : 'sale de pantalla')}`);
  if (rep.guide && rep.guide.coachOverTarget > 0) lines.push(`  guía: la caja de la guía tapa ${rep.guide.coachOverTarget}px² del panel resaltado ${rep.guide.target}`);
  for (const o of rep.offscreen) lines.push(`  fuera de pantalla: ${o.name} ${JSON.stringify(o.box)}`);
  return lines.join('\n');
}

/**
 * Structured problem list for assertions in later stages.
 * allowOverlap: array of [regexA, regexB] pairs that are intended (matched in either order).
 * Returns [] when the screen is clean.
 */
export function problems(rep, {allowOverlap = [], minOverlap = 64, ignoreFocus = []} = {}) {
  const out = [];
  const allowed = o => allowOverlap.some(([a, b]) => (new RegExp(a).test(o.a) && new RegExp(b).test(o.b)) || (new RegExp(a).test(o.b) && new RegExp(b).test(o.a)));
  for (const o of rep.overlaps) if (o.kind === 'issue' && o.area >= minOverlap && !allowed(o)) out.push({type: 'overlap', detail: `${o.a} ∩ ${o.b} = ${o.area}px²`});
  for (const c of rep.containers) if (c.concurrent && !c.underModal && (c.blurredPct > 0 || c.coveredPct >= 10)) out.push({type: 'blurred-or-covered', detail: `${c.name}: ${c.blurredPct}% blurred, ${c.coveredPct}% covered by ${c.coveredBy.join(', ')}`});
  for (const f of rep.focus || []) if (!ignoreFocus.includes(f.sel) && (!f.found || !f.visible || f.coveredBy || f.blurred || f.shownPct < 60)) out.push({type: 'focus', detail: `${f.sel}: ${JSON.stringify(f)}`});
  if (rep.guide && rep.guide.coachOverTarget > 0) out.push({type: 'coach-over-target', detail: `${rep.guide.coachOverTarget}px² over ${rep.guide.target}`});
  if (rep.overflow.overflowing) out.push({type: 'overflow', detail: `scrollWidth ${rep.overflow.scrollWidth} > ${rep.overflow.innerWidth}`});
  for (const o of rep.offscreen) out.push({type: 'offscreen', detail: `${o.name} ${JSON.stringify(o.box)}`});
  return out;
}

// ---------------------------------------------------------------- CLI
if (import.meta.url === 'file://' + process.argv[1]) {
  const url = process.argv[2] || 'http://127.0.0.1:8150/';
  const outDir = process.argv[3] || path.join(path.dirname(process.argv[1]), 'cli');
  const browser = await launch();
  for (const vp of [{width: 1440, height: 900}, {width: 390, height: 844}]) {
    const page = await browser.newPage({viewport: vp});
    await page.goto(url, {waitUntil: 'load'});
    const rep = await check(page, 'cli-' + vp.width, {outDir});
    console.log(summarize(rep));
    await page.close();
  }
  await browser.close();
}
