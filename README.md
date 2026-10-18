# Skillbench: Phase 1 stakeholder prototype

A frontend prototype of a subscription platform for learning professional UX and product design skills through practical, mastery-based activities. It exists to review the product, learning mechanics, information architecture, admin workflows and visual direction before production development is approved.

"Skillbench" is a working name, defined once in `src/i18n/en.ts`.

**No backend, account, API key or paid service is needed.** All data is fictional and stored in your browser's localStorage. Authentication, billing, analytics and AI are simulated or absent by design.

## Run it

Requirements: Node.js 20.9+ (verified with Node 22.22.0, npm 10.9.4).

```bash
npm install
npm run dev          # http://localhost:3000
# or a production build
npm run build && npm start
```

Use **Demo controls** (footer link, or `/demo`) to switch between seeded scenarios: new free learner, returning subscriber, learner with a skill gap, learner close to completion, editor, administrator, and expired subscription. You can also reset one learner or all data there.

## Checks

```bash
npm run typecheck    # TypeScript
npm run lint         # ESLint (Next.js config)
npm test             # Vitest: domain rules (assessment, evidence, mastery, recommendations, versioning)
npm run e2e          # Browser journeys + screenshots. Needs the app running on :3000.
```

`npm run e2e` uses `playwright-core` with a local Chromium. Set `CHROMIUM_PATH` if Chromium isn't at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `BASE_URL` to target another port, and `SHOTS=0` to skip screenshots. It clears this origin's localStorage before running.

## Stack and versions

| Package | Version |
|---|---|
| next (App Router, Turbopack) | 16.3.8 |
| react / react-dom | 19.3.1 |
| typescript | 5.9.3 |
| tailwindcss / @tailwindcss/postcss | 4.3.3 |
| @radix-ui/react-dialog (accessible dialogs) | 1.3.1 |
| lucide-react (icons) | 1.59.0 |
| clsx / tailwind-merge | 2.1.1 / 3.7.0 |
| vitest | 5.0.5 |
| playwright-core | 1.56.1 |
| eslint / eslint-config-next | 9.39.5 / 16.3.8 |

shadcn/ui wasn't installed as a generator. A small set of equivalent primitives (button, card, badge, dialog on Radix, tabs, notices) lives in `src/components/ui`.

## Code organisation

```
src/
  domain/          Pure TypeScript, no React
    types.ts         Typed, versioned content and learner records
    assessment.ts    1. Evaluate a response (Design Bench, Critique, Decision)
    evidence.ts      2. Store evidence (duplicates, independence, practice-only)
    mastery.ts       3. Skill status, 4. path completion (configurable rule)
    recommend.ts     5. Next activity (rule-based, honest when exhausted)
    validation.ts    Content validation and coverage (publication gate)
    catalog.ts       Drafts, publishing, version pinning
    access.ts        Demo entitlement rules
  content/         Fixtures: flagship path, preview paths, seeds, directory, analytics
  persistence/     PrototypeRepository interface + localStorage implementation
  state/           React context + reducer and selectors
  activities/      Activity renderers, workspace, feedback
  learner/         Learner screens and components
  admin/           Admin shell, helpers, draft editor hook
  app/             Next.js routes: (learner), admin, demo
  i18n/            UI strings (English)
tests/             Domain unit tests
scripts/e2e.mjs    Browser journeys and screenshots
docs/              Stakeholder documentation (below)
```

## Documentation

| Deliverable | File |
|---|---|
| Stakeholder walkthrough | [docs/walkthrough.md](docs/walkthrough.md) |
| Screen and interaction inventory | [docs/screen-inventory.md](docs/screen-inventory.md) |
| Skill-to-activity coverage map | [docs/coverage-map.md](docs/coverage-map.md) |
| Provisional assessment and mastery rules | [docs/assessment-rules.md](docs/assessment-rules.md) |
| Assumptions and unresolved decisions | [docs/assumptions-and-decisions.md](docs/assumptions-and-decisions.md) |
| Functional vs simulated vs production | [docs/prototype-vs-production.md](docs/prototype-vs-production.md) |
| Verification results and screenshots | [docs/verification.md](docs/verification.md) |
| Phase 1 backlog | [docs/backlog.md](docs/backlog.md) |
| Content format for import | [docs/content-format.md](docs/content-format.md) |
