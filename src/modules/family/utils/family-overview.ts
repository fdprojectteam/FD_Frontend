import type { FamilyComposition, FamilyGoal, FamilyMember } from '@/types/family';
import type { PortfolioHolding } from '@/types/portfolio';
import {
  buildMaturitySchedule,
  summarisePortfolio,
  type MaturityEntry,
  type PortfolioSummary,
} from '@/utils/portfolio';

/**
 * The family's financial position — aggregated, never recomputed.
 *
 * ## A read model, and only that
 *
 * Every figure here comes out of `summarisePortfolio` and
 * `buildMaturitySchedule`: the same two derivations the Portfolio dashboard and
 * the maturity screen use, promoted to the platform tier so a second module
 * could read them rather than copy them. This file contains **no interest
 * formula, no maturity-date arithmetic and no allocation logic**. It groups
 * holdings by member, adds up what the calculators returned, and sorts.
 *
 * That is the whole architectural claim of Module 12: the family view is a
 * projection, and Portfolio, Maturity and Goal-Based FD stay authoritative.
 *
 * ## Where each member's holdings come from
 *
 * The primary member's are the canonical portfolio — the real ones. Every other
 * member's are demonstration data supplied by the caller. They are added
 * together **only here**, and every total this produces reports how much of it
 * is demonstration data so a screen can say so rather than implying the
 * investor holds it.
 *
 * ## FD-first, not FD-only
 *
 * Grouping is by `PortfolioHolding`, whose `productType` is a discriminated
 * union with one member today. A second product family joins that union and
 * appears here without this file learning anything about it — nothing below
 * asks whether a holding is a fixed deposit.
 *
 * Pure and React-free; the caller supplies `now`.
 */

/** One member with the figures the family view states about them. */
export interface FamilyMemberPosition {
  member: FamilyMember;
  summary: PortfolioSummary;
  /** Deposits still held. The count a member card shows. */
  activeCount: number;
  totalPrincipal: number;
  totalMaturityValue: number;
  /** True when this member's figures are demonstration data. */
  isDemo: boolean;
}

/** A goal with progress measured from the deposits actually linked to it. */
export interface FamilyGoalProgress {
  goal: FamilyGoal;
  /** Sum of the principal of every linked deposit that is genuinely held. */
  contributed: number;
  targetAmount: number;
  /** 0–100, clamped. `null` when no deposit is linked — not zero progress. */
  percent: number | null;
  /** How many linked deposits were found. Zero means nothing is attributed yet. */
  linkedCount: number;
  /** The member it belongs to, or `null` for a shared goal. */
  member: FamilyMember | null;
}

export interface FamilyOverview {
  members: readonly FamilyMemberPosition[];
  goals: readonly FamilyGoalProgress[];
  /** Every member's upcoming maturities, soonest first, with whose they are. */
  upcomingMaturities: readonly { member: FamilyMember; entry: MaturityEntry }[];
  totalPrincipal: number;
  totalMaturityValue: number;
  activeDeposits: number;
  memberCount: number;
  goalCount: number;
  /** How much of `totalPrincipal` comes from demonstration members. */
  demoPrincipal: number;
  /** True when any figure above includes demonstration data. */
  includesDemoData: boolean;
  generatedAt: number;
}

export interface FamilyInputs {
  composition: FamilyComposition;
  /** The authenticated investor's own holdings, from the canonical store. */
  primaryHoldings: readonly PortfolioHolding[];
  /** Demonstration holdings, by member id. The caller reads the fixture. */
  demoHoldings: (memberId: string) => readonly PortfolioHolding[];
}

function holdingsFor(member: FamilyMember, inputs: FamilyInputs): readonly PortfolioHolding[] {
  return member.source === 'primary-portfolio'
    ? inputs.primaryHoldings
    : inputs.demoHoldings(member.id);
}

/**
 * Progress for one goal.
 *
 * Deliberately conservative: a linked reference that names no held deposit is
 * skipped rather than assumed, and a goal with nothing linked reports `null`
 * rather than `0`. Zero would read as a measurement — "you have saved nothing
 * towards this" — when the truth is that the platform has no way to know.
 */
function goalProgress(
  goal: FamilyGoal,
  members: readonly FamilyMemberPosition[],
  composition: FamilyComposition,
): FamilyGoalProgress {
  const held = members.flatMap((position) => position.summary.holdings.map((view) => view.holding));

  const linked = goal.contributingReferences
    .map((reference) => held.find((holding) => holding.reference === reference))
    .filter((holding): holding is PortfolioHolding => holding !== undefined);

  const contributed = linked.reduce((sum, holding) => sum + holding.principal, 0);

  return {
    goal,
    contributed,
    targetAmount: goal.targetAmount,
    percent:
      linked.length === 0 || goal.targetAmount <= 0
        ? null
        : Math.min(100, Math.round((contributed / goal.targetAmount) * 100)),
    linkedCount: linked.length,
    member:
      goal.memberId === null
        ? null
        : (composition.members.find((entry) => entry.id === goal.memberId) ?? null),
  };
}

export function buildFamilyOverview(
  inputs: FamilyInputs,
  now: number = Date.now(),
): FamilyOverview {
  const { composition } = inputs;

  const members: FamilyMemberPosition[] = composition.members.map((member) => {
    const summary = summarisePortfolio(holdingsFor(member, inputs), now);

    return {
      member,
      summary,
      activeCount: summary.activeCount,
      totalPrincipal: summary.totalPrincipal,
      totalMaturityValue: summary.totalMaturityValue,
      isDemo: member.isDemo,
    };
  });

  /*
    One schedule per member, then merged. Building a single schedule over the
    combined holdings would lose whose deposit each maturity is — and "whose"
    is the only thing the family view adds to the maturity screen.
  */
  const upcomingMaturities = members
    .flatMap((position) =>
      buildMaturitySchedule(position.summary, now).upcoming.map((entry) => ({
        member: position.member,
        entry,
      })),
    )
    .toSorted(
      (a, b) => (a.entry.view.maturesOn?.getTime() ?? 0) - (b.entry.view.maturesOn?.getTime() ?? 0),
    );

  const goals = composition.goals.map((goal) => goalProgress(goal, members, composition));

  const demoPrincipal = members
    .filter((position) => position.isDemo)
    .reduce((sum, position) => sum + position.totalPrincipal, 0);

  return {
    members,
    goals,
    upcomingMaturities,
    totalPrincipal: members.reduce((sum, position) => sum + position.totalPrincipal, 0),
    totalMaturityValue: members.reduce((sum, position) => sum + position.totalMaturityValue, 0),
    activeDeposits: members.reduce((sum, position) => sum + position.activeCount, 0),
    memberCount: members.length,
    goalCount: goals.length,
    demoPrincipal,
    includesDemoData: demoPrincipal > 0,
    generatedAt: now,
  };
}

/** The primary member's position, or `null` when the family has no primary. */
export function primaryPosition(overview: FamilyOverview): FamilyMemberPosition | null {
  return overview.members.find((position) => position.member.role === 'primary') ?? null;
}
