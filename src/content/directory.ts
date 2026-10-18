/**
 * Fictional user directory and SEEDED, FICTIONAL analytics for the admin workspace.
 * None of these numbers come from real usage, and local interactions do not change them.
 */
import type { Role } from "@/domain/types";

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: "free" | "subscriber" | "expired";
  joined: string;
  lastActive: string;
  summary: string;
}

const names = [
  ["Ines Carvalho", "free", "Tried 2 free samples"],
  ["Kwame Mensah", "subscriber", "Calibrated Trust: 2 of 4 skills Mastered"],
  ["Hana Kobayashi", "subscriber", "Calibrated Trust: completed"],
  ["Oliver Brandt", "free", "Viewed path overview only"],
  ["Zainab Yusuf", "subscriber", "Calibrated Trust: 1 of 4 skills Mastered"],
  ["Lucas Moreau", "expired", "Calibrated Trust: 3 of 4 skills Mastered"],
  ["Amara Eze", "subscriber", "Started Calibrated Trust"],
  ["Felix Novak", "free", "Tried 1 free sample"],
  ["Sofia Rossi", "subscriber", "Calibrated Trust: completed"],
  ["Arjun Mehta", "subscriber", "Calibrated Trust: 2 of 4 skills Mastered"],
  ["Elif Demir", "free", "Tried 3 free samples"],
  ["Mateo García", "subscriber", "Started Calibrated Trust"],
  ["Nadia Petrova", "expired", "Calibrated Trust: 1 of 4 skills Mastered"],
  ["Chen Wei", "subscriber", "Calibrated Trust: 4 of 4 skills Mastered"],
  ["Grace Mwangi", "free", "No activity yet"],
  ["Jonas Berg", "subscriber", "Calibrated Trust: 2 of 4 skills Mastered"],
  ["Leila Haddadi", "free", "Tried 1 free sample"],
  ["Rafael Costa", "subscriber", "Started Calibrated Trust"],
] as const;

export const directoryUsers: DirectoryUser[] = names.map(([name, plan, summary], i) => ({
  id: `dir-${i + 1}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.test`,
  role: "learner",
  plan,
  joined: `2026-0${1 + (i % 2)}-${String(3 + i).padStart(2, "0")}`,
  lastActive: `2026-03-${String(1 + (i % 9)).padStart(2, "0")}`,
  summary,
}));

export type RangeId = "7d" | "30d" | "90d";

export const analyticsRanges: { id: RangeId; label: string; window: string }[] = [
  { id: "7d", label: "Last 7 days", window: "2–8 Mar 2026" },
  { id: "30d", label: "Last 30 days", window: "7 Feb–8 Mar 2026" },
  { id: "90d", label: "Last 90 days", window: "9 Dec 2025–8 Mar 2026" },
];

export interface SeededAnalytics {
  activeLearners: number;
  activePrev: number;
  sampleStarters: number;
  converted: number;
  participation: { pathId: string; title: string; learners: number }[];
  mastery: { skill: string; notYet: number; developing: number; mastered: number }[];
  dropoff: { activity: string; started: number; submitted: number }[];
}

export const seededAnalytics: Record<RangeId, SeededAnalytics> = {
  "7d": {
    activeLearners: 412,
    activePrev: 388,
    sampleStarters: 156,
    converted: 19,
    participation: [
      { pathId: "calibrated-trust", title: "Calibrated Trust in AI Interfaces", learners: 301 },
      { pathId: "usability-foundations", title: "Usability Foundations (sample)", learners: 88 },
      { pathId: "interaction-design-decisions", title: "Interaction Design Decisions (sample)", learners: 54 },
      { pathId: "research-synthesis", title: "Research Synthesis (sample)", learners: 41 },
      { pathId: "information-architecture", title: "Information Architecture (sample)", learners: 37 },
    ],
    mastery: [
      { skill: "Communicate uncertainty", notYet: 96, developing: 128, mastered: 77 },
      { skill: "Evidence and explanations", notYet: 110, developing: 121, mastered: 70 },
      { skill: "Correction and recovery", notYet: 139, developing: 109, mastered: 53 },
      { skill: "Confirmation and commitment", notYet: 162, developing: 98, mastered: 41 },
    ],
    dropoff: [
      { activity: "A deadline from an ambiguous message", started: 244, submitted: 201 },
      { activity: "Review an AI meeting recap", started: 198, submitted: 171 },
      { activity: "Replanning 214 tasks after a slip", started: 121, submitted: 79 },
      { activity: "A summary at the top of a policy", started: 104, submitted: 88 },
      { activity: "Review a bulk archive confirmation", started: 96, submitted: 83 },
    ],
  },
  "30d": {
    activeLearners: 1288,
    activePrev: 1104,
    sampleStarters: 611,
    converted: 84,
    participation: [
      { pathId: "calibrated-trust", title: "Calibrated Trust in AI Interfaces", learners: 934 },
      { pathId: "usability-foundations", title: "Usability Foundations (sample)", learners: 302 },
      { pathId: "interaction-design-decisions", title: "Interaction Design Decisions (sample)", learners: 188 },
      { pathId: "research-synthesis", title: "Research Synthesis (sample)", learners: 141 },
      { pathId: "information-architecture", title: "Information Architecture (sample)", learners: 133 },
    ],
    mastery: [
      { skill: "Communicate uncertainty", notYet: 251, developing: 402, mastered: 281 },
      { skill: "Evidence and explanations", notYet: 288, developing: 389, mastered: 257 },
      { skill: "Correction and recovery", notYet: 360, developing: 351, mastered: 223 },
      { skill: "Confirmation and commitment", notYet: 431, developing: 317, mastered: 186 },
    ],
    dropoff: [
      { activity: "A deadline from an ambiguous message", started: 802, submitted: 671 },
      { activity: "Review an AI meeting recap", started: 655, submitted: 574 },
      { activity: "Replanning 214 tasks after a slip", started: 402, submitted: 266 },
      { activity: "A summary at the top of a policy", started: 351, submitted: 300 },
      { activity: "Review a bulk archive confirmation", started: 330, submitted: 284 },
    ],
  },
  "90d": {
    activeLearners: 2906,
    activePrev: 2210,
    sampleStarters: 1544,
    converted: 231,
    participation: [
      { pathId: "calibrated-trust", title: "Calibrated Trust in AI Interfaces", learners: 2087 },
      { pathId: "usability-foundations", title: "Usability Foundations (sample)", learners: 705 },
      { pathId: "interaction-design-decisions", title: "Interaction Design Decisions (sample)", learners: 448 },
      { pathId: "research-synthesis", title: "Research Synthesis (sample)", learners: 339 },
      { pathId: "information-architecture", title: "Information Architecture (sample)", learners: 310 },
    ],
    mastery: [
      { skill: "Communicate uncertainty", notYet: 512, developing: 803, mastered: 772 },
      { skill: "Evidence and explanations", notYet: 590, developing: 781, mastered: 716 },
      { skill: "Correction and recovery", notYet: 744, developing: 720, mastered: 623 },
      { skill: "Confirmation and commitment", notYet: 902, developing: 664, mastered: 521 },
    ],
    dropoff: [
      { activity: "A deadline from an ambiguous message", started: 1810, submitted: 1522 },
      { activity: "Review an AI meeting recap", started: 1490, submitted: 1301 },
      { activity: "Replanning 214 tasks after a slip", started: 930, submitted: 611 },
      { activity: "A summary at the top of a policy", started: 801, submitted: 690 },
      { activity: "Review a bulk archive confirmation", started: 742, submitted: 640 },
    ],
  },
};

export const metricDefinitions = {
  active: "Distinct learners with at least one Explore view or activity submission in the range.",
  conversion: "Of learners who started a free sample in the range, the share who began a subscription within 14 days.",
  participation: "Distinct learners who started at least one activity in the path during the range.",
  mastery: "Status of each flagship skill for learners enrolled in the path, at the end of the range.",
  dropoff: "Learners who opened an activity versus those who submitted at least one response.",
};
