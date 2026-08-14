Create:

docs/features/goal-based-fd/11-consistency-audit.md

IMPORTANT:
This is an audit only.

DO NOT modify application code.
DO NOT modify the existing Goal-Based FD documents.
DO NOT invent business rules.
DO NOT redesign the feature.
DO NOT add new scenarios.
DO NOT resolve contradictions by assumption.

Review these documents together:

01 — README.md
02 — business-scenarios.md
03 — rule-engine.md
04 — user-flow.md
05 — screen-specification.md
06 — architecture.md
07 — implementation-plan.md
08 — data-model.md
09 — api-contract.md
10 — testing-strategy.md

The purpose is to determine whether the Goal-Based FD POC is ready for implementation on top of the existing FD Marketplace architecture.

==================================================
1. BUSINESS SCENARIO → RULE CONSISTENCY
==================================================

For every scenario defined in 02-business-scenarios.md:

- Identify the corresponding rules in 03-rule-engine.md.
- Verify that every required scenario condition has a rule.
- Verify that no rule introduces behaviour not defined by the scenario.
- Verify expected outputs are consistent.

Create a table:

| Scenario | Required Rules | Rules Present | Missing | Contradiction | Status |

Do not rename or reinterpret the approved scenarios.

==================================================
2. RULE → USER FLOW CONSISTENCY
==================================================

Check whether every important rule in 03-rule-engine.md is represented in 04-user-flow.md.

Verify:

- Required inputs exist in the flow.
- Validation happens before recommendation.
- Rule evaluation occurs at the correct point.
- No-match behaviour exists.
- Partial-match behaviour exists if specified.
- Recommendation ranking occurs where specified.
- User can select a recommended FD.
- Selected FD proceeds into existing Booking.

Identify anything missing.

==================================================
3. USER FLOW → SCREEN CONSISTENCY
==================================================

Compare 04-user-flow.md with 05-screen-specification.md.

For every flow step verify:

- Corresponding screen exists.
- Required input exists.
- Required output exists.
- Validation state exists.
- Loading state exists where necessary.
- Empty/no-match state exists where necessary.
- Recommendation explanation exists where required.
- Navigation is defined.

Create:

| Flow Step | Screen | Required UI | Present | Missing | Status |

==================================================
4. SCREEN → ARCHITECTURE CONSISTENCY
==================================================

Compare 05-screen-specification.md with 06-architecture.md.

Verify that every screen requirement can actually be implemented using the proposed architecture.

Pay particular attention to:

- Goal input
- Rule evaluation
- Recommendation generation
- Product ranking
- Recommendation explanation
- Product selection
- Booking handoff
- Existing FD product model
- Existing rate resolution
- Existing maturity/returns calculation

Identify any requirement that requires a new platform-level architecture unnecessarily.

==================================================
5. ARCHITECTURE → EXISTING PLATFORM
==================================================

This is critical.

Verify that 06-architecture.md follows the meeting decision:

"Maintain the current architecture FD domain model; implement the new functionality as a feature on top of it."

Check that Goal-Based FD:

- Does NOT replace Marketplace.
- Does NOT replace Booking.
- Does NOT create a second FD product model.
- Does NOT create a second rate-resolution engine.
- Does NOT create a second maturity calculation engine.
- Does NOT duplicate existing financial logic unnecessarily.
- Does NOT require a platform architecture rewrite.
- Uses the existing FD domain model as the source of truth.
- Uses existing Booking for the final booking experience.

Flag any violation as BLOCKER or MUST FIX.

==================================================
6. IMPLEMENTATION PLAN COVERAGE
==================================================

Compare 07-implementation-plan.md against documents 02–06.

Verify that every required implementation task exists.

Look for:

- Missing domain work
- Missing rule-engine work
- Missing API work
- Missing UI work
- Missing integration work
- Missing testing work
- Incorrect implementation order
- Tasks depending on information that does not exist

Create:

| Requirement | Implementation Task | Covered? | Dependency | Status |

==================================================
7. DATA MODEL CONSISTENCY
==================================================

Compare 08-data-model.md against:

- Business scenarios
- Rule engine
- User flow
- Screen specification
- Architecture

Verify every required data field exists.

Check specifically:

- Goal
- Goal-specific inputs
- Target amount
- Investment amount
- Time horizon
- FD product reference
- Rate reference
- Recommendation result
- Match/ranking information
- Explanation/reason
- Booking handoff information

Identify:

- Missing fields
- Unused fields
- Conflicting field names
- Duplicate representations
- Fields that should come from the existing FD domain instead of Goal-Based FD

==================================================
8. API CONTRACT CONSISTENCY
==================================================

Compare 09-api-contract.md against:

- 04-user-flow.md
- 05-screen-specification.md
- 08-data-model.md
- 06-architecture.md

Verify:

- Every API request field exists in the data model.
- Every required response field is supported by the data model.
- API supports the actual user flow.
- API supports no-match behaviour.
- API supports recommendation ranking.
- API supports recommendation explanation.
- API can identify the selected existing FD product.
- API does not duplicate existing Booking APIs unnecessarily.

Flag any mismatch.

==================================================
9. TESTING COVERAGE
==================================================

Compare 10-testing-strategy.md against 02–09.

Verify that testing covers:

- All four approved business scenarios.
- Rule matching.
- Rule priority.
- Partial matches.
- No matches.
- Recommendation ranking.
- Recommendation explanation.
- Financial calculation integration.
- Invalid input.
- API validation.
- Goal → recommendation.
- Recommendation → existing Booking.
- Existing Marketplace regression.
- Existing Booking regression.

Create:

| Requirement | Test Coverage | Covered? | Status |

==================================================
10. BUSINESS RULE INVENTION CHECK
==================================================

Identify anything in documents 01–10 that appears to be invented rather than supported by the agreed product requirements.

Examples:

- New business scenarios
- New eligibility rules
- New scoring rules
- Unsupported financial assumptions
- Unsupported recommendation claims
- Unsupported product attributes
- Unsupported customer segmentation
- Unsupported AI behaviour

DO NOT correct them automatically.

Classify:

- BLOCKER
- MUST FIX
- CLARIFICATION
- SAFE

==================================================
11. POC SCOPE CHECK
==================================================

Verify that the documentation remains appropriate for the current POC and 20-day delivery constraint.

Flag unnecessary production-scale work such as:

- ML/AI infrastructure
- RAG
- Complex personalization
- Recommendation learning
- Large-scale event systems
- Distributed architecture
- Production bank integrations
- Advanced analytics

The current implementation is RULE-BASED.

The architecture must leave room for future Real AI, but Real AI must NOT be required for this POC.

==================================================
12. EXISTING CODEBASE PROTECTION
==================================================

Explicitly identify what must remain unchanged.

At minimum verify:

Marketplace:
- Existing marketplace flows
- Existing product model
- Existing marketplace UI

Booking:
- Existing Booking domain model
- Existing rate resolution
- Existing maturity/returns calculation
- Existing investment validation
- Existing payout handling
- Existing booking screens

The Goal-Based FD feature should consume these capabilities rather than duplicate them.

==================================================
13. FINAL BLOCKER LIST
==================================================

Produce a concise table:

| ID | Finding | Classification | Why | Required Action |

Classification must be exactly one of:

BLOCKER
MUST FIX
CLARIFICATION
SAFE

Do not create artificial blockers.

==================================================
14. IMPLEMENTATION READINESS
==================================================

End the document with:

## Implementation Readiness

Choose exactly one:

READY
NOT READY

If NOT READY:

List only the issues that genuinely prevent implementation.

If READY:

State:

"The documentation is sufficiently consistent to begin POC implementation without inventing additional business behaviour."

==================================================
15. FINAL IMPLEMENTATION SEQUENCE
==================================================

If READY, provide the recommended implementation order.

Use this general structure where applicable:

1. Existing codebase inspection
2. Goal-Based FD domain types
3. Rule engine
4. Recommendation service
5. API layer
6. UI flow
7. Recommendation UI
8. Existing Booking handoff
9. Integration
10. Testing
11. Regression verification

Adapt the sequence to the actual contents of documents 01–10.

==================================================
16. FINAL CLAUDE IMPLEMENTATION BRIEF
==================================================

If READY, finish with a concise implementation brief that can later be given directly to Claude Code.

It must state:

- Implement Goal-Based FD as a feature on top of the existing architecture.
- Preserve the existing FD domain model.
- Preserve existing Marketplace.
- Preserve existing Booking.
- Use the existing FD product/rate/maturity truth.
- Implement the four approved scenarios.
- Use rule-based logic for the POC.
- Do not introduce AI/LLM/RAG.
- Do not invent missing business behaviour.
- Do not rewrite platform architecture.
- Do not modify unrelated modules.
- Maintain existing tests.
- Add tests for the new feature.
- Keep the implementation within the agreed POC scope.

Do not actually implement anything.
