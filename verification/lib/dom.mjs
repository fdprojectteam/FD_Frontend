/**
 * jsdom environment for the runtime suite.
 *
 * Only browser APIs jsdom genuinely lacks are stubbed — never application
 * behaviour. `scrollIntoView` and `ResizeObserver` are absent from jsdom but
 * present in every real browser; stubbing them keeps the components under
 * test unmodified.
 */
import { JSDOM } from 'jsdom';

export function createDom() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });

  const { window } = dom;

  window.Element.prototype.scrollIntoView = function scrollIntoView() {};
  // jsdom has no scrolling; the compare carousel calls this on its scroller.
  window.Element.prototype.scrollTo = function scrollTo() {};
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia =
    window.matchMedia ??
    (() => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));

  /**
   * Copy the browser globals wholesale rather than from an allowlist. React,
   * Radix, and axios each reach for a different corner of the DOM API
   * (HTMLFormElement, PointerEvent, getComputedStyle…), and a partial copy
   * fails as a crash inside a component — which reads like an application
   * defect but is a harness defect.
   *
   * Skipped: globals whose Node implementations must win. `fetch` and the
   * timer functions stay Node's so msw/node keeps its interception, and
   * `global`/`globalThis` are not re-pointed.
   */
  const skip = new Set([
    'window',
    // `self` is deliberately NOT skipped: Node does not define it, and Next's
    // bundled runtime (`next/link` among others) reads it. Skipping it left it
    // undefined and every Link threw on render.
    'top',
    'parent',
    'frames',
    'globalThis',
    'global',
    'fetch',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'queueMicrotask',
    'structuredClone',
    'console',
    'process',
    'Buffer',
    'crypto',
    'performance',
  ]);

  Object.defineProperty(globalThis, 'window', {
    value: window,
    configurable: true,
    writable: true,
  });

  for (const key of Object.getOwnPropertyNames(window)) {
    if (skip.has(key)) continue;
    let value;
    try {
      value = window[key];
    } catch {
      continue;
    }
    if (value === undefined) continue;
    // Node defines some of these (navigator) as getter-only on globalThis,
    // so assignment throws; defineProperty replaces them cleanly.
    try {
      Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    } catch {
      /* non-configurable global — Node's wins, which is what we want */
    }
  }

  globalThis.IS_REACT_ACT_ENVIRONMENT = false;

  return dom;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Polls until `predicate` returns a truthy value.
 *
 * The mock handlers apply deliberate latency (250 ms), and the M2.4 audit
 * recorded a false failure caused by an assertion window shorter than that —
 * the application was right and the harness was wrong. The window here is
 * generous on purpose.
 */
export async function waitFor(predicate, { timeout = 6000, interval = 20, label = '' } = {}) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeout) {
    last = predicate();
    if (last) return last;
    await sleep(interval);
  }
  throw new Error(`waitFor timed out${label ? `: ${label}` : ''}`);
}

/** Lets React flush effects and microtasks without asserting anything. */
export async function settle(ms = 60) {
  await sleep(ms);
}
