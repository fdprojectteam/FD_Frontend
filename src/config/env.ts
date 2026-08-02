import { z } from 'zod';

/**
 * Environment configuration — the ONLY file allowed to read process.env
 * (enforced by ESLint). Validated with Zod at first import: a missing or
 * malformed variable fails loudly at startup instead of quietly at request
 * time (Phase 0 Blueprint §4).
 *
 * NEXT_PUBLIC_* values are inlined at build time by Next.js, so each key
 * must be referenced statically below — never dynamically.
 */

const envSchema = z.object({
  /** Base URL for the versioned API (Document 10 §2). Required. */
  NEXT_PUBLIC_API_URL: z
    .string({ error: 'NEXT_PUBLIC_API_URL is required (e.g. "/api/v1")' })
    .min(1, 'NEXT_PUBLIC_API_URL must not be empty'),

  /** Deployment environment (Document 02 §21). */
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'development', 'staging', 'production']).default('local'),

  /** Master switch for the MSW mock layer (Document 11 §16). */
  NEXT_PUBLIC_ENABLE_MOCKS: z.enum(['true', 'false']).default('false'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_ENABLE_MOCKS: process.env.NEXT_PUBLIC_ENABLE_MOCKS,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Invalid environment configuration. Fix the following variables (see .env.example):\n${details}`,
  );
}

/** The single typed environment object consumed platform-wide. */
export const env = {
  apiUrl: parsed.data.NEXT_PUBLIC_API_URL,
  appEnv: parsed.data.NEXT_PUBLIC_APP_ENV,
  enableMocks: parsed.data.NEXT_PUBLIC_ENABLE_MOCKS === 'true',
} as const;

export type Env = typeof env;
