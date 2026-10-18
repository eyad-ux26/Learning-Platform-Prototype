# Stakeholder walkthrough (about 25 minutes)

Start the app (`npm run dev`) and open http://localhost:3000. All people and data are fictional and stay in your browser. **Demo controls** (bottom-right link in the footer, or `/demo`) switch scenarios and reset data.

## 1. First impression as a new free learner (Maya) · 3 min
1. On **Home**, note the one-paragraph product explanation, the **Recommended next** card, and the library. Each card shows skills to demonstrate, separate **Skills mastered** and **Lessons viewed** counts, and whether it is a free sample, a subscription path or a **Preview** path.
2. Search for "zzz" to see the no-results state, then use **Reset search and filters**.
3. Open **Calibrated Trust in AI Interfaces**. Review the outcomes, audience, the estimate label, required skills with status, **What completion requires**, and the free sample boundaries. Practice is available straight away; Explore is optional.

## 2. Design Bench: deadline from an ambiguous message · 6 min (journeys A and C)
1. Select **Start with practice**. Read the brief: the fixed scenario date (Tue 10 Mar 2026), the message, and the constraints.
2. Select **Submit response** before choosing anything to see how incomplete responses are handled.
3. Make choices and watch the Planwise preview change. Use it: **View source**, choose **Fri, 20 Mar**, **Accept**, then **Undo**. The "What happened (simulation)" log shows consequences such as notifications.
4. Submit. Feedback is organised by criterion: what worked, what needs improvement, what in your response supports it, the practical consequence, and a specific next activity.

## 3. Learner needing more practice (Priya) · 5 min (journey B)
1. In Demo controls, switch to **Learner with a skill gap**.
2. Open **Moving a client’s appointment** (path overview → practice). Choose one-tap Accept, “Found a better time” and the 10-second Undo, then submit.
3. Feedback names the unmet criteria and recommends a **different context** (the bulk price update), plus **Read: Confirmation and commitment**. Follow the explanation link: a banner offers **Return to the activity** with the response saved.
4. Complete the recommended activity, then open **Skills and evidence** to see the new context counted and the full activity history.

## 4. Returning learner (Daniel) · 2 min (journey D)
Switch to **Returning subscriber**. **Continue learning** resumes the half-finished summary activity with earlier choices and the open source panel restored. Change an option and refresh: it persists.

## 5. Free learner meets a paid activity · 2 min (journey E)
Switch back to **Maya**, open **Replanning 214 tasks after a slip**, then **Review subscription**. Pricing is clearly placeholder. **Simulate annual upgrade** returns you to the same activity. Under **Account**, try the simulated cancellation (access continues to an illustrative period end).

## 6. Decision Scenario · 3 min
In **Replanning 214 tasks**, compare the first decision (a private, reversible draft title) with the bulk replan. Choosing "apply automatically" branches to a client-incident follow-up. The debrief explains impact, reversibility and uncertainty.

## 7. Administrator and content reviewer · 6 min (journeys F and G)
1. Switch to **Administrator (Sam)** and open **Admin workspace**.
2. **Overview**: fictional seeded metrics with definitions and a date range, separated from local demo events. Use **Show as tables** for an accessible view.
3. **Paths → Calibrated Trust**: edit the summary and **Save draft**. On Home, the library still shows the published text. **Preview** shows the draft. **Publish** with a note; the library now shows the change and **Versions** records it. Existing enrollments stay on v1 and see a notice offering to move.
4. **Content and skills**: edit Explore text and order, review skill criteria, read the **Coverage map**, and open an activity to edit its choices and feedback, then **Preview with real renderer**.
5. **Import**: load the invalid example to see validation block publication; load the valid example and preview its activity.
6. Switch to **Editor (Lena)**: editing and preview work, publishing is disabled.

## What to look for
- Does completion-by-evidence feel fair and clear?
- Do the three activity types feel like professional practice rather than quizzes?
- Is feedback specific and useful?
- Are free, subscription and "not included in this prototype" boundaries always clear?
- Open product questions are listed in `docs/assumptions-and-decisions.md`.
