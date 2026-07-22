/**
 * DemoContext — configurable demo variables
 *
 * Persists to localStorage so settings survive page refresh.
 * Provides: smsName, shopName, ownerName, ownerInitials, primaryCustomer
 *
 * Usage:
 *   const { smsName, shopName, ownerName } = useDemo();
 *   const { setDemo } = useDemo();
 */

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "wrenchiq_demo_config";

const SMS_OPTIONS = [
  "Protractor",
  "Tekmetric",
  "Shop-Ware",
  "Mitchell1",
  "AutoLeap",
  "Shopmonkey",
  "Other",
];

// Per-vendor Predii co-branding config
export const SMS_VENDOR_CONFIG = {
  protractor:  { displayName: "Protractor",  poweredByPredii: true },
  mitchell1:   { displayName: "Mitchell1",   poweredByPredii: true },
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
    corporateName: "GWG Auto Group",
    primaryCustomer: "Elena Vasquez",
    smsProvider: "protractor",
    advisorName: "James Kowalski",
  },
  ridgeline: {
    id: "ridgeline",
    shopName: "Ridgeline Auto Service",
    ownerName: "Carmen Reyes",
    ownerInitials: "CR",
    smsName: "Mitchell1",
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

const DEFAULTS = {
  smsName:         DEMO_SHOPS.cornerstone.smsName,
  corporateName:   DEMO_SHOPS.cornerstone.corporateName,
  shopName:        DEMO_SHOPS.cornerstone.shopName,
  ownerName:       DEMO_SHOPS.cornerstone.ownerName,
  ownerInitials:   DEMO_SHOPS.cornerstone.ownerInitials,
  primaryCustomer: DEMO_SHOPS.cornerstone.primaryCustomer,
  activeShopId:    DEMO_SHOPS.cornerstone.id,
  smsProvider:     DEMO_SHOPS.cornerstone.smsProvider,
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
    const next = {
      ...cfg,
      activeShopId:    shop.id,
      shopName:        shop.shopName,
      ownerName:       shop.ownerName,
      ownerInitials:   shop.ownerInitials,
      smsName:         shop.smsName,
      corporateName:   shop.corporateName,
      primaryCustomer: shop.primaryCustomer,
      smsProvider:     shop.smsProvider,
      advisorName:     shop.advisorName,
    };
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
  const [config, setConfig] = useState(() => applyDemoQueryParam(load()));

  // Cross-window sync: another window/tab (e.g. the sidecar) changing the
  // active demo shop writes to the shared localStorage key. The "storage"
  // event only fires in *other* windows, not the one that made the change,
  // so this can't loop with setDemo/reset below.
  useEffect(() => {
    function handleStorage(e) {
      if (e.key !== STORAGE_KEY) return;
      setConfig(load());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setDemo = useCallback((updates) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      // Auto-generate initials if ownerName changed and initials not explicitly set
      if (updates.ownerName && !updates.ownerInitials) {
        const parts = updates.ownerName.trim().split(/\s+/);
        next.ownerInitials = parts.map(p => p[0]?.toUpperCase() || "").join("").slice(0, 2);
      }
      save(next);
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
