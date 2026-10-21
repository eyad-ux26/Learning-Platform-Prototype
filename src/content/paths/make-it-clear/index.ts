import { CONTENT_FORMAT_VERSION, type PathBundle } from "@/domain/types";
import { micCapstone, micReviewAppointment, micReviewLoans } from "./capstone";
import { micExplore } from "./explore";
import { micCritique, micEmphasis, micGrouping, micPriority, micResponsive, micStretch } from "./practice";
import { MIC_ID, micSkills } from "./skills";

/** PATH-010 “Make It Clear” (path file version 1.0, 21 October 2026). Authored for review; production approval is pending. */
export const makeItClearBundle: PathBundle = {
  formatVersion: CONTENT_FORMAT_VERSION,
  meta: {
    id: MIC_ID,
    title: "Make It Clear",
    summary:
      "Visual hierarchy and responsive composition: help people see what matters, understand what belongs together, and keep moving when the screen gets smaller or the words get longer.",
    topic: "Visual hierarchy",
    level: "Introductory",
    estimatedHours: 2.5,
    icon: "layers",
    cover: "grid",
    outcomes: [
      "Choose prominence from a user goal and the decision it needs.",
      "Communicate relationships through grouping and emphasis.",
      "Preserve content and meaningful order across widths.",
      "Handle longer content and right-to-left text without losing facts.",
      "Explain tradeoffs and verify their consequences honestly.",
    ],
    audience: "Beginners with basic interface vocabulary, and early-career designers.",
    prerequisites: "Be able to name a user goal, tell a heading from a button, and explain what a component does. No illustration, coding, advanced typography or paid tool needed.",
    availability: "full",
    freeSampleActivityIds: ["mic-a01-priority"],
  },
  skills: micSkills,
  requiredSkillIds: micSkills.map((s) => s.id),
  explore: micExplore,
  activities: [micPriority, micGrouping, micEmphasis, micResponsive, micStretch, micCritique, micCapstone, micReviewLoans, micReviewAppointment],
  reviewNotes: [
    "Path file PATH_010 v1.0 is authored for user and expert review; production approval is pending. Lesson sequence, fixtures, feedback and thresholds beyond the cited standards are proposals, not validated instruction.",
    "The path file specifies open responses (priority board, bounded layout editor, comparison and test-plan fields). This version renders them as authored choices in the existing Decision Scenario and Critique templates; free-text reasons, confidence ratings and the 0–3 rubric are not captured.",
    "Rubric mapping: a criterion counts as met when the response reaches level 2 (“meets this case”) in the path rubric. Level 3 (“handles the tradeoff”) is not distinguished.",
    "Completion follows the platform rule (every skill Mastered in two contexts), not the path file’s rule (all practice attempted and the capstone submitted). Workshop practice counts as one context; the capstone and reviews add others.",
    "Delayed reviews R01 and R02 are proposed for about 3 and 10 days after the capstone; this prototype does not schedule or lock them. Capstone answer notes are not locked until submission.",
    "Acceptable elements in “Let the words stretch” (the whole date, the wrapping condition) were added for the Critique format; the path file lists only the failures.",
    "Arabic and Egyptian translations are a first, unreviewed pass. The path file asks for native-language review before an Arabic release and says not to mark the path approved automatically.",
    "Source references are the path file’s own register, checked by the author on 21 October 2026; they were not re-verified for this implementation.",
  ],
};
