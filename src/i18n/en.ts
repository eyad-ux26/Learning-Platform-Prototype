/**
 * User-facing interface strings (English). Learning content lives in content fixtures.
 * Kept in one place so an Arabic (RTL) catalogue can be added later.
 * Layout uses logical properties (ms-/me-/ps-/pe-, start/end) for the same reason.
 */
export const PRODUCT_NAME = "Skillbench";

export const en = {
  product: {
    name: PRODUCT_NAME,
    tagline: "Practical, mastery-based learning for product and UX design.",
    prototypeNote: "Stakeholder prototype · fictional data · nothing leaves this browser",
  },
  nav: {
    home: "Home",
    library: "Library",
    skills: "Skills",
    account: "Account",
    admin: "Admin workspace",
    demo: "Demo controls",
    backToLearning: "Back to learning",
    skip: "Skip to content",
  },
  status: {
    "not-demonstrated": "Not yet demonstrated",
    developing: "Developing",
    mastered: "Mastered",
  },
  access: {
    free: "Free sample",
    included: "Included with subscription",
    locked: "Subscription required",
    notIncluded: "Not included in this prototype",
  },
  practice: {
    submit: "Submit response",
    reset: "Reset",
    saveExit: "Save and exit",
    help: "Help",
    showHint: "Show a hint",
    revealSolution: "Reveal a solution",
    incomplete: "Your response is incomplete",
    savedLocally: "Progress saved in this browser",
    targetSkills: "Skills assessed",
  },
  rule: {
    short: "A skill is Mastered when you meet its criteria in two different contexts, including at least one attempt without hints or a revealed solution.",
    details: [
      "Lessons help you learn, but viewing them is not evidence.",
      "Repeating a challenge or a context you already used does not add a new context.",
      "Submitting an identical response again is recorded but adds no evidence.",
      "Revealing a solution makes that attempt practice-only.",
      "Using a hint still counts, but not as an independent attempt.",
      "Later unsuccessful attempts stay in your history. Mastery is kept, and more practice is recommended.",
      "This is a provisional prototype rule, not a validated educational standard.",
    ],
  },
};

export type Strings = typeof en;
export const t = en;
