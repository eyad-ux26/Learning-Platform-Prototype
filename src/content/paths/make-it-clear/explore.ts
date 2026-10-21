import type { ExploreConcept, Screen } from "@/domain/types";

/** PATH-010 lessons L01–L08, plus an orientation note drawn from the path file’s opening sections. */

const APP = "Riverside Workshops";

const promoFirst: Screen = {
  app: APP,
  title: "Workshop",
  blocks: [
    { type: "banner", tone: "info", text: "Photo · “Learn together”" },
    { type: "buttons", buttons: [{ label: "Get the monthly newsletter", variant: "primary" }] },
    { type: "heading", text: "Sketch Your First App" },
    { type: "buttons", buttons: [{ label: "Reserve a place", variant: "primary" }] },
  ],
};

const decisionFirst: Screen = {
  app: APP,
  title: "Workshop",
  blocks: [
    { type: "heading", text: "Sketch Your First App" },
    { type: "field", label: "Date", value: "Tuesday 17 November, 18:00–20:00" },
    { type: "field", label: "Location", value: "Riverside Learning Hub, Room 2" },
    { type: "field", label: "Price", value: "Free" },
    { type: "buttons", buttons: [{ label: "Reserve a place", variant: "primary" }] },
    { type: "text", muted: true, text: "Cancel up to 24 hours before the start" },
    { type: "link", text: "Get the monthly newsletter" },
  ],
};

export const micExplore: ExploreConcept[] = [
  {
    id: "mic-start",
    title: "Start here: what this path covers",
    summary: "Help someone see what matters, understand what belongs together, and keep moving when the screen gets smaller or the words get longer.",
    readingMinutes: 4,
    freeSample: true,
    sections: [
      {
        heading: "Who it’s for",
        body: "Beginners with basic interface vocabulary and early-career designers. You should be able to name a user goal, tell a heading from a button, and explain what a component does. You don’t need illustration, coding, advanced typography or a paid tool.",
      },
      {
        heading: "Words this path uses",
        body: "A viewport is the available browser display area, measured here in CSS pixels. A content block has a stable ID and a purpose. Hierarchy is the relative prominence of those blocks. Grouping communicates relationships. Responsive composition changes their arrangement as available space changes. Source order is the programmatic sequence of content, which may differ from the visual arrangement. A working design keeps meaningful relationships across all of these.",
      },
      {
        heading: "What belongs here, and what doesn’t",
        body: "This path covers content priority, visual grouping and emphasis, constrained layout choices, responsive composition, long-text and right-to-left stress, and reasoned verification. Form validation, full interaction-flow design, complete accessibility auditing and design-system governance belong to other paths; here they are constraints, not courses.",
      },
      {
        heading: "How practice works here",
        body: "Read a short lesson, then make a committed choice before you see feedback. Practice is for learning: revise as often as you like. The capstone is a fresh case; try it without hints first. Asking for a hint is always allowed, and the record will show that the attempt was supported.",
      },
      {
        heading: "About the examples",
        body: "Every organisation, person, screen and date in the exercises is a fictional teaching fixture. None of it is participant research or production data. The lesson sequence, fixtures and feedback are proposals awaiting expert review and a learner pilot.",
      },
    ],
    comparisons: [],
    example: {
      title: "Example: the same facts, two routes",
      body: "A workshop page that opens with a photo and a newsletter offer can contain every fact a visitor needs and still make the booking decision hard. The facts didn’t change; their order and grouping did.",
    },
    practiceActivityIds: ["mic-a01-priority"],
  },
  {
    id: "mic-l01-decision",
    title: "Start with a decision",
    skillId: "mic-priority",
    summary: "A clear screen starts with a question someone needs to answer. Write the task in one sentence before choosing sizes or colours.",
    readingMinutes: 4,
    freeSample: true,
    sections: [
      {
        heading: "The question comes first",
        body: "For a workshop booking page, the question might be: can I attend this session, and should I reserve a place? The title identifies the offer. The date, location, price and availability decide whether the action makes sense. A large promotional picture may attract attention without answering any of those questions.",
      },
      {
        heading: "A priority is a hypothesis",
        body: "Separate the information needed for the decision from supporting detail and promotion. This is a priority hypothesis, not evidence that every person reads in the same sequence. Visual hierarchy can suggest a route through content using relative scale, contrast and grouping, but it can’t guarantee attention or comprehension.",
      },
      {
        heading: "Worked reasoning",
        body: "For a free workshop tomorrow, show the workshop name and the eligibility information near Reserve a place, and keep an optional newsletter invitation secondary. If the session is full, the status and the next available action become more important than the usual booking button. The user’s goal, not a permanent brand preference, explains the change.",
      },
      {
        heading: "Try saying",
        body: "For this person to decide X, they need Y before action Z. If you can’t complete that sentence, clarify the brief before decorating the layout.",
      },
      {
        heading: "Source",
        body: "Visual hierarchy as relative prominence through scale, contrast and grouping, with no universal winning layout: Kelley Gordon, Nielsen Norman Group, “Visual Hierarchy in UX: Definition” (2021).",
      },
    ],
    comparisons: [
      {
        title: "What a visitor meets first",
        before: { caption: "Promotion first; the date is not on screen", screen: promoFirst },
        after: { caption: "The decision first; extras after the action", screen: decisionFirst },
        whyItMatters: "Both versions can hold the same content. Only the second answers “can I attend?” before asking for a commitment.",
      },
    ],
    example: {
      title: "Example: when the order should change",
      body: "When the session fills, “Session full” and the waiting list should lead. A Reserve button that no longer works is no longer the most useful thing on the page.",
    },
    practiceActivityIds: ["mic-a01-priority"],
  },
  {
    id: "mic-l02-priority",
    title: "Build a priority without deleting the problem",
    skillId: "mic-priority",
    summary: "Priority and presence answer different questions. A condition may not deserve the largest type, but people still need it before committing.",
    readingMinutes: 4,
    freeSample: false,
    sections: [
      {
        heading: "Cleaner is not the same as clearer",
        body: "A cancellation condition may not deserve the largest type, but a person still needs it before committing. Removing it to create a cleaner page makes the design easier to scan by making the decision less informed.",
      },
      {
        heading: "Three working categories",
        body: "This path uses three teaching labels: decide now, supporting detail, and optional discovery. They are not a universal information architecture. Put each content item into a category, explain its consequence for the task, and note when its priority would change. Required information stays available even when it moves below the first screen: below the fold does not mean absent.",
      },
      {
        heading: "Two decisions compared",
        body: "A decorative photograph can become smaller or disappear if the brief permits it. The session date can’t disappear on a small screen just because it takes space; change the arrangement or the wrapping instead. A good layout balances prominence with completeness.",
      },
      {
        heading: "Before you practise",
        body: "Cover the previous lesson and recall one reason an attractive element might deserve less emphasis. Then reopen it and correct your answer. Recalling a phrase alone doesn’t show the skill; the practice does.",
      },
    ],
    comparisons: [],
    example: {
      title: "Example: supporting, not hidden",
      body: "“Cancel up to 24 hours before the start” can be smaller and quieter than the date, as long as it sits before Reserve. Moving it to a separate help page hides it from exactly the moment it matters.",
    },
    practiceActivityIds: ["mic-a01-priority", "mic-cap01-pickup"],
  },
  {
    id: "mic-l03-spacing",
    title: "Let spacing carry meaning",
    skillId: "mic-grouping",
    summary: "Proximity is a cue for relatedness. If a date sits closer to the next card than to its own title, the layout suggests the wrong relationship.",
    readingMinutes: 4,
    freeSample: false,
    sections: [
      {
        heading: "Gaps say what belongs together",
        body: "Imagine two workshop cards. Each date should belong to its own workshop, not to the card below. If the gap between a title and its date is larger than the gap between that date and the next title, the layout suggests the wrong relationship.",
      },
      {
        heading: "Containers help, and can compete",
        body: "Proximity is a useful cue for relatedness. A shared container can also communicate a group, even when the items inside differ. Neither cue replaces meaningful headings, labels or the underlying structure. A border around every sentence creates many competing regions; it doesn’t automatically clarify anything.",
      },
      {
        heading: "Worked reasoning",
        body: "Keep the session title, date, location, availability and booking action in one session group, with a smaller internal gap than the space between sessions. Put the newsletter in its own section because it serves a different task. A borderless solution with clear spacing can work; so can a contained one. Explain which relationship a cue communicates and whether it still works when the cards stack on a narrow screen.",
      },
      {
        heading: "Sources",
        body: "Proximity as a cue for relatedness, not a required spacing ratio: Aurora Harley, Nielsen Norman Group, “Proximity Principle in Visual Design” (2020). Containers communicate association, and excessive grouping can compete: Aurora Harley, Nielsen Norman Group, “The Principle of Common Region” (2020).",
      },
    ],
    comparisons: [
      {
        title: "Which price belongs to which workshop?",
        before: {
          caption: "Items alternate between the two sessions",
          screen: {
            app: APP,
            title: "Two workshops",
            blocks: [
              { type: "heading", text: "Sketch Your First App" },
              { type: "heading", text: "Design Your First Service" },
              { type: "text", text: "Free" },
              { type: "text", text: "EGP 120" },
              { type: "buttons", buttons: [{ label: "Reserve Sketch", variant: "primary" }, { label: "Reserve Service", variant: "primary" }] },
            ],
          },
        },
        after: {
          caption: "One group per session",
          screen: {
            app: APP,
            title: "Two workshops",
            blocks: [
              { type: "group", framed: true, blocks: [{ type: "heading", text: "Sketch Your First App" }, { type: "text", text: "17 November, 18:00 · Free" }, { type: "buttons", buttons: [{ label: "Reserve Sketch", variant: "primary" }] }] },
              { type: "group", framed: true, blocks: [{ type: "heading", text: "Design Your First Service" }, { type: "text", text: "18 November, 10:00 · EGP 120" }, { type: "buttons", buttons: [{ label: "Reserve Service", variant: "primary" }] }] },
            ],
          },
        },
        whyItMatters: "In the first version, EGP 120 could belong to either session. Grouping carries factual meaning, not just style.",
      },
    ],
    example: {
      title: "Example: a shared action row",
      body: "Two cards with their own titles and prices, but both Reserve buttons in one footer row, look tidy and still leave people guessing which button books which session.",
    },
    practiceActivityIds: ["mic-a02-grouping", "mic-r01-loans"],
  },
  {
    id: "mic-l04-emphasis",
    title: "Give emphasis a job",
    skillId: "mic-grouping",
    summary: "Emphasis is a limited resource. Choose a restrained set of roles, and never make required text faint to reduce competition.",
    readingMinutes: 5,
    freeSample: false,
    sections: [
      {
        heading: "A limited resource",
        body: "If every heading is enormous, every badge bright and every action filled, the important differences are harder to see. Choose a restrained set of relative roles: page title, section title, body text, supporting text, primary action and secondary action. The exact number of sizes is a design choice, not a universal law.",
      },
      {
        heading: "Readable is a constraint",
        body: "For ordinary body text and button labels in these exercises, use the WCAG AA text contrast threshold of 4.5:1. Large text has a 3:1 threshold, and WCAG defines large text as at least 18 point, or 14 point bold. Don’t assume that any bold label qualifies.",
      },
      {
        heading: "Worked reasoning",
        body: "A title can be larger while the date, price and conditions stay readable. Use a filled treatment for Reserve a place and a clear secondary treatment for View access details. Don’t make terms faint to reduce competition. A token can pass contrast and still create poor hierarchy when it is applied to everything.",
      },
      {
        heading: "What a contrast check covers",
        body: "Numerical contrast checks cover one specific requirement, for exact foreground and background pairs. They don’t measure whether people understood the screen.",
      },
      {
        heading: "Sources",
        body: "W3C, Web Content Accessibility Guidelines (WCAG) 2.2, and W3C WAI, “Understanding Success Criterion 1.4.3: Contrast (Minimum)”. Visual hierarchy: Kelley Gordon, Nielsen Norman Group (2021).",
      },
    ],
    comparisons: [
      {
        title: "Two filled buttons, or one",
        before: {
          caption: "Both actions compete",
          screen: { app: APP, title: "Workshop", blocks: [{ type: "heading", text: "Sketch Your First App" }, { type: "buttons", buttons: [{ label: "Reserve a place", variant: "primary" }, { label: "Get the monthly newsletter", variant: "primary" }] }] },
        },
        after: {
          caption: "One primary action, one quieter option",
          screen: { app: APP, title: "Workshop", blocks: [{ type: "heading", text: "Sketch Your First App" }, { type: "buttons", buttons: [{ label: "Reserve a place", variant: "primary" }] }, { type: "link", text: "Get the monthly newsletter" }] },
        },
        whyItMatters: "The newsletter is still easy to find, but it no longer competes with the booking it has nothing to do with.",
      },
    ],
    example: {
      title: "Example: secondary doesn’t mean faint",
      body: "Muted grey #595959 on white is about 7.00:1 and works for a 14px condition. Faint #AAAAAA on white is about 2.32:1 and fails, whether or not the text is bold.",
    },
    practiceActivityIds: ["mic-a03-emphasis"],
  },
  {
    id: "mic-l05-responsive",
    title: "Change the layout and preserve the decision",
    skillId: "mic-responsive",
    summary: "On a narrow screen, stacking sections may be more useful than shrinking columns. The job is to keep the decision understandable in the space available.",
    readingMinutes: 5,
    freeSample: false,
    sections: [
      {
        heading: "Rules, not one screenshot",
        body: "A desktop composition might put a session summary beside a booking panel. On a narrow screen, stacking them may be more useful than shrinking both columns. Responsive design uses layout rules that respond to the available space, not a single screenshot for every device.",
      },
      {
        heading: "Order without the columns",
        body: "Choose a reading order that still makes sense without the visual columns. Keep labels with their values and actions with the information that gives them meaning. Visual rearrangement shouldn’t produce a programmatic sequence that interleaves unrelated sections. More than one reading sequence can be valid when the meaning is preserved.",
      },
      {
        heading: "320 CSS pixels",
        body: "For ordinary vertically scrolling content, WCAG Reflow uses a width equivalent to 320 CSS pixels, without lost information or functionality and without two-dimensional scrolling. The criterion has exceptions for content that needs a two-dimensional layout; simple workshop cards don’t.",
      },
      {
        heading: "Worked reasoning",
        body: "At 360 pixels, stack the title, the decision details and the action; let labels wrap and drop the optional image. Then check 320 pixels too. A 360-pixel preview doesn’t establish reflow. Intermediate widths, real content, enlarged text, source order and focus behaviour all need checking in the implementation; until then, a desktop-to-phone rearrangement is a hypothesis.",
      },
      {
        heading: "Sources",
        body: "Interaction Design Foundation, “Responsive Design Best Practices”. W3C WAI, “Understanding Success Criterion 1.4.10: Reflow” and “Understanding Success Criterion 1.3.2: Meaningful Sequence”.",
      },
    ],
    comparisons: [],
    example: {
      title: "Example: subtract the gutters first",
      body: "A 320px viewport with 16px gutters leaves 288px for content. A two-column preset that needs 360 + 24 + 280 = 664px fits only from a 696px viewport up. That arithmetic belongs to this exercise, not to an industry breakpoint.",
    },
    practiceActivityIds: ["mic-a04-responsive", "mic-r02-appointment"],
  },
  {
    id: "mic-l06-stretch",
    title: "Let real words change the shape",
    skillId: "mic-resilience",
    summary: "Short labels make brittle layouts look successful. Longer titles, locations and translations show whether a layout can adapt.",
    readingMinutes: 5,
    freeSample: false,
    sections: [
      {
        heading: "What fails first",
        body: "Fixed heights, one-line clipping and controls positioned over text often fail first. Let content grow, wrap at sensible boundaries and push the following content down.",
      },
      {
        heading: "Right-to-left is another kind of change",
        body: "Use logical start and end alignment for the main layout, and set the correct language and direction for text. A right-to-left paragraph can contain left-to-right fragments such as a booking code. Keep those fragments as units with appropriate bidirectional isolation. Don’t reverse the characters of a code or blindly mirror every symbol; a date must keep its meaning.",
      },
      {
        heading: "Worked reasoning",
        body: "An Arabic title may wrap over more lines. The action moves below it rather than overlapping it. Code WS-204 stays WS-204, even in an Arabic context. The content order still answers what, when, where and what next. A native Arabic reviewer should check meaning and reading flow; a width checker can’t.",
      },
      {
        heading: "What the Arabic fixture is",
        body: "The Arabic strings in the practice activity are a layout stress case, not a translated course. Keep required facts visible and report any unresolved shaping, font, direction or truncation issue for review. This lesson doesn’t certify localisation quality.",
      },
    ],
    comparisons: [
      {
        title: "A card built for short labels",
        before: {
          caption: "Clipped title, reversed code",
          screen: {
            app: APP,
            title: "Workshop card",
            blocks: [
              { type: "heading", text: "Sketch Your First App for Community Pro…" },
              { type: "field", label: "Booking code", value: "402-SW" },
            ],
          },
        },
        after: {
          caption: "The title wraps, the code keeps its order",
          screen: {
            app: APP,
            title: "Workshop card",
            blocks: [
              { type: "heading", text: "Sketch Your First App for Community Projects and Volunteer Teams" },
              { type: "field", label: "Booking code", value: "WS-204" },
              { type: "buttons", buttons: [{ label: "Reserve a place in this workshop", variant: "primary" }] },
            ],
          },
        },
        whyItMatters: "The second card is taller, and that’s fine: every fact is complete and the code still matches the booking.",
      },
    ],
    example: {
      title: "Example: an identifier is not a word",
      body: "Reversing WS-204 to 402-SW for a right-to-left preview creates a different code. Direction is handled at the level of text runs, not by reversing characters.",
    },
    practiceActivityIds: ["mic-a05-stretch", "mic-r02-appointment"],
  },
  {
    id: "mic-l07-critique",
    title: "Respond to a critique with a consequence",
    skillId: "mic-verification",
    summary: "Design feedback often arrives as a preference. Translate it into a question about the task, and accept, adapt or reject it for a reason you can check.",
    readingMinutes: 4,
    freeSample: false,
    sections: [
      {
        heading: "From preference to question",
        body: "Feedback often sounds like “make it pop”, “move the button up” or “use more space”. Translate it into a question about the task: which information should be easier to find? What error or delay is the change expected to reduce? What new problem could it introduce?",
      },
      {
        heading: "Worked reasoning",
        body: "Suppose a reviewer wants the primary action at the top. That may help someone who already knows the session; it may also let a first-time visitor act without noticing the date. You can keep a clear action while placing the essential decision details beside it. If the benefit is uncertain, compare variants under a specific task rather than debating taste.",
      },
      {
        heading: "What a good response contains",
        body: "The goal, the decision, the expected consequence and a way to check it. It can accept, adapt or reject a suggestion, and it doesn’t need a long defence or a principle name. Separate supplied facts from predictions: “the date comes after the button in the current order” can be inspected; “people will always miss it” is an unsupported generalisation.",
      },
      {
        heading: "Keep a decision log",
        body: "Revise only what the evidence supports, and note why a change exists and what would justify changing it again.",
      },
    ],
    comparisons: [],
    example: {
      title: "Example: adapting a request",
      body: "“Make Reserve the first thing” becomes: keep Reserve prominent, right beside the date, place and price, and keep the cancellation condition before it. The reviewer’s goal is kept; the risk to first-time visitors is avoided.",
    },
    practiceActivityIds: ["mic-a06-critique"],
  },
  {
    id: "mic-l08-check",
    title: "Check what you actually claimed",
    skillId: "mic-verification",
    summary: "A visual inspection can find an overlap or a missing block. It can’t show that people understood the page. Match each claim to the right check.",
    readingMinutes: 4,
    freeSample: false,
    sections: [
      {
        heading: "Two kinds of check",
        body: "Use structural checks for required content, allowed tokens, contrast pairs, width behaviour and meaningful order. Use task-based evaluation for a person’s ability to find, interpret and act on the information. The two complement each other. A quick glance or a blurred preview may help you notice emphasis, but it is not a validated comprehension test.",
      },
      {
        heading: "A focused task",
        body: "For example: “You can only attend after 17:00. Find a suitable workshop and tell me its date, cost and what you can do if plans change.” Observe the chosen session, the explanation, points of hesitation and whether help was needed. Define the correct facts from the fixture before running the task, and don’t count confident speech as correct understanding.",
      },
      {
        heading: "Report what happened, not what you expect",
        body: "Your record should say which checks were run, which were only proposed, and what remains uncertain. No participants have been tested in this path. The capstone asks you to design a check, not to invent results.",
      },
    ],
    comparisons: [],
    example: {
      title: "Example: an honest status line",
      body: "“No results yet. Five sessions may reveal problems but can’t establish how common they are.” This says more, and claims less, than “100% success expected”.",
    },
    practiceActivityIds: ["mic-a06-critique", "mic-cap01-pickup"],
  },
];
