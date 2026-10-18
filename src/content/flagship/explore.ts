import type { ExploreConcept } from "@/domain/types";

export const flagshipExplore: ExploreConcept[] = [
  {
    id: "why-calibrated-trust",
    title: "What calibrated trust means",
    summary: "People should rely on AI output when it is likely right, and check it when it might be wrong. Interface design decides whether they can tell the difference.",
    readingMinutes: 4,
    freeSample: true,
    sections: [
      {
        heading: "Two ways trust goes wrong",
        body: "Over-reliance: people accept outputs they should have checked, because the interface makes guesses look like facts. Under-reliance: people ignore or redo useful outputs, because they have no way to tell good ones from bad ones. Both waste the value of the feature.",
      },
      {
        heading: "Design levers you control",
        body: "You rarely control model accuracy. You do control how an output is presented, what uncertainty is shown, what evidence can be inspected, how easily it can be corrected, and when it becomes real. This path is organised around those levers.",
      },
      {
        heading: "How this path is assessed",
        body: "You complete the path by demonstrating four skills in practice, not by reading every lesson. Each skill needs evidence from at least two different contexts, at least one of them without hints or a revealed solution. You can start with practice at any time.",
      },
    ],
    comparisons: [
      {
        title: "Same output, different trust signals",
        before: {
          caption: "The guess looks like a fact",
          screen: { app: "Planwise", title: "Task", blocks: [{ type: "field", label: "Due date", value: "Fri, 13 Mar 2026" }] },
        },
        after: {
          caption: "The guess is visible as a guess, with its basis",
          screen: {
            app: "Planwise",
            title: "Task",
            blocks: [
              { type: "field", label: "Due date", value: "Fri, 13 Mar 2026", ai: true, note: "Suggested from Jordan’s message · View source" },
              { type: "buttons", buttons: [{ label: "Accept", variant: "primary" }, { label: "Change", variant: "secondary" }] },
            ],
          },
        },
        whyItMatters: "The second version costs a few pixels and one click, and gives people what they need to decide whether to rely on the date.",
      },
    ],
    example: {
      title: "Example: a recap that over-claims",
      body: "A meeting tool writes “Team agreed to drop the Android beta” when the team only discussed it. Because the recap looks authoritative and has no timestamp, 14 people act on a decision that was never made. Nothing about the model needed to change to prevent this; the presentation did.",
    },
    video: {
      title: "Calibrated trust in three minutes",
      plannedLength: "about 3 minutes (planned)",
      transcript: [
        { at: "0:00", text: "When an AI feature fills in a value for you, it is making a claim. The question is whether you can tell how much to rely on it." },
        { at: "0:20", text: "Here is a task with a due date. Was this typed by a teammate or guessed from a message? In most products, you can’t tell." },
        { at: "0:45", text: "Now the same date, marked as a suggestion, with a link to the sentence it came from. You can check it in two seconds, or accept it." },
        { at: "1:20", text: "Calibrated trust means relying on outputs when they are likely right and checking them when they might be wrong. Your interface decides whether people can do that." },
        { at: "2:00", text: "In this path you will practise four levers: uncertainty, evidence, correction and commitment." },
      ],
      storyboard: [
        { frame: 1, visual: "Task panel with a plain due date field.", narration: "Was this typed or guessed?" },
        { frame: 2, visual: "The same panel; the date gains a ‘Suggested’ style and a ‘View source’ link.", narration: "Same output, different trust signals." },
        { frame: 3, visual: "Source message slides in with “by next Friday” highlighted.", narration: "Evidence at the point of decision." },
        { frame: 4, visual: "Four labelled cards: Uncertainty, Evidence, Correction, Commitment.", narration: "The levers you will practise." },
      ],
    },
    practiceActivityIds: ["bench-deadline", "critique-recap"],
  },
  {
    id: "communicating-uncertainty",
    title: "Communicating uncertainty",
    skillId: "uncertainty",
    summary: "Show which values are inferred, and say what is uncertain in terms people can act on.",
    readingMinutes: 6,
    freeSample: false,
    sections: [
      {
        heading: "First, make inference visible",
        body: "Before describing how uncertain a value is, make sure people can tell it was inferred at all. Use a provisional state that survives every place the value appears: list views, exports, notifications. A value that looks typed will be treated as typed.",
      },
      {
        heading: "Then, make uncertainty specific",
        body: "“May be inaccurate” is true of everything, so people learn to ignore it. Useful uncertainty names what might be wrong: two possible dates, a missing delivery date, two conflicting values in the source. It tells people what to check.",
      },
      {
        heading: "Be careful with numbers",
        body: "A percentage looks precise. Unless it has been checked to match real-world accuracy for this kind of output, it implies a precision the system doesn’t have, and it still doesn’t tell people what to check. If you show a number, you need to know what it means. This prototype treats uncalibrated scores as a problem.",
      },
    ],
    comparisons: [
      {
        title: "Generic warning vs specific ambiguity",
        before: {
          caption: "True, but not useful",
          screen: { app: "Planwise", title: "Task", blocks: [{ type: "field", label: "Due date", value: "Fri, 13 Mar 2026", ai: true, note: "AI-generated · may be inaccurate" }] },
        },
        after: {
          caption: "Names what to check",
          screen: {
            app: "Planwise",
            title: "Task",
            blocks: [
              { type: "field", label: "Due date", value: "Fri, 13 Mar 2026", ai: true, note: "“Next Friday” could mean 13 or 20 Mar" },
              { type: "buttons", buttons: [{ label: "13 Mar", variant: "secondary" }, { label: "20 Mar", variant: "secondary" }] },
            ],
          },
        },
        whyItMatters: "The specific version turns a vague doubt into a two-second decision.",
      },
      {
        title: "A score vs a reason",
        before: { caption: "Precise-looking, unexplained", screen: { app: "Ledgerly", title: "Invoice", blocks: [{ type: "field", label: "Due date", value: "9 Apr 2026", note: "91% confident" }] } },
        after: {
          caption: "Explains the assumption",
          screen: { app: "Ledgerly", title: "Invoice", blocks: [{ type: "field", label: "Due date", value: "9 Apr 2026", ai: true, note: "Terms are ‘Net 30 from delivery’; no delivery date on invoice. Assumes 10 Mar." }] },
        },
        whyItMatters: "The reason shows that the risk lies in missing information, not in reading the text.",
      },
    ],
    example: {
      title: "Example: a contradictory source",
      body: "A policy summary states a €600 stipend while the appendix says €450. A single ‘High confidence’ label tells the author the summary is fine. A note that names the contradiction points straight at the one fact most likely to be wrong.",
    },
    video: {
      title: "Uncertainty people can act on",
      plannedLength: "about 4 minutes (planned)",
      transcript: [
        { at: "0:00", text: "Here are three ways to mark the same AI-extracted date. Watch what each one asks the user to do." },
        { at: "0:30", text: "A percentage: 82 percent. Is that high? What should I check? It doesn’t say." },
        { at: "1:00", text: "A disclaimer: may be inaccurate. It appears on every suggestion, so after a day nobody reads it." },
        { at: "1:30", text: "A specific note: next Friday could mean the 13th or the 20th. Now I know exactly what to check, and the interface can offer both." },
        { at: "2:30", text: "Rule of thumb: make inference visible everywhere, and make uncertainty specific wherever you can." },
      ],
      storyboard: [
        { frame: 1, visual: "Three versions of the date field side by side.", narration: "Same date, three signals." },
        { frame: 2, visual: "Close-up on ‘82% confident’ with a question mark.", narration: "Precise, but not actionable." },
        { frame: 3, visual: "A list view where every row has the same disclaimer.", narration: "Generic warnings fade." },
        { frame: 4, visual: "Specific note with two date buttons.", narration: "Specific uncertainty leads to action." },
      ],
    },
    practiceActivityIds: ["bench-deadline", "bench-invoice", "critique-recap", "critique-expenses"],
  },
  {
    id: "evidence-explanations",
    title: "Evidence and explanations",
    skillId: "evidence",
    summary: "Let people inspect what an output is based on, where they decide, with explanations about this output.",
    readingMinutes: 5,
    freeSample: false,
    sections: [
      {
        heading: "Evidence is the source, at the point of decision",
        body: "Link the output to the specific part of the source it came from: the sentence in a message, the timestamp in a recording, the query behind a chart. Put it where people make the decision, not on a separate page.",
      },
      {
        heading: "Explanations are about this output",
        body: "“Our advanced AI finds what matters” describes the product, not the output. A useful explanation says why this value or action was proposed, and what was left out. Keep it short enough for the time people have.",
      },
      {
        heading: "More is not always better",
        body: "A complete model trace is transparent but rarely useful: the relevant reason gets buried. Aim for the explanation that would change someone’s decision, and make the full detail available if needed.",
      },
    ],
    comparisons: [
      {
        title: "Product explanation vs output explanation",
        before: { caption: "Describes the product", screen: { app: "Notewise", title: "Recap", blocks: [{ type: "link", text: "Why these points?" }, { type: "text", muted: true, text: "Our advanced AI identifies what matters most in every meeting." }] } },
        after: { caption: "Describes this recap", screen: { app: "Notewise", title: "Recap", blocks: [{ type: "link", text: "Why these points?" }, { type: "text", muted: true, text: "Covers 03:10–38:40. Left out: small talk and a 6-minute screen share without audio." }] } },
        whyItMatters: "Only the second one helps a reader decide whether the recap is enough or whether to check the recording.",
      },
      {
        title: "An unsupported claim vs a checkable one",
        before: { caption: "No way to check", screen: { app: "Notewise", title: "Recap", blocks: [{ type: "list", items: [{ primary: "Team agreed to drop the Android beta", secondary: "No timestamp" }] }] } },
        after: { caption: "One click to verify", screen: { app: "Notewise", title: "Recap", blocks: [{ type: "list", items: [{ primary: "Discussed dropping the Android beta (no decision)", secondary: "▶ 31:05 in recording" }] }] } },
        whyItMatters: "Linking the claim to the moment in the recording also makes over-claiming easier to catch.",
      },
    ],
    example: {
      title: "Example: an analytics insight",
      body: "An insight says conversion dropped “because of” a new payment page. Showing the sample, the period and an ‘Open query’ link makes the number checkable. Mentioning that a pricing banner shipped the next day gives the team the context to question the cause.",
    },
    practiceActivityIds: ["bench-summary", "critique-insight", "critique-expenses", "scenario-triage"],
  },
  {
    id: "correction-recovery",
    title: "Correction and recovery",
    skillId: "correction",
    summary: "Make small fixes cheap and in place, and provide recovery that matches what the change affected.",
    readingMinutes: 5,
    freeSample: false,
    sections: [
      {
        heading: "Correction should be cheaper than the mistake",
        body: "If fixing a wrong value means regenerating, opening settings or asking someone, people either live with mistakes or stop using the feature. Let people edit in place, or choose from the likely alternatives when the system can name them.",
      },
      {
        heading: "Match recovery to when problems are found",
        body: "An undo toast handles slips noticed in seconds. Plan changes, price updates and bulk archives are often discovered days later, so they need history and revert that still work then.",
      },
      {
        heading: "Recover only what went wrong",
        body: "All-or-nothing revert undoes correct changes and overwrites work done since. For broad changes, offer selective revert with a preview. When effects left the product, such as a sent message, recovery has to include a follow-up, or the send should be delayed and cancellable.",
      },
    ],
    comparisons: [
      {
        title: "A trip to settings vs a fix in place",
        before: { caption: "Fixing one row means writing a rule", screen: { app: "Ledgerly", title: "Transactions", blocks: [{ type: "list", items: [{ primary: "Adobe · $59.99", secondary: "Software · Suggested" }] }, { type: "text", muted: true, text: "To change a category, create a rule in Settings." }] } },
        after: { caption: "Fix in the row; rule optional", screen: { app: "Ledgerly", title: "Transactions", blocks: [{ type: "list", items: [{ primary: "Adobe · $59.99", secondary: "Software · Suggested · Accept | Change" }] }] } },
        whyItMatters: "People correct far more mistakes when correction is a click away.",
      },
      {
        title: "A short undo vs late, selective recovery",
        before: { caption: "Gone after 10 seconds", screen: { app: "Planwise", title: "Replan", blocks: [{ type: "toast", text: "214 tasks moved.", action: "Undo" }] } },
        after: { caption: "Available when the problem is found", screen: { app: "Planwise", title: "Replan history", blocks: [{ type: "list", items: [{ primary: "Replan · 10 Mar", secondary: "214 tasks · Revert by project or task" }] }, { type: "buttons", buttons: [{ label: "Preview revert", variant: "secondary" }] }] } },
        whyItMatters: "The second design works two days later and keeps edits made since.",
      },
    ],
    example: {
      title: "Example: a meeting moved by an assistant",
      body: "A calendar assistant moves a 1:1 into a slot that clashes with school pickup. If the attendee can only decline, the fix takes three messages. If the notification offers ‘Keep original time’ or three alternatives, the person with the missing information fixes it in one tap.",
    },
    practiceActivityIds: ["bench-deadline", "scenario-calendar", "critique-archive", "critique-expenses"],
  },
  {
    id: "confirmation-commitment",
    title: "Confirmation and commitment",
    skillId: "commitment",
    summary: "Decide when a proposal becomes real based on its impact, reach and reversibility, and make confirmations state consequences.",
    readingMinutes: 6,
    freeSample: false,
    sections: [
      {
        heading: "Impact, reach and reversibility",
        body: "A private, reversible edit can be applied with one click and undo. A change that reaches other people, leaves the product (an email or SMS) or is hard to reverse needs a deliberate point of control. Ask: who is affected, can it be undone, and how late would a problem be found?",
      },
      {
        heading: "Friction in the wrong place is harmful",
        body: "Dialogs on small changes teach people to click through dialogs, which weakens the ones that matter. Put the effort where the impact is: a staged review for the 12 client-facing dates, not a dialog for every title.",
      },
      {
        heading: "Confirmations state consequences",
        body: "“Are you sure?” and “Move 214 tasks?” ask for attention without giving information. A useful confirmation shows what changes, for whom, and what cannot be undone, and labels the commit button with the action.",
      },
    ],
    comparisons: [
      {
        title: "A count vs consequences",
        before: { caption: "Asks for attention, gives little", screen: { app: "Planwise", title: "Replan", blocks: [{ type: "dialog", title: "Move 214 tasks?", blocks: [{ type: "buttons", buttons: [{ label: "Cancel", variant: "ghost" }, { label: "Confirm", variant: "primary" }] }] }] } },
        after: {
          caption: "Shows what changes and what needs care",
          screen: {
            app: "Planwise",
            title: "Replan",
            blocks: [
              {
                type: "dialog",
                title: "Review replan",
                blocks: [
                  { type: "text", text: "214 tasks across 9 projects · 31 assignees notified" },
                  { type: "banner", tone: "warn", text: "12 tasks have dates clients have seen. Approve each one." },
                  { type: "buttons", buttons: [{ label: "Back", variant: "ghost" }, { label: "Apply 202 changes", variant: "primary" }] },
                ],
              },
            ],
          },
        },
        whyItMatters: "The second version concentrates review effort on the 12 changes that leave the team.",
      },
      {
        title: "Light commitment for a private, reversible change",
        before: { caption: "Dialog for a draft title", screen: { app: "Planwise", title: "Draft", blocks: [{ type: "dialog", title: "Rename task?", blocks: [{ type: "text", text: "Rename “stuff for beta” to “Prepare beta feedback survey”?" }, { type: "buttons", buttons: [{ label: "Cancel", variant: "ghost" }, { label: "Rename", variant: "primary" }] }] }] } },
        after: { caption: "Inline with undo", screen: { app: "Planwise", title: "Draft", blocks: [{ type: "field", label: "Title", value: "Prepare beta feedback survey", ai: true, note: "Suggested · Apply · Dismiss" }] } },
        whyItMatters: "Matching friction to impact keeps dialogs meaningful for the changes that need them.",
      },
    ],
    example: {
      title: "Example: rescheduling a client",
      body: "Moving a physio appointment texts the client, and texts can’t be recalled. A review step that shows the exact message, or a 60-second ‘Cancel send’ window, gives the therapist a real point of control. A generic dialog adds a tap but no information.",
    },
    practiceActivityIds: ["bench-booking", "scenario-replan", "bench-pricing", "critique-archive"],
  },
];
