import { CalendarDays, Coins, Gift, Percent, PiggyBank, Target, UserCheck } from 'lucide-react';

import type { CompareRowId } from '../types/compare';

/**
 * CompareRowIcon — the glyph beside each attribute label (M2.8 design pass).
 *
 * **Purely decorative.** Every icon is `aria-hidden`: the label beside it
 * already names the attribute, and a screen reader announcing "percent,
 * Interest Rate" would be worse than silence. It exists so a reader scanning
 * seven rows can find the one they care about by shape rather than by reading.
 *
 * **Why the map lives here and not with the row model.** `compare-rows.ts` is a
 * pure module that imports no React — an invariant, and the probe enforcing it
 * matches any import path containing "react", which `lucide-react` does. So the
 * taxonomy that needs React components lives in `components/`, beside the views
 * that render it, while `COMPARE_ROW_EMPHASIS` (plain data) stays with the
 * model. Same rule, opposite sides of the boundary.
 *
 * Typed as a total `Record`, so a new row in `CompareRowId` fails to compile
 * until it is given an icon.
 */
const COMPARE_ROW_ICON: Record<CompareRowId, typeof Percent> = {
  interestRate: Percent,
  tenure: CalendarDays,
  minInvestment: Coins,
  interestEarned: PiggyBank,
  maturityValue: Target,
  benefits: Gift,
  eligibility: UserCheck,
};

export interface CompareRowIconProps {
  id: CompareRowId;
  className?: string;
}

export function CompareRowIcon({ id, className }: CompareRowIconProps) {
  const Icon = COMPARE_ROW_ICON[id];

  return <Icon aria-hidden="true" className={className} />;
}
