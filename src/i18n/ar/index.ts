import rewards from "./ui-rewards";
import { registerArabic } from "../core";
import shell from "./ui-shell";
import learner from "./ui-learner";
import activities from "./ui-activities";
import preview from "./ui-preview";
import domain from "./domain";
import f1 from "./content-flagship-1";
import f2 from "./content-flagship-2";
import f3 from "./content-flagship-3";
import f4 from "./content-flagship-4";
import f5 from "./content-flagship-5";
import words from "./words";
import review from "./ui-review";
import library from "./content-library";
import home from "./ui-home";
import makeItClear from "./path-make-it-clear";

registerArabic(rewards, makeItClear, home, review, words, f1, f2, f3, f4, f5, library, domain, preview, activities, learner, shell);
