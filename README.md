# FD Investment Platform

A premium Fixed Deposit investment platform — discover, compare, and invest in FDs from India's most trusted banks.

Built with Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, and shadcn/ui. Architecture, phase plan, and decisions live in [`docs/`](docs/README.md) — start with [`docs/development/roadmap.md`](docs/development/roadmap.md) and the [Phase 0 blueprint](docs/development/phase-0-implementation-blueprint.md).

## Prerequisites

Node.js 22 LTS or newer, npm 10+.

## Setup

```bash
npm install
npm run dev
```

`npm install` also **activates the git hooks automatically** (the `prepare` script runs Husky). No extra step is needed after cloning. If hooks ever stop firing (e.g., after deleting `.git`), re-run:

```bash
npm run prepare
```

## Scripts

| Command                           | Purpose                                       |
| --------------------------------- | --------------------------------------------- |
| `npm run dev`                     | Start the development server                  |
| `npm run build`                   | Production build                              |
| `npm run start`                   | Serve the production build                    |
| `npm run lint` / `lint:fix`       | ESLint (includes architecture boundary rules) |
| `npm run typecheck`               | TypeScript, no emit                           |
| `npm run format` / `format:check` | Prettier write / verify                       |

## Quality gate (pre-commit)

Every commit runs automatically, and **the commit is blocked if any step fails**:

1. `lint-staged` — Prettier formats and ESLint (`--max-warnings 0`) checks the staged files, including the architectural boundary rules (no cross-module imports, no axios outside the API client, no mock imports outside the MSW layer).
2. `npm run typecheck` — full-project TypeScript check.

## Engineering rules

The dependency flow `app → modules → components → hooks → services → api` is enforced by ESLint. Modules never import sibling modules; shared components never import business modules; all design values come from design tokens. See [`docs/engineering/`](docs/engineering/) for the full blueprint (Documents 01–16).
