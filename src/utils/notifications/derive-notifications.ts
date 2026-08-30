import { ROUTES } from '@/constants/routes';
import type { AppNotification } from '@/types/notification';
import type { PortfolioHolding } from '@/types/portfolio';
import {
  MATURING_SOON_MONTHS,
  MATURITY_DUE_DAYS,
  maturityDate,
  monthsUntil,
} from '@/utils/finance';
import type { KycReadiness } from '@/utils/kyc/readiness';

/**
 * Everything the platform has to tell an investor, derived from what it knows.
 *
 * ## Derivation rather than a feed
 *
 * There is no event bus here and no notification table. Each notification is a
 * **statement about current domain state**: a deposit's maturity date makes
 * "matures in 40 days" true, and the same date makes it stop being true later.
 * Nothing has to be written, nothing goes stale, and a refresh cannot lose or
 * duplicate anything.
 *
 * The alternative — recording an event when something happens — would need a
 * writer at every lifecycle point and a store that could drift from the
 * holdings it describes. For state-shaped facts, deriving is both simpler and
 * more honest.
 *
 * ## Ids are stable, because read state depends on it
 *
 * `maturity-approaching:AXISFD…` is the same id on every render. An id built
 * from a timestamp would make every notification unread again each time the
 * page loaded.
 *
 * ## It states nothing the platform cannot support
 *
 * No notification claims a bank sent anything, credited anything, or will do
 * anything. Every one is marked `isSimulated`, because all of them are derived
 * from local state in a build with no bank integration — and the UI says so.
 *
 * Pure and React-free; the caller supplies `now`.
 */
export interface NotificationInputs {
  holdings: readonly PortfolioHolding[];
  /** `null` while the investor's record has not been read. */
  readiness: KycReadiness | null;
  investorId: string | null;
}

/** Newest first — the order a notification centre is read in. */
function byRecency(a: AppNotification, b: AppNotification): number {
  return b.occurredAt - a.occurredAt;
}

function identityNotifications(
  readiness: KycReadiness | null,
  investorId: string | null,
  now: number,
): AppNotification[] {
  if (readiness === null || investorId === null) return [];

  const subject = { kind: 'investor' as const, id: investorId };

  if (readiness.outcome === 'already-verified') {
    return [
      {
        id: 'identity-verified',
        category: 'identity',
        severity: 'success',
        title: 'Identity verified',
        body: 'Your details are confirmed. Nothing further is needed for now.',
        occurredAt: now,
        subject,
        isSimulated: true,
      },
    ];
  }

  /*
    One notification, whichever kind of attention is outstanding. Two — "confirm
    your details" and "some details are missing" — would be the same request
    twice for a customer with one thing to do.
  */
  const needsFields = readiness.outcome === 'collect-missing';

  return [
    {
      id: 'identity-attention',
      category: 'identity',
      severity: 'action',
      title: needsFields ? 'A few identity details are needed' : 'Confirm your identity details',
      body: needsFields
        ? 'Some details are missing before a deposit can be opened.'
        : 'Review the details we hold and confirm them to continue a booking.',
      occurredAt: now,
      subject,
      isSimulated: true,
    },
  ];
}

function maturityNotifications(holding: PortfolioHolding, now: number): AppNotification[] {
  const maturesOn = maturityDate(holding.startedAt, holding.tenureMonths);

  /* A term published in days has no maturity date, so there is nothing to say. */
  if (maturesOn === null) return [];

  const subject = { kind: 'holding' as const, id: holding.reference };
  const action = { label: 'View maturities', href: ROUTES.maturities };
  const bank = holding.bank.name;

  if (maturesOn.getTime() <= now) {
    return [
      {
        id: `maturity-due:${holding.reference}`,
        category: 'maturity',
        severity: 'action',
        title: `${bank} deposit has reached maturity`,
        /* The date has passed — that is all this knows. Settlement is the bank's. */
        body: 'The term has ended. Final handling is confirmed by the bank.',
        occurredAt: maturesOn.getTime(),
        subject,
        action,
        isSimulated: true,
      },
    ];
  }

  const monthsLeft = monthsUntil(maturesOn, now);
  if (monthsLeft > MATURING_SOON_MONTHS) return [];

  const daysLeft = Math.ceil((maturesOn.getTime() - now) / (24 * 60 * 60 * 1000));
  const isDue = daysLeft <= MATURITY_DUE_DAYS;

  return [
    {
      id: `maturity-approaching:${holding.reference}`,
      category: 'maturity',
      severity: 'action',
      title: isDue
        ? `${bank} deposit matures in ${String(daysLeft)} ${daysLeft === 1 ? 'day' : 'days'}`
        : `${bank} deposit matures soon`,
      body:
        holding.maturityInstruction === null
          ? 'No maturity instruction is recorded for this deposit.'
          : 'Check the instruction that applies before it matures.',
      occurredAt: now,
      subject,
      action,
      isSimulated: true,
    },
  ];
}

export function deriveNotifications(
  { holdings, readiness, investorId }: NotificationInputs,
  now: number = Date.now(),
): AppNotification[] {
  const active = holdings.filter((holding) => holding.status === 'active');

  const bookings: AppNotification[] = active.map((holding) => ({
    id: `booking-confirmed:${holding.reference}`,
    category: 'booking',
    severity: 'success',
    title: `${holding.bank.name} deposit confirmed`,
    /* No amount: the portfolio owns that figure and this refers to it instead. */
    body: 'Your fixed deposit is open. You can see it in your portfolio.',
    occurredAt: holding.startedAt,
    subject: { kind: 'holding', id: holding.reference },
    action: { label: 'View portfolio', href: ROUTES.portfolio },
    isSimulated: true,
  }));

  const maturities = active.flatMap((holding) => maturityNotifications(holding, now));

  return [...identityNotifications(readiness, investorId, now), ...maturities, ...bookings].sort(
    byRecency,
  );
}

/** How many of these the investor has not seen. */
export function unreadCount(
  notifications: readonly AppNotification[],
  readIds: readonly string[],
): number {
  return notifications.filter((entry) => !readIds.includes(entry.id)).length;
}
