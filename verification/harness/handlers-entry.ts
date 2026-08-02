/**
 * Handler entry — the project's own MSW handlers, unmodified.
 *
 * The harness must not hand-roll fixtures: filters are honoured server-side,
 * and a stub that filtered client-side would pass while the real contract was
 * broken (M2.5 gaps G1 and G2 are exactly that failure mode).
 */
export { handlers } from '@/mocks/handlers';
