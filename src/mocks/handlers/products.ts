import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { ProductSummaryDto } from '@/modules/marketplace/types';

import { buildProductDetails, findProductSummary, productSummaries } from '../data';
import { applyLatency, readScenario, scenarioResponses } from './scenarios';

/**
 * Product handlers (M2.1) — implement the Document 10 contract exactly:
 * envelope, pagination computed server-side, combinable filters, sorting,
 * search, and documented error codes. The UI cannot tell these apart from
 * a real backend.
 */
const DEFAULT_LIMIT = 6;

type SortField = 'interestRate' | 'tenureMonths' | 'minInvestment';

function matchesFilters(product: ProductSummaryDto, url: URL): boolean {
  const q = url.searchParams.get('q')?.trim().toLowerCase();
  const bank = url.searchParams.get('bank');
  const tenure = url.searchParams.get('tenureMonths');
  const minRate = url.searchParams.get('minRate');
  const amount = url.searchParams.get('amount');
  const category = url.searchParams.get('category');

  if (q && !`${product.bank.name} ${product.name}`.toLowerCase().includes(q)) return false;
  if (bank && product.bank.id !== bank) return false;
  if (tenure && product.tenureMonths !== Number(tenure)) return false;
  if (minRate && product.interestRate < Number(minRate)) return false;
  if (amount && product.minInvestment > Number(amount)) return false;
  if (category && !product.categories.includes(category as ProductSummaryDto['categories'][number]))
    return false;

  return true;
}

function sortProducts(items: ProductSummaryDto[], url: URL): ProductSummaryDto[] {
  const field = (url.searchParams.get('sort') ?? 'interestRate') as SortField;
  const order = url.searchParams.get('order') === 'asc' ? 1 : -1;

  return [...items].sort((a, b) => (a[field] - b[field]) * order);
}

export const productHandlers = [
  http.get(`${env.apiUrl}/products`, async ({ request }) => {
    const url = new URL(request.url);
    const scenario = readScenario(url);
    await applyLatency(scenario);

    if (scenario === 'error') return scenarioResponses.serverError();
    if (scenario === 'invalid-amount') return scenarioResponses.invalidAmount();

    // Batch fetch for the comparison screen.
    const ids = url.searchParams.get('ids');
    if (ids) {
      const requested = ids.split(',').filter(Boolean);
      // Detail-level payload (T2.7.1a): the approved comparison screen has an
      // Eligibility row, which exists only on the details shape. Unknown ids
      // are dropped rather than returned as holes — the compare screen relies
      // on that to correct its selection and its URL.
      const items = requested
        .map((id) => findProductSummary(id))
        .filter((item): item is ProductSummaryDto => Boolean(item))
        .map(buildProductDetails);

      return HttpResponse.json({
        success: true,
        message: 'Products retrieved successfully.',
        data: items,
      });
    }

    const filtered =
      scenario === 'empty' ? [] : productSummaries.filter((p) => matchesFilters(p, url));
    const sorted = sortProducts(filtered, url);

    const page = Math.max(Number(url.searchParams.get('page') ?? 1), 1);
    const limit = Math.max(Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT), 1);
    const total = sorted.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    return HttpResponse.json({
      success: true,
      message: 'Products retrieved successfully.',
      data: sorted.slice(start, start + limit),
      meta: { page, limit, total, totalPages },
    });
  }),

  http.get(`${env.apiUrl}/products/:id`, async ({ params, request }) => {
    const url = new URL(request.url);
    const scenario = readScenario(url);
    await applyLatency(scenario);

    if (scenario === 'error') return scenarioResponses.serverError();

    const summary = findProductSummary(String(params.id));
    if (!summary) return scenarioResponses.productNotFound();

    return HttpResponse.json({
      success: true,
      message: 'Product retrieved successfully.',
      data: buildProductDetails(summary),
    });
  }),
];
