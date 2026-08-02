import { ArrowRight, Plus, Search, ShieldCheck, Star, X } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { env } from '@/config/env';
import { ROUTES } from '@/constants';

import { BusinessPrimitivesDemo, CategoryCardDemo, ProductCardDemo } from './business-demo';
import { ChipDemo } from './chip-demo';
import { DialogDemo } from './dialog-demo';
import { PaginationDemo } from './pagination-demo';
import { ToastDemo } from './toast-demo';

/**
 * Component Gallery — dev-only visual approval surface (T0.7 lifecycle §5).
 * Renders every variant × size × state of each platform component so the
 * client can approve visuals against the approved UI before feature work.
 * Returns 404 in production builds. Not part of the product.
 */

/** Review navigation: one anchor per component (first section of each). */
const COMPONENT_INDEX = [
  { id: 'button-variants', label: 'Button' },
  { id: 'input-states', label: 'Input' },
  { id: 'card-variants', label: 'Card' },
  { id: 'badge', label: 'Badge' },
  { id: 'chip', label: 'Chip' },
  { id: 'select', label: 'Select' },
  { id: 'accordion', label: 'Accordion' },
  { id: 'dialog', label: 'Dialog' },
  { id: 'toast', label: 'Toast' },
  { id: 'pagination', label: 'Pagination' },
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'business-primitives', label: 'Business' },
  { id: 'product-card', label: 'Product Card' },
  { id: 'category-cards', label: 'Categories' },
] as const;

function GallerySection({
  id,
  index,
  title,
  description,
  children,
}: {
  id: string;
  index: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-caption text-content-brand font-semibold tracking-wide uppercase">
          {index}
        </span>
        <h2 className="text-h2 text-content">{title}</h2>
        <p className="text-body text-content-muted max-w-xl">{description}</p>
      </div>
      <div className="border-border-default bg-surface-card rounded-card shadow-elevation-1 border p-8">
        {children}
      </div>
    </section>
  );
}

export default function GalleryPage() {
  if (env.appEnv === 'production') {
    notFound();
  }

  const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;
  const sizes = ['sm', 'md', 'lg'] as const;
  const sizeLabel = { sm: 'Compare', md: 'View details', lg: 'Explore Fixed Deposits' } as const;

  return (
    <div className="container-page flex flex-col gap-16 py-16">
      <header className="border-border-default flex flex-col gap-3 border-b pb-8">
        <span className="bg-surface-brand-subtle text-caption text-content-brand w-fit rounded-full px-3 py-1 font-medium">
          Component Gallery · dev only
        </span>
        <h1 className="text-h1 text-content">Platform Component Library</h1>
        <p className="text-body-lg text-content-muted max-w-2xl">
          The eleven platform components (T1.1–T1.11): Button, Input, Card, Badge, Chip, Select,
          Accordion, Dialog, Toast, Pagination, and Skeleton. Every variant, size, and state below
          is composed exclusively from approved design tokens.
        </p>

        <nav aria-label="Component index" className="flex flex-wrap gap-2 pt-2">
          {COMPONENT_INDEX.map((entry) => (
            <a
              key={entry.id}
              href={`#${entry.id}`}
              className="focus-ring border-border-default bg-surface-card text-caption text-content-muted hover:bg-surface-muted duration-fast rounded-full border px-3 py-1 font-medium transition ease-out"
            >
              {entry.label}
            </a>
          ))}
        </nav>
      </header>

      <GallerySection
        id="button-variants"
        index="01"
        title="Button — Variant × Size"
        description="Four approved variants across the three text size tokens (32 / 40 / 48px). The fourth size, icon (44px square), carries no label and is shown under Composition."
      >
        <div className="flex flex-col gap-8">
          {variants.map((variant) => (
            <div key={variant} className="flex flex-col gap-3">
              <span className="text-caption text-content-muted font-medium">{variant}</span>
              <div className="flex flex-wrap items-end gap-4">
                {sizes.map((size) => (
                  <Button key={size} variant={variant} size={size}>
                    {sizeLabel[size]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GallerySection>

      <GallerySection
        id="button-states"
        index="02"
        title="Button — States"
        description="Disabled uses an explicit muted palette layered with the muted-opacity token — not opacity alone. Hover, focus-visible (Tab) and active are interactive."
      >
        <div className="flex flex-col gap-6">
          {variants.map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-4">
              <span className="text-caption text-content-muted w-24 font-medium">{variant}</span>
              <Button variant={variant}>Default</Button>
              <Button variant={variant} disabled>
                Disabled
              </Button>
              <Button variant={variant} loading>
                Processing…
              </Button>
            </div>
          ))}
        </div>
      </GallerySection>

      <GallerySection
        id="button-composition"
        index="03"
        title="Button — Icons & Composition"
        description="Decorative icons (hidden from screen readers), spinner spacing, and asChild link delegation."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button leftIcon={<Search className="size-4" />}>Search</Button>
          <Button variant="secondary" leftIcon={<Plus className="size-4" />}>
            Compare
          </Button>
          <Button rightIcon={<ArrowRight className="size-4" />} size="lg">
            Continue to Booking
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.home}>asChild link</Link>
          </Button>
          {/*
            The icon size is 44px square (--ds-touch-target-min) and has no
            label, so it is shown here rather than in the Variant × Size
            matrix, whose cells are text.
          */}
          <Button variant="ghost" size="icon" aria-label="Remove">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </GallerySection>

      <GallerySection
        id="input-states"
        index="04"
        title="Input — Sizes & States"
        description="Two approved sizes (44 / 48px). Invalid pairs an error border with aria-invalid; disabled and read-only use the muted surface, never opacity alone."
      >
        <div className="flex max-w-md flex-col gap-4">
          <Input size="md" placeholder="Search FDs, banks… (md, 44px)" />
          <Input size="lg" placeholder="Hero search (lg, 48px)" />
          <Input invalid defaultValue="0" aria-label="Invalid example" />
          <Input disabled placeholder="Disabled" />
          <Input readOnly defaultValue="Read-only value" aria-label="Read-only example" />
          <Input loading placeholder="Checking latest rates…" />
        </div>
      </GallerySection>

      <GallerySection
        id="input-slots"
        index="05"
        title="Input — Prefix & Suffix"
        description="Decorative slots for the approved financial use cases: currency, percentage, search."
      >
        <div className="flex max-w-md flex-col gap-4">
          <Input prefix="₹" defaultValue="1,00,000" inputMode="numeric" aria-label="Amount" />
          <Input suffix="%" defaultValue="7.75" inputMode="decimal" aria-label="Interest rate" />
          <Input
            prefix={<Search className="size-4" />}
            placeholder="e.g. HDFC, 12 months…"
            type="search"
          />
        </div>
      </GallerySection>

      <GallerySection
        id="input-wiring"
        index="06"
        title="Input — Label, Description & Error wiring"
        description="The integration contract for the future form layer: htmlFor/id plus aria-describedby. Errors are icon + message + color, never color alone."
      >
        <div className="flex max-w-md flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="gallery-amount" className="text-body text-content font-medium">
              Deposit Amount
            </label>
            <Input
              id="gallery-amount"
              prefix="₹"
              defaultValue="1,00,000"
              inputMode="numeric"
              aria-describedby="gallery-amount-desc"
            />
            <p id="gallery-amount-desc" className="text-caption text-content-muted">
              Minimum investment ₹10,000.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="gallery-amount-error" className="text-body text-content font-medium">
              Deposit Amount
            </label>
            <Input
              id="gallery-amount-error"
              prefix="₹"
              defaultValue="0"
              invalid
              inputMode="numeric"
              aria-describedby="gallery-amount-error-msg"
            />
            <p id="gallery-amount-error-msg" className="text-caption text-error">
              Amount must be greater than ₹0.
            </p>
          </div>
        </div>
      </GallerySection>

      <GallerySection
        id="card-variants"
        index="07"
        title="Card — Variants"
        description="default (resting, elevation-1), elevated (featured, elevation-2), outlined (dense informational, border only)."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Product information</CardTitle>
              <CardDescription>Default — standard resting surface.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-content-muted">
                Body content sits on the space-6 padding rhythm.
              </p>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Featured</CardTitle>
              <CardDescription>Elevated — raised surface, elevation-2.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-numeric text-content-brand">7.75% per annum</p>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardHeader>
              <CardTitle>Comparison information</CardTitle>
              <CardDescription>Outlined — border only, no shadow.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-content-muted">For dense side-by-side contexts.</p>
            </CardContent>
          </Card>
        </div>
      </GallerySection>

      <GallerySection
        id="card-composition"
        index="08"
        title="Card — Composition"
        description="Cards compose platform components; interactivity always belongs to the children, never the Card."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Card + Badge</CardTitle>
                <Badge>Highest Rate</Badge>
              </div>
              <CardDescription>Platform Badge (T1.4) composed in a Card header.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-caption text-content-muted">Estimated returns</p>
              <p className="text-numeric text-content-brand">₹1,07,978</p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary">View details</Button>
              <Button variant="outline">Compare</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card + Input</CardTitle>
              <CardDescription>Nested sections with a form control and action.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="gallery-card-amount" className="text-body text-content font-medium">
                  Amount
                </label>
                <Input id="gallery-card-amount" prefix="₹" defaultValue="1,00,000" />
              </div>
              <div className="bg-surface-muted rounded-md p-4">
                <p className="text-caption text-content-muted">Nested section</p>
                <p className="text-body text-content">Inset content uses surface-muted.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Calculate</Button>
            </CardFooter>
          </Card>
        </div>
      </GallerySection>

      <GallerySection
        id="badge"
        index="09"
        title="Badge — Variants & Use Cases"
        description="Display-only labels sampled from the approved UI: trust, status, highlight, numeric, and icon badges across sm/md sizes. Interactive pills are Chip (T1.5)."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-caption text-content-muted w-24 font-medium">Trust</span>
            <Badge variant="success" leftIcon={<ShieldCheck className="size-3" />}>
              RBI Regulated
            </Badge>
            <Badge variant="success" leftIcon={<ShieldCheck className="size-3" />}>
              ₹5L DICGC Insured
            </Badge>
            <Badge variant="success" leftIcon={<Star className="size-3" />}>
              AAA Rating
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-caption text-content-muted w-24 font-medium">Status</span>
            <Badge variant="success">Active</Badge>
            <Badge variant="neutral">Closed</Badge>
            <Badge variant="outline">Pending review</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-caption text-content-muted w-24 font-medium">Highlight</span>
            <Badge>Highest Rate</Badge>
            <Badge>Senior citizen +0.5%</Badge>
            <Badge variant="outline">Auto-renewal</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-caption text-content-muted w-24 font-medium">Numeric</span>
            <Badge>7.75%</Badge>
            <Badge variant="outline">12 months</Badge>
            <Badge variant="neutral" size="sm">
              6 of 24
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-caption text-content-muted w-24 font-medium">Sizes</span>
            <Badge size="sm">sm badge</Badge>
            <Badge size="md">md badge</Badge>
          </div>
        </div>
      </GallerySection>

      <GallerySection
        id="chip"
        index="10"
        title="Chip — Interactive Filters"
        description="The toggling filter pill (mapping §2e). Selected = brand border + brand text + subtle fill. Wrapping is natural inside a filter container — resize to verify."
      >
        <div className="flex flex-col gap-8">
          <ChipDemo />
          <div className="flex flex-col gap-3">
            <span className="text-caption text-content-muted font-medium">
              Static states & sizes
            </span>
            <div className="flex max-w-md flex-wrap items-center gap-3">
              <Chip>Default</Chip>
              <Chip selected>Selected</Chip>
              <Chip disabled>Disabled</Chip>
              <Chip selected disabled>
                Selected disabled
              </Chip>
              <Chip size="md">md chip</Chip>
              <Chip size="md" selected>
                md selected
              </Chip>
            </div>
          </div>
        </div>
      </GallerySection>

      <GallerySection
        id="select"
        index="11"
        title="Select — Sizes & States"
        description="Radix-powered dropdown mirroring Input sizing (44 / 48px). Open a select and verify Arrow keys, Enter, Escape, Home/End, and typeahead — all native Radix behavior. Example labels are demo-only; the component is domain-agnostic."
      >
        <div className="grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="gallery-tenure" className="text-body text-content font-medium">
              Deposit Tenure (md, placeholder)
            </label>
            <Select
              id="gallery-tenure"
              placeholder="Select tenure"
              options={[
                { value: '6m', label: '6 months' },
                { value: '12m', label: '12 months' },
                { value: '18m', label: '18 months' },
                { value: '24m', label: '24 months' },
                { value: '36m', label: '36 months', disabled: true },
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="gallery-bank" className="text-body text-content font-medium">
              Bank (lg)
            </label>
            <Select
              id="gallery-bank"
              size="lg"
              placeholder="All banks"
              options={[
                { value: 'hdfc', label: 'HDFC Bank' },
                { value: 'sbi', label: 'State Bank of India' },
                { value: 'icici', label: 'ICICI Bank' },
                { value: 'axis', label: 'Axis Bank' },
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="gallery-payout" className="text-body text-content font-medium">
              Interest Payout (selected)
            </label>
            <Select
              id="gallery-payout"
              defaultValue="maturity"
              options={[
                { value: 'maturity', label: 'At maturity' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="gallery-senior" className="text-body text-content font-medium">
              Senior Citizen (invalid)
            </label>
            <Select
              id="gallery-senior"
              placeholder="Select an option"
              invalid
              aria-describedby="gallery-senior-error"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
            <p id="gallery-senior-error" className="text-caption text-error">
              Please choose an option to continue.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-body text-content font-medium">Disabled</span>
            <Select
              aria-label="Disabled select"
              placeholder="Unavailable"
              disabled
              options={[{ value: 'x', label: 'Option' }]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-body text-content font-medium">Loading</span>
            <Select
              aria-label="Loading select"
              placeholder="Fetching options…"
              loading
              options={[]}
            />
          </div>
        </div>
      </GallerySection>

      <GallerySection
        id="accordion"
        index="12"
        title="Accordion — Disclosure"
        description="Radix disclosure with smooth token-driven expand/collapse (reduced-motion users get instant state change). Verify Arrow keys, Home/End, Enter/Space across triggers."
      >
        <div className="flex max-w-2xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-caption text-content-muted font-medium">
              FAQ — type=&quot;single&quot; collapsible (opening one closes the other smoothly)
            </span>
            <Accordion type="single" collapsible defaultValue="faq-1">
              <AccordionItem value="faq-1">
                <AccordionTrigger>How is interest calculated?</AccordionTrigger>
                <AccordionContent>
                  Interest compounds quarterly and is paid out according to the payout option
                  selected at booking.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2">
                <AccordionTrigger>Can I withdraw before maturity?</AccordionTrigger>
                <AccordionContent>
                  Premature withdrawal is available for most products, subject to a small rate
                  adjustment defined in the terms.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3" disabled>
                <AccordionTrigger>Disabled item</AccordionTrigger>
                <AccordionContent>Never visible.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-caption text-content-muted font-medium">
              Product sections — type=&quot;multiple&quot; (items expand independently)
            </span>
            <Accordion type="multiple" defaultValue={['interest', 'terms']}>
              <AccordionItem value="details">
                <AccordionTrigger>Product Details</AccordionTrigger>
                <AccordionContent>
                  Key information about the product: tenure, interest type, minimum investment, and
                  payout schedule.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="interest">
                <AccordionTrigger>Interest Breakdown</AccordionTrigger>
                <AccordionContent>
                  Year-by-year interest accrual on the deposited amount, shown before booking.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="terms">
                <AccordionTrigger>Terms &amp; Conditions</AccordionTrigger>
                <AccordionContent>
                  The complete terms applying to this deposit, including renewal and nomination
                  rules.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-caption text-content-muted font-medium">
              Long multiline content — animation with large, wrapping content
            </span>
            <Accordion type="single" collapsible defaultValue="long">
              <AccordionItem value="long">
                <AccordionTrigger>Full disclosure text</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    <p>
                      This example verifies the expand animation against large dynamic content. The
                      measured height comes from the runtime variable, so the animation adapts to
                      any content length without clipping or a jump at the end of the transition.
                    </p>
                    <p>
                      Spacing between paragraphs follows the approved 4px-base scale, and the
                      typography uses the body token with the muted content color, exactly as
                      shorter accordion content does. Nothing about long content changes the
                      component&apos;s API or styling.
                    </p>
                    <p>
                      On narrow viewports the text wraps naturally within the item&apos;s padding,
                      and the trigger keeps its full-width hit area with the chevron pinned to the
                      trailing edge. Resize the window to verify responsive behavior.
                    </p>
                    <p>
                      For reduced-motion users, the global media query collapses the animation to an
                      immediate state change while every other aspect of the component — keyboard
                      behavior, focus management, semantics — remains identical.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </GallerySection>

      <GallerySection
        id="dialog"
        index="13"
        title="Dialog — Modal"
        description="Portal-based modal on the approved layer tokens (overlay 300 / modal 400) with independent fade animations. Verify focus trap, Escape, overlay click, scroll lock, and focus return to the trigger."
      >
        <DialogDemo />
      </GallerySection>

      <GallerySection
        id="toast"
        index="14"
        title="Toast — Transient Feedback"
        description="Transient feedback on the top layer token. Verify: auto-dismiss timing, pause on hover and on focus, manual dismiss, swipe-to-dismiss, stacking of multiple toasts, and F8 to jump into the viewport."
      >
        <ToastDemo />
      </GallerySection>

      <GallerySection
        id="pagination"
        index="15"
        title="Pagination — Page Navigation"
        description="Presentation-only pager: renders the range and emits onPageChange. The active page is outlined per the approved UI. Previous/Next are genuinely disabled at the range boundaries."
      >
        <PaginationDemo />
      </GallerySection>

      <GallerySection
        id="skeleton"
        index="16"
        title="Skeleton — Loading Placeholder"
        description="Loading placeholders on the muted surface with a quiet token-driven pulse. Shape comes from composition, never from variants. Announce loading once per container, not per placeholder."
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-caption text-content-muted font-medium">
              Primitive shapes — text line, heading line, circle, block
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-16 w-32" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-caption text-content-muted font-medium">
              Text block — last line shortened
            </span>
            <div className="flex max-w-md flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-caption text-content-muted font-medium">
              Card skeleton — reference implementation for future Marketplace loading screens (sized
              to match real content, so no layout shift on swap)
            </span>
            <div role="status" aria-live="polite" className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <span className="sr-only">Loading products…</span>
              {[0, 1].map((index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <Skeleton className="size-10 rounded-full" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex gap-8">
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <div className="bg-surface-muted flex flex-col gap-2 rounded-md p-4">
                      <Skeleton className="bg-surface-card h-3 w-32" />
                      <Skeleton className="bg-surface-card h-5 w-28" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-28" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </GallerySection>

      <GallerySection
        id="business-primitives"
        index="17"
        title="Business Primitives"
        description="Marketplace building blocks composed from the frozen library: bank identity, trust signals, money, rates, and benefit tags. Static fixtures — no API."
      >
        <BusinessPrimitivesDemo />
      </GallerySection>

      <GallerySection
        id="product-card"
        index="18"
        title="FD Product Card"
        description="The approved product card. Presentation-only: values arrive through props, actions are emitted as callbacks, and the card itself is not a link."
      >
        <ProductCardDemo />
      </GallerySection>

      <GallerySection
        id="category-cards"
        index="19"
        title="Category Cards"
        description="The five approved 'Recommended for you' categories on the subtle surface. The first tile is interactive to show the button variant."
      >
        <CategoryCardDemo />
      </GallerySection>
    </div>
  );
}
