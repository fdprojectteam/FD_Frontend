'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Animate a container between its natural heights.
 *
 * ## Why this hook exists at all
 *
 * It is the **one** thing CSS cannot do cross-browser. `@starting-style` and
 * `transition-behavior: allow-discrete` now cover enter and exit natively, and
 * fade, translate and stagger were always CSS — but animating to an intrinsic
 * height still needs `interpolate-size` / `calc-size()`, which are Chromium
 * only. Rather than adopt a motion library for that single gap, this measures
 * the height and hands it to the transition already declared in
 * `.ds-auto-height`.
 *
 * ## Domain-free by construction
 *
 * It knows nothing about goals, deposits or questions. It observes an element
 * and reports its height. Anything that changes size can use it.
 *
 * ## What it guarantees
 *
 * - **Content changes are observed, not guessed.** A `ResizeObserver` on the
 *   content element catches late layout — a web font landing, an image
 *   resolving, a validation message appearing — which a one-shot measurement
 *   on render would miss.
 * - **The first paint does not animate.** Height is applied without a
 *   transition on the first measurement, so a container does not unfold from
 *   zero when the page loads.
 * - **Rapid toggles cannot strand it.** Each change replaces the pending
 *   settle timer, and the container is only released back to `auto` once no
 *   further change has arrived. Interrupting mid-transition is safe: the
 *   transition simply retargets, because the height is a single custom
 *   property rather than a queued animation.
 * - **It stops entirely under reduced motion.** The height is applied with no
 *   transition and the animating flag is never set, so nothing is clipped and
 *   nothing moves. The three-line media query below is the guarantee; it does
 *   not rely on the global CSS reset.
 * - **It cleans up.** Observer disconnected and timer cleared on unmount, and
 *   the media query listener removed with it.
 *
 * ## Layout-thrash discipline
 *
 * The only read is `getBoundingClientRect().height`, taken inside the
 * `ResizeObserver` callback — which fires after layout, so the value is not
 * forced. The write is a custom property on a different element. There is no
 * read-write-read loop and no measurement in a render path.
 *
 * @example
 * const { containerRef, contentRef, containerProps } = useMeasuredHeight();
 * <div ref={containerRef} {...containerProps} className="ds-auto-height">
 *   <div ref={contentRef}>{children}</div>
 * </div>
 */

/** How long after the last size change the container is released back to `auto`. */
const SETTLE_MS = 250;

export interface MeasuredHeightResult {
  /** Attach to the element that should animate. Must carry `.ds-auto-height`. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Attach to the single child wrapping the content being measured. */
  contentRef: React.RefObject<HTMLDivElement | null>;
  /** Spread onto the container: carries the animating flag the CSS reads. */
  containerProps: { 'data-height-animating': 'true' | 'false' };
}

export function useMeasuredHeight(): MeasuredHeightResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  /* Drives the CSS flag. State rather than a ref because the DOM attribute must re-render. */
  const [animating, setAnimating] = useState(false);

  const measuredRef = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSettleTimer = useCallback(() => {
    if (settleTimer.current !== null) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    /*
      Read once and subscribe. `matchMedia` rather than a CSS-only guard because
      the hook must not merely animate faster under reduced motion — it must not
      set the animating flag at all, so nothing is ever clipped.
    */
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const apply = (height: number) => {
      /*
        The first measurement establishes the height; it must not animate, or
        every container would unfold from zero on load. Reduced motion takes the
        same path for every measurement.
      */
      const instant = !measuredRef.current || reducedMotion.matches;

      if (instant) {
        const previous = container.style.transitionDuration;
        container.style.transitionDuration = '0s';
        container.style.setProperty('--ds-measured-height', `${String(height)}px`);
        /* Flush the instant application before restoring the declared transition. */
        void container.offsetHeight;
        container.style.transitionDuration = previous;
        measuredRef.current = true;
        return;
      }

      container.style.setProperty('--ds-measured-height', `${String(height)}px`);
      setAnimating(true);

      /*
        `transitionend` is deliberately not used: it does not fire when the
        height is unchanged, and it fires per-property, so an interrupted
        transition can leave the flag stuck on. A timer that each change resets
        settles correctly however many changes arrive.
      */
      clearSettleTimer();
      settleTimer.current = setTimeout(() => {
        setAnimating(false);
        settleTimer.current = null;
      }, SETTLE_MS);
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      apply(entry.target.getBoundingClientRect().height);
    });

    observer.observe(content);

    /*
      A change in the preference mid-session must take effect immediately: the
      next measurement then applies instantly instead of transitioning.
    */
    const onPreferenceChange = () => {
      if (reducedMotion.matches) {
        clearSettleTimer();
        setAnimating(false);
      }
    };
    reducedMotion.addEventListener('change', onPreferenceChange);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', onPreferenceChange);
      clearSettleTimer();
    };
  }, [clearSettleTimer]);

  return {
    containerRef,
    contentRef,
    containerProps: { 'data-height-animating': animating ? 'true' : 'false' },
  };
}
