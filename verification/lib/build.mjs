/**
 * esbuild wiring for the harness.
 *
 * `@/` paths come from the project's own tsconfig, so the bundle resolves
 * imports exactly as Next does. `next/navigation` is the single alias.
 */
import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Bundle output location. Defaults to the project, but can be redirected —
 * writing a 2 MB bundle onto a slow network- or VM-mounted working copy is
 * pure overhead, and the bundles are disposable build artefacts.
 */
const OUT_DIR = process.env.VERIFY_OUT_DIR
  ? path.resolve(process.env.VERIFY_OUT_DIR)
  : path.join(ROOT, '.verification-build');

/** Mirrors .env.local; the harness needs an absolute base URL for msw/node. */
const define = {
  'process.env.NODE_ENV': '"development"',
  'process.env.NEXT_PUBLIC_API_URL': '"http://localhost/api/v1"',
  'process.env.NEXT_PUBLIC_APP_ENV': '"local"',
  'process.env.NEXT_PUBLIC_ENABLE_MOCKS': '"true"',
};

async function bundle(entry, outfile, platform) {
  const outPath = path.join(OUT_DIR, outfile);

  // Bundling the full application (React, Radix, React Query, axios) is the
  // slowest step by an order of magnitude. VERIFY_REUSE_BUNDLES lets a
  // re-run skip it when only the suite changed; CI should never set it.
  if (process.env.VERIFY_REUSE_BUNDLES === '1' && existsSync(outPath)) return outPath;

  await build({
    entryPoints: [path.join(ROOT, 'verification', 'harness', entry)],
    outfile: outPath,
    bundle: true,
    format: 'esm',
    platform,
    target: 'node20',
    jsx: 'automatic',
    tsconfig: path.join(ROOT, 'tsconfig.json'),
    alias: { 'next/navigation': path.join(ROOT, 'verification', 'harness', 'next-navigation.tsx') },
    define,
    logLevel: 'error',
  });
  return outPath;
}

export const buildUnits = () => bundle('units-entry.ts', 'units.mjs', 'node');
export const buildHandlers = () => bundle('handlers-entry.ts', 'handlers.mjs', 'node');
/**
 * The app bundles for the *browser* platform on purpose: that is how axios
 * selects its XHR adapter, which is what msw/node intercepts inside jsdom.
 */
export const buildApp = () => bundle('entry.tsx', 'app.mjs', 'browser');
