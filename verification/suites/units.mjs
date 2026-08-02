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
}
