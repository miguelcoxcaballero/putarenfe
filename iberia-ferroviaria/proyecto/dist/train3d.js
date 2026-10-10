import {MODEL} from './data.js';
// Fotografías generadas a partir de las series reales, en un mismo taller.
// Se conserva la API de las fichas del juego; no se crea ningún contexto WebGL.
import {artKey, trainArt} from './train-art.js';
import {TRAIN_PHOTOS, TRAIN_PHOTO_ALIASES} from './assets/train-photos.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function photograph(value) {
  const key = artKey(MODEL[value]?.photo || value), photoKey = TRAIN_PHOTO_ALIASES[key] || key;
  return {key, photo: TRAIN_PHOTOS[photoKey]};
}

/** Fotos propias de fabricante con nombre fijo (assets/rescate/). Mientras no existan, se ve la serie equivalente. */
const MAKER_PHOTOS = {bcbb: ['assets/rescate/tren-bcbb.webp', 'BCBB · Fuxing Regional', '103'], dorfler: ['assets/rescate/tren-dorfler.webp', 'Dörfler · LIRIO 4', '120']};
/** Una miniatura utiliza la misma fotografía que la ficha del material. */
export function trainThumb(value) {
  const maker = MAKER_PHOTOS[String(MODEL[value]?.photo || value || '').toLowerCase()];
  if (maker) return `<img class="train-photo train-3d-thumb" src="${maker[0]}" alt="${esc(maker[1])} · fotografía" loading="lazy" decoding="async" width="1536" height="1024" data-photo-series="${String(value).toLowerCase()}" onerror="this.onerror=null;this.hidden=true;this.nextElementSibling.hidden=false">`
    + trainThumb(maker[2]).replace('<img ', '<img hidden ');
  const {key, photo} = photograph(value);
  if (key === 'bus') return trainArt('bus');
  if (!photo) return '<div class="train-photo-pending" role="img" aria-label="Fotografía de este material en preparación">Fotografía en preparación</div>';
  return `<img class="train-photo train-3d-thumb" src="${esc(photo.src)}" alt="${esc(photo.label)} · fotografía generada" loading="lazy" decoding="async" width="1536" height="1024" data-photo-series="${esc(photo.series)}">`;
}

/** Ficha fotográfica: la imagen completa conserva el morro y la rodadura. */
export function mountViewer(container) {
  const {key, photo} = photograph(container.dataset.train3d);
  container.dataset.trainPhoto = key;
  if (key === 'bus') { container.innerHTML = trainArt('bus'); return; }
  if (!photo) { container.innerHTML = trainThumb(key); return; }
  container.innerHTML = `<figure class="train-workshop-photo">${trainThumb(key)}<figcaption>${esc(photo.label)} <span>Foto IA</span></figcaption></figure>`;
}

export function mountViewers(root = document) {
  if (root.matches?.('[data-train3d]')) mountViewer(root);
  root.querySelectorAll('[data-train3d]').forEach(mountViewer);
}
