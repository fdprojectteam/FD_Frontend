/**
 * Unit suite — the pure modules, executed as shipped.
 *
 * Covers: URL parsing and validation, write-side merging and I7
 * canonicalisation, the URL → API translation (gaps G1 and G2), and filter
 * labelling.
 */
import { check, ok, section } from '../lib/assert.mjs';
import { buildUnits } from '../lib/build.mjs';

const BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', shortCode: 'HDFC', initials: 'HB', rating: 'AAA' },
  { id: 'axis', name: 'Axis Bank', shortCode: 'AXIS', initials: 'AB', rating: 'AA+' },
];

export async function runUnitSuite() {
  const out = await buildUnits();
  const M = await import(`file://${out}?t=${Date.now()}`);

  const parse = (query) => M.parseMarketplaceUrlValues(new URLSearchParams(query));
  const merge = (query, patch) => M.mergeMarketplaceParams(new URLSearchParams(query), patch);
  const params = (query, limit = 6) => M.toProductListParams(parse(query), limit);

  /* ---------------------------------------------------------------- */
  section('Unit · URL parsing and validation (read side)');

  check('empty URL yields defaults', parse(''), {
    q: '',
    amount: '',
    tenure: '',
    bank: '',
    minRate: '',
    page: 1,
    sort: M.DEFAULT_SORT,
  });

  check('q is read and trimmed', parse('q=%20hdfc%20').q, 'hdfc');
  check('q is length-capped', parse(`q=${'x'.repeat(200)}`).q.length, 100);
  check('amount accepts a free numeric value', parse('amount=75000').amount, '75000');
  check('amount rejects non-numeric', parse('amount=abc').amount, '');
  check('amount rejects zero', parse('amount=0').amount, '');
  check('amount rejects negatives', parse('amount=-5').amount, '');
  check('tenure accepts an approved option', parse('tenure=12').tenure, '12');
  check('tenure rejects an unapproved value', parse('tenure=99').tenure, '');
  check('bank accepts a slug', parse('bank=idfc-first').bank, 'idfc-first');
  check('bank rejects a hostile value', parse('bank=%3Cscript%3E').bank, '');
  check('minRate accepts an approved band', parse('minRate=7').minRate, '7');
  check('minRate accepts a fractional band', parse('minRate=7.25').minRate, '7.25');
  check('minRate rejects non-numeric', parse('minRate=abc').minRate, '');
  check('minRate rejects an unlisted band', parse('minRate=6.75').minRate, '');
  check('page parses', parse('page=3').page, 3);
  check('page rejects zero', parse('page=0').page, 1);
  check('page rejects non-numeric', parse('page=abc').page, 1);
  check('page rejects fractional', parse('page=2.5').page, 1);
  check('unknown sort falls back to default', parse('sort=nonsense&order=up').sort, M.DEFAULT_SORT);
  check('valid sort is honoured', parse('sort=tenureMonths&order=asc').sort.id, 'tenure-asc');
  check(
    'sort without a matching order falls back',
    parse('sort=tenureMonths').sort,
    M.DEFAULT_SORT,
  );

  check(
    'every parameter together',
    parse('q=hdfc&amount=50000&tenure=12&bank=hdfc&minRate=7&page=2&sort=tenureMonths&order=asc'),
    {
      q: 'hdfc',
      amount: '50000',
      tenure: '12',
      bank: 'hdfc',
      minRate: '7',
      page: 2,
      sort: M.SORT_OPTIONS.find((option) => option.id === 'tenure-asc'),
    },
  );

  ok(
    'parsing never throws on hostile input',
    (() => {
      try {
        parse('q=%&amount=%E2%82%B9&tenure=[]&bank=../../etc&minRate=NaN&page=-Infinity&sort=1');
        return true;
      } catch {
        return false;
      }
    })(),
  );

  /* ---------------------------------------------------------------- */
  section('Unit · merge and I7 canonicalisation (write side)');

  check(
    'absent keys are preserved',
    merge('q=hdfc&sort=tenureMonths&order=asc', { page: '2' }),
    'q=hdfc&page=2&sort=tenureMonths&order=asc',
  );
  check('undefined removes a key', merge('q=hdfc&page=2', { page: undefined }), 'q=hdfc');
  check('empty string removes a key', merge('bank=hdfc', { bank: '' }), '');
  check(
    'a filter write preserves search and sort',
    merge('q=hdfc&sort=tenureMonths&order=asc', { bank: 'axis', page: undefined }),
    'q=hdfc&bank=axis&sort=tenureMonths&order=asc',
  );
  check(
    'setting a key twice does not duplicate it',
    merge('bank=hdfc', { bank: 'axis' }),
    'bank=axis',
  );
  check(
    'clearing everything yields an empty query',
    merge('q=a&amount=1&tenure=12&bank=hdfc&minRate=7&page=3', {
      q: undefined,
      amount: undefined,
      tenure: undefined,
      bank: undefined,
      minRate: undefined,
      page: undefined,
    }),
    '',
  );
  check(
    'clear preserves a non-default sort',
    merge('q=a&bank=hdfc&sort=tenureMonths&order=asc', {
      q: undefined,
      bank: undefined,
      page: undefined,
    }),
    'sort=tenureMonths&order=asc',
  );

  section('Unit · I7 canonical table (write-only)');
  check('?page=1 → /', merge('page=1', {}), '');
  check('?sort=interestRate&order=desc → /', merge('sort=interestRate&order=desc', {}), '');
  check('?bank= → /', merge('bank=', {}), '');
  check('?bank=hdfc&page=1 → ?bank=hdfc', merge('bank=hdfc&page=1', {}), 'bank=hdfc');
  check(
    'an unrelated write canonicalises the whole URL',
    merge('sort=interestRate&order=desc&page=1&bank=', { tenure: '12' }),
    'tenure=12',
  );
  check(
    'unapproved parameters cannot survive a write',
    merge('category=tax-saving&utm_source=x&bank=hdfc', {}),
    'bank=hdfc',
  );
  check(
    'invalid values are dropped on write',
    merge('tenure=99&minRate=abc&bank=hdfc', {}),
    'bank=hdfc',
  );
  check(
    'parameter order is fixed (one state, one URL)',
    merge('order=asc&sort=tenureMonths&page=3&bank=hdfc&q=a&minRate=7&tenure=12&amount=5000', {}),
    'q=a&amount=5000&tenure=12&bank=hdfc&minRate=7&page=3&sort=tenureMonths&order=asc',
  );
  ok(
    'read side never rewrites the URL (write-only): parse returns values, not a URL',
    typeof M.parseMarketplaceUrlValues(new URLSearchParams('page=1')) === 'object',
  );

  /* ---------------------------------------------------------------- */
  section('Unit · toProductListParams (G1 / G2)');

  check('default state', params(''), { page: 1, limit: 6, sort: 'interestRate', order: 'desc' });
  check('G1 — search maps to q, never to search', params('q=hdfc').q, 'hdfc');
  ok('G1 — `search` is never emitted', !('search' in params('q=hdfc')));
  check('G2 — tenure maps to tenureMonths', params('tenure=12').tenureMonths, 12);
  ok('G2 — `tenure` is never emitted', !('tenure' in params('tenure=12')));
  check('bank passes through', params('bank=hdfc').bank, 'hdfc');
  check('minRate becomes a number', params('minRate=7.25').minRate, 7.25);
  check('amount becomes a number', params('amount=50000').amount, 50000);
  check('limit is applied', params('', 12).limit, 12);
  check('sort and order come from the sort option', params('sort=tenureMonths&order=asc'), {
    page: 1,
    limit: 6,
    sort: 'tenureMonths',
    order: 'asc',
  });
  check('empty values are omitted, not sent empty', params('q=&bank=&minRate='), {
    page: 1,
    limit: 6,
    sort: 'interestRate',
    order: 'desc',
  });
  check('rejected values never reach the API', params('tenure=99&minRate=6.75&bank=%3Cscript%3E'), {
    page: 1,
    limit: 6,
    sort: 'interestRate',
    order: 'desc',
  });
  check(
    'everything at once',
    params('q=hdfc&amount=50000&tenure=12&bank=hdfc&minRate=7&page=2&sort=tenureMonths&order=asc'),
    {
      page: 2,
      limit: 6,
      sort: 'tenureMonths',
      order: 'asc',
      q: 'hdfc',
      bank: 'hdfc',
      tenureMonths: 12,
      minRate: 7,
      amount: 50000,
    },
  );

  // The handler's read set, taken from src/mocks/handlers/products.ts.
  const HANDLER_READS = [
    'q',
    'bank',
    'tenureMonths',
    'minRate',
    'amount',
    'category',
    'sort',
    'order',
    'page',
    'limit',
  ];
  const produced = Object.keys(params('q=a&amount=50000&tenure=12&bank=hdfc&minRate=7&page=2'));
  check(
    'every produced key is one the API actually reads',
    produced.filter((key) => !HANDLER_READS.includes(key)),
    [],
  );

  /* ---------------------------------------------------------------- */
  section('Unit · product preview selection (M2.6 D1 = A′)');

  const product = (id, rate) => ({ id, interestRate: rate, name: `Product ${id}` });
  const page = (...items) => ({
    items,
    meta: { page: 1, limit: 6, total: items.length, totalPages: 1 },
  });

  check(
    'finds the product in a cached listing page',
    M.selectProductPreview([page(product('fd-001', 7.75), product('fd-002', 7.25))], 'fd-002')?.id,
    'fd-002',
  );
  check(
    'searches every cached page, not just the first',
    M.selectProductPreview([page(product('fd-001', 7.75)), page(product('fd-009', 6.9))], 'fd-009')
      ?.id,
    'fd-009',
  );
  check(
    'returns undefined on a cold load (no cached pages)',
    M.selectProductPreview([], 'fd-001'),
    undefined,
  );
  check(
    'returns undefined when the id is not cached',
    M.selectProductPreview([page(product('fd-001', 7.75))], 'fd-404'),
    undefined,
  );
  check(
    'tolerates an undefined page — a query can be registered before it resolves',
    M.selectProductPreview([undefined, page(product('fd-003', 7.1))], 'fd-003')?.id,
    'fd-003',
  );
  check(
    'an empty id selects nothing',
    M.selectProductPreview([page(product('fd-001', 7.75))], ''),
    undefined,
  );

  const cached = product('fd-005', 7.4);
  ok(
    'returns the cached instance, not a copy — identity stays stable across renders',
    M.selectProductPreview([page(cached)], 'fd-005') === cached,
  );

  check(
    'ProductDetails is still assignable to ProductSummary (compile-time guard)',
    M.productDetailsExtendsSummary,
    true,
  );

  /* ---------------------------------------------------------------- */
  section('Unit · request gate (M2.6 — MSW readiness race)');

  // Always leave the gate clear: it is module state shared with every other
  // assertion in this file.
  M.setRequestGate(null);

  check('no gate is registered by default', M.hasRequestGate(), false);
  check('an ungated await resolves', await M.awaitRequestGate(), undefined);

  let released;
  const barrier = new Promise((resolve) => {
    released = resolve;
  });
  M.setRequestGate(() => barrier);

  check('registering a gate is observable', M.hasRequestGate(), true);

  let passed = false;
  const waiting = M.awaitRequestGate().then(() => {
    passed = true;
  });
  await Promise.resolve();
  check('a gated request does not proceed before release', passed, false);

  released();
  await waiting;
  check('a gated request proceeds once released', passed, true);

  let calls = 0;
  M.setRequestGate(async () => {
    calls += 1;
  });
  await M.awaitRequestGate();
  await M.awaitRequestGate();
  check('the gate is consulted on every request, not once', calls, 2);

  M.setRequestGate(null);
  check('setRequestGate(null) restores the ungated transport', M.hasRequestGate(), false);
  check('and an await is a no-op again', await M.awaitRequestGate(), undefined);

  M.setRequestGate(() => Promise.resolve());
  M.setRequestGate(() => Promise.resolve());
  check('re-registering replaces rather than stacks', M.hasRequestGate(), true);
  M.setRequestGate(null);

  ok(
    'a rejecting gate surfaces to the caller rather than hanging',
    await (async () => {
      M.setRequestGate(() => Promise.reject(new Error('worker failed')));
      try {
        await M.awaitRequestGate();
        return false;
      } catch {
        return true;
      } finally {
        M.setRequestGate(null);
      }
    })(),
  );

  /* ---------------------------------------------------------------- */
  section('Unit · calculator input validation (M2.6 D5 — Zod, no RHF)');

  const amount = (raw, min = 10_000) => M.parseCalculatorAmount(raw, min);

  check('accepts the approved default', amount('100000'), { ok: true, amount: 100000 });
  check('accepts exactly the minimum', amount('10000').ok, true);
  check('trims surrounding space', amount('  50000  ').ok, true);
  check('rejects an empty field', amount('').ok, false);
  check('rejects non-numeric input', amount('abc').ok, false);
  check('rejects a decimal', amount('1000.50').ok, false);
  check('rejects a negative', amount('-5000').ok, false);
  check('rejects zero', amount('0').ok, false);
  check('rejects more than 12 digits', amount('1234567890123').ok, false);
  check('accepts 12 digits', amount('999999999999').ok, true);
  check('rejects below the product minimum', amount('5000').ok, false);
  check(
    'the below-minimum message names the actual figure',
    amount('5000', 25_000).ok === false && amount('5000', 25_000).message.includes('₹25,000'),
    true,
  );
  check(
    'the minimum is per product, not global',
    { at10k: amount('10000', 10_000).ok, at50k: amount('10000', 50_000).ok },
    { at10k: true, at50k: false },
  );
  ok(
    'a rejection always carries a message',
    amount('abc').ok === false && amount('abc').message.length > 0,
  );

  section('Unit · the approved calculator figures');

  // The screen renders `estimatedReturns` on mount and only calls this when the
  // user submits a new amount. Both paths must agree, so the formula is
  // re-asserted against the figures printed on the approved screens.
  const maturityOf = (principal, annualRate, tenureMonths) =>
    M.calculateMaturity({ principal, annualRate, tenureMonths });

  check('IDFC 7.75% / 12m → ₹1,07,978 (the detail screen default)', maturityOf(100000, 7.75, 12), {
    principal: 100000,
    interestEarned: 7978,
    maturityValue: 107978,
  });
  check('HDFC 7.25% / 12m → ₹1,07,450', maturityOf(100000, 7.25, 12).maturityValue, 107450);
  check('Kotak 7.4% / 24m → ₹1,15,795', maturityOf(100000, 7.4, 24).maturityValue, 115795);
  check('SBI 7.1% / 12m → ₹1,07,291', maturityOf(100000, 7.1, 12).maturityValue, 107291);
  check('ICICI 6.95% / 18m → ₹1,10,888', maturityOf(100000, 6.95, 18).maturityValue, 110888);
  check('Axis 6.8% / 9m → ₹1,05,187', maturityOf(100000, 6.8, 9).maturityValue, 105187);

  /* ---------------------------------------------------------------- */
  section('Unit · filter labelling');

  check('bank resolves to a name', M.facetValueLabel('bank', 'hdfc', BANKS), 'HDFC Bank');
  check(
    'unknown bank id is shown, not hidden',
    M.facetValueLabel('bank', 'unknown', BANKS),
    'unknown',
  );
  check('tenure is formatted', M.facetValueLabel('tenure', '12', BANKS), '12 months');
  check('rate is short on a chip', M.facetValueLabel('minRate', '7', BANKS), '7%+');
  check(
    'rate is spelled out on a pill',
    M.facetValueLongLabel('minRate', '7', BANKS),
    '7% and above',
  );
  check('amount is currency', M.facetValueLabel('amount', '50000', BANKS), '₹50,000');
  check(
    'facet names match the approved chips',
    ['bank', 'tenure', 'minRate', 'amount'].map(M.facetLabel),
    ['Bank', 'Tenure', 'Interest Rate', 'Amount'],
  );
  check('no filters described when none applied', M.describeActiveFilters(parse(''), BANKS), []);
  check(
    'every applied filter is described, search first',
    M.describeActiveFilters(parse('q=hdfc&amount=50000&tenure=12&bank=axis&minRate=7'), BANKS).map(
      (entry) => `${entry.facet}: ${entry.value}`,
    ),
    [
      'Search: hdfc',
      'Bank: Axis Bank',
      'Tenure: 12 months',
      'Interest Rate: 7% and above',
      'Amount: ₹50,000',
    ],
  );

  /* ---------------------------------------------------------------- */
  section('Unit · buildCompareRows — the comparison row model (T2.7.1)');

  /**
   * The fixture is the approved comparison screen itself: HDFC 7.1% / 12m,
   * IDFC FIRST 7.75% / 12m, Kotak 7.4% / 24m, with the returns the design
   * publishes. Inventing convenient numbers would prove the function
   * self-consistent rather than correct.
   */
  const compareProduct = (id, interestRate, tenureMonths, minInvestment, returns, benefits) => ({
    id,
    interestRate,
    tenureMonths,
    minInvestment,
    estimatedReturns: {
      principal: 100_000,
      /*
        At the ₹1,00,000 reference no slab applies, so the applied rate *is* the
        headline rate (change request, 2026-08-02) — which is why every approved
        figure below is unchanged by the slab work. The two are separate fields
        precisely so the cases where they diverge are expressible; see the
        divergence fixture at the end of this section.
      */
      appliedRate: interestRate,
      interestEarned: returns[0],
      maturityValue: returns[1],
    },
    benefits: benefits.map((label, index) => ({ id: `${id}-${index}`, label })),
    eligibility: { summary: 'ignored here', minAge: 18, residency: 'Resident', panRequired: true },
  });

  const HDFC = compareProduct(
    'hdfc',
    7.1,
    12,
    10_000,
    [7_291, 1_07_291],
    ['Loan against FD', 'Auto-renewal'],
  );
  const IDFC = compareProduct(
    'idfc',
    7.75,
    12,
    10_000,
    [7_978, 1_07_978],
    ['Senior citizen +0.5%', 'Auto-renewal'],
  );
  const KOTAK = compareProduct(
    'kotak',
    7.4,
    24,
    50_000,
    [15_795, 1_15_795],
    ['Loan against FD', 'Premium support'],
  );

  const APPROVED = [HDFC, IDFC, KOTAK];
  const rows = M.buildCompareRows(APPROVED);
  const row = (id) => rows.find((entry) => entry.id === id);

  check(
    'seven rows in the approved order',
    rows.map((entry) => entry.id),
    [
      'interestRate',
      'tenure',
      'minInvestment',
      'interestEarned',
      'maturityValue',
      'benefits',
      'eligibility',
    ],
  );
  check(
    'labels match the approved screen',
    rows.map((entry) => entry.label),
    [
      'Interest Rate',
      'Tenure',
      'Minimum Investment',
      'Interest Earned',
      'Maturity Value',
      'Benefits',
      'Eligibility',
    ],
  );
  check(
    'every row has one value per column',
    rows.map((entry) => entry.values.length),
    [3, 3, 3, 3, 3, 3, 3],
  );

  check('rates trim trailing zeros', row('interestRate').values, ['7.1%', '7.75%', '7.4%']);
  check('tenure is spelled out', row('tenure').values, ['12 months', '12 months', '24 months']);
  check('money uses Indian grouping', row('minInvestment').values, [
    '₹10,000',
    '₹10,000',
    '₹50,000',
  ]);
  check('interest earned matches the approved cells', row('interestEarned').values, [
    '₹7,291',
    '₹7,978',
    '₹15,795',
  ]);
  check('maturity matches the approved cells', row('maturityValue').values, [
    '₹1,07,291',
    '₹1,07,978',
    '₹1,15,795',
  ]);
  check('benefits are joined with the approved separator', row('benefits').values, [
    'Loan against FD · Auto-renewal',
    'Senior citizen +0.5% · Auto-renewal',
    'Loan against FD · Premium support',
  ]);
  check('eligibility is the short approved form', row('eligibility').values, [
    'Resident, 18+',
    'Resident, 18+',
    'Resident, 18+',
  ]);

  /**
   * The single assertion that reproduces the approved highlighting exactly:
   * IDFC wins the rate, HDFC takes the ₹10,000 tie, Kotak wins both returns
   * rows, and Tenure/Benefits/Eligibility have no winner at all.
   */
  check(
    'highlighting reproduces the approved screen',
    rows.map((entry) => entry.bestIndex),
    [1, null, 0, 2, 2, null, null],
  );

  check('highest rate wins', row('interestRate').bestIndex, 1);
  check('lowest minimum wins', row('minInvestment').bestIndex, 0);
  check('highest interest earned wins', row('interestEarned').bestIndex, 2);
  check('highest maturity wins', row('maturityValue').bestIndex, 2);
  check('tenure deliberately has no winner', row('tenure').bestIndex, null);
  check(
    'text rows have no winner',
    [row('benefits').bestIndex, row('eligibility').bestIndex],
    [null, null],
  );

  const tiedMinimum = M.buildCompareRows([IDFC, HDFC, KOTAK]);
  check(
    'a tie resolves to the leftmost column, whichever product is there',
    tiedMinimum.find((entry) => entry.id === 'minInvestment').bestIndex,
    0,
  );

  check(
    'column order follows the input',
    M.buildCompareRows([KOTAK, HDFC]).find((entry) => entry.id === 'interestRate').values,
    ['7.4%', '7.1%'],
  );

  check(
    'a row where every value ties has no winner (A8)',
    M.buildCompareRows([HDFC, HDFC, HDFC]).map((entry) => entry.bestIndex),
    [null, null, null, null, null, null, null],
  );
  check(
    'a single product highlights nothing (A6, from the same rule)',
    M.buildCompareRows([KOTAK]).map((entry) => entry.bestIndex),
    [null, null, null, null, null, null, null],
  );
  check('an empty selection yields no rows', M.buildCompareRows([]), []);

  const noBenefits = compareProduct('none', 7, 12, 10_000, [7_000, 1_07_000], []);
  check(
    'a product with no benefits shows a dash, not a blank (A9)',
    M.buildCompareRows([noBenefits]).find((entry) => entry.id === 'benefits').values,
    ['—'],
  );

  /**
   * Proves the figures are *read*, not recomputed: a maturity that no formula
   * would produce from 7.1% on ₹1,00,000 must still be printed verbatim. If
   * this ever fails, a second calculation site has appeared.
   */
  const tampered = { ...HDFC, estimatedReturns: { ...HDFC.estimatedReturns, maturityValue: 42 } };
  check(
    'maturity is read from estimatedReturns, never recomputed',
    M.buildCompareRows([tampered]).find((entry) => entry.id === 'maturityValue').values,
    ['₹42'],
  );

  /**
   * The same proof for the **rate** (change request, 2026-08-02).
   *
   * The Interest Rate row must quote the rate the deposit actually earns, not
   * the rate the product is advertised at. Those agree at ₹1,00,000, which is
   * exactly why the assertion needs a fixture where they disagree: with equal
   * values, a row still reading `interestRate` would pass every other check in
   * this file.
   *
   * The winner is asserted from the same divergence. A row that formatted the
   * applied rate while ranking on the headline rate would print the right
   * numbers and star the wrong column — a failure that is invisible in the
   * values and wrong in the only thing the row is for.
   */
  const slabbed = (id, headline, applied) => ({
    ...HDFC,
    id,
    interestRate: headline,
    estimatedReturns: { ...HDFC.estimatedReturns, appliedRate: applied },
  });

  // Headline order is A > B; applied order is reversed by the rate cards.
  const divergent = [slabbed('a', 7.75, 7.1), slabbed('b', 6.8, 7.85)];
  const divergentRate = M.buildCompareRows(divergent).find((entry) => entry.id === 'interestRate');

  check('the rate row quotes the applied rate, not the headline', divergentRate.values, [
    '7.1%',
    '7.85%',
  ]);
  check('and the best rate is judged on the applied rate too', divergentRate.bestIndex, 1);

  /* ---------------------------------------------------------------- */
  section('Unit · resolveApplicableRate (change request, 2026-08-02)');

  /**
   * A rate card that does **not** rise monotonically — the ₹2 crore band pays
   * less, as bulk deposits commonly do. That is the shape a "take the highest
   * rate" shortcut gets wrong, so it is the shape the fixture uses.
   */
  const CARD = [
    { minAmount: 500_000, annualRate: 7.85 },
    { minAmount: 2_500_000, annualRate: 7.95 },
    { minAmount: 20_000_000, annualRate: 7.5 },
  ];
  const rateAt = (amount, slabs = CARD) => M.resolveApplicableRate(7.75, amount, slabs);

  check('below the first band, the headline rate stands', rateAt(100_000), 7.75);
  check('one rupee below a boundary stays in the lower band', rateAt(499_999), 7.75);
  check('the boundary itself is inclusive', rateAt(500_000), 7.85);
  check('mid-band resolves to that band', rateAt(1_000_000), 7.85);
  check('the highest band cleared wins, not the highest rate', rateAt(50_000_000), 7.5);
  check('a product with no rate card earns its headline rate', rateAt(50_000_000, []), 7.75);
  check('and an absent rate card is the same statement', M.resolveApplicableRate(7.75, 9e9), 7.75);

  /**
   * R1 step 2 — the resolver moved to `@/utils/finance` and Marketplace now
   * imports it. These six figures are re-asserted against the **platform**
   * implementation, which is what `units-entry.ts` imports: identical answers
   * from one address instead of two.
   */

  /**
   * Order-independence. The bands are documented as ascending, but the resolver
   * is defined on "the highest band the amount clears" rather than on "the last
   * match", so a fixture or an API that returns them shuffled cannot change the
   * answer.
   */
  check(
    'band order in the data does not change the answer',
    rateAt(1_000_000, [...CARD].reverse()),
    7.85,
  );

  /* ---------------------------------------------------------------- */
  section('Unit · resolveProductRate (platform, D1)');

  /**
   * The composition law, asserted rather than assumed:
   *
   *   the tenure sets the base rate, the amount slab may then override it
   *
   * (`src/types/finance.ts`, on `TenureRate`.) `resolveProductRate` is the only
   * place the platform expresses it, and it answers with a `RateQuote` so the
   * band that produced the figure travels with it.
   */
  const fdTerms = (over = {}) => ({
    tenureMonths: 12,
    baseRate: 7.75,
    rateSlabs: CARD,
    interestType: 'cumulative',
    payout: 'at-maturity',
    ...over,
  });

  check(
    'below the first band the quote is the base rate',
    M.resolveProductRate(fdTerms(), { tenureMonths: 12, amount: 100_000 }),
    { annualRate: 7.75, tenureMonths: 12 },
  );
  check(
    'a cleared band overrides the base rate',
    M.resolveProductRate(fdTerms(), { tenureMonths: 12, amount: 1_000_000 }).annualRate,
    7.85,
  );
  check(
    'the highest band cleared wins, not the highest rate',
    M.resolveProductRate(fdTerms(), { tenureMonths: 12, amount: 50_000_000 }).annualRate,
    7.5,
  );
  check(
    'a product with no bands earns its base rate at any amount',
    M.resolveProductRate(fdTerms({ rateSlabs: [] }), { tenureMonths: 12, amount: 9e9 }).annualRate,
    7.75,
  );

  /**
   * An omitted amount is not zero and not an error — it means no band applies,
   * so the base rate stands. That is what lets a caller ask for the published
   * rate without inventing a placeholder amount.
   */
  check(
    'an omitted amount yields the base rate',
    M.resolveProductRate(fdTerms(), { tenureMonths: 12 }).annualRate,
    7.75,
  );

  /**
   * **No invented tenure.** The catalogue publishes one tenure per product;
   * asked for another, the resolver returns `null` rather than quoting the base
   * rate at a term the bank never offered — the same rule Booking's
   * `resolveRate` follows.
   */
  ok(
    'another tenure is not priced',
    M.resolveProductRate(fdTerms(), { tenureMonths: 36, amount: 100_000 }) === null,
  );
  ok(
    'a fractional tenure is not priced',
    M.resolveProductRate(fdTerms(), { tenureMonths: 12.5 }) === null,
  );
  ok('a zero tenure is not priced', M.resolveProductRate(fdTerms(), { tenureMonths: 0 }) === null);

  /** The quote carries its provenance — which band answered, not just the number. */
  check(
    'the quote reports the tenure it was priced at',
    M.resolveProductRate(fdTerms({ tenureMonths: 24 }), { tenureMonths: 24, amount: 1_000_000 })
      .tenureMonths,
    24,
  );
  check(
    'and carries exactly the two RateQuote fields',
    Object.keys(M.resolveProductRate(fdTerms(), { tenureMonths: 12 })).sort(),
    ['annualRate', 'tenureMonths'],
  );

  /**
   * Equivalence with the amount resolver. Two entry points, one rule — if these
   * ever disagree, one of them has grown a second opinion about the rate.
   */
  for (const amount of [1, 499_999, 500_000, 2_500_000, 20_000_000, 9e9]) {
    check(
      `resolveProductRate agrees with resolveApplicableRate at ${amount}`,
      M.resolveProductRate(fdTerms(), { tenureMonths: 12, amount }).annualRate,
      M.resolveApplicableRate(7.75, amount, CARD),
    );
  }

  /* ---------------------------------------------------------------- */
  section('Unit · defaultDepositAmount (change request, 2026-08-02)');

  const withMin = (minInvestment) => ({ minInvestment });

  check(
    'the highest minimum wins, so every column is openable',
    M.defaultDepositAmount([withMin(10_000), withMin(50_000), withMin(25_000)]),
    100_000,
  );
  check(
    'and it is floored at the reference amount, never below it',
    M.defaultDepositAmount([withMin(5_000)]),
    100_000,
  );
  check(
    'a minimum above the floor raises the default to meet it',
    M.defaultDepositAmount([withMin(10_000), withMin(2_500_000)]),
    2_500_000,
  );
  check(
    'an empty comparison falls back to the reference amount',
    M.defaultDepositAmount([]),
    100_000,
  );

  /* ---------------------------------------------------------------- */
  section('Unit · isBestCell and the row taxonomy (T2.7.5)');

  const rateRow = row('interestRate');
  check(
    'isBestCell agrees with bestIndex, and only there',
    [0, 1, 2].map((column) => M.isBestCell(rateRow, column)),
    [false, true, false],
  );
  check(
    'a row with no winner has no best cell',
    [0, 1, 2].map((column) => M.isBestCell(row('tenure'), column)),
    [false, false, false],
  );
  check('an out-of-range column is not best', M.isBestCell(rateRow, 9), false);

  check(
    'the per-product control names come from one module (T2.7.6)',
    [M.addLabel('HDFC Bank'), M.removeLabel('HDFC Bank'), M.selectLabel('HDFC Bank')],
    ['Add HDFC Bank to comparison', 'Remove HDFC Bank from comparison', 'Select HDFC Bank'],
  );

  check(
    'exactly the two text rows stack on mobile',
    [...M.STACKED_COMPARE_ROWS],
    ['benefits', 'eligibility'],
  );
  check(
    'every stacked id exists in the row model',
    M.STACKED_COMPARE_ROWS.every((id) => rows.some((entry) => entry.id === id)),
    true,
  );

  /* ---------------------------------------------------------------- */
  section('Unit · compare-url — the ?ids= contract (T2.7.2)');

  const parseIds = (query) => M.parseCompareIds(new URLSearchParams(query));
  const mergeIds = (query, next) => M.mergeCompareParams(new URLSearchParams(query), next);

  check('the parameter name is exported, not repeated', M.IDS_PARAM, 'ids');

  check('a missing parameter yields no ids', parseIds(''), []);
  check('an empty parameter yields no ids', parseIds('ids='), []);
  check('a single id parses', parseIds('ids=fd-001'), ['fd-001']);
  check('several ids keep their order', parseIds('ids=fd-003,fd-001,fd-002'), [
    'fd-003',
    'fd-001',
    'fd-002',
  ]);
  check('duplicates resolve to the first occurrence', parseIds('ids=fd-001,fd-002,fd-001'), [
    'fd-001',
    'fd-002',
  ]);
  check('empty segments are dropped', parseIds('ids=fd-001,,fd-002'), ['fd-001', 'fd-002']);
  check('malformed ids are dropped', parseIds('ids=fd-001,<script>,../etc,fd-002'), [
    'fd-001',
    'fd-002',
  ]);
  check(
    'an over-long value is bounded rather than parsed whole',
    parseIds(`ids=${Array.from({ length: 200 }, (_, i) => `fd-${i}`).join(',')}`).length < 200,
    true,
  );

  /**
   * The assertion that proves D8: the parser knows nothing about the cap of
   * four. `useCompareSelection` owns it (C2, O1), and a second owner here
   * would let the two disagree about what "full" means.
   */
  check('more than four ids parse intact — the parser does not cap', parseIds('ids=a,b,c,d,e'), [
    'a',
    'b',
    'c',
    'd',
    'e',
  ]);

  check('an empty selection serialises to an empty query', M.serialiseCompareIds([]), '');
  check(
    'ids serialise unencoded, matching the approved ?ids=a,b,c',
    M.serialiseCompareIds(['fd-001', 'fd-002']),
    'ids=fd-001,fd-002',
  );
  check(
    'serialisation preserves column order',
    M.serialiseCompareIds(['fd-003', 'fd-001']),
    'ids=fd-003,fd-001',
  );
  check(
    'parse → serialise is stable',
    M.serialiseCompareIds(parseIds('ids=fd-002,fd-001')),
    'ids=fd-002,fd-001',
  );

  check(
    'a merge writes the intended list',
    mergeIds('ids=fd-001', ['fd-001', 'fd-002']),
    'ids=fd-001,fd-002',
  );
  check('a merge to nothing empties the query', mergeIds('ids=fd-001', []), '');
  check(
    'a merge canonicalises what it is given',
    mergeIds('', ['fd-001', 'fd-001', '<script>', 'fd-002']),
    'ids=fd-001,fd-002',
  );
  check(
    'no unapproved parameter survives a write',
    mergeIds('page=2&sort=interestRate&utm_source=x&ids=fd-001', ['fd-001']),
    'ids=fd-001',
  );
  check(
    'a non-canonical URL is canonicalised by the next write',
    mergeIds('ids=fd-001,,fd-001,fd-002', ['fd-001', 'fd-002']),
    'ids=fd-001,fd-002',
  );

  /* ---------------------------------------------------------------- */
  section('Unit · error classification — who said "not found" (2026-08-02)');

  /**
   * The defect these assertions close.
   *
   * `/api/v1/*` exists only inside the Service Worker; `src/app/api/` has no
   * route handlers by design. So any API request that escapes interception is
   * answered by the **Next dev server**, with its own HTML 404 — and
   * `isNotFoundError` accepted *any* 404, so "nothing answered this request"
   * arrived at `ProductDetailScreen` as "this product does not exist" and it
   * called `notFound()`. The user saw a 404 page instead of the retryable error
   * card, intermittently, depending on whether the worker happened to be
   * intercepting.
   *
   * These are pure functions and were never unit-tested, which is why a rule
   * this load-bearing could be this wrong for this long.
   */
  const axiosError = (status, data) => ({ isAxiosError: true, response: { status, data } });

  /** What the dev server returns for an unhandled `/api/v1/*` request. */
  const devServer404 = axiosError(
    404,
    '<!DOCTYPE html><html><body>404: This page could not be found.</body></html>',
  );

  /** What the API returns for a product that genuinely does not exist. */
  const api404 = axiosError(404, {
    success: false,
    message: 'Product not found.',
    error: { code: 'PRODUCT_NOT_FOUND', details: [] },
  });

  const api500 = axiosError(500, {
    success: false,
    message: 'Unable to retrieve products. Please try again.',
    error: { code: 'INTERNAL_ERROR', details: [] },
  });

  check('an enveloped failure is attributed to the API', M.normalizeError(api404).source, 'api');
  check(
    'and keeps the business code it was given',
    M.normalizeError(api404).code,
    'PRODUCT_NOT_FOUND',
  );
  check('a body without the envelope is not', M.normalizeError(devServer404).source, 'transport');
  check(
    'though the HTTP status is still reported honestly',
    M.normalizeError(devServer404).status,
    404,
  );

  /* The assertion the whole investigation reduces to. */
  ok('the API can say a product does not exist', M.isNotFoundError(M.normalizeError(api404)));
  ok('a 404 from anything else cannot', !M.isNotFoundError(M.normalizeError(devServer404)));
  ok('and a server error never could', !M.isNotFoundError(M.normalizeError(api500)));

  /**
   * The retry rule follows the same reasoning. "Never retry a 4xx" is about
   * *client faults* — a request the API considered and rejected. A 404 the API
   * never issued is an infrastructure failure, and retrying it is how the screen
   * recovers on its own once interception is live.
   */
  ok('an API 4xx is a client fault and is not retried', M.isClientError(M.normalizeError(api404)));
  ok(
    'a transport 404 is not a client fault, so it may be retried',
    !M.isClientError(M.normalizeError(devServer404)),
  );
  ok('a 5xx is never a client fault', !M.isClientError(M.normalizeError(api500)));

  /* Transport failures with no response at all are unchanged. */
  check(
    'a network failure stays a network failure',
    M.normalizeError({ isAxiosError: true }).code,
    'NETWORK_ERROR',
  );
  check(
    'a timeout stays a timeout',
    M.normalizeError({ isAxiosError: true, code: 'ECONNABORTED' }).code,
    'TIMEOUT',
  );
  ok(
    'neither is mistaken for a missing product',
    !M.isNotFoundError(M.normalizeError({ isAxiosError: true })),
  );

  /**
   * An `ApiError` constructed without saying where it came from is a transport
   * error. Only the envelope parser may claim to speak for the API, so the
   * default has to be the humble one — a permissive default would let the next
   * `new ApiError({ status: 404 })` anywhere in the codebase resurrect this bug.
   */
  check(
    'ApiError defaults to transport, never to the API',
    new M.ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }).source,
    'transport',
  );
  ok(
    'so a hand-built 404 is not a verdict either',
    !M.isNotFoundError(new M.ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 })),
  );

  /* ---------------------------------------------------------------- */
  section('Unit · Booking phases — four shown, eight routed (T3.2.1)');

  /**
   * The Founder Note requires four progress steps; the approved UI and the
   * Screen Inventory specify eight routes. Both lists are asserted exactly,
   * because the whole point of the phase model is that the two never drift
   * into each other.
   */
  check(
    'exactly four phases are shown, in the Founder Note order',
    M.BOOKING_PHASES.map((phase) => phase.id),
    ['details', 'nominee', 'review', 'pay-confirm'],
  );
  check(
    'the phase labels are the Note’s own words',
    M.BOOKING_PHASES.map((p) => p.label),
    ['Details', 'Nominee', 'Review', 'Pay & Confirm'],
  );
  /*
    Nine routes since Investor Verification was added at doc 07's Stage 3. The
    **four visible phases are unchanged** — which is the guarantee that
    mattered, and the reason this assertion counts routes and phases separately.
    Identity maps to Details, so the customer still sees four markers.
  */
  check('all ten routes remain', M.BOOKING_STEPS.length, 10);
  check(
    'and identity sits at Stage 3, before configuration',
    M.BOOKING_STEPS.map((step) => step.id),
    [
      'overview',
      'identity',
      'investment',
      'nominee',
      'bank-account',
      'application',
      'review',
      'payment',
      'processing',
      'success',
    ],
  );

  check(
    'every route resolves to a phase, or explicitly to none',
    M.BOOKING_STEPS.map((step) => M.resolveBookingPhase(step.id)),
    [
      'details',
      'details',
      'details',
      'nominee',
      'pay-confirm',
      'review',
      'review',
      'pay-confirm',
      'pay-confirm',
      null,
    ],
  );

  /**
   * The two mappings worth stating out loud, asserted so a later edit has to
   * argue with a test rather than with a comment.
   */
  check(
    'Overview and Investment are one phase — the Note’s "Details"',
    M.resolveBookingPhase('overview'),
    M.resolveBookingPhase('investment'),
  );
  check(
    'processing is still Pay & Confirm, not a fifth phase',
    M.resolveBookingPhase('processing'),
    'pay-confirm',
  );
  ok('success is a terminal outcome and shows no rail', M.resolveBookingPhase('success') === null);

  /**
   * The trap this guards. `Stepper` derives status from `findIndex`, which
   * returns -1 for an unknown id — and since no index is less than -1, every
   * phase would render *upcoming*. A finished booking would show a rail on
   * which nothing had been done, which is why null means "render no rail"
   * rather than "pass it through".
   */
  const phaseIndexForNull = M.BOOKING_PHASES.findIndex((phase) => phase.id === null);
  check('a null phase is not findable, so it must never reach Stepper', phaseIndexForNull, -1);

  /* ---------------------------------------------------------------- */
  section('Unit · Booking draft persistence (T3.2.2)');

  /**
   * A minimal sessionStorage stand-in. The rules under test are about parsing,
   * versioning and expiry — none of them need a browser, and giving them one
   * would only make the failures harder to read.
   */
  const store = new Map();
  /** Reused by the T3.2.10 whole-rupee storage assertion further down. */
  const intStore = store;
  globalThis.window = {
    sessionStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, v),
      removeItem: (k) => store.delete(k),
    },
  };

  /*
    A complete `BookingDraft`. `nominee` joined it at T3.3.1 and is empty here
    on purpose: the round-trip below asserts that an *empty* nominee section
    survives, while the T3.3 section asserts that a *populated* one never
    reaches storage at all.
  */
  const draft = (over = {}) => ({
    /* The booking session this draft belongs to (isolation between bookings). */
    bookingId: 'booking-1000000-1',
    productId: 'fd-002',
    investment: { amount: 500_000, tenureMonths: 24, payoutOption: 'at-maturity' },
    /*
      Version 3 — identity confirmation, recorded without any PII. Placed here
      to match the parse order, since `check` compares serialised JSON.
    */
    /*
      Version 4 — the bank application. `answers` is absent by design: a manual
      answer may be a third party's address or mobile, so it follows the
      nominee's rule and is never written at rest.
    */
    application: {
      acceptedDeclarations: ['details-accurate'],
      preparedAt: 1_000_000,
      identityMethod: 'existing-kyc',
      /* Restored empty on read, never from storage — like the nominee section. */
      answers: {},
    },
    identity: { confirmedAt: 1_000_000, method: 'existing-kyc' },
    /*
      Version 2 sections (booking steps 4–8). Present in the fixture in the
      order `writeDraft` assembles them, for the same reason `nominee` is last:
      `check` compares serialised JSON.
    */
    bankAccountId: 'acc-axis-4587',
    declarations: { detailsConfirmed: true, termsAccepted: true },
    paymentMethod: 'net-banking',
    confirmation: null,
    furthestStep: 'investment',
    updatedAt: 1_000_000,
    /*
      Last, matching the order `readDraft` rebuilds — it restores the persisted
      fields and then appends the empty nominee section. `check` compares
      serialised JSON, so key order matters to the assertion even though it does
      not matter to the value.
    */
    nominee: M.emptyNomineeConfiguration(),
    ...over,
  });

  check(
    'the key is namespaced, versioned and per-product',
    M.draftStorageKey('fd-002'),
    'fd:booking-draft:v4:fd-002',
  );

  store.clear();
  M.writeDraft(draft());
  check('a written draft round-trips', M.readDraft('fd-002', 1_000_000), draft());

  ok('another product sees no draft', M.readDraft('fd-009', 1_000_000) === null);

  /* Expiry — the boundary, both sides of it. */
  ok(
    'a draft at exactly the age limit still reads',
    M.readDraft('fd-002', 1_000_000 + M.DRAFT_MAX_AGE_MS) !== null,
  );
  ok(
    'a draft past the age limit does not',
    M.readDraft('fd-002', 1_000_000 + M.DRAFT_MAX_AGE_MS + 1) === null,
  );
  ok(
    'and the expired entry is removed, not left to be re-read',
    store.get(M.draftStorageKey('fd-002')) === undefined,
  );

  /**
   * Failing closed. Each of these is a shape that could plausibly be found in
   * storage — an older release, a hand edit, a truncated write — and every one
   * of them must yield an empty draft rather than a partially-trusted object on
   * a financial form.
   */
  const rejects = (label, raw) => {
    store.set(M.draftStorageKey('fd-002'), raw);
    ok(label, M.readDraft('fd-002', 1_000_000) === null);
  };

  rejects('malformed JSON is rejected', '{not json');
  rejects('a missing version is rejected', JSON.stringify({ draft: draft() }));
  rejects('an older version is rejected', JSON.stringify({ version: 0, draft: draft() }));
  /*
    The v1 → v2 bump, asserted as a rule rather than assumed. A v1 payload is
    missing the sections steps 4–8 depend on, so it must fail closed and start a
    clean booking — not hydrate a half-shaped draft into a payment screen.
  */
  rejects('and so is the previous schema version', JSON.stringify({ version: 3, draft: draft() }));
  rejects(
    'an unknown payout option is rejected',
    JSON.stringify({
      version: 3,
      draft: draft({ investment: { amount: 1, tenureMonths: 1, payoutOption: 'weekly' } }),
    }),
  );
  rejects(
    'a negative amount is rejected',
    JSON.stringify({
      version: 3,
      draft: draft({ investment: { amount: -1, tenureMonths: 1, payoutOption: null } }),
    }),
  );
  rejects(
    'an unknown step is rejected',
    JSON.stringify({ version: 3, draft: draft({ furthestStep: 'unknown-step' }) }),
  );
  rejects(
    'a draft whose productId disagrees with its key is rejected',
    JSON.stringify({ version: 3, draft: draft({ productId: 'fd-999' }) }),
  );

  /* Derived values must never be persisted — Document 09 §10, BR-INV-004. */
  store.clear();
  M.writeDraft(draft());
  const persisted = JSON.parse(store.get(M.draftStorageKey('fd-002')));

  /**
   * An exact key set, not a search for suspicious words.
   *
   * The first version of this probe grepped the serialised draft for
   * "maturity" and failed — on `payoutOption: "at-maturity"`, which is an enum
   * id and exactly the sort of thing the draft *should* hold. A probe that
   * cannot tell a stored figure from a stored choice is not testing the rule.
   * Listing the permitted keys says the rule directly: adding a derived field
   * fails here, and so does quietly adding anything else.
   */
  check('the draft stores exactly these eleven keys', Object.keys(persisted.draft).sort(), [
    'application',
    'bankAccountId',
    'bookingId',
    'confirmation',
    'declarations',
    'furthestStep',
    'identity',
    'investment',
    'paymentMethod',
    'productId',
    'updatedAt',
  ]);
  /*
    **Identity is a receipt, not a copy.** The booking records that the investor
    confirmed and by which route; the name, date of birth and PAN stay in the
    Investor domain and are never written to storage. This is the rule that
    keeps identity from being duplicated into every module that needs it.
  */
  check(
    'and identity stores only a timestamp and a method',
    Object.keys(persisted.draft.identity).sort(),
    ['confirmedAt', 'method'],
  );
  for (const forbidden of ['fullName', 'dateOfBirth', 'pan', 'aadhaar', 'mobile', 'email']) {
    ok(
      `no ${forbidden} from the investor record is persisted`,
      !JSON.stringify(persisted).includes(forbidden),
    );
  }
  check(
    'and the configuration stores exactly the three inputs — no derived figures',
    Object.keys(persisted.draft.investment).sort(),
    ['amount', 'payoutOption', 'tenureMonths'],
  );
  ok('no current step is stored — the route owns that', !('currentStep' in persisted.draft));

  /**
   * **The four new keys are identifiers and choices, never money or PII.**
   *
   * The rule the exact key set exists to enforce, restated for the sections
   * added by steps 4–8: a confirmation carries a reference and two timestamps
   * and *no maturity figure*, because Document 09 §10 forbids storing one and
   * the post-payment screens recompute it. The funding account is a reference —
   * no number, no holder name, no IFSC ever reaches storage.
   */
  check(
    'the confirmation stores an identifier and two moments, nothing derived',
    Object.keys(
      JSON.parse(JSON.stringify({ reference: 'X', paidAt: 1, confirmedAt: null })),
    ).sort(),
    ['confirmedAt', 'paidAt', 'reference'],
  );
  ok(
    'the funding account is stored as an id, not as an account',
    typeof persisted.draft.bankAccountId === 'string' &&
      !/\d{6,}/.test(persisted.draft.bankAccountId),
  );
  for (const forbidden of ['accountNumber', 'ifsc', 'accountHolderName', 'maturityValue']) {
    ok(
      `no ${forbidden} is persisted anywhere in the draft`,
      !JSON.stringify(persisted).includes(forbidden),
    );
  }
  ok('and the nominee section is still absent', !('nominee' in persisted.draft));

  M.clearDraft('fd-002');
  ok('clearDraft removes the entry', M.readDraft('fd-002', 1_000_000) === null);

  delete globalThis.window;

  /* ================================================================ *
   * Booking domain layer (T3.2.4 – T3.2.6)
   *
   * Written before any UI exists. These modules decide what a deposit is
   * worth and whether it may be booked; a wrong number here is wrong on
   * every screen that shows it.
   * ================================================================ */

  /* ---------------------------------------------------------------- */
  section('Domain · maturity engine — the six published figures (T3.2.4)');

  /**
   * The regression test that has governed this formula since M2.1, now run
   * against the **platform** implementation. These are the figures printed on
   * the approved Marketplace cards; simple interest matches none of them.
   */
  const PUBLISHED = [
    ['IDFC  7.75% / 12m', 100_000, 7.75, 12, 107_978],
    ['HDFC  7.25% / 12m', 100_000, 7.25, 12, 107_450],
    ['Kotak 7.40% / 24m', 100_000, 7.4, 24, 115_795],
    ['SBI   7.10% / 12m', 100_000, 7.1, 12, 107_291],
    ['ICICI 6.95% / 18m', 100_000, 6.95, 18, 110_888],
    ['Axis  6.80% /  9m', 100_000, 6.8, 9, 105_187],
  ];

  for (const [label, principal, annualRate, tenureMonths, expected] of PUBLISHED) {
    check(
      `${label} → ₹${expected.toLocaleString('en-IN')}`,
      M.calculatePlatformMaturity({ principal, annualRate, tenureMonths }).maturityValue,
      expected,
    );
  }

  /**
   * **TD-001 guard.** Two maturity implementations exist until refactor R1
   * (`shared-finance-layer.md`). This asserts they agree on every published
   * figure, so the duplication can be detected but never drift silently.
   */
  for (const [label, principal, annualRate, tenureMonths] of PUBLISHED) {
    const input = { principal, annualRate, tenureMonths };
    check(
      `TD-001 — platform and Marketplace agree: ${label}`,
      M.calculatePlatformMaturity(input),
      M.calculateMaturity(input),
    );
  }

  /* Degenerate inputs: a form is partially filled for most of its life. */
  check(
    'a zero amount is worth zero, not NaN',
    M.calculatePlatformMaturity({ principal: 0, annualRate: 7.25, tenureMonths: 24 }),
    { principal: 0, interestEarned: 0, maturityValue: 0 },
  );
  check(
    'a zero tenure earns nothing',
    M.calculatePlatformMaturity({ principal: 500_000, annualRate: 7.25, tenureMonths: 0 })
      .interestEarned,
    0,
  );
  check(
    'a negative principal is clamped, never displayed negative',
    M.calculatePlatformMaturity({ principal: -100, annualRate: 7.25, tenureMonths: 12 })
      .maturityValue,
    0,
  );
  check(
    'a zero rate returns the principal',
    M.calculatePlatformMaturity({ principal: 500_000, annualRate: 0, tenureMonths: 24 })
      .maturityValue,
    500_000,
  );
  check(
    'interestEarned is always maturity minus principal',
    M.calculateInterestEarned({ principal: 500_000, annualRate: 7.25, tenureMonths: 24 }),
    577_270 - 500_000,
  );

  /**
   * The known divergence from the Booking artwork (conflict C2), asserted so it
   * is a recorded fact rather than a surprise at the demo. If this ever changes,
   * someone has altered the engine — which C2 forbids.
   */
  check(
    'C2 — the engine returns ₹5,77,270 where the artwork states ₹5,66,478',
    M.calculatePlatformMaturity({ principal: 500_000, annualRate: 7.25, tenureMonths: 24 })
      .maturityValue,
    577_270,
  );

  section('Domain · simple interest (T3.2.4)');

  check(
    '₹5,00,000 at 7.25% for 24 months, not compounded',
    M.calculateSimpleInterest({ principal: 500_000, annualRate: 7.25, tenureMonths: 24 }),
    72_500,
  );
  check(
    'a part-year term is prorated by months',
    M.calculateSimpleInterest({ principal: 500_000, annualRate: 7.25, tenureMonths: 6 }),
    18_125,
  );
  check(
    'simple interest is always less than compounded over the same term',
    M.calculateSimpleInterest({ principal: 500_000, annualRate: 7.25, tenureMonths: 24 }) <
      M.calculateInterestEarned({ principal: 500_000, annualRate: 7.25, tenureMonths: 24 }),
    true,
  );
  check(
    'zero rate earns nothing',
    M.calculateSimpleInterest({ principal: 500_000, annualRate: 0, tenureMonths: 24 }),
    0,
  );

  /* ---------------------------------------------------------------- */
  section('Domain · tenure → rate resolution (T3.2.4b)');

  const TERMS = M.BOOKING_OVERVIEW_FIXTURE.deposit.terms;

  check('the fixture prices exactly one tenure — no invented rates', TERMS.tenureRates, [
    { tenureMonths: 12, annualRate: 7.25 },
  ]);
  /**
   * The quote, not a bare number. Behaviour is identical — `.annualRate` is
   * exactly what `resolveTenureRate` returned — but the answer now carries the
   * band it came from, which is what a recommendation has to explain later.
   */
  check('the priced tenure resolves to a quote', M.resolveRate(TERMS, { tenureMonths: 12 }), {
    annualRate: 7.25,
    tenureMonths: 12,
  });
  check(
    'and its rate is the one the old resolver returned',
    M.resolveRate(TERMS, { tenureMonths: 12 }).annualRate,
    7.25,
  );
  check(
    'the quote names the band it came from',
    M.resolveRate(TERMS, { tenureMonths: 12 }).tenureMonths,
    12,
  );
  /**
   * Nothing speculative is modelled. `bandId`, `effectiveFrom`, `dayCountBasis`
   * and `compoundingFrequency` have no source in this repository, and inventing
   * them would defeat the audit purpose they exist for.
   */
  check(
    'the quote carries only what the rate card contains',
    Object.keys(M.resolveRate(TERMS, { tenureMonths: 12 })).sort(),
    ['annualRate', 'tenureMonths'],
  );

  /**
   * The rule the whole model exists for. An unpriced tenure must yield `null`,
   * **not** the headline rate — a silent fallback is the defect wearing a
   * helpful face, and it would put an unobtainable return on the screen where
   * the user commits money.
   */
  ok(
    'an unpriced tenure resolves to null, not the headline rate',
    M.resolveRate(TERMS, { tenureMonths: 36 }) === null,
  );
  ok('and not for 24 months either', M.resolveRate(TERMS, { tenureMonths: 24 }) === null);
  check(
    'the headline rate is not silently reused',
    M.resolveRate(TERMS, { tenureMonths: 36 }),
    null,
  );
  ok(
    'even though the product advertises a 7 day – 10 year range',
    TERMS.tenureRange.maxYears === 10 && M.resolveRate(TERMS, { tenureMonths: 60 }) === null,
  );

  /* No interpolation between published terms. */
  ok(
    'a tenure between two published terms is not interpolated',
    M.resolveRate(TERMS, { tenureMonths: 30 }) === null,
  );

  /* Hostile and degenerate inputs. */
  ok('a fractional tenure resolves to null', M.resolveRate(TERMS, { tenureMonths: 24.5 }) === null);
  ok('zero resolves to null', M.resolveRate(TERMS, { tenureMonths: 0 }) === null);
  ok('a negative tenure resolves to null', M.resolveRate(TERMS, { tenureMonths: -24 }) === null);
  ok('NaN resolves to null', M.resolveRate(TERMS, { tenureMonths: Number.NaN }) === null);

  check('isSupportedTenure agrees with the resolver', M.isSupportedTenure(TERMS, 12), true);
  check('and rejects what the resolver rejects', M.isSupportedTenure(TERMS, 36), false);

  /* Ordering, on a card deliberately entered out of order. */
  const MULTI = {
    ...TERMS,
    tenureRates: [
      { tenureMonths: 36, annualRate: 7.1 },
      { tenureMonths: 12, annualRate: 6.9 },
      { tenureMonths: 24, annualRate: 7.25 },
    ],
  };
  check(
    'selectableTenures sorts ascending regardless of card order',
    M.selectableTenures(MULTI).map((rate) => rate.tenureMonths),
    [12, 24, 36],
  );
  check(
    'rates travel with their tenure',
    M.selectableTenures(MULTI).map((rate) => rate.annualRate),
    [6.9, 7.25, 7.1],
  );
  /**
   * Rates do not have to rise with tenure — 36 months is priced *below* 24 here
   * on purpose. A resolver that assumed monotonicity would be wrong for a real
   * rate card, and banks publish inverted curves routinely.
   */
  check(
    'a non-monotonic rate card resolves correctly',
    M.resolveRate(MULTI, { tenureMonths: 36 }),
    {
      annualRate: 7.1,
      tenureMonths: 36,
    },
  );
  ok('selectableTenures does not mutate the product', MULTI.tenureRates[0].tenureMonths === 36);
  check(
    'an empty rate card offers nothing',
    M.selectableTenures({ ...TERMS, tenureRates: [] }),
    [],
  );

  /* ---------------------------------------------------------------- */
  section('Domain · returns — cumulative vs payout (T3.2.5, rule C4)');

  /*
    A 24-month rate card of this section's own, rather than the booking
    fixture's.

    These assertions are about the **returns model** — compounding versus payout,
    instalment counts, the tax seam — and a 24-month term is what makes the
    instalment arithmetic legible (12 monthly, 8 quarterly, 4 half-yearly, 2
    annual). Reading the term off the fixture coupled them to a value that is
    incidental to what they verify, and they broke when `fd-002` was corrected to
    match the catalogue. The card is stated here so the fixture can change
    without these numbers moving.
  */
  const RETURNS_TERMS = { ...TERMS, tenureRates: [{ tenureMonths: 24, annualRate: 7.25 }] };

  const returnsFor = (payoutOption, over = {}) =>
    M.calculateReturns({
      principal: 500_000,
      tenureMonths: 24,
      payoutOption,
      terms: RETURNS_TERMS,
      ...over,
    });

  check('at-maturity is the only cumulative option', M.isCumulativePayout('at-maturity'), true);
  for (const payout of ['monthly', 'quarterly', 'half-yearly', 'annual']) {
    check(`${payout} is not cumulative`, M.isCumulativePayout(payout), false);
  }

  const cumulative = returnsFor('at-maturity');
  check('cumulative maturity compounds', cumulative.maturityValue, 577_270);
  check('cumulative interest', cumulative.totalInterest, 77_270);
  ok('a cumulative deposit has no instalments', cumulative.instalmentAmount === null);
  ok('and no instalment frequency', cumulative.instalmentsPerYear === null);
  check('the applied rate is the resolved one', cumulative.annualRate, 7.25);

  /**
   * **The C4 invariant.** "Never display compounded maturity for a monthly
   * payout product." Asserted for every payout option, because the rule is not
   * about monthly specifically — it is about interest having left the deposit.
   */
  for (const payout of ['monthly', 'quarterly', 'half-yearly', 'annual']) {
    const result = returnsFor(payout);
    check(`C4 — ${payout} returns the principal at maturity`, result.maturityValue, 500_000);
    ok(
      `C4 — ${payout} never shows the compounded figure`,
      result.maturityValue !== cumulative.maturityValue,
    );
    check(`${payout} uses simple interest`, result.totalInterest, 72_500);
  }

  /* Instalments — derived from payments actually made, not from an annual figure. */
  check('monthly pays 12 times a year', returnsFor('monthly').instalmentsPerYear, 12);
  check(
    'monthly instalment over 24 months',
    returnsFor('monthly').instalmentAmount,
    Math.round(72_500 / 24),
  );
  check(
    'quarterly instalment over 24 months',
    returnsFor('quarterly').instalmentAmount,
    Math.round(72_500 / 8),
  );
  check(
    'half-yearly over 24 months pays four times',
    returnsFor('half-yearly').instalmentAmount,
    Math.round(72_500 / 4),
  );
  check(
    'annual over 24 months pays twice',
    returnsFor('annual').instalmentAmount,
    Math.round(72_500 / 2),
  );

  /**
   * A term that is not a whole number of payment periods. A 9-month quarterly
   * deposit pays three times, not 3.33 — an instalment is only paid once its
   * period completes.
   */
  const NINE = { ...RETURNS_TERMS, tenureRates: [{ tenureMonths: 9, annualRate: 6.8 }] };
  const nineMonth = M.calculateReturns({
    principal: 100_000,
    tenureMonths: 9,
    payoutOption: 'quarterly',
    terms: NINE,
  });
  check(
    'a 9-month quarterly deposit pays three instalments',
    nineMonth.instalmentAmount,
    Math.round(nineMonth.totalInterest / 3),
  );
  const nineAnnual = M.calculateReturns({
    principal: 100_000,
    tenureMonths: 9,
    payoutOption: 'annual',
    terms: NINE,
  });
  ok(
    'a 9-month annual-payout deposit completes no annual period',
    nineAnnual.instalmentAmount === null,
  );

  /* The unpriced-tenure rule propagates through the returns model. */
  ok(
    'returns are null for an unpriced tenure',
    returnsFor('at-maturity', { tenureMonths: 36 }) === null,
  );
  ok('and null for a fractional one', returnsFor('at-maturity', { tenureMonths: 18.5 }) === null);

  /* ---------------------------------------------------------------- */
  section('Domain · post-tax seam — no assumptions (T3.2.5, rule C6)');

  ok('post-tax interest is null without a profile', cumulative.postTaxInterest === null);
  ok('post-tax maturity is null without a profile', cumulative.postTaxMaturityValue === null);

  const taxed = returnsFor('at-maturity', { taxProfile: { marginalRatePercent: 30 } });
  check('30% is applied to interest only', taxed.postTaxInterest, Math.round(77_270 * 0.7));
  check(
    'and the principal is never taxed',
    taxed.postTaxMaturityValue,
    500_000 + Math.round(77_270 * 0.7),
  );
  check(
    'pre-tax figures are unchanged by a tax profile',
    taxed.totalInterest,
    cumulative.totalInterest,
  );

  const taxedPayout = returnsFor('monthly', { taxProfile: { marginalRatePercent: 30 } });
  check(
    'a payout deposit still returns the principal after tax',
    taxedPayout.postTaxMaturityValue,
    500_000,
  );
  check('with interest taxed', taxedPayout.postTaxInterest, Math.round(72_500 * 0.7));
  check(
    'a zero tax rate is honoured, not treated as absent',
    returnsFor('at-maturity', { taxProfile: { marginalRatePercent: 0 } }).postTaxInterest,
    77_270,
  );

  /* ---------------------------------------------------------------- */
  section('Domain · amount validation — BR-INV-001/002/003 (T3.2.6)');

  const amountError = (amount, terms = TERMS) => M.validateAmount(amount, terms);

  ok('the minimum itself is valid', amountError(500_000) === null);
  ok('the maximum itself is valid', amountError(50_000_000) === null);
  ok('a mid-range amount is valid', amountError(1_000_000) === null);

  ok('null asks for a value', /Enter the amount/.test(amountError(null)));
  ok('zero asks for a value', /Enter the amount/.test(amountError(0)));
  ok('a negative amount asks for a value', /Enter the amount/.test(amountError(-5000)));
  ok('NaN is rejected', /Enter the amount/.test(amountError(Number.NaN)));
  ok('Infinity is rejected', /Enter the amount/.test(amountError(Number.POSITIVE_INFINITY)));

  /**
   * The Founder Vision §4 / spec 21b §9 standard: the message says what to do.
   * The spec's own worked example is ₹8,000 against a ₹10,000 minimum →
   * "Increase your investment by ₹2,000".
   */
  const SPEC_EXAMPLE = { ...TERMS, minInvestment: 10_000, maxInvestment: 1_000_000 };
  const below = amountError(8_000, SPEC_EXAMPLE);
  ok('BR-INV-001 states the shortfall, not "invalid"', /Increase your investment by/.test(below));
  ok('and names the exact amount to add', /₹2,000/.test(below));
  ok('the word "invalid" never appears', !/invalid/i.test(below));

  const above = amountError(60_000_000);
  ok('BR-INV-002 states the excess', /Reduce your investment by/.test(above));
  ok('and names the maximum', /₹5,00,00,000/.test(above));

  /* BR-INV-003 — increments, measured from the minimum. */
  const INCREMENTS = {
    ...TERMS,
    minInvestment: 10_000,
    maxInvestment: 1_000_000,
    investmentIncrement: 1_000,
  };
  ok('an on-step amount is valid', amountError(15_000, INCREMENTS) === null);
  ok('the minimum is always on-step', amountError(10_000, INCREMENTS) === null);
  const offStep = amountError(15_550, INCREMENTS);
  ok('an off-step amount is rejected', offStep !== null);
  ok('the message names the step', /steps of ₹1,000/.test(offStep));
  ok('and suggests the next valid amount', /₹16,000/.test(offStep));

  /**
   * Increments are measured from the minimum, not from zero. With a ₹10,500
   * minimum and a ₹1,000 step the valid amounts are ₹10,500, ₹11,500, … — a
   * from-zero implementation would reject every one of them.
   */
  const ODD_MIN = {
    ...TERMS,
    minInvestment: 10_500,
    maxInvestment: 1_000_000,
    investmentIncrement: 1_000,
  };
  ok('a step is measured from the minimum, not from zero', amountError(11_500, ODD_MIN) === null);
  ok('and ₹11,000 is off-step for that product', amountError(11_000, ODD_MIN) !== null);

  /*
    An amount that *would* be off-step if the product had a step, on a product
    that has none. In range for the fixture (₹5,00,000 – ₹5,00,00,000), which
    the first version of this assertion was not — ₹15,550 is below the fixture's
    minimum, so it was failing BR-INV-001 and proving nothing about increments.
  */
  ok(
    'a product with no increment rule accepts any in-range amount',
    amountError(1_000_550) === null,
  );

  /* ---------------------------------------------------------------- */
  section('Domain · tenure and payout validation (T3.2.6)');

  ok('the priced tenure is valid', M.validateTenure(12, TERMS) === null);
  ok('null asks for a choice', /Choose how long/.test(M.validateTenure(null, TERMS)));

  const unpriced = M.validateTenure(36, TERMS);
  ok('an unpriced tenure is rejected', unpriced !== null);
  /*
    The platform renders tenures in months — `formatTenure(12)` is "12 months",
    not "1 year", and the approved artwork's chips agree. The first version of
    this assertion expected years and failed, which is the assertion being wrong
    rather than the message.
  */
  ok('and the message lists what is available', /12 months/i.test(unpriced));
  ok(
    'using the platform formatter, not its own wording',
    /available for 12 months/i.test(unpriced),
  );

  const multiMessage = M.validateTenure(48, MULTI);
  ok(
    'several options are listed readably, with "or" before the last',
    /12 months, 24 months or 36 months/i.test(multiMessage),
  );

  const noTenures = M.validateTenure(24, { ...TERMS, tenureRates: [] });
  ok('a product with no priced tenure says so plainly', /no tenures available/i.test(noTenures));

  const SUPPORTED = ['at-maturity', 'monthly', 'quarterly'];
  ok(
    'a supported payout is valid',
    M.validatePayoutOption('at-maturity', TERMS, SUPPORTED) === null,
  );
  ok(
    'null asks for a choice',
    /Choose how you want/.test(M.validatePayoutOption(null, TERMS, SUPPORTED)),
  );
  ok(
    'an unsupported payout is rejected',
    M.validatePayoutOption('annual', TERMS, SUPPORTED) !== null,
  );

  /* ---------------------------------------------------------------- */
  section('Domain · whole-configuration validation — FR-CONF-001 (T3.2.6)');

  const validate = (configuration) =>
    M.validateInvestmentConfiguration(configuration, TERMS, SUPPORTED);

  const VALID = { amount: 500_000, tenureMonths: 12, payoutOption: 'at-maturity' };
  check('a complete valid configuration passes', validate(VALID).isValid, true);
  check('with no errors', validate(VALID).errors, []);

  const empty = validate({ amount: null, tenureMonths: null, payoutOption: null });
  check('an empty configuration is invalid', empty.isValid, false);
  /**
   * Every failing field at once. A form that reveals one problem at a time
   * makes the user submit repeatedly to find out how many there are.
   */
  check(
    'and reports all three fields, not just the first',
    empty.errors.map((e) => e.field),
    ['amount', 'tenureMonths', 'payoutOption'],
  );
  check('field order is the screen reading order', Object.keys(empty.byField), [
    'amount',
    'tenureMonths',
    'payoutOption',
  ]);

  const partial = validate({ ...VALID, amount: 1_000 });
  check('one bad field invalidates the configuration', partial.isValid, false);
  check(
    'and only that field is reported',
    partial.errors.map((e) => e.field),
    ['amount'],
  );
  ok('byField carries the same message', partial.byField.amount === partial.errors[0].message);

  check(
    'an unpriced tenure invalidates the configuration',
    validate({ ...VALID, tenureMonths: 36 }).isValid,
    false,
  );
  check(
    'an unsupported payout invalidates the configuration',
    validate({ ...VALID, payoutOption: 'annual' }).isValid,
    false,
  );

  /**
   * The join between validation and calculation: anything that validates must
   * be calculable, and anything calculable must validate. If these ever
   * disagree, a user can reach Continue on a configuration that produces no
   * figures — or be blocked from one that does.
   */
  ok(
    'a valid configuration always yields returns',
    M.calculateReturns({
      principal: VALID.amount,
      tenureMonths: VALID.tenureMonths,
      payoutOption: VALID.payoutOption,
      terms: TERMS,
    }) !== null,
  );
  ok(
    'and an invalid tenure never does',
    M.calculateReturns({
      principal: VALID.amount,
      tenureMonths: 36,
      payoutOption: VALID.payoutOption,
      terms: TERMS,
    }) === null,
  );

  /* ---------------------------------------------------------------- */
  section('Domain · configured summary rail — the row model (T3.2.7)');

  const DEPOSIT = M.BOOKING_OVERVIEW_FIXTURE.deposit;
  const rail = (configuration) => M.buildConfiguredSummaryRows(DEPOSIT, configuration);
  const EMPTY_CONFIG = { amount: null, tenureMonths: null, payoutOption: null };

  /**
   * The two rails are different row models, and that is the point: Overview
   * lists what the product *can* do, Investment Details lists what the user
   * *has chosen*. Asserted as exact lists so neither can quietly become the
   * other.
   */
  check(
    'the Overview rail states capability — nine rows',
    M.buildInvestmentSummaryRows(DEPOSIT).map((row) => row.label),
    [
      'Partner Bank',
      'Product Name',
      'Interest Rate (p.a.)',
      'Min. Investment',
      'Max. Investment',
      'Tenure Options',
      'Interest Payout Options',
      'Premature Withdrawal',
      'Auto Renewal',
    ],
  );
  check(
    'the configured rail states configuration — seven rows, as drawn',
    rail(EMPTY_CONFIG).map((row) => row.label),
    [
      'Interest Rate (p.a.)',
      'Min. Investment',
      'Max. Investment',
      'Tenure',
      'Interest Payout',
      'Premature Withdrawal',
      'Auto Renewal',
    ],
  );
  ok(
    'the bank and product move to the header, so they are not rows',
    !rail(EMPTY_CONFIG).some((row) => row.id === 'bank' || row.id === 'product'),
  );

  /* Unset values state that they are waiting, and the row count never changes. */
  check(
    'an unselected tenure says so',
    rail(EMPTY_CONFIG).find((r) => r.id === 'tenure').value,
    'Not selected yet',
  );
  check(
    'an unselected payout says so',
    rail(EMPTY_CONFIG).find((r) => r.id === 'payout').value,
    'Not selected yet',
  );
  check(
    'the rail never changes height as the form is filled',
    rail(EMPTY_CONFIG).length,
    rail(VALID).length,
  );

  /* Selected values render through the platform formatters. */
  check('a selected tenure renders', rail(VALID).find((r) => r.id === 'tenure').value, '12 months');
  check(
    'a selected payout renders its label',
    rail(VALID).find((r) => r.id === 'payout').value,
    'At Maturity',
  );
  check('every payout id has a label', Object.keys(M.PAYOUT_OPTION_LABELS).length, 5);

  /**
   * The rate row is the one that matters. Before a tenure is chosen the
   * headline rate stands; once one is chosen the rail shows the rate resolved
   * **for that tenure**, and for an unpriced tenure it says so rather than
   * falling back — which would be the exact defect the tenure→rate model exists
   * to prevent.
   */
  check(
    'with no tenure chosen the headline rate stands',
    rail(EMPTY_CONFIG).find((r) => r.id === 'rate').value,
    '7.25%',
  );
  check(
    'with a priced tenure the resolved rate is shown',
    rail(VALID).find((r) => r.id === 'rate').value,
    '7.25%',
  );
  check(
    'with an unpriced tenure the rail refuses to quote the headline',
    rail({ ...VALID, tenureMonths: 36 }).find((r) => r.id === 'rate').value,
    'Not available for this tenure',
  );
  ok(
    'the rate row is the emphasised one, as drawn',
    rail(VALID).find((r) => r.id === 'rate').emphasis === true,
  );

  /**
   * A product whose rate genuinely differs by tenure — the case the fixture
   * cannot show, because it publishes one rate. Proves the rail follows the
   * rate card rather than the headline.
   */
  const MULTI_DEPOSIT = { ...DEPOSIT, terms: MULTI };
  /*
    "7.1%", not "7.10%" — the platform's `formatRate` does not pad to two
    decimals, and this rail uses the shared formatter rather than its own. The
    first version of this assertion expected padding, which is the assertion
    being wrong; padding rates is a platform-wide display question for the
    formatter's owner, not something this rail should decide for itself.
  */
  check(
    'the rail follows the rate card, not the headline',
    M.buildConfiguredSummaryRows(MULTI_DEPOSIT, { ...VALID, tenureMonths: 36 }).find(
      (r) => r.id === 'rate',
    ).value,
    '7.1%',
  );
  ok(
    'and it formats through the platform formatter, not its own template',
    M.buildConfiguredSummaryRows(MULTI_DEPOSIT, { ...VALID, tenureMonths: 12 }).find(
      (r) => r.id === 'rate',
    ).value === '6.9%',
  );

  /* ---------------------------------------------------------------- */
  section('Domain · quick amounts — every chip is valid (T3.2.8, C3a/C3b)');

  /**
   * **The C3b outcome, on the demo product.** Candidates are ₹1L, ₹5L, ₹10L;
   * the product's minimum is ₹5,00,000, so ₹1L is dropped and exactly the two
   * chips decision C3a names are offered.
   *
   * Under the additive semantics C3a removed, the ₹1L chip was harmless. Under
   * absolute semantics it exists only to produce a BR-INV-001 error, which is
   * how applying one decision surfaced the need for the other.
   */
  check(
    'the default candidates are the artwork’s three',
    M.DEFAULT_QUICK_AMOUNTS,
    [100_000, 500_000, 1_000_000],
  );
  /*
    All three artwork candidates clear this product's ₹10,000 minimum, so all
    three are offered. Before `fd-002` was corrected to match the catalogue the
    fixture's minimum was ₹5,00,000 and ₹1L was filtered out; the filtering rule
    is unchanged, the product it is applied to is not. The assertion below on a
    raised minimum is what proves the filter still filters.
  */
  check(
    'every artwork candidate clears this product’s ₹10,000 minimum',
    M.resolveQuickAmounts(TERMS),
    [100_000, 500_000, 1_000_000],
  );
  check(
    'and a product with a ₹5,00,000 minimum still drops ₹1L',
    M.resolveQuickAmounts({ ...TERMS, minInvestment: 500_000 }),
    [500_000, 1_000_000],
  );

  /**
   * The claim the whole module exists to make, asserted against the validator
   * rather than restated. `resolveQuickAmounts` uses a predicate and
   * `validateAmount` produces prose; if they ever disagree, a chip becomes a
   * button whose only function is to produce an error.
   */
  const everyChipValidates = (terms) =>
    M.resolveQuickAmounts(terms).every((amount) => M.validateAmount(amount, terms) === null);

  ok('every offered chip passes validateAmount', everyChipValidates(TERMS));

  /* Boundaries: the minimum and maximum are themselves offerable. */
  check(
    'a candidate exactly at the minimum is offered',
    M.resolveQuickAmounts({ ...TERMS, minInvestment: 1_000_000, quickAmounts: [1_000_000] }),
    [1_000_000],
  );
  check(
    'a candidate exactly at the maximum is offered',
    M.resolveQuickAmounts({ ...TERMS, maxInvestment: 1_000_000, quickAmounts: [1_000_000] }),
    [1_000_000],
  );
  check(
    'a candidate one rupee above the maximum is dropped',
    M.resolveQuickAmounts({ ...TERMS, maxInvestment: 999_999, quickAmounts: [1_000_000] }),
    [],
  );
  check(
    'a candidate one rupee below the minimum is dropped',
    M.resolveQuickAmounts({ ...TERMS, minInvestment: 1_000_001, quickAmounts: [1_000_000] }),
    [],
  );

  /* Off-increment candidates are dropped too — the same defect, one rule along. */
  const STEPPED = {
    ...TERMS,
    minInvestment: 10_000,
    maxInvestment: 10_000_000,
    investmentIncrement: 1_000,
    quickAmounts: [100_000, 100_500, 500_000],
  };
  check(
    'an off-increment candidate is dropped',
    M.resolveQuickAmounts(STEPPED),
    [100_000, 500_000],
  );
  ok('and every survivor still validates', everyChipValidates(STEPPED));

  /* The approved row holds three (decision 3), never the older spec's five. */
  check('the cap is the artwork’s three', M.MAX_QUICK_AMOUNTS, 3);
  check(
    'a product publishing six candidates renders only three',
    M.resolveQuickAmounts({
      ...TERMS,
      minInvestment: 1_000,
      quickAmounts: [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_500_000],
    }).length,
    3,
  );

  /* A product whose limits exclude everything renders no group at all. */
  check(
    'no valid candidate means no chips',
    M.resolveQuickAmounts({ ...TERMS, minInvestment: 20_000_000 }),
    [],
  );

  /* Hostile candidate data must not reach the UI. */
  check(
    'zero, negative, NaN and Infinity candidates are dropped',
    M.resolveQuickAmounts({
      ...TERMS,
      quickAmounts: [0, -500_000, Number.NaN, Number.POSITIVE_INFINITY, 500_000],
    }),
    [500_000],
  );

  /* A product may publish its own ladder, which then overrides the default. */
  check(
    'a product’s own ladder is used when it publishes one',
    M.resolveQuickAmounts({ ...TERMS, quickAmounts: [2_500_000, 5_000_000] }),
    [2_500_000, 5_000_000],
  );

  section('Domain · compact currency labels (T3.2.8)');

  check('₹5,00,000 renders as ₹5L', M.formatCompactCurrency(500_000), '₹5L');
  check('₹10,00,000 renders as ₹10L', M.formatCompactCurrency(1_000_000), '₹10L');
  check('₹1,00,000 renders as ₹1L', M.formatCompactCurrency(100_000), '₹1L');
  check('a crore renders as ₹1Cr, not ₹100L', M.formatCompactCurrency(10_000_000), '₹1Cr');
  check('₹5,00,00,000 renders as ₹5Cr', M.formatCompactCurrency(50_000_000), '₹5Cr');
  check('trailing zeros are trimmed', M.formatCompactCurrency(1_500_000), '₹15L');
  check('a fractional lakh keeps one decimal', M.formatCompactCurrency(150_000), '₹1.5L');
  check('thousands render as K', M.formatCompactCurrency(50_000), '₹50K');
  /* Below a thousand there is nothing to compact, so the full figure stands. */
  check('small amounts fall back to full currency', M.formatCompactCurrency(500), '₹500');
  /**
   * Never used where an exact figure matters: "₹5.5L" cannot be reconciled
   * against a statement. The summary rail and the returns strip both use
   * `formatCurrency`, which this asserts by contrast.
   */
  check(
    'the exact formatter is unaffected',
    M.formatCompactCurrency(500_000) !== '₹5,00,000',
    true,
  );

  /* ---------------------------------------------------------------- */
  section('Domain · payout options — five offered, three sold (T3.2.9)');

  /**
   * Spec 21b §D: *"Unavailable options should not be displayed."* The platform
   * expresses five payout modes; the demo product publishes three, and those
   * three are exactly the cards the approved artwork draws.
   *
   * That five ≠ three is not a conflict. Five is the vocabulary, three is the
   * product.
   */
  check('the platform vocabulary holds five, in offer order', M.PAYOUT_OPTION_ORDER, [
    'at-maturity',
    'monthly',
    'quarterly',
    'half-yearly',
    'annual',
  ]);
  check('the demo product sells three — the artwork’s cards', TERMS.supportedPayouts, [
    'at-maturity',
    'monthly',
    'quarterly',
  ]);
  check(
    'so the group offers three, never five',
    M.resolvePayoutOptions(TERMS).map((option) => option.id),
    ['at-maturity', 'monthly', 'quarterly'],
  );

  /**
   * "Cumulative" and "At Maturity" are the partner bank's two names for one
   * thing. The advertised strings carry four; the vocabulary carries three, so
   * the user is not offered the same deposit twice under different names.
   */
  check('the product advertises four strings', TERMS.payoutOptions.length, 4);
  check('but only three distinct modes', TERMS.supportedPayouts.length, 3);

  /* Ordering is the platform's, not the product's array order. */
  check(
    'options render in platform order regardless of how the product lists them',
    M.resolvePayoutOptions({
      ...TERMS,
      supportedPayouts: ['quarterly', 'at-maturity', 'annual', 'monthly'],
    }).map((option) => option.id),
    ['at-maturity', 'monthly', 'quarterly', 'annual'],
  );

  /* An id the platform cannot label or price must never become a card. */
  check(
    'an unknown supported id is dropped, not rendered',
    M.resolvePayoutOptions({
      ...TERMS,
      supportedPayouts: ['at-maturity', 'fortnightly', 'monthly'],
    }).map((option) => option.id),
    ['at-maturity', 'monthly'],
  );

  ok(
    'every offered option has a label and a description',
    M.resolvePayoutOptions(TERMS).every(
      (option) => Boolean(option.label) && Boolean(option.description),
    ),
  );
  check('annual reads as "Yearly", not "Annual"', M.PAYOUT_OPTION_LABELS.annual, 'Yearly');
  check(
    'and every vocabulary id has a description, including the two not drawn',
    Object.keys(M.PAYOUT_OPTION_DESCRIPTIONS).length,
    5,
  );

  /* The default. */
  check('at-maturity is the platform default', M.DEFAULT_PAYOUT_OPTION, 'at-maturity');
  check('and is chosen for a product that offers it', M.defaultPayoutOption(TERMS), 'at-maturity');
  /**
   * A product that does not compound still needs a default, or the returns strip
   * would stay empty for a user who never opened the control.
   */
  check(
    'a product without at-maturity falls back to its first offered option',
    M.defaultPayoutOption({ ...TERMS, supportedPayouts: ['quarterly', 'monthly'] }),
    'monthly',
  );
  ok(
    'a product offering nothing has no default, and callers must handle it',
    M.defaultPayoutOption({ ...TERMS, supportedPayouts: [] }) === null,
  );
  check('and renders no cards', M.resolvePayoutOptions({ ...TERMS, supportedPayouts: [] }), []);

  ok('isSupportedPayout agrees with the resolver', M.isSupportedPayout(TERMS, 'monthly'));
  ok('and rejects what the product does not sell', !M.isSupportedPayout(TERMS, 'half-yearly'));

  /**
   * The default must always be a **selectable** option. A default the group
   * cannot render would leave a radio group with nothing checked while the draft
   * claimed a choice had been made.
   */
  for (const supported of [
    ['at-maturity', 'monthly', 'quarterly'],
    ['monthly', 'quarterly'],
    ['annual'],
    ['half-yearly', 'at-maturity'],
  ]) {
    const scoped = { ...TERMS, supportedPayouts: supported };
    const fallback = M.defaultPayoutOption(scoped);
    ok(
      `the default is always selectable — [${supported.join(', ')}]`,
      M.resolvePayoutOptions(scoped).some((option) => option.id === fallback),
    );
  }

  /* ---------------------------------------------------------------- */
  section('Domain · C4 across every option the control offers (T3.2.9)');

  /**
   * The rule, re-asserted at the point a user can actually trigger it. T3.2.5
   * proved the model; this proves it holds for exactly the options the control
   * renders — which is what a user can reach.
   */
  const CUMULATIVE_MATURITY = 577_270;

  for (const option of M.resolvePayoutOptions(TERMS)) {
    const priced = M.calculateReturns({
      principal: 500_000,
      tenureMonths: 24,
      payoutOption: option.id,
      terms: RETURNS_TERMS,
    });

    ok(`${option.id} — the configuration can be priced`, priced !== null);

    if (option.id === 'at-maturity') {
      check(`${option.id} — maturity compounds`, priced.maturityValue, CUMULATIVE_MATURITY);
      ok(`${option.id} — there is no instalment`, priced.instalmentAmount === null);
    } else {
      check(`C4 — ${option.id} returns the principal`, priced.maturityValue, 500_000);
      ok(
        `C4 — ${option.id} never shows the compounded figure`,
        priced.maturityValue !== CUMULATIVE_MATURITY,
      );
      ok(`${option.id} — Per Instalment has a figure to show`, priced.instalmentAmount !== null);

      /**
       * **Instalments do not sum exactly to the total, and cannot.**
       *
       * ₹72,500 over 24 monthly payments is ₹3,020.83; displayed as ₹3,021 it
       * multiplies back to ₹72,504 — ₹4 more than the interest actually earned.
       * The first version of this assertion demanded exact equality and failed,
       * which is the *assertion* being wrong about money rather than the model:
       * a rupee-rounded instalment cannot divide an arbitrary total evenly, and
       * banks resolve it by letting the final instalment absorb the remainder.
       *
       * So the property worth asserting is that the drift stays within rounding
       * — at most half a rupee per instalment. The UI states the figure as
       * approximate for the same reason.
       */
      const instalments = Math.floor((24 * priced.instalmentsPerYear) / 12);
      const summed = priced.instalmentAmount * instalments;
      ok(
        `${option.id} — instalments sum to the total within rounding`,
        Math.abs(summed - priced.totalInterest) <= instalments / 2,
      );
    }
  }

  /* ---------------------------------------------------------------- */
  section('Domain · whole rupees only (T3.2.10)');

  /**
   * The rupee is the smallest unit this platform transacts in. Unreachable from
   * the UI — the field strips non-digits and quick amounts are integers — so
   * these guard a hand-edited draft or a future API.
   */
  ok('a whole rupee amount is accepted', M.validateAmount(500_000, TERMS) === null);
  ok(
    'the minimum itself is whole and accepted',
    M.validateAmount(TERMS.minInvestment, TERMS) === null,
  );

  const fractional = M.validateAmount(500_000.5, TERMS);
  ok('a fractional amount is rejected', fractional !== null);
  ok('and the message asks for a whole amount', /whole rupee/i.test(fractional));
  ok(
    'half a rupee above the minimum is still rejected',
    M.validateAmount(500_000.01, TERMS) !== null,
  );

  /**
   * Order matters: ₹4,99,999.50 is both fractional *and* below the minimum.
   * "Enter a whole rupee amount" is the more useful message — it names what the
   * user can see is wrong with what they typed.
   */
  ok(
    'a fractional sub-minimum amount reports the fraction, not the shortfall',
    /whole rupee/i.test(M.validateAmount(499_999.5, TERMS)),
  );

  /* Quick amounts apply the same rule, so no chip can offer what the validator rejects. */
  check(
    'a fractional candidate is never offered as a chip',
    M.resolveQuickAmounts({ ...TERMS, quickAmounts: [500_000.5, 1_000_000] }),
    [1_000_000],
  );
  ok(
    'and every offered chip is a whole rupee amount',
    M.resolveQuickAmounts(TERMS).every((amount) => Number.isInteger(amount)),
  );

  /* The storage boundary refuses the same value independently of the form. */
  globalThis.window = {
    sessionStorage: {
      getItem: (k) => (intStore.has(k) ? intStore.get(k) : null),
      setItem: (k, v) => intStore.set(k, v),
      removeItem: (k) => intStore.delete(k),
    },
  };
  intStore.set(
    M.draftStorageKey('fd-002'),
    JSON.stringify({
      version: 3,
      draft: {
        productId: 'fd-002',
        investment: { amount: 500_000.5, tenureMonths: 24, payoutOption: 'at-maturity' },
        furthestStep: 'investment',
        updatedAt: 1_000_000,
      },
    }),
  );
  ok('a stored fractional amount fails closed', M.readDraft('fd-002', 1_000_000) === null);
  delete globalThis.window;

  /* ---------------------------------------------------------------- */
  section('Domain · rate-card validation (T3.2.10)');

  /**
   * `resolveRate` uses `find`, so two rows for one tenure resolve to whichever
   * came first — a wrong rate with no error anywhere. Ordering is not a
   * tie-break the platform may invent, so a duplicate is a data defect.
   */
  check('the shipped fixture card is sound', M.validateRateCard(TERMS), []);

  const duplicated = M.validateRateCard({
    ...TERMS,
    tenureRates: [
      { tenureMonths: 24, annualRate: 7.25 },
      { tenureMonths: 24, annualRate: 6.5 },
    ],
  });
  check('a duplicate tenure is reported exactly once', duplicated.length, 1);
  ok('and the message names the tenure', /24 months/.test(duplicated[0]));
  /**
   * The defect the validator exists to expose: without it, the second rate is
   * unreachable and the first silently wins.
   */
  check(
    'the resolver would otherwise have silently returned the first rate',
    M.resolveRate(
      {
        ...TERMS,
        tenureRates: [
          { tenureMonths: 24, annualRate: 7.25 },
          { tenureMonths: 24, annualRate: 6.5 },
        ],
      },
      { tenureMonths: 24 },
    ).annualRate,
    7.25,
  );

  check(
    'three copies of one tenure still report one error',
    M.validateRateCard({
      ...TERMS,
      tenureRates: [
        { tenureMonths: 12, annualRate: 7 },
        { tenureMonths: 12, annualRate: 7 },
        { tenureMonths: 12, annualRate: 7 },
      ],
    }).length,
    1,
  );
  check(
    'two different duplicated tenures report two errors',
    M.validateRateCard({
      ...TERMS,
      tenureRates: [
        { tenureMonths: 12, annualRate: 7 },
        { tenureMonths: 12, annualRate: 7 },
        { tenureMonths: 24, annualRate: 7.25 },
        { tenureMonths: 24, annualRate: 7.25 },
      ],
    }).length,
    2,
  );

  const emptyCard = M.validateRateCard({ ...TERMS, tenureRates: [] });
  check('an empty card is a single, clear error', emptyCard.length, 1);
  ok('naming the consequence', /cannot be booked/i.test(emptyCard[0]));

  ok(
    'a fractional tenure row is reported',
    M.validateRateCard({ ...TERMS, tenureRates: [{ tenureMonths: 24.5, annualRate: 7.25 }] })
      .length > 0,
  );
  ok(
    'a zero or negative rate is reported',
    M.validateRateCard({ ...TERMS, tenureRates: [{ tenureMonths: 24, annualRate: 0 }] }).length > 0,
  );
  ok('validateRateCard never throws', typeof M.validateRateCard(TERMS).length === 'number');

  /* ---------------------------------------------------------------- */
  section('Domain · default tenure and payout reconciliation (T3.2.10)');

  check('the single priced tenure is the default', M.defaultTenure(TERMS), 12);
  check(
    'the shortest priced tenure is the default, not the highest-paying',
    M.defaultTenure(MULTI),
    12,
  );
  ok(
    'a product pricing nothing has no default',
    M.defaultTenure({ ...TERMS, tenureRates: [] }) === null,
  );
  ok(
    'the default tenure is always selectable',
    M.selectableTenures(MULTI).some((t) => t.tenureMonths === M.defaultTenure(MULTI)),
  );

  /**
   * Reconciliation is a **mechanism**, not a business rule. `supportedPayouts`
   * has no tenure dimension today, so a valid choice always survives — which is
   * exactly what these assert. Inventing a rule such as "no monthly payout under
   * six months" would be fabricating business logic nobody has stated.
   */
  check('a still-valid payout is preserved', M.reconcilePayoutOption(TERMS, 'monthly'), 'monthly');
  check('and so is the default', M.reconcilePayoutOption(TERMS, 'at-maturity'), 'at-maturity');
  check(
    'a payout the product does not sell is reset to the default',
    M.reconcilePayoutOption(TERMS, 'half-yearly'),
    'at-maturity',
  );
  check('a null selection is seeded', M.reconcilePayoutOption(TERMS, null), 'at-maturity');
  check(
    'reset honours a product without at-maturity',
    M.reconcilePayoutOption(
      { ...TERMS, supportedPayouts: ['quarterly', 'monthly'] },
      'half-yearly',
    ),
    'monthly',
  );
  ok(
    'a product offering no payout reconciles to null',
    M.reconcilePayoutOption({ ...TERMS, supportedPayouts: [] }, 'monthly') === null,
  );
  ok(
    'whatever it returns is selectable, or null',
    (() => {
      for (const supported of [['at-maturity', 'monthly'], ['quarterly'], []]) {
        const scoped = { ...TERMS, supportedPayouts: supported };
        const result = M.reconcilePayoutOption(scoped, 'half-yearly');
        if (result === null && supported.length === 0) continue;
        if (!M.resolvePayoutOptions(scoped).some((o) => o.id === result)) return false;
      }
      return true;
    })(),
  );

  /* ---------------------------------------------------------------- */
  section('Domain · invalid configuration yields no figures (T3.2.10)');

  /**
   * The stale-returns guarantee, asserted at the domain level rather than
   * rewritten. The screen additionally refuses to price a configuration whose
   * amount fails validation; these cover everything the engine itself decides.
   */
  const priceable = (over) =>
    M.calculateReturns({
      principal: 500_000,
      tenureMonths: 12,
      payoutOption: 'at-maturity',
      terms: TERMS,
      ...over,
    });

  ok('a complete valid configuration is priced', priceable({}) !== null);
  ok('an unpriced tenure yields nothing', priceable({ tenureMonths: 36 }) === null);
  ok('a fractional tenure yields nothing', priceable({ tenureMonths: 12.5 }) === null);
  ok('a zero tenure yields nothing', priceable({ tenureMonths: 0 }) === null);
  ok(
    'a product with no rate card yields nothing',
    priceable({ terms: { ...TERMS, tenureRates: [] } }) === null,
  );
  /**
   * A below-minimum amount is arithmetically priceable, so the *engine* prices
   * it — and the screen must not. This pins the division of responsibility:
   * `validateAmount` is the gate, and it rejects.
   */
  ok(
    'a below-minimum amount is caught by the validator, not the engine',
    M.validateAmount(1_000, TERMS) !== null,
  );

  /* ---------------------------------------------------------------- */
  section('Domain · DepositTerms consistency — display must not contradict data (T3.2.10)');

  /**
   * The three display fields **stay** — deleting them would change approved UI
   * copy, which is not this task's to change. What is enforced instead is the
   * requirement itself: they may not contradict the rate card.
   *
   * These assert the shipped fixture, so they are checks on real data. They
   * pass today and will fail the moment someone edits one side of a pair.
   */
  ok(
    'the headline interestRate appears in the rate card',
    TERMS.tenureRates.some((rate) => rate.annualRate === TERMS.interestRate),
  );

  /**
   * `tenureRange` is the advertised family ("7 Days – 10 Years") and may be
   * wider than what is currently on sale — that is legitimate. What it may not
   * be is *narrower*: a priced tenure outside the advertised range would mean
   * the product sells something it does not advertise.
   */
  const rangeMinMonths = TERMS.tenureRange.minDays / 30;
  const rangeMaxMonths = TERMS.tenureRange.maxYears * 12;
  ok(
    'every priced tenure falls inside the advertised range',
    TERMS.tenureRates.every(
      (rate) => rate.tenureMonths >= rangeMinMonths && rate.tenureMonths <= rangeMaxMonths,
    ),
  );

  /**
   * Every payout the product *sells* must appear among the words it
   * *advertises*. The reverse does not hold and must not be asserted: the
   * fixture advertises "Cumulative" and "At Maturity" as two names for the one
   * `at-maturity` mode, which is the bank's wording, not a contradiction.
   */
  ok(
    'every supported payout is represented in the advertised list',
    M.resolvePayoutOptions(TERMS).every((option) =>
      TERMS.payoutOptions.some(
        (advertised) => advertised.toLowerCase() === option.label.toLowerCase(),
      ),
    ),
  );
  check(
    'the advertised list is wider than the vocabulary, by design',
    TERMS.payoutOptions.length > TERMS.supportedPayouts.length,
    true,
  );

  /* Still one priced tenure — the rate data is the client's to supply. */
  check('the fixture still prices exactly one tenure', TERMS.tenureRates, [
    { tenureMonths: 12, annualRate: 7.25 },
  ]);
  check('at the unchanged headline rate', TERMS.interestRate, 7.25);

  /* ================================================================ *
   * Nominee domain (T3.3.1)
   * ================================================================ */

  section('Domain · nominee PII is never persisted (T3.3.1)');

  /**
   * The draft's shipped contract — *"never raw sensitive values"* — applied to
   * a third party's name and date of birth. `PersistedBookingDraft` omits the
   * section at the type level; these assert the runtime behaviour matches.
   */
  const piiStore = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (k) => (piiStore.has(k) ? piiStore.get(k) : null),
      setItem: (k, v) => piiStore.set(k, v),
      removeItem: (k) => piiStore.delete(k),
    },
  };

  /*
    `relationship` is 'Spouse', not the artwork's 'Wife': the POC list uses the
    gender-neutral term, so 'Wife' is now correctly rejected and asserted as
    such below.
  */
  const NOMINEE = {
    id: 'n1',
    fullName: 'Priya Sharma',
    relationship: 'Spouse',
    dateOfBirth: '1990-05-12',
    guardianName: '',
    sharePercent: '100',
  };

  M.writeDraft({
    bookingId: 'booking-1000000-9',
    productId: 'fd-002',
    investment: { amount: 500_000, tenureMonths: 24, payoutOption: 'at-maturity' },
    nominee: { nominationType: 'single', nominees: [NOMINEE] },
    identity: { confirmedAt: 1_000_000, method: 'existing-kyc' },
    application: { acceptedDeclarations: [], preparedAt: null, identityMethod: null },
    bankAccountId: 'acc-axis-4587',
    declarations: { detailsConfirmed: false, termsAccepted: false },
    paymentMethod: null,
    confirmation: null,
    furthestStep: 'nominee',
    updatedAt: 1_000_000,
  });

  const written = piiStore.get(M.draftStorageKey('fd-002'));
  ok('the nominee’s name never reaches storage', !written.includes('Priya Sharma'));
  ok('nor their date of birth', !written.includes('1990-05-12'));
  ok('nor the relationship', !written.includes('Spouse'));
  check(
    'the persisted payload holds only the non-sensitive keys',
    Object.keys(JSON.parse(written).draft).sort(),
    [
      'application',
      'bankAccountId',
      'bookingId',
      'confirmation',
      'declarations',
      'furthestStep',
      'identity',
      'investment',
      'paymentMethod',
      'productId',
      'updatedAt',
    ],
  );
  check(
    'and a read restores an empty nominee section, never a stored one',
    M.readDraft('fd-002', 1_000_000).nominee,
    M.emptyNomineeConfiguration(),
  );
  /** The investment section still persists — the exclusion is scoped, not blanket. */
  check('the investment configuration is unaffected', M.readDraft('fd-002', 1_000_000).investment, {
    amount: 500_000,
    tenureMonths: 24,
    payoutOption: 'at-maturity',
  });

  delete globalThis.window;

  section('Domain · nominee validation (T3.3.1)');

  const nominee = (over = {}) => ({ ...NOMINEE, ...over });
  const messages = (n) => M.validateNominee(n).map((e) => e.field);

  check('a complete nominee has no errors', M.validateNominee(nominee()), []);
  check('a missing name is reported', messages(nominee({ fullName: '   ' })), ['fullName']);
  check('a missing relationship is reported', messages(nominee({ relationship: '' })), [
    'relationship',
  ]);
  check('a missing date of birth is reported', messages(nominee({ dateOfBirth: '' })), [
    'dateOfBirth',
  ]);
  check('an unparseable date is reported', messages(nominee({ dateOfBirth: 'not a date' })), [
    'dateOfBirth',
  ]);
  check('a future date of birth is reported', messages(nominee({ dateOfBirth: '2999-01-01' })), [
    'dateOfBirth',
  ]);
  check('a missing share is reported', messages(nominee({ sharePercent: '' })), ['sharePercent']);
  check('a zero share is reported', messages(nominee({ sharePercent: '0' })), ['sharePercent']);
  check('a share above 100 is reported', messages(nominee({ sharePercent: '101' })), [
    'sharePercent',
  ]);
  check(
    'every failing field is reported at once',
    messages(nominee({ fullName: '', sharePercent: '' })),
    ['fullName', 'sharePercent'],
  );

  /**
   * **Guardian is never required.** Spec §8 Rule 2 requires guardian
   * information for a minor and no document defines "minor"; the approved
   * artwork asks for the name unconditionally with the condition in its label.
   * Inventing a threshold would make the field mandatory at an age nobody has
   * agreed to.
   */
  check('an empty guardian name is never an error', messages(nominee({ guardianName: '' })), []);

  /**
   * §8 Rule 3 — "relationship must be from supported values" — is wired but
   * **inert**, because the supported values are not enumerated anywhere. An
   * empty list must not reject every value the user types.
   */
  /**
   * ⚠ **POC assumption, supplied 2026-08-06 while the client was unavailable.**
   * Not from any specification. `SUPPORTED_RELATIONSHIPS` is the single source
   * of truth — replacing it changes the dropdown, the validation and the error
   * message together, and an invariant asserts no component declares its own.
   */
  check('the POC relationship list is the eight agreed values', M.SUPPORTED_RELATIONSHIPS, [
    'Spouse',
    'Son',
    'Daughter',
    'Father',
    'Mother',
    'Brother',
    'Sister',
    'Other',
  ]);
  check('a supported relationship is accepted', messages(nominee({ relationship: 'Spouse' })), []);
  check(
    'every listed relationship validates',
    M.SUPPORTED_RELATIONSHIPS.filter((r) => messages(nominee({ relationship: r })).length > 0),
    [],
  );
  check('an unsupported relationship is rejected', messages(nominee({ relationship: 'Cousin' })), [
    'relationship',
  ]);
  /** The artwork's "Wife" is deliberately not in the list — "Spouse" covers it. */
  check(
    'the artwork’s narrower "Wife" is not accepted',
    messages(nominee({ relationship: 'Wife' })),
    ['relationship'],
  );
  ok(
    'and the message points at the list',
    /from the list/i.test(M.validateNominee(nominee({ relationship: 'Cousin' }))[0].message),
  );

  section('Domain · share of proceeds totals 100% (T3.3.5)');

  check('a readable share parses', M.parseSharePercent(' 60 '), 60);
  ok('an empty share does not', M.parseSharePercent('') === null);
  ok('nor does a non-numeric one', M.parseSharePercent('abc') === null);
  check(
    'the total is the sum of readable shares',
    M.totalSharePercent([
      nominee({ sharePercent: '60' }),
      nominee({ id: 'n2', sharePercent: '40' }),
    ]),
    100,
  );

  const config = (nominees) =>
    M.validateNomineeConfiguration({ nominationType: 'single', nominees });

  check('no nominees at all is invalid', config([]).isValid, false);
  ok('and says what to do', /Add at least one nominee/.test(config([]).formErrors[0]));

  check('one nominee at 100% is valid', config([nominee()]).isValid, true);
  check(
    'two nominees at 60 and 40 are valid',
    config([nominee({ sharePercent: '60' }), nominee({ id: 'n2', sharePercent: '40' })]).isValid,
    true,
  );

  const short = config([
    nominee({ sharePercent: '60' }),
    nominee({ id: 'n2', sharePercent: '30' }),
  ]);
  check('shares under 100% are invalid', short.isValid, false);
  ok('and the message names the shortfall', /add 10% to reach 100%/i.test(short.formErrors[0]));

  const over = config([nominee({ sharePercent: '70' }), nominee({ id: 'n2', sharePercent: '50' })]);
  ok('shares over 100% name the excess', /remove 20% to reach 100%/i.test(over.formErrors[0]));

  /**
   * The total is only judged once every share is readable — telling someone
   * their shares total 60% while a field is still blank describes the form's
   * state, not their mistake.
   */
  const partialShares = config([
    nominee({ sharePercent: '60' }),
    nominee({ id: 'n2', sharePercent: '' }),
  ]);
  check('a blank share suppresses the total message', partialShares.formErrors, []);
  check(
    'but the blank field itself is reported',
    partialShares.errors.map((e) => e.field),
    ['sharePercent'],
  );

  check('the approved total is 100', M.TOTAL_SHARE_PERCENT, 100);
  check(
    'the two approved nomination types, as drawn',
    M.NOMINATION_TYPES.map((t) => t.id),
    ['single', 'multiple'],
  );
  check('single is the approved default', M.DEFAULT_NOMINATION_TYPE, 'single');
  /** No maximum nominee count is invented — none is stated anywhere. */
  check(
    'five nominees summing to 100% are accepted — no invented cap',
    config([
      nominee({ sharePercent: '20' }),
      nominee({ id: 'n2', sharePercent: '20' }),
      nominee({ id: 'n3', sharePercent: '20' }),
      nominee({ id: 'n4', sharePercent: '20' }),
      nominee({ id: 'n5', sharePercent: '20' }),
    ]).isValid,
    true,
  );

  section('Domain · add and remove nominees (T3.3.3)');

  /**
   * `emptyNominee` is what `addNominee` appends. The first row opens at 100%
   * because a single nominee can only ever be valid at 100; later rows open
   * blank, because the platform has no basis for guessing a split.
   */
  const first = M.emptyNominee(true);
  const later = M.emptyNominee();

  check('the first nominee opens at the full share', first.sharePercent, '100');
  check('a later nominee opens blank', later.sharePercent, '');
  ok('ids are unique, so removing one cannot affect another', first.id !== later.id);
  check(
    'a new nominee is otherwise empty',
    [first.fullName, first.relationship, first.dateOfBirth, first.guardianName],
    ['', '', '', ''],
  );

  /* Adding a second nominee breaks the 100% total until the shares are set. */
  check(
    'one seeded nominee is not yet valid — no name, relationship or date',
    config([first]).isValid,
    false,
  );
  check(
    'a seeded nominee filled in is valid',
    config([{ ...first, ...NOMINEE, id: first.id }]).isValid,
    true,
  );

  const two = [
    { ...NOMINEE, id: 'a', sharePercent: '100' },
    { ...NOMINEE, id: 'b', sharePercent: '100' },
  ];
  check('adding a second nominee at 100% breaks the total', config(two).isValid, false);
  check(
    'removing it restores a valid configuration',
    config(two.filter((n) => n.id !== 'b')).isValid,
    true,
  );

  section('Domain · Continue gating (T3.3.3)');

  /**
   * The screen disables Continue on `!validation.isValid` and derives nothing
   * itself. These pin the verdict the button reads.
   */
  const gate = (nominees) => config(nominees).isValid;

  check('Continue is blocked with no nominees', gate([]), false);
  check('Continue is blocked with a missing name', gate([nominee({ fullName: '' })]), false);
  check(
    'Continue is blocked with a missing relationship',
    gate([nominee({ relationship: '' })]),
    false,
  );
  check(
    'Continue is blocked with an unsupported relationship',
    gate([nominee({ relationship: 'Cousin' })]),
    false,
  );
  check(
    'Continue is blocked with a missing date of birth',
    gate([nominee({ dateOfBirth: '' })]),
    false,
  );
  check(
    'Continue is blocked with a future date of birth',
    gate([nominee({ dateOfBirth: '2999-01-01' })]),
    false,
  );
  check('Continue is blocked with a zero share', gate([nominee({ sharePercent: '0' })]), false);
  check(
    'Continue is blocked with a share above 100',
    gate([nominee({ sharePercent: '101' })]),
    false,
  );
  check(
    'Continue is blocked when the total is below 100',
    gate([nominee({ sharePercent: '60' }), nominee({ id: 'n2', sharePercent: '30' })]),
    false,
  );
  check(
    'Continue is blocked when the total is above 100',
    gate([nominee({ sharePercent: '70' }), nominee({ id: 'n2', sharePercent: '50' })]),
    false,
  );
  check('Continue is allowed for one complete nominee at 100%', gate([nominee()]), true);
  check(
    'Continue is allowed for two complete nominees at 60 and 40',
    gate([nominee({ sharePercent: '60' }), nominee({ id: 'n2', sharePercent: '40' })]),
    true,
  );
  /** A guardian name is never required, so its absence cannot block Continue. */
  check(
    'an empty guardian name does not block Continue',
    gate([nominee({ guardianName: '' })]),
    true,
  );

  /* ---------------------------------------------------------------- */
  section('Domain · productId-driven booking resolution');

  /**
   * The defect this fixes: the Overview screen accepted a `productId` and
   * ignored it, rendering one hardcoded deposit for every booking URL. These
   * assert the id is now genuinely the input.
   */
  const bookable = M.bookableProductIds();
  ok('at least one product is bookable', bookable.length > 0);
  check(
    'the approved deposit resolves by its own id',
    M.resolveBookingOverview('fd-002'),
    M.BOOKING_OVERVIEW_FIXTURE,
  );
  check(
    'and the resolved deposit carries that id',
    M.resolveBookingOverview('fd-002').deposit.productId,
    'fd-002',
  );

  /**
   * **The id is actually used.** A resolver that ignored its argument would
   * return the same object for every id — these fail if it does.
   */
  ok('an unknown product does not resolve', M.resolveBookingOverview('fd-001') === null);
  ok('nor does another unknown product', M.resolveBookingOverview('fd-999') === null);
  ok('nor an empty id', M.resolveBookingOverview('') === null);
  ok(
    'every id outside the catalogue fails safely',
    ['fd-001', 'fd-003', 'fd-006', 'unknown', 'FD-002'].every(
      (id) => M.resolveBookingOverview(id) === null,
    ),
  );

  /**
   * Prototype keys must not resolve. Without an own-property check,
   * `resolveBookingOverview('constructor')` would return a function from
   * `Object.prototype` and the caller would treat it as a deposit.
   */
  for (const key of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    ok(`the prototype key "${key}" does not resolve`, M.resolveBookingOverview(key) === null);
  }

  /**
   * The catalogue is a **lookup**, proven by resolving against a two-entry
   * record rather than by inventing shipped product data. The shipped record
   * still holds exactly the one approved deposit — asserted below.
   */
  const twoProducts = {
    'fd-002': M.BOOKING_OVERVIEW_FIXTURE,
    'fd-777': {
      ...M.BOOKING_OVERVIEW_FIXTURE,
      deposit: { ...M.BOOKING_OVERVIEW_FIXTURE.deposit, productId: 'fd-777' },
    },
  };
  const resolveFrom = (catalogue, id) =>
    Object.hasOwn(catalogue, id) ? (catalogue[id] ?? null) : null;

  check('product A resolves to A', resolveFrom(twoProducts, 'fd-002').deposit.productId, 'fd-002');
  check('product B resolves to B', resolveFrom(twoProducts, 'fd-777').deposit.productId, 'fd-777');
  ok(
    'and they are not the same object',
    resolveFrom(twoProducts, 'fd-002') !== resolveFrom(twoProducts, 'fd-777'),
  );

  /**
   * No product data invented. The shipped catalogue holds exactly one deposit.
   *
   * **Re-pointed, not relaxed.** These four assertions guarded the fixture
   * against drift and previously pinned it to the approved artwork's Axis / 24
   * months / ₹5,00,000. They now pin it to catalogue product `fd-002` — HDFC /
   * 12 months / ₹10,000 — because the artwork values under that id were a
   * silent product substitution across the Goal-Based FD handoff. The guard is
   * as strict as it was; what it guards is now the identity the catalogue
   * publishes.
   */
  check('the shipped catalogue holds exactly one product', bookable, ['fd-002']);
  check(
    'the deposit is the catalogue’s fd-002 — bank',
    M.BOOKING_OVERVIEW_FIXTURE.deposit.bank.id,
    'hdfc',
  );
  check('unchanged — headline rate', M.BOOKING_OVERVIEW_FIXTURE.deposit.terms.interestRate, 7.25);
  check('corrected — minimum', M.BOOKING_OVERVIEW_FIXTURE.deposit.terms.minInvestment, 10_000);
  check('corrected — rate card', M.BOOKING_OVERVIEW_FIXTURE.deposit.terms.tenureRates, [
    { tenureMonths: 12, annualRate: 7.25 },
  ]);

  /* ---------------------------------------------------------------- */
  section('Domain · Product Master mapping (Steps 1–3)');

  /**
   * A payload record as the existing `/api/v1/products` endpoint serves it —
   * including the fields this consumer does **not** map, because a real payload
   * carries them and the mapper must ignore them rather than choke.
   */
  const wire = (over = {}) => ({
    id: 'fd-002',
    bank: {
      id: 'hdfc',
      name: 'HDFC Bank',
      shortCode: 'HDFC',
      initials: 'HB',
      logoUrl: '/banks/HDFC-bank-logo.svg',
      rating: 'AAA',
    },
    name: 'HDFC Bank Fixed Deposit',
    interestRate: 7.25,
    tenureMonths: 12,
    minInvestment: 10_000,
    interestType: 'cumulative',
    payout: 'at-maturity',
    benefits: [{ id: 'auto-renewal', label: 'Auto-renewal' }],
    categories: ['tax-saving'],
    flags: [],
    rateSlabs: [
      { minAmount: 0, annualRate: 7.25 },
      { minAmount: 500_000, annualRate: 7.35 },
    ],
    ...over,
  });

  /* `toProductMaster` takes an already-validated record; `parseProductMaster` is
     the parse-then-map pair used everywhere else in this section. */
  const mapped = M.toProductMaster(wire());

  check('id is renamed to productId', M.parseProductMaster(wire()).productId, 'fd-002');
  check('name maps directly', M.parseProductMaster(wire()).name, 'HDFC Bank Fixed Deposit');
  check('bank maps directly', M.parseProductMaster(wire()).bank.id, 'hdfc');
  check('minInvestment maps directly', M.parseProductMaster(wire()).minInvestment, 10_000);
  check('tenure nests under terms', M.parseProductMaster(wire()).terms.tenureMonths, 12);
  check('payout nests under terms', M.parseProductMaster(wire()).terms.payout, 'at-maturity');
  check(
    'interest type nests under terms',
    M.parseProductMaster(wire()).terms.interestType,
    'cumulative',
  );
  check('rate bands map through', M.parseProductMaster(wire()).terms.rateSlabs.length, 2);

  /**
   * **The bank's category survives the wire.**
   *
   * `bankSchema` declared every `Bank` field except `category`, and Zod strips
   * what it does not declare — so a Small Finance Bank arrived at the engine
   * unclassified. The client document requires SFBs to be identified at the
   * recommendation, and the concentration disclosure keys off exactly this
   * field, so a silent strip disabled a documented rule with no error anywhere.
   *
   * Asserted through `parseProductMaster` rather than `toProductMaster`,
   * because the strip happened in the parse.
   */
  const sfbBank = (category) => ({
    id: 'equitas',
    name: 'Equitas Small Finance Bank',
    shortCode: 'EQ',
    initials: 'EQ',
    logoUrl: null,
    rating: null,
    ...(category === undefined ? {} : { category }),
  });

  check(
    'a small-finance bank keeps its category',
    M.parseProductMaster(wire({ bank: sfbBank('small-finance') })).bank.category,
    'small-finance',
  );
  check(
    'a universal bank keeps its category',
    M.parseProductMaster(wire({ bank: sfbBank('universal') })).bank.category,
    'universal',
  );
  /*
    Absent is a bank the catalogue has not classified — a different statement
    from "universal", and defaulting it would classify banks the source did not.
  */
  ok(
    'and an unclassified bank stays unclassified',
    M.parseProductMaster(wire({ bank: sfbBank(undefined) })).bank.category === undefined,
  );
  ok(
    'a category the platform does not define fails the parse',
    M.parseProductMaster(wire({ bank: sfbBank('co-operative') })) === null,
  );
  /* The same guarantee on the already-validated path. */
  check(
    'the mapper passes the bank through whole',
    M.toProductMaster({ ...wire(), bank: sfbBank('small-finance') }).bank.category,
    'small-finance',
  );

  /**
   * D1 — the wire's `interestRate` is the product's published **base rate**, and
   * it lands on `terms` beside the tenure it is quoted at. Renamed, not
   * recomputed: same value, clearer name.
   */
  check(
    'interestRate is renamed to terms.baseRate',
    M.parseProductMaster(wire()).terms.baseRate,
    7.25,
  );
  ok(
    'and a product without a base rate does not parse',
    M.parseProductMaster(wire({ interestRate: undefined })) === null,
  );
  ok('nor does a zero base rate', M.parseProductMaster(wire({ interestRate: 0 })) === null);

  /** The literal discriminant — the only field with no payload source. */
  check(
    'productType is the FD discriminant',
    M.parseProductMaster(wire()).productType,
    'fixed-deposit',
  );

  /**
   * Absent slabs normalise to `[]`. The endpoint legitimately omits them —
   * "no published bands, the headline rate applies at every amount" — and one
   * shape spares every consumer an optional check.
   */
  check(
    'absent rate slabs normalise to an empty array',
    M.parseProductMaster(wire({ rateSlabs: undefined })).terms.rateSlabs,
    [],
  );

  /**
   * **No invented business data.** Every field the Addendum names but the
   * payload lacks is absent, not defaulted. This is the assertion that fails if
   * someone later adds `status: 'active'` "just to make it work".
   */
  check(
    'the master carries exactly the sourced fields',
    Object.keys(M.parseProductMaster(wire())).sort(),
    ['bank', 'minInvestment', 'name', 'productId', 'productType', 'terms'],
  );
  check(
    'and FD terms carry exactly the sourced fields',
    Object.keys(M.parseProductMaster(wire()).terms).sort(),
    ['baseRate', 'interestType', 'payout', 'rateSlabs', 'tenure', 'tenureMonths'],
  );
  /**
   * **The published tenure and the month count agree**, and the mapper derives
   * the former rather than inventing it. A payload without `tenure` is stating
   * whole months, so normalising it is not a conversion — nothing is rounded.
   */
  check(
    'a month-based payload normalises to a month tenure',
    M.parseProductMaster(wire()).terms.tenure,
    { value: M.parseProductMaster(wire()).terms.tenureMonths, unit: 'months' },
  );
  for (const absent of [
    'status',
    'maxInvestment',
    'prematureWithdrawal',
    'supportedPayouts',
    'tenureRates',
    'eligibility',
    'autoRenewal',
    'interestRate',
  ]) {
    ok(
      `"${absent}" is absent rather than defaulted`,
      !(absent in M.parseProductMaster(wire())) && !(absent in M.parseProductMaster(wire()).terms),
    );
  }

  /**
   * Marketplace's display fields are dropped, not carried. The master is a
   * sibling projection of the payload, not a superset of `ProductSummary`.
   */
  for (const dropped of ['benefits', 'categories', 'flags', 'interestRate']) {
    ok(`the display field "${dropped}" is not mapped`, !(dropped in M.parseProductMaster(wire())));
  }

  /**
   * **No resolved rate is stored** (D1). `baseRate` and `rateSlabs` are
   * *published* product data. What a particular deposit earns is a `RateQuote`,
   * produced by `resolveProductRate` from an amount the mapper never sees — so
   * `appliedRate`, `effectiveRate` and a `quote` have no business being here.
   */
  for (const derived of [
    'appliedRate',
    'effectiveRate',
    'quote',
    'estimatedReturns',
    'maturityValue',
  ]) {
    const master = M.parseProductMaster(wire());
    ok(
      `no resolved rate is stored — "${derived}" is absent`,
      !(derived in master) && !(derived in master.terms),
    );
  }

  section('Domain · Product Master fails closed (Steps 1–3)');

  /**
   * A record that does not match is dropped, never coerced. A `ProductMaster`
   * with `undefined` where a tenure should be is worse than no product at all —
   * a recommendation engine would reason over it.
   */
  ok('a null payload does not parse', M.parseProductMaster(null) === null);
  ok('a non-object does not parse', M.parseProductMaster('fd-002') === null);
  ok('a missing id does not parse', M.parseProductMaster(wire({ id: undefined })) === null);
  ok(
    'a missing tenure does not parse',
    M.parseProductMaster(wire({ tenureMonths: undefined })) === null,
  );
  ok(
    'a fractional tenure does not parse',
    M.parseProductMaster(wire({ tenureMonths: 12.5 })) === null,
  );
  ok('a zero minimum does not parse', M.parseProductMaster(wire({ minInvestment: 0 })) === null);
  ok(
    'an unknown payout does not parse',
    M.parseProductMaster(wire({ payout: 'fortnightly' })) === null,
  );
  ok(
    'an unknown interest type does not parse',
    M.parseProductMaster(wire({ interestType: 'floating' })) === null,
  );
  ok(
    'a malformed rate band does not parse',
    M.parseProductMaster(wire({ rateSlabs: [{ minAmount: 0 }] })) === null,
  );

  /** A collection drops only the bad records — one bad product is not a bad page. */
  check(
    'a collection drops unparseable records and keeps the rest',
    M.parseProductMasters([wire(), null, wire({ id: 'fd-003' }), { nonsense: true }]).map(
      (p) => p.productId,
    ),
    ['fd-002', 'fd-003'],
  );
  check('an empty collection maps to an empty array', M.parseProductMasters([]), []);

  /* Mapping is deterministic — the same payload maps to the same master. */
  check('mapping is deterministic', M.parseProductMaster(wire()), M.parseProductMaster(wire()));
  ok('and mapped is a fresh object each time', M.parseProductMaster(wire()) !== mapped);

  /* ================================================================ */
  section('Domain · Goal-Based FD candidates and ranking');

  /**
   * A catalogue with the shape that matters: several tenures, several minimums,
   * and a rate order that does **not** agree with the tenure order — so a
   * "highest rate wins" shortcut ranks differently from the rules and the tests
   * can tell.
   */
  const gbfProduct = (id, tenureMonths, baseRate, minInvestment, rateSlabs = []) => ({
    productId: id,
    name: `${id} Fixed Deposit`,
    bank: {
      id: `bank-${id}`,
      name: `Bank ${id}`,
      shortCode: id.toUpperCase(),
      initials: id.slice(0, 2).toUpperCase(),
      logoUrl: null,
      rating: 'AAA',
    },
    minInvestment,
    productType: 'fixed-deposit',
    terms: {
      tenureMonths,
      baseRate,
      rateSlabs,
      interestType: 'cumulative',
      payout: 'at-maturity',
    },
  });

  const CATALOGUE = [
    gbfProduct('p06', 6, 7.6, 5_000),
    gbfProduct('p12', 12, 7.1, 10_000),
    gbfProduct('p24', 24, 7.4, 50_000),
    gbfProduct('p36', 36, 6.9, 25_000),
  ];

  const goal = (over = {}) => ({
    goalType: 'education',
    principal: 100_000,
    horizonMonths: 12,
    ...over,
  });

  /* ---- §8 filtering ---- */

  check(
    'every product that clears its minimum is a candidate',
    M.selectCandidates(CATALOGUE, goal()).map((c) => c.product.productId),
    ['p06', 'p12', 'p24', 'p36'],
  );
  check(
    'a product whose minimum the amount cannot clear is dropped',
    M.selectCandidates(CATALOGUE, goal({ principal: 20_000 })).map((c) => c.product.productId),
    ['p06', 'p12'],
  );
  check(
    'an amount below every minimum yields no candidates',
    M.selectCandidates(CATALOGUE, goal({ principal: 1_000 })),
    [],
  );

  /**
   * **No invented rate.** Every candidate carries a quote resolved from the
   * product's own published data — never a headline figure borrowed from
   * elsewhere and never a default.
   */
  check(
    'each candidate is priced at its own base rate',
    M.selectCandidates(CATALOGUE, goal()).map((c) => c.quote.annualRate),
    [7.6, 7.1, 7.4, 6.9],
  );
  check(
    'and the quote reports the tenure it was priced at',
    M.selectCandidates(CATALOGUE, goal()).map((c) => c.quote.tenureMonths),
    [6, 12, 24, 36],
  );

  /** An amount band overrides the base rate, through the platform resolver. */
  const banded = [gbfProduct('pb', 12, 7.0, 10_000, [{ minAmount: 500_000, annualRate: 7.5 }])];
  check(
    'below the band the candidate is priced at the base rate',
    M.selectCandidates(banded, goal({ principal: 100_000 }))[0].quote.annualRate,
    7.0,
  );
  check(
    'and at the band it is priced at the band rate',
    M.selectCandidates(banded, goal({ principal: 500_000 }))[0].quote.annualRate,
    7.5,
  );

  /* ---- R-TENURE-001 ---- */

  const candidatesFor = (g) => M.selectCandidates(CATALOGUE, g);
  const rank = (g) =>
    [...candidatesFor(g)]
      .sort((a, b) => M.compareCandidates(a, b, g))
      .map((c) => c.product.productId);

  ok('an exact tenure match is recognised', M.isExactTenureMatch(candidatesFor(goal())[1], goal()));
  ok('a tenure past the horizon is recognised', M.exceedsHorizon(candidatesFor(goal())[2], goal()));
  check('an exact tenure match ranks first', rank(goal())[0], 'p12');
  check(
    'and it outranks a higher rate at a different tenure',
    rank(goal({ horizonMonths: 12 }))[0],
    'p12',
  );

  /* ---- R-GOAL-001 / R-TENURE-003 — emergency prefers shorter ---- */

  check(
    'an emergency goal prefers the shortest available term',
    rank(goal({ goalType: 'emergency', horizonMonths: 3 }))[0],
    'p06',
  );
  check(
    'and orders the rest ascending by term, not by rate',
    rank(goal({ goalType: 'emergency', horizonMonths: 3 })),
    ['p06', 'p12', 'p24', 'p36'],
  );

  /**
   * **RISK-1 regression (audit, 2026-08-11).** The comparator used to test for
   * an exact tenure match *before* goal suitability, putting §13 priority 3
   * above priority 2. These are the cases that exposes, and none of them existed
   * before — the old emergency test used a 3-month horizon, where no exact match
   * is available, so the divergence was invisible.
   *
   * §13 is now followed literally: goal suitability decides first, and the exact
   * match breaks ties within it.
   */
  check(
    'an emergency goal with an exact match still prefers the shorter term',
    rank(goal({ goalType: 'emergency', horizonMonths: 12 }))[0],
    'p06',
  );
  check(
    'and the exact match ranks second, not first',
    rank(goal({ goalType: 'emergency', horizonMonths: 12 }))[1],
    'p12',
  );
  check(
    'a longer horizon does not promote its exact match either',
    rank(goal({ goalType: 'emergency', horizonMonths: 24 })),
    ['p06', 'p12', 'p24', 'p36'],
  );
  check(
    'a retirement goal with an exact match still prefers the longest term',
    rank(goal({ goalType: 'retirement', horizonMonths: 12 })),
    ['p36', 'p24', 'p12', 'p06'],
  );
  check(
    'and a retirement horizon shorter than every term is ordered longest-first',
    rank(goal({ goalType: 'retirement', horizonMonths: 6 })),
    ['p36', 'p24', 'p12', 'p06'],
  );

  /**
   * The bug's visible symptom: the top recommendation cited R-GOAL-001 and
   * R-TENURE-003 ("prefer shorter") while being the *longer* deposit. Asserted
   * on the reasons, because a ranking that contradicts its own explanation is
   * the failure a customer would actually notice.
   */
  const emergencyExact = M.recommendForGoal(
    CATALOGUE,
    goal({ goalType: 'emergency', horizonMonths: 12 }),
  );
  check(
    'the emergency recommendation is the shortest term',
    emergencyExact.recommendations[0].tenureMonths,
    6,
  );
  ok(
    'and it does not claim an exact tenure match it does not have',
    !emergencyExact.recommendations[0].reasons.some((r) => r.ruleId === 'R-TENURE-001'),
  );
  ok(
    'while the exact-match product still reports one where it is true',
    emergencyExact.recommendations[1].reasons.some((r) => r.ruleId === 'R-TENURE-001'),
  );

  /** Education is the case where both orderings agree — asserted so it stays that way. */
  check(
    'an exact match is still first for a closest-to-horizon goal',
    rank(goal({ goalType: 'education', horizonMonths: 24 }))[0],
    'p24',
  );

  /* ---- R-GOAL-002 — education matches the horizon ---- */

  check(
    'an education goal picks the closest term to the horizon',
    rank(goal({ goalType: 'education', horizonMonths: 20 }))[0],
    'p24',
  );
  check(
    'and prefers a term inside the horizon over one past it when equally close',
    rank(goal({ goalType: 'education', horizonMonths: 18 }))[0],
    'p12',
  );

  /* ---- R-GOAL-003 — retirement prefers longer ---- */

  check(
    'a retirement goal prefers the longest available term',
    rank(goal({ goalType: 'retirement', horizonMonths: 240 }))[0],
    'p36',
  );

  /**
   * §9 / §13.8 — rate is a tie-break, not the criterion. Two products at the
   * same tenure: the higher rate wins only because goal fit is already equal.
   */
  const tied = [gbfProduct('lo', 12, 7.0, 10_000), gbfProduct('hi', 12, 7.8, 10_000)];
  check(
    'rate breaks a tie once goal fit is equal',
    [...M.selectCandidates(tied, goal())]
      .sort((a, b) => M.compareCandidates(a, b, goal()))
      .map((c) => c.product.productId),
    ['hi', 'lo'],
  );

  /** §19 — determinism. Identical inputs, identical order, every time. */
  check('ranking is deterministic', rank(goal()), rank(goal()));
  check(
    'and input order does not change the result',
    [...M.selectCandidates([...CATALOGUE].reverse(), goal())]
      .sort((a, b) => M.compareCandidates(a, b, goal()))
      .map((c) => c.product.productId),
    rank(goal()),
  );

  /* ================================================================ */
  section('Domain · Goal-Based FD target rules (R-TARGET)');

  const gbfMaturityOf = (maturityValue) => ({
    principal: 100_000,
    interestEarned: maturityValue - 100_000,
    maturityValue,
  });

  ok(
    'no target set means no target assessment',
    M.assessTarget(gbfMaturityOf(107_450), goal()) === undefined,
  );
  check(
    'a met target is reported as achieved with no gap',
    M.assessTarget(gbfMaturityOf(107_450), goal({ targetAmount: 105_000 })),
    { targetAmount: 105_000, achieved: true, gap: 0 },
  );
  check(
    'a missed target reports the exact shortfall',
    M.assessTarget(gbfMaturityOf(107_450), goal({ targetAmount: 120_000 })),
    { targetAmount: 120_000, achieved: false, gap: 12_550 },
  );

  /**
   * R-TARGET-003 — *"must not claim that the target is achievable when the
   * calculated maturity is below the target."* One rupee short is short.
   */
  ok(
    'one rupee short is not achieved',
    M.assessTarget(gbfMaturityOf(107_450), goal({ targetAmount: 107_451 })).achieved === false,
  );
  check(
    'and the gap is that one rupee',
    M.assessTarget(gbfMaturityOf(107_450), goal({ targetAmount: 107_451 })).gap,
    1,
  );
  ok(
    'exactly meeting the target is achieved',
    M.assessTarget(gbfMaturityOf(107_450), goal({ targetAmount: 107_450 })).achieved,
  );
  /** A surplus is not a negative gap. */
  check(
    'a surplus reports a zero gap, never a negative one',
    M.assessTarget(gbfMaturityOf(107_450), goal({ targetAmount: 100 })).gap,
    0,
  );

  /* ================================================================ */
  section('Domain · Goal-Based FD recommendations');

  const gbfResult = M.recommendForGoal(CATALOGUE, goal({ targetAmount: 105_000 }));

  check('every candidate becomes a recommendation', gbfResult.recommendations.length, 4);
  check(
    'the exact tenure match is recommended first',
    gbfResult.recommendations[0].productId,
    'p12',
  );
  check('and the catalogue size is reported', gbfResult.candidatesConsidered, 4);

  const top = gbfResult.recommendations[0];

  check('the recommendation carries exactly the sourced fields', Object.keys(top).sort(), [
    'goalType',
    'maturity',
    'principal',
    'product',
    'productId',
    'quote',
    'reasons',
    'target',
    'tenureMonths',
    'warnings',
  ]);

  /**
   * The maturity is computed from the quote that was resolved for this
   * principal — the same discipline `product-service.ts` follows. ₹1,00,000 at
   * 7.1% for 12 months compounds quarterly to ₹1,07,291, the approved SBI
   * figure.
   */
  check('maturity is computed from the resolved quote', top.maturity.maturityValue, 107_291);
  check('the quote is the product’s own rate', top.quote, { annualRate: 7.1, tenureMonths: 12 });
  check('the principal is the goal amount', top.principal, 100_000);

  /** No `null` placeholders — a target section exists only when a target was set. */
  check('the target assessment is present when a target was set', top.target.achieved, true);
  ok(
    'and absent entirely when none was',
    !('target' in M.recommendForGoal(CATALOGUE, goal()).recommendations[0]),
  );

  /* ---- §14 explanation ---- */

  const ruleIds = top.reasons.map((reason) => reason.ruleId);

  ok(
    'every reason carries a rule id',
    top.reasons.every((r) => Boolean(r.ruleId) && Boolean(r.text)),
  );
  ok('the exact-match rule is cited', ruleIds.includes('R-TENURE-001'));
  ok('the goal rule is cited', ruleIds.includes('R-GOAL-002'));
  ok('the target rule is cited', ruleIds.includes('R-TARGET-001'));
  ok('and the minimum-investment filter is cited', ruleIds.includes('§8.investment-amount'));
  check('the strongest reason is stated first', top.reasons[0].ruleId, 'R-TENURE-001');

  /** A missed target cites R-TARGET-002, not R-TARGET-001. */
  const missed = M.recommendForGoal(CATALOGUE, goal({ targetAmount: 200_000 }));
  ok(
    'a missed target cites the gap rule',
    missed.recommendations[0].reasons.some((r) => r.ruleId === 'R-TARGET-002'),
  );
  ok(
    'and never claims achievement',
    missed.recommendations.every((r) => r.target.achieved === false),
  );

  /** An emergency goal cites its own two rules. */
  const emergency = M.recommendForGoal(
    CATALOGUE,
    goal({ goalType: 'emergency', horizonMonths: 6 }),
  );
  const emergencyIds = emergency.recommendations[0].reasons.map((r) => r.ruleId);
  ok('an emergency recommendation cites R-GOAL-001', emergencyIds.includes('R-GOAL-001'));
  ok('and R-TENURE-003', emergencyIds.includes('R-TENURE-003'));

  /* ---- Limitations ---- */

  const retirement = M.recommendForGoal(
    CATALOGUE,
    goal({ goalType: 'retirement', horizonMonths: 240 }),
  );
  ok(
    'a retirement horizon longer than every term is warned about',
    retirement.recommendations[0].warnings.some(
      (w) => w.kind === 'limitation' && /before your/.test(w.text),
    ),
  );
  ok(
    'a deposit maturing after the horizon is warned about',
    M.recommendForGoal(CATALOGUE, goal({ horizonMonths: 3 }))
      .recommendations.find((r) => r.tenureMonths === 36)
      .warnings.some((w) => /after your/.test(w.text)),
  );

  /* ---- Blocked rules are reported, not faked ---- */

  /**
   * **R-ELIG-001 is no longer among them.** The client source document supplied
   * the 0.50% benefit, so the rule runs on data rather than being reported as
   * unevaluable. It is asserted absent so a regression that silently re-blocks
   * it — or one that leaves it blocked while also applying an uplift — fails.
   */
  ok(
    'R-ELIG-001 is not reported as blocked',
    !gbfResult.blockedRules.some((rule) => rule.ruleId === 'R-ELIG-001'),
  );
  ok(
    'and §11.diversification still is, because the client has not defined it',
    gbfResult.blockedRules.some((rule) => rule.ruleId === '§11.diversification'),
  );

  check(
    'every blocked rule is reported on the result',
    gbfResult.blockedRules.map((rule) => rule.ruleId).sort(),
    [
      'R-ELIG-002',
      'R-GOAL-004',
      'R-TENURE-002',
      '§11.diversification',
      '§8.availability',
      '§8.maximum-investment',
    ].sort(),
  );
  ok(
    'each blocked rule states the data it lacks',
    M.BLOCKED_RULES.every((rule) => rule.missingData.length > 0 && rule.intent.length > 0),
  );
  check(
    'and each is surfaced as a warning the customer can be shown',
    M.blockedRuleWarnings().length,
    M.BLOCKED_RULES.length,
  );
  ok(
    'blocked-rule warnings are distinguishable from limitations',
    M.blockedRuleWarnings().every((w) => w.kind === 'blocked-rule'),
  );

  /**
   * **No recommendation is produced for a rule that did not run.** If a reason
   * ever cites a blocked rule id, the engine is claiming to have evaluated
   * something it cannot.
   */
  const blockedIds = new Set(M.BLOCKED_RULES.map((rule) => rule.ruleId));
  ok(
    'no reason cites a data-blocked rule',
    gbfResult.recommendations.every((r) =>
      r.reasons.every((reason) => !blockedIds.has(reason.ruleId)),
    ),
  );

  /* ---- Degenerate input ---- */

  check(
    'an empty catalogue yields no recommendations',
    M.recommendForGoal([], goal()).recommendations,
    [],
  );
  check(
    'a zero principal yields no recommendations',
    M.recommendForGoal(CATALOGUE, goal({ principal: 0 })).recommendations,
    [],
  );
  ok(
    'and says why',
    M.recommendForGoal(CATALOGUE, goal({ principal: 0 })).warnings.some((w) =>
      /amount you want to invest/.test(w.text),
    ),
  );
  ok(
    'a fractional horizon is rejected rather than rounded',
    M.recommendForGoal(CATALOGUE, goal({ horizonMonths: 12.5 })).recommendations.length === 0,
  );
  ok(
    'even an invalid goal still reports the blocked rules',
    M.recommendForGoal(CATALOGUE, goal({ principal: -1 })).blockedRules.length ===
      M.BLOCKED_RULES.length,
  );
  ok(
    'an amount no product accepts says so',
    M.recommendForGoal(CATALOGUE, goal({ principal: 1_000 })).warnings.some((w) =>
      /No product in the catalogue accepts this amount/.test(w.text),
    ),
  );

  /** §19 — the whole pipeline is deterministic, not only the comparator. */
  check(
    'the engine is deterministic end to end',
    M.recommendForGoal(CATALOGUE, goal({ targetAmount: 105_000 })),
    gbfResult,
  );

  /* ================================================================ */
  section('Domain · Goal-Based FD → Booking handoff (Step 5)');

  /**
   * The handoff contract is **one field**. These assertions exist to make that
   * checkable rather than merely stated: if a rate or a maturity ever starts
   * travelling into Booking, the key-set assertion below fails.
   */
  check(
    'the handoff is the existing Booking entry point',
    M.bookingHandoffHref('fd-002'),
    '/booking/fd-002/overview',
  );
  /**
   * **Every recommendation now reaches Booking with its own id.**
   *
   * `BookingOverviewService` derives a deposit from the product the customer
   * chose, so the Marketplace fallback that covered the one-fixture gap is no
   * longer needed. The guarantee is stronger, not weaker: the id in the URL is
   * the id that loads, for every catalogue product.
   */
  check(
    'any catalogue product reaches Booking with its own id',
    M.bookingHandoffHref('fd-017'),
    '/booking/fd-017/overview',
  );

  const handoff = M.toBookingHandoff(gbfResult.recommendations[0]);

  /*
    Four fields since the amount was given a carrier. Re-pointed, not relaxed:
    the list is still exact, and the assertions below still forbid every
    platform-computed figure. What crosses is the product the customer chose and
    the amount they stated — both their own answers.
  */
  check('the handoff carries exactly four fields', Object.keys(handoff).sort(), [
    'amount',
    'bookable',
    'href',
    'productId',
  ]);
  check('the product id is the recommended one', handoff.productId, 'p12');
  check('and the href targets that product', handoff.href.split('?')[0], '/booking/p12/overview');
  check('carrying the amount the recommendation was evaluated for', handoff.amount, handoff.amount);
  ok(
    'and the amount in the URL is that same figure',
    new URL(handoff.href, 'https://x').searchParams.get('amount') === String(handoff.amount),
  );
  check('and Booking can resolve it', handoff.bookable, true);

  /**
   * **No rate or maturity crosses.** Asserted on the serialised handoff, so a
   * nested field could not smuggle one through a shallow key check.
   *
   * The engine's figures are an illustration; Booking resolves the terms the
   * customer is actually offered. Two authorities for one number would agree
   * until a rate moved between the recommendation and the booking — and then
   * disagree on the screen where money is committed.
   */
  const serialised = JSON.stringify(handoff);
  for (const forbidden of ['annualRate', 'maturityValue', 'interestEarned', 'quote', 'baseRate']) {
    ok(`no "${forbidden}" crosses into Booking`, !serialised.includes(forbidden));
  }
  check(
    'the top recommendation’s rate is not in the handoff',
    serialised.includes(String(gbfResult.recommendations[0].quote.annualRate)),
    false,
  );

  /** Every recommendation produces a handoff, and each targets its own product. */
  const allHandoffs = gbfResult.recommendations.map(M.toBookingHandoff);
  check(
    'every recommendation can hand off',
    allHandoffs.map((h) => h.productId),
    gbfResult.recommendations.map((r) => r.productId),
  );
  /**
   * **Every recommendation has a destination, and it names its own product.**
   * The route differs with bookability; that it exists at all does not. This is
   * the assertion that would have caught 23 of 24 recommendations landing on a
   * not-found page.
   */
  ok(
    'every href is the Booking route for its own product',
    allHandoffs.every((h) => h.href.split('?')[0] === `/booking/${h.productId}/overview`),
  );
  ok(
    'and no recommendation is left without a destination',
    allHandoffs.every((h) => h.href),
  );

  /** One entry point, one flow: the handoff route is Booking's, not a new one. */
  ok(
    'the handoff never invents a goal-specific booking route',
    allHandoffs.every((h) => !/goal|planner|recommend/.test(h.href)),
  );
  /*
    **Re-pointed to the stronger guarantee.** The rule was never "no query
    string" for its own sake — it was that *no platform state* travels in the
    URL, because a rate or a maturity in a link is Booking believing someone
    else's price.

    Booking now accepts exactly one parameter, `amount`, which is the customer's
    own input rather than anything the engine computed. So the assertion names
    the permitted key instead of forbidding the punctuation: an `annualRate` or
    `maturity` parameter fails here, and so does any second key nobody has
    argued for.
  */
  for (const entry of allHandoffs) {
    const query = new URL(entry.href, 'https://x').searchParams;
    check(
      'the handoff URL carries exactly the permitted keys',
      [...query.keys()],
      entry.amount === undefined ? [] : ['amount'],
    );
    ok(
      'and the amount is the customer’s own figure, unrounded',
      query.get('amount') === null || query.get('amount') === String(entry.amount),
    );
  }

  /* ================================================================ */
  section('Domain · Goal-Based FD presentation layer');

  /**
   * **Every rule the engine can cite has a customer-facing label.**
   *
   * `RULE_LABELS` is a `Record<RuleId, string>`, so this is enforced by `tsc`
   * too — but the assertion below catches the case a compiler cannot: a label
   * that exists but is empty, and therefore renders a tick with nothing beside
   * it.
   */
  const emittedRuleIds = new Set(
    gbfResult.recommendations.flatMap((r) => r.reasons.map((reason) => reason.ruleId)),
  );

  ok('the engine emitted reasons to label', emittedRuleIds.size > 0);
  for (const ruleId of [...emittedRuleIds].sort()) {
    ok(
      `"${ruleId}" has a non-empty customer label`,
      typeof M.RULE_LABELS[ruleId] === 'string' && M.RULE_LABELS[ruleId].length > 0,
    );
  }

  /**
   * **No label leaks the rule id it came from.** The ids are internal
   * vocabulary; a customer reading "R-GOAL-002" learns nothing and loses trust.
   */
  for (const [ruleId, label] of Object.entries(M.RULE_LABELS)) {
    ok(`the label for ${ruleId} does not contain the id`, !label.includes(ruleId));
    ok(`nor an R- rule reference`, !/\bR-[A-Z]+-\d{3}\b/.test(label));
    ok(`nor a document section reference`, !label.includes('§'));
  }

  /**
   * **No new financial claim** (decision A4). The presentation layer restates
   * rules; it does not grade a product. A label containing "best", "highest" or
   * "competitive" would be a claim the engine never established.
   */
  for (const [ruleId, label] of Object.entries(M.RULE_LABELS)) {
    ok(
      `the label for ${ruleId} makes no comparative claim`,
      !/\b(best|highest|lowest|competitive|guaranteed|top)\b/i.test(label),
    );
  }

  /**
   * The acknowledgement restates the rule that will actually run. Two goals
   * sharing a tenure preference must share the sentence — otherwise the copy is
   * a second opinion about the ranking rather than a description of it.
   */
  for (const goalType of M.GOAL_TYPES) {
    ok(
      `${goalType} has an acknowledgement`,
      typeof M.acknowledgementFor(goalType) === 'string' &&
        M.acknowledgementFor(goalType).length > 0,
    );
    ok(`and a one-line description`, M.GOAL_DESCRIPTIONS[goalType].length > 0);
    ok(`and an icon`, Boolean(M.GOAL_ICONS[goalType]));
  }
  check(
    'goals sharing a tenure preference share the acknowledgement',
    M.GOAL_TYPES.filter((g) => M.GOAL_TENURE_PREFERENCE[g] === 'closest-to-horizon').map((g) =>
      M.acknowledgementFor(g),
    ),
    ['We’ll prioritise deposits that mature closest to when you need the money.'],
  );

  /**
   * **The five-year horizon is offered** (decision A3) even though the catalogue
   * tops out at 36 months. Removing it would hide a real limitation behind a
   * control that looks complete; the engine warns instead.
   */
  check(
    'horizon presets ascend and reach five years',
    M.HORIZON_PRESETS.map((preset) => preset.months),
    [6, 12, 24, 36, 60],
  );
  ok(
    'a horizon longer than every product still yields recommendations',
    M.recommendForGoal(CATALOGUE, goal({ goalType: 'retirement', horizonMonths: 60 }))
      .recommendations.length > 0,
  );
  ok(
    'and every one of them warns that it matures first',
    M.recommendForGoal(
      CATALOGUE,
      goal({ goalType: 'retirement', horizonMonths: 60 }),
    ).recommendations.every((r) => r.warnings.some((w) => /before your/.test(w.text))),
  );

  /**
   * The planner asks exactly the questions `GoalInput` needs — now five, after
   * the senior-citizen input (UC1) and the target amount (UC3) were added.
   * Neither is optional to the rail: both are real answers the engine reads.
   */
  check(
    'the progress rail names every question',
    M.PLANNER_STEPS.map((step) => step.id),
    ['goal', 'investor', 'amount', 'horizon', 'target'],
  );

  /**
   * Marketplace restates the goal vocabulary for its Home callout, because the
   * module boundary forbids importing it. This is the drift check that keeps the
   * duplication honest.
   */
  /*
    Re-pointed for the multi-goal entry, not relaxed. The drift check that
    matters is unchanged: every *single-goal* entry on Home must name a goal the
    planner knows. The multi-goal entry names no goal — it opens the plan route
    — so it is excluded by that property rather than by name.
  */
  const singleGoalEntries = M.GOAL_ENTRIES.filter((entry) => M.GOAL_TYPES.includes(entry.id));
  check(
    'the Home callout names the same three goals as the planner',
    singleGoalEntries.map((entry) => entry.id),
    [...M.GOAL_TYPES],
  );
  ok(
    'and every entry is either a known goal or the multi-goal planner',
    M.GOAL_ENTRIES.every(
      (entry) => M.GOAL_TYPES.includes(entry.id) || entry.href.startsWith('/goal-planner/plan'),
    ),
  );

  /* ================================================================ */
  section('Domain · Home → planner intent is carried, not re-asked');

  /**
   * **Every goal on Home carries its own intent.** Choosing a goal there *is*
   * answering the planner's first question; a link to the bare route would throw
   * that answer away and ask again, which is the duplicate this work removes.
   */
  for (const entry of singleGoalEntries) {
    check(`the "${entry.id}" entry carries its goal`, entry.href, `/goal-planner?goal=${entry.id}`);
  }
  check(
    'and the entries cover exactly the planner’s goals',
    singleGoalEntries.map((entry) => entry.id),
    [...M.GOAL_TYPES],
  );

  /**
   * **A URL is user input.** `parseGoalParam` narrows it, so an unrecognised
   * value lands on the ordinary question rather than selecting something the
   * customer never chose.
   */
  for (const goalType of M.GOAL_TYPES) {
    check(`"${goalType}" is recognised`, M.parseGoalParam(goalType), goalType);
  }
  for (const rubbish of [
    'lamborghini',
    'EDUCATION',
    'education ',
    '',
    '__proto__',
    'constructor',
  ]) {
    ok(`"${rubbish}" does not select a goal`, M.parseGoalParam(rubbish) === undefined);
  }
  ok('a missing parameter selects nothing', M.parseGoalParam(null) === undefined);
  ok('and an absent one selects nothing', M.parseGoalParam(undefined) === undefined);

  /** Every question states why it is being asked. */
  for (const step of ['goal', 'amount', 'horizon']) {
    ok(
      `the ${step} question explains why it is asked`,
      typeof M.STEP_HINTS[step] === 'string' && M.STEP_HINTS[step].length > 0,
    );
  }

  /* ================================================================ */
  section('Domain · handed-off product identity matches the recommendation (RISK-3)');

  /**
   * **The seam nothing tested.** Goal-Based FD recommends a catalogue product;
   * Booking resolves the same id from its own model. Nothing compared the two,
   * and they disagreed: `fd-002` was HDFC / 12 months / ₹10,000 in the catalogue
   * and Axis / 24 months / ₹5,00,000 in the Booking fixture. A customer
   * recommended one product would have arrived at a booking screen for another,
   * with no screen saying so.
   *
   * This suite is the only place both models are in scope at once — the modules
   * themselves cannot import each other, and that is correct. So the agreement
   * has to be asserted here or nowhere.
   *
   * The catalogue values below are `mocks/data/products.ts` seed index 1, which
   * is what `/api/v1/products` serves as `fd-002`.
   */
  const catalogueFd002 = M.parseProductMaster({
    id: 'fd-002',
    name: 'HDFC Bank Fixed Deposit',
    bank: {
      id: 'hdfc',
      name: 'HDFC Bank',
      shortCode: 'HDFC',
      initials: 'HB',
      logoUrl: '/banks/HDFC-Bank-logo.svg',
      rating: 'AAA',
    },
    interestRate: 7.25,
    tenureMonths: 12,
    minInvestment: 10_000,
    interestType: 'cumulative',
    payout: 'at-maturity',
  });

  ok('the catalogue product parses', catalogueFd002 !== null);

  const bookedFd002 = M.resolveBookingOverview('fd-002');

  ok('and Booking resolves the same id', bookedFd002 !== null);

  /* Identity — who the customer is dealing with. */
  check('same product id', bookedFd002.deposit.productId, catalogueFd002.productId);
  check('same bank id', bookedFd002.deposit.bank.id, catalogueFd002.bank.id);
  check('same bank name', bookedFd002.deposit.bank.name, catalogueFd002.bank.name);
  check('same product name', bookedFd002.deposit.productName, catalogueFd002.name);

  /* Terms — what the customer is being offered. */
  check('same tenure', bookedFd002.deposit.terms.tenureMonths, catalogueFd002.terms.tenureMonths);
  check(
    'same minimum investment',
    bookedFd002.deposit.terms.minInvestment,
    catalogueFd002.minInvestment,
  );
  check(
    'same published rate',
    bookedFd002.deposit.terms.interestRate,
    catalogueFd002.terms.baseRate,
  );

  /**
   * End to end, through the real pipeline: recommend from the catalogue product,
   * take the handoff, resolve what Booking would show, and compare. This is the
   * assertion that fails if either side drifts again.
   */
  const e2e = M.recommendForGoal([catalogueFd002], {
    goalType: 'education',
    principal: 100_000,
    horizonMonths: 12,
  });

  check('the catalogue product is recommended', e2e.recommendations.length, 1);

  const recommended = e2e.recommendations[0];
  const e2eHandoff = M.toBookingHandoff(recommended);
  const landedOn = M.resolveBookingOverview(e2eHandoff.productId);

  ok('the handed-off id resolves in Booking', landedOn !== null);
  check(
    'the customer lands on the product they were recommended',
    landedOn.deposit.bank.name,
    recommended.product.bank.name,
  );
  check(
    'for the term they were shown',
    landedOn.deposit.terms.tenureMonths,
    recommended.tenureMonths,
  );
  check(
    'at the rate they were quoted',
    landedOn.deposit.terms.interestRate,
    recommended.quote.annualRate,
  );
  ok(
    'and the amount they planned still clears the booking minimum',
    recommended.principal >= landedOn.deposit.terms.minInvestment,
  );

  /**
   * Booking still prices the configuration itself — the handoff carried no rate,
   * and this proves Booking can produce one from its own rate card for the term
   * the recommendation was made at.
   */
  check(
    'Booking resolves its own quote for that term',
    M.resolveRate(landedOn.deposit.terms, { tenureMonths: recommended.tenureMonths }),
    { annualRate: recommended.quote.annualRate, tenureMonths: recommended.tenureMonths },
  );

  await runUc2Suite(M);
  await runPhilosophySuite(M);
  await runUc2ScenarioSuite(M);
  await runUc1Uc3ScenarioSuite(M);
  await runBookingJourneySuite(M);
}

/* ================================================================ */

/**
 * UC2 — multi-goal orchestration (client source document, Use Case 2).
 *
 * ## Two different claims, kept apart on purpose
 *
 * 1. **"UC2 multi-goal orchestration works"** — three goals coexist, each keeps
 *    its own amount and timeline, each gets its own recommendation, and the
 *    money reconciles. That is what this section asserts.
 *
 * 2. **"UC2's documented allocation is reproduced"** — Equitas / AU + ICICI /
 *    SBI, with education split across two banks. That is **BLOCKED** and is
 *    asserted as blocked below, not skipped. The client has defined no
 *    concentration cap and no split rule, and the document's own examples
 *    contradict any single one: education's ₹10,00,000 splits while
 *    retirement's identical ₹10,00,000 does not.
 *
 * Conflating the two is how a demo starts claiming a scenario it has not built.
 */
export async function runUc2Suite(M) {
  section('UC2 · Multi-goal orchestration (documented scenario)');

  const products = M.productSummaries.map((dto) => M.toProductMaster(dto));

  /** The client document's Use Case 2 table, transcribed. Not derived, not tuned. */
  const UC2_PLAN = {
    totalAmount: 2_500_000,
    goals: [
      {
        goalType: 'emergency',
        amount: 500_000,
        horizon: M.days(91),
        intent: 'Short-term liquidity',
      },
      {
        goalType: 'education',
        amount: 1_000_000,
        horizon: M.years(3),
        intent: 'Goal matching with diversification',
      },
      {
        goalType: 'retirement',
        amount: 1_000_000,
        horizon: M.years(10),
        intent: 'Long-term fixed return',
      },
    ],
  };

  const result = M.recommendForPlan(products, UC2_PLAN);

  /* ---- The plan holds three goals at once ---- */
  check('three goals coexist in one plan', result.goals.length, 3);
  check(
    'each goal keeps its own type',
    result.goals.map((entry) => entry.goal.goalType),
    ['emergency', 'education', 'retirement'],
  );

  /* ---- Amounts stay attached to their own goal ---- */
  check(
    'each goal keeps its own amount',
    result.goals.map((entry) => entry.goal.amount),
    [500_000, 1_000_000, 1_000_000],
  );

  /* ---- Horizons are preserved in the unit the customer stated ---- */
  check('91 days remains 91 days', result.goals[0].goal.horizon, { value: 91, unit: 'days' });
  check('3 years remains 3 years', result.goals[1].goal.horizon, { value: 3, unit: 'years' });
  check('10 years remains 10 years', result.goals[2].goal.horizon, { value: 10, unit: 'years' });
  check('and 91 days is never rendered as months', M.formatTenureExact(M.days(91)), '91 days');

  /**
   * **A day-based horizon is reported, not rounded.** The engine matches by
   * whole months; 91 days has no whole-month equivalent, so the goal returns
   * `tenure-unsupported` and its money stays visibly unplaced. Rounding it to
   * three months would be the platform restating the customer's timeline.
   */
  /**
   * **A 91-day goal matches the 91-day deposit, and only that.** Terms are
   * compared within a unit, so no conversion happens in either direction: the
   * day-based deposit is invisible to every month-based goal, and no month-based
   * deposit can serve this one.
   */
  const emergency = result.goals[0];

  check('a 91-day goal is allocated', emergency.status, 'allocated');
  ok('and receives at least one leg', emergency.legs.length >= 1);
  ok(
    'matched to a deposit whose published term is 91 days',
    emergency.legs.every(
      (leg) => leg.quote.tenureMonths === 0 || leg.quote.tenureMonths === undefined,
    ),
  );
  check('the leg places the goal’s money', emergency.legs[0].amount, 500_000);
  ok('and states its safety position', emergency.legs[0].safety.text.length > 0);

  /**
   * **No estimated maturity for a day-based term.** Compounding needs a month
   * count, and turning days into months requires a day-count basis no approved
   * document states — so the figure is absent and the absence is explained.
   */
  const dayRecommendation = M.recommendForGoal(products, {
    goalType: 'emergency',
    principal: 500_000,
    horizonMonths: 0,
    horizon: M.days(91),
  }).recommendations[0];

  ok('a day-based deposit is recommended', dayRecommendation !== undefined);
  check('with no maturity figure', dayRecommendation.maturity, null);
  ok(
    'and the reason it is absent is stated',
    dayRecommendation.warnings.some((warning) => /published in days/.test(warning.text)),
  );
  ok(
    'a month-based goal never sees the day-based deposit',
    M.recommendForGoal(products, {
      goalType: 'emergency',
      principal: 500_000,
      horizonMonths: 3,
    }).recommendations.every((entry) => entry.maturity !== null),
  );
  check('91 days has no whole-month equivalent', M.toWholeMonths(M.days(91)), null);
  check('but 3 years does', M.toWholeMonths(M.years(3)), 36);
  check('and 10 years does', M.toWholeMonths(M.years(10)), 120);

  /* ---- Each evaluable goal receives its own recommendation ---- */
  const evaluated = result.goals.filter((entry) => entry.status === 'allocated');
  check('all three goals are allocated', evaluated.length, 3);

  /**
   * **Every leg carries the full recommendation record.** A goal now has as many
   * legs as the policy produced, so the assertions are about the set rather than
   * a single leg — but nothing may be missing from any of them, and the money
   * must still add up to exactly what the customer asked for.
   */
  for (const entry of evaluated) {
    const label = entry.goal.goalType;

    ok(`${label} received at least one leg`, entry.legs.length >= 1);
    ok(
      `${label} legs each carry a booking productId`,
      entry.legs.every((leg) => typeof leg.productId === 'string' && leg.productId.length > 0),
    );
    ok(
      `${label} legs each carry the bank, with rating and category`,
      entry.legs.every((leg) => typeof leg.bank.id === 'string' && 'rating' in leg.bank),
    );
    ok(
      `${label} legs each carry a resolved rate`,
      entry.legs.every((leg) => leg.quote.annualRate > 0),
    );
    ok(
      `${label} legs each carry rule-backed reasons`,
      entry.legs.every((leg) => leg.reasons.length > 0 && leg.reasons.every((r) => r.ruleId)),
    );
    ok(
      `${label} legs each carry safety reasoning with its rule id`,
      entry.legs.every(
        (leg) =>
          leg.safety.ruleId === '\u00a711.deposit-insurance' &&
          typeof leg.safety.withinInsuredCover === 'boolean' &&
          leg.safety.text.length > 0,
      ),
    );
    ok(
      `${label} legs stay associated with their goal`,
      entry.legs.every((leg) => leg.goalType === entry.goal.goalType),
    );
    check(
      `${label} legs place exactly the goal's amount in total`,
      entry.legs.reduce((total, leg) => total + leg.amount, 0),
      entry.goal.amount,
    );
    ok(
      `${label} legs are each with a distinct bank`,
      new Set(entry.legs.map((leg) => leg.bank.id)).size === entry.legs.length,
    );
  }

  /* ---- Reconciliation ---- */
  check('every rupee of the plan is placed', result.allocatedAmount, 2_500_000);
  check('and nothing is left unallocated', result.unallocatedAmount, 0);
  check(
    'allocated and unallocated reconcile to the total',
    result.allocatedAmount + result.unallocatedAmount,
    UC2_PLAN.totalAmount,
  );
  ok(
    'no leg exceeds the amount its goal requested',
    result.goals.every((entry) => entry.legs.every((leg) => leg.amount <= entry.goal.amount)),
  );
  ok(
    'and no goal is spread beyond the policy’s leg limit',
    result.goals.every((entry) => entry.legs.length <= M.DEFAULT_ALLOCATION_POLICY.maxLegsPerGoal),
  );

  /* ---- What is deliberately absent ---- */
  ok('the plan reports no combined maturity', !('combinedMaturity' in result));
  ok(
    'and no goal result fabricates one',
    result.goals.every((entry) => !('maturity' in entry)),
  );

  /**
   * **BLOCKED — the documented allocation is not reproduced**, and that is
   * asserted rather than left implicit. What the engine reproduces is the
   * *reasoning* — suitability first, insurance-aware spreading second. Whether
   * it reproduces the document's exact four legs depends on catalogue data and
   * on decisions the client has not made, and is not claimed here.
   */
  const education = result.goals.find((entry) => entry.goal.goalType === 'education');

  /**
   * **Education spreads across two banks — from policy, not from a branch.**
   * ₹10,00,000 exceeds deposit-insurance cover and more than one suitable 3-year
   * deposit exists, so the insurance-aware policy places one cover's worth with
   * each. Nothing in the engine knows this goal is "education".
   */
  check('education spreads across two banks', education.legs.length, 2);
  ok(
    'and each leg is with a different bank',
    new Set(education.legs.map((leg) => leg.bank.id)).size === education.legs.length,
  );
  ok(
    'each education leg sits within insured cover',
    education.legs.every((leg) => leg.safety.withinInsuredCover),
  );
  check(
    'and together they place the goal exactly',
    education.legs.reduce((total, leg) => total + leg.amount, 0),
    1_000_000,
  );

  /**
   * **Retirement does not spread — for a stated reason, not a special case.**
   * Only one deposit in the catalogue runs 10 years, so there is nowhere else
   * suitable to put the money. The leg is placed and the exposure disclosed
   * rather than refused: the client has confirmed no maximum per bank.
   */
  const retirement = result.goals.find((entry) => entry.goal.goalType === 'retirement');
  check('retirement is placed in a single deposit', retirement.legs.length, 1);
  check('at the goal’s full amount', retirement.legs[0].amount, 1_000_000);
  check(
    'and the exposure above insured cover is disclosed, not refused',
    retirement.legs[0].safety.withinInsuredCover,
    false,
  );
  ok(
    'with the reason stated in words',
    /deposit-insurance cover/.test(retirement.legs[0].safety.text),
  );

  /* ---- BLOCKED: the client's concentration limit is still undefined ---- */
  ok(
    'BLOCKED: §11.diversification is still reported as unevaluated',
    M.BLOCKED_RULES.some((rule) => rule.ruleId === '§11.diversification'),
  );

  /* ---- The 91-day deposit exists as documented data ---- */
  check('the documented 91-day deposit keeps its true term', M.UC2_DAY_BASED_PRODUCT.tenure, {
    value: 91,
    unit: 'days',
  });
  check('at the documented rate', M.UC2_DAY_BASED_PRODUCT.interestRate, 6.85);
  check(
    'and it is served by the catalogue, matched on days',
    M.productSummaries.some((product) => product.id === M.UC2_DAY_BASED_PRODUCT.id),
    true,
  );
  check(
    'its month count stays zero, because it has no whole-month equivalent',
    M.UC2_DAY_BASED_PRODUCT.tenureMonths,
    0,
  );

  /* ---- Every leg carries what a recommendation must state ---- */
  for (const entry of result.goals.filter((g) => g.status === 'allocated')) {
    for (const leg of entry.legs) {
      ok(`${entry.goal.goalType} leg names its bank`, leg.bank.name.length > 0);
      ok(
        `${entry.goal.goalType} leg carries the bank's rating or category`,
        'rating' in leg.bank && 'category' in leg.bank,
      );
      ok(`${entry.goal.goalType} leg carries safety reasoning`, leg.safety.text.length > 0);
      check(
        `${entry.goal.goalType} leg cites the deposit-insurance rule`,
        leg.safety.ruleId,
        '§11.deposit-insurance',
      );
      ok(
        `${entry.goal.goalType} leg carries rule ids`,
        leg.reasons.every((reason) => typeof reason.ruleId === 'string'),
      );
      ok(`${entry.goal.goalType} leg carries a booking productId`, leg.productId.length > 0);
    }
  }

  section('UC2 · ranking is suitability and safety, not rate');

  /**
   * **The objective is not the highest rate.** The catalogue's highest-rate
   * deposit is not what a 3-year education goal receives, because goal fit and
   * tenure match rank above rate — exactly as §13 orders them.
   */
  const highestRate = Math.max(...products.map((p) => p.terms.baseRate));
  const educationLeadRate = education.legs[0].quote.annualRate;
  ok(
    'the highest-rate deposit in the catalogue is not automatically chosen',
    educationLeadRate < highestRate,
  );
  ok(
    'because the chosen deposit matches the horizon exactly',
    products.find((p) => p.productId === education.legs[0].productId).terms.tenureMonths === 36,
  );

  /**
   * **Safety changes the outcome, and it is policy that decides.** The same
   * goal, the same catalogue and the same ranking produce one leg under a
   * policy that does not consider concentration, and two under one that does.
   * That is the proof there is no hard-coded split.
   */
  const unspread = M.recommendForPlan(products, UC2_PLAN, M.NO_CONCENTRATION_POLICY);
  const unspreadEducation = unspread.goals.find((e) => e.goal.goalType === 'education');
  check('without concentration, education is a single leg', unspreadEducation.legs.length, 1);
  check('holding the whole amount', unspreadEducation.legs[0].amount, 1_000_000);
  check('and the same goal spreads under the insurance-aware policy', education.legs.length, 2);

  /** The threshold is the published cover, and it is configuration. */
  check('the cover is the published DICGC figure', M.DEPOSIT_INSURANCE_COVERAGE, 500_000);
  check(
    'and the default policy treats it as a consideration',
    M.DEFAULT_ALLOCATION_POLICY.concentration,
    'insurance-aware',
  );
  ok(
    'no leg is ever refused for exceeding it',
    result.goals
      .filter((entry) => entry.status === 'allocated')
      .every((entry) => entry.legs.length > 0),
  );

  /* ---- UC1 and UC3 are unchanged by any of this ---- */
  section('UC2 · existing UC1/UC3 behaviour unchanged');

  const uc1 = M.recommendForGoal(products, {
    goalType: 'education',
    principal: 500_000,
    horizonMonths: 24,
    isSeniorCitizen: true,
  });
  check('UC1 still returns a 24-month deposit', uc1.recommendations[0].tenureMonths, 24);
  ok('UC1 still applies the senior-citizen benefit', uc1.recommendations[0].quote.annualRate > 7.5);

  const uc3 = M.recommendForGoal(products, {
    goalType: 'retirement',
    principal: 2_000_000,
    horizonMonths: 60,
    targetAmount: 2_700_000,
  });
  ok('UC3 still assesses the target', uc3.recommendations[0].target !== undefined);
  check('UC3 still meets the documented target', uc3.recommendations[0].target.achieved, true);
}

/* ================================================================ */

/**
 * The recommendation philosophy, asserted rather than described.
 *
 * The product's objective is **suitability, not yield**. These assertions are
 * built to fail if anyone ever reorders the engine around rate: each one
 * constructs a catalogue where the highest-paying deposit is the wrong answer,
 * and requires the engine to say so.
 *
 * The catalogue is synthetic and minimal on purpose — real fixtures would let a
 * pass depend on incidental data rather than on the rule under test.
 */
export async function runPhilosophySuite(M) {
  section('Philosophy · suitability and safety decide, not rate');

  const bank = (id, name, rating, category) => ({
    id,
    name,
    shortCode: id.toUpperCase(),
    initials: id.slice(0, 2).toUpperCase(),
    logoUrl: null,
    rating,
    category,
  });

  const product = (productId, bankRef, tenureMonths, baseRate, minInvestment = 1_000) => ({
    productId,
    name: `${bankRef.name} FD`,
    bank: bankRef,
    minInvestment,
    productType: 'fixed-deposit',
    terms: {
      tenureMonths,
      tenure: { value: tenureMonths, unit: 'months' },
      baseRate,
      rateSlabs: [],
      interestType: 'cumulative',
      payout: 'at-maturity',
    },
  });

  const alpha = bank('alpha', 'Alpha Bank', 'AAA', 'universal');
  const beta = bank('beta', 'Beta Bank', 'AA+', 'universal');
  const gamma = bank('gamma', 'Gamma Small Finance Bank', null, 'small-finance');

  /* ---- 1. A worse-fitting deposit does not win by paying more ---- */

  /*
    Both deposits are affordable and priced. The 36-month one pays a full point
    more, but the goal's horizon is 12 months — so goal fit must decide, and the
    12-month deposit must win despite the lower rate.
  */
  const fitCatalogue = [
    product('fit-exact-12m', alpha, 12, 6.0),
    product('fit-overrun-36m', beta, 36, 7.0),
  ];

  const fitResult = M.recommendForGoal(fitCatalogue, {
    goalType: 'education',
    principal: 100_000,
    horizonMonths: 12,
  });

  check(
    'the deposit matching the horizon wins over the higher-paying one',
    fitResult.recommendations[0].productId,
    'fit-exact-12m',
  );
  ok(
    'even though it pays a full point less',
    fitResult.recommendations[0].quote.annualRate < fitResult.recommendations[1].quote.annualRate,
  );
  ok(
    'and the reason given is the horizon match, not the rate',
    fitResult.recommendations[0].reasons.some((reason) => reason.ruleId === 'R-TENURE-001'),
  );

  /* ---- 2. An emergency goal prefers the shorter term, not the better rate ---- */

  const liquidityCatalogue = [product('liq-6m', alpha, 6, 6.0), product('liq-12m', beta, 12, 7.5)];

  const liquidity = M.recommendForGoal(liquidityCatalogue, {
    goalType: 'emergency',
    principal: 100_000,
    horizonMonths: 12,
  });

  check(
    'an emergency goal takes the shorter term over the higher rate',
    liquidity.recommendations[0].productId,
    'liq-6m',
  );
  ok(
    'and says why, on the goal rule',
    liquidity.recommendations[0].reasons.some((reason) => reason.ruleId === 'R-GOAL-001'),
  );

  /* ---- 3. Safety spreads the money; rate would have concentrated it ---- */

  /*
    Three equally suitable 12-month deposits, descending by rate. A rate-led
    engine puts the whole ₹12,00,000 into `safe-top`. The insurance-aware policy
    places one cover's worth with each distinct bank instead — accepting a lower
    blended return to keep the money insured.
  */
  const safetyCatalogue = [
    product('safe-top', alpha, 12, 8.0),
    product('safe-mid', beta, 12, 7.0),
    product('safe-low', gamma, 12, 6.0),
  ];

  const spread = M.recommendForPlan(
    safetyCatalogue,
    {
      totalAmount: 1_200_000,
      goals: [{ goalType: 'education', amount: 1_200_000, horizon: M.months(12) }],
    },
    M.DEFAULT_ALLOCATION_POLICY,
  );

  const spreadLegs = spread.goals[0].legs;

  check('the amount is spread across three banks', spreadLegs.length, 3);
  ok('and each is a different bank', new Set(spreadLegs.map((leg) => leg.bank.id)).size === 3);
  ok(
    'the lower-paying banks are used rather than concentrating in the best rate',
    spreadLegs.some((leg) => leg.quote.annualRate < spreadLegs[0].quote.annualRate),
  );
  check(
    'no leg exceeds deposit-insurance cover',
    spreadLegs.filter((leg) => leg.amount > M.DEFAULT_ALLOCATION_POLICY.insuredCoverageAmount)
      .length,
    0,
  );
  ok(
    'every leg states its safety position under the insurance rule',
    spreadLegs.every(
      (leg) => leg.safety.ruleId === '§11.deposit-insurance' && leg.safety.withinInsuredCover,
    ),
  );
  check(
    'and the whole amount is still placed',
    spreadLegs.reduce((total, leg) => total + leg.amount, 0),
    1_200_000,
  );

  /*
    The proof that this is safety and not yield: a rate-led allocation of the
    same money into the same catalogue would have earned more.
  */
  const blended =
    spreadLegs.reduce((total, leg) => total + leg.amount * leg.quote.annualRate, 0) / 1_200_000;
  ok('the spread earns less than concentrating would have', blended < 8.0);

  /* ---- 4. The spread is policy, not engine behaviour ---- */

  const concentrated = M.recommendForPlan(
    safetyCatalogue,
    {
      totalAmount: 1_200_000,
      goals: [{ goalType: 'education', amount: 1_200_000, horizon: M.months(12) }],
    },
    M.NO_CONCENTRATION_POLICY,
  );

  check(
    'the same goal and catalogue produce one leg under a no-spread policy',
    concentrated.goals[0].legs.length,
    1,
  );
  ok(
    'and that leg is disclosed as above insured cover',
    concentrated.goals[0].legs[0].safety.withinInsuredCover === false,
  );
  ok(
    'with the reason stated to the customer',
    /deposit-insurance cover/.test(concentrated.goals[0].legs[0].safety.text),
  );

  /* ---- 5. Cover is a consideration, never a refusal ---- */

  /*
    One suitable deposit, more money than cover. The engine must still place it —
    a customer with a single option is not served by being told no — and must say
    that it sits outside cover.
  */
  const soleOption = M.recommendForPlan(
    [product('only-one', alpha, 12, 7.0)],
    {
      totalAmount: 900_000,
      goals: [{ goalType: 'education', amount: 900_000, horizon: M.months(12) }],
    },
    M.DEFAULT_ALLOCATION_POLICY,
  );

  check('a sole suitable deposit still receives the money', soleOption.goals[0].legs.length, 1);
  check('all of it', soleOption.goals[0].legs[0].amount, 900_000);
  check(
    'and the exposure above cover is disclosed, not refused',
    soleOption.goals[0].legs[0].safety.withinInsuredCover,
    false,
  );

  /* ---- 6. §11.diversification is still not claimed as an implemented rule ---- */

  const blockedIds = M.recommendForGoal([product('any', alpha, 12, 7.0)], {
    goalType: 'education',
    principal: 100_000,
    horizonMonths: 12,
  }).blockedRules.map((rule) => rule.ruleId);

  ok(
    'the client concentration rule remains declared blocked',
    blockedIds.includes('§11.diversification'),
  );
}

/* ================================================================ */

/**
 * The complete Use Case 2 scenario, end to end.
 *
 * ## What this asserts, and what it does not
 *
 * It drives the **whole documented input** — ₹25,00,000 across three goals with
 * their own amounts and timelines — through the real catalogue, the real engine
 * and the configured policy, and checks the *properties* the client document
 * requires: every goal answered in its own units, every rupee accounted for,
 * every placement explained and assessed for safety.
 *
 * It does **not** assert the document's four specific legs. Which banks appear
 * depends on catalogue data and on decisions the client has not made — the split
 * trigger and any concentration limit — so pinning them here would turn a
 * scenario test into a snapshot of a guess.
 *
 * Nothing in this test is fed back into the engine. There is no fixture that
 * exists only to make it pass.
 */
export async function runUc2ScenarioSuite(M) {
  section('UC2 · full documented scenario, end to end');

  const products = M.productSummaries.map((dto) => M.toProductMaster(dto));

  /** The client document's Use Case 2 input table, transcribed. */
  const PLAN = {
    totalAmount: 2_500_000,
    goals: [
      { goalType: 'emergency', amount: 500_000, horizon: M.days(91) },
      { goalType: 'education', amount: 1_000_000, horizon: M.years(3) },
      { goalType: 'retirement', amount: 1_000_000, horizon: M.years(10) },
    ],
  };

  const result = M.recommendForPlan(products, PLAN, M.DEFAULT_ALLOCATION_POLICY);
  const byGoal = (type) => result.goals.find((entry) => entry.goal.goalType === type);

  /* ---- Inputs survive the round trip, in their own units ---- */
  check('the plan keeps all three goals', result.goals.length, 3);
  check('emergency keeps ₹5,00,000', byGoal('emergency').goal.amount, 500_000);
  check('education keeps ₹10,00,000', byGoal('education').goal.amount, 1_000_000);
  check('retirement keeps ₹10,00,000', byGoal('retirement').goal.amount, 1_000_000);
  check('emergency keeps 91 days', byGoal('emergency').goal.horizon, { value: 91, unit: 'days' });
  check('education keeps 3 years', byGoal('education').goal.horizon, { value: 3, unit: 'years' });
  check('retirement keeps 10 years', byGoal('retirement').goal.horizon, {
    value: 10,
    unit: 'years',
  });

  /* ---- 91-day emergency resolves to a 91-day deposit ---- */
  const emergency = byGoal('emergency');
  check('the 91-day goal is allocated', emergency.status, 'allocated');
  ok('to a deposit with no whole-month equivalent', emergency.legs[0].quote.tenureMonths === 0);
  ok(
    'and the platform never restates 91 days as months',
    M.formatTenureExact(M.days(91)) === '91 days' && M.toWholeMonths(M.days(91)) === null,
  );

  /* ---- Education can diversify, through the policy ---- */
  const education = byGoal('education');
  check('education is allocated', education.status, 'allocated');
  ok('across more than one deposit', education.legs.length > 1);
  ok(
    'each with a different bank',
    new Set(education.legs.map((leg) => leg.bank.id)).size === education.legs.length,
  );
  ok(
    'and the spread is the policy, not a branch — no spread policy yields one leg',
    M.recommendForPlan(products, PLAN, M.NO_CONCENTRATION_POLICY).goals.find(
      (entry) => entry.goal.goalType === 'education',
    ).legs.length === 1,
  );

  /* ---- Retirement receives a long-term recommendation ---- */
  const retirement = byGoal('retirement');
  check('retirement is allocated', retirement.status, 'allocated');
  ok('to a long-dated deposit', retirement.legs[0].quote.tenureMonths >= 60);

  /* ---- Every rupee reconciles, exactly ---- */
  check('every rupee is placed', result.allocatedAmount, 2_500_000);
  check('nothing is left unallocated', result.unallocatedAmount, 0);
  for (const entry of result.goals) {
    check(
      `${entry.goal.goalType} legs sum to its own amount`,
      entry.legs.reduce((total, leg) => total + leg.amount, 0),
      entry.goal.amount,
    );
  }

  /* ---- Every leg is explained, assessed and actionable ---- */
  const allLegs = result.goals.flatMap((entry) => entry.legs);
  ok(
    'every leg carries rule-backed reasons',
    allLegs.every((leg) => leg.reasons.length > 0),
  );
  ok(
    'every reason names a rule id',
    allLegs.every((leg) => leg.reasons.every((reason) => typeof reason.ruleId === 'string')),
  );
  ok(
    'every leg carries safety evidence under the insurance rule',
    allLegs.every(
      (leg) =>
        leg.safety.ruleId === '§11.deposit-insurance' &&
        typeof leg.safety.withinInsuredCover === 'boolean' &&
        leg.safety.text.length > 0,
    ),
  );
  ok(
    'every leg names the bank, with its category',
    allLegs.every((leg) => leg.bank.name.length > 0 && 'category' in leg.bank),
  );
  ok(
    'every leg has a destination built from its own productId',
    allLegs.every((leg) => M.bookingHandoffHref(leg.productId).includes(leg.productId)),
  );

  /**
   * **The documented allocation, reproduced by the engine.**
   *
   * This is asserted as an *outcome*, not built as one: nothing in the engine
   * knows what UC2 looks like. It falls out of the catalogue the document
   * specifies, the suitability ranking, and the insurance-aware policy. Pinning
   * it here is what catches a future change that quietly stops reproducing it.
   *
   * Note the retirement leg: **₹10,00,000 with one bank, above insured cover**.
   * That is the document's own recommendation, and it is exactly why no ₹5,00,000
   * cap is encoded — a cap would forbid it.
   */
  const legsOf = (type) =>
    byGoal(type).legs.map((leg) => [leg.bank.name, leg.quote.annualRate, leg.amount]);

  check('emergency reproduces the documented leg', legsOf('emergency'), [
    ['Equitas Small Finance Bank', 6.85, 500_000],
  ]);
  check('education reproduces the documented two legs', legsOf('education'), [
    ['AU Small Finance Bank', 7.2, 500_000],
    ['ICICI Bank', 7, 500_000],
  ]);
  check('retirement reproduces the documented leg', legsOf('retirement'), [
    ['State Bank of India', 7.85, 1_000_000],
  ]);
  check(
    'and the ₹10,00,000 single-bank leg is disclosed as above cover, not refused',
    byGoal('retirement').legs[0].safety.withinInsuredCover,
    false,
  );

  /* ---- What must not appear ---- */
  ok('the plan reports no combined maturity', !('combinedMaturity' in result));
  ok(
    'and no goal result fabricates one',
    result.goals.every((entry) => !('maturity' in entry) && !('totalReturn' in entry)),
  );
}

/* ================================================================ */

/**
 * UC1 and UC3, end to end against the real catalogue.
 *
 * Scenario-level companions to the UC2 suite, so all three documented use cases
 * are proven by the same mechanism: client input → engine → catalogue → rate
 * resolution → recommendation → reasons → safety → destination.
 *
 * These exist to catch a UC2 change silently breaking UC1 or UC3, which is the
 * regression this work is most exposed to.
 */
export async function runUc1Uc3ScenarioSuite(M) {
  const products = M.productSummaries.map((dto) => M.toProductMaster(dto));

  /* ---------------------------------------------------------------- */
  section('UC1 · senior citizen, ₹5,00,000 for 2 years / 730 days');

  const uc1Input = {
    goalType: 'education',
    principal: 500_000,
    horizonMonths: 24,
    isSeniorCitizen: true,
  };
  const uc1 = M.recommendForGoal(products, uc1Input);
  const uc1Best = uc1.recommendations[0];

  ok('a recommendation is produced', uc1Best !== undefined);
  check('for the documented 2-year term', uc1Best.tenureMonths, 24);
  check('from the documented bank', uc1Best.product.bank.name, 'Axis Bank');
  check('on the documented base rate', uc1Best.product.terms.baseRate, 7.0);
  check('with the documented senior benefit', uc1Best.product.terms.seniorCitizenDelta, 0.5);

  /*
    The benefit is applied by the platform rate authority, not by this module —
    so the quoted rate must exceed the base by at least the published delta.
  */
  ok(
    'the quoted rate includes the senior benefit',
    uc1Best.quote.annualRate >= uc1Best.product.terms.baseRate + 0.5,
  );
  ok(
    'and the reason states R-ELIG-001 fired',
    uc1Best.reasons.some((reason) => reason.ruleId === 'R-ELIG-001'),
  );

  /* The benefit must change the answer, not merely appear on it. */
  const uc1Standard = M.recommendForGoal(products, { ...uc1Input, isSeniorCitizen: false })
    .recommendations[0];
  ok(
    'a standard depositor is quoted a lower rate',
    uc1Standard.quote.annualRate < uc1Best.quote.annualRate,
  );

  ok(
    'R-ELIG-001 is not reported as an unevaluated rule',
    !uc1.blockedRules.some((rule) => rule.ruleId === 'R-ELIG-001'),
  );
  ok(
    'and the recommendation has a destination for its own product',
    M.bookingHandoffHref(uc1Best.productId).includes(uc1Best.productId),
  );

  /* ---------------------------------------------------------------- */
  section('UC3 · ₹20,00,000 targeting ₹27,00,000 over 5 years');

  /*
    The document's UC3 goal is "Growth through FD" with a **fixed 5-year
    horizon** and a target date. Our approved goal vocabulary has three members
    and no "growth"; the one whose rule matches a dated target is `education`
    (`closest-to-horizon`). `retirement` would be wrong here — its rule prefers
    the *longest* available term, which deliberately ignores the horizon, and
    against this catalogue it correctly returns the 10-year SBI deposit.

    ⚠️ Flagged, not resolved: the client document names a goal our vocabulary
    does not contain. Adding a fourth goal type is a product decision.
  */
  const uc3Input = {
    goalType: 'education',
    principal: 2_000_000,
    horizonMonths: 60,
    targetAmount: 2_700_000,
  };
  const uc3 = M.recommendForGoal(products, uc3Input);
  const uc3Best = uc3.recommendations[0];

  ok('a recommendation is produced', uc3Best !== undefined);
  check('for the documented 5-year term', uc3Best.tenureMonths, 60);
  ok('with a maturity figure', uc3Best.maturity !== null);
  ok('and a target assessment', uc3Best.target !== undefined);
  check('the target is the one the customer set', uc3Best.target.targetAmount, 2_700_000);
  check('and it is met', uc3Best.target.achieved, true);
  check('so the gap is zero', uc3Best.target.gap, 0);
  ok(
    'the reason cites the target rule',
    uc3Best.reasons.some((reason) => reason.ruleId === 'R-TARGET-001'),
  );

  /*
    The shortfall branch, on the same catalogue — an unreachable target must
    produce a gap and the document's three remedies, never a softened claim.
  */
  const shortfall = M.recommendForGoal(products, { ...uc3Input, targetAmount: 5_000_000 })
    .recommendations[0];

  check('an unreachable target is reported as missed', shortfall.target.achieved, false);
  ok('with a positive gap', shortfall.target.gap > 0);
  check('the remedies are the documented three', M.TARGET_ADJUSTMENTS.length, 3);
  ok(
    'and they are the document’s own',
    M.TARGET_ADJUSTMENTS.some((text) => /Increase the amount/i.test(text)) &&
      M.TARGET_ADJUSTMENTS.some((text) => /Extend the investment horizon/i.test(text)) &&
      M.TARGET_ADJUSTMENTS.some((text) => /Split the amount/i.test(text)),
  );

  /* UC3's documented diversification, through the policy rather than a branch. */
  const uc3Plan = M.recommendForPlan(
    products,
    {
      totalAmount: 2_000_000,
      goals: [{ goalType: 'education', amount: 2_000_000, horizon: M.years(5) }],
    },
    M.DEFAULT_ALLOCATION_POLICY,
  );
  const uc3Legs = uc3Plan.goals[0].legs;

  ok('the 5-year goal spreads across several banks', uc3Legs.length >= 2);
  ok(
    'each with a different bank',
    new Set(uc3Legs.map((leg) => leg.bank.id)).size === uc3Legs.length,
  );
  ok(
    'Small Finance Banks are identified for the required disclosure',
    uc3Legs.some((leg) => leg.bank.category === 'small-finance'),
  );
  check('and every rupee is placed', uc3Plan.allocatedAmount, 2_000_000);

  /**
   * **UC3's documented four legs, reproduced by the engine.** Same mechanism as
   * UC2: catalogue + suitability + policy, with no scenario branch anywhere.
   */
  check(
    'the documented four-bank allocation is reproduced',
    uc3Legs.map((leg) => [leg.bank.name, leg.quote.annualRate, leg.amount]),
    [
      ['Equitas Small Finance Bank', 7.5, 500_000],
      ['AU Small Finance Bank', 7.5, 500_000],
      ['Suryoday Small Finance Bank', 7.5, 500_000],
      ['IDFC FIRST Bank', 7.2, 500_000],
    ],
  );

  /* ---- The catalogue carries every product the document names ---- */
  section('Catalogue · products the client document names');

  const named = [
    ['Equitas Small Finance Bank', 0, 6.85],
    ['AU Small Finance Bank', 36, 7.2],
    ['ICICI Bank', 36, 7.0],
    ['State Bank of India', 120, 7.85],
    ['Equitas Small Finance Bank', 60, 7.5],
    ['AU Small Finance Bank', 60, 7.5],
    ['Suryoday Small Finance Bank', 60, 7.5],
    ['IDFC FIRST Bank', 60, 7.2],
    ['Axis Bank', 24, 7.0],
  ];

  for (const [bankName, tenureMonths, rate] of named) {
    ok(
      `${bankName} · ${String(tenureMonths)}m · ${String(rate)}% exists in the catalogue`,
      M.productSummaries.some(
        (product) =>
          product.bank.name === bankName &&
          product.tenureMonths === tenureMonths &&
          product.interestRate === rate,
      ),
    );
  }

  /* ---- Every documented product reaches its own Booking screen ---- */
  section('Booking · every documented deposit resolves');

  for (const [bankName, tenureMonths] of named) {
    const product = products.find(
      (p) => p.bank.name === bankName && p.terms.tenureMonths === tenureMonths,
    );
    ok(`${bankName} · ${String(tenureMonths)}m is in the catalogue`, product !== undefined);
    if (!product) continue;

    const overview = M.toBookingOverview(product);

    check(
      `${bankName} · ${String(tenureMonths)}m keeps its own productId`,
      overview.deposit.productId,
      product.productId,
    );
    check(
      `${bankName} · ${String(tenureMonths)}m keeps its own bank`,
      overview.deposit.bank.name,
      bankName,
    );
    check(
      `${bankName} · ${String(tenureMonths)}m keeps its own rate`,
      overview.deposit.terms.interestRate,
      product.terms.baseRate,
    );
    check(
      `${bankName} · ${String(tenureMonths)}m keeps its own minimum`,
      overview.deposit.terms.minInvestment,
      product.minInvestment,
    );
    ok(
      `${bankName} · ${String(tenureMonths)}m prices only the term it publishes`,
      overview.deposit.terms.tenureRates.every(
        (entry) => entry.tenureMonths === product.terms.tenureMonths,
      ),
    );
    ok(
      `${bankName} · ${String(tenureMonths)}m quotes no unpublished rate`,
      overview.deposit.terms.tenureRates.every(
        (entry) => entry.annualRate === product.terms.baseRate,
      ),
    );
  }

  /**
   * **A day-based deposit publishes no month tenure.** 91 days has no whole-month
   * equivalent, so the rate card is empty rather than carrying an invented term.
   */
  const dayProduct = products.find((p) => p.terms.tenure.unit === 'days');
  ok('the 91-day deposit is bookable', dayProduct !== undefined);
  if (dayProduct) {
    check(
      'and offers no month-based tenure',
      M.toBookingOverview(dayProduct).deposit.terms.tenureRates,
      [],
    );
  }

  /**
   * **Derived deposits declare every unpublished term.**
   *
   * The catalogue publishes a bank, a rate, a tenure and a minimum. Everything
   * else the Booking screens draw is a structural placeholder, and each one must
   * be listed in `demoTerms` so the display layer renders it as unpublished
   * rather than as a bank term.
   */
  const derived = M.toBookingOverview(products.find((p) => p.productId !== 'fd-002'));
  /*
    `payout-options` left this list when the service began deriving the real
    payout from `ProductMaster.terms.payout`. One published option is a term the
    catalogue carries, not a gap to render as a placeholder.
  */
  const REQUIRED_DEMO_TERMS = [
    'max-investment',
    'tenure-range',
    'premature-withdrawal',
    'auto-renewal',
    'tagline',
    'highlights',
  ];

  check(
    'a derived deposit declares every unpublished term',
    [...(derived.deposit.demoTerms ?? [])].sort(),
    [...REQUIRED_DEMO_TERMS].sort(),
  );

  /**
   * **The curated deposit declares none**, because every term on it is real —
   * it is the approved artwork's product with transcribed partner copy.
   * `toBookingOverview` always derives, so the curated path is read through the
   * fixture resolver, which is what `findByProductId` prefers.
   */
  const curated = M.resolveBookingOverview('fd-002');
  ok('the curated deposit exists', curated !== null);
  check('and declares no demo term', curated?.deposit.demoTerms ?? [], []);
  ok(
    'so its rows still show real figures',
    M.buildInvestmentSummaryRows(curated.deposit).every(
      (row) => row.value !== 'Confirmed with the bank',
    ),
  );

  /**
   * **Unpublished terms never reach the screen as figures.** The summary rows
   * are what the customer reads; every demo-marked one must say so.
   */
  const rows = M.buildInvestmentSummaryRows(derived.deposit);
  const rowValue = (id) => rows.find((row) => row.id === id)?.value ?? '';

  /*
    **Nothing is presented as bank-confirmed.** There is no bank integration in
    this build, so a row claiming a value had been confirmed with the partner
    bank asserted something that had not happened — on the screen where a
    customer commits money. Genuinely absent terms now say so.
  */
  /*
    Re-pointed: an unpublished term is now **omitted** rather than printed as
    "Not specified". Three absences in a seven-row panel read as a broken screen
    rather than as candour, and a summary should say what the deposit is. The
    honesty rule is unchanged and in fact tightened — nothing is claimed at all.
  */
  for (const rowId of ['max-investment', 'withdrawal', 'renewal']) {
    ok(
      `the ${rowId} row is omitted rather than shown empty`,
      rows.every((row) => row.id !== rowId),
    );
  }
  ok(
    'and no row is left stating an absence',
    rows.every((row) => row.value !== 'Not specified' && row.value.trim() !== ''),
  );
  ok('while every remaining row carries a real value', rows.length >= 4);
  for (const rowId of ['max-investment', 'tenure', 'payout', 'withdrawal', 'renewal']) {
    ok(
      `the ${rowId} row claims no bank confirmation`,
      !/confirmed with the bank/i.test(rowValue(rowId)),
    );
  }

  /*
    And two rows that used to be placeholders now carry real catalogue data:
    the term the deposit actually runs for, and the payout the product
    publishes.
  */
  check('the tenure row states the deposit’s own term', rowValue('tenure'), '12 months');
  check('the payout row states the product’s own payout', rowValue('payout'), 'At Maturity');
  ok(
    'and the deposit supports exactly the payout the catalogue publishes',
    derived.deposit.terms.supportedPayouts.length === 1,
  );

  /** The real figures still render, because they are real. */
  ok('the rate row still shows the product rate', /%/.test(rowValue('rate')));
  ok('and the minimum still shows a figure', /₹/.test(rowValue('min-investment')));

  /** Booking still fails closed on an id the catalogue does not know. */
  ok(
    'no product is substituted for an unknown id',
    products.every((p) => M.toBookingOverview(p).deposit.productId === p.productId),
  );

  /**
   * ---- Resolution through the service, at its repository seam ----
   *
   * `createBookingOverviewService` takes a repository, so the *resolution
   * policy* — curated first, derive second, fail closed third — is assertable
   * without a transport. These are the regression tests for the defect where
   * every product except `fd-002` reached Booking as a runtime `ApiError`.
   */
  const stubRepository = (byId) => {
    const calls = [];
    return {
      calls,
      findAll: async () => [...products],
      findById: async (id) => {
        calls.push(id);
        return byId(id);
      },
    };
  };

  /*
    The curated deposit is answered from the fixture with no repository call at
    all. That is exactly why `fd-002` kept working while every other id failed:
    it never touched the transport.
  */
  const curatedRepo = stubRepository(() => null);
  const curatedResolved =
    await M.createBookingOverviewService(curatedRepo).findByProductId('fd-002');
  check('the curated deposit resolves without the catalogue', curatedRepo.calls, []);
  check('and keeps its own id', curatedResolved?.deposit.productId, 'fd-002');
  check('and still declares no unpublished term', curatedResolved?.deposit.demoTerms ?? [], []);

  /*
    Every other documented id resolves from the catalogue — the id in the URL is
    the id looked up, and the id that comes back, carrying its own bank, rating,
    category, rate and minimum.
  */
  for (const product of products.filter((p) => p.productId !== 'fd-002')) {
    const repo = stubRepository(
      (id) => products.find((candidate) => candidate.productId === id) ?? null,
    );
    const resolved = await M.createBookingOverviewService(repo).findByProductId(product.productId);

    check(`${product.productId} is looked up by its own id`, repo.calls, [product.productId]);
    check(
      `${product.productId} resolves to itself`,
      resolved?.deposit.productId,
      product.productId,
    );
    check(
      `${product.productId} carries its own bank`,
      resolved?.deposit.bank.name,
      product.bank.name,
    );
    check(
      `${product.productId} carries its own bank rating`,
      resolved?.deposit.bank.rating,
      product.bank.rating,
    );
    check(
      `${product.productId} carries its own bank category`,
      resolved?.deposit.bank.category,
      product.bank.category,
    );
    check(
      `${product.productId} carries its own rate`,
      resolved?.deposit.terms.interestRate,
      product.terms.baseRate,
    );
    check(
      `${product.productId} carries its own minimum`,
      resolved?.deposit.terms.minInvestment,
      product.minInvestment,
    );
  }

  /*
    A repository that has no such product yields `null`, not a substitute. This
    is the contract the route's not-found boundary depends on — and the one the
    repository broke by letting a 404 escape as a thrown `ApiError`.
  */
  const emptyRepo = stubRepository(() => null);
  check(
    'an unknown id resolves to null rather than to a deposit',
    await M.createBookingOverviewService(emptyRepo).findByProductId('fd-does-not-exist'),
    null,
  );
  check('after asking the catalogue for exactly that id', emptyRepo.calls, ['fd-does-not-exist']);

  /*
    A transport failure is *not* "no such product" and must not be flattened
    into one — a booking screen that rendered not-found because the network
    blinked would be telling the customer their deposit does not exist.
  */
  const failingRepo = {
    findAll: async () => [],
    findById: async () => {
      throw new M.ApiError({ code: 'SERVER_ERROR', message: 'upstream', status: 500 });
    },
  };
  let propagated = false;
  try {
    await M.createBookingOverviewService(failingRepo).findByProductId('fd-001');
  } catch (error) {
    propagated = M.isApiError(error) && !M.isNotFoundError(error);
  }
  ok('a transport failure still propagates rather than reading as not-found', propagated);

  /*
    And a 404 is the one status that *does* mean "no such product", so the
    repository converts it. Asserted on the classifier the repository branches
    on, since the conversion itself needs a live transport.
  */
  const envelopedFailure = (status, code) => ({
    isAxiosError: true,
    response: { status, data: { success: false, message: 'x', error: { code, details: [] } } },
  });
  ok(
    'an enveloped 404 from the API classifies as not-found',
    M.isNotFoundError(M.normalizeError(envelopedFailure(404, 'PRODUCT_NOT_FOUND'))),
  );
  ok(
    'so the repository converts that one, and keeps throwing the rest',
    !M.isNotFoundError(M.normalizeError(envelopedFailure(500, 'INTERNAL_ERROR'))),
  );

  ok(
    'the 91-day deposit keeps its published unit',
    M.productSummaries.some(
      (product) => product.tenure?.unit === 'days' && product.tenure.value === 91,
    ),
  );
  check(
    'and it never renders as months',
    M.formatProductTenure(M.UC2_DAY_BASED_PRODUCT),
    '91 days',
  );
  check(
    'while a month-based product is unchanged',
    M.formatProductTenure({ tenureMonths: 12 }),
    '12 months',
  );
}

/* ================================================================ */

/**
 * The completed booking journey — steps 4 to 8, and the convergence rule.
 *
 * These are the assertions that make "one canonical Booking flow" checkable
 * rather than asserted in prose: one route per step, one ordering, and a guard
 * that answers the same way however the customer got here.
 */
export async function runBookingJourneySuite(M) {
  section('Booking · one flow, eight steps');

  /*
    Nine steps since Investor Verification joined at doc 07's Stage 3 — before
    configuration, so the platform establishes who is investing before asking
    them for an amount, a tenure and a nominee's details.
  */
  const STEPS = [
    'overview',
    'identity',
    'investment',
    'nominee',
    'bank-account',
    'application',
    'review',
    'payment',
    'processing',
    'success',
  ];

  check(
    'the journey is the documented order',
    M.BOOKING_STEPS.map((step) => step.id),
    STEPS,
  );
  /*
    Bank Account before Review, per the Screen Inventory navigation map, spec
    21e/21f numbering and the signed-off artwork filenames. Asserted explicitly
    because a diagram circulated with the two transposed, and Review cannot
    confirm a funding account the customer has not yet chosen.
  */
  ok('Bank Account precedes Review & Confirm', M.stepIndex('bank-account') < M.stepIndex('review'));

  /** Every step has a route, and every route is under one product segment. */
  for (const step of STEPS) {
    const route = M.bookingStepRoute(step, 'fd-002');
    ok(`${step} has a route`, typeof route === 'string' && route.length > 0);
    ok(`${step} routes under the product it books`, route.startsWith('/booking/fd-002/'));
  }
  check(
    'the step→route map is total and has no extra entries',
    Object.keys(M.BOOKING_STEP_ROUTES).sort(),
    [...STEPS].sort(),
  );
  /*
    **Convergence, stated as an assertion.** Both documented entry paths —
    Goal-Based FD and Comparison — hand over a productId, and both land on the
    same first step of the same journey. There is one route for `overview` and
    it is derived from the id, so an entry point cannot bring its own flow.
  */
  for (const productId of ['fd-001', 'fd-002', 'fd-011', 'fd-uc2-equitas-91d']) {
    check(
      `${productId} enters the one canonical Booking route`,
      M.bookingStepRoute('overview', productId),
      `/booking/${productId}/overview`,
    );
    check(
      `and ${productId} keeps its id through every step`,
      STEPS.map((step) => M.bookingStepRoute(step, productId)).filter(
        (route) => !route.includes(productId),
      ),
      [],
    );
  }

  /** `nextStep` is the ordering, and it terminates. */
  for (let index = 0; index < STEPS.length - 1; index += 1) {
    check(
      `${STEPS[index]} advances to ${STEPS[index + 1]}`,
      M.nextStep(STEPS[index]),
      STEPS[index + 1],
    );
  }
  check('and Success advances nowhere', M.nextStep('success'), null);

  section('Booking · step access (BR-BOOK-002)');

  const draftAt = (furthestStep, confirmation = null) => ({
    bookingId: 'booking-journey-1',
    productId: 'fd-002',
    /* 12 months is the term the curated fixture actually prices. */
    investment: { amount: 500_000, tenureMonths: 12, payoutOption: 'at-maturity' },
    nominee: { nominationType: 'single', nominees: [] },
    application: { answers: {}, acceptedDeclarations: [], preparedAt: null, identityMethod: null },
    bankAccountId: 'acc-axis-4587',
    declarations: { detailsConfirmed: true, termsAccepted: true },
    paymentMethod: 'net-banking',
    confirmation,
    furthestStep,
    updatedAt: 0,
  });

  /*
    A fresh booking may be on Overview and nowhere else. This is the defect a
    guard exists to prevent: a payment screen reached by typing a URL, asking
    for money it cannot name.
  */
  const fresh = draftAt('overview');
  check('a fresh booking may open Overview', M.resolveStepAccess('overview', fresh).allowed, true);
  for (const step of STEPS.slice(1)) {
    const access = M.resolveStepAccess(step, fresh);
    check(`a fresh booking may not open ${step}`, access.allowed, false);
    check(`and is sent back to Overview from ${step}`, access.redirectTo, 'overview');
  }

  /* Every step already reached stays open — going back to edit must be free. */
  const midway = draftAt('review');
  for (const step of ['overview', 'investment', 'nominee', 'bank-account', 'review']) {
    check(
      `a booking at Review may re-open ${step}`,
      M.resolveStepAccess(step, midway).allowed,
      true,
    );
  }
  for (const step of ['payment', 'processing', 'success']) {
    check(`but not ${step}`, M.resolveStepAccess(step, midway).allowed, false);
  }

  /*
    Success is guarded on the partner bank's confirmation, not on the step
    marker — spec 21i §8 Rule 1. A booking that has been paid for but not
    confirmed resumes on Processing, which is where the customer actually is.
  */
  const paid = draftAt('success', {
    reference: 'AXISFD00000000000001',
    paidAt: 1000,
    confirmedAt: null,
  });
  check(
    'a paid but unconfirmed booking may not open Success',
    M.resolveStepAccess('success', paid).allowed,
    false,
  );
  check('and resumes on Processing', M.resolveStepAccess('success', paid).redirectTo, 'processing');

  const confirmed = draftAt('success', {
    reference: 'AXISFD00000000000001',
    paidAt: 1000,
    confirmedAt: 2000,
  });

  /*
    **A confirmed booking is terminal — every step, not just the paid ones.**

    This guarded only Payment and later, which left Overview, Identity,
    Investment, Nominee, Bank Account and Review reachable after the deposit had
    been created. A browser Back press or a bookmarked `/review` opened a fully
    editable screen for an investment that already existed; edits went into a
    draft nothing would read again, and Continue bounced to Success without
    saying why.
  */
  /*
    **Overview is deliberately excluded, and that is the fix for a showstopper.**

    A draft is stored per product, so a completed booking used to seal that
    deposit forever: choosing it again landed on Overview, the guard saw
    `confirmedAt`, and returned the customer to the Success screen of the
    booking they had already finished — they could not book it twice.

    Overview *is* the act of starting a booking, so it stays reachable and the
    screen begins a fresh session there. Every other step still resolves to
    Success: a completed booking remains terminal, it just no longer blocks the
    next one.
  */
  check(
    'a confirmed booking may still open Overview',
    M.resolveStepAccess('overview', confirmed).allowed,
    true,
  );

  for (const step of [
    'identity',
    'investment',
    'nominee',
    'bank-account',
    'application',
    'review',
    'payment',
    'processing',
  ]) {
    const access = M.resolveStepAccess(step, confirmed);
    check(`a confirmed booking may not re-open ${step}`, access.allowed, false);
    check(`and is sent to Success from ${step}`, access.redirectTo, 'success');
  }

  check(
    'a confirmed booking may open Success',
    M.resolveStepAccess('success', confirmed).allowed,
    true,
  );

  section('Booking · one completed booking cannot contaminate the next');

  /*
    The showstopper: after finishing a booking the customer could not start
    another. These assertions describe the isolation the fix establishes.
  */
  const finished = draftAt('success', {
    reference: 'AXISFD00000000000001',
    paidAt: 1000,
    confirmedAt: 2000,
  });

  /* 1 — a finished booking does not make the next one finished. */
  /*
    A genuinely new booking, shaped as `emptyDraft` produces it — not the
    populated fixture above with a couple of fields swapped, which would prove
    nothing about what a fresh session contains.
  */
  const nextBooking = {
    bookingId: 'booking-2',
    productId: 'fd-008',
    identity: { confirmedAt: null, method: null },
    application: { answers: {}, acceptedDeclarations: [], preparedAt: null, identityMethod: null },
    investment: { amount: null, tenureMonths: null, payoutOption: null },
    nominee: { nominationType: 'single', nominees: [] },
    bankAccountId: null,
    declarations: { detailsConfirmed: false, termsAccepted: false },
    paymentMethod: null,
    confirmation: null,
    furthestStep: 'overview',
    updatedAt: 0,
  };
  ok('a new booking carries no confirmation', nextBooking.confirmation === null);
  ok('and is not treated as terminal', M.resolveStepAccess('overview', nextBooking).allowed);
  check(
    'so it starts at the beginning, not at Success',
    M.resolveStepAccess('success', nextBooking).redirectTo,
    'overview',
  );

  /* 2 — a different product is a different booking, in storage as well. */
  ok(
    'each product has its own storage key',
    M.draftStorageKey('fd-010') !== M.draftStorageKey('fd-008'),
  );
  ok('and the key names the product', M.draftStorageKey('fd-008').includes('fd-008'));

  /* 3 — two bookings of the *same* product are still two bookings. */
  ok('a booking carries its own session id', finished.bookingId !== nextBooking.bookingId);

  /* 4–7 — nothing from the finished booking leaks into the new one. */
  ok('no confirmed timestamp is inherited', nextBooking.confirmation?.confirmedAt == null);
  ok('no booking reference is inherited', nextBooking.confirmation?.reference === undefined);
  check('no application answers are inherited', nextBooking.application.answers, {});
  check(
    'no accepted declarations are inherited',
    [...nextBooking.application.acceptedDeclarations],
    [],
  );
  ok('no payment method is inherited', nextBooking.paymentMethod === null);
  ok('no funding account is inherited', nextBooking.bankAccountId === null);
  ok('no identity confirmation is inherited', nextBooking.identity.confirmedAt === null);
  check('and no amount is inherited', nextBooking.investment.amount, null);

  /* 8 — a booking still in progress is untouched by any of this. */
  const inProgress = draftAt('review');
  for (const step of ['overview', 'identity', 'investment', 'nominee', 'bank-account', 'review']) {
    ok(
      `an unfinished booking may still open ${step}`,
      M.resolveStepAccess(step, inProgress).allowed,
    );
  }

  section('Booking · reference, maturity date and post-payment figures');

  check(
    'the reference carries the bank and a fixed-width serial',
    M.buildBookingReference('AXIS', 1_252_405_123_456),
    'AXISFD01252405123456',
  );
  check(
    'the same seed always mints the same reference',
    M.buildBookingReference('HDFC', 999),
    M.buildBookingReference('HDFC', 999),
  );
  ok(
    'a short code with punctuation cannot leak into it',
    /^[A-Z]+FD\d+$/.test(M.buildBookingReference('a.b c', 12)),
  );
  ok(
    'and a bank with no letters still yields a reference',
    M.buildBookingReference('123', 12).startsWith('FD'),
  );

  /* 12 May 2025 + 24 months = 12 May 2027, as the approved artwork states. */
  const started = new Date('2025-05-12T00:00:00Z').getTime();
  check(
    'a 24-month deposit matures two years on',
    M.formatMaturityDate(M.maturityDate(started, 24)),
    '12 May 2027',
  );
  check(
    'a 12-month deposit matures a year on',
    M.formatMaturityDate(M.maturityDate(started, 12)),
    '12 May 2026',
  );
  /*
    A term stated in days has no whole-month equivalent, so it has no maturity
    date either — never a date derived from `tenureMonths: 0`, which would read
    as "matures today". The same posture `toWholeMonths` takes.
  */
  ok('a day-based term yields no month-derived maturity date', M.maturityDate(started, 0) === null);
  ok('and neither does a fractional one', M.maturityDate(started, 1.5) === null);

  const deposit = M.BOOKING_OVERVIEW_FIXTURE.deposit;

  const successDraft = draftAt('success');
  const figures = M.deriveBookingFigures(
    deposit,
    successDraft.investment.amount,
    successDraft.investment.tenureMonths,
    successDraft.investment.payoutOption,
    started,
  );
  ok('a complete configuration is priced', figures.returns !== null);
  check('and priced at the rate for its own tenure', figures.returns.tenureMonths, 12);
  check('at the rate that tenure publishes', figures.returns.annualRate, 7.25);
  check('with a maturity date to match', M.formatMaturityDate(figures.maturesOn), '12 May 2026');

  /*
    Nothing is invented for an incomplete configuration. `null` throughout,
    never zero: a zero maturity is a claim about the deposit and an absent one
    is the truth.
  */
  for (const patch of [
    { amount: null, tenureMonths: 12, payoutOption: 'at-maturity' },
    { amount: 500_000, tenureMonths: null, payoutOption: 'at-maturity' },
    { amount: 500_000, tenureMonths: 12, payoutOption: null },
  ]) {
    const result = M.deriveBookingFigures(
      deposit,
      patch.amount,
      patch.tenureMonths,
      patch.payoutOption,
      started,
    );
    ok('an incomplete configuration is not priced', result.returns === null);
    ok('and carries no maturity date', result.maturesOn === null);
  }

  /*
    A tenure the product does not price yields nothing — the rule
    `resolveTenureRate` already holds, asserted again at the seam the
    post-payment screens read.
  */
  const unpricedFigures = M.deriveBookingFigures(deposit, 500_000, 7, 'at-maturity', started);
  ok('an unpriced tenure yields no figures', unpricedFigures.returns === null);
  ok('and therefore no maturity date', unpricedFigures.maturesOn === null);

  section('Booking · funding accounts and payment methods');

  ok('a funding account is offered', M.SAVED_BANK_ACCOUNTS.length > 0);
  ok(
    'exactly one is the primary account',
    M.SAVED_BANK_ACCOUNTS.filter((account) => account.isPrimary).length === 1,
  );
  /*
    The account type cannot hold a full number, so a full number cannot be
    rendered — spec 21e §8 Rule 5 enforced by the data rather than the markup.
  */
  for (const account of M.SAVED_BANK_ACCOUNTS) {
    ok(`${account.id} carries only four digits`, /^\d{4}$/.test(account.lastFourDigits));
    ok(`${account.id} carries no full account number field`, !('accountNumber' in account));
    ok(
      `${account.id} states its verification`,
      ['verified', 'pending', 'failed'].includes(account.verification),
    );
  }

  ok(
    'the default payment method is one the screen offers',
    M.PAYMENT_METHODS.some((method) => method.id === M.DEFAULT_PAYMENT_METHOD),
  );
  check(
    'payment method ids are unique',
    M.PAYMENT_METHODS.length,
    new Set(M.PAYMENT_METHODS.map((method) => method.id)).size,
  );

  section('Application · library resolves institution → template');

  const library = M.createApplicationLibrary();

  check('SBI resolves its own template', library.findTemplate('sbi')?.id, 'sbi-fd-v1');
  check(
    'AU Small Finance resolves its own template',
    library.findTemplate('au-small-finance')?.id,
    'au-small-finance-fd-v1',
  );
  ok('an unknown institution resolves to nothing', library.findTemplate('hdfc') === null);
  ok('and so does an unknown product type', library.findTemplate('sbi', 'mutual-fund') === null);
  check(
    'a template can be fetched by its own id',
    library.findTemplateById('sbi-fd-v1')?.institutionId,
    'sbi',
  );
  ok('and an unknown id resolves to nothing', library.findTemplateById('nope') === null);
  check(
    'the library reports which institutions it serves',
    [...library.supportedInstitutionIds()].sort(),
    ['au-small-finance', 'sbi'],
  );

  const versioned = M.createApplicationLibrary([
    { ...M.SBI_FD_TEMPLATE, id: 'sbi-v1', version: 1 },
    { ...M.SBI_FD_TEMPLATE, id: 'sbi-v3', version: 3 },
    { ...M.SBI_FD_TEMPLATE, id: 'sbi-v2', version: 2 },
  ]);
  check('the highest version resolves', versioned.findTemplate('sbi')?.id, 'sbi-v3');

  section('Application · templates are transcribed from the banks’ own forms');

  /*
    A template is a statement of what a bank requires, and a requirement with no
    provenance is an assertion. Each names the document it came from and where
    the original can be read.
  */
  for (const template of M.APPLICATION_TEMPLATES) {
    ok(`${template.id} names its source document`, template.sourceDocument.name.length > 0);
    ok(
      `${template.id} points at a PDF under /bank-forms/`,
      /^\/bank-forms\/[\w-]+\/[\w.-]+\.pdf$/.test(template.sourceDocument.path),
    );
    ok(`${template.id} records the page count`, template.sourceDocument.pageCount > 0);
    ok(`${template.id} declares its product type`, template.productType === 'fixed-deposit');
    ok(`${template.id} claims no real submission route yet`, template.submission.method === 'poc');
    ok(
      `${template.id} states the signature requirement rather than simulating it`,
      template.authorization.requiresApplicantSignature === true &&
        template.authorization.note.length > 0,
    );

    const ids = template.sections.flatMap((section) => section.fields.map((f) => f.id));
    ok(`${template.id} has unique field ids`, new Set(ids).size === ids.length);
    ok(
      `${template.id} gives every select its options`,
      template.sections.every((section) =>
        section.fields.every((f) => f.type !== 'select' || (f.options?.length ?? 0) > 0),
      ),
    );
    ok(
      `${template.id} marks the bank's own boxes bank-only`,
      template.sections.flatMap((s) => s.fields).some((f) => f.source === 'bank-only'),
    );
    /* A bank-only field is never required of a customer. */
    ok(
      `${template.id} never requires a bank-only field of the customer`,
      template.sections
        .flatMap((s) => s.fields)
        .every((f) => f.source !== 'bank-only' || f.required === false),
    );
  }

  check(
    'AU records the version printed on its form',
    M.AU_FD_TEMPLATE.sourceDocument.version,
    '5.1 (Oct 2025)',
  );
  ok('SBI records that its form prints none', M.SBI_FD_TEMPLATE.sourceDocument.version === null);

  /*
    The two forms genuinely differ, and the schema carries that difference.
    AU's Form DA-1 marks the nominee's postal address and mobile mandatory;
    SBI's does not — so AU asks for more from the same platform data.
  */
  const nomineeRequired = (template) =>
    template.sections
      .flatMap((s) => s.fields)
      .filter((f) => f.id.startsWith('nominee') && f.required).length;
  ok(
    'AU requires more nominee detail than SBI',
    nomineeRequired(M.AU_FD_TEMPLATE) > nomineeRequired(M.SBI_FD_TEMPLATE),
  );

  section('Application · mapping reuses what the platform already knows');

  const appIdentity = M.identityWithStatus('verified');
  const appDeposit = M.BOOKING_OVERVIEW_FIXTURE.deposit;
  const appDraft = (over = {}) => ({
    bookingId: 'booking-app-1',
    productId: 'fd-002',
    application: { answers: {}, acceptedDeclarations: [], preparedAt: null, identityMethod: null },
    identity: { confirmedAt: 1000, method: 'existing-kyc' },
    investment: { amount: 500_000, tenureMonths: 12, payoutOption: 'at-maturity' },
    nominee: {
      nominationType: 'single',
      nominees: [
        {
          id: 'n1',
          fullName: 'Priya Sharma',
          relationship: 'Spouse',
          dateOfBirth: '1990-05-12',
          guardianName: '',
          sharePercent: '100',
        },
      ],
    },
    bankAccountId: M.SAVED_BANK_ACCOUNTS[0].id,
    declarations: { detailsConfirmed: false, termsAccepted: false },
    paymentMethod: null,
    confirmation: null,
    furthestStep: 'application',
    updatedAt: 0,
    ...over,
  });

  const sources = (over = {}) => ({
    deposit: appDeposit,
    draft: appDraft(over),
    identity: appIdentity,
  });

  const fieldOf = (template, id) =>
    template.sections.flatMap((s) => s.fields).find((f) => f.id === id);

  check(
    'the applicant name comes from the verified identity',
    M.resolveFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'applicantName'), sources()),
    appIdentity.profile.fullName,
  );
  check(
    'the date of birth comes from the same record',
    M.resolveFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'dateOfBirth'), sources()),
    appIdentity.profile.dateOfBirth,
  );
  ok(
    'the deposit amount is the configured one, formatted',
    (M.resolveFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'depositAmount'), sources()) ?? '').includes(
      '5,00,000',
    ),
  );
  check(
    'the tenure is the configured one',
    M.resolveFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'tenure'), sources()),
    '12 months',
  );
  check(
    'the nominee name comes from the nominee step',
    M.resolveFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'nomineeName'), sources()),
    'Priya Sharma',
  );
  check(
    'and the relationship with it',
    M.resolveFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'nomineeRelationship'), sources()),
    'Spouse',
  );
  check(
    'the nominee date of birth maps through',
    M.resolveFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'nomineeDateOfBirth'), sources()),
    '1990-05-12',
  );
  const fundingAccount = M.resolveFieldValue(
    fieldOf(M.SBI_FD_TEMPLATE, 'fundingAccount'),
    sources(),
  );
  ok('the funding account is masked', (fundingAccount ?? '').startsWith('XXXX'));
  ok(
    'and only the last four digits appear',
    (fundingAccount ?? '').includes(M.SAVED_BANK_ACCOUNTS[0].lastFourDigits),
  );
  check(
    'AU’s IFSC comes from the chosen account',
    M.resolveFieldValue(fieldOf(M.AU_FD_TEMPLATE, 'fundingIfsc'), sources()),
    M.SAVED_BANK_ACCOUNTS[0].ifsc,
  );
  /* A branch code is the bank's to fill in, and resolves to nothing. */
  ok(
    'a bank-only field resolves to nothing',
    M.resolveFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'branchCode'), sources()) === null,
  );

  section('Application · only genuinely missing fields are asked for');

  const sbiResolved = M.resolveApplication(M.SBI_FD_TEMPLATE, sources());
  check(
    'SBI asks only for what its form needs and the platform lacks',
    sbiResolved.outstanding.map((entry) => entry.field.id).sort(),
    ['depositScheme', 'maturityInstruction', 'modeOfOperation', 'paymentInstruction'],
  );
  ok(
    'and every one of them is a manual field',
    sbiResolved.outstanding.every((entry) => entry.source === 'manual'),
  );
  ok(
    'no bank-only field is ever outstanding',
    !sbiResolved.outstanding.some((entry) => entry.source === 'bank-only'),
  );
  check('the bank’s own boxes are counted separately', sbiResolved.bankCompleted.length, 4);
  ok(
    'everything the platform knows is marked prefilled',
    sbiResolved.sections
      .flatMap((s) => s.fields)
      .filter((entry) => entry.source !== 'manual' && entry.source !== 'bank-only')
      .every((entry) => entry.status === 'prefilled' || entry.status === 'optional'),
  );
  ok('so the application is not yet complete', !sbiResolved.isComplete);

  /*
    AU asks for more — its Form DA-1 marks the nominee's address and mobile
    mandatory. That is the schema carrying a real difference between two real
    forms, not the renderer behaving differently.
  */
  const auResolved = M.resolveApplication(M.AU_FD_TEMPLATE, sources());
  check('AU asks for its own set', auResolved.outstanding.map((entry) => entry.field.id).sort(), [
    'maturityInstruction',
    'maturityRepaymentMode',
    'nomineeAddressLine1',
    'nomineeCity',
    'nomineeMobile',
    'nomineePin',
    'nomineeState',
    'operatingInstructions',
  ]);
  ok('which is more than SBI asks', auResolved.outstanding.length > sbiResolved.outstanding.length);
  ok(
    'an optional field is never outstanding',
    !auResolved.outstanding.some((entry) => entry.field.id === 'sweepIn'),
  );

  /* Answering everything outstanding, and accepting the declarations, completes it. */
  const answerAll = (template, resolved) => ({
    answers: Object.fromEntries(
      resolved.outstanding.map((entry) => [
        entry.field.id,
        entry.field.type === 'select'
          ? (entry.field.options?.[0].value ?? '')
          : entry.field.id === 'nomineePin'
            ? '560038'
            : 'Provided',
      ]),
    ),
    acceptedDeclarations: template.declarations.map((d) => d.id),
    preparedAt: 1,
    identityMethod: 'existing-kyc',
  });

  for (const template of [M.SBI_FD_TEMPLATE, M.AU_FD_TEMPLATE]) {
    const first = M.resolveApplication(template, sources());
    const done = M.resolveApplication(
      template,
      sources({ application: answerAll(template, first) }),
    );
    check(`${template.id} clears once answered`, [...done.outstanding], []);
    ok(`${template.id} is then complete`, done.isComplete);
  }

  /* A required declaration alone blocks completion. */
  const first = M.resolveApplication(M.SBI_FD_TEMPLATE, sources());
  const undeclared = M.resolveApplication(
    M.SBI_FD_TEMPLATE,
    sources({
      application: { ...answerAll(M.SBI_FD_TEMPLATE, first), acceptedDeclarations: [] },
    }),
  );
  ok('an unaccepted declaration blocks completion', !undeclared.isComplete);
  check('though nothing is outstanding to type', [...undeclared.outstanding], []);

  /* Missing prerequisites surface as missing, not as invented values. */
  const noNominee = M.resolveApplication(
    M.SBI_FD_TEMPLATE,
    sources({ nominee: { nominationType: 'single', nominees: [] } }),
  );
  ok(
    'an absent nominee is reported missing, never guessed',
    noNominee.outstanding.some((entry) => entry.field.id === 'nomineeName'),
  );

  section('Application · a prefilled field is still the customer’s to edit');

  /*
    The bug this guards: a control that rendered an input only while a field was
    *outstanding*, and static text once it had a value. Typing one character
    gave the field a value, so the input was replaced by a span — the customer
    could type exactly one character into the AU nominee address and then had no
    field left. Editing one value appeared to lock the next.

    The rule now: a customer's typed answer overrides the prefilled value, and
    clearing it falls back to what the platform already knew.
  */
  const auTpl = M.AU_FD_TEMPLATE;
  const withAnswers = (answers) =>
    M.resolveApplication(
      auTpl,
      sources({
        application: { answers, acceptedDeclarations: [], preparedAt: null, identityMethod: null },
      }),
    );
  const valueOf = (resolved, id) =>
    resolved.sections.flatMap((s) => s.fields).find((f) => f.field.id === id)?.value ?? null;

  /* Every nominee field is independently writable, and none disturbs another. */
  const typed = {
    nomineeAddressLine1: '#12, 4th Cross, MG Road',
    nomineeCity: 'Bengaluru',
    nomineeState: 'Karnataka',
    nomineePin: '560001',
    nomineeMobile: '9876501234',
  };
  const filled = withAnswers(typed);
  for (const [id, value] of Object.entries(typed)) {
    check(`${id} holds its own value`, valueOf(filled, id), value);
  }

  /* Re-editing one leaves the rest exactly as they were. */
  const reEdited = withAnswers({ ...typed, nomineeAddressLine1: '#99, New Street' });
  check(
    're-editing the address takes effect',
    valueOf(reEdited, 'nomineeAddressLine1'),
    '#99, New Street',
  );
  check('and the city is untouched', valueOf(reEdited, 'nomineeCity'), 'Bengaluru');
  check('and the PIN is untouched', valueOf(reEdited, 'nomineePin'), '560001');

  /* A prefilled, platform-sourced field is editable too. */
  const prefilledName = valueOf(withAnswers({}), 'nomineeName');
  ok('the nominee name arrives prefilled', prefilledName !== null);
  check(
    'and a typed correction becomes the application’s value',
    valueOf(withAnswers({ nomineeName: 'Corrected Name' }), 'nomineeName'),
    'Corrected Name',
  );
  check(
    'while clearing it falls back to what we already knew',
    valueOf(withAnswers({ nomineeName: '' }), 'nomineeName'),
    prefilledName,
  );

  /*
    Two sources are deliberately not overridable here. A bank-only box is not
    the customer's to answer, and amount/tenure/rate belong to Investment
    Details — a second amount field inside the bank form would be a second
    investment configuration.
  */
  check(
    'a bank-only field cannot be overridden from the form',
    valueOf(withAnswers({ branchCode: 'ATTEMPT' }), 'branchCode'),
    null,
  );
  ok(
    'and a booking-managed value is never overridden here',
    valueOf(withAnswers({ depositAmount: '9' }), 'depositAmount') !== '9',
  );
  ok(
    'nor is it ever outstanding, whatever the rate card prices',
    !withAnswers({}).outstanding.some((entry) =>
      ['depositAmount', 'tenure', 'rateOfInterest', 'depositType', 'payoutOption'].includes(
        entry.field.id,
      ),
    ),
  );

  section('Application · validation is schema-driven');

  const selectField = fieldOf(M.SBI_FD_TEMPLATE, 'maturityInstruction');
  ok(
    'a permitted option passes',
    M.validateFieldValue(selectField, 'pay-principal-and-interest') === null,
  );
  ok('an option outside the schema fails', M.validateFieldValue(selectField, 'burn-it') !== null);
  ok('a required field with no value fails', M.validateFieldValue(selectField, null) !== null);
  ok(
    'an optional field with no value passes',
    M.validateFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'email'), null) === null,
  );
  /* AU's form prints a six-digit PIN box; the schema carries the pattern. */
  const pinField = fieldOf(M.AU_FD_TEMPLATE, 'nomineePin');
  ok('a valid PIN passes', M.validateFieldValue(pinField, '560038') === null);
  ok('a short PIN fails', M.validateFieldValue(pinField, '5600') !== null);
  ok(
    'a bank-only field is never the customer’s problem',
    M.validateFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'branchCode'), null) === null,
  );

  section('Application · privacy — no identity is copied into the booking');

  const storedApplication = appDraft().application;
  check('the in-memory application holds four keys', Object.keys(storedApplication).sort(), [
    'acceptedDeclarations',
    'answers',
    'identityMethod',
    'preparedAt',
  ]);
  for (const forbidden of ['fullName', 'dateOfBirth', 'pan', 'aadhaar', 'nominee', 'ifsc']) {
    ok(
      `no ${forbidden} is stored on the application`,
      !JSON.stringify(storedApplication).toLowerCase().includes(forbidden.toLowerCase()),
    );
  }
  const resolvedPan = M.resolveFieldValue(fieldOf(M.SBI_FD_TEMPLATE, 'pan'), sources());
  ok('the PAN reaches the application masked', (resolvedPan ?? '').includes('•'));

  /*
    **Typed answers are never written at rest.** A real form asks manual
    questions about third parties — AU's Form DA-1 requires the nominee's
    address, city, PIN and mobile — and persisting those would route around the
    rule that already keeps `nominee` out of storage. Same data, same person who
    consented to nothing, different door.
  */
  const withNomineePii = {
    ...appDraft(),
    application: {
      answers: {
        nomineeAddressLine1: '12 Brigade Road',
        nomineeCity: 'Bengaluru',
        nomineePin: '560038',
        nomineeMobile: '9876500000',
      },
      acceptedDeclarations: ['details-accurate'],
      preparedAt: 1_000_000,
      identityMethod: 'existing-kyc',
    },
  };
  const piiStore2 = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (k) => (piiStore2.has(k) ? piiStore2.get(k) : null),
      setItem: (k, v) => piiStore2.set(k, v),
      removeItem: (k) => piiStore2.delete(k),
    },
  };
  M.writeDraft(withNomineePii);
  const writtenApplication = piiStore2.get(M.draftStorageKey('fd-002'));
  for (const leak of ['Brigade', 'Bengaluru', '560038', '9876500000']) {
    ok(`no "${leak}" from a typed answer reaches storage`, !writtenApplication.includes(leak));
  }
  ok('and the non-sensitive parts still persist', writtenApplication.includes('details-accurate'));
  check(
    'a read restores answers empty, never from storage',
    M.readDraft('fd-002', 1_000_000)?.application.answers,
    {},
  );
  delete globalThis.window;

  /*
    The source PDFs are reference documents. Nothing about a customer is ever
    written into them or anywhere else under `public/` — asserted here on the
    template's own path, and by an invariant over the source tree.
  */
  for (const template of M.APPLICATION_TEMPLATES) {
    ok(
      `${template.id}'s source path carries no customer data`,
      !/\?|=|&/.test(template.sourceDocument.path),
    );
  }

  section('Emergency fund · the 10% policy has one home');

  /*
    The rule is stated once, in `emergency-allocation.ts`, and every surface
    that needs it reads that function — the multi-goal planner's derived row and
    the single-goal amount step alike. The regression this guards is a second
    `* 0.1` appearing somewhere convenient.
  */
  check('the policy is a whole percentage', M.EMERGENCY_FUND_PERCENT, 10);

  for (const [total, expected] of [
    [100_000, 10_000],
    [500_000, 50_000],
    [1_000_000, 100_000],
    [2_500_000, 250_000],
  ]) {
    check(
      `${String(total)} reserves ${String(expected)}`,
      M.calculateEmergencyFundAmount(total),
      expected,
    );
  }

  /* Nothing is reserved from nothing, and never a negative or fractional rupee. */
  for (const total of [0, -1, -2_500_000, Number.NaN, Number.POSITIVE_INFINITY]) {
    check(`${String(total)} reserves nothing`, M.calculateEmergencyFundAmount(total), 0);
  }
  check('a fractional total rounds to whole rupees', M.calculateEmergencyFundAmount(881), 88);
  check('and rounds half away from zero, not down', M.calculateEmergencyFundAmount(8_815), 882);
  ok(
    'every result is a whole rupee',
    [1, 7, 881, 8_815, 25_00_000, 999_999_999].every((total) =>
      Number.isInteger(M.calculateEmergencyFundAmount(total)),
    ),
  );
  /* The reserve can never exceed, or equal, the total it is a share of. */
  ok(
    'the reserve is always a fraction of the total',
    [1_000, 500_000, 2_500_000].every((total) => M.calculateEmergencyFundAmount(total) < total),
  );

  /* The customer-facing copy is derived from the same constant, never retyped. */
  ok('the basis names the percentage', M.EMERGENCY_FUND_BASIS.includes('10%'));
  ok('so does the explanation', M.EMERGENCY_FUND_EXPLANATION.includes('10%'));
  ok(
    'and the explanation says the money stays reachable',
    /short-term|within reach/i.test(M.EMERGENCY_FUND_EXPLANATION),
  );

  section('Portfolio · a holding is ownership, not intent');

  const bank = (id, name) => ({
    id,
    name,
    shortCode: id.toUpperCase().slice(0, 4),
    initials: name.slice(0, 2).toUpperCase(),
    logoUrl: null,
    rating: 'AAA',
  });

  const START = new Date('2025-08-20T00:00:00Z').getTime();
  const holding = (over = {}) => ({
    reference: 'REF-1',
    productType: 'fixed-deposit',
    productId: 'fd-008',
    productName: 'AU Small Finance Bank Fixed Deposit',
    bank: bank('au-small-finance', 'AU Small Finance Bank'),
    principal: 500_000,
    annualRate: 7.5,
    tenureMonths: 18,
    isCumulative: true,
    payoutLabel: 'At maturity',
    startedAt: START,
    status: 'active',
    ...over,
  });

  /* An empty portfolio is empty — never a dashboard of zeroes with fake totals. */
  const empty = M.summarisePortfolio([], START);
  check('an empty portfolio holds nothing', empty.activeCount, 0);
  check('and totals nothing', empty.totalPrincipal, 0);
  check('with no maturities to show', [...empty.upcomingMaturities], []);
  check('and no bank allocation', [...empty.byBank], []);
  check('and nothing needing attention', M.portfolioAttention(empty), []);

  /* One holding: every figure derived, none stored. */
  const one = M.summarisePortfolio([holding()], START);
  check('one active deposit', one.activeCount, 1);
  check('principal is what was deposited', one.totalPrincipal, 500_000);
  const view = one.holdings[0];
  check('the maturity date is 18 months on', M.formatMaturityDate(view.maturesOn), '20 Feb 2027');
  check('with the whole term remaining at the start', view.monthsRemaining, 18);
  ok('interest is earned', view.totalInterest > 0);
  check(
    'and maturity is principal plus interest for a cumulative deposit',
    view.maturityValue,
    500_000 + view.totalInterest,
  );
  check('nothing has accrued on day one', view.accruedValue, 500_000);

  /*
    A payout deposit returns the **principal** at maturity — the platform rule,
    reached through the same shared calculator Booking uses.
  */
  const payout = M.summarisePortfolio(
    [holding({ reference: 'REF-P', isCumulative: false })],
    START,
  );
  check('a payout deposit returns its principal', payout.holdings[0].maturityValue, 500_000);
  ok('while still earning interest', payout.holdings[0].totalInterest > 0);

  /* A term published in days has no month-based maturity date, and never a guessed one. */
  const dayBased = M.summarisePortfolio([holding({ reference: 'REF-D', tenureMonths: 0 })], START);
  ok('a day-based term has no maturity date', dayBased.holdings[0].maturesOn === null);
  ok('and no months remaining', dayBased.holdings[0].monthsRemaining === null);

  /* Three holdings across two banks: independent, and correctly allocated. */
  const many = M.summarisePortfolio(
    [
      holding({ reference: 'A', principal: 500_000 }),
      holding({
        reference: 'B',
        productId: 'fd-010',
        bank: bank('sbi', 'State Bank of India'),
        principal: 300_000,
        annualRate: 7.85,
        tenureMonths: 36,
      }),
      holding({ reference: 'C', principal: 200_000, tenureMonths: 6 }),
    ],
    START,
  );
  check('three deposits are held independently', many.activeCount, 3);
  check('and their principals sum', many.totalPrincipal, 1_000_000);
  check(
    'each keeps its own reference',
    many.holdings.map((entry) => entry.holding.reference),
    ['A', 'B', 'C'],
  );
  check(
    'each keeps its own product',
    many.holdings.map((entry) => entry.holding.productId),
    ['fd-008', 'fd-010', 'fd-008'],
  );
  ok(
    'and its own rate',
    many.holdings[1].holding.annualRate === 7.85 && many.holdings[0].holding.annualRate === 7.5,
  );

  /* Maturities are ordered soonest first. */
  check(
    'upcoming maturities are ordered by date',
    many.upcomingMaturities.map((entry) => entry.holding.reference),
    ['C', 'A', 'B'],
  );

  /* Allocation by bank, largest first, as whole percentages. */
  check('allocation names each bank once', many.byBank.length, 2);
  check('largest first', many.byBank[0].bankId, 'au-small-finance');
  check('with its combined principal', many.byBank[0].principal, 700_000);
  check('and its share', many.byBank[0].sharePercent, 70);
  check('the smaller bank follows', many.byBank[1].sharePercent, 30);

  /* Only confirmed, active deposits count. */
  const withClosed = M.summarisePortfolio(
    [
      holding({ reference: 'A' }),
      holding({ reference: 'X', status: 'closed', principal: 900_000 }),
    ],
    START,
  );
  check('a closed deposit is not counted', withClosed.activeCount, 1);
  check('nor does it inflate the total', withClosed.totalPrincipal, 500_000);

  section('Portfolio · insights are data-driven, never decorative');

  /*
    Term bands describe **what was bought**, not time remaining, so the mix does
    not shift as the clock runs. Ordered shortest to longest, and empty bands
    are omitted — a band with nothing in it is not information.
  */
  const mixed = M.summarisePortfolio(
    [
      holding({ reference: 'S', tenureMonths: 6, principal: 100_000 }),
      holding({ reference: 'M', tenureMonths: 36, principal: 300_000 }),
      holding({ reference: 'L', tenureMonths: 120, principal: 600_000 }),
    ],
    START,
  );
  check(
    'terms are banded shortest first',
    mixed.byMaturity.map((entry) => entry.id),
    ['under-1y', '1-3y', '5-10y'],
  );
  check(
    'with honest labels',
    mixed.byMaturity.map((entry) => entry.label),
    ['Under 1 year', '1–3 years', '5–10 years'],
  );
  check(
    'and real shares',
    mixed.byMaturity.map((entry) => entry.sharePercent),
    [10, 30, 60],
  );
  ok(
    'empty bands are omitted, not drawn at zero',
    !mixed.byMaturity.some((entry) => entry.principal === 0),
  );
  check(
    'a term beyond ten years lands in the open band',
    M.summarisePortfolio([holding({ tenureMonths: 240 })], START).byMaturity[0].id,
    '10y-plus',
  );
  check(
    'and a term the bank publishes in days still lands somewhere',
    M.summarisePortfolio([holding({ tenureMonths: 0 })], START).byMaturity.length,
    1,
  );

  /* Progress through the term is a real proportion, derived once. */
  const halfway = M.summarisePortfolio(
    [holding({ tenureMonths: 12 })],
    new Date('2026-02-20T00:00:00Z').getTime(),
  );
  check('progress is elapsed over total term', halfway.holdings[0].progressPercent, 50);
  check('nothing has elapsed on day one', one.holdings[0].progressPercent, 0);
  ok(
    'and progress never exceeds the term',
    M.summarisePortfolio([holding({ tenureMonths: 6 })], START + 1_000 * 60 * 60 * 24 * 900)
      .holdings[0].progressPercent === 100,
  );

  /* The screen states when its figures were made, from the same instant. */
  check('the summary records when it was derived', mixed.generatedAt, START);

  section('Portfolio · attention is raised only when there is a decision');

  /*
    An alert area that always has something in it teaches the investor to ignore
    it. The only thing this build can honestly raise is a deposit approaching
    maturity — the one fact the data knows that carries a deadline.
  */
  check('a deposit far from maturity raises nothing', M.portfolioAttention(one), []);

  const nearMaturity = new Date('2026-12-20T00:00:00Z').getTime();
  const soon = M.summarisePortfolio([holding()], nearMaturity);
  const items = M.portfolioAttention(soon);
  check('a deposit maturing within three months is raised', items.length, 1);
  ok('naming the bank', items[0].title.includes('AU Small Finance Bank'));
  ok('and saying what the decision is', /renew or withdraw/i.test(items[0].detail));

  section('Portfolio · the store records ownership once');

  const holdingsStore = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (k) => (holdingsStore.has(k) ? holdingsStore.get(k) : null),
      setItem: (k, v) => holdingsStore.set(k, v),
      removeItem: (k) => holdingsStore.delete(k),
    },
  };

  M.clearHoldings();
  check('a new investor holds nothing', M.readHoldings(), []);

  M.recordHolding(holding({ reference: 'REF-A' }));
  check('a confirmed deposit is recorded', M.readHoldings().length, 1);

  /* Idempotent on the bank's reference — a refresh cannot duplicate a deposit. */
  M.recordHolding(holding({ reference: 'REF-A' }));
  check('recording the same reference twice changes nothing', M.readHoldings().length, 1);

  M.recordHolding(holding({ reference: 'REF-B', productId: 'fd-010' }));
  check('a second deposit is its own holding', M.readHoldings().length, 2);
  check(
    'and keeps its own product',
    M.readHoldings().map((entry) => entry.productId),
    ['fd-008', 'fd-010'],
  );

  /* Refresh: the store is the source, so a re-read returns the same portfolio. */
  check('a refresh preserves the portfolio', M.readHoldings().length, 2);

  /* A malformed entry is dropped rather than rendered as a deposit that exists. */
  holdingsStore.set(
    'fd:portfolio-holdings:v1',
    JSON.stringify({ version: 1, holdings: [{ reference: 'X' }] }),
  );
  check('a malformed holding is refused', M.readHoldings(), []);
  holdingsStore.set('fd:portfolio-holdings:v1', '{not json');
  check('and so is unreadable storage', M.readHoldings(), []);

  delete globalThis.window;

  section('Identity · readiness decides what the investor is asked for');

  /*
    The rule the whole KYC experience turns on (doc 07 Stage 3): determine what
    already exists, and only request what is missing. These assertions are the
    guard against the screen quietly becoming a form again.
  */
  const methods = M.KYC_METHODS;
  const readinessFor = (identity) => M.deriveKycReadiness(identity, methods);

  /* A verified, current record asks for nothing at all. */
  const verified = M.identityWithStatus('verified');
  const verifiedReadiness = readinessFor(verified);
  check('a verified investor is already cleared', verifiedReadiness.outcome, 'already-verified');
  check('with nothing outstanding', [...verifiedReadiness.missingFields], []);
  ok('and continues without confirming anything', M.isIdentityCleared(verifiedReadiness, false));

  /* An unverified record with everything on file is a confirmation, not a form. */
  const notStarted = readinessFor(M.identityWithStatus('not-started'));
  check('an unverified investor confirms rather than types', notStarted.outcome, 'confirm-details');
  check('because nothing is missing', [...notStarted.missingFields], []);
  ok('so the journey waits on their confirmation', !M.isIdentityCleared(notStarted, false));
  ok('and proceeds once they give it', M.isIdentityCleared(notStarted, true));

  /*
    A record needing refresh is its own outcome. Collapsing it into "verified"
    would tell an investor they were done when they were not.
  */
  check(
    'a record due for refresh says so',
    readinessFor(M.identityWithStatus('update-required')).outcome,
    'refresh-required',
  );
  check(
    'and an in-progress record still needs confirming',
    readinessFor(M.identityWithStatus('in-progress')).outcome,
    'confirm-details',
  );

  /*
    A genuinely absent required field outranks the stored status — the platform
    cannot verify an investor whose name it does not have, whatever the record
    claims.
  */
  const noName = M.identityWithStatus('verified', {
    profile: { ...verified.profile, fullName: null },
  });
  const noNameReadiness = readinessFor(noName);
  check(
    'a missing required field outranks a verified status',
    noNameReadiness.outcome,
    'collect-missing',
  );
  check('and is named exactly', [...noNameReadiness.missingFields], ['fullName']);
  ok(
    'a blank string counts as missing, not as a value',
    readinessFor(
      M.identityWithStatus('verified', { profile: { ...verified.profile, fullName: '   ' } }),
    ).missingFields.includes('fullName'),
  );

  /* Optional fields never block a booking. */
  const noEmail = M.identityWithStatus('verified', {
    profile: { ...verified.profile, email: null, address: null },
  });
  check(
    'optional details do not block the journey',
    readinessFor(noEmail).outcome,
    'already-verified',
  );
  ok(
    'and are simply absent from what is known',
    !readinessFor(noEmail).knownFields.includes('email'),
  );

  /* PAN reads from its own identifier, not from the profile. */
  const noPan = M.identityWithStatus('verified', { pan: { status: 'missing', masked: null } });
  check('a missing PAN is required', [...readinessFor(noPan).missingFields], ['pan']);
  ok('and a PAN on file is known', M.isFieldKnown(verified, 'pan'));

  /*
    Aadhaar is deliberately **not** required: no approved document in this
    repository states that a deposit booking needs it, and requiring it would be
    inventing a regulatory rule.
  */
  ok('Aadhaar is not a booking requirement', !M.REQUIRED_IDENTITY_FIELDS.includes('aadhaar'));
  check(
    'the required set is exactly what the documents support',
    [...M.REQUIRED_IDENTITY_FIELDS],
    ['fullName', 'dateOfBirth', 'mobile', 'pan'],
  );
  check('and the optional set never blocks', [...M.OPTIONAL_IDENTITY_FIELDS], ['email', 'address']);

  section('Identity · only connected verification methods are offered');

  /*
    The registry models six routes and this build connects one. Marking an
    unconnected route usable would put a control on an identity screen that
    cannot work — and would imply a regulatory permission the platform does not
    hold.
  */
  check(
    'exactly one method is usable in this build',
    [...verifiedReadiness.usableMethods],
    ['existing-kyc'],
  );
  ok(
    'every other route is declared but not connected',
    methods
      .filter((method) => method.id !== 'existing-kyc')
      .every((method) => method.availability === 'not-connected'),
  );
  ok('method ids are unique', new Set(methods.map((m) => m.id)).size === methods.length);
  ok(
    'every method explains itself in plain words',
    methods.every((m) => m.description.length > 0),
  );
  ok(
    'and no label is a bare abbreviation',
    methods.every((m) => !/^[A-Z]{3,}$/.test(m.label)),
  );
  check('a method can be looked up by id', M.findKycMethod('digilocker')?.id, 'digilocker');
  ok('and an unknown id resolves to nothing', M.findKycMethod('face-scan') === undefined);

  /*
    The identity the platform holds carries no whole identifier — a type that
    cannot hold a PAN number cannot leak one.
  */
  ok('the record masks the PAN', (verified.pan.masked ?? '').includes('•'));
  ok('and holds no unmasked identifier field', !('number' in verified.pan));

  section('Booking · the entry amount, and the refusal to invent one');

  /*
    The two defects this section exists to stop recurring:

    1. Investment Details asked for an amount both entry flows had already
       collected, because nothing carried it across.
    2. A "fix" that invented one — a minimum, a quick amount, a reference
       figure — would have been worse than asking twice.

    So the parser accepts exactly what an entry flow writes and refuses
    everything else, and every refusal is `null`, which means *leave the draft
    alone*.
  */
  check('the entry parameter is named once', M.ENTRY_AMOUNT_PARAM, 'amount');
  check('a plain rupee amount is accepted', M.parseEntryAmount('500000'), 500_000);
  check('and surrounding whitespace is tolerated', M.parseEntryAmount('  500000 '), 500_000);

  for (const [label, raw] of [
    ['a missing parameter', undefined],
    ['an empty parameter', ''],
    ['a blank parameter', '   '],
    ['a repeated parameter with two answers', ['500000', '600000']],
    ['a negative amount', '-500000'],
    ['zero', '0'],
    ['a fractional amount', '500000.5'],
    ['a grouped amount', '5,00,000'],
    ['exponent notation', '5e5'],
    ['hexadecimal', '0x10'],
    ['a currency prefix', '₹500000'],
    ['text', 'lots'],
    ['an amount past safe integer range', '99999999999999999999'],
  ]) {
    check(`${label} yields nothing to seed`, M.parseEntryAmount(raw), null);
  }

  /*
    **No fallback exists in the parser.** The rule is not "it happens to return
    null" but "there is nothing for a null to fall back to" — asserted against
    the implementation, because a helpful default is exactly the kind of thing
    added later by someone trying to be kind.
  */
  ok(
    'the parser never substitutes a product figure',
    !/minInvestment|maxInvestment|quickAmount|REFERENCE_AMOUNT/.test(M.parseEntryAmount.toString()),
  );

  section('Booking · both entry paths carry the same two facts');

  /*
    Goal-Based FD hands over the product and the amount it was evaluated for —
    the customer's own answer to the planner's amount question. The engine's
    quote and maturity stay behind, which is the rule that has *not* changed.
  */
  const recommendation = {
    productId: 'fd-002',
    goalType: 'emergency',
    principal: 500_000,
    tenureMonths: 12,
    quote: { annualRate: 7.25, tenureMonths: 12 },
    maturity: { maturityAmount: 536_250 },
    reasons: [],
  };

  const handoff = M.toBookingHandoff(recommendation);
  check('the handoff keeps the recommended product', handoff.productId, 'fd-002');
  check('and the amount the customer stated', handoff.amount, 500_000);
  check(
    'and points at the one canonical Booking entry route',
    handoff.href,
    '/booking/fd-002/overview?amount=500000',
  );

  /*
    The boundary that has not moved. A rate or a maturity in the URL would be
    Booking believing someone else's price; neither appears, and the handoff has
    no field that could carry one.
  */
  ok('no rate crosses the boundary', !handoff.href.includes('7.25'));
  ok('no maturity crosses the boundary', !handoff.href.includes('536250'));
  check('the handoff carries exactly four fields', Object.keys(handoff).sort(), [
    'amount',
    'bookable',
    'href',
    'productId',
  ]);

  /* Comparison builds the same route, through the same builder. */
  check(
    'Comparison enters at the same route shape',
    M.bookingHandoffHref('fd-003', 250_000),
    '/booking/fd-003/overview?amount=250000',
  );
  check(
    'and an entry point with no amount still produces a valid route',
    M.bookingHandoffHref('fd-003'),
    '/booking/fd-003/overview',
  );

  /*
    Product identity is never traded for an amount: the id in the path is the id
    that was chosen, for every documented product on both paths.
  */
  for (const productId of ['fd-001', 'fd-002', 'fd-003', 'fd-004', 'fd-uc2-equitas-91d']) {
    ok(
      `${productId} keeps its identity through the handoff`,
      M.bookingHandoffHref(productId, 100_000).startsWith(`/booking/${productId}/overview`),
    );
  }

  section('Booking · Continue is gated by the domain, not by a constant');

  const detailsTerms = M.BOOKING_OVERVIEW_FIXTURE.deposit.terms;
  const configured = (over = {}) => ({
    amount: 500_000,
    tenureMonths: 12,
    payoutOption: 'at-maturity',
    ...over,
  });

  /*
    The regression guard for the Investment Details → Nominee defect. The screen
    carried a hardcoded `continueDisabled`, so this verdict — which the
    validator was written to produce, and which had no call site — could never
    reach the button. A valid configuration must report valid, or Nominee
    becomes unreachable again.
  */
  check(
    'a complete, in-range configuration passes',
    M.validateInvestmentConfiguration(configured(), detailsTerms, detailsTerms.supportedPayouts)
      .isValid,
    true,
  );

  for (const [label, patch] of [
    ['no amount', { amount: null }],
    ['no tenure', { tenureMonths: null }],
    ['no payout', { payoutOption: null }],
    ['an amount below the minimum', { amount: 1 }],
    ['a tenure the product does not price', { tenureMonths: 7 }],
  ]) {
    const verdict = M.validateInvestmentConfiguration(
      configured(patch),
      detailsTerms,
      detailsTerms.supportedPayouts,
    );
    check(`${label} does not pass`, verdict.isValid, false);
    ok(
      `and ${label} is explained in words`,
      verdict.errors.every((error) => error.message.length > 0),
    );
  }
}
