# WrenchIQ Demo TODO — Two Demos, Friday April 18
**Demos:** Taylor Mitchell (GWG / Protractor) · Brad Lewis (Mitchell1)
**Demo date:** Friday, April 18, 2026

---

## THE STORY WE'RE TELLING

**One sentence:** WrenchIQ doesn't just respond — it acts. The agent is always ahead of the human.

**The emotional beat we're landing:**
> *"Before James touched a single RO this morning, WrenchIQ had already read all of them."*

Every build task below exists to make that line land credibly.

**Win signals:**
- Taylor asks: *"What does a 10-location POC look like?"*
- Brad asks: *"What does the integration API look like?"*
- Anyone in the room says: *"It already knew."*

**Failure mode:** Anyone asks *"will it break our existing workflow?"* — the visual contrast should have answered this before they could form the question.

**Second demo line (liability reframe):**
> *"WrenchIQ drafted it. Sofia approved it. One tap. The accountability stays with the shop."*

---

## LIABILITY & AUTHORIZATION MODEL

The agent acts autonomously — but the shop owner is never exposed. Every action follows one of two patterns:

### Authorization tiers

| Tier | What WrenchIQ does | Human step required | Example |
|---|---|---|---|
| **Read** | Analyzes ROs, surfaces insights | None — advisory only | Moment 1 proactive briefing |
| **Draft** | Prepares customer-facing content | Advisor must tap Send | Moment 2 staged text |
| **Act** | Takes an internal action | Advisor sees confirmation chip, can undo | Moment 3 action chips |

**Rule:** Nothing customer-facing leaves the shop without an explicit human tap. Internal actions (huddle notes, coaching flags) may fire with a short undo window but are never silent.

### Design guardrails — build tasks

#### [ ] G-1. Staged text must render as draft, not send-ready
`agenticTextStatus: "staged"` → UI label reads **"Draft — review before sending"**, not "Ready to send."
Button reads **"Approve & Send"**, not "Send."
This is a language change only — no backend work.

#### [ ] G-2. Action chips in Moment 3 require a confirm state
Current design: chips appear and fire automatically below the WrenchIQ answer.
Required: chips appear with a **5-second undo toast** — *"Huddle item added — Undo"* — before the action commits.
Gives the owner a visible moment of control without adding friction to the demo flow.

#### [ ] G-3. AI attribution label on every generated output
Every WrenchIQ-generated field (customer text, 3C rewrite, upsell card) displays a subtle label:
**"AI suggested · Advisor approved"** once actioned.
This label is the audit trail. It means Sofia — not WrenchIQ — is on record as the sender.

#### [ ] G-4. Diagnosis confidence qualifier in customer text
Staged customer texts must include a hedge that signals estimation, not certainty.
Pattern: *"this is almost always..."* or *"we're seeing a pattern that suggests..."*
Not: *"your car has X"* or *"the problem is Y."*
Review all 3 staged texts in seedDemoStory.js against this pattern before Friday.
Current Dan Whitfield text already uses "almost always" — keep it. Verify the others.

#### [ ] G-5. Price in staged text is labeled as estimate
Any dollar figure in a staged customer text must read **"~$520"** or **"$520 estimate"** — not a flat quote.
Prevents the text from functioning as a binding written estimate under state consumer protection law.

### Demo talking point (for Taylor / Brad objection handling)
If asked *"what happens if WrenchIQ gets the diagnosis wrong?"*:
> *"WrenchIQ surfaces the pattern and drafts the recommendation. The advisor reviews it and approves before anything goes to the customer. The shop's name is on the message — WrenchIQ makes sure the advisor never sends something they haven't seen. The liability model is the same as it's always been — we just removed the 20 minutes of manual work that used to happen before the advisor made that call."*

---

## DEMO SHOP PERSONAS

### SHOP A — Taylor Mitchell demo (GWG / Protractor)
**Shop:** Cornerstone Auto Group · Fort Worth, TX · 4 locations · GWG network member
**Owner:** Dave Kowalski · `adv-002` · Labor rate $175
**Lead Advisor:** James Kowalski (Dave's son) · `adv-001`
**Location 3 problem:** Marcus Webb (`tech-001`) writing 3C scores of 34/100

| RO | Customer | Vehicle | Demo moment |
|---|---|---|---|
| RO-2026-0401 | Elena Vasquez | 2020 Toyota Highlander 52.4K | Job 1 — P0420 O2 sensor, not cat converter |
| RO-2026-0402 | Frank Delgado | 2018 Honda CR-V 68.2K | Job 3 — upsell text pre-staged |
| RO-2026-0403 | Brenda Okafor | 2021 Ford F-150 41K | Job 2 — 3C rewrite 31→89 |

### SHOP B — Brad Lewis demo (Mitchell1)
**Shop:** Ridgeline Auto Service · Scottsdale, AZ · single location
**Owner:** Carmen Reyes · Labor rate $185
**Lead Advisor:** Sofia Reyes (Carmen's daughter)
**Problem tech:** Luis Fuentes — elevated comeback rate on transmission jobs

| RO | Customer | Vehicle | Demo moment |
|---|---|---|---|
| RO-2026-0501 | Dan Whitfield | 2019 RAM 1500 5.7L 61.8K | Job 1 — P0301 spark plugs not oil only |
| RO-2026-0502 | Karen Tso | 2022 Chevy Silverado 38.4K | Job 2 — 3C rewrite |
| RO-2026-0503 | Marco Esposito | 2017 Ford F-150 EcoBoost 84.2K | Job 3 — timing chain high-value |

---

## AGENTIC DEMO MOMENTS

These are the three bets. Everything else is infrastructure for these.

### [ ] AGENTIC MOMENT 1 — Queue loads, WrenchIQ already ahead
RO Queue opens — WrenchIQ panel shows proactive briefing without advisor clicking anything.
**Cornerstone:** "Elena Vasquez — P0420 pattern. O2 sensor, not cat. Saves $820." + Frank + Brenda cards
**Ridgeline:** "Dan Whitfield — P0301 misfire. Spark plugs + coil. $520 op." + Karen + Marco cards
Source: `ro.aiInsights[0]` where tag is "PROACTIVE —"
**Demo line:** *"Before James touched a single RO this morning, WrenchIQ had already read all of them."*

### [ ] AGENTIC MOMENT 2 — Customer text already drafted
Job 3 screen opens — `ro.agenticCustomerText` is pre-populated, `agenticTextStatus: "staged"`.
One-tap "Send" button. After tap: status → "sent", button → "Sent ✓".
**Demo line:** *"WrenchIQ didn't wait for James to think of this. It drafted the message. One tap."*

### [ ] AGENTIC MOMENT 3 — Ask WrenchIQ answer triggers autonomous action
After owner asks "Why is Location 3's 3C rate at 34%?":
- Answer: pattern analysis from Marcus's RO history
- Then autonomous action chips appear below the answer:
  - `[ Huddle agenda item added: Marcus 3C coaching ]`
  - `[ Coaching notes staged: 3 examples from James's ROs ]`
- Brad demo variant: "Which tech has the highest comeback rate on truck jobs?" → Luis flagged
**Demo line:** *"It didn't just answer. It already started fixing it."*

---

## PRE-DEMO CHECKLIST — Must pass by Thursday EOD

### TRUST KILLERS — Fix these first

- [ ] **Fix 3C Story Writer "AI Rewrite failed" error** — surfaces during Agentic Moment 2/3; kills credibility instantly
- [ ] **Reframe Owner Command Center P&L cards** — remove or relabel financial P&L; replace with operational health framing so it reads as intelligence, not accounting

### DEMO READINESS

- [ ] `node scripts/seedDemoStory.js --reset` runs clean, 6 ROs seeded — so all 3 agentic moments have real data behind them
- [ ] `GET /api/repair-orders/demo?shopId=cornerstone` returns 3 story ROs — so Moment 1 fires for Taylor
- [ ] `GET /api/repair-orders/demo?shopId=ridgeline` returns 3 story ROs — so Moment 1 fires for Brad
- [ ] RO Queue fetches live from MongoDB (not demoData.js import) — so the "already read them" line is literally true
- [ ] Job 1/2/3 screens pull from `/api/repair-orders/story-ro/:id` — so each job screen reflects the seeded story
- [ ] Agentic Moments 1, 2, 3 fire correctly in both shop contexts — the three bets must land
- [ ] Taylor landing and Brad landing built and switching correctly — so each demo opens in the right persona
- [ ] SMS skin swap working: Protractor ↔ Mitchell1 — so Taylor sees Protractor, Brad sees Mitchell1
- [ ] Zero console errors, no empty panels, no broken states — nothing breaks the spell
- [ ] Taylor arc timed under 10 min end-to-end
- [ ] Brad arc timed under 10 min end-to-end

---

## DATA LAYER — MongoDB Live RO Wiring

**Data rule:** All demo ROs must come from live MongoDB. demoData.js is the shape reference and fallback only.

### [ ] 1. Create scripts/seedDemoStory.js
New seed script separate from the batch seeder. Seeds exactly 6 story ROs across 2 shops.

```bash
node scripts/seedDemoStory.js              # seeds both shops
node scripts/seedDemoStory.js --shop cornerstone   # Cornerstone only
node scripts/seedDemoStory.js --shop ridgeline     # Ridgeline only
node scripts/seedDemoStory.js --reset              # drop story ROs, reseed
```

Seeds into existing `RepairOrder` collection with `shopId: "cornerstone"` or `shopId: "ridgeline"`.
Uses same schema as `seedRepairOrders.js` (camelCase, all required fields, rebasing dates).

Story ROs to seed:
- `RO-2026-0401` Elena Vasquez / Highlander (from demoData.js — already written)
- `RO-2026-0402` Frank Delgado / CR-V (from demoData.js — already written)
- `RO-2026-0403` Brenda Okafor / F-150 (from demoData.js — already written)
- `RO-2026-0501` Dan Whitfield / RAM 1500 P0301 pattern
- `RO-2026-0502` Karen Tso / Silverado 3C rewrite
- `RO-2026-0503` Marco Esposito / F-150 EcoBoost timing chain

### [ ] 2. Add bin/seed-demo-story shortcut
```bash
#!/usr/bin/env bash
PATH="/opt/homebrew/opt/node@24/bin:$PATH"
node --env-file=.env.local scripts/seedDemoStory.js "$@"
```

### [ ] 3. Extend GET /api/repair-orders/demo to accept shopId param
Current route returns 10 generic demo ROs. Add `?shopId=cornerstone` filter.

In `server/routes/repairOrders.js`:
```js
// GET /api/repair-orders/demo?shopId=cornerstone
router.get('/demo', async (req, res) => {
  const { shopId = 'shop-001' } = req.query;
  const ros = await db.collection('RepairOrder')
    .find({ shopId })
    .sort({ dateIn: -1 })
    .limit(15)
    .toArray();
  res.json(ros.map(normalizeRO));
});
```

### [ ] 4. Add GET /api/repair-orders/story-ro/:roId route
Fetch a single story RO by ID for Job 1/2/3 detail screens.
Returns full RO shape including `aiInsights`, `agenticUpsells`, `agenticCustomerText`, `threeCRewriteSuggestion`.

### [ ] 5. Wire RO Queue screen to fetch from MongoDB
**File:** wherever the RO queue is currently reading from (likely `RepairOrderScreen.jsx` or similar).

Replace hardcoded `repairOrders` import with:
```js
const { data: ros } = useFetch(`/api/repair-orders/demo?shopId=${activeShopId}`);
```

`activeShopId` comes from a demo config prop — `"cornerstone"` for Taylor demo, `"ridgeline"` for Brad demo.

Fallback to `import { repairOrders } from '../data/demoData.js'` if fetch fails (keeps demo stable if server is down).

### [ ] 6. Wire Job 1 screen to use live RO-2026-0401 data
**RO:** Elena Vasquez / Highlander
Fetch `GET /api/repair-orders/story-ro/RO-2026-0401`
WrenchIQ panel populates from `ro.aiInsights[]`.
State 1 (blank concern) and State 2 (advisor types → insights activate) are driven by `ro.customerConcern` field.
State 3 (draft narrative staged) driven by presence of `ro.threeCRewriteSuggestion.status === "staged"`.

### [ ] 7. Wire Job 3 screen to use live RO-2026-0402 data
**RO:** Frank Delgado / CR-V
Fetch `GET /api/repair-orders/story-ro/RO-2026-0402`
Upsell cards populate from `ro.agenticUpsells[]`.
Staged customer text from `ro.agenticCustomerText` + `ro.agenticTextStatus`.
"Send" tap calls `PATCH /api/repair-orders/RO-2026-0402/status` with `{ agenticTextStatus: "sent" }`.

### [ ] 8. Wire Job 2 screen to use live RO-2026-0403 data
**RO:** Brenda Okafor / F-150
Fetch `GET /api/repair-orders/story-ro/RO-2026-0403`
3C "before" state: `ro.threeCConcern` = "Customer states noise." · Score: `ro.threeCScore` = 31
3C "after" state: `ro.threeCRewriteSuggestion.concern` · Score: 89
"Apply Rewrite" calls `PATCH /api/repair-orders/RO-2026-0403` with rewritten fields.

---

## SYNTHETIC RO DATA — Ridgeline Shop (Brad demo)

Write these 3 ROs into `scripts/seedDemoStory.js`. Schema mirrors demoData.js story ROs above.

### [ ] RO-2026-0501: Dan Whitfield / 2019 RAM 1500 5.7L
```
shopId: "ridgeline"
customer: Dan Whitfield, (480) 555-0301
vehicle: 2019 RAM 1500 5.7L HEMI, 61,800 mi, Billet Silver
appointment: oil change
dtcs: ["P0301"]  // Cylinder 1 misfire — WrenchIQ pattern matches spark plugs + coil pack
aiInsights:
  - "PROACTIVE — P0301 cylinder 1 misfire pattern on 5.7L HEMI at 61K. Spark plug degradation, not injector."
  - "TSB-18-065-20: Ram 5.7L spark plug/coil pack pattern at 55–65K — 89% resolved with plug set + coil."
  - "Upsell: spark plug set (8) + coil pack = $520 incremental. Talk track drafted."
  - "If misfire ignored: catalytic converter damage within 15K miles ($1,400+). Frame as prevention."
agenticUpsells: spark plugs ($180 parts, 1.5hr) + coil pack for cyl 1 ($68 parts, 0.5hr)
agenticCustomerText: "Hi Dan, your RAM is in for oil — we're also seeing a cylinder 1 misfire code. On your 5.7L at 62K this is almost always spark plugs and a coil pack, $520 total. Fixes it and prevents catalytic damage down the road. Want me to add it? — Sofia @ Ridgeline"
```

### [ ] RO-2026-0502: Karen Tso / 2022 Chevy Silverado
```
shopId: "ridgeline"
customer: Karen Tso, (480) 555-0302
vehicle: 2022 Chevy Silverado 1500 LT 5.3L, 38,400 mi, Summit White
appointment: brake squeal
threeCConcern: "Noise when braking."  // Sofia wrote this — fails 3C at 28/100
threeCScore: 28
threeCRewriteSuggestion:
  score: 86
  concern: "Customer states: high-pitched squealing noise from front brakes when slowing from highway speeds. Occurs most on first application of brakes in the morning. Has been present for approximately 3 weeks. No grinding. No pull. Brake warning light not illuminated."
```

### [ ] RO-2026-0503: Marco Esposito / 2017 Ford F-150 EcoBoost
```
shopId: "ridgeline"
customer: Marco Esposito, (480) 555-0303
vehicle: 2017 Ford F-150 XLT 3.5L EcoBoost, 84,200 mi, Magnetic Gray
appointment: timing chain rattle
status: "estimate_sent"
totalEstimate: 1847
aiInsights:
  - "TSB-17-0144: 3.5L EcoBoost timing chain stretch at 75–90K — confirm with rattle on cold start"
  - "Repair: timing chain set + guides + tensioners. Labor: 8.5hr. Parts: $620–$780. Total: $1,760–$1,965."
  - "High-value job ($1,847). Marco's approval rate on prior high-value estimates: 83%. High probability."
  - "Authorization required before teardown — get written approval. Cite TSB for customer confidence."
```

---

## LANDING PAGES & SKIN SWAP

### [ ] Taylor version: 3 cards + Protractor badge
Cards: Service Advisor · Shop Owner · GWG Corporate
Badge: "Connected to: Protractor"
Live signals: Advisor "3 ROs need attention · $1,140 waiting" · GWG "3C compliance Off-Track · Location 3"

### [ ] Brad version: 2 cards + Mitchell1 Manager SE badge
Cards: Service Advisor · Shop Owner (no GWG card)
Badge: "Connected to: Mitchell1 Manager SE"
Live signals: Advisor "2 upsells staged · $803 opportunity" · Owner "Luis — 3 comebacks this month"

### [ ] smsProvider config prop
`smsProvider = "protractor" | "mitchell1"` toggles:
- Logo badge text
- Header color (Protractor: `#5A6A7A` · Mitchell1: `#1B2A3B`)
- Footer text ("WrenchIQ reads Protractor — never writes to it" vs Mitchell1)

---

*No new features after Wednesday EOD. Thursday = polish and run-throughs only.*
*Demo date: Friday, April 18, 2026.*
