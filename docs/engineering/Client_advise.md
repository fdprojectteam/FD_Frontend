ADDENDUM TO FOUNDING TECH TEAM DISCUSSION NOTE
World-Class FD Marketplace: Build Narrow, Architect Broad
Core clarification
The first product must remain a world-class FD marketplace. But it should not be architected as a narrow FD booking app.
The hidden platform architecture should be a reusable multi-bank, multi-product integration infrastructure, with FD as the
first product module.
1. Strategic direction
 Visible customer proposition now: a beautiful, simple, trusted FD marketplace and safe-money platform.
 Internal architecture objective: a reusable bank product marketplace infrastructure.
 Once FD integration, trust, customer journeys and bank workflows stabilise, the same infrastructure can support more
products from the same banks.
 Do not build those additional products now. Only ensure the architecture does not block them later.
2. Reusable infrastructure to design from day one
Reusable layer Needed for FD now Useful later for
Bank partner master Partner profile, FD product status, SLA,
escalation contacts
Savings accounts, cards, loans, MSME products
Customer identity + KYC PAN, KYC/CKYC status, bank verification,
nominee
All bank products and future neo-bank journeys
Product master framework FD rate, tenure, payout, limits, premature
withdrawal
Any bank product with pricing, eligibility and
terms
Application workflow engine FD application, review, consent, status tracking Account opening, card application, loan
application
Consent + disclosure engine FD terms, suitability note, audit record Product-specific disclosure and compliance
Partner API / integration layer FD data, submission, confirmation, servicing
status
Reusable bank connector for multiple product
APIs
Servicing + ticketing layer FD booking issue, maturity query, renewal
support
Cross-product support and grievance tracking
Analytics layer FD funnel, conversion, drop-off, bank
performance
Bank marketplace performance and partner
scorecards
3. Important design rule
 The integration core can be reusable, but every new product will require its own product-specific rules, compliance flow,
customer journey, risk controls and servicing model.
 FD is simpler. Savings accounts, credit cards, MSME loans, payments and investments will each need separate business logic
and regulatory treatment.
 Build the core platform broad; keep the current customer product narrow and excellent.
4. Immediate instruction for the PoC
Build / preserve now Do not build now
• World-class FD customer journey • Credit cards, loans or payments as live modules
• Multi-bank FD product master • Generic financial supermarket screens
• Configurable bank partner master • Hardcoded FD-only data structures
• Reusable application workflow • Complex bank-like account infrastructure
• Consent, disclosure and audit trail • Overbuilt admin features beyond PoC need
• Bank-wise and product-wise API abstraction • Uncontrolled AI advice or opaque recommendations
• Dashboard, maturity and servicing foundation • Anything that weakens simplicity and premium design
One-line architecture message
Build the FD marketplace as the first product module on top of a reusable bank-product integration platform. The first
release must look narrow, premium and world-class to customers, while the architecture remains ready for multi-bank and
multi-product expansion.