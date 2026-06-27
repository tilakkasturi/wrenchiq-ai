/**
 * WrenchIQ — RO Advisor Agent
 *
 * Tool-calling agent that briefs a human service advisor on a specific RO.
 * Consults customer history, shop ings/objectives, and mileage-appropriate
 * services, then produces concrete upsell recommendations with advisor talk tracks.
 *
 * Called every time an advisor selects an RO in the queue.
 *
 * Tools:
 *   get_customer_history(customerId)       — past ROs from MongoDB (fallback: demo data)
 *   get_shop_objectives(shopId)            — active ings from tribal_notes collection
 *   get_mileage_services(make, model, mileage) — standard interval services due at this mileage
 *
 * Returns:
 *   { advisorBrief, upsells[], ings[], alerts[], confidence, generatedAt }
 */

import { callAzureOpenAI, getTextFromResponse } from './azureOpenAI.js';
import { LLM_SKIP_TOOLS } from '../config.js';

// ── Fallback data (used when MongoDB is unreachable) ─────────────────────────

const DEMO_NOTES_FALLBACK = [
  { note: 'Add shop supply fee ($29.95) to every RO before closing', triggerType: 'any_ro' },
  { note: 'Offer alignment check on every tire rotation', triggerType: 'any_ro' },
  { note: 'Check cabin air filter on vehicles over 25K miles — 40 units in stock', triggerType: 'mileage_range:25000-999999' },
  { note: 'Present Predii protection plan to first-time customers before checkout', triggerType: 'any_ro' },
  { note: 'Remind customer about wiper blade replacement — offer front + rear while in', triggerType: 'any_ro' },
  { note: 'Ford F-150: offer 10% off brake job — mention before presenting estimate', triggerType: 'vehicle_make:ford' },
];

// ── Data fetchers (each tolerates MongoDB failure gracefully) ─────────────────

async function fetchCustomerHistory(customerId, db) {
  if (!db || !customerId) return [];
  try {
    const query   = { 'customer.id': customerId };
    const [ros, wqros] = await Promise.all([
      db.collection('RepairOrder')
        .find(query)
        .sort({ dateIn: -1 })
        .limit(8)
        .project({ roNumber: 1, dateIn: 1, serviceCategory: 1, repairJobs: 1, invoice: 1, dtcs: 1 })
        .toArray(),
      db.collection('wrenchiq_ro')
        .find(query)
        .sort({ date_in: -1 })
        .limit(8)
        .project({ ro_number: 1, date_in: 1, service_category: 1, repair_jobs: 1, invoice: 1 })
        .toArray(),
    ]);

    const normalize = (ro, isWQ) => ({
      roNumber:         isWQ ? ro.ro_number    : ro.roNumber,
      date:             isWQ ? ro.date_in      : ro.dateIn,
      serviceType:      isWQ ? ro.service_category : ro.serviceCategory,
      services:         isWQ
        ? (ro.repair_jobs || []).map(j => j.repair_job || j.description || '').filter(Boolean)
        : (ro.repairJobs  || []).map(j => j.description || j.name || j.service || '').filter(Boolean),
      declinedServices: [],
      totalEstimate:    typeof ro.invoice === 'number' ? ro.invoice : (ro.invoice?.total || 0),
      dtcs:             ro.dtcs || [],
    });

    const all = [
      ...ros.map(r => normalize(r, false)),
      ...wqros.map(r => normalize(r, true)),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    return all;
  } catch (err) {
    console.warn('[roAdvisor] fetchCustomerHistory error:', err.message);
    return [];
  }
}

async function fetchShopObjectives(shopId, db) {
  if (!db) return DEMO_NOTES_FALLBACK;
  try {
    const col  = db.collection('tribal_notes');
    const docs = await col.find({ shopId, active: true }).toArray();
    return docs.length > 0 ? docs : DEMO_NOTES_FALLBACK;
  } catch {
    return DEMO_NOTES_FALLBACK;
  }
}

// Standard automotive maintenance intervals — domain knowledge, not shop logic
function getMileageServices(make = '', model = '', mileage = 0) {
  const services = [];
  const m = mileage;
  const mk = make.toLowerCase();

  if (m >= 3000  && m % 5000   < 3000) services.push({ service: 'Engine Air Filter',        interval: 'every 15-20k mi', estimatedCost: 45  });
  if (m >= 15000)                       services.push({ service: 'Cabin Air Filter',          interval: 'every 15-20k mi', estimatedCost: 65  });
  if (m >= 30000)                       services.push({ service: 'Brake Fluid Flush',         interval: 'every 30k mi',    estimatedCost: 89  });
  if (m >= 45000)                       services.push({ service: 'Transmission Fluid Service',interval: 'every 45-60k mi', estimatedCost: 175 });
  if (m >= 50000)                       services.push({ service: 'Battery Test',              interval: '50k+ or 4 years', estimatedCost: 25  });
  if (m >= 60000 && (mk.includes('honda') || mk.includes('acura') || mk.includes('toyota') || mk.includes('subaru')))
                                        services.push({ service: 'Timing Belt Inspection',    interval: '60-90k mi (non-chain engines)', estimatedCost: 150 });
  if (m >= 75000)                       services.push({ service: 'Spark Plugs (iridium)',     interval: '75-100k mi',      estimatedCost: 195 });
  if (m >= 80000)                       services.push({ service: 'Coolant System Flush',      interval: 'every 5 years/80k mi', estimatedCost: 130 });

  return services;
}

// ── Tool definitions (OpenAI format) ─────────────────────────────────────────

const RO_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_customer_history',
      description:
        'Fetch the customer\'s last 8 repair orders from the shop\'s database. ' +
        'Returns services performed, declined services, DTCs, and total spend. ' +
        'Always call this first — it tells you what the customer has had done, ' +
        'what they have deferred, and how loyal they are.',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'The customer ID from the current RO' },
        },
        required: ['customerId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_shop_objectives',
      description:
        'Fetch today\'s active shop ings and advisor reminders. ' +
        'These are set by the shop owner and include: mandatory RO items (shop supply fee), ' +
        'promotions (10% off brakes for F-150s), and inventory pushes (40 cabin filters in stock). ' +
        'Filter these against the current vehicle before surfacing them.',
      parameters: {
        type: 'object',
        properties: {
          shopId: { type: 'string', description: 'Shop ID for scoping objectives' },
        },
        required: ['shopId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_mileage_services',
      description:
        'Return standard maintenance services that are typically due at this vehicle\'s current mileage. ' +
        'Use make and model to adjust for manufacturer-specific intervals (e.g. timing belt on non-chain engines). ' +
        'Cross-reference with customer history to avoid recommending something just done.',
      parameters: {
        type: 'object',
        properties: {
          make:    { type: 'string',  description: 'Vehicle make (e.g. Ford, Toyota)' },
          model:   { type: 'string',  description: 'Vehicle model (e.g. F-150, Highlander)' },
          mileage: { type: 'number',  description: 'Current odometer reading' },
        },
        required: ['mileage'],
      },
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(ro, vehicle, shopName) {
  const vehicleStr = vehicle
    ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} — ${(vehicle.mileage || 0).toLocaleString()} miles`
    : 'vehicle details not available';

  return `You are WrenchIQ Intelligence, an AI agent briefing a human service advisor before they walk out to greet a customer.

Current RO:
  Customer: ${ro.customerName || ro.customerId || 'Unknown'}
  Vehicle:  ${vehicleStr}
  In for:   ${ro.serviceType || ro.customerConcern || 'General service'}
  DTCs:     ${(ro.dtcs || []).join(', ') || 'none'}
  Shop:     ${shopName || 'Cornerstone Auto Group'}

Your job:
1. Call get_customer_history to understand this customer's visit history and any declined services.
2. Call get_shop_objectives to get today's active ings and promotions.
3. Call get_mileage_services to identify what's due at this vehicle's mileage.
4. Cross-reference all three sources to produce a prioritized, non-redundant recommendation set.

Rules:
- If the customer declined a service in the last 12 months, flag it as an alert — don't recommend it as a fresh upsell.
- Only surface ings that apply to this specific vehicle (honor triggerType filters: vehicle_make, mileage_range, any_ro).
- Talk tracks must sound natural — written in first-person for the advisor to say to the customer.
- Confidence = high if backed by specific data (declined service, exact mileage overdue), medium if mileage-based estimate.
- Keep upsells to the 3 most impactful. Do not recommend more than 3.

Respond ONLY with valid JSON — no prose, no markdown fences. Schema:
{
  "advisorBrief": string,          // one punchy sentence the advisor reads before walking out
  "upsells": [
    {
      "service":       string,     // service name, 3-6 words
      "reason":        string,     // why this applies — specific data point
      "estimatedCost": number,     // integer USD
      "confidence":    "high" | "medium",
      "talkTrack":     string      // what the advisor says to the customer, first person, 2-3 sentences
    }
  ],
  "ings": [
    {
      "note":    string,           // the ing text
      "applies": boolean,          // true if relevant to this vehicle/customer
      "reason":  string            // why it applies (or why not)
    }
  ],
  "alerts": [
    {
      "type":    "declined" | "overdue" | "pattern" | "dtc",
      "message": string            // specific alert for the advisor
    }
  ]
}`;
}

// ── Tool executor (synchronous — data pre-loaded) ─────────────────────────────

function executeTool(name, args, preloaded) {
  switch (name) {
    case 'get_customer_history':
      return {
        customerId:  args.customerId,
        historyCount: preloaded.history.length,
        visits:      preloaded.history.map(ro => ({
          date:             ro.dateIn?.toString().slice(0, 10),
          serviceType:      ro.serviceType,
          services:         (ro.services || []).map(s => s.name),
          declinedServices: ro.declinedServices || [],
          totalSpend:       ro.totalEstimate || 0,
          dtcs:             ro.dtcs || [],
        })),
      };

    case 'get_shop_objectives':
      return {
        shopId:     args.shopId,
        objectives: preloaded.objectives.map(o => ({
          note:        o.note,
          triggerType: o.triggerType || 'any_ro',
          noteType:    o.noteType    || 'ing',
        })),
      };

    case 'get_mileage_services':
      return {
        make:     args.make,
        model:    args.model,
        mileage:  args.mileage,
        dueServices: getMileageServices(args.make, args.model, args.mileage),
      };

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── Single-pass fallback (for LLMs that don't support tool_calls) ─────────────

async function runSinglePassAgent(ro, vehicle, shopName, preloaded) {
  const history    = preloaded.history.map(r => ({
    date: r.dateIn?.toString().slice(0, 10),
    services: (r.services || []).map(s => s.name),
    declined: r.declinedServices || [],
    spend: r.totalEstimate,
  }));
  const objectives = preloaded.objectives.map(o => o.note);
  const mileage    = vehicle?.mileage || 0;
  const dueServices = getMileageServices(vehicle?.make, vehicle?.model, mileage);

  const prompt = `${buildSystemPrompt(ro, vehicle, shopName)}

DATA ALREADY LOADED (no tool calls needed):

Customer history (${history.length} prior visits):
${JSON.stringify(history, null, 2)}

Shop objectives/ings (active today):
${JSON.stringify(objectives, null, 2)}

Mileage-appropriate services (vehicle at ${mileage.toLocaleString()} miles):
${JSON.stringify(dueServices, null, 2)}

Now produce the JSON recommendation object.`;

  const data = await callAzureOpenAI({
    messages:   [{ role: 'user', content: prompt }],
    max_tokens: 1200,
    jsonMode:   true,
    _route: '/api/agent/ro-advisor',
  });

  const raw  = getTextFromResponse(data) || '{}';
  const json = raw.match(/\{[\s\S]*\}/)?.[0] || raw;
  return JSON.parse(json);
}

// ── Main agent runner ─────────────────────────────────────────────────────────

/**
 * Run the RO Advisor Agent for a specific repair order.
 *
 * @param {object} ro        - Current repair order object
 * @param {object} customer  - Customer record
 * @param {object} vehicle   - Vehicle record
 * @param {string} shopId
 * @param {object} db        - MongoDB db handle (may be null if not connected)
 * @returns {Promise<{ advisorBrief, upsells, ings, alerts, generatedAt }>}
 */
export async function runROAdvisorAgent({ ro, customer, vehicle, shopId = 'shop-001', db }) {
  const customerId = customer?.id || customer?.customerId || ro?.customerId;
  const shopName   = 'Cornerstone Auto Group';

  // Pre-fetch data in parallel — each is tolerant of failure
  const [history, objectives] = await Promise.all([
    fetchCustomerHistory(customerId, db),
    fetchShopObjectives(shopId, db),
  ]);

  const preloaded = { history, objectives };

  // If the LLM server doesn't support tool_calls, go straight to single-pass
  if (LLM_SKIP_TOOLS) {
    console.log('[roAdvisor] LLM_SKIP_TOOLS=true — using single-pass prompt');
    const result = await runSinglePassAgent(ro, vehicle, 'Cornerstone Auto Group', preloaded);
    return { ...result, generatedAt: new Date().toISOString(), dataSourced: { historyVisits: history.length, objectivesCount: objectives.length } };
  }

  const messages = [
    {
      role:    'user',
      content: 'Analyze this repair order and produce recommendations for the service advisor.',
    },
  ];

  let result = null;

  // Tool-calling loop (max 4 rounds)
  for (let turn = 0; turn < 4; turn++) {
    let data;
    try {
      data = await callAzureOpenAI({
        system:     buildSystemPrompt(ro, vehicle, shopName),
        messages,
        max_tokens: 1200,
        tools:      RO_TOOLS,
        _route:     '/api/agent/ro-advisor',
      });
    } catch (err) {
      console.warn('[roAdvisor] LLM call failed, trying single-pass fallback:', err.message);
      result = await runSinglePassAgent(ro, vehicle, shopName, preloaded);
      break;
    }

    const choice       = data.choices?.[0];
    const finishReason = choice?.finish_reason;
    const msg          = choice?.message;

    // Append assistant turn to history
    messages.push({
      role:        'assistant',
      content:     msg?.content ?? null,
      tool_calls:  msg?.tool_calls,
    });

    if (finishReason === 'stop' || finishReason === 'length') {
      const text = msg?.content || '{}';
      const json = text.match(/\{[\s\S]*\}/)?.[0] || text;
      try {
        result = JSON.parse(json);
      } catch {
        // LLM didn't produce valid JSON — run single-pass with data injected
        result = await runSinglePassAgent(ro, vehicle, shopName, preloaded);
      }
      break;
    }

    if (finishReason === 'tool_calls') {
      const toolCalls = msg?.tool_calls || [];
      for (const tc of toolCalls) {
        let toolArgs = {};
        try { toolArgs = JSON.parse(tc.function?.arguments || '{}'); } catch {}
        const toolResult = executeTool(tc.function?.name, toolArgs, preloaded);
        console.log(`[roAdvisor] tool: ${tc.function?.name} → ${JSON.stringify(toolResult).slice(0, 120)}`);
        messages.push({
          role:         'tool',
          tool_call_id: tc.id,
          content:      JSON.stringify(toolResult),
        });
      }
      continue;
    }

    // Unknown finish reason — fall back to single-pass
    result = await runSinglePassAgent(ro, vehicle, shopName, preloaded);
    break;
  }

  if (!result) {
    result = await runSinglePassAgent(ro, vehicle, shopName, preloaded);
  }

  return {
    ...result,
    generatedAt:   new Date().toISOString(),
    dataSourced: {
      historyVisits:   history.length,
      objectivesCount: objectives.length,
    },
  };
}
