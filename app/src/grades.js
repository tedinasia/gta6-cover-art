// Colour grades: a canvas filter for the photo plus a tint gradient washed over
// it, in the Vice City sunset and neon palette. Each grade also names the accent
// colour the lettering and badges use.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    filter: 'saturate(1.35) contrast(1.06) brightness(1.03)',
    tint: { from: 'rgba(255, 126, 95, 0)', to: 'rgba(232, 67, 147, 0.30)' },
    accent: '#ff5c8a',
  },
  {
    id: 'neon',
    name: 'Neon',
    filter: 'saturate(1.55) contrast(1.12) brightness(1.02)',
    tint: { from: 'rgba(0, 240, 255, 0.10)', to: 'rgba(255, 45, 149, 0.34)' },
    accent: '#00f0ff',
  },
  {
    id: 'vice',
    name: 'Vice',
    filter: 'saturate(1.30) contrast(1.05) brightness(1.02)',
    tint: { from: 'rgba(124, 58, 237, 0.12)', to: 'rgba(219, 39, 119, 0.32)' },
    accent: '#c084fc',
  },
  {
    id: 'gold',
    name: 'Golden hour',
    filter: 'sepia(0.35) saturate(1.30) contrast(1.05) brightness(1.04)',
    tint: { from: 'rgba(251, 191, 36, 0.05)', to: 'rgba(234, 88, 12, 0.30)' },
    accent: '#fbbf24',
  },
  {
    id: 'noir',
    name: 'Noir',
    filter: 'grayscale(1) contrast(1.25) brightness(1.06)',
    tint: { from: 'rgba(255, 255, 255, 0.04)', to: 'rgba(0, 0, 0, 0.28)' },
    accent: '#e5e5e5',
  },
  {
    id: 'teal',
    name: 'Teal coast',
    filter: 'saturate(1.25) contrast(1.08) hue-rotate(-8deg)',
    tint: { from: 'rgba(45, 212, 191, 0.10)', to: 'rgba(249, 115, 22, 0.28)' },
    accent: '#2dd4bf',
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}
