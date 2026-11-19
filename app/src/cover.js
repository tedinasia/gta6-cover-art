// Draws the cover: panels of photos under a colour grade, bold Anton lettering
// with a neon script subtitle, then grain, a vignette and an optional poster
// frame. Every size is drawn from the same state, so the preview and the export
// are the same picture at different resolutions.

import { panelsFor, panelCount } from './layouts.js';
import { gradeById } from './grades.js';

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
};

export const SIZE_IDS = Object.keys(SIZES);

/** A fresh panel list for a layout: every panel starts on the first photo. */
export function freshPanels(layout, photoCount) {
  const n = panelCount(layout);
  const panels = [];
  for (let i = 0; i < n; i++) {
    panels.push({ photo: photoCount > 0 ? i % photoCount : -1, zoom: 1, ox: 0, oy: 0 });
  }
  return panels;
}

/** A tile of monochrome noise, made once and reused as the grain pattern. */
let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 96);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  noiseTile = tile;
  return tile;
}

/** Draws one photo to cover a rectangle, with zoom and pan, under a filter. */
function drawPhotoInto(ctx, photo, rect, zoom, ox, oy, filter) {
  if (!photo || !photo.img) return false;
  const img = photo.img;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return false;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * Math.max(0.5, zoom);
  const dw = iw * scale;
  const dh = ih * scale;
  const maxOx = Math.max(0, (dw - rect.w) / 2);
  const maxOy = Math.max(0, (dh - rect.h) / 2);
  const px = Math.max(-maxOx, Math.min(maxOx, ox));
  const py = Math.max(-maxOy, Math.min(maxOy, oy));
  ctx.save();
  ctx.filter = filter || 'none';
  ctx.drawImage(img, rect.x + (rect.w - dw) / 2 + px, rect.y + (rect.h - dh) / 2 + py, dw, dh);
  ctx.restore();
  return true;
}

function fitFont(ctx, text, maxWidth, startSize, family, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawTitleBlock(ctx, w, h, state, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const tagline = (state.tagline || '').trim().toUpperCase();
  if (!title && !subtitle && !tagline) return;
  const bandH = h * 0.24;
  const band = ctx.createLinearGradient(0, h - bandH, 0, h);
  band.addColorStop(0, 'rgba(8, 4, 18, 0)');
  band.addColorStop(1, 'rgba(8, 4, 18, 0.78)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h - bandH, w, bandH);

  const cx = w / 2;
  let cursor = h - h * 0.035;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (tagline) {
    const tagSize = Math.max(14, Math.round(h * 0.026));
    ctx.font = `700 ${tagSize}px system-ui, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.round(tagSize * 0.35)}px`;
    } catch (e) {
      /* letterSpacing is Chrome-only; the tagline still draws without it */
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(tagline, cx, cursor);
    try {
      ctx.letterSpacing = '0px';
    } catch (e) {
      /* reset for the next line */
    }
    cursor -= tagSize * 1.9;
  }
  if (title) {
    const size = fitFont(ctx, title, w * 0.92, Math.round(h * 0.115), 'Anton, sans-serif', '400');
    ctx.font = `400 ${size}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = 'rgba(10, 4, 20, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    ctx.strokeText(title, cx, cursor);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const grad = ctx.createLinearGradient(0, cursor - size, 0, cursor);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#fff7e6');
    grad.addColorStop(1, grade.accent);
    ctx.fillStyle = grad;
    ctx.fillText(title, cx, cursor);
    cursor -= size * 1.08;
  }
  if (subtitle) {
    const size = fitFont(ctx, subtitle, w * 0.8, Math.round(h * 0.052), 'Pacifico, cursive', '400');
    ctx.font = `400 ${size}px Pacifico, cursive`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.14);
    ctx.strokeStyle = 'rgba(10, 4, 20, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.3;
    ctx.strokeText(subtitle, cx, cursor);
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle, cx, cursor);
    ctx.shadowBlur = 0;
  }
}

function drawGrain(ctx, w, h) {
  const tile = getNoiseTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const grad = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawFrame(ctx, w, h) {
  const bw = Math.max(8, Math.round(Math.min(w, h) * 0.014));
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = bw;
  ctx.strokeRect(bw / 2, bw / 2, w - bw, h - bw);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(bw + 3, bw + 3, w - 2 * bw - 6, h - 2 * bw - 6);
  ctx.restore();
}

/** Draws the whole cover onto the canvas at its own size, from the state. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = gradeById(state.grade);
  const rects = panelsFor(state.layout, w, h);

  ctx.save();
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);

  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: -1, zoom: 1, ox: 0, oy: 0 };
    const photo = panel.photo >= 0 ? state.photos[panel.photo] : null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const drawn = drawPhotoInto(ctx, photo, rect, panel.zoom, panel.ox, panel.oy, grade.filter);
    if (!drawn) {
      const empty = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      empty.addColorStop(0, '#3b2350');
      empty.addColorStop(1, '#1c0b2b');
      ctx.fillStyle = empty;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    const tint = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    tint.addColorStop(0, grade.tint.from);
    tint.addColorStop(1, grade.tint.to);
    ctx.fillStyle = tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.004));
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    ctx.restore();
  });

  drawTitleBlock(ctx, w, h, state, grade);
  if (state.grain !== false) drawGrain(ctx, w, h);
  drawVignette(ctx, w, h);
  if (state.frame) drawFrame(ctx, w, h);
  ctx.restore();
}

/** Renders the cover at an export size and resolves to a PNG blob. */
export function renderCoverBlob(state, sizeId) {
  const size = SIZES[sizeId] ?? SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('export failed'))), 'image/png');
  });
}
