/**
 * WrenchIQ — the 15 server-side LLM call sites (AE-1286)
 *
 * Transcribed from the production call sites so the migration is checked against
 * the argument shapes that actually occur, not invented ones. Prompt *content*
 * is stand-in text — what matters here is structure: which optional fields are
 * present, which are absent, and the exact `_route` tag (the only observability
 * key into llm_request_log).
 *
 * If a call site changes, update it here too, or the suite is testing fiction.
 */

/** Six OpenAI-format tools, shaped like RO_TOOLS in roAdvisorService.js:345. */
export const RO_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_customer_history',
      description: 'Prior visits and declined services for this customer.',
      parameters: {
        type: 'object',
        properties: { customerId: { type: 'string', description: 'Customer id' } },
        required: ['customerId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_shop_objectives',
      description: 'Active shop objectives and promotions.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

/**
 * Every call site, keyed by a slug. `args` is passed verbatim to callAzureOpenAI.
 * `notes` explains what the case is protecting.
 */
export const CALL_SITES = {
  'knowledge-graph-ask': {
    notes: 'system + multi-turn history, no jsonMode — server/routes/knowledgeGraph.js:594',
    args: {
      system: 'You are a knowledge graph analyst.',
      messages: [
        { role: 'user', content: 'Which vehicles cluster around P0420?' },
        { role: 'assistant', content: 'Mostly 2015-2018 Subaru Outbacks.' },
        { role: 'user', content: 'What is the common fix?' },
      ],
      max_tokens: 800,
      _route: '/api/knowledge-graph/ask',
    },
  },

  'ro-agent-draft': {
    notes: 'system + single user turn — server/routes/roAgent.js:58',
    args: {
      system: 'Extract a structured repair order intent.',
      messages: [{ role: 'user', content: 'Customer says the brakes squeal at low speed.' }],
      max_tokens: 512,
      _route: '/api/ro-agent',
    },
  },

  'claude-proxy': {
    notes: 'Anthropic-shape proxy; max_tokens falls back to 1024 — server/routes/claudeProxy.js:33',
    args: {
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Summarise this repair order.' }],
      max_tokens: 1024,
      _route: '/api/claude/messages',
    },
  },

  'managed-agent': {
    notes: 'stateful in-memory history — server/services/managedAgent.js:60',
    args: {
      system: 'You are the WrenchIQ session agent.',
      messages: [
        { role: 'user', content: 'Open a session.' },
        { role: 'assistant', content: 'Session open.' },
        { role: 'user', content: 'What is on the board today?' },
      ],
      max_tokens: 1024,
      _route: '/api/agent (managed)',
    },
  },

  'ro-score-agent': {
    notes: 'jsonMode, NO system prompt — server/services/roScoreAgent.js:91',
    args: {
      messages: [{ role: 'user', content: 'Score this RO against the gold standard guidelines.' }],
      max_tokens: 1000,
      jsonMode: true,
      _route: '/api/ro-gold-standard-score/auto-score',
    },
  },

  'ro-chat': {
    notes: 'chatSkill with useConfiguredProvider — roChatService.js:161 via chatSkill.js:38',
    args: {
      system: 'You are the RO chat assistant.',
      messages: [{ role: 'user', content: 'What did we do on the last visit?' }],
      max_tokens: 2000,
      useConfiguredProvider: true,
      _route: '/api/ro-chat',
    },
  },

  'ro-chat-frontier': {
    notes: 'forced frontier profile — its own base URL/key/model, not just a model override',
    args: {
      system: 'You are the RO chat assistant.',
      messages: [{ role: 'user', content: 'Explain the diagnosis in plain language.' }],
      max_tokens: 2000,
      profileKey: 'frontier',
      _route: '/api/ro-chat',
    },
  },

  'shop-chat': {
    notes: 'chatSkill, shop scope — shopChatService.js:71 via chatSkill.js:38',
    args: {
      system: 'You are the shop-wide chat assistant.',
      messages: [{ role: 'user', content: 'How is the shop tracking against target ELR?' }],
      max_tokens: 2000,
      useConfiguredProvider: true,
      _route: '/api/shop-chat',
    },
  },

  'aro-agent': {
    notes: 'largest token budget, jsonMode, no system — server/services/aroAgentService.js:286',
    args: {
      messages: [{ role: 'user', content: 'Analyse these ARO aggregations.' }],
      max_tokens: 4096,
      jsonMode: true,
      _route: '/api/aro-agent',
    },
  },

  'health-check': {
    notes: 'smallest budget; the Sidecar startup screen depends on it — azureOpenAI.js:151',
    args: {
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5,
      _route: 'health-check',
    },
  },

  recommendations: {
    notes: 'system + jsonMode — server/services/recommendationLLM.js:191',
    args: {
      system: 'You generate exactly four shop recommendations.',
      messages: [{ role: 'user', content: 'Here is the shop snapshot.' }],
      max_tokens: 2048,
      jsonMode: true,
      _route: '/api/recommendations',
    },
  },

  'shop-intel-facts': {
    notes: 'jsonMode, no system — server/services/shopIntelFactsService.js:62',
    args: {
      messages: [{ role: 'user', content: 'Produce grounded facts about this shop.' }],
      max_tokens: 1200,
      jsonMode: true,
      _route: '/api/shop-intel-facts',
    },
  },

  'three-c-score': {
    notes: 'the ONLY call site setting temperature (0) — threeCScoreService.js:109',
    args: {
      messages: [{ role: 'user', content: 'Score this 3C story.' }],
      max_tokens: 500,
      jsonMode: true,
      temperature: 0,
      _route: '/api/three-c-score/score',
    },
  },

  'three-c-rewrite': {
    notes: 'second call of the 3-call chain — threeCScoreService.js:165',
    args: {
      messages: [{ role: 'user', content: 'Rewrite this 3C story.' }],
      max_tokens: 700,
      jsonMode: true,
      _route: '/api/three-c-score/rewrite',
    },
  },

  'ro-advisor-single-pass': {
    notes: 'jsonMode fallback path — roAdvisorService.js:713',
    args: {
      messages: [{ role: 'user', content: 'Advise on RO-2024-1001.' }],
      max_tokens: 1200,
      jsonMode: true,
      _route: '/api/agent/ro-advisor',
    },
  },

  'ro-advisor-tools': {
    notes:
      'the one real agent: system + tools, NO jsonMode — roAdvisorService.js:810. ' +
      'Turn 1 of a loop of up to 4.',
    args: {
      system: 'You are the RO Advisor.',
      messages: [{ role: 'user', content: 'Advise on RO-2024-1001.' }],
      max_tokens: 1200,
      tools: RO_TOOLS,
      _route: '/api/agent/ro-advisor',
    },
  },

  'ro-advisor-tools-turn2': {
    notes:
      'turn 2 of the tool loop — the only place an assistant turn carries ' +
      'content: null plus tool_calls, and a tool result is fed back. ' +
      'roAdvisorService.js:838-866.',
    args: {
      system: 'You are the RO Advisor.',
      messages: [
        { role: 'user', content: 'Advise on RO-2024-1001.' },
        {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: 'call_1',
            type: 'function',
            function: { name: 'get_customer_history', arguments: '{"customerId":"cust-001"}' },
          }],
        },
        { role: 'tool', tool_call_id: 'call_1', content: '{"visits":3,"declined":[]}' },
      ],
      max_tokens: 1200,
      tools: RO_TOOLS,
      _route: '/api/agent/ro-advisor',
    },
  },
};

export const CALL_SITE_SLUGS = Object.keys(CALL_SITES);
