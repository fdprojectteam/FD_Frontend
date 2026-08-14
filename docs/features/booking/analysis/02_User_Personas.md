02 — User Personas
Purpose of this Document

The success of the FD Booking module depends on understanding the people completing an investment, not just the information they provide.

Unlike the Marketplace module, where users are exploring investment options, the Booking module serves users who have already made a financial decision. At this stage, their primary concerns shift from discovering products to completing the investment accurately, securely, and with confidence.

This document identifies the key investor personas, their behaviors, expectations, concerns, and motivations during the booking journey. These insights will directly influence user experience, product decisions, business rules, accessibility, frontend architecture, and future platform scalability.

The objective is not to design different booking flows for different users, but to design one intelligent booking experience that naturally supports the needs of all investor types.

Persona 01 — Young Professional
Profile
Attribute	Details
Age	24–35 Years
Occupation	Software Engineer, Consultant, IT Professional, Private Employee
Investment Experience	Beginner to Intermediate
Digital Literacy	Very High
Primary Device	Mobile First
Background

Young professionals are digitally comfortable and expect experiences similar to modern technology products. They are typically building their savings while balancing multiple financial goals such as emergency funds, home ownership, travel, or retirement planning.

They appreciate speed and convenience but are unlikely to compromise on transparency when investing their money.

Investment Behaviour
Invests regularly
Researches before investing
Compares multiple options
Relies on online reviews
Uses investment apps frequently
Comfortable with digital KYC
Values self-service experiences
Booking Goals
Complete investment quickly
Avoid repetitive data entry
Review important information before confirming
Receive immediate confirmation
Understand expected returns
Pain Points
Long forms
Re-entering existing information
Unclear validation messages
Slow loading screens
Unexpected booking failures
Hidden charges or unclear terms
Product Opportunities

The platform should:

Prefill known information
Minimize manual input
Display real-time validation
Provide a concise investment summary
Clearly communicate booking progress
Persona 02 — Senior Citizen / Retiree
Profile
Attribute	Details
Age	60+ Years
Occupation	Retired Professional / Pensioner
Investment Experience	High
Digital Literacy	Medium
Primary Device	Mobile & Desktop
Background

Senior investors have significant experience with Fixed Deposits and prioritize capital protection over high returns. They seek stable, predictable investments and require a booking experience that reinforces trust and minimizes uncertainty.

While they may be less familiar with modern digital interfaces, they value clear guidance and straightforward interactions.

Investment Behaviour
Invests primarily for stable income
Prefers trusted financial institutions
Reviews information carefully
Makes deliberate decisions
Often seeks reassurance before confirming
Booking Goals
Ensure investment details are correct
Understand every required step
Avoid making irreversible mistakes
Complete the investment without external assistance
Pain Points
Financial jargon
Small text
Complex navigation
Generic error messages
Unclear next steps
Fear of submitting incorrect information
Product Opportunities

The platform should:

Use plain language
Provide contextual explanations
Maintain high readability
Offer clear progress indicators
Include a comprehensive review screen before confirmation
Persona 03 — Business Owner / High Value Investor
Profile
Attribute	Details
Age	35–60 Years
Occupation	Entrepreneur, Business Owner, Senior Executive
Investment Experience	Advanced
Digital Literacy	High
Primary Device	Desktop & Mobile
Background

Business owners typically manage multiple financial commitments and expect efficient digital experiences. They value transparency and speed but are unwilling to sacrifice accuracy or security.

Their primary concern is completing investments with minimal interruption to their schedule.

Investment Behaviour
Invests larger amounts
Diversifies investments
Reviews returns carefully
Values efficiency
Expects reliable digital services
Booking Goals
Complete investment efficiently
Verify investment details quickly
Avoid unnecessary steps
Receive immediate confirmation
Pain Points
Repetitive workflows
Manual document uploads
Delayed verification
Unclear booking status
Unexpected interruptions
Product Opportunities

The platform should:

Reduce booking time
Reuse previously verified information
Provide transparent status updates
Enable quick review before confirmation
Common User Expectations

Despite differences in age, experience, and investment behavior, all investors expect the Booking experience to provide:

Security for their money and personal information
Transparency in investment details
Confidence before confirming
Simple and predictable interactions
Accurate calculations
Fast system responses
Clear validation and error handling
Immediate acknowledgement after successful booking

These expectations represent the baseline experience the platform must consistently deliver.

Persona Comparison Matrix
Attribute	Young Professional	Senior Citizen	Business Owner
Digital Confidence	High	Medium	High
Investment Experience	Medium	High	High
Booking Speed Expectation	Very High	Medium	High
Guidance Required	Low	High	Medium
Trust Sensitivity	High	Very High	Very High
Accessibility Needs	Medium	High	Medium
Error Tolerance	Low	Very Low	Low
Primary Concern	Speed	Confidence	Efficiency
Product Insights

The persona analysis highlights several key insights that should shape the Booking experience:

1. Trust must be reinforced throughout the journey.

Users are committing their money, so every screen should communicate security, professionalism, and reliability.

2. Simplicity should not reduce transparency.

The booking process should be easy to complete while still explaining important investment details and required actions.

3. Progressive guidance reduces cognitive load.

Rather than presenting large forms upfront, information should be requested in logical, manageable steps with clear context.

4. Personalization should minimize effort.

Where information is already known or previously verified, it should be reused to reduce manual input and speed up completion.

5. Error prevention is more valuable than error correction.

The system should proactively validate information, guide users toward successful completion, and prevent avoidable mistakes before submission.

6. A final review step builds confidence.

Before confirming the investment, users should have the opportunity to verify all critical details in a clear, structured summary that reinforces their decision.

Document Outcome

This persona analysis establishes the human foundation for the FD Booking module. It ensures that every subsequent decision—from user flows and business rules to UI components and frontend implementation—is driven by real investor behaviors and expectations rather than assumptions.