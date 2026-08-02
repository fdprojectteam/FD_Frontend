/**
 * Minimal assertion + reporting layer.
 *
 * Deliberately dependency-free: the project has no test runner yet, and
 * choosing one is a tooling decision that needs approval rather than a side
 * effect of an audit (M2.4 risk R6).
 */
let passed = 0;
let failed = 0;
const failures = [];

export function section(title) {
  process.stdout.write(`\n── ${title} ${'─'.repeat(Math.max(0, 58 - title.length))}\n`);
}

export function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed += 1;
    process.stdout.write(`  PASS  ${label}\n`);
  } else {
    failed += 1;
    failures.push(`${label}\n          expected ${e}\n          actual   ${a}`);
    process.stdout.write(`  FAIL  ${label}\n          expected ${e}\n          actual   ${a}\n`);
  }
}

export function ok(label, condition, detail = '') {
  check(label + (detail ? ` (${detail})` : ''), Boolean(condition), true);
}

export function report() {
  process.stdout.write(`\n  ${passed} passed, ${failed} failed\n`);
  if (failures.length) {
    process.stdout.write('\nFailures:\n');
    for (const failure of failures) process.stdout.write(`  • ${failure}\n`);
  }
  return failed === 0;
}

export function counts() {
  return { passed, failed };
}
