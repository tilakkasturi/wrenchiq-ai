/**
 * DemoContext — configurable demo variables
 *
 * Persists to localStorage so settings survive page refresh.
 * Provides: smsName, shopName, ownerName, ownerInitials, primaryCustomer
 *
 * Usage:
 *   const { smsName, shopName, ownerName } = useDemo();
 *   const { setDemo } = useDemo();
 *
 * smsName/smsProvider specifically are NOT localStorage-backed like
 * everything else here — they're fetched from/written to the server
 * (GET/PATCH /api/demo-config, server/services/demoConfig.js). They used to
 * be pinned to a hardcoded "Protractor" value in every load()/setDemo()
 * call, because cross-window localStorage "storage"-event sync isn't
 * reliable across separate Tauri windows — a shop's SMS/DMS picker
 * selection could silently diverge between the Sidecar and Admin windows.
 * Moving just this one fact to the server (same fix as the LLM primary/
 * secondary endpoint switch in llmProviderConfig.js) fixes that at the
 * root instead of working around it — every window reads the same
 * value, and the Settings picker actually works.
 */

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "wrenchiq_demo_config";
const API_BASE = import.meta.env.VITE_API_BASE || "";

const SMS_OPTIONS = [
  "Mitchell1 ShopManager SE",
  "ALLDATA Shop Manager Pro",
  "Protractor",
  "Tekmetric",
  "Shop-Ware",
  "AutoLeap",
  "Shopmonkey",
  "Other",
];

// Per-vendor Predii co-branding config
export const SMS_VENDOR_CONFIG = {
  mitchell1:   { displayName: "Mitchell1 ShopManager SE",    poweredByPredii: true },
  alldata:     { displayName: "ALLDATA Shop Manager Pro",    poweredByPredii: true },
  protractor:  { displayName: "Protractor",  poweredByPredii: true },
  tekmetric:   { displayName: "Tekmetric",   poweredByPredii: true },
  shopware:    { displayName: "Shop-Ware",   poweredByPredii: true },
  autoleap:    { displayName: "AutoLeap",    poweredByPredii: true },
  shopmonkey:  { displayName: "Shopmonkey",  poweredByPredii: true },
  other:       { displayName: "Other",       poweredByPredii: false },
};

// Derive provider key from display name
export function smsNameToProvider(name = "") {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (n === "mitchellone" || n.startsWith("mitchell")) return "mitchell1";
  if (n === "alldata") return "alldata";
  if (n === "shopware" || n === "shopware") return "shopware";
  if (n === "autoleap") return "autoleap";
  if (n === "shopmonkey") return "shopmonkey";
  if (n === "tekmetric") return "tekmetric";
  if (n === "protractor") return "protractor";
  return "other";
}

// Demo landing configs — set via PersonaGatewayScreen when a persona card is clicked
export const DEMO_SHOPS = {
  cornerstone: {
    id: "cornerstone",
    shopName: "Cornerstone Auto Group",
    ownerName: "Dave Kowalski",
    ownerInitials: "DK",
    smsName: "Protractor",
    corporateName: "EWG Auto Group",
    primaryCustomer: "Elena Vasquez",
    smsProvider: "protractor",
    advisorName: "James Kowalski",
  },
  ridgeline: {
    id: "ridgeline",
    shopName: "Ridgeline Auto Service",
    ownerName: "Carmen Reyes",
    ownerInitials: "CR",
    smsName: "Mitchell1 ShopManager SE",
    corporateName: null,
    primaryCustomer: "Dan Whitfield",
    smsProvider: "mitchell1",
    advisorName: "Sofia Reyes",
  },
};

// ── Module registry (mirrors product spec) ───────────────────
// Each module has: id, label, am (available in AM), oem (available in OEM)
export const MODULE_REGISTRY = [
  { id: "roAdvisor",     label: "RO Advisor Agent",          am: true,  oem: true  },
  { id: "storyWriter",   label: "3C Story Writer",            am: true,  oem: true  },
  { id: "repairOrders",  label: "Repair Order Board",         am: true,  oem: true  },
  { id: "dashboard",     label: "Command Center / Dashboard", am: true,  oem: true  },
  { id: "aiCopilot",    label: "AI Repair Advisor",           am: true,  oem: true  },
  { id: "techMobile",    label: "Technician Mobile",          am: true,  oem: true  },
  { id: "dvi",           label: "Digital Vehicle Inspection", am: true,  oem: false },
  { id: "socialInbox",   label: "Social Inbox",               am: true,  oem: false },
  { id: "scheduling",    label: "Smart Scheduling",           am: true,  oem: false },
  { id: "trustEngine",   label: "Trust Engine",               am: true,  oem: false },
  { id: "multiLocation", label: "Multi-Location Hub",         am: true,  oem: false },
  { id: "parts",         label: "Parts Intelligence",         am: true,  oem: false },
  { id: "checkout",      label: "Checkout & Payment",         am: true,  oem: false },
  { id: "customerPortal",label: "Customer Portal",            am: true,  oem: false },
  { id: "analytics",     label: "Analytics",                  am: true,  oem: false },
  { id: "dmsPush",       label: "DMS Push (CDK / R&R)",       am: false, oem: true  },
  { id: "warrantyPortal",label: "OEM Warranty Portal",        am: false, oem: true  },
  { id: "settings",      label: "Settings",                   am: true,  oem: true  },
];

// Default module config: all modules on, show both editions
function defaultModuleConfig() {
  const modules = {};
  MODULE_REGISTRY.forEach(m => { modules[m.id] = true; });
  return { edition: "am", modules }; // "am" | "oem" | "both"
}

// Pre-fetch fallback only — the real value comes from GET /api/demo-config
// (see the file header comment) and overwrites this on mount. Matches what
// the server itself defaults to when unset, so there's no flash-of-wrong-
// vendor before that fetch resolves.
const DEFAULT_SMS_NAME = "Mitchell1 ShopManager SE";
const DEFAULT_SMS_PROVIDER = "mitchell1";

const DEFAULTS = {
  smsName:         DEFAULT_SMS_NAME,
  smsProvider:     DEFAULT_SMS_PROVIDER,
  // V5 feedback (C1): Read-only (default, included) vs Read+Write (premium
  // tier) SMS/DMS integration — gates write-back actions client-side; see
  // src/services/am3cSMSWritebackService.js call sites.
  smsWriteTier:    "read", // "read" | "readwrite"
  corporateName:   DEMO_SHOPS.cornerstone.corporateName,
  shopName:        DEMO_SHOPS.cornerstone.shopName,
  ownerName:       DEMO_SHOPS.cornerstone.ownerName,
  ownerInitials:   DEMO_SHOPS.cornerstone.ownerInitials,
  primaryCustomer: DEMO_SHOPS.cornerstone.primaryCustomer,
  activeShopId:    DEMO_SHOPS.cornerstone.id,
  advisorName:     DEMO_SHOPS.cornerstone.advisorName,
  moduleConfig:    defaultModuleConfig(),
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    // Merge moduleConfig carefully so new modules in the registry get their defaults
    const savedModules = parsed.moduleConfig?.modules || {};
    const mergedModules = {};
    MODULE_REGISTRY.forEach(m => {
      mergedModules[m.id] = m.id in savedModules ? savedModules[m.id] : true;
    });
    return {
      ...DEFAULTS,
      ...parsed,
      // smsName/smsProvider are overwritten again right after load() returns
      // (see the fetch-on-mount effect below) — whatever's in localStorage
      // here is only the pre-fetch flash-of-content fallback.
      moduleConfig: {
        edition: parsed.moduleConfig?.edition ?? "am",
        modules: mergedModules,
      },
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(cfg) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch {}
}

// ?demo=cornerstone / ?demo=ridgeline — deep-link straight to a demo shop,
// equivalent to clicking its pill on the persona gateway (PersonaGatewayScreen.jsx).
function applyDemoQueryParam(cfg) {
  try {
    const shop = DEMO_SHOPS[new URLSearchParams(window.location.search).get("demo")];
    if (!shop) return cfg;
    // smsName/smsProvider deliberately not touched here — they're now a
    // single global, admin-configured, server-synced value (see file header
    // comment), not something that resets per demo shop.
    const next = {
      ...cfg,
      activeShopId:    shop.id,
      shopName:        shop.shopName,
      ownerName:       shop.ownerName,
      ownerInitials:   shop.ownerInitials,
      corporateName:   shop.corporateName,
      primaryCustomer: shop.primaryCustomer,
      advisorName:     shop.advisorName,
    };
    save(next);
    return next;
  } catch {
    return cfg;
  }
}

// ?sms=Protractor — passed explicitly when the Sidecar opens the Admin
// Settings window (openSurfaceASettings in WrenchIQSidecarScreen.jsx), so
// the Integrations dropdown there opens already matching the Sidecar's
// current smsName instead of depending on the cross-window "storage" event.
function applySmsQueryParam(cfg) {
  try {
    const name = new URLSearchParams(window.location.search).get("sms");
    if (!name) return cfg;
    const next = { ...cfg, smsName: name, smsProvider: smsNameToProvider(name) };
    save(next);
    return next;
  } catch {
    return cfg;
  }
}

const DemoContext = createContext(null);

// smsProvider → header color mapping (G task: SMS skin swap)
export const SMS_PROVIDER_COLORS = {
  protractor: "#5A6A7A",
  mitchell1:  "#1B2A3B",
};

export function DemoProvider({ children }) {
  const [config, setConfig] = useState(() => applySmsQueryParam(applyDemoQueryParam(load())));

  // The real smsName/smsProvider source of truth (see file header comment)
  // — fetched once on mount and applied on top of whatever load()/the ?sms=
  // query param guessed, so every window converges on the same value
  // shortly after opening rather than depending on localStorage's
  // "storage" event (which doesn't fire reliably across separate Tauri
  // windows — the exact bug this replaces).
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/demo-config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.smsName) return;
        setConfig((prev) => ({ ...prev, smsName: data.smsName, smsProvider: data.smsProvider }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Cross-window sync: another window/tab (e.g. the sidecar) changing the
  // active demo shop writes to the shared localStorage key. The "storage"
  // event only fires in *other* windows, not the one that made the change,
  // so this can't loop with setDemo/reset below. smsName/smsProvider are
  // excluded from this — they don't go through localStorage at all anymore.
  useEffect(() => {
    function handleStorage(e) {
      if (e.key !== STORAGE_KEY) return;
      setConfig((prev) => ({ ...load(), smsName: prev.smsName, smsProvider: prev.smsProvider }));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setDemo = useCallback((updates) => {
    // smsName is now server-synced (GET/PATCH /api/demo-config), not
    // localStorage — PATCH it here rather than folding it into the same
    // save() as everything else, and don't let it round-trip through
    // save()'s localStorage snapshot below.
    if (updates.smsName) {
      const smsProvider = updates.smsProvider || smsNameToProvider(updates.smsName);
      fetch(`${API_BASE}/api/demo-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smsName: updates.smsName, smsProvider }),
      }).catch(() => {});
    }

    setConfig(prev => {
      const next = { ...prev, ...updates };
      // Auto-generate initials if ownerName changed and initials not explicitly set
      if (updates.ownerName && !updates.ownerInitials) {
        const parts = updates.ownerName.trim().split(/\s+/);
        next.ownerInitials = parts.map(p => p[0]?.toUpperCase() || "").join("").slice(0, 2);
      }
      // smsName/smsProvider excluded from the localStorage snapshot — the
      // server is their source of truth, and load() would otherwise hand
      // back a stale value here on the next page refresh before the fetch
      // above resolves.
      const { smsName: _smsName, smsProvider: _smsProvider, ...toSave } = next;
      save(toSave);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    save(DEFAULTS);
    setConfig({ ...DEFAULTS });
  }, []);

  // Derived: smsHeaderColor from smsProvider
  const smsHeaderColor = SMS_PROVIDER_COLORS[config.smsProvider] || SMS_PROVIDER_COLORS.protractor;

  return (
    <DemoContext.Provider value={{ ...config, setDemo, reset, SMS_OPTIONS, smsHeaderColor }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}
