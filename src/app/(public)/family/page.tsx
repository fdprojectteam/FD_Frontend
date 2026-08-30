import type { Metadata } from 'next';

import { FamilyScreen } from '@/modules/family';

/**
 * The Family Dashboard — top-level, beside Portfolio rather than inside it.
 *
 * Portfolio answers "what do I own"; this answers "how is the family's money
 * organised", and it spans members rather than belonging to one. A server
 * component owning metadata and composition only; every figure is read and
 * derived in the screen.
 */
export const metadata: Metadata = {
  title: 'Family — FD Investment Platform',
  description:
    "How your family's fixed deposits, goals and upcoming maturities are organised, in one place.",
};

export default function FamilyPage() {
  return <FamilyScreen />;
}
