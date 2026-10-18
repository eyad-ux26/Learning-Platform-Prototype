/**
 * Prototype access rules. DEMONSTRATION ONLY: production must enforce
 * entitlements on the server; anything in the browser can be bypassed.
 */
import type { AccessState, ActivityId, ExploreConcept, PathMeta } from "./types";

export function isSubscriptionActive(access: AccessState, now: Date = new Date()): boolean {
  if (access.plan !== "subscriber") return false;
  if (!access.cancelAtPeriodEnd) return true;
  return new Date(access.periodEnd).getTime() > now.getTime();
}

export function canAccessActivity(access: AccessState, meta: PathMeta, activityId: ActivityId, now?: Date): boolean {
  return isSubscriptionActive(access, now) || meta.freeSampleActivityIds.includes(activityId);
}

export function canAccessConcept(access: AccessState, concept: ExploreConcept, now?: Date): boolean {
  return isSubscriptionActive(access, now) || concept.freeSample;
}

export function accessLabel(access: AccessState, now?: Date): string {
  if (access.plan === "free") return "Free samples";
  if (access.plan === "expired") return "Subscription ended";
  if (!isSubscriptionActive(access, now)) return "Subscription ended";
  return access.cancelAtPeriodEnd ? "Subscribed · cancels at period end" : `Subscribed · ${access.billing}`;
}

export function addPeriod(start: Date, billing: "monthly" | "annual"): Date {
  const d = new Date(start);
  if (billing === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}
