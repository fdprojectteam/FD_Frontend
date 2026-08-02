'use client';

import { useState } from 'react';

import { Pagination } from '@/components/ui/pagination';

/**
 * Dev-only Pagination demos for the gallery. Page state lives here — the
 * component itself is presentation-only and merely emits onPageChange.
 * Static instances demonstrate each boundary state.
 */
const noop = () => {};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-caption text-content-muted font-medium">{label}</span>
      {children}
    </div>
  );
}

export function PaginationDemo() {
  const [page, setPage] = useState(2);

  return (
    <div className="flex flex-col gap-8">
      <Row label={`Interactive — click or Tab + Enter/Space (current page: ${page} of 4)`}>
        <Pagination currentPage={page} totalPages={4} onPageChange={setPage} />
      </Row>

      <div className="flex flex-col gap-6">
        <Row label="First page — previous disabled">
          <Pagination currentPage={1} totalPages={4} onPageChange={noop} />
        </Row>
        <Row label="Middle page — both enabled">
          <Pagination currentPage={2} totalPages={4} onPageChange={noop} />
        </Row>
        <Row label="Last page — next disabled">
          <Pagination currentPage={4} totalPages={4} onPageChange={noop} />
        </Row>
        <Row label="Fully disabled control">
          <Pagination currentPage={2} totalPages={4} onPageChange={noop} disabled />
        </Row>
      </div>
    </div>
  );
}
