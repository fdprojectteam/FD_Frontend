/**
 * Runtime suite — complete user journeys (approved M2.5 extension).
 *
 * The real components, the real hooks, the real React Query cache, and the
 * project's own MSW handlers. The only substitution is `next/navigation`.
 *
 * Journeys, not pairs: search, filters, sorting, pagination, back/forward,
 * refresh, and shared URLs are exercised **together**, because that is where
 * URL-state defects actually live.
 */
import { check, ok, section } from '../lib/assert.mjs';
import { buildApp, buildHandlers } from '../lib/build.mjs';
import { createDom, settle, waitFor } from '../lib/dom.mjs';

/* ------------------------------------------------------------------ */
/* DOM helpers                                                         */
/* ------------------------------------------------------------------ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const norm = (value) => (value ?? '').replace(/\s+/g, ' ').trim();

const resultCount = () => norm($('[role="status"]')?.textContent);

/**
 * Direct children of the grid only. Product cards contain their own lists
 * (benefit chips), so a descendant selector counts them too — which reads as
 * a rendering defect when it is a harness defect.
 */
const productCount = () => {
  const grid = $('#products ul');
  return grid ? [...grid.children].filter((node) => node.tagName === 'LI').length : 0;
};
const heroRate = () => norm($('#home-hero-title')?.closest('section')?.textContent).slice(0, 400);
const firstProduct = () => norm($('#products li')?.textContent).slice(0, 60);

function buttonByText(text, root = document) {
  return $$('button', root).find((node) => norm(node.textContent) === text);
}

function buttonStartingWith(prefix, root = document) {
  return $$('button', root).find((node) => norm(node.textContent).startsWith(prefix));
}

/**
 * A facet chip in the approved row. Its label changes once a value is applied
 * ("Tenure" → "Tenure: 12 months"), so it must be matched by prefix and
 * scoped to the filter group — the active-filter pills read similarly.
 */
function facetChip(facet) {
  const group = $('[aria-label="Filter fixed deposits"]');
  return group ? buttonStartingWith(facet, group) : undefined;
}

function pill(prefix) {
  const group = $('[aria-label="Active filters"]');
  return group ? buttonStartingWith(prefix, group) : undefined;
}

function click(element) {
  if (!element) throw new Error('click: element not found');
  element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

/** Sets a controlled input's value the way a user typing would. */
function type(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

/* ------------------------------------------------------------------ */

export async function runJourneySuite() {
  const handlersOut = await buildHandlers();
  const appOut = await buildApp();

  const dom = createDom();
  const { handlers } = await import(`file://${handlersOut}?t=${Date.now()}`);
  const { setupServer } = await import('msw/node');

  const requests = [];
  const server = setupServer(...handlers);
  server.events.on('request:start', ({ request }) => requests.push(request.url));
  server.listen({ onUnhandledRequest: 'bypass' });

  const app = await import(`file://${appOut}?t=${Date.now()}`);

  /** Mounts Home at `url` from cold, exactly as a browser would on load. */
  async function load(url) {
    app.unmount?.();
    document.body.innerHTML = '<div id="root"></div>';
    app.resetHistory(url);
    requests.length = 0;
    app.mount($('#root'));
    await waitFor(() => productCount() > 0 || /No products/.test(resultCount()), {
      label: `load ${url}`,
    });
    await settle();
  }

  /**
   * Every navigation the application performed, of either kind. I8 splits
   * writes into intent (`push`) and correction (`replace`); rule 5 still
   * counts them together — one navigation per interaction, whatever its kind.
   */
  const writes = () => app.pushCalls.length + app.replaceCalls.length;
  const pushes = () => app.pushCalls.length;
  const replaces = () => app.replaceCalls.length;

  /**
   * The listing request specifically. The hero sample (limit=12) and the banks
   * query share the log, and asserting against "the last request" would
   * sometimes assert against one of those.
   */
  const lastListingRequest = () =>
    requests.filter((url) => url.includes('/products?') && url.includes('limit=6')).at(-1) ?? '';

  const awaitListing = (fragment) =>
    waitFor(() => lastListingRequest().includes(fragment), {
      label: `listing request ${fragment}`,
    });

  /* ================================================================ */
  /* Goal planner — the guided journey, end to end                     */
  /* ================================================================ */

  {
    section('G1 · Home → Goal Planner → recommendation → Booking');

    /* ---- Home offers the guided door first ---- */

    await load('/');

    const heroSection = $('#home-hero-title')?.closest('section');
    const heroLinks = $$('a', heroSection).map((node) => ({
      text: norm(node.textContent),
      href: node.getAttribute('href'),
    }));

    check('the hero primary action is the planner', heroLinks[0], {
      text: 'Find my FD',
      href: '/goal-planner',
    });
    ok(
      'and browsing is still offered beside it',
      heroLinks.some((link) => link.text === 'Browse all FDs' && link.href === '#products'),
    );
    ok(
      'the dead "How it works" control is gone',
      !$$('button', heroSection).some((node) => norm(node.textContent) === 'How it works'),
    );

    const calloutSection = $('#home-goal-planner-title')?.closest('section');
    ok('Home renders the guided callout', Boolean(calloutSection));
    /*
      **Intent is carried, not discarded.** Each goal column links with `?goal=`,
      so choosing here answers the planner's first question. The one bare route
      on the page is the "not sure yet" link — the path for someone who has not
      decided.
    */
    check(
      'each goal carries its intent into the planner',
      $$('a', calloutSection).map((node) => node.getAttribute('href')),
      [
        '/goal-planner?goal=emergency',
        '/goal-planner?goal=education',
        '/goal-planner?goal=retirement',
        '/goal-planner',
      ],
    );
    check(
      'and the duplicate "Find my FD" button is gone from the callout',
      $$('button', calloutSection).length,
      0,
    );

    /* ---- Path B — no goal chosen, so the planner asks ---- */

    async function mountPlanner(url) {
      app.unmount?.();
      document.body.innerHTML = '<div id="root"></div>';
      app.resetHistory(url);
      requests.length = 0;
      app.mount($('#root'));
      await settle();
    }

    await mountPlanner('/goal-planner');

    check(
      'the planner states where the customer is',
      norm($('h1')?.textContent),
      'Find the FD that fits your goal',
    );
    ok(
      'the intro screen is gone — no "Let\u2019s start" to dismiss',
      !$$('button').some((node) => /Let.s start/.test(norm(node.textContent))),
    );
    check(
      'the first question is asked immediately',
      norm($('legend')?.textContent).startsWith('What are you saving for?'),
      true,
    );
    check('three goals are offered', $$('fieldset button').length, 3);
    ok(
      'and none is preselected',
      !$$('fieldset button').some((n) => n.getAttribute('aria-pressed') === 'true'),
    );

    /* ---- Path A — intent arrives, the goal question is skipped ---- */

    await mountPlanner('/goal-planner?goal=education');

    ok(
      'a goal chosen on Home is not asked for again',
      !/What are you saving for\?/.test(norm(document.body.textContent)),
    );
    ok(
      'it is acknowledged instead',
      /Children's Education \u2014 got it/.test(norm(document.body.textContent)),
    );
    ok(
      'and the planner moves straight to the next question',
      /Are you investing as a senior citizen\?/.test(norm($('legend')?.textContent)),
    );

    /* ---- An unrecognised goal falls back safely ---- */

    await mountPlanner('/goal-planner?goal=lamborghini');

    ok(
      'an unknown goal never selects one on the customer\u2019s behalf',
      !$$('fieldset button').some((n) => n.getAttribute('aria-pressed') === 'true'),
    );
    check(
      'and the ordinary question is asked',
      norm($('legend')?.textContent).startsWith('What are you saving for?'),
      true,
    );

    /* ---- Continue Path B from the goal question ---- */

    await mountPlanner('/goal-planner');

    /*
      Education, because it is the goal whose ranking the catalogue can serve
      well — and the one whose acknowledgement names the rule that will run.
    */
    click(buttonStartingWith("Children's Education"));
    await settle();

    ok(
      'the goal is acknowledged rather than silently accepted',
      /Children's Education — got it/.test(norm(document.body.textContent)),
    );
    ok(
      'and the platform says what it will prioritise',
      /mature closest to when you need the money/.test(norm(document.body.textContent)),
    );
    ok(
      'the answered goal stays visible as a trail entry',
      $$('button').some((node) => norm(node.textContent).startsWith('Change')),
    );

    /*
      The senior-citizen question (UC1). It sits here because the benefit is a
      rate input: asking it after the amount would mean pricing twice.
    */
    ok(
      'the second question asks the investor type',
      /Are you investing as a senior citizen\?/.test(norm($('legend')?.textContent)),
    );
    click(buttonStartingWith('No'));
    await settle();

    ok('the answer is kept in the trail', /Standard rates/.test(norm(document.body.textContent)));

    ok(
      'the third question is the amount',
      /How much are you planning to invest\?/.test(norm($('label[for]')?.textContent)),
    );
    /*
      The supporting line is derived from the catalogue query, which resolves
      independently of the step machine — so it needs its own settle rather than
      riding on the click that opened the question.
    */
    /*
      The catalogue query resolves independently of the step machine, so poll
      briefly rather than assuming one settle covers both. Bounded: if the line
      never arrives the assertion still fails, which is the point.
    */
    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (/From ₹5,000/.test(norm(document.body.textContent))) break;
      await settle(120);
    }
    ok(
      'the minimum is stated from the catalogue, not from copy',
      /From ₹5,000/.test(norm(document.body.textContent)),
    );

    /*
      A quick amount fills the field; the form's Continue action advances the
      planner. Both controls are part of the current UI contract.
    */
    click(buttonStartingWith('₹1 lakh'));
    click(buttonByText('Continue'));
    await settle();

    ok(
      'the fourth question is the horizon',
      norm($('legend')?.textContent).startsWith('When will you need the money?'),
    );
    ok(
      'and five years is offered',
      $$('fieldset button').some((node) => norm(node.textContent).startsWith('5 years')),
    );

    click(buttonStartingWith('1 year'));
    await settle();

    /*
      The target question (UC3). Optional by design — `Skip this` is a real
      answer, and taking it must leave the engine with no target rather than a
      target of zero.
    */
    ok(
      'the last question asks for a target, and allows none',
      /Is your goal a specific amount\?|Is there an amount you.re aiming for\?/.test(
        norm(document.body.textContent),
      ),
    );
    ok(
      'declining a target is offered as an explicit answer',
      $$('button').some((node) => norm(node.textContent) === 'Skip this'),
    );

    /*
      The journey stops here, deliberately.

      Everything above is verified in this environment. The results phase —
      recommendation rendering, the rule-id leak check, the Booking handoff —
      could not be driven to completion here: the journeys suite already has a
      pre-existing crash (`journeys.mjs` DOM nodes passed to `check`), and this
      sandbox terminates the long-running bundle-plus-jsdom process before the
      suite finishes.

      Those properties are not unverified — they are asserted statically in the
      invariant suite and over real engine output in the unit suite (no rule id
      in any component, "Indicative rate"/"Estimated maturity" present, the
      handoff carrying only a productId). What is missing is the DOM proof, and
      shipping a journey that cannot be run would be worse than saying so.
    */
  }

  /* ---------------------------------------------------------------- */
  /* /compare helpers (T2.7.3)                                         */
  /* ---------------------------------------------------------------- */

  /**
   * Re-pointed at the real table in T2.7.4 (was `#compare-columns > li`, the
   * T2.7.3 shell). **The helpers changed; no assertion did** — a selector fix
   * that also relaxed a check would quietly retire the behaviour L6b exists to
   * protect.
   */
  /**
   * **Every compare selector is scoped to one presentation.** Both trees are in
   * the DOM (contract §2, approach A) and jsdom applies no media queries, so an
   * unscoped selector would bind to whichever rendered first — silently, and
   * with L6b inside the blast radius.
   */
  const DESKTOP = '[data-compare-view="desktop"]';
  const MOBILE = '[data-compare-view="mobile"]';

  const compareColumns = () => $$(`${DESKTOP} table thead th[scope="col"]`);
  const compareNames = () => compareColumns().map((node) => norm($('p', node)?.textContent));
  const compareHeading = () => norm($('h1')?.textContent);

  const compareRowLabels = () =>
    $$(`${DESKTOP} table tbody th[scope="row"]`).map((node) => norm(node.textContent));
  /** The cells of one attribute row, in column order. */
  const compareRowCells = (label) => {
    const header = $$(`${DESKTOP} table tbody th[scope="row"]`).find(
      (node) => norm(node.textContent) === label,
    );
    return header ? $$('td', header.parentElement) : [];
  };
  const compareRowValues = (label) => compareRowCells(label).map((cell) => norm(cell.textContent));
  /**
   * The element actually carrying the highlight — the cell itself, or a
   * descendant of it.
   *
   * **Re-pointed at M2.8**, not weakened. The winner used to be a tint on the
   * `<td>`; it is now a pill *inside* the cell, so a probe reading the cell's
   * own class would report "no winner rendered" while the winner rendered
   * perfectly. This still proves the highlight reaches the DOM — it just no
   * longer assumes which element wears it.
   */
  const highlightIn = (root) => {
    if (!root) return undefined;
    const carries = (node) =>
      (node.getAttribute('class') ?? '').split(/\s+/).includes('bg-surface-brand-subtle');
    return carries(root) ? root : $$('*', root).find(carries);
  };

  /** The index of the highlighted cell in a row, or null when none is. */
  const bestCellIndex = (label) => {
    const index = compareRowCells(label).findIndex((cell) => Boolean(highlightIn(cell)));
    return index === -1 ? null : index;
  };

  /* Mobile equivalents — same model, column-major (T2.7.5). */
  const mobileCards = () => $$(`${MOBILE} article`);
  const mobileNames = () => mobileCards().map((card) => norm($('p', card)?.textContent));
  const mobileRow = (card, label) =>
    $$('[data-row-layout]', card).find((node) => norm($('span', node)?.textContent) === label);
  const mobileRowValues = (label) =>
    mobileCards().map((card) => {
      const row = mobileRow(card, label);
      return row ? norm($$('span', row)[1]?.textContent) : '';
    });
  /** The index of the card whose row is highlighted, or null when none is. */
  const mobileBestIndex = (label) => {
    const index = mobileCards().findIndex((card) => Boolean(highlightIn(mobileRow(card, label))));
    return index === -1 ? null : index;
  };
  const removeButton = (name, scope = DESKTOP) =>
    $$(`${scope} button`).find(
      (node) => node.getAttribute('aria-label') === `Remove ${name} from comparison`,
    );

  /** Mounts `/compare` from cold, exactly as a browser would on load. */
  async function loadCompare(url) {
    app.unmount?.();
    document.body.innerHTML = '<div id="root"></div>';
    app.resetHistory(url);
    requests.length = 0;
    app.mount($('#root'));
    await waitFor(
      () =>
        $$(`${DESKTOP} table thead th[scope="col"]`).length > 0 ||
        /Nothing to compare/.test(document.body.textContent),
      { label: `load ${url}` },
    );
    await settle();
  }

  try {
    /* ============================================================== */
    /**
     * The comparison batch, exercised without a component (T2.7.1a).
     *
     * No screen consumes `getProductsByIds` until T2.7.3, but the path it
     * depends on — repository → axios → MSW → mapper — is real now, and this
     * is the only layer where the project's own handlers run. A static probe
     * can assert the *types*; only this can assert what actually comes back.
     */
    section('L0 · Compare batch contract (T2.7.1a)');

    requests.length = 0;
    const batch = await app.productService.getProductsByIds(['fd-002', 'fd-001']);

    check('the batch returns one product per id', batch.length, 2);
    check(
      'column order follows the request, not the sorted cache key',
      batch.map((product) => product.id),
      ['fd-002', 'fd-001'],
    );
    check(
      'every product carries the eligibility the approved row needs',
      batch.map((product) => `${product.eligibility.residency}, ${product.eligibility.minAge}+`),
      ['Resident, 18+', 'Resident, 18+'],
    );
    ok(
      'returns are derived upstream, not by the caller',
      batch.every(
        (product) =>
          Number.isInteger(product.estimatedReturns.maturityValue) &&
          product.estimatedReturns.maturityValue > product.estimatedReturns.principal,
      ),
    );
    check('one batch is one request', requests.filter((url) => url.includes('ids=')).length, 1);

    const partial = await app.productService.getProductsByIds(['fd-001', 'no-such-product']);
    check('an unknown id is dropped, not returned as a hole', partial.length, 1);

    requests.length = 0;
    const none = await app.productService.getProductsByIds([]);
    check('an empty selection issues no request at all', [none.length, requests.length], [0, 0]);

    /* ============================================================== */
    /**
     * The behavioural half of the `/compare` URL contract (T2.7.3).
     *
     * These run **before** the table, the carousel, the picker and the action
     * bar exist. T2.7.2 shipped a synchronisation effect that nothing mounted:
     * its contract was proven and its behaviour was not, and a static probe
     * cannot see a loop. Building UI on top of an unverified sync is the
     * expensive order in which to discover one.
     */
    section('L4 · /compare cold load — zero navigations (I7)');

    await loadCompare('/compare?ids=fd-001,fd-002,fd-003');

    check('the URL becomes the selection', compareColumns().length, 3);
    check('the URL is untouched on load', app.currentUrl(), '/compare?ids=fd-001,fd-002,fd-003');
    check('zero navigations on load', writes(), 0);
    check('the heading counts what is shown', compareHeading(), 'Comparing 3 of 4 Products');
    check(
      'one batch request, not one per product',
      requests.filter((url) => url.includes('ids=')).length,
      1,
    );

    section('L4b · The approved table (T2.7.4)');

    check('a real table, not a grid of divs', $$('table').length, 1);
    check('product headers are column headers', compareColumns().length, 3);
    check('attribute labels are row headers, in the approved order', compareRowLabels(), [
      'Interest Rate',
      'Tenure',
      'Minimum Investment',
      'Interest Earned',
      'Maturity Value',
      'Benefits',
      'Eligibility',
    ]);
    check(
      'every row has one cell per column',
      compareRowLabels().map((label) => compareRowCells(label).length),
      [3, 3, 3, 3, 3, 3, 3],
    );

    /**
     * F2 — the alignment assertion. `products` and `rows` are parallel arrays
     * sharing an index; a transposed index would put one bank's rate under
     * another bank's name and look entirely correct. This ties a named column
     * to its own value.
     */
    const rateValues = compareRowValues('Interest Rate');
    const namedColumn = compareNames().indexOf('IDFC FIRST Bank');
    check('the named bank has a column', namedColumn >= 0, true);
    check(
      "each column carries its own product's rate (F2)",
      rateValues[namedColumn]?.startsWith('7.75%'),
      true,
    );

    /**
     * Asserted against the column that *holds* the winning rate rather than a
     * fixed position: the approved screen's column order is HDFC/IDFC/Kotak,
     * but this journey loads `fd-001…003` from the catalogue, and pinning
     * index 1 would be asserting the fixture's order rather than the rule.
     * 7.75% is the highest rate in the catalogue, so IDFC's column is the one
     * that must be marked.
     */
    check(
      'highlighting is rendered, not just modelled',
      bestCellIndex('Interest Rate'),
      namedColumn,
    );
    check('tenure is deliberately unhighlighted', bestCellIndex('Tenure'), null);
    check(
      'text rows are unhighlighted',
      [bestCellIndex('Benefits'), bestCellIndex('Eligibility')],
      [null, null],
    );
    check(
      'a winning cell announces why, not only by colour and star (C9)',
      compareRowValues('Interest Rate')[namedColumn]?.includes('Best interest rate'),
      true,
    );
    check(
      'one inert Select per column, each naming its product (D3)',
      $$('table tfoot button').map((node) => [
        node.getAttribute('aria-label'),
        node.getAttribute('aria-disabled'),
      ]),
      compareNames().map((name) => [`Select ${name}`, 'true']),
    );
    check('the table is captioned for screen readers', Boolean($('table caption')), true);

    section('L6 · Back and Forward across a removal (I8, C4)');

    const before = compareNames();
    check('three named columns', before.length, 3);

    click(removeButton(before[1]));
    await waitFor(() => compareColumns().length === 2, { label: 'removal renders' });
    await settle();

    check('a removal is exactly one navigation', writes(), 1);
    check('and it is a push, not a replace (intent, I8)', [pushes(), replaces()], [1, 0]);
    check('the URL drops the removed id', app.currentUrl(), '/compare?ids=fd-001,fd-003');
    check('the column is gone', compareNames().includes(before[1]), false);

    app.historyBack();
    await waitFor(() => compareColumns().length === 3, { label: 'back restores the column' });
    await settle();

    check('Back restores the URL', app.currentUrl(), '/compare?ids=fd-001,fd-002,fd-003');
    check('Back performs no navigation of its own', writes(), 1);

    app.historyForward();
    await waitFor(() => compareColumns().length === 2, { label: 'forward re-applies the removal' });
    await settle();

    check('Forward re-applies the removal', app.currentUrl(), '/compare?ids=fd-001,fd-003');
    check('Forward performs no navigation of its own', writes(), 1);

    section('L6b · Back restores the column *and* the count');

    app.historyBack();
    await waitFor(() => compareColumns().length === 3, { label: 'back again' });
    await settle();

    /**
     * The assertion the whole T2.7.2a amendment turns on. Under the superseded
     * hydrate-once model the URL moved and the store did not, so the columns
     * and the count stayed where the user left them while the address bar
     * claimed otherwise.
     */
    check('the removed product is present again', compareNames(), before);
    check('and the heading counts it', compareHeading(), 'Comparing 3 of 4 Products');

    section('L6c · An over-cap URL settles (R13)');

    await loadCompare('/compare?ids=fd-001,fd-002,fd-003,fd-004,fd-005');

    check('the cap governs what is displayed', compareColumns().length, 4);
    check('the heading agrees with the columns', compareHeading(), 'Comparing 4 of 4 Products');
    check(
      'the URL still carries five — I7 is write-only',
      app.currentUrl(),
      '/compare?ids=fd-001,fd-002,fd-003,fd-004,fd-005',
    );
    check('zero navigations on load', writes(), 0);

    /**
     * The loop guard. A synchronisation effect that compared against the
     * *uncapped* list would never reach a fixed point, because the store can
     * never equal a five-id URL. Settling twice and finding nothing moved is
     * the observable form of "it converged".
     */
    const settledColumns = compareColumns().length;
    const settledUrl = app.currentUrl();
    await settle(300);
    check(
      'it converges — nothing moves once settled',
      [compareColumns().length, app.currentUrl(), writes()],
      [settledColumns, settledUrl, 0],
    );

    /**
     * Removing a column from an over-cap URL brings the URL within the cap —
     * and the fifth product, carried in the URL but never displayed, takes the
     * freed column. Four columns before, four after.
     *
     * That follows from the approved model rather than being designed: the cap
     * governs *display*, the URL is authoritative, and I7 forbids trimming the
     * URL until the user writes. It is recorded here because it is the kind of
     * behaviour that reads as a bug to anyone who has not followed C4.
     */
    click(removeButton(compareNames()[0]));
    await waitFor(() => app.currentUrl() !== settledUrl, {
      label: 'removal from an over-cap URL',
    });
    await settle();

    check(
      'the first user write brings the over-cap URL within the cap',
      app.currentUrl(),
      '/compare?ids=fd-002,fd-003,fd-004,fd-005',
    );

    /**
     * The new id set is a new query key, so the batch refetches and the columns
     * are replaced by skeletons until it lands (plan §3.7, accepted). Asserting
     * before that would be measuring the mock's latency, not the behaviour —
     * the mistake the M2.4 audit recorded.
     */
    await waitFor(() => compareColumns().length === 4, { label: 'refetch after removal' });
    check('the previously unseen fifth product takes the freed column', compareColumns().length, 4);
    check('and the removal is one push', [pushes(), replaces()], [1, 0]);

    section('L3 · Add via the picker (T2.7.6)');

    /**
     * Dialog content is portalled to `document.body`, outside both
     * `data-compare-view` containers, so the view scoping cannot reach it.
     * Portalled content is scoped by role instead.
     */
    const DIALOG = '[role="dialog"]';
    const pickerRows = () => $$(`${DIALOG} li`);
    const addButton = (name) =>
      $$(`${DIALOG} button`).find(
        (node) => node.getAttribute('aria-label') === `Add ${name} to comparison`,
      );
    const trigger = () =>
      $$('button').find((node) => /^Add( another FD)?$/.test(norm(node.textContent)));

    await loadCompare('/compare?ids=fd-001,fd-002');

    check(
      'the trigger renders exactly once',
      $$('button').filter((node) => /^Add( another FD)?$/.test(norm(node.textContent))).length,
      1,
    );
    check(
      'no catalogue is fetched before the dialog opens',
      requests.filter((url) => url.includes('limit=24')).length,
      0,
    );

    click(trigger());
    // Skeleton placeholders are `<li>`s too, so waiting on rows alone would
    // assert against the loading state — the mistake the M2.4 audit recorded.
    await waitFor(() => $$(`${DIALOG} li button`).length > 0, {
      label: 'picker lists the catalogue',
    });
    await settle();

    check('the dialog lists the catalogue', pickerRows().length > 0, true);
    check(
      'products already being compared are disabled and marked Added',
      pickerRows()
        .filter((row) => /Added/.test(norm(row.textContent)))
        .map((row) => $('button', row)?.disabled),
      [true, true],
    );

    const addable = pickerRows().find((row) => !/Added/.test(norm(row.textContent)));
    const addableName = norm($('p', addable)?.textContent);

    click($('button', addable));
    await waitFor(() => app.currentUrl().split(',').length === 3, { label: 'add reaches the URL' });

    check('adding is exactly one push', [pushes(), replaces()], [1, 0]);
    check(
      'the existing ids keep their order and the new id appends',
      app.currentUrl().startsWith('/compare?ids=fd-001,fd-002,'),
      true,
    );
    check('the dialog stays open (D-O4)', pickerRows().length > 0, true);

    /**
     * The chain, end to end: URL → store (`replaceAll`) → `useCompareProducts`
     * → a new column. Asserting only that the query string changed would prove
     * the writer works, not the feature.
     */
    await waitFor(() => compareColumns().length === 3, { label: 'the comparison gains a column' });
    check('the added product becomes a column', compareNames().includes(addableName), true);
    check('and its picker row is now disabled in place', addButton(addableName)?.disabled, true);

    /* Fill to the cap. */
    const remaining = pickerRows().find((row) => !/Added/.test(norm(row.textContent)));
    click($('button', remaining));
    await waitFor(() => compareColumns().length === 4, { label: 'fourth column' });
    await settle();

    /*
      Scoped to the Add controls. The dialog paginates once the catalogue is
      large enough, and its page buttons are also `li > button` — they must stay
      enabled at the cap, because a customer who has filled their comparison must
      still be able to browse. Asserting "every button" conflated the two.
    */
    const addButtons = () =>
      $$(`${DIALOG} li button`).filter((node) => /^(Add|Added)$/.test(norm(node.textContent)));

    check(
      'at the cap every Add is disabled',
      addButtons().every((node) => node.disabled),
      true,
    );
    ok('and the picker can still be paged', addButtons().length > 0);
    check(
      'and the limit is announced',
      /maximum/.test(norm($(`${DIALOG} [role="status"]`)?.textContent)),
      true,
    );
    check('the URL never gains a fifth id', app.currentUrl().split(',').length, 4);

    const writesBeforeClose = writes();
    // Radix labels its close control with an sr-only span, not `aria-label`, so
    // the attribute selector never matched and the `??` fallback clicked the
    // first row's Add button instead — disabled at the cap, so the assertion
    // below passed while measuring nothing. Matched by text, and with no
    // fallback: a fallback that silently clicks an arbitrary control is how
    // that stayed invisible.
    click($$(`${DIALOG} button`).find((node) => norm(node.textContent) === 'Close'));
    await settle();
    check('closing the dialog performs no navigation', writes(), writesBeforeClose);

    section('L3b · The pending guard clears — consecutive Adds (T2.7.6)');

    /**
     * **What this does and does not prove.**
     *
     * It proves the guard *releases*: after an Add settles, the next Add is
     * enabled again and succeeds. That is the practical consequence of
     * D-PENDING's two-branch clear condition, and the failure it rules out is a
     * real one — a guard that never clears leaves the dialog permanently inert.
     *
     * It does **not** prove the guard *engages*. That is unobservable here: the
     * harness's `router.push` notifies synchronously, so `pendingAddId` is set
     * and cleared within one flush and the disabled window has zero width. The
     * lag the guard exists to bridge — an asynchronous App Router navigation
     * where a render occurs with the pending id set and `ids` not yet updated —
     * does not exist in this environment.
     *
     * The earlier version of this journey fired two clicks in one synchronous
     * turn to force the race. That models an interaction a user cannot perform
     * (two real clicks are separate tasks, with a React flush between them) and
     * a render-based guard cannot defend against by construction. It failed for
     * that reason, not because the guard is wrong. Recorded as a behavioural
     * limitation in `verification/README.md`, with a manual browser check.
     */
    await loadCompare('/compare?ids=fd-001');

    click(trigger());
    await waitFor(() => $$(`${DIALOG} li button`).length > 0, { label: 'picker opens' });
    await settle();

    // Rows are identified by `data-product-id`: bank names are not unique
    // across the catalogue, and the catalogue is returned in rate order rather
    // than id order, so neither name nor position identifies a product.
    const addableIds = pickerRows()
      .filter((row) => !/Added/.test(norm(row.textContent)))
      .map((row) => row.getAttribute('data-product-id'));
    const [firstId, secondId] = addableIds;
    const addButtonFor = (id) => $(`${DIALOG} [data-product-id="${id}"] button`);

    click(addButtonFor(firstId));
    await waitFor(() => app.currentUrl().includes(firstId), { label: 'the first Add lands' });
    await settle();

    check(
      'the guard released — the next Add is enabled again',
      addButtonFor(secondId).disabled,
      false,
    );

    click(addButtonFor(secondId));
    await waitFor(() => app.currentUrl().includes(secondId), { label: 'the second Add lands' });
    await settle();

    check(
      'both products are present, in the order they were added',
      app.currentUrl(),
      `/compare?ids=fd-001,${firstId},${secondId}`,
    );
    check('one push per Add, and no correction', [pushes(), replaces()], [2, 0]);

    section('E · The comparison action bar (T2.7.7)');

    /**
     * Scoped by `data-compare-actions`: the bar sits outside both
     * `data-compare-view` containers, so neither view scope reaches it, and a
     * document-wide selector would also match the *top* back link — both lead
     * to `ROUTES.home` (D-A8).
     */
    const ACTIONS = '[data-compare-actions]';

    await loadCompare('/compare?ids=fd-001,fd-002');

    /**
     * The failure D-A1 exists to prevent: placed inside a view container the
     * bar would exist twice, because both presentations are always in the DOM.
     * Asserted rather than inferred from placement.
     */
    check('exactly one action bar exists', $$(ACTIONS).length, 1);
    check(
      'and it is outside both presentation containers',
      $$(`[data-compare-view] ${ACTIONS}`).length,
      0,
    );

    const backAction = $(`${ACTIONS} a`);
    check('Back is a real link to the marketplace', backAction?.getAttribute('href'), '/');
    check(
      'its label carries both strings for the CSS swap',
      norm(backAction?.textContent),
      'Back to Marketplace',
    );

    const proceed = $$(`${ACTIONS} button`).find((node) =>
      norm(node.textContent).startsWith('Proceed to Booking'),
    );
    check('Proceed to Booking is present', Boolean(proceed), true);
    check(
      'and inert, with no destination (D3)',
      [proceed?.getAttribute('aria-disabled'), proceed?.hasAttribute('href')],
      ['true', false],
    );

    const writesBeforeProceed = writes();
    click(proceed);
    await settle();
    check('clicking it performs no navigation', writes(), writesBeforeProceed);

    /**
     * **Renaming, not weakening** (T2.7.7 review, Major 2). This previously read
     * "Back writes no `?ids=`" while never clicking Back — it read counters that
     * `loadCompare` had just reset, so it could not fail. Clicking is not
     * available either: `next/link` is not stubbed, so a click attempts a real
     * document navigation, which jsdom refuses (see J9).
     *
     * What the harness *can* prove is that rendering and using the bar performs
     * no navigation of its own. The guarantee that Back writes no `?ids=` rests
     * on the static probes instead — the bar imports no router and calls no
     * writer — and that is where it is asserted.
     */
    check(
      'the bar performs no navigation of its own',
      [app.pushCalls.length, app.replaceCalls.length],
      [0, 0],
    );

    await loadCompare('/compare');
    check('the bar is absent in the empty state (D-A3)', $$(ACTIONS).length, 0);

    section('L9 · The mobile presentation (T2.7.5)');

    await loadCompare('/compare?ids=fd-001,fd-002,fd-003');

    check('one card per product, in selection order', mobileNames(), compareNames());
    check(
      'each card header carries its own remove control',
      mobileNames().map((name) => Boolean(removeButton(name, MOBILE))),
      [true, true, true],
    );
    check(
      'Benefits and Eligibility stack; the numeric rows do not',
      $$(`${MOBILE} article`)[0]
        ? $$('[data-row-layout]', mobileCards()[0]).map((node) =>
            node.getAttribute('data-row-layout'),
          )
        : [],
      ['inline', 'inline', 'inline', 'inline', 'inline', 'stacked', 'stacked'],
    );
    /**
     * Located by the winner rather than by a fixed card position: the approved
     * screen's order is HDFC/IDFC/Kotak, but this journey loads `fd-001…003`
     * from the catalogue, so pinning an index would assert the fixture's order
     * instead of the rule.
     */
    const bestCard = mobileBestIndex('Interest Rate');
    check('a card is highlighted for the winning rate', bestCard !== null, true);
    check(
      'the winner is a pill inside the row, and only the pill is tinted (M2.8, supersedes D4)',
      [
        (mobileRow(mobileCards()[bestCard], 'Interest Rate')?.getAttribute('class') ?? '').includes(
          'bg-surface-brand-subtle',
        ),
        (
          $$('span', mobileRow(mobileCards()[bestCard], 'Interest Rate'))[1]?.getAttribute(
            'class',
          ) ?? ''
        ).includes('bg-surface-brand-subtle'),
      ],
      /*
        Inverted at M2.8. D4 tinted the whole row; a full-width band on a narrow
        card announced itself louder than the value it was about. The row is now
        plain and the value wears the pill — the same appearance token the table
        uses, so the two presentations still cannot drift.
      */
      [false, true],
    );
    check(
      'one inert Select per card, each naming its product',
      $$(`${MOBILE} article > button`).map((node) => [
        node.getAttribute('aria-label'),
        node.getAttribute('aria-disabled'),
      ]),
      mobileNames().map((name) => [`Select ${name}`, 'true']),
    );

    /*
      The vertical-stack model (restructured 2026-08-01).

      The carousel's assertions are **gone because the carousel is gone** — no
      scroller region, no arrows, no dots, no polite position status. They were
      not weakened; the behaviour they described no longer exists, and keeping
      them would have meant asserting a widget the screen does not render.

      What survives is what still has meaning: every card is in the tree, every
      card's controls are reachable, and the remove control keeps its 44px
      target. The first two used to be delicate — a carousel hides content by
      design — and are now structural, which is the point of the change.
    */
    check(
      'the cards are a real list, one item per product',
      $$(`${MOBILE} ul > li`).length,
      mobileCards().length,
    );
    check(
      'no card is hidden from assistive technology',
      mobileCards().filter((card) => card.hasAttribute('aria-hidden') || card.hasAttribute('inert'))
        .length,
      0,
    );
    check(
      'every card carries its own controls',
      $$(`${MOBILE} article button`).length,
      mobileCards().length * 2,
    );
    check(
      'the remove control keeps the 44px touch target',
      /\bsize-11\b/.test(removeButton(mobileNames()[0], MOBILE)?.getAttribute('class') ?? ''),
      true,
    );
    check('nothing scrolls horizontally any more', $$(`${MOBILE} [class*="overflow-x"]`).length, 0);

    /* C4 — intent from the card writes the URL, exactly as from the table. */
    const mobileBefore = mobileNames();
    click(removeButton(mobileBefore[2], MOBILE));
    await waitFor(() => app.currentUrl() === '/compare?ids=fd-001,fd-002', {
      label: 'removal from a card',
    });
    check('removing from a card is one push, like the table', [pushes(), replaces()], [1, 0]);

    section('L9b · The two presentations agree (T2.7.5)');

    await loadCompare('/compare?ids=fd-001,fd-002,fd-003');

    /**
     * The contract's whole purpose is that desktop and mobile cannot diverge,
     * and nothing else asserts it. Both trees are in the DOM here because jsdom
     * applies no media queries — so the agreement is checkable in one run.
     */
    check('the same columns, in the same order', mobileNames(), compareNames());
    for (const label of compareRowLabels()) {
      check(
        `${label} — same values in both presentations`,
        mobileRowValues(label),
        compareRowValues(label),
      );
      check(
        `${label} — same winner in both presentations`,
        mobileBestIndex(label),
        bestCellIndex(label),
      );
    }

    /**
     * Styling parity — the assertion that would have caught the defect this
     * suite shipped: both presentations applied the same token string, but the
     * mobile card's value span re-declared a colour and beat the inherited
     * brand. Values and winner index were identical, so the previous checks saw
     * nothing.
     *
     * Two things are asserted per winning row: the highlighted element carries
     * the same highlight tokens in both trees, and **nothing inside it
     * re-declares a text colour** — the override that tailwind-merge cannot
     * resolve because it spans two elements.
     */
    /*
      Re-pointed twice at M2.8: first when the winner became a floating pill,
      then again at the design pass, which settled on a rounded rectangle with
      no shadow — against a white cell the tint alone reads as raised.
      The list is still exhaustive — every token `BEST_HIGHLIGHT` declares must
      appear on the highlighted element in *both* trees.
    */
    const HIGHLIGHT_TOKENS = [
      'bg-surface-brand-subtle',
      'text-content-brand',
      'rounded-lg',
      'font-semibold',
    ];

    // `getAttribute`, not `className`: the star is an <svg>, whose `className`
    // is an SVGAnimatedString rather than a string.
    const classesOf = (node) => (node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
    const highlightTokensOf = (node) =>
      HIGHLIGHT_TOKENS.filter((token) => classesOf(node).includes(token));
    /** Descendants that set their own content colour, beating what they inherit. */
    const colourOverridesIn = (node) =>
      node
        ? $$('*', node).filter((child) =>
            classesOf(child).some((name) => /^text-content(-|$)/.test(name)),
          ).length
        : -1;

    const desktopBestCell = (label) =>
      highlightIn(compareRowCells(label).find((cell) => cell.getAttribute('data-best') === 'true'));
    const mobileBestRow = (label) => {
      const index = mobileBestIndex(label);
      return index === null ? undefined : highlightIn(mobileRow(mobileCards()[index], label));
    };

    for (const label of compareRowLabels()) {
      if (bestCellIndex(label) === null) continue;

      check(
        `${label} — the highlight carries every approved token, in both`,
        [highlightTokensOf(desktopBestCell(label)), highlightTokensOf(mobileBestRow(label))],
        [HIGHLIGHT_TOKENS, HIGHLIGHT_TOKENS],
      );
      check(
        `${label} — nothing inside the highlight overrides its colour, in either`,
        [colourOverridesIn(desktopBestCell(label)), colourOverridesIn(mobileBestRow(label))],
        [0, 0],
      );
    }

    section('L10 · The deposit amount drives the returns (2026-08-02)');

    await loadCompare('/compare?ids=fd-001,fd-002,fd-003');

    const amountField = () => $('#compare-amount');
    // `-message`, not `-error`: the field renders through `PreferenceField`,
    // which uses one element for a hint or an error so a field cannot grow a
    // second line when validation fails.
    const amountError = () => $('#compare-amount-message');
    const belowMinimumCount = () =>
      $$(`${DESKTOP} thead th[scope="col"]`).filter((node) =>
        /Below minimum/.test(norm(node.textContent)),
      ).length;

    /*
      The apply affordances (Comparison Experience Refinement, 2026-08-02).
      Found by role and text rather than by a test id: the button the user can
      see is the button under test, and a probe bound to an id would keep
      passing if the label stopped saying what it does.
    */
    const applyButton = () => buttonByText('Update Comparison');
    /*
      Scoped to the preferences section rather than matched globally: the screen
      has other polite regions (the loading placeholder, the picker's result
      count), and a probe that took "the first status on the page" would pass
      today and bind to a skeleton the first time one rendered beside it.
    */
    const preferencesSection = () => $('section[aria-labelledby="investment-preferences-heading"]');
    const preferencesStatus = () => {
      const section = preferencesSection();
      return section ? norm($('[role="status"]', section)?.textContent) : '';
    };
    const pressKey = (input, key) => {
      input.dispatchEvent(
        new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
    };

    check('the comparison offers a deposit amount', Boolean(amountField()), true);
    /*
      The default is the highest minimum among the compared products, floored at
      the ₹1,00,000 reference. fd-001/002/003 have minimums of ₹10,000, ₹10,000
      and ₹50,000, so the floor stands — and, crucially, no column opens flagged
      as below its own minimum.
    */
    check('it opens at the reference amount', amountField()?.value, '100000');
    check('and no column opens below its minimum', belowMinimumCount(), 0);

    const baselineEarned = compareRowValues('Interest Earned');
    const baselineMobileEarned = mobileRowValues('Interest Earned');
    const baselineRate = compareRowValues('Interest Rate');
    const baselineWinner = bestCellIndex('Maturity Value');

    /*
      ------------------------------------------------------------------
      Editing is not applying (Comparison Experience Refinement, 2026-08-02).

      The screen used to recalculate on every keystroke, and this journey used to
      assert exactly that. The client's objection was not that it was wrong but
      that it was *loud*: typing `1000000` walked the table through seven
      comparisons the user had not asked for. So the assertion is inverted —
      typing must now change nothing at all — and the recalculation is asserted
      against the explicit apply below it.
      ------------------------------------------------------------------
    */
    check('nothing is pending when the screen settles', Boolean(applyButton()), false);
    check(
      'and the status names the amount being compared',
      /Comparing at/.test(preferencesStatus()),
      true,
    );

    type(amountField(), '1000000');
    await settle();

    check('the draft holds what was typed', amountField()?.value, '1000000');
    check(
      'the comparison does not move while the user types',
      compareRowValues('Interest Earned'),
      baselineEarned,
    );
    /*
      Asserted on **both** presentations, not only the one that is easier to
      read. "Desktop and mobile refresh together" has a quiet counterpart — they
      must also *not* refresh together — and a mobile card recalculating on a
      keystroke would be invisible to a desktop-only probe.
    */
    check(
      'nor does the mobile presentation',
      mobileRowValues('Interest Earned'),
      baselineMobileEarned,
    );
    check(
      'an unapplied edit is stated, not silent',
      /Changes not applied/.test(preferencesStatus()),
      true,
    );
    check('and the way to apply it is offered', Boolean(applyButton()), true);
    check('typing performs no navigation', writes(), 0);

    /*
      Escape restores the draft to what is actually being compared — the
      affordance that lets a user abandon an edit without remembering the figure
      they started from.
    */
    pressKey(amountField(), 'Escape');
    await settle();

    check('Escape restores the applied amount', amountField()?.value, '100000');
    check('and the pending state clears with it', Boolean(applyButton()), false);

    /*
      Ten times the deposit — over the ₹5,00,000 band, so this crosses a slab
      boundary as well as changing the principal.

      **The rate moves too** (change request, 2026-08-02). This assertion used to
      say the opposite: that the rate was a property of the product and could not
      be derived from the amount. That was true of the data as it then stood —
      one rate per product, no rate card — and the client has since asked for the
      rate *applicable to the amount*, which is what a bank actually quotes.
    */
    type(amountField(), '1000000');
    await settle();
    click(applyButton());
    await waitFor(() => compareRowValues('Interest Earned')[0] !== baselineEarned[0], {
      label: 'returns recomputed for the applied amount',
    });

    check(
      'every column recomputes, none is left on the old figure',
      compareRowValues('Interest Earned').every((value, index) => value !== baselineEarned[index]),
      true,
    );
    check(
      'the interest rate moves to the band the deposit clears',
      compareRowValues('Interest Rate').every((value, index) => value !== baselineRate[index]),
      true,
    );
    check(
      'the winner still comes from the recomputed figures',
      bestCellIndex('Maturity Value'),
      baselineWinner,
    );

    /*
      The brief's load-bearing requirement: desktop and mobile must always
      display the same calculated data. Both presentations are in the DOM under
      jsdom (no media queries), so this compares them directly rather than
      trusting that one call site feeds both.
    */
    for (const label of ['Interest Rate', 'Interest Earned', 'Maturity Value']) {
      check(
        `${label} reads identically on desktop and mobile`,
        mobileRowValues(label),
        compareRowValues(label),
      );
    }
    check('applying performs no navigation', writes(), 0);
    check(
      'and the URL still carries only the selection',
      app.currentUrl(),
      '/compare?ids=fd-001,fd-002,fd-003',
    );

    /*
      The interaction closes itself: once applied there is nothing left to apply,
      so the action leaves and the status goes back to naming the figure on
      screen. A button that stayed would invite a click that did nothing.
    */
    check('the action leaves once its work is done', Boolean(applyButton()), false);
    /*
      And takes the user's focus with it unless someone catches it: the activated
      element unmounts, so without the screen's handler focus would land on
      `<body>` and the next Tab would restart at the top of the page.
    */
    check(
      'focus returns to the field rather than the document',
      document.activeElement,
      amountField(),
    );
    check(
      'and the status names the newly applied amount',
      /Comparing at/.test(preferencesStatus()),
      true,
    );

    /*
      Enter is the keyboard path to the same apply, and it must not be a second
      implementation of it — a user who never leaves the field gets the identical
      comparison. Asserted through the figures rather than the field, because a
      duplicate apply that forgot to normalise the draft would look right here
      and drift on the next edit.
    */
    const appliedAtMillion = compareRowValues('Maturity Value');

    type(amountField(), '0100000');
    await settle();
    check('a re-typed amount is pending until confirmed', Boolean(applyButton()), true);

    pressKey(amountField(), 'Enter');
    await waitFor(() => compareRowValues('Maturity Value')[0] !== appliedAtMillion[0], {
      label: 'Enter applies the drafted amount',
    });

    check('Enter applies without touching the button', Boolean(applyButton()), false);
    check('and the draft is normalised to what is being compared', amountField()?.value, '100000');
    check(
      'the figures return to the reference comparison',
      compareRowValues('Interest Earned'),
      baselineEarned,
    );

    /*
      Below a product's minimum the figures stay — they are correct arithmetic
      for what was applied — and the column says the deposit could not be opened.
      Approved answer to "what happens below the minimum": compute, and flag.
    */
    check('no column is flagged at a generous amount', belowMinimumCount(), 0);

    type(amountField(), '1000');
    await settle();
    check('a below-minimum draft is still only a draft', belowMinimumCount(), 0);

    click(applyButton());
    await waitFor(() => belowMinimumCount() > 0, { label: 'a column falls below its minimum' });

    check(
      'the flagged columns still show their returns',
      compareRowValues('Maturity Value').every((value) => value.length > 0),
      true,
    );
    check('a small deposit is not a validation error', amountError(), null);

    /*
      An unusable value is a field error, and — the point of the refinement — the
      comparison simply stays where the user left it. There is no "last valid
      parse" to fall back on any more: the applied figure is by construction the
      last one confirmed, so a broken draft cannot reach the table at all.
    */
    const heldValues = compareRowValues('Maturity Value');
    type(amountField(), 'abc');
    await settle();

    check('a non-numeric amount is rejected in the field', Boolean(amountError()), true);
    check('the error is announced', amountError()?.getAttribute('role'), 'alert');
    check('the field is marked invalid', amountField()?.getAttribute('aria-invalid'), 'true');
    check(
      'and the table holds the applied figures rather than emptying',
      compareRowValues('Maturity Value'),
      heldValues,
    );
    /*
      It is *pending* — something is in the field the comparison is not showing —
      but it cannot be applied. Disabled rather than absent, so the field's error
      is the explanation instead of a control quietly disappearing.
    */
    check('the action is offered but refused', Boolean(applyButton()), true);
    check('and it is disabled rather than hidden', applyButton()?.disabled, true);

    click(applyButton());
    await settle();
    check('clicking it changes nothing', compareRowValues('Maturity Value'), heldValues);

    pressKey(amountField(), 'Enter');
    await settle();
    check('and neither does Enter', compareRowValues('Maturity Value'), heldValues);

    pressKey(amountField(), 'Escape');
    await settle();
    check('Escape recovers from an invalid draft', amountField()?.value, '1000');
    check('and clears the error with it', amountError(), null);

    /* ============================================================== */
    section('L7 · /compare with nothing selected');

    await loadCompare('/compare');

    check('no columns', compareColumns().length, 0);
    check('the empty state offers a way back', Boolean($('a[href="/"]')), true);
    check('zero navigations on load', writes(), 0);

    /* ============================================================== */
    section('J0 · Cold load — I7 is write-only');

    for (const url of [
      '/',
      '/?page=1',
      '/?sort=interestRate&order=desc',
      '/?bank=',
      '/?bank=hdfc&page=1',
    ]) {
      await load(url);
      check(`${url} → URL untouched on load`, app.currentUrl(), url);
      check(`${url} → zero writes on load`, writes(), 0);
    }

    await load('/');
    check(
      'first load renders the approved heading',
      norm($('#home-hero-title')?.textContent).slice(0, 24),
      'Grow your savings with I',
    );
    check('first load renders a full page of products', productCount(), 6);
    check('first load announces the range', resultCount(), 'Showing 1–6 of 24 products');
    check(
      'the approved chip row is present',
      ['Bank', 'Tenure', 'Interest Rate', 'Amount'].map((label) => Boolean(buttonByText(label))),
      [true, true, true, true],
    );
    check('no active-filter row when nothing is applied', $('[aria-label="Active filters"]'), null);
    check(
      'filter chips are real buttons with a pressed state',
      $$('[aria-label="Filter fixed deposits"] button').every(
        (node) => node.getAttribute('aria-pressed') !== null,
      ),
      true,
    );

    /* ============================================================== */
    section('J1 · Discover and refine — search → filter → filter → page');

    const heroBefore = heroRate();

    // 1. Search, committed by the button (decision D1).
    type($('#home-search-query'), 'hdfc');
    check('typing does not touch the URL (I6)', writes(), 0);
    click(buttonByText('Search'));
    await waitFor(() => app.currentUrl().includes('q=hdfc'), { label: 'search commit' });
    check('search performs exactly one write', writes(), 1);
    check('search pushes — the user asked for this result set (I8)', pushes(), 1);
    check('search writes q', app.currentUrl(), '/?q=hdfc');
    await waitFor(() => resultCount().includes('of 4'), { label: 'search applied' });
    check('search narrows the listing (G1 closed)', resultCount(), 'Showing 1–4 of 4 products');

    // 2. Bank filter on top of the search.
    click(facetChip('Bank'));
    await settle();
    click(buttonByText('HDFC Bank', $('[aria-label="Bank options"]')));
    await waitFor(() => app.currentUrl().includes('bank=hdfc'), { label: 'bank filter' });
    check('filter performs exactly one write', writes(), 2);
    check('filter preserves the search', app.currentUrl(), '/?q=hdfc&bank=hdfc');
    await settle(300);
    check('active-filter row appears', Boolean($('[aria-label="Active filters"]')), true);
    check(
      'both filters are described',
      $$('[aria-label="Active filters"] button')
        .slice(0, 2)
        .map((node) => norm(node.textContent)),
      ['Search: hdfc', 'Bank: HDFC Bank'],
    );

    // 3. Clear the search from the pill, leaving the bank filter.
    click(pill('Search: hdfc'));
    await waitFor(() => !app.currentUrl().includes('q='), { label: 'remove search pill' });
    check('removing a pill is one write', writes(), 3);
    check('removing the search keeps the bank filter', app.currentUrl(), '/?bank=hdfc');
    await waitFor(() => resultCount().includes('of 4'), { label: 'bank-only results' });

    // 4. Tenure chip, then a rate band.
    click(facetChip('Tenure'));
    await settle();
    click(buttonByText('12 months', $('[aria-label="Tenure options"]')));
    await waitFor(() => app.currentUrl().includes('tenure=12'), { label: 'tenure filter' });
    check('third filter is one write', writes(), 4);
    check('filters combine in the URL', app.currentUrl(), '/?tenure=12&bank=hdfc');
    await awaitListing('tenureMonths=12');
    check(
      'G2 closed — tenure reached the API as tenureMonths',
      lastListingRequest().includes('tenureMonths=12'),
      true,
    );
    ok('G2 closed — the raw `tenure` key is never sent', !/[?&]tenure=/.test(lastListingRequest()));
    ok(
      'G1 closed — the deprecated `search` key is never sent',
      !/[?&]search=/.test(lastListingRequest()),
    );
    await settle(400);
    // Every HDFC product in the fixture set is a 12-month deposit, so this
    // combination legitimately returns the same four rows. The assertion that
    // matters is that both filters reached the API, above.
    check('combined filters return a coherent set', resultCount(), 'Showing 1–4 of 4 products');

    // 5. A combination with no matches must reach the empty state, not a
    //    stale list — this is where a filter that silently does nothing shows.
    click(facetChip('Tenure'));
    await settle();
    click(buttonByText('6 months', $('[aria-label="Tenure options"]')));
    await awaitListing('tenureMonths=6');
    await waitFor(() => /No products/.test(resultCount()), { label: 'empty combination' });
    check('an impossible combination empties the listing', resultCount(), 'No products found');
    check('the empty state offers recovery', Boolean(buttonByText('Clear all filters')), true);

    // 6. Hero is untouched by everything above.
    check('I2 / A4 — hero unchanged across the whole journey', heroRate(), heroBefore);

    // 7. Clear all.
    click(buttonByText('Clear all'));
    await waitFor(() => app.currentUrl() === '/', { label: 'clear all' });
    check('clear all is one write', writes(), 6);
    check('every step of the journey was intent, none a correction', replaces(), 0);
    check('clear all returns to /', app.currentUrl(), '/');
    check('the whole journey is walkable backwards', app.historyStack().entries.length, 7);
    await waitFor(() => resultCount().includes('of 24'), { label: 'cleared' });
    check('clearing restores the full set', resultCount(), 'Showing 1–6 of 24 products');

    /* ============================================================== */
    section('J1b · Filters combined with pagination');

    await load('/?minRate=7.25');
    await awaitListing('minRate=7.25');
    await settle(400);
    const filteredTotal = resultCount();
    ok(
      'a rate band filters the listing',
      /of ([1-9]|1\d|2[0-3]) products/.test(filteredTotal),
      filteredTotal,
    );

    const pageTwo = buttonByText('2');
    if (pageTwo) {
      click(pageTwo);
      await waitFor(() => app.currentUrl().includes('page=2'), { label: 'paginate' });
      check('pagination is one write', writes(), 1);
      check('pagination pushes — a page is a place the user chose (I8)', pushes(), 1);
      check('pagination preserves the filter', app.currentUrl(), '/?minRate=7.25&page=2');

      // Changing a filter from page 2 must reset the page in the same write.
      click(facetChip('Tenure'));
      await settle();
      click(buttonByText('24 months', $('[aria-label="Tenure options"]')));
      await waitFor(() => app.currentUrl().includes('tenure=24'), { label: 'filter from page 2' });
      check('filter change is one write', writes(), 2);
      check(
        'filter change resets the page in the same write',
        app.currentUrl(),
        '/?tenure=24&minRate=7.25',
      );
      ok('page is gone, not set to 1', !app.currentUrl().includes('page='));
    }

    /* ============================================================== */
    section('J2 · History semantics and restoration');

    await load('/');
    type($('#home-search-query'), 'axis');
    click(buttonByText('Search'));
    await waitFor(() => app.currentUrl().includes('q=axis'));
    click(facetChip('Bank'));
    await settle();
    click(buttonByText('Axis Bank', $('[aria-label="Bank options"]')));
    await waitFor(() => app.currentUrl().includes('bank=axis'));
    // I8: a refinement the user asked for becomes a place they can return to.
    check('two interactions produced two navigations', writes(), 2);
    check('both were pushes, because both were intent', pushes(), 2);
    check('nothing was replaced', replaces(), 0);
    check('the history stack grew with the journey', app.historyStack().entries.length, 3);

    // Now walk the journey backwards — the behaviour F3 was about.
    app.historyBack();
    await settle(300);
    check('back undoes the filter', app.currentUrl(), '/?q=axis');
    check('back restores the search input', $('#home-search-query').value, 'axis');
    check(
      'back clears the chip that was not in that state',
      Boolean(buttonStartingWith('Bank: Axis Bank')),
      false,
    );
    await waitFor(() => resultCount().includes('of 4'), { label: 'back restores results' });
    check('back restores the result set', resultCount(), 'Showing 1–4 of 4 products');

    app.historyBack();
    await settle(300);
    check('back again reaches the unfiltered start', app.currentUrl(), '/');
    check('the search input is cleared with it', $('#home-search-query').value, '');
    await waitFor(() => resultCount().includes('of 24'), { label: 'back to start' });

    app.historyForward();
    app.historyForward();
    await settle(350);
    check('forward returns to the fully refined state', app.currentUrl(), '/?q=axis&bank=axis');
    check('forward restores the chip', Boolean(buttonStartingWith('Bank: Axis Bank')), true);

    check('no history navigation wrote to the URL', writes(), 2);

    /* ============================================================== */
    section('J3 · Refresh fidelity');

    for (const url of [
      '/?bank=hdfc',
      '/?minRate=7.25&sort=tenureMonths&order=asc',
      '/?minRate=7.25&sort=tenureMonths&order=asc&page=2',
    ]) {
      await load(url);
      await settle(300);
      const before = { count: resultCount(), first: firstProduct(), url: app.currentUrl() };
      await load(url);
      await settle(300);
      check(
        `refresh at ${url} renders identically`,
        { count: resultCount(), first: firstProduct(), url: app.currentUrl() },
        before,
      );
      check(`refresh at ${url} performs no write`, writes(), 0);
    }

    // The one documented exception to write-only canonicalisation: an
    // out-of-range page is INVALID rather than non-canonical, and its
    // invalidity is only knowable once the server reports totalPages.
    await load('/?bank=hdfc&page=9');
    await waitFor(() => writes() === 1, { label: 'out-of-range clamp' });
    check('an out-of-range page clamps to the last real page', app.currentUrl(), '/?bank=hdfc');
    check('the clamp is a single write', writes(), 1);
    // I8: the user never asked for page 9's correction, so it must not become
    // somewhere Back can land — otherwise Back returns to the broken URL and
    // the clamp fires again.
    check(
      'the clamp replaces rather than pushes',
      { pushes: pushes(), replaces: replaces() },
      { pushes: 0, replaces: 1 },
    );
    check('the clamp adds no history entry', app.historyStack().entries.length, 1);
    await settle(300);
    check('the clamp never announces a garbled range', resultCount(), 'Showing 1–4 of 4 products');

    /* ============================================================== */
    section('J4 · Shared and hostile URLs');

    await load('/?q=hdfc&bank=hdfc&tenure=12&minRate=7&amount=50000&sort=tenureMonths&order=asc');
    check('a shared URL renders without rewriting itself', writes(), 0);
    check(
      'a shared URL restores every control',
      {
        q: $('#home-search-query').value,
        amount: $('#home-search-amount').value,
        bank: Boolean(buttonStartingWith('Bank: HDFC Bank')),
        tenure: Boolean(buttonStartingWith('Tenure: 12 months')),
        rate: Boolean(buttonStartingWith('Interest Rate: 7%+')),
      },
      { q: 'hdfc', amount: '50000', bank: true, tenure: true, rate: true },
    );

    await load('/?bank=%3Cscript%3E&minRate=abc&tenure=99&sort=nonsense&order=up&amount=abc');
    check('a hostile URL renders a valid screen', productCount(), 6);
    check('a hostile URL performs no write', writes(), 0);
    check('rejected values apply no filter', resultCount(), 'Showing 1–6 of 24 products');
    check('rejected values press no chip', $('[aria-label="Active filters"]'), null);
    check(
      'rejected values never reach the API',
      /bank=|minRate=|tenureMonths=/.test(requests.at(-1)),
      false,
    );

    /* ============================================================== */
    section('J5 · Two controls, one state (D3)');

    await load('/');
    click(facetChip('Tenure'));
    await settle();
    click(buttonByText('24 months', $('[aria-label="Tenure options"]')));
    await waitFor(() => app.currentUrl().includes('tenure=24'), { label: 'chip sets tenure' });
    check('chip write is a single write', writes(), 1);
    await settle(250);
    check(
      'the search panel reflects the chip',
      norm($('#home-search-tenure')?.textContent),
      '24 months',
    );
    check('the chip reflects itself', Boolean(buttonStartingWith('Tenure: 24 months')), true);

    click(pill('Tenure: 24 months'));
    await waitFor(() => !app.currentUrl().includes('tenure='), { label: 'pill clears tenure' });
    check('clearing from the pill is one write', writes(), 2);
    await settle(250);
    check('the panel follows the pill', norm($('#home-search-tenure')?.textContent), 'Any tenure');
    check('the chip follows the pill', Boolean(facetChip('Tenure: ')), false);
    check('the active-filter row disappears', $('[aria-label="Active filters"]'), null);

    /* ============================================================== */
    section('J6 · I7 canonical table — untouched on load, canonical on write');

    const canonical = [
      ['/?page=1', '/'],
      ['/?sort=interestRate&order=desc', '/'],
      ['/?bank=', '/'],
      ['/?bank=hdfc&page=1', '/?bank=hdfc'],
    ];

    for (const [input, expected] of canonical) {
      await load(input);
      check(`${input} → unchanged on load`, app.currentUrl(), input);

      // A user-initiated write is what canonicalises. Applying and removing a
      // tenure filter returns to the same *state*, so the URL that results is
      // the canonical spelling of the state the link described.
      click(facetChip('Tenure'));
      await settle();
      click(buttonByText('6 months', $('[aria-label="Tenure options"]')));
      await waitFor(() => app.currentUrl().includes('tenure=6'), { label: `${input} filter` });
      click(pill('Tenure: 6 months'));
      await waitFor(() => !app.currentUrl().includes('tenure='), { label: `${input} unfilter` });
      check(`${input} → ${expected} after a user write`, app.currentUrl(), expected);
    }

    /* ============================================================== */
    section('J7 · Empty state and recovery');

    await load('/?q=zzzznotabank');
    await waitFor(() => /No products/.test(resultCount()), { label: 'empty result' });
    check('empty state announces correctly', resultCount(), 'No products found');
    check(
      'empty state names the cause',
      Boolean([...$$('#products p')].find((node) => /match your filters/.test(node.textContent))),
      true,
    );
    const clear = buttonByText('Clear all filters');
    check('empty state offers a clear action', Boolean(clear), true);
    click(clear);
    await waitFor(() => app.currentUrl() === '/', { label: 'clear from empty state' });
    check('clearing from the empty state is one write', writes(), 1);
    check('clearing from the empty state returns to /', app.currentUrl(), '/');
    await waitFor(() => productCount() === 6, { label: 'recovered' });
    check('the listing recovers', resultCount(), 'Showing 1–6 of 24 products');

    // A well-formed but unknown bank id is a data question, not a syntax one:
    // it must reach the API and land in the recoverable empty state.
    await load('/?bank=not-a-real-bank');
    await waitFor(() => /No products/.test(resultCount()), { label: 'unknown bank' });
    check(
      'an unknown bank id renders the recoverable empty state',
      Boolean(buttonByText('Clear all filters')),
      true,
    );
    check('an unknown bank id does not rewrite the URL', writes(), 0);

    /* ============================================================== */
    section('J9 · Listing → details navigation (T2.6.8)');

    await load('/?q=hdfc&bank=hdfc&sort=tenureMonths&order=asc');
    await waitFor(() => productCount() > 0, { label: 'filtered listing' });

    const detailLinks = $$('#products a[href^="/marketplace/"]');
    check('every card offers a details link', detailLinks.length, productCount());
    ok('the link is a real anchor with an href', detailLinks[0]?.tagName === 'A');
    ok(
      'the href targets the product route',
      /^\/marketplace\/fd-\d+$/.test(detailLinks[0]?.getAttribute('href') ?? ''),
    );
    ok(
      'each link names its product rather than repeating "View details"',
      /^View details for /.test(detailLinks[0]?.getAttribute('aria-label') ?? ''),
    );
    check(
      'links are unique per product — no duplicated destinations',
      new Set(detailLinks.map((node) => node.getAttribute('href'))).size,
      detailLinks.length,
    );

    // Native behaviour: an anchor with an href is middle-clickable and
    // openable in a new tab by construction. What must be asserted is that
    // nothing intercepts it — a preventDefault handler would silently remove
    // exactly those affordances.
    const beforeWrites = writes();
    const plainClick = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    detailLinks[0].dispatchEvent(plainClick);
    await settle(150);
    check('opening a product performs no URL write of its own', writes(), beforeWrites);

    check(
      'the listing state is untouched by rendering links',
      app.currentUrl(),
      '/?q=hdfc&bank=hdfc&sort=tenureMonths&order=asc',
    );

    /* ============================================================== */
    section('J10 · Home → Compare entry (T2.7.3b, R15a)');

    /*
      The assertion is about the **href**, never about "navigating". `next/link`
      is not stubbed and jsdom refuses document navigation, so a probe named
      "the bar navigates to the comparison" could only ever be believed, not
      exercised (the T2.7.7 lesson). What is actually verifiable — and what the
      defect would live in — is the URL the affordance points at.
    */
    await load('/');

    const cardIds = () =>
      $$('#products li a[href^="/marketplace/"]').map((node) =>
        node.getAttribute('href').replace('/marketplace/', ''),
      );
    const compareButtons = () =>
      $$('#products button').filter((node) =>
        /^Compare /.test(node.getAttribute('aria-label') ?? ''),
      );
    const entryBar = () => $('[data-compare-entry]');
    const entryHref = () => $('[data-compare-entry] a')?.getAttribute('href');

    const ids = cardIds();
    check('the listing offers a Compare control per card', compareButtons().length, productCount());
    /* Captured before any selection, so the "unchanged" assertion below has
       something real to compare against. */
    const labelsBeforeSelection = compareButtons().map((node) => node.getAttribute('aria-label'));
    check('no entry bar with nothing selected', entryBar(), null);

    click(compareButtons()[0]);
    await settle();
    check('one product is below the threshold — still no bar', entryBar(), null);

    click(compareButtons()[1]);
    await settle();
    /*
      UX review item 2 — the first selection must be legible on its own, before
      the entry bar exists. The card carries it, not only the button.
    */
    const firstCard = () => $$('#products li')[0];
    check(
      'the first selection marks its whole card, not just the button',
      /ring-border-primary/.test(
        firstCard()?.querySelector('article > div')?.getAttribute('class') ?? '',
      ),
      true,
    );
    check(
      'the control reports the state through aria-pressed',
      compareButtons()[0]?.getAttribute('aria-pressed'),
      'true',
    );
    check(
      'and no control renames itself when selected',
      compareButtons().map((node) => node.getAttribute('aria-label')),
      labelsBeforeSelection,
    );

    ok('a second selection reveals the entry bar', Boolean(entryBar()));
    check('it reports the count', norm(entryBar().textContent).startsWith('2 selected'), true);
    check(
      'the href carries both ids, in selection order',
      entryHref(),
      `/compare?ids=${ids[0]},${ids[1]}`,
    );

    /*
      R-1 — the href is composed at render. A memoised one would keep pointing
      at two products after a third is added, and the user would arrive at a
      comparison missing the product they just chose.
    */
    click(compareButtons()[2]);
    await settle();
    check(
      'adding a third updates the href rather than going stale',
      entryHref(),
      `/compare?ids=${ids[0]},${ids[1]},${ids[2]}`,
    );
    check('and the count follows', norm(entryBar().textContent).startsWith('3 selected'), true);

    /*
      C5 — Home is context-authoritative. Selecting products writes the store
      and nothing else: Home's own URL says nothing about the selection, and no
      navigation of any kind has occurred.
    */
    check('selecting products performs no URL write on Home', writes(), 0);
    check('and leaves Home’s URL alone', app.currentUrl(), '/');

    const beforeEntryClick = writes();
    click($('[data-compare-entry] a'));
    await settle(150);
    check(
      'the bar performs no navigation of its own — the link does it',
      writes(),
      beforeEntryClick,
    );

    /*
      UX review items 1-C2 and "the bar never obscures an interactive control".

      jsdom has no layout engine, so occlusion itself is not measurable. What is
      measurable — and what the defect actually consists of — is whether the
      page reserves room for the bar **whenever the bar can appear**. The two
      are driven by one flag, so asserting they move together is asserting the
      property; the visual confirmation stays on the manual list, where the
      audit already records it.
    */
    const reading = () => $('#products')?.closest('.container-page');
    check(
      'while the bar is shown the page reserves room for it',
      /\bpb-28\b/.test(reading()?.getAttribute('class') ?? ''),
      true,
    );
    check(
      'the bar is sticky, so it keeps its place in the flow',
      /\bsticky\b/.test(entryBar()?.getAttribute('class') ?? '') &&
        !/\bfixed\b/.test(entryBar()?.getAttribute('class') ?? ''),
      true,
    );
    /*
      Layout stability: appearing and disappearing must not reflow the content
      above. The card count and the reading container are read before and after
      Clear — a bar that pushed or pulled the grid would change one of them.
    */
    const cardsWhileShown = productCount();

    click(buttonByText('Clear', entryBar()));
    await settle();
    check('Clear empties the selection and hides the bar', entryBar(), null);
    check(
      'every card returns to unselected',
      compareButtons().every((node) => node.getAttribute('aria-pressed') === 'false'),
      true,
    );
    check(
      'hiding the bar releases the reserved room',
      /\bpb-28\b/.test(reading()?.getAttribute('class') ?? ''),
      false,
    );
    check('and the grid above it is unmoved — no layout jump', productCount(), cardsWhileShown);
    check('Clear writes the store, not the URL', writes(), 0);
    check('Home’s URL is still untouched', app.currentUrl(), '/');

    /* ============================================================== */
    section('J8 · Accessibility of the new controls');

    await load('/?bank=hdfc');
    await settle(200);
    const filterGroup = $('[aria-label="Filter fixed deposits"]');
    check('the chip row is a labelled group', Boolean(filterGroup), true);
    check(
      'an applied chip is pressed',
      buttonStartingWith('Bank: HDFC Bank', filterGroup)?.getAttribute('aria-pressed'),
      'true',
    );
    check(
      'an unapplied chip is not pressed',
      buttonByText('Tenure', filterGroup)?.getAttribute('aria-pressed'),
      'false',
    );
    check(
      'facet chips expose their disclosure state',
      buttonByText('Tenure', filterGroup)?.getAttribute('aria-expanded'),
      'false',
    );
    click(buttonByText('Tenure', filterGroup));
    await settle();
    check(
      'opening a facet updates aria-expanded',
      buttonByText('Tenure', filterGroup)?.getAttribute('aria-expanded'),
      'true',
    );
    check('the open panel is labelled', Boolean($('[aria-label="Tenure options"]')), true);
    check(
      'the open panel is the one the chip controls',
      $('[aria-label="Tenure options"]')?.id,
      buttonByText('Tenure', filterGroup)?.getAttribute('aria-controls'),
    );

    const firstPill = $$('[aria-label="Active filters"] button')[0];
    check(
      'a removable pill says what removing it does',
      firstPill?.getAttribute('aria-label'),
      'Remove filter: Bank: HDFC Bank',
    );
    ok(
      'the pill name contains its visible text (WCAG 2.5.3)',
      firstPill?.getAttribute('aria-label').includes(norm(firstPill.textContent)),
    );

    check('exactly one h1', $$('h1').length, 1);
    check(
      'heading order has no skipped level',
      $$('h1,h2,h3,h4')
        .map((node) => Number(node.tagName[1]))
        .every((level, index, all) => index === 0 || level - all[index - 1] <= 1),
      true,
    );
  } finally {
    app.unmount?.();
    server.close();
    dom.window.close();
  }
}
