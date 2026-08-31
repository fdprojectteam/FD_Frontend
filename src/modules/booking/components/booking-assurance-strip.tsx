import { FlaskConical, KeyRound, ListChecks } from 'lucide-react';

import { Card } from '@/components/ui/card';

import type { BookingAssurance, BookingAssuranceId } from '../types/booking';

/**
 * BookingAssuranceStrip — the three reassurance cards in the screen header
 * (T3.1, approved screen 01).
 *
 * **Why not `TrustIndicatorList`.** The platform's trust component renders
 * `TrustIndicator` badges, and that type's ids are a closed union of catalogue
 * signals — RBI Regulated, DICGC Insured, AAA Rating. These are different
 * statements: platform-level assurances with a title *and* a supporting line,
 * rendered as cards. Widening the shared union to fit them would change a
 * platform type for one screen's copy, and would put "24x7 Support" in the same
 * vocabulary as a bank's credit rating.
 *
 * ## The icons carry as much of the claim as the words
 *
 * A shield and a green tick say *verified* whatever the label beside them says,
 * which is how three unsupported reassurances read as credible for as long as
 * they did. The marks now describe the statement rather than decorating it: a
 * checklist for terms shown, a key for the credential never asked for, and a
 * flask for the part of this build that is a demonstration.
 *
 * Presentation-only: no state, no data access, no calculation. Icons are
 * resolved from ids here rather than carried in the data, so the payload stays
 * serialisable when it comes from the API.
 */
const ICONS: Record<BookingAssuranceId, typeof ListChecks> = {
  'terms-first': ListChecks,
  'no-credentials': KeyRound,
  demonstration: FlaskConical,
};

export interface BookingAssuranceStripProps {
  assurances: BookingAssurance[];
}

export function BookingAssuranceStrip({ assurances }: BookingAssuranceStripProps) {
  return (
    /*
      One column below `md`, three from it. No `sm:` or `lg:` variants exist in
      this theme — `@theme` resets breakpoints and defines only `md` and `xl` —
      so a `sm:grid-cols-2` here would silently generate nothing.
    */
    <ul className="grid list-none grid-cols-1 gap-4 md:grid-cols-3">
      {assurances.map((assurance) => {
        const Icon = ICONS[assurance.id];

        return (
          <li key={assurance.id}>
            <Card variant="outlined" className="flex h-full items-center gap-3 p-4">
              <span className="bg-surface-brand-subtle text-content-brand flex size-10 shrink-0 items-center justify-center rounded-full">
                <Icon aria-hidden="true" className="size-5" />
              </span>

              {/*
                `min-w-0` so a long title truncates inside the card instead of
                pushing the grid wider than the viewport — the failure that only
                shows up on a 320px device.
              */}
              <div className="flex min-w-0 flex-col">
                <p className="text-body text-content font-semibold">{assurance.title}</p>
                <p className="text-caption text-content-muted">{assurance.description}</p>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
