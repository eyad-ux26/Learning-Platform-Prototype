import type { Skill } from "@/domain/types";

/** PATH-010 “Make It Clear”. One skill per path competency (C1–C5 of PATH-010-RUB01). */
export const MIC_ID = "make-it-clear";

export const micSkills: Skill[] = [
  {
    id: "mic-priority",
    name: "Set priority from the user’s goal",
    description: "Choose what leads from the decision a person needs to make, and keep every fact that decision depends on.",
    criteria: [
      {
        id: "mic-c1-complete",
        skillId: "mic-priority",
        statement: "Every fact the decision depends on stays available before the person commits.",
        lookFor: "Date, place, price, availability and conditions stay on the decision route; supporting is not permission to omit.",
      },
      {
        id: "mic-c1-prominence",
        skillId: "mic-priority",
        statement: "Prominence follows the user’s goal, and the learner can name a condition that would change it.",
        lookFor: "Decision facts lead before promotion and before the action; a changed need (a full session, an access need) changes the order.",
      },
    ],
  },
  {
    id: "mic-grouping",
    name: "Show relationships with grouping and emphasis",
    description: "Make it clear which facts and actions belong together, and give each element a distinct role without shouting.",
    criteria: [
      {
        id: "mic-c2-association",
        skillId: "mic-grouping",
        statement: "Facts and actions are grouped with the item they belong to, and the grouping survives a narrow screen.",
        lookFor: "No price, date or action sits with the wrong item; spacing or containers reinforce the same relationship; groups stack whole.",
      },
      {
        id: "mic-c2-roles",
        skillId: "mic-grouping",
        statement: "Emphasis is given by role: one clear primary action, distinct type roles, optional items quieter.",
        lookFor: "Not everything large, bold or filled; the primary action is distinguishable by role and label.",
      },
    ],
  },
  {
    id: "mic-responsive",
    name: "Keep the meaning across widths",
    description: "Choose layout rules that fit the available space and keep a meaningful order, without dropping required content.",
    criteria: [
      {
        id: "mic-c3-fit",
        skillId: "mic-responsive",
        statement: "Layout rules fit the usable width at every required viewport, and calculated fit is kept separate from rendered checks.",
        lookFor: "Subtracts gutters, respects minimum column widths, includes 320px, and does not claim a rendered result from arithmetic.",
      },
      {
        id: "mic-c3-order",
        skillId: "mic-responsive",
        statement: "The reading order stays meaningful and no required content is hidden to make the layout fit.",
        lookFor: "Decision facts before the action, optional blocks last; only optional content may hide.",
      },
    ],
  },
  {
    id: "mic-resilience",
    name: "Let content stretch without losing facts",
    description: "Handle longer text, right-to-left text and readable contrast so that every required fact and identifier survives.",
    criteria: [
      {
        id: "mic-c4-preserve",
        skillId: "mic-resilience",
        statement: "Longer and right-to-left content keeps every required fact and identifier intact.",
        lookFor: "Auto height, wrapping, the action in normal flow, logical alignment, and codes kept as left-to-right runs.",
      },
      {
        id: "mic-c4-readable",
        skillId: "mic-resilience",
        statement: "Required text meets the stated contrast threshold, including supporting text.",
        lookFor: "Ordinary 14px and 16px text at 4.5:1 or more; secondary does not mean faint.",
      },
    ],
  },
  {
    id: "mic-verification",
    name: "Reason about tradeoffs and check them",
    description: "Tie each decision to a consequence for the user, and plan checks that separate predictions from observations.",
    criteria: [
      {
        id: "mic-c5-consequence",
        skillId: "mic-verification",
        statement: "Design decisions and responses to critique are tied to a consequence for the user’s task.",
        lookFor: "Accepts, adapts or rejects a request with a task-based reason, not taste or seniority.",
      },
      {
        id: "mic-c5-check",
        skillId: "mic-verification",
        statement: "Checks express the user’s goal, define the correct facts, and report nothing that has not been observed.",
        lookFor: "A task that does not point at the answer, expected facts defined in advance, and no invented results.",
      },
    ],
  },
];
