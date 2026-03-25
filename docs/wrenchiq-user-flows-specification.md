# WrenchIQ.ai — User Flows & Screen Map Specification
## Version 1.0 · March 2026

---

## IMPLEMENTATION STATUS

> Full detail in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). Summary for flows and screens covered by this specification:

| Level | Badge | Meaning |
|-------|-------|---------|
| UI Mock | `MOCK` | Static placeholder UI only |
| Synthetic Data | `SYNTH` | Hardcoded fake data inline in component |
| Demo Data | `DEMO` | Connected to `src/data/demoData.js` |
| Live API | `LIVE` | Real third-party API integrated |

**Screen status at a glance:**

| Screen | File | Highest Level Reached | Live API Blocker |
|--------|------|-----------------------|-----------------|
| Command Center | DashboardScreen.jsx | `DEMO` | — |
| Social Inbox | SocialInboxScreen.jsx | `DEMO` | Meta Graph, TikTok APIs |
| DVI — Inspection | DVIScreen.jsx | `DEMO` | Vision API (photo analysis) |
| Health Report | HealthReportScreen.jsx | `DEMO` | Twilio (approval SMS) |
| Repair Orders | RepairOrderScreen.jsx | `DEMO` | — |
| Trust Engine | TrustEngineScreen.jsx | `DEMO` | — |
| Customer Portal | CustomerPortalScreen.jsx | `DEMO` | Twilio (magic link auth) |
| Analytics | AnalyticsScreen.jsx | `DEMO` | — |
| Multi-Location | MultiLocationScreen.jsx | `DEMO` | — |
| Integrations | IntegrationsScreen.jsx | `MOCK` | All 18 APIs pending |
| Settings | SettingsScreen.jsx | `DEMO` | — |
| AI Copilot | AICopilotScreen.jsx | `DEMO` | Claude API (PrediiAgent) |
| Smart Scheduling | SmartSchedulingScreen.jsx | `DEMO` | Google Calendar API |
| Parts Intelligence | PartsIntelligenceScreen.jsx | `DEMO` | Worldpac, O'Reilly APIs |
| Tech Mobile | TechMobileScreen.jsx | `DEMO` | Native app build |

**End-to-end flow status:**

| Flow | `MOCK` | `SYNTH` | `DEMO` | `LIVE` |
|------|:------:|:-------:|:------:|:------:|
| Flow 1: Social Lead → First Visit | ✅ | ✅ | ✅ | ❌ |
| Flow 2: Check-In → Estimate Approval | ✅ | ✅ | ✅ | ❌ |
| Flow 3: Competing Against OEM Dealership | ✅ | ✅ | ✅ | ❌ |
| Flow 4: Corporate Group Morning Review | ✅ | ✅ | ✅ | ❌ |
| Flow 5: Upset Customer Recovery | ✅ | ✅ | ✅ | ❌ |
| Tech Morning Flow | ✅ | ✅ | ✅ | ❌ |
| Customer Approval Flow | ✅ | ✅ | ✅ | ❌ |
| Parts Ordering Flow | ✅ | ✅ | ✅ | ❌ |
| Review Generation Flow | ✅ | ✅ | ✅ | ❌ |

---

## SCREEN INVENTORY

| Screen | File | Description | Who Uses It |
|--------|------|-------------|-------------|
| Command Center | `DashboardScreen.jsx` | Daily shop operations, metrics, AI insights | Owner, Advisor |
| Social Inbox | `SocialInboxScreen.jsx` | TikTok/Instagram/Google DM → RO conversion | Advisor, Owner |
| Inspection | `DVIScreen.jsx` | Digital vehicle inspection with photos/video | Technician, Advisor |
| Health Report | `HealthReportScreen.jsx` | Customer-facing DVI report with approvals | Advisor previews; Customer acts |
| Repair Orders | `RepairOrderScreen.jsx` | Kanban RO management board | Advisor |
| Trust Engine | `TrustEngineScreen.jsx` | Customer relationship health & lifetime value | Owner, Advisor |
| Customer Portal | `CustomerPortalScreen.jsx` | Customer-facing mobile experience | Customer |
| Analytics | `AnalyticsScreen.jsx` | Revenue, ARO, tech efficiency reporting | Owner |
| Network (100 Loc) | `MultiLocationScreen.jsx` | Corporate multi-location command | VP Ops, CFO |
| Integrations | `IntegrationsScreen.jsx` | All partner connections & status | Owner, IT |
| Settings | `SettingsScreen.jsx` | Shop configuration | Owner |

---

## CORE USER FLOWS

### Flow 1: Social Lead → First Visit
**User:** New customer discovers shop via Instagram or TikTok
**Time:** 8–12 minutes from first DM to booked appointment

```
Step 1  Customer DMs shop Instagram
        "@greatwater360 my brakes are grinding, how much?"

Step 2  [Social Inbox] Lead detected
        ├─ Channel: Instagram
        ├─ Intent: Brake Service (AI-detected)
        ├─ Score: Hot (safety urgency + clear buying intent)
        └─ AI Draft response generated instantly

Step 3  Advisor reviews AI draft (one tab — all channels visible)
        └─ Clicks "Use" → reviews → clicks "Send" (3 seconds)

Step 4  Customer replies with vehicle info
        └─ WrenchIQ auto-creates customer + vehicle profile

Step 5  Advisor sends available times
        └─ Customer confirms appointment

Step 6  [System] Appointment added to schedule
        ├─ Confirmation text sent to customer
        ├─ Prep note sent to lead technician
        └─ Conversion tracked: Instagram → Booked

RESULT: Social follower → Booked RO in under 10 minutes
        Revenue attributed to social channel
```

---

### Flow 2: Check-In → Estimate Approval (Zero Paper)
**User:** Returning customer drops off vehicle
**Time:** 4 minutes check-in, 90-minute inspection, 2-minute customer approval

```
Step 1  [Dashboard] Service Advisor receives drop-off
        ├─ License plate scan → customer profile loads instantly
        ├─ WrenchIQ shows: visits, LTV, communication preference, open TSBs
        └─ AI insight: "Sarah's Tesla has 2 open TSBs. She prefers text."

Step 2  [New RO Wizard] Create Repair Order
        ├─ Vehicle pre-populated from scan
        ├─ Customer preferences loaded
        ├─ Service history visible
        └─ AI suggests: relevant maintenance based on mileage + history

Step 3  [Repair Orders] RO assigned to technician + bay
        └─ Tech receives mobile push notification

Step 4  [DVIScreen] Technician completes inspection
        ├─ Voice-to-text notes
        ├─ Photo capture per item (auto-uploads to RO)
        ├─ Video recording per critical item
        └─ Green/Yellow/Red status per system

Step 5  [WrenchIQ AI] Health Report auto-generated in 15 seconds
        ├─ Plain-language customer explanations (no jargon)
        ├─ Before/after photos attached
        ├─ Dealer price comparison computed
        └─ TSB references added where relevant

Step 6  [HealthReportScreen] Advisor reviews + sends
        └─ Customer receives text: "Your inspection report is ready"

Step 7  Customer opens report on phone
        ├─ Sees full vehicle health visual (Red/Yellow/Green)
        ├─ Reads AI explanation of each issue
        ├─ Watches tech videos
        └─ Taps "Approve" on recommended items

Step 8  Advisor notified of approvals
        └─ Parts ordered via PartsTech price comparison

Step 9  Work completed → Invoice generated
        ├─ Customer pays via Apple Pay / Google Pay
        └─ Receipt + care tips texted to customer

Step 10 [Trust Engine] Customer profile updated
        ├─ Visit #, LTV, approval rate updated
        └─ Trust score recalculated

Step 11 [Automated] 2 hours post-pickup
        └─ Review request sent via Twilio + Podium

RESULT: Paperless, frictionless, trust-building workflow
        Customer feels like dealer quality at independent price
```

---

### Flow 3: Competing Against the OEM Dealership
**User:** Customer coming from a dealership relationship
**Time:** First visit to converted loyal customer: 1 visit

```
Step 1  Customer arrives (came from Google search or referral)
        └─ Advisor: "Welcome! Let me pull up your vehicle history."

Step 2  [New RO Wizard] VIN entered
        ├─ WrenchIQ pulls all service history from CRM
        ├─ AI notes: "Last service was at Toyota Dealership (based on mileage gaps)"
        └─ TSBs + recalls shown that dealer may have missed

Step 3  Advisor says:
        "Based on your VIN and mileage, there's a TSB on your 1.5T engine
         that Honda dealers typically address. We'll check it as part of today's
         inspection — at no extra charge."
        [Customer reaction: independent shop knows MORE than the dealer]

Step 4  Inspection completed with full video documentation
        └─ Customer receives same quality report as OEM digital inspection

Step 5  Health Report shows:
        ├─ Items: 3 recommended
        ├─ Our estimate: $487
        └─ Comparable dealer price: $820
        [Customer sees $333 savings with same quality]

Step 6  Customer approves all work (higher approval rate due to trust + price)

Step 7  Work completed with professional video documentation

Step 8  Customer receives:
        ├─ Invoice (paid digitally)
        ├─ "What was done" video walkthrough from tech
        └─ Personalized care reminder: "Your timing belt is likely good to 95K."

Step 9  [Trust Engine] Customer rated 4★ on first visit
        └─ AI note: "High probability of loyalty if second visit is same quality."

Step 10 Three months later: Pre-visit text sent automatically
        "Sarah, your Tesla is due for tire rotation based on 5,000 miles
         since your last service. Book a time that works?"
        └─ Customer books without thinking twice

RESULT: Dealership customer converted to loyal independent shop advocate
```

---

### Flow 4: Corporate Group Morning Review (100 Locations)
**User:** VP Operations, checking network health before 7 AM team call
**Time:** 10 minutes for full network review + action dispatch

```
Step 1  Sofia opens WrenchIQ on iPhone at 6:00 AM

Step 2  [MultiLocationScreen] AI Morning Brief loads
        ├─ "94 locations green, 4 yellow, 2 red"
        ├─ Top performer: Houston 3 ($67K, 4.9★)
        ├─ Concern: Phoenix 7 (comeback rate +12%)
        └─ Opportunity: Parts savings $12,400 via cross-location transfer

Step 3  Sofia taps Phoenix 7 in the location grid

Step 4  [Location Detail] Phoenix 7 drill-down
        ├─ Health Score: 42/100
        ├─ Google Rating: 3.6★ (was 4.2★ 3 months ago)
        ├─ Comeback Rate: 14% (network avg: 4%)
        └─ AI: "Transmission flush comebacks — same pattern as Houston 2 in 2024"

Step 5  Sofia reviews suggested action:
        "Send training module 7C (Transmission Service Best Practices)
         to Phoenix 7 GM Marcus Webb. This resolved Houston 2's issue in 3 weeks."

Step 6  Sofia taps "Deploy Training"
        ├─ Marcus Webb (GM) receives in-app notification + training video
        └─ Techs at Phoenix 7 receive mobile training module

Step 7  Sofia approves parts transfer
        └─ 23 locations' excess brake pad inventory redistributed to 18 short locations

Step 8  Network brief complete
        └─ Sofia joins 7 AM team call with full situational awareness

RESULT: VP manages 100 locations in 10 minutes
        Proactive coaching before issues become PR problems
```

---

### Flow 5: Upset Customer (Service Recovery)
**User:** Customer posts angry Facebook comment about a comeback
**Time:** 20 minutes from alert to resolution

```
Step 1  Customer posts Facebook comment:
        "I came in last week and now my car makes a noise it wasn't making before"

Step 2  [Social Inbox] ⚠️ URGENT flag
        ├─ Sentiment: Negative
        ├─ Score: Urgent (potential Google review risk)
        ├─ AI: "Respond within 30 minutes. Check RO history."
        └─ AI Draft: Empathetic response with manager call CTA

Step 3  Advisor/Manager reviews AI draft (appropriately empathetic)
        ├─ Edits to personalize
        └─ Sends within 5 minutes of post

Step 4  Manager pulls up customer's RO in Repair Orders screen
        ├─ Reviews work performed
        ├─ Checks technician notes
        └─ Identifies likely cause of new noise

Step 5  Manager calls customer directly
        └─ Books comeback appointment (same day)

Step 6  [Trust Engine] Customer profile flagged
        ├─ Trust score: dropped from 62 to 45
        └─ AI note: "Comeback scenario. Senior advisor for follow-up."

Step 7  Comeback visit: identified, fixed, documented

Step 8  Post-fix: Manager calls customer again
        └─ Customer satisfied — no negative review posted

Step 9  [Trust Engine] Updated
        ├─ Trust score recovers to 58
        └─ AI: "Recovery successful. Follow up in 30 days with free tire check offer."

RESULT: Potential 1-star review avoided
        Customer retained through proactive service recovery
```

---

## MOBILE FLOWS (Technician App)

### Tech Morning Flow
```
7:00 AM  Tech opens WrenchIQ mobile
          ├─ Today's assignments: 4 vehicles
          └─ Pre-loaded: TSBs, history, advisor notes for each

7:15 AM  First vehicle in bay
          ├─ Clocks in to job #1
          └─ Sees relevant TSB highlighted in orange

During   Voice dictation: "Front rotor worn past service limit..."
          └─ Auto-transcribed to inspection notes

         Photos: Tap, capture, auto-upload (no manual filing)

         Parts needed: Tap "Request Part" → goes to advisor instantly

         Issue found: Tap "Flag Additional Safety Concern"
          └─ Advisor notified on desktop immediately

Done     Tap "Inspection Complete"
          └─ WrenchIQ generates report automatically

End day  Clock out
          └─ Hours sync to Gusto payroll automatically
```

---

## CUSTOMER MOBILE FLOWS

### Approval Flow
```
Customer receives text: "Your vehicle inspection is ready. Tap to review."

Taps link → Opens mobile-optimized Health Report

Sees:
  [Vehicle Health Overview]
  ● 1 needs attention (Red)
  ● 2 watch items (Yellow)
  ● 5 items good (Green)

Taps "Front Brake Pads" (Red)
  → Reads: Plain-language explanation
  → Watches: Tech video (DeShawn explains in 47 seconds)
  → Sees: Our price $287-$420 vs Dealer: $520
  → Taps: "Approve"

Taps "Approve All Recommended"
  → Pays deposit with Apple Pay

Receives: "Marcus has been notified! We'll text when your car is ready."

Tracks: Live progress bar (In Queue → Working → QC → Ready)

Receives: "Your car is ready! Pay remaining balance and pick up anytime."
  → Pays final invoice
  → Drives to shop → Hands key → Done
```

---

## INTEGRATION FLOWS

### Parts Ordering Flow
```
Tech requests part via mobile
  → WrenchIQ searches: Worldpac, O'Reilly, PartsTech simultaneously
  → Shows: Price, availability, delivery time for each
  → AI suggests cheapest available with same-day delivery
  → Advisor approves with one tap
  → Order placed automatically
  → Tracking number sent to advisor
  → Part arrival triggers bay notification
```

### Review Generation Flow
```
RO marked "Complete"
  ├─ 1:30 hours later: Customer text via Twilio:
  │   "How was your experience today, Sarah? Rate us in 10 seconds →"
  ├─ Customer rates 4-5★: Google review link sent immediately
  ├─ Customer rates 1-3★: Message goes to manager inbox (not Google)
  │   └─ Manager sees alert in Trust Engine immediately
  └─ Review posted on Google → WrenchIQ notifies team
```

---

## DESIGN SYSTEM NOTES

### Trust Signals (Every Screen)
- Tech name + ASE certification on every inspection item
- Shop's total inspection count + accuracy rate visible to customers
- "X customers trusted us this month" ambient stat
- Before/after photo pairs make work tangible
- Price comparison vs dealer, visible at point of decision

### AI Presence Philosophy
- AI insights appear in dark teal panels (WrenchIQ brand)
- AI always surfaces the next action, not just information
- AI draft is suggested but human always sends
- AI attribution: "WrenchIQ INSIGHT" label on all AI content

### Speed Standards
- Check-in to RO: < 60 seconds
- Inspection report generation: < 15 seconds
- Customer approval via mobile: < 3 minutes
- Social inbox response (with AI draft): < 30 seconds

---

*WrenchIQ.ai — Predii Confidential · Built for the shop that earns trust*
