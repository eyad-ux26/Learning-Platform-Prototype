import type { DecisionActivity, DecisionChoice, DecisionNode } from "@/domain/types";
import { FLAGSHIP_ID } from "./skills";

/**
 * Screen for the "A mistake surfaces" nodes. Blocks whose hotspot starts with "fx-" show a consequence of a choice
 * (a banner, a dialog, a list) and are only visible while a choice that touches them is highlighted.
 */
const historyScreen = (context: "normal" | "incident"): DecisionNode["screen"] => ({
  app: "Planwise",
  title: "Replan history",
  blocks: [
    { type: "appbar", app: "Planwise", title: context === "incident" ? "Replan history · 214 tasks" : "Replan history · applied 2 days ago · 214 tasks" },
    {
      type: "list",
      items: [
        { primary: "34 moved wrongly, not touched since", hotspot: "wrong" },
        { primary: "6 moved wrongly, edited by assignees since", hotspot: "edited" },
        { primary: "174 moved correctly", hotspot: "correct" },
      ],
    },
    { type: "toast", text: "Replan applied · undo expired", hotspot: "toast" },
    { type: "banner", tone: "warn", text: "Restoring 214 tasks. 6 later edits will be overwritten.", hotspot: "fx-revert-all" },
    { type: "banner", tone: "info", text: "Preview: 40 tasks restored, 6 later edits kept.", hotspot: "fx-revert-preview" },
  ],
});

const recoveryChoices = (context: "normal" | "incident"): DecisionChoice[] => [
  {
    id: "manual",
    label: "Ask the team lead to move the 40 tasks back by hand",
    detail: "No new feature work.",
    consequence:
      context === "incident"
        ? "The team spends an afternoon restoring dates while the client is still waiting for an answer."
        : "Two hours of manual edits, with a real chance of missing some tasks.",
    signals: [{ criterionId: "cor-recovery", met: false, because: "Manual repair puts the cost of the system’s mistake on the people it affected." }],
    affects: [
      { hotspot: "wrong", tag: "34 · back by hand" },
      { hotspot: "edited", tag: "6 · back by hand" },
    ],
    next: "n3",
  },
  {
    id: "toast",
    label: "Rely on the undo toast shown after applying",
    detail: "Already built.",
    consequence: "The toast disappeared two days ago; there is nothing to click.",
    signals: [{ criterionId: "cor-recovery", met: false, because: "A short undo can’t help with problems discovered days later, which is typical for plan changes." }],
    affects: [{ hotspot: "toast", tag: "Gone 2 days ago" }],
    next: "n3",
  },
  {
    id: "revert-all",
    label: "“Revert replan”: restore all 214 tasks to their previous dates",
    detail: "One action, all or nothing.",
    consequence: "The 40 wrong moves are fixed, but so are the 174 correct ones, and 6 tasks that assignees edited afterwards lose those edits.",
    signals: [{ criterionId: "cor-recovery", met: false, because: "All-or-nothing revert overwrites later work and undoes correct changes; recovery needs to match what actually went wrong." }],
    affects: [
      { hotspot: "wrong", tag: "34 restored" },
      { hotspot: "edited", tag: "6 edits lost" },
      { hotspot: "correct", tag: "174 reverted too" },
      { hotspot: "fx-revert-all", tag: "All 214 revert · 6 edits lost" },
    ],
    next: "n3",
  },
  {
    id: "revert-selected",
    label: "Revert by project or task, with a preview that keeps later edits",
    detail: "More to build; precise.",
    consequence:
      context === "incident"
        ? "The team restores the affected tasks in minutes. The client email still needs a personal reply: notifications cannot be recalled."
        : "The team lead restores exactly the 40 tasks; the 6 later edits are kept.",
    signals: [{ criterionId: "cor-recovery", met: true, because: "Selective revert with a preview matches recovery to what went wrong and protects work done since." }],
    affects: [
      { hotspot: "wrong", tag: "34 restored" },
      { hotspot: "edited", tag: "6 edits kept" },
      { hotspot: "fx-revert-preview", tag: "Preview · later edits kept" },
    ],
    next: "n3",
  },
];

export const scenarioReplan: DecisionActivity = {
  id: "scenario-replan",
  pathId: FLAGSHIP_ID,
  template: "decision",
  title: "Replanning 214 tasks after a slip",
  contextLabel: "AI-proposed bulk reschedule",
  contextKey: "bulk-replan",
  kind: "baseline",
  estimatedMinutes: 14,
  scenario:
    "You are the product designer for Planwise’s new “Replan” assistant. When a milestone slips, it proposes new dates for dependent tasks. A pilot customer’s “Beta ready” milestone just moved from 16 to 27 March 2026.",
  task: "Make the interaction decisions for this feature, starting with a small change and then the bulk replan. Each decision changes what happens next.",
  constraints: [
    "214 dependent tasks across 9 projects, with 31 assignees.",
    "12 tasks have dates that were shared with clients.",
    "Dates can be changed back; notifications and client expectations cannot.",
  ],
  criteria: ["com-proportionate", "com-consequence", "cor-recovery", "unc-actionable"],
  relatedConcepts: ["confirmation-commitment", "correction-recovery", "communicating-uncertainty"],
  hints: ["Compare the first decision with the second: what is different about reach and reversibility?", "Who outside the team is affected by the 12 client-facing dates?"],
  solution:
    "Apply the single draft title change inline with undo. Use a staged review for the replan with the 12 client-facing tasks flagged for explicit approval. Provide selective revert with a preview that keeps later edits. Label inferred dependencies and let reviewers include or exclude them (or exclude them and list them separately).",
  start: "n0",
  nodes: [
    {
      id: "n0",
      title: "A small change first",
      situation:
        "The assistant also suggests clearer titles for draft tasks. It proposes renaming the draft task “stuff for beta” to “Prepare beta feedback survey”. Drafts are visible only to their author.",
      prompt: "How should the title suggestion be applied?",
      facts: [
        { label: "Reach", value: "Only the author" },
        { label: "Reversibility", value: "Fully reversible" },
      ],
      screen: {
        app: "Planwise",
        title: "Draft · stuff for beta",
        blocks: [
          { type: "appbar", app: "Planwise", title: "Draft task · only you can see this" },
          { type: "field", label: "Title", value: "stuff for beta" },
          {
            type: "group",
            framed: true,
            hotspot: "suggestion",
            blocks: [
              { type: "badge", tone: "ai", text: "Prepare beta feedback survey" },
              {
                type: "buttons",
                buttons: [
                  { label: "Apply", variant: "primary" },
                  { label: "Undo", variant: "ghost" },
                ],
              },
            ],
          },
          {
            type: "dialog",
            title: "Rename this task?",
            hotspot: "fx-rename-dialog",
            blocks: [
              { type: "text", muted: true, text: "“stuff for beta” becomes “Prepare beta feedback survey”." },
              {
                type: "buttons",
                buttons: [
                  { label: "Cancel", variant: "ghost" },
                  { label: "Rename", variant: "primary" },
                ],
              },
            ],
          },
        ],
      },
      choices: [
        {
          id: "inline",
          label: "Show it inline; one click applies it, with Undo",
          detail: "Light and fast.",
          consequence: "Authors accept good titles in a click and ignore the rest.",
          signals: [{ criterionId: "com-proportionate", met: true, because: "A private, reversible edit deserves a light commitment step." }],
          affects: [{ hotspot: "suggestion", tag: "Suggestion · one click" }],
          next: "n1",
        },
        {
          id: "dialog",
          label: "Ask for confirmation in a dialog before renaming",
          detail: "Feels careful.",
          consequence: "Authors face a dialog for a change only they can see; most stop using the feature.",
          signals: [{ criterionId: "com-proportionate", met: false, because: "A dialog for a private, reversible edit adds friction without protecting anyone, and teaches people to click through dialogs." }],
          affects: [{ hotspot: "fx-rename-dialog", tag: "Dialog · extra step" }],
          next: "n1",
        },
      ],
    },
    {
      id: "n1",
      title: "Apply the replan",
      situation: "The assistant has proposed new dates for all 214 dependent tasks. Most moves are straightforward, but 12 tasks carry dates that clients have seen.",
      prompt: "How should the replan be applied?",
      facts: [
        { label: "Tasks", value: "214 across 9 projects" },
        { label: "People notified", value: "31 assignees" },
        { label: "Client-facing dates", value: "12 tasks" },
      ],
      screen: {
        app: "Planwise",
        title: "Replan proposal",
        blocks: [
          { type: "appbar", app: "Planwise", title: "Replan · Beta ready moved to 27 Mar" },
          { type: "badge", tone: "danger", text: "31 assignees notified", hotspot: "notify" },
          { type: "banner", tone: "ai", text: "Assistant proposes new dates for 214 dependent tasks." },
          { type: "text", muted: true, text: "9 projects: Mobile app, Growth, Accounts, Docs and 5 more", hotspot: "by-project" },
          {
            type: "table",
            columns: ["Task", "Project", "Now", "Proposed"],
            rows: [
              ["QA regression pass", "Mobile app", "18 Mar", "29 Mar"],
              ["Beta invite email", "Growth", "19 Mar", "30 Mar"],
              ["Docs: release notes", "Docs", "20 Mar", "31 Mar"],
            ],
            hotspot: "all-moves",
          },
          { type: "list", items: [{ primary: "Client demo: Acme", secondary: "Accounts · 20 Mar → 31 Mar", meta: "client date", hotspot: "client" }] },
          { type: "text", muted: true, text: "Showing 4 of 214" },
          { type: "banner", tone: "success", text: "All 214 dates applied. One digest sent to 31 assignees.", hotspot: "fx-digest" },
          {
            type: "dialog",
            title: "Move 214 tasks?",
            hotspot: "fx-confirm-dialog",
            blocks: [
              {
                type: "buttons",
                buttons: [
                  { label: "Cancel", variant: "ghost" },
                  { label: "Confirm", variant: "primary" },
                ],
              },
            ],
          },
        ],
      },
      choices: [
        {
          id: "auto",
          label: "Apply all changes automatically and send one digest",
          detail: "No review effort.",
          consequence: "All 214 dates move at once, including the 12 that clients have seen. Nobody reviewed them.",
          signals: [
            { criterionId: "com-proportionate", met: false, because: "Applying a broad change that partly leaves the product, with no point of control, doesn’t match its impact." },
            { criterionId: "com-consequence", met: false, because: "Nobody sees what will change before it happens." },
          ],
          affects: [
            { hotspot: "all-moves", tag: "All 214 move" },
            { hotspot: "client", tag: "12 client dates move too" },
            { hotspot: "fx-digest", tag: "One digest" },
          ],
          next: "n2-incident",
        },
        {
          id: "confirm",
          label: "Show “Move 214 tasks?” with Confirm and Cancel",
          detail: "One extra click.",
          consequence: "The project lead confirms. The 12 client-facing dates move with everything else.",
          signals: [
            { criterionId: "com-proportionate", met: true, because: "There is a deliberate step before a broad change." },
            { criterionId: "com-consequence", met: false, because: "“Move 214 tasks?” gives a count, not consequences: it hides which projects change, the 12 client dates, and who is notified." },
          ],
          affects: [{ hotspot: "fx-confirm-dialog", tag: "Dialog · extra step" }],
          next: "n2",
        },
        {
          id: "staged",
          label: "Staged review: changes grouped by project, the 12 client-facing tasks need explicit approval, then one confirmation for the rest",
          detail: "A few minutes of review.",
          consequence: "The lead approves 9 of the client-facing tasks, holds 3 for a conversation, and applies the rest.",
          signals: [
            { criterionId: "com-proportionate", met: true, because: "Review effort is concentrated where the impact is highest." },
            { criterionId: "com-consequence", met: true, because: "The review shows what moves, where, and which dates clients will see change." },
          ],
          affects: [
            { hotspot: "client", tag: "12 client dates" },
            { hotspot: "by-project", tag: "By project" },
          ],
          next: "n2",
        },
        {
          id: "individual",
          label: "Send each assignee their own changes to accept",
          detail: "Distributes the work.",
          consequence: "Three days later, 60% of changes are accepted. The plan is half old and half new, and dependencies conflict.",
          signals: [
            { criterionId: "com-proportionate", met: false, because: "Splitting one coherent plan across 31 people leaves it inconsistent; the commitment belongs with someone who can see the whole change." },
            { criterionId: "com-consequence", met: false, because: "Each person sees only their slice, so nobody sees the overall consequence." },
          ],
          affects: [{ hotspot: "notify", tag: "31 people notified" }],
          next: "n2",
        },
      ],
    },
    {
      id: "n2",
      title: "A mistake surfaces",
      situation: "Two days later, a team lead reports that 40 tasks moved even though they only depended on an optional milestone. Assignees have already edited 6 of those tasks since the replan.",
      prompt: "What recovery do you provide?",
      screen: historyScreen("normal"),
      choices: recoveryChoices("normal"),
    },
    {
      id: "n2-incident",
      title: "A client notices first",
      situation:
        "The digest went out. That afternoon, a client emails to ask why their delivery review moved to 31 March. Nobody on the team knew it had moved. 40 tasks moved unnecessarily, and 6 have been edited since.",
      prompt: "What recovery do you provide?",
      screen: historyScreen("incident"),
      choices: recoveryChoices("incident"),
    },
    {
      id: "n3",
      title: "Inferred dependencies",
      situation:
        "Before the next replan, the team finds that 18 of the 214 dependencies were inferred from task names (for example “QA – Beta”) rather than explicit links.",
      prompt: "How should the review show these 18 tasks?",
      screen: {
        app: "Planwise",
        title: "Next replan",
        blocks: [
          { type: "appbar", app: "Planwise", title: "Next replan · 18 of 214 dependencies inferred" },
          {
            type: "list",
            items: [{ primary: "QA – Beta" }, { primary: "Docs – Beta" }, { primary: "Support – Beta" }],
            hotspot: "inferred-rows",
          },
          { type: "text", muted: true, text: "Showing 3 of 18" },
          {
            type: "group",
            framed: true,
            hotspot: "fx-possibly-affected",
            blocks: [
              { type: "heading", text: "Possibly affected · 18" },
              { type: "text", muted: true, text: "Owners review these separately. No dates moved." },
            ],
          },
        ],
      },
      choices: [
        {
          id: "percent",
          label: "Show a confidence percentage on each row",
          detail: "Compact.",
          consequence: "Rows show 64%–88%. Reviewers can’t tell what a number means or what to check.",
          signals: [{ criterionId: "unc-actionable", met: false, because: "Uncalibrated percentages look precise but don’t say what is uncertain: that the link was guessed from a name." }],
          affects: [{ hotspot: "inferred-rows", tag: "Percentage on each row" }],
        },
        {
          id: "same",
          label: "Treat them like explicit dependencies",
          detail: "Simplest.",
          consequence: "Guessed links move dates just like real ones, and the problem repeats.",
          signals: [{ criterionId: "unc-actionable", met: false, because: "Hiding the difference removes the reviewer’s chance to check the weakest part of the proposal." }],
          affects: [{ hotspot: "inferred-rows", tag: "18 inferred · treated as explicit" }],
        },
        {
          id: "label",
          label: "Mark them “Inferred from task name”, group them, and let reviewers include or exclude them",
          detail: "A small addition to the review.",
          consequence: "Reviewers check the 18 in a minute and exclude 5.",
          signals: [{ criterionId: "unc-actionable", met: true, because: "The label says exactly why each row is uncertain, and the reviewer can act on it." }],
          affects: [{ hotspot: "inferred-rows", tag: "Inferred from task name · include or exclude" }],
        },
        {
          id: "exclude",
          label: "Leave them out of the replan and list them separately as “Possibly affected”",
          detail: "Safer, more manual.",
          consequence: "No guessed links move dates; owners review the separate list.",
          signals: [{ criterionId: "unc-actionable", met: true, because: "The uncertainty is explicit and the reviewer decides; the tradeoff is extra manual work." }],
          affects: [{ hotspot: "fx-possibly-affected", tag: "Possibly affected" }],
        },
      ],
    },
  ],
  debrief: {
    impact:
      "The draft title affected one person; the replan affects 31 assignees and 12 client commitments. The broader and more external the effect, the more the commitment step should show and the more deliberate it should be.",
    reversibility:
      "Dates can be changed back, but notifications and client expectations cannot. Recovery has to work days later and be selective, so correct changes and later edits survive.",
    uncertainty:
      "The model’s weakest outputs were the 18 inferred dependencies. Making them visible and specific puts review effort where it is most useful.",
  },
};

export const scenarioTriage: DecisionActivity = {
  id: "scenario-triage",
  pathId: FLAGSHIP_ID,
  template: "decision",
  title: "Suggested routing for support tickets",
  contextLabel: "AI ticket categorisation",
  contextKey: "ticket-routing",
  kind: "baseline",
  estimatedMinutes: 10,
  scenario:
    "You design Helpline, a support desk tool. The assistant suggests a category for each incoming ticket, which decides which team picks it up. Agents handle about 80 tickets per shift.",
  task: "Make three decisions about how agents see, check and correct the suggestion.",
  constraints: ["Misrouted tickets wait in the wrong queue for 3 hours on average.", "Agents are measured on response time."],
  criteria: ["evi-specific", "cor-inplace", "unc-distinguish"],
  relatedConcepts: ["evidence-explanations", "correction-recovery", "communicating-uncertainty"],
  hints: ["An agent has a few seconds per ticket. What explanation fits in that time?"],
  solution:
    "Show the specific signals behind the category, let agents change it inline with an optional reason, and present mixed tickets as an unconfirmed suggestion naming both categories (or send them to triage, accepting the tradeoff).",
  start: "t1",
  nodes: [
    {
      id: "t1",
      title: "Explain the suggestion",
      situation: "A new ticket reads: “I was charged twice this month and now I can’t log in to download the invoice.” The assistant suggests Billing.",
      prompt: "What explanation should agents see next to the suggested category?",
      screen: {
        app: "Helpline",
        title: "Ticket #48213",
        blocks: [
          { type: "appbar", app: "Helpline", title: "Ticket #48213 · Rosa Lindqvist" },
          { type: "quote", text: "I was charged twice this month and now I can’t log in to download the invoice.", cite: "Received 10 Mar 2026, 08:52" },
          { type: "field", label: "Category", value: "Billing", ai: true, note: "Suggested", hotspot: "category" },
          { type: "text", muted: true, text: "Suggested by AI based on ticket content", hotspot: "fx-expl-generic" },
          { type: "text", muted: true, text: "Mentions ‘charged twice’ and ‘invoice’; account shows 2 charges on 1 Mar", hotspot: "fx-expl-specific" },
          { type: "text", muted: true, text: "Full model output with scores for every category", hotspot: "fx-expl-trace" },
        ],
      },
      choices: [
        { id: "none", label: "No explanation", detail: "Fastest to read.", consequence: "Agents can’t tell whether to trust it, so they reread every ticket.", signals: [{ criterionId: "evi-specific", met: false, because: "Without an explanation, agents have nothing to weigh the suggestion against." }], affects: [{ hotspot: "category", tag: "No explanation" }], next: "t2" },
        { id: "generic", label: "“Suggested by AI based on ticket content”", detail: "Consistent.", consequence: "Agents learn nothing about this ticket.", signals: [{ criterionId: "evi-specific", met: false, because: "The text is true of every ticket, so it doesn’t explain this one." }], affects: [{ hotspot: "fx-expl-generic", tag: "Same on every ticket" }], next: "t2" },
        { id: "specific", label: "“Mentions ‘charged twice’ and ‘invoice’; account shows 2 charges on 1 Mar”", detail: "One line, per ticket.", consequence: "Agents see the reason at a glance and notice the login part isn’t covered.", signals: [{ criterionId: "evi-specific", met: true, because: "It names the signals behind this suggestion and fits the time agents have." }], affects: [{ hotspot: "fx-expl-specific", tag: "One line, this ticket" }], next: "t2" },
        { id: "trace", label: "Full model output with scores for every category", detail: "Complete.", consequence: "Agents scroll past it; it takes longer to read than the ticket.", signals: [{ criterionId: "evi-specific", met: false, because: "It is not proportionate: the useful part is buried and agents have seconds." }], affects: [{ hotspot: "fx-expl-trace", tag: "Longer than the ticket" }], next: "t2" },
      ],
    },
    {
      id: "t2",
      title: "The agent disagrees",
      situation: "The agent thinks the login problem should be handled first, by Account Access.",
      prompt: "How does the agent correct the routing?",
      screen: {
        app: "Helpline",
        title: "Ticket #48213",
        blocks: [
          { type: "appbar", app: "Helpline", title: "Ticket #48213 · Rosa Lindqvist" },
          { type: "field", label: "Category", value: "Billing", ai: true, note: "Suggested", hotspot: "category" },
          { type: "banner", tone: "ai", text: "The assistant returns Billing again.", hotspot: "fx-rerun" },
          { type: "field", label: "Category", value: "Account Access", note: "Changed by the agent · optional one-tap reason", hotspot: "fx-inline" },
          { type: "banner", tone: "warn", text: "Change requested from a team lead", hotspot: "fx-escalate" },
          {
            type: "dialog",
            title: "Reason for the change",
            hotspot: "fx-required",
            blocks: [
              { type: "field", label: "Reason", value: "", note: "Required" },
              { type: "buttons", buttons: [{ label: "Change category", variant: "primary" }] },
            ],
          },
        ],
      },
      choices: [
        { id: "rerun", label: "Ask the assistant to re-classify", detail: "No new controls.", consequence: "The assistant returns Billing again.", signals: [{ criterionId: "cor-inplace", met: false, because: "Re-running asks the system to change its mind instead of letting the agent apply what they know." }], affects: [{ hotspot: "fx-rerun", tag: "Re-classify" }], next: "t2-rerun" },
        { id: "inline", label: "Change the category inline; optional one-tap reason", detail: "Two clicks.", consequence: "The ticket goes to Account Access straight away; some agents add a reason.", signals: [{ criterionId: "cor-inplace", met: true, because: "Correction is direct and cheap, with optional feedback that doesn’t slow agents down." }], affects: [{ hotspot: "fx-inline", tag: "Inline · optional reason" }], next: "t3" },
        { id: "escalate", label: "Request a change from a team lead", detail: "Adds oversight.", consequence: "The ticket waits 40 minutes for a lead to approve the change.", signals: [{ criterionId: "cor-inplace", met: false, because: "Requiring approval for a routine correction makes fixing a mistake slower than making it." }], affects: [{ hotspot: "fx-escalate", tag: "Waits for approval" }], next: "t3" },
        { id: "required", label: "Change inline, with a required written reason", detail: "Better training data.", consequence: "Agents type “login” 30 times a shift; some stop correcting.", signals: [{ criterionId: "cor-inplace", met: false, because: "A required reason turns a small fix into a chore, so fewer mistakes get corrected." }], affects: [{ hotspot: "fx-required", tag: "Dialog · required reason" }], next: "t3" },
      ],
    },
    {
      id: "t2-rerun",
      title: "Still Billing",
      situation: "Re-classifying returned Billing again. The customer has now waited 6 minutes.",
      prompt: "What do you add?",
      screen: {
        app: "Helpline",
        title: "Ticket #48213",
        blocks: [
          { type: "appbar", app: "Helpline", title: "Ticket #48213 · Rosa Lindqvist" },
          { type: "field", label: "Category", value: "Billing", ai: true, note: "Re-classified: Billing again", hotspot: "category" },
          { type: "text", muted: true, text: "The customer has now waited 6 minutes." },
          { type: "buttons", buttons: [{ label: "Change category", variant: "secondary" }], hotspot: "fx-override" },
          { type: "buttons", buttons: [{ label: "Re-classify (up to 3 times)", variant: "secondary" }], hotspot: "fx-retry" },
        ],
      },
      choices: [
        { id: "override", label: "Add an inline override now", detail: "Fixes the gap.", consequence: "The agent routes the ticket, but the first design cost every disagreeing agent a wasted step.", signals: [{ criterionId: "cor-inplace", met: false, because: "The final design works, but the route through re-classifying still made correction slower than it should be." }], affects: [{ hotspot: "fx-override", tag: "Inline override" }], next: "t3" },
        { id: "retry", label: "Let agents retry up to 3 times", detail: "No new controls.", consequence: "Agents retry, get Billing three times, and reassign by email.", signals: [{ criterionId: "cor-inplace", met: false, because: "More retries don’t give agents control over the outcome." }], affects: [{ hotspot: "fx-retry", tag: "Same answer, up to 3 times" }], next: "t3" },
      ],
    },
    {
      id: "t3",
      title: "Mixed tickets",
      situation: "About one in ten tickets, like this one, involves two issues.",
      prompt: "How should the suggestion handle tickets that fit two categories?",
      screen: {
        app: "Helpline",
        title: "Ticket #48213",
        blocks: [
          { type: "appbar", app: "Helpline", title: "Ticket #48213 · Rosa Lindqvist" },
          { type: "quote", text: "I was charged twice this month and now I can’t log in to download the invoice.", cite: "Received 10 Mar 2026, 08:52" },
          { type: "field", label: "Category", value: "Billing", note: "Routed immediately", hotspot: "fx-top" },
          { type: "field", label: "Category", value: "Suggested: Billing + Account Access", ai: true, note: "Unconfirmed until an agent confirms", hotspot: "fx-both" },
          { type: "banner", tone: "info", text: "Sent to the human triage queue, without a suggestion.", hotspot: "fx-triage" },
        ],
      },
      choices: [
        { id: "top", label: "Assign the top category and route immediately", detail: "Fast.", consequence: "Half the issue lands with the wrong team, labelled as if it were certain.", signals: [{ criterionId: "unc-distinguish", met: false, because: "Routing on the top guess presents an inference as a settled category." }], affects: [{ hotspot: "fx-top", tag: "Looks certain" }] },
        { id: "both", label: "Show “Suggested: Billing + Account Access” until an agent confirms", detail: "One more glance.", consequence: "Agents see both issues and choose an order.", signals: [{ criterionId: "unc-distinguish", met: true, because: "The suggestion is visibly unconfirmed and shows the ambiguity." }], affects: [{ hotspot: "fx-both", tag: "Visibly unconfirmed" }] },
        { id: "triage", label: "Send mixed tickets to a human triage queue without a suggestion", detail: "Safe, slower.", consequence: "Mixed tickets wait 20 minutes longer but are never misrouted.", signals: [{ criterionId: "unc-distinguish", met: true, because: "Nothing inferred is presented as confirmed. The tradeoff is losing a useful suggestion." }], affects: [{ hotspot: "fx-triage", tag: "No suggestion shown" }] },
      ],
    },
  ],
  debrief: {
    impact: "Each ticket affects one customer, but routing decides how long they wait. Explanations must fit the seconds an agent has.",
    reversibility: "Routing is easy to change, so the correction itself should be just as easy. Approval steps and required text make fixing mistakes harder than making them.",
    uncertainty: "Mixed tickets are where the category is genuinely uncertain. Showing that ambiguity is more useful than a confident single label.",
  },
};

export const scenarioCalendar: DecisionActivity = {
  id: "scenario-calendar",
  pathId: FLAGSHIP_ID,
  template: "decision",
  title: "An assistant that moves meetings",
  contextLabel: "AI calendar rescheduling",
  contextKey: "calendar-autoschedule",
  kind: "alternative",
  alternativeFor: "scenario-triage",
  estimatedMinutes: 9,
  scenario:
    "You design Daybook, a calendar app. Its assistant protects focus time by moving meetings. Lina manages a small team and turned the assistant on this week. It wants to move her 1:1 with Kai from Tuesday 10:00 to Thursday 16:30.",
  task: "Decide when the assistant may move meetings, how attendees correct a bad move, and how Lina recovers after a busy week.",
  constraints: ["Moving a shared meeting notifies every attendee.", "Kai has school pickup on Thursdays at 16:45."],
  criteria: ["com-proportionate", "cor-inplace", "cor-recovery"],
  relatedConcepts: ["confirmation-commitment", "correction-recovery"],
  hints: ["Is moving Lina’s own focus block the same kind of change as moving a meeting with Kai?"],
  solution:
    "Move only events where Lina is the sole attendee automatically and propose the rest; let attendees restore or choose a time from the notification; provide a reviewable list of the assistant’s changes with selective revert and notifications.",
  start: "c1",
  nodes: [
    {
      id: "c1",
      title: "Shared meetings",
      situation: "The assistant can move Lina’s solo focus blocks and meetings with other people.",
      prompt: "When may the assistant move meetings that include other people?",
      screen: {
        app: "Daybook",
        title: "Proposed move",
        blocks: [
          { type: "appbar", app: "Daybook", title: "Assistant · focus time" },
          { type: "banner", tone: "ai", text: "Move “1:1 with Kai” from Tuesday 10:00 to Thursday 16:30." },
          {
            type: "list",
            items: [
              { primary: "1:1 with Kai", secondary: "Tuesday 10:00 → Thursday 16:30", meta: "Shared meeting", hotspot: "shared" },
              { primary: "Focus block", secondary: "Only Lina", meta: "Solo event", hotspot: "solo" },
            ],
          },
          { type: "text", muted: true, text: "Moving a shared meeting notifies every attendee." },
        ],
      },
      choices: [
        { id: "auto", label: "Automatically, like solo events", detail: "Consistent.", consequence: "Kai’s 1:1 moves to Thursday 16:30 without Lina noticing.", signals: [{ criterionId: "com-proportionate", met: false, because: "Changes that affect other people’s calendars need a point of control that solo changes don’t." }], affects: [{ hotspot: "shared", tag: "Moves without asking" }, { hotspot: "solo", tag: "Moves automatically" }], next: "c2" },
        { id: "propose", label: "Propose to Lina; attendees see nothing until she accepts", detail: "One tap for Lina.", consequence: "Lina sees the clash with pickup and picks Wednesday instead.", signals: [{ criterionId: "com-proportionate", met: true, because: "The commitment sits with the organiser, before anyone else is affected." }], affects: [{ hotspot: "shared", tag: "Lina accepts first" }], next: "c2" },
        { id: "split", label: "Move solo events automatically; propose shared ones", detail: "Two behaviours.", consequence: "Focus blocks shift silently; the 1:1 waits for Lina.", signals: [{ criterionId: "com-proportionate", met: true, because: "Commitment matches reach: light for private changes, deliberate for shared ones." }], affects: [{ hotspot: "solo", tag: "Moves automatically" }, { hotspot: "shared", tag: "Waits for Lina" }], next: "c2" },
      ],
    },
    {
      id: "c2",
      title: "Kai’s view",
      situation: "Suppose a move did reach Kai. His notification says the 1:1 is now Thursday 16:30, which clashes with school pickup.",
      prompt: "How can Kai correct this?",
      screen: {
        app: "Daybook",
        title: "Kai’s notification",
        blocks: [
          { type: "appbar", app: "Daybook", title: "Notification · Kai" },
          { type: "banner", tone: "warn", text: "Your 1:1 is now Thursday 16:30." },
          { type: "text", muted: true, text: "School pickup · Thursdays 16:45" },
          { type: "buttons", buttons: [{ label: "Decline", variant: "secondary" }], hotspot: "fx-decline" },
          {
            type: "group",
            framed: true,
            hotspot: "fx-restore",
            blocks: [
              { type: "text", text: "Pick one of 3 suggested times" },
              {
                type: "buttons",
                buttons: [
                  { label: "Keep original time", variant: "primary" },
                  { label: "Pick a time", variant: "secondary" },
                ],
              },
            ],
          },
          { type: "link", text: "Report a problem with the assistant", hotspot: "fx-report" },
        ],
      },
      choices: [
        { id: "decline", label: "Decline, then message Lina to find a new time", detail: "Standard calendar behaviour.", consequence: "Three messages later, the 1:1 is rebooked for next week.", signals: [{ criterionId: "cor-inplace", met: false, because: "Kai can reject the change but not correct it; the fix costs a conversation." }], affects: [{ hotspot: "fx-decline", tag: "Decline only" }], next: "c3" },
        { id: "restore", label: "From the notification: “Keep original time” or pick one of 3 suggested times", detail: "One tap.", consequence: "Kai picks Wednesday 11:00; Lina is notified.", signals: [{ criterionId: "cor-inplace", met: true, because: "The person affected can correct the move where they see it." }], affects: [{ hotspot: "fx-restore", tag: "Fix in the notification" }], next: "c3" },
        { id: "support", label: "Report a problem with the assistant", detail: "Collects feedback.", consequence: "Kai’s report is logged; the meeting stays at 16:30.", signals: [{ criterionId: "cor-inplace", met: false, because: "Reporting helps the product team, not Kai." }], affects: [{ hotspot: "fx-report", tag: "Feedback only" }], next: "c3" },
      ],
    },
    {
      id: "c3",
      title: "After a busy week",
      situation: "On Friday, Lina realises the focus-time rule was too aggressive. The assistant moved 9 events this week, 4 of them shared.",
      prompt: "What recovery do you provide?",
      screen: {
        app: "Daybook",
        title: "This week",
        blocks: [
          { type: "appbar", app: "Daybook", title: "Assistant changes · this week" },
          { type: "banner", tone: "ai", text: "The assistant moved 9 events this week, 4 of them shared." },
          { type: "toast", text: "Assistant moved an event", action: "Undo last change", hotspot: "fx-last" },
          {
            type: "group",
            framed: true,
            hotspot: "fx-review",
            blocks: [
              { type: "heading", text: "This week’s assistant changes" },
              { type: "text", muted: true, text: "Revert any of them. Affected attendees get one update." },
              { type: "buttons", buttons: [{ label: "Revert selected", variant: "secondary" }] },
            ],
          },
          { type: "banner", tone: "neutral", text: "Assistant is off. The 9 changes remain.", hotspot: "fx-off" },
        ],
      },
      choices: [
        { id: "last", label: "“Undo last change”", detail: "Familiar.", consequence: "Only the most recent move is reverted.", signals: [{ criterionId: "cor-recovery", met: false, because: "Recovery must reach all the assistant’s changes, not just the last one." }], affects: [{ hotspot: "fx-last", tag: "Only the latest move" }] },
        { id: "review", label: "A list of this week’s assistant changes; revert any, notifying affected attendees", detail: "A new view.", consequence: "Lina reverts 3 events in a minute; attendees get one clear update.", signals: [{ criterionId: "cor-recovery", met: true, because: "Selective, late recovery matches how these problems are discovered." }], affects: [{ hotspot: "fx-review", tag: "Pick and revert" }] },
        { id: "off", label: "Turn the assistant off", detail: "Stops the problem.", consequence: "No more moves, but the 9 changes remain.", signals: [{ criterionId: "cor-recovery", met: false, because: "Stopping future changes doesn’t recover from past ones." }], affects: [{ hotspot: "fx-off", tag: "Stops future moves only" }] },
      ],
    },
  ],
  debrief: {
    impact: "Solo events affect only Lina; shared meetings affect other people’s days. That difference should change who commits and when.",
    reversibility: "A moved meeting can be moved back, but each move notifies people. Recovery should be selective and should tell attendees once, clearly.",
    uncertainty: "The assistant doesn’t know about Kai’s pickup. Giving Kai a direct way to correct the move lets the person with the missing information fix it.",
  },
};
