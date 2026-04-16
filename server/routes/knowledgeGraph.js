/**
 * WrenchIQ — Knowledge Graph Routes
 *
 * GET  /api/knowledge-graph             full graph (nodes + links) from wrenchiq_ro
 * GET  /api/knowledge-graph/clusters    cluster summary nodes from wrenchiq_clusters
 * POST /api/knowledge-graph/ask         LLM Q&A powered by KG data
 *
 * Graph node types: vehicle, customer, repair_job, part, rooftop, cluster
 * Graph link types: OWNS, HAD_REPAIR, USED_PART, SERVICED_AT, IN_CLUSTER, ASSOCIATED_WITH
 */

import { Router } from 'express';
import {
  AZURE_OPENAI_API_KEY,
  CLAUDE_MAX_TOKENS_CHAT,
} from '../config.js';
import { callAzureOpenAI, getTextFromResponse } from '../services/azureOpenAI.js';

const router = Router();
const RO_COLL      = 'wrenchiq_ro';
const CLUSTER_COLL = 'wrenchiq_clusters';

// Canonical make names matching VCdb normalized_make — used for indexed exact-match queries
const MAKE_CANONICAL = {
  'toyota':      'Toyota',
  'honda':       'Honda',
  'ford':        'Ford',
  'chevy':       'Chevrolet',
  'chevrolet':   'Chevrolet',
  'bmw':         'BMW',
  'mercedes':    'Mercedes-Benz',
  'nissan':      'Nissan',
  'hyundai':     'Hyundai',
  'kia':         'Kia',
  'subaru':      'Subaru',
  'audi':        'Audi',
  'volkswagen':  'Volkswagen',
  'vw':          'Volkswagen',
  'lexus':       'Lexus',
  'jeep':        'Jeep',
  'ram':         'Ram',
  'dodge':       'Dodge',
  'gmc':         'GMC',
  'mazda':       'Mazda',
  'acura':       'Acura',
  'infiniti':    'Infiniti',
};

// ── Full graph ────────────────────────────────────────────────────────────────
//  Query params:
//    rooftop   = rooftop_id filter (e.g. "rooftop-pa")
//    limit     = max ROs to include (default 50)
//    focus     = node id — return only nodes within 2 hops of this node
router.get('/', async (req, res) => {
  try {
    const { rooftop, limit = 50, focus } = req.query;
    const cacheKey = `kg:graph:${rooftop || 'all'}:${limit}:${focus || ''}`;
    const cached = req.cache?.get(cacheKey);
    if (cached) return res.json(cached);

    const filter = {};
    if (rooftop) filter['shop.id'] = rooftop;

    const ros = await req.db
      .collection(RO_COLL)
      .find(filter)
      .sort({ date_in: -1 })
      .limit(Number(limit))
      .toArray();

    const nodes = new Map();   // id → node
    const links = [];

    const addNode = (node) => {
      if (!nodes.has(node.id)) nodes.set(node.id, node);
    };

    for (const ro of ros) {
      // ── Shop / Rooftop node ───────────────────────────────────
      const shop = ro.shop || {};
      const rooftopId = `rooftop:${shop.id || 'unknown'}`;
      addNode({
        id:    rooftopId,
        label: shop.name || 'Unknown Shop',
        type:  'rooftop',
        meta:  { city: shop.city, state: shop.state, chain: ro.chain?.name },
      });

      // ── Customer node ─────────────────────────────────────────
      const cust   = ro.customer || {};
      const custId = `customer:${cust.id || cust.name?.replace(/\s/g,'_') || 'unknown'}`;
      addNode({
        id:    custId,
        label: cust.name || 'Unknown Customer',
        type:  'customer',
        meta:  { phone: cust.phone, email: cust.email },
      });

      // ── Vehicle node ──────────────────────────────────────────
      const veh = ro.vehicle || {};
      const vehicleKey = veh.vcdb?.base_vehicle_id
        ? `vehicle:bv${veh.vcdb.base_vehicle_id}`
        : `vehicle:${veh.year}_${veh.make}_${veh.model}`.replace(/\s/g,'_');

      addNode({
        id:    vehicleKey,
        label: `${veh.year} ${veh.make} ${veh.model}`,
        type:  'vehicle',
        meta: {
          base_vehicle_id:  veh.vcdb?.base_vehicle_id,
          normalized_make:  veh.vcdb?.normalized_make,
          normalized_model: veh.vcdb?.normalized_model,
          match_method:     veh.vcdb?.match_method,
          engine_options:   veh.vcdb?.possible_engine_configs?.length || 0,
          mileage:          ro.ro_metadata?.mileage_in,
        },
      });

      links.push({ source: custId,    target: vehicleKey, type: 'OWNS' });
      links.push({ source: vehicleKey, target: rooftopId, type: 'SERVICED_AT' });

      // ── Repair jobs ───────────────────────────────────────────
      const seenJobs = new Set();
      for (const job of (ro.repair_jobs || [])) {
        const jobLabel = job.repair_job || job.description || 'Unknown Job';
        const jobId = `job:${jobLabel.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')}`;

        addNode({
          id:    jobId,
          label: jobLabel,
          type:  'repair_job',
          meta:  {
            normalizer_method: job.normalizer_method,
            labor_hours:       job.labor_hours,
          },
        });

        if (!seenJobs.has(jobId)) {
          links.push({ source: vehicleKey, target: jobId, type: 'HAD_REPAIR' });
          seenJobs.add(jobId);
        }

        // ── Parts attached to this job ─────────────────────────
        for (const part of (job.parts || [])) {
          const partLabel = part.repair_parts || part.description || 'Unknown Part';
          const partId = `part:${partLabel.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')}`;

          addNode({
            id:    partId,
            label: partLabel,
            type:  'part',
            meta:  {
              normalizer_score:  part.normalizer_score,
              normalizer_method: part.normalizer_method,
              unit_price:        part.unit_price,
            },
          });

          links.push({ source: jobId, target: partId, type: 'USED_PART' });
        }
      }
    }

    // ── Focus filter (2-hop neighborhood) ────────────────────────────────────
    let filteredNodes = [...nodes.values()];
    let filteredLinks = links;

    if (focus && nodes.has(focus)) {
      const neighborIds = new Set([focus]);
      // 1 hop
      for (const l of links) {
        if (l.source === focus) neighborIds.add(l.target);
        if (l.target === focus) neighborIds.add(l.source);
      }
      // 2 hops
      const firstHop = [...neighborIds];
      for (const l of links) {
        if (firstHop.includes(l.source)) neighborIds.add(l.target);
        if (firstHop.includes(l.target)) neighborIds.add(l.source);
      }
      filteredNodes = filteredNodes.filter(n => neighborIds.has(n.id));
      filteredLinks = links.filter(l => neighborIds.has(l.source) && neighborIds.has(l.target));
    }

    const payload = {
      node_count: filteredNodes.length,
      link_count: filteredLinks.length,
      ro_count:   ros.length,
      nodes:      filteredNodes,
      links:      filteredLinks,
    };
    req.cache?.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cluster summary ───────────────────────────────────────────────────────────
//  Returns cluster nodes + edges to their top repair jobs for overlay view
router.get('/clusters', async (req, res) => {
  try {
    const { type } = req.query;
    const cacheKey = `kg:clusters:${type || 'all'}`;
    const cached = req.cache?.get(cacheKey);
    if (cached) return res.json(cached);

    const filter = { ro_count: { $gte: 2 } };
    if (type) filter.cluster_type = type;

    const clusters = await req.db
      .collection(CLUSTER_COLL)
      .find(filter)
      .sort({ ro_count: -1 })
      .limit(100)
      .toArray();

    const nodes = [];
    const links = [];
    const jobNodes = new Map();

    for (const c of clusters) {
      const clusterId = `cluster:${c.cluster_id}`;
      nodes.push({
        id:    clusterId,
        label: c.cluster_id.replace(/^(vgen|eng):/, '').replace(/_/g, ' '),
        type:  c.cluster_type === 'vehicle_generation' ? 'vgen_cluster' : 'eng_cluster',
        meta:  {
          ro_count:    c.ro_count,
          data_quality: c.data_quality,
          makes:       c.makes,
          rule_count:  c.association_rules?.length || 0,
        },
      });

      // Top 3 repair jobs per cluster
      for (const job of (c.top_repair_jobs || []).slice(0, 3)) {
        const jobId = `job:${job.repair_job.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')}`;
        if (!jobNodes.has(jobId)) {
          jobNodes.set(jobId, {
            id:    jobId,
            label: job.repair_job,
            type:  'repair_job',
            meta:  { frequency: job.frequency, count: job.count },
          });
        }
        links.push({
          source:    clusterId,
          target:    jobId,
          type:      'TOP_JOB',
          frequency: job.frequency,
        });
      }

      // Top association rule edges (confidence ≥ 0.5)
      for (const rule of (c.association_rules || []).filter(r => r.confidence >= 0.5).slice(0, 2)) {
        const srcId = `job:${rule.antecedent.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')}`;
        const tgtId = `job:${rule.consequent.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')}`;
        links.push({ source: srcId, target: tgtId, type: 'ASSOCIATED_WITH', lift: rule.lift, confidence: rule.confidence });
      }
    }

    nodes.push(...jobNodes.values());

    const total_ros = await req.db.collection(RO_COLL).estimatedDocumentCount();

    const payload = {
      cluster_count: clusters.length,
      node_count:    nodes.length,
      link_count:    links.length,
      total_ros,
      // Flat clusters array for dashboard/gateway panels — simpler to consume
      clusters: clusters.map(c => ({
        cluster_label: c.cluster_id.replace(/^(vgen|eng):/, '').replace(/_/g, ' '),
        cluster_type:  c.cluster_type,
        ro_count:      c.ro_count,
        makes:         c.makes || [],
        avg_ro_value:  c.avg_ro_value,
        top_jobs:      (c.top_repair_jobs || []).slice(0, 3).map(j => j.repair_job),
      })),
      nodes,
      links,
    };
    req.cache?.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stats — RO distribution for AI Insights dashboard ────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const cached = req.cache?.get('kg:stats');
    if (cached) return res.json(cached);

    const [roByShop, topJobs, topMakes, customers] = await Promise.all([
      req.db.collection(RO_COLL).aggregate([
        { $group: { _id: '$shop.name', count: { $sum: 1 }, shop_id: { $first: '$shop.id' } } },
        { $sort: { count: -1 } },
      ]).toArray(),

      req.db.collection(RO_COLL).aggregate([
        { $unwind: '$repair_jobs' },
        { $group: {
          _id:   '$repair_jobs.repair_job',
          count: { $sum: 1 },
        }},
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ], { allowDiskUse: true }).toArray(),

      req.db.collection(RO_COLL).aggregate([
        { $group: { _id: '$vehicle.vcdb.normalized_make', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]).toArray(),

      req.db.collection(RO_COLL).aggregate([
        { $group: { _id: '$customer.id', name: { $first: '$customer.name' }, ro_count: { $sum: 1 } } },
        { $match: { name: { $ne: null } } },
        { $sort: { ro_count: -1 } },
        { $limit: 60 },
      ]).toArray(),
    ]);

    const payload = {
      ro_by_shop: roByShop.map(s => ({ name: s._id || 'Unknown', count: s.count, shop_id: s.shop_id })),
      top_jobs:   topJobs.map(j => ({ job: j._id, count: j.count })),
      top_makes:  topMakes.map(m => ({ make: m._id, count: m.count })),
      customers:  customers.map(c => ({ id: c._id, name: c.name, ro_count: c.ro_count })),
    };
    req.cache?.set('kg:stats', payload);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LLM Q&A powered by Knowledge Graph data ───────────────────────────────────
//  POST body: { question, history?, location?, customer_name? }
//  Returns:   { answer, data_used, suggested_questions }
router.post('/ask', async (req, res) => {
  try {
    const { question, history = [], location, customer_name } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'question required' });

    if (!AZURE_OPENAI_API_KEY) return res.status(500).json({ error: 'AZURE_OPENAI_API_KEY not configured — set it in .env.local' });

    // ── 1. Assemble context from MongoDB ─────────────────────────────────────
    const q = question.toLowerCase();
    const roFilter = {};
    if (location) roFilter['shop.name'] = { $regex: location, $options: 'i' };
    if (customer_name) roFilter['customer.name'] = { $regex: customer_name, $options: 'i' };

    // Always fetch top-level stats + clusters in parallel
    const [roCount, clusterCount, topClusters] = await Promise.all([
      req.db.collection(RO_COLL).countDocuments(roFilter),
      req.db.collection(CLUSTER_COLL).estimatedDocumentCount(),
      req.db.collection(CLUSTER_COLL)
        .find({ ro_count: { $gte: 2 } })
        .sort({ ro_count: -1 })
        .limit(10)
        .toArray(),
    ]);

    // ── Detect intent and fire all needed queries in parallel ─────────────────
    const makeKeywords = ['toyota','honda','ford','chevy','chevrolet','bmw','mercedes','nissan','hyundai','kia','subaru','audi','volkswagen','vw','lexus','jeep','ram','dodge','gmc','mazda','acura','infiniti'];
    const jobKeywords  = ['oil','brake','tire','transmission','engine','battery','filter','coolant','alignment','suspension','spark','plug','alternator','belt','ac','air conditioning','check engine'];

    const mentionedMake = makeKeywords.find(m => q.includes(m));
    const mentionedJob  = jobKeywords.find(j => q.includes(j));
    const wantsRevenue  = q.includes('revenue') || q.includes('cost') || q.includes('price') || q.includes('expensive') || q.includes('profit');
    const wantsParts    = q.includes('part') || q.includes('affinity') || q.includes('together') || q.includes('bundle') || q.includes('upsell');
    const wantsShop     = q.includes('shop') || q.includes('rooftop') || q.includes('location') || q.includes('branch');

    const canonicalMake = mentionedMake ? (MAKE_CANONICAL[mentionedMake] ?? null) : null;

    // Build all conditional queries as promises, resolved to null if not needed
    const [makeROs, relevantClusters, priceData, affinityClusters, shopStats, customerROs] = await Promise.all([
      mentionedMake
        ? req.db.collection(RO_COLL)
            .find({ ...roFilter, ...(canonicalMake
              ? { 'vehicle.vcdb.normalized_make': canonicalMake }
              : { 'vehicle.make': { $regex: mentionedMake, $options: 'i' } }) })
            .limit(20)
            .toArray()
        : Promise.resolve(null),

      mentionedJob
        ? req.db.collection(CLUSTER_COLL)
            .find({ 'top_repair_jobs.repair_job': { $regex: mentionedJob, $options: 'i' } })
            .limit(5)
            .toArray()
        : Promise.resolve(null),

      wantsRevenue
        ? req.db.collection(RO_COLL).aggregate([
            { $unwind: '$repair_jobs' },
            { $unwind: '$repair_jobs.parts' },
            { $group: {
                _id: '$repair_jobs.parts.repair_parts',
                avg_price: { $avg: '$repair_jobs.parts.unit_price' },
                count: { $sum: 1 },
            }},
            { $sort: { avg_price: -1 } },
            { $limit: 8 },
          ], { allowDiskUse: true }).toArray()
        : Promise.resolve(null),

      wantsParts
        ? req.db.collection(CLUSTER_COLL)
            .find({ 'part_affinity': { $exists: true, $ne: [] } })
            .sort({ ro_count: -1 })
            .limit(5)
            .toArray()
        : Promise.resolve(null),

      wantsShop
        ? req.db.collection(RO_COLL).aggregate([
            { $match: roFilter },
            { $group: {
                _id: '$shop.name',
                ro_count: { $sum: 1 },
                avg_mileage: { $avg: '$ro_metadata.mileage_in' },
            }},
            { $sort: { ro_count: -1 } },
          ], { allowDiskUse: true }).toArray()
        : Promise.resolve(null),

      // Customer-specific ROs when customer filter is active
      customer_name
        ? req.db.collection(RO_COLL)
            .find({ 'customer.name': { $regex: customer_name, $options: 'i' } })
            .sort({ date_in: -1 })
            .limit(10)
            .toArray()
        : Promise.resolve(null),
    ]);

    // ── Build extraContext from parallel results ───────────────────────────────
    const dataSources = ['wrenchiq_clusters (top 10)', 'wrenchiq_ro (aggregate stats)'];
    let extraContext = '';

    if (makeROs) {
      const jobFreq = {};
      for (const ro of makeROs) {
        for (const job of (ro.repair_jobs || [])) {
          const j = job.repair_job || job.description;
          if (j) jobFreq[j] = (jobFreq[j] || 0) + 1;
        }
      }
      const topJobs = Object.entries(jobFreq).sort((a,b) => b[1]-a[1]).slice(0,8);
      extraContext += `\n### ${mentionedMake.toUpperCase()} specific data (${makeROs.length} ROs found)\nTop repair jobs: ${topJobs.map(([j,c]) => `${j} (${c}x)`).join(', ')}\n`;
      dataSources.push(`wrenchiq_ro filtered by make=${mentionedMake} (${makeROs.length} records)`);
    }

    if (relevantClusters?.length) {
      const rules = relevantClusters.flatMap(c =>
        (c.association_rules || [])
          .filter(r => r.antecedent.toLowerCase().includes(mentionedJob) || r.consequent.toLowerCase().includes(mentionedJob))
          .slice(0, 4)
      );
      if (rules.length) {
        extraContext += `\n### Association rules for "${mentionedJob}"\n`;
        extraContext += rules.map(r => `  IF ${r.antecedent} → THEN ${r.consequent} (confidence=${(r.confidence*100).toFixed(0)}%, lift=${r.lift?.toFixed(2)})`).join('\n');
        extraContext += '\n';
      }
      dataSources.push(`wrenchiq_clusters filtered for job="${mentionedJob}" (${relevantClusters.length} clusters)`);
    }

    if (priceData?.length) {
      extraContext += `\n### Top parts by average price\n${priceData.map(p => `${p._id}: $${p.avg_price?.toFixed(2)} avg (${p.count} occurrences)`).join('\n')}\n`;
      dataSources.push('wrenchiq_ro parts price aggregation');
    }

    if (affinityClusters?.length) {
      const topAffinity = affinityClusters.flatMap(c =>
        (c.part_affinity || []).slice(0, 3).map(p => `${p.part_a} + ${p.part_b} (support=${(p.support*100).toFixed(1)}%)`)
      ).slice(0, 10);
      if (topAffinity.length) {
        extraContext += `\n### Part affinity pairs (frequently bought together)\n${topAffinity.join('\n')}\n`;
        dataSources.push('wrenchiq_clusters.part_affinity');
      }
    }

    if (shopStats?.length) {
      extraContext += `\n### Shop performance\n${shopStats.map(s => `${s._id}: ${s.ro_count} ROs, avg mileage ${s.avg_mileage?.toFixed(0)}`).join('\n')}\n`;
      dataSources.push('wrenchiq_ro grouped by shop');
    }

    if (customerROs?.length) {
      const custName = customerROs[0]?.customer?.name || customer_name;
      const custJobs = customerROs.flatMap(ro => (ro.repair_jobs || []).map(j => j.repair_job || j.description)).filter(Boolean);
      const custVehicles = [...new Set(customerROs.map(ro => `${ro.vehicle?.year} ${ro.vehicle?.make} ${ro.vehicle?.model}`))];
      extraContext += `\n### Customer: ${custName} (${customerROs.length} ROs on file)\nVehicles: ${custVehicles.join(', ')}\nPast repairs: ${custJobs.slice(0, 10).join(', ')}\n`;
      dataSources.push(`wrenchiq_ro for customer "${customer_name}" (${customerROs.length} records)`);
    }

    if (location) {
      extraContext += `\n### Active filter: Location = "${location}"\nAll data above is scoped to this location.\n`;
    }

    // ── 2. Build structured context ───────────────────────────────────────────
    const clusterSummary = topClusters.map(c => {
      const topJobs = (c.top_repair_jobs || []).slice(0, 5).map(j => `${j.repair_job} (${(j.frequency*100).toFixed(0)}%)`).join(', ');
      const topRules = (c.association_rules || []).slice(0, 2).map(r => `${r.antecedent}→${r.consequent} (${(r.confidence*100).toFixed(0)}%)`).join('; ');
      return `Cluster: ${c.cluster_id} | Type: ${c.cluster_type} | ROs: ${c.ro_count} | Makes: ${(c.makes||[]).join(',')} | Top jobs: ${topJobs} | Top rules: ${topRules}`;
    }).join('\n');

    const filterNote = [location && `location: ${location}`, customer_name && `customer: ${customer_name}`].filter(Boolean).join(', ');

    const systemPrompt = `You are a service advisor assistant at an auto repair shop. You have access to real repair history data for ${roCount} repair orders across ${clusterCount} vehicle clusters.
${filterNote ? `\nACTIVE FILTERS: ${filterNote}\n` : ''}
REPAIR HISTORY DATA:
${clusterSummary}
${extraContext}

RESPONSE FORMAT — use exactly this structure, written for a service advisor on the shop floor:

**Bottom Line:**
[One plain-English sentence — the single most useful takeaway. Write like you're telling a colleague, not a report. Example: "Almost every Toyota that comes in for brakes also needs an alignment."]

**What the data shows:**
1. [Specific finding — use real numbers, written simply. "7 out of 13 Toyotas needed an oil change" not "53.8%"]
2. [Next finding]
3. [Next finding — max 4 items total]

**Why this answer:**
- [Name the actual data that backs this up. "Based on 13 Toyota repair orders in the database" or "The 4-cylinder engine cluster (22 ROs) shows this pattern consistently"]
- [Second evidence point if relevant]

**At the counter:**
[A single practical script or action. Write as a direct quote or instruction the advisor can use TODAY. Example: "When a customer brings in a Honda Civic for an oil change, ask: 'When did you last have your air filter checked? We're seeing that come up a lot on Civics right now.'"]

RULES:
- Use ONLY the data provided above — no invented numbers
- Avoid technical jargon: say "engine group" not "cluster ID", say "oil change" not "LOF SERVICE"
- Be specific with numbers but keep language conversational
- The "At the counter" section must be actionable TODAY, not generic advice`;

    // ── 3. Build messages array (with history) ────────────────────────────────
    const messages = [
      ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: question },
    ];

    // ── 4. Call Azure OpenAI ──────────────────────────────────────────────────
    let azureData;
    try {
      azureData = await callAzureOpenAI({
        system:     systemPrompt,
        messages,
        max_tokens: CLAUDE_MAX_TOKENS_CHAT,
      });
    } catch (apiErr) {
      return res.status(502).json({ error: apiErr.message });
    }

    const answer = getTextFromResponse(azureData) || '(no response)';

    // ── 5. Suggested follow-up questions ─────────────────────────────────────
    const suggested_questions = pickSuggestedQuestions(question, topClusters);

    res.json({ answer, data_used: dataSources, suggested_questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function pickSuggestedQuestions(question, clusters) {
  const q = question.toLowerCase();
  const pool = [
    "Which engine size generates the most repair work?",
    "What jobs are almost always done at the same visit?",
    "What are the most common repairs across all vehicles?",
    "What else usually gets done during an oil change visit?",
    "What should I recommend alongside a brake job?",
    "When a customer comes in for A/C service, what else should I check?",
    "What are the most expensive parts we use?",
    "What are the top repairs for Ford vehicles?",
    "What are the top repairs for Toyota vehicles?",
    "What are the top repairs for Chevrolet vehicles?",
    "What are the top repairs for Honda vehicles?",
    "Which shop location has the most repair orders?",
    "What parts do we go through the highest volume on?",
    "Which vehicle makes are most profitable to service?",
  ];
  // Return 3 questions that are NOT what was just asked
  return pool.filter(p => !p.toLowerCase().includes(q.split(' ')[0])).slice(0, 3);
}

export default router;
