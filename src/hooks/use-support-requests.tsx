'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  createRequest,
  readRequests,
  replyToRequest,
  type NewSupportRequest,
} from '@/services/support';
import type { SupportRequest } from '@/types/support';

/**
 * The customer's support requests — one reader, one writer.
 *
 * Platform-level for the same reason `usePortfolio` is: support is reachable
 * from the support screens, and the contextual entry points elsewhere need to
 * know nothing more than a route. Modules cannot import each other, so the hook
 * lives here.
 *
 * Hydration is deferred — `sessionStorage` does not exist on the server — which
 * is why `isLoaded` exists: an empty list before hydration is not the same
 * statement as "you have never contacted support".
 */
export interface SupportRequestsState {
  requests: readonly SupportRequest[];
  isLoaded: boolean;
  create: (input: NewSupportRequest) => SupportRequest;
  reply: (id: string, body: string) => void;
  reload: () => void;
}

export function useSupportRequests(): SupportRequestsState {
  const [requests, setRequests] = useState<readonly SupportRequest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setRequests(readRequests());
    setIsLoaded(true);
  }, []);

  /**
   * Records a request and hands back the record that was created.
   *
   * The caller navigates to the new request, and the number is the store's to
   * mint, so it has to come back rather than be guessed at.
   */
  const create = useCallback((input: NewSupportRequest) => {
    const request = createRequest(input);
    setRequests(readRequests());
    return request;
  }, []);

  const reply = useCallback((id: string, body: string) => {
    setRequests(replyToRequest(id, body));
  }, []);

  const reload = useCallback(() => {
    setRequests(readRequests());
  }, []);

  return { requests, isLoaded, create, reply, reload };
}
