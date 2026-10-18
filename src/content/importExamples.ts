import { clone } from "@/domain/catalog";
import type { PathBundle } from "@/domain/types";
import { libraryBundles } from "./library";

/** A valid example in the import format: a preview path with one free sample activity. */
export function validImportExample(): PathBundle {
  const b = clone(libraryBundles[0]);
  b.meta.id = "accessible-forms";
  b.meta.title = "Accessible Forms";
  b.meta.summary = "Design forms that everyone can complete: labels, errors, focus order and recovery.";
  b.meta.topic = "Foundations";
  b.meta.outcomes = ["Write labels and instructions that work with assistive technology.", "Design error handling that helps people recover.", "Plan focus order and keyboard operation."];
  b.meta.plannedModules = ["Labels and instructions", "Errors and recovery", "Keyboard and focus"];
  b.meta.cover = "waves";
  b.meta.icon = "book";
  const a = b.activities[0];
  a.id = "af-checkout-errors";
  a.pathId = b.meta.id;
  b.meta.freeSampleActivityIds = [a.id];
  return b;
}

/** An invalid example: a FULL path whose skill lacks coverage and whose references are broken. */
export function invalidImportExample(): PathBundle {
  const b = validImportExample();
  b.meta.id = "accessible-forms-broken";
  b.meta.title = "Accessible Forms (invalid example)";
  b.meta.availability = "full";
  b.activities[0].pathId = b.meta.id;
  b.activities[0].relatedConcepts = ["missing-concept"];
  b.meta.freeSampleActivityIds = ["does-not-exist"];
  return b;
}
