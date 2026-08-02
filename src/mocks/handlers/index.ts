import type { RequestHandler } from 'msw';

import { bankHandlers } from './banks';
import { productHandlers } from './products';

/**
 * MSW handler registry.
 *
 * Domain handlers are composed here; the worker bootstrap (T1.14) never
 * changes as modules are added.
 */
export const handlers: RequestHandler[] = [...productHandlers, ...bankHandlers];
