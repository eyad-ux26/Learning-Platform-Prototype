/**
 * Learning paths authored from path files (PATH_0XX). Each path lives in its own folder and is registered here,
 * after the flagship and the library samples, in catalogue order.
 */
import type { PathBundle } from "@/domain/types";
import { makeItClearBundle } from "./make-it-clear";

export const authoredBundles: PathBundle[] = [makeItClearBundle];
