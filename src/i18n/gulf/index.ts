import { registerGulf } from "../core";
import home from "./ui-home";

// Gulf (Khaleeji) layer: entries here win over the Modern Standard Arabic base; anything missing falls back to it.
registerGulf(home);
