process.stdout.write('start\n');
const ROOT = process.cwd();
const { handlers } = await import(`file://${ROOT}/.verification-build/handlers.mjs`);
const { setupServer } = await import('msw/node');
setupServer(...handlers).listen({ onUnhandledRequest: 'bypass' });
process.stdout.write('msw up\n');
const M = await import(`file://${ROOT}/.verification-build/units.mjs`);
process.stdout.write('bundle loaded\n');
const svc = M.createBookingOverviewService();
const ids = [
  'fd-001',
  'fd-002',
  'fd-003',
  'fd-004',
  'fd-007',
  'fd-008',
  'fd-009',
  'fd-010',
  'fd-011',
  'fd-uc2-equitas-91d',
  'fd-nope',
];
let ok = 0,
  bad = 0;
for (const id of ids) {
  try {
    const o = await svc.findByProductId(id);
    if (!o) {
      process.stdout.write(`  ${id.padEnd(20)} -> null (fails closed)\n`);
      if (id === 'fd-nope') ok++;
      else bad++;
      continue;
    }
    const d = o.deposit,
      t = d.terms;
    process.stdout.write(
      `  ${id.padEnd(20)} -> ${d.productId.padEnd(20)} ${d.bank.name.slice(0, 25).padEnd(26)} ${String(d.bank.rating ?? '—').padEnd(4)} ${String(d.bank.category ?? '—').padEnd(13)} ${String(t.interestRate).padStart(5)}% ${String(t.tenureMonths).padStart(3)}m min:${t.minInvestment} demo:${(d.demoTerms ?? []).length}\n`,
    );
    if (d.productId === id) {
      ok++;
    } else {
      bad++;
    }
  } catch (e) {
    process.stdout.write(`  ${id.padEnd(20)} -> THREW ${String(e).slice(0, 80)}\n`);
    bad++;
  }
}
process.stdout.write(`\nresolved=${ok} failed=${bad}\n`);
