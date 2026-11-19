// Panel layouts for the cover: each layout is a function of the canvas size that
// returns the panel rectangles in pixels. A thin gutter separates the panels, so
// the cover reads as one poster made of several framed shots.

function gutterOf(w, h) {
  return Math.max(6, Math.round(Math.min(w, h) * 0.016));
}

function quadPanels(w, h) {
  const g = gutterOf(w, h);
  const m = g;
  const pw = (w - 2 * m - g) / 2;
  const ph = (h - 2 * m - g) / 2;
  return [
    { x: m, y: m, w: pw, h: ph },
    { x: m + pw + g, y: m, w: pw, h: ph },
    { x: m, y: m + ph + g, w: pw, h: ph },
    { x: m + pw + g, y: m + ph + g, w: pw, h: ph },
  ];
}

function heroPanels(w, h) {
  const g = gutterOf(w, h);
  const m = g;
  const heroW = Math.round((w - 2 * m - g) * 0.62);
  const sideW = w - 2 * m - g - heroW;
  const sideH = (h - 2 * m - 2 * g) / 3;
  return [
    { x: m, y: m, w: heroW, h: h - 2 * m },
    { x: m + heroW + g, y: m, w: sideW, h: sideH },
    { x: m + heroW + g, y: m + sideH + g, w: sideW, h: sideH },
    { x: m + heroW + g, y: m + 2 * (sideH + g), w: sideW, h: sideH },
  ];
}

function fullPanels(w, h) {
  const g = gutterOf(w, h);
  const m = g;
  return [{ x: m, y: m, w: w - 2 * m, h: h - 2 * m }];
}

function ninePanels(w, h) {
  const g = gutterOf(w, h);
  const m = g;
  const pw = (w - 2 * m - 2 * g) / 3;
  const ph = (h - 2 * m - 2 * g) / 3;
  const cells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cells.push({ x: m + col * (pw + g), y: m + row * (ph + g), w: pw, h: ph });
    }
  }
  return cells;
}

export const LAYOUTS = {
  quad: { name: 'Quad', panels: 4, describe: 'Four panels, two by two', fn: quadPanels },
  hero: { name: 'Hero + 3', panels: 4, describe: 'One large hero, three stacked', fn: heroPanels },
  full: { name: 'Full bleed', panels: 1, describe: 'One photo, edge to edge', fn: fullPanels },
  nine: { name: 'Nine grid', panels: 9, describe: 'Nine panels, three by three', fn: ninePanels },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

/** Panel rectangles in pixels for a layout at a canvas size. */
export function panelsFor(layout, w, h) {
  const def = LAYOUTS[layout] ?? LAYOUTS.quad;
  return def.fn(w, h);
}

/** How many panels a layout holds. */
export function panelCount(layout) {
  return (LAYOUTS[layout] ?? LAYOUTS.quad).panels;
}
