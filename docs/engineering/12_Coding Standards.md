Document 12 – Coding Standards

Project: FD Investment Platform

Version: 1.0

Status: Engineering Blueprint

1. Purpose

The Coding Standards establish the engineering conventions for developing the FD Investment Platform.

The objectives are to:

Maintain a consistent codebase.
Improve readability and maintainability.
Reduce bugs caused by inconsistent patterns.
Enable seamless collaboration.
Support long-term scalability.

Every contributor must follow these standards to ensure the platform remains cohesive and production-ready.

2. Engineering Principles

The platform follows these core engineering principles.

Consistency

The same problem should be solved in the same way across the platform.

Simplicity

Prefer simple, readable solutions over clever or complex implementations.

Reusability

Extract reusable logic into shared components, hooks, or utilities instead of duplicating code.

Separation of Concerns

Each file, function, and component should have one primary responsibility.

Scalability

Code should accommodate future features without requiring significant restructuring.

Readability

Code is written for people first, computers second.

3. Naming Conventions

Use clear and descriptive names.

Item	Convention	Example
Components	PascalCase	ProductCard.tsx
Hooks	camelCase with use	useMarketplaceProducts.ts
Functions	camelCase	calculateMaturityValue()
Variables	camelCase	selectedProduct
Constants	UPPER_SNAKE_CASE	DEFAULT_PAGE_SIZE
Types	PascalCase	Product
Interfaces	PascalCase	ProductResponse
Enums	PascalCase	InvestmentStatus
Files	Match exported item	ProductCard.tsx

Names should express intent rather than implementation.

4. File Organization

Each file should have a single responsibility.

Recommended order:

Imports

Constants

Types

Component / Function

Helper Functions

Exports

Avoid mixing unrelated logic in the same file.

5. Component Standards

Each React component should:

Have one clear responsibility.
Be reusable where appropriate.
Receive data through props.
Avoid direct API calls.
Avoid embedding business logic.
Remain focused on presentation.

Prefer composition over inheritance or duplication.

6. Hook Standards

Custom hooks encapsulate reusable logic.

Hooks should:

Start with use.
Focus on one concern.
Avoid rendering UI.
Return data and actions.
Hide implementation details.

Example:

useMarketplaceProducts()

Instead of placing fetching logic inside components.

7. Service Standards

Services handle communication with APIs.

Responsibilities:

API requests
Response transformation
Error normalization
Business-specific data mapping

Services should not render UI or manage component state.

8. State Standards

Follow the strategy defined in Document 09.

Local state for local concerns.
Feature state for module-specific workflows.
Global state for shared application data.
Server state through TanStack Query.

Avoid storing derived or duplicated data.

9. TypeScript Standards

Type safety is mandatory.

Guidelines:

Avoid any.
Prefer explicit types.
Reuse shared models.
Define API contracts clearly.
Keep types close to their domain unless shared globally.

TypeScript should improve correctness, not become unnecessary complexity.

10. Error Handling Standards

Every asynchronous operation should handle:

Loading
Success
Empty
Error
Retry (where appropriate)

Errors should be meaningful to both users and developers.

11. Component Props

Props should be:

Minimal
Explicit
Well typed
Predictable

Avoid passing large objects when only a few values are required.

Prefer:

<ProductCard
  name={product.name}
  interestRate={product.interestRate}
/>

Over passing the entire object when unnecessary.

12. Styling Standards

Use Tailwind CSS consistently.

Rules:

Follow design tokens.
Avoid arbitrary values unless justified.
Keep utility classes readable.
Reuse component variants.
Do not hardcode colors that exist as design tokens.

Visual consistency must originate from the design system.

13. Import Standards

Organize imports consistently.

Recommended order:

External libraries
Internal shared modules
Feature modules
Relative imports
Styles

This improves readability and reduces merge conflicts.

14. Code Formatting

Enforce formatting with automated tooling.

Recommended tools:

ESLint
Prettier
TypeScript compiler
Husky (pre-commit hooks)
lint-staged

Formatting should never depend on individual preferences.

15. Documentation Standards

Public components, hooks, and services should include concise documentation when their purpose or behavior is not immediately obvious.

Documentation should explain:

Purpose
Parameters
Return values
Important behaviors or constraints

Avoid comments that simply restate the code.

16. Testing Readiness

Code should be structured for testing.

Guidelines:

Pure functions where possible.
Isolate side effects.
Keep business logic out of UI components.
Design components with predictable inputs and outputs.

This improves reliability and simplifies future automated testing.

17. Security Standards

Basic security practices apply to all code.

Examples:

Never expose secrets in the frontend.
Validate user input.
Sanitize rendered content when necessary.
Handle authentication tokens securely.
Avoid trusting client-side validation alone.

Detailed security principles are covered in Document 15.

18. Performance Guidelines

Developers should:

Avoid unnecessary re-renders.
Lazy-load large modules when appropriate.
Optimize expensive computations.
Minimize bundle size.
Use memoization only when it provides measurable value.

Performance optimizations should be evidence-based.

19. Code Review Checklist

Every pull request should answer:

Does it follow the architecture?
Is the code readable?
Is logic reusable?
Are types correct?
Are edge cases handled?
Does it follow the design system?
Is accessibility maintained?
Does it introduce duplication?

This checklist helps maintain quality over time.

20. Success Criteria

The Coding Standards are successful when:

The codebase looks consistent regardless of the author.
New developers understand patterns quickly.
Reuse is preferred over duplication.
Technical debt is minimized.
The platform scales without degrading code quality.
21. Deliverable Outcome

This document establishes the engineering conventions for the FD Investment Platform.

It defines:

Engineering principles
Naming conventions
File organization
Component standards
Hook and service standards
State management practices
TypeScript usage
Styling conventions
Formatting rules
Documentation expectations
Security awareness
Performance guidelines
Code review criteria

It serves as the shared engineering handbook that ensures consistency across all current and future modules.