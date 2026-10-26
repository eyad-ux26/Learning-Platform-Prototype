import rewards from "./ui-rewards";
import { registerGulf } from "../core";
import review from "./ui-review";
import ui1 from "./ui-1";
import ui2 from "./ui-2";
import domain from "./domain";
import library from "./library";
import c1 from "./content-1";
import c2 from "./content-2";
import c3 from "./content-3";
import c4 from "./content-4";
import c5 from "./content-5";
import home from "./ui-home";

// Gulf layer: entries here win over the Modern Standard Arabic base; anything missing falls back to it.
registerGulf(rewards, home, review, c1, c2, c3, c4, c5, library, domain, ui1, ui2);
