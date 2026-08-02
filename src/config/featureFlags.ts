import { env } from './env';

/**
 * Typed feature flags, derived exclusively from validated env config.
 * Only flags defined in the approved blueprint exist here — new flags
 * require a blueprint update, not an ad-hoc addition.
 */
export const featureFlags = {
  /** MSW mock API layer (Document 11 §16): on in development, off in production. */
  mocks: env.enableMocks,
} as const;

export type FeatureFlags = typeof featureFlags;
