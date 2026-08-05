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
  RAW_AZURE_BASE_URL, RAW_AZURE_API_KEY, RAW_AZURE_MODEL,
  FRONTIER_BASE_URL, FRONTIER_API_KEY, FRONTIER_MODEL, FRONTIER_API_VERSION,
} from '../config.js';

const COLL = 'llm_provider_config';

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
    const p = LLM_PROFILES[key];
    profiles[key] = { label: p.label, baseUrl: p.baseUrl, model: p.model, configured: isProfileConfigured(key) };
  }
  return { activeProfile: _activeProfile, profiles };
}
