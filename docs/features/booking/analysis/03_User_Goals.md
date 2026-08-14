03 — User Goals
Purpose of this Document

The Booking module exists to help users transform an investment decision into a completed Fixed Deposit with confidence.

To design an exceptional booking experience, we must first understand what users are trying to achieve—not just functionally, but emotionally and cognitively.

This document identifies the goals users expect the platform to help them accomplish during the booking journey. These goals become the foundation for UX design, product decisions, engineering priorities, validation strategies, and success measurement.

Rather than optimizing for form completion alone, the Booking experience should optimize for investment confidence, clarity, and successful completion.

Primary User Goal

Complete a Fixed Deposit investment quickly, accurately, securely, and with complete confidence that the investment has been placed correctly.

This single objective should guide every product decision throughout the Booking module.

Functional Goals

These represent what users need to accomplish during booking.

1. Confirm the Selected Investment

Users want to verify that they are investing in the correct FD before proceeding.

They should be able to easily review:

Bank
Deposit Amount
Interest Rate
Investment Tenure
Interest Payout Type
Estimated Returns
Maturity Amount
Maturity Date

Product Expectation

The platform should make the investment summary visible and easy to understand before any personal information is requested.

2. Complete the Booking Efficiently

Users expect the booking process to be straightforward and free from unnecessary complexity.

They should not be required to:

Enter duplicate information
Navigate through irrelevant steps
Search for required actions
Interpret technical banking terminology

Product Expectation

The booking journey should request only essential information and guide users through clearly defined steps.

3. Submit Accurate Information

Users want confidence that the information they provide is complete and correct.

They expect:

Real-time validation
Clear field guidance
Helpful error messages
Easy correction of mistakes

Product Expectation

The system should prevent errors rather than simply reporting them after submission.

4. Understand What Happens Next

Users should always know:

Which step they are currently on
What information is still required
What will happen after confirmation
When the investment becomes active

Product Expectation

Every stage of the booking journey should communicate progress and next steps clearly.

5. Receive Immediate Confirmation

After submitting the investment, users expect immediate assurance that their booking has been received and processed successfully.

The confirmation experience should communicate:

Booking Status
Reference Number
Investment Summary
Next Steps
Expected Processing Timeline

Product Expectation

Confirmation should reduce uncertainty rather than simply display a success message.

Emotional Goals

Financial decisions are influenced by emotion as much as functionality.

The Booking module should support these emotional goals.

Feel Confident

Users want reassurance that they have made the right investment decision.

The platform should reinforce confidence through clear information, transparent summaries, and predictable interactions.

Feel Safe

Users are trusting the platform with both personal information and financial assets.

The experience should consistently communicate:

Security
Reliability
Professionalism
Feel in Control

Users should feel that they understand every step of the booking journey.

The system should never appear to make unexplained decisions or hide important information.

Avoid Anxiety

Users should never wonder:

Did my payment go through?
Did I submit correctly?
What happens now?
Can I change this later?

The product should proactively answer these questions before they become concerns.

Experience Goals

Beyond completing the investment, users expect a high-quality digital experience.

The Booking module should enable users to:

Complete booking without external assistance.
Understand every important financial detail.
Recover easily from mistakes.
Resume interrupted progress where appropriate.
Access the experience consistently across devices.
Finish the investment with minimal cognitive effort.
Success Criteria from the User's Perspective

Users will consider the Booking experience successful if they can:

Complete the investment quickly.
Understand every important investment detail.
Avoid mistakes.
Trust that their money is secure.
Receive immediate confirmation.
Know exactly what happens after booking.
Product Insights

The analysis highlights several important insights.

Investment confidence is more important than booking speed.

Users are willing to spend a little more time if the platform helps them feel certain about their investment.

Transparency reduces hesitation.

Explaining investment details, calculations, and next steps increases trust and reduces abandonment.

Guidance is more valuable than documentation.

Instead of expecting users to read instructions, the interface should guide them naturally through the process.

Preventing mistakes creates a better experience than fixing them.

Inline validation, contextual help, and intelligent defaults reduce frustration and increase completion rates.

Every interaction should reinforce trust.

The Booking journey should consistently communicate that the investment is being handled accurately, securely, and professionally.

Design Implications
Product Decisions
Present an investment summary before collecting user information.
Reduce unnecessary inputs through intelligent defaults and pre-filled data.
Make progress visible throughout the journey.
Include a final review step before confirmation.
Provide a comprehensive confirmation experience with clear next steps.
UX Decisions
Break the booking process into logical, manageable steps.
Use plain language instead of banking jargon.
Keep important investment details visible or easily accessible.
Display contextual guidance only when needed.
Design for confidence rather than speed alone.
Engineering Decisions
Support reusable form components with inline validation.
Persist booking progress to prevent data loss.
Design APIs to support incremental data submission where appropriate.
Build reusable investment summary components that can be shared across future investment products.
Ensure fast feedback for validations and booking status updates.
Success Indicators

The Booking experience should enable users to:

Complete the investment without assistance.
Make minimal input errors.
Understand what they are confirming.
Feel confident at the moment of submission.
Successfully transition from booking to portfolio ownership.
Document Outcome

This document establishes the user-centric objectives of the FD Booking module. It defines what users are trying to achieve, what they expect from the platform, and how the product should support them throughout the investment journey.

These goals become the benchmark against which every subsequent decision—whether related to UX, engineering, or business—should be evaluated.