# Backlog: from approved prototype to Phase 1

Ordered by dependency. Sizes are rough (S ≤ 1 week, M 1–3 weeks, L 3+ weeks for one engineer) and should be re-estimated after the prototype review.

## 0. Decisions before build
- Resolve the **Decision needed** items in `assumptions-and-decisions.md`: mastery rule, hints policy, mastery decay, free sample scope, pricing, versioning carry-over, launch languages, video scope.
- Expert review of the flagship learning claims (review notes in the content).
- Confirm the role model and content workflow (author → reviewer → publisher).

## 1. Platform foundations
- **Authentication and accounts** (M): sign-in, sessions, profile, preferences, privacy and data deletion.
- **Database and API** (L): replace `PrototypeRepository` with an API client; learners, enrollments, attempts, evidence, drafts, catalogue, versions. The domain modules (`src/domain`) move to shared server code.
- **Server-side assessment** (M): submit attempts to the server; authoritative evaluation with the same domain functions; idempotency keys; rate limiting; audit log.
- **Authorisation** (M): role and entitlement checks on every API route; editor/admin permissions; content-version access rules.

## 2. Commerce
- **Billing integration** (L): plans, checkout, tax, receipts, cancellation at period end, failed-payment handling, refunds.
- **Entitlements** (M): server-enforced free samples and subscription access; upgrade return URLs validated server-side.

## 3. Learning experience hardening
- **Assessment engine configuration** (M): per-path mastery rules, evidence policies, stored rule versions.
- **Recommendation telemetry** (S): log recommendation shown/followed to evaluate adaptation.
- **Attempt history and review** (S): view any past attempt’s full response and feedback.
- **Accessibility audit** (M): WCAG 2.2 AA with screen readers (VoiceOver, NVDA), keyboard-only and zoom testing; fix findings.
- **Responsive QA** (S): device lab pass for the workspace tabs and previews.
- **Video lessons** (M–L, content dependent): hosting, captions, player, transcript sync.

## 4. Content operations
- **Content service and editor workflow** (L): drafts with field-level history, review and approval states, comments, scheduled publishing.
- **Claude-assisted drafting pipeline** (M): prompts and templates that output the documented format, plus validation and a human review queue. No auto-publish.
- **Authoring guide** (S): contexts, criteria writing, hotspot balance, decision branching, tradeoff wording.
- **Additional paths** (L each): bring the four preview paths to full coverage (≥ 2 contexts per skill, alternatives, Explore).
- **Asset management** (M): covers, icons, screenshots for Explore comparisons.

## 5. Analytics and operations
- **Event pipeline** (M): privacy-reviewed events behind the admin metrics; agreed definitions.
- **Admin analytics** (M): real queries for the prototype’s overview cards; export.
- **Support tooling** (S): user lookup, access adjustments with audit trail.
- **Monitoring and error reporting** (S).

## 6. Localisation
- **Arabic and RTL** (L): translation workflow for UI strings and content, RTL QA of previews and activities, locale-aware dates and numbers.

## 7. Quality
- Port the domain unit tests to the server package and add API contract tests.
- Convert `scripts/e2e.mjs` journeys to a CI Playwright suite with seeded test accounts.
- Visual regression for activity previews.
