/**
 * "Finding FDs that fit your plan…" — shown while the catalogue is actually
 * in flight.
 *
 * Driven by React Query's real `isFetching`. If the answer is already cached it
 * resolves without this ever rendering, which is correct: pretending to work is
 * the thing this deliberately does not do. There is no artificial delay, no
 * typing animation, and no claim that anything is being "analysed".
 *
 * The three bars use the existing `animate-pulse-soft` loop — the same one every
 * skeleton on the platform uses — so the motion is already familiar and already
 * neutralised by the global reduced-motion reset.
 *
 * ## Why the offsets are no longer inline
 *
 * They were an inline `animationDelay` computed from the index — a duration
 * typed into a component, which is the thing the design system exists to
 * prevent. `ds-stagger` applies the token instead, so the bars offset by the
 * same interval every other sequence on the platform uses.
 *
 * The widths stay inline: they are a placeholder *shape*, not a design value,
 * and there is no token for "a bar that looks like a line of text".
 */
export function PlannerStatus() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4 py-4">
      <p className="text-body-lg text-content-muted">Finding FDs that fit your plan…</p>

      {/*
        The stages the engine genuinely runs, revealed in order via `ds-stagger`.

        **No timer drives this.** Every stage is on screen within ~240ms and the
        whole block disappears the instant the query resolves — so a cached
        answer never shows it at all. It describes work; it does not pace it.
      */}
      <ol className="ds-stagger text-caption text-content-muted flex list-none flex-col gap-1.5">
        {[
          'Understanding your goal',
          'Finding suitable deposits',
          'Comparing banks',
          'Checking deposit-insurance cover',
        ].map((stage) => (
          <li key={stage} className="motion-safe:animate-reveal flex items-center gap-2">
            <span aria-hidden="true" className="bg-surface-brand size-1.5 shrink-0 rounded-full" />
            {stage}
          </li>
        ))}
      </ol>
      <div aria-hidden="true" className="ds-stagger flex flex-col gap-2">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="bg-surface-muted motion-safe:animate-pulse-soft h-3 rounded-full"
            style={{ width: `${String(72 - index * 18)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
