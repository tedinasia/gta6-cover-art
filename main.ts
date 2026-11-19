// Vice Cover Lab — the entry program (Node 22, standard library only).
//
// It hands the app in: it copies the static app (app/) and the screenshots
// (screenshots/) from beside this file into the output directory and writes
// dossier.json there, the summary the judge reads, with the vendored make.fun
// library. Run it locally with MAKEFUN_OUTPUT_DIR set:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// In the grader the output directory is /output. The program runs twice and
// both runs must write the same bytes, so it writes only deterministic files.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });

const shotsDir = join(outDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsDir, { recursive: true });
}

// The gate's caps (reference/gate.json): text_max_bytes shapes the dossier
// text; the other caps refuse an entry the scorer would refuse.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
