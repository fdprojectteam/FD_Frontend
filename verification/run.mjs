/**
 * M2.5 verification runner.
 *
 * Layers, in the order they run:
 *   1. Unit      — the pure URL/param/label modules, executed as shipped
 *   2. Invariant — static probes over the shipped source (comments stripped)
 *   3. Runtime   — the real components in a DOM, served by the project's own
 *                  MSW handlers, driven through complete user journeys
 *
 * Nothing here re-implements application logic. Every module under test is
 * imported from `src/`; the single substitution is `next/navigation`.
 *
 *   node verification/run.mjs            # everything
 *   node verification/run.mjs unit       # one layer
 */
import { report, section } from './lib/assert.mjs';

const only = process.argv[2];
const wants = (layer) => !only || only === layer;

// Suites are imported lazily: `verify unit` should not pay to load jsdom, and
// `verify boundaries` should not load it at all. Static imports made every
// layer as slow as the slowest one.
if (wants('unit')) await (await import('./suites/units.mjs')).runUnitSuite();
if (wants('invariants')) await (await import('./suites/invariants.mjs')).runInvariantSuite();
if (wants('boundaries')) await (await import('./suites/boundaries.mjs')).runBoundarySuite();
if (wants('journeys')) await (await import('./suites/journeys.mjs')).runJourneySuite();

section('Result');
process.exit(report() ? 0 : 1);
