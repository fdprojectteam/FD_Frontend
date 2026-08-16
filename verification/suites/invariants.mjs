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
  /*
    Re-pointed, not relaxed. Booking's step hook became the third router writer
    when the journey was completed to eight steps — and it is exactly **one**
    writer for all eight, which is the guarantee that matters: were each screen
    to navigate for itself, step six and step seven could disagree about the
    order. The list is still exact, so a fourth writer has to arrive with an
    edit here.
  */
  check('exactly three modules write a URL, one per concern', routerWriters.sort(), [
    'src/modules/booking/hooks/use-booking-step.tsx',
    'src/modules/marketplace/hooks/use-compare-url-state.ts',
    'src/modules/marketplace/hooks/use-marketplace-url-state.ts',
  ]);
  /*
    And the Booking one is the module's only navigator: no screen, section or
    page under `modules/booking` may push a route itself.
  */
  check(
    'no Booking screen navigates for itself',
    [...sources.entries()]
      .filter(([file]) => file.startsWith('src/modules/booking/'))
      .filter(([file]) => file !== 'src/modules/booking/hooks/use-booking-step.tsx')
      .filter(([, text]) => /useRouter\s*\(|router\.(push|replace)\s*\(/.test(text))
      .map(([file]) => file),
    [],
  );

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
   * Two from T2.7.3 — the product builder and `compare`, which became a real
   * route — a third from T3.1 (`bookingOverview`), a fourth from T3.2.7
   * (`bookingInvestmentDetails`) and a fifth from T3.3.2 (`bookingNominee`).
   * `marketplace` stays an unasserted plain string: it is a phantom, and leaving
   * it untyped is what makes a premature link fail to compile rather than ship a
   * 404 (E4).
   *
   * **Re-pointed, not relaxed** — at T3.3.2, at Goal-Based FD Step 5 for
   * `goalPlanner`, and again for `goalPlannerPlan` (client source document, Use
   * Case 2). The probe still names an exact number, so the eighth cast has to
   * arrive with a route behind it and an edit here, which is the whole point of
   * counting rather than pattern-matching.
   */
  /*
    Twelve after the booking journey was completed: the seven above plus
    `bookingBankAccount`, `bookingReview`, `bookingPayment`, `bookingProcessing`
    and `bookingSuccess`. Still an exact number, so the thirteenth cast has to
    arrive with a route behind it.
  */
  check(
    'routes.ts asserts exactly twelve Routes (E4)',
    (routes.match(/as Route/g) ?? []).length,
    12,
  );
  /*
    **One booking flow, one route family.** Every booking path is built here and
    every one lives under the same `/booking/${productId}/` segment — so a
    second entry point cannot bring a second flow with it. This is the structural
    form of the convergence requirement.
  */
  const bookingBuilders = [...(routes ?? '').matchAll(/`(\/booking\/[^`]*)`/g)].map(
    (match) => match[1],
  );
  ok('every booking route is declared in routes.ts', bookingBuilders.length === 8);
  check(
    'and every one is a step of the same product journey',
    bookingBuilders.filter((path) => !path.startsWith('/booking/${productId}/')),
    [],
  );
  /**
   * Re-pointed at T2.7.3b. The previous probe was named "and nowhere else" but
   * read only `routes.ts`, so it could never have seen the casts in the URL
   * writers — a name claiming more than its assertion, which is the failure
   * mode this milestone kept producing.
   *
   * The honest invariant is an exact **file list**: a cast is permitted where a
   * runtime query string is composed, which `typedRoutes` cannot check
   * statically. A new entry appearing — especially in a *component* — means a
   * screen has learned how a URL is shaped, and this probe must fail rather than
   * absorb it.
   *
   * **Re-pointed, not relaxed** (Home → planner intent preservation). The fourth
   * entry is `constants/goal-entry.ts`, which composes `?goal=…` so a goal chosen
   * on Home is carried into the planner instead of being asked again. It is a
   * constants file, not a component: the URL shape is declared in one place and
   * the section that renders it only reads `goal.href`. That is the same
   * discipline the other three follow.
   */
  check(
    'and a runtime Route cast exists only where a query string is composed (E4)',
    [...sources.entries()]
      .filter(([file, text]) => file !== 'src/constants/routes.ts' && /as Route/.test(text))
      .map(([file]) => file)
      .sort(),
    [
      'src/modules/marketplace/constants/goal-entry.ts',
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

  section('Invariants · Only the API may say "not found" (2026-08-02)');

  /**
   * The screen's `notFound()` is a **navigation**, and the only thing standing
   * between a failed request and it is `isNotFoundError`. That predicate used to
   * accept any HTTP 404 — including the Next dev server's HTML 404, which is
   * what answers `/api/v1/*` whenever a request escapes the Service Worker
   * (`src/app/api/` has no route handlers by design). So an unintercepted
   * request rendered a 404 page instead of the retryable error card, and did it
   * intermittently, because interception is intermittent.
   *
   * The fix is a provenance field on `ApiError`, not a check at the call site:
   * one predicate guards a navigation, and it must be impossible to reach with a
   * failure the API never issued.
   *
   * Behaviour is asserted in the unit suite; these probes hold the *structure*
   * that keeps it true — the parts a refactor could quietly undo while every
   * behavioural test still passed.
   */
  const apiError = sources.get('src/services/api/api-error.ts');
  const apiClient = sources.get('src/services/api/api-client.ts');
  const mockBrowser = sources.get('src/mocks/browser.ts');

  ok('the error module exists', Boolean(apiError));
  ok(
    'failures carry where they came from',
    /readonly source: ApiErrorSource/.test(apiError ?? '') &&
      /this\.source = params\.source \?\? 'transport'/.test(apiError ?? ''),
  );
  ok(
    'a not-found verdict requires the API to have issued it',
    /export function isNotFoundError[\s\S]*?if \(error\.source !== 'api'\) return false;/.test(
      apiError ?? '',
    ),
  );
  ok(
    'and so does the no-retry rule, for the same reason',
    /export function isClientError[\s\S]*?error\.source === 'api'/.test(apiError ?? ''),
  );
  /**
   * The envelope is the API's signature, and the check is guarded on the object
   * type: an HTML error page parses as a **string**, and `'…'.success` is
   * `undefined` rather than a type error — so a body that is plainly not ours
   * used to fall through wearing the same shape as a real API failure.
   */
  ok(
    'the envelope is what identifies the API, checked as an object',
    /typeof payload === 'object' && payload\.success === false/.test(apiError ?? ''),
  );

  /**
   * An **exact list** of everything allowed to claim `source: 'api'`: the two
   * envelope parsers, and nothing else. A component or repository asserting it
   * would be re-opening the defect from a new direction.
   */
  check(
    'only the envelope parsers may speak for the API',
    [...sources.entries()]
      .filter(([, text]) => /source: 'api'/.test(text))
      .map(([file]) => file)
      .sort(),
    ['src/services/api/api-client.ts', 'src/services/api/api-error.ts'],
  );
  ok('the transport still never decides what a failure means', Boolean(apiClient));

  /**
   * The other half: a `/api/v1/*` request the mock API does not handle must not
   * reach the dev server, because whatever the dev server answers will be
   * mistaken for the API by *something*, eventually. `'bypass'` alone made that
   * silent for a milestone.
   */
  ok(
    'an unhandled API request is reported rather than passed through',
    /onUnhandledRequest\(request, print\)/.test(mockBrowser ?? '') &&
      /print\.error\(\)/.test(mockBrowser ?? '') &&
      !/onUnhandledRequest: 'bypass'/.test(mockBrowser ?? ''),
  );
  ok(
    'and the API base is matched as a URL, not as a string prefix',
    /new URL\(env\.apiUrl, window\.location\.origin\)/.test(mockBrowser ?? ''),
  );
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
  /*
    **A pre-existing failure, corrected rather than deleted.** The assertion
    named `formatTenure`, and KeyInfoGrid moved to `formatProductTenure` when
    day-based terms arrived — the day-aware formatter that renders "91 days" as
    91 days instead of rounding it into months. The probe kept naming the
    superseded helper and had been failing silently ever since.

    Re-pointed to the **stronger** guarantee: it must use the day-aware
    formatter, and must not do month arithmetic of its own.
  */
  ok(
    'KeyInfoGrid formats tenure through the day-aware shared util',
    /formatProductTenure/.test(keyInfo),
  );
  ok('and computes no tenure of its own', !/tenureMonths\s*[/*+-]|\/\s*12\b/.test(keyInfo ?? ''));
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
  /**
   * **The service owns the calculation, and the screen renders it.**
   *
   * Stronger than the previous "the screen owns it": the calculator amount and
   * the reference figure now come from one function, `estimateReturnsFor`, in
   * the service that already resolved the rate. Two implementations of one
   * pricing rule are one refactor apart from disagreeing.
   */
  ok('the screen computes nothing itself', !/calculateMaturity\(/.test(screen));
  ok('and reads returns from the service', /estimateReturnsFor\(/.test(screen));
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
    'booking navigation preserves the product id and fails closed when unavailable',
    /bookingHref/.test(actionBar) &&
      /Booking unavailable/.test(actionBar) &&
      !/amount/.test(actionBar),
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

  /**
   * Only a **data layer** may contain a logo path. Components receive `Bank`
   * and render `bank.logoUrl`; the moment one builds `/banks/${id}.svg` for
   * itself, the naming scheme has two owners and the second one is wrong on the
   * first bank whose file is a `.png`.
   *
   * Exempt, as an exact list of *kinds* rather than of files:
   *   • `src/mocks/` — the mock API's own data;
   *   • `fixtures/` — a stand-in for a server payload (T3.1). A payload
   *     legitimately carries a logo URL, and the folder name is what keeps the
   *     exemption from creeping into a component: no component lives in one;
   *   • the dev-only gallery, which demonstrates the badge itself.
   */
  const logoBuilders = [...sources.entries()]
    .filter(
      ([file, text]) =>
        file.startsWith('src/') &&
        !file.startsWith('src/mocks/') &&
        !file.includes('/fixtures/') &&
        /'\/banks\//.test(text),
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
   * T2.6.5), where the user supplies the principal. What must not appear is an
   * *unaccounted* call site — in particular the comparison, whose figures are
   * already derived upstream (plan H3).
   *
   * **Re-pointed at T3.2.4, not loosened.** Booking added two entries, and both
   * are accounted for below. The probe deliberately keeps naming an exact list:
   * a probe that is relaxed to a count or an upper bound is how an invariant
   * quietly stops being one.
   *
   * `src/utils/maturity.ts` is excluded alongside Marketplace's copy because
   * both *declare* the formula rather than call it. That there are two
   * declarations is **TD-001**, contained by six cross-implementation
   * assertions in the unit suite and scheduled for removal by refactor R1
   * (`docs/engineering/shared-finance-layer.md`). After R1 this exclusion list
   * drops back to one entry.
   */
  const FORMULA_DECLARATIONS = [
    'src/modules/marketplace/utils/maturity.ts',
    'src/utils/maturity.ts', // TD-001 — removed by R1
  ];
  const maturityCallers = [...sources.entries()]
    .filter(
      ([file, text]) => !FORMULA_DECLARATIONS.includes(file) && /calculateMaturity\(/.test(text),
    )
    .map(([file]) => file)
    .sort();
  /*
    Three, not four: the Product Details screen no longer calls the formula —
    `estimateReturnsFor` in the service does, for both the reference figure and
    the calculator amount.
  */
  check('the maturity formula still has exactly three call sites', maturityCallers, [
    // Booking's returns model — the only Booking caller, and it composes the
    // formula with payout rules rather than calling it from a component.
    'src/modules/booking/utils/returns.ts',
    // Goal-Based FD's rule engine — one call per recommendation, from the quote
    // resolved for that principal. Re-pointed rather than loosened when the
    // fourth consumer arrived.
    'src/modules/goal-based-fd/utils/engine.ts',
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
        // Re-export shims and the canonical declaration are not call sites.
        file !== 'src/modules/marketplace/utils/rate-slabs.ts' &&
        file !== 'src/modules/marketplace/utils/index.ts' &&
        file !== 'src/utils/finance/rates.ts' &&
        file !== 'src/utils/finance/index.ts' &&
        file !== 'src/utils/index.ts' &&
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

  /*
    Re-pointed at the Comparison → Booking wiring, and to the **stronger**
    guarantee. Select is no longer inert — Comparison is a documented entry
    point into Booking — but it still owns nothing: it reports a choice upward
    and carries no destination of its own. The bar below it holds the single
    route, so there is one way out of this screen into Booking rather than one
    per column.
  */
  for (const [name, text] of [
    ['compare-table.tsx', table],
    ['compare-cards.tsx', sources.get('src/modules/marketplace/components/compare-cards.tsx')],
  ]) {
    ok(`${name}'s Select reports upward`, /onSelect\?\.\(product\.id\)/.test(text ?? ''));
    ok(
      `${name}'s Select announces which product is chosen`,
      /aria-pressed=\{selectedProductId === product\.id\}/.test(text ?? ''),
    );
    ok(`${name}'s Select carries no destination`, !/href/.test(text ?? ''));
    ok(`${name} builds no route itself`, !/ROUTES\./.test(text ?? ''));
  }

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
  /*
    **A pre-existing bug in this probe, fixed.** It destructured `([text])`,
    which binds the *file path*, so the regex was tested against a filename and
    could never match: the list was always empty and the check always failed.
    Corrected to `([, text])` so the assertion actually inspects file contents —
    which is what it was written to do, and what makes it an invariant again.
  */
  const cellContentFiles = [...sources.entries()]
    .filter(([, text]) => /bestQualifier\s*\(|NO_VALUE/.test(text))
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
      /hasComparison \? \([\s\S]{0,400}?<CompareActionBar/.test(compareScreen ?? ''),
  );
  /*
    **Comparison converges on the canonical Booking route.** The screen builds
    `ROUTES.bookingOverview` — the same builder Product Details and Goal-Based
    FD use — so all three entry points lead to one flow. A Comparison-specific
    booking path would have to be written somewhere, and there is nowhere left
    to write it.
  */
  ok(
    'Comparison hands off to the canonical Booking entry point',
    /ROUTES\.bookingOverview\(bookableProductId, amount\)/.test(compareScreen ?? ''),
  );
  /*
    And with the **applied** amount, never the draft the customer is still
    typing. `amount` is `preferences.depositAmount` — the figure every column on
    screen was priced against, which is what they are choosing between. Handing
    over `depositAmountInput` would give Booking text they had not confirmed.
  */
  ok(
    'using the applied comparison amount, not the unconfirmed draft',
    /const amount = preferences\.depositAmount/.test(compareScreen ?? '') &&
      !/bookingOverview\([^)]*depositAmountInput/.test(compareScreen ?? ''),
  );
  ok(
    'and drops the selection when that product leaves the comparison',
    /ids\.includes\(selectedProductId\)/.test(compareScreen ?? ''),
  );
  check(
    'no module builds a booking route other than the shared entry point',
    [...sources.entries()]
      .filter(([, text]) => /['\"`]\/booking\//.test(text))
      .filter(([file]) => file !== 'src/constants/routes.ts')
      .map(([file]) => file),
    [],
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

  /* ================================================================ */
  section('Invariants · Booking module boundaries (T3.2)');

  const bookingFiles = [...sources.entries()].filter(([file]) =>
    file.startsWith('src/modules/booking/'),
  );

  ok('the Booking module has files to police', bookingFiles.length > 0);

  /**
   * The boundary that matters most while two modules are being built at once.
   * ESLint enforces it too; asserting it here means a disabled rule or a
   * loosened config cannot quietly let Booking reach into Marketplace.
   */
  check(
    'no Booking file imports from Marketplace',
    bookingFiles.filter(([, text]) => /@\/modules\/marketplace/.test(text)).map(([file]) => file),
    [],
  );

  /**
   * Priority 4 of the standing instruction: Marketplace is not modified without
   * explicit instruction. Stated as a probe so the constraint is checkable
   * rather than remembered — no Marketplace file may reach into Booking either,
   * which is how an "innocent" shared helper starts a two-way dependency.
   */
  check(
    'no Marketplace file imports from Booking',
    [...sources.entries()]
      .filter(([file]) => file.startsWith('src/modules/marketplace/'))
      .filter(([, text]) => /@\/modules\/booking/.test(text))
      .map(([file]) => file),
    [],
  );

  /**
   * Document 09 §4/§5 place the booking draft in the feature tier and reserve
   * the global store for application-wide state. A Zustand import inside
   * Booking would be the drift this plan argued against in writing.
   */
  check(
    'Booking holds its draft in module context, not the global store',
    bookingFiles.filter(([, text]) => /zustand|@\/store/.test(text)).map(([file]) => file),
    [],
  );

  /**
   * Document 09 §10 and BR-INV-004: derived figures are recalculated, never
   * stored. The draft type is where that rule is enforced by omission, so the
   * probe reads the type rather than trusting the comment above it.
   */
  const draftType = sources.get('src/modules/booking/types/draft.ts');
  ok('the draft type exists', Boolean(draftType));
  ok(
    'and declares no maturity, interest or rate field',
    !/\b(maturityValue|maturityAmount|interestEarned|totalInterest|annualRate|interestRate)\b\s*[?:]/.test(
      draftType ?? '',
    ),
  );

  /**
   * Two vocabularies, one bridge (T3.2.1). A screen that mapped a route to a
   * phase for itself is how step five and step six come to disagree about which
   * quarter of the journey they are in.
   */
  check(
    'the step → phase mapping is declared in exactly one file',
    [...sources.entries()]
      .filter(([, text]) => /export function resolveBookingPhase/.test(text))
      .map(([file]) => file),
    ['src/modules/booking/constants/phases.ts'],
  );
  check(
    'BOOKING_PHASES is declared in exactly one file',
    [...sources.entries()]
      .filter(([, text]) => /export const BOOKING_PHASES/.test(text))
      .map(([file]) => file),
    ['src/modules/booking/constants/phases.ts'],
  );

  /**
   * Every screen that renders progress must feed `Stepper` the *phases*.
   * Passing `BOOKING_STEPS` would put eight markers back on the screen and
   * silently undo the Founder Note correction.
   */
  const stepperConsumers = bookingFiles.filter(([, text]) => /<Stepper\b/.test(text));
  ok('at least one Booking screen renders the rail', stepperConsumers.length > 0);
  check(
    'no Booking screen feeds Stepper the eight-step list',
    stepperConsumers
      .filter(([, text]) => /steps=\{\[\.\.\.BOOKING_STEPS\]\}/.test(text))
      .map(([file]) => file),
    [],
  );

  /* ================================================================ */
  section('Invariants · Investment Details shell (T3.2.7)');

  const detailsScreen = sources.get('src/modules/booking/components/investment-details-screen.tsx');
  ok('the screen exists', Boolean(detailsScreen));

  /**
   * The screen **consumes** the domain layer; it does not restate any of it.
   * Four tasks went into giving these rules one owner each, and a screen that
   * recomputed a return or re-derived a rate would be the second opinion the
   * module has spent those tasks avoiding.
   *
   * Re-pointed at T3.2.8: the screen now *calls* `calculateReturns` and
   * `validateAmount`, which is consumption. What it must never do is implement
   * either — so the probes below assert it holds no arithmetic and no limits of
   * its own.
   */
  ok(
    'the screen implements no maturity arithmetic',
    !/calculateMaturity|calculateSimpleInterest|\*\*\s*\(|Math\.pow/.test(detailsScreen ?? ''),
  );
  ok('and resolves no rate for itself', !/resolveRate/.test(detailsScreen ?? ''));
  ok(
    'and compares no amount against a limit of its own',
    !/minInvestment\s*[<>]|maxInvestment\s*[<>]|amount\s*[<>]/.test(detailsScreen ?? ''),
  );
  ok('it delegates the verdict to the validator', /validateAmount\(/.test(detailsScreen ?? ''));
  ok('and the figures to the returns engine', /calculateReturns\(/.test(detailsScreen ?? ''));

  /**
   * The C3b rule lives in a pure function, not in the component. A chip filter
   * written in JSX could not be asserted against the validator, and "every chip
   * is valid" would become a claim rather than a property.
   */
  ok(
    'quick amounts are resolved, never listed inline',
    /resolveQuickAmounts\(/.test(detailsScreen ?? '') &&
      !/100_000|500_000|1_000_000/.test(detailsScreen ?? ''),
  );

  const quickAmounts = sources.get('src/modules/booking/utils/quick-amounts.ts');
  ok('quick-amount resolution is a pure module', Boolean(quickAmounts));
  ok('and it is React-free', !/from 'react'|useState|useMemo/.test(quickAmounts ?? ''));

  /**
   * C3a — the chips set a value, so no label may carry a plus. A `+` on an
   * absolute control is a wrong instruction on a money field, and the artwork's
   * own labels were recorded as a UI inconsistency rather than implemented.
   */
  const quickChips = sources.get('src/modules/booking/components/quick-amount-chips.tsx');
  ok('the quick-amount chips exist', Boolean(quickChips));
  ok('and no chip label carries a plus (C3a)', !/["'`]\s*\+\s*₹/.test(quickChips ?? ''));
  ok(
    'the chips compute nothing — they render what they are given',
    !/minInvestment|maxInvestment|validateAmount|calculateReturns/.test(quickChips ?? ''),
  );

  /**
   * The returns strip renders figures it did not compute (C4 is enforced in
   * `returns.ts`, and enforcing it twice is how the two copies come to
   * disagree).
   */
  const returnsStrip = sources.get('src/modules/booking/components/estimated-returns.tsx');
  ok('the returns strip exists', Boolean(returnsStrip));
  ok(
    'and computes nothing',
    !/calculateReturns|calculateMaturity|calculateSimpleInterest|principal \+|\* \(1/.test(
      returnsStrip ?? '',
    ),
  );
  ok(
    'it announces recalculation politely, never as an alert',
    /aria-live="polite"/.test(returnsStrip ?? '') && !/role="alert"/.test(returnsStrip ?? ''),
  );

  const bookingAmountField = sources.get(
    'src/modules/booking/components/investment-amount-field.tsx',
  );
  ok('the amount field exists', Boolean(bookingAmountField));
  ok(
    'it validates nothing — the message arrives as a prop',
    !/validateAmount|minInvestment\s*[<>]|maxInvestment\s*[<>]/.test(bookingAmountField ?? ''),
  );
  /**
   * `type="number"` discards grouping separators, adds spinners nobody wants on
   * a deposit, and scrolls the value on a trackpad. `inputMode` gives the mobile
   * keypad without any of that.
   */
  ok(
    'it is a text input with a numeric keypad, not type=number',
    /inputMode="numeric"/.test(bookingAmountField ?? '') &&
      !/type="number"/.test(bookingAmountField ?? ''),
  );
  ok('its error is announced', /role="alert"/.test(bookingAmountField ?? ''));
  ok(
    'and the bounds are described, not merely drawn',
    /aria-describedby/.test(bookingAmountField ?? ''),
  );
  ok(
    'the rail is derived through the row model, not assembled inline',
    /buildConfiguredSummaryRows/.test(detailsScreen ?? ''),
  );
  /**
   * The configuration lives in the draft, never in the screen.
   *
   * **Re-pointed at T3.2.8, not loosened.** The probe was `!/useState/`, which
   * was right while the shell held nothing at all and became wrong the moment
   * the amount field needed a *touched* flag — whether a user has left a field
   * is a property of this visit, not of the booking, and persisting it would
   * mean a resumed draft opened mid-scold.
   *
   * So the probe now names the permitted local state exactly. A second entry
   * has to arrive with an argument for why it is not configuration, and
   * `amount`, `tenureMonths` or `payoutOption` appearing here would fail
   * immediately — which is the property that actually matters.
   */
  ok(
    'the configuration comes from the draft context',
    /useBookingDraft\(\)/.test(detailsScreen ?? ''),
  );
  check(
    'and the only local state is the touched flag — no configuration field',
    [...(detailsScreen ?? '').matchAll(/const \[(\w+),[^\]]*\]\s*=\s*useState/g)].map((m) => m[1]),
    ['amountTouched'],
  );

  /**
   * Scope guard, **re-pointed at T3.2.8**. The amount field and quick amounts
   * have landed; the tenure and payout controls have not. Asserted so "this
   * task only" stays a checkable property rather than a promise in a commit
   * message.
   */
  /**
   * Re-pointed again at T3.2.10. The tenure **chips** have landed; the slider
   * and the Custom affordance have not, and both are deliberate omissions
   * rather than oversights — the slider needs a domain decision Design has not
   * made, and Custom cannot resolve against an exact-match rate card without
   * inventing a rate.
   */
  ok('the tenure chips are wired', /<TenureSelector\b/.test(detailsScreen ?? ''));
  ok(
    'the slider and Custom tenure remain unbuilt, as scoped',
    !/<Slider\b/.test(detailsScreen ?? '') && !/Custom/.test(detailsScreen ?? ''),
  );

  /* ---- Tenure selection (T3.2.10) ---- */

  const tenureSelector = sources.get('src/modules/booking/components/tenure-selector.tsx');
  ok('the tenure selector exists', Boolean(tenureSelector));

  /**
   * Tenure is one value chosen from a set, so the group is a `radiogroup` with
   * `aria-checked` — not the `aria-pressed` toggles `Chip` exposes, which would
   * announce N independent on/off buttons and imply two tenures could be
   * selected at once.
   */
  ok(
    'the chips are a radiogroup, not independent toggles',
    /role="radiogroup"/.test(tenureSelector ?? '') &&
      /role="radio"/.test(tenureSelector ?? '') &&
      /aria-checked/.test(tenureSelector ?? '') &&
      !/aria-pressed/.test(tenureSelector ?? ''),
  );
  ok(
    'it is one tab stop with roving focus',
    /tabIndex=\{tabbable \? 0 : -1\}/.test(tenureSelector ?? ''),
  );
  ok('and arrow keys move the selection', /ArrowRight|ArrowLeft/.test(tenureSelector ?? ''));
  /**
   * Focus must move **with** the selection. Without this the newly checked
   * radio takes `tabIndex={0}` while the browser's focus ring stays on the one
   * the user just left — two options claiming to be current, which is the
   * confusion the radiogroup pattern exists to prevent (WAI-ARIA APG).
   */
  ok(
    'and focus follows the selection, not just the checked state',
    /radios\.current\.get\([^)]*\)\?\.focus\(\)/.test(tenureSelector ?? ''),
  );
  ok(
    'the radios are registered by tenure, so a changed rate card cannot stale a reference',
    /radios\.current\.set\(tenure\.tenureMonths/.test(tenureSelector ?? '') &&
      /radios\.current\.delete\(tenure\.tenureMonths\)/.test(tenureSelector ?? ''),
  );
  ok(
    'it computes nothing — no rate, no returns, no validation',
    !/resolveRate|calculateReturns|validateTenure|tenureRates/.test(tenureSelector ?? ''),
  );
  ok(
    'and it lists no tenure of its own',
    !/\b(7|3|6|12|24|36)\s*,/.test(tenureSelector ?? '') &&
      !/TENURE_OPTIONS/.test(tenureSelector ?? ''),
  );
  ok('it hardcodes no colour', !/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(tenureSelector ?? ''));

  /**
   * The chips come from the rate card, never from `tenureRange` — the range is
   * the advertised family, the card is what the bank has quoted.
   */
  ok(
    'the screen derives tenures from the rate card',
    /selectableTenures\(/.test(detailsScreen ?? '') && !/tenureRange/.test(detailsScreen ?? ''),
  );
  ok('and seeds a default tenure', /defaultTenure\(/.test(detailsScreen ?? ''));
  /**
   * Continue is disabled while its handler is an intentional seam (T3.2.12). An
   * enabled primary action that silently does nothing reads as a broken screen
   * rather than an unfinished one — and `continueDisabled` drives a real
   * `disabled` attribute, so the control leaves the tab order rather than merely
   * dimming.
   */
  ok(
    'Continue is disabled while its handler is a seam',
    /continueDisabled/.test(detailsScreen ?? ''),
  );
  /**
   * Tenure and payout are reconciled in **one** write, so the draft can never
   * hold a tenure with a payout the product no longer offers, even for a frame.
   */
  ok(
    'changing tenure reconciles the payout in the same write',
    /setInvestment\(\{\s*tenureMonths,\s*payoutOption: reconcilePayoutOption\(/.test(
      detailsScreen ?? '',
    ),
  );

  /* ================================================================ */
  section('Invariants · Goal-Based FD boundaries and rules');

  const gbfFiles = [...sources.keys()].filter((file) =>
    file.startsWith('src/modules/goal-based-fd/'),
  );

  ok('the Goal-Based FD module exists', gbfFiles.length > 0);

  /**
   * **Independence.** `06-architecture.md` builds Goal-Based FD as an additive
   * feature that consumes the FD domain; the ESLint boundary forbids
   * module → module outright. Asserted here too, so a disabled lint rule cannot
   * quietly couple the rule engine to a screen.
   */
  for (const sibling of ['marketplace', 'booking']) {
    check(
      `no Goal-Based FD file imports ${sibling}`,
      gbfFiles.filter((file) =>
        new RegExp(`from '@/modules/${sibling}`).test(sources.get(file) ?? ''),
      ),
      [],
    );
  }
  check(
    'and none imports mocks',
    gbfFiles.filter((file) => /@\/mocks/.test(sources.get(file) ?? '')),
    [],
  );

  /**
   * **Rate resolution goes through the platform finance layer.** The engine may
   * not compute a rate, and it may not restate the band-selection rule — that is
   * `@/utils/finance`'s job and there is exactly one implementation of it.
   */
  check(
    'rate resolution happens in exactly one Goal-Based FD file',
    gbfFiles.filter((file) => /resolveProductRate\(/.test(sources.get(file) ?? '')),
    ['src/modules/goal-based-fd/utils/candidates.ts'],
  );
  ok(
    'and it imports the resolver from the platform layer',
    /from '@\/utils\/finance'/.test(
      sources.get('src/modules/goal-based-fd/utils/candidates.ts') ?? '',
    ),
  );
  check(
    'no Goal-Based FD file re-implements band selection',
    gbfFiles.filter((file) => /minAmount/.test(sources.get(file) ?? '')),
    [],
  );
  check(
    'and none declares a rate resolver of its own',
    gbfFiles.filter((file) => /export function resolve\w*Rate/.test(sources.get(file) ?? '')),
    [],
  );

  /**
   * **No invented or default rate.** The engine drops a product it cannot price
   * rather than substituting one — `04-rule-engine.md` §16, *"must not invent
   * rates"*. A `?? someRate` or a hardcoded percentage anywhere in this module
   * is that rule being broken.
   */
  ok(
    'an unpriceable product is dropped, not defaulted',
    /if \(quote === null\) continue;/.test(
      sources.get('src/modules/goal-based-fd/utils/candidates.ts') ?? '',
    ),
  );
  for (const file of gbfFiles) {
    const text = sources.get(file) ?? '';
    /* Strip comments and doc blocks — prose may legitimately discuss rates. */
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    ok(
      `${file.split('/').pop()} hardcodes no rate`,
      !/\b\d+\.\d+\s*(?:,|;|\)|\})/.test(code.replace(/formatRate|toFixed/g, '')),
    );
    ok(
      `${file.split('/').pop()} has no rate fallback`,
      !/annualRate\s*\?\?|baseRate\s*\?\?|rate\s*\|\|/.test(code),
    );
  }

  /**
   * **Blocked rules are declared, not approximated.** Each entry names data that
   * does not exist; none of them may acquire a default.
   */
  const blocked = sources.get('src/modules/goal-based-fd/constants/blocked-rules.ts');
  ok('the blocked-rule registry exists', Boolean(blocked));
  for (const ruleId of [
    'R-ELIG-002',
    'R-GOAL-004',
    'R-TENURE-002',
    '§8.availability',
    '§8.maximum-investment',
    '§11.diversification',
  ]) {
    ok(`${ruleId} is declared blocked`, blocked?.includes(ruleId));
  }

  /**
   * **R-ELIG-001 was unblocked by data, not by a default.** The client source
   * document supplies the 0.50% benefit, so the rule now runs. Two things must
   * hold: it is gone from the blocked registry, and the delta lives in the
   * fixture rather than anywhere that could compute one.
   */
  ok('R-ELIG-001 is no longer declared blocked', !/ruleId: 'R-ELIG-001'/.test(blocked ?? ''));
  check(
    'the senior-citizen delta is fixture data, not engine logic',
    [...sources.entries()]
      .filter(([, text]) => /SENIOR_CITIZEN_DELTA\s*=/.test(text))
      .map(([file]) => file),
    ['src/mocks/data/products.ts'],
  );
  check(
    'and no module computes a senior uplift of its own',
    gbfFiles.filter((file) =>
      /seniorCitizenDelta\s*[+*]|\+\s*0\.5\b/.test(sources.get(file) ?? ''),
    ),
    [],
  );
  /* The blocked capabilities must not appear as engine fields. */
  for (const field of ['maxInvestment', 'eligibility']) {
    check(
      `no Goal-Based FD type declares "${field}"`,
      gbfFiles
        .filter((file) => file.includes('/types/'))
        .filter((file) => new RegExp(`\\b${field}\\??:`).test(sources.get(file) ?? '')),
      [],
    );
  }

  /**
   * **Product availability is still unmodelled**, which is what the `status`
   * guard was protecting: `§8.availability` is blocked because the catalogue
   * serves no availability field, and a `status` on a *product* would be that
   * rule being faked.
   *
   * `GoalPlanStatus` is a different thing entirely — why a *goal* produced no
   * allocation leg — so the probe now names what it actually forbids instead of
   * banning a word. The protection is stronger, not weaker: it also catches
   * `availability` and `productStatus`, which the old spelling missed.
   */
  check(
    'no Goal-Based FD type models product availability',
    gbfFiles
      .filter((file) => file.includes('/types/'))
      .filter((file) =>
        /\b(?:availability|productStatus)\??:|\bstatus\??:\s*(?:'active'|'available')/.test(
          sources.get(file) ?? '',
        ),
      ),
    [],
  );
  ok('and §8.availability remains declared blocked', /'§8\.availability'/.test(blocked ?? ''));
  ok(
    'the plan status describes goals, not products',
    /export type GoalPlanStatus[\s\S]*?'tenure-unsupported'[\s\S]*?'no-match'/.test(
      sources.get('src/modules/goal-based-fd/types/plan.ts') ?? '',
    ),
  );

  /**
   * **No thresholds invented for the goal rules.** The R-GOAL rules are
   * comparative — "prefer short-duration", "prefer longer-term" — and name no
   * number. A month constant in the ranking layer would be a business rule
   * nobody approved, wearing the appearance of one that was.
   */
  const ranking = sources.get('src/modules/goal-based-fd/utils/ranking.ts');
  const goals = sources.get('src/modules/goal-based-fd/constants/goals.ts');
  ok(
    'ranking encodes no month threshold',
    !/\b(?:months?|tenure\w*)\s*[<>]=?\s*\d+/i.test(ranking ?? ''),
  );
  ok(
    'and the goal catalogue maps to comparators rather than numbers',
    /'shortest'/.test(goals ?? '') &&
      /'closest-to-horizon'/.test(goals ?? '') &&
      /'longest'/.test(goals ?? '') &&
      !/\d{1,3}\s*\/\*|:\s*\d+,/.test(goals ?? ''),
  );

  /**
   * **The engine is pure and fetches nothing.** One service file owns the
   * request, and it calls `findAll` once — the N+1 the readiness review
   * prohibited has exactly one place it could appear.
   */
  check(
    'only the service layer fetches',
    gbfFiles.filter((file) => /findAll\(|findById\(|repository\./.test(sources.get(file) ?? '')),
    ['src/modules/goal-based-fd/services/goal-recommendation-service.ts'],
  );
  ok(
    'and it fetches the catalogue once, with no per-product detail request',
    /await repository\.findAll\(\)/.test(
      sources.get('src/modules/goal-based-fd/services/goal-recommendation-service.ts') ?? '',
    ) &&
      !/findById/.test(
        sources.get('src/modules/goal-based-fd/services/goal-recommendation-service.ts') ?? '',
      ),
  );
  /**
   * **The rule layer is React-free.** Scoped to `utils` / `constants` / `types` /
   * `services` rather than the whole module, because Step 5 added a screen and a
   * query hook and those are supposed to use React.
   *
   * Re-pointed rather than deleted when the UI arrived: the property being
   * protected was never "this module has no React", it was "no rule needs a DOM
   * to be evaluated". A probe widened to include components would have failed;
   * one deleted would have stopped guarding anything.
   */
  const gbfRuleLayer = gbfFiles.filter(
    (file) => !file.includes('/components/') && !file.includes('/hooks/'),
  );
  check(
    'the rule layer imports no React',
    gbfRuleLayer.filter((file) => /from 'react'|useState|useMemo/.test(sources.get(file) ?? '')),
    [],
  );
  check(
    'and no rule file is a client component',
    gbfRuleLayer.filter((file) => /'use client'/.test(sources.get(file) ?? '')),
    [],
  );

  /** Determinism (§19) — no clock, no randomness anywhere in the module. */
  check(
    'nothing in the engine is time- or random-dependent',
    gbfFiles.filter((file) => /Math\.random|Date\.now|new Date\(/.test(sources.get(file) ?? '')),
    [],
  );

  /* ---- The planner UI (UX redesign) ---- */

  const gbfComponents = gbfFiles.filter((file) => file.includes('/components/'));
  const homeHero = sources.get('src/modules/marketplace/components/home-hero.tsx');
  const homeScreen = sources.get('src/modules/marketplace/components/home-screen.tsx');
  const callout = sources.get('src/modules/marketplace/components/goal-planner-callout.tsx');

  ok('the planner has a UI', gbfComponents.length > 0);

  /**
   * **No rule id reaches the screen.** The ids are internal vocabulary. They may
   * appear as *keys* into `RULE_LABELS` — hence the exclusion of the constants
   * file — but never as rendered text.
   */
  for (const file of gbfComponents) {
    const text = sources.get(file) ?? '';
    ok(
      `${file.split('/').pop()} renders no rule id`,
      !/\bR-[A-Z]+-\d{3}\b/.test(text) && !/§\d/.test(text),
    );
  }
  ok(
    'the label map is the only place rule ids appear in presentation',
    /RULE_LABELS/.test(sources.get('src/modules/goal-based-fd/constants/presentation.ts') ?? ''),
  );

  /**
   * **Estimated, not promised.** Booking resolves the terms the customer is
   * offered; the planner illustrates. The wording has to say so.
   */
  const bestFit = sources.get('src/modules/goal-based-fd/components/best-fit-card.tsx');
  ok('the best-fit card labels the rate as indicative', /Indicative rate/.test(bestFit ?? ''));
  ok(
    'and states that Booking confirms the figures',
    /confirmed on the booking screen/.test(bestFit ?? ''),
  );
  ok(
    'the maturity is labelled estimated wherever it is shown',
    /Estimated maturity/.test(
      sources.get('src/modules/goal-based-fd/components/maturity-flow.tsx') ?? '',
    ) &&
      /Estimated maturity/.test(
        sources.get('src/modules/goal-based-fd/components/compact-recommendation-card.tsx') ?? '',
      ),
  );

  /**
   * **No invented financial claim** (decision A4). The UI restates rules; it
   * does not grade a deposit or promise a return.
   */
  for (const file of gbfComponents) {
    const text = sources.get(file) ?? '';
    ok(
      `${file.split('/').pop()} makes no comparative or guaranteed claim`,
      !/\b(guaranteed returns?|competitive rate|best rate|highest rate)\b/i.test(text),
    );
  }

  /** The UI computes nothing — every figure is read off the recommendation. */
  for (const file of gbfComponents) {
    const text = sources.get(file) ?? '';
    ok(
      `${file.split('/').pop()} runs no finance calculation`,
      !/calculateMaturity|resolveProductRate|resolveApplicableRate|\*\*\s*\(/.test(text),
    );
  }

  /**
   * Motion is opt-in and token-driven. `motion-safe:` plus the existing global
   * reduced-motion reset means no component declares its own media query, and a
   * hand-rolled `@keyframes` in a component would escape both.
   */
  for (const file of gbfComponents) {
    const text = sources.get(file) ?? '';
    ok(
      `${file.split('/').pop()} declares no local keyframes or motion media query`,
      !/@keyframes|prefers-reduced-motion/.test(text),
    );
  }

  /* ---- No duplicate journey (Home → planner) ---- */

  const plannerScreen = sources.get('src/modules/goal-based-fd/components/goal-planner-screen.tsx');
  const plannerPage = sources.get('src/app/(public)/goal-planner/page.tsx');
  const plannerFlow = sources.get('src/modules/goal-based-fd/hooks/use-planner-flow.ts');
  const goalEntry = sources.get('src/modules/marketplace/constants/goal-entry.ts');

  /**
   * **The intro screen is gone.** It showed the goal vocabulary a second time
   * and a button whose only function was to be dismissed, so the goals appeared
   * three times before the customer answered anything.
   */
  ok(
    'no planner intro component exists',
    !sources.has('src/modules/goal-based-fd/components/planner-intro.tsx'),
  );
  check(
    'and nothing renders a "Let’s start" control',
    gbfComponents.filter((file) => /Let.s start/.test(sources.get(file) ?? '')),
    [],
  );
  check(
    'the goal vocabulary is rendered by exactly one planner component',
    gbfComponents.filter((file) => /GOAL_DESCRIPTIONS/.test(sources.get(file) ?? '')),
    ['src/modules/goal-based-fd/components/goal-step.tsx'],
  );

  /**
   * **Intent is read, narrowed, and seeded — not stored twice.** The param goes
   * through `parseGoalParam` (a URL is user input) and becomes the flow's
   * *initial value*, so there is no second copy of the answer to keep in sync.
   */
  ok('the planner reads the goal parameter', /useSearchParams\(\)/.test(plannerScreen ?? ''));
  ok(
    'and narrows it before trusting it',
    /parseGoalParam\(searchParams\.get\('goal'\)\)/.test(plannerScreen ?? ''),
  );
  ok(
    'the parameter seeds the existing flow rather than a second store',
    /usePlannerFlow\(initialGoal\)/.test(plannerScreen ?? '') &&
      /export function usePlannerFlow\(initialGoal\?: GoalType\)/.test(plannerFlow ?? ''),
  );
  ok(
    'an arriving goal starts the flow past the goal question',
    /initialGoal === undefined \? 'goal' : 'investor'/.test(plannerFlow ?? ''),
  );
  ok('and the route contains the prerender bailout', /<Suspense>/.test(plannerPage ?? ''));

  /** The URL shape is declared once, in constants — never inside a component. */
  ok('Home goal entries carry the goal parameter', /\?goal=/.test(goalEntry ?? ''));
  check(
    'and no Marketplace component composes that query string itself',
    [...sources.entries()]
      .filter(([file]) => file.startsWith('src/modules/marketplace/components/'))
      .filter(([, text]) => /\?goal=/.test(text))
      .map(([file]) => file),
    [],
  );

  /* ---- Home discoverability ---- */

  ok('the Home hero links to the planner', /ROUTES\.goalPlanner/.test(homeHero ?? ''));
  ok(
    'and it is the primary action, with browse as secondary',
    /Find my FD/.test(homeHero ?? '') &&
      /variant="secondary"[\s\S]{0,120}Browse all FDs/.test(homeHero ?? ''),
  );
  ok(
    'the dead "How it works" control is gone',
    !/How it works/.test(homeHero ?? '') && !/aria-disabled/.test(homeHero ?? ''),
  );
  ok('Home renders the guided callout', /<GoalPlannerCallout \/>/.test(homeScreen ?? ''));
  ok(
    'the callout sits above the search bar',
    (homeScreen ?? '').indexOf('<GoalPlannerCallout') < (homeScreen ?? '').indexOf('<SearchBar'),
  );
  ok(
    'and the planner is reachable from every page through the nav',
    /ROUTES\.goalPlanner/.test(sources.get('src/constants/navigation.ts') ?? ''),
  );

  /**
   * **Marketplace still imports nothing from the goal module.** The callout
   * knows a route and three labels; the boundary is intact in both directions.
   */
  check(
    'no Marketplace file imports the goal module',
    [...sources.entries()]
      .filter(([file]) => file.startsWith('src/modules/marketplace/'))
      .filter(([, text]) => /@\/modules\/goal-based-fd/.test(text))
      .map(([file]) => file),
    [],
  );
  ok(
    'the callout builds its link through ROUTES',
    /ROUTES\.goalPlanner/.test(callout ?? '') && !/['"`]\/goal-planner/.test(callout ?? ''),
  );

  /**
   * **One call to action per screen.** `Find my FD` used to be rendered as a
   * button in the hero *and* in this section, and the section's body repeated
   * the hero's sentence almost word for word. The goal columns are the action
   * here; the only remaining generic entry is a quiet text link.
   */
  /**
   * **The section carries exactly one call to action.**
   *
   * It used to carry none — the columns were the action and a quiet text link
   * was the only generic entry. The approved design now leads with artwork and
   * an explicit CTA, so the rule changed from "no button" to "not more than
   * one": the defect being guarded against was always *duplicate* calls to
   * action competing with the hero, not the existence of one.
   */
  ok(
    'the Goal Selection section carries at most one call to action',
    ((callout ?? '').match(/<Button/g) ?? []).length <= 1,
  );
  ok(
    'and it does not repeat the hero’s sentence',
    !/Tell us what you.re planning for/.test(callout ?? ''),
  );
  ok('the "Guided" eyebrow is gone', !/>\s*Guided\s*</.test(callout ?? ''));
  /**
   * The columns moved into `GoalEntryList` when selection acquired a state —
   * a goal chosen on Home is acknowledged there before the page changes, and
   * that needs a client component. The assertions below are about the rendered
   * **section**, not about one file, so they read both sources: splitting the
   * file must not be able to silently drop a property.
   */
  const goalEntryList = sources.get('src/modules/marketplace/components/goal-entry-list.tsx');
  const goalSection = `${callout ?? ''}\n${goalEntryList ?? ''}`;

  ok('the goal columns are their own component', Boolean(goalEntryList));
  /**
   * **Each goal is one self-contained, artwork-led panel.**
   *
   * The single-surface hairline treatment was replaced by the approved
   * artwork-led design. What must still hold is that a goal is *one* target with
   * *one* piece of artwork — not a card containing further cards, and not a goal
   * split across two clickable regions.
   */
  ok(
    'each goal is a single panel with its own artwork',
    /GoalMark/.test(goalSection) && (goalSection.match(/<Link/g) ?? []).length <= 4,
  );
  ok('and each column meets the touch-target floor', /min-h-16|min-h-\[/.test(goalSection));
  ok(
    'the artwork is decorative, never the label',
    /alt=""/.test(sources.get('src/components/business/goal-mark.tsx') ?? '') &&
      /aria-hidden/.test(sources.get('src/components/business/goal-mark.tsx') ?? ''),
  );

  /**
   * **Only the columns are client code.** The heading, the supporting copy and
   * the footer link have no interactive state and must not be dragged onto the
   * client by the selection acknowledgement.
   */
  ok('the columns are a client component', /^'use client';/.test(goalEntryList ?? ''));
  ok('but the section around them is not', !/^'use client';/.test(callout ?? ''));

  /* ---- Step 5 — the Booking handoff ---- */

  const handoffSource = sources.get('src/modules/goal-based-fd/utils/booking-handoff.ts');

  ok('the handoff contract exists', Boolean(handoffSource));

  /**
   * **`productId` is the whole contract.** Declared in one file, built through
   * `ROUTES`, and carrying two fields. A third field is the regression this
   * catches — that is how a rate would arrive in Booking.
   */
  check(
    'the handoff is declared in exactly one file',
    gbfFiles.filter((file) => /export function toBookingHandoff/.test(sources.get(file) ?? '')),
    ['src/modules/goal-based-fd/utils/booking-handoff.ts'],
  );
  ok(
    'BookingHandoff carries only an id, a destination and bookability',
    /export interface BookingHandoff \{[\s\S]*?productId: string;[\s\S]*?href: Route;[\s\S]*?bookable: boolean;\s*\}/.test(
      handoffSource ?? '',
    ) &&
      !/rate|maturity|quote/i.test(
        (handoffSource ?? '').split('export interface BookingHandoff')[1]?.split('}')[0] ?? '',
      ),
  );
  ok(
    'both destinations are built through ROUTES, never as inline strings',
    /ROUTES\.bookingOverview\(productId, amount\)/.test(handoffSource ?? '') &&
      /ROUTES\.product\(productId\)/.test(handoffSource ?? '') &&
      !/['"`]\/booking\//.test(handoffSource ?? '') &&
      !/['"`]\/marketplace\//.test(handoffSource ?? ''),
  );
  /*
    **Re-pointed to the stronger guarantee**, not relaxed.

    The rule was "only productId", written when nothing else could safely
    travel. What it was protecting is unchanged and is asserted immediately
    below: no rate, maturity or quote may cross, because those are figures
    Booking must resolve for itself.

    `principal` is a different kind of value — the amount the *customer* stated,
    which the planner asked them for and every candidate was filtered against.
    It was the missing carrier that made Investment Details ask for it twice.

    So the assertion now names the exact two fields read, which is a tighter
    statement than "one": a third would fail here.
  */
  ok(
    'and the handoff reads only the customer’s own two answers',
    /const \{ productId, principal \} = recommendation;/.test(handoffSource ?? ''),
  );
  ok(
    'never a figure the engine computed',
    !/recommendation\.(quote|maturity|reasons|target)/.test(handoffSource ?? ''),
  );
  /*
    And the amount is a *prefill* into the one canonical draft, not a second
    booking state. The parser is the only entry point for it, and it fabricates
    nothing when the value is absent or unusable.
  */
  const entryAmount = sources.get('src/modules/booking/utils/entry-amount.ts');
  ok('the entry amount has a declared parser', Boolean(entryAmount));
  ok(
    'which refuses anything that is not whole positive rupees',
    /Number\.isSafeInteger/.test(entryAmount ?? '') && /amount <= 0/.test(entryAmount ?? ''),
  );
  ok(
    'and never substitutes a product figure for a missing one',
    !/minInvestment|maxInvestment|quickAmounts|REFERENCE_AMOUNT|\|\|\s*\d/.test(entryAmount ?? ''),
  );
  check(
    'the amount is seeded in exactly one place',
    [...sources.entries()]
      .filter(([, text]) => /parseEntryAmount\(/.test(text))
      .filter(([file]) => file !== 'src/modules/booking/utils/entry-amount.ts')
      .map(([file]) => file),
    ['src/app/(public)/booking/[productId]/overview/page.tsx'],
  );
  /*
    One draft, one amount. No module may introduce a booking state of its own,
    and the seeding write goes to the canonical `investment.amount` — the same
    field Investment Details, Review, Payment and Success already read.
  */
  const overviewScreenSource = sources.get(
    'src/modules/booking/components/booking-overview-screen.tsx',
  );
  ok(
    'and written into the canonical draft, guarded three ways',
    /setInvestment\(\{ amount: entryAmount \}\)/.test(overviewScreenSource ?? '') &&
      /if \(!isHydrated\) return;/.test(overviewScreenSource ?? '') &&
      /if \(entryAmount === null\) return;/.test(overviewScreenSource ?? '') &&
      /draft\.furthestStep !== 'overview'/.test(overviewScreenSource ?? ''),
  );
  check(
    'no module declares a booking draft of its own',
    [...sources.entries()]
      .filter(([, text]) =>
        /goalBookingDraft|comparisonBookingDraft|BookingDraftContext/.test(text),
      )
      .filter((entry) => !entry[0].startsWith('src/modules/booking/hooks/'))
      .map(([file]) => file),
    [],
  );

  /**
   * **Every recommendation reaches a real screen.** Booking resolves one deposit
   * today; the rest open that product's Marketplace page. Neither branch may be
   * a dead end, and the bookable list is one shared fact rather than a copy.
   */
  ok(
    'a non-bookable recommendation still has a destination',
    /isBookableProduct\(productId\)[\s\S]*?ROUTES\.product\(productId\)/.test(handoffSource ?? ''),
  );
  ok(
    'bookability is read from the shared constant',
    /@\/constants\/booking/.test(handoffSource ?? ''),
  );

  /**
   * **No rate or maturity is passed as booking authority.** The engine's figures
   * are an illustration; Booking resolves the terms it offers. Asserted on the
   * source so the guarantee survives a refactor of the object literal.
   */
  for (const forbidden of ['quote', 'maturity', 'annualRate', 'baseRate', 'target']) {
    ok(
      `the handoff contract declares no "${forbidden}"`,
      !new RegExp(`^\\s*${forbidden}\\??:`, 'm').test(handoffSource ?? ''),
    );
  }

  /**
   * **One booking flow.** Goal-Based FD may link to Booking's entry point and
   * nothing else — no deeper step, and no route of its own that duplicates one.
   */
  const bookingRouteUsage = gbfFiles.filter((file) =>
    /ROUTES\.booking\w+/.test(sources.get(file) ?? ''),
  );
  check('only the handoff file builds a Booking route', bookingRouteUsage, [
    'src/modules/goal-based-fd/utils/booking-handoff.ts',
  ]);
  check(
    'and it uses the Overview entry point, not a later step',
    [...(handoffSource ?? '').matchAll(/ROUTES\.(booking\w+)/g)].map((match) => match[1]),
    ['bookingOverview'],
  );
  check(
    'no Goal-Based FD route duplicates a booking step',
    [...sources.keys()].filter(
      (file) => file.startsWith('src/app/') && /goal/.test(file) && /booking/.test(file),
    ),
    [],
  );

  /**
   * **Booking is unchanged by the handoff.** It still resolves the id itself and
   * still takes the not-found boundary — Goal-Based FD hands over an id and
   * makes no promise that it resolves.
   *
   * The resolution moved from this layout into `BookingProductProvider` (the
   * catalogue is served by a browser-only worker, so a server component could
   * not fetch it). The guarantee is unchanged and asserted one file across:
   * Booking owns its own resolution, and an id it cannot resolve renders
   * nothing.
   */
  const handoffBookingLayout = sources.get('src/app/(public)/booking/[productId]/layout.tsx');
  const bookingProductHook = sources.get('src/modules/booking/hooks/use-booking-product.tsx');
  ok(
    'Booking still resolves the productId itself',
    /createBookingOverviewService\(\)/.test(bookingProductHook ?? '') &&
      /service\.findByProductId\(productId\)/.test(bookingProductHook ?? ''),
  );
  ok(
    'and still fails closed on an id it cannot resolve',
    /if \(isError \|\| !data\) notFound\(\);/.test(bookingProductHook ?? ''),
  );
  /*
    The layout hands the id down and awaits nothing. Its own segment is a Server
    Component, and the catalogue's transport does not exist there — a fetch
    reintroduced here is the exact defect that made every non-curated product
    fail with `ApiError`.
  */
  ok(
    'and the layout itself fetches nothing',
    !/findByProductId|createBookingOverviewService|createProductMasterRepository/.test(
      handoffBookingLayout ?? '',
    ),
  );
  ok(
    'passing the id down instead',
    /<BookingProductProvider[\s\S]*?productId=\{productId\}/.test(handoffBookingLayout ?? ''),
  );
  ok(
    'Booking accepts no rate or maturity from a caller',
    !/searchParams/.test(handoffBookingLayout ?? ''),
  );
  /**
   * **Both planner routes are siblings of Booking, not inside it.** Multi-goal
   * planning is a second entry point (`/goal-planner/plan`), and like the first
   * it ends at Booking rather than living within it — the handoff stays one
   * direction.
   */
  check(
    'the goal planner routes sit outside Booking',
    [...sources.keys()].filter((file) => file.startsWith('src/app/(public)/goal-planner/')).sort(),
    ['src/app/(public)/goal-planner/page.tsx', 'src/app/(public)/goal-planner/plan/page.tsx'],
  );
  ok(
    'and the multi-goal route reads no search params',
    !/useSearchParams|searchParams/.test(
      sources.get('src/app/(public)/goal-planner/plan/page.tsx') ?? '',
    ),
  );

  /* ================================================================ */
  section('Invariants · Platform rate resolver (R1 step 2, D1)');

  const platformRates = sources.get('src/utils/finance/rates.ts');
  const marketplaceSlabs = sources.get('src/modules/marketplace/utils/rate-slabs.ts');

  ok('the platform resolver exists', Boolean(platformRates));

  /**
   * **One implementation, not two.** The whole point of the move is that
   * Marketplace and the platform cannot drift, so Marketplace's file must hold a
   * re-export and no logic. This is the assertion that fails if someone
   * "restores" the original body to avoid an import change.
   */
  check(
    'resolveApplicableRate is declared in exactly one file',
    [...sources.entries()]
      .filter(([, text]) => /export function resolveApplicableRate/.test(text))
      .map(([file]) => file),
    ['src/utils/finance/rates.ts'],
  );
  ok(
    'Marketplace holds a re-export, not a second implementation',
    /export \{ resolveApplicableRate \} from '@\/utils\/finance';/.test(marketplaceSlabs ?? '') &&
      !/reduce|minAmount/.test(marketplaceSlabs ?? ''),
  );
  /*
    The import gained `publishedTenure` and `toWholeMonths` when the service took
    over the calculator's returns, so the assertion names the resolver rather
    than the whole import line. What matters is unchanged: the service uses the
    canonical resolver and declares none of its own.
  */
  ok(
    'and the service imports the canonical resolver',
    /import \{[^}]*\bresolveApplicableRate\b[^}]*\} from '@\/utils\/finance';/s.test(
      sources.get('src/modules/marketplace/services/product-service.ts') ?? '',
    ),
  );

  /**
   * Business behaviour preserved (authorisation was import re-point only). The
   * three rules that define this resolver, read off the moved source:
   * amount-below-band falls back, the highest *band* wins rather than the
   * highest rate, and band rates are absolute.
   */
  ok(
    'no applicable band falls back to the base rate',
    /return applicable\?\.annualRate \?\? baseRate;/.test(platformRates ?? ''),
  );
  ok(
    'the highest band cleared wins, not the highest rate',
    /if \(amount < band\.minAmount\) return incumbent;/.test(platformRates ?? '') &&
      /band\.minAmount <= incumbent\.minAmount/.test(platformRates ?? ''),
  );

  /** The platform layer is reachable by any module — that is why it moved. */
  ok('the resolver imports no feature module', !/@\/modules\//.test(platformRates ?? ''));
  ok('and no mocks', !/@\/mocks/.test(platformRates ?? ''));

  /**
   * `resolveProductRate` composes the law stated on `TenureRate`: the tenure
   * sets the base rate, the amount band may override it. It must not invent a
   * tenure the product does not publish.
   */
  ok(
    'resolveProductRate refuses an unpublished tenure',
    /tenureMonths !== terms\.tenureMonths\) return null;/.test(platformRates ?? ''),
  );
  ok(
    'and composes base rate with amount bands rather than restating the rule',
    /resolveApplicableRate\(terms\.baseRate, amount, terms\.rateSlabs\)/.test(platformRates ?? ''),
  );

  /** Booking's tenure resolver is untouched — a different axis, deliberately left. */
  ok(
    'Booking still owns its tenure resolver',
    /export function resolveRate\(terms: DepositTerms, criteria: RateCriteria\)/.test(
      sources.get('src/modules/booking/utils/tenure-rates.ts') ?? '',
    ),
  );

  /** `RateCriteria.amount` is optional, so every existing caller still compiles. */
  ok(
    'RateCriteria.amount is optional',
    /\n  amount\?: number;/.test(sources.get('src/types/finance.ts') ?? ''),
  );

  /* ================================================================ */
  section('Invariants · Product Master boundary (Steps 1–3)');

  const masterType = sources.get('src/types/product-master.ts');
  const masterMapper = sources.get('src/services/product-master/product-master-mapper.ts');
  const masterRepo = sources.get('src/services/product-master/product-master-repository.ts');

  ok('the Product Master type exists', Boolean(masterType));
  ok('the mapper exists', Boolean(masterMapper));
  ok('the repository exists', Boolean(masterRepo));

  /** One declaration. Two would be exactly the duplication this boundary exists to end. */
  check(
    'ProductMaster is declared in exactly one file',
    [...sources.entries()]
      .filter(([, text]) => /export type ProductMaster =/.test(text))
      .map(([file]) => file),
    ['src/types/product-master.ts'],
  );
  check(
    'and the DTO → ProductMaster conversion has exactly one home',
    [...sources.entries()]
      .filter(([, text]) => /export function toProductMaster/.test(text))
      .map(([file]) => file),
    ['src/services/product-master/product-master-mapper.ts'],
  );

  /**
   * The boundary that makes this additive: `src/types` may import only from
   * `src/types`, and `src/services` may not import modules at all
   * (`eslint.config.mjs`). Asserted here too, so a disabled lint rule cannot
   * quietly let the platform depend on Marketplace.
   */
  for (const [name, text] of [
    ['the type', masterType],
    ['the mapper', masterMapper],
    ['the repository', masterRepo],
  ]) {
    ok(`${name} imports nothing from any feature module`, !/@\/modules\//.test(text ?? ''));
    ok(`${name} imports nothing from mocks`, !/@\/mocks/.test(text ?? ''));
  }

  /**
   * **No invented business data.** Every field the Addendum names but the
   * payload cannot supply must be absent from the type — not defaulted, not
   * optional-with-a-fallback. This probe reads the type rather than trusting the
   * mapper.
   */
  for (const field of [
    'status',
    'maxInvestment',
    'prematureWithdrawal',
    'supportedPayouts',
    'tenureRates',
    'eligibility',
    'autoRenewal',
    'partnerSla',
  ]) {
    ok(
      `ProductMaster declares no "${field}"`,
      !new RegExp(`\\b${field}\\??:`).test(masterType ?? ''),
    );
  }
  /**
   * **ProductMaster stores no resolved/effective rate** (re-pointed at D1).
   *
   * This previously read "stores no rate at all", which was the wrong line to
   * draw: `baseRate` and `rateSlabs` are *published* product data, exactly like
   * `minInvestment`. Excluding the base rate left the master carrying the amount
   * overrides with nothing to override — and since the catalogue's bands begin
   * at ₹5,00,000, no rate at all was obtainable for normal amounts.
   *
   * The line that matters is between **published** and **resolved**. What a
   * particular deposit earns depends on an amount the master does not have; it
   * is a `RateQuote` from `resolveProductRate`, and it is never stored.
   *
   * Re-pointed rather than deleted — a probe that is deleted instead of re-aimed
   * is how an invariant quietly stops being one.
   */
  ok(
    'ProductMaster declares its published base rate',
    /\bbaseRate: number;/.test(masterType ?? ''),
  );
  for (const derived of ['appliedRate', 'effectiveRate', 'quote', 'estimatedReturns']) {
    ok(
      `ProductMaster stores no resolved rate — no "${derived}"`,
      !new RegExp(`\\b${derived}\\??:`).test(masterType ?? ''),
    );
  }
  /** The wire name does not survive the mapping; `baseRate` is the platform name. */
  ok(
    'the master does not re-use the wire name "interestRate"',
    !/\binterestRate\??: *number/.test(masterType ?? ''),
  );
  ok(
    'and the mapper renames interestRate rather than computing a rate',
    /baseRate: record\.interestRate,/.test(masterMapper ?? '') &&
      !/resolveApplicableRate|resolveProductRate|calculateMaturity/.test(masterMapper ?? ''),
  );

  /** The discriminant is a literal, so a second product type is an addition. */
  ok(
    'the union is discriminated by productType',
    /productType: 'fixed-deposit'/.test(masterType ?? ''),
  );

  /** Fails closed — a bad record is dropped, never coerced into a product. */
  ok('the mapper parses rather than casts', /safeParse\(/.test(masterMapper ?? ''));
  ok(
    'and returns null on a mismatch',
    /return parsed\.success \? .* : null;/.test(masterMapper ?? '') ||
      /: null;/.test(masterMapper ?? ''),
  );

  /** Consumes the existing endpoint through the existing generic factory. */
  ok(
    'the repository reuses the platform read-repository factory',
    /createApiReadRepository/.test(masterRepo ?? ''),
  );
  ok(
    'and exposes only the two approved reads',
    /findAll\(/.test(masterRepo ?? '') &&
      /findById\(/.test(masterRepo ?? '') &&
      !/\bcreate\(|\bupdate\(|\bremove\(/.test(masterRepo ?? ''),
  );

  /**
   * **Goal-Based FD is the only module that consumes the master.**
   *
   * Re-pointed again now that **Step 5 (Booking migration) is implemented**:
   * Booking derives a deposit from the master so every recommended product is
   * bookable, rather than holding one hand-authored fixture.
   *
   * The property still worth protecting is **Marketplace**, which keeps its own
   * view model and is not migrated. This list growing a Marketplace entry is the
   * regression to catch.
   */
  check(
    'only Goal-Based FD and Booking consume ProductMaster',
    [
      ...new Set(
        [...sources.entries()]
          .filter(([file]) => file.startsWith('src/modules/'))
          .filter(([, text]) => /product-master|ProductMaster/.test(text))
          .map(([file]) => file.split('/').slice(0, 3).join('/')),
      ),
    ].sort(),
    ['src/modules/booking', 'src/modules/goal-based-fd'],
  );

  /* ---- The four architectures this task must leave untouched ---- */

  /**
   * RateQuote unchanged — still exactly the two fields the rate card can source.
   * Read as a field set, not a whitespace-sensitive regex over the whole
   * declaration, so a reformat does not fail it and an added field cannot pass.
   */
  const rateQuoteBody = /export interface RateQuote \{([\s\S]*?)\n\}/.exec(
    sources.get('src/types/finance.ts') ?? '',
  )?.[1];
  ok('RateQuote is still declared', Boolean(rateQuoteBody));
  check(
    'and still carries exactly annualRate and tenureMonths',
    [...(rateQuoteBody ?? '').matchAll(/^\s{2}(\w+)\??:/gm)].map((match) => match[1]),
    ['annualRate', 'tenureMonths'],
  );

  /** tenureMonths unchanged — the day-count migration is not started. */
  check(
    'no file declares tenureDays',
    [...sources.entries()].filter(([, text]) => /\btenureDays\b/.test(text)).map(([f]) => f),
    [],
  );

  /**
   * TD-001 unchanged. The duplicate-declaration probe above already counts the
   * two maturity engines; this states the intent in the words of this task —
   * Product Master does not repay TD-001, and did not quietly make it worse by
   * adding a third.
   */
  check(
    'the two maturity engines are still exactly two',
    [...sources.keys()].filter((file) => /(^|\/)maturity\.ts$/.test(file)).sort(),
    ['src/modules/marketplace/utils/maturity.ts', 'src/utils/maturity.ts'],
  );

  /* ---- productId-driven booking resolution ---- */

  const overviewScreen = sources.get('src/modules/booking/components/booking-overview-screen.tsx');
  const overviewPage = sources.get('src/app/(public)/booking/[productId]/overview/page.tsx');
  const catalogue = sources.get('src/modules/booking/utils/deposit-catalogue.ts');

  ok('the deposit catalogue exists', Boolean(catalogue));

  const detailsScreenSrc = sources.get(
    'src/modules/booking/components/investment-details-screen.tsx',
  );
  const nomineeScreenSrc = sources.get('src/modules/booking/components/nominee-screen.tsx');
  const bookingLayout = sources.get('src/app/(public)/booking/[productId]/layout.tsx');

  /**
   * **One resolution per booking session.**
   *
   * Overview resolved from `productId` while Investment Details and Nominee each
   * defaulted to a hardcoded fixture — three screens, three mechanisms, one
   * fact, and a booking that could have priced one product while describing
   * another. Resolution now happens once, in the layout.
   */
  /*
    Resolution still happens once per session — one query, keyed on the id,
    shared by all three steps — but it happens in `BookingProductProvider`
    rather than in the layout.

    The layout is a Server Component and the catalogue is served by MSW, which
    runs in the browser only; a relative base URL has no origin there and no
    worker to answer it. So every product except the one backed by a local
    fixture failed with `ApiError`. Moving the call to the client provider puts
    Booking on the same transport as every other data-driven screen here.
  */
  const bookingProvider = sources.get('src/modules/booking/hooks/use-booking-product.tsx');

  ok('the booking session provider exists', Boolean(bookingProvider));
  check(
    'the deposit is resolved in exactly one place',
    [...sources.entries()]
      .filter(([, text]) => /findByProductId\(productId\)/.test(text))
      .filter(([file]) => !file.includes('booking-overview-service'))
      .map(([file]) => file),
    ['src/modules/booking/hooks/use-booking-product.tsx'],
  );
  check(
    'and the curated fixture has exactly one consumer',
    [...sources.entries()]
      .filter(([, text]) => /resolveBookingOverview\(/.test(text))
      .filter(([file]) => !file.endsWith('utils/deposit-catalogue.ts'))
      .map(([file]) => file),
    ['src/modules/booking/services/booking-overview-service.ts'],
  );
  ok(
    'the provider resolves from productId and holds it for the session',
    /findByProductId\(productId\)/.test(bookingProvider ?? '') &&
      /BookingProductContext\.Provider/.test(bookingProvider ?? ''),
  );
  ok(
    'and does so on the client, where the catalogue transport exists',
    /^'use client';/m.test(bookingProvider ?? ''),
  );
  /*
    One query per session, keyed on the id. A key that omitted the id would
    serve one product's deposit under another product's URL.
  */
  ok(
    'through a single query keyed on the product id',
    /queryKey: \[[^\]]*productId\]/.test(bookingProvider ?? '') &&
      (bookingProvider ?? '').match(/useQuery\(/g)?.length === 1,
  );
  ok('and takes the not-found boundary when it cannot', /notFound\(\)/.test(bookingProvider ?? ''));
  /*
    No Server Component in the Booking route tree may fetch the catalogue. This
    is the regression guard for the defect itself, not for one file's contents:
    a fetch in any non-`'use client'` file under the route reintroduces it.
  */
  check(
    'no server component in the Booking route fetches the catalogue',
    [...sources.entries()]
      .filter(([file]) => file.startsWith('src/app/(public)/booking/'))
      .filter(([, text]) => !/^'use client';/m.test(text))
      .filter(([, text]) =>
        /findByProductId|createBookingOverviewService|createProductMasterRepository/.test(text),
      )
      .map(([file]) => file),
    [],
  );
  ok(
    'the layout still owns the session and keys it by product',
    /<BookingProductProvider key=\{productId\} productId=\{productId\}>/.test(bookingLayout ?? ''),
  );
  ok(
    'the not-found boundary sits above the layout that throws',
    sources.has('src/app/(public)/booking/not-found.tsx'),
  );

  /**
   * No screen may reintroduce a fixture fallback or an overridable prop —
   * either would let one step render a different product from the others.
   */
  for (const [name, text] of [
    ['Overview', overviewScreen],
    ['Investment Details', detailsScreenSrc],
    ['Nominee', nomineeScreenSrc],
  ]) {
    ok(
      `${name} reads the deposit from the booking session`,
      /useBookingProduct\(\)/.test(text ?? ''),
    );
    ok(`${name} has no hardcoded fixture fallback`, !/BOOKING_OVERVIEW_FIXTURE/.test(text ?? ''));
    ok(
      `${name} exposes no overview prop to override it`,
      !/overview\??:\s*BookingOverview/.test(text ?? ''),
    );
    ok(`${name} resolves nothing itself`, !/resolveBookingOverview/.test(text ?? ''));
  }

  /**
   * **No booking step may hardcode its own Continue state.**
   *
   * Investment Details carried a bare `continueDisabled` — which in JSX is
   * `true` — left over from when Nominee had no route to advance to. The button
   * could therefore never enable, for any product, on either entry path, and
   * the journey stopped dead at step two.
   *
   * The rule that replaces it: a step either gates Continue on a **domain
   * verdict** or does not gate it at all. A literal is neither.
   */
  for (const [name, text] of [
    ['Investment Details', detailsScreenSrc],
    ['Nominee', nomineeScreenSrc],
    ['Bank Account', sources.get('src/modules/booking/components/bank-account-screen.tsx')],
    ['Review', sources.get('src/modules/booking/components/review-screen.tsx')],
    ['Payment', sources.get('src/modules/booking/components/payment-screen.tsx')],
  ]) {
    ok(
      `${name} does not hardcode Continue as disabled`,
      !/continueDisabled\s*(\/?>|$)/m.test(text ?? '') &&
        !/continueDisabled=\{(true|false)\}/.test(text ?? ''),
    );
  }
  ok(
    'Investment Details gates Continue on the whole-configuration verdict',
    /continueDisabled=\{!validation\.isValid\}/.test(detailsScreenSrc ?? '') &&
      /validateInvestmentConfiguration\(/.test(detailsScreenSrc ?? ''),
  );
  /*
    And it decides none of it itself: the verdict comes from the schema module,
    which is the single owner of what each product accepts.
  */
  check(
    'the whole-configuration validator is declared once',
    [...sources.entries()]
      .filter(([, text]) => /export function validateInvestmentConfiguration/.test(text))
      .map(([file]) => file),
    ['src/modules/booking/utils/investment-schema.ts'],
  );

  /**
   * **Every step that can advance, advances through the one step hook.**
   *
   * The defect above was invisible partly because navigation and enablement
   * were wired in different places at different times. Both now run through
   * `useBookingStep`, so a step that can be completed has exactly one way to
   * leave it.
   */
  for (const [name, text] of [
    ['Overview', overviewScreen],
    ['Investment Details', detailsScreenSrc],
    ['Nominee', nomineeScreenSrc],
  ]) {
    ok(`${name} advances through the shared step hook`, /useBookingStep\(/.test(text ?? ''));
    ok(
      `${name} names no destination route`,
      !/ROUTES\.booking(Nominee|Review|BankAccount|Payment)/.test(text ?? ''),
    );
  }

  /** The pages are thin: they pass the id and nothing else. */
  ok(
    'the overview page no longer resolves or guards',
    !/resolveBookingOverview|notFound\(\)/.test(overviewPage ?? ''),
  );

  /**
   * Unknown ids must fail, never fall back. A fallback is the defect being
   * fixed — rendering *some* deposit for a product nobody chose is worse than
   * saying it does not exist, because the user would go on to book it.
   */
  ok(
    'the resolver returns null rather than a fallback',
    /return null;/.test(catalogue ?? '') &&
      !/\?\?\s*BOOKING_OVERVIEW_FIXTURE/.test(catalogue ?? ''),
  );
  ok('and guards against prototype keys', /Object\.hasOwn\(/.test(catalogue ?? ''));

  /**
   * The mapping is Booking-owned. A Marketplace import here would be the
   * module-boundary violation this seam exists to avoid — and would also drag
   * catalogue figures onto the approved Booking screens.
   */
  ok(
    'the catalogue imports nothing from Marketplace',
    !/@\/modules\/marketplace/.test(catalogue ?? ''),
  );
  check(
    'deposit resolution is declared in exactly one file',
    [...sources.entries()]
      .filter(([, text]) => /export function resolveBookingOverview/.test(text))
      .map(([file]) => file),
    ['src/modules/booking/utils/deposit-catalogue.ts'],
  );

  /* ---- Nominee (T3.3) ---- */

  const nomineeScreen = sources.get('src/modules/booking/components/nominee-screen.tsx');
  const nomineeSchema = sources.get('src/modules/booking/utils/nominee-schema.ts');
  const nomineeConstants = sources.get('src/modules/booking/constants/nominee.ts');
  const draftTypes = sources.get('src/modules/booking/types/draft.ts');
  const storage = sources.get('src/modules/booking/utils/draft-storage.ts');

  ok('the nominee screen exists', Boolean(nomineeScreen));
  ok('the nominee schema exists', Boolean(nomineeSchema));

  /**
   * **PII is excluded at the type level**, not by the code that happens to
   * assemble the payload. `Omit<BookingDraft, 'nominee'>` makes an attempt to
   * persist the section a compile error rather than a review comment.
   */
  ok(
    'the persisted draft type omits the nominee section',
    /Omit<BookingDraft, 'nominee'>/.test(draftTypes ?? ''),
  );
  ok(
    'and the storage layer restores it empty rather than reading it',
    /emptyNomineeConfiguration\(\)/.test(storage ?? ''),
  );

  /**
   * No business data invented. Each of these is a rule the specification states
   * without supplying the values it depends on, and the absence is deliberate.
   */
  /**
   * The relationship list is a **marked POC assumption** and, more importantly,
   * a **single source of truth**. No component may declare its own — replacing
   * the constant must change the dropdown, the validation and the error message
   * together, which is the whole reason the client can swap it in one edit.
   */
  const nomineeFields = sources.get('src/modules/booking/components/nominee-fields.tsx');
  ok(
    'the relationship list lives in the constants file',
    /export const SUPPORTED_RELATIONSHIPS/.test(nomineeConstants ?? ''),
  );
  check(
    'and is declared in exactly one file',
    [...sources.entries()]
      .filter(([, text]) => /export const SUPPORTED_RELATIONSHIPS/.test(text))
      .map(([file]) => file),
    ['src/modules/booking/constants/nominee.ts'],
  );
  ok(
    'no component hardcodes a relationship value',
    !/'(Spouse|Son|Daughter|Father|Mother|Brother|Sister|Wife)'/.test(nomineeFields ?? '') &&
      !/'(Spouse|Son|Daughter|Father|Mother|Brother|Sister|Wife)'/.test(nomineeScreen ?? ''),
  );
  ok(
    'the form renders its options from the constant',
    /SUPPORTED_RELATIONSHIPS\.map/.test(nomineeFields ?? ''),
  );
  ok(
    'no minor-age threshold is invented',
    !/\b18\b|minorAge|MINOR_AGE|isMinor/.test(nomineeSchema ?? ''),
  );
  ok(
    'no maximum nominee count is invented',
    !/MAX_NOMINEES|maxNominees/.test(nomineeSchema ?? '') &&
      !/MAX_NOMINEES/.test(nomineeConstants ?? ''),
  );
  ok(
    'the relationship rule is inert until a list exists',
    /SUPPORTED_RELATIONSHIPS\.length > 0/.test(nomineeSchema ?? ''),
  );

  /* The screen reuses the existing rail rather than rebuilding one. */
  ok(
    'the nominee screen reuses the configured summary rail',
    /buildConfiguredSummaryRows/.test(nomineeScreen ?? '') &&
      /<InvestmentSummary/.test(nomineeScreen ?? ''),
  );
  ok(
    'and computes nothing of its own',
    !/calculateReturns|resolveRate|validateAmount/.test(nomineeScreen ?? ''),
  );
  /**
   * Continue is gated on the **domain verdict**, not on a condition the screen
   * assembled for itself. `!validation.isValid` is the whole rule.
   */
  ok(
    'Continue is gated on the validator',
    /continueDisabled=\{!validation\.isValid\}/.test(nomineeScreen ?? ''),
  );
  ok(
    'the screen consumes validation rather than restating it',
    /validateNomineeConfiguration\(/.test(nomineeScreen ?? '') &&
      !/TOTAL_SHARE_PERCENT|sharePercent\s*[<>]|\.reduce\(/.test(nomineeScreen ?? ''),
  );

  /* The form fields validate nothing; messages arrive as props. */
  ok(
    'the nominee fields validate nothing',
    !/validateNominee|TOTAL_SHARE_PERCENT|Date\.parse/.test(nomineeFields ?? ''),
  );
  /**
   * The simplest accessible date control already in the stack — no dependency,
   * no custom picker, real keyboard and assistive-technology support.
   */
  ok('date of birth uses a native date input', /type="date"/.test(nomineeFields ?? ''));
  ok('bounded so the browser discourages a future date', /max=\{today\}/.test(nomineeFields ?? ''));

  /* Nomination type reuses the platform primitive rather than a second group. */
  const nominationType = sources.get('src/modules/booking/components/nomination-type-group.tsx');
  ok(
    'nomination type composes RadioCardGroup',
    /<RadioCardGroup/.test(nominationType ?? '') &&
      !/type="radio"|role="radiogroup"/.test(nominationType ?? ''),
  );
  ok(
    'and invents no third nomination type',
    /NOMINATION_TYPES\.map/.test(nominationType ?? '') &&
      !/'single'|'multiple'/.test(nominationType ?? ''),
  );

  /* ---- DepositTerms consistency (T3.2.10) ---- */

  /**
   * The display fields stay — deleting them would change approved UI copy. What
   * is enforced instead is that they cannot **contradict** the rate card, which
   * is the actual requirement.
   *
   * These read the shipped fixture, so they are assertions about real data
   * rather than about types.
   */
  const fixture = sources.get('src/modules/booking/fixtures/booking-overview.ts');
  ok('the booking fixture exists', Boolean(fixture));
  ok(
    'the display fields are still present, not deleted',
    /interestRate:/.test(fixture ?? '') &&
      /tenureRange:/.test(fixture ?? '') &&
      /payoutOptions:/.test(fixture ?? ''),
  );

  const tenureRatesUtil = sources.get('src/modules/booking/utils/tenure-rates.ts');
  ok(
    'rate-card validation exists and returns errors rather than throwing',
    /export function validateRateCard/.test(tenureRatesUtil ?? '') &&
      !/throw new/.test(tenureRatesUtil ?? ''),
  );

  /**
   * Ownership, frozen. `interestRate`, `tenureRange` and `payoutOptions` are
   * display copy: only the two row builders and the Overview card may read
   * them, plus one validator message. A new reader — especially on a pricing
   * path — fails here.
   *
   * `booking-overview-service.ts` joins the declaration sites rather than the
   * reader sites: it **constructs** these fields when deriving a deposit from a
   * catalogue product, exactly as the fixture does. It prices nothing — the rate
   * it writes is the product's own `baseRate`, unchanged.
   */
  const DEPOSIT_DECLARATION_SITES = ['src/modules/booking/services/booking-overview-service.ts'];
  const readersOf = (field) =>
    [...sources.entries()]
      .filter(([file]) => file.startsWith('src/modules/booking/'))
      .filter(([, text]) => new RegExp(`terms\\.${field}|\\b${field}:`).test(text))
      .map(([file]) => file)
      .sort();

  check('interestRate is read only where it is declared or displayed', readersOf('interestRate'), [
    'src/modules/booking/components/selected-fd-summary.tsx',
    'src/modules/booking/fixtures/booking-overview.ts',
    ...DEPOSIT_DECLARATION_SITES,
    'src/modules/booking/types/booking.ts',
    'src/modules/booking/utils/investment-summary.ts',
  ]);
  check('tenureRange is read only where it is declared or displayed', readersOf('tenureRange'), [
    'src/modules/booking/fixtures/booking-overview.ts',
    ...DEPOSIT_DECLARATION_SITES,
    'src/modules/booking/types/booking.ts',
    'src/modules/booking/utils/investment-summary.ts',
  ]);
  check(
    'payoutOptions is read only where it is declared or displayed',
    readersOf('payoutOptions'),
    [
      'src/modules/booking/fixtures/booking-overview.ts',
      ...DEPOSIT_DECLARATION_SITES,
      'src/modules/booking/types/booking.ts',
      'src/modules/booking/utils/investment-schema.ts',
      'src/modules/booking/utils/investment-summary.ts',
    ],
  );

  /* ---- Payout selection (T3.2.9) ---- */

  const payoutGroup = sources.get('src/modules/booking/components/payout-option-group.tsx');
  const payoutUtil = sources.get('src/modules/booking/utils/payout-options.ts');

  ok('the payout group exists', Boolean(payoutGroup));
  ok('and the resolution util exists', Boolean(payoutUtil));

  /**
   * Built on the platform primitive, not a second radio group. `RadioCardGroup`
   * already gives one tab stop, arrow-key movement and real fieldset semantics;
   * reimplementing that in a feature module is how a control loses its keyboard
   * behaviour six months later.
   */
  ok(
    'the payout group composes RadioCardGroup rather than rebuilding one',
    /<RadioCardGroup/.test(payoutGroup ?? '') &&
      !/type="radio"|role="radiogroup"/.test(payoutGroup ?? ''),
  );
  ok(
    'and it computes nothing — no returns, no rate, no validation',
    !/calculateReturns|resolveRate|validate/.test(payoutGroup ?? ''),
  );
  ok(
    'it does not decide which options exist',
    !/supportedPayouts|PAYOUT_OPTION_ORDER/.test(payoutGroup ?? ''),
  );

  /**
   * Spec 21b §D — unavailable options must not be displayed. The narrowing is a
   * pure function so "only what the product sells" is assertable without a DOM.
   */
  ok('option resolution is React-free', !/from 'react'|useState|useMemo/.test(payoutUtil ?? ''));
  check(
    'the payout vocabulary is declared in exactly one file',
    [...sources.entries()]
      .filter(([, text]) => /export const PAYOUT_OPTION_ORDER/.test(text))
      .map(([file]) => file),
    ['src/modules/booking/constants/payout-options.ts'],
  );
  check(
    'and the default in exactly one file',
    [...sources.entries()]
      .filter(([, text]) => /export const DEFAULT_PAYOUT_OPTION/.test(text))
      .map(([file]) => file),
    ['src/modules/booking/constants/payout-options.ts'],
  );

  /**
   * The screen seeds the default into the draft rather than falling back at
   * render time. Showing "At Maturity" selected while the draft held `null`
   * would mean the screen priced one thing and Review read another.
   */
  ok(
    'the screen seeds the default payout into the draft',
    /defaultPayoutOption\(/.test(detailsScreen ?? ''),
  );
  ok(
    'and narrows the options through the resolver',
    /resolvePayoutOptions\(/.test(detailsScreen ?? ''),
  );

  /**
   * C4's visible half. The strip must render a Per Instalment figure for payout
   * deposits, and must not present it as exact — a rupee-rounded instalment
   * cannot divide an arbitrary total evenly.
   */
  ok(
    'the returns strip shows Per Instalment',
    /Per Instalment/.test(returnsStrip ?? '') &&
      /data-returns-cell="instalment"/.test(returnsStrip ?? ''),
  );
  ok('and states it as approximate', /approximately/.test(returnsStrip ?? ''));
  ok(
    'the instalment block is inside a polite live region',
    (returnsStrip ?? '').split('data-returns-cell="instalment"')[0].includes('aria-live="polite"'),
  );

  /* Route hygiene, as everywhere else in this codebase. */
  ok('the screen builds no booking path of its own', !/["'`]\/booking\//.test(detailsScreen ?? ''));
  /*
    Named after the *builder*, not the URL segment.

    The first version of this probe searched every source for the string
    "investment-details" and failed — matching the route file's own path and the
    barrel's export of `investment-details-screen`. A probe that cannot tell a
    URL from a filename is not testing route ownership. The builder name is
    unambiguous, and the "no inline /booking/ path" probe above already covers
    the segment being written by hand.
  */
  check(
    'the investment-details route builder is declared once, in ROUTES',
    [...sources.entries()]
      .filter(([, text]) => /bookingInvestmentDetails:/.test(text))
      .map(([file]) => file),
    ['src/constants/routes.ts'],
  );

  /**
   * The two rails are different row models. If one builder ever served both
   * screens, the configured rail would start advertising capability again.
   */
  check(
    'the configured row model is declared once',
    [...sources.entries()]
      .filter(([, text]) => /export function buildConfiguredSummaryRows/.test(text))
      .map(([file]) => file),
    ['src/modules/booking/utils/investment-summary.ts'],
  );

  /**
   * Heading ids are generated, not literal. A duplicate id makes
   * `aria-labelledby` resolve to whichever element came first, which is a silent
   * failure — the label is simply wrong, and nothing reports it.
   */
  for (const file of [
    'src/modules/booking/components/investment-summary.tsx',
    'src/modules/booking/components/important-information.tsx',
    'src/modules/booking/components/investment-details-screen.tsx',
  ]) {
    const text = sources.get(file);
    ok(`${file.split('/').pop()} generates its heading ids`, /useId\(\)/.test(text ?? ''));
    ok(
      `${file.split('/').pop()} hardcodes no heading id`,
      !/id="[a-z-]+-heading"/.test(text ?? ''),
    );
  }

  /* ================================================================ */
  section('Invariants · Booking platform primitives (T3.2.3)');

  /**
   * `Button`, not `MarketplaceButton`. A slider or a radio-card group living
   * inside `modules/booking/` would be a primitive the next module has to
   * either duplicate or illegally import.
   */
  ok('Slider is a platform primitive', sources.has('src/components/ui/slider.tsx'));
  ok(
    'RadioCardGroup is a platform primitive',
    sources.has('src/components/ui/radio-card-group.tsx'),
  );
  check(
    'neither primitive was defined inside a feature module',
    bookingFiles
      .filter(([, text]) => /export (function|const) (Slider|RadioCardGroup)\b/.test(text))
      .map(([file]) => file),
    [],
  );

  /**
   * Both are built on native HTML — that is the entire argument for adding no
   * dependency, so it is asserted rather than asserted-in-prose.
   */
  const slider = sources.get('src/components/ui/slider.tsx');
  const radioCards = sources.get('src/components/ui/radio-card-group.tsx');
  ok('Slider is a real range input', /type="range"/.test(slider ?? ''));
  ok('RadioCardGroup uses real radios', /type="radio"/.test(radioCards ?? ''));
  ok(
    'and a real fieldset/legend, so the group needs no ARIA',
    /<fieldset/.test(radioCards ?? '') &&
      /<legend/.test(radioCards ?? '') &&
      !/role="radiogroup"/.test(radioCards ?? ''),
  );

  /**
   * Neither may hardcode colour. The design system is the only source, and a
   * hex in a primitive is how a second palette begins.
   */
  for (const [name, text] of [
    ['Slider', slider],
    ['RadioCardGroup', radioCards],
  ]) {
    ok(`${name} hardcodes no colour`, !/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(text ?? ''));
  }

  section('Invariants · Motion layer (Motion UX Specification)');

  /**
   * **No motion library.** The determination recorded in
   * `motion-architecture.md` §1 was that CSS covers everything except animating
   * to an intrinsic height, and that one gap is worth a hook rather than a
   * dependency. This is the assertion that keeps that true — a motion library
   * arriving later is exactly the drift it exists to catch.
   */
  const packageJson =
    sources.get('package.json') ?? readFileSync(path.join(ROOT, 'package.json'), 'utf8');
  ok(
    'no animation library is a dependency',
    !/"(framer-motion|motion|gsap|lottie-web|@lottiefiles\/[\w-]+|animejs|popmotion|react-spring|@react-spring\/[\w-]+)"/.test(
      packageJson,
    ),
  );

  /**
   * **Motion values live in the token file and nowhere else.** A duration or an
   * easing curve typed into a component is the same number with no provenance,
   * which is precisely what the design system exists to prevent.
   */
  /* Read directly: the source map walks .ts/.tsx only, and tokens are CSS. */
  const motionTokens = readFileSync(
    path.join(SRC, 'design-system', 'tokens', 'motion.css'),
    'utf8',
  );
  ok('the stagger step is a token', /--ds-duration-stagger:/.test(motionTokens));
  ok('the reveal distance is a token', /--ds-reveal-distance:/.test(motionTokens));

  check(
    'no component hardcodes a duration or easing curve',
    [...sources.entries()]
      .filter(([file]) => /^src\/(components|modules|app|hooks)\/.*\.tsx?$/.test(file))
      .filter(([, text]) => /cubic-bezier\(|\b\d{2,4}ms\b|animationDelay/.test(text))
      .map(([file]) => file),
    [],
  );

  /**
   * **The motion layer is domain-free**, as the `components` boundary requires.
   * A wrapper that knows about goals or deposits is a feature component filed
   * in the wrong place.
   */
  check(
    'nothing in components/motion reaches into a feature',
    [...sources.entries()]
      .filter(([file]) => file.startsWith('src/components/motion/'))
      .filter(([, text]) => /@\/(modules|services|store)\//.test(text))
      .map(([file]) => file),
    [],
  );

  /**
   * **The client-mandated disclosure is never animated.** The source document
   * requires the coverage note at the time of recommendation; a note that fades
   * in after the button beside it is a note the customer can act past. It is
   * rendered, and it carries no entrance.
   */
  const safetyNote = sources.get('src/modules/goal-based-fd/components/safety-note.tsx');
  const bestFitSource = sources.get('src/modules/goal-based-fd/components/best-fit-card.tsx');
  ok('the recommendation carries a coverage note', Boolean(safetyNote));
  ok('the best-fit card renders it', /<SafetyNote[\s/>]/.test(bestFitSource ?? ''));

  /**
   * **The coverage note appears at booking too**, which is the second half of
   * the client document's requirement — and it is the *same component*, so the
   * two screens cannot drift apart.
   */
  const bookingOverviewScreen = sources.get(
    'src/modules/booking/components/booking-overview-screen.tsx',
  );
  ok('booking renders the coverage note', /<SafetyNote[\s/>]/.test(bookingOverviewScreen ?? ''));
  check(
    'and there is exactly one coverage note component',
    [...sources.entries()]
      .filter(([, text]) => /export function SafetyNote\(/.test(text))
      .map(([file]) => file),
    ['src/components/business/safety-note.tsx'],
  );
  ok(
    'and the note itself has no entrance animation',
    !/animate-|ds-stagger/.test(safetyNote ?? ''),
  );

  /**
   * **No fake processing.** The finding state is driven by a real in-flight
   * query. A timer anywhere in the module would be a way to make the platform
   * look like it is working when it is not.
   */
  check(
    'no timer fakes work in the goal module',
    gbfFiles.filter((file) => /setTimeout|setInterval/.test(sources.get(file) ?? '')),
    [],
  );

  section('Invariants · Derived Booking deposits declare their demo terms');

  const overviewService = sources.get('src/modules/booking/services/booking-overview-service.ts');
  const summaryUtil = sources.get('src/modules/booking/utils/investment-summary.ts');
  const fdSummary = sources.get('src/modules/booking/components/selected-fd-summary.tsx');
  const amountFieldSource = sources.get(
    'src/modules/booking/components/investment-amount-field.tsx',
  );

  ok('the derivation service exists', Boolean(overviewService));

  /**
   * **A derived deposit never presents a placeholder as a bank term.**
   *
   * The catalogue publishes bank, rate, tenure and minimum. Everything else the
   * Booking screens draw is structural, and each such field must be declared in
   * `demoTerms` so the display layer can say so.
   */
  ok(
    'the service declares its demo terms',
    /DERIVED_DEMO_TERMS/.test(overviewService ?? '') &&
      /demoTerms: DERIVED_DEMO_TERMS/.test(overviewService ?? ''),
  );

  /*
    Every field the catalogue does not publish must appear in the declared list.
    A new unpublished field added without declaring it is the regression here.
  */
  for (const term of [
    'max-investment',
    'tenure-range',
    'payout-options',
    'premature-withdrawal',
    'auto-renewal',
    'tagline',
    'highlights',
  ]) {
    ok(`"${term}" is declared as a demo term`, new RegExp(`'${term}'`).test(overviewService ?? ''));
  }

  /** The summary builders route every demo-marked field through one gate. */
  ok(
    'the summary builder gates demo terms behind a single helper',
    /function published\(/.test(summaryUtil ?? '') &&
      /Confirmed with the bank/.test(summaryUtil ?? ''),
  );
  for (const term of [
    'max-investment',
    'tenure-range',
    'payout-options',
    'premature-withdrawal',
    'auto-renewal',
  ]) {
    ok(
      `the ${term} row is gated`,
      new RegExp(`published\\(\\s*deposit,\\s*'${term}'`, 's').test(summaryUtil ?? ''),
    );
  }

  /** Partner marketing copy is suppressed rather than borrowed. */
  ok(
    'the tagline is suppressed when it is a placeholder',
    /demoTerms\?\.includes\('tagline'\)/.test(fdSummary ?? ''),
  );
  ok(
    'highlights are suppressed when they are placeholders',
    /demoTerms\?\.includes\('highlights'\)/.test(fdSummary ?? ''),
  );
  ok(
    'and the maximum states it is unpublished rather than printing a figure',
    /maxInvestmentPublished/.test(amountFieldSource ?? ''),
  );

  /**
   * **No financial claim is fabricated.** The rate card carries only the term
   * the product publishes, so no tenure is offered at a rate no bank quoted.
   */
  ok(
    'the rate card is built from the product’s own published term',
    /annualRate: terms\.baseRate/.test(overviewService ?? '') &&
      /monthEquivalent === null \? \[\]/.test(overviewService ?? ''),
  );
  ok(
    'and an unknown id still fails closed',
    /product === null \? null/.test(overviewService ?? ''),
  );

  section('Invariants · Investor profile is asked once');

  const multiScreen = sources.get(
    'src/modules/goal-based-fd/components/multi-goal-planner-screen.tsx',
  );
  const planHook = sources.get('src/modules/goal-based-fd/hooks/use-multi-goal-plan.ts');
  const goalRow = sources.get('src/modules/goal-based-fd/components/plan-goal-row.tsx');
  const planUtil = sources.get('src/modules/goal-based-fd/utils/plan.ts');

  /**
   * **Senior-citizen status is asked once per journey, not once per goal.**
   *
   * It is an attribute of the depositor. Asking it beside every goal would put
   * the same question on screen three times in a three-goal plan and would allow
   * three answers to disagree about one fact.
   */
  check(
    'the multi-goal screen renders the investor question exactly once',
    (multiScreen ?? '').match(/<InvestorStep/g) ?? [],
    ['<InvestorStep'],
  );
  ok('a goal row never asks it', !/InvestorStep|isSeniorCitizen|senior/i.test(goalRow ?? ''));
  /* Scoped to the `GoalDraft` body: a per-goal senior field is the defect. */
  const goalDraftBody =
    /export interface GoalDraft \{([\s\S]*?)\n\}/.exec(planHook ?? '')?.[1] ?? '';
  ok(
    'the answer is one piece of journey state',
    /const \[isSeniorCitizen, setIsSeniorCitizen\]/.test(planHook ?? ''),
  );
  ok('and a goal draft carries no senior field of its own', !/senior/i.test(goalDraftBody));
  ok(
    'and every goal consumes that one answer',
    /plan\.investor\?\.isSeniorCitizen/.test(planUtil ?? ''),
  );
  ok(
    'the single-goal planner still asks it once too',
    (
      (sources.get('src/modules/goal-based-fd/components/goal-planner-screen.tsx') ?? '').match(
        /<InvestorStep/g,
      ) ?? []
    ).length === 1,
  );

  /**
   * **Bank strength is a consideration, never a second rate rule.** It orders
   * deposits the documented rules rank equally; promoting it above rate would be
   * inventing a rule the client has not defined.
   */
  const rankingSource = sources.get('src/modules/goal-based-fd/utils/ranking.ts');
  ok('ranking consults bank strength', /bankStrengthRank/.test(rankingSource ?? ''));
  /* Measured inside the comparator, so the import at the top is not the match. */
  const comparatorBody = (rankingSource ?? '').slice(
    (rankingSource ?? '').indexOf('export function compareCandidates'),
  );
  ok(
    'but only after the rate comparison',
    comparatorBody.indexOf('annualRate') < comparatorBody.indexOf('bankStrengthRank'),
  );

  /**
   * **The finding state describes work; it does not pace it.** No timer may
   * appear in it — a staged sequence driven by a clock would be fake progress.
   */
  const status = sources.get('src/modules/goal-based-fd/components/planner-status.tsx');
  ok('the finding state names the stages', /Comparing banks/.test(status ?? ''));
  ok('and no timer drives them', !/setTimeout|setInterval/.test(status ?? ''));

  /**
   * **No internal rule id reaches the customer.** Ids are keys into
   * `RULE_LABELS`; a raw `R-` or `§` string in customer-facing JSX would be
   * engine vocabulary on screen.
   */
  check(
    'no customer-facing component renders a raw rule id',
    [
      'src/modules/goal-based-fd/components/allocation-leg-card.tsx',
      'src/modules/goal-based-fd/components/plan-results.tsx',
      'src/modules/goal-based-fd/components/planner-results.tsx',
      'src/modules/goal-based-fd/components/reason-list.tsx',
      'src/modules/goal-based-fd/components/best-fit-card.tsx',
    ].filter((file) => /['"`](?:R-[A-Z]|\u00a7\d)/.test(sources.get(file) ?? '')),
    [],
  );

  /**
   * **And no blocked-rule *message* names one either.**
   *
   * This is the surface the leak actually came through: `planner-results.tsx`
   * renders each rule's `intent` and `missingData` verbatim in the "what this
   * plan doesn't yet consider" disclosure, and two of those strings carried an
   * id in parentheses. The `ruleId` field is exempt \u2014 it is the identifier
   * itself and never reaches the DOM.
   */
  const RULE_ID_IN_PROSE = /(?:R-[A-Z]+-\d+|\u00a7\d+\.[a-z][\w-]*)/;
  const blockedProse = [...(blocked ?? '').matchAll(/(?:intent|missingData):\s*\n?\s*'([^']*)'/g)]
    .map((match) => match[1] ?? '')
    .filter((text) => RULE_ID_IN_PROSE.test(text));

  check('and no blocked-rule message names a rule id', blockedProse, []);

  section('Invariants · Allocation policy (UC2 philosophy)');

  const allocate = sources.get('src/modules/goal-based-fd/utils/allocate.ts');
  const policyType = sources.get('src/modules/goal-based-fd/types/allocation-policy.ts');
  // const policyConst = sources.get('src/modules/goal-based-fd/constants/allocation-policy.ts');

  ok('the allocation engine exists', Boolean(allocate));
  ok('and its policy is a declared type', Boolean(policyType));

  /**
   * **No scenario branches.** The documented allocations must fall out of the
   * policy and the catalogue, never out of an `if` that recognises a goal. A
   * goal-type literal inside the allocator is that failure, and it is the single
   * most important thing to keep out of this file.
   */
  check(
    'the allocator never branches on a goal type',
    /'(?:emergency|education|retirement)'/.test(allocate ?? '') ? ['allocate.ts'] : [],
    [],
  );

  /**
   * **No documented figure is hardcoded.** ₹25,00,000, ₹20,00,000, ₹10,00,000
   * and the four-leg shape are example values; an allocator that contains one is
   * reproducing the worked example rather than the reasoning.
   */
  check(
    'the allocator hardcodes no scenario amount',
    /\b(?:2_?500_?000|2_?000_?000|1_?000_?000|500_?000)\b/.test(allocate ?? '')
      ? ['allocate.ts']
      : [],
    [],
  );

  /**
   * **Deposit-insurance cover is named once and configurable.** It is the
   * statutory DICGC figure the platform already advertises — not the ₹5,00,000
   * that appears in the client's worked examples, and not a confirmed maximum
   * per bank. One declaration keeps those from being conflated.
   */
  check(
    'the insurance cover is declared in exactly one file',
    [...sources.entries()]
      .filter(([, text]) => /DEPOSIT_INSURANCE_COVERAGE\s*=/.test(text))
      .map(([file]) => file),
    ['src/modules/goal-based-fd/constants/allocation-policy.ts'],
  );
  ok(
    'and the policy takes it as a field rather than reading a constant',
    /insuredCoverageAmount/.test(allocate ?? '') &&
      !/DEPOSIT_INSURANCE_COVERAGE/.test(allocate ?? ''),
  );

  /**
   * **Cover is a consideration, not a cap.** The allocator must place money it
   * cannot insure rather than refusing it, and must say so — the client has
   * confirmed no maximum per bank, so a refusal would be an invented rule.
   */
  ok(
    'an uninsurable remainder is still placed',
    /remaining > 0/.test(allocate ?? '') &&
      !/throw|return \[\];\s*\/\/ refuse/.test(allocate ?? ''),
  );
  ok(
    'and the client concentration rule stays declared blocked',
    /'\u00a711\.diversification'/.test(blocked ?? ''),
  );

  /**
   * **Rate is not the objective.** The allocator preserves the suitability
   * ranking it is handed; a sort by rate inside it would silently make yield the
   * goal again.
   */
  check(
    'the allocator never re-sorts by rate',
    /\.sort\(|annualRate\s*[-<>]/.test(allocate ?? '') ? ['allocate.ts'] : [],
    [],
  );

  section('Invariants · Visual layer (Motion & Visual Specification)');

  const goalMark = sources.get('src/components/business/goal-mark.tsx');
  const planMark = sources.get('src/modules/goal-based-fd/components/plan-mark.tsx');
  const maturityFlow = sources.get('src/modules/goal-based-fd/components/maturity-flow.tsx');
  /*
    Vector marks only. `GoalMark` became commissioned raster artwork when the
    design direction changed, so it is held to the raster rules below rather
    than to `currentColor` — which an <Image> cannot inherit.
  */
  const marks = [['PlanMark', planMark]];

  ok('the goal marks exist', Boolean(goalMark));
  ok('the journey mark exists', Boolean(planMark));

  /**
   * **The asset strategy is inline SVG and nothing else.** No GIF, no Lottie,
   * no video, no stock illustration — the spec says "prohibited", not
   * "avoided", so it is asserted rather than trusted.
   *
   * **Two exemptions, both deliberate.**
   *
   * `public/banks/` holds partner-bank logos — real product data the customer
   * needs in order to recognise who they would be depositing with.
   *
   * `public/goal-*.png` holds the approved goal artwork. The illustrations were
   * SVG until the design direction changed to commissioned raster artwork; that
   * is a product decision, so the rule moved with it rather than the artwork
   * being reverted to satisfy a stale assertion. The prohibition that matters is
   * unchanged and still enforced below: **no animated or video asset**, and no
   * raster anywhere else.
   */
  const shippedAssets = walk2(path.join(ROOT, 'public')).map(rel);

  check(
    'no animated or video asset is shipped',
    shippedAssets.filter((file) => /\.(gif|lottie|mp4|webm|apng)$/i.test(file)),
    [],
  );
  check(
    'and no raster outside the bank logos and approved goal artwork',
    shippedAssets.filter(
      (file) =>
        /\.(png|jpe?g|webp|avif)$/i.test(file) &&
        !file.startsWith('public/banks/') &&
        !/^public\/goal-[\w-]+\.(png|webp)$/.test(file),
    ),
    [],
  );

  check(
    'no component references an animated or raster asset',
    [...sources.entries()]
      .filter(([, text]) => /\.(gif|lottie)\b/i.test(text) || /lottie|LottiePlayer/i.test(text))
      .map(([file]) => file),
    [],
  );

  /**
   * **Marks inherit the theme.** `currentColor` and tokens only — a hex in a
   * mark is a second palette starting, and it would not follow the brand.
   */
  for (const [name, text] of marks) {
    ok(`${name} hardcodes no colour`, !/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(text ?? ''));
    ok(`${name} inherits currentColor`, /currentColor/.test(text ?? ''));
    ok(`${name} is decorative`, /aria-hidden="true"/.test(text ?? ''));
  }

  /**
   * **The goal artwork is raster, and is held to the raster rules.**
   *
   * `GoalMark` drew SVG until the commissioned illustrations were approved. The
   * colour rule it used to satisfy — inherit `currentColor` — cannot apply to an
   * `<Image>`, so it is replaced by the stronger statement for artwork the
   * component does not draw: **it draws nothing at all**. No geometry, no fill,
   * no palette, therefore nothing for a theme to disagree with and nothing that
   * can be made to claim a figure.
   */
  ok('GoalMark renders the approved artwork', /next\/image/.test(goalMark ?? ''));
  ok('and draws no geometry of its own', !/<svg|<circle|<path|fill=/.test(goalMark ?? ''));
  ok('so it hardcodes no colour', !/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(goalMark ?? ''));
  ok(
    'and is decorative',
    /alt=""/.test(goalMark ?? '') && /aria-hidden="true"/.test(goalMark ?? ''),
  );

  /*
    Every path it can render is declared in one map, and every one must exist.
    A typo would otherwise ship as a broken illustration on every screen that
    lists goals, with nothing failing anywhere.
  */
  const goalArtworkPaths = [...(goalMark ?? '').matchAll(/'(\/goal-[\w-]+\.png)'/g)].map(
    (match) => match[1],
  );
  ok('it declares one artwork path per goal', goalArtworkPaths.length === 3);
  check(
    'and every declared file is shipped',
    goalArtworkPaths.filter((asset) => !shippedAssets.includes(`public${asset}`)),
    [],
  );

  /**
   * **The open ring is never filled.** It is the estimate — in the goal marks,
   * in the planner's destination, and on the maturity row. Filling it would be
   * the illustration claiming a certainty the engine does not have, which is
   * the single most important rule in the visual grammar.
   */
  ok(
    'the planner destination is drawn open',
    /cx=\{STATIONS\[3\]\.cx\}[\s\S]*?fill="none"/.test(planMark ?? ''),
  );
  ok(
    'and the maturity estimate is drawn open',
    /kind === 'estimated' \? 'none' : 'currentColor'/.test(maturityFlow ?? ''),
  );

  /**
   * **The journey mark holds no state of its own.** It is a pure function of
   * answers the planner already has, so it cannot drift from the questions or
   * go stale behind them.
   */
  ok('the journey mark stores nothing', !/useState|useRef|useEffect/.test(planMark ?? ''));

  /**
   * **Nothing is carried by the illustration alone.** The `Stepper` remains the
   * announced progress indicator at every width; the mark is hidden below `md`
   * and must never be the only report of progress.
   */
  const screenSource = sources.get('src/modules/goal-based-fd/components/goal-planner-screen.tsx');
  /**
   * **The Stepper remains the announced progress indicator.** The header's
   * journey mark was replaced by approved artwork, so progress is reported by
   * the Stepper alone — which is what it was always for. The mark must not
   * linger as a dead import.
   */
  ok('the Stepper is still rendered', /<Stepper/.test(screenSource ?? ''));
  ok('and the retired journey mark is not left imported', !/PlanMark/.test(screenSource ?? ''));
  ok(
    'the header artwork is decorative',
    /alt=""/.test(screenSource ?? '') && /goal-based-icon/.test(screenSource ?? ''),
  );

  /** The draw duration is a token, like every other duration in the system. */
  ok('the draw duration is a token', /--ds-duration-draw:/.test(motionTokens));

  /**
   * **An estimated maturity is never drawn as a settled one.**
   *
   * This was asserted on the retirement ring inside `GoalMark`, which drew the
   * destination as an open circle. That ring is now inside the commissioned
   * artwork, so the assertion moves to where a ring is still *drawn* — and
   * becomes exhaustive rather than a check on one hardcoded circle: **no
   * component may fill a ring that represents an estimate.**
   *
   * `MaturityFlow` and `PlanMark` are the two that draw one, and both are
   * already asserted open above. What is added here is the guard against a
   * third appearing: `GoalMark` draws no ring at all, so it cannot close one.
   */
  ok('the goal artwork draws no ring it could close', !/<circle|r="\d/.test(goalMark ?? ''));
  check(
    'and no component fills a ring marked as an estimate',
    [...sources.entries()]
      .filter(([, text]) => /estimated[\s\S]{0,80}fill="currentColor"/.test(text))
      .map(([file]) => file),
    [],
  );

  /**
   * **No illustration implies a guarantee or an achievement.** Deposit
   * insurance and product terms are conditional (client source document), and
   * selecting a goal is not reaching it. The scenes may say "selected"; they
   * may not say protected, guaranteed, secured or achieved.
   *
   * Comments are stripped before this runs, so the prose explaining *why* these
   * words are forbidden cannot itself trip the probe.
   */
  check(
    'no goal illustration claims protection or achievement',
    [...sources.entries()]
      .filter(([file]) => /goal-mark|goal-entry-list/.test(file))
      .filter(([, text]) =>
        /\b(guaranteed|fully protected|milestone reached|target met|capital secured)\b/i.test(text),
      )
      .map(([file]) => file),
    [],
  );

  /**
   * **Selection never blocks navigation.** The confirmation is transient and
   * runs alongside the router. A timer or an awaited transition between the
   * click and the navigation would turn a confirmation into a delay.
   */
  const entryList = sources.get('src/modules/marketplace/components/goal-entry-list.tsx');
  ok('the goal columns navigate through a real link', /<Link/.test(entryList ?? ''));
  ok(
    'and nothing defers the navigation',
    !/setTimeout|preventDefault|router\.push/.test(entryList ?? ''),
  );

  /**
   * **The illustrations are never the semantic content.** Each column states
   * its goal and what it means in text; the scene beside it is decorative.
   */
  ok('each column names its goal in text', /goal\.label/.test(entryList ?? ''));
  ok('and explains it in text', /goal\.description/.test(entryList ?? ''));

  /** The touch target floor survives the new layout. */
  ok(
    'the goal columns keep a comfortable touch target',
    /min-h-16|min-h-\[\d+px\]/.test(entryList ?? ''),
  );
}

/** Directory walk that tolerates the directory being absent. */
function walk2(dir) {
  try {
    return readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry);
      return statSync(full).isDirectory() ? walk2(full) : [full];
    });
  } catch {
    return [];
  }
}
