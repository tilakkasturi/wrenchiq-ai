# WrenchIQ Demo Speaker Notes — April 18, 2026

Two demos. Two audiences. Same core story, different shop context.

**Taylor Mitchell** — GWG network, runs Protractor, thinks in locations and compliance
**Brad Lewis** — Mitchell1 shop, single location, thinks in technician performance and revenue

The job is the same for both: by the time you leave, they should have said — or thought — *"it already knew."*

---

## BEFORE YOU START

Run `bin/demo-ready --reset` while they're getting coffee. Takes 10 seconds. Confirms MongoDB is seeded and all three agentic moments will fire.

Open the correct landing:
- Taylor: `/?demo=cornerstone`
- Brad: `/?demo=ridgeline`

Do not wing the timing. Both arcs should run under 10 minutes.

---

---

# DEMO A — TAYLOR MITCHELL
### GWG / Protractor · Cornerstone Auto Group · Fort Worth TX · 4 locations

---

## OPENING (30 seconds)

> "Taylor, before I show you anything — I want to make one thing clear about what WrenchIQ is. It's not a better UI on top of Protractor. It's not a dashboard. It's an agent. The difference is: it doesn't wait for James to tell it what's happening. It already knows. Let me show you what that looks like at Cornerstone."

Land on the **Persona Gateway** — Taylor sees:
- Service Advisor (James Kowalski)
- Shop Owner (Dave Kowalski)
- GWG Corporate

The "Connected to: Protractor" badge is visible. Don't explain it yet — let him notice it.

---

## AGENTIC MOMENT 1 — The Queue Already Has Answers (2 min)

Click into **Service Advisor → James Kowalski**.

The RO Queue loads. The WrenchIQ panel on the right is already populated — no click, no prompt.

> "James just walked in. He hasn't touched a single RO yet. But WrenchIQ has already read all of them."

**Point at the panel.** Let him read it for a beat.

> "Elena Vasquez — P0420 code. WrenchIQ is flagging this before James even opens her RO. It's already identified the pattern: O2 sensor, not catalytic converter. That's an $820 difference in the repair estimate — and it's the right call for the customer."

> "Frank Delgado — upsell opportunity already staged. Karen Tso — 3C write-up needs attention. WrenchIQ briefed James on his entire morning before he had his first cup of coffee."

**Pause.** Let Taylor process.

> "This is not a notification. It's a briefing. There's a difference."

---

## AGENTIC MOMENT 2 — One Tap (2 min)

Click into **Job 3 — Frank Delgado / CR-V**.

The customer text is already in the panel, labeled "Draft — review before sending."

> "Frank came in for a routine service. WrenchIQ identified an upsell opportunity — looked at his vehicle history, looked at the RO, drafted the customer message. James didn't ask for this. He didn't type anything. WrenchIQ had it waiting."

Read the text aloud slowly:

> *"Hi Frank, your CR-V is looking great — while we have it in we noticed [upsell]. This is a ~$[X] estimate. Want me to add it? — James @ Cornerstone"*

> "James reads it. Looks right. One tap — Approve & Send."

Tap the button. Watch it flip to "Sent — AI suggested · Advisor approved."

> "WrenchIQ drafted it. James approved it. One tap. The accountability stays with Cornerstone."

**If Taylor asks about liability:**
> "WrenchIQ surfaces the pattern and drafts the recommendation. James reviews it and approves before anything goes to the customer. The shop's name is on that message — WrenchIQ makes sure James never sends something he hasn't seen. The liability model is identical to today. We just removed the 20 minutes of thinking that used to happen before James made that call."

---

## AGENTIC MOMENT 3 — It Didn't Just Answer, It Acted (2 min)

Switch to **Shop Owner → Dave Kowalski**.

Ask WrenchIQ: *"Why is Location 3's 3C rate at 34%?"*

WrenchIQ answers — pattern analysis from Marcus Webb's RO history.

Then the action chips appear below the answer:
- `Huddle agenda item added: Marcus 3C coaching`
- `Coaching notes staged: 3 examples from James's ROs`

> "Dave asked a question. WrenchIQ answered it. And then — without being asked — it already started fixing it. Huddle item added. Coaching notes pulled from James's best 3C write-ups so Marcus has something concrete to look at."

> "Dave didn't file a ticket. He didn't write a note. He asked a question, and WrenchIQ moved."

**Pause.**

> "That's the difference between a tool and an agent."

---

## GWG CORPORATE VIEW (1 min — only if Taylor is engaged)

Switch to the **GWG Corporate** card.

> "For the network view — Taylor, this is where you live. Four locations, one dashboard. WrenchIQ surfaces the 3C compliance issue at Location 3 without you having to pull a report. It tells you which location is lagging and why — before it becomes a QBR conversation."

---

## CLOSE — TAYLOR (1 min)

> "Here's what I want to leave you with. Protractor is your system of record. WrenchIQ reads it — it will never write back to Protractor without your explicit approval. It sits on top of your existing workflow and makes it faster and smarter."

> "What you saw today works across all four Cornerstone locations. The agent is running at all of them simultaneously. Every advisor walks in briefed. Every owner gets a flag before a problem becomes a trend."

**Shut up. Wait.**

The win signal is: *"What does a 10-location POC look like?"*

If he asks it — you've won. Answer: start with one location, 30 days, read-only integration with Protractor, measure advisor upsell rate and 3C score improvement.

---

---

# DEMO B — BRAD LEWIS
### Mitchell1 Manager SE · Ridgeline Auto Service · Scottsdale AZ · Single location

---

## OPENING (30 seconds)

> "Brad, one thing before I show you the product. This isn't a Mitchell1 replacement and it's not a dashboard. It's an agent — meaning it reads your shop data and acts on it before you ask. Let me show you what Sofia's morning looks like at Ridgeline."

Land on the **Persona Gateway** — Brad sees:
- Service Advisor (Sofia Reyes)
- Shop Owner (Carmen Reyes)

"Connected to: Mitchell1 Manager SE" badge is visible.

---

## AGENTIC MOMENT 1 — Already Briefed (2 min)

Click into **Service Advisor → Sofia Reyes**.

RO Queue loads. WrenchIQ panel is already populated.

> "Sofia just started her shift. She hasn't opened a single RO. But WrenchIQ has already read all of them."

> "Dan Whitfield came in for an oil change. But there's a P0301 misfire code on his RAM 1500. WrenchIQ already pattern-matched this — 5.7L HEMI at 62K, it's almost always spark plugs and a coil pack. Not an injector. Not a deep electrical issue. $520 fix. And if you ignore it, you're looking at catalytic converter damage in 15,000 miles — that's a $1,400 conversation you don't want to have."

> "WrenchIQ had that analysis ready before Sofia's first coffee."

---

## AGENTIC MOMENT 2 — One Tap (2 min)

Click into **Job 1 — Dan Whitfield / RAM 1500**.

Staged customer text is in the panel. "Draft — review before sending."

Read it aloud:

> *"Hi Dan, your RAM is in for oil — we're also seeing a cylinder 1 misfire code. On your 5.7L at 62K this is almost always spark plugs and a coil pack, ~$520 estimate. Fixes it and prevents catalytic damage down the road. Want me to add it? — Sofia @ Ridgeline"*

> "Sofia reads it. Looks right. One tap."

Tap "Approve & Send." Watch the confirmation.

> "WrenchIQ drafted it. Sofia approved it. One tap. The accountability stays with Ridgeline."

**If Brad asks about liability:**
> "Sofia approves before anything goes out. Her name is on the message. WrenchIQ made sure she never sent something she hadn't reviewed. Same liability model as today — we just removed the manual work."

---

## AGENTIC MOMENT 3 — It Already Started Fixing It (2 min)

Switch to **Shop Owner → Carmen Reyes**.

Ask WrenchIQ: *"Which tech has the highest comeback rate on truck jobs?"*

WrenchIQ identifies Luis Fuentes — elevated comeback rate on transmission work.

Action chips appear:
- `Performance flag added: Luis — transmission comeback pattern`
- `Coaching notes staged: 3 transmission ROs for review`

> "Carmen asked a question. WrenchIQ answered it — and then it already started fixing it. Luis is flagged. Coaching notes pulled. Carmen didn't file a ticket or write a note. She asked a question."

> "That's the difference between a tool and an agent."

---

## CLOSE — BRAD (1 min)

> "Mitchell1 stays exactly where it is. WrenchIQ reads it — never writes back without your approval. Sofia's workflow doesn't change. She just shows up briefed."

> "What you saw: three revenue opportunities surfaced before Sofia opened a single RO, one upsell sent with one tap, and a tech performance issue flagged and actioned without Carmen filing anything."

**Shut up. Wait.**

The win signal is: *"What does the integration API look like?"*

If he asks it — you've won. Answer: read-only API connection to Mitchell1, no schema changes, no workflow disruption, 2-week integration timeline.

---

---

# SHARED OBJECTION HANDLING

### "Will it break our existing workflow?"
> "It doesn't touch your workflow. WrenchIQ reads your data — Protractor, Mitchell1 — and surfaces intelligence on top of it. Your advisors still use the same screens they use today. WrenchIQ just briefs them before they get there."

### "What if the AI gets the diagnosis wrong?"
> "WrenchIQ drafts and recommends. The advisor reviews and approves before anything goes to the customer. The liability model is identical to today — we removed the manual work, not the human judgment."

### "How does pricing work?"
> "Per location, monthly. We can talk structure in the follow-up — I'd rather show you a POC first so you have something concrete to price against."

### "We already have AI features in [Protractor / Mitchell1]."
> "Those are reactive — you ask, they answer. WrenchIQ is proactive. It reads your ROs every morning and briefs your team before they ask anything. That's the gap we're filling."

### "What data does it send to the cloud?"
> "RO metadata — vehicle, DTC codes, service history. No customer PII leaves your system without your configuration. We can walk through the data flow in a security review if that's a gate."

---

# TIMING GUIDE

| Beat | Time |
|---|---|
| Opening | 0:00 – 0:30 |
| Moment 1 — Queue briefing | 0:30 – 2:30 |
| Moment 2 — One tap send | 2:30 – 4:30 |
| Moment 3 — Autonomous action | 4:30 – 6:30 |
| Corporate / owner view | 6:30 – 7:30 |
| Close + silence | 7:30 – 8:30 |
| Q&A | 8:30 – 10:00 |

If you're at 7 minutes and they're asking questions — you're ahead. Don't fill the silence.

---

# THE ONE LINE TO REMEMBER

If you forget everything else:

> *"Before James touched a single RO this morning, WrenchIQ had already read all of them."*

Say it once. Say it slowly. Then stop talking.
