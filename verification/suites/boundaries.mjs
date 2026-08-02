/**
 * Boundary suite — an executable equivalent of the architectural rules in
 * `eslint.config.mjs` (the `boundaries` plugin plus the restricted-import and
 * `process.env` rules).
 *
 * Why it exists: ESLint cannot complete in the audit environment — loading
 * `next/typescript` and its plugin graph from the mounted drive exceeds the
 * available time budget, the same constraint recorded in the M2.4 report.
 * Rather than report "not run" for the project's most important structural
 * rules, they are re-implemented here against the same policy table and
 * executed. This does **not** replace `npm run lint`, which must still pass
 * locally; `import/order` and the TypeScript rules are not covered here.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { check, section } from '../lib/assert.mjs';
import { ROOT } from '../lib/build.mjs';

const SRC = path.join(ROOT, 'src');

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const rel = (file) => path.relative(ROOT, file).replace(/\\/g, '/');

/** Import specifiers, including type-only imports and re-exports. */
function importsOf(text) {
  return [...text.matchAll(/(?:from|import)\s*'([^']+)'/g)].map((match) => match[1]);
}

/** The boundaries element type a file belongs to. */
function elementOf(file) {
  const match = /^src\/([^/]+)/.exec(file);
  const top = match?.[1];
  if (top === 'modules') return { type: 'module', name: file.split('/')[2] };
  if (top === 'app') return { type: 'app' };
  return { type: top ?? 'unknown' };
}

/** The element a specifier resolves to, or null for an external package. */
function targetOf(specifier, file) {
  if (specifier.startsWith('@/')) {
    const rest = specifier.slice(2);
    const top = rest.split('/')[0];
    if (top === 'modules') return { type: 'module', name: rest.split('/')[1] };
    return { type: top };
  }
  if (specifier.startsWith('.')) {
    const resolved = path.posix
      .normalize(path.posix.join(path.posix.dirname(file), specifier))
      .replace(/^\.\//, '');
    return elementOf(resolved);
  }
  return null;
}

const ALLOWED = {
  app: [
    'app',
    'module',
    'components',
    'layouts',
    'design-system',
    'hooks',
    'services',
    'store',
    'lib',
    'config',
    'constants',
    'types',
    'utils',
    'styles',
    'mocks',
  ],
  module: [
    'module',
    'components',
    'design-system',
    'hooks',
    'services',
    'store',
    'lib',
    'config',
    'constants',
    'types',
    'utils',
  ],
  components: ['components', 'design-system', 'hooks', 'lib', 'constants', 'types', 'utils'],
  layouts: [
    'layouts',
    'components',
    'design-system',
    'hooks',
    'store',
    'lib',
    'constants',
    'types',
    'utils',
  ],
  hooks: ['hooks', 'services', 'lib', 'config', 'constants', 'types', 'utils'],
  services: ['services', 'lib', 'config', 'constants', 'types', 'utils'],
  store: ['store', 'lib', 'constants', 'types', 'utils'],
  lib: ['lib', 'config', 'constants', 'types', 'utils'],
  config: ['config', 'constants', 'types'],
  constants: ['constants', 'types'],
  types: ['types'],
  utils: ['utils', 'constants', 'types'],
  'design-system': ['design-system'],
  mocks: ['mocks', 'lib', 'config', 'constants', 'types', 'utils', 'module'],
};

export async function runBoundarySuite() {
  const files = walk(SRC).map((file) => ({ file: rel(file), text: readFileSync(file, 'utf8') }));

  section('Boundaries · restricted imports');

  const axiosImporters = files
    .filter(({ text }) => importsOf(text).some((spec) => spec === 'axios'))
    .map(({ file }) => file);
  check('axios is imported only by the shared API client', axiosImporters, [
    'src/services/api/api-client.ts',
    'src/services/api/api-error.ts',
  ]);

  const mockImporters = files
    .filter(
      ({ file, text }) =>
        !file.startsWith('src/mocks/') &&
        importsOf(text).some((spec) => spec.startsWith('@/mocks')),
    )
    .map(({ file }) => file);
  check('mocks are imported only by the MSW bootstrap', mockImporters, ['src/app/providers.tsx']);

  const envReaders = files
    .filter(({ file, text }) => file !== 'src/config/env.ts' && /process\.env/.test(text))
    .map(({ file }) => file);
  check('process.env is read only by the validated env module', envReaders, []);

  section('Boundaries · element dependency policy');

  const crossModule = [];
  const illegal = [];

  for (const { file, text } of files) {
    const from = elementOf(file);
    const allowed = ALLOWED[from.type];
    if (!allowed) continue;

    for (const specifier of importsOf(text)) {
      const to = targetOf(specifier, file);
      if (!to || to.type === 'unknown') continue;

      if (from.type === 'module' && to.type === 'module' && to.name && to.name !== from.name) {
        crossModule.push(`${file} → ${specifier}`);
        continue;
      }
      if (!allowed.includes(to.type)) {
        illegal.push(`${file} → ${specifier}`);
      }
    }
  }

  check('no module imports a sibling module', crossModule, []);
  check('no file imports across a disallowed boundary', illegal, []);

  section('Boundaries · the new M2.5 files');

  const newFiles = [
    'src/modules/marketplace/components/filter-bar.tsx',
    'src/modules/marketplace/components/active-filters.tsx',
    'src/modules/marketplace/utils/list-params.ts',
    'src/modules/marketplace/utils/url-values.ts',
    'src/modules/marketplace/utils/filter-labels.ts',
  ];

  for (const target of newFiles) {
    const entry = files.find(({ file }) => file === target);
    check(`${target.split('/').pop()} exists`, Boolean(entry), true);
    if (!entry) continue;
    const specs = importsOf(entry.text);
    check(
      `${target.split('/').pop()} imports nothing from services, repositories, or the router`,
      specs.filter((spec) => /services|repositories|next\/navigation/.test(spec)),
      [],
    );
  }
}
