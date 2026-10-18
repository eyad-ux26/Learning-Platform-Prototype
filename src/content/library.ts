/**
 * The four additional library entries. They are PREVIEW paths: metadata,
 * an overview and one free sample activity each. They are not fully playable
 * in this prototype, and the UI says so.
 */
import { CONTENT_FORMAT_VERSION, type CritiqueActivity, type CritiqueReason, type DecisionActivity, type PathBundle } from "@/domain/types";

const usabilityReasons: CritiqueReason[] = [
  { id: "vague-error", label: "Error doesn’t say what went wrong or how to fix it", appliesTo: "problematic" },
  { id: "late-feedback", label: "Feedback arrives too late to be useful", appliesTo: "problematic" },
  { id: "lost-input", label: "Discards what the user already entered", appliesTo: "problematic" },
  { id: "hidden-requirement", label: "A requirement is hidden until it fails", appliesTo: "problematic" },
  { id: "clear-guidance", label: "Explains the problem and how to fix it", appliesTo: "acceptable" },
  { id: "timely-feedback", label: "Feedback appears at the right moment", appliesTo: "acceptable" },
  { id: "visible-requirement", label: "Requirement is visible before input", appliesTo: "acceptable" },
];

const ufSample: CritiqueActivity = {
  id: "uf-checkout-errors",
  pathId: "usability-foundations",
  template: "critique",
  title: "Review checkout error handling",
  contextLabel: "E-commerce checkout form",
  contextKey: "checkout-form",
  kind: "baseline",
  estimatedMinutes: 6,
  scenario: "A shopper submitted the checkout form for a garden furniture store. The page reloaded with these messages.",
  task: "Review each highlighted element and decide whether it helps the shopper recover.",
  constraints: ["Most shoppers are on mobile.", "The card form is provided by the payment processor."],
  criteria: ["uf-errors"],
  relatedConcepts: [],
  hints: ["Would the shopper know what to type next?"],
  solution: "Problematic: the generic top error, the cleared card fields and the password rule revealed only after failure. Acceptable: the inline postcode message and the visible phone format.",
  screen: {
    app: "Terrace & Co",
    title: "Checkout",
    blocks: [
      { type: "appbar", app: "Terrace & Co", title: "Checkout · Step 2 of 3" },
      { type: "banner", tone: "danger", hotspot: "u-top", text: "There was a problem with your submission." },
      { type: "field", label: "Postcode", value: "SW1A 1A", note: "Postcodes have 5–7 characters, e.g. SW1A 1AA", hotspot: "u-postcode" },
      { type: "field", label: "Phone", value: "", note: "Format: 07700 900123", hotspot: "u-phone" },
      { type: "field", label: "Card number", value: "", note: "Please re-enter your card details", hotspot: "u-card" },
      { type: "field", label: "Create password (optional)", value: "", note: "Password must contain a symbol", hotspot: "u-password" },
    ],
  },
  reasons: usabilityReasons,
  hotspots: [
    { id: "u-top", label: "Top error banner", verdict: "problematic", correctReasons: ["vague-error"], criterionId: "uf-errors", explanation: "It says something is wrong but not what or where.", improvement: "List each problem with a link to the field." },
    { id: "u-postcode", label: "Postcode message", verdict: "acceptable", correctReasons: ["clear-guidance"], criterionId: "uf-errors", explanation: "It explains the rule with an example next to the field.", improvement: "Validate as the shopper leaves the field, not after submitting." },
    { id: "u-phone", label: "Phone format hint", verdict: "acceptable", correctReasons: ["visible-requirement"], criterionId: "uf-errors", explanation: "The expected format is visible before typing.", improvement: "Accept common formats and normalise them." },
    { id: "u-card", label: "Cleared card fields", verdict: "problematic", correctReasons: ["lost-input"], criterionId: "uf-errors", explanation: "An unrelated error wiped details the shopper had already entered.", improvement: "Keep valid input when other fields fail." },
    { id: "u-password", label: "Password rule", verdict: "problematic", correctReasons: ["hidden-requirement"], criterionId: "uf-errors", explanation: "The rule appears only after it was broken.", improvement: "Show password rules before and during typing." },
  ],
};

const iddSample: DecisionActivity = {
  id: "idd-delete-files",
  pathId: "interaction-design-decisions",
  template: "decision",
  title: "Deleting files in a shared drive",
  contextLabel: "Shared file manager",
  contextKey: "file-delete",
  kind: "baseline",
  estimatedMinutes: 6,
  scenario: "You design Cabinet, a shared drive for small agencies. Users can select many files and delete them. Deleted files in shared folders disappear for everyone.",
  task: "Decide how deletion works for a single private file and for many shared files.",
  constraints: ["Storage costs mean deleted files can’t be kept for ever.", "Most deletions are intentional."],
  criteria: ["idd-destructive"],
  relatedConcepts: [],
  hints: ["Are the two situations equally risky?"],
  solution: "Delete a private file immediately with Undo and a trash folder. For shared bulk deletes, name the count and the people affected in the confirmation, and keep files in trash for 30 days.",
  start: "d1",
  nodes: [
    {
      id: "d1",
      title: "One private file",
      situation: "A user deletes a single file in their private folder.",
      prompt: "What happens?",
      choices: [
        { id: "undo", label: "Delete immediately, with Undo and a 30-day trash", detail: "Fast.", consequence: "Users delete freely and rarely need the trash.", signals: [{ criterionId: "idd-destructive", met: true, because: "A recoverable, private action needs no confirmation." }], next: "d2" },
        { id: "confirm", label: "Ask “Delete this file?” first", detail: "Careful.", consequence: "Users click through the dialog every time.", signals: [{ criterionId: "idd-destructive", met: false, because: "A dialog on a recoverable, private action adds friction without protecting anyone." }], next: "d2" },
      ],
    },
    {
      id: "d2",
      title: "Many shared files",
      situation: "A user selects 48 files in a shared client folder used by 6 colleagues.",
      prompt: "What happens?",
      choices: [
        { id: "same", label: "Same as above: delete with Undo", detail: "Consistent.", consequence: "Colleagues find files missing and don’t know who removed them.", signals: [{ criterionId: "idd-destructive", met: false, because: "Shared, bulk deletion affects other people who weren’t present for the Undo." }] },
        { id: "specific", label: "Confirm “Delete 48 files for 6 people?”; notify the folder and keep 30-day trash", detail: "One extra step.", consequence: "The user pauses, removes 3 files from the selection and confirms.", signals: [{ criterionId: "idd-destructive", met: true, because: "The confirmation states the scope and who is affected; recovery stays available." }] },
      ],
    },
  ],
  debrief: { impact: "Private versus shared changes who is affected.", reversibility: "Trash makes both recoverable, but others need to know.", uncertainty: "None here: the action is explicit. The question is impact." },
};

const rsReasons: CritiqueReason[] = [
  { id: "interpretation-as-observation", label: "Presents an interpretation as an observation", appliesTo: "problematic" },
  { id: "overgeneralised", label: "Generalises beyond the evidence", appliesTo: "problematic" },
  { id: "untraceable", label: "Can’t be traced to source notes", appliesTo: "problematic" },
  { id: "grounded", label: "Grounded in traceable evidence", appliesTo: "acceptable" },
  { id: "honest-scope", label: "States its scope and limits", appliesTo: "acceptable" },
];

const rsSample: CritiqueActivity = {
  id: "rs-synthesis-board",
  pathId: "research-synthesis",
  template: "critique",
  title: "Review a synthesis summary",
  contextLabel: "Interview synthesis board",
  contextKey: "synthesis-board",
  kind: "baseline",
  estimatedMinutes: 6,
  scenario: "A researcher summarised 6 interviews with independent bookkeepers about month-end close.",
  task: "Review each highlighted statement and decide whether it is well supported.",
  constraints: ["6 participants, all in the UK.", "Interviews lasted 45 minutes each."],
  criteria: ["rs-evidence"],
  relatedConcepts: [],
  hints: ["Could you point to the interview notes behind each statement?"],
  solution: "Problematic: ‘Bookkeepers hate their tools’, ‘All small firms…’ and the unsourced quote. Acceptable: the counted observation and the scope note.",
  screen: {
    app: "Synthesis board",
    title: "Month-end close · findings",
    blocks: [
      { type: "appbar", app: "Synthesis board", title: "Month-end close · 6 interviews" },
      { type: "list", items: [
        { primary: "4 of 6 participants re-keyed bank data into spreadsheets before reconciling", secondary: "P1, P2, P4, P6", hotspot: "r-count" },
        { primary: "Bookkeepers hate their accounting tools", secondary: "Theme", hotspot: "r-hate" },
        { primary: "All small firms close their books late", secondary: "Theme", hotspot: "r-all" },
        { primary: "“I don’t trust the bank feed”", secondary: "Quote · participant not recorded", hotspot: "r-quote" },
      ] },
      { type: "text", muted: true, hotspot: "r-scope", text: "Scope: 6 UK sole-practitioner bookkeepers; firms with in-house finance teams were not included." },
    ],
  },
  reasons: rsReasons,
  hotspots: [
    { id: "r-count", label: "Re-keying observation", verdict: "acceptable", correctReasons: ["grounded"], criterionId: "rs-evidence", explanation: "Counted and linked to participants.", improvement: "Link each participant to the note." },
    { id: "r-hate", label: "“Hate their tools”", verdict: "problematic", correctReasons: ["interpretation-as-observation"], criterionId: "rs-evidence", explanation: "An emotional interpretation stated as a finding.", improvement: "Describe the behaviour and frustration observed, with counts." },
    { id: "r-all", label: "“All small firms”", verdict: "problematic", correctReasons: ["overgeneralised"], criterionId: "rs-evidence", explanation: "6 participants can’t support a claim about all firms.", improvement: "Limit the claim to the participants studied." },
    { id: "r-quote", label: "Unattributed quote", verdict: "problematic", correctReasons: ["untraceable"], criterionId: "rs-evidence", explanation: "Without a participant, the quote can’t be checked or weighed.", improvement: "Record the participant and context for every quote." },
    { id: "r-scope", label: "Scope note", verdict: "acceptable", correctReasons: ["honest-scope"], criterionId: "rs-evidence", explanation: "It tells readers who the findings do and don’t cover.", improvement: "Place it at the top of the board." },
  ],
};

const iaSample: DecisionActivity = {
  id: "ia-settings-labels",
  pathId: "information-architecture",
  template: "decision",
  title: "Organising a growing settings area",
  contextLabel: "SaaS settings navigation",
  contextKey: "settings-nav",
  kind: "baseline",
  estimatedMinutes: 6,
  scenario: "Rota, a staff scheduling product, has grown from 8 to 41 settings pages. Support tickets show admins can’t find shift rules.",
  task: "Decide how to label and structure the settings navigation.",
  constraints: ["Admins visit settings a few times a month.", "Card sorting with 12 admins grouped ‘shift rules’ with ‘breaks’ and ‘overtime’."],
  criteria: ["ia-labels"],
  relatedConcepts: [],
  hints: ["Whose words should the labels use?"],
  solution: "Group by the tasks admins described in card sorting, label with their words, and add search across settings.",
  start: "i1",
  nodes: [
    {
      id: "i1",
      title: "Grouping",
      situation: "Engineering suggests grouping settings by the service that stores them.",
      prompt: "How should settings be grouped?",
      choices: [
        { id: "system", label: "By backend service: Scheduler, Payroll Engine, Notifications", detail: "Matches the code.", consequence: "Admins still look for ‘Overtime’ under ‘Pay’ and don’t find it.", signals: [{ criterionId: "ia-labels", met: false, because: "System structure isn’t how admins think about their tasks." }], next: "i2" },
        { id: "tasks", label: "By admin task, following the card sort: Shifts & breaks, Pay & overtime, People", detail: "Matches research.", consequence: "Shift rules sit where 10 of 12 admins expected them.", signals: [{ criterionId: "ia-labels", met: true, because: "Groups reflect the users’ own mental model from the card sort." }], next: "i2" },
      ],
    },
    {
      id: "i2",
      title: "Finding one setting",
      situation: "Even with good groups, admins visit rarely and forget where things are.",
      prompt: "What else do you add?",
      choices: [
        { id: "search", label: "Search across settings, matching synonyms like ‘OT’ and ‘overtime’", detail: "Small build.", consequence: "Shift-rule tickets drop as admins search instead.", signals: [{ criterionId: "ia-labels", met: true, because: "Search with user vocabulary supports infrequent visits." }] },
        { id: "tour", label: "A product tour of all 41 pages", detail: "One-time.", consequence: "Admins skip the tour and forget it by next month.", signals: [{ criterionId: "ia-labels", met: false, because: "A tour doesn’t help someone who visits rarely and needs one setting." }] },
      ],
    },
  ],
  debrief: { impact: "Settings are infrequent but critical tasks.", reversibility: "Navigation can change, but every change costs relearning.", uncertainty: "Card sorting showed the grouping; validate it with tree testing." },
};

const preview = (meta: Omit<PathBundle["meta"], "availability">, skills: PathBundle["skills"], activities: PathBundle["activities"]): PathBundle => ({
  formatVersion: CONTENT_FORMAT_VERSION,
  meta: { ...meta, availability: "preview" },
  skills,
  requiredSkillIds: skills.map((s) => s.id),
  explore: [],
  activities,
});

export const libraryBundles: PathBundle[] = [
  preview(
    {
      id: "usability-foundations",
      title: "Usability Foundations",
      summary: "Spot and fix the problems that make everyday flows hard: unclear feedback, hidden requirements and lost work.",
      topic: "Foundations",
      level: "Introductory",
      estimatedHours: 6,
      icon: "eye",
      cover: "grid",
      outcomes: ["Apply usability heuristics to real screens.", "Write error and status messages that help people recover.", "Find and prioritise friction in common flows."],
      audience: "Designers early in their career, and developers or PMs who review interfaces.",
      prerequisites: "None.",
      freeSampleActivityIds: ["uf-checkout-errors"],
      plannedModules: ["Heuristics on real screens", "Errors and recovery", "Forms that respect input", "Prioritising usability issues"],
    },
    [
      { id: "uf-heuristics", name: "Apply heuristics to real screens", description: "Recognise common usability problems in context.", criteria: [] },
      { id: "uf-messages", name: "Write clear error and status messages", description: "Help people understand and recover.", criteria: [{ id: "uf-errors", skillId: "uf-messages", statement: "Identifies error handling that blocks recovery.", lookFor: "Vague errors, lost input, hidden requirements." }] },
      { id: "uf-friction", name: "Find friction in common flows", description: "Notice where flows waste effort.", criteria: [] },
    ],
    [ufSample],
  ),
  preview(
    {
      id: "interaction-design-decisions",
      title: "Interaction Design Decisions",
      summary: "Choose controls, defaults and feedback with clear reasoning about context, frequency and risk.",
      topic: "Interaction",
      level: "Intermediate",
      estimatedHours: 7,
      icon: "pointer",
      cover: "steps",
      outcomes: ["Choose controls that fit the task and frequency.", "Design destructive actions with proportionate safeguards.", "Balance sensible defaults with user choice."],
      audience: "Product designers making day-to-day interaction decisions.",
      prerequisites: "Basic familiarity with interface components.",
      freeSampleActivityIds: ["idd-delete-files"],
      plannedModules: ["Choosing controls", "Destructive and undoable actions", "Defaults and choice", "Feedback and system status"],
    },
    [
      { id: "idd-controls", name: "Choose controls for the task", description: "Select components that fit frequency and context.", criteria: [] },
      { id: "idd-destructive-skill", name: "Design destructive and undoable actions", description: "Protect people from costly mistakes without slowing routine work.", criteria: [{ id: "idd-destructive", skillId: "idd-destructive-skill", statement: "Matches safeguards to who is affected and whether the action can be undone.", lookFor: "Undo for private, recoverable actions; specific confirmation for shared or bulk ones." }] },
      { id: "idd-defaults", name: "Balance defaults and choice", description: "Set defaults that help most people without trapping others.", criteria: [] },
    ],
    [iddSample],
  ),
  preview(
    {
      id: "research-synthesis",
      title: "Research Synthesis",
      summary: "Turn interview notes into findings people can trust: separate observation from interpretation and report confidence honestly.",
      topic: "Research",
      level: "Intermediate",
      estimatedHours: 5,
      icon: "compass",
      cover: "nodes",
      outcomes: ["Separate observations from interpretations.", "Group evidence into defensible themes.", "Report confidence, scope and gaps honestly."],
      audience: "Designers and researchers who run and synthesise interviews.",
      prerequisites: "Experience taking part in user interviews.",
      freeSampleActivityIds: ["rs-synthesis-board"],
      plannedModules: ["Observation versus interpretation", "Building themes", "Confidence and scope", "Presenting findings"],
    },
    [
      { id: "rs-separate", name: "Separate observations from interpretations", description: "Keep what was seen distinct from what it might mean.", criteria: [{ id: "rs-evidence", skillId: "rs-separate", statement: "Identifies findings that are not supported by traceable evidence.", lookFor: "Interpretations stated as fact, over-generalisation, untraceable quotes." }] },
      { id: "rs-themes", name: "Group evidence into defensible themes", description: "Build themes that hold up to questioning.", criteria: [] },
      { id: "rs-confidence", name: "Report confidence and gaps honestly", description: "Say what the research can and can’t support.", criteria: [] },
    ],
    [rsSample],
  ),
  preview(
    {
      id: "information-architecture",
      title: "Information Architecture",
      summary: "Structure content and navigation so people can find, understand and predict where things are, even as products grow.",
      topic: "Structure",
      level: "Intermediate",
      estimatedHours: 6,
      icon: "network",
      cover: "layers",
      outcomes: ["Model content types and their relationships.", "Write labels people recognise.", "Choose navigation patterns that scale."],
      audience: "Designers working on content-heavy or growing products.",
      prerequisites: "Familiarity with card sorting is helpful but not required.",
      freeSampleActivityIds: ["ia-settings-labels"],
      plannedModules: ["Content modelling", "Labelling", "Navigation patterns", "Testing structures"],
    },
    [
      { id: "ia-model", name: "Model content and relationships", description: "Describe what content exists and how it connects.", criteria: [] },
      { id: "ia-labelling", name: "Write labels users recognise", description: "Use the words people use for their tasks.", criteria: [{ id: "ia-labels", skillId: "ia-labelling", statement: "Structures and labels navigation around users’ tasks and vocabulary.", lookFor: "Grouping from research, user vocabulary, support for infrequent visits." }] },
      { id: "ia-navigation", name: "Choose navigation patterns for scale", description: "Pick patterns that keep working as content grows.", criteria: [] },
    ],
    [iaSample],
  ),
];
