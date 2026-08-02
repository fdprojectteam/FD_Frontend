/**
 * Invariant suite — static probes over the shipped source.
 *
 * Comments are stripped before matching, so prose in a doc block can never
 * produce a false positive (the M2.4 probe learned this the hard way).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { check, ok, section } from '../lib/assert.mjs';
import { ROOT } from '../lib/build.mjs';

const SRC = path.join(ROOT, 'src');
const MARKETPLACE = path.join(SRC, 'modules', 'marketplace');

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(entry) ? [full] : [];
  });
}

/** Strips block and line comments so documentation cannot satisfy a probe. */
function code(file) {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const rel = (file) => path.relative(ROOT, file).replace(/\\/g, '/');

export async function runInvariantSuite() {
  const srcFiles = walk(SRC);
  const sources = new Map(srcFiles.map((file) => [rel(file), code(file)]));

  const componentFiles = [...sources.keys()].filter((file) =>
    file.startsWith('src/modules/marketplace/components/'),
  );
  /**
   * Screens are the routes' composition roots and the only permitted hook
   * owners (invariant A1). Everything else under components/ is a section and
   * must be presentation-only.
   */
  const SCREENS = ['home-screen.tsx', 'product-detail-screen.tsx', 'compare-screen.tsx'];
  const sectionComponents = componentFiles.filter(
    (file) => !SCREENS.some((screen) => file.endsWith(screen)) && !file.endsWith('index.ts'),
  );

  section('Invariants · I1 / I2a — one writer, one owner');

  const routerWriters = [...sources.entries()]
    .filter(([, text]) => /router\.(replace|push)\s*\(/.test(text))
    .map(([file]) => file);
  /**
   * Two writers from T2.7.2, one per route, owning disjoint parameter sets
   * (I1/I2a). Asserted as an exact list, never as a count or an upper bound: a
   * probe that is loosened rather than re-pointed is how an invariant quietly
   * stops being one.
   */
  check('exactly two modules write a Marketplace URL, one per route', routerWriters.sort(), [
    'src/modules/marketplace/hooks/use-compare-url-state.ts',
    'src/modules/marketplace/hooks/use-marketplace-url-state.ts',
  ]);

  const setterCallers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file !== 'src/modules/marketplace/hooks/use-marketplace-url-state.ts' &&
        /useMarketplaceUrlState\s*\(/.test(text),
    )
    .map(([file]) => file);
  check('only HomeScreen consumes the URL-state owner', setterCallers, [
    'src/modules/marketplace/components/home-screen.tsx',
    'src/modules/marketplace/hooks/use-marketplace-search-params.ts',
  ]);

  const home = sources.get('src/modules/marketplace/components/home-screen.tsx');
  ok('HomeScreen owns setFilters', /setFilters/.test(home));
  ok('HomeScreen owns clearFilters', /clearFilters/.test(home));

  section('Invariants · I3 / A1 / A3 — presentation-only sections');

  const hookOffenders = sectionComponents.filter((file) =>
    /use(Products|Product|Banks|CompareProducts|CompareSelection|CompareUrlState|MarketplaceUrlState|MarketplaceSearchParams|Router|SearchParams|Pathname)\s*\(/.test(
      sources.get(file),
    ),
  );
  check('no section component calls a data or router hook', hookOffenders, []);

  const serviceOffenders = sectionComponents.filter((file) =>
    /from\s+'[^']*(services|repositories)/.test(sources.get(file)),
  );
  check('no section component imports a service or repository', serviceOffenders, []);

  const navOffenders = sectionComponents.filter((file) =>
    /from\s+'next\/navigation'/.test(sources.get(file)),
  );
  check('no section component imports next/navigation', navOffenders, []);

  for (const file of ['filter-bar.tsx', 'active-filters.tsx']) {
    const text = sources.get(`src/modules/marketplace/components/${file}`);
    ok(
      `${file} is hook-free apart from local UI state`,
      !/use(Query|Products|Banks|Router)\s*\(/.test(text),
    );
    ok(`${file} declares its props contract`, /export interface \w+Props/.test(text));
  }

  section('Invariants · A5 — one URL → API translation layer');

  const paramBuilders = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file.startsWith('src/modules/marketplace/') &&
        !file.endsWith('utils/list-params.ts') &&
        /tenureMonths\s*:/.test(text) &&
        /limit\s*:/.test(text),
    )
    .map(([file]) => file);
  check('no module builds ProductListParams inline', paramBuilders, []);

  const callSites = [...sources.entries()]
    .filter(
      ([file, text]) => !file.endsWith('utils/index.ts') && /toProductListParams\s*\(/.test(text),
    )
    .map(([file]) => file);
  check('toProductListParams has exactly one definition and one call site', callSites, [
    'src/modules/marketplace/components/home-screen.tsx',
    'src/modules/marketplace/utils/list-params.ts',
  ]);

  section('Invariants · D2 — the parameter set is closed');

  const urlValues = sources.get('src/modules/marketplace/utils/url-values.ts');
  const readKeys = [
    ...urlValues.matchAll(/params\.get\(\s*'([^']+)'|params\.get\(\s*([A-Z_]+)\s*\)/g),
  ]
    .map((match) => match[1] ?? match[2])
    .map((key) => ({ PAGE_PARAM: 'page', SORT_PARAM: 'sort', ORDER_PARAM: 'order' })[key] ?? key);
  check('exactly the eight approved parameters are read', [...new Set(readKeys)].sort(), [
    'amount',
    'bank',
    'minRate',
    'order',
    'page',
    'q',
    'sort',
    'tenure',
  ]);
  ok('category is not read anywhere in the URL layer', !/['"]category['"]/.test(urlValues));

  section('Invariants · I7 — canonicalisation is write-only');

  ok('the read path returns values and never navigates', !/router\.|replace\(/.test(urlValues));
  const hook = sources.get('src/modules/marketplace/hooks/use-marketplace-url-state.ts');
  ok('no effect in the hook writes on mount', !/useEffect/.test(hook));

  section('Invariants · I8 — intent pushes, correction replaces');

  check(
    'the hook contains exactly one push and one replace',
    {
      push: (hook.match(/router\.push\(/g) ?? []).length,
      replace: (hook.match(/router\.replace\(/g) ?? []).length,
    },
    { push: 1, replace: 1 },
  );
  ok(
    'both live inside the single navigate() function',
    /const navigate = useCallback\([\s\S]*?router\.push\([\s\S]*?router\.replace\([\s\S]*?\}\s*,\s*\[pathname, router, searchParams\]/.test(
      hook,
    ),
  );
  ok(
    'every user-facing setter commits (push)',
    ['setSearch', 'setFilters', 'clearFilters', 'setPage', 'setSort'].every((setter) =>
      new RegExp(`const ${setter} = useCallback\\([\\s\\S]{0,400}?commit\\(`).test(hook),
    ),
  );
  ok(
    'the only corrector is correctPage (replace)',
    /const correctPage = useCallback\([\s\S]{0,200}?correct\(/.test(hook),
  );
  check(
    'the out-of-range clamp uses the corrector, not the setter',
    /correctPage\(meta\.totalPages\)/.test(home) && !/setPage\(meta\.totalPages\)/.test(home),
    true,
  );
  check(
    'HomeScreen exposes pagination to the pager via setPage, not correctPage',
    /shouldFocusListing\.current = true;\s*setPage\(page\);/.test(home),
    true,
  );

  section('Invariants · I2 / A4 — hero is independent of the listing');

  ok(
    'the hero sample query is a literal, not derived from URL values',
    /sampleQuery = useProducts\(\{\s*sort: 'interestRate',\s*order: 'desc',\s*limit: HOME_PRODUCT_SAMPLE,?\s*\}\)/.test(
      home,
    ),
  );
  ok(
    'the listing query is fed from the translation layer',
    /useProducts\(listingParams\)/.test(home),
  );

  section('Invariants · I5 — one query key per purpose');

  const queryFiles = walk(path.join(MARKETPLACE, 'hooks')).map(rel);
  const badKeys = queryFiles.filter((file) => {
    const text = sources.get(file);
    return /queryKey\s*:/.test(text) && !/marketplaceKeys\./.test(text);
  });
  check('every queryKey comes from marketplaceKeys', badKeys, []);
  ok('banks are fetched once and passed down', (home.match(/useBanks\(\)/g) ?? []).length === 1);

  section('Invariants · D1 = A′ — the cache is read, never primed');

  const cacheWriters = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file.startsWith('src/modules/marketplace/') && /setQueryData\s*\(/.test(text),
    )
    .map(([file]) => file);
  check('no Marketplace hook writes to the query cache', cacheWriters, []);

  const products = sources.get('src/modules/marketplace/hooks/use-products.ts');
  ok('useProducts no longer holds a QueryClient', !/useQueryClient/.test(products));
  ok('useProducts has no per-item loop in its queryFn', !/for \(const product of/.test(products));

  const preview = sources.get('src/modules/marketplace/utils/product-preview.ts');
  ok(
    'the preview selector is pure — no React, no QueryClient',
    !/(useQuery|useState|useMemo|QueryClient)/.test(preview),
  );

  const detail = sources.get('src/modules/marketplace/hooks/use-product.ts');
  ok('useProduct exposes preview and details separately', /preview,\s*\n?\s*details:/.test(detail));
  ok('useProduct does not leak a React Query result object', !/return query;/.test(detail));

  section('Invariants · M2.6 route — zero URL writers, static metadata');

  const DETAIL_ROUTE = 'src/app/(public)/marketplace/[productId]';
  const routeFiles = [...sources.keys()].filter((file) => file.startsWith(DETAIL_ROUTE));
  check('the product-details route exists', routeFiles.sort(), [
    `${DETAIL_ROUTE}/not-found.tsx`,
    `${DETAIL_ROUTE}/page.tsx`,
  ]);

  const routeWriters = routeFiles.filter((file) =>
    /router\.(push|replace)\s*\(/.test(sources.get(file)),
  );
  check('the detail route performs zero URL writes (decision D3 = A)', routeWriters, []);

  const detailPage = sources.get(`${DETAIL_ROUTE}/page.tsx`);
  ok('the page is a server component', !/'use client'/.test(detailPage));
  ok(
    'metadata is static, not fetched (E5)',
    /export const metadata/.test(detailPage) && !/generateMetadata/.test(detailPage),
  );
  ok('no Suspense boundary is added without a URL reader', !/Suspense/.test(detailPage));
  ok('params are awaited (Next 15 async params)', /await params/.test(detailPage));

  const notFound = sources.get(`${DETAIL_ROUTE}/not-found.tsx`);
  ok(
    'not-found links to ROUTES.home, not the phantom /marketplace',
    /ROUTES\.home/.test(notFound) && !/ROUTES\.marketplace/.test(notFound),
  );
  ok('not-found writes no route string inline', !/href="\//.test(notFound));

  const routes = sources.get('src/constants/routes.ts');
  /**
   * Two from T2.7.3: the product builder and `compare`, which became a real
   * route. `marketplace` stays an unasserted plain string — it is a phantom,
   * and leaving it untyped is what makes a premature link fail to compile
   * rather than ship a 404 (E4).
   */
  check('routes.ts asserts exactly two Routes (E4)', (routes.match(/as Route/g) ?? []).length, 2);
  /**
   * Re-pointed at T2.7.3b. The previous probe was named "and nowhere else" but
   * read only `routes.ts`, so it could never have seen the casts in the URL
   * writers — a name claiming more than its assertion, which is the failure
   * mode this milestone kept producing.
   *
   * The honest invariant is an exact **file list**: a cast is permitted where a
   * runtime query string is composed, which `typedRoutes` cannot check
   * statically. Three such places exist, one per composition site. A fourth
   * appearing — especially in a component — means a screen has learned how a
   * URL is shaped, and this probe must fail rather than absorb it.
   */
  check(
    'and a runtime Route cast exists only where a query string is composed (E4)',
    [...sources.entries()]
      .filter(([file, text]) => file !== 'src/constants/routes.ts' && /as Route/.test(text))
      .map(([file]) => file)
      .sort(),
    [
      'src/modules/marketplace/hooks/use-compare-url-state.ts',
      'src/modules/marketplace/hooks/use-marketplace-url-state.ts',
      'src/modules/marketplace/utils/compare-url.ts',
    ],
  );
  ok(
    'the phantom /marketplace is still not asserted',
    /marketplace: '\/marketplace',/.test(routes),
  );

  section('Invariants · T2.6.3 — the details screen shell');

  const screen = sources.get('src/modules/marketplace/components/product-detail-screen.tsx');

  ok('the screen is the route’s sole hook owner', /useProduct\(/.test(screen));
  ok('the screen reads details ?? preview (D1 = A′)', /details \?\? preview/.test(screen));
  check(
    'the screen writes no URL (decision D3 = A)',
    /router\.(push|replace)\(|useSearchParams|useRouter/.test(screen),
    false,
  );
  ok('404 is distinguished from a server error (E1)', /isNotFoundError\(error\)/.test(screen));
  ok('a 404 reaches the not-found boundary', /notFound\(\)/.test(screen));
  ok('a server error offers a retry', /onClick=\{refetch\}/.test(screen));
  /**
   * The page must have exactly one h1, wherever it lives. It started in the
   * screen (T2.6.3) and moved into ProductHeader (T2.6.4), so the probe counts
   * across the screen *and* the section components it composes — and keeps
   * counting as T2.6.5–7 add more.
   */
  const detailTree = [
    'src/modules/marketplace/components/product-detail-screen.tsx',
    ...[...screen.matchAll(/from '\.\/([a-z-]+)'/g)].map(
      (match) => `src/modules/marketplace/components/${match[1]}.tsx`,
    ),
  ];
  check(
    'the details page renders exactly one h1 across its whole component tree',
    detailTree.reduce((total, file) => total + (sources.get(file)?.match(/<h1/g) ?? []).length, 0),
    1,
  );
  ok(
    'back navigation is a Link, not router.back()',
    /href=\{ROUTES\.home\}/.test(screen) && !/router\.back/.test(screen),
  );
  ok('no route string is written inline', !/href="\//.test(screen));

  section('Invariants · §2.7.1 — the two page measures');

  const sizes =
    sources.get('src/design-system/tokens/sizes.css') ??
    readFileSync(path.join(SRC, 'design-system', 'tokens', 'sizes.css'), 'utf8');
  ok('the 920px detail column is a token', /--ds-container-detail-max:\s*920px/.test(sizes));

  const globals = readFileSync(path.join(SRC, 'app', 'globals.css'), 'utf8');
  ok(
    'container-detail is a utility, not an inline max-width',
    /@utility container-detail/.test(globals),
  );
  ok(
    'container-detail is driven by the token',
    /max-width:\s*var\(--ds-container-detail-max\)/.test(globals),
  );

  ok('content sits in the reading column', /container-detail/.test(screen));
  ok(
    'the action bar spans the full page container',
    detailTree.some((file) => /container-page/.test(sources.get(file) ?? '')),
  );
  check(
    'no component hardcodes the detail measure',
    [...sources.entries()]
      .filter(([, text]) => /920px|max-w-\[920/.test(text))
      .map(([file]) => file),
    [],
  );

  ok('SectionHeading is not reused on this screen (§2.7.3)', !/SectionHeading/.test(screen));

  section('Invariants · T2.6.4 — header, trust badges, key info');

  const header = sources.get('src/modules/marketplace/components/product-header.tsx');
  const badges = sources.get('src/modules/marketplace/components/trust-badge-row.tsx');
  const keyInfo = sources.get('src/modules/marketplace/components/key-info-grid.tsx');

  ok('ProductHeader reuses BankBadge', /BankBadge/.test(header));
  ok('ProductHeader reuses InterestRateDisplay', /InterestRateDisplay/.test(header));
  ok('ProductHeader carries the single h1', /<h1/.test(header));
  check(
    'the screen no longer renders its own h1 — ProductHeader owns it',
    (screen.match(/<h1/g) ?? []).length,
    0,
  );
  ok(
    'the mobile rate caption is "p.a." and the desktop caption is the default',
    /caption="p\.a\."/.test(header) && /layout="inline"/.test(header),
  );
  ok(
    'both breakpoints are rendered explicitly, not restyled',
    /className="hidden md:flex"/.test(header) && /className="md:hidden"/.test(header),
  );

  ok('TrustBadgeRow reuses TrustIndicatorList', /TrustIndicatorList/.test(badges));
  ok('the mobile list omits the AAA rating (§2.7.2)', /'aaa-rating'/.test(badges));
  ok('the mobile list shortens the DICGC label', /'DICGC Insured'/.test(badges));
  ok(
    'the withheld badge is hidden, never clipped — display:none removes it from the a11y tree',
    /hidden md:flex/.test(badges) && !/(overflow-hidden|sr-only|opacity-0)/.test(badges),
  );
  ok(
    'trust indicators come from the product, not a static list',
    /indicators: TrustIndicator\[\]/.test(badges) && !/TRUST_INDICATORS/.test(badges),
  );

  ok(
    'KeyInfoGrid is 2-up below md and 4-up from md',
    /grid-cols-2/.test(keyInfo) && /md:grid-cols-4/.test(keyInfo),
  );
  ok('KeyInfoGrid formats money through the shared util', /formatCurrency/.test(keyInfo));
  ok('KeyInfoGrid formats tenure through the shared util', /formatTenure/.test(keyInfo));
  ok(
    'enumerated values are labelled from constants, not inline strings',
    /INTEREST_TYPE_LABELS/.test(keyInfo) && /PAYOUT_LABELS/.test(keyInfo),
  );

  const t264 = [header, badges, keyInfo];
  check(
    'none of the three components owns state, a hook, or a service',
    t264.filter((text) => /use[A-Z]|from '[^']*(services|repositories)|next\/navigation/.test(text))
      .length,
    0,
  );

  section('Invariants · T2.6.5 — the calculator computes nothing');

  const calculator = sources.get('src/modules/marketplace/components/investment-calculator.tsx');
  const schema = sources.get('src/modules/marketplace/utils/calculator-input.ts');

  ok('the calculator never imports the maturity formula', !/calculateMaturity/.test(calculator));
  ok('the screen owns the calculation', /calculateMaturity\(/.test(screen));
  ok(
    'the default figures come from the product, not a computation',
    /product\.estimatedReturns/.test(screen),
  );
  ok(
    'the committed amount is local state, never the URL (D3, I6)',
    /useState<number \| null>\(null\)/.test(screen) && !/amount=/.test(screen),
  );
  ok(
    'the calculator owns only its draft',
    /useState\(String\(result\.principal\)\)/.test(calculator),
  );
  ok('validation goes through the shared schema', /parseCalculatorAmount\(/.test(calculator));
  ok('the calculator handles no Zod internals', !/\bz\.|safeParse|ZodError/.test(calculator));

  check(
    'React Hook Form is not introduced (D5)',
    [...sources.entries()]
      .filter(([, text]) => /react-hook-form|@hookform/.test(text))
      .map(([file]) => file),
    [],
  );
  ok(
    'the schema is React-free and assertable without rendering',
    !/use[A-Z]|from 'react'/.test(schema),
  );

  ok(
    'AmountDisplay is reused for every money figure',
    (calculator.match(/<AmountDisplay/g) ?? []).length === 3,
  );
  ok(
    'the tenure field is read-only, not editable (D2)',
    /readOnly/.test(calculator) && /aria-readonly/.test(calculator),
  );
  ok(
    'the error is announced',
    /role="alert"/.test(calculator) && /aria-describedby/.test(calculator),
  );
  ok('the invalid state is not colour-alone', /invalid=\{error !== null\}/.test(calculator));
  ok('result arrows are decorative', /aria-hidden="true"/.test(calculator));
  ok('the button drops to its own row below md', /col-span-2[^"]*md:col-span-1/.test(calculator));

  section('Invariants · T2.6.6 — benefits, eligibility, accordions');

  const eligibility = sources.get('src/modules/marketplace/components/eligibility-panel.tsx');
  const accordions = sources.get('src/modules/marketplace/components/product-accordions.tsx');
  const benefitList = sources.get('src/modules/marketplace/components/benefit-chip-list.tsx');

  ok('benefits reuse the existing BenefitChipList (E7)', /<BenefitChipList/.test(screen));
  check(
    'BenefitChipList was not modified for this screen',
    /max\?: number/.test(benefitList) && /variant="outline"/.test(benefitList),
    true,
  );

  ok('EligibilityPanel shows the approved summary only', /eligibility\.summary/.test(eligibility));
  ok('EligibilityPanel invents no extra rows', !/(minAge|residency|panRequired)/.test(eligibility));
  ok(
    'EligibilityPanel is a muted surface, not a Card (§2.7.4)',
    /bg-surface-muted/.test(eligibility) && !/<Card/.test(eligibility),
  );

  ok(
    'accordions use the frozen primitive, not a hand-rolled disclosure',
    /@\/components\/ui\/accordion/.test(accordions),
  );
  ok('no bespoke open/close state — Radix owns it', !/useState/.test(accordions));
  ok(
    'one panel at a time, and it can be closed again',
    /type="single"/.test(accordions) && /collapsible/.test(accordions),
  );
  ok('all three panels start closed', !/defaultValue/.test(accordions));
  check(
    'the three approved panels, in the approved order',
    [...accordions.matchAll(/<AccordionTrigger>([^<]+)</g)].map((match) => match[1]),
    ['Interest breakdown', 'FAQs', 'Terms and conditions'],
  );
  ok(
    'FAQs are a description list',
    /<dl/.test(accordions) && /<dt/.test(accordions) && /<dd/.test(accordions),
  );
  check(
    'exactly three panels — no nested disclosure inside FAQs',
    (accordions.match(/<AccordionItem\b/g) ?? []).length,
    3,
  );
  ok('terms render as a list', /<ul/.test(accordions));

  const t266 = [eligibility, accordions];
  check(
    'neither component fetches data or owns business logic',
    t266.filter((text) =>
      /use(Query|Product|Products)|from '[^']*(services|repositories)|calculateMaturity/.test(text),
    ).length,
    0,
  );

  section('Invariants · heading structure of the details page');

  const detailHeadings = detailTree.reduce(
    (levels, file) => [
      ...levels,
      ...[...(sources.get(file) ?? '').matchAll(/<h([1-6])/g)].map((match) => Number(match[1])),
    ],
    [],
  );
  check(
    'the page defines h1 and h2 only — h3s come from Radix Header',
    [...new Set(detailHeadings)].sort(),
    [1, 2],
  );

  section('Invariants · T2.6.7 — compare selection (D6)');

  const selection = sources.get('src/modules/marketplace/hooks/use-compare-selection.tsx');
  const actionBar = sources.get('src/modules/marketplace/components/detail-action-bar.tsx');
  const publicLayout = sources.get('src/app/(public)/layout.tsx');

  ok('selection is a module-scoped context, not a global store', /createContext/.test(selection));
  check(
    'zustand is not introduced (Document 09 §4–§5)',
    [...sources.entries()].filter(([, text]) => /zustand/.test(text)).map(([file]) => file),
    [],
  );
  ok(
    'the store holds ids only, never product objects',
    /useState<string\[\]>\(\[\]\)/.test(selection),
  );
  ok('no product type is imported by the store', !/ProductSummary|ProductDetails/.test(selection));
  /**
   * O1, closed in T2.7.2 — and stated as an **exact list**.
   *
   * The probe this replaces was named "the cap is enforced in the store, and
   * only there" but checked only that `MAX_COMPARE` appeared in the store and
   * not in two named components. It never looked at `use-compare-products.ts`,
   * which had been enforcing the cap a second time since M2.1. A probe whose
   * name claims more than its assertion is worse than no probe, because it is
   * believed.
   */
  const capReferences = [...sources.entries()]
    .filter(([, text]) => /MAX_COMPARE\b/.test(text))
    .map(([file]) => file)
    .sort();
  check('MAX_COMPARE appears in an exact list of files (C2, O1)', capReferences, [
    // Dev-only component demo: local state, no access to the store.
    'src/app/(public)/gallery/business-demo.tsx',
    'src/modules/marketplace/constants/compare.ts',
    'src/modules/marketplace/constants/index.ts',
    'src/modules/marketplace/hooks/use-compare-selection.tsx',
  ]);
  ok(
    'the products hook no longer caps (O1)',
    !/MAX_COMPARE/.test(sources.get('src/modules/marketplace/hooks/use-compare-products.ts') ?? ''),
  );
  ok(
    'add, toggle and isFull all derive from the same cap',
    (selection.match(/length >= MAX_COMPARE/g) ?? []).length === 3,
  );
  ok(
    'replaceAll caps too, so the rule stays in one module',
    /next\.slice\(0, MAX_COMPARE\)/.test(selection),
  );
  ok(
    'the action bar and the screen never see the cap',
    !/MAX_COMPARE/.test(actionBar) && !/MAX_COMPARE/.test(screen),
  );
  ok('a missing provider fails loudly rather than silently', /throw new Error/.test(selection));

  ok(
    'the provider is mounted at the (public) layout (D6)',
    /CompareSelectionProvider/.test(publicLayout),
  );
  check(
    'it is NOT mounted in the platform composition point',
    /CompareSelectionProvider/.test(sources.get('src/app/providers.tsx') ?? ''),
    false,
  );

  ok('the action bar is presentation-only', !/use[A-Z]/.test(actionBar));
  ok(
    'the action bar spans the full page container, not the reading column',
    /container-page/.test(actionBar) && !/container-detail/.test(actionBar),
  );
  ok(
    'sticky below md, static from md (D7)',
    /sticky bottom-0/.test(actionBar) && /md:static/.test(actionBar),
  );
  ok(
    'the compare label shortens on mobile',
    /Add to Compare/.test(actionBar) && />Compare</.test(actionBar),
  );
  ok('selection state is exposed as a toggle', /aria-pressed=\{isComparing\}/.test(actionBar));
  ok(
    'booking navigation is stateless and inert until Phase 3',
    /aria-disabled="true"/.test(actionBar) && !/href/.test(actionBar) && !/amount/.test(actionBar),
  );

  ok('the listing reflects the same selection', /useCompareSelection\(\)/.test(home));
  check(
    'exactly the three screens consume the selection, and only screens',
    [...sources.entries()]
      .filter(
        ([file, text]) =>
          file.startsWith('src/modules/') &&
          // The hook's own declaration matches its name; exclude the definition.
          !file.endsWith('use-compare-selection.tsx') &&
          /useCompareSelection\(\)/.test(text),
      )
      .map(([file]) => file),
    [
      'src/modules/marketplace/components/compare-screen.tsx',
      'src/modules/marketplace/components/home-screen.tsx',
      'src/modules/marketplace/components/product-detail-screen.tsx',
    ],
  );

  section('Invariants · the MSW readiness gate (M2.6 regression)');

  const gate = sources.get('src/services/api/request-gate.ts');
  const client = sources.get('src/services/api/api-client.ts');
  const mswProvider = sources.get('src/mocks/msw-provider.tsx');

  ok('the gate lives in the transport, not the mock layer', Boolean(gate));
  ok('the transport has no knowledge of MSW', !/msw|mock|worker/i.test(gate));
  ok(
    'the gate is optional — null clears it',
    /setRequestGate\(next: RequestGate \| null\)/.test(gate),
  );
  ok(
    'the interceptor stays synchronous when no gate is registered',
    /hasRequestGate\(\) \? awaitRequestGate\(\)\.then\(\(\) => config\) : config/.test(client),
  );

  ok(
    'the worker start is idempotent — later calls return the same promise',
    /if \(scope\[START_KEY\]\) return scope\[START_KEY\];/.test(mswProvider),
  );
  ok(
    'idempotency survives Fast Refresh via a global symbol',
    /Symbol\.for\('fd\.msw\.start'\)/.test(mswProvider),
  );
  ok('the worker never starts during SSR', /typeof window === 'undefined'/.test(mswProvider));
  ok(
    'production registers no gate — the flag guards the whole mechanism',
    /featureFlags\.mocks/.test(mswProvider),
  );
  const providers = sources.get('src/app/providers.tsx');
  ok(
    'the gate is registered during render, before any child can query',
    /useState\(\(\) => \{[\s\S]{0,200}?setRequestGate\(\(\) => ready\)/.test(providers),
  );
  ok(
    'the mock layer never imports the transport (boundary policy)',
    !/@\/services/.test(mswProvider),
  );
  ok(
    'only the composition point knows about both layers',
    /@\/mocks\/msw-provider/.test(providers) && /@\/services\/api/.test(providers),
  );
  ok('the corrected file no longer starts the worker in an effect', !/useEffect/.test(mswProvider));

  // Direction of dependency: MSW → api-client → repositories → hooks → screens.
  /**
   * Exactly three files may mention the mechanism: the transport that owns the
   * seat, the mock layer that owns the worker, and the composition point that
   * wires them. Anything else means the abstraction has leaked downstream.
   */
  const readinessConsumers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        !file.startsWith('src/services/api/') &&
        !file.startsWith('src/mocks/') &&
        file !== 'src/app/providers.tsx' &&
        /setRequestGate|awaitRequestGate|hasRequestGate|ensureMockWorker/.test(text),
    )
    .map(([file]) => file);
  check(
    'nothing outside those three layers references the readiness primitives',
    readinessConsumers,
    [],
  );

  const featureLayers = [...sources.keys()].filter(
    (file) =>
      file.startsWith('src/modules/') ||
      file.startsWith('src/components/') ||
      file.startsWith('src/hooks/'),
  );
  check(
    'hooks, components and screens remain unaware the mechanism exists',
    featureLayers.filter((file) => /RequestGate|MockWorker|mswReady/.test(sources.get(file) ?? '')),
    [],
  );

  section('Invariants · T2.6.8 — listing → details navigation');

  const card = sources.get('src/modules/marketplace/components/fd-product-card.tsx');
  const grid = sources.get('src/modules/marketplace/components/product-grid.tsx');

  ok('View details is a real Link', /<Link\s+href=\{ROUTES\.product\(product\.id\)\}/.test(card));
  ok(
    'the href comes from ROUTES, never an inline string',
    /ROUTES\.product/.test(card) && !/href="\/marketplace/.test(card),
  );
  ok('Button renders the Link via asChild — no nested interactive', /<Button asChild/.test(card));
  ok('the card still never touches the router', !/useRouter|router\.(push|replace)/.test(card));
  ok(
    'each link names its product (WCAG 2.4.4)',
    /aria-label=\{`View details for \$\{product\.bank\.name\}`\}/.test(card),
  );
  check(
    'the obsolete onViewDetails callback is gone from the whole tree',
    [...sources.entries()].filter(([, text]) => /onViewDetails/.test(text)).map(([file]) => file),
    [],
  );
  ok('the grid no longer threads a navigation callback', !/onViewDetails/.test(grid));
  ok(
    'Compare stays a callback — it mutates selection, not location',
    /onCompare\?\.\(product\.id\)/.test(card),
  );

  const navWriters = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file.startsWith('src/modules/marketplace/components/') &&
        /router\.(push|replace)\s*\(/.test(text),
    )
    .map(([file]) => file);
  check('no component navigates via the router', navWriters, []);

  section('Invariants · bank logos (M2.6 scope addition)');

  const badge = sources.get('src/components/business/bank-badge.tsx');
  const financeTypes = sources.get('src/types/finance.ts');
  const bankDto = sources.get('src/modules/marketplace/types/bank.ts');
  const bankData = readFileSync(path.join(SRC, 'mocks', 'data', 'banks.ts'), 'utf8');

  ok('logoUrl is modelled on the domain Bank', /logoUrl: string \| null/.test(financeTypes));
  ok('logoUrl travels on the DTO too', /logoUrl: string \| null/.test(bankDto));
  check(
    'every mock bank declares a logo',
    (bankData.match(/logoUrl: '\/banks\//g) ?? []).length,
    6,
  );

  ok('the badge renders logos through next/image', /from 'next\/image'/.test(badge));
  ok('the monogram survives as the fallback', /bank\.initials/.test(badge));
  ok(
    'the fallback triggers on a failed load',
    /onError=\{\(\) => setLogoFailed\(true\)\}/.test(badge),
  );
  ok(
    'a null logoUrl falls back without an attempted request',
    /bank\.logoUrl !== null/.test(badge),
  );
  ok('aspect ratio is preserved, never stretched', /object-contain/.test(badge));
  ok(
    'the circular slot and its sizes are unchanged',
    /size-8/.test(badge) && /size-10/.test(badge) && /size-14/.test(badge),
  );
  ok('the name gap is unchanged', /flex items-center gap-3/.test(badge));
  ok(
    'alt text is empty only while the badge is decorative',
    /alt=\{decorative \? '' : bank\.name\}/.test(badge),
  );

  const logoBuilders = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file.startsWith('src/') && !file.startsWith('src/mocks/') && /'\/banks\//.test(text),
    )
    .map(([file]) => file);
  check(
    'no component hardcodes a logo path',
    logoBuilders.filter((f) => !f.includes('gallery')),
    [],
  );

  const bankRenderers = [
    'src/modules/marketplace/components/fd-product-card.tsx',
    'src/modules/marketplace/components/product-header.tsx',
    'src/modules/marketplace/components/featured-banks.tsx',
  ];
  check(
    'every screen showing a bank identity goes through BankBadge',
    bankRenderers.filter((file) => !/BankBadge/.test(sources.get(file) ?? '')),
    [],
  );
  check(
    'no screen renders a bank image directly',
    bankRenderers.filter((file) => /<Image|<img/.test(sources.get(file) ?? '')),
    [],
  );

  section('Invariants · component library — additive variants only');

  const bankBadge = sources.get('src/components/business/bank-badge.tsx');
  const rateDisplay = sources.get('src/components/business/interest-rate-display.tsx');
  // The size map became the SLOT map in M2.6 when logo support landed; the
  // sizes themselves are unchanged, which is the property that matters.
  ok('BankBadge still offers the lg size added in M2.6', /lg: \{ box: 'size-14'/.test(bankBadge));
  ok(
    'BankBadge keeps its original sm and md sizes',
    /sm: \{ box: 'size-8'/.test(bankBadge) && /md: \{ box: 'size-10'/.test(bankBadge),
  );
  ok(
    'InterestRateDisplay defaults are unchanged',
    /caption = 'per annum'/.test(rateDisplay) && /layout = 'stacked'/.test(rateDisplay),
  );
  ok(
    'InterestRateDisplay keeps its stacked geometry',
    /stacked: 'flex-col items-end'/.test(rateDisplay),
  );

  section('Invariants · G1 — the deprecated search key');

  const pagination = sources.get('src/types/pagination.ts');
  ok(
    'PaginationParams still declares search (approved: not removed in M2.5)',
    /search\?:/.test(pagination),
  );
  ok(
    'search is marked deprecated',
    /@deprecated/.test(readFileSync(path.join(SRC, 'types', 'pagination.ts'), 'utf8')),
  );
  const searchSenders = [...sources.entries()]
    .filter(
      ([file, text]) => file.startsWith('src/modules/marketplace/') && /\bsearch:\s/.test(text),
    )
    .map(([file]) => file);
  check('no Marketplace code sends `search` to the API', searchSenders, []);

  section('Invariants · T2.7.1a — the comparison batch is detail-level');

  /**
   * These four probes exist so that a future tidy-up back to the summary type
   * fails loudly. Without them the Eligibility row would silently render
   * blank — the failure would appear in the UI, milestones later, and look
   * like a component defect rather than a transport regression.
   */
  const repoContract = sources.get('src/modules/marketplace/repositories/product-repository.ts');
  ok(
    'ProductRepository.listByIds returns detail DTOs',
    /listByIds\(ids: string\[\]\): Promise<ProductDetailsDto\[\]>/.test(repoContract),
  );

  const apiRepo = sources.get('src/modules/marketplace/repositories/api-product-repository.ts');
  ok('the batch request is typed as detail DTOs', /request<ProductDetailsDto\[\]>/.test(apiRepo));
  ok(
    'the paginated list still returns summary DTOs',
    /createApiReadRepository<ProductSummaryDto>/.test(apiRepo),
  );

  const service = sources.get('src/modules/marketplace/services/product-service.ts');
  ok(
    'getProductsByIds returns ProductDetails[]',
    /getProductsByIds\([\s\S]*?\): Promise<ProductDetails\[\]>/.test(service),
  );
  ok(
    'the batch maps through toDetails, not toSummary',
    /listByIds\(ids\);\s*return dtos\.map\(\(dto\) => toDetails\(/.test(service),
  );

  const productHandlers = sources.get('src/mocks/handlers/products.ts');
  ok(
    'the ?ids= branch serves detail payloads',
    /\.map\(buildProductDetails\)/.test(productHandlers),
  );

  const productData = sources.get('src/mocks/data/products.ts');
  ok(
    "eligibility residency is 'Resident', so the approved cell reads 'Resident, 18+'",
    /residency: 'Resident',/.test(productData),
  );

  /**
   * Stated as an exact list rather than "only the service": the details screen
   * legitimately calls the formula for the interactive calculator (M2.6,
   * T2.6.5), where the user supplies the principal. What must not appear is a
   * *third* call site — in particular the comparison, whose figures are
   * already derived upstream (plan H3).
   */
  const maturityCallers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file !== 'src/modules/marketplace/utils/maturity.ts' && /calculateMaturity\(/.test(text),
    )
    .map(([file]) => file)
    .sort();
  check('the maturity formula still has exactly two call sites', maturityCallers, [
    'src/modules/marketplace/components/product-detail-screen.tsx',
    'src/modules/marketplace/services/product-service.ts',
  ]);

  section('Invariants · T2.7.2 — the second URL writer');

  const compareUrl = sources.get('src/modules/marketplace/utils/compare-url.ts');
  const compareUrlState = sources.get('src/modules/marketplace/hooks/use-compare-url-state.ts');

  ok(
    'the pure module imports no service, repository, hook, or router',
    !/from '[^']*(services|repositories|next\/navigation|react)/.test(compareUrl ?? ''),
  );
  ok(
    'the parameter name is a constant, not a literal',
    /export const IDS_PARAM/.test(compareUrl ?? ''),
  );

  /**
   * The `'ids'` literal, scoped to the Marketplace module. `src/mocks/handlers`
   * reads the same parameter as the mock **server**; that is the other side of
   * the contract, not a second URL owner.
   */
  const idsLiterals = [...sources.entries()]
    .filter(([file, text]) => file.startsWith('src/modules/marketplace/') && /'ids'/.test(text))
    .map(([file]) => file);
  check("the 'ids' literal appears in exactly one module file", idsLiterals, [
    'src/modules/marketplace/utils/compare-url.ts',
  ]);

  ok('the parser does not know the cap (D8)', !/MAX_COMPARE|slice\(0, 4\)/.test(compareUrl ?? ''));
  ok(
    'the writer does not import the cap either — it reads selection.max (R13)',
    !/MAX_COMPARE/.test(compareUrlState ?? '') && /selection/.test(compareUrlState ?? ''),
  );
  ok(
    'the sync compares against the capped list',
    /ids\.slice\(0, max\)/.test(compareUrlState ?? ''),
  );
  ok(
    'the sync compares by value, not by reference',
    /capped\.every\(\(id, index\) => id === selectedIds\[index\]\)/.test(compareUrlState ?? ''),
  );
  ok('both writers suppress scroll', (compareUrlState?.match(/scroll: false/g) ?? []).length === 2);
  ok(
    'intent pushes and correction replaces (I8)',
    /mode === 'push'/.test(compareUrlState ?? '') &&
      /router\.push/.test(compareUrlState ?? '') &&
      /router\.replace/.test(compareUrlState ?? ''),
  );
  ok(
    'the writer follows read-then-merge, serialising from parsed values',
    /mergeCompareParams\(new URLSearchParams\(searchParams\.toString\(\)\), next\)/.test(
      compareUrlState ?? '',
    ),
  );

  const replaceAllCallers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file !== 'src/modules/marketplace/hooks/use-compare-selection.tsx' &&
        /replaceAll\s*\(/.test(text),
    )
    .map(([file]) => file);
  check('replaceAll has exactly one caller (R14)', replaceAllCallers, [
    'src/modules/marketplace/hooks/use-compare-url-state.ts',
  ]);

  section('Invariants · T2.7.3 — the /compare route and shell');

  const comparePage = sources.get('src/app/(public)/compare/page.tsx');
  const compareScreen = sources.get('src/modules/marketplace/components/compare-screen.tsx');

  ok('the compare route exists', Boolean(comparePage));
  /**
   * Required here and *not* on the details route: this screen reads
   * `useSearchParams`, which throws BailoutToCSRError during prerendering
   * (M2.4 defect C2). Copying M2.6's page shell verbatim reintroduces it.
   */
  ok(
    'the compare page carries a Suspense boundary (defect C2)',
    /<Suspense/.test(comparePage ?? '') && /from 'react'/.test(comparePage ?? ''),
  );
  ok('its metadata is static', /export const metadata/.test(comparePage ?? ''));
  ok(
    'the page owns composition only — no data access',
    !/use(Query|Compare|Products)/.test(comparePage ?? ''),
  );

  const compareRouteWriters = [...sources.entries()]
    .filter(([file, text]) => file.startsWith('src/app/(public)/compare') && /router\./.test(text))
    .map(([file]) => file);
  check('the compare route writes no URL of its own', compareRouteWriters, []);

  const urlStateConsumers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file !== 'src/modules/marketplace/hooks/use-compare-url-state.ts' &&
        /useCompareUrlState\s*\(/.test(text),
    )
    .map(([file]) => file);
  check('only CompareScreen consumes the compare URL owner (I2a)', urlStateConsumers, [
    'src/modules/marketplace/components/compare-screen.tsx',
  ]);

  /**
   * C4 rule 1: on this route intent writes the URL and nothing else. A screen
   * that also mutated the store would recreate the double write the hydrate-once
   * model was built to survive — and would reintroduce the window in which the
   * two disagree.
   */
  ok(
    'the screen never mutates the store directly (C4 rule 1)',
    !/\b(add|remove|toggle|clear|replaceAll)\(/.test(compareScreen ?? ''),
  );
  ok(
    'emptiness is read from the URL, so a cold load never flashes the empty state',
    /ids\.length === 0/.test(compareScreen ?? ''),
  );
  ok(
    'what is displayed comes from the store, so the cap governs the columns',
    // Re-pointed 2026-08-02: the batch gained a second argument (the deposit
    // amount). The rule is unchanged — the *ids* come from the store, never
    // from the URL — so the probe matches the first argument and stops there.
    /useCompareProducts\(selection\.ids,/.test(compareScreen ?? ''),
  );
  /**
   * Re-pointed in T2.7.4: the screen no longer renders the remove control
   * itself, it hands the URL writer's `removeId` to the table as `onRemove`.
   * The rule is unchanged — removal reaches the URL and nothing else — so the
   * probe follows the component tree rather than the old markup.
   */
  ok(
    'removal goes through the URL writer, passed down as a prop',
    /onRemove=\{removeId\}/.test(compareScreen ?? ''),
  );
  ok(
    'the back link is a real Link to ROUTES.home, never router.back()',
    /href=\{ROUTES\.home\}/.test(compareScreen ?? '') && !/router\.back/.test(compareScreen ?? ''),
  );

  section('Invariants · Deposit amount (client change request, 2026-08-02)');

  const amountField = sources.get('src/modules/marketplace/components/compare-amount-field.tsx');
  const compareProducts = sources.get('src/modules/marketplace/hooks/use-compare-products.ts');
  const queryKeys = sources.get('src/modules/marketplace/hooks/query-keys.ts');

  ok('the field exists', Boolean(amountField));
  /**
   * Presentation-only in the T2.7.7 sense — ownership, not signature. It takes
   * the value, the error and a change handler; it must not acquire the right to
   * decide any of them, and above all it must not calculate.
   */
  ok(
    'it owns no state, no store, no router and no query',
    !/use(State|Effect|Memo|Reducer|Router|SearchParams|Query|CompareSelection)\s*\(/.test(
      amountField ?? '',
    ),
  );
  ok(
    'and it computes nothing — the amount is a number it reports upward',
    !/calculateMaturity|parseDepositAmount|estimatedReturns/.test(amountField ?? ''),
  );

  /**
   * The amount is **client state, not a URL parameter** (approved 2026-08-02,
   * consistent with D3). `/compare`'s parameter set stays closed at one key —
   * asserted separately — so this asserts the other half: the route holds it and
   * the URL layer never hears about it.
   *
   * Re-pointed by the Investment Preferences change: the state moved off the
   * screen into `useComparisonPreferences`, so that the section can grow to
   * Tenure, Payout, Senior Citizen and Tax Saver without the screen growing a
   * `useState` pair per field. The invariant is unchanged — one owner, and it is
   * not the URL — so the assertion follows the owner rather than the literal
   * `useState` call it used to be.
   */
  const preferences = sources.get('src/modules/marketplace/hooks/use-comparison-preferences.ts');

  ok('the preferences hook exists', Boolean(preferences));
  ok(
    'the screen takes the amount from it rather than holding its own',
    /useComparisonPreferences\(\)/.test(compareScreen ?? '') &&
      !/useState\(REFERENCE_AMOUNT\)/.test(compareScreen ?? ''),
  );
  ok(
    'and the hook owns it as local state, never the URL',
    /useState\(REFERENCE_AMOUNT\)/.test(preferences ?? '') &&
      !/useRouter|useSearchParams|usePathname/.test(preferences ?? ''),
  );

  /**
   * The preferences are modelled as an **object**, not as a bag of loose values.
   * This is the structural half of "reusable as Investment Preferences, not just
   * a single Deposit Amount input": a hook returning a `ComparisonPreferences`
   * absorbs the next field, whereas one returning `amount` directly would need a
   * new return value — and a new prop threaded through the screen — for each.
   */
  ok(
    'preferences are one object, so the next field is a key rather than a rewrite',
    /interface ComparisonPreferences/.test(preferences ?? '') &&
      /preferences: \{ depositAmount: appliedDepositAmount \}/.test(preferences ?? ''),
  );

  /**
   * The section is a **container**, not a deposit-amount widget wearing a
   * heading. If it ever imports the field it arranges, the fourth preference
   * becomes an edit to this file instead of one more child — which is precisely
   * the redesign the brief asks to design out.
   */
  const preferencesSection = sources.get(
    'src/modules/marketplace/components/investment-preferences.tsx',
  );

  ok('the Investment Preferences section exists', Boolean(preferencesSection));
  ok(
    'it arranges children and knows nothing about which fields they are',
    /children: ReactNode/.test(preferencesSection ?? '') &&
      !/CompareAmountField|depositAmount/.test(preferencesSection ?? ''),
  );
  ok(
    'it owns no state and calculates nothing',
    !/use(State|Effect|Memo|Reducer|Query)\s*\(/.test(preferencesSection ?? '') &&
      !/calculateMaturity|resolveApplicableRate/.test(preferencesSection ?? ''),
  );

  /**
   * One set of preferences for both presentations. The brief requires desktop
   * and mobile to display the same calculated data; rendering the controls
   * outside both `data-compare-view` containers is what makes that structural
   * rather than a thing to keep in step — there is only one amount, so there is
   * nothing to synchronise.
   */
  ok(
    'the preferences render above the views, not inside either of them',
    /<InvestmentPreferences[\s\S]*?<\/InvestmentPreferences>[\s\S]*data-compare-view/.test(
      compareScreen ?? '',
    ),
  );

  section('Invariants · Draft vs applied (Comparison Experience Refinement, 2026-08-02)');

  /**
   * The refinement's whole architecture, stated once: **two values, and only one
   * of them is business input.**
   *
   *     input → draftDepositAmount → Update Comparison → appliedDepositAmount
   *
   * A single value with a debounce would satisfy "the table stops flickering"
   * and none of the rest — the user would still not know whether what they were
   * reading answered what they had typed. So the probes below assert the
   * *separation*, not the calmness: calmness is a consequence, and it is the
   * consequence that a later refactor would keep while quietly losing the rule.
   */
  ok(
    'the hook holds a draft and an applied value, not one value',
    /useState\(REFERENCE_AMOUNT\)/.test(preferences ?? '') &&
      /const \[draftDepositAmount, setDraftDepositAmount\] = useState\(/.test(preferences ?? '') &&
      /const \[appliedDepositAmount, setAppliedDepositAmount\] = useState\(/.test(
        preferences ?? '',
      ),
  );
  /**
   * The applied value moves through exactly two doors: the explicit apply, and
   * the one-shot products-derived default that runs before the user has an
   * opinion. A third `setAppliedDepositAmount` is a third way for the comparison
   * to change without being asked — which is the behaviour being removed.
   */
  ok(
    'the applied value is written only by applyPreferences and the seeded default',
    (preferences ?? '').split('setAppliedDepositAmount(').length - 1 === 2,
  );
  /**
   * `setDepositAmount` is the keystroke handler. If it ever touches the applied
   * value again, every probe above still passes and the screen is back to
   * recalculating as the user types.
   */
  ok(
    'a keystroke moves the draft and nothing else',
    /const setDepositAmount = useCallback\(\(raw: string\) => \{[^}]*setDraftDepositAmount\(raw\);\s*\}, \[\]\);/.test(
      preferences ?? '',
    ),
  );
  /**
   * Enter reaches `applyPreferences` directly from the field, bypassing the
   * disabled button, so the guard cannot live only in the control.
   */
  ok(
    'applying re-checks rather than trusting its caller',
    /const applyPreferences = useCallback\(\(\) => \{\s*if \(!parsed\.ok \|\| parsed\.amount === appliedDepositAmount\) return;/.test(
      preferences ?? '',
    ),
  );

  /**
   * The load-bearing consequence: **calculations read the applied value only.**
   * The draft leaves the screen exactly once, as the field's `value` — anything
   * else reading it is a calculation racing the user's typing again.
   */
  ok(
    'the screen calculates from the applied preferences',
    /const amount = preferences\.depositAmount;/.test(compareScreen ?? ''),
  );
  ok(
    'and the draft reaches the field and nothing else',
    (compareScreen ?? '').split('depositAmountInput').length - 1 === 2 &&
      /value=\{depositAmountInput\}/.test(compareScreen ?? ''),
  );

  /**
   * The apply row is a **preferences** component, not a comparison one: it takes
   * labels and a callback. The moment it formats a deposit or names the
   * comparison, the second preferences section on the platform starts by
   * copying it.
   */
  const applyBar = sources.get('src/modules/marketplace/components/preference-apply-bar.tsx');

  ok('the apply bar exists', Boolean(applyBar));
  ok(
    'it owns no state, no store, no router and no query',
    !/use(State|Effect|Memo|Reducer|Router|SearchParams|Query|CompareSelection)\s*\(/.test(
      applyBar ?? '',
    ),
  );
  ok(
    'and it knows nothing about deposits, amounts, or comparisons',
    !/deposit|Deposit|formatCurrency|Comparison|compare/.test(applyBar ?? ''),
  );
  /**
   * One live region carrying both states, so applying announces itself without a
   * toast that has to be scheduled and cleared.
   */
  ok(
    'the pending and settled messages share one polite status region',
    (applyBar ?? '').split('role="status"').length - 1 === 1 &&
      /aria-live="polite"/.test(applyBar ?? ''),
  );

  /**
   * The field reports the gesture; the screen decides what it means. Named
   * `onSubmit`/`onRevert` rather than `onApply`, and asserted as such — a field
   * that knew it applied a comparison would be a field that could not be reused
   * by one.
   */
  ok(
    'the field reports Enter and Escape without deciding what they do',
    /onSubmit\?: \(\) => void/.test(amountField ?? '') &&
      /onRevert\?: \(\) => void/.test(amountField ?? '') &&
      !/applyPreferences|appliedDepositAmount/.test(amountField ?? ''),
  );
  ok(
    'and the screen is what binds them to applying and reverting',
    /onSubmit=\{applyPreferences\}/.test(compareScreen ?? '') &&
      /onRevert=\{resetDraft\}/.test(compareScreen ?? ''),
  );
  /**
   * The action is present only while there is something to apply, so the control
   * the user just activated unmounts and focus falls to `<body>`. The screen
   * hands it back to the field — a keyboard user's next Tab must not restart at
   * the top of the page.
   *
   * The button path only: Enter never lost focus, so it stays bound to
   * `applyPreferences` directly rather than acquiring a redundant focus call.
   */
  ok(
    'applying from the button returns focus to the field it came from',
    /const handleApply = \(\) => \{\s*applyPreferences\(\);\s*amountFieldRef\.current\?\.focus\(\);/.test(
      compareScreen ?? '',
    ) && /onApply=\{handleApply\}/.test(compareScreen ?? ''),
  );

  /**
   * Apply must not reintroduce the flicker at a different moment. The amount is
   * part of the query key, so a new applied value is a cold key; without
   * `keepPreviousData` the table would empty into skeletons on every apply.
   *
   * Its cost is asserted beside it: previous data now survives an errored
   * refetch, so the screen's content guard must keep carrying `!isError`.
   */
  ok(
    'the batch keeps the previous figures while the applied amount reloads',
    /placeholderData: keepPreviousData/.test(compareProducts ?? ''),
  );
  ok(
    'so the content guard still refuses to render a comparison beside an error',
    /const comparison = ids\.length > 0 && !isError && products \? products : null;/.test(
      compareScreen ?? '',
    ),
  );
  /**
   * One transition wrapper around **both** presentations (brief: "refresh
   * desktop and mobile together"). Two would be two timings to keep in step.
   */
  ok(
    'one refresh treatment wraps both views rather than one each',
    (compareScreen ?? '').split('data-comparison-updating').length - 1 === 1 &&
      /data-comparison-updating[\s\S]*data-compare-view="desktop"[\s\S]*data-compare-view="mobile"/.test(
        compareScreen ?? '',
      ),
  );

  /**
   * Slab resolution has exactly one call site, and it is the service — the same
   * rule `calculateMaturity` has always lived under. A component resolving a
   * slab for itself would be a second opinion about the rate its own maturity
   * figure was derived from, and the two would render together perfectly.
   */
  const slabCallers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file !== 'src/modules/marketplace/utils/rate-slabs.ts' &&
        file !== 'src/modules/marketplace/utils/index.ts' &&
        /resolveApplicableRate\s*\(/.test(text),
    )
    .map(([file]) => file);

  check('resolveApplicableRate has exactly one call site', slabCallers, [
    'src/modules/marketplace/services/product-service.ts',
  ]);

  /**
   * The rate and the money it produced are published together, from one
   * resolution. Asserted on the source because the failure it guards against is
   * a *refactor* — resolving the rate once for display and again for the
   * calculation — and the two would agree until the day they did not.
   */
  ok(
    'the applied rate is the rate the maturity was computed from',
    /const appliedRate = resolveApplicableRate\(/.test(
      sources.get('src/modules/marketplace/services/product-service.ts') ?? '',
    ) &&
      /annualRate: appliedRate/.test(
        sources.get('src/modules/marketplace/services/product-service.ts') ?? '',
      ),
  );
  ok(
    'and no amount reaches the compare URL layer',
    !/amount/i.test(sources.get('src/modules/marketplace/utils/compare-url.ts') ?? '') &&
      !/amount/i.test(sources.get('src/modules/marketplace/hooks/use-compare-url-state.ts') ?? ''),
  );

  /**
   * The amount is part of the query's **identity**, not a detail of its
   * request. Two amounts are two different results; omitting it from the key
   * would serve one amount's figures for another straight from cache, and look
   * entirely correct while doing it.
   */
  ok(
    'the batch takes the amount and passes it to the service',
    /useCompareProducts\(ids: string\[\], amount: number\)/.test(compareProducts ?? '') &&
      /getProductsByIds\(ids, amount\)/.test(compareProducts ?? ''),
  );
  ok(
    'and the query key carries it',
    /compare: \(ids: string\[\], amount: number\)/.test(queryKeys ?? '') &&
      /'compare', \[\.\.\.ids\]\.sort\(\), amount\]/.test(queryKeys ?? ''),
  );

  /**
   * The returns are still computed in the service. This is the rule the change
   * was most likely to break: recomputing per amount inside a component would
   * have put a third `calculateMaturity` call site in the tree, which the exact
   * list above already forbids — this states the module-level half of it.
   */
  ok(
    'no compare component calculates a return',
    !sectionComponents
      .filter((file) => file.includes('/compare-'))
      .some((file) => /calculateMaturity|Math\.pow|\*\*/.test(sources.get(file) ?? '')),
  );

  section('Invariants · T2.7.4 — the comparison table');

  const table = sources.get('src/modules/marketplace/components/compare-table.tsx');
  const columnHeader = sources.get('src/modules/marketplace/components/compare-column-header.tsx');

  /**
   * Deferred from T2.7.1 until a caller existed. H4: one place decides row
   * order, formatting and winners, and one place consumes it.
   */
  const rowBuilderCallers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file !== 'src/modules/marketplace/utils/compare-rows.ts' &&
        /buildCompareRows\s*\(/.test(text),
    )
    .map(([file]) => file);
  check('buildCompareRows has exactly one call site (H4)', rowBuilderCallers, [
    'src/modules/marketplace/components/compare-screen.tsx',
  ]);

  ok('the table is a real table element (B1)', /<table/.test(table ?? ''));
  ok('product headers are scoped to their column', /scope="col"/.test(table ?? ''));
  ok('attribute labels are scoped to their row', /scope="row"/.test(table ?? ''));
  ok('the table is captioned', /<caption/.test(table ?? ''));

  /**
   * F2 — one prop shape. Handing `products` and `rows` in from separate call
   * sites is how a transposed index puts one bank's rate under another bank's
   * name, which looks entirely correct on screen.
   */
  /**
   * Re-pointed in T2.7.5: the prop shape moved to the shared `CompareViewProps`
   * (F2), so the assertion follows the type rather than an inline declaration.
   */
  ok('products drives the iteration', /products\.map\(\(product, index\) =>/.test(table ?? ''));

  ok(
    'the inert Select carries no state (D3)',
    /aria-disabled="true"/.test(table ?? '') && !/href/.test(table ?? ''),
  );

  for (const [name, text] of [
    ['compare-table.tsx', table],
    ['compare-column-header.tsx', columnHeader],
  ]) {
    ok(
      `${name} is presentation-only (I3)`,
      !/use(Query|Compare|Products|Router|SearchParams)\s*\(/.test(text ?? '') &&
        !/from '[^']*(services|repositories|next\/navigation)/.test(text ?? ''),
    );
    ok(
      `${name} recomputes no financial figure`,
      !/calculateMaturity|formatCurrency|toFixed/.test(text ?? ''),
    );
  }

  section('Invariants · T2.7.5 — one model, two presentations');

  const cards = sources.get('src/modules/marketplace/components/compare-cards.tsx');
  const value = sources.get('src/modules/marketplace/components/compare-value.tsx');
  const viewProps = sources.get('src/modules/marketplace/components/compare-view.ts');
  const labels = sources.get('src/modules/marketplace/utils/compare-labels.ts');
  const rowModel = sources.get('src/modules/marketplace/utils/compare-rows.ts');

  /**
   * P1 — who may ask whether a cell wins. Call-shaped, so the barrel's
   * re-export is not swept in; the definition file is excluded the way
   * `maturity.ts` is in its own probe.
   */
  const bestCellCallers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file !== 'src/modules/marketplace/utils/compare-rows.ts' && /isBestCell\s*\(/.test(text),
    )
    .map(([file]) => file)
    .sort();
  check('isBestCell has exactly three callers (P1)', bestCellCallers, [
    'src/modules/marketplace/components/compare-cards.tsx',
    'src/modules/marketplace/components/compare-table.tsx',
    'src/modules/marketplace/components/compare-value.tsx',
  ]);

  /**
   * P2 — the stronger guarantee. P1 can pass while a component still writes
   * `row.bestIndex === index` next to a call it ignores; this catches every
   * form of re-derivation, because all of them contain the token.
   */
  const bestIndexMentions = [...sources.entries()]
    .filter(([file, text]) => file.startsWith('src/modules/marketplace/') && /bestIndex/.test(text))
    .map(([file]) => file)
    .sort();
  check('bestIndex appears in exactly two files (P2)', bestIndexMentions, [
    'src/modules/marketplace/types/compare.ts',
    'src/modules/marketplace/utils/compare-rows.ts',
  ]);

  // The cell's content — and with it the C9 contract — has one implementation.
  const cellContentFiles = [...sources.entries()]
    .filter(([file, text]) => /bestQualifier\s*\(|NO_VALUE/.test(text))
    .map(([file]) => file)
    .filter((file) => file !== 'src/modules/marketplace/utils/compare-rows.ts')
    .filter((file) => file !== 'src/modules/marketplace/utils/index.ts')
    .sort();
  check('only CompareValue renders the qualifier and the empty value', cellContentFiles, [
    'src/modules/marketplace/components/compare-value.tsx',
  ]);
  ok('CompareValue announces None rather than an em dash (F3)', />None</.test(value ?? ''));
  ok(
    'the star is decorative; the qualifier carries the meaning',
    /aria-hidden="true"[\s\S]{0,80}Star|Star[\s\S]{0,80}aria-hidden/.test(value ?? ''),
  );

  /**
   * The approved highlight is declared once. It was briefly written in both
   * view components as two byte-identical strings, and that is what let the two
   * presentations behave differently without anyone noticing.
   */
  const highlightDeclarations = [...sources.entries()]
    .filter(
      ([file, text]) =>
        // Scoped to the module: `components/ui/badge.tsx` uses the same token
        // pair for its own brand variant, which is a design-system decision
        // that predates the comparison and is not the winning-cell treatment.
        file.startsWith('src/modules/marketplace/') &&
        /'bg-surface-brand-subtle text-content-brand/.test(text),
    )
    .map(([file]) => file);
  check('the winning-cell treatment is declared in exactly one place', highlightDeclarations, [
    'src/modules/marketplace/components/compare-view.ts',
  ]);
  const highlightConsumers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file !== 'src/modules/marketplace/components/compare-view.ts' &&
        /BEST_HIGHLIGHT/.test(text),
    )
    .map(([file]) => file)
    .sort();
  check('and consumed by exactly the two view components', highlightConsumers, [
    'src/modules/marketplace/components/compare-cards.tsx',
    'src/modules/marketplace/components/compare-table.tsx',
  ]);

  // F2 — both views take the same contract, and it is a shared type.
  ok('the shared view contract exists', /export interface CompareViewProps/.test(viewProps ?? ''));
  ok('the table takes it', /CompareTableProps = CompareViewProps/.test(table ?? ''));
  ok('the cards take it', /CompareCardsProps = CompareViewProps/.test(cards ?? ''));

  // §6 — accessible names for per-product controls come from one module.
  ok(
    'remove and select labels are centralised',
    /export function removeLabel/.test(labels ?? '') &&
      /export function selectLabel/.test(labels ?? ''),
  );
  const labelComposers = [...sources.entries()]
    .filter(([, text]) => /`Remove \$\{|`Select \$\{/.test(text))
    .map(([file]) => file);
  check('no component composes those names inline', labelComposers, [
    'src/modules/marketplace/utils/compare-labels.ts',
  ]);

  // §5 — row taxonomy lives with the row model; the card consumes it.
  ok(
    'the stacked-row list lives with the row model',
    /export const STACKED_COMPARE_ROWS/.test(rowModel ?? ''),
  );
  const taxonomyConsumers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file !== 'src/modules/marketplace/utils/compare-rows.ts' &&
        file !== 'src/modules/marketplace/utils/index.ts' &&
        /STACKED_COMPARE_ROWS/.test(text),
    )
    .map(([file]) => file);
  check('STACKED_COMPARE_ROWS has exactly one consumer', taxonomyConsumers, [
    'src/modules/marketplace/components/compare-cards.tsx',
  ]);

  /**
   * M2.8 — the emphasis taxonomy, held to the same rule as the stacking one.
   *
   * It is *presentation* metadata: which rows a reader scans first. It says
   * nothing about which value wins, and it must never be consulted by anything
   * that computes one — so it is declared beside the row model and consumed by
   * exactly the two view components, like the highlight itself.
   */
  ok(
    'the emphasis map lives with the row model, and is total over the row union',
    /export const COMPARE_ROW_EMPHASIS: Record<CompareRowId, CompareRowEmphasis>/.test(
      rowModel ?? '',
    ),
  );
  check(
    'COMPARE_ROW_EMPHASIS is consumed by exactly the two view components',
    [...sources.entries()]
      .filter(
        ([file, text]) =>
          file !== 'src/modules/marketplace/utils/compare-rows.ts' &&
          /COMPARE_ROW_EMPHASIS/.test(text),
      )
      .map(([file]) => file)
      .sort(),
    [
      'src/modules/marketplace/components/compare-cards.tsx',
      'src/modules/marketplace/components/compare-table.tsx',
    ],
  );
  ok(
    'and the row builder never reads it — emphasis is not a business rule',
    !/COMPARE_ROW_EMPHASIS/.test(
      (rowModel ?? '').slice(0, (rowModel ?? '').indexOf('export const COMPARE_ROW_EMPHASIS')),
    ),
  );

  // §2b — the carousel is a scrollable list, not a one-at-a-time widget.
  ok('the cards are a real list', /<ul className="flex list-none flex-col/.test(cards ?? ''));
  /**
   * **Re-pointed at the M2.8 polish**, and this closes audit finding V-4.
   *
   * The previous version tested the *whole file* for `aria-hidden`, stripping
   * one exact decorative pattern first — so it failed the moment a legitimately
   * decorative element appeared that did not match that pattern (the swipe
   * hint, whose meaning the polite status already carries), and it would have
   * masked a genuine `aria-hidden` on a card that happened to match it.
   *
   * The rule was always about **cards**, so that is what is now asserted: no
   * `<article>` opening tag carries `aria-hidden` or `inert`, and `inert`
   * appears nowhere in the file. The live equivalent is asserted in L9 against
   * the rendered DOM.
   */
  const cardTags = [...(cards ?? '').matchAll(/<article\b[^>]*>/g)].map((match) => match[0]);
  ok(
    'no card is hidden from assistive technology',
    cardTags.length > 0 &&
      cardTags.every((tag) => !/aria-hidden|inert/.test(tag)) &&
      !/\binert\b/.test(cards ?? ''),
  );
  /**
   * **Restructured 2026-08-01: the carousel became a vertical stack.**
   *
   * The two probes that stood here asserted the carousel's polite position
   * status and that its position was local state rather than the URL (I6).
   * Both described a widget that no longer exists, so they are replaced by the
   * property that now holds and is *stronger*: the mobile view owns **no state
   * at all**. A scrolling page needs no position, so there is none to leak into
   * the URL, none to mirror, and none to announce.
   */
  ok(
    'the mobile view owns no state — it renders props and reports upward (I3)',
    !/use(State|Ref|Effect|Memo|Reducer|Callback)\s*\(/.test(cards ?? '') &&
      !/router\./.test(cards ?? ''),
  );
  ok('and nothing scrolls horizontally', !/overflow-x|snap-|scrollTo|scrollLeft/.test(cards ?? ''));

  // §2 — the responsive switch, and the scoping convention it requires.
  ok(
    'both presentations render, scoped for verification',
    /data-compare-view="desktop"/.test(compareScreen ?? '') &&
      /data-compare-view="mobile"/.test(compareScreen ?? ''),
  );
  ok(
    'CSS decides which is displayed — no runtime media query',
    /hidden md:block/.test(compareScreen ?? '') &&
      /md:hidden/.test(compareScreen ?? '') &&
      !/matchMedia/.test(compareScreen ?? ''),
  );
  ok(
    'the mobile title drops the trailing word inside the single h1',
    /<span className="hidden md:inline"> Products<\/span>/.test(compareScreen ?? ''),
  );

  ok(
    'CompareCards is presentation-only (I3)',
    !/use(Query|Compare|Products)\s*\(/.test(cards ?? '') &&
      !/from '[^']*(services|repositories|next\/navigation)/.test(cards ?? ''),
  );
  ok(
    'no new design-system primitive (H1)',
    !/components\/ui\/(compare|carousel)/.test(cards ?? ''),
  );

  section('Invariants · T2.7.6 — the Add Product picker');

  const picker = sources.get('src/modules/marketplace/components/compare-picker.tsx');
  const productsHook = sources.get('src/modules/marketplace/hooks/use-products.ts');

  ok('the picker exists', Boolean(picker));
  ok(
    'it is presentation-only — no data hook, no router, no store (I3)',
    !/use(Query|Products|Compare|Router|SearchParams)\s*\(/.test(picker ?? '') &&
      !/from '[^']*(services|repositories|next\/navigation)/.test(picker ?? ''),
  );

  /**
   * D-M4, enforced on the import — the layer that works.
   *
   * The obvious probe ("the picker contains no `<Link>`") does not catch this:
   * a picker importing `FDProductCard` contains neither `<Link>` nor
   * `ROUTES.product`, because the link is inside the card. It would pass while
   * the exact defect shipped, in the same shape as the O1 probe that never
   * looked at the file where the second enforcer lived.
   */
  ok(
    'the picker does not import FDProductCard (D-M4, primary)',
    !/fd-product-card|FDProductCard/.test(picker ?? ''),
  );
  ok(
    'and hand-rolls no product link either (D-M4, secondary)',
    !/<Link|ROUTES\.product/.test(picker ?? ''),
  );

  // D-AUTH — count from the URL, limit from the store; the cap stays one owner.
  ok(
    'isFull is derived from the URL count and the store limit',
    /ids\.length >= selection\.max/.test(compareScreen ?? ''),
  );
  ok(
    'isSelected is derived from the URL ids',
    /ids\.includes\(productId\)/.test(compareScreen ?? ''),
  );
  ok(
    'neither the picker nor the screen names the cap itself',
    !/MAX_COMPARE/.test(picker ?? '') && !/MAX_COMPARE/.test(compareScreen ?? ''),
  );

  // D-PENDING — one Add at a time, with a two-branch clear condition.
  ok('the screen owns a pending Add', /pendingAddId/.test(compareScreen ?? ''));
  ok(
    'the guard clears on either branch, so a no-op cannot deadlock it',
    /ids !== idsAtAdd\.current \|\| ids\.includes\(pendingAddId\)/.test(compareScreen ?? ''),
  );
  ok('and it disables every Add while in flight', /isAddPending/.test(picker ?? ''));

  // D-M2 — the catalogue is owned by the screen and gated on the dialog.
  ok(
    'useProducts gained an additive enabled option',
    /options\?\.enabled \?\? true/.test(productsHook ?? ''),
  );
  ok('the catalogue query is gated on the dialog', /enabled: pickerOpen/.test(compareScreen ?? ''));

  // D-M3 — nothing on this route reaches for Home's URL state.
  const homeUrlStateUsers = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file.startsWith('src/modules/marketplace/components/compare') &&
        /useMarketplaceUrlState/.test(text),
    )
    .map(([file]) => file);
  check('no compare component imports the Home URL writer', homeUrlStateUsers, []);

  // §6 — one home for the per-product control names.
  ok('the Add name is centralised', /export function addLabel/.test(labels ?? ''));
  ok('and the picker reads it rather than composing one', /addLabel\(/.test(picker ?? ''));

  section('Invariants · T2.7.7 — the comparison action bar');

  const compareActionBar = sources.get('src/modules/marketplace/components/compare-action-bar.tsx');

  ok('the action bar exists', Boolean(compareActionBar));

  /**
   * D-A2 — the rule is **ownership**, not the signature. A prop is permitted
   * (Booking will need `onProceed`); acquiring the authority is not. So this
   * asserts the bar owns no state and derives nothing, rather than freezing
   * today's empty prop list.
   */
  ok(
    'it owns no state and derives nothing (D-A2)',
    !/use(State|Reducer|Memo|Callback|Effect|Ref)\s*\(/.test(compareActionBar ?? '') &&
      !/use(CompareSelection|CompareUrlState|CompareProducts|Products|Router|SearchParams)\s*\(/.test(
        compareActionBar ?? '',
      ) &&
      !/from '[^']*(services|repositories|next\/navigation|hooks)/.test(compareActionBar ?? ''),
  );

  // D-A4 / D-A5 — one real link out, one inert control with no destination.
  ok(
    'Back is a Link to ROUTES.home, never router.back()',
    /href=\{ROUTES\.home\}/.test(compareActionBar ?? '') &&
      !/router\.back/.test(compareActionBar ?? ''),
  );
  ok(
    'Proceed to Booking is inert and carries no destination or state (D3)',
    /aria-disabled="true"/.test(compareActionBar ?? '') &&
      !/href=\{ROUTES\.(compare|product)/.test(compareActionBar ?? '') &&
      !/ids|selection|products/.test(compareActionBar ?? ''),
  );

  // D-A1 / D-A3 — the screen decides where and whether.
  /**
   * Behavioural, not syntactic (T2.7.7 review, Minor 1). The earlier version
   * matched an exact JSX string, so `{hasComparison && <CompareActionBar />}`
   * — identical in behaviour — would have failed it, and so would the first
   * prop, which D-A2 explicitly permits. It now asserts the *decision*: one
   * derived value exists, it carries all three guards, and the bar's only
   * render site is gated on it.
   *
   * **Re-pointed at T2.7.8a**, not weakened: the derivation now binds the data
   * rather than `Boolean(products)`, so the guard narrows and the render sites
   * type-check. All three guards are still asserted — that is the substance of
   * the T2.7.7 correction, and the re-point exists only because the previous
   * form pinned the exact string it replaced.
   *
   * No probe here forbids `!`, `as`, or `?? []` at the render sites. That was
   * proposed and withdrawn: it would enumerate three wrong fixes and miss the
   * rest. `npm run typecheck` is the authoritative check — with `comparison`
   * narrowed, a cast is unavailable without deleting the narrowing, and `tsc`
   * rejects that.
   */
  ok(
    'the screen derives the decision once, with every guard (D-A3)',
    /const comparison = ids\.length > 0 && !isError && products \? products : null/.test(
      compareScreen ?? '',
    ) && /const hasComparison = comparison !== null/.test(compareScreen ?? ''),
  );
  ok(
    'and CompareActionBar is rendered only under that decision',
    (compareScreen?.match(/<CompareActionBar/g) ?? []).length === 1 &&
      /hasComparison[^\n]*<CompareActionBar/.test(compareScreen ?? ''),
  );
  /**
   * D-A7 — the bar spans the page and carries its own `container-page`, so the
   * screen must not wrap it in a second one. Asserted as a count rather than by
   * matching source adjacency: nesting the two containers re-applies the gutter
   * and insets the bar from the table above it, and *that* is the defect —
   * where the JSX happens to sit is not.
   */
  check(
    'the screen declares exactly one reading container',
    (compareScreen?.match(/container-page/g) ?? []).length,
    1,
  );
  check(
    'and the bar carries its own, like DetailActionBar',
    (compareActionBar?.match(/container-page/g) ?? []).length,
    1,
  );
  ok('it carries the journey scope (D-A8)', /data-compare-actions/.test(compareActionBar ?? ''));

  section('Invariants · T2.7.1 — buildCompareRows is pure');

  const compareRows = sources.get('src/modules/marketplace/utils/compare-rows.ts');

  ok('the row builder exists', Boolean(compareRows));
  ok(
    'it imports no service, repository, hook, or router',
    !/from '[^']*(services|repositories|next\/navigation|react)/.test(compareRows ?? ''),
  );
  ok(
    'it holds no React state and runs no query',
    !/use(State|Memo|Effect|Query|CompareSelection)\s*\(/.test(compareRows ?? ''),
  );
  ok(
    'it delegates every money and rate string to the shared formatters',
    !/₹|toFixed\(|Intl\.NumberFormat/.test(compareRows ?? ''),
  );
  ok(
    'it does not recompute a financial figure',
    !/calculateMaturity|calculateInterestEarned/.test(compareRows ?? ''),
  );

  /**
   * C2 — the placeholder `CompareSelection` collided by name with the live
   * context type, so the same import name resolved to two different shapes.
   * The context type (hooks/) is the only one that may exist.
   */
  const compareTypes = sources.get('src/modules/marketplace/types/compare.ts');
  ok('the dead CompareSelection placeholder is gone', !/CompareSelection/.test(compareTypes ?? ''));
  ok(
    'CompareSelection is exported from exactly one place',
    [...sources.entries()].filter(([, text]) =>
      /export (interface|type) CompareSelection\b/.test(text),
    ).length === 1,
  );

  // C3 — row ids are a union, so a misspelling or a forgotten row fails to compile.
  ok(
    'CompareRowId is a union of the approved rows',
    /export type CompareRowId/.test(compareTypes ?? ''),
  );
  ok('CompareRow.id uses it', /id: CompareRowId;/.test(compareTypes ?? ''));

  section('Invariants · T2.7.3b — the entry to the comparison (R15a)');

  const entryBar = sources.get('src/modules/marketplace/components/compare-entry-bar.tsx');

  ok('the entry bar exists', Boolean(entryBar));
  /**
   * Presentation-only in the T2.7.7 sense — **ownership, not signature**. It
   * takes props (count, href, onClear) and that is fine; what it must never do
   * is acquire the authority to decide any of them.
   */
  ok(
    'it owns no state, no store, no router and no query',
    !/use(State|Effect|Memo|Reducer|Router|SearchParams|Query|CompareSelection)\s*\(/.test(
      entryBar ?? '',
    ),
  );
  ok(
    'it reads the selection through no import of its own',
    !/use-compare-selection|next\/navigation/.test(entryBar ?? ''),
  );
  /**
   * The href is *given*, never built here: composing it would put the `?ids=`
   * shape in a second place and split what `compare-url.ts` owns.
   */
  ok(
    'it does not compose a compare URL',
    !/serialiseCompareIds|compareHref|IDS_PARAM|ROUTES\.compare/.test(entryBar ?? ''),
  );
  ok('it carries the journey scope', /data-compare-entry/.test(entryBar ?? ''));
  ok(
    'sticky, so it cannot occlude the last row of the grid',
    /sticky bottom-0/.test(entryBar ?? ''),
  );

  /**
   * C5 — Home is context-authoritative. The entry navigates and Clear writes
   * the store; neither may write Home's URL, and `home-screen.tsx` must remain
   * the single Marketplace URL writer it already is (asserted by the exact
   * writer list above, which this must not enlarge).
   */
  ok(
    'HomeScreen composes the href through the module that owns ?ids=',
    /compareHref\(compare\.ids\)/.test(home ?? ''),
  );
  ok(
    'and never writes ?ids= into its own URL',
    !new RegExp(`${'ids'}=|IDS_PARAM`).test(home ?? ''),
  );
  ok(
    'the href is recomputed each render, never memoised across selections (R-1)',
    !/useMemo\([^)]*compareHref/.test(home ?? ''),
  );
  /**
   * The threshold has an owner. `count >= 2` written inline in a screen is O1
   * in miniature: a rule discoverable only by grep.
   */
  ok(
    'the entry threshold is the named constant, not a literal',
    /compare\.count >= MIN_COMPARE/.test(home ?? ''),
  );
  check(
    'MIN_COMPARE is declared in exactly one file',
    [...sources.entries()]
      .filter(([, text]) => /export const MIN_COMPARE/.test(text))
      .map(([file]) => file),
    ['src/modules/marketplace/constants/compare.ts'],
  );

  ok(
    'the href builder uses ROUTES.compare rather than a path literal',
    /ROUTES\.compare/.test(compareUrl ?? '') && !/'\/compare'/.test(compareUrl ?? ''),
  );
  ok(
    'and it still navigates nothing — the pure layer has no router',
    !/next\/navigation|router\./.test(compareUrl ?? ''),
  );
}
