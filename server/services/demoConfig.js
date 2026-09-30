/**
 * WrenchIQ — Demo SMS/DMS Config
 *
 * The Admin Settings SMS/DMS picker (SettingsScreen.jsx) needs to be visible
 * consistently across every surface (Admin, Sidecar, SMS Representative UI)
 * — including separate OS windows in the Tauri build, where they're
 * genuinely different processes. This used to live only in localStorage
 * (DemoContext.jsx), synced cross-window via the "storage" event — which
 * doesn't fire reliably across separate Tauri windows, so a shop's SMS/DMS
 * choice could silently diverge between windows. Rather than work around
 * that, this moves the single fact that actually needs to be shared (which
 * SMS/DMS is selected) onto the server — same fix as the LLM active-profile
 * switch in llmProviderConfig.js. Every other demo setting (shop name,
 * owner name, module config, etc.) stays in
 * localStorage, unaffected — this is scoped to the one thing that broke.
 *
 * Collection: demo_config (single doc, _id: 'active')
 */

const COLL = 'demo_config';

const DEFAULT_SMS_NAME = 'Mitchell1 ShopManager SE';
const DEFAULT_SMS_PROVIDER = 'mitchell1';

let _cache = { smsName: DEFAULT_SMS_NAME, smsProvider: DEFAULT_SMS_PROVIDER };

/** Sync, no DB access — safe to read on every render. */
export function getDemoConfig() {
  return { ..._cache };
}

/** Called once at server startup to restore the persisted choice. */
export async function hydrateDemoConfig(db) {
  try {
    const doc = await db.collection(COLL).findOne({ _id: 'active' });
    if (doc?.smsName) {
      _cache = { smsName: doc.smsName, smsProvider: doc.smsProvider || DEFAULT_SMS_PROVIDER };
    }
  } catch (err) {
    console.warn('[demoConfig] failed to hydrate, defaulting to Protractor:', err.message);
  }
}

export async function setDemoConfig(db, { smsName, smsProvider }) {
  if (!smsName) throw new Error('smsName is required');
  _cache = { smsName, smsProvider: smsProvider || DEFAULT_SMS_PROVIDER };
  const now = new Date().toISOString();
  await db.collection(COLL).findOneAndUpdate(
    { _id: 'active' },
    { $set: { smsName: _cache.smsName, smsProvider: _cache.smsProvider, updatedAt: now } },
    { upsert: true }
  );
  return getDemoConfig();
}
