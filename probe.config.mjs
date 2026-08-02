import tsparser from '@typescript-eslint/parser';

const full = (await import('./eslint.config.mjs')).default;
const boundariesBlock = full.find((b) => b.plugins && b.plugins.boundaries);
const restricted = full.find(
  (b) => b.rules && b.rules['no-restricted-imports'] && b.files?.[0] === 'src/**/*.{ts,tsx}',
);
const lang = {
  parser: tsparser,
  parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
};

/**
 * Named before export: `import/no-anonymous-default-export` flags an
 * anonymous array default, and the M2.5 gate runs with --max-warnings 0.
 */
const probeConfig = [
  { ignores: ['node_modules/**', '.next/**'] },
  { ...boundariesBlock, languageOptions: lang },
  { ...restricted, languageOptions: lang },
];

export default probeConfig;
