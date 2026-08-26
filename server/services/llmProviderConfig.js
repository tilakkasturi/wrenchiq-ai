/**
 * WrenchIQ — LLM Provider Config
 *
 * Lets a shop switch which configured LLM endpoint "Predii LLM" actually
 * calls — e.g. a self-hosted model vs. Azure OpenAI — without editing
 * .env.local or restarting the server. Both profiles' credentials must
 * already exist in env; this only switches which one is active. No API key
 * material is ever persisted or returned — only the choice of profile.
 *
 * Collection: llm_provider_config (single doc, _id: 'active')
 */

import {
  LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, AZURE_OPENAI_API_VERSION,
  LLM_BASE_URL_2, LLM_API_KEY_2, LLM_MODEL_2,
  RAW_AZURE_BASE_URL, RAW_AZURE_API_KEY, RAW_AZURE_MODEL,
  FRONTIER_BASE_URL, FRONTIER_API_KEY, FRONTIER_MODEL, FRONTIER_API_VERSION,
} from '../config.js';

const COLL = 'llm_provider_config';

// Two physical self-hosted boxes "Predii LLM" (the 'default' profile) can
// point at — switchable from the WrenchIQ Home / Sidecar Health Check
// screen (Figure 3A: "LLM Endpoint") independently of the Chat-only
// default/azure/frontier profile selector below. Every implicit-default
// LLM call site (RO Advisor, recommendations, health check, ARO agent —
// i.e. everywhere that doesn't pass useConfiguredProvider/profileKey)
// resolves through getDefaultProfile(), so switching here changes what
// those call sites actually hit, without touching the Azure/frontier logic.
export const LLM_ENDPOINTS = {
  primary: {
    label: 'Primary (.177)',
    baseUrl: LLM_BASE_URL,
    apiKey: LLM_API_KEY,
    model: LLM_MODEL,
  },
  secondary: {
    label: 'Secondary (.110)',
    baseUrl: LLM_BASE_URL_2,
    apiKey: LLM_API_KEY_2,
    model: LLM_MODEL_2,
  },
};

// Starts on 'secondary' per explicit request to point the default endpoint
// at the .110 box; persisted choice (see hydrateActiveProfile) wins after
// the first switch from the UI.
let _activeEndpoint = 'secondary';

export function isEndpointConfigured(key) {
  return !!LLM_ENDPOINTS[key]?.baseUrl;
}

export function getActiveEndpoint() {
  return _activeEndpoint;
}

export async function setActiveEndpoint(db, key) {
  if (!LLM_ENDPOINTS[key]) {
    throw new Error(`Unknown endpoint: ${key}`);
  }
  if (!isEndpointConfigured(key)) {
    throw new Error(`Endpoint "${key}" has no baseUrl configured in .env.local`);
  }
  _activeEndpoint = key;
  const now = new Date().toISOString();
  await db.collection(COLL).findOneAndUpdate(
    { _id: 'active' },
    { $set: { activeEndpoint: key, updatedAt: now } },
    { upsert: true }
  );
  return getPublicStatus();
}

/** The 'default' ("Predii LLM") profile, resolved to whichever physical
 *  endpoint is currently active. Used by every LLM call site that doesn't
 *  explicitly opt into the Chat-only profile selector below. */
export function getDefaultProfile() {
  const endpoint = LLM_ENDPOINTS[_activeEndpoint] || LLM_ENDPOINTS.primary;
  return {
    profileKey: 'default',
    label: `Predii LLM — ${endpoint.label}`,
    baseUrl: endpoint.baseUrl,
    apiKey: endpoint.apiKey,
    model: endpoint.model,
    apiVersion: AZURE_OPENAI_API_VERSION,
  };
}

export const LLM_PROFILES = {
  default: {
    label: 'Predii LLM (Default)',
    baseUrl: LLM_BASE_URL,
    apiKey: LLM_API_KEY,
    model: LLM_MODEL,
    apiVersion: AZURE_OPENAI_API_VERSION,
  },
  azure: {
    label: 'Azure OpenAI',
    baseUrl: RAW_AZURE_BASE_URL,
    apiKey: RAW_AZURE_API_KEY,
    model: RAW_AZURE_MODEL,
    apiVersion: AZURE_OPENAI_API_VERSION,
  },
  // V5 feedback (D3): a genuinely separate deployment (e.g. a shop's Azure
  // Foundry GPT-5.5 resource) — not selectable via the Settings "AI Engine"
  // toggle, only via the Chat frontier-model tier (see roChatService.js).
  frontier: {
    label: 'Frontier (GPT-5.5)',
    baseUrl: FRONTIER_BASE_URL,
    apiKey: FRONTIER_API_KEY,
    model: FRONTIER_MODEL,
    apiVersion: FRONTIER_API_VERSION,
  },
};

// The Settings "AI Engine" toggle only ever selects between these two —
// 'frontier' is a separate, Chat-only tier (see roChatService.resolveModelTier)
// and must never become the shop-wide default profile.
const SELECTABLE_PROFILE_KEYS = ['default', 'azure'];

let _activeProfile = 'default';

/** Sync, no DB access — this is what every LLM call resolves against. */
export function getActiveLLMProfile() {
  if (_activeProfile === 'default') return getDefaultProfile();
  return { profileKey: _activeProfile, ...LLM_PROFILES[_activeProfile] };
}

export function isProfileConfigured(profileKey) {
  return !!LLM_PROFILES[profileKey]?.baseUrl;
}

/** Called once at server startup to restore the persisted choice. */
export async function hydrateActiveProfile(db) {
  try {
    const doc = await db.collection(COLL).findOne({ _id: 'active' });
    if (doc?.activeProfile && SELECTABLE_PROFILE_KEYS.includes(doc.activeProfile) && isProfileConfigured(doc.activeProfile)) {
      _activeProfile = doc.activeProfile;
    }
    if (doc?.activeEndpoint && LLM_ENDPOINTS[doc.activeEndpoint] && isEndpointConfigured(doc.activeEndpoint)) {
      _activeEndpoint = doc.activeEndpoint;
    }
  } catch (err) {
    console.warn('[llmProviderConfig] failed to hydrate active profile, defaulting to "default":', err.message);
  }
}

export async function setActiveProfile(db, profileKey) {
  if (!SELECTABLE_PROFILE_KEYS.includes(profileKey)) {
    throw new Error(`Unknown profile: ${profileKey}`);
  }
  if (!isProfileConfigured(profileKey)) {
    throw new Error(`Profile "${profileKey}" has no baseUrl configured in .env.local`);
  }
  _activeProfile = profileKey;
  const now = new Date().toISOString();
  await db.collection(COLL).findOneAndUpdate(
    { _id: 'active' },
    { $set: { activeProfile: profileKey, updatedAt: now } },
    { upsert: true }
  );
  return getPublicStatus();
}

/** Shape returned to the client — never includes apiKey values. Only the
 *  Settings-selectable profiles (not 'frontier') are listed here. */
export function getPublicStatus() {
  const profiles = {};
  for (const key of SELECTABLE_PROFILE_KEYS) {
    const p = key === 'default' ? getDefaultProfile() : LLM_PROFILES[key];
    profiles[key] = { label: p.label, baseUrl: p.baseUrl, model: p.model, configured: isProfileConfigured(key) };
  }

  const endpoints = {};
  for (const key of Object.keys(LLM_ENDPOINTS)) {
    const e = LLM_ENDPOINTS[key];
    endpoints[key] = { label: e.label, baseUrl: e.baseUrl, model: e.model, configured: isEndpointConfigured(key) };
  }

  return { activeProfile: _activeProfile, profiles, activeEndpoint: _activeEndpoint, endpoints };
}
