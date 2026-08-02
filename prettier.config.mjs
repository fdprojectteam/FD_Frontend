/**
 * House formatting style (Phase 0 Blueprint §4).
 * prettier-plugin-tailwindcss keeps utility class order deterministic,
 * eliminating class-order diff noise (Document 12 §14).
 */
const config = {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
