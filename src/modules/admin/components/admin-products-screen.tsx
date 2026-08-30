'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { createProductMasterRepository } from '@/services/product-master';
import type { ProductChangeStatus } from '@/types/admin';
import { formatCurrency, formatPercentage } from '@/utils';
import { formatMaturityDate } from '@/utils/finance';

import {
  AdminEmpty,
  AdminPageHeader,
  AdminSection,
  StatusPill,
  type AdminTone,
} from './admin-primitives';
import { useAdminConsole } from '../hooks/use-admin-console';
import { proposalsForProduct } from '../utils/admin-projection';
import { can, deniedReason } from '../utils/permissions';

/**
 * FD products, and the controlled way a change to one is made.
 *
 * ## The catalogue is read, never owned
 *
 * Products come from the platform's `ProductMasterRepository` — the same
 * `/api/v1/products` contract Marketplace reads. Admin holds no product
 * catalogue of its own, so a rate shown here is the rate the customer sees.
 *
 * ## Maker and checker
 *
 * A product admin **proposes**; an operations admin **approves**. The two
 * permissions are held by different roles on purpose — a change one person can
 * make and approve alone is not a control. Both steps are journalled, and the
 * proposal has no record other than those events.
 *
 * ## An approved change is not a published one
 *
 * Publishing means telling the bank, and there is no bank integration in this
 * build. A change therefore stops at *approved*, and the screen says why. The
 * customer-facing catalogue is untouched by anything on this page — the demo
 * would be actively misleading if it were not.
 */
const STATUS_LABEL: Record<ProductChangeStatus, string> = {
  draft: 'Draft',
  'pending-review': 'Pending review',
  approved: 'Approved (simulated)',
  rejected: 'Rejected',
  published: 'Published',
};

const STATUS_TONE: Record<ProductChangeStatus, AdminTone> = {
  draft: 'neutral',
  'pending-review': 'warning',
  approved: 'success',
  rejected: 'error',
  published: 'brand',
};

export function AdminProductsScreen() {
  const console = useAdminConsole();

  if (console.isProductsLoading) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading the product catalogue…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!can(console.role, 'products.view')) {
    return (
      <AdminEmpty
        title="Products are not visible to this role"
        detail={deniedReason(console.role, 'products.view')}
      />
    );
  }

  if (console.isProductsError) {
    return (
      <>
        <AdminPageHeader title="FD products" />
        <AdminEmpty
          title="The product catalogue could not be loaded"
          detail="The catalogue endpoint did not respond. Nothing is cached in this console, so no figures are shown rather than stale ones."
        />
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="FD products"
        description="Read from the same catalogue the marketplace serves. Changes proposed here do not alter it."
      />

      {/*
        Stated rather than hidden. The catalogue endpoint returns a page, and
        this console deliberately does not add an admin-only listing API to work
        around it — a console that showed part of the catalogue without saying
        so would be worse than one that says so.
      */}
      <p className="text-caption text-content-muted mb-4">
        Showing the first page returned by the catalogue endpoint. Paging is a listing concern of
        that API and no admin-only endpoint has been added for it. A product outside this page can
        still be opened directly by id.
      </p>

      {console.products.length === 0 ? (
        <AdminEmpty
          title="No products in the catalogue"
          detail="The catalogue responded with nothing to show."
        />
      ) : (
        <Card variant="outlined" className="overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left">
            <thead>
              <tr className="border-border-default border-b">
                {['Bank', 'Product', 'Tenure', 'Base rate', 'Minimum', 'Pending change', ''].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="text-caption text-content-muted px-5 py-3 font-medium"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {console.products.map((product) => {
                const pending = proposalsForProduct(console.proposals, product.productId).find(
                  (proposal) => proposal.status === 'pending-review',
                );

                return (
                  <tr
                    key={product.productId}
                    className="border-border-default/50 border-b last:border-b-0"
                  >
                    <td className="text-body text-content px-5 py-3 font-medium">
                      {product.bank.name}
                    </td>
                    <td className="text-caption text-content-muted px-5 py-3">{product.name}</td>
                    <td className="text-body text-content px-5 py-3 tabular-nums">
                      {product.terms.tenureMonths > 0
                        ? `${String(product.terms.tenureMonths)} months`
                        : 'Published in days'}
                    </td>
                    <td className="text-body text-content px-5 py-3 tabular-nums">
                      {formatPercentage(product.terms.baseRate)}
                    </td>
                    <td className="text-caption text-content-muted px-5 py-3 tabular-nums">
                      {formatCurrency(product.minInvestment)}
                    </td>
                    <td className="px-5 py-3">
                      {pending === undefined ? (
                        <span className="text-caption text-content-placeholder">—</span>
                      ) : (
                        <StatusPill tone="warning">Pending review</StatusPill>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={ROUTES.adminProduct(product.productId)}
                        className="focus-ring text-caption text-content-brand rounded-md font-medium"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

export interface AdminProductDetailScreenProps {
  productId: string;
}

export function AdminProductDetailScreen({ productId }: AdminProductDetailScreenProps) {
  const console = useAdminConsole();
  const [proposed, setProposed] = useState('');

  /*
    Fetched by id rather than found in the list: the listing endpoint returns a
    page, and an operator opening a product from a link, a search or an audit
    entry must not depend on it having been on that page.
  */
  const repository = useMemo(() => createProductMasterRepository(), []);
  const {
    data: fetched,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['admin', 'product', productId],
    queryFn: () => repository.findById(productId),
  });

  if (isPending) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading this product…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!can(console.role, 'products.view')) {
    return (
      <AdminEmpty
        title="Products are not visible to this role"
        detail={deniedReason(console.role, 'products.view')}
      />
    );
  }

  const product = fetched ?? null;

  if (product === null) {
    return (
      <>
        <AdminPageHeader title="Product not found" />
        <AdminEmpty
          title={`No product with id ${productId}`}
          detail={
            isError
              ? 'The catalogue could not be reached, so no product could be resolved. Nothing is shown rather than a stale figure.'
              : 'The catalogue holds no product under that id.'
          }
        />
        <Link
          href={ROUTES.adminProducts}
          className="focus-ring text-caption text-content-brand mt-4 inline-block rounded-md font-medium"
        >
          Back to products
        </Link>
      </>
    );
  }

  const history = proposalsForProduct(console.proposals, product.productId);
  const pending = history.find((proposal) => proposal.status === 'pending-review') ?? null;

  const mayPropose = can(console.role, 'products.propose');
  const mayApprove = can(console.role, 'products.approve');

  const currentRate = formatPercentage(product.terms.baseRate);
  const parsed = Number(proposed);
  const isValidProposal =
    proposed.trim() !== '' && Number.isFinite(parsed) && parsed > 0 && parsed < 100;

  return (
    <>
      <Link
        href={ROUTES.adminProducts}
        className="focus-ring text-caption text-content-muted hover:text-content mb-3 inline-flex items-center gap-1.5 rounded-md"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        FD products
      </Link>

      <AdminPageHeader title={product.bank.name} description={product.name} />

      <AdminSection title="Product">
        <Card variant="outlined" className="p-5">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {[
              ['Product id', product.productId],
              ['Base rate', currentRate],
              [
                'Tenure',
                product.terms.tenureMonths > 0
                  ? `${String(product.terms.tenureMonths)} months`
                  : 'Published in days by the bank',
              ],
              ['Minimum investment', formatCurrency(product.minInvestment)],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col">
                <dt className="text-caption text-content-muted">{label}</dt>
                <dd className="text-body text-content tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </AdminSection>

      <AdminSection
        title="Rate change"
        description="A proposal is reviewed by a different role before it is approved. An approved change is not published: publishing requires a bank integration, which is not connected."
      >
        {pending !== null ? (
          <Card variant="outlined" className="flex flex-col gap-3 p-5">
            <StatusPill tone="warning">Pending review</StatusPill>
            <p className="text-body text-content tabular-nums">
              {pending.field}: {pending.from} → {pending.to}
            </p>
            <p className="text-caption text-content-muted">
              Proposed {formatMaturityDate(new Date(pending.proposedAt))}. The customer-facing
              catalogue is unchanged.
            </p>

            {mayApprove ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    console.record({
                      actorRole: console.role,
                      actorName: console.admin.displayName,
                      action: 'product.change.approved',
                      subject: { kind: 'product', id: product.productId },
                      summary: `Rate change approved (simulated) for ${product.bank.name}`,
                      change: { field: pending.field, from: pending.from, to: pending.to },
                    });
                  }}
                >
                  Approve (demo)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.record({
                      actorRole: console.role,
                      actorName: console.admin.displayName,
                      action: 'product.change.rejected',
                      subject: { kind: 'product', id: product.productId },
                      summary: `Rate change rejected for ${product.bank.name}`,
                      change: { field: pending.field, from: pending.from, to: pending.to },
                    });
                  }}
                >
                  Reject
                </Button>
              </div>
            ) : (
              <p className="text-caption text-content-muted">
                {deniedReason(console.role, 'products.approve')}
              </p>
            )}
          </Card>
        ) : mayPropose ? (
          <Card variant="outlined" className="flex flex-col gap-3 p-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="admin-proposed-rate" className="text-caption text-content-muted">
                Proposed base rate (%)
              </label>
              <Input
                id="admin-proposed-rate"
                inputMode="decimal"
                className="max-w-40"
                value={proposed}
                onChange={(event) => {
                  setProposed(event.target.value);
                }}
              />
            </div>

            <Button
              className="w-fit"
              disabled={!isValidProposal}
              onClick={() => {
                console.record({
                  actorRole: console.role,
                  actorName: console.admin.displayName,
                  action: 'product.change.proposed',
                  subject: { kind: 'product', id: product.productId },
                  summary: `Rate change proposed for ${product.bank.name}`,
                  change: {
                    field: 'Base rate',
                    from: currentRate,
                    to: formatPercentage(parsed),
                  },
                });
                setProposed('');
              }}
            >
              Propose change
            </Button>
          </Card>
        ) : (
          <AdminEmpty
            title="This role cannot propose a change"
            detail={deniedReason(console.role, 'products.propose')}
          />
        )}
      </AdminSection>

      <AdminSection title="Change history">
        {history.length === 0 ? (
          <AdminEmpty
            title="No change has been proposed"
            detail="Nothing has been proposed for this product in this session."
          />
        ) : (
          <Card variant="outlined" className="px-5">
            <ul className="divide-border-default/60 flex list-none flex-col divide-y">
              {history.map((proposal) => (
                <li key={proposal.id} className="flex flex-col gap-1 py-3">
                  <span className="text-body text-content tabular-nums">
                    {proposal.field}: {proposal.from} → {proposal.to}
                  </span>
                  <StatusPill tone={STATUS_TONE[proposal.status]}>
                    {STATUS_LABEL[proposal.status]}
                  </StatusPill>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </AdminSection>
    </>
  );
}
