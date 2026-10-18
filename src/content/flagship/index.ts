import { CONTENT_FORMAT_VERSION, type PathBundle } from "@/domain/types";
import { benchBooking, benchDeadline, benchInvoice, benchPricing, benchSummary } from "./bench";
import { critiqueArchive, critiqueExpenses, critiqueInsight, critiqueRecap } from "./critique";
import { scenarioCalendar, scenarioReplan, scenarioTriage } from "./decision";
import { flagshipExplore } from "./explore";
import { FLAGSHIP_ID, flagshipSkills } from "./skills";

export { FLAGSHIP_ID };

export const flagshipBundle: PathBundle = {
  formatVersion: CONTENT_FORMAT_VERSION,
  meta: {
    id: FLAGSHIP_ID,
    title: "Calibrated Trust in AI Interfaces",
    summary:
      "Design AI features people rely on when they should and check when they need to: uncertainty, evidence, correction and commitment, practised on realistic product screens.",
    topic: "AI interfaces",
    level: "Intermediate",
    estimatedHours: 4,
    icon: "shield",
    cover: "rings",
    outcomes: [
      "Present inferred values so they are never mistaken for confirmed data.",
      "Describe uncertainty in terms people can act on, without invented precision.",
      "Attach evidence and explanations that support the decision at hand.",
      "Design correction and recovery that match what a change affects.",
      "Choose commitment and confirmation steps that fit impact and reversibility.",
    ],
    audience: "Product and UX designers, and product managers, working on features that use AI to propose, extract or change information.",
    prerequisites: "Comfort with common interface patterns such as forms, lists, dialogs and notifications. No machine-learning background needed.",
    availability: "full",
    freeSampleActivityIds: ["bench-deadline", "critique-recap"],
  },
  skills: flagshipSkills,
  requiredSkillIds: flagshipSkills.map((s) => s.id),
  explore: flagshipExplore,
  activities: [
    benchDeadline,
    critiqueRecap,
    scenarioReplan,
    benchSummary,
    critiqueArchive,
    benchBooking,
    scenarioTriage,
    critiqueExpenses,
    benchInvoice,
    critiqueInsight,
    scenarioCalendar,
    benchPricing,
  ],
  reviewNotes: [
    "The claim that uncalibrated confidence percentages mislead users is presented as design guidance. It should be reviewed by a subject-matter expert before publication; no research citation is included.",
    "The statement that repeated confirmation dialogs lead people to click through them is presented as common practitioner guidance. Expert review needed.",
    "Scenario outcomes (for example ‘60% accepted after three days’) are fictional illustrations, not data.",
    "The two-contexts mastery rule is a prototype assumption, not a validated standard.",
  ],
};
