/**
 * Typed, versioned content and learner-record definitions.
 * Everything here is plain data so it can be validated, imported as JSON,
 * and evaluated outside React.
 */

export const CONTENT_FORMAT_VERSION = 1 as const;

export type SkillId = string;
export type CriterionId = string;
export type ActivityId = string;
export type ConceptId = string;
export type PathId = string;

export type Level = "Introductory" | "Intermediate" | "Advanced";
export type Availability = "full" | "preview";

// ---------- Skills ----------

export interface Criterion {
  id: CriterionId;
  skillId: SkillId;
  /** What the learner must demonstrate, written as an observable behaviour. */
  statement: string;
  /** Short reviewer-facing note on what counts as meeting the criterion. */
  lookFor: string;
}

export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  criteria: Criterion[];
}

// ---------- Interface preview blocks (shared by Critique, Decision and Explore) ----------

export type BlockTone = "neutral" | "ai" | "warn" | "danger" | "success" | "info";

export type Block =
  | { type: "appbar"; app: string; title: string; hotspot?: string }
  | { type: "heading"; text: string; hotspot?: string }
  | { type: "text"; text: string; muted?: boolean; hotspot?: string }
  | { type: "badge"; text: string; tone: BlockTone; hotspot?: string }
  | { type: "field"; label: string; value: string; note?: string; ai?: boolean; hotspot?: string }
  | { type: "quote"; text: string; cite?: string; hotspot?: string }
  | { type: "list"; items: { primary: string; secondary?: string; meta?: string; tone?: BlockTone; hotspot?: string }[]; hotspot?: string }
  | { type: "buttons"; buttons: { label: string; variant: "primary" | "secondary" | "ghost" | "danger" }[]; hotspot?: string }
  | { type: "banner"; tone: BlockTone; text: string; hotspot?: string }
  | { type: "table"; columns: string[]; rows: string[][]; hotspot?: string; /** Optional hotspot id per row, aligned with `rows`, so single rows can be highlighted. */ rowHotspots?: (string | undefined)[] }
  | { type: "meter"; label: string; value: number; hotspot?: string }
  | { type: "checkbox"; label: string; checked: boolean; hotspot?: string }
  | { type: "link"; text: string; hotspot?: string }
  | { type: "dialog"; title: string; blocks: Block[]; hotspot?: string }
  | { type: "toast"; text: string; action?: string; hotspot?: string }
  | { type: "group"; blocks: Block[]; hotspot?: string; framed?: boolean };

export interface Screen {
  app: string;
  title: string;
  blocks: Block[];
  /** The device the live preview is drawn in (wide screens only). Defaults to a laptop. */
  device?: Device;
}

export type Device = "laptop" | "tablet" | "phone";

// ---------- Activities ----------

export type ActivityTemplate = "design-bench" | "critique" | "decision";

export interface ActivityBase {
  id: ActivityId;
  pathId: PathId;
  template: ActivityTemplate;
  title: string;
  /** Short, learner-facing description of the product situation. */
  contextLabel: string;
  /**
   * Distinct challenge context. Two activities with the same contextKey count
   * as ONE context for mastery, even if they are separate variants.
   */
  contextKey: string;
  kind: "baseline" | "alternative";
  /** For alternatives: the baseline this activity offers different practice for. */
  alternativeFor?: ActivityId;
  estimatedMinutes: number;
  scenario: string;
  task: string;
  constraints: string[];
  /**
   * The brief as a short chat from the client. When absent, the workspace builds it from `scenario` and `task`.
   * `scenario`, `task` and `constraints` stay the full record (locked view, admin, help).
   */
  brief?: ClientBrief;
  /** Criteria this activity assesses. Skills are derived from the criteria. */
  criteria: CriterionId[];
  relatedConcepts: ConceptId[];
  hints: string[];
  /** Shown only when the learner chooses to reveal it (makes the attempt practice-only). */
  solution: string;
}

export interface ClientBrief {
  /** Who is writing, e.g. "Riverside Workshops team". */
  from: string;
  /** Short messages from the client, in order. */
  messages: string[];
  /** The main ask: shown last and highlighted. */
  ask: string;
}

// Design Bench --------------------------------------------------------------

export type DesignDimension =
  | "presentation"
  | "uncertainty"
  | "evidence"
  | "explanation"
  | "correction"
  | "commitment"
  | "recovery"
  | "scope";

/** Behaviour tokens the shared preview knows how to render. */
export type Behaviour =
  // presentation
  | "as-fact" | "chip" | "provisional"
  // uncertainty
  | "none" | "percent" | "generic" | "specific"
  // evidence
  | "tooltip" | "quote" | "source" | "reason" | "trace"
  // correction
  | "regenerate" | "inline-edit" | "alternatives" | "settings"
  // commitment
  | "auto" | "accept" | "dialog" | "on-save" | "review" | "typed"
  // recovery
  | "undo" | "history" | "undo-history" | "delayed-send" | "rollback"
  // scope
  | "count" | "sample" | "diff";

export interface DesignOption {
  id: string;
  label: string;
  behaviour: Behaviour;
  /** Neutral description of the tradeoff, shown while choosing. */
  tradeoff: string;
  /** What happens for the end user with this choice; used in feedback. */
  consequence: string;
}

export interface DesignDecision {
  id: string;
  dimension: DesignDimension;
  prompt: string;
  options: DesignOption[];
}

export interface Condition {
  decision: string;
  oneOf: string[];
}

export interface CriterionRule {
  criterionId: CriterionId;
  /** Passes when ANY group has ALL its conditions true. */
  passWhen: Condition[][];
  /** Decisions whose selections are quoted back as evidence in feedback. */
  evidenceFrom: string[];
  pass: string;
  fail: string;
}

export interface ProposalPreviewConfig {
  app: string;
  screenTitle: string;
  breadcrumb?: string;
  recordTitle: string;
  recordFields: { label: string; value: string }[];
  proposal: {
    kind: "field" | "text" | "change" | "bulk";
    label: string;
    value: string;
    /** ISO date for editable date proposals. */
    valueIso?: string;
    alternatives?: { label: string; iso?: string }[];
    percentText?: string;
    genericText: string;
    specificText: string;
    quote?: string;
    reasonText?: string;
    tooltipText?: string;
    source: { title: string; meta: string; body: string; highlight?: string };
    impactText: string;
    scopeCount?: string;
    scopeRows?: string[][];
    scopeColumns?: string[];
    scopeExcluded?: string;
    reviewMessage?: string;
    typedPhrase?: string;
  };
}

export interface DesignBenchActivity extends ActivityBase {
  template: "design-bench";
  preview: ProposalPreviewConfig;
  decisions: DesignDecision[];
  rules: CriterionRule[];
}

// Critique ----------------------------------------------------------------

export type Verdict = "acceptable" | "problematic";

export interface CritiqueReason {
  id: string;
  label: string;
  appliesTo: Verdict;
}

export interface Hotspot {
  id: string;
  label: string;
  verdict: Verdict;
  correctReasons: string[];
  criterionId: CriterionId;
  explanation: string;
  improvement: string;
}

export interface CritiqueActivity extends ActivityBase {
  template: "critique";
  screen: Screen;
  hotspots: Hotspot[];
  reasons: CritiqueReason[];
}

// Decision Scenario ---------------------------------------------------------

export interface DecisionChoice {
  id: string;
  label: string;
  detail: string;
  consequence: string;
  /** Per-criterion signal produced by choosing this option. */
  signals: { criterionId: CriterionId; met: boolean; because: string }[];
  /**
   * Parts of the node's screen this choice touches. While the learner considers the option, these hotspots are
   * highlighted in the preview with the given tag ("12 client dates"). Hotspot ids refer to blocks of `node.screen`.
   * The optional fields let the preview apply the change, so the learner sees the screen after the option.
   */
  affects?: Affect[];
  next?: string;
}

export interface Affect {
  hotspot: string;
  tag: string;
  /** Moves the block to this position at the top of the screen (1 = first, after the app bar). */
  place?: number;
  /** Moves the block just before the block with this hotspot. */
  before?: string;
  /** Moves the block to the end of the screen. */
  toEnd?: boolean;
  /** Removes the block from the screen. */
  hide?: boolean;
}

export interface DecisionNode {
  id: string;
  title: string;
  situation: string;
  prompt: string;
  facts?: { label: string; value: string }[];
  screen?: Screen;
  choices: DecisionChoice[];
}

export interface DecisionActivity extends ActivityBase {
  template: "decision";
  start: string;
  nodes: DecisionNode[];
  /** Plain-language explanation of impact, reversibility and uncertainty. */
  debrief: { impact: string; reversibility: string; uncertainty: string };
}

export type Activity = DesignBenchActivity | CritiqueActivity | DecisionActivity;

// ---------- Explore ----------

export interface Comparison {
  title: string;
  before: { caption: string; screen: Screen };
  after: { caption: string; screen: Screen };
  whyItMatters: string;
}

export interface VideoLesson {
  title: string;
  /** Local asset path when one exists. When absent, a labelled placeholder is shown. */
  src?: string;
  plannedLength: string;
  transcript: { at: string; text: string }[];
  storyboard: { frame: number; visual: string; narration: string }[];
}

export interface ExploreConcept {
  id: ConceptId;
  title: string;
  skillId?: SkillId;
  summary: string;
  readingMinutes: number;
  freeSample: boolean;
  sections: { heading: string; body: string }[];
  comparisons: Comparison[];
  example: { title: string; body: string };
  video?: VideoLesson;
  practiceActivityIds: ActivityId[];
}

// ---------- Paths ----------

export type CoverId = "grid" | "rings" | "steps" | "nodes" | "layers" | "waves";
export type IconId = "shield" | "eye" | "pointer" | "layers" | "network" | "compass" | "book" | "sparkle";

export interface PathMeta {
  id: PathId;
  title: string;
  summary: string;
  topic: string;
  level: Level;
  estimatedHours: number;
  icon: IconId;
  cover: CoverId;
  outcomes: string[];
  audience: string;
  prerequisites: string;
  availability: Availability;
  freeSampleActivityIds: ActivityId[];
  /** For preview-only paths: planned content shown as "not included in this prototype". */
  plannedModules?: string[];
}

export interface PathBundle {
  formatVersion: typeof CONTENT_FORMAT_VERSION;
  meta: PathMeta;
  skills: Skill[];
  /** Skills that must be Mastered for completion. Defaults to all skills. */
  requiredSkillIds: SkillId[];
  explore: ExploreConcept[];
  activities: Activity[];
  reviewNotes?: string[];
}

export interface PublishedVersion {
  version: number;
  publishedAt: string;
  publishedBy: string;
  note: string;
  bundle: PathBundle;
}

export type CatalogStatus = "draft" | "published" | "unpublished" | "archived";

export interface CatalogEntry {
  pathId: PathId;
  status: CatalogStatus;
  versions: PublishedVersion[];
  /** Working copy. Learners never see it. */
  draft?: PathBundle;
  draftUpdatedAt?: string;
}

// ---------- Learner records ----------

export type Role = "learner" | "editor" | "admin";

export type AccessState =
  | { plan: "free" }
  | { plan: "subscriber"; billing: "monthly" | "annual"; since: string; periodEnd: string; cancelAtPeriodEnd: boolean }
  | { plan: "expired"; endedAt: string };

export interface Enrollment {
  pathId: PathId;
  contentVersion: number;
  startedAt: string;
}

export type ActivityResponse =
  | { template: "design-bench"; selections: Record<string, string> }
  | { template: "critique"; reviews: Record<string, { verdict?: Verdict; reason?: string; note?: string }> }
  | { template: "decision"; choices: { nodeId: string; choiceId: string }[] };

export interface CriterionResult {
  criterionId: CriterionId;
  skillId: SkillId;
  met: boolean;
  /** What in the response supports the judgement. */
  evidence: string[];
  feedback: string;
  consequence?: string;
}

export interface SkillResult {
  skillId: SkillId;
  met: boolean;
  criteria: CriterionId[];
}

export interface Evaluation {
  activityId: ActivityId;
  criteria: CriterionResult[];
  skills: SkillResult[];
  /** Template-specific detail for the feedback screen. */
  detail?: CritiqueDetail | DecisionDetail;
}

export interface CritiqueDetail {
  kind: "critique";
  correctlyIdentified: string[];
  missed: string[];
  wronglyFlagged: string[];
  wrongReason: string[];
  correctlyAccepted: string[];
}

export interface DecisionDetail {
  kind: "decision";
  steps: { nodeId: string; choiceId: string; consequence: string }[];
}

export interface Attempt {
  id: string;
  activityId: ActivityId;
  pathId: PathId;
  contentVersion: number;
  submittedAt: string;
  responseHash: string;
  response: ActivityResponse;
  hintsUsed: boolean;
  solutionRevealed: boolean;
  /** True when an identical response for this activity was already submitted. */
  duplicateOf?: string;
  evaluation: Evaluation;
}

export interface EvidenceItem {
  id: string;
  attemptId: string;
  skillId: SkillId;
  activityId: ActivityId;
  contextKey: string;
  contentVersion: number;
  met: boolean;
  /** No hints and no revealed solution. */
  independent: boolean;
  /** Solution revealed: kept in history, never counts toward mastery. */
  practiceOnly: boolean;
  at: string;
}

export interface WorkDraft {
  activityId: ActivityId;
  contentVersion: number;
  response: ActivityResponse;
  /** UI state such as preview interactions or current scenario step. */
  ui: Record<string, unknown>;
  hintsUsed: boolean;
  solutionRevealed: boolean;
  updatedAt: string;
}

export interface LearnerPreferences {
  explanationsFirst: boolean;
  reducedMotion: boolean;
  weeklyGoalMinutes: number;
  captions: boolean;
  /** Interface sound cues. Treated as on when absent (older saved data). */
  sound?: boolean;
  /** Interface and content language. Stored data stays English; Arabic is applied at display time. */
  language?: "en" | "ar" | "ar-EG" | "ar-GULF";
  /** The Arabic dialect last used, so switching back from English restores it. */
  lastArabic?: "ar" | "ar-EG" | "ar-GULF";
}

export interface LearnerRecord {
  id: string;
  scenarioId: string;
  name: string;
  email: string;
  title: string;
  role: Role;
  access: AccessState;
  preferences: LearnerPreferences;
  enrollments: Record<PathId, Enrollment>;
  attempts: Attempt[];
  evidence: EvidenceItem[];
  drafts: Record<ActivityId, WorkDraft>;
  viewedConcepts: Record<string, string>;
  lastLocation?: { href: string; label: string; at: string };
}
