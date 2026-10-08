// Presentation only: the original body remains the one complete audio take.
import {sentences} from './voice.js';
import {ENCOUNTERS} from './encounters.js';

const encounterOpeners = new Map(), groups = new Map();
for (const scene of ENCOUNTERS) {
  const key = scene.person + '|' + scene.mood;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(scene);
}
for (const scenes of groups.values()) {
  const rows = scenes.map(scene => sentences(scene.body));
  let count = 0;
  while (rows.every(parts => count < parts.length && parts[count] === rows[0][count])) count++;
  for (const scene of scenes) encounterOpeners.set(scene.person + '|' + scene.body, count);
}

export function dialoguePresentation(text, person) {
  const raw = String(text), parts = sentences(raw), paragraphBreak = raw.indexOf('\n\n');
  let openerCount = 0, source = 'single-sentence';
  if (paragraphBreak > 0 && raw.slice(paragraphBreak + 2).trim()) {
    openerCount = sentences(raw.slice(0, paragraphBreak)).length; source = 'explicit-context';
  } else {
    const existing = encounterOpeners.get(person + '|' + raw);
    if (existing !== undefined) { openerCount = existing; source = 'existing-mood-prefix'; }
    else if (parts.length > 1) { openerCount = 1; source = 'first-sentence'; }
  }
  // A short one-sentence message remains whole instead of inventing an opener.
  if (openerCount >= parts.length) openerCount = 0;
  return {parts, openerCount, opener:parts.slice(0, openerCount).join(' '),
    main:parts.slice(openerCount).join(' '), source};
}

const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function dialogueHtml(text, person) {
  const {parts, openerCount} = dialoguePresentation(text, person);
  const render = rows => rows.map(part => `<span class="say-s">${escapeHTML(part)}</span>`).join(' ');
  if (!openerCount) return render(parts);
  return `<span class="dialogue-opener">${render(parts.slice(0, openerCount))}</span> <span class="dialogue-main">${render(parts.slice(openerCount))}</span>`;
}
