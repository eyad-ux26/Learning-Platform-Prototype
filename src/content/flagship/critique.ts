import type { CritiqueActivity, CritiqueReason } from "@/domain/types";
import { FLAGSHIP_ID } from "./skills";

export const trustReasons: CritiqueReason[] = [
  { id: "unmarked-ai", label: "Generated content isn’t distinguishable from confirmed information", appliesTo: "problematic" },
  { id: "false-precision", label: "Shows precision the system can’t support", appliesTo: "problematic" },
  { id: "overstated", label: "States an inference as established fact", appliesTo: "problematic" },
  { id: "no-source", label: "A claim has no source the user can inspect", appliesTo: "problematic" },
  { id: "generic-explanation", label: "Explanation doesn’t relate to this specific output", appliesTo: "problematic" },
  { id: "hard-to-correct", label: "Correcting it takes disproportionate effort", appliesTo: "problematic" },
  { id: "no-recovery", label: "No adequate way to recover after the change", appliesTo: "problematic" },
  { id: "friction-mismatch", label: "Commitment step doesn’t match the impact", appliesTo: "problematic" },
  { id: "vague-confirmation", label: "Confirmation doesn’t state what will happen", appliesTo: "problematic" },
  { id: "clear-ai-origin", label: "Clearly marks what was generated", appliesTo: "acceptable" },
  { id: "actionable-uncertainty", label: "Uncertainty is specific enough to act on", appliesTo: "acceptable" },
  { id: "inspectable-source", label: "Source can be checked at the point of decision", appliesTo: "acceptable" },
  { id: "specific-explanation", label: "Explanation refers to this specific output", appliesTo: "acceptable" },
  { id: "easy-correction", label: "Easy to correct in place", appliesTo: "acceptable" },
  { id: "recovery-available", label: "Recovery is available and proportionate", appliesTo: "acceptable" },
  { id: "proportionate-commitment", label: "Commitment matches the impact", appliesTo: "acceptable" },
  { id: "specific-consequence", label: "States specifically what will change", appliesTo: "acceptable" },
];

export const critiqueRecap: CritiqueActivity = {
  id: "critique-recap",
  pathId: FLAGSHIP_ID,
  template: "critique",
  title: "Review an AI meeting recap",
  contextLabel: "AI-generated meeting recap",
  contextKey: "meeting-recap",
  kind: "baseline",
  estimatedMinutes: 10,
  scenario:
    "Notewise records meetings and generates a recap that teams share afterwards. A product lead is about to send this recap of Thursday’s sync to 14 people. In the recording, at 31:05, the team said they “should consider dropping the Android beta”; no decision was made.",
  task: "Review each highlighted element of the recap. Mark it acceptable or problematic and choose the reason that best explains your judgement.",
  constraints: ["Recipients usually read the recap instead of the recording.", "Action items are copied to the team board automatically."],
  criteria: ["unc-distinguish", "unc-actionable", "evi-source", "evi-specific"],
  relatedConcepts: ["communicating-uncertainty", "evidence-explanations"],
  hints: ["Not every element is a problem. A strong review also recognises what works and why.", "For each claim, ask: could a recipient check this in under a minute?"],
  solution:
    "Problematic: the unmarked tasks on the board, the 94% accuracy meter, the unsourced ‘agreed to drop’ decision and the generic ‘advanced AI’ explanation. Acceptable: the recap label, the unidentified-speaker note, the timestamped action item and the specific coverage note.",
  screen: {
    app: "Notewise",
    title: "Weekly product sync · Thu 5 Mar 2026",
    blocks: [
      { type: "appbar", app: "Notewise", title: "Weekly product sync · Thu 5 Mar 2026" },
      {
        type: "group",
        hotspot: "h-label",
        blocks: [
          { type: "badge", tone: "ai", text: "Generated recap · review before sharing" },
          { type: "text", muted: true, text: "Created from the meeting recording (42 min)." },
        ],
      },
      { type: "meter", label: "Recap accuracy", value: 94, hotspot: "h-confidence" },
      { type: "banner", tone: "info", hotspot: "h-speakers", text: "2 speakers weren’t identified. Their points are attributed to “Speaker 3” and “Speaker 4”. Assign names." },
      { type: "heading", text: "Decisions" },
      { type: "list", items: [{ primary: "Team agreed to drop the Android beta", secondary: "No timestamp", hotspot: "h-decision" }] },
      { type: "heading", text: "Action items" },
      { type: "list", items: [{ primary: "Priya will send the revised budget by Fri 6 Mar", secondary: "▶ 14:32 in recording", hotspot: "h-action" }] },
      {
        type: "group",
        hotspot: "h-board",
        blocks: [
          { type: "text", text: "3 action items were added to the Team board." },
          { type: "list", items: [{ primary: "Send revised budget", secondary: "Assigned to Priya · Due Fri 6 Mar" }, { primary: "Prepare beta shutdown notice", secondary: "Assigned to Marco · Due Mon 9 Mar" }] },
        ],
      },
      {
        type: "group",
        hotspot: "h-why",
        blocks: [
          { type: "link", text: "Why these points?" },
          { type: "text", muted: true, text: "Our advanced AI identifies what matters most in every meeting." },
        ],
      },
      { type: "text", muted: true, hotspot: "h-coverage", text: "Covers discussion from 03:10 to 38:40. Left out: small talk and a 6-minute screen share without audio." },
    ],
  },
  reasons: trustReasons,
  hotspots: [
    { id: "h-label", label: "Recap label", verdict: "acceptable", correctReasons: ["clear-ai-origin"], criterionId: "unc-distinguish", explanation: "It marks the recap as generated and asks for review before sharing, where the sender will see it.", improvement: "Keep the label on the shared copy as well, not only in the editor." },
    { id: "h-board", label: "Action items on the Team board", verdict: "problematic", correctReasons: ["unmarked-ai"], criterionId: "unc-distinguish", explanation: "Tasks created from the recap appear on the board as normal assigned tasks. Nobody can tell they were inferred, including one based on a decision that was never made.", improvement: "Add recap tasks as suggestions that the assignee or meeting owner confirms, marked with their source." },
    { id: "h-confidence", label: "“Recap accuracy 94%” meter", verdict: "problematic", correctReasons: ["false-precision"], criterionId: "unc-actionable", explanation: "A single accuracy figure implies a measured, calibrated quality that the product cannot support, and it doesn’t say which part to check.", improvement: "Remove the score and flag specific weak points instead, such as unidentified speakers or claims without timestamps." },
    { id: "h-speakers", label: "Unidentified speakers note", verdict: "acceptable", correctReasons: ["actionable-uncertainty"], criterionId: "unc-actionable", explanation: "It names a concrete limitation and offers the action that resolves it.", improvement: "Link each ‘Speaker 3’ point so the owner can assign names in place." },
    { id: "h-decision", label: "“Team agreed to drop the Android beta”", verdict: "problematic", correctReasons: ["no-source", "overstated"], criterionId: "evi-source", explanation: "The recording says the team should consider it. The recap states a decision and gives no timestamp, so recipients can’t check it.", improvement: "Link every decision to its moment in the recording, and phrase inferences as ‘Discussed’ unless a decision was explicit." },
    { id: "h-action", label: "Timestamped action item", verdict: "acceptable", correctReasons: ["inspectable-source"], criterionId: "evi-source", explanation: "The ▶ 14:32 link lets anyone jump to the moment and check the commitment.", improvement: "Show a one-line transcript excerpt on hover for quicker checks." },
    { id: "h-why", label: "“Why these points?” explanation", verdict: "problematic", correctReasons: ["generic-explanation"], criterionId: "evi-specific", explanation: "It describes the product in general and says nothing about how this recap was put together.", improvement: "Explain what this recap covered and left out, as the coverage note does." },
    { id: "h-coverage", label: "Coverage note", verdict: "acceptable", correctReasons: ["specific-explanation"], criterionId: "evi-specific", explanation: "It tells readers exactly which part of the meeting the recap is based on and what was left out.", improvement: "Move it next to the ‘Why these points?’ link and remove the generic text." },
  ],
};

export const critiqueArchive: CritiqueActivity = {
  id: "critique-archive",
  pathId: FLAGSHIP_ID,
  template: "critique",
  title: "Review a bulk archive confirmation",
  contextLabel: "AI-proposed contact cleanup",
  contextKey: "crm-cleanup",
  kind: "baseline",
  estimatedMinutes: 9,
  scenario:
    "Pipeline CRM has an assistant that finds inactive contacts. It proposes archiving 1,832 of them. Archiving removes contacts from email sequences and reports. The sales operations manager is reviewing the confirmation before release.",
  task: "Review each highlighted element of the confirmation. Mark it acceptable or problematic and choose the reason.",
  constraints: ["Some contacts belong to open deals.", "Sales teams often discover missing contacts weeks later, at renewal time."],
  criteria: ["com-proportionate", "com-consequence", "cor-recovery"],
  relatedConcepts: ["confirmation-commitment", "correction-recovery"],
  hints: ["Consider how late a mistake would be discovered.", "A confirmation can be specific in one line and vague in another."],
  solution:
    "Problematic: the ‘don’t ask again’ option, the bare ‘Yes’ button and the ‘cannot be restored’ policy. Acceptable: the review-before-archive note, the criteria description, the open-deals warning and the undo toast.",
  screen: {
    app: "Pipeline CRM",
    title: "Contacts",
    blocks: [
      { type: "appbar", app: "Pipeline CRM", title: "Contacts · All (24,906)" },
      { type: "banner", tone: "ai", text: "Assistant found 1,832 contacts with no activity in 18 months." },
      {
        type: "dialog",
        title: "Archive 1,832 contacts?",
        blocks: [
          { type: "text", hotspot: "h-scope", text: "Selected because they have had no email opens, meetings or deals in 18 months." },
          { type: "banner", tone: "warn", hotspot: "h-deals", text: "46 of these contacts are linked to open deals. Review 46" },
          { type: "text", hotspot: "h-review", text: "You’ll see the full list and can exclude contacts before anything is archived." },
          { type: "text", hotspot: "h-permanent", text: "Archived contacts are removed from sequences and reports and cannot be restored." },
          { type: "checkbox", hotspot: "h-dontask", checked: false, label: "Apply future assistant cleanups automatically without asking" },
          { type: "buttons", hotspot: "h-yes", buttons: [{ label: "Cancel", variant: "ghost" }, { label: "Yes", variant: "primary" }] },
        ],
      },
      { type: "toast", hotspot: "h-toast", text: "Archiving 1,832 contacts… You can undo for 10 seconds.", action: "Undo" },
    ],
  },
  reasons: trustReasons,
  hotspots: [
    { id: "h-scope", label: "Selection criteria", verdict: "acceptable", correctReasons: ["specific-consequence", "specific-explanation"], criterionId: "com-consequence", explanation: "It says exactly which contacts are included and why.", improvement: "Add how many contacts were excluded by the same rule, for comparison." },
    { id: "h-deals", label: "Open deals warning", verdict: "acceptable", correctReasons: ["specific-consequence"], criterionId: "com-consequence", explanation: "It surfaces the highest-risk subset and offers a way to review it before committing.", improvement: "Exclude the 46 by default and let the manager include them deliberately." },
    { id: "h-yes", label: "“Yes” button", verdict: "problematic", correctReasons: ["vague-confirmation"], criterionId: "com-consequence", explanation: "The commit button doesn’t name the action or the scope, so it is easy to confirm without reading.", improvement: "Label the button with the action and count, for example “Archive 1,786 contacts”." },
    { id: "h-review", label: "Review-before-archive note", verdict: "acceptable", correctReasons: ["proportionate-commitment"], criterionId: "com-proportionate", explanation: "A broad, slow-to-discover change gets a real review step rather than a single click.", improvement: "Let the manager save the review and finish it later." },
    { id: "h-dontask", label: "“Apply future cleanups automatically” option", verdict: "problematic", correctReasons: ["friction-mismatch"], criterionId: "com-proportionate", explanation: "It lets a single click remove every future review of a broad, hard-to-reverse change.", improvement: "Offer automatic cleanup only for narrow, reversible cases, configured separately in settings with a clear scope." },
    { id: "h-permanent", label: "“Cannot be restored” policy", verdict: "problematic", correctReasons: ["no-recovery"], criterionId: "cor-recovery", explanation: "Mistakes in a 1,832-contact archive are often discovered weeks later. A 10-second undo doesn’t cover that.", improvement: "Keep archived contacts restorable, individually or in bulk, for a defined period." },
    { id: "h-toast", label: "Undo toast", verdict: "acceptable", correctReasons: ["recovery-available"], criterionId: "cor-recovery", explanation: "It catches immediate slips without interrupting the flow.", improvement: "Pair it with longer-term restore so the toast is not the only safety net." },
  ],
};

export const critiqueExpenses: CritiqueActivity = {
  id: "critique-expenses",
  pathId: FLAGSHIP_ID,
  template: "critique",
  title: "Review automatic expense categories",
  contextLabel: "AI-categorised card transactions",
  contextKey: "expense-categorisation",
  kind: "baseline",
  estimatedMinutes: 8,
  scenario:
    "Ledgerly categorises company card transactions so finance can export them to the accountant at month end. Every category on this screen was proposed by the assistant; none were set by a person.",
  task: "Review each highlighted element. Mark it acceptable or problematic and choose the reason.",
  constraints: ["Finance reviews about 400 transactions a month.", "Exports go to an external accountant."],
  criteria: ["unc-distinguish", "cor-inplace", "evi-source"],
  relatedConcepts: ["communicating-uncertainty", "correction-recovery", "evidence-explanations"],
  hints: ["Compare the Uber row with the rows around it."],
  solution:
    "Problematic: the Uber row with no suggestion marker, the ‘create a rule in Settings’ correction path and the ‘Matched to receipt’ claim with no receipt. Acceptable: the Amazon note about a possibly personal item, the Adobe row with Accept/Change, and the ‘Why Software?’ explanation.",
  screen: {
    app: "Ledgerly",
    title: "Card transactions · March",
    blocks: [
      { type: "appbar", app: "Ledgerly", title: "Card transactions · March 2026" },
      {
        type: "list",
        items: [
          { primary: "Uber · $24.10", secondary: "Travel", meta: "3 Mar", hotspot: "h-uber" },
          { primary: "Adobe Creative Cloud · $59.99", secondary: "Software · Suggested · Accept | Change", meta: "4 Mar", tone: "ai", hotspot: "h-adobe" },
          { primary: "Amazon · $312.48", secondary: "Office supplies · Suggested · 1 of 3 items may be personal (“Garden hose”)", meta: "5 Mar", tone: "ai", hotspot: "h-amazon" },
          { primary: "Hotel Lisboa Centro · $486.00", secondary: "Travel · Suggested · “Matched to receipt” · No receipt attached", meta: "6 Mar", tone: "ai", hotspot: "h-receipt" },
        ],
      },
      {
        type: "group",
        hotspot: "h-why",
        blocks: [
          { type: "link", text: "Why ‘Software’?" },
          { type: "text", muted: true, text: "Matched to 11 earlier Adobe charges you categorised as Software." },
        ],
      },
      { type: "text", muted: true, hotspot: "h-change", text: "To change a category, create a rule in Settings → Categorisation rules." },
      { type: "buttons", buttons: [{ label: "Export to accountant", variant: "primary" }] },
    ],
  },
  reasons: trustReasons,
  hotspots: [
    { id: "h-uber", label: "Uber row", verdict: "problematic", correctReasons: ["unmarked-ai"], criterionId: "unc-distinguish", explanation: "Its category was also proposed by the assistant but shows no ‘Suggested’ marker, so it reads as confirmed.", improvement: "Mark every proposed category the same way until a person accepts it." },
    { id: "h-amazon", label: "Amazon row note", verdict: "acceptable", correctReasons: ["actionable-uncertainty", "clear-ai-origin"], criterionId: "unc-distinguish", explanation: "It marks the category as suggested and names the specific item that may not belong.", improvement: "Offer to split the transaction from the note." },
    { id: "h-adobe", label: "Adobe row with Accept | Change", verdict: "acceptable", correctReasons: ["easy-correction"], criterionId: "cor-inplace", explanation: "The category can be accepted or changed right in the row.", improvement: "Support keyboard shortcuts for reviewing many rows quickly." },
    { id: "h-change", label: "“Create a rule in Settings” to change", verdict: "problematic", correctReasons: ["hard-to-correct"], criterionId: "cor-inplace", explanation: "Fixing one transaction requires leaving the list and writing a general rule.", improvement: "Let people change the category in the row, then offer to create a rule as an optional follow-up." },
    { id: "h-why", label: "“Why ‘Software’?” explanation", verdict: "acceptable", correctReasons: ["inspectable-source", "specific-explanation"], criterionId: "evi-source", explanation: "It points to the specific earlier transactions the suggestion is based on.", improvement: "Make the 11 earlier charges a link to the filtered list." },
    { id: "h-receipt", label: "“Matched to receipt” claim", verdict: "problematic", correctReasons: ["no-source", "overstated"], criterionId: "evi-source", explanation: "It claims evidence that the user cannot see; there is no receipt attached.", improvement: "Only claim a receipt match when the receipt is attached and can be opened from the row." },
  ],
};

export const critiqueInsight: CritiqueActivity = {
  id: "critique-insight",
  pathId: FLAGSHIP_ID,
  template: "critique",
  title: "Review an AI analytics insight",
  contextLabel: "AI-generated analytics insight",
  contextKey: "analytics-insight",
  kind: "alternative",
  alternativeFor: "critique-recap",
  estimatedMinutes: 8,
  scenario:
    "Metricly generates written insights from product analytics. This one is about to be pinned to the growth team’s dashboard, where the team will use it to decide whether to roll back the new payment page.",
  task: "Review each highlighted element. Mark it acceptable or problematic and choose the reason.",
  constraints: ["Two changes shipped in the same week.", "The team can roll back the payment page in a day."],
  criteria: ["unc-actionable", "evi-source", "evi-specific"],
  relatedConcepts: ["evidence-explanations", "communicating-uncertainty"],
  hints: ["Does the headline say more than the data supports?"],
  solution:
    "Problematic: the causal headline, the unsourced segment breakdown and the ‘powered by advanced AI’ badge. Acceptable: the note about two changes shipping, the basis with ‘Open query’, and the specific ‘Why this insight?’ text.",
  screen: {
    app: "Metricly",
    title: "Insights · Checkout",
    blocks: [
      { type: "appbar", app: "Metricly", title: "Insights · Checkout" },
      { type: "heading", hotspot: "h-headline", text: "Checkout conversion dropped 12% because of the new payment page" },
      { type: "text", hotspot: "h-possible", text: "Two changes shipped in this window: the payment page (3 Mar) and a pricing banner (4 Mar). Traffic also shifted toward mobile." },
      {
        type: "group",
        hotspot: "h-basis",
        blocks: [
          { type: "text", muted: true, text: "Based on 14,210 sessions · 2–8 Mar vs 23 Feb–1 Mar" },
          { type: "link", text: "Open query" },
        ],
      },
      { type: "list", hotspot: "h-segment", items: [{ primary: "Mobile −18% · Desktop −4%", secondary: "Source: AI analysis" }] },
      {
        type: "group",
        hotspot: "h-why",
        blocks: [
          { type: "link", text: "Why this insight?" },
          { type: "text", muted: true, text: "The drop began on the day the payment page shipped and is concentrated on the step it changed." },
        ],
      },
      { type: "badge", tone: "ai", hotspot: "h-badge", text: "✦ Powered by advanced AI models" },
    ],
  },
  reasons: trustReasons,
  hotspots: [
    { id: "h-headline", label: "Causal headline", verdict: "problematic", correctReasons: ["overstated"], criterionId: "unc-actionable", explanation: "It states a cause as fact while two changes shipped in the same window.", improvement: "Lead with the observed change and the most likely cause, for example “Conversion fell 12%; timing points to the new payment page”." },
    { id: "h-possible", label: "Two-changes note", verdict: "acceptable", correctReasons: ["actionable-uncertainty"], criterionId: "unc-actionable", explanation: "It names the competing explanations the team needs to rule out.", improvement: "Move it directly under the headline." },
    { id: "h-basis", label: "Basis with “Open query”", verdict: "acceptable", correctReasons: ["inspectable-source"], criterionId: "evi-source", explanation: "The period, sample and query are all one click away.", improvement: "Include the comparison period in the headline chart." },
    { id: "h-segment", label: "Segment breakdown", verdict: "problematic", correctReasons: ["no-source"], criterionId: "evi-source", explanation: "‘Source: AI analysis’ is not a source. The team cannot check the segment numbers.", improvement: "Link the breakdown to its query, like the main figure." },
    { id: "h-why", label: "“Why this insight?” text", verdict: "acceptable", correctReasons: ["specific-explanation"], criterionId: "evi-specific", explanation: "It explains the reasoning for this particular insight in one line.", improvement: "Add what would weaken the explanation, such as the pricing banner." },
    { id: "h-badge", label: "“Powered by advanced AI” badge", verdict: "problematic", correctReasons: ["generic-explanation"], criterionId: "evi-specific", explanation: "It promotes the product rather than explaining this insight.", improvement: "Replace it with a plain ‘Generated insight’ label linked to how insights are produced." },
  ],
};
