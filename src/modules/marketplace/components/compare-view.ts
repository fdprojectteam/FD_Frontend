import type { CompareRow } from '../types/compare';
import type { ProductDetails } from '../types/product';

/**
 * What the two comparison presentations share (M2.7, T2.7.5): the props
 * contract they both take, and the approved highlight treatment they both
 * apply.
 *
 * The contract both comparison presentations take (decision F2).
 *
 * `products` and `rows` are parallel arrays sharing an index: the header, the
 * remove control and the Select come from `products[j]`, the values from
 * `rows[i].values[j]`. Travelling as one prop group — from the single place
 * that derives them — is what stops one bank's rate appearing under another
 * bank's name, which is wrong data that looks entirely right.
 *
 * A shared type rather than two identical declarations, so "both views take the
 * same contract" is checkable rather than merely true today.
 */
export interface CompareViewProps {
  /**
   * Products whose minimum investment the entered deposit amount does not
   * reach (client change request, 2026-08-02).
   *
   * Derived by `CompareScreen`, never here: the views are told *which* columns
   * fall short, they do not decide it. The returns for those columns are still
   * shown and are arithmetically correct — what the flag says is that the user
   * could not actually open that deposit with this amount, which is a different
   * statement from "this number is wrong".
   */
  belowMinimumIds?: string[];
  products: ProductDetails[];
  rows: CompareRow[];
  onRemove: (productId: string) => void;
  /**
   * The product the user has chosen to book, if any (Phase 3 entry).
   *
   * Comparison is one of the documented entry points into Booking (Screen
   * Inventory §Entry Points — *"user selects one of the compared products"*),
   * and this is that selection. Held by `CompareScreen` and passed down, so the
   * two presentations mark the same column and neither decides anything — the
   * ownership rule D-A5 stated when the control was still inert.
   */
  selectedProductId?: string | null;
  /** Reports which product the user picked. Navigation is the screen's. */
  onSelect?: (productId: string) => void;
}

/**
 * The approved winning-cell treatment (checklist C8), declared once.
 *
 * *Where* it is applied differs by presentation — the table tints the cell, the
 * card tints the whole row (checklist D4) — but *what* it is does not. It was
 * briefly declared in both view components as `BEST_CELL` and `BEST_ROW`, two
 * byte-identical strings, and that duplication is what allowed the two to
 * behave differently without anyone noticing: on desktop the brand colour and
 * the cell's own `text-content` met on one element and merged correctly, while
 * on mobile a child span re-declared a colour and quietly won.
 *
 * Consumed by exactly the two view components. Anything applying it elsewhere
 * is highlighting something the comparison model never called a winner.
 *
 * **Appearance only — never layout** (M2.8). A tinted block that filled the
 * cell edge-to-edge merged with the row beneath it and hid its own corners, so
 * the winner now reads as a *pill floating inside* its cell: `rounded-full`
 * plus one step of elevation. The padding and the display mode that make it
 * float belong to each view, because the table wraps a value and the card wraps
 * a row — the same reason the highlight was never allowed to carry layout.
 *
 * A rounded rectangle rather than a capsule, and no shadow: against a white
 * cell the tint alone reads as raised, and the elevation that helped on a page
 * background only muddied it inside a bordered table (design pass, 2026-08-01).
 */
export const BEST_HIGHLIGHT = 'bg-surface-brand-subtle text-content-brand rounded-lg font-semibold';
