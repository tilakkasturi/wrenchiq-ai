import { useState, useMemo, useEffect } from "react";
import {
  FileText, Sparkles, CheckCircle, AlertCircle, Mic, Send,
  ChevronRight, Clock, Car, Hash, Clipboard, ArrowRight,
  XCircle, Info, Globe, Zap, Package, Wrench,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { OEM_ROS, OP_CODES, OEM_DEALER, GENERATED_NARRATIVES } from "../data/oemDemoData";

// ── Helpers ───────────────────────────────────────────────────
function getOpCodeData(code) {
  for (const make of Object.keys(OP_CODES)) {
    const found = OP_CODES[make].find((op) => op.code === code);
    if (found) return found;
  }
  return null;
}

// Score op codes against narrative text — ranks by keyword overlap with description
function computeOpCodeSuggestions(narrative, make) {
  if (!narrative || !make || !OP_CODES[make]) return [];
  const text = [narrative.complaint, narrative.cause, narrative.correction]
    .filter(Boolean).join(" ").toLowerCase();

  return OP_CODES[make]
    .map((op) => {
      const descWords = op.description.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const matches = descWords.filter((w) => text.includes(w)).length;
      const codeBoost = text.includes(op.code.toLowerCase()) ? 25 : 0;
      const raw = matches / Math.max(descWords.length, 1);
      const confidence = Math.min(99, Math.round(raw * 75 + codeBoost + (matches > 0 ? 10 : 0)));
      return { code: op.code, confidence };
    })
    .filter((op) => op.confidence > 20)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);
}

// ── NHTSA API Helpers ─────────────────────────────────────────

async function fetchNHTSARecalls(make, model, year) {
  const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

// Map NHTSA component field to a human-readable replaced part description
function recallComponentToAction(componentField) {
  const comp = (componentField || "").toUpperCase();
  const map = [
    ["FUEL SYSTEM",        "fuel pump assembly"],
    ["AIR BAG",            "airbag inflator module"],
    ["SEAT BELT",          "seat belt pretensioner assembly"],
    ["ENGINE AND ENGINE",  "engine control components"],
    ["ELECTRICAL SYSTEM",  "electrical wiring harness"],
    ["SERVICE BRAKES",     "brake caliper / master cylinder assembly"],
    ["STEERING",           "steering gear assembly"],
    ["SUSPENSION",         "suspension linkage components"],
    ["POWER TRAIN",        "transmission / powertrain assembly"],
    ["TIRES",              "tire assembly"],
    ["STRUCTURE",          "structural body components"],
    ["VISIBILITY",         "wiper / defroster assembly"],
    ["LIGHTING",           "lighting module"],
  ];
  for (const [key, action] of map) {
    if (comp.includes(key)) return action;
  }
  return componentField?.split(":")[0].trim().toLowerCase() || "affected assembly";
}

function extractEntitiesFromRecalls(recalls) {
  const allText = recalls
    .map((r) => [r.Summary, r.Consequence, r.Remedy, r.Notes].filter(Boolean).join(" "))
    .join(" ");

  const dtcs = [
    ...new Set((allText.match(/\b[PBCU]\d{4}\b/gi) || []).map((d) => d.toUpperCase())),
  ];
  const partNos = [...new Set(allText.match(/\b\d{7,12}[-/]\d{2,5}\b/g) || [])];
  const components = [
    ...new Set(
      recalls
        .map((r) => r.Component)
        .filter(Boolean)
        .map((c) => c.split(":")[0].trim())
    ),
  ];
  const campaigns = recalls.map((r) => r.NHTSACampaignNumber).filter(Boolean);
  return { dtcs, partNos, components, campaigns };
}

// Marker used only for stripping any old-format op code sections
const OP_SECTION_MARKER = "\n\n─── Labor Operations Performed ───\n";

// Rewrites the Correction section as natural prose integrating selected op codes + parts
function rewriteCorrectionWithOpCodes(baseCorrection, opCodes, parts) {
  const base = baseCorrection.split(OP_SECTION_MARKER)[0].trimEnd();
  if (!opCodes.length) return base;

  const totalHrs = opCodes.reduce((s, op) => s + (parseFloat(op.flatRateHrs) || 0), 0);
  const opDescriptions = opCodes.map((op) => {
    const hrs = op.flatRateHrs ? `, ${op.flatRateHrs} hrs flat rate` : "";
    return `${op.description} (Op Code: ${op.code}${hrs})`;
  });
  const opsText = opDescriptions.length === 1
    ? opDescriptions[0]
    : opDescriptions.slice(0, -1).join("; ") + "; and " + opDescriptions[opDescriptions.length - 1];

  let paragraph =
    `Authorized warranty labor operations performed: ${opsText}. ` +
    `Total labor time: ${totalHrs.toFixed(1)} flat rate hours.`;

  const pricedParts = (parts || []).filter((p) => p.unitPrice > 0);
  if (pricedParts.length > 0) {
    const partsList = pricedParts
      .map((p) => `${p.description} (Part No. ${p.partNo}, qty ${p.qty})`)
      .join("; ");
    paragraph += ` OEM replacement parts installed: ${partsList}. All parts sourced per OEM parts catalog and submitted for warranty reimbursement.`;
  } else {
    paragraph += " All operations documented in the repair order and submitted for OEM warranty reimbursement.";
  }

  return base + "\n\n" + paragraph;
}

function buildNarrativeFromNHTSA(complaint, techNotes, recalls, entities, ro) {
  const allDtcs = [...new Set([...(ro.dtcs || []), ...entities.dtcs])];
  const topRecall = recalls[0];

  // Cause — identify system and DTCs, do NOT copy recall text verbatim
  const causeLines = ["Technician performed complete diagnostic evaluation per OEM procedure."];
  if (allDtcs.length > 0) {
    causeLines.push(`Scan tool retrieved DTC(s): ${allDtcs.join(", ")}.`);
  }
  if (topRecall) {
    const affectedPart = recallComponentToAction(topRecall.Component);
    causeLines.push(
      `Vehicle confirmed subject to NHTSA Campaign No. ${topRecall.NHTSACampaignNumber}. ` +
      `Inspection revealed ${affectedPart} requires replacement per OEM recall campaign criteria.`
    );
    if (entities.components.length > 1) {
      causeLines.push(
        `Additional affected systems identified: ${entities.components.slice(1, 3).join("; ")}.`
      );
    }
  }
  if (techNotes?.trim().length > 10) {
    causeLines.push(`Technician observation: ${techNotes.trim()}`);
  }

  // Correction — describe what was replaced, not the remedy notice text
  const corrLines = [];
  if (topRecall) {
    const affectedPart = recallComponentToAction(topRecall.Component);
    corrLines.push(
      `Replaced ${affectedPart} per NHTSA Campaign No. ${topRecall.NHTSACampaignNumber} recall procedures.`
    );
  }
  if (entities.partNos.length > 0) {
    corrLines.push(
      `OEM replacement part(s): ${entities.partNos.slice(0, 2).map((p) => `Part No. ${p}`).join(", ")}.`
    );
  } else {
    corrLines.push("All replacement parts OEM-sourced per parts catalog.");
  }
  corrLines.push("Repair performed to OEM specifications and torque values.");
  corrLines.push("Post-repair verification: vehicle road tested, scan tool confirms no active DTCs.");
  if (topRecall) {
    corrLines.push("Customer advised of recall completion. NHTSA campaign closure documented in RO.");
  }

  return {
    complaint: complaint || ro.complaint,
    cause: causeLines.join(" "),
    correction: corrLines.join(" "),
  };
}

// Rebuild Cause from currently selected recalls + TSBs + DTCs
function rebuildCause(ro, selTSBs, selRecalls, techNotes, nhtsaRecalls, nhtsaEntities) {
  const allDtcs = [...new Set([...(ro.dtcs || []), ...(nhtsaEntities?.dtcs || [])])];
  const lines = ["Technician performed complete diagnostic evaluation per OEM procedure."];

  if (allDtcs.length > 0) {
    lines.push(`Scan tool retrieved DTC(s): ${allDtcs.join(", ")}.`);
  }
  for (const recall of selRecalls) {
    const nhtsaMatch = nhtsaRecalls.find((r) => r.NHTSACampaignNumber === recall.campaign);
    const part = nhtsaMatch ? recallComponentToAction(nhtsaMatch.Component) : "affected assembly";
    lines.push(
      `Vehicle confirmed subject to NHTSA Campaign No. ${recall.campaign} — "${recall.title}". ` +
      `Inspection confirmed ${part} requires replacement per recall criteria.`
    );
  }
  if (selTSBs.length > 0) {
    const refs = selTSBs.map((t) => `${t.number} (${t.title})`).join("; ");
    lines.push(`Condition consistent with ${selTSBs.length > 1 ? "TSBs" : "TSB"}: ${refs}.`);
  }
  if (techNotes?.trim().length > 10) {
    lines.push(`Technician observation: ${techNotes.trim()}`);
  }
  return lines.join(" ");
}

// Rebuild base Correction (before op codes) from recalls + TSBs
function rebuildCorrectionBase(ro, selTSBs, selRecalls, nhtsaRecalls) {
  const lines = [];
  for (const recall of selRecalls) {
    const nhtsaMatch = nhtsaRecalls.find((r) => r.NHTSACampaignNumber === recall.campaign);
    const part = nhtsaMatch ? recallComponentToAction(nhtsaMatch.Component) : "affected assembly";
    lines.push(
      `Replaced ${part} per NHTSA Campaign No. ${recall.campaign} (${recall.title}) recall procedures.`
    );
    lines.push("All replacement parts OEM-sourced per parts catalog.");
  }
  for (const tsb of selTSBs) {
    const action = tsb.title.charAt(0).toLowerCase() + tsb.title.slice(1);
    lines.push(`Performed ${action} per TSB ${tsb.number}.`);
  }
  if (lines.length === 0) {
    lines.push("Diagnostic and repair performed per OEM procedure.");
    lines.push("All replacement parts OEM-sourced per parts catalog.");
  }
  lines.push("All work completed to OEM specifications and torque values.");
  lines.push("Post-repair verification complete: road test performed, no active DTCs present.");
  if (selRecalls.length > 0) {
    lines.push("Customer notified of recall completion. NHTSA campaign closure documented in RO.");
  }
  return lines.join(" ");
}

// ── ROAgent helpers ────────────────────────────────────────────
const OEM_LABOR_RATE = 185;

function guessPartPrice(desc) {
  const d = (desc || "").toLowerCase();
  if (d.includes("inflator") || d.includes("airbag"))        return 285;
  if (d.includes("fuel pump"))                                return 320;
  if (d.includes("seat belt") || d.includes("pretensioner")) return 145;
  if (d.includes("caliper") || d.includes("master cylinder")) return 210;
  if (d.includes("steering gear"))                           return 485;
  if (d.includes("transmission") || d.includes("powertrain")) return 1250;
  if (d.includes("wiring") || d.includes("harness"))         return 175;
  if (d.includes("module") || d.includes("control unit"))    return 380;
  if (d.includes("sensor"))                                  return 95;
  if (d.includes("pump"))                                    return 195;
  if (d.includes("suspension"))                              return 240;
  if (d.includes("structural") || d.includes("body"))        return 450;
  return 135;
}

// Maps a selected op code to the OEM parts it requires
function derivePartsFromOpCode(op) {
  const d    = (op.description || "").toLowerCase();
  const code = (op.code || "").toUpperCase();

  // Chevrolet
  if (code === "J4301"  || (d.includes("lifter") && d.includes("afm")))
    return [{ partNo: "12600714",   description: "AFM Lifter Kit (16-pc)",             qty: 1,  unitPrice: 485 },
            { partNo: "12589226",   description: "Valley Cover Gasket",                qty: 1,  unitPrice: 32  }];
  if (code === "J3205"  || d.includes("oil consumption diag"))
    return [{ partNo: "19370626",   description: "Engine Oil 5W-30 dexos1 (6 Qt)",    qty: 1,  unitPrice: 48  }];
  if (code === "K4521"  || (d.includes("low pressure fuel pump") && d.includes("recall")))
    return [{ partNo: "13592567",   description: "Low Pressure Fuel Pump Assembly",    qty: 1,  unitPrice: 295 }];
  if (code === "K3102"  || d.includes("fuel injector cleaning"))
    return [{ partNo: "12578278",   description: "Fuel Injector Cleaning Kit",         qty: 1,  unitPrice: 65  }];

  // Toyota
  if (code === "EF9D-20" || (d.includes("fuel pump") && d.includes("recall")))
    return [{ partNo: "23221-0V010", description: "Low Pressure Fuel Pump Assembly",  qty: 1,  unitPrice: 295 }];
  if (code === "1250C44" || (d.includes("coil") && d.includes("all cylinder")))
    return [{ partNo: "90919-02250", description: "Ignition Coil Assembly",           qty: 6,  unitPrice: 68  },
            { partNo: "90919-01253", description: "Spark Plug DILZKAR7B11",           qty: 6,  unitPrice: 24  }];
  if (code === "1250B44" || (d.includes("coil") && d.includes("spark plug")))
    return [{ partNo: "90919-02250", description: "Ignition Coil Assembly",           qty: 1,  unitPrice: 68  },
            { partNo: "90919-01253", description: "Spark Plug DILZKAR7B11",           qty: 1,  unitPrice: 24  }];
  if (code === "1250A44" || (d.includes("coil") && !d.includes("spark")))
    return [{ partNo: "90919-02250", description: "Ignition Coil Assembly",           qty: 1,  unitPrice: 68  }];
  if (code === "1762A00" || (d.includes("catalyst") && d.includes("diagnostic")))
    return [];
  if (code === "1762B44" || (d.includes("catalytic converter") && d.includes("replace")))
    return [{ partNo: "17410-0P190", description: "Catalytic Converter Assembly Bk 1", qty: 1, unitPrice: 890 },
            { partNo: "17451-0P020", description: "Exhaust Manifold Gasket",           qty: 1, unitPrice: 28  }];
  if (code === "1602A44" || d.includes("a/f sensor"))
    return [{ partNo: "89467-0E030", description: "Air-Fuel Ratio Sensor (Bank 1)",  qty: 1,  unitPrice: 175 }];
  if (code === "1602B44" || d.includes("maf sensor"))
    return [{ partNo: "22204-0D010", description: "Mass Air Flow Sensor",             qty: 1,  unitPrice: 148 },
            { partNo: "17801-0D060", description: "Air Cleaner Element",              qty: 1,  unitPrice: 28  }];
  if (code === "3114C44" || (d.includes("drive shaft") && d.includes("both")))
    return [{ partNo: "43410-0E140", description: "Drive Shaft Assembly LH",          qty: 1,  unitPrice: 420 },
            { partNo: "43410-0E141", description: "Drive Shaft Assembly RH",          qty: 1,  unitPrice: 420 }];
  if (code === "3114A44" || (d.includes("drive shaft") && d.includes("left")))
    return [{ partNo: "43410-0E140", description: "Drive Shaft Assembly LH",          qty: 1,  unitPrice: 420 }];
  if (code === "3114B44" || (d.includes("drive shaft") && d.includes("right")))
    return [{ partNo: "43410-0E141", description: "Drive Shaft Assembly RH",          qty: 1,  unitPrice: 420 }];
  if (code === "3524B44" || (d.includes("brake pad") && d.includes("rotor")))
    return [{ partNo: "04465-0E010", description: "Disc Brake Pad Kit — Front",       qty: 1,  unitPrice: 88  },
            { partNo: "43512-0E050", description: "Front Brake Disc Rotor",           qty: 2,  unitPrice: 112 }];
  if (code === "3524A44" || d.includes("brake pad"))
    return [{ partNo: "04465-0E010", description: "Disc Brake Pad Kit — Front",       qty: 1,  unitPrice: 88  }];
  if (code === "0000A00" || d.includes("oil + filter"))
    return [{ partNo: "00279-0WQTE", description: "Toyota Synthetic Oil 0W-20 (5 Qt)", qty: 1, unitPrice: 42  },
            { partNo: "04152-YZZA3", description: "Oil Filter Cartridge",             qty: 1,  unitPrice: 14  }];
  if (code === "3340A44" || d.includes("atf ws"))
    return [{ partNo: "00289-ATFWS", description: "Toyota ATF WS Fluid (1 Qt)",       qty: 4,  unitPrice: 22  }];
  if (code === "1250344" || d.includes("gdi induction") || d.includes("intake valve carbon"))
    return [{ partNo: "1250344-KIT", description: "GDI Induction Service Kit",        qty: 1,  unitPrice: 68  },
            { partNo: "17176-0V010", description: "Intake Manifold Gasket",           qty: 1,  unitPrice: 38  }];
  if (code === "1251101" || d.includes("top engine cleaner"))
    return [{ partNo: "08813-00080", description: "Toyota Top Engine Cleaner",        qty: 1,  unitPrice: 45  }];

  // Ford
  if (code === "307B08A" || d.includes("10r80") || (d.includes("transmission fluid") && d.includes("tsb")))
    return [{ partNo: "XT-10-QLVC",  description: "Motorcraft MERCON ULV (1 Qt)",     qty: 14, unitPrice: 12  }];
  if (code === "19S32B"  || (d.includes("exhaust") && d.includes("recall")))
    return [{ partNo: "DG9Z-5G232-A", description: "Exhaust Manifold Assembly",       qty: 1,  unitPrice: 385 },
            { partNo: "DG9Z-9448-A",  description: "Exhaust Manifold Gasket",         qty: 1,  unitPrice: 32  }];

  // Honda / Subaru — reprogramming ops have no parts
  if (d.includes("reprogramming") || d.includes("pcm"))
    return [];

  if (code === "12100AJ950" || d.includes("short block"))
    return [{ partNo: "12100AJ950", description: "Engine Short Block Assembly FB25",  qty: 1,  unitPrice: 2850}];
  if (code === "31100FJ040" || d.includes("cvt fluid") || d.includes("lineartronic"))
    return [{ partNo: "K0415XA200", description: "Subaru CVTF-II Fluid (1 Qt)",       qty: 14, unitPrice: 18  }];
  if (code === "31100FJ050" || d.includes("cooler line flush"))
    return [{ partNo: "K0415XA200", description: "Subaru CVTF-II Fluid (1 Qt)",       qty: 8,  unitPrice: 18  }];

  // Fallback
  const fallbackDesc = op.description.replace(/\s*—.*$/, "").replace(/\(.*\)/, "").trim();
  return [{ partNo: `${code.replace(/[^A-Z0-9]/gi, "").slice(0, 8)}-OEM`,
            description: fallbackDesc, qty: 1, unitPrice: guessPartPrice(op.description) }];
}

// Aggregate all parts from op codes + manual additions (deduplicates by partNo)
function allPartsFromSelections(opCodes, manualParts) {
  const seen = new Set();
  const parts = [];
  for (const op of opCodes) {
    for (const p of derivePartsFromOpCode(op)) {
      if (seen.has(p.partNo)) continue;
      seen.add(p.partNo);
      parts.push({ ...p, source: "Op Code" });
    }
  }
  for (const p of (manualParts || [])) {
    parts.push({ ...p, source: "Manual" });
  }
  return parts;
}

function buildROLines(opCodes, manualParts) {
  const laborLines = opCodes.map((op) => {
    const hrs = parseFloat(op.flatRateHrs) || 1.0;
    return { code: op.code, description: op.description, type: "W",
             hours: hrs, rate: OEM_LABOR_RATE,
             total: Math.round(hrs * OEM_LABOR_RATE * 100) / 100 };
  });

  const parts      = allPartsFromSelections(opCodes, manualParts);
  const laborTotal = laborLines.reduce((s, l) => s + l.total, 0);
  const partsTotal = parts.reduce((s, p) => s + p.qty * p.unitPrice, 0);

  return { laborLines, parts, laborTotal, partsTotal,
           grandTotal: laborTotal + partsTotal, relatedParts: [] };
}

function sourceStyle(source) {
  if (source === "Op Code") return { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" };
  if (source === "Manual")  return { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" };
  return                           { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
}

function statusColors(status) {
  switch (status) {
    case "Pending Write-up":
      return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" };
    case "Ready for DMS Push":
      return { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" };
    case "Pushed to CDK":
      return { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" };
    case "In Progress":
    default:
      return { bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB" };
  }
}

function scoreColor(score) {
  if (score >= 86) return COLORS.success;
  if (score >= 70) return COLORS.warning;
  return COLORS.danger;
}

// ── Sub-components ────────────────────────────────────────────

function ROListItem({ ro, selected, onSelect }) {
  const sc = statusColors(ro.status);
  return (
    <div
      onClick={() => onSelect(ro)}
      style={{
        padding: "12px 14px",
        cursor: "pointer",
        backgroundColor: selected ? "#FFF7ED" : "#FFFFFF",
        borderLeft: selected ? `3px solid ${COLORS.accent}` : "3px solid transparent",
        borderBottom: `1px solid ${COLORS.border}`,
        transition: "background 0.15s",
      }}
    >
      {/* RO id + warranty badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.primary, fontFamily: "monospace" }}>
          {ro.id}
        </span>
        {ro.warrantyType === "recall" && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: ro.recall?.isSafety ? "#FEF2F2" : "#EFF6FF",
            color: ro.recall?.isSafety ? "#DC2626" : "#1D4ED8",
            border: `1px solid ${ro.recall?.isSafety ? "#FECACA" : "#BFDBFE"}`,
            borderRadius: 4, padding: "1px 6px", letterSpacing: 0.3,
          }}>
            {ro.recall?.isSafety ? "SAFETY RECALL" : "RECALL"}
          </span>
        )}
        {ro.warrantyType === "specialPolicy" && (
          <span style={{
            fontSize: 10, fontWeight: 700, background: "#F0FDF4", color: "#16A34A",
            border: "1px solid #BBF7D0", borderRadius: 4, padding: "1px 6px", letterSpacing: 0.3,
          }}>
            SPECIAL COV
          </span>
        )}
        {ro.warrantyType === "warranty" && (
          <span style={{
            fontSize: 10, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8",
            border: "1px solid #BFDBFE", borderRadius: 4, padding: "1px 6px", letterSpacing: 0.3,
          }}>
            WARRANTY
          </span>
        )}
      </div>

      {/* Customer */}
      <div style={{ fontSize: 12, color: COLORS.textPrimary, fontWeight: 600, marginBottom: 2 }}>
        {ro.customer}
      </div>

      {/* Vehicle */}
      <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 6 }}>
        {ro.year} {ro.make} {ro.model} {ro.trim}
      </div>

      {/* Status badge + DTC chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color,
          border: `1px solid ${sc.border}`, borderRadius: 4, padding: "2px 7px",
        }}>
          {ro.status}
        </span>
        {ro.dtcs.map((dtc) => (
          <span key={dtc} style={{
            fontSize: 10, fontWeight: 700, background: "#FFF7ED", color: COLORS.accent,
            border: `1px solid #FED7AA`, borderRadius: 4, padding: "1px 5px", fontFamily: "monospace",
          }}>
            {dtc}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ label, icon: Icon, right }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon && <Icon size={15} color={COLORS.primary} />}
        <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.primary }}>
          {label}
        </span>
      </div>
      {right}
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = scoreColor(score);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      background: `${color}18`, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "3px 10px",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontWeight: 800, fontSize: 13, color }}>{score}</span>
      <span style={{ fontSize: 11, color }}>/ 100</span>
    </div>
  );
}

function AiBadge() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, background: `${COLORS.accent}18`,
      color: COLORS.accent, border: `1px solid ${COLORS.accent}33`,
      borderRadius: 4, padding: "1px 5px", letterSpacing: 0.4,
    }}>
      AI
    </span>
  );
}

function NarrativeTextarea({ label, value, onChange, rows = 7 }) {
  const count = (value || "").length;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary }}>
          {label}
        </span>
        <AiBadge />
        <span style={{ marginLeft: "auto", fontSize: 10, color: COLORS.textMuted }}>
          {count} chars
        </span>
      </div>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{
          width: "100%", boxSizing: "border-box",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: "10px 12px",
          fontSize: 12, lineHeight: 1.7,
          color: COLORS.textPrimary,
          fontFamily: "inherit",
          resize: "vertical",
          outline: "none",
          background: "#FAFAF8",
        }}
      />
    </div>
  );
}

function OpCodeCard({ opCode, selectedOpCodes, onSelect }) {
  const data = getOpCodeData(opCode.code);
  if (!data) return null;
  const isSelected = (selectedOpCodes || []).some((op) => op.code === opCode.code);

  return (
    <div
      onClick={() => onSelect(opCode.code, data)}
      style={{
        border: `1.5px solid ${isSelected ? COLORS.accent : COLORS.border}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
        cursor: "pointer",
        background: isSelected ? "#FFF7ED" : "#FFFFFF",
        transition: "border-color 0.15s, background 0.15s",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{
              fontFamily: "monospace", fontWeight: 800, fontSize: 13, color: COLORS.primary,
            }}>
              {opCode.code}
            </span>
            {/* confidence badge */}
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: opCode.confidence >= 85 ? "#F0FDF4" : opCode.confidence >= 60 ? "#FFFBEB" : "#FEF2F2",
              color: opCode.confidence >= 85 ? "#16A34A" : opCode.confidence >= 60 ? "#D97706" : "#DC2626",
              border: `1px solid ${opCode.confidence >= 85 ? "#BBF7D0" : opCode.confidence >= 60 ? "#FDE68A" : "#FECACA"}`,
              borderRadius: 4, padding: "1px 6px",
            }}>
              {opCode.confidence}%
            </span>
            {isSelected && (
              <CheckCircle size={13} color={COLORS.accent} style={{ marginLeft: "auto" }} />
            )}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, lineHeight: 1.4 }}>
            {data.description}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            {data.flatRateHrs} flat rate hrs
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, textAlign: "right" }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: isSelected ? "#DC2626" : COLORS.accent,
          border: `1px solid ${isSelected ? "#FECACA" : COLORS.accent + "55"}`,
          background: isSelected ? "#FEF2F2" : "transparent",
          borderRadius: 5, padding: "2px 8px", cursor: "pointer",
        }}>
          {isSelected ? "Remove" : "+ Add"}
        </span>
      </div>

      {data.preAuthThreshold && (
        <div style={{
          marginTop: 8, display: "flex", alignItems: "center", gap: 5,
          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6,
          padding: "4px 8px",
        }}>
          <AlertCircle size={11} color="#DC2626" />
          <span style={{ fontSize: 10, color: "#DC2626" }}>
            {data.notes}
          </span>
        </div>
      )}
    </div>
  );
}

function ComplianceChecklist({ narrative, selectedOpCodes, complianceScore, selectedRO }) {
  const hasNarrative = !!narrative;
  const items = [
    {
      label: "Complaint specificity",
      pass: hasNarrative && narrative.complaint && narrative.complaint.length > 60,
    },
    {
      label: "Cause references DTC or Recall",
      pass: hasNarrative && narrative.cause && (
        /P\d{4}/.test(narrative.cause) ||
        /recall/i.test(narrative.cause) ||
        /\d{2}[VS]\d{2,5}/.test(narrative.cause)
      ),
    },
    {
      label: "Correction lists OEM parts",
      pass: hasNarrative && narrative.correction && /Part No\./i.test(narrative.correction),
    },
    {
      label: "Op code selected",
      pass: selectedOpCodes && selectedOpCodes.length > 0,
    },
    {
      label: "Warranty type documented",
      pass: hasNarrative && !!(selectedRO && (selectedRO.warrantyType || selectedRO.isWarranty)),
    },
  ];

  const passCount = items.filter((i) => i.pass).length;

  return (
    <div>
      <SectionHeader label="Compliance Checker" icon={CheckCircle} />

      {/* Score bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Score</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: scoreColor(complianceScore) }}>
            {complianceScore}
          </span>
        </div>
        <div style={{
          height: 8, background: COLORS.borderLight, borderRadius: 4, overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${complianceScore}%`,
            background: scoreColor(complianceScore),
            borderRadius: 4,
            transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>
          {passCount} of {items.length} checks passed
        </div>
      </div>

      {/* Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px",
            background: item.pass ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${item.pass ? "#BBF7D0" : "#FECACA"}`,
            borderRadius: 7,
          }}>
            {item.pass
              ? <CheckCircle size={13} color={COLORS.success} />
              : <XCircle size={13} color={COLORS.danger} />
            }
            <span style={{ fontSize: 11, color: item.pass ? "#166534" : "#991B1B" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ROStoryWriterScreen() {
  const [selectedRO, setSelectedRO] = useState(null);
  const [editedComplaint, setEditedComplaint] = useState("");
  const [techNotes, setTechNotes] = useState("");
  const [narrative, setNarrative] = useState(null);
  const [editedNarrative, setEditedNarrative] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedOpCodes, setSelectedOpCodes] = useState([]);
  const [selectedTSBs, setSelectedTSBs] = useState([]);
  const [selectedRecalls, setSelectedRecalls] = useState([]);
  const [complianceScore, setComplianceScore] = useState(null);
  const [recording, setRecording] = useState(false);
  const [pushStatus, setPushStatus] = useState(null);
  const [pushTime, setPushTime] = useState(null);

  // Live NHTSA data (recalls — TSBs come from Predii Normalized Content)
  const [nhtsaRecalls, setNhtsaRecalls] = useState([]);
  const [nhtsaLoading, setNhtsaLoading] = useState(false);
  const [nhtsaEntities, setNhtsaEntities] = useState(null);
  const [nhtsaError, setNhtsaError] = useState(null);

  // ── ROAgent state (declared here so rebuild useEffect can reference manualParts)
  const [roAgentBuilding, setROAgentBuilding] = useState(false);
  const [roAgentCenter, setROAgentCenter] = useState(false);
  const [manualParts, setManualParts] = useState([]);
  const [addingPart, setAddingPart] = useState(false);
  const [newPartDraft, setNewPartDraft] = useState({ partNo: "", description: "", qty: "1", unitPrice: "" });

  // Fetch recalls when RO changes
  useEffect(() => {
    if (!selectedRO) return;
    setNhtsaRecalls([]);
    setNhtsaEntities(null);
    setNhtsaError(null);
    setNhtsaLoading(true);

    fetchNHTSARecalls(selectedRO.make, selectedRO.model, selectedRO.year)
      .then((recalls) => {
        setNhtsaRecalls(recalls);
        setNhtsaEntities(extractEntitiesFromRecalls(recalls));
      })
      .catch((err) => setNhtsaError(err.message))
      .finally(() => setNhtsaLoading(false));
  }, [selectedRO?.id]);

  // Rebuild Cause + Correction whenever any selection or parts change
  useEffect(() => {
    if (!narrative || !selectedRO) return;
    const parts = allPartsFromSelections(selectedOpCodes, manualParts);
    setEditedNarrative((prev) => ({
      ...prev,
      cause: rebuildCause(selectedRO, selectedTSBs, selectedRecalls, techNotes, nhtsaRecalls, nhtsaEntities),
      correction: rewriteCorrectionWithOpCodes(
        rebuildCorrectionBase(selectedRO, selectedTSBs, selectedRecalls, nhtsaRecalls),
        selectedOpCodes,
        parts,
      ),
    }));
  }, [selectedTSBs, selectedRecalls, selectedOpCodes, manualParts]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectRO(ro) {
    setSelectedRO(ro);
    setEditedComplaint(ro.complaint || "");
    setTechNotes(ro.techNotes || "");
    setSelectedOpCodes([]);
    setSelectedTSBs(ro.tsbs || []);
    setSelectedRecalls(ro.recall ? [ro.recall] : []);
    setPushStatus(ro.dmsPushed ? "success" : null);
    setPushTime(null);
    setGenerating(false);
    setRecording(false);

    setNarrative(null);
    setEditedNarrative(null);
    setComplianceScore(null);
    setROAgentCenter(false);
    setManualParts([]);
    setAddingPart(false);
    setNewPartDraft({ partNo: "", description: "", qty: "1", unitPrice: "" });
  }

  function handleGenerate() {
    if (!selectedRO) return;
    setGenerating(true);
    setTimeout(() => {
      const gen = GENERATED_NARRATIVES[selectedRO.id];
      let builtNarrative;

      if (nhtsaRecalls.length > 0 && nhtsaEntities) {
        builtNarrative = buildNarrativeFromNHTSA(
          editedComplaint, techNotes, nhtsaRecalls, nhtsaEntities, selectedRO
        );
      } else if (gen) {
        const techSuffix = techNotes?.trim().length > 10
          ? `\n\nTechnician Observation: ${techNotes.trim()}`
          : "";
        builtNarrative = {
          complaint: editedComplaint || gen.narrative.complaint,
          cause: gen.narrative.cause + techSuffix,
          correction: gen.narrative.correction,
        };
      }

      if (builtNarrative) {
        // Override cause + correction using current selections (TSBs + recalls + op codes)
        builtNarrative.cause = rebuildCause(
          selectedRO, selectedTSBs, selectedRecalls, techNotes, nhtsaRecalls, nhtsaEntities
        );
        builtNarrative.correction = rewriteCorrectionWithOpCodes(
          rebuildCorrectionBase(selectedRO, selectedTSBs, selectedRecalls, nhtsaRecalls),
          selectedOpCodes
        );
        setNarrative(builtNarrative);
        setEditedNarrative({ ...builtNarrative });
        setComplianceScore(gen ? gen.complianceScore : 82);
      }
      setGenerating(false);
    }, 2000);
  }

  function handleSelectOpCode(code, data) {
    setSelectedOpCodes((prev) => {
      const exists = prev.some((op) => op.code === code);
      return exists
        ? prev.filter((op) => op.code !== code)
        : [...prev, { code, ...data }];
    });
  }

  function handleVoiceToggle() {
    if (recording) {
      setRecording(false);
    } else {
      setRecording(true);
      setTimeout(() => setRecording(false), 4000);
    }
  }

  function handlePushCDK() {
    if (pushStatus === "pushing" || pushStatus === "success") return;
    setPushStatus("pushing");
    setTimeout(() => {
      setPushStatus("success");
      setPushTime(new Date().toLocaleTimeString());
    }, 1500);
  }

  const canPush =
    !!editedNarrative &&
    selectedOpCodes.length > 0 &&
    !!complianceScore &&
    complianceScore >= 80 &&
    pushStatus !== "success";

  // ── ROAgent (state declared earlier, above the rebuild useEffect) ──

  useEffect(() => {
    if (!narrative) return;
    setROAgentBuilding(true);
    const t = setTimeout(() => setROAgentBuilding(false), 700);
    return () => clearTimeout(t);
  }, [selectedOpCodes, manualParts]); // eslint-disable-line react-hooks/exhaustive-deps

  const roAgentData = useMemo(() => {
    if (!narrative || !selectedRO) return null;
    return buildROLines(selectedOpCodes, manualParts);
  }, [narrative, selectedOpCodes, manualParts]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAddPart() {
    if (!newPartDraft.description || !newPartDraft.unitPrice) return;
    const part = {
      partNo:      newPartDraft.partNo || `MNL-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      description: newPartDraft.description,
      qty:         Math.max(1, parseInt(newPartDraft.qty) || 1),
      unitPrice:   parseFloat(newPartDraft.unitPrice) || 0,
    };
    setManualParts((prev) => [...prev, part]);
    setNewPartDraft({ partNo: "", description: "", qty: "1", unitPrice: "" });
    setAddingPart(false);
  }

  // Static suggestions before generate; dynamic (narrative-driven) after generate
  const staticSuggestions = selectedRO ? (selectedRO.opCodeSuggestions || []) : [];
  const narrativeSuggestions = useMemo(
    () => (editedNarrative && selectedRO ? computeOpCodeSuggestions(editedNarrative, selectedRO.make) : []),
    [editedNarrative, selectedRO]
  );
  const opCodeSuggestions = editedNarrative ? narrativeSuggestions : staticSuggestions;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex",
      height: "100%",
      background: COLORS.bg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: "hidden",
    }}>

      {/* ── LEFT COLUMN ───────────────────────────────────── */}
      <div style={{
        width: 280,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        borderRight: `1px solid ${COLORS.border}`,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 16px 14px",
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.primary,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <FileText size={16} color={COLORS.accent} />
            <span style={{ fontWeight: 800, fontSize: 15, color: "#FFFFFF", letterSpacing: 0.2 }}>
              3C Story Writer
            </span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
            OEM Warranty Write-ups
          </div>
        </div>

        {/* RO list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {OEM_ROS.map((ro) => (
            <ROListItem
              key={ro.id}
              ro={ro}
              selected={selectedRO && selectedRO.id === ro.id}
              onSelect={handleSelectRO}
            />
          ))}
        </div>

        {/* Edition info */}
        <div style={{
          padding: "10px 14px",
          borderTop: `1px solid ${COLORS.border}`,
          background: COLORS.borderLight,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Info size={11} color={COLORS.textMuted} />
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>
              edition=<strong>OEM</strong> · Dealer: <strong>{OEM_DEALER.dealerCode}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── CENTER COLUMN ─────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: 24,
        gap: 18,
      }}>
        {!selectedRO ? (
          /* Empty state */
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            color: COLORS.textMuted,
            padding: 40,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: COLORS.borderLight,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FileText size={28} color={COLORS.textMuted} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textSecondary, marginBottom: 6 }}>
                Select an RO from the queue to begin
              </div>
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>
                Choose a repair order from the left panel to generate an OEM-compliant narrative.
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── INPUT PANEL ──────────────────────────────── */}
            {(!narrative || generating) && (
              <div style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                padding: 20,
              }}>
                <SectionHeader label="Repair Order Details" icon={Clipboard} />

                {/* VIN / Mileage / Customer row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                }}>
                  {[
                    { label: "VIN", value: selectedRO.vin, mono: true },
                    { label: "Mileage", value: selectedRO.mileage.toLocaleString() + " mi" },
                    { label: "Customer", value: selectedRO.customer },
                  ].map((f) => (
                    <div key={f.label}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                        {f.label}
                      </div>
                      <div style={{
                        fontSize: f.mono ? 11 : 13,
                        fontFamily: f.mono ? "monospace" : "inherit",
                        fontWeight: 600,
                        color: COLORS.textPrimary,
                        background: COLORS.borderLight,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 7,
                        padding: "6px 10px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Complaint */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Customer Complaint
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8",
                      border: "1px solid #BFDBFE", borderRadius: 4, padding: "1px 5px", letterSpacing: 0.3,
                    }}>EDITABLE</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: COLORS.textMuted }}>
                      {editedComplaint.length} chars
                    </span>
                  </div>
                  <textarea
                    value={editedComplaint}
                    onChange={(e) => setEditedComplaint(e.target.value)}
                    rows={4}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      border: `1.5px solid #BFDBFE`,
                      borderRadius: 8, padding: "10px 12px",
                      fontSize: 13, lineHeight: 1.6,
                      color: COLORS.textPrimary,
                      fontFamily: "inherit",
                      resize: "vertical",
                      outline: "none",
                      background: "#F0F7FF",
                    }}
                    placeholder="Describe the customer complaint…"
                  />
                </div>

                {/* DTC chips */}
                {selectedRO.dtcs.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                      Diagnostic Trouble Codes
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {selectedRO.dtcs.map((dtc) => (
                        <span key={dtc} style={{
                          fontFamily: "monospace", fontWeight: 800, fontSize: 13,
                          background: "#FFF7ED", color: COLORS.accent,
                          border: `1.5px solid ${COLORS.accent}55`,
                          borderRadius: 7, padding: "4px 12px",
                        }}>
                          {dtc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recall badge — toggleable */}
                {selectedRO.recall && (() => {
                  const recall = selectedRO.recall;
                  const isSel = selectedRecalls.some((r) => r.campaign === recall.campaign);
                  const safety = recall.isSafety;
                  return (
                    <div
                      onClick={() => setSelectedRecalls((prev) =>
                        isSel ? prev.filter((r) => r.campaign !== recall.campaign) : [...prev, recall]
                      )}
                      style={{
                        marginBottom: 14, padding: "10px 14px",
                        background: isSel ? (safety ? "#FEF2F2" : "#EFF6FF") : "#F9FAFB",
                        border: `1.5px solid ${isSel ? (safety ? "#FECACA" : "#BFDBFE") : COLORS.border}`,
                        borderRadius: 8, cursor: "pointer",
                        display: "flex", alignItems: "flex-start", gap: 10,
                        opacity: isSel ? 1 : 0.55,
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                        background: isSel ? (safety ? "#DC2626" : "#1D4ED8") : "transparent",
                        border: `2px solid ${isSel ? (safety ? "#DC2626" : "#1D4ED8") : "#D1D5DB"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {isSel && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isSel ? (safety ? "#DC2626" : "#1D4ED8") : COLORS.textSecondary, marginBottom: 2 }}>
                          {safety ? "SAFETY RECALL" : "RECALL"} — {recall.campaign}
                        </div>
                        <div style={{ fontSize: 11, color: isSel ? (safety ? "#991B1B" : "#1E40AF") : COLORS.textMuted }}>
                          {recall.title}
                        </div>
                        <div style={{ fontSize: 10, color: isSel ? (safety ? "#B91C1C" : "#3B82F6") : COLORS.textMuted, marginTop: 3 }}>
                          {recall.status}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Special coverage badge */}
                {selectedRO.specialCoverage && !selectedRO.recall && (
                  <div style={{
                    marginBottom: 14,
                    padding: "8px 14px",
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: 8,
                    display: "flex", alignItems: "flex-start", gap: 8,
                  }}>
                    <CheckCircle size={13} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 2 }}>
                        Special Coverage — {selectedRO.specialCoverage.program}
                      </div>
                      <div style={{ fontSize: 10, color: "#166534" }}>{selectedRO.specialCoverage.description}</div>
                    </div>
                  </div>
                )}


                {/* ── Live NHTSA Section ───────────────────── */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                    <Globe size={13} color="#1D4ED8" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Live NHTSA Data
                    </span>
                    {nhtsaLoading && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8",
                        border: "1px solid #BFDBFE", borderRadius: 4, padding: "1px 6px",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: "50%",
                          border: "1.5px solid #93C5FD", borderTop: "1.5px solid #1D4ED8",
                          display: "inline-block",
                          animation: "spin 0.7s linear infinite",
                        }} />
                        Fetching…
                      </span>
                    )}
                    {!nhtsaLoading && nhtsaRecalls.length > 0 && (() => {
                      const liveSelected = nhtsaRecalls.slice(0, 3).filter((r) =>
                        selectedRecalls.some((sr) => sr.campaign === r.NHTSACampaignNumber)
                      ).length;
                      return (
                        <>
                          <span style={{
                            fontSize: 9, fontWeight: 700, background: "#F0FDF4", color: "#16A34A",
                            border: "1px solid #BBF7D0", borderRadius: 4, padding: "1px 6px",
                          }}>
                            LIVE · {nhtsaRecalls.length} recall{nhtsaRecalls.length !== 1 ? "s" : ""}
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8",
                            border: "1px solid #BFDBFE", borderRadius: 4, padding: "1px 6px",
                          }}>
                            {liveSelected}/{Math.min(nhtsaRecalls.length, 3)} selected
                          </span>
                        </>
                      );
                    })()}
                    {!nhtsaLoading && nhtsaRecalls.length === 0 && !nhtsaError && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, background: "#F9FAFB", color: "#6B7280",
                        border: "1px solid #E5E7EB", borderRadius: 4, padding: "1px 6px",
                      }}>
                        No open recalls
                      </span>
                    )}
                    {nhtsaError && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, background: "#FEF2F2", color: "#DC2626",
                        border: "1px solid #FECACA", borderRadius: 4, padding: "1px 6px",
                      }}>
                        Error
                      </span>
                    )}
                  </div>

                  {/* Recall cards — selectable */}
                  {nhtsaRecalls.slice(0, 3).map((r, i) => {
                    const normalizedRecall = {
                      campaign: r.NHTSACampaignNumber,
                      title: r.Component?.split(":")[0].trim() || "Campaign",
                      isSafety: false,
                    };
                    const isSel = selectedRecalls.some((sr) => sr.campaign === r.NHTSACampaignNumber);
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedRecalls((prev) =>
                          isSel
                            ? prev.filter((sr) => sr.campaign !== r.NHTSACampaignNumber)
                            : [...prev, normalizedRecall]
                        )}
                        style={{
                          marginBottom: 8, padding: "10px 12px",
                          background: isSel ? "#EFF6FF" : "#F9FAFB",
                          border: `1.5px solid ${isSel ? "#BFDBFE" : COLORS.border}`,
                          borderRadius: 8, cursor: "pointer",
                          opacity: isSel ? 1 : 0.6,
                          transition: "all 0.15s",
                          display: "flex", alignItems: "flex-start", gap: 10,
                        }}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                          background: isSel ? "#1D4ED8" : "transparent",
                          border: `2px solid ${isSel ? "#1D4ED8" : "#D1D5DB"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {isSel && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 11, color: isSel ? "#1D4ED8" : COLORS.textSecondary }}>
                              {r.NHTSACampaignNumber}
                            </span>
                            <span style={{ fontSize: 10, color: isSel ? "#3B82F6" : COLORS.textMuted, fontWeight: 600 }}>
                              {r.Component?.split(":")[0].trim()}
                            </span>
                          </div>
                          {r.Summary && (
                            <div style={{ fontSize: 11, color: isSel ? "#1E40AF" : COLORS.textMuted, lineHeight: 1.5, marginBottom: 4 }}>
                              {r.Summary.length > 160 ? r.Summary.slice(0, 160) + "…" : r.Summary}
                            </div>
                          )}
                          {r.Remedy && (
                            <div style={{ fontSize: 10, color: isSel ? "#2563EB" : COLORS.textMuted, background: isSel ? "#DBEAFE" : COLORS.borderLight, borderRadius: 5, padding: "4px 8px", marginTop: 4 }}>
                              <strong>Remedy:</strong> {r.Remedy.length > 120 ? r.Remedy.slice(0, 120) + "…" : r.Remedy}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Extracted entities */}
                  {nhtsaEntities && (nhtsaEntities.dtcs.length > 0 || nhtsaEntities.partNos.length > 0 || nhtsaEntities.components.length > 0) && (
                    <div style={{
                      padding: "10px 12px",
                      background: "#FAFAF8",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                        <Zap size={11} color={COLORS.accent} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>
                          Auto-Extracted
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {nhtsaEntities.dtcs.length > 0 && (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, whiteSpace: "nowrap", paddingTop: 2 }}>
                              DTCs
                            </span>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {nhtsaEntities.dtcs.map((d) => (
                                <span key={d} style={{
                                  fontFamily: "monospace", fontSize: 11, fontWeight: 800,
                                  background: "#FFF7ED", color: COLORS.accent,
                                  border: `1.5px solid ${COLORS.accent}55`,
                                  borderRadius: 5, padding: "2px 7px",
                                }}>{d}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {nhtsaEntities.partNos.length > 0 && (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                            <Package size={11} color={COLORS.textMuted} style={{ marginTop: 3, flexShrink: 0 }} />
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {nhtsaEntities.partNos.slice(0, 4).map((p) => (
                                <span key={p} style={{
                                  fontFamily: "monospace", fontSize: 10, fontWeight: 700,
                                  background: "#F0FDF4", color: "#16A34A",
                                  border: "1px solid #BBF7D0",
                                  borderRadius: 5, padding: "2px 7px",
                                }}>Part No. {p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {nhtsaEntities.components.length > 0 && (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                            <Wrench size={11} color={COLORS.textMuted} style={{ marginTop: 3, flexShrink: 0 }} />
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {nhtsaEntities.components.slice(0, 4).map((c) => (
                                <span key={c} style={{
                                  fontSize: 10, fontWeight: 600,
                                  background: "#F5F3FF", color: "#7C3AED",
                                  border: "1px solid #DDD6FE",
                                  borderRadius: 5, padding: "2px 7px",
                                }}>{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 10, color: COLORS.textMuted }}>
                        These will be used to generate the 3C narrative.
                      </div>
                    </div>
                  )}
                </div>

                {/* ── TSBs — Predii Normalized Content ─── */}
                {selectedRO.tsbs && selectedRO.tsbs.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                      <FileText size={13} color="#D97706" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Technical Service Bulletins
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, background: "#FFF7ED", color: COLORS.accent,
                        border: `1px solid ${COLORS.accent}44`, borderRadius: 4, padding: "1px 6px",
                      }}>
                        {selectedTSBs.length}/{selectedRO.tsbs.length} selected
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 9, color: COLORS.textMuted, fontStyle: "italic" }}>
                        Predii Normalized
                      </span>
                    </div>
                    {selectedRO.tsbs.map((tsb) => {
                      const isSel = selectedTSBs.some((t) => t.number === tsb.number);
                      return (
                        <div
                          key={tsb.number}
                          onClick={() => setSelectedTSBs((prev) =>
                            isSel ? prev.filter((t) => t.number !== tsb.number) : [...prev, tsb]
                          )}
                          style={{
                            marginBottom: 8, padding: "10px 12px",
                            background: isSel ? "#FFFBEB" : "#F9FAFB",
                            border: `1.5px solid ${isSel ? "#FDE68A" : COLORS.border}`,
                            borderRadius: 8, cursor: "pointer",
                            transition: "all 0.15s",
                            opacity: isSel ? 1 : 0.55,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{
                                width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                                background: isSel ? "#D97706" : "transparent",
                                border: `2px solid ${isSel ? "#D97706" : "#D1D5DB"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {isSel && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1, fontWeight: 900 }}>✓</span>}
                              </div>
                              <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 12, color: isSel ? "#D97706" : COLORS.textSecondary }}>
                                {tsb.number}
                              </span>
                            </div>
                            <span style={{
                              fontSize: 9, fontWeight: 700,
                              background: tsb.confidence >= 90 ? "#F0FDF4" : "#FFFBEB",
                              color: tsb.confidence >= 90 ? "#16A34A" : "#D97706",
                              border: `1px solid ${tsb.confidence >= 90 ? "#BBF7D0" : "#FDE68A"}`,
                              borderRadius: 4, padding: "1px 6px",
                            }}>
                              {tsb.confidence}% match
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: isSel ? "#78350F" : COLORS.textMuted, lineHeight: 1.5, paddingLeft: 22 }}>
                            {tsb.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tech Notes textarea */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>
                    Tech Notes
                  </div>
                  <textarea
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                    rows={4}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8, padding: "10px 12px",
                      fontSize: 12, lineHeight: 1.6,
                      color: COLORS.textPrimary,
                      fontFamily: "inherit",
                      resize: "vertical",
                      outline: "none",
                      background: "#FAFAF8",
                    }}
                    placeholder="Enter technician notes…"
                  />
                </div>

                {/* Voice note + Generate row */}
                <div style={{ display: "flex", gap: 10 }}>
                  {/* Voice button */}
                  <button
                    onClick={handleVoiceToggle}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "10px 16px",
                      background: recording ? "#FEE2E2" : COLORS.borderLight,
                      color: recording ? COLORS.danger : COLORS.textSecondary,
                      border: `1px solid ${recording ? "#FECACA" : COLORS.border}`,
                      borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    <Mic size={14} color={recording ? COLORS.danger : COLORS.textSecondary} />
                    {recording ? "Recording…" : "Voice Note"}
                  </button>

                  {/* Generate button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    style={{
                      flex: 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "10px 20px",
                      background: generating ? COLORS.textMuted : COLORS.accent,
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8, cursor: generating ? "not-allowed" : "pointer",
                      fontSize: 14, fontWeight: 700,
                      letterSpacing: 0.2,
                    }}
                  >
                    <Sparkles size={15} />
                    Generate Story
                  </button>
                </div>
              </div>
            )}

            {/* ── GENERATING SPINNER ───────────────────────── */}
            {generating && (
              <div style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                padding: 40,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 48, height: 48,
                  border: `3px solid ${COLORS.borderLight}`,
                  borderTop: `3px solid ${COLORS.accent}`,
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textSecondary }}>
                  Generating OEM-compliant narrative…
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  Analyzing DTC codes, tech notes, and TSB references
                </div>
              </div>
            )}

            {/* ── RO AGENT CENTER VIEW ─────────────────────── */}
            {narrative && !generating && roAgentCenter && roAgentData && (
              <div style={{
                background: "#FFFFFF", borderRadius: 12,
                border: `1px solid ${COLORS.border}`, overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{
                  padding: "14px 20px",
                  background: "linear-gradient(135deg, #0D2A3A 0%, #0D3B45 100%)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "rgba(255,107,53,0.2)", border: "1px solid rgba(255,107,53,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={15} color="#FF6B35" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>RO Agent</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                      {selectedRO?.id} · {selectedRO?.year} {selectedRO?.make} {selectedRO?.model} · {selectedRO?.customer}
                    </div>
                  </div>
                  {roAgentBuilding ? (
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      background: "rgba(255,107,53,0.15)", color: "#FF6B35",
                      border: "1px solid rgba(255,107,53,0.3)",
                      borderRadius: 5, padding: "2px 8px",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        border: "1.5px solid rgba(255,107,53,0.4)", borderTop: "1.5px solid #FF6B35",
                        animation: "spin 0.7s linear infinite",
                      }} />
                      Building…
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      background: "rgba(74,222,128,0.15)", color: "#4ADE80",
                      border: "1px solid rgba(74,222,128,0.3)",
                      borderRadius: 5, padding: "2px 7px",
                    }}>LIVE</span>
                  )}
                  <button
                    onClick={() => setROAgentCenter(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 11px", borderRadius: 7, cursor: "pointer",
                      background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                      color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600,
                    }}
                  >
                    ← Story
                  </button>
                </div>

                <div style={{ padding: "20px 24px" }}>
                  {/* Labor */}
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Labor</div>
                    <div style={{
                      display: "grid", gridTemplateColumns: "100px 1fr 50px 40px 80px",
                      gap: 8, padding: "5px 0", borderBottom: `1.5px solid ${COLORS.border}`, marginBottom: 4,
                    }}>
                      {["Op Code","Description","Hrs","Type","Total"].map(h => (
                        <span key={h} style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</span>
                      ))}
                    </div>
                    {roAgentData.laborLines.length === 0 ? (
                      <div style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic", padding: "10px 0" }}>Select op codes in the right panel to add labor lines</div>
                    ) : roAgentData.laborLines.map((line, i) => (
                      <div key={i} style={{
                        display: "grid", gridTemplateColumns: "100px 1fr 50px 40px 80px",
                        gap: 8, padding: "8px 0", borderBottom: `1px solid ${COLORS.borderLight}`, alignItems: "center",
                      }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 12, color: COLORS.primary }}>{line.code}</span>
                        <span style={{ fontSize: 12, color: COLORS.textPrimary, lineHeight: 1.3 }}>{line.description}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, textAlign: "right" }}>{line.hours.toFixed(1)}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, textAlign: "center",
                          background: "#EFF6FF", color: "#1D4ED8",
                          border: "1px solid #BFDBFE", borderRadius: 3, padding: "1px 5px",
                        }}>W</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary, textAlign: "right", fontFamily: "monospace" }}>
                          ${line.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    {roAgentData.laborLines.length > 0 && (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, paddingTop: 8 }}>
                        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Labor subtotal</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                          ${roAgentData.laborTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Required Parts */}
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Required Parts</div>
                    {roAgentData.parts.length > 0 && (
                      <>
                        <div style={{
                          display: "grid", gridTemplateColumns: "130px 1fr 36px 90px 70px 24px",
                          gap: 8, padding: "5px 0", borderBottom: `1.5px solid ${COLORS.border}`, marginBottom: 4,
                        }}>
                          {["Part No.","Description","Qty","Unit Price","Source",""].map(h => (
                            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</span>
                          ))}
                        </div>
                        {roAgentData.parts.map((part, i) => {
                          const ss = sourceStyle(part.source);
                          return (
                            <div key={i} style={{
                              display: "grid", gridTemplateColumns: "130px 1fr 36px 90px 70px 24px",
                              gap: 8, padding: "8px 0", borderBottom: `1px solid ${COLORS.borderLight}`, alignItems: "center",
                            }}>
                              <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 11, color: COLORS.primary }}>{part.partNo}</span>
                              <span style={{ fontSize: 12, color: COLORS.textPrimary }}>{part.description}</span>
                              <span style={{ fontSize: 12, color: COLORS.textSecondary, textAlign: "center" }}>{part.qty}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, textAlign: "right", fontFamily: "monospace" }}>
                                ${part.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                              <span style={{
                                fontSize: 9, fontWeight: 700,
                                color: ss.color, background: ss.bg,
                                border: `1px solid ${ss.border}`,
                                borderRadius: 3, padding: "1px 5px",
                              }}>{part.source}</span>
                              {part.source === "Manual" ? (
                                <button
                                  onClick={() => setManualParts((prev) => {
                                    const idx = prev.findIndex((p) => p.partNo === part.partNo && p.description === part.description);
                                    return idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
                                  })}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: 14, lineHeight: 1, padding: 0 }}
                                >×</button>
                              ) : <span />}
                            </div>
                          );
                        })}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, paddingTop: 8 }}>
                          <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Parts subtotal</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                            ${roAgentData.partsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    )}
                    {/* Add Part form */}
                    <div style={{ marginTop: 10 }}>
                      {addingPart ? (
                        <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 8, padding: "14px 16px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", marginBottom: 10 }}>Add Part</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                            <input
                              placeholder="Part No. (optional)"
                              value={newPartDraft.partNo}
                              onChange={(e) => setNewPartDraft((p) => ({ ...p, partNo: e.target.value }))}
                              style={{ fontSize: 12, padding: "6px 10px", border: "1px solid #DDD6FE", borderRadius: 6, outline: "none", background: "#fff" }}
                            />
                            <input
                              placeholder="Description *"
                              value={newPartDraft.description}
                              onChange={(e) => setNewPartDraft((p) => ({ ...p, description: e.target.value }))}
                              style={{ fontSize: 12, padding: "6px 10px", border: "1px solid #DDD6FE", borderRadius: 6, outline: "none", background: "#fff" }}
                            />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                            <input
                              placeholder="Qty"
                              type="number"
                              min="1"
                              value={newPartDraft.qty}
                              onChange={(e) => setNewPartDraft((p) => ({ ...p, qty: e.target.value }))}
                              style={{ fontSize: 12, padding: "6px 10px", border: "1px solid #DDD6FE", borderRadius: 6, outline: "none", background: "#fff" }}
                            />
                            <input
                              placeholder="Unit price *"
                              type="number"
                              min="0"
                              step="0.01"
                              value={newPartDraft.unitPrice}
                              onChange={(e) => setNewPartDraft((p) => ({ ...p, unitPrice: e.target.value }))}
                              style={{ fontSize: 12, padding: "6px 10px", border: "1px solid #DDD6FE", borderRadius: 6, outline: "none", background: "#fff" }}
                            />
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={handleAddPart}
                              disabled={!newPartDraft.description || !newPartDraft.unitPrice}
                              style={{
                                flex: 1, padding: "7px 0", borderRadius: 7, cursor: "pointer",
                                background: "#7C3AED", color: "#fff",
                                border: "none", fontSize: 12, fontWeight: 700,
                                opacity: (!newPartDraft.description || !newPartDraft.unitPrice) ? 0.5 : 1,
                              }}
                            >Add to RO + Story</button>
                            <button
                              onClick={() => { setAddingPart(false); setNewPartDraft({ partNo: "", description: "", qty: "1", unitPrice: "" }); }}
                              style={{ padding: "7px 14px", borderRadius: 7, cursor: "pointer", background: "none", border: "1px solid #DDD6FE", fontSize: 12, color: "#7C3AED" }}
                            >Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingPart(true)}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "6px 14px", borderRadius: 7, cursor: "pointer",
                            background: "none", border: "1.5px dashed #DDD6FE",
                            color: "#7C3AED", fontSize: 12, fontWeight: 600,
                          }}
                        >+ Add Part</button>
                      )}
                    </div>
                  </div>

                  {/* Related Parts */}
                  {roAgentData.relatedParts.length > 0 && (
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                        Related Parts <span style={{ fontWeight: 500, textTransform: "none" }}>· Recommended</span>
                      </div>
                      {roAgentData.relatedParts.map((part, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "7px 12px",
                          background: COLORS.borderLight, border: `1px solid ${COLORS.border}`,
                          borderRadius: 7, marginBottom: 5, opacity: 0.85,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.textMuted }}>{part.partNo}</span>
                            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{part.description}</span>
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>× {part.qty}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, fontFamily: "monospace" }}>
                            ${part.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Totals */}
                  <div style={{ borderTop: `2px solid ${COLORS.primary}`, paddingTop: 14 }}>
                    {roAgentData.laborTotal > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Labor</span>
                        <span style={{ fontSize: 13, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                          ${roAgentData.laborTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {roAgentData.partsTotal > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Parts</span>
                        <span style={{ fontSize: 13, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                          ${roAgentData.partsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 18px", background: COLORS.primary, borderRadius: 9,
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>Warranty Total</span>
                      <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "monospace", letterSpacing: -0.5 }}>
                        ${roAgentData.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 10, color: COLORS.textMuted, textAlign: "center" }}>
                      Pricing estimated · Subject to OEM authorization
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── AI NARRATIVE PANEL ───────────────────────── */}
            {narrative && !generating && !roAgentCenter && (
              <div style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                padding: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Sparkles size={15} color={COLORS.accent} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.primary }}>
                      AI-Generated Narrative
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {complianceScore !== null && <ScoreBadge score={complianceScore} />}
                    {roAgentData && (
                      <button
                        onClick={() => setROAgentCenter(true)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "5px 10px", borderRadius: 7, cursor: "pointer",
                          background: "linear-gradient(135deg, #0D2A3A 0%, #0D3B45 100%)",
                          border: "none", color: "#fff", fontSize: 11, fontWeight: 700,
                        }}
                      >
                        <Sparkles size={11} color="#FF6B35" />
                        View RO
                      </button>
                    )}
                  </div>
                </div>

                {/* Also show the input panel summary when narrative is visible (for ROs with existing narrative) */}
                {selectedRO.narrative && (
                  <div style={{
                    marginBottom: 16,
                    padding: "10px 12px",
                    background: COLORS.borderLight,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    display: "flex", gap: 12, alignItems: "center",
                  }}>
                    <Car size={13} color={COLORS.textMuted} />
                    <span style={{ fontSize: 11, color: COLORS.textSecondary }}>
                      <strong>{selectedRO.vin}</strong> · {selectedRO.mileage.toLocaleString()} mi ·{" "}
                      {selectedRO.year} {selectedRO.make} {selectedRO.model} — {selectedRO.customer}
                    </span>
                  </div>
                )}

                <NarrativeTextarea
                  label="Customer Complaint"
                  value={editedNarrative?.complaint}
                  onChange={(v) => setEditedNarrative((prev) => ({ ...prev, complaint: v }))}
                  rows={6}
                />
                <NarrativeTextarea
                  label="Cause"
                  value={editedNarrative?.cause}
                  onChange={(v) => setEditedNarrative((prev) => ({ ...prev, cause: v }))}
                  rows={8}
                />
                <NarrativeTextarea
                  label="Correction"
                  value={editedNarrative?.correction}
                  onChange={(v) => setEditedNarrative((prev) => ({ ...prev, correction: v }))}
                  rows={12}
                />

                {/* Re-generate button (collapsed state) */}
                <button
                  onClick={() => {
                    setNarrative(null);
                    setEditedNarrative(null);
                    setGenerating(false);
                    setSelectedOpCodes([]);
                    setSelectedTSBs(selectedRO?.tsbs || []);
                    setSelectedRecalls(selectedRO?.recall ? [selectedRO.recall] : []);
                    setComplianceScore(null);
                    setPushStatus(null);
                    setEditedComplaint(selectedRO?.complaint || "");
                    setTechNotes(selectedRO?.techNotes || "");
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px",
                    background: "transparent",
                    color: COLORS.textMuted,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, cursor: "pointer", fontSize: 12,
                  }}
                >
                  <ArrowRight size={12} />
                  Edit inputs / regenerate
                </button>
              </div>
            )}

            {/* ── RO AGENT PANEL — moved to right column ── */}
            {false && roAgentData && (
              <div style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{
                  padding: "14px 20px",
                  background: "linear-gradient(135deg, #0D2A3A 0%, #0D3B45 100%)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "rgba(255,107,53,0.2)", border: "1px solid rgba(255,107,53,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={14} color="#FF6B35" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: 0.1 }}>
                      RO Agent
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                      Auto-building from 3C narrative
                    </div>
                  </div>
                  {roAgentBuilding ? (
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      background: "rgba(255,107,53,0.15)", color: "#FF6B35",
                      border: "1px solid rgba(255,107,53,0.3)",
                      borderRadius: 5, padding: "2px 8px",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        border: "1.5px solid rgba(255,107,53,0.4)",
                        borderTop: "1.5px solid #FF6B35",
                        animation: "spin 0.7s linear infinite",
                      }} />
                      Building…
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      background: "rgba(74,222,128,0.15)", color: "#4ADE80",
                      border: "1px solid rgba(74,222,128,0.3)",
                      borderRadius: 5, padding: "2px 8px",
                    }}>
                      LIVE
                    </span>
                  )}
                </div>

                <div style={{ padding: "18px 20px" }}>

                  {/* ── LABOR SECTION ── */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.7 }}>
                        Labor
                      </span>
                      <span style={{ fontSize: 9, color: COLORS.textMuted }}>
                        Rate: ${OEM_LABOR_RATE}/hr · Type: W (Warranty)
                      </span>
                    </div>

                    {/* Labor header row */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "90px 1fr 44px 36px 72px",
                      gap: 6, padding: "5px 0",
                      borderBottom: `1.5px solid ${COLORS.border}`,
                      marginBottom: 4,
                    }}>
                      {["Op Code", "Description", "Hrs", "Type", "Total"].map((h) => (
                        <span key={h} style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</span>
                      ))}
                    </div>

                    {roAgentData.laborLines.length === 0 ? (
                      <div style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic", padding: "8px 0" }}>
                        Select op codes in the right panel to add labor lines
                      </div>
                    ) : (
                      roAgentData.laborLines.map((line, i) => (
                        <div key={i} style={{
                          display: "grid", gridTemplateColumns: "90px 1fr 44px 36px 72px",
                          gap: 6, padding: "7px 0",
                          borderBottom: `1px solid ${COLORS.borderLight}`,
                          alignItems: "center",
                        }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 11, color: COLORS.primary }}>{line.code}</span>
                          <span style={{ fontSize: 11, color: COLORS.textPrimary, lineHeight: 1.3 }}>{line.description}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textAlign: "right" }}>{line.hours.toFixed(1)}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, textAlign: "center",
                            background: "#EFF6FF", color: "#1D4ED8",
                            border: "1px solid #BFDBFE", borderRadius: 3, padding: "1px 4px",
                          }}>{line.type}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, textAlign: "right", fontFamily: "monospace" }}>
                            ${line.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))
                    )}

                    {roAgentData.laborLines.length > 0 && (
                      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
                        <span style={{ fontSize: 11, color: COLORS.textSecondary, marginRight: 12 }}>Labor subtotal</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                          ${roAgentData.laborTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── REQUIRED PARTS SECTION ── */}
                  {(roAgentData.parts.length > 0) && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.7 }}>
                          Required Parts
                        </span>
                      </div>

                      {/* Parts header */}
                      <div style={{
                        display: "grid", gridTemplateColumns: "120px 1fr 30px 72px 20px",
                        gap: 6, padding: "5px 0",
                        borderBottom: `1.5px solid ${COLORS.border}`,
                        marginBottom: 4,
                      }}>
                        {["Part No.", "Description", "Qty", "Unit Price", ""].map((h) => (
                          <span key={h} style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</span>
                        ))}
                      </div>

                      {roAgentData.parts.map((part, i) => (
                        <div key={i} style={{
                          display: "grid", gridTemplateColumns: "120px 1fr 30px 72px 20px",
                          gap: 6, padding: "7px 0",
                          borderBottom: `1px solid ${COLORS.borderLight}`,
                          alignItems: "center",
                        }}>
                          <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: COLORS.primary }}>{part.partNo}</span>
                          <span style={{ fontSize: 11, color: COLORS.textPrimary, lineHeight: 1.3 }}>{part.description}</span>
                          <span style={{ fontSize: 11, color: COLORS.textSecondary, textAlign: "center" }}>{part.qty}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, textAlign: "right", fontFamily: "monospace" }}>
                            ${part.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          <span style={{
                            fontSize: 8, fontWeight: 700, color: part.source === "NHTSA" ? "#1D4ED8" : part.source === "Recall" ? "#DC2626" : "#D97706",
                            background: part.source === "NHTSA" ? "#EFF6FF" : part.source === "Recall" ? "#FEF2F2" : "#FFFBEB",
                            border: `1px solid ${part.source === "NHTSA" ? "#BFDBFE" : part.source === "Recall" ? "#FECACA" : "#FDE68A"}`,
                            borderRadius: 3, padding: "1px 3px", whiteSpace: "nowrap",
                          }}>{part.source}</span>
                        </div>
                      ))}

                      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
                        <span style={{ fontSize: 11, color: COLORS.textSecondary, marginRight: 12 }}>Parts subtotal</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                          ${roAgentData.partsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── RELATED PARTS ── */}
                  {roAgentData.relatedParts.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.7 }}>
                          Related Parts
                        </span>
                        <span style={{ fontSize: 9, color: COLORS.textMuted, fontStyle: "italic" }}>Recommended</span>
                      </div>

                      {roAgentData.relatedParts.map((part, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "6px 10px",
                          background: COLORS.borderLight,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 7,
                          marginBottom: 5,
                          opacity: 0.8,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: "monospace", fontSize: 10, color: COLORS.textMuted }}>{part.partNo}</span>
                            <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{part.description}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, color: COLORS.textMuted }}>× {part.qty}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, fontFamily: "monospace" }}>
                              ${part.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── TOTALS ── */}
                  <div style={{
                    borderTop: `2px solid ${COLORS.primary}`,
                    paddingTop: 14,
                  }}>
                    {roAgentData.laborTotal > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Labor</span>
                        <span style={{ fontSize: 12, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                          ${roAgentData.laborTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {roAgentData.partsTotal > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Parts</span>
                        <span style={{ fontSize: 12, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                          ${roAgentData.partsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {roAgentData.relatedParts.length > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Related parts (recommended)</span>
                        <span style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "monospace" }}>
                          ${roAgentData.relatedParts.reduce((s, p) => s + p.qty * p.unitPrice, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px",
                      background: COLORS.primary,
                      borderRadius: 8,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                        Warranty Total
                      </span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "monospace", letterSpacing: -0.5 }}>
                        ${roAgentData.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div style={{ marginTop: 10, fontSize: 10, color: COLORS.textMuted, textAlign: "center" }}>
                      Pricing is estimated · Final amounts subject to OEM authorization
                    </div>
                  </div>

                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── RIGHT COLUMN ──────────────────────────────────── */}
      <div style={{
        width: 320,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        borderLeft: `1px solid ${COLORS.border}`,
        overflowY: "auto",
        padding: 18,
        gap: 20,
      }}>

        {/* ── RO AGENT ──────────────────────────────────── */}
        <div>
          {/* Header */}
          <div style={{
            borderRadius: 10,
            overflow: "hidden",
            border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{
              padding: "10px 14px",
              background: "linear-gradient(135deg, #0D2A3A 0%, #0D3B45 100%)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7,
                background: "rgba(255,107,53,0.2)", border: "1px solid rgba(255,107,53,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={13} color="#FF6B35" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>RO Agent</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Live from 3C narrative</div>
              </div>
              {narrative && (roAgentBuilding ? (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  background: "rgba(255,107,53,0.15)", color: "#FF6B35",
                  border: "1px solid rgba(255,107,53,0.3)",
                  borderRadius: 4, padding: "2px 7px",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    border: "1.5px solid rgba(255,107,53,0.4)",
                    borderTop: "1.5px solid #FF6B35",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Building
                </span>
              ) : (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  background: "rgba(74,222,128,0.15)", color: "#4ADE80",
                  border: "1px solid rgba(74,222,128,0.3)",
                  borderRadius: 4, padding: "2px 7px",
                }}>LIVE</span>
              ))}
              {narrative && roAgentData && (
                <button
                  onClick={() => setROAgentCenter((v) => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "3px 8px", borderRadius: 5, cursor: "pointer",
                    background: roAgentCenter ? "rgba(255,255,255,0.15)" : "rgba(255,107,53,0.15)",
                    border: roAgentCenter ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,107,53,0.3)",
                    color: roAgentCenter ? "rgba(255,255,255,0.7)" : "#FF6B35",
                    fontSize: 10, fontWeight: 700,
                  }}
                >
                  {roAgentCenter ? "← Story" : "Expand ↗"}
                </button>
              )}
            </div>

            {!narrative ? (
              <div style={{ padding: "14px", background: COLORS.borderLight }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textAlign: "center" }}>
                  Generate a narrative to build the RO
                </div>
              </div>
            ) : roAgentData && (
              <div style={{ padding: "14px" }}>

                {/* Labor lines */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Labor</div>
                  {roAgentData.laborLines.length === 0 ? (
                    <div style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: "italic" }}>Select op codes to add labor lines</div>
                  ) : roAgentData.laborLines.map((line, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                      gap: 8, padding: "5px 0",
                      borderBottom: `1px solid ${COLORS.borderLight}`,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 10, color: COLORS.primary }}>{line.code}</span>
                          <span style={{
                            fontSize: 8, fontWeight: 700,
                            background: "#EFF6FF", color: "#1D4ED8",
                            border: "1px solid #BFDBFE", borderRadius: 3, padding: "0px 4px",
                          }}>W</span>
                        </div>
                        <div style={{ fontSize: 10, color: COLORS.textSecondary, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line.description}</div>
                        <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 1 }}>{line.hours.toFixed(1)} hrs × ${OEM_LABOR_RATE}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, fontFamily: "monospace", flexShrink: 0 }}>
                        ${line.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  {roAgentData.laborLines.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6 }}>
                      <span style={{ fontSize: 10, color: COLORS.textMuted }}>Labor subtotal</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                        ${roAgentData.laborTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Required parts */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>
                    Required Parts
                  </div>
                  {roAgentData.parts.length === 0 && !addingPart && (
                    <div style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: "italic", marginBottom: 6 }}>
                      Select op codes to auto-populate parts
                    </div>
                  )}
                  {roAgentData.parts.map((part, i) => {
                    const ss = sourceStyle(part.source);
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                        gap: 6, padding: "5px 0", borderBottom: `1px solid ${COLORS.borderLight}`,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: COLORS.primary, marginBottom: 1 }}>{part.partNo}</div>
                          <div style={{ fontSize: 10, color: COLORS.textSecondary, lineHeight: 1.3 }}>
                            {part.description}{part.qty > 1 && <span style={{ color: COLORS.textMuted }}> × {part.qty}</span>}
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 700, marginTop: 2, display: "inline-block",
                            color: ss.color, background: ss.bg, border: `1px solid ${ss.border}`,
                            borderRadius: 3, padding: "0px 4px" }}>{part.source}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                            ${(part.qty * part.unitPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          {part.source === "Manual" && (
                            <button onClick={() => setManualParts((p) => p.filter((_, j) => j !== i - (roAgentData.parts.length - manualParts.length)))}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: 13, padding: "0 2px", lineHeight: 1 }}>×</button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add part form */}
                  {addingPart ? (
                    <div style={{ marginTop: 8, padding: "10px", background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 7 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#7C3AED", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Add Part</div>
                      {[
                        { key: "partNo",      placeholder: "Part No.",    flex: 1 },
                        { key: "description", placeholder: "Description", flex: 2 },
                      ].map(({ key, placeholder, flex }) => (
                        <input key={key} value={newPartDraft[key]}
                          onChange={(e) => setNewPartDraft((p) => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          style={{ width: "100%", boxSizing: "border-box", marginBottom: 5,
                            border: "1px solid #DDD6FE", borderRadius: 5, padding: "4px 8px",
                            fontSize: 11, outline: "none", background: "#fff" }} />
                      ))}
                      <div style={{ display: "flex", gap: 5 }}>
                        <input value={newPartDraft.qty} onChange={(e) => setNewPartDraft((p) => ({ ...p, qty: e.target.value }))}
                          placeholder="Qty" type="number" min="1"
                          style={{ width: 48, border: "1px solid #DDD6FE", borderRadius: 5, padding: "4px 6px", fontSize: 11, outline: "none" }} />
                        <input value={newPartDraft.unitPrice} onChange={(e) => setNewPartDraft((p) => ({ ...p, unitPrice: e.target.value }))}
                          placeholder="Unit price" type="number" min="0"
                          style={{ flex: 1, border: "1px solid #DDD6FE", borderRadius: 5, padding: "4px 6px", fontSize: 11, outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <button onClick={handleAddPart}
                          style={{ flex: 1, padding: "5px 0", background: "#7C3AED", border: "none", borderRadius: 5, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          Add to RO + Story
                        </button>
                        <button onClick={() => { setAddingPart(false); setNewPartDraft({ partNo: "", description: "", qty: "1", unitPrice: "" }); }}
                          style={{ padding: "5px 10px", background: "none", border: "1px solid #DDD6FE", borderRadius: 5, color: "#7C3AED", fontSize: 11, cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingPart(true)}
                      style={{ marginTop: 8, width: "100%", padding: "5px 0",
                        background: "none", border: "1px dashed #DDD6FE", borderRadius: 6,
                        color: "#7C3AED", fontSize: 10, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      + Add Part
                    </button>
                  )}

                  {roAgentData.parts.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
                      <span style={{ fontSize: 10, color: COLORS.textMuted }}>Parts subtotal</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                        ${roAgentData.partsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Related parts — removed (parts now tied to op codes) */}
                {false && roAgentData.relatedParts.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>
                      Related Parts <span style={{ fontWeight: 500, textTransform: "none", fontSize: 9 }}>· Recommended</span>
                    </div>
                    {roAgentData.relatedParts.map((part, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 8, padding: "4px 8px",
                        background: COLORS.borderLight, borderRadius: 6,
                        marginBottom: 4, opacity: 0.8,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 9, fontFamily: "monospace", color: COLORS.textMuted }}>{part.partNo}</div>
                          <div style={{ fontSize: 10, color: COLORS.textSecondary }}>{part.description}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, fontFamily: "monospace", flexShrink: 0 }}>
                          ${part.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div style={{
                  borderTop: `2px solid ${COLORS.primary}`,
                  paddingTop: 10, marginTop: 4,
                }}>
                  {roAgentData.laborTotal > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Labor</span>
                      <span style={{ fontSize: 11, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                        ${roAgentData.laborTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {roAgentData.partsTotal > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Parts</span>
                      <span style={{ fontSize: 11, color: COLORS.textPrimary, fontFamily: "monospace" }}>
                        ${roAgentData.partsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px",
                    background: COLORS.primary, borderRadius: 7,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>Warranty Total</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "monospace", letterSpacing: -0.5 }}>
                      ${roAgentData.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: COLORS.textMuted, textAlign: "center", marginTop: 6 }}>
                    Estimated · Subject to OEM authorization
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: COLORS.border }} />

        {/* ── OP CODE SECTION ────────────────────────────── */}
        <div>
          <SectionHeader
            label="Op Code Matching"
            icon={Hash}
            right={selectedOpCodes.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: "#FFF7ED", color: COLORS.accent,
                border: `1px solid ${COLORS.accent}55`,
                borderRadius: 5, padding: "2px 8px",
              }}>
                {selectedOpCodes.length} selected
              </span>
            )}
          />

          {/* Selected op codes summary */}
          {selectedOpCodes.length > 0 && (
            <div style={{
              marginBottom: 12, padding: "10px 12px",
              background: "#FFF7ED", border: `1px solid ${COLORS.accent}44`,
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
                Added to Correction
              </div>
              {selectedOpCodes.map((op) => (
                <div key={op.code} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 4,
                }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: COLORS.primary }}>
                    {op.code}
                  </span>
                  <span style={{ fontSize: 10, color: COLORS.textSecondary, flex: 1, margin: "0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {op.description}
                  </span>
                  <button
                    onClick={() => handleSelectOpCode(op.code, op)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: 13, padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {!selectedRO ? (
            <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center", padding: "20px 0" }}>
              Select an RO to see op code suggestions
            </div>
          ) : opCodeSuggestions.length === 0 ? (
            <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center", padding: "20px 0" }}>
              No op code suggestions for this RO
            </div>
          ) : (narrative || generating) ? (
            opCodeSuggestions.map((op) => (
              <OpCodeCard
                key={op.code}
                opCode={op}
                selectedOpCodes={selectedOpCodes}
                onSelect={handleSelectOpCode}
              />
            ))
          ) : (
            <div style={{
              padding: "12px 14px",
              background: COLORS.borderLight,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 12, color: COLORS.textMuted,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Sparkles size={13} color={COLORS.textMuted} />
              Generate a narrative to see op code recommendations
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: COLORS.border }} />

        {/* ── COMPLIANCE CHECKER ─────────────────────────── */}
        <div>
          {narrative && complianceScore !== null ? (
            <ComplianceChecklist
              narrative={editedNarrative}
              selectedOpCodes={selectedOpCodes}
              complianceScore={complianceScore}
              selectedRO={selectedRO}
            />
          ) : (
            <div>
              <SectionHeader label="Compliance Checker" icon={CheckCircle} />
              <div style={{
                padding: "12px 14px",
                background: COLORS.borderLight,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontSize: 12, color: COLORS.textMuted,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <CheckCircle size={13} color={COLORS.textMuted} />
                Available after narrative is generated
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: COLORS.border }} />

        {/* ── DMS PUSH SECTION ───────────────────────────── */}
        <div>
          <SectionHeader label="DMS Push" icon={Send} />

          {/* CDK Button */}
          <div style={{ marginBottom: 10 }}>
            {pushStatus === "success" ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 14px",
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 9,
              }}>
                <CheckCircle size={16} color={COLORS.success} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
                    Pushed to CDK
                  </div>
                  {pushTime && (
                    <div style={{ fontSize: 11, color: "#16A34A" }}>
                      at {pushTime}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={handlePushCDK}
                disabled={!canPush || pushStatus === "pushing"}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "12px 16px",
                  background: canPush && pushStatus !== "pushing" ? COLORS.accent : COLORS.borderLight,
                  color: canPush && pushStatus !== "pushing" ? "#FFFFFF" : COLORS.textMuted,
                  border: `1px solid ${canPush && pushStatus !== "pushing" ? COLORS.accent : COLORS.border}`,
                  borderRadius: 9, cursor: canPush && pushStatus !== "pushing" ? "pointer" : "not-allowed",
                  fontSize: 13, fontWeight: 700,
                  transition: "background 0.15s",
                }}
              >
                {pushStatus === "pushing" ? (
                  <>
                    <div style={{
                      width: 14, height: 14,
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Pushing…
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Push to CDK Global
                  </>
                )}
              </button>
            )}

            {!canPush && pushStatus !== "success" && (
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 5, paddingLeft: 2 }}>
                {!narrative && "Generate a narrative first · "}
                {selectedOpCodes.length === 0 && "Select an op code · "}
                {complianceScore !== null && complianceScore < 80 && "Score must be ≥ 80"}
              </div>
            )}
          </div>

          {/* Reynolds & Reynolds */}
          <div style={{ marginBottom: 8 }}>
            <button
              disabled
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                background: COLORS.borderLight,
                color: COLORS.textMuted,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 9, cursor: "not-allowed",
                fontSize: 12, fontWeight: 600,
              }}
            >
              <span>Reynolds & Reynolds</span>
              <span style={{
                fontSize: 10, color: COLORS.textMuted,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 4, padding: "1px 6px",
              }}>
                Configure in Settings
              </span>
            </button>
          </div>

          {/* Dealertrack */}
          <div>
            <button
              disabled
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                background: COLORS.borderLight,
                color: COLORS.textMuted,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 9, cursor: "not-allowed",
                fontSize: 12, fontWeight: 600,
              }}
            >
              <span>Dealertrack</span>
              <span style={{
                fontSize: 10, color: COLORS.textMuted,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 4, padding: "1px 6px",
              }}>
                Configure in Settings
              </span>
            </button>
          </div>

          {/* DMS info */}
          <div style={{
            marginTop: 12,
            padding: "8px 10px",
            background: COLORS.borderLight,
            borderRadius: 7,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Info size={11} color={COLORS.textMuted} />
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>
              Active DMS: <strong style={{ color: COLORS.textSecondary }}>{OEM_DEALER.dms}</strong> · {OEM_DEALER.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
