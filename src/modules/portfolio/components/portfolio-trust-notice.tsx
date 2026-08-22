import { SafetyNote } from '@/components/business';

/**
 * The trust strip that closes the page.
 *
 * ## Why it reuses `SafetyNote` rather than writing its own line
 *
 * That component is the platform's single statement about deposit insurance,
 * and it is used at recommendation and at booking. A second wording here would
 * be a second version of a compliance sentence — the exact drift the shared
 * component exists to prevent, and invisible until someone reads both screens.
 *
 * ## Why it names no coverage figure
 *
 * The statutory DICGC limit is public, but whether a *particular* deposit at a
 * *particular* bank is covered to it is not something the catalogue models, and
 * the client document requires DICGC treatment to be verified from official
 * sources before production. So the note states that terms apply and are
 * subject to conditions, which is what is actually known. Printing an amount
 * beside an investor's own holdings would read as a guarantee about them.
 *
 * Server-rendered — it holds no state.
 */
export function PortfolioTrustNotice() {
  return (
    <div className="border-border-default rounded-card border-t pt-6">
      <SafetyNote />
    </div>
  );
}
