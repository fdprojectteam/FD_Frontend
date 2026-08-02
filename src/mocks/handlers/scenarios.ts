import { HttpResponse, delay } from 'msw';

/**
 * Mock scenarios (M2.1) — force error, empty, and slow responses without
 * code changes, using the approved query-param mechanism:
 *
 *   /api/v1/products?__scenario=error
 *   /api/v1/products?__scenario=empty
 *   /api/v1/products?__scenario=slow
 *   /api/v1/products?__scenario=invalid-amount
 *
 * These exist so M2.8 (loading / empty / error states) can be exercised
 * and demonstrated deterministically.
 */
export type Scenario = 'error' | 'empty' | 'slow' | 'invalid-amount';

const SLOW_DELAY_MS = 3_000;
const NORMAL_DELAY_MS = 250;

export function readScenario(url: URL): Scenario | null {
  const value = url.searchParams.get('__scenario');
  if (value === 'error' || value === 'empty' || value === 'slow' || value === 'invalid-amount') {
    return value;
  }
  return null;
}

/** Realistic latency so loading states are visible during development. */
export async function applyLatency(scenario: Scenario | null): Promise<void> {
  await delay(scenario === 'slow' ? SLOW_DELAY_MS : NORMAL_DELAY_MS);
}

export function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ success: false, message, error: { code, details: [] } }, { status });
}

/** Pre-built failures matching the Document 10 error contract. */
export const scenarioResponses = {
  serverError: () =>
    errorResponse(500, 'INTERNAL_ERROR', 'Unable to retrieve products. Please try again.'),
  invalidAmount: () =>
    errorResponse(422, 'INVALID_DEPOSIT_AMOUNT', 'Deposit amount must be greater than zero.'),
  productNotFound: () => errorResponse(404, 'PRODUCT_NOT_FOUND', 'Product not found.'),
};
