/**
 * WrenchIQ — Canned Job Candidate Discovery
 *
 * Scans this shop's real RO history over the last LOOKBACK_DAYS and finds
 * repair jobs that keep recurring but aren't on the canned-job menu yet —
 * the kind of thing an advisor would notice ("we've done this five times
 * this month") but rarely gets around to formalizing into a priced menu
 * item. Every number in a candidate's proposedJob (labor hours, labor cost,
 * parts + their cost) is averaged from this shop's own historical line
 * items — never LLM-estimated — same "compute from real data instead of
 * asking the model to guess" pattern as reconcileTSBRecommendations() in
 * roAdvisorService.js.
 */

import { getCannedJobs } from './cannedJobsService.js';

const LOOKBACK_DAYS = 60;
const MIN_OCCURRENCES = 3;
const MAX_CANDIDATES = 5;

function normalize(desc) {
  return (desc || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// Same lightweight fuzzy check the client uses in matchCannedJob()
// (WrenchIQSidecarScreen.jsx) — substring match either direction — so a
// candidate that's just a slightly-differently-worded canned job doesn't
// get suggested as if it were new, unpriced work.
function alreadyOnMenu(desc, cannedJobs) {
  const norm = normalize(desc);
  if (!norm) return true;
  return cannedJobs.some((j) => {
    const jn = normalize(j.description);
    return jn && (jn.includes(norm) || norm.includes(jn));
  });
}

export async function findCannedJobCandidates(db, shopId) {
  if (!db || !shopId) return [];

  const cannedJobs = await getCannedJobs(db, shopId);
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const ros = await db.collection('RepairOrder')
    .find({ shopId, isCannedJobCatalog: { $ne: true }, dateIn: { $gte: since } })
    .project({ repairJobs: 1 })
    .toArray();

  const groups = new Map();

  for (const ro of ros) {
    for (const job of ro.repairJobs || []) {
      const desc = job.description;
      if (!desc || alreadyOnMenu(desc, cannedJobs)) continue;

      const key = normalize(desc);
      if (!groups.has(key)) {
        groups.set(key, { description: desc, count: 0, laborHrsSum: 0, laborCostSum: 0, parts: new Map() });
      }
      const g = groups.get(key);
      g.count += 1;
      g.laborHrsSum += job.laborHours || 0;
      g.laborCostSum += job.lineCost || 0;
      for (const p of job.parts || []) {
        if (!p.description) continue;
        const pk = normalize(p.description);
        if (!g.parts.has(pk)) g.parts.set(pk, { description: p.description, sum: 0, count: 0 });
        const pg = g.parts.get(pk);
        pg.sum += p.lineCost || 0;
        pg.count += 1;
      }
    }
  }

  return [...groups.values()]
    .filter((g) => g.count >= MIN_OCCURRENCES)
    .map((g) => {
      const laborHours = Math.round((g.laborHrsSum / g.count) * 100) / 100;
      const laborCost = Math.round(g.laborCostSum / g.count);
      const parts = [...g.parts.values()].map((p) => ({
        description: p.description,
        lineCost: Math.round(p.sum / p.count),
      }));
      const partsCost = parts.reduce((s, p) => s + p.lineCost, 0);
      return {
        description: g.description,
        occurrences: g.count,
        lookbackDays: LOOKBACK_DAYS,
        proposedJob: {
          description: g.description,
          laborHours,
          laborCost,
          parts,
          totalPrice: laborCost + partsCost,
        },
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, MAX_CANDIDATES);
}
