// One-off generator for docs/WrenchIQ Overview - Sidecar Story.pptx
// Not part of the app — run manually with: node scripts/buildOverviewDeck.mjs
import pptxgen from "pptxgenjs";

const C = {
  primary: "0D3B45",
  primaryLight: "1A5C6B",
  accent: "FF6B35",
  accentLight: "FF8F66",
  success: "22C55E",
  bg: "FFFFFF",
  textPrimary: "1A1A1A",
  textSecondary: "6B7280",
  textMuted: "9CA3AF",
  border: "E5E7EB",
  cardBg: "F7F8F9",
};

const SCR = "docs/screenshots/";
const PHONE_RATIO = 720 / 420; // height/width for the narrow Sidecar captures

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5in
pres.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };

let slideCounter = 0;
const SLIDE_TITLES = [];

function footer(slide, title) {
  slideCounter += 1;
  SLIDE_TITLES.push(title);
  slide.addText("PREDII CONFIDENTIAL  |  WRENCHIQ OVERVIEW", {
    x: 0.5, y: 7.16, w: 6, h: 0.3, fontSize: 8, color: C.textMuted, fontFace: "Calibri",
  });
  slide.addText(`Slide ${slideCounter} · ${title}`, {
    x: 8.5, y: 7.16, w: 4.33, h: 0.3, align: "right", fontSize: 8, color: C.textMuted, fontFace: "Calibri",
  });
}

function eyebrow(slide, text, opts = {}) {
  slide.addText(text.toUpperCase(), {
    x: 0.6, y: opts.y ?? 0.45, w: 10, h: 0.35, fontSize: 12, bold: true,
    color: opts.color ?? C.accent, charSpacing: 1.5, fontFace: "Calibri",
  });
}

function bigTitle(slide, text, opts = {}) {
  slide.addText(text, {
    x: 0.6, y: opts.y ?? 0.78, w: opts.w ?? 11.5, h: opts.h ?? 0.8,
    fontSize: opts.fontSize ?? 30, bold: true, color: opts.color ?? C.textPrimary, fontFace: "Cambria",
  });
}

// numbered circle badge — repeated motif for step-by-step narrative
function numberBadge(slide, n, x, y, color = C.primary) {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: 0.36, h: 0.36, fill: { color }, line: { type: "none" } });
  slide.addText(String(n), {
    x, y, w: 0.36, h: 0.36, align: "center", valign: "middle",
    fontSize: 14, bold: true, color: "FFFFFF", fontFace: "Calibri",
  });
}

// a Sidecar phone screenshot with a soft shadow frame — repeated motif
function phoneShot(slide, file, x, y, w, opts = {}) {
  const h = w * PHONE_RATIO;
  slide.addImage({
    path: SCR + file, x, y, w, h,
    shadow: { type: "outer", color: "1A1A1A", opacity: 0.35, blur: 6, offset: 3, angle: 90 },
  });
  if (opts.caption) {
    slide.addText(opts.caption, {
      x: x - 0.15, y: y + h + 0.08, w: w + 0.3, h: 0.35, align: "center",
      fontSize: 9.5, color: C.textSecondary, fontFace: "Calibri",
    });
  }
  return h;
}

function wideShot(slide, file, x, y, w, h, opts = {}) {
  slide.addImage({
    path: SCR + file, x, y, w, h, sizing: { type: "contain", w, h },
    shadow: { type: "outer", color: "1A1A1A", opacity: 0.3, blur: 8, offset: 3, angle: 90 },
    rounding: false,
    line: { color: C.border, width: 1 },
  });
  if (opts.caption) {
    slide.addText(opts.caption, {
      x, y: y + h + 0.1, w, h: 0.3, align: "center", fontSize: 9.5, color: C.textSecondary, fontFace: "Calibri",
    });
  }
}

// ── Slide 1 — Title ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.primary };
  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 0.55, w: 0.5, h: 0.5, rectRadius: 0.1, fill: { color: C.accent }, line: { type: "none" } });
  s.addText("PREDII", { x: 1.2, y: 0.55, w: 3, h: 0.5, fontSize: 16, bold: true, color: "FFFFFF", charSpacing: 1, valign: "middle", fontFace: "Calibri" });

  s.addText("WrenchIQ", { x: 0.6, y: 2.5, w: 10, h: 1.1, fontSize: 54, bold: true, color: "FFFFFF", fontFace: "Cambria" });
  s.addText(
    "An AI assistant that watches your SMS and works every repair order with you — now shown end to end on the Sidecar, next to the system you already run.",
    { x: 0.6, y: 3.65, w: 9.6, h: 1.0, fontSize: 18, color: "E7EDEF", fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );
  s.addText("Like an owner coaching the service advisor and technician — on every RO.", {
    x: 0.6, y: 4.65, w: 9.6, h: 0.5, fontSize: 14, italic: true, color: C.accentLight, fontFace: "Calibri",
  });
  footer(s, "What WrenchIQ Is");
}

// ── Slide 2 — The Shop Floor Today ──────────────────────────────────────
{
  const s = pres.addSlide();
  eyebrow(s, "The Shop Floor Today");
  bigTitle(s, "Good People — Blind Spots Built Into the Day");

  const items = [
    { n: 1, title: "Margin is invisible at the counter", body: "Advisors build estimates without seeing parts margin — it's only known at the month-end report." },
    { n: 2, title: "Catching related repairs depends on who's working", body: "Related repairs and due services get caught by your best advisors — and often missed by everyone else." },
    { n: 3, title: "Priorities don't reach the RO", body: "The promo or margin push you set Monday is gone by Wednesday's full lobby and ringing phone." },
  ];
  const colW = 3.7, gap = 0.35, startX = 0.6, y = 1.9;
  items.forEach((it, i) => {
    const x = startX + i * (colW + gap);
    numberBadge(s, it.n, x, y);
    s.addText(it.title, { x, y: y + 0.5, w: colW, h: 0.7, fontSize: 14, bold: true, color: C.textPrimary, fontFace: "Calibri" });
    s.addText(it.body, { x, y: y + 1.15, w: colW, h: 1.3, fontSize: 12, color: C.textSecondary, fontFace: "Calibri", lineSpacingMultiple: 1.15 });
  });

  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 5.5, w: 12.13, h: 1.35, rectRadius: 0.08, fill: { color: C.primary }, line: { type: "none" } });
  s.addText("WHY HASN'T YOUR SHOP SYSTEM CAUGHT THIS?", { x: 0.95, y: 5.68, w: 11.4, h: 0.35, fontSize: 11, bold: true, color: C.accentLight, charSpacing: 1, fontFace: "Calibri" });
  s.addText(
    "Shop management systems were built to record work, not interpret it. WrenchIQ fills that gap — reading the RO and surfacing evidence-based recommendations while the vehicle is on the lift and the customer is still in front of you.",
    { x: 0.95, y: 6.05, w: 11.4, h: 0.72, fontSize: 12, color: "E7EDEF", fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );
  footer(s, "The Shop Floor Today");
}

// ── Slide 3 — What It Does ──────────────────────────────────────────────
{
  const s = pres.addSlide();
  eyebrow(s, "What It Does");
  bigTitle(s, "Three Jobs, Done in Real Time on Every RO");

  const jobs = [
    { label: "JOB 1", color: C.primary, title: "Intake & Diagnosis Intelligence",
      body: "Reads each RO as it's written and recommends related repairs, due maintenance, and TSBs for that exact vehicle.",
      outcome: "Higher average RO · Fewer comebacks" },
    { label: "JOB 2", color: "2563EB", title: "RO Narration & Customer Trust",
      body: "Auto-writes clear complaint–cause–correction stories and customer talk tracks — because techs aren't writers.",
      outcome: "More approvals · Stronger trust" },
    { label: "JOB 3", color: C.success, title: "Evidence-Based Recommendations & Owner's Priorities",
      body: "Surfaces context-aware recommendations and keeps your priorities front and center — promos, programs, margin targets — on every ticket.",
      outcome: "Margin lift · Priorities on every RO" },
  ];
  const colW = 3.7, gap = 0.35, startX = 0.6, y = 1.9, cardH = 3.7;
  jobs.forEach((j, i) => {
    const x = startX + i * (colW + gap);
    s.addShape(pres.ShapeType.roundRect, { x, y, w: colW, h: 0.5, rectRadius: 0.06, fill: { color: j.color }, line: { type: "none" } });
    s.addText(j.label, { x, y, w: colW, h: 0.5, align: "center", valign: "middle", fontSize: 12, bold: true, color: "FFFFFF", charSpacing: 1, fontFace: "Calibri" });
    s.addShape(pres.ShapeType.roundRect, { x, y: y + 0.6, w: colW, h: cardH - 0.6, rectRadius: 0.06, fill: { color: C.cardBg }, line: { color: C.border, width: 1 } });
    s.addText(j.title, { x: x + 0.2, y: y + 0.8, w: colW - 0.4, h: 0.75, fontSize: 13.5, bold: true, color: C.textPrimary, fontFace: "Calibri" });
    s.addText(j.body, { x: x + 0.2, y: y + 1.55, w: colW - 0.4, h: 1.3, fontSize: 11.5, color: C.textSecondary, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
    s.addText(j.outcome, { x: x + 0.2, y: y + cardH - 0.65, w: colW - 0.4, h: 0.45, fontSize: 11, bold: true, color: j.color, fontFace: "Calibri" });
  });
  footer(s, "What It Does");
}

// ── Slide 4 — Product Story Part 1 ──────────────────────────────────────
{
  const s = pres.addSlide();
  eyebrow(s, "The Sidecar in Action · Part 1");
  bigTitle(s, "One Customer, Start to Finish: Meet Frank", { fontSize: 27 });

  const steps = [
    { n: 1, t: "Health check", b: "Advisor opens the Sidecar next to Mitchell1 ShopManager SE — LLM and data feed both confirm connected before touching a single RO." },
    { n: 2, t: "Frank checks in", b: "2018 Honda CR-V, brakes feel soft. Frank's RO appears in the queue the moment it's opened in the shop's real system — same data, no re-entry." },
    { n: 3, t: "WrenchIQ reads the RO", b: "It reads Frank's concern, his service history, and his 68,200 miles — then drafts recommendations and a customer-ready message, before the advisor asks." },
  ];
  const textX = 0.6, textW = 4.5, y0 = 1.85, rowH = 1.65;
  steps.forEach((st, i) => {
    const y = y0 + i * rowH;
    numberBadge(s, st.n, textX, y, C.accent);
    s.addText(st.t, { x: textX + 0.5, y: y - 0.05, w: textW - 0.5, h: 0.4, fontSize: 14, bold: true, color: C.textPrimary, fontFace: "Calibri" });
    s.addText(st.b, { x: textX + 0.5, y: y + 0.35, w: textW - 0.5, h: 1.15, fontSize: 11, color: C.textSecondary, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
  });

  const imgY = 1.75, imgW = 2.15, imgGap = 0.28, startX = 5.5;
  phoneShot(s, "1-health.png", startX, imgY, imgW, { caption: "1 · Connections confirmed" });
  phoneShot(s, "2-queue.png", startX + (imgW + imgGap), imgY, imgW, { caption: "2 · Frank's RO in queue" });
  phoneShot(s, "3-intelligence.png", startX + 2 * (imgW + imgGap), imgY, imgW, { caption: "3 · AI reads the RO" });
  footer(s, "One Customer, Start to Finish (Part 1)");
}

// ── Slide 5 — Product Story Part 2 ──────────────────────────────────────
{
  const s = pres.addSlide();
  eyebrow(s, "The Sidecar in Action · Part 2");
  bigTitle(s, "From Recommendation to Hand-Off", { fontSize: 27 });

  const steps = [
    { n: 4, t: "Advisor accepts, WrenchIQ prices it", b: "One tap accepts the brake fluid flush; WrenchIQ matches parts/labor and adds it to the RO — the advisor makes the final call, always." },
    { n: 5, t: "Transfer to the shop's real system", b: "Accepted jobs are packaged to write back into Mitchell1 ShopManager SE — no new system for the advisor to learn, no double entry." },
    { n: 6, t: "RO Score & Chat, on the same screen", b: "A live Gold Standard score checks the RO's own hygiene against the shop's guidelines, and chat answers any follow-up question — same customer, same tab." },
  ];
  const textX = 0.6, textW = 4.5, y0 = 1.85, rowH = 1.65;
  steps.forEach((st, i) => {
    const y = y0 + i * rowH;
    numberBadge(s, st.n, textX, y, C.accent);
    s.addText(st.t, { x: textX + 0.5, y: y - 0.05, w: textW - 0.5, h: 0.4, fontSize: 14, bold: true, color: C.textPrimary, fontFace: "Calibri" });
    s.addText(st.b, { x: textX + 0.5, y: y + 0.35, w: textW - 0.5, h: 1.15, fontSize: 11, color: C.textSecondary, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
  });

  const imgY = 1.75, imgW = 2.15, imgGap = 0.28, startX = 5.5;
  phoneShot(s, "5-added-to-ro.png", startX, imgY, imgW, { caption: "4 · Accepted & priced" });
  phoneShot(s, "6-transfer-modal.png", startX + (imgW + imgGap), imgY, imgW, { caption: "5 · Transfer to Mitchell1" });
  phoneShot(s, "7-ro-score.png", startX + 2 * (imgW + imgGap), imgY, imgW, { caption: "6 · RO Score, live" });
  footer(s, "From Recommendation to Hand-Off (Part 2)");
}

// ── Slide 6 — Predii-Learn ───────────────────────────────────────────────
{
  const s = pres.addSlide();
  eyebrow(s, "Predii-Learn");
  bigTitle(s, "It Learns Your Shop, Not the Industry Average");

  const bullets = [
    { t: "Your own repair-order history", b: "Runs entity extraction over years of this shop's actual ROs — symptoms, jobs, components, DTCs — not a generic industry dataset." },
    { t: "Shop Profile", b: "Builds an aggregated profile of what this shop actually does, at what price, so recommendations and canned-job pricing are grounded in reality." },
    { t: "Powers everything downstream", b: "Canned-job pricing, RO Chat, and the recommendations Frank's advisor saw a moment ago all draw on this — the more history it reads, the sharper it gets." },
  ];
  const textX = 0.6, textW = 5.3, y0 = 2.0;
  bullets.forEach((bl, i) => {
    const y = y0 + i * 1.55;
    s.addShape(pres.ShapeType.roundRect, { x: textX, y, w: 0.14, h: 0.14, fill: { color: C.accent }, line: { type: "none" } });
    s.addText(bl.t, { x: textX + 0.35, y: y - 0.12, w: textW - 0.35, h: 0.4, fontSize: 14, bold: true, color: C.textPrimary, fontFace: "Calibri" });
    s.addText(bl.b, { x: textX + 0.35, y: y + 0.28, w: textW - 0.35, h: 1.1, fontSize: 11.5, color: C.textSecondary, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
  });

  wideShot(s, "predii-learn.png", 6.35, 1.9, 6.4, 4.0, { caption: "Predii Learn — Cornerstone Auto Group's own repair history" });
  footer(s, "Predii-Learn");
}

// ── Slide 7 — Shop Objectives ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  eyebrow(s, "Shop Objectives");
  bigTitle(s, "Your Playbook, Enforced on Every RO");

  wideShot(s, "shop-objectives.png", 0.6, 1.9, 6.4, 4.0, { caption: "Strategic Priorities, live in the WrenchIQ AI panel" });

  const bullets = [
    { t: "Rules the owner sets once", b: "“Offer a brake fluid flush on any vehicle over 50,000 miles.” “Check factory warranty coverage before billing a TSB repair.” Written once, applied every time." },
    { t: "Surfaced to advisors automatically", b: "WrenchIQ keeps these priorities in front of whoever's at the counter that day — not just the advisor who remembers Monday's meeting." },
    { t: "Same trust as Predii-Learn", b: "Objectives plus the shop's own history means every recommendation reflects how this shop actually wants to run — not a generic playbook." },
  ];
  const textX = 7.35, textW = 5.4, y0 = 2.0;
  bullets.forEach((bl, i) => {
    const y = y0 + i * 1.55;
    s.addShape(pres.ShapeType.roundRect, { x: textX, y, w: 0.14, h: 0.14, fill: { color: C.accent }, line: { type: "none" } });
    s.addText(bl.t, { x: textX + 0.35, y: y - 0.12, w: textW - 0.35, h: 0.4, fontSize: 14, bold: true, color: C.textPrimary, fontFace: "Calibri" });
    s.addText(bl.b, { x: textX + 0.35, y: y + 0.28, w: textW - 0.35, h: 1.1, fontSize: 11.5, color: C.textSecondary, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
  });
  footer(s, "Shop Objectives");
}

// ── Slide 8 — Today's Discussion ─────────────────────────────────────────
{
  const s = pres.addSlide();
  eyebrow(s, "Today's Discussion");
  bigTitle(s, "Your Feedback — and Where We Go Next");

  const colW = 5.7, gap = 0.6, startX = 0.6, y = 2.0, cardH = 4.6;
  const cols = [
    { title: "What We'd Like From You", color: C.primary, items: [
      "Do we hit the right use cases?",
      "Does this fit how your shop actually runs day to day?",
      "How should it be delivered so it feels natural at the counter?",
    ] },
    { title: "Possible Next Steps", color: C.accent, items: [
      "A low-lift pilot on your own ROs, measured against numbers you already track.",
      "Interested in a POC? The value proves itself on your floor first.",
      "Benefit, cost & commercials — and what else we should build.",
    ] },
  ];
  cols.forEach((col, i) => {
    const x = startX + i * (colW + gap);
    s.addShape(pres.ShapeType.roundRect, { x, y, w: colW, h: cardH, rectRadius: 0.08, fill: { color: C.cardBg }, line: { color: C.border, width: 1 } });
    s.addText(col.title, { x: x + 0.3, y: y + 0.25, w: colW - 0.6, h: 0.5, fontSize: 15, bold: true, color: col.color, fontFace: "Calibri" });
    s.addText(col.items.map((t) => ({ text: t, options: { bullet: { code: "2022" }, breakLine: true, paraSpaceAfter: 20 } })), {
      x: x + 0.3, y: y + 0.85, w: colW - 0.6, h: cardH - 1.1, fontSize: 14, color: C.textSecondary, fontFace: "Calibri", lineSpacingMultiple: 1.3, valign: "top",
    });
  });
  footer(s, "Today's Discussion");
}

// ── Slide 9 — Thank You ──────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.primary };
  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 0.55, w: 0.5, h: 0.5, rectRadius: 0.1, fill: { color: C.accent }, line: { type: "none" } });
  s.addText("PREDII", { x: 1.2, y: 0.55, w: 3, h: 0.5, fontSize: 16, bold: true, color: "FFFFFF", charSpacing: 1, valign: "middle", fontFace: "Calibri" });
  s.addText("Thank you.", { x: 0.6, y: 3.0, w: 10, h: 1.0, fontSize: 44, bold: true, color: "FFFFFF", fontFace: "Cambria" });
  s.addText("Let's put WrenchIQ to work on your floor.", { x: 0.6, y: 3.95, w: 10, h: 0.6, fontSize: 18, color: C.accentLight, fontFace: "Calibri" });
  footer(s, "Close");
}

pres.writeFile({ fileName: "docs/WrenchIQ Overview - Sidecar Story.pptx" }).then(() => {
  console.log("done");
});
