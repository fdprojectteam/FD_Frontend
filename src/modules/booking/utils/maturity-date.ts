/**
 * Booking's view of the platform's maturity-date utilities.
 *
 * The calculation moved to `@/utils/finance/maturity-date` when Portfolio began
 * needing the same answer: two modules cannot import each other, and two copies
 * of "when does this mature" is one too many. This re-export keeps every
 * existing Booking call site unchanged.
 */
export { formatMaturityDate, maturityDate, monthsUntil } from '@/utils/finance/maturity-date';
