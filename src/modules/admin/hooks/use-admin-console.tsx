'use client';

import { useQuery } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useInvestorIdentity } from '@/hooks/use-investor-identity';
import { usePortfolio } from '@/hooks/use-portfolio';
import { useSupportRequests } from '@/hooks/use-support-requests';
import {
  DEMO_ADMINS,
  SESSION_CUSTOMER_ID,
  appendEvent,
  demoApplications,
  demoCustomers,
  readAdminRole,
  readJournal,
  writeAdminRole,
  type DemoKycState,
  type NewAuditEvent,
} from '@/services/admin';
import { createProductMasterRepository } from '@/services/product-master';
import type { AdminAuditEvent, AdminIdentity, AdminRole } from '@/types/admin';
import type { ProductMaster } from '@/types/product-master';

import {
  buildApplicationRows,
  buildAttention,
  buildCustomerRows,
  buildProposals,
  type AdminApplicationRow,
  type AdminCustomerRow,
} from '../utils/admin-projection';

/**
 * Everything the console reads, assembled once.
 *
 * ## It composes; it owns almost nothing
 *
 * The session investor's holdings come from the platform portfolio hook, their
 * identity from the investor hook, support requests from the support hook, and
 * the product catalogue from the platform's own `ProductMasterRepository` — the
 * same endpoint Marketplace reads. The only state Admin owns is the journal,
 * and every queue on top of it is a projection.
 *
 * ## Why a module hook rather than a platform one
 *
 * Nothing outside the admin portal needs any of this. A platform hook would put
 * an operations read model in everyone's reach for no benefit — the opposite of
 * why `usePortfolio` lives where it does.
 *
 * ## One instance, shared through a provider
 *
 * The state is created **once**, by the provider the admin layout mounts, and
 * every screen reads that instance. This is not a preference: the shell owns
 * the role selector and the screens enforce the role, so two independent
 * instances would let the header say "Auditor" while the page still rendered an
 * approve button. The same applies to the journal — an action recorded on one
 * screen has to be visible on the next without a reload.
 *
 * ## Clock
 *
 * One `now` for the whole console, taken once, so a queue, a dashboard count
 * and an audit timestamp cannot be measured from three different instants.
 */
export interface AdminConsole {
  role: AdminRole;
  admin: AdminIdentity;
  setRole: (role: AdminRole) => void;

  customers: readonly AdminCustomerRow[];
  applications: readonly AdminApplicationRow[];
  products: readonly ProductMaster[];
  proposals: ReturnType<typeof buildProposals>;
  attention: ReturnType<typeof buildAttention>;
  events: readonly AdminAuditEvent[];

  /** False until every client-side source has been read. */
  isLoaded: boolean;
  /** True when the product catalogue could not be fetched. */
  isProductsError: boolean;
  isProductsLoading: boolean;
  now: number;

  /** Records an action in the journal. The only write the console performs. */
  record: (event: NewAuditEvent) => void;
}

function useAdminConsoleState(): AdminConsole {
  const { holdings, isLoaded: holdingsLoaded } = usePortfolio();
  const { identity, readiness } = useInvestorIdentity();
  const { requests, isLoaded: supportLoaded } = useSupportRequests();

  const [now] = useState(() => Date.now());
  const [role, setRoleState] = useState<AdminRole>('operations');
  const [events, setEvents] = useState<readonly AdminAuditEvent[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  /* `sessionStorage` does not exist on the server, so both are read in an effect. */
  useEffect(() => {
    setRoleState(readAdminRole());
    setEvents(readJournal());
    setIsHydrated(true);
  }, []);

  const setRole = useCallback((next: AdminRole) => {
    setRoleState(writeAdminRole(next));
  }, []);

  const record = useCallback((event: NewAuditEvent) => {
    setEvents(appendEvent(event));
  }, []);

  const repository = useMemo(() => createProductMasterRepository(), []);
  const {
    data: products,
    isPending: isProductsLoading,
    isError: isProductsError,
  } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => repository.findAll(),
  });

  /*
    The session investor's verification, reduced to the three operational states
    the console works in. No PAN, no Aadhaar, no dates — an operations queue
    needs to know that a case needs a decision, not what the document said.
  */
  const sessionKycState: DemoKycState =
    readiness === null
      ? 'pending'
      : readiness.outcome === 'already-verified'
        ? 'verified'
        : readiness.outcome === 'collect-missing'
          ? 'needs-attention'
          : 'pending';

  const customers = useMemo(
    () =>
      buildCustomerRows(
        {
          sessionHoldings: holdings,
          sessionKycState,
          sessionCustomerId: SESSION_CUSTOMER_ID,
          sessionDisplayName: identity?.profile.fullName ?? 'This session’s investor',
          demo: demoCustomers(now),
        },
        now,
      ),
    [holdings, sessionKycState, identity?.profile.fullName, now],
  );

  const applications = useMemo(
    () =>
      buildApplicationRows({
        demo: demoApplications(now),
        sessionHoldings: holdings,
        sessionCustomerId: SESSION_CUSTOMER_ID,
        events,
      }),
    [holdings, events, now],
  );

  const proposals = useMemo(() => buildProposals(events), [events]);

  const openSupport = requests.filter(
    (request) => request.status !== 'resolved' && request.status !== 'closed',
  ).length;

  const attention = useMemo(
    () => buildAttention({ applications, customers, proposals, openSupport }),
    [applications, customers, proposals, openSupport],
  );

  return {
    role,
    admin: DEMO_ADMINS[role],
    setRole,
    customers,
    applications,
    products: products ?? [],
    proposals,
    attention,
    events,
    isLoaded: isHydrated && holdingsLoaded && supportLoaded,
    isProductsError,
    isProductsLoading,
    now,
    record,
  };
}

const AdminConsoleContext = createContext<AdminConsole | null>(null);

/**
 * Creates the console state once, for the whole portal.
 *
 * Mounted by the admin layout, so every route below it — the shell and the
 * screen inside it — reads the same role, the same journal and the same clock.
 */
export function AdminConsoleProvider({ children }: { children: ReactNode }) {
  const value = useAdminConsoleState();

  return <AdminConsoleContext.Provider value={value}>{children}</AdminConsoleContext.Provider>;
}

/**
 * The console, from the provider above.
 *
 * Throws outside the portal rather than silently creating a second instance:
 * an admin screen rendered without the provider is a wiring mistake, and the
 * failure that hides it is exactly the one this provider exists to prevent.
 */
export function useAdminConsole(): AdminConsole {
  const value = useContext(AdminConsoleContext);

  if (value === null) {
    throw new Error('useAdminConsole must be used inside the admin portal.');
  }

  return value;
}
