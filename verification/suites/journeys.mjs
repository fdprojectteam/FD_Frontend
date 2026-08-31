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

/**
 * A real activation, not a synthetic bubble.
 *
 * `dispatchEvent(new MouseEvent('click'))` reaches React's listeners but skips
 * the element's *activation behaviour*, so a `type="submit"` button never
 * submits its form and a step that advances on submit looks stuck. `.click()`
 * runs the activation behaviour the way a pointer does, and still bubbles into
 * React — one helper that is honest for both kinds of control.
 */
function click(element) {
  if (!element) throw new Error('click: element not found');
  element.click();
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
  const { handlers, productSummaries } = await import(`file://${handlersOut}?t=${Date.now()}`);

  /* Totals are counted from the catalogue the handlers serve, never restated. */
  const catalogueSize = productSummaries.length;
  /** Mirrors the handler's `q` predicate — free-text search is bank name + product name. */
  const matching = (term) =>
    productSummaries.filter((product) =>
      `${product.name} ${product.bank.name}`.toLowerCase().includes(term.toLowerCase()),
    ).length;
  const withBank = (bankId) => productSummaries.filter((p) => p.bank.id === bankId).length;
  /** The announced total, read back as a number so counts compare exactly. */
  const announcedTotal = () => Number(/of (\d+) products/.exec(resultCount())?.[1] ?? NaN);
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
        '/goal-planner/plan',
        '/goal-planner?goal=emergency',
        '/goal-planner?goal=education',
        '/goal-planner?goal=retirement',
        '/goal-planner',
      ],
    );
    /*
      Stated as a rule rather than a list, so adding a fourth goal cannot
      quietly ship a column that drops the customer's choice on the floor.
    */
    ok(
      'every single-goal column carries a goal, and only the two open-ended entries do not',
      $$('a', calloutSection)
        .map((node) => node.getAttribute('href') ?? '')
        .filter((href) => !['/goal-planner', '/goal-planner/plan'].includes(href))
        .every((href) => href.startsWith('/goal-planner?goal=')),
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
    /*
      The chip sets the field through React state, so the Continue button is
      still disabled in this tick. Settling first is what a customer does by
      simply being slower than a synchronous test.
    */
    click(buttonStartingWith('₹1 lakh'));
    await settle();

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
      /Is there a maturity amount you.re aiming for\?/.test(norm(document.body.textContent)),
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

    section('G2 · Emergency fund — ₹1,00,000 in, and where it went (P0.3)');

    /**
     * ⚠ The regression this journey exists for.
     *
     * A customer choosing the emergency-fund goal and entering ₹1,00,000 was
     * shown a ₹10,000 recommendation. The split is correct and deliberate — the
     * deposit is 10% of the stated total — but the total was dropped at the
     * Amount step, so nothing after it could account for the other ₹90,000.
     *
     * This drives the real screens to the real recommendation and asserts that
     * all three figures are present and reconcile. Unlike G1 above it runs to
     * completion: the environment that truncated that journey no longer does.
     */
    await mountPlanner('/goal-planner?goal=emergency');

    const plannerText = () => norm(document.body.textContent);

    /* The goal arrived with the customer, so the investor question is first. */
    click(buttonStartingWith('No'));
    await settle();

    ok(
      'the amount question names the figure as a total for this goal',
      /Total investment/.test(plannerText()),
    );

    click(buttonStartingWith('₹1 lakh'));
    await settle(200);

    /* The split is stated at the moment of entry, with both figures. */
    ok('the entered total is shown', /₹1,00,000/.test(plannerText()));
    ok('the derived deposit is shown beside it', /₹10,000/.test(plannerText()));
    ok('and the rule relating them is named', /10% of your total investment/.test(plannerText()));

    click(buttonByText('Continue'));
    await settle(200);

    /*
      The trail is the first screen the old build lost the total on. It must
      carry both figures and the remainder — this is the assertion that would
      have failed before the fix.
    */
    ok('the trail keeps the entered total', /₹1,00,000/.test(plannerText()));
    ok('alongside what is being invested', /₹10,000/.test(plannerText()));
    ok(
      'and says the rest is not part of this plan',
      /₹90,000/.test(plannerText()) && /not part of this plan/i.test(plannerText()),
    );

    click(buttonStartingWith('1 year'));
    await settle(200);

    click(buttonByText('Skip this'));

    /*
      The engine resolves through React Query, so poll rather than assume.

      ⚠ Poll on **"We found"**, not on "fit your plan". The loading state reads
      "Finding FDs that fit your plan…", so the looser pattern matched the
      spinner and every assertion after it ran against a page that had not
      rendered a recommendation yet — passing three of them by accident. A
      progress message that contains the success message is exactly the trap a
      substring poll falls into.
    */
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (/We found/.test(plannerText())) break;
      await settle(200);
    }

    ok('the recommendation arrives', /We found \d+ FDs? that fit your plan/.test(plannerText()));

    /*
      And the money flow is still on screen beside it — the last point at which
      both figures are visible, because everything below prices the deposit.
    */
    ok('the results still show what was entered', /You entered/.test(plannerText()));
    ok('what went into the deposit', /Into this fixed deposit/.test(plannerText()));
    ok('and what did not', /Not part of this plan/.test(plannerText()));
    ok(
      'the three figures are all present together',
      /₹1,00,000/.test(plannerText()) &&
        /₹10,000/.test(plannerText()) &&
        /₹90,000/.test(plannerText()),
    );

    /*
      The booking handoff carries the **deposit**, not the total. That is
      correct — ₹10,000 is what is being invested — and it is the reason the
      breakdown above has to exist rather than being optional.
    */
    const handoffLinks = $$('a')
      .map((node) => node.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('/booking/') || href.startsWith('/marketplace/'));

    ok('a destination is offered for the recommendation', handoffLinks.length > 0);
    ok(
      'and no handoff carries the entered total',
      handoffLinks.every((href) => !href.includes('100000')),
    );
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
    /*
      Select is a live control now, not a placeholder: Comparison is one of the
      two approved entries into Booking, and the button chooses the product the
      action bar then books. What must hold is that each one still names its own
      product, is operable, and reports whether it is the current choice — an
      unlabelled or unpressed-state button is what breaks the screen reader's
      account of the selection.
    */
    check(
      'one Select per column, each naming its product and reporting its state (D3)',
      $$('table tfoot button').map((node) => [
        node.getAttribute('aria-label'),
        node.getAttribute('aria-pressed'),
        node.disabled,
      ]),
      compareNames().map((name) => [`Select ${name}`, 'false', false]),
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
      'one Select per card, each naming its product and reporting its state',
      $$(`${MOBILE} article > button`).map((node) => [
        node.getAttribute('aria-label'),
        node.getAttribute('aria-pressed'),
        node.disabled,
      ]),
      mobileNames().map((name) => [`Select ${name}`, 'false', false]),
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
    /*
      Compared by identity, not by value: `check` serialises what it is given,
      and a DOM node is circular. This is the assertion, not a formatting
      preference — two different nodes must not compare equal.
    */
    ok(
      'focus returns to the field rather than the document',
      document.activeElement === amountField(),
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

    /*
      Captured before applying, so the wait below can be on the figures
      themselves. Waiting only for the below-minimum flag was a race: the flag
      appears a render before the recomputed values do, and a `heldValues` taken
      in that window held the *previous* amount's figures — which then failed an
      assertion three steps later, intermittently and for no visible reason.
    */
    const beforeSmallAmount = compareRowValues('Maturity Value');

    click(applyButton());
    await waitFor(() => belowMinimumCount() > 0, { label: 'a column falls below its minimum' });
    await waitFor(
      () => compareRowValues('Maturity Value').join('|') !== beforeSmallAmount.join('|'),
      { label: 'the figures recompute for the smaller amount' },
    );

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
    check(
      'first load announces the range',
      resultCount(),
      `Showing 1–6 of ${catalogueSize} products`,
    );
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
    await waitFor(() => announcedTotal() === matching('hdfc'), { label: 'search applied' });
    /*
      Counted from the catalogue the handlers serve rather than restated. A
      literal "4" is an assertion about the fixture's shape, and it fails the
      day a bank gains a product — which reads as a search defect when it is
      not one. What is asserted is the rule: the listing announces exactly the
      products that match, and shows a page of them.
    */
    ok('search narrows the listing (G1 closed)', announcedTotal() < catalogueSize);
    check('and it announces exactly the matches', announcedTotal(), matching('hdfc'));
    check('rendering one card per match', productCount(), matching('hdfc'));

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
    await waitFor(() => announcedTotal() === withBank('hdfc'), { label: 'bank-only results' });
    check('the bank filter alone returns that bank’s deposits', announcedTotal(), withBank('hdfc'));

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
    /*
      A combination cannot widen the set. Asserted as that rule rather than as a
      count, because the count depends on how the fixture happens to distribute
      tenures — and the defect worth catching is a filter that silently does
      nothing, which this catches and a matching literal would not.
    */
    ok('combined filters cannot widen the set', announcedTotal() <= withBank('hdfc'));
    check('and the listing renders what it announces', productCount(), announcedTotal());

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
    await waitFor(() => resultCount().includes(`of ${catalogueSize}`), { label: 'cleared' });
    check(
      'clearing restores the full set',
      resultCount(),
      `Showing 1–6 of ${catalogueSize} products`,
    );

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
    await waitFor(() => announcedTotal() === matching('axis'), { label: 'back restores results' });
    check('back restores the result set', announcedTotal(), matching('axis'));

    app.historyBack();
    await settle(300);
    check('back again reaches the unfiltered start', app.currentUrl(), '/');
    check('the search input is cleared with it', $('#home-search-query').value, '');
    await waitFor(() => resultCount().includes(`of ${catalogueSize}`), { label: 'back to start' });

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
    check(
      'the clamp never announces a garbled range',
      resultCount(),
      `Showing 1–${withBank('hdfc')} of ${withBank('hdfc')} products`,
    );

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
    check(
      'rejected values apply no filter',
      resultCount(),
      `Showing 1–6 of ${catalogueSize} products`,
    );
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
    check('the listing recovers', resultCount(), `Showing 1–6 of ${catalogueSize} products`);

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

    /* ============================================================== */
    section('T1 · Tax Center — interest attributed to a year, and nothing more');

    /** Mounts the Tax Center over a seeded portfolio. */
    async function loadTax(holdings) {
      app.unmount?.();
      window.sessionStorage.clear();
      if (holdings !== null) {
        window.sessionStorage.setItem(
          'fd:portfolio-holdings:v2',
          JSON.stringify({ version: 2, holdings }),
        );
      }
      document.body.innerHTML = '<div id="root"></div>';
      app.resetHistory('/tax');
      requests.length = 0;
      app.mount($('#root'));
      await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), { label: 'tax render' });
      await settle(200);
    }

    const taxText = () => norm(document.body.textContent);

    const taxDeposit = (over = {}) => ({
      reference: 'FD-TAX-J1',
      productType: 'fixed-deposit',
      productId: 'fd-004',
      productName: 'State Bank of India Fixed Deposit',
      bank: {
        id: 'sbi',
        name: 'State Bank of India',
        shortCode: 'SBI',
        initials: 'SB',
        logoUrl: null,
        rating: 'AAA',
        category: 'universal',
      },
      principal: 100_000,
      annualRate: 7.85,
      tenureMonths: 24,
      isCumulative: true,
      payoutLabel: 'At maturity',
      /* Opened 22 Aug 2026: crosses 2026–27 and 2027–28. */
      startedAt: new Date(2026, 7, 22).getTime(),
      maturityInstruction: 'renew-principal-and-interest',
      fundingAccountId: null,
      status: 'active',
      ...over,
    });

    /* ---- Nothing held ---- */
    await loadTax([]);
    check('the Tax Center is titled', norm($('h1')?.textContent), 'Tax Center');
    ok(
      'an investor with no deposits is told there is nothing to report',
      /No FD interest to report yet/.test(taxText()),
    );
    ok('and is not shown a calculated zero', !/₹0\b/.test(taxText()));
    ok(
      'with the way to start',
      $$('a').some((node) => norm(node.textContent).startsWith('Explore fixed deposits')),
    );

    /* Even with nothing held, the honest statements still stand. */
    ok('TDS is stated as not connected', /Not connected/.test(taxText()));
    ok(
      'and no tax liability is claimed anywhere',
      !/tax payable|your tax liability is|estimated tax/i.test(taxText()),
    );

    /* ---- A deposit crossing two tax years ---- */
    await loadTax([taxDeposit()]);

    const selector = $('#tax-year');
    ok('a tax year can be chosen', Boolean(selector));
    ok(
      'and the years offered come from the deposit',
      [...selector.options].some((option) => option.value === '2026-27') &&
        [...selector.options].some((option) => option.value === '2027-28'),
    );

    const setYear = async (id) => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value',
      ).set;
      setter.call($('#tax-year'), id);
      $('#tax-year').dispatchEvent(new window.Event('change', { bubbles: true }));
      await settle(200);
    };

    await setYear('2026-27');
    ok('the year is named in full', /Tax Year 2026–27/.test(taxText()));
    ok(
      'the period is stated as 1 April to 31 March',
      /1 Apr 2026/.test(taxText()) && /31 Mar 2027/.test(taxText()),
    );

    /* The figure is labelled for what it is, beside itself. */
    ok('the figure is labelled platform-derived', /Platform-derived/.test(taxText()));
    ok('and a straight-line approximation', /Straight-line approximation/.test(taxText()));
    ok(
      'and explicitly not a tax liability',
      /not your complete taxable income/.test(taxText()) &&
        /not a tax liability|not your final tax liability/.test(taxText()),
    );

    /* The deposit contributes part of its interest, over the overlap only. */
    ok('the deposit is listed', /State Bank of India/.test(taxText()));
    ok('with the principal and rate', /₹1,00,000/.test(taxText()) && /7\.85%/.test(taxText()));
    ok(
      'and the applicable period is the overlap, not the whole term',
      /22 Aug 2026 – 31 Mar 2027/.test(taxText()),
    );

    const firstYearText = taxText();

    /* Switching year changes the figure — the interest is not all in one year. */
    await setYear('2027-28');
    ok('the next year is its own view', /Tax Year 2027–28/.test(taxText()));
    ok('and reports a different period', taxText() !== firstYearText);
    ok('the closing year runs from 1 April', /1 Apr 2027/.test(taxText()));

    /* ---- A deposit the platform cannot allocate ---- */
    await loadTax([taxDeposit({ reference: 'FD-TAX-DAYS', tenureMonths: 0 })]);
    ok(
      'a day-published term is reported as unallocatable',
      /Tax-year allocation unavailable/.test(taxText()),
    );
    ok('with the reason stated', /publishes this deposit’s term in days/.test(taxText()));
    ok(
      'and it is excluded from the total rather than counted as zero',
      /could not be allocated to a tax year/.test(taxText()),
    );

    /* ---- Multiple deposits, multiple banks ---- */
    await loadTax([
      taxDeposit(),
      taxDeposit({
        reference: 'FD-TAX-J2',
        productName: 'HDFC Bank Fixed Deposit',
        bank: {
          id: 'hdfc',
          name: 'HDFC Bank',
          shortCode: 'HDFC',
          initials: 'HB',
          logoUrl: null,
          rating: 'AAA',
          category: 'universal',
        },
        principal: 300_000,
        annualRate: 7.2,
      }),
    ]);
    ok(
      'every contributing deposit is listed',
      /State Bank of India/.test(taxText()) && /HDFC Bank/.test(taxText()),
    );

    /* ---- Nothing sensitive is on the page ---- */
    for (const leak of ['PAN', 'Aadhaar', 'IFSC', '••••']) {
      ok(`no ${leak} appears in the Tax Center`, !taxText().includes(leak));
    }

    /* ---- Documents: linked, never generated ---- */
    ok(
      'the available document links to reports and statements',
      $$('a').some((node) => node.getAttribute('href') === '/portfolio/reports'),
    );
    ok(
      'a bank-issued certificate is listed as unavailable',
      /Form 16A/.test(taxText()) && /no connection to bank document systems/.test(taxText()),
    );
    ok(
      'and no document is generated here',
      !$$('button').some((node) => /download|generate/i.test(norm(node.textContent))),
    );

    /* ---- Out to the portfolio and back ---- */
    ok(
      'a deposit links to the portfolio',
      $$('a').some((node) => node.getAttribute('href') === '/portfolio'),
    );

    /* ---- A refresh derives the same page ---- */
    const taxBefore = taxText();
    app.unmount?.();
    document.body.innerHTML = '<div id="root"></div>';
    app.mount($('#root'));
    await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), { label: 'tax remount' });
    await settle(200);
    check('a refresh derives the same summary', taxText(), taxBefore);

    check('the Tax Center has exactly one h1', $$('h1').length, 1);
    check(
      'and no heading level is skipped',
      $$('h1,h2,h3,h4')
        .map((node) => Number(node.tagName[1]))
        .every((level, index, all) => index === 0 || level - all[index - 1] <= 1),
      true,
    );

    window.sessionStorage.clear();

    section('A1 · Admin — an operations console over the same platform');

    /** Mounts an admin route with an optional seeded portfolio. */
    async function loadAdmin(url, { holdings = null } = {}) {
      app.unmount?.();
      window.sessionStorage.clear();
      if (holdings !== null) {
        window.sessionStorage.setItem(
          'fd:portfolio-holdings:v2',
          JSON.stringify({ version: 2, holdings }),
        );
      }
      document.body.innerHTML = '<div id="root"></div>';
      app.resetHistory(url);
      requests.length = 0;
      app.mount($('#root'));
      await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), { label: `load ${url}` });
      await settle(300);
    }

    const adminText = () => norm(document.body.textContent);
    const setRole = async (role) => {
      const select = $('#admin-role');
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value',
      ).set;
      setter.call(select, role);
      select.dispatchEvent(new window.Event('change', { bubbles: true }));
      await settle(200);
    };

    const adminHolding = {
      reference: 'FD-ADMIN-1',
      productType: 'fixed-deposit',
      productId: 'fd-002',
      productName: 'HDFC Bank Fixed Deposit',
      bank: {
        id: 'hdfc',
        name: 'HDFC Bank',
        shortCode: 'HDFC',
        initials: 'HB',
        logoUrl: null,
        rating: 'AAA',
        category: 'universal',
      },
      principal: 800_000,
      annualRate: 7.35,
      tenureMonths: 24,
      isCumulative: true,
      payoutLabel: 'At maturity',
      startedAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
      maturityInstruction: 'renew-principal-and-interest',
      fundingAccountId: null,
      status: 'active',
    };

    /* ---- Overview ---- */
    await loadAdmin('/admin', { holdings: [adminHolding] });
    check('the console opens on operations', norm($('h1')?.textContent), 'Operations overview');
    ok('it leads with what needs attention', /Needs attention/.test(adminText()));
    ok('and its own navigation is present', Boolean($('nav[aria-label="Operations"]')));

    /*
      The two portals stay separate: the console has no customer navigation, and
      nothing in it links into the customer product's own shell.
      */
    ok('the customer navigation is absent', !$('nav[aria-label="Main"]'));
    ok(
      'the demonstration is declared on every screen',
      /Demo environment/.test(adminText()) && /not authorisation/.test(adminText()),
    );
    ok(
      'the audit trail starts empty rather than pre-populated',
      /No actions have been taken yet/.test(adminText()),
    );

    /* ---- Customers ---- */
    await loadAdmin('/admin/customers', { holdings: [adminHolding] });
    check('the register is titled', norm($('h1')?.textContent), 'Customers');
    ok('the live investor is listed', /CUS-1001/.test(adminText()));
    ok('demonstration customers are tagged', /Demo/.test(adminText()));
    ok('their deposits are counted from the portfolio', /₹8,00,000/.test(adminText()));

    /* No identity document is anywhere on an operations screen. */
    for (const leak of ['PAN', 'Aadhaar', 'IFSC', '••••']) {
      ok(`no ${leak} appears in the register`, !adminText().includes(leak));
    }

    type($('#admin-customer-search'), 'meera');
    await settle(200);
    ok(
      'search narrows the register',
      /Meera Iyer/.test(adminText()) && !/CUS-1001/.test(adminText()),
    );

    type($('#admin-customer-search'), 'zzzz');
    await settle(200);
    ok('and a search that matches nothing says so', /No customer matched/.test(adminText()));

    await loadAdmin('/admin/customers/CUS-1024');
    check('a customer opens', norm($('h1')?.textContent), 'Meera Iyer');
    ok(
      'showing verification and deposits',
      /Verification/.test(adminText()) && /Fixed deposits/.test(adminText()),
    );

    await loadAdmin('/admin/customers/CUS-9999');
    check('an unknown customer is refused', norm($('h1')?.textContent), 'Customer not found');

    /* ---- Applications: review, then decide ---- */
    await loadAdmin('/admin/applications', { holdings: [adminHolding] });
    check('the queue is titled', norm($('h1')?.textContent), 'Applications');
    ok('a demonstration application is queued', /APP-1042/.test(adminText()));
    ok(
      'and a confirmed deposit appears as completed',
      /FD-ADMIN-1/.test(adminText()) && /Completed/.test(adminText()),
    );

    await loadAdmin('/admin/applications/APP-1042');
    ok('an application opens', /APP-1042/.test(adminText()));
    ok('with a decision available', Boolean(buttonByText('Approve (demo)')));
    ok(
      'labelled as a demonstration rather than a bank submission',
      /No bank receives an application from this console/.test(adminText()),
    );

    click(buttonByText('Approve (demo)'));
    await settle(300);
    ok('the decision is reflected', /Approved \(simulated\)/.test(adminText()));
    ok('and recorded as activity', /approved \(simulated\)/.test(adminText()));

    /* The queue reads the same journal, so it agrees. */
    app.visit('/admin/applications');
    await settle(400);
    ok(
      'the queue shows the decision the audit log recorded',
      /Approved \(simulated\)/.test(adminText()),
    );

    /* ---- Maker and checker ---- */
    app.visit('/admin/products');
    await waitFor(() => /FD products/.test(adminText()), { label: 'products load' });
    await settle(400);
    ok('the catalogue is listed', /Base rate/.test(adminText()));
    ok(
      'and the console says a change here does not alter it',
      /Changes proposed here do not alter it/.test(adminText()),
    );

    app.visit('/admin/products/fd-002');
    await waitFor(
      () => Boolean(buttonByText('Propose change')) || /Rate change/.test(adminText()),
      {
        label: 'product detail',
      },
    );
    await settle(300);

    /* Operations approves but never proposes — the separation is the control. */
    ok(
      'operations cannot propose a change',
      !buttonByText('Propose change') && /does not hold/.test(adminText()),
    );

    await setRole('product');
    await settle(300);
    ok('a product admin can', Boolean(buttonByText('Propose change')));

    type($('#admin-proposed-rate'), '7.6');
    await settle(200);
    click(buttonByText('Propose change'));
    await settle(300);

    ok('the proposal is pending review', /Pending review/.test(adminText()));
    ok('and states what would change', /→/.test(adminText()));
    ok(
      'the proposing role cannot approve its own change',
      !buttonByText('Approve (demo)') && /does not hold/.test(adminText()),
    );

    await setRole('operations');
    await settle(300);
    ok('the checker can', Boolean(buttonByText('Approve (demo)')));
    click(buttonByText('Approve (demo)'));
    await settle(300);
    ok('an approved change says it is simulated', /Approved \(simulated\)/.test(adminText()));
    ok(
      'and is never described as published',
      !/Published/.test(adminText()) &&
        /publishing requires a bank integration|not connected/i.test(adminText()),
    );

    /* ---- Verification ---- */
    app.visit('/admin/verification');
    await settle(400);
    ok('verification cases are listed', /Needs a decision/.test(adminText()));
    ok(
      'and no external check is claimed',
      /registry or bureau check has been performed/.test(adminText()),
    );

    /* ---- Support operations ---- */
    app.visit('/admin/support');
    await settle(400);
    ok('the support queue is the customer’s own', /SUP-1042/.test(adminText()));
    ok(
      'operations cannot act on it',
      !buttonByText('Resolved') && /does not hold/.test(adminText()),
    );

    await setRole('support');
    await settle(300);
    click(buttonByText('Resolved'));
    await settle(300);
    ok('a support admin can resolve a request', /Resolved/.test(adminText()));
    ok(
      'and nothing is sent to the customer',
      /No email, message or notification is sent/.test(adminText()),
    );

    /* ---- Audit ---- */
    app.visit('/admin/audit');
    await settle(400);
    ok('every action taken is in the log', /Application APP-1042/.test(adminText()));
    ok('including the product change', /Rate change/.test(adminText()));
    ok('and the support change', /Support request SUP-1042/.test(adminText()));
    ok(
      'each line names the role that acted',
      /Product Administrator|Operations Administrator/.test(adminText()),
    );
    ok('and declares itself simulated', /Simulated/.test(adminText()));

    /* ---- An auditor sees everything and changes nothing ---- */
    await setRole('auditor');
    await settle(300);
    app.visit('/admin/applications/APP-1043');
    await settle(400);
    ok(
      'an auditor cannot decide an application',
      !buttonByText('Approve (demo)') && /does not hold/.test(adminText()),
    );

    /* ---- Refresh keeps the console coherent ---- */
    app.unmount?.();
    document.body.innerHTML = '<div id="root"></div>';
    app.mount($('#root'));
    await waitFor(() => Boolean($('h1')), { label: 'admin remount' });
    await settle(300);
    ok('a refresh keeps the chosen role', /Auditor/.test(adminText()));

    window.sessionStorage.clear();

    section('S1 · Support — self-service first, context carried, nothing faked');

    /** Mounts a support route over a seeded portfolio and support store. */
    async function loadSupport(url, { holdings = null, requests = null } = {}) {
      app.unmount?.();
      window.sessionStorage.clear();
      if (holdings !== null) {
        window.sessionStorage.setItem(
          'fd:portfolio-holdings:v2',
          JSON.stringify({ version: 2, holdings }),
        );
      }
      if (requests !== null) {
        window.sessionStorage.setItem(
          'fd:support-requests:v1',
          JSON.stringify({ version: 1, requests }),
        );
      }
      document.body.innerHTML = '<div id="root"></div>';
      app.resetHistory(url);
      requests_.length = 0;
      app.mount($('#root'));
      await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), { label: `load ${url}` });
      await settle(200);
    }

    /* `requests` is the journey's own name for the seeded list; the harness's
       recorded network calls are `requests` too, so alias the outer one. */
    const requests_ = requests;

    const supportText = () => norm(document.body.textContent);

    const supportHolding = {
      reference: 'FD-SUP-JOURNEY',
      productType: 'fixed-deposit',
      productId: 'fd-008',
      productName: 'AU Small Finance Bank Fixed Deposit',
      bank: {
        id: 'au-small-finance',
        name: 'AU Small Finance Bank',
        shortCode: 'AU',
        initials: 'AU',
        logoUrl: null,
        rating: 'AA',
        category: 'small-finance',
      },
      principal: 300_000,
      annualRate: 7.75,
      tenureMonths: 18,
      isCumulative: true,
      payoutLabel: 'At maturity',
      startedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      maturityInstruction: 'pay-out',
      fundingAccountId: null,
      status: 'active',
    };

    /* ---- Support home ---- */
    await loadSupport('/support');
    check('support is titled as a question', norm($('h1')?.textContent), 'How can we help?');
    ok('self-service comes first', Boolean($('#support-search')));
    ok(
      'and it is described as a search rather than an assistant',
      /not an assistant/.test(supportText()),
    );
    ok('topics are offered', /Popular topics/.test(supportText()));

    /* Searching filters the help content deterministically. */
    type($('#support-search'), 'maturity');
    await settle(200);
    ok(
      'a search finds the article about maturity dates',
      /Where can I see my maturity date/.test(supportText()),
    );
    ok(
      'and links to the screen that answers it',
      $$('a').some((node) => node.getAttribute('href') === '/portfolio/maturities'),
    );

    type($('#support-search'), 'mortgage');
    await settle(200);
    ok('a word we have no content for says so', /No help articles matched/.test(supportText()));
    ok(
      'and offers the way to ask',
      $$('a').some((node) => node.getAttribute('href') === '/support/new'),
    );

    /* Topics filter in place. */
    type($('#support-search'), '');
    await settle(100);
    click(buttonByText('Bank account'));
    await settle(200);
    ok('a topic lists its own articles', /How do I add a bank account/.test(supportText()));

    /* The seeded demonstration requests are visible and labelled. */
    ok('recent requests are shown', /SUP-1042/.test(supportText()));
    ok('with their status in words', /In progress/.test(supportText()));
    ok(
      'and the page states that nothing is received by anyone',
      /No support team, bank or external system receives them/.test(supportText()),
    );

    /* ---- Empty state ---- */
    await loadSupport('/support', { requests: [] });
    ok(
      'a customer who has never asked is told so',
      /You haven't contacted support yet|You haven’t contacted support yet/.test(supportText()),
    );

    /* ---- Contextual contact ---- */
    await loadSupport('/support/new?holding=FD-SUP-JOURNEY', { holdings: [supportHolding] });
    check('contacting support is titled', norm($('h1')?.textContent), 'Contact support');

    /*
      The point of the module: the deposit came with the customer, so the
      product states it rather than asking which one they mean.
    */
    ok(
      'the deposit the customer arrived from is already known',
      /AU Small Finance Bank fixed deposit/.test(supportText()) &&
        /FD-SUP-JOURNEY/.test(supportText()),
    );
    ok('and it is never asked for', !/which fd|which deposit/i.test(supportText()));
    ok('nor is any figure about it restated', !/₹3,00,000/.test(supportText()));
    ok(
      'the customer is warned not to send credentials',
      /do not include your full bank account number/i.test(supportText()),
    );
    ok(
      'and told what submitting actually does',
      /no support desk to receive it/.test(supportText()),
    );

    /* A reference that names nothing falls back to general support. */
    await loadSupport('/support/new?holding=FD-NOT-HELD', { holdings: [supportHolding] });
    ok(
      'an unknown deposit is named as no longer held',
      /no longer in your portfolio/.test(supportText()),
    );
    ok(
      'and the request is raised as general support instead',
      /raised as general support/.test(supportText()),
    );

    /* ---- Creating a request ---- */
    await loadSupport('/support/new?holding=FD-SUP-JOURNEY', {
      holdings: [supportHolding],
      requests: [],
    });

    const supportField = (text) => {
      const label = $$('label').find((node) => norm(node.textContent) === text);
      return label === undefined ? undefined : $(`#${CSS.escape(label.getAttribute('for') ?? '')}`);
    };

    click(buttonByText('Add account') ?? buttonByText('Submit request'));
    await settle(200);
    ok('an empty request is refused', /Give your request a short subject/.test(supportText()));

    type(supportField('Subject'), 'Maturity instruction question');
    const messageField = supportField('Your message');
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    ).set;
    setter.call(messageField, 'I would like to change what happens when this deposit matures.');
    messageField.dispatchEvent(new window.Event('input', { bubbles: true }));
    await settle(100);

    click(buttonByText('Submit request'));
    await settle(300);

    ok(
      'a submitted request opens on its own page',
      /\/support\/requests\/SUP-/.test(app.currentUrl()),
    );
    ok('numbered for the customer to quote', /SUP-\d+/.test(supportText()));
    ok('it is open', /Open/.test(supportText()));
    ok(
      'the platform acknowledges it without claiming anyone received it',
      /recorded in this demonstration environment/.test(supportText()) &&
        /No support team, bank or external system was contacted/.test(supportText()),
    );
    ok(
      'the customer’s own words are kept',
      /what happens when this deposit matures/.test(supportText()),
    );
    ok(
      'the deposit it is about is named from the portfolio',
      /AU Small Finance Bank fixed deposit/.test(supportText()),
    );
    ok('and the next step is stated', /Next step/.test(supportText()));
    ok(
      'no agent, team or reply time is claimed',
      !/an agent|our team is|within \d+ hours|typically replies/i.test(supportText()),
    );

    /* Replying is a real action, so the control does something. */
    const replyField = $('#support-reply');
    setter.call(replyField, 'Any update on this?');
    replyField.dispatchEvent(new window.Event('input', { bubbles: true }));
    await settle(100);
    click(buttonByText('Send reply'));
    await settle(200);
    ok('a reply joins the conversation', /Any update on this\?/.test(supportText()));

    /* ---- An unknown request number ---- */
    await loadSupport('/support/requests/SUP-9999', { requests: [] });
    ok(
      'an unknown request is refused plainly',
      /^We couldn.t find that request$/.test(norm($('h1')?.textContent)),
    );
    ok(
      'with the way back',
      $$('a').some((node) => node.getAttribute('href') === '/support'),
    );

    window.sessionStorage.clear();

    section('F1 · Family — a projection over what each member holds');

    /** Mounts the family dashboard over a seeded portfolio for the primary member. */
    async function loadFamily(holdings) {
      app.unmount?.();
      window.sessionStorage.clear();
      if (holdings) {
        window.sessionStorage.setItem(
          'fd:portfolio-holdings:v2',
          JSON.stringify({ version: 2, holdings }),
        );
      }
      document.body.innerHTML = '<div id="root"></div>';
      app.resetHistory('/family');
      requests.length = 0;
      app.mount($('#root'));
      await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), { label: 'family render' });
      await settle(200);
    }

    const familyText = () => norm(document.body.textContent);

    const ownFd = {
      reference: 'FD-FAM-1',
      productType: 'fixed-deposit',
      productId: 'fd-002',
      productName: 'HDFC Bank Fixed Deposit',
      bank: {
        id: 'hdfc',
        name: 'HDFC Bank',
        shortCode: 'HDFC',
        initials: 'HB',
        logoUrl: null,
        rating: 'AAA',
        category: 'universal',
      },
      principal: 1_000_000,
      annualRate: 7.5,
      tenureMonths: 24,
      isCumulative: true,
      payoutLabel: 'At maturity',
      startedAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
      maturityInstruction: 'renew-principal-and-interest',
      fundingAccountId: null,
      status: 'active',
    };

    /* ---- The investor holds nothing of their own ---- */
    await loadFamily(null);
    check('the family view is titled', norm($('h1')?.textContent), 'Family financial overview');
    ok('the family is composed of its members', /Your family/.test(familyText()));
    ok('and the primary member is named as such', /Primary member/.test(familyText()));

    /*
      The rule this module must never break: a demonstration member's money is
      never presented as the investor's own.
    */
    ok('a demonstration member is labelled', /Demo data|Demonstration member/.test(familyText()));
    ok(
      'and the totals say how much of them is demonstration data',
      /demonstration data for/.test(familyText()),
    );
    ok(
      'the screen never claims anyone else signed in',
      !/signed in as/i.test(familyText()) && /has not signed in/.test(familyText()),
    );

    /* ---- The investor's own deposit joins the family total ---- */
    await loadFamily([ownFd]);
    ok('the investor’s own deposit is counted', /₹10,00,000/.test(familyText()));
    ok('and the family total is the sum of both', /₹15,00,000/.test(familyText()));
    ok(
      'each member’s deposits are attributed to them',
      /1 FD/.test(familyText()) && /Spouse/.test(familyText()),
    );

    /* Upcoming maturities come from the schedule, with whose deposit each is. */
    ok('upcoming maturities are listed', /Upcoming family maturities/.test(familyText()));
    ok('with the expected value the portfolio derived', /Expected maturity ₹/.test(familyText()));

    /* Goals report only what the platform can attribute. */
    ok(
      'a goal with nothing linked says so rather than showing zero',
      /No deposits are linked to this goal yet/.test(familyText()),
    );
    ok('and the reason is stated once', /Booking does not yet record/.test(familyText()));

    /* ---- Nothing sensitive is anywhere on the page ---- */
    for (const leak of ['PAN', 'Aadhaar', 'IFSC', '••••']) {
      ok(`no ${leak} appears on the family view`, !familyText().includes(leak));
    }

    /* ---- Every destination is a route that exists ---- */
    const familyLinks = () => $$('a').map((node) => node.getAttribute('href') ?? '');
    for (const destination of [
      '/portfolio',
      '/portfolio/maturities',
      '/goal-planner',
      '/portfolio/reports',
    ]) {
      ok(`the family view leads to ${destination}`, familyLinks().includes(destination));
    }
    ok(
      'and offers no link that goes nowhere',
      familyLinks().every((href) => href.length > 0),
    );

    /* ---- A refresh derives the same view ---- */
    const familyBefore = familyText();
    app.unmount?.();
    document.body.innerHTML = '<div id="root"></div>';
    app.mount($('#root'));
    await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), { label: 'family remount' });
    await settle(200);
    check('a refresh derives the same family view', familyText(), familyBefore);

    check('the family view has exactly one h1', $$('h1').length, 1);
    check(
      'and no heading level is skipped',
      $$('h1,h2,h3,h4')
        .map((node) => Number(node.tagName[1]))
        .every((level, index, all) => index === 0 || level - all[index - 1] <= 1),
      true,
    );

    window.sessionStorage.clear();

    section('B1 · Bank accounts — the vault, and what Booking refers to');

    /**
     * Mounts a vault route.
     *
     * `seed` is written to the vault's own key when given; passing `null` lets
     * the store seed its demonstration accounts, and passing `[]` produces the
     * empty vault a new customer sees.
     */
    async function loadVault(url, seed) {
      app.unmount?.();
      window.sessionStorage.clear();
      if (seed !== null) {
        window.sessionStorage.setItem(
          'fd:bank-accounts:v1',
          JSON.stringify({ version: 1, accounts: seed }),
        );
      }
      document.body.innerHTML = '<div id="root"></div>';
      app.resetHistory(url);
      requests.length = 0;
      app.mount($('#root'));
      await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), { label: `load ${url}` });
      await settle(200);
    }

    const vaultText = () => norm(document.body.textContent);

    /* ---- Empty vault ---- */
    await loadVault('/bank-accounts', []);
    check('an empty vault is titled', norm($('h1')?.textContent), 'Bank accounts');
    ok('and states what an account is for', /fund your investments/.test(vaultText()));
    ok(
      'with one way forward',
      $$('a').some((node) => node.getAttribute('href') === '/bank-accounts/new'),
    );
    ok('and no invented account', !/••••/.test(vaultText()));

    /* ---- The seeded vault ---- */
    await loadVault('/bank-accounts', null);

    const accountLinks = () =>
      $$('a')
        .map((node) => node.getAttribute('href') ?? '')
        .filter((href) => href.startsWith('/bank-accounts/') && href !== '/bank-accounts/new');

    check('every saved account is listed', accountLinks().length, 3);
    ok('each is masked to four digits', /•••• 4587/.test(vaultText()));
    ok(
      'and no full account number is anywhere on the page',
      !/\d{5,}/.test(vaultText().replace(/[A-Z]{4}0[A-Z0-9]{6}/g, '')),
    );

    /*
      The URL is the other place masking can leak. An id built from the last
      four digits would put them in the address bar and in history.
    */
    ok(
      'no account id carries part of the account number',
      accountLinks().every((href) => !/4587|2456|7890/.test(href)),
    );

    ok('exactly one account is marked primary', vaultText().split('Primary').length - 1 === 1);
    ok(
      'a simulated check is labelled as one',
      /Demo verified/.test(vaultText()) && !/Verified by bank/i.test(vaultText()),
    );
    ok('an account needing a decision says so', /Needs your attention/.test(vaultText()));
    ok(
      'and the vault states that no credential is ever asked for',
      /never ask for your internet banking password/.test(vaultText()),
    );

    /* ---- One account ---- */
    await loadVault('/bank-accounts/ba-demo-hdfc', null);
    check('the account names its bank', norm($('h1')?.textContent), 'HDFC Bank');
    ok('shows the masked number', /•••• 2456/.test(vaultText()));
    ok('the IFSC and branch', /HDFC0005678/.test(vaultText()) && /Koramangala/.test(vaultText()));
    ok('and what it is used for', /Used for/.test(vaultText()));
    ok('a verified account is not offered another check', !buttonByText('Mark as verified (demo)'));
    ok('a non-primary account can be made primary', Boolean(buttonByText('Set as primary')));

    click(buttonByText('Set as primary'));
    await settle(200);
    ok('and doing so is reflected immediately', !buttonByText('Set as primary'));

    /* One primary, always: the account that was primary no longer is. */
    await loadVault('/bank-accounts', null);
    const primaryCount = vaultText().split('Primary').length - 1;
    check('there is still exactly one primary account', primaryCount, 1);

    /* ---- Adding an account ---- */
    await loadVault('/bank-accounts/new', null);
    check('the add screen is titled', norm($('h1')?.textContent), 'Add a bank account');

    const fieldByLabel = (text) => {
      const label = $$('label').find((node) => norm(node.textContent) === text);
      return label === undefined ? undefined : $(`#${CSS.escape(label.getAttribute('for') ?? '')}`);
    };

    ok(
      'the customer is never asked to type the bank',
      !$$('label').some((node) => /Bank name|Branch name/.test(norm(node.textContent))),
    );
    ok('and never for a banking credential', !$$('input').some((node) => node.type === 'password'));

    /* An IFSC that is well formed but unknown is refused, not guessed at. */
    type(fieldByLabel('IFSC'), 'HDFC0009999');
    await settle(200);
    ok('an unknown IFSC identifies no bank', /couldn’t be identified/.test(vaultText()));
    ok('and names none', !/HDFC Bank/.test(vaultText()));

    type(fieldByLabel('IFSC'), 'HDFC0001234');
    await settle(200);
    ok(
      'a known IFSC resolves the bank and branch',
      /HDFC Bank/.test(vaultText()) && /Perungudi/.test(vaultText()),
    );

    type(fieldByLabel('Account number'), '123456789012');
    type(fieldByLabel('Confirm account number'), '123456789013');
    await settle(100);
    click(buttonByText('Add account'));
    await settle(200);
    ok('a mistyped confirmation stops the save', /do not match/.test(vaultText()));

    type(fieldByLabel('Confirm account number'), '123456789012');
    await settle(100);
    click(buttonByText('Add account'));
    await settle(300);

    ok('a saved account opens on its own page', app.currentUrl().startsWith('/bank-accounts/ba-'));
    ok(
      'the number typed is nowhere in the URL',
      !app.currentUrl().includes('123456789012') && !/\d{5,}/.test(app.currentUrl()),
    );
    ok(
      'nor in what is stored',
      !(window.sessionStorage.getItem('fd:bank-accounts:v1') ?? '').includes('123456789012'),
    );
    ok('only its last four digits are shown', /•••• 9012/.test(vaultText()));

    /*
      The distinction this module exists to draw: details supplied is not
      ownership verified, and the product says so rather than showing a tick.
    */
    ok('a new account is not verified', /Not verified/.test(vaultText()));
    ok(
      'and the reason is the missing provider, not a promise',
      /No verification provider is connected/.test(vaultText()),
    );

    click(buttonByText('Mark as verified (demo)'));
    await settle(200);
    ok('the demonstration’s own check is labelled as one', /Demo verified/.test(vaultText()));
    ok(
      'and still says no bank was contacted',
      /No bank or verification provider was contacted/.test(vaultText()),
    );

    /* ---- Removal rules ---- */
    ok('an account funding nothing can be removed', Boolean(buttonByText('Remove account')));
    click(buttonByText('Remove account'));
    await settle(100);
    ok('and removal is confirmed first', Boolean(buttonByText('Yes, remove it')));

    await loadVault('/bank-accounts/ba-demo-axis', null);
    ok(
      'the primary account is not removable while others exist',
      !buttonByText('Remove account') && /Make another account primary/.test(vaultText()),
    );

    /* ---- An id that names no account ---- */
    await loadVault('/bank-accounts/ba-not-here', null);
    check(
      'an unknown account is refused plainly',
      norm($('h1')?.textContent),
      'This account is not in your vault',
    );
    ok(
      'with the way back',
      $$('a').some((node) => node.getAttribute('href') === '/bank-accounts'),
    );

    window.sessionStorage.clear();

    section('P1 · One application step, three banks’ forms');

    /**
     * The bank form step, mounted over a draft that has reached it.
     *
     * The draft is written to the booking's own key rather than driven through
     * six preceding screens: what this journey is about is the *application*,
     * and the steps before it already have their own coverage. The nominee is
     * deliberately not seeded — the draft schema excludes it on purpose, so
     * every bank's form should ask for the nominee rather than produce one.
     */
    async function loadApplication(productId) {
      app.unmount?.();
      window.sessionStorage.clear();
      window.sessionStorage.setItem(
        `fd:booking-draft:v4:${productId}`,
        JSON.stringify({
          version: 4,
          draft: {
            bookingId: `journey-${productId}`,
            productId,
            investment: { amount: 500_000, tenureMonths: 12, payoutOption: 'at-maturity' },
            application: {
              acceptedDeclarations: [],
              preparedAt: null,
              identityMethod: 'existing-kyc',
            },
            identity: { confirmedAt: Date.now(), method: 'existing-kyc' },
            bankAccountId: 'ba-demo-axis',
            declarations: { detailsConfirmed: false, termsAccepted: false },
            paymentMethod: null,
            confirmation: null,
            furthestStep: 'application',
            /* A draft expires; a stale timestamp would simply not be restored. */
            updatedAt: Date.now(),
          },
        }),
      );
      document.body.innerHTML = '<div id="root"></div>';
      app.resetHistory(`/booking/${productId}/application`);
      requests.length = 0;
      app.mount($('#root'));
      await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), {
        label: `application ${productId}`,
      });
      await settle(250);
    }

    const formText = () => norm(document.body.textContent);
    const labelled = (text) =>
      $$('label').find((node) => norm(node.textContent).replace(/ \(optional\)$/, '') === text);
    const inputFor = (text) => {
      const label = labelled(text);
      return label === undefined ? undefined : $(`#${CSS.escape(label.getAttribute('for') ?? '')}`);
    };

    /*
      One renderer, three banks. Each form must be recognisably its own — the
      bank's name, the document it was transcribed from — while the screen,
      the controls and the step furniture stay identical. That is the whole
      claim of the schema-driven approach, and it is worth asserting on the
      rendered page rather than only on the templates.
    */
    for (const [productId, bankName, formPath] of [
      ['fd-004', 'State Bank of India', '/bank-forms/sbi/'],
      ['fd-008', 'AU Small Finance Bank', '/bank-forms/au-small/'],
      ['fd-015', 'DBS Bank India', '/bank-forms/dbs/'],
    ]) {
      await loadApplication(productId);

      ok(`${bankName} · the application step renders`, Boolean($('h1')));
      ok(`${bankName} · the form names its own bank`, formText().includes(bankName));
      ok(
        `${bankName} · and links to that bank's own document`,
        $$('a').some((node) => (node.getAttribute('href') ?? '').startsWith(formPath)),
      );
      ok(
        `${bankName} · nothing claims the form was sent`,
        !/submitted to the bank|sent to the bank|received by the bank/i.test(formText()),
      );
      ok(
        `${bankName} · and it says no submission route is connected`,
        /No submission route to the bank is connected/.test(formText()),
      );
      ok(
        `${bankName} · the signature is stated rather than captured`,
        /requires your signature/.test(formText()),
      );
      /*
        The account the deposit is funded from is referenced, never reproduced.
        Nine consecutive digits is the shape of an account number; the only long
        runs that may appear are the ones the customer chose (an amount is
        grouped, a rate is not).
      */
      ok(`${bankName} · no full account number is on the page`, !/\d{9,}/.test(formText()));
    }

    /*
      ⚠ The regression this journey exists for. A prefilled field used to become
      static text the moment it had a value, so the AU nominee address accepted
      exactly one character and then had no input left. Typing twice, into every
      text field on every bank's form, is the check that cannot pass by accident.
    */
    for (const [productId, bankName] of [
      ['fd-004', 'State Bank of India'],
      ['fd-008', 'AU Small Finance Bank'],
      ['fd-015', 'DBS Bank India'],
    ]) {
      await loadApplication(productId);

      const editable = $$('input').filter(
        (node) => node.type === 'text' && !node.disabled && !node.readOnly,
      );
      ok(`${bankName} · has fields the customer can fill`, editable.length > 0);

      let keptEveryEdit = true;
      let acceptedASecondEdit = true;

      for (const input of editable) {
        type(input, 'First');
        await settle(60);
        const live = $(`#${CSS.escape(input.id)}`) ?? input;
        if (live.tagName !== 'INPUT') {
          keptEveryEdit = false;
          continue;
        }
        type(live, 'Second value');
        await settle(60);
        const after = $(`#${CSS.escape(input.id)}`) ?? live;
        if (after.tagName !== 'INPUT' || after.value !== 'Second value') {
          acceptedASecondEdit = false;
        }
      }

      ok(`${bankName} · every field is still an input after one keystroke`, keptEveryEdit);
      ok(`${bankName} · and accepts a second, different value`, acceptedASecondEdit);
    }

    /*
      DBS's form branches, and the schema branches with it. Form 60 is asked
      only where PAN does not apply — so it must be absent from the page until
      that answer is given, and gone again when it is withdrawn.
    */
    await loadApplication('fd-015');

    ok(
      'DBS asks for no PAN, because its form does not',
      labelled('PAN') === undefined && !/Permanent Account Number/i.test(formText()),
    );
    ok('nor a date of birth', labelled('Date of birth') === undefined);
    ok('nor a mobile number', labelled('Mobile') === undefined);
    ok('and says the bank identifies the applicant itself', /CIF ID/.test(formText()));
    /*
      ⚠ DBS publishes no rate on its form — it refers the customer to the branch.
      The figure the platform shows is its own, and the customer must be able to
      read that on the page rather than in a source comment.
    */
    ok('the rate on the page is marked a demonstration figure', /demonstration/i.test(formText()));
    ok(
      'and DBS is not said to have published or confirmed it',
      !/DBS (has )?(published|confirmed)/i.test(formText()),
    );
    /*
      The funding account appears only once the customer says they are debiting
      an account — which is what the form asks. Until then it is not on the page
      at all.
    */
    ok(
      'the funding account is not asked before the payment mode is chosen',
      labelled('Account number') === undefined,
    );
    ok(
      'and Form 60 is not asked before PAN applicability is answered',
      labelled('Form 60 will be submitted') === undefined,
    );

    /*
      The conditional itself, driven through the real select. Radix renders a
      listbox rather than a native <select>, so the answer is given the way the
      screen offers it.
    */
    const panTrigger = $$('button').find(
      (node) => norm(node.getAttribute('aria-label') ?? '') === 'PAN applicable',
    );
    ok('the PAN-applicable question is on the page', Boolean(panTrigger));

    if (panTrigger) {
      click(panTrigger);
      await settle(150);
      const no = $$('[role="option"]').find((node) => norm(node.textContent) === 'No');
      ok('and offers "No"', Boolean(no));
      if (no) {
        click(no);
        await settle(250);
        ok(
          'answering "No" asks for the Form 60 undertaking',
          Boolean(labelled('Form 60 will be submitted')),
        );
        const box = inputFor('Form 60 will be submitted');
        ok('as a tick, not a text box', box?.type === 'checkbox');
      }
    }

    section('R1 · Reports — Portfolio → Reports → Document → back');

    /**
     * Mounts a reports route over a seeded portfolio.
     *
     * The holdings go into `sessionStorage` because that is where the portfolio
     * genuinely lives, and the investor record still comes from the real
     * handlers — so the document is assembled from the same two sources the
     * application uses.
     */
    async function loadReports(url, holdings) {
      app.unmount?.();
      window.sessionStorage.clear();
      if (holdings) {
        window.sessionStorage.setItem(
          'fd:portfolio-holdings:v2',
          JSON.stringify({ version: 2, holdings }),
        );
      }
      document.body.innerHTML = '<div id="root"></div>';
      app.resetHistory(url);
      requests.length = 0;
      app.mount($('#root'));
      await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), { label: `load ${url}` });
      await settle(200);
    }

    const reportBank = (id, name, initials) => ({
      id,
      name,
      shortCode: initials,
      initials,
      logoUrl: null,
      rating: 'AA+',
      category: 'universal',
    });

    /* Eighteen months, opened six months ago — a running deposit with a date. */
    const datedFd = {
      reference: 'FD-REP-1',
      productType: 'fixed-deposit',
      productId: 'fd-002',
      productName: 'HDFC Bank Fixed Deposit',
      bank: reportBank('hdfc', 'HDFC Bank', 'HD'),
      principal: 500_000,
      annualRate: 7.5,
      tenureMonths: 18,
      isCumulative: true,
      payoutLabel: 'At maturity',
      startedAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
      maturityInstruction: 'renew-principal-and-interest',
      status: 'active',
    };

    /* The 91-day deposit: a term the bank publishes in days, so no maturity date. */
    const dayBasedFd = {
      ...datedFd,
      reference: 'FD-REP-2',
      productId: 'fd-uc2-equitas-91d',
      productName: 'Equitas Small Finance Bank Fixed Deposit',
      bank: reportBank('equitas', 'Equitas Small Finance Bank', 'EQ'),
      principal: 100_000,
      annualRate: 6.85,
      tenureMonths: 0,
      maturityInstruction: null,
    };

    /* ---- Nothing held ---- */
    await loadReports('/portfolio/reports', null);
    check(
      'an investor with no deposits is told there is nothing to show',
      norm($('h1')?.textContent),
      'No documents yet',
    );
    ok(
      'and is offered the way to start',
      $$('a').some((node) => norm(node.textContent).startsWith('Explore FDs')),
    );

    /* ---- Two deposits ---- */
    await loadReports('/portfolio/reports', [datedFd, dayBasedFd]);
    check('the centre is titled', norm($('h1')?.textContent), 'Reports & statements');

    const reportLinks = () =>
      $$('a')
        .map((node) => node.getAttribute('href') ?? '')
        .filter((href) => href.startsWith('/portfolio/reports/'));

    /*
      Every document that exists is reachable, and every document that does not
      is not a link. This is the module's central rule expressed as navigation:
      nothing on this page can be clicked unless clicking it leads to a document
      the platform can genuinely produce.
    */
    check(
      'each available document is reachable by its own id',
      reportLinks().sort(),
      [
        '/portfolio/reports/booking-confirmation--FD-REP-1',
        '/portfolio/reports/booking-confirmation--FD-REP-2',
        '/portfolio/reports/fd-statement--FD-REP-1',
        '/portfolio/reports/fd-statement--FD-REP-2',
        '/portfolio/reports/maturity-advice--FD-REP-1',
        '/portfolio/reports/portfolio-statement',
      ].sort(),
    );
    ok(
      'the bank’s own document is listed but not linked',
      /Bank deposit advice/.test(norm(document.body.textContent)) &&
        !reportLinks().some((href) => href.includes('bank-deposit-advice')),
    );
    ok(
      'and it says why, naming the bank as the issuer',
      /no connection to bank document systems/.test(norm(document.body.textContent)),
    );
    ok(
      'a deposit with no maturity date offers no maturity advice',
      !reportLinks().some((href) => href.includes('maturity-advice--FD-REP-2')),
    );
    ok(
      'each deposit is identified by bank and reference',
      /HDFC Bank/.test(norm(document.body.textContent)) &&
        /FD-REP-1/.test(norm(document.body.textContent)),
    );
    ok(
      'and the page states that nothing here is a bank certificate',
      /not bank certificates/.test(norm(document.body.textContent)),
    );
    ok(
      'the way back to the portfolio is offered',
      $$('a').some((node) => node.getAttribute('href') === '/portfolio'),
    );

    /* ---- One document ---- */
    await loadReports('/portfolio/reports/fd-statement--FD-REP-1', [datedFd, dayBasedFd]);

    const sheetText = () => norm($('article')?.textContent ?? '');

    check('the document names itself', norm($('h1')?.textContent), 'Fixed deposit statement');
    ok('and declares its provenance on the sheet', /Platform-generated/.test(sheetText()));
    ok(
      'it names the deposit it belongs to',
      /HDFC Bank/.test(sheetText()) && /FD-REP-1/.test(sheetText()),
    );

    /*
      The figures are the portfolio's own. Asserted through the amount invested
      and the rate as recorded — a statement that recomputed either would be a
      second source of financial truth.
    */
    ok('the amount invested is the recorded principal', /₹5,00,000/.test(sheetText()));
    ok('the rate is stated as recorded', /7\.5% per annum/.test(sheetText()));
    ok('and the tenure is never converted', /18 months/.test(sheetText()));

    ok(
      'the sheet states it is not a bank certificate',
      /It is not a bank certificate and is not issued by the bank/.test(sheetText()),
    );
    ok(
      'and that expected figures are confirmed by the bank at maturity',
      /confirmed by the bank at maturity/.test(sheetText()),
    );

    /* Saving is the browser's own print dialogue, and it is labelled as such. */
    ok('saving is offered as printing', Boolean(buttonByText('Print or save as PDF')));
    ok(
      'no download is offered that the platform cannot perform',
      !$$('a').some((node) => node.hasAttribute('download')) &&
        !/Download PDF/.test(norm(document.body.textContent)),
    );
    ok(
      'the file it would save is named after the document',
      /fd-statement-hdfc-bank-fd-rep-1-\d{4}-\d{2}-\d{2}\.pdf/.test(
        norm(document.body.textContent),
      ),
    );

    ok(
      'the way back to the document list is offered',
      $$('a').some((node) => node.getAttribute('href') === '/portfolio/reports'),
    );

    /* ---- A refresh derives the same document ---- */
    const sheetBefore = sheetText();
    app.unmount?.();
    document.body.innerHTML = '<div id="root"></div>';
    app.mount($('#root'));
    await waitFor(() => Boolean($('article')), { label: 'document remount' });
    await settle(200);
    check('a refresh derives the same document', sheetText(), sheetBefore);

    /* ---- A document the platform cannot produce ---- */
    await loadReports('/portfolio/reports/bank-deposit-advice--FD-REP-1', [datedFd]);
    check(
      'a bank document renders no sheet',
      norm($('h1')?.textContent),
      'This document is not available',
    );
    check('and no sheet is drawn at all', $('article'), null);

    await loadReports('/portfolio/reports/fd-statement--NOT-HELD', [datedFd]);
    check(
      'an id naming a deposit that is not held is refused',
      norm($('h1')?.textContent),
      'This document is not available',
    );

    await loadReports('/portfolio/reports/nonsense', [datedFd]);
    check(
      'and so is an id that names no document at all',
      norm($('h1')?.textContent),
      'This document is not available',
    );
    ok(
      'each refusal offers the way back',
      $$('a').some((node) => node.getAttribute('href') === '/portfolio/reports'),
    );

    /* ---- The consolidated sheet ---- */
    await loadReports('/portfolio/reports/portfolio-statement', [datedFd, dayBasedFd]);
    check('the consolidated sheet is titled', norm($('h1')?.textContent), 'Portfolio statement');
    check('it lists every deposit', $$('article tbody tr').length, 2);
    ok(
      'the deposit with no maturity date says so rather than guessing one',
      /Not recorded/.test(sheetText()),
    );
    ok('its total invested is the sum of what was invested', /₹6,00,000/.test(sheetText()));

    window.sessionStorage.clear();

    section('N1 · Notifications — derived from what the investor holds');

    /**
     * Mounts the notification centre over a seeded portfolio.
     *
     * The holdings go into `sessionStorage` because that is where the portfolio
     * genuinely lives; seeding the hook instead would test a tree the app never
     * renders. The identity record still comes from the real handlers.
     */
    async function loadNotifications(holdings) {
      app.unmount?.();
      window.sessionStorage.clear();
      if (holdings) {
        window.sessionStorage.setItem(
          'fd:portfolio-holdings:v2',
          JSON.stringify({ version: 2, holdings }),
        );
      }
      document.body.innerHTML = '<div id="root"></div>';
      app.resetHistory('/notifications');
      requests.length = 0;
      app.mount($('#root'));
      await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), {
        label: 'notifications render',
      });
      await settle(200);
    }

    const heldFd = {
      reference: 'FD-DEMO-1',
      productType: 'fixed-deposit',
      productId: 'fd-001',
      productName: 'IDFC FIRST Bank Fixed Deposit',
      bank: {
        id: 'idfc-first',
        name: 'IDFC FIRST Bank',
        shortCode: 'IDFC',
        initials: 'ID',
        logoUrl: null,
        rating: 'AA+',
        category: 'universal',
      },
      principal: 500_000,
      annualRate: 7.75,
      tenureMonths: 12,
      isCumulative: true,
      payoutLabel: 'At maturity',
      /* Started thirteen months ago: this deposit has passed its maturity date. */
      startedAt: Date.now() - 400 * 24 * 60 * 60 * 1000,
      maturityInstruction: 'renew-principal-and-interest',
      status: 'active',
    };

    /*
      ---- Holding nothing ----

      The investor served by the handlers still has an identity to settle, so
      this is not the empty state — it is the proof that notifications are
      *derived*: with no deposits there is nothing about deposits to say.
    */
    await loadNotifications(null);
    const headings = () => $$('article h3').map((node) => norm(node.textContent));
    ok(
      'with nothing held, nothing is said about deposits',
      headings().every((title) => !/deposit/i.test(title)),
    );
    ok('and the identity request still stands on its own', headings().length > 0);

    /* ---- One deposit, past its maturity date ---- */
    await loadNotifications([heldFd]);
    check('the centre is titled', norm($('h1')?.textContent), 'Notifications');

    const bodyText = () => norm(document.body.textContent);

    ok(
      'the deposit is reported as confirmed, named by its bank',
      headings().includes('IDFC FIRST Bank deposit confirmed'),
    );
    ok(
      'the passed maturity is reported',
      headings().includes('IDFC FIRST Bank deposit has reached maturity'),
    );
    ok(
      'the passed maturity is surfaced as something needing attention',
      Boolean($('#notifications-attention-title')),
    );
    ok(
      'and settlement is left to the bank',
      /confirmed by the bank/i.test(bodyText()) && !/credited to your account/i.test(bodyText()),
    );

    /*
      The one claim this build must never make. Nothing is emailed, texted or
      pushed, and the screen says so instead of implying delivery.
    */
    ok(
      'the centre states that nothing was sent',
      /No message has been sent to you, and no bank has been contacted/.test(bodyText()),
    );
    ok('and says the updates are a demonstration', /Demonstration only/.test(bodyText()));

    /* No figure from the portfolio is restated here — a stale amount is worse than none. */
    ok(
      'no notification restates an amount',
      !/₹\s?[\d,]{4,}/.test(
        norm($('#notifications-attention-title')?.closest('section')?.textContent ?? ''),
      ),
    );

    /* ---- Read state is deliberate, and it survives a remount ---- */
    const unreadLine = () => norm($('h1')?.closest('div')?.textContent ?? '');
    ok('unread updates are counted in words', /you have not read yet/.test(unreadLine()));

    const markAll = buttonByText('Mark all as read');
    ok('and clearing them is offered', Boolean(markAll));
    click(markAll);
    await settle(200);

    check('reading them all is acknowledged', unreadLine().includes('You are up to date.'), true);
    ok('and the action leaves once there is nothing to clear', !buttonByText('Mark all as read'));

    /* The stored record is ids only — never the notification text. */
    const storedRead = window.sessionStorage.getItem('fd:notifications-read:v1') ?? '';
    ok('read state persists', storedRead.includes('booking-confirmed:FD-DEMO-1'));
    ok(
      'and stores no notification content',
      !/matured|confirmed by the bank|IDFC/.test(storedRead),
    );

    /* A remount is a refresh: what was read stays read, and the list is unchanged. */
    /* Identified by what the customer reads, not by a hook added for the test. */
    const notificationTitles = () => $$('article h3').map((node) => norm(node.textContent));
    const titlesBefore = notificationTitles();
    ok('the list is not empty to begin with', titlesBefore.length > 0);
    app.unmount?.();
    document.body.innerHTML = '<div id="root"></div>';
    app.mount($('#root'));
    await waitFor(() => Boolean($('h1')) && !$('[aria-busy="true"]'), { label: 'remount' });
    await settle(200);

    check('a refresh keeps them read', unreadLine().includes('You are up to date.'), true);
    check(
      'and derives the same notifications, in the same order',
      notificationTitles(),
      titlesBefore,
    );

    check('the centre has exactly one h1', $$('h1').length, 1);
    check(
      'and no heading level is skipped',
      $$('h1,h2,h3,h4')
        .map((node) => Number(node.tagName[1]))
        .every((level, index, all) => index === 0 || level - all[index - 1] <= 1),
      true,
    );

    window.sessionStorage.clear();
  } finally {
    app.unmount?.();
    server.close();
    dom.window.close();
  }
}
