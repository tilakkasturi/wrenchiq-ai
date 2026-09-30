# WrenchIQ — Feature Feedback Scratchpad
`next-gen/docs/market_research`

Customer feedback on shop management systems, collected for tracking potential new features.

---

## Raw Feedback Log

<!-- Paste customer feedback below. Suggested format per entry:

### [Customer/Source] — [Date]
- Context: (who they are, what shop mgmt system they currently use)
- Feedback: (verbatim or summarized)
- Pain point:
- Feature implication:

-->

### Tekmetric User Group (Facebook) — ~Sep 2025 (post 12mo old as of Sep 2026)
- Context: Shop owner wanting to know the average age of the vehicles they work on — another ad hoc question with no predefined report. 5 reactions, 4 comments.
- Feedback: "Is there a report I can run to figure out the average age of the cars we work on?" Comment highlight (the workaround): "Not exactly a direct answer but you may be able to pull an export of all ROs into an excel file, then the column that contains the year, you can make it its own column. From there, you can make a formula that is basically =2025- the cell that contains the [year] of the vehicle, and put those values in their own column. This column will contain the age of every vehicle in each RO. From there, you can run the AVERAGE formula in excel against that column, and boom - there's your answer."
- Pain point: Another example of the same core gap: no predefined report answers a basic ad hoc business question (here, average vehicle age serviced), forcing a manual RO export + spreadsheet formula workaround.
- Feature implication: Additional evidence for the ad hoc reporting/chat feature idea already logged — "what's the average age of the vehicles we work on?" is exactly the kind of question a shop should be able to just ask WrenchIQ directly instead of exporting to Excel and building formulas.

### Tekmetric User Group (Facebook) — ~Sep 2025 (post 1y old as of Sep 2026)
- Context: Shop owner using the "300% rule" (a labor-rate/markup pricing method) asking how long it takes others to write estimates — trying to get faster. 7 likes, 25 comments.
- Feedback: "Those of you that are doing the 300% rule, how long is it taking you to write your estimates I'm trying to be more efficient but it seems like it takes an hour to write all of it up." Comment highlights: "What's the 300 rule again? Kick customers into the abyss?" / "Hours. Some days, with maybe 15 European car appointments, easily 5 hours of my day were dedicated to quoting. Canned jobs are great, but not practical when you're quoting actual work on vehicles. It's a super pain in the ass. If you're actually to the point I was, where almost all of your day was dedicated to estimates, do yourself a favor and just get a parts person."
- Pain point: Writing estimates for real, non-canned repair work (as opposed to templated "canned jobs") is extremely time-consuming — up to an hour per estimate, and up to 5 hours/day for a busy service advisor with a mix of custom work (e.g. European vehicles). Canned/templated estimate tools don't help once the job isn't a standard cookie-cutter repair. The only workaround suggested is hiring a dedicated parts person.
- Feature implication: AI-assisted estimate builder for custom/non-canned repair jobs — auto-generate line items (labor + parts) from the actual diagnosis/complaint by pulling the labor guide and parts catalog, instead of an advisor manually building each estimate from scratch. Directly reinforces the "native AI agent for estimating + parts ordering" feature idea already logged — this is the concrete time cost (hours/day) that idea would eliminate.

### Tekmetric User Group (Facebook) — ~Apr 2026 (post 5mo old as of Sep 2026)
- Context: Shop owner asking how others handle repairs that need a final test drive to confirm the fix (e.g. emission or cooling issue) after the vehicle sits overnight and is retested the next morning. 1 like, 8 comments.
- Feedback: "How does everyone handle jobs that need a final test drive to confirm the repairs? Such as an emission or cooling issue that requires the vehicle to sit overnight and be retested the next morning? Since the original job is already marked completed, we have created a canned job 'Final Test Drive' at no charge so we can assign it to the technician when it is time for him to do that."
- Pain point: No native workflow for a repair that isn't actually done until a delayed re-test (overnight soak + morning test drive) confirms it. The RO/job gets marked "completed" prematurely, so the shop has to hack around it with a fake $0 "Final Test Drive" canned job just to have something to assign to a tech and to avoid releasing an unverified vehicle. Real risk: a vehicle could get released before the repair is actually confirmed fixed.
- Feature implication: FLAGGED AS A GOOD REQUIREMENT. Native support for a "pending final verification" job/RO state — for repairs that require a soak period (e.g. overnight) and a follow-up test drive before the vehicle is confirmed fixed and released. Should track the vehicle as not-yet-released, schedule/assign the retest to a technician, and only close out the RO (and release the vehicle to the customer) once the final test drive confirms the repair — instead of marking the job complete early and papering over the gap with a workaround canned job.

### Tekmetric User Group (Facebook) — ~Dec 2025 (post 9mo old as of Sep 2026)
- Context: Shop owner/advisor pointing out a common human-error gap: pricing/approving a job but forgetting to actually order the parts for it. 6 reactions, 6 comments.
- Feedback: "Cant speak for everyone but many times we price something and forget to order it. Could TM come up with a way to alert the SA that a job is approved but parts aren't ordered???"
- Pain point: No safety-net alert when a job is customer-approved but its parts haven't actually been ordered yet — purely relies on the service advisor remembering. Leads to delays discovered late (e.g. day of the appointment) when the part still isn't in.
- Feature implication: FLAGGED AS GOOD REMINDER FOR WRENCHIQ. Native alert/reminder that flags any approved job with no parts ordered yet — surfaced to the service advisor (and ideally parts person) proactively, not something they have to remember to check. Complements the future-estimate and recurring-notes ideas already logged: another case where WrenchIQ should proactively remind, not just passively store, information.

### Tekmetric User Group (Facebook) — ~Jan 2026 (post 8mo old as of Sep 2026)
- Context: Shop owner asking about setting up an automated post-repair customer survey/check-in. 2 likes, 6 comments.
- Feedback: "Is there a way to setup a customer survey/ checkup that goes out after the repair is done?" Comment highlight (the workaround): "Find an online survey maker. Get link. Use your CRM to auto text a few days after visit. Include link to survey maker."
- Pain point: No native post-repair survey/CSAT feature in Tekmetric — shops have to stitch together a third-party survey tool plus their CRM's auto-text feature just to check in with a customer after service. Multi-tool, DIY setup for something that should be a basic built-in workflow.
- Feature implication: Native automated post-repair customer survey/check-in inside WrenchIQ — auto-send a short survey (text and/or email) a few days after service completion, with responses tied back to the customer/vehicle/RO record, no external survey tool required.

### Tekmetric User Group (Facebook) — ~Mar 2026 (post 6mo old as of Sep 2026)
- Context: Shop owner building their own AI agent (using tools like Claude) for their shop, asking about getting API access from Tekmetric and Prodemand. 8 likes, 15 comments.
- Feedback: "Anyone ever get an API from Tekmetric? We've been building our own AI agent for our shop to help with estimating and parts ordering and are going to need APIs from Tek and Prodemand. Wondering if anyone else has done this and what it might cost?" Comment highlight: "I got my api for tek about 3 or 4 years ago, and I believe it was 1500."
- Pain point: No native AI agent for estimating and parts ordering — motivated shop owners are DIY-building their own (with general AI tools) and paying out of pocket (~$1,500) just to get raw API access to Tekmetric and Prodemand/labor-guide data to power it. High-effort, technical, and expensive workaround only available to the most technical shops.
- Feature implication: Strong demand signal that shops want an AI agent that handles estimating and parts ordering directly — exactly WrenchIQ's positioning. Shops are already proving willingness to pay real money (and real engineering effort) to build this themselves from raw platform APIs; a native, no-DIY-required version inside WrenchIQ is a clear differentiator against Tekmetric, which apparently has no first-party agent of its own.

### Tekmetric User Group (Facebook) — ~Mar 2026 (post 6mo old as of Sep 2026) — COMPETITIVE STRENGTH, not a gap
- Context: "Thankful" thread — TUG asked members to list one thing they LOVE about Tekmetric (TM). 17 reactions, 13 comments.
- Feedback: Top answer (from the poster): "the ability to send estimates and receive approval via text messaging. (Makes less phone calls thus saving me time, not to mention it helps my customers not have to interrupt their day with a call)." Comment highlight: "Thr cheap price... but I would pay lots more if they would improve...its been like watching grass grow" (price seen as a strength, paired with frustration at slow product improvement).
- Pain point: N/A — this is a well-loved Tekmetric strength, not a customer pain point.
- Feature implication: Parity check, not a new feature: confirm WrenchIQ already supports sending estimates and receiving customer approval via text message (async, no phone call needed for either side). This is one of the most-loved things about Tekmetric — don't lose ground here. Separately, "cheap but slow to improve" is useful competitive positioning: customers feel stuck on price and would pay more for a platform that actually moves.

### Tekmetric User Group (Facebook) — ~Sep 2025 (post 12mo old as of Sep 2026)
- Context: Shop owner looking for a technician efficiency report and finding no built-in way to get it.
- Feedback: "Does a report exist that will show technician efficiency based on hours billed and clock hours? Not flagged hours...but punch in and out every day type of clock hours. I tried searching the page but found nothing. Thank you in advance!" 3 reactions, 5 comments. Comment highlights: "Tech productivity would be helpful" / "Sales job by category. You should be able to filter your selections in there to find it." / "You could measure technician efficiency by measuring clocked hours and dividing that by the number of flagged hours."
- Pain point: No predefined report covers technician efficiency as billed-hours-vs-actual-clock-hours (punch in/out) — only flagged/billed-hour metrics exist natively. Users have to reverse-engineer it from an unrelated report (Sales by Category) or manually compute a ratio themselves; no built-in support for the metric a shop owner actually wants.
- Feature implication: This is the same root gap as the "custom report" workaround above — predefined reports can't anticipate every question a shop owner has (technician efficiency, top parts to stock, customer visit/spend, etc.). Reinforces the case for ad hoc, chat-based reporting at the shop level instead of a fixed report list.

### Tekmetric User Group (Facebook) — ~Nov 2025 (post 10mo old as of Sep 2026)
- Context: Shop owner asking about tracking clocked hours on jobs per day versus clock-in/out time, specifically to catch downtime on long-term projects. 1 like, 3 comments.
- Feedback: "Is there a feature available to see clocked hours on jobs per day versus clock-in/out time? IE if a tech is clocked in at work for 8 hours and clocks 7.5 hours on multiple jobs with none completed. Asking as we have many long term projects and would like to keep track from day to day of downtime." Comment highlight: "No but there SHOULD be - clocked on job compared to hours billed is efficiency - clocked on the time clock (in the building, getting paid) compared to billed hours is productivity. We need those numbers too!"
- Pain point: No day-by-day view comparing a tech's clock-in/out time against hours actually clocked on jobs — can't spot downtime (paid time with no job progress) on long-running projects. Related to, but distinct from, the technician efficiency report gap above: this specifically separates "efficiency" (job-clocked vs. billed) from "productivity" (time-clock/paid hours vs. billed), and wants both tracked day-to-day, not just in aggregate.
- Feature implication: Daily technician time breakdown showing clock-in/out (paid time) vs. hours clocked to jobs vs. hours billed, so a shop can see day-by-day downtime on long-term projects — not just an overall efficiency percentage. Extends the ad hoc/technician-reporting feature idea already logged, with an explicit efficiency-vs-productivity distinction and a day-level (not just aggregate) view.

### Tekmetric User Group (Facebook) — ~Dec 2025 (post 9mo old as of Sep 2026)
- Context: Shop owner sharing a "custom report" workaround because Tekmetric's built-in reports don't cover ad-hoc analytics questions.
- Feedback: "Sharing a 'custom report' workaround to avoid spreadsheet hell. Most of the reports out of TM should be able to get you the data you need. Below are steps that help me get what I need: 1. Download TM report (eg customer report) 2. Open up a AI tool (eg ChatGPT), and tell it you'll be sharing private data that should not be shared with their platform and should remain only accessible by you - this prevents platforms like OpenAI from factoring the data into its model. Best to have the paid version for guaranteed privacy 3. Ask your question (eg, Based on number of visits in 2025, give me a table of data that shows each customer name, number of visits, and total $ spent)." 15 likes, 5 comments. Comment highlights: "I used it to make a top ten list of most used parts then I stocked those items more" / "Looking for more prompts that would help us....."
- Pain point: No native custom/ad-hoc reporting or "ask a question" capability inside Tekmetric — shops resort to manually downloading a report and pasting it into an external AI tool to get answers (customer visit/spend tables, top-used-parts for stocking decisions). Requires manually warning the AI tool about data privacy, is a multi-step workaround, and only the more tech-savvy shops are doing it.
- Feature implication: Native in-app "ask your data" chat / custom report builder over the shop's own reporting data (no export required, no third-party AI privacy exposure) — e.g. a shop asks "what are my top parts to stock based on usage?" or "customer visits and total spend in 2025" directly and gets a table back.

### Tekmetric User Group (Facebook) — ~Jan 2026 (post 8mo old as of Sep 2026)
- Context: Shop that just took over from a Mitchell-based operation, now on Tekmetric; staff wanted to check job history to see if a specific part had ever been replaced before (e.g. a control arm).
- Feedback: "We just took over a shop that used Mitchell before, the guys are asking if in Tek when looking up history, if there is a key word search to look up and see if a certain part was ever replaced before? For example, one of the guys wanted to know if we'd ever replaced a control arm before, so in Mitchell, history you can search by key word instead of looking through all repair orders." Comment highlights: workaround is (1) Customer page → Customer details → Job history → search a word that could be in the job title, or (2) inside an RO → Summary → Job history → search a word that could be in the job title — either way, limited to job-title text. Another commenter: "You cannot search parts which is very frustrating. You have to label the job with any parts you may want to search in the job title."
- Pain point: Tekmetric has no real keyword/history search — it only searches job-title text, not parts actually used, so finding "was this part ever replaced?" requires the original tech to have manually put that part's name in the job title. No parts-level search exists at all. Mitchell (their prior system) supported true keyword search across history.
- Feature implication: Full-text/keyword search across a vehicle's or customer's entire repair-order history that indexes parts used and line-item descriptions, not just the job title — so "has X part ever been replaced?" is a direct, reliable search rather than a workaround dependent on how a tech happened to title the job.

### Internal Competitive Note (Tilak) — Sep 2026
- Context: Competitive gap analysis vs. Tekmetric. Tekmetric already recurs "declined services" onto future ROs, but has nothing for personal/human context about the customer.
- Feedback: "Very weak part of Tek. They won't do anything about it. We do the declined services as mentioned but 'recurring notes' that pull up when new RO is made such as 'ask about Dad, just died', or 'customer has speech impediment, be gentle', or 'speak slow, customer has hard time comprehending.' The note could easily be done by making the 1 top 'Customer Concerns' box recur on next invoice/appointment. Use notes where appropriate in the talking track of customer. Make it more human."
- Pain point: No way to carry forward personal/human context (bereavement, communication needs, accessibility considerations) about a customer to the next RO — advisors have to remember it themselves or lose it entirely. Tekmetric has no roadmap to fix this.
- Feature implication: Make the existing top "Customer Concerns" box recur automatically on the customer's next invoice/appointment, and surface it directly in the service advisor's talking track/script — not just as a static note, so interactions read as human rather than purely transactional.

### Tekmetric User Group (Facebook) — ~Mar 2026 (post 6mo old as of Sep 2026)
- Context: Shop owner/advisor using Tekmetric, posting in the Tekmetric User Group FB community.
- Feedback: "What's the best way to notate things for next time. Like Friday I had a typical oil change for a customer and he had mentioned next service he'd like 4x4 system inspected, fluids changed, and a trans oil and filter change. Is there a way I can like put a note in for next time I open him up for a work order it tells me he's needing these items?"
- Pain point: No structured way to capture a customer's stated future-service intent at point of sale; relies on memory or ad-hoc notes that don't resurface when the vehicle's next work order is opened.
- Feature implication: Persistent, vehicle/customer-linked "next visit" notes or flagged future services that auto-surface (as a prompt or pre-populated line items) when a new work order is created for that customer/vehicle. Ties into upsell/follow-up automation and CRM-style customer history.

---

## Feature Ideas Extracted
_(Fill in as patterns emerge from the raw feedback above)_

| Feature Idea | Source(s) | Frequency | Priority (High/Med/Low) | Notes |
|---|---|---|---|---|
| Persistent "next visit" service notes tied to customer/vehicle, auto-surfaced on next work order | Tekmetric User Group (FB) | 1 | Med | Requested as a Tekmetric gap; relevant to WrenchIQ's customer history / upsell automation |
| "Add Notes" on a repair job to spin up a future-dated estimate: pull up the repair job, consult the labor guide and parts catalog, and produce an estimate priced as of today for a future service date | WrenchIQ product idea (response to Tekmetric FB feedback above) | — | — | Directly answers the Tekmetric gap above — turns the customer's stated future need into an actionable, priced estimate instead of just a note |
| Recurring "Customer Concerns" note (personal/human context — not just declined services) that resurfaces on the next RO/appointment and feeds the advisor's talking track | Internal competitive note (Tilak) | — | High | Tekmetric has this gap with no roadmap to fix it; strong differentiation angle — makes service interactions feel human, not just transactional |
| Full keyword/history search across ROs that indexes parts used (not just job title) — instantly answers "was this part ever replaced before?" | Tekmetric User Group (FB) | 1 post, 2 corroborating comments | High | Tekmetric has no parts-level search; workaround requires manually naming parts in job titles. Mitchell (prior system) already supports this — a clear parity gap |
| Ad hoc reporting in WrenchIQ: instead of a fixed list of predefined reports, let users chat with WrenchIQ for reports at the shop level (e.g. top parts to stock, customer visits & spend, technician efficiency by clocked vs. billed hours, average vehicle age serviced) — no manual export to external AI tools or Excel formulas | Tekmetric User Group (FB) — 3 posts | 3 posts (15 likes/5 comments; 3 reactions/5 comments; 5 reactions/4 comments) | High | Users are already improvising this with ChatGPT + manual exports (privacy workaround), separately failing to find basic metrics like technician efficiency in predefined reports, and separately still exporting ROs into Excel and hand-building formulas for things like average vehicle age — a recurring pattern, not a one-off ask |
| Native AI agent inside WrenchIQ for estimating + parts ordering (shops are already DIY-building this themselves via Claude/ChatGPT + paid Tekmetric/Prodemand API access, ~$1,500 out of pocket) | Tekmetric User Group (FB) — 2 posts | 2 posts (8 likes/15 comments; 7 likes/25 comments) | High | Direct validation of WrenchIQ's core AI-agent positioning; Tekmetric has no first-party agent, forcing technical shops into a costly DIY path. Concrete cost: advisors report up to 5 hrs/day writing custom (non-canned) estimates manually |
| Native automated post-repair customer survey/check-in (auto-sent a few days after service, tied back to the RO/vehicle/customer record) | Tekmetric User Group (FB) | 1 post, 2 likes, 6 comments | Med | Currently requires stitching together a third-party survey tool + CRM auto-text; a basic built-in workflow gap |
| "Pending final verification" job/RO state for repairs needing a soak + retest (e.g. overnight, then a confirmation test drive) before the vehicle is marked done and released | Tekmetric User Group (FB) | 1 post, 1 like, 8 comments | High | FLAGGED AS A GOOD REQUIREMENT — Tekmetric has no native support, forcing a fake $0 "Final Test Drive" canned job workaround; real risk of releasing an unverified vehicle |
| Alert/reminder for the service advisor (and parts person) when a job is approved but parts aren't ordered yet | Tekmetric User Group (FB) | 1 post, 6 reactions, 6 comments | High | FLAGGED AS GOOD REMINDER FOR WRENCHIQ — pure human-error gap today; a proactive alert instead of relying on memory prevents delays discovered too late |
| Daily technician time breakdown: clock-in/out (paid time) vs. hours clocked to jobs vs. hours billed, split into "efficiency" and "productivity" — to spot day-to-day downtime on long-term projects | Tekmetric User Group (FB) | 1 post, 1 like, 3 comments | Med | Sharper version of the technician efficiency gap above — wants a day-level view and an explicit efficiency-vs-productivity split, not just an aggregate ratio |

---

## Open Questions
- Does WrenchIQ already support sending estimates + receiving customer approval via text message (async, no call required)? Tekmetric users rate this as their #1 loved feature (17 reactions) — confirm parity.
