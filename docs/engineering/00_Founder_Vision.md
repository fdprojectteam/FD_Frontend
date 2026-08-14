FD Platform PoC
World-Class FD Platform PoC
Discussion Note for Technology Team
Digital Bank Business Idea | Phase I: FD Booking Platform evolving into Fixed-Income Wealth Platform
Founder ambition: Build nothing short of a world-class front end. The experience must feel as simple,
trusted and premium as Apple; and as clear, fast and commercially intuitive as Amazon. The PoC
must not look like another FD marketplace. It must demonstrate a differentiated FD decision, safety
and confidence platform.
1. Purpose of this discussion note
This note is for a detailed working session with the Founding Tech Team building the low-spend prototype
PoC. The goal is to align the build with the founder ambition before too many screens and modules are locked
in.
 Review whether the current build direction will produce a premium, simple and trustworthy user
experience.
 Shift the product from a basic FD booking flow to a goal-led FD decision and confidence flow.
 Clarify which features must be visible in the PoC to show differentiation to deposit investors and wealth
management experts.
 Prevent overbuilding low-impact modules while underbuilding the core recommendation, safety and
monitoring experience.
2. Current progress reviewed
 The current 8-week PoC roadmap covers design system, marketplace, comparison, FD booking, portfolio
dashboard, maturity and notifications, reports/support, admin portal and final QA.
 Design system, marketplace and comparison are marked complete; FD booking is in progress; portfolio
dashboard, maturity management, reports/support and admin portal are still planned.
 The team has stated that it is building reusable architecture, responsive design, business logic and testing
discipline rather than disconnected screens. This is positive.
Current strength Concern Required correction
Clear module plan Plan is feature-led, not experience-led Add UX gates and founder demo
narrative before continuing too far
Marketplace and comparison completed
early
May reinforce commodity ratecomparison positioning
Shift homepage and primary flow to
goal-led planning
Booking flow is being built Can become operationally heavy before
value is shown
Show recommendation and safety value
before KYC/payment friction
Dashboard planned Risk of becoming a passive “Active FDs”
view
Make it an FD health, maturity, income
and next-action dashboard
Confidential discussion draft | Digital Bank Business Idea - FD Platform PoC
3. Core product correction
Do not build this only as:
“Select bank enter amount pay FD → → →
created.”
Build this as:
“Tell us your goal get a safe and suitable FD →
structure understand why book with → →
confidence monitor till maturity.” →
4. What world-class should mean for this platform
Standard What it means for this PoC
Apple-like simplicity Whitespace, calm colours, one primary action per screen,
minimal cognitive load, no clutter, professional typography.
Amazon-like clarity Easy discovery, transparent comparison, trust cues, fast
checkout, visible confirmation and low-friction next action.
Wealth-platform seriousness
No noisy gamification, no loud retail marketplace feel, clear
assumptions, risk language, security cues and precise
numbers.
Senior-citizen usability Large readable text, plain English, clear progress steps, no
hidden actions, ability to review before committing.
Investor-demo quality The first 60 seconds must make an expert feel this is
differentiated, not a rate table with better design.
5. Revised customer journey to be built
Step Screen / module Desired experience
1 Landing / Home
Primary CTA: Plan my FD. Secondary
CTAs: Compare FD rates; Track my existing
FDs.
2 Goal selection
Ask “What is this FD for?” Options:
monthly income, emergency reserve, child
education, short-term parking, senior
citizen income, FD ladder.
3 Inputs
Amount, time horizon, liquidity need, tax
bracket/range, preferred safety level,
existing bank exposure if available.
4 Recommended plan
Show safest / balanced / highest-return
alternatives. Default should be
recommended balanced plan, not the
highest rate.
5 Why this plan
Explain amount split, bank choice, tenure,
maturity, expected income, concentration
and liquidity.
6 Compare alternatives
Compare plans and products by suitability,
safety, liquidity, post-tax return and
maturity fit.
7 Book or save plan
Proceed to KYC/payment only after value is
established. Allow save/share/schedule
review in PoC.
8 Dashboard after booking
Show FD health, maturity calendar,
expected income, bank exposure, alerts
and next action.
6. Features that must be visible in the PoC
Feature Why it matters PoC requirement
Goal-led FD planner Moves the platform away from rateshopping.
Primary path should start with goal, not
bank listing.
Confidential discussion draft | Digital Bank Business Idea - FD Platform PoC
Suitability score Shows customer-specific intelligence. Score should reflect safety, liquidity,
return, tax and maturity fit.
Safety / concentration view Builds trust and shows premium advisory
thinking.
Display bank concentration and DICGCaware notes in simple language.
FD ladder Makes the platform feel like wealth
management, not booking.
Show staggered maturities and reason for
each bucket.
Post-tax / real return view Customers must see outcome, not only
headline rate.
Simple estimated post-tax interest and
maturity value display.
Maturity and reinvestment alerts Creates ongoing utility and retention. Show upcoming maturity and
recommended next action.
Explainable recommendation Essential for trust and regulatory
discipline.
Each recommendation must answer: why
bank, why amount, why tenor, why not
highest rate.
Family / nominee direction Future differentiation for Indian
households.
At least show nominee/joint holder and
future family dashboard placeholder.
7. Screen-by-screen design direction
Screen Must avoid Must deliver
Home Generic fintech marketing, many buttons,
rate-led banner.
Clean promise: “Build safer FD portfolios
around your goals.” One dominant CTA:
Plan my FD.
Marketplace Long list of banks ranked only by rate.
Curated FD cards showing rate, tenure,
bank type, liquidity, safety note, best-use
case.
Comparison Rate and maturity value only.
Compare suitability, safety, liquidity,
premature withdrawal, post-tax return
and maturity fit.
Booking Long form-heavy process at the beginning. Four clear steps: Details, Nominee, Review,
Pay & Confirm. Use progressive disclosure.
Dashboard Static active FD list.
FD health score, total value, interest
earned, next maturity, bank exposure,
review alerts.
AI Advisor Open-ended chatbot giving uncontrolled
advice.
Controlled assistant answering approved
questions such as “Why this FD?”, “Should
I split?”, “What if I withdraw early?”.
8. Revised 8-week build emphasis
Week Existing plan Founder correction
1-2 Design system + marketplace Run premium UX audit. Ensure goal-led
homepage and curated FD cards.
3 FD booking
Make booking recommendation-led, not
bank-selection-led. Add review
explanation screen.
4 Portfolio dashboard Build FD Health Dashboard: maturity,
income, exposure, next action.
5 Maturity and notifications Add reinvestment recommendation and
maturity calendar.
6 Reports and customer support Keep light. Do not overbuild reports before
core experience is validated.
7 Admin portal
Build essentials: product/rate
management, user view, audit log. Avoid
deep admin complexity.
8 QA and demo
Add founder walkthrough, user testing
observations, performance check and
investor demo script.
Confidential discussion draft | Digital Bank Business Idea - FD Platform PoC
9. What to defer to protect quality and spend
Defer / minimise Reason
Full customer support module A simple FAQ/contact/ticket placeholder is enough for PoC.
Complex reports Dashboard and maturity view matter more than report
generation at this stage.
Too many admin features Admin should support demo and data update; avoid
enterprise workflow overbuild.
Sophisticated open-ended AI chatbot Risk of inaccurate advice and loss of trust. Start with
controlled Q&A.
Too many payment failure edge cases Important later; PoC can simulate or handle basic retry.
Full native mobile app Responsive web is enough if mobile UX is excellent.

10. Quality review checklist for every demo
Area Pass question
First impression Can a new user understand the value within 5 seconds?
Simplicity Does each screen have one primary action and limited
choices?
Goal-led flow Can the user start with a life goal instead of a bank?
Trust Are safety, bank type, assumptions and source/date visible
where relevant?
Comparison Does the comparison go beyond rate?
Recommendation Does the app say what to do, not only what is available?
Explainability Can the user understand why the recommendation is
suitable?
Senior usability Can a 60+ user complete the flow without confusion?
Mobile UX Is the mobile version clean, readable and fast?
Dashboard Does it show maturity, income and next action clearly?
Performance Does it load smoothly without lag or broken states?
Premium feel Does it look like a serious wealth platform rather than a
product marketplace?

11. Meeting agenda with tech team
Agenda item Output expected
Walk through current build Identify where the current interface looks premium and
where it looks generic.
Review revised customer journey Agree whether Plan my FD should become the primary flow.
Define PoC differentiators Confirm which of the seven must-have differentiators can be
delivered within the timeline.
Reprioritise modules Move effort away from low-impact reports/admin into
recommendation and dashboard quality.
Set design benchmark Create reference screens and visual standards before further
build.
Define demo narrative Prepare a 5-minute walkthrough for deposit investors and
wealth experts.
Agree next milestone Lock a 7-day sprint plan with screens, owner, deadline and
acceptance criteria.

12. Non-negotiable founder direction
The PoC must not be measured by number of screens completed. It must be measured by whether a
serious customer, deposit investor or wealth expert says: “This is not another FD booking app. This
can become a serious fixed-income wealth platform.”
Therefore, the build must prioritise: goal-led recommendation, safety and concentration intelligence,
explainability, post-booking monitoring, premium simplicity and trust.

13. Immediate action items for the Founding Tech Team
Action Owner Deadline
Prepare screenshots of current homepage,
marketplace, comparison, booking start
and mobile view.
Tech team Before next review
Redesign homepage around Plan my FD as
the primary CTA. UX/front-end Next sprint
Add goal-led FD planner before
marketplace listing. Product + tech Next sprint
Revise FD cards to include suitability,
safety and best-use indicators. Front-end + data Next sprint
Create recommendation explanation
screen.
Product + front-end Next sprint
Convert portfolio dashboard into FD
Health Dashboard. Front-end + product Week 4
Prepare 5-minute founder demo script and
clickable path. Founder + tech team Week 8 or earlier