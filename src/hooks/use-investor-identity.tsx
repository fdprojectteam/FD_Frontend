'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { KYC_METHODS, createInvestorIdentityService } from '@/services/investor';
import type { InvestorIdentity } from '@/types/investor';
import { deriveKycReadiness, type KycReadiness } from '@/utils/kyc/readiness';

/**
 * The investor's identity and what the platform still needs from them.
 *
 * ## One hook, every module
 *
 * It lives in `hooks/` rather than in Booking because doc 11 lists the Investor
 * domain as used by Booking, Portfolio and Support alike. Portfolio will read
 * this same hook and get the same answer; there is no second copy of identity
 * state to drift.
 *
 * ## Readiness is derived here, once
 *
 * The screen receives an answer, not the inputs to one. That keeps
 * `deriveKycReadiness` — which decides what an investor is asked for — with a
 * single call site, and keeps the rule out of the component that draws it.
 */
export interface InvestorIdentityState {
  identity: InvestorIdentity | null;
  readiness: KycReadiness | null;
  isPending: boolean;
  isError: boolean;
}

export function useInvestorIdentity(): InvestorIdentityState {
  const service = useMemo(() => createInvestorIdentityService(), []);

  const { data, isPending, isError } = useQuery({
    queryKey: ['investor', 'identity'],
    queryFn: () => service.findCurrent(),
  });

  const identity = data ?? null;

  /*
    `null` readiness for an investor with no record at all, rather than a
    readiness object full of absences. The screen branches on the identity being
    missing, which is a different situation from an identity that is incomplete.
  */
  const readiness = useMemo(
    () => (identity === null ? null : deriveKycReadiness(identity, KYC_METHODS)),
    [identity],
  );

  return { identity, readiness, isPending, isError };
}
