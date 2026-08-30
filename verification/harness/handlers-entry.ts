/**
 * Handler entry — the project's own MSW handlers, unmodified.
 *
 * The harness must not hand-roll fixtures: filters are honoured server-side,
 * and a stub that filtered client-side would pass while the real contract was
 * broken (M2.5 gaps G1 and G2 are exactly that failure mode).
 */
export { handlers } from '@/mocks/handlers';

/**
 * The catalogue itself, so journeys can assert *derived* totals.
 *
 * A hard-coded "24 products" is an assertion about a fixture's size, and it
 * goes stale the moment the catalogue gains an entry — which is how a suite
 * ends up failing for a reason that is not a defect. Counting from the same
 * data the handlers serve keeps the assertion about the *screen*: what is
 * announced must equal what exists.
 */
export { productSummaries } from '@/mocks/data';
