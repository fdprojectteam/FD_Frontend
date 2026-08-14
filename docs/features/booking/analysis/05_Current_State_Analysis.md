Purpose of this Document

Before designing the ideal Booking experience, it is essential to understand how users currently complete a Fixed Deposit investment across traditional banks, digital banking platforms, and modern fintech applications.

The objective of this analysis is to identify the existing user journey, understand where users experience friction, and uncover opportunities to simplify, automate, and improve the investment process.

Rather than evaluating individual competitors, this document focuses on the current industry experience and the challenges investors commonly encounter. These insights will serve as the foundation for designing a more intuitive, trustworthy, and efficient Booking experience.

Analysis Objectives

The Current State Analysis aims to answer the following questions:

How do users currently book a Fixed Deposit?
What steps are typically involved?
Where do users spend the most time?
What creates confusion or hesitation?
Which steps are essential?
Which steps create unnecessary friction?
Where can technology improve the experience?
Which manual activities can be automated?
How can trust be strengthened throughout the journey?
Current Industry Booking Journey (As-Is)

Discover FD
      │
      ▼
Choose Product
      │
      ▼
Open Product Details
      │
      ▼
Login / Register
      │
      ▼
Complete KYC
      │
      ▼
Enter Personal Details
      │
      ▼
Enter Investment Details
      │
      ▼
Add Nominee
      │
      ▼
Select Bank Account
      │
      ▼
Review Information
      │
      ▼
Accept Terms & Consent
      │
      ▼
Make Payment
      │
      ▼
Receive Confirmation

Although this journey appears straightforward, users frequently encounter friction at multiple stages.

Journey Stage Analysis
Stage 1 — Product Selection
User Activity

The investor selects a Fixed Deposit product based on interest rate, tenure, returns, or bank preference.

Common Experience

Most platforms provide product information but offer limited guidance on whether the product suits the user's financial goals.

Opportunity

Provide personalized recommendations and contextual explanations before users enter the booking process.

Stage 2 — Authentication & Verification
User Activity

The investor logs in or creates an account and completes identity verification if required.

Common Experience
Multiple authentication steps
Repeated verification requests
Inconsistent progress feedback
Opportunity

Reuse verified identities and reduce unnecessary authentication interruptions.

Stage 3 — Investor Information
User Activity

Users provide personal, contact, and regulatory information.

Common Experience
Long forms
Duplicate data entry
Confusing mandatory fields
Limited contextual guidance
Opportunity

Prefill available information, validate inputs in real time, and explain why information is required.

Stage 4 — Investment Configuration
User Activity

Users confirm:

Deposit Amount
Tenure
Interest Payout
Maturity Instructions
Common Experience

Important financial information is often scattered across multiple screens, making it difficult to review and understand.

Opportunity

Present a consolidated investment summary with dynamic calculations and clear explanations.

Stage 5 — Nominee & Bank Details
User Activity

Users provide nominee information and select or link a bank account.

Common Experience

Users are often uncertain about eligibility rules, mandatory requirements, or the implications of their choices.

Opportunity

Offer contextual guidance and reuse previously saved information where appropriate.

Stage 6 — Review & Confirmation
User Activity

Users verify investment details before submission.

Common Experience

Many platforms provide only a basic summary, making it difficult to identify mistakes before confirming.

Opportunity

Create a comprehensive review experience that highlights key investment details, editable sections, and the expected outcome.

Stage 7 — Payment & Submission
User Activity

Users authorize payment and submit the investment.

Common Experience

Users often experience uncertainty during payment processing, particularly if there is limited feedback about progress or transaction status.

Opportunity

Provide clear processing states, informative messages, and reliable recovery mechanisms if interruptions occur.

Stage 8 — Booking Confirmation
User Activity

Users receive confirmation that the investment has been successfully booked.

Common Experience

Many platforms display only a success message with minimal information about what happens next.

Opportunity

Transform confirmation into a reassuring experience with:

Booking Reference
Investment Summary
Next Steps
Expected Timeline
Portfolio Availability
Support Information
Current State Observations

Across the industry, several patterns emerge:

Booking is treated primarily as a compliance workflow.

Many experiences focus on collecting information rather than helping users complete an investment confidently.

Users are expected to understand financial terminology.

Platforms often rely on banking language without providing meaningful explanations.

Progress is not always visible.

Users frequently feel uncertain about how much of the process remains.

Information is fragmented.

Important investment details are spread across multiple screens instead of being presented cohesively.

Error handling is reactive.

Validation typically occurs after submission rather than preventing mistakes during data entry.

Confirmation experiences lack reassurance.

Users receive confirmation that an action occurred but not confidence in what it means or what happens next.

Opportunity Areas
Current Challenge	Product Opportunity
Long forms	Progressive, guided workflow
Duplicate information	Intelligent pre-filled data
Complex terminology	Plain-language explanations
Hidden calculations	Transparent investment summary
Reactive validation	Real-time guidance and validation
Poor progress visibility	Clear progress indicators
Weak confirmation	Comprehensive post-booking experience
Repetitive manual tasks	Smart automation where appropriate
Design Implications
Product Decisions
Treat booking as an investment guidance experience rather than a data collection process.
Minimize unnecessary steps while satisfying regulatory requirements.
Keep investment context visible throughout the journey.
UX Decisions
Break complex workflows into manageable stages.
Explain important financial concepts using plain language.
Maintain user confidence through continuous feedback and transparent progress.
Engineering Decisions
Design the booking flow as modular, reusable capabilities.
Support progressive data persistence to protect user progress.
Build flexible APIs that enable prefilled information and reusable user profiles.
Implement resilient validation and recovery mechanisms.
Success Indicators

A redesigned booking experience should:

Reduce user effort.
Increase completion rates.
Minimize input errors.
Build confidence at every stage.
Provide a seamless transition from investment decision to ownership.
Document Outcome

This document establishes a clear understanding of the current FD booking experience and highlights where existing approaches fall short. It provides the evidence needed to justify a redesigned, technology-first booking journey.