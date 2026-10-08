// Fotografías generadas a partir de las series reales, en un mismo taller.
// Se conserva la API de las fichas del juego; no se crea ningún contexto WebGL.
import {artKey, trainArt} from './train-art.js';
import {TRAIN_PHOTOS, TRAIN_PHOTO_ALIASES} from './assets/train-photos.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function photograph(value) {
  const key = artKey(value), photoKey = TRAIN_PHOTO_ALIASES[key] || key;
  return {key, photo: TRAIN_PHOTOS[photoKey]};
}

/** Una miniatura utiliza la misma fotografía que la ficha del material. */
export function trainThumb(value) {
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
