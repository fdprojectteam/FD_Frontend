/**
 * Superseded — the booking not-found boundary now lives one segment up, at
 * `app/(public)/booking/not-found.tsx`.
 *
 * `notFound()` is thrown by `[productId]/layout.tsx`, and a layout's throw is
 * caught by the **parent** segment's boundary rather than its own — a segment's
 * `not-found.tsx` handles the pages beneath it, not the layout that wraps them.
 * The parent boundary is therefore the one that renders.
 *
 * This file re-exports it rather than duplicating the markup, so whichever
 * boundary Next selects, there is exactly one implementation and one piece of
 * copy to maintain.
 *
 * **Safe to delete.** It is kept only because this environment cannot remove
 * files; deleting it changes no behaviour.
 */
export { default } from '../not-found';
