/**
 * WrenchIQ Extension — Side Panel Logic
 *
 * States: idle → loading → customer (or not-found)
 * Data flow:
 *   phone detected (content.js) → background relay → here → /api/customers/lookup
 *   user message → /api/agent/sessions + /api/agent/sessions/:id/stream (SSE)
 */

const API_BASE = 'http://localhost:3001';

// ── DOM refs ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const states = {
  idle:      $('state-idle'),
  manual:    $('state-manual'),
  loading:   $('state-loading'),
  notFound:  $('state-not-found'),
  customer:  $('state-customer'),
};

const detectionBar   = $('detection-bar');
const detectedPhone  = $('detected-phone');
const statusDot      = $('status-dot');

// Customer state panel refs
const customerAvatar = $('customer-avatar');
const customerName   = $('customer-name');
const customerMeta   = $('customer-meta');
const loyaltyBadge   = $('loyalty-badge');
const vehicleInfo    = $('vehicle-info');
const nextService    = $('next-service');
const insightsSection = $('insights-section');
const insightsList   = $('insights-list');
const rosSection     = $('ros-section');
const rosList        = $('ros-list');
const chatMessages   = $('chat-messages');
const chatInput      = $('chat-input');

// ── App state ─────────────────────────────────────────────────────────────────
let currentCustomer = null;
let agentSessionId  = null;

// ── Utility ───────────────────────────────────────────────────────────────────
function showState(name) {
  Object.values(states).forEach(el => el.classList.add('hidden'));
  states[name]?.classList.remove('hidden');
}

function setStatusDot(mode) {
  statusDot.className = `status-dot ${mode}`;
}

function initials(firstName, lastName) {
  return `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();
}

function formatLtv(n) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;
}

// ── Phone lookup ──────────────────────────────────────────────────────────────
async function lookupPhone(phone) {
  lastDetectedPhone = phone;

  // Forward to active persona iframe immediately
  if (activeTab !== 'customer') {
    forwardPhoneToIframe(activeTab, phone);
  }
  // Pre-load both persona iframes with phone + screen context
  Object.keys(IFRAMES).forEach(tab => forwardPhoneToIframe(tab, phone));
  // Advisor tab: detected phone on SMS page → advisor is likely doing intake/diagnosis
  forwardScreenToIframe('advisor', 'job1Intake');
  // Owner tab: detected phone → show command center (shop-level view)
  forwardScreenToIframe('owner', 'ownerHome');

  showState('loading');
  setStatusDot('loading');

  detectionBar.classList.remove('hidden');
  detectedPhone.textContent = phone;

  try {
    const res = await fetch(`${API_BASE}/api/customers/lookup?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();

    if (!data.found) {
      showState('notFound');
      setStatusDot('idle');
      return;
    }

    renderCustomer(data);
  } catch (err) {
    showState('notFound');
    setStatusDot('idle');
    console.error('[WrenchIQ] Lookup error:', err);
  }
}

// ── Render customer ───────────────────────────────────────────────────────────
function renderCustomer(data) {
  const { customer, vehicles, recentROs } = data;
  currentCustomer = data;
  agentSessionId = null;

  // Avatar + name
  customerAvatar.textContent = initials(customer.firstName, customer.lastName);
  customerName.textContent   = `${customer.firstName} ${customer.lastName}`;
  customerMeta.textContent   = `${capitalize(customer.loyaltyTier)} · ${customer.visits} visits · ${formatLtv(customer.ltv)} LTV`;

  // Loyalty badge
  loyaltyBadge.textContent = (customer.loyaltyTier || 'bronze').toUpperCase();
  loyaltyBadge.className = `loyalty-badge ${customer.loyaltyTier || 'bronze'}`;

  // Vehicle (first one)
  const v = vehicles[0];
  if (v) {
    vehicleInfo.textContent = `${v.year} ${v.make} ${v.model} ${v.trim} · ${v.mileage.toLocaleString()} mi`;
    nextService.textContent = v.nextServiceType ? `Next: ${v.nextServiceType} @ ${v.nextServiceMiles.toLocaleString()} mi` : '';
  }

  // AI Insights from most recent RO
  const latestRO = recentROs[0];
  if (latestRO?.aiInsights?.length) {
    insightsList.innerHTML = '';
    latestRO.aiInsights.slice(0, 3).forEach(text => {
      const el = document.createElement('div');
      el.className = 'insight-item';
      el.textContent = text;
      insightsList.appendChild(el);
    });
    insightsSection.classList.remove('hidden');
  } else {
    insightsSection.classList.add('hidden');
  }

  // Recent ROs
  if (recentROs.length) {
    rosList.innerHTML = '';
    recentROs.slice(0, 3).forEach(ro => {
      const el = document.createElement('div');
      el.className = 'ro-item';
      el.innerHTML = `
        <div class="ro-header">
          <span class="ro-id">${ro.id}</span>
          <span class="ro-status ${ro.kanbanStatus || ro.status}">${(ro.kanbanStatus || ro.status).replace(/_/g, ' ')}</span>
        </div>
        <div class="ro-service">
          ${ro.serviceType || ro.customerConcern || '—'}
          ${ro.totalEstimate ? `<span class="ro-estimate">$${ro.totalEstimate}</span>` : ''}
        </div>
      `;
      rosList.appendChild(el);
    });
    rosSection.classList.remove('hidden');
  }

  // Seed chat with context-aware welcome
  chatMessages.innerHTML = '';
  addChatMessage('assistant',
    `${customer.firstName} ${customer.lastName} is here. ` +
    (latestRO?.aiInsights?.[0]
      ? latestRO.aiInsights[0]
      : `${customer.visits} visits, ${formatLtv(customer.ltv)} LTV. How can I help?`)
  );

  showState('customer');
  setStatusDot('active');
}

// ── Agent chat ────────────────────────────────────────────────────────────────
async function sendMessage(text) {
  if (!text.trim()) return;
  chatInput.value = '';
  addChatMessage('user', text);

  // Create session on first message
  if (!agentSessionId) {
    try {
      const res = await fetch(`${API_BASE}/api/agent/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: 'advisor' }),
      });
      const data = await res.json();
      agentSessionId = data.sessionId;
    } catch (err) {
      addChatMessage('assistant', 'Could not connect to WrenchIQ server. Is it running on :3001?');
      return;
    }
  }

  // Build customer context for the agent
  const ctx = currentCustomer
    ? `Customer: ${currentCustomer.customer.firstName} ${currentCustomer.customer.lastName}. ` +
      `Vehicle: ${currentCustomer.vehicles[0]?.year} ${currentCustomer.vehicles[0]?.make} ${currentCustomer.vehicles[0]?.model}. ` +
      `Recent RO: ${currentCustomer.recentROs[0]?.serviceType || 'none'}. ` +
      `AI Insight: ${currentCustomer.recentROs[0]?.aiInsights?.[0] || 'none'}. ` +
      `Question: ${text}`
    : text;

  const streamMsgEl = addChatMessage('assistant', '', true);

  try {
    const res = await fetch(`${API_BASE}/api/agent/sessions/${agentSessionId}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: ctx }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Parse SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // incomplete line stays in buffer

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (raw === '[DONE]') continue;
        try {
          const ev = JSON.parse(raw);
          // Handle various SSE event shapes from the server
          const chunk =
            ev.delta?.text ||       // anthropic streaming
            ev.text ||
            ev.content ||
            '';
          if (chunk) {
            fullText += chunk;
            streamMsgEl.textContent = fullText;
            streamMsgEl.classList.remove('streaming');
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        } catch { /* non-JSON line, skip */ }
      }
    }

    if (!fullText) {
      streamMsgEl.textContent = 'No response from agent.';
    }
  } catch (err) {
    streamMsgEl.textContent = 'Error talking to WrenchIQ agent.';
    console.error('[WrenchIQ] Stream error:', err);
  }
}

function addChatMessage(role, text, streaming = false) {
  const el = document.createElement('div');
  el.className = `chat-msg ${role}${streaming ? ' streaming' : ''}`;
  el.textContent = text || (streaming ? '...' : '');
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ── Event listeners ───────────────────────────────────────────────────────────
$('btn-manual').addEventListener('click', () => showState('manual'));
$('btn-cancel-manual').addEventListener('click', () => showState('idle'));
$('btn-try-again').addEventListener('click', () => showState('manual'));
$('btn-reset').addEventListener('click', () => {
  currentCustomer = null;
  agentSessionId = null;
  detectionBar.classList.add('hidden');
  setStatusDot('idle');
  showState('idle');
});

$('btn-lookup').addEventListener('click', () => {
  const phone = $('manual-phone-input').value.trim();
  if (phone) lookupPhone(phone);
});

$('manual-phone-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const phone = e.target.value.trim();
    if (phone) lookupPhone(phone);
  }
});

$('btn-send').addEventListener('click', () => sendMessage(chatInput.value));

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage(e.target.value);
});

// ── Tab bar ───────────────────────────────────────────────────────────────────
const PERSONA_PANES = {
  customer: null,                          // no iframe — uses main panel
  advisor:  $('pane-advisor'),
  owner:    $('pane-owner'),
};

const IFRAMES = {
  advisor: $('iframe-advisor'),
  owner:   $('iframe-owner'),
};

let activeTab = 'customer';

function switchTab(tab) {
  // Update tab button styles
  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Show/hide persona panes
  Object.entries(PERSONA_PANES).forEach(([key, el]) => {
    if (el) el.classList.toggle('hidden', key !== tab);
  });

  // Show/hide customer panel main content
  const isCustomer = tab === 'customer';
  $('main-content').classList.toggle('hidden', !isCustomer);

  // When switching to a persona tab, forward current detected phone
  if (tab !== 'customer' && lastDetectedPhone) {
    forwardPhoneToIframe(tab, lastDetectedPhone);
  }

  activeTab = tab;
}

function forwardPhoneToIframe(tab, phone) {
  const iframe = IFRAMES[tab];
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    { type: 'WRENCHIQ_CUSTOMER_PHONE', phone },
    'http://localhost:3001'
  );
}

function forwardScreenToIframe(tab, screen) {
  const iframe = IFRAMES[tab];
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    { type: 'WRENCHIQ_SCREEN_CHANGE', screen },
    'http://localhost:3001'
  );
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Track last detected phone for forwarding when tab switches
let lastDetectedPhone = null;

// ── Background message relay ──────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'WRENCHIQ_PHONE_UPDATE' && message.phone) {
    lastDetectedPhone = message.phone;
    lookupPhone(message.phone);
  }
});

// ── Init: ask background for the current tab's phone ─────────────────────────
showState('idle');
chrome.runtime.sendMessage({ type: 'WRENCHIQ_GET_TAB_PHONE' });
