import type { Skill } from "@/domain/types";

export const FLAGSHIP_ID = "calibrated-trust";

export const flagshipSkills: Skill[] = [
  {
    id: "uncertainty",
    name: "Communicate uncertainty appropriately",
    description:
      "Make it clear which values the system inferred, and express uncertainty in terms a person can act on, without decorative or unsupported precision.",
    criteria: [
      {
        id: "unc-distinguish",
        skillId: "uncertainty",
        statement: "Inferred output is visibly distinguished from information a person entered or confirmed.",
        lookFor: "A provisional state, label or placement that survives the views where the value appears.",
      },
      {
        id: "unc-actionable",
        skillId: "uncertainty",
        statement: "Uncertainty is described specifically enough that the user knows what to check, without invented precision.",
        lookFor: "Names the ambiguity or missing information; avoids uncalibrated percentages and blanket disclaimers.",
      },
    ],
  },
  {
    id: "evidence",
    name: "Provide useful evidence and explanations",
    description:
      "Let people inspect what an output is based on, at the point where they decide, with explanations that refer to this output rather than to the system in general.",
    criteria: [
      {
        id: "evi-source",
        skillId: "evidence",
        statement: "The source supporting an output can be inspected where the decision is made.",
        lookFor: "Quote, highlight or link to the specific part of the source; not a generic ‘made by AI’ note.",
      },
      {
        id: "evi-specific",
        skillId: "evidence",
        statement: "Explanations are specific to this output and proportionate to the decision.",
        lookFor: "Says why this value or action was proposed and what was left out; avoids marketing copy and raw model traces.",
      },
    ],
  },
  {
    id: "correction",
    name: "Enable correction and recovery",
    description:
      "Make it cheap to correct an output where it appears, and provide recovery after commitment that matches what the change affected.",
    criteria: [
      {
        id: "cor-inplace",
        skillId: "correction",
        statement: "Users can correct the output directly, with effort proportionate to a small fix.",
        lookFor: "Edit or choose an alternative in place; not ‘regenerate and hope’ or a trip to settings.",
      },
      {
        id: "cor-recovery",
        skillId: "correction",
        statement: "Recovery after commitment matches what the change affected and how late problems are discovered.",
        lookFor: "Undo for small changes; selective revert or delayed send where effects spread or leave the product.",
      },
    ],
  },
  {
    id: "commitment",
    name: "Choose appropriate confirmation and commitment behaviour",
    description:
      "Match when and how a proposal is committed to its impact, reach and reversibility, and make confirmations state what will actually happen.",
    criteria: [
      {
        id: "com-proportionate",
        skillId: "commitment",
        statement: "The commitment step is proportionate to the impact and reversibility of the change.",
        lookFor: "Light commitment for private, reversible edits; deliberate review for broad, external or irreversible effects.",
      },
      {
        id: "com-consequence",
        skillId: "commitment",
        statement: "Confirmations state the specific consequences: what changes, for whom, and what cannot be undone.",
        lookFor: "Scope, affected people and exceptions are visible before commitment; not ‘Are you sure?’.",
      },
    ],
  },
];
