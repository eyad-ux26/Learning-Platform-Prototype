# Skill-to-activity coverage map

Flagship path: **Calibrated Trust in AI Interfaces** (content version 1).

Chain: **Skill → Assessment criterion → Activity → Variant → Feedback → Related Explore content.**

- 8 baseline activities and 4 targeted alternatives, across 3 templates (Design Bench, Critique a Design, Decision Scenario).
- Every flagship skill can be demonstrated in at least 2 distinct contexts (actual minimum: 6).
- A context is the activity's `contextKey`. Two activities with the same key count as one context.
- "Feedback when unmet" quotes the feedback a learner gets for that criterion. For Critique activities, it lists the elements that decide the criterion (always at least one acceptable and one problematic, so flagging everything cannot pass).
- This table was generated from `src/content/flagship/*`. The admin **Content and skills → Coverage map** tab shows the same data live, including any draft edits.

Alternatives and the gap they target:

| Alternative | Offers different practice for | Targets |
|---|---|---|
| A due date from a scanned invoice (`bench-invoice`) | `bench-deadline` | Uncertainty, evidence (source) |
| Review an AI analytics insight (`critique-insight`) | `critique-recap` | Evidence, actionable uncertainty |
| An assistant that moves meetings (`scenario-calendar`) | `scenario-triage` | Correction and recovery, commitment |
| A bulk price update across a catalogue (`bench-pricing`) | `bench-booking` | Commitment, recovery |

Free samples: `bench-deadline`, `critique-recap`, and the Explore lesson "What calibrated trust means". Each preview path has one free sample activity.

## Communicate uncertainty appropriately

Distinct contexts: **8** (task-deadline, meeting-recap, bulk-replan, doc-summary, ticket-routing, expense-categorisation, invoice-extraction, analytics-insight). Explore: Communicating uncertainty.

| Criterion | Activity | Template | Variant | Context | Feedback when unmet |
|---|---|---|---|---|---|
| `unc-distinguish` Inferred output is visibly distinguished from information a person entered or confirmed. | A deadline from an ambiguous message (`bench-deadline`) | design-bench | Baseline | AI-extracted task deadline | The proposed date looks the same as a date a person entered. In list views and exports it will be read as agreed. |
| `unc-distinguish` Inferred output is visibly distinguished from information a person entered or confirmed. | Review an AI meeting recap (`critique-recap`) | critique | Baseline | AI-generated meeting recap | Recap label (acceptable); Action items on the Team board (problematic) |
| `unc-distinguish` Inferred output is visibly distinguished from information a person entered or confirmed. | A summary at the top of a policy (`bench-summary`) | design-bench | Baseline | AI-generated document summary | The summary blends into the document, so 120 readers will treat it as approved policy text. |
| `unc-distinguish` Inferred output is visibly distinguished from information a person entered or confirmed. | Suggested routing for support tickets (`scenario-triage`) | decision | Baseline | AI ticket categorisation | Routing on the top guess presents an inference as a settled category. |
| `unc-distinguish` Inferred output is visibly distinguished from information a person entered or confirmed. | Review automatic expense categories (`critique-expenses`) | critique | Baseline | AI-categorised card transactions | Uber row (problematic); Amazon row note (acceptable) |
| `unc-distinguish` Inferred output is visibly distinguished from information a person entered or confirmed. | A due date from a scanned invoice (`bench-invoice`) | design-bench | Alternative for `bench-deadline` | AI-extracted invoice due date | The suggested due date looks verified and will schedule a payment like any other. |
| `unc-actionable` Uncertainty is described specifically enough that the user knows what to check, without invented precision. | A deadline from an ambiguous message (`bench-deadline`) | design-bench | Baseline | AI-extracted task deadline | The uncertainty signal doesn’t tell the user what might be wrong. Here the problem is specific: which Friday. |
| `unc-actionable` Uncertainty is described specifically enough that the user knows what to check, without invented precision. | Review an AI meeting recap (`critique-recap`) | critique | Baseline | AI-generated meeting recap | “Recap accuracy 94%” meter (problematic); Unidentified speakers note (acceptable) |
| `unc-actionable` Uncertainty is described specifically enough that the user knows what to check, without invented precision. | Replanning 214 tasks after a slip (`scenario-replan`) | decision | Baseline | AI-proposed bulk reschedule | Uncalibrated percentages look precise but don’t say what is uncertain: that the link was guessed from a name. |
| `unc-actionable` Uncertainty is described specifically enough that the user knows what to check, without invented precision. | A summary at the top of a policy (`bench-summary`) | design-bench | Baseline | AI-generated document summary | The uncertainty signal doesn’t point at the stipend conflict, the one fact most likely to be wrong. |
| `unc-actionable` Uncertainty is described specifically enough that the user knows what to check, without invented precision. | A due date from a scanned invoice (`bench-invoice`) | design-bench | Alternative for `bench-deadline` | AI-extracted invoice due date | The signal doesn’t reveal that the date rests on an assumption about delivery. |
| `unc-actionable` Uncertainty is described specifically enough that the user knows what to check, without invented precision. | Review an AI analytics insight (`critique-insight`) | critique | Alternative for `critique-recap` | AI-generated analytics insight | Causal headline (problematic); Two-changes note (acceptable) |

## Provide useful evidence and explanations

Distinct contexts: **8** (task-deadline, meeting-recap, doc-summary, booking-change, ticket-routing, expense-categorisation, invoice-extraction, analytics-insight). Explore: Evidence and explanations.

| Criterion | Activity | Template | Variant | Context | Feedback when unmet |
|---|---|---|---|---|---|
| `evi-source` The source supporting an output can be inspected where the decision is made. | A deadline from an ambiguous message (`bench-deadline`) | design-bench | Baseline | AI-extracted task deadline | Users can’t see what the message actually said without leaving the task. |
| `evi-source` The source supporting an output can be inspected where the decision is made. | Review an AI meeting recap (`critique-recap`) | critique | Baseline | AI-generated meeting recap | “Team agreed to drop the Android beta” (problematic); Timestamped action item (acceptable) |
| `evi-source` The source supporting an output can be inspected where the decision is made. | A summary at the top of a policy (`bench-summary`) | design-bench | Baseline | AI-generated document summary | Points can’t be traced to the document, so checking them means rereading it. |
| `evi-source` The source supporting an output can be inspected where the decision is made. | Review automatic expense categories (`critique-expenses`) | critique | Baseline | AI-categorised card transactions | “Why ‘Software’?” explanation (acceptable); “Matched to receipt” claim (problematic) |
| `evi-source` The source supporting an output can be inspected where the decision is made. | A due date from a scanned invoice (`bench-invoice`) | design-bench | Alternative for `bench-deadline` | AI-extracted invoice due date | The clerk can’t see the terms that the date depends on. |
| `evi-source` The source supporting an output can be inspected where the decision is made. | Review an AI analytics insight (`critique-insight`) | critique | Alternative for `critique-recap` | AI-generated analytics insight | Basis with “Open query” (acceptable); Segment breakdown (problematic) |
| `evi-specific` Explanations are specific to this output and proportionate to the decision. | Review an AI meeting recap (`critique-recap`) | critique | Baseline | AI-generated meeting recap | “Why these points?” explanation (problematic); Coverage note (acceptable) |
| `evi-specific` Explanations are specific to this output and proportionate to the decision. | A summary at the top of a policy (`bench-summary`) | design-bench | Baseline | AI-generated document summary | The explanation is either missing, about the product rather than this summary, or too long to be useful. |
| `evi-specific` Explanations are specific to this output and proportionate to the decision. | Moving a client’s appointment (`bench-booking`) | design-bench | Baseline | Suggested booking change | The explanation is missing, vague or too long to use between sessions. |
| `evi-specific` Explanations are specific to this output and proportionate to the decision. | Suggested routing for support tickets (`scenario-triage`) | decision | Baseline | AI ticket categorisation | Without an explanation, agents have nothing to weigh the suggestion against. |
| `evi-specific` Explanations are specific to this output and proportionate to the decision. | Review an AI analytics insight (`critique-insight`) | critique | Alternative for `critique-recap` | AI-generated analytics insight | “Why this insight?” text (acceptable); “Powered by advanced AI” badge (problematic) |

## Enable correction and recovery

Distinct contexts: **9** (task-deadline, bulk-replan, doc-summary, crm-cleanup, booking-change, ticket-routing, expense-categorisation, calendar-autoschedule, catalog-pricing). Explore: Correction and recovery.

| Criterion | Activity | Template | Variant | Context | Feedback when unmet |
|---|---|---|---|---|---|
| `cor-inplace` Users can correct the output directly, with effort proportionate to a small fix. | A deadline from an ambiguous message (`bench-deadline`) | design-bench | Baseline | AI-extracted task deadline | Fixing a wrong date takes more effort than the mistake deserves. |
| `cor-inplace` Users can correct the output directly, with effort proportionate to a small fix. | A summary at the top of a policy (`bench-summary`) | design-bench | Baseline | AI-generated document summary | Regenerating to fix one number can introduce new errors in sentences that were right. |
| `cor-inplace` Users can correct the output directly, with effort proportionate to a small fix. | Suggested routing for support tickets (`scenario-triage`) | decision | Baseline | AI ticket categorisation | Re-running asks the system to change its mind instead of letting the agent apply what they know. |
| `cor-inplace` Users can correct the output directly, with effort proportionate to a small fix. | Review automatic expense categories (`critique-expenses`) | critique | Baseline | AI-categorised card transactions | Adobe row with Accept / Change (acceptable); “Create a rule in Settings” to change (problematic) |
| `cor-inplace` Users can correct the output directly, with effort proportionate to a small fix. | An assistant that moves meetings (`scenario-calendar`) | decision | Alternative for `scenario-triage` | AI calendar rescheduling | Kai can reject the change but not correct it; the fix costs a conversation. |
| `cor-recovery` Recovery after commitment matches what the change affected and how late problems are discovered. | A deadline from an ambiguous message (`bench-deadline`) | design-bench | Baseline | AI-extracted task deadline | Recovery doesn’t match the commitment: without any recovery, or with only a short undo after an automatic change, a wrong date stays wrong. |
| `cor-recovery` Recovery after commitment matches what the change affected and how late problems are discovered. | Replanning 214 tasks after a slip (`scenario-replan`) | decision | Baseline | AI-proposed bulk reschedule | Manual repair puts the cost of the system’s mistake on the people it affected. |
| `cor-recovery` Recovery after commitment matches what the change affected and how late problems are discovered. | Review a bulk archive confirmation (`critique-archive`) | critique | Baseline | AI-proposed contact cleanup | “Cannot be restored” policy (problematic); Undo toast (acceptable) |
| `cor-recovery` Recovery after commitment matches what the change affected and how late problems are discovered. | Moving a client’s appointment (`bench-booking`) | design-bench | Baseline | Suggested booking change | Recovery only restores the calendar, or doesn’t exist, while the message to Elena cannot be taken back. |
| `cor-recovery` Recovery after commitment matches what the change affected and how late problems are discovered. | An assistant that moves meetings (`scenario-calendar`) | decision | Alternative for `scenario-triage` | AI calendar rescheduling | Recovery must reach all the assistant’s changes, not just the last one. |
| `cor-recovery` Recovery after commitment matches what the change affected and how late problems are discovered. | A bulk price update across a catalogue (`bench-pricing`) | design-bench | Alternative for `bench-booking` | AI-proposed bulk catalogue update | Price problems surface days later; a 10-second undo or no recovery does not cover that. |

## Choose appropriate confirmation and commitment behaviour

Distinct contexts: **6** (task-deadline, bulk-replan, crm-cleanup, booking-change, calendar-autoschedule, catalog-pricing). Explore: Confirmation and commitment.

| Criterion | Activity | Template | Variant | Context | Feedback when unmet |
|---|---|---|---|---|---|
| `com-proportionate` The commitment step is proportionate to the impact and reversibility of the change. | A deadline from an ambiguous message (`bench-deadline`) | design-bench | Baseline | AI-extracted task deadline | The commitment step doesn’t fit this change: it either sends an unchecked guess to people, commits it silently with other edits, or adds friction a reversible change doesn’t need. |
| `com-proportionate` The commitment step is proportionate to the impact and reversibility of the change. | Replanning 214 tasks after a slip (`scenario-replan`) | decision | Baseline | AI-proposed bulk reschedule | A dialog for a private, reversible edit adds friction without protecting anyone, and teaches people to click through dialogs. |
| `com-proportionate` The commitment step is proportionate to the impact and reversibility of the change. | Review a bulk archive confirmation (`critique-archive`) | critique | Baseline | AI-proposed contact cleanup | Review-before-archive note (acceptable); “Apply future cleanups automatically” option (problematic) |
| `com-proportionate` The commitment step is proportionate to the impact and reversibility of the change. | Moving a client’s appointment (`bench-booking`) | design-bench | Baseline | Suggested booking change | An irreversible message to a client goes out without a real point of control. |
| `com-proportionate` The commitment step is proportionate to the impact and reversibility of the change. | An assistant that moves meetings (`scenario-calendar`) | decision | Alternative for `scenario-triage` | AI calendar rescheduling | Changes that affect other people’s calendars need a point of control that solo changes don’t. |
| `com-proportionate` The commitment step is proportionate to the impact and reversibility of the change. | A bulk price update across a catalogue (`bench-pricing`) | design-bench | Alternative for `bench-booking` | AI-proposed bulk catalogue update | A broad, live change is committed with the same effort as a single edit, or with none. |
| `com-consequence` Confirmations state the specific consequences: what changes, for whom, and what cannot be undone. | Replanning 214 tasks after a slip (`scenario-replan`) | decision | Baseline | AI-proposed bulk reschedule | Nobody sees what will change before it happens. |
| `com-consequence` Confirmations state the specific consequences: what changes, for whom, and what cannot be undone. | Review a bulk archive confirmation (`critique-archive`) | critique | Baseline | AI-proposed contact cleanup | Selection criteria (acceptable); Open deals warning (acceptable); “Yes” button (problematic) |
| `com-consequence` Confirmations state the specific consequences: what changes, for whom, and what cannot be undone. | Moving a client’s appointment (`bench-booking`) | design-bench | Baseline | Suggested booking change | Sam commits without seeing what Elena will be told. A confirmation that only asks “Are you sure?” doesn’t show consequences. |
| `com-consequence` Confirmations state the specific consequences: what changes, for whom, and what cannot be undone. | A bulk price update across a catalogue (`bench-pricing`) | design-bench | Alternative for `bench-booking` | AI-proposed bulk catalogue update | The confirmation shows a number, not the consequences. The contract and promotion items stay hidden. |
