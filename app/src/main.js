// Wires the editor: photos in, layout and grade picks, caption edits, panel
// crop and position by dragging, and PNG export in the three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).

import { LAYOUTS, LAYOUT_IDS, panelsFor, panelCount } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { createPhotoLibrary, loadImage } from './photos.js';
import { drawCover, renderCoverBlob, SIZES, SIZE_IDS, freshPanels } from './cover.js';
import { runShot } from './shots.js';

const SAMPLES = [
  { name: 'Boulevard', url: 'samples/boulevard.png' },
  { name: 'Neon street', url: 'samples/neon.png' },
  { name: 'Pier', url: 'samples/pier.png' },
];

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const thumbsEl = document.getElementById('thumbs');
const panelLabel = document.getElementById('panelLabel');
const zoomInput = document.getElementById('zoom');
const library = createPhotoLibrary();

const state = {
  layout: 'quad',
  grade: 'sunset',
  size: 'square',
  title: 'Neon Shore',
  subtitle: 'Vice City nights',
  tagline: 'Est. 2026',
  frame: true,
  grain: true,
  photos: library.photos,
  panels: freshPanels('quad', 0),
  selected: 0,
};

function setStatus(text) {
  statusEl.textContent = text;
}

function applySize() {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
}

function redraw() {
  applySize();
  drawCover(canvas, state);
  updatePanelUI();
}

function updatePanelUI() {
  const n = panelCount(state.layout);
  panelLabel.textContent = `Panel ${state.selected + 1} of ${n}`;
  const panel = state.panels[state.selected];
  if (panel) zoomInput.value = String(Math.round(panel.zoom * 100));
}

function renderThumbs() {
  thumbsEl.innerHTML = '';
  library.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = photo.name;
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.name;
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      const panel = state.panels[state.selected];
      if (!panel) return;
      panel.photo = i;
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
      redraw();
      setStatus(`Panel ${state.selected + 1} now shows ${photo.name}.`);
    });
    thumbsEl.appendChild(btn);
  });
}

const pickerButtons = {};

function buildPicker(containerId, items, current, onPick) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const map = {};
  items.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.textContent = item.label;
    if (item.swatch) btn.style.setProperty('--swatch', item.swatch);
    if (item.id === current) btn.classList.add('active');
    btn.addEventListener('click', () => {
      onPick(item.id);
      syncPickers();
    });
    container.appendChild(btn);
    map[item.id] = btn;
  });
  pickerButtons[containerId] = map;
}

/** Marks the picker buttons that match the current state (after a shot or a pick). */
function syncPickers() {
  const sync = (containerId, currentId) => {
    const map = pickerButtons[containerId];
    if (!map) return;
    Object.entries(map).forEach(([id, btn]) => btn.classList.toggle('active', id === currentId));
  };
  sync('layoutPicker', state.layout);
  sync('gradePicker', state.grade);
  sync('sizePicker', state.size);
}

function setLayout(id) {
  if (!LAYOUTS[id] || id === state.layout) return;
  const old = state.panels;
  state.layout = id;
  const next = freshPanels(id, library.photos.length);
  for (let i = 0; i < Math.min(old.length, next.length); i++) {
    next[i].photo = old[i].photo;
    next[i].zoom = old[i].zoom;
    next[i].ox = old[i].ox;
    next[i].oy = old[i].oy;
  }
  state.panels = next;
  state.selected = 0;
  redraw();
}

function setGrade(id) {
  state.grade = id;
  redraw();
}

function setSize(id) {
  if (!SIZES[id]) return;
  state.size = id;
  redraw();
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function exportOne(sizeId) {
  const blob = await renderCoverBlob(state, sizeId);
  const size = SIZES[sizeId];
  downloadBlob(blob, `vice-cover-${size.w}x${size.h}.png`);
  return blob;
}

document.getElementById('photos').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  let added = 0;
  for (const file of files) {
    try {
      await library.addFile(file);
      added += 1;
    } catch (err) {
      setStatus(`Could not load ${file.name}.`);
    }
  }
  if (added > 0) {
    state.panels.forEach((panel, i) => {
      if (panel.photo < 0) panel.photo = i % library.photos.length;
    });
    renderThumbs();
    redraw();
    setStatus(`${added} photo${added > 1 ? 's' : ''} loaded. Click a panel, then a thumbnail to place it.`);
  }
  e.target.value = '';
});

SAMPLES.forEach((sample) => {
  const btn = document.getElementById(`sample-${sample.name.split(' ')[0].toLowerCase()}`);
  if (btn) {
    btn.addEventListener('click', async () => {
      const photo = library.photos.find((p) => p.name === sample.name);
      if (!photo) return;
      const panel = state.panels[state.selected];
      if (panel) {
        panel.photo = library.photos.indexOf(photo);
        panel.zoom = 1;
        panel.ox = 0;
        panel.oy = 0;
      }
      redraw();
      setStatus(`${sample.name} placed on panel ${state.selected + 1}.`);
    });
  }
});

document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById('tagline').addEventListener('input', (e) => {
  state.tagline = e.target.value;
  redraw();
});
document.getElementById('frameToggle').addEventListener('change', (e) => {
  state.frame = e.target.checked;
  redraw();
});
document.getElementById('grainToggle').addEventListener('change', (e) => {
  state.grain = e.target.checked;
  redraw();
});
zoomInput.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  if (!panel) return;
  panel.zoom = Number(zoomInput.value) / 100;
  redraw();
});
document.getElementById('centerPanel').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  if (!panel) return;
  panel.zoom = 1;
  panel.ox = 0;
  panel.oy = 0;
  redraw();
});
document.getElementById('fillAll').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  if (!panel || panel.photo < 0) return;
  state.panels.forEach((p) => {
    p.photo = panel.photo;
  });
  redraw();
  setStatus('Every panel now uses the same photo.');
});
document.getElementById('export').addEventListener('click', async () => {
  try {
    await exportOne(state.size);
    setStatus(`Saved vice-cover-${SIZES[state.size].w}x${SIZES[state.size].h}.png`);
  } catch (err) {
    setStatus('Export failed. Try again.');
  }
});
document.getElementById('exportAll').addEventListener('click', async () => {
  try {
    for (const id of SIZE_IDS) {
      await exportOne(id);
      await new Promise((r) => setTimeout(r, 300));
    }
    setStatus('Saved all three sizes.');
  } catch (err) {
    setStatus('Export failed. Try again.');
  }
});

let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}
function panelAt(x, y) {
  const rects = panelsFor(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = panelAt(p.x, p.y);
  if (i < 0) return;
  state.selected = i;
  updatePanelUI();
  const panel = state.panels[i];
  drag = { x: p.x, y: p.y, ox: panel.ox, oy: panel.oy, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[state.selected];
  if (!panel) return;
  const dx = p.x - drag.x;
  const dy = p.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  panel.ox = drag.ox + dx;
  panel.oy = drag.oy + dy;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});

buildPicker(
  'layoutPicker',
  LAYOUT_IDS.map((id) => ({ id, label: LAYOUTS[id].name })),
  state.layout,
  setLayout,
);
buildPicker(
  'gradePicker',
  GRADES.map((g) => ({ id: g.id, label: g.name, swatch: g.accent })),
  state.grade,
  setGrade,
);
buildPicker(
  'sizePicker',
  SIZE_IDS.map((id) => ({ id, label: SIZES[id].label })),
  state.size,
  setSize,
);

library.onChange(renderThumbs);

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (setup) => {
    state.layout = setup.layout;
    state.grade = setup.grade;
    state.size = setup.size;
    state.title = setup.caption;
    state.subtitle = setup.subtitle;
    state.tagline = setup.tagline;
    state.frame = setup.frame;
    state.grain = setup.grain;
    const photo = await loadImage(`samples/${setup.photo}.png`);
    library.photos.splice(0, library.photos.length);
    library.photos.push({ img: photo, name: setup.photo, url: `samples/${setup.photo}.png` });
    const extra = setup.extra ? await loadImage(`samples/${setup.extra}.png`) : null;
    if (extra) library.photos.push({ img: extra, name: setup.extra, url: `samples/${setup.extra}.png` });
    state.panels = freshPanels(state.layout, library.photos.length);
    if (setup.assign) {
      setup.assign.forEach((photoIndex, i) => {
        if (state.panels[i]) state.panels[i].photo = photoIndex;
      });
    }
    if (setup.zoom) {
      setup.zoom.forEach((z, i) => {
        if (state.panels[i]) state.panels[i].zoom = z;
      });
    }
    redraw();
    syncPickers();
  });
} else {
  (async () => {
    for (const sample of SAMPLES) {
      try {
        await library.addSample(sample.name, sample.url);
      } catch (err) {
        /* a missing sample just leaves the library shorter */
      }
    }
    state.panels = freshPanels(state.layout, library.photos.length);
    renderThumbs();
    redraw();
    setStatus('Loaded the three sample scenes. Add your own photos to begin.');
  })();
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => redraw());
}
