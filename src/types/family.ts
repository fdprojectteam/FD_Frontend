/**
 * Who is in the family, and nothing else about them.
 *
 * ## The model is deliberately thin
 *
 * A member is a **name, a relationship and where their holdings come from**.
 * There is no PAN here, no Aadhaar, no date of birth, no address, no bank
 * account and no KYC record — not because they are inconvenient to carry, but
 * because family membership is not consent to see someone's identity documents.
 * A type that cannot hold those cannot leak them, which is the same discipline
 * `ExternalBankAccount` applies to account numbers.
 *
 * ## Nobody here has authenticated
 *
 * This build has no authentication and no multi-user infrastructure. A member
 * other than the primary one is **demonstration data**, and `isDemo` says so on
 * the record rather than in a comment — every screen reads it and labels the
 * member accordingly. Pretending a spouse had signed in would be the single
 * most misleading thing this module could do.
 *
 * ## The seam this leaves
 *
 * ```
 * Family → Member → consent / permission → permitted financial information
 * ```
 *
 * `FamilyMemberSource` is where that arrives: today it is either the primary
 * investor's own portfolio or a demonstration set, and a linked, consented
 * member becomes a third member of the union with the infrastructure that
 * justifies it — never a relabelling of a demo.
 */

/** How the member is related to the primary investor. Display vocabulary only. */
export type FamilyRelationship = 'self' | 'spouse' | 'child' | 'parent' | 'other';

/**
 * What the member can do. Two roles, because two is what this build supports.
 *
 * `primary` is the authenticated investor — the only real person here. Everyone
 * else is a `member`, which in this build means "shown, never acted as".
 */
export type FamilyMemberRole = 'primary' | 'member';

/**
 * Where a member's holdings come from.
 *
 * - `primary-portfolio` — the canonical portfolio store; the investor's own.
 * - `demo` — a demonstration set that exists only to show what a family looks
 *   like. Never written to the portfolio store, so it cannot contaminate the
 *   investor's own totals anywhere else in the product.
 */
export type FamilyMemberSource = 'primary-portfolio' | 'demo';

export interface FamilyMember {
  id: string;
  /** What the family calls them. Not a legal name and not matched to one. */
  displayName: string;
  relationship: FamilyRelationship;
  role: FamilyMemberRole;
  source: FamilyMemberSource;
  /** True for anyone whose data is demonstration data. Always shown as such. */
  isDemo: boolean;
}

/**
 * A goal the family is saving towards.
 *
 * ## Why it names deposits rather than computing them
 *
 * The Goal Planner recommends; it does not record. **Nothing in this build ties
 * a confirmed deposit back to the goal it was opened for** — Booking never asks
 * and never stores it. So a family goal states which deposits count towards it
 * by reference, and progress is the sum of *those* deposits' actual principal.
 *
 * The alternative — attributing every deposit a member holds to whichever goal
 * looks plausible — would be the dashboard inventing a link the platform does
 * not have. A goal with no linked deposits says so instead of showing ₹0 as
 * though it were a measurement.
 *
 * No allocation, ranking or recommendation happens here. That engine lives in
 * Goal-Based FD and this module does not reimplement any part of it.
 */
export interface FamilyGoal {
  id: string;
  label: string;
  /** What the family is aiming for, in rupees. Declared, not derived. */
  targetAmount: number;
  /** The member this goal belongs to, or `null` for a shared family goal. */
  memberId: string | null;
  /**
   * Bank references of the deposits that count towards it.
   *
   * A reference naming a deposit nobody holds contributes nothing — the goal
   * simply shows less progress, which is the honest outcome.
   */
  contributingReferences: readonly string[];
  isDemo: boolean;
}

/** The family, as this build knows it. */
export interface FamilyComposition {
  members: readonly FamilyMember[];
  goals: readonly FamilyGoal[];
}
