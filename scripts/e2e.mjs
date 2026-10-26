/**
 * Browser journeys for the stakeholder prototype.
 * Usage: start the app (npm run dev or npm start), then `npm run e2e`.
 * Env: BASE_URL (default http://localhost:3000), CHROMIUM_PATH (optional), SHOTS=0 to skip screenshots.
 */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOT_DIR = new URL("../docs/screenshots/", import.meta.url).pathname;
const SHOTS = process.env.SHOTS !== "0";
const candidates = [process.env.CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (SHOTS) mkdirSync(SHOT_DIR, { recursive: true });

const results = [];
const errors = [];
let page;

function check(cond, msg) {
  if (!cond) throw new Error(msg);
}
async function shot(name, opts = {}) {
  await page.waitForTimeout(350); // let entrance transitions settle
  if (SHOTS) await page.screenshot({ path: `${SHOT_DIR}${name}.png`, ...opts });
}
async function go(path, { keepBrief = false } = {}) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.locator("h1").first().waitFor();
  // A fresh activity opens on its brief; say it has been read so the workspace is usable.
  if (!keepBrief && path.includes("/practice/")) await readBrief();
}
async function readBrief() {
  const read = page.getByRole("button", { name: /I’ve read the brief|قرأت الطلب|قريت الطلب/ });
  if (!(await read.count())) return;
  await read.click();
  await page.getByRole("dialog", { name: /New brief|طلب جديد/ }).waitFor({ state: "detached" });
}
async function switchTo(firstName) {
  await go("/demo");
  const btn = page.getByRole("button", { name: `Switch to ${firstName}` });
  if (await btn.count()) await btn.click();
  await page.getByText(new RegExp(`Open learner app as ${firstName}`)).waitFor();
}
async function journey(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`✗ ${name}\n    ${e.message}`);
    await shot(`FAILED-${name.replace(/\W+/g, "-")}`).catch(() => {});
  }
}
// Two-step language control: pick the language, then (for Arabic) the dialect.
const LANG_ATTR = { en: "en", ar: "ar", "ar-EG": "ar-EG", "ar-GULF": "ar-AE" };
const DIALECT_NAME = { ar: /الفصحى/, "ar-EG": /المصرية/, "ar-GULF": /الخليجية/ };
async function setLang(kind) {
  await page.getByRole("button", { name: /Language|اللغة/ }).first().click();
  if (kind === "en") await page.getByRole("radio", { name: "English", exact: true }).click();
  else {
    const arabic = page.getByRole("radio", { name: "العربية", exact: true });
    if ((await arabic.getAttribute("aria-checked")) !== "true") await arabic.click();
    await page.getByRole("radio", { name: DIALECT_NAME[kind] }).click();
  }
  await page.waitForFunction((l) => document.documentElement.lang === l, LANG_ATTR[kind]);
}
const radio = (re) => page.getByRole("radio", { name: re });
// Design Bench shows one decision at a time; jump through the layers list until the option is on screen.
async function reveal(re) {
  const layers = page.getByRole("list", { name: "Decisions" }).getByRole("button");
  const n = await layers.count();
  for (let i = 0; i < Math.max(n, 1); i++) {
    if (await radio(re).count()) return radio(re);
    if (n) await layers.nth(i).click();
  }
  return radio(re);
}
const pick = async (re) => (await reveal(re)).locator("xpath=ancestor::label").click();
const isPicked = async (re) => (await reveal(re)).isChecked();

const browser = await chromium.launch({ executablePath });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && !/favicon|404/.test(m.text()) && errors.push(m.text()));

// Fresh data for a deterministic run.
await go("/demo");
await page.evaluate(() => localStorage.clear());
await go("/");
await shot("01-home-new-learner", { fullPage: true });

await journey("1. Complete an activity and inspect its feedback", async () => {
  await switchTo("Maya");
  await go("/paths/calibrated-trust");
  await shot("02-path-overview", { fullPage: true });
  await go("/paths/calibrated-trust/practice/bench-deadline");
  // Submit and Save and exit stay on screen without scrolling.
  for (const name of ["Submit response", "Save and exit"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    check(box && box.y + box.height <= 900, `${name} should be visible without scrolling`);
  }
  // Incomplete submission is handled clearly.
  await page.getByRole("button", { name: "Submit response" }).click();
  await page.getByText("Your response is incomplete").waitFor();
  await pick(/Pre-fill the field in a distinct/);
  await pick(/Name the ambiguity/);
  await pick(/View source.*opens the message/);
  await pick(/Choose between the two candidate Fridays/);
  await pick(/Apply when the user selects Accept/);
  await pick(/Undo toast plus revertible history/);
  // Use the interactive preview.
  await page.getByRole("button", { name: "View source", exact: true }).click();
  await page.getByText("Hey Ana").waitFor();
  await page.getByRole("button", { name: "Fri, 20 Mar" }).click();
  await shot("03-design-bench-preview");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await page.getByText("What happened (simulation)").waitFor();
  await page.getByRole("button", { name: "Undo", exact: true }).first().click();
  await page.getByText(/User selected Undo/).waitFor();
  await page.getByRole("button", { name: "Submit response" }).click();
  await page.locator("#feedback-heading").waitFor();
  check(await page.getByText("What worked").isVisible(), "feedback should show what worked");
  check((await page.getByText("6 of 6 criteria met").count()) === 1, "all six criteria should be met");
  await shot("04-feedback-success", { fullPage: true });
});

await journey("2. Fail a criterion and receive an alternative challenge", async () => {
  await switchTo("Priya");
  await go("/paths/calibrated-trust/practice/bench-booking");
  await pick(/One-tap “Accept” on the suggestion/);
  await pick(/“Found a better time”/);
  await pick(/10-second “Undo” that restores the calendar/);
  await page.getByRole("button", { name: "Submit response" }).click();
  await page.locator("#feedback-heading").waitFor();
  check(await page.getByText("What needs improvement").isVisible(), "should list improvements");
  const next = page.locator("#fb-next").locator("..");
  const nextTitle = await next.locator("p.font-medium").first().textContent();
  check(nextTitle && !/Moving a client/.test(nextTitle), `recommendation should be a different activity, got ${nextTitle}`);
  check(await next.getByText(/different context/).isVisible(), "recommendation should explain the different context");
  await shot("05-feedback-gap-recommendation", { fullPage: true });
  // Relevant explanation with contextual return.
  await next.getByRole("link", { name: /Read:/ }).click();
  await page.getByText(/You came here from “Moving a client’s appointment”/).waitFor();
  await shot("06-explore-contextual-return");
  await page.getByRole("link", { name: "Return to the activity" }).click();
  await page.getByRole("heading", { name: "Moving a client’s appointment" }).waitFor();
  // Take the recommended alternative and get updated evidence.
  await go("/paths/calibrated-trust/practice/bench-pricing");
  await pick(/Full before\/after list/);
  await pick(/Staged review/);
  await pick(/“Revert this batch” for 30 days/);
  await page.getByRole("button", { name: "Submit response" }).click();
  await page.locator("#feedback-heading").waitFor();
  await go("/paths/calibrated-trust/skills");
  const commitment = page.locator("section", { has: page.getByRole("heading", { name: "Choose appropriate confirmation and commitment behaviour" }) });
  check(await commitment.getByText("AI-proposed bulk catalogue update").isVisible(), "new context should be listed as evidence");
  check((await page.getByText("Duplicate · no new evidence").count()) === 0, "no duplicates expected");
  await shot("07-skills-updated-evidence", { fullPage: true });
});

await journey("3. Refresh and resume an unfinished response", async () => {
  await switchTo("Daniel");
  await go("/");
  await page.getByRole("link", { name: /^Resume/ }).first().click();
  await page.waitForURL(/practice\/bench-summary/);
  await page.getByRole("heading", { name: "A summary at the top of a policy" }).waitFor();
  check(await isPicked(/Insert it as a labelled ‘Assistant draft’ block/), "saved selection should be restored");
  await pick(/List the sections used and those left out/);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "A summary at the top of a policy" }).waitFor();
  check(await isPicked(/List the sections used and those left out/), "new selection should survive refresh");
  check(await page.getByText("Remote work policy v3 — §4.2 Equipment").isVisible(), "preview state (open source) should survive");
  await shot("08-resumed-after-refresh");
});

await journey("4. Simulate an upgrade and return to the original activity", async () => {
  await switchTo("Maya");
  await go("/paths/calibrated-trust/practice/scenario-replan");
  await page.getByText("Subscription required").waitFor();
  await shot("09-locked-activity");
  await page.getByRole("link", { name: "Review subscription" }).click();
  await page.getByText("You’ll go straight back").waitFor();
  await shot("10-subscription-plans", { fullPage: true });
  await page.getByRole("button", { name: /Simulate annual upgrade/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Simulate upgrade" }).click();
  await page.waitForURL(/practice\/scenario-replan/);
  await page.getByRole("heading", { name: "Replanning 214 tasks after a slip" }).waitFor();
  check(await page.getByText(/A small change first/).first().isVisible(), "the activity should be playable after upgrade");
  await shot("11-returned-after-upgrade");
});

await journey("5. Edit, preview and publish admin content", async () => {
  const marker = "Now with a worked example for each skill.";
  await switchTo("Sam");
  await go("/admin/paths/calibrated-trust");
  const summary = page.getByRole("textbox", { name: "Summary" });
  await summary.fill((await summary.inputValue()) + " " + marker);
  await page.getByText("Unsaved changes").first().waitFor();
  await page.getByRole("button", { name: "Save draft" }).first().click();
  await shot("12-admin-path-editor", { fullPage: true });
  await go("/");
  check((await page.getByText(marker).count()) === 0, "learners must not see unpublished draft edits");
  await go("/admin/preview/calibrated-trust");
  check(await page.getByText(marker).isVisible(), "preview should show the saved draft");
  await shot("13-admin-preview");
  await go("/admin/paths/calibrated-trust");
  await page.getByRole("button", { name: "Publish" }).first().click();
  await page.getByLabel("Change note").fill("Clarified summary");
  await page.getByRole("dialog").getByRole("button", { name: /Publish version 2/ }).click();
  await page.getByText("Published version 2").waitFor();
  await go("/paths/calibrated-trust");
  check(await page.getByText(marker).isVisible(), "learner path page should show the published change");
  await go("/admin/versions");
  check(await page.getByText("Clarified summary").isVisible(), "version history should record the note");
  // Activity editor with real renderer preview.
  await go("/admin/content/critique-recap");
  await page.getByRole("tab", { name: "Preview with real renderer" }).click();
  await page.getByText("Interface under review").waitFor();
  await shot("14-admin-activity-preview");
});

await journey("6. Switch learners without mixing progress", async () => {
  await switchTo("Tomás");
  await go("/paths/calibrated-trust/skills");
  const tomas = await page.getByText(/of 4 required skills are not Mastered|Every required skill/).first().textContent();
  const tomasAttempts = await page.locator("#history").locator("..").locator("p").first().textContent();
  await switchTo("Maya");
  await go("/paths/calibrated-trust/skills");
  const mayaAttempts = await page.locator("#history").locator("..").locator("p").first().textContent();
  check(tomasAttempts !== mayaAttempts, `attempt counts should differ (${tomasAttempts} vs ${mayaAttempts})`);
  await switchTo("Tomás");
  await go("/paths/calibrated-trust/skills");
  check((await page.locator("#history").locator("..").locator("p").first().textContent()) === tomasAttempts, "Tomás should be unchanged");
  check(tomas.includes("1 of 4"), `Tomás should have one skill remaining, got: ${tomas}`);
  await shot("15-near-complete-skills", { fullPage: true });
});

await journey("G. Content reviewer inspects coverage before publication", async () => {
  await switchTo("Lena");
  await go("/admin/content?tab=coverage");
  check(await page.getByText("4 contexts · sufficient").first().isVisible().catch(() => false) || (await page.getByText(/contexts · sufficient/).count()) === 4, "coverage should be shown for four skills");
  await shot("16-coverage-map", { fullPage: true });
  await go("/admin/import");
  await page.getByRole("button", { name: "Load invalid example" }).click();
  await page.getByText(/publication will be blocked|Cannot be imported/).waitFor();
  await shot("17-import-validation");
  await go("/admin/paths/calibrated-trust");
  check(await page.getByRole("button", { name: "Publish" }).first().isDisabled(), "editors should not be able to publish");
});

// Responsive review screenshots.
await journey("H. Switch to Arabic, work in right-to-left, switch back", async () => {
  await go("/");
  await setLang("ar");
  check((await page.evaluate(() => document.documentElement.dir)) === "rtl", "Arabic should be right-to-left");
  check(await page.getByRole("heading", { name: "كل المسارات" }).isVisible(), "home heading should be Arabic");
  await shot("18-arabic-home");
  await go("/paths/calibrated-trust/practice/bench-deadline");
  await page.getByText(/^طلب العميل ·/).waitFor();
  await page.locator("fieldset label").first().click();
  await page.getByRole("button", { name: /القرار التالي/ }).waitFor();
  await shot("19-arabic-workspace");
  // Critique: the reason picker must list reasons in Arabic (machine values are never translated).
  await go("/paths/calibrated-trust/practice/critique-recap");
  const radios = () => page.locator("input[type=radio]").count();
  const before = await radios();
  await page.locator("label").filter({ has: page.locator("input[type=radio]") }).nth(1).click();
  await page.waitForTimeout(300);
  check((await radios()) > before + 2, "critique reason list should not be empty in Arabic");
  // Egyptian variant
  await setLang("ar-EG");
  await go("/");
  await shot("20-egyptian-home");
  await go("/paths/calibrated-trust/practice/bench-deadline");
  await page.locator("fieldset label").first().click();
  await shot("21-egyptian-workspace");
  // Gulf variant: dialect text differs from Modern Standard Arabic, the choice sticks across pages.
  await setLang("ar-GULF");
  await go("/");
  await shot("20b-gulf-home");
  check((await page.evaluate(() => document.documentElement.lang)) === "ar-AE", "Gulf dialect should be applied");
  // The choice survives a language switch: stored data is English, only the display changes.
  await setLang("en");
  check((await page.evaluate(() => document.documentElement.dir)) === "ltr", "English should be left-to-right");
  // Switching back to Arabic restores the last dialect.
  await page.getByRole("button", { name: /Language|اللغة/ }).first().click();
  await page.getByRole("radio", { name: "العربية", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.lang === "ar-AE");
  await page.keyboard.press("Escape");
  await setLang("en");
  await go("/paths/calibrated-trust/practice/bench-deadline");
  check(await page.getByText("Client brief").isVisible(), "workspace should return to English");
  check((await page.locator("fieldset input:checked").count()) + (await page.locator("ol[aria-label='Decisions'] button").count()) > 0, "decisions should still render");
});

await journey("I. Critique one element at a time, then open the ship review tickets", async () => {
  await go("/paths/calibrated-trust/practice/critique-recap");
  // Start clean: earlier journeys may have left a draft here.
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("button", { name: "Reset response" }).click();
  await shot("22-critique-working");
  for (let i = 0; i < 8; i++) {
    await page.getByText(new RegExp(`Element ${i + 1} of 8`)).waitFor();
    // Reasons appear only after a verdict (progressive disclosure).
    check((await page.locator('input[name^="reason-"]').count()) === 0, "reasons should appear after the verdict");
    await page.locator("label").filter({ hasText: i % 2 ? "Works for the reader" : "Needs a change" }).click();
    await page.locator('label:has(input[name^="reason-"])').first().click();
    // Each judgement is checked right away: a verdict, then one example from the screen.
    await page.getByRole("button", { name: "Check answer" }).click();
    await page.getByText(/^(Judged right|Not quite)$/).first().waitFor();
    check(await page.getByText("On this screen").isVisible(), "feedback should show an example from the screen");
    if (i === 0) await shot("22b-critique-step-feedback");
    if (i < 7) await page.getByRole("button", { name: /Next element/ }).click();
  }
  await page.getByRole("button", { name: "Submit response" }).click();
  await page.locator("#feedback-heading").waitFor();
  check(await page.getByText("JUDGED RIGHT", { exact: true }).isVisible(), "ship review should show the judged-right card");
  check(await page.getByText("Element by element").isVisible(), "ship review should list element tickets");
  const open = page.locator("details, [aria-expanded='true']").first();
  check(await open.isVisible(), "a ticket should be open and highlighted");
  await shot("23-critique-ship-review", { fullPage: true });
});

await switchTo("Priya");
await journey("J. Decision scenario as a chat, then the route tickets", async () => {
  await go("/paths/calibrated-trust/practice/scenario-replan");
  await shot("24-decision-working");
  for (let i = 0; i < 6; i++) {
    const decide = page.getByRole("button", { name: /^Decide/ });
    if (!(await decide.count())) break;
    await page.locator('label:has(input[type=radio])').first().click();
    await decide.click();
    // Feedback after every decision: the verdict and what happens, before moving on.
    await page.getByText(/^(Holds up|Doesn’t hold up|Noted)$/).first().waitFor();
    check(await page.getByText("What happens", { exact: true }).isVisible(), "decision feedback should show what happens");
    if (i === 0) await shot("24b-decision-step-feedback");
    const next = page.getByRole("button", { name: "Next decision" });
    if (await next.count()) await next.click();
    await page.waitForTimeout(200);
  }
  await page.getByRole("button", { name: "Submit response" }).click();
  await page.locator("#feedback-heading").waitFor();
  check(await page.getByText("HELD UP", { exact: true }).isVisible(), "ship review should show the held-up card");
  check(await page.getByText(/Your route/).isVisible(), "ship review should list the route tickets");
  await shot("25-decision-ship-review", { fullPage: true });
});

await journey("L. Finish a path, earn the badge and share the certificate", async () => {
  await switchTo("Tomás");
  await go("/");
  check(await page.getByText("You are here", { exact: true }).isVisible(), "home should say where the learner is");
  check(await page.getByRole("list", { name: "Path map" }).isVisible(), "home should show the path map");
  await go("/paths/calibrated-trust/certificate");
  check(await page.getByText("Master all 4 skills to earn it.").isVisible(), "the certificate should be locked before completion");
  await go("/paths/calibrated-trust/practice/scenario-replan");
  // A route where every decision holds up: commitment is met in a new context, so the path completes.
  for (const id of ["inline", "staged", "revert-selected", "label"]) {
    await page.locator(`input[value="${id}"]`).locator("xpath=..").click();
    await page.getByRole("button", { name: /^Decide/ }).click();
    await page.getByText("Holds up", { exact: true }).waitFor();
    const next = page.getByRole("button", { name: /Next decision|See results/ });
    await next.click();
  }
  await page.locator("#feedback-heading").waitFor();
  check(await page.getByText("4 of 4 held up").isVisible(), "the result should count the held-up decisions");
  check(await page.getByRole("img", { name: /^Path complete:/ }).isVisible(), "completing the path should award the badge");
  await shot("26-path-complete-result", { fullPage: true });
  await page.getByRole("link", { name: "Get your certificate" }).click();
  await page.getByText("Tomás Lindqvist", { exact: true }).waitFor();
  // LinkedIn opens pre-filled with the certification; capture the link instead of leaving the app.
  await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  await page.getByRole("button", { name: /Add to LinkedIn profile/ }).click();
  const opened = await page.evaluate(() => window.__opened[0] ?? "");
  check(/^https:\/\/www\.linkedin\.com\/profile\/add\?/.test(opened) && opened.includes("startTask=CERTIFICATION_NAME"), `LinkedIn add-to-profile link expected, got ${opened}`);
  check(await page.getByText(/Prototype certificate · not an accredited or verified credential/).isVisible(), "the certificate should say it is a prototype");
  await shot("27-certificate", { fullPage: true });
  // The shared link shows the same certificate to someone else.
  const code = await page.locator("#certificate dd").nth(1).textContent();
  await switchTo("Maya");
  await go(`/paths/calibrated-trust/certificate?n=${encodeURIComponent("Tomás Lindqvist")}&d=2026-10-26&c=${code}`);
  check(await page.getByText("A shared certificate").isVisible(), "a shared link should be labelled as shared");
  check(await page.getByText("Tomás Lindqvist", { exact: true }).isVisible(), "a shared link should show the learner's name");
});

await journey("Responsive layouts (1024 and 390)", async () => {
  await switchTo("Priya");
  for (const [w, h, tag] of [[1024, 900, "tablet"], [390, 844, "mobile"]]) {
    await page.setViewportSize({ width: w, height: h });
    await go("/");
    await shot(`r-${tag}-home`);
    await go("/paths/calibrated-trust/practice/critique-recap");
    if (tag === "tablet") {
      await page.getByRole("tab", { name: "Review" }).click();
      check(await page.getByText("Interface under review").isVisible(), "tablet shows response and interface side by side");
    }
    if (tag === "mobile") {
      check(await page.getByRole("tab", { name: "Live" }).isVisible(), "mobile workspace should use Brief / Live tabs");
      await page.getByRole("tab", { name: "Live" }).click();
      const screen = page.getByRole("group", { name: /interface preview/i });
      // Tuck the sheet away to see the whole preview, then pick an element in it: the sheet comes back with that question.
      await page.getByRole("button", { name: "Review", exact: true }).click();
      await screen.getByRole("button", { name: /Element 3/ }).click();
      // The question for the selected element is in the bottom sheet, with state preserved.
      await page.getByText("Element 3 of 8").waitFor();
      await page.locator("label").filter({ hasText: "Needs a change" }).click();
      check(await screen.getByRole("button", { name: /Element 3: .*marked problematic/ }).isVisible(), "interface should keep the review mark");
    }
    await shot(`r-${tag}-workspace`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
});

await journey("K. Phone: the interface keeps the screen and Next stays in reach", async () => {
  await page.setViewportSize({ width: 390, height: 800 });
  await switchTo("Tomás");
  await go("/paths/calibrated-trust/practice/bench-deadline", { keepBrief: true });
  // The brief opens on its own first; once read, the designer replies and the brief moves into its tab.
  check(await page.getByRole("dialog", { name: /New brief/ }).isVisible(), "a fresh activity should open on its brief");
  await readBrief();
  check(await page.getByRole("tab", { name: "Live" }).getAttribute("aria-selected") === "true", "after reading, the phone should show the interface");
  await page.getByRole("tab", { name: "Brief" }).click();
  check(await page.getByText(/Got it\. I’ll make the calls/).isVisible(), "the brief should keep the designer's reply");
  await page.getByRole("tab", { name: "Live" }).click();
  const fits = () => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1);
  check(await fits(), "the workspace should not scroll the page");
  const next = page.getByRole("button", { name: /Next decision/ }).last();
  check(await next.isVisible(), "the primary action should be visible with the question open");
  const handle = page.getByRole("button", { name: "Decisions", exact: true });
  check((await handle.getAttribute("aria-expanded")) === "true", "the question should start open");
  await page.locator("fieldset label").first().click();
  await page.waitForFunction(() => document.querySelector("button[aria-expanded]")?.getAttribute("aria-expanded") === "false");
  const preview = page.getByRole("group", { name: /interface preview/i });
  const box = await preview.boundingBox();
  check(box && box.height > 300, `the interface should get most of the screen once a choice is made (${box?.height})`);
  check(await next.isVisible(), "Next should stay visible after choosing");
  await shot("r-mobile-bench-collapsed");
  await next.click();
  await page.getByText(/step 2 of 6/).waitFor();
  check((await handle.getAttribute("aria-expanded")) === "true", "the next question should open");
  check(await fits(), "the page should still not scroll");
  await page.setViewportSize({ width: 1440, height: 900 });
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} journeys passed.`);
if (errors.length) console.log(`Browser errors:\n  ${[...new Set(errors)].join("\n  ")}`);
process.exit(failed.length || errors.length ? 1 : 0);
