import type { DesignBenchActivity } from "@/domain/types";
import { FLAGSHIP_ID } from "./skills";

/** Fixed demonstration date used across the scenarios. Never derived from the real clock. */
export const DEMO_TODAY_LABEL = "Tuesday, 10 March 2026";

export const benchDeadline: DesignBenchActivity = {
  id: "bench-deadline",
  pathId: FLAGSHIP_ID,
  template: "design-bench",
  title: "A deadline from an ambiguous message",
  contextLabel: "AI-extracted task deadline",
  contextKey: "task-deadline",
  kind: "baseline",
  estimatedMinutes: 12,
  scenario:
    "You design Planwise, a project management tool. A new feature reads messages linked to a task and proposes a due date. In this scenario today is Tuesday, 10 March 2026. Jordan’s message says “by next Friday”. On a Tuesday that could mean this week’s Friday (13 March) or the following one (20 March). The assistant proposed 13 March.",
  task: "Configure how the proposed due date appears and behaves in the task panel. Then use the preview as a user would: open the source, change the date, accept it and try to undo.",
  constraints: [
    "Setting a due date notifies all three assignees and moves the dependent task “Launch checklist sign-off”.",
    "Dates can be changed later, but notifications that were sent cannot be recalled.",
    "The same field is shown in a compact list view where extra text is truncated.",
    "The extraction model does not produce calibrated confidence values for dates.",
  ],
  criteria: ["unc-distinguish", "unc-actionable", "evi-source", "cor-inplace", "com-proportionate", "cor-recovery"],
  relatedConcepts: ["communicating-uncertainty", "evidence-explanations", "correction-recovery", "confirmation-commitment"],
  hints: [
    "Ask what someone scanning the list view would believe about this date if they never opened the task.",
    "The ambiguity has a specific shape: two possible Fridays. Can the interface say that instead of a general warning?",
    "Due dates notify people. Which commitment step stops an unchecked guess from reaching three inboxes, without adding a dialog to every small change?",
  ],
  solution:
    "One strong combination: show the date as a provisional ‘Suggested’ value (or a suggestion chip), name the specific ambiguity (13 or 20 March), let people open the source message with the phrase highlighted, offer both Fridays plus an editable date, apply it only when the user selects Accept, and provide an undo toast plus task history. Other combinations can also meet the criteria; the feedback explains why.",
  preview: {
    app: "Planwise",
    screenTitle: "Spring launch",
    breadcrumb: "Projects / Spring launch / Tasks",
    recordTitle: "Vendor contract review",
    recordFields: [
      { label: "Owner", value: "Ana Ruiz" },
      { label: "Assignees", value: "Ana Ruiz, Jordan Lee, Wei Chen" },
      { label: "Status", value: "In progress" },
      { label: "Blocks", value: "Launch checklist sign-off" },
    ],
    proposal: {
      kind: "field",
      label: "Due date",
      value: "Fri, 13 Mar 2026",
      valueIso: "2026-03-13",
      alternatives: [
        { label: "Fri, 13 Mar", iso: "2026-03-13" },
        { label: "Fri, 20 Mar", iso: "2026-03-20" },
      ],
      percentText: "82% confident",
      genericText: "AI-generated · may be inaccurate",
      specificText: "“Next Friday” could mean 13 or 20 Mar. Jordan also wants buffer before the 20th.",
      quote: "“…wrapped up by next Friday?”",
      tooltipText: "Extracted by AI from a linked message.",
      source: {
        title: "Jordan Lee in #spring-launch",
        meta: "Tue, 10 Mar 2026 · 09:14",
        body: "Hey Ana — can we get the vendor contract review wrapped up by next Friday? Legal said end of week works for them, but I’d rather have some buffer before the launch freeze on the 20th.",
        highlight: "by next Friday",
      },
      impactText: "Notifies 3 assignees · moves “Launch checklist sign-off”",
    },
  },
  decisions: [
    {
      id: "presentation",
      dimension: "presentation",
      prompt: "How does the proposed date appear?",
      options: [
        {
          id: "fill",
          label: "Fill the due date field directly",
          behaviour: "as-fact",
          tradeoff: "Fastest to read and works in every view, but looks identical to a date a person entered.",
          consequence: "In the list view the guessed date looks like an agreed deadline.",
        },
        {
          id: "chip",
          label: "Leave the field empty and show a suggestion chip beside it",
          behaviour: "chip",
          tradeoff: "Clearly separate from real data and needs one action to adopt; until then the list view shows no deadline.",
          consequence: "Nobody mistakes the suggestion for an agreed date, though the task shows as undated until someone acts.",
        },
        {
          id: "ghost",
          label: "Pre-fill the field in a distinct ‘Suggested’ style until accepted",
          behaviour: "provisional",
          tradeoff: "Visible in context and clearly provisional, but the style has to survive compact views and exports.",
          consequence: "The date is visible where people expect it, marked as a suggestion until accepted.",
        },
      ],
    },
    {
      id: "uncertainty",
      dimension: "uncertainty",
      prompt: "How is uncertainty communicated?",
      options: [
        { id: "none", label: "No indicator", behaviour: "none", tradeoff: "Clean, but gives no reason to check.", consequence: "Users have no signal that the date might be the wrong Friday." },
        {
          id: "percent",
          label: "Show the model’s confidence as a percentage",
          behaviour: "percent",
          tradeoff: "Looks precise and compact, but this model’s scores are not calibrated for dates and don’t say what to check.",
          consequence: "“82%” reads as reliable; nobody learns that the real question is which Friday.",
        },
        {
          id: "generic",
          label: "Label it “AI-generated · may be inaccurate”",
          behaviour: "generic",
          tradeoff: "Honest and consistent, but the same words on every suggestion quickly become background noise.",
          consequence: "Users know it is AI output but not what might be wrong with it.",
        },
        {
          id: "specific",
          label: "Name the ambiguity: “‘Next Friday’ could mean 13 or 20 Mar”",
          behaviour: "specific",
          tradeoff: "Tells people exactly what to check; costs a line of text and needs a fallback in compact views.",
          consequence: "Users see the two possible dates and can resolve the ambiguity in seconds.",
        },
      ],
    },
    {
      id: "evidence",
      dimension: "evidence",
      prompt: "Can the source be inspected?",
      options: [
        { id: "none", label: "No source shown", behaviour: "none", tradeoff: "Simplest; users must find the message themselves.", consequence: "Checking the date means searching the channel history." },
        {
          id: "tooltip",
          label: "Tooltip: “Extracted by AI from a linked message”",
          behaviour: "tooltip",
          tradeoff: "Explains where it came from in general, without showing what the message said.",
          consequence: "Users know a message exists but still cannot see the wording.",
        },
        {
          id: "quote",
          label: "Quote the phrase under the field",
          behaviour: "quote",
          tradeoff: "Immediate and compact, but strips context such as “buffer before the 20th”.",
          consequence: "Users see “by next Friday” at a glance, without the rest of Jordan’s sentence.",
        },
        {
          id: "source",
          label: "“View source” opens the message with the phrase highlighted",
          behaviour: "source",
          tradeoff: "Full context one click away; adds a control and a small panel.",
          consequence: "Users can read the whole message, including the 20 March freeze, before deciding.",
        },
      ],
    },
    {
      id: "correction",
      dimension: "correction",
      prompt: "How can the user correct the value?",
      options: [
        { id: "regen", label: "“Try again” regenerates the suggestion", behaviour: "regenerate", tradeoff: "No new UI, but users can’t simply set the date they know is right.", consequence: "A user who knows the answer has to hope the next guess matches it." },
        { id: "edit", label: "Click the date to edit it with a date picker", behaviour: "inline-edit", tradeoff: "Direct and familiar; doesn’t surface the likely alternative.", consequence: "Users fix the date in place in a couple of clicks." },
        {
          id: "alts",
          label: "Choose between the two candidate Fridays, or edit",
          behaviour: "alternatives",
          tradeoff: "Fastest for this ambiguity; only useful when the system can name real alternatives.",
          consequence: "Users pick 20 March with one click, or set any date.",
        },
        { id: "settings", label: "Change it from the task settings page", behaviour: "settings", tradeoff: "Reuses an existing screen, at the cost of leaving the context.", consequence: "Correcting one date means leaving the task panel and finding the field again." },
      ],
    },
    {
      id: "commitment",
      dimension: "commitment",
      prompt: "When is the value committed?",
      options: [
        {
          id: "auto",
          label: "Apply immediately and notify assignees",
          behaviour: "auto",
          tradeoff: "Zero effort, but an unchecked guess reaches three people straight away.",
          consequence: "Three assignees are notified of a date nobody confirmed.",
        },
        {
          id: "accept",
          label: "Apply when the user selects Accept on the suggestion",
          behaviour: "accept",
          tradeoff: "One deliberate action for a reversible change; easy to ignore if never acted on.",
          consequence: "Nothing is sent until someone accepts the date they have seen.",
        },
        {
          id: "dialog",
          label: "Accept, then confirm in an “Are you sure?” dialog",
          behaviour: "dialog",
          tradeoff: "Feels safe, but adds a second step to a small, reversible change.",
          consequence: "Every accepted date costs two clicks; people learn to click through dialogs, which weakens them where they matter.",
        },
        {
          id: "save",
          label: "Apply when the user saves the task",
          behaviour: "on-save",
          tradeoff: "No extra step, but the date rides along with unrelated edits.",
          consequence: "Saving any change to the task also commits the suggested date.",
        },
      ],
    },
    {
      id: "recovery",
      dimension: "recovery",
      prompt: "What recovery is available after committing?",
      options: [
        { id: "none", label: "None; edit the date again", behaviour: "none", tradeoff: "Nothing to build, but no record of what changed.", consequence: "If the date was wrong, someone must notice and fix it from memory." },
        { id: "undo", label: "“Due date set · Undo” toast for 10 seconds", behaviour: "undo", tradeoff: "Catches immediate mistakes; useless once the toast disappears.", consequence: "A mis-click can be reversed straight away." },
        { id: "history", label: "Previous value kept in task history, revertible", behaviour: "history", tradeoff: "Works later; slower for immediate slips.", consequence: "Days later anyone can see the change and restore the old value." },
        { id: "both", label: "Undo toast plus revertible history", behaviour: "undo-history", tradeoff: "Covers immediate and late discovery; two mechanisms to maintain.", consequence: "Mistakes can be reversed now or later." },
      ],
    },
  ],
  rules: [
    {
      criterionId: "unc-distinguish",
      passWhen: [
        [{ decision: "presentation", oneOf: ["chip", "ghost"] }],
        [
          { decision: "presentation", oneOf: ["fill"] },
          { decision: "uncertainty", oneOf: ["generic", "specific"] },
        ],
      ],
      evidenceFrom: ["presentation", "uncertainty"],
      pass: "The proposed date is visibly different from a confirmed one, so nobody treats a guess as an agreed deadline.",
      fail: "The proposed date looks the same as a date a person entered. In list views and exports it will be read as agreed.",
    },
    {
      criterionId: "unc-actionable",
      passWhen: [[{ decision: "uncertainty", oneOf: ["specific"] }]],
      evidenceFrom: ["uncertainty"],
      pass: "You named the actual ambiguity, so the user knows exactly what to check.",
      fail: "The uncertainty signal doesn’t tell the user what might be wrong. Here the problem is specific: which Friday.",
    },
    {
      criterionId: "evi-source",
      passWhen: [[{ decision: "evidence", oneOf: ["quote", "source"] }]],
      evidenceFrom: ["evidence"],
      pass: "The wording behind the date can be checked where the decision is made.",
      fail: "Users can’t see what the message actually said without leaving the task.",
    },
    {
      criterionId: "cor-inplace",
      passWhen: [[{ decision: "correction", oneOf: ["edit", "alts"] }]],
      evidenceFrom: ["correction"],
      pass: "Correcting the date takes a moment and happens in place.",
      fail: "Fixing a wrong date takes more effort than the mistake deserves.",
    },
    {
      criterionId: "com-proportionate",
      passWhen: [
        [{ decision: "commitment", oneOf: ["accept"] }],
        [
          { decision: "commitment", oneOf: ["save"] },
          { decision: "presentation", oneOf: ["chip", "ghost"] },
        ],
      ],
      evidenceFrom: ["commitment", "presentation"],
      pass: "Commitment needs one deliberate action, which fits a reversible change that notifies a few teammates.",
      fail: "The commitment step doesn’t fit this change: it either sends an unchecked guess to people, commits it silently with other edits, or adds friction a reversible change doesn’t need.",
    },
    {
      criterionId: "cor-recovery",
      passWhen: [
        [
          { decision: "recovery", oneOf: ["undo", "history", "both"] },
          { decision: "commitment", oneOf: ["accept", "dialog", "save"] },
        ],
        [
          { decision: "recovery", oneOf: ["both"] },
          { decision: "commitment", oneOf: ["auto"] },
        ],
      ],
      evidenceFrom: ["recovery", "commitment"],
      pass: "If the date turns out wrong, there is a clear way back that fits when people are likely to notice.",
      fail: "Recovery doesn’t match the commitment: without any recovery, or with only a short undo after an automatic change, a wrong date stays wrong.",
    },
  ],
};

export const benchSummary: DesignBenchActivity = {
  id: "bench-summary",
  pathId: FLAGSHIP_ID,
  template: "design-bench",
  title: "A summary at the top of a policy",
  contextLabel: "AI-generated document summary",
  contextKey: "doc-summary",
  kind: "baseline",
  estimatedMinutes: 12,
  scenario:
    "You design Docpad, a shared document editor. An assistant summarises long documents. Mei, an HR lead, asks it to summarise the 14-page “Remote work policy v3” for the leadership group. The draft contains a contradiction: section 4.2 gives the equipment stipend as €600, while Appendix B lists €450. The summary used €600.",
  task: "Decide how the summary is presented, how its uncertainty and basis are shown, and how Mei corrects it before sharing.",
  constraints: [
    "The summary will be read by about 120 people, many of whom will not open the full document.",
    "Mei is accountable for the content but did not write every section.",
    "The assistant can link each sentence to the sections it used.",
  ],
  criteria: ["unc-distinguish", "unc-actionable", "evi-source", "evi-specific", "cor-inplace"],
  relatedConcepts: ["communicating-uncertainty", "evidence-explanations", "correction-recovery"],
  hints: [
    "Readers who skim only the summary are the ones most likely to be misled. What would they need to see?",
    "There are two kinds of support here: where each sentence came from, and why these points were chosen. They are separate decisions.",
  ],
  solution:
    "Keep the summary in a labelled draft block or side panel until Mei accepts it, name the stipend contradiction specifically, link each sentence to the sections it used, explain which sections were included and excluded, and let Mei edit the text or choose between the two stipend values.",
  preview: {
    app: "Docpad",
    screenTitle: "Remote work policy v3",
    breadcrumb: "People team / Policies",
    recordTitle: "Remote work policy v3",
    recordFields: [
      { label: "Owner", value: "Mei Tanaka" },
      { label: "Length", value: "14 pages · 9 sections" },
      { label: "Audience", value: "Leadership group (≈120)" },
    ],
    proposal: {
      kind: "text",
      label: "Summary",
      value:
        "Employees may work remotely up to 3 days a week with manager approval. Core hours are 10:00–15:00 local time. The equipment stipend is €600. The policy takes effect on 1 April 2026.",
      alternatives: [{ label: "Use €600 (§4.2)" }, { label: "Use €450 (Appendix B)" }],
      percentText: "Confidence: High",
      genericText: "AI-generated · may contain mistakes",
      specificText: "§4.2 and Appendix B give different stipends (€600 and €450). The summary uses €600.",
      reasonText:
        "Built from §2 Eligibility, §3 Core hours, §4.2 Equipment and §7 Effective date. §5–6 were left out because they repeat the 2024 policy unchanged.",
      tooltipText: "Summary generated by Docpad Assistant.",
      source: {
        title: "Remote work policy v3 — §4.2 Equipment",
        meta: "Page 6 · edited by Mei Tanaka on 6 Mar 2026",
        body: "4.2 Equipment. Employees approved for remote work receive a one-time equipment stipend of €600, paid with the next salary. … Appendix B, Stipend table: Remote (hybrid) — €450.",
        highlight: "€600",
      },
      impactText: "Shown at the top of the document for ≈120 readers",
    },
  },
  decisions: [
    {
      id: "presentation",
      dimension: "presentation",
      prompt: "Where does the summary appear?",
      options: [
        { id: "insert", label: "Insert it at the top of the document as normal text", behaviour: "as-fact", tradeoff: "Reads naturally, but becomes indistinguishable from what Mei wrote.", consequence: "Readers treat the assistant’s wording as Mei’s approved text." },
        { id: "panel", label: "Show it in a side panel as a draft Mei can insert", behaviour: "chip", tradeoff: "Clearly a draft; one more step before readers see it.", consequence: "Nothing reaches readers until Mei chooses to insert it." },
        { id: "block", label: "Insert it as a labelled ‘Assistant draft’ block", behaviour: "provisional", tradeoff: "In place and clearly provisional; the label must be removed deliberately.", consequence: "Readers can see it is an unreviewed draft until Mei accepts it." },
      ],
    },
    {
      id: "uncertainty",
      dimension: "uncertainty",
      prompt: "How is uncertainty communicated?",
      options: [
        { id: "none", label: "No indicator", behaviour: "none", tradeoff: "Uncluttered.", consequence: "The stipend contradiction is invisible." },
        { id: "percent", label: "Overall confidence: “High”", behaviour: "percent", tradeoff: "Short and reassuring, but describes the whole summary while the problem is one number.", consequence: "Mei is told the summary is reliable, and shares the wrong stipend." },
        { id: "generic", label: "“AI-generated · may contain mistakes”", behaviour: "generic", tradeoff: "Honest boilerplate; does not point at the problem.", consequence: "Mei knows mistakes are possible but not where." },
        { id: "specific", label: "Flag the stipend contradiction specifically", behaviour: "specific", tradeoff: "Points straight at the issue; requires the system to detect conflicts.", consequence: "Mei sees the €600 / €450 conflict before anyone else does." },
      ],
    },
    {
      id: "evidence",
      dimension: "evidence",
      prompt: "How can readers check where each point came from?",
      options: [
        { id: "none", label: "No links", behaviour: "none", tradeoff: "Cleanest reading experience.", consequence: "Checking any point means searching 14 pages." },
        { id: "tooltip", label: "Tooltip: “Summary generated by Docpad Assistant”", behaviour: "tooltip", tradeoff: "Attribution without traceability.", consequence: "Readers know who wrote it, not what it is based on." },
        { id: "source", label: "Each sentence links to the section it came from", behaviour: "source", tradeoff: "Traceable; adds small link markers to the text.", consequence: "Any reader can jump to §4.2 and see the stipend wording." },
      ],
    },
    {
      id: "explanation",
      dimension: "explanation",
      prompt: "What explanation accompanies the summary?",
      options: [
        { id: "none", label: "None", behaviour: "none", tradeoff: "Shortest.", consequence: "Readers don’t know what was left out." },
        { id: "generic", label: "“Our AI identifies the most important points”", behaviour: "generic", tradeoff: "Friendly, but says nothing about this document.", consequence: "Readers are reassured without being informed." },
        { id: "reason", label: "List the sections used and those left out, and why", behaviour: "reason", tradeoff: "Specific and short; must be generated per document.", consequence: "Readers know §5–6 were skipped because they are unchanged." },
        { id: "trace", label: "Show the assistant’s full reasoning log", behaviour: "trace", tradeoff: "Maximally transparent, but long, technical and rarely read.", consequence: "The useful part is buried in a page of model output." },
      ],
    },
    {
      id: "correction",
      dimension: "correction",
      prompt: "How does Mei correct the summary?",
      options: [
        { id: "regen", label: "Regenerate the whole summary", behaviour: "regenerate", tradeoff: "No editor needed; may change correct sentences too.", consequence: "Fixing one number risks a new mistake elsewhere." },
        { id: "edit", label: "Edit the summary text in place", behaviour: "inline-edit", tradeoff: "Full control; Mei has to know the right value.", consequence: "Mei corrects the stipend directly." },
        { id: "alts", label: "Choose between the conflicting values, or edit", behaviour: "alternatives", tradeoff: "Fast for detected conflicts; only covers what the system detected.", consequence: "Mei picks the right stipend with one click." },
      ],
    },
  ],
  rules: [
    {
      criterionId: "unc-distinguish",
      passWhen: [
        [{ decision: "presentation", oneOf: ["panel", "block"] }],
        [
          { decision: "presentation", oneOf: ["insert"] },
          { decision: "uncertainty", oneOf: ["generic", "specific"] },
        ],
      ],
      evidenceFrom: ["presentation", "uncertainty"],
      pass: "Readers can tell the summary is an assistant draft rather than Mei’s approved text.",
      fail: "The summary blends into the document, so 120 readers will treat it as approved policy text.",
    },
    {
      criterionId: "unc-actionable",
      passWhen: [[{ decision: "uncertainty", oneOf: ["specific"] }]],
      evidenceFrom: ["uncertainty"],
      pass: "You pointed at the exact conflict, which is the one thing Mei must resolve.",
      fail: "The uncertainty signal doesn’t point at the stipend conflict, the one fact most likely to be wrong.",
    },
    {
      criterionId: "evi-source",
      passWhen: [[{ decision: "evidence", oneOf: ["source"] }]],
      evidenceFrom: ["evidence"],
      pass: "Each point can be traced to its section.",
      fail: "Points can’t be traced to the document, so checking them means rereading it.",
    },
    {
      criterionId: "evi-specific",
      passWhen: [[{ decision: "explanation", oneOf: ["reason"] }]],
      evidenceFrom: ["explanation"],
      pass: "The explanation is about this summary: what was used and what was left out.",
      fail: "The explanation is either missing, about the product rather than this summary, or too long to be useful.",
    },
    {
      criterionId: "cor-inplace",
      passWhen: [[{ decision: "correction", oneOf: ["edit", "alts"] }]],
      evidenceFrom: ["correction"],
      pass: "Mei can fix the one wrong value without regenerating everything.",
      fail: "Regenerating to fix one number can introduce new errors in sentences that were right.",
    },
  ],
};

export const benchBooking: DesignBenchActivity = {
  id: "bench-booking",
  pathId: FLAGSHIP_ID,
  template: "design-bench",
  title: "Moving a client’s appointment",
  contextLabel: "Suggested booking change",
  contextKey: "booking-change",
  kind: "baseline",
  estimatedMinutes: 10,
  scenario:
    "You design the scheduling tool for Northside Physio, a small clinic. Sam, a physiotherapist, added a team training session on Thursday afternoon. The assistant noticed it overlaps with Elena Novak’s appointment and suggests moving her to Friday morning. Accepting the change texts and emails Elena.",
  task: "Configure how Sam commits this change, what explanation he sees, and what recovery exists after the message is sent.",
  constraints: [
    "Messages to clients leave the product and cannot be recalled.",
    "Elena chose “mornings preferred” on her booking form.",
    "Sam usually handles scheduling between sessions, on a tablet, in under a minute.",
  ],
  criteria: ["com-proportionate", "com-consequence", "evi-specific", "cor-recovery"],
  relatedConcepts: ["confirmation-commitment", "evidence-explanations", "correction-recovery"],
  hints: [
    "What part of this change cannot be undone once it happens?",
    "An “Are you sure?” dialog adds a step. Does it tell Sam anything he needs to know?",
  ],
  solution:
    "Commit through a review step that shows Elena’s exact message and the before/after times, explain the specific conflict and why Friday 10:00 fits her preferences, and either delay sending so it can be cancelled or offer a revert that sends a correction. A one-click Accept can also be proportionate if sending is delayed and cancellable.",
  preview: {
    app: "Northside Physio",
    screenTitle: "Thursday, 12 March 2026",
    breadcrumb: "Schedule / Sam Okoye",
    recordTitle: "Elena Novak · Follow-up session",
    recordFields: [
      { label: "Current time", value: "Thu 12 Mar, 14:00–14:45" },
      { label: "Conflict", value: "Team training, 13:30–16:00" },
      { label: "Client preference", value: "Mornings" },
    ],
    proposal: {
      kind: "change",
      label: "Suggested change",
      value: "Move to Fri 13 Mar, 10:00–10:45",
      genericText: "Suggested by assistant",
      specificText: "Suggested by assistant",
      tooltipText: "Suggested by the scheduling assistant.",
      reasonText:
        "14:00 overlaps with “Team training” that Sam added yesterday. Friday 10:00 is free and matches Elena’s ‘mornings preferred’ setting.",
      source: {
        title: "Calendar change",
        meta: "Added by Sam Okoye · Wed 11 Mar 2026",
        body: "Team training (in-house), Thu 12 Mar 13:30–16:00.",
        highlight: "13:30–16:00",
      },
      reviewMessage:
        "Hi Elena, your follow-up with Sam on Thu 12 Mar at 14:00 has moved to Fri 13 Mar at 10:00. Reply 1 to confirm or 2 to choose another time.",
      impactText: "Sends an SMS and email to Elena · cannot be recalled once sent",
    },
  },
  decisions: [
    {
      id: "commitment",
      dimension: "commitment",
      prompt: "How does Sam commit the change?",
      options: [
        { id: "auto", label: "Apply and message Elena automatically", behaviour: "auto", tradeoff: "No effort for Sam; the client hears about a change nobody checked.", consequence: "Elena is messaged before Sam knows the assistant acted." },
        { id: "accept", label: "One-tap “Accept” on the suggestion", behaviour: "accept", tradeoff: "Quick between sessions; Sam doesn’t see the message Elena will get.", consequence: "One tap sends a message Sam never read." },
        { id: "review", label: "Review step: shows the before/after times and Elena’s exact message, then Send", behaviour: "review", tradeoff: "One extra screen; Sam sees exactly what will happen.", consequence: "Sam checks the message and sends it knowingly." },
        { id: "dialog", label: "Accept, then “Are you sure?” dialog", behaviour: "dialog", tradeoff: "Adds a pause, but no new information.", consequence: "Sam taps through the dialog without seeing the message." },
      ],
    },
    {
      id: "explanation",
      dimension: "explanation",
      prompt: "What explanation does Sam see?",
      options: [
        { id: "none", label: "None", behaviour: "none", tradeoff: "Shortest.", consequence: "Sam has to work out why the assistant suggested this." },
        { id: "generic", label: "“Found a better time”", behaviour: "generic", tradeoff: "Friendly, but vague.", consequence: "Sam can’t tell whether the reason applies." },
        { id: "reason", label: "The specific conflict and why Friday 10:00 fits", behaviour: "reason", tradeoff: "Two short lines; must be generated per suggestion.", consequence: "Sam sees the clash and Elena’s morning preference at a glance." },
        { id: "trace", label: "Full list of every slot the assistant considered", behaviour: "trace", tradeoff: "Complete, but long on a tablet.", consequence: "The useful reason is buried among 23 rejected slots." },
      ],
    },
    {
      id: "recovery",
      dimension: "recovery",
      prompt: "What recovery is available after committing?",
      options: [
        { id: "none", label: "None", behaviour: "none", tradeoff: "Simplest.", consequence: "A mistaken move needs a manual phone call." },
        { id: "undo", label: "10-second “Undo” that restores the calendar", behaviour: "undo", tradeoff: "Familiar, but the message has already gone.", consequence: "The calendar is restored while Elena still has a message saying her time changed." },
        { id: "delay", label: "Hold the message for 60 seconds with “Cancel send”", behaviour: "delayed-send", tradeoff: "Nothing leaves until the window passes; a short delay for the client.", consequence: "Sam can cancel before Elena is contacted." },
        { id: "revert", label: "“Revert” restores the slot and sends Elena a correction", behaviour: "rollback", tradeoff: "Works later, but Elena receives two messages.", consequence: "A wrong move can be undone later with a clear follow-up." },
      ],
    },
  ],
  rules: [
    {
      criterionId: "com-proportionate",
      passWhen: [
        [{ decision: "commitment", oneOf: ["review", "dialog"] }],
        [
          { decision: "commitment", oneOf: ["accept"] },
          { decision: "recovery", oneOf: ["delay"] },
        ],
      ],
      evidenceFrom: ["commitment", "recovery"],
      pass: "There is a deliberate point of control before an irreversible message reaches a client.",
      fail: "An irreversible message to a client goes out without a real point of control.",
    },
    {
      criterionId: "com-consequence",
      passWhen: [[{ decision: "commitment", oneOf: ["review"] }]],
      evidenceFrom: ["commitment"],
      pass: "Sam sees what will change and the exact message Elena will receive before committing.",
      fail: "Sam commits without seeing what Elena will be told. A confirmation that only asks “Are you sure?” doesn’t show consequences.",
    },
    {
      criterionId: "evi-specific",
      passWhen: [[{ decision: "explanation", oneOf: ["reason"] }]],
      evidenceFrom: ["explanation"],
      pass: "The explanation names the conflict and why the new time fits, which is all Sam needs.",
      fail: "The explanation is missing, vague or too long to use between sessions.",
    },
    {
      criterionId: "cor-recovery",
      passWhen: [[{ decision: "recovery", oneOf: ["delay", "revert"] }]],
      evidenceFrom: ["recovery"],
      pass: "Recovery accounts for the part that leaves the product: the message to Elena.",
      fail: "Recovery only restores the calendar, or doesn’t exist, while the message to Elena cannot be taken back.",
    },
  ],
};

export const benchInvoice: DesignBenchActivity = {
  id: "bench-invoice",
  pathId: FLAGSHIP_ID,
  template: "design-bench",
  title: "A due date from a scanned invoice",
  contextLabel: "AI-extracted invoice due date",
  contextKey: "invoice-extraction",
  kind: "alternative",
  alternativeFor: "bench-deadline",
  estimatedMinutes: 8,
  scenario:
    "You design Ledgerly, an accounts-payable tool. It reads scanned invoices and proposes a payment due date. This invoice from Northwind Packaging is dated 10 March 2026 and says “Net 30 from date of delivery”. The delivery date is not on the invoice, so the assistant assumed delivery on the invoice date and proposed 9 April 2026.",
  task: "Configure how the proposed due date is shown, how its uncertainty is expressed, and how the clerk checks it.",
  constraints: [
    "Payments are scheduled automatically on the due date.",
    "Clerks process about 60 invoices a day and scan the list quickly.",
    "The model does not produce calibrated confidence for extracted dates.",
  ],
  criteria: ["unc-distinguish", "unc-actionable", "evi-source"],
  relatedConcepts: ["communicating-uncertainty", "evidence-explanations"],
  hints: ["The uncertainty here is not about reading the text. It is about information that is missing from the document."],
  solution:
    "Show the date as a provisional suggestion, say that the terms depend on a delivery date that is not on the invoice, and let the clerk open the scan with the payment terms highlighted.",
  preview: {
    app: "Ledgerly",
    screenTitle: "Invoices to approve",
    breadcrumb: "Payables / Inbox",
    recordTitle: "Northwind Packaging · INV-20417",
    recordFields: [
      { label: "Invoice date", value: "10 Mar 2026" },
      { label: "Amount", value: "€4,860.00" },
      { label: "Payment terms", value: "Net 30 from date of delivery" },
    ],
    proposal: {
      kind: "field",
      label: "Due date",
      value: "Thu, 9 Apr 2026",
      valueIso: "2026-04-09",
      percentText: "91% confident",
      genericText: "Extracted automatically · check before approving",
      specificText: "Terms are ‘Net 30 from delivery’, but no delivery date is on the invoice. 9 Apr assumes delivery on 10 Mar.",
      quote: "“Net 30 from date of delivery”",
      tooltipText: "Extracted from the scanned invoice.",
      source: {
        title: "INV-20417.pdf · page 1",
        meta: "Scanned 10 Mar 2026",
        body: "Northwind Packaging Ltd · Invoice INV-20417 · Date: 10/03/2026 · Payment terms: Net 30 from date of delivery · Total due: €4,860.00",
        highlight: "Net 30 from date of delivery",
      },
      impactText: "Schedules an automatic payment on the due date",
    },
  },
  decisions: [
    {
      id: "presentation",
      dimension: "presentation",
      prompt: "How does the proposed due date appear?",
      options: [
        { id: "fill", label: "Fill the due date field", behaviour: "as-fact", tradeoff: "Fast to scan; identical to verified dates.", consequence: "The guessed date schedules a payment like any verified one." },
        { id: "chip", label: "Show a suggestion beside an empty field", behaviour: "chip", tradeoff: "Clearly unverified; invoices can’t be approved until the clerk sets a date.", consequence: "Clerks must actively adopt or replace the date." },
        { id: "ghost", label: "Pre-fill in a ‘Suggested’ style until approved", behaviour: "provisional", tradeoff: "Visible and provisional; the style must survive the list view.", consequence: "The date is visible but clearly unverified." },
      ],
    },
    {
      id: "uncertainty",
      dimension: "uncertainty",
      prompt: "How is uncertainty communicated?",
      options: [
        { id: "none", label: "No indicator", behaviour: "none", tradeoff: "Clean.", consequence: "The missing delivery date is never mentioned." },
        { id: "percent", label: "“91% confident”", behaviour: "percent", tradeoff: "Compact, but describes text recognition, not the missing information.", consequence: "The clerk trusts a date based on an assumption." },
        { id: "generic", label: "“Extracted automatically · check before approving”", behaviour: "generic", tradeoff: "Consistent reminder; doesn’t say what to check.", consequence: "Clerks see the same note on all 60 invoices and stop reading it." },
        { id: "specific", label: "Say the delivery date is missing and what was assumed", behaviour: "specific", tradeoff: "Precise; slightly longer.", consequence: "The clerk knows to check the delivery note." },
      ],
    },
    {
      id: "evidence",
      dimension: "evidence",
      prompt: "Can the source be inspected?",
      options: [
        { id: "none", label: "No source shown", behaviour: "none", tradeoff: "Simplest.", consequence: "Checking means opening the PDF separately." },
        { id: "tooltip", label: "Tooltip: “Extracted from the scanned invoice”", behaviour: "tooltip", tradeoff: "General attribution.", consequence: "The clerk still can’t see the terms." },
        { id: "quote", label: "Quote the payment terms under the field", behaviour: "quote", tradeoff: "Immediate; loses page context.", consequence: "The clerk reads ‘Net 30 from date of delivery’ at a glance." },
        { id: "source", label: "“View scan” with the terms highlighted", behaviour: "source", tradeoff: "Full context one click away.", consequence: "The clerk sees the invoice and the highlighted terms." },
      ],
    },
  ],
  rules: [
    {
      criterionId: "unc-distinguish",
      passWhen: [
        [{ decision: "presentation", oneOf: ["chip", "ghost"] }],
        [
          { decision: "presentation", oneOf: ["fill"] },
          { decision: "uncertainty", oneOf: ["generic", "specific"] },
        ],
      ],
      evidenceFrom: ["presentation", "uncertainty"],
      pass: "The suggested due date is clearly not yet verified.",
      fail: "The suggested due date looks verified and will schedule a payment like any other.",
    },
    {
      criterionId: "unc-actionable",
      passWhen: [[{ decision: "uncertainty", oneOf: ["specific"] }]],
      evidenceFrom: ["uncertainty"],
      pass: "You explained the missing information, which is what the clerk needs to check.",
      fail: "The signal doesn’t reveal that the date rests on an assumption about delivery.",
    },
    {
      criterionId: "evi-source",
      passWhen: [[{ decision: "evidence", oneOf: ["quote", "source"] }]],
      evidenceFrom: ["evidence"],
      pass: "The payment terms can be checked where the clerk approves the invoice.",
      fail: "The clerk can’t see the terms that the date depends on.",
    },
  ],
};

export const benchPricing: DesignBenchActivity = {
  id: "bench-pricing",
  pathId: FLAGSHIP_ID,
  template: "design-bench",
  title: "A bulk price update across a catalogue",
  contextLabel: "AI-proposed bulk catalogue update",
  contextKey: "catalog-pricing",
  kind: "alternative",
  alternativeFor: "bench-booking",
  estimatedMinutes: 10,
  scenario:
    "You design Shopline, a catalogue tool for online retailers. After a supplier cost update, the assistant proposes raising prices by 4% on 1,240 products. 38 of those products are in an active promotion, and 112 have prices fixed by B2B contracts.",
  task: "Decide how the merchant sees the scope of the change, how they commit it, and how they recover if it is wrong.",
  constraints: [
    "Prices update on the live store within minutes.",
    "Changing contract prices breaks agreements with business customers.",
    "Problems are usually discovered days later, when orders or complaints come in.",
  ],
  criteria: ["com-proportionate", "com-consequence", "cor-recovery"],
  relatedConcepts: ["confirmation-commitment", "correction-recovery"],
  hints: ["Typing a number to confirm proves attention, but does it show what will change?", "When are problems with a price change usually noticed?"],
  solution:
    "Show a full before/after list with promotion and contract items flagged and excludable, commit through a staged review, and provide a batch rollback that remains available for days.",
  preview: {
    app: "Shopline",
    screenTitle: "Catalogue",
    breadcrumb: "Products / Pricing",
    recordTitle: "Supplier cost update · Harbor Supply",
    recordFields: [
      { label: "Products affected", value: "1,240" },
      { label: "In active promotion", value: "38" },
      { label: "Contract-priced (B2B)", value: "112" },
    ],
    proposal: {
      kind: "bulk",
      label: "Proposed change",
      value: "Increase prices by 4% on 1,240 products",
      genericText: "Suggested by assistant",
      specificText: "Suggested by assistant",
      source: { title: "Harbor Supply price list", meta: "Received 9 Mar 2026", body: "Unit costs increase 3.8% on average from 16 Mar 2026.", highlight: "3.8%" },
      scopeCount: "1,240 products will change price",
      scopeColumns: ["Product", "Now", "New", "Note"],
      scopeRows: [
        ["Kraft mailer box S", "€1.20", "€1.25", ""],
        ["Kraft mailer box M", "€1.65", "€1.72", ""],
        ["Tissue paper, 50 sheets", "€4.90", "€5.10", "In promotion"],
        ["Bubble wrap roll 10 m", "€7.40", "€7.70", "B2B contract"],
        ["Shipping labels ×500", "€12.00", "€12.48", ""],
      ],
      scopeExcluded: "38 promotion and 112 contract items are flagged; exclude them with one control.",
      typedPhrase: "1240",
      impactText: "Updates the live store · contract prices are binding",
    },
  },
  decisions: [
    {
      id: "scope",
      dimension: "scope",
      prompt: "How is the scope of the change shown?",
      options: [
        { id: "count", label: "A count: “1,240 products will change price”", behaviour: "count", tradeoff: "Concise, but hides the products that matter most.", consequence: "Contract and promotion items change without anyone noticing." },
        { id: "sample", label: "A sample of five example rows", behaviour: "sample", tradeoff: "Makes the change concrete; may not include the exceptions.", consequence: "The merchant sees typical rows but may miss the exceptions." },
        { id: "diff", label: "Full before/after list with exceptions flagged and excludable", behaviour: "diff", tradeoff: "Complete; more to review.", consequence: "The 150 sensitive products are visible and can be excluded." },
      ],
    },
    {
      id: "commitment",
      dimension: "commitment",
      prompt: "How is the change committed?",
      options: [
        { id: "accept", label: "One-click “Apply”", behaviour: "accept", tradeoff: "Fast; same effort as a single edit.", consequence: "1,240 prices change with one click." },
        { id: "typed", label: "Type “1240” to confirm", behaviour: "typed", tradeoff: "Forces attention to the count, not to what changes.", consequence: "The merchant proves they read the number, not the exceptions." },
        { id: "review", label: "Staged review: check the list, exclude items, then Apply", behaviour: "review", tradeoff: "Takes a few minutes; makes the review the commitment.", consequence: "The merchant commits after looking at what will change." },
        { id: "auto", label: "Apply automatically overnight", behaviour: "auto", tradeoff: "No effort; no point of control.", consequence: "Prices change while nobody is watching." },
      ],
    },
    {
      id: "recovery",
      dimension: "recovery",
      prompt: "What recovery is available afterwards?",
      options: [
        { id: "none", label: "None", behaviour: "none", tradeoff: "Simplest.", consequence: "Wrong prices must be fixed one product at a time." },
        { id: "undo", label: "10-second undo toast", behaviour: "undo", tradeoff: "Catches slips only.", consequence: "Problems discovered next week cannot be undone." },
        { id: "rollback", label: "“Revert this batch” for 30 days, per product or all", behaviour: "rollback", tradeoff: "Needs batch history.", consequence: "A bad update can be reversed when it is discovered." },
      ],
    },
  ],
  rules: [
    {
      criterionId: "com-proportionate",
      passWhen: [[{ decision: "commitment", oneOf: ["review", "typed"] }]],
      evidenceFrom: ["commitment"],
      pass: "Committing 1,240 live price changes requires deliberate effort.",
      fail: "A broad, live change is committed with the same effort as a single edit, or with none.",
    },
    {
      criterionId: "com-consequence",
      passWhen: [
        [{ decision: "scope", oneOf: ["diff"] }],
        [
          { decision: "scope", oneOf: ["sample"] },
          { decision: "commitment", oneOf: ["review"] },
        ],
      ],
      evidenceFrom: ["scope", "commitment"],
      pass: "The merchant sees what changes, including the exceptions, before committing.",
      fail: "The confirmation shows a number, not the consequences. The contract and promotion items stay hidden.",
    },
    {
      criterionId: "cor-recovery",
      passWhen: [[{ decision: "recovery", oneOf: ["rollback"] }]],
      evidenceFrom: ["recovery"],
      pass: "Recovery remains available when problems are typically discovered.",
      fail: "Price problems surface days later; a 10-second undo or no recovery does not cover that.",
    },
  ],
};
