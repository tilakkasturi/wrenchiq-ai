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

const DEFAULTS = {
  smsName:         "Protractor",
  corporateName:   "GWG Auto Group",
  shopName:        SHOP.name,
  ownerName:       SHOP.owner,
  ownerInitials:   SHOP.ownerInitials,
  primaryCustomer: "Robert Taylor",
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

  return (
    <DemoContext.Provider value={{ ...config, setDemo, reset, SMS_OPTIONS }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}
