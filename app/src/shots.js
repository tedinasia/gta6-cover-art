// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows one exported cover alone, drawn by the app at
// the export size. `photo` picks the sample, `caption` the title words, and
// `layout`, `grade`, `size`, `subtitle`, `extra` and `assign` shape the scene.
// window.__shotReady is set once the cover is painted.

const SCENES = {
  cover: {
    layout: 'quad',
    grade: 'sunset',
    size: 'wide',
    photo: 'boulevard',
    caption: 'Neon Shore',
    subtitle: 'Vice City nights',
    tagline: 'Est. 2026',
    frame: true,
    grain: true,
  },
  editor: {
    layout: 'hero',
    grade: 'neon',
    size: 'square',
    photo: 'neon',
    caption: 'Night Shift',
    subtitle: 'Vice City nights',
    tagline: 'Est. 2026',
    frame: true,
    grain: true,
  },
};

export async function runShot(shot, query, load) {
  const base = SCENES[shot] ?? SCENES.cover;
  const setup = {
    layout: query.get('layout') ?? base.layout,
    grade: query.get('grade') ?? base.grade,
    size: query.get('size') ?? base.size,
    photo: query.get('photo') ?? base.photo,
    caption: query.get('caption') ?? base.caption,
    subtitle: query.get('subtitle') ?? base.subtitle,
    tagline: query.get('tagline') ?? base.tagline,
    frame: query.get('frame') !== '0',
    grain: query.get('grain') !== '0',
    extra: query.get('extra') ?? null,
    assign: query.get('assign') ? query.get('assign').split(',').map(Number) : null,
    zoom: query.get('zoom') ? query.get('zoom').split(',').map(Number) : null,
  };
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await load(setup);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
