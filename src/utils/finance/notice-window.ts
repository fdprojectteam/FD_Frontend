/**
 * How far ahead the platform starts calling a maturity "soon".
 *
 * ## Why it sits at platform level
 *
 * Two surfaces answer the same question and must not disagree: the portfolio's
 * attention area and the maturity screen say a deposit is maturing soon, and
 * the notification layer raises it. Three copies of `3` is how one screen starts
 * warning a month before another.
 *
 * Three months is the window a fixed-deposit holder can actually act in —
 * long enough to decide about renewal, short enough that the warning still
 * means something when it appears.
 */
export const MATURING_SOON_MONTHS = 3;

/** When a maturity is close enough that the decision is now, in days. */
export const MATURITY_DUE_DAYS = 7;
