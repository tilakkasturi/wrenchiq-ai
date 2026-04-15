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

import { createContext, useContext, useState, useCallback } from "react";
import { SHOP } from "../data/demoData";

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

const DEFAULTS = {
  smsName:         "Protractor",
  corporateName:   "GWG Auto Group",
  shopName:        SHOP.name,
  ownerName:       SHOP.owner,
  ownerInitials:   SHOP.ownerInitials,
  primaryCustomer: "Robert Taylor",
  activeShopId:    "cornerstone",  // default to Cornerstone (Taylor demo)
  smsProvider:     "protractor",
  advisorName:     "James Kowalski",
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(cfg) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch {}
}

const DemoContext = createContext(null);

// smsProvider → header color mapping (G task: SMS skin swap)
export const SMS_PROVIDER_COLORS = {
  protractor: "#5A6A7A",
  mitchell1:  "#1B2A3B",
};

export function DemoProvider({ children }) {
  const [config, setConfig] = useState(load);

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
