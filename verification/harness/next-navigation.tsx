/**
 * next/navigation stub — the ONLY thing the runtime harness replaces.
 *
 * Everything else under test is the unmodified application: repository,
 * service, hooks, React Query, Radix, and every Marketplace component.
 *
 * It models a real history stack so the suites can assert things the
 * application actually promises:
 *   • how many times a user interaction wrote to the URL (rule 5)
 *   • that back/forward restore state without writing (I7 is write-only)
 *   • that a cold load never navigates
 */
import { useCallback, useSyncExternalStore } from 'react';

let stack: string[] = ['/'];
let index = 0;

const listeners = new Set<() => void>();

/** Every replace() the application performed, in order. */
export const replaceCalls: string[] = [];
/** Every push() the application performed. Marketplace Home should never push. */
export const pushCalls: string[] = [];

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot() {
  return stack[index] ?? '/';
}

/**
 * URLSearchParams identity is cached per URL, matching Next's memoised
 * ReadonlyURLSearchParams. A fresh object on every render would make every
 * downstream useMemo useless and could hide a re-render defect.
 */
const paramsCache = new Map<string, URLSearchParams>();

function paramsFor(url: string): URLSearchParams {
  let cached = paramsCache.get(url);
  if (!cached) {
    cached = new URLSearchParams(url.split('?')[1] ?? '');
    paramsCache.set(url, cached);
  }
  return cached;
}

export function useSearchParams(): URLSearchParams {
  const url = useSyncExternalStore(subscribe, snapshot, snapshot);
  return paramsFor(url);
}

export function usePathname(): string {
  const url = useSyncExternalStore(subscribe, snapshot, snapshot);
  return url.split('?')[0] ?? '/';
}

export function useRouter() {
  const replace = useCallback((href: string) => {
    replaceCalls.push(href);
    stack[index] = href;
    notify();
  }, []);

  const push = useCallback((href: string) => {
    pushCalls.push(href);
    stack = [...stack.slice(0, index + 1), href];
    index = stack.length - 1;
    notify();
  }, []);

  const back = useCallback(() => historyBack(), []);
  const forward = useCallback(() => historyForward(), []);

  return { replace, push, back, forward, refresh: () => {}, prefetch: () => {} };
}

/* ------------------------------------------------------------------ */
/* Harness controls (not part of the next/navigation surface)          */
/**
 * `notFound()`, as Next defines it: a throw the framework catches to render the
 * segment's not-found boundary.
 *
 * The harness has no boundary to render, and that is the point — a booking that
 * cannot resolve its deposit must *stop*, not fall through to a screen holding
 * a half-resolved product. A thrown error surfaces in the suite as a failure
 * rather than as a page that looks almost right.
 */
export class NotFoundError extends Error {
  constructor() {
    super('notFound() was called: the route resolved nothing.');
    this.name = 'NotFoundError';
  }
}

export function notFound(): never {
  throw new NotFoundError();
}

/* ------------------------------------------------------------------ */

export function resetHistory(url = '/') {
  stack = [url];
  index = 0;
  replaceCalls.length = 0;
  pushCalls.length = 0;
  notify();
}

export function currentUrl(): string {
  return snapshot();
}

/**
 * A user typing a URL / following a shared link: a *new* history entry that
 * the application did not write.
 */
export function visit(url: string) {
  stack = [...stack.slice(0, index + 1), url];
  index = stack.length - 1;
  notify();
}

export function historyBack() {
  if (index > 0) index -= 1;
  notify();
}

export function historyForward() {
  if (index < stack.length - 1) index += 1;
  notify();
}

export function historyStack(): { entries: string[]; index: number } {
  return { entries: [...stack], index };
}
