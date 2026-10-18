# What is functional, what is simulated, and what production needs

| Area | Functional in the prototype | Simulated / demonstration only | Production work required |
|---|---|---|---|
| Assessment | Deterministic evaluation of all three templates against explicit criteria; per-skill results; feedback composition | Runs in the browser, so results can be tampered with | Server-side authoritative scoring, attempt integrity, audit trail |
| Evidence and mastery | Evidence storage, duplicate detection, independence, practice-only, mastery derivation, completion, recommendations | Stored in localStorage per browser | Persistent database, idempotent submission API, analytics on rule effectiveness, rule configuration per path |
| Content | Typed, versioned bundles; drafts separate from published; validation and coverage gate; JSON import with preview; Explore and activity editing | All content and edits live in localStorage | Content store and API, workflow (review/approval), asset storage, change history per field, authoring guidance for Claude-assisted drafting |
| Versions | Pinned enrollments, version-tagged attempts, moving to latest | Single-browser demo | Migration policy, per-learner version management, reporting across versions |
| Access | Free samples vs subscription gating; locked states; return-to-destination after upgrade | Upgrade, cancellation and expiry are local state changes; no payment | Billing provider, entitlements service, server-side enforcement, tax/receipts, dunning, refunds |
| Identity and roles | Learner/Editor/Admin experiences; editor restrictions in UI | Role switching via Demo controls; no authentication | Real sign-in, server-side authorisation, account management, privacy and data-retention policy |
| Analytics | Admin overview layout, definitions, date ranges, local demo event log | All figures are seeded fiction; local events never leave the browser | Event pipeline, metric definitions sign-off, privacy-compliant tracking |
| Media | Labelled video placeholders, transcripts, failure fallback | No video assets | Video production, hosting, captions, player accessibility |
| Users | Directory, filters, details, simulated access/role changes | Fictional people | Real user administration, support tooling |
| Accessibility | Keyboard operation, visible focus, labelled controls, accessible dialogs (Radix), status not by colour alone, reduced motion, touch targets, table views for charts | Checked manually and by browser journeys, not by an automated audit | Full WCAG 2.2 AA audit with assistive-technology testing |
| Localisation | Centralised UI strings, logical CSS properties | English only | Arabic content and RTL QA, locale formatting, translation workflow |
