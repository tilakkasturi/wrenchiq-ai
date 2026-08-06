#!/usr/bin/env python3
"""Predii NER Explorer – FastAPI backend."""

import asyncio
import json
import os
import random
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator

import httpx
import pandas as pd
import yaml
from pymongo import MongoClient
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from pydantic import BaseModel

from ner_prompt import build_system_prompt, build_user_prompt
from ner_symptom_cache import get_cache
import sme_store as _sme_module

PROMPTS_DIR = Path(__file__).parent / "prompts"


def _load_prompt(filename: str) -> str:
    return (PROMPTS_DIR / filename).read_text()

# ── Config ────────────────────────────────────────────────────────────────────
# Env vars override ner_config.yaml when set — same convention as the WrenchIQ
# next-gen repo this service is packaged alongside (see its .env.local), so a
# deploy target's real Mongo/LLM endpoints don't require hand-editing this
# YAML file on every machine it runs on.
cfg = yaml.safe_load(open("ner_config.yaml"))
if os.environ.get("MONGODB_URI"):
    cfg.setdefault("mongo", {})["uri"] = os.environ["MONGODB_URI"]
if os.environ.get("MONGODB_DB"):
    cfg.setdefault("mongo", {})["db"] = os.environ["MONGODB_DB"]
if os.environ.get("LLM_BASE_URL"):
    cfg["endpoints"]["llm"]["base_url"] = os.environ["LLM_BASE_URL"]
if os.environ.get("LLM_MODEL"):
    cfg["endpoints"]["llm"]["model"] = os.environ["LLM_MODEL"]
LLM_BASE = cfg["endpoints"]["llm"]["base_url"]
LLM_MODEL = cfg["endpoints"]["llm"].get("model", "llama3.2")

# ── SME store (singleton) ─────────────────────────────────────────────────────
SME_STORE = _sme_module.get(cfg)
ENTITY_TYPES = ["symptom", "repair_job", "repair", "dtc_code"]
# ── DTC patterns ─────────────────────────────────────────────────────────────
# Standard SAE 5-char: P0300, B1325, U0415, U15E1 (hex allowed in digits)
DTC_FULL_RE = re.compile(r"\b[BCPTU][0-9A-F]{4}\b", re.IGNORECASE)

# Short SAE: P125, C030  (letter + 1-3 pure digits, not hex — avoids partial hex matches)
DTC_SHORT_RE = re.compile(r"\b[BCPTU][0-9]{1,3}\b", re.IGNORECASE)

# Letter-O substitution: PO301, PO 130  (O treated as 0, optional space)
DTC_LETTER_O_RE = re.compile(r"\b[BCPTU][O]\s?[0-9]{2,4}\b", re.IGNORECASE)

# Padded code: P01297 (extra zero inserted → 6 chars)
DTC_PADDED_RE = re.compile(r"\b[BCPTU]0[0-9]{4}\b", re.IGNORECASE)

# Code fused to word: CODEPO300, CODE:P0300, #P0300
DTC_FUSED_RE = re.compile(r"(?:codes?[:# \t]*|#)([BCPTU][O0-9A-F]\s?[0-9A-F]{2,4})\b", re.IGNORECASE)

# FTB sub-code: U0415:71, B1325:03 — SAE base (BCPTU prefix) + colon + 1-4 hex digits
DTC_FTB_RE = re.compile(r"\b([BCPTU][0-9A-F]{1,4}):([0-9A-F]{1,4})\b", re.IGNORECASE)

# Numeric FTB (VW/Audi): 802:004, 835:001, 056:002 — numeric base + colon + subcode
# Distinct from SAE FTB: base is 3-5 pure digits, no BCPTU prefix
DTC_NUMERIC_FTB_RE = re.compile(r"(?<![0-9A-Za-z:/])([0-9]{3,5}):([0-9A-F]{2,4})\b", re.IGNORECASE)

# Volvo/proprietary with optional ECM- prefix: ECM-120D, 120D, 280C, 930B
# Must end in hex letter A-F to distinguish from pure-numeric codes
DTC_PROP_RE = re.compile(r"\b((?:ECM-)?[0-9]{2,4}[A-F])\b", re.IGNORECASE)
# Spaced variant: "121 B", "290 B" — same code with whitespace between digits and letter
DTC_PROP_SPACED_RE = re.compile(r"\b([0-9]{2,4})\s+([A-F])\b", re.IGNORECASE)

# VW/Audi 5-digit numeric: 16684, 01109, 18149  (in DTC context)
# Lookbehind excludes letters too — prevents extracting "01297" from "P01297"
DTC_NUMERIC5_RE = re.compile(r"(?<![0-9A-Za-z])([0-9]{5})(?![0-9A-Za-z])")

# Bare 3-4 digit numeric in DTC context: 8851, 8577
DTC_BARE_RE = re.compile(r"(?<![A-Z0-9\-])\b([0-9]{3,4})\b(?![A-Z0-9])", re.IGNORECASE)

# System-labelled codes: "TRAN CODE 18149" / "ENGINE CODES 8851 12555"
DTC_LABELLED_RE = re.compile(
    r"(?:tran(?:smission)?|engine|abs|body|chassis)\s+codes?\s+((?:[0-9A-F]{3,6}[\s,]+)*[0-9A-F]{3,6})",
    re.IGNORECASE,
)

_YEAR_RE = re.compile(r"^(19|20)\d{2}$")


_DTC_EMBEDDED_RE = re.compile(r'([BCPTU][O0]\d{3,4}(?:[:/]\w+)?|\d{3,5}(?:[:/]\w+)?)', re.IGNORECASE)

def _normalize_dtc(raw: str) -> str:
    """Normalize letter-O → 0, collapse internal spaces, uppercase.
    Also strips garbage prefixes like 'CODE' in 'CODEPO300'."""
    s = re.sub(r"\s+", "", raw).upper()
    # Replace O after the prefix letter only: PO301 → P0301
    if len(s) >= 2 and s[0] in "BCPTU" and s[1] == "O":
        s = s[0] + "0" + s[2:]
    # Strip leading non-DTC junk: if string doesn't start with a valid DTC
    # prefix but contains one, extract it (e.g. CODEPO300 → P0300)
    if s and s[0] not in "BCPTU0123456789":
        m = _DTC_EMBEDDED_RE.search(s)
        if m:
            s = m.group(1).upper()
            if len(s) >= 2 and s[0] in "BCPTU" and s[1] == "O":
                s = s[0] + "0" + s[2:]
    return s


def extract_dtcs_from_text(text: str, llm_codes: list[str]) -> tuple[list[str], list[dict]]:
    """
    Returns (confirmed_codes, sme_candidates).
    confirmed_codes: high-confidence DTC matches via rule-based patterns.
    sme_candidates: tokens that look DTC-like but don't match any known rule —
                    flagged for Subject Matter Expert review so we can learn new patterns.
    """
    seen: set[str] = set()
    result: list[str] = []

    def add(raw: str):
        norm = _normalize_dtc(raw.strip())
        if norm and norm not in seen:
            if _YEAR_RE.match(norm):
                return
            if not re.search(r'\d', norm):
                return
            seen.add(norm)
            result.append(norm)

    # 1. LLM results (normalize and deduplicate)
    # Strip VW/Audi status-byte suffix: P0456:01/01 → P0456:01
    # The /XX part is an occurrence counter, not part of the DTC identifier
    _status_suffix_re = re.compile(r"^([BCPTU][^/]+:[^/]+)/[^/]+$", re.IGNORECASE)
    for c in llm_codes:
        m = _status_suffix_re.match(c.strip())
        add(m.group(1) if m else c)

    # 2. SAE FTB codes: U0415:71 → add base "U0415" and qualified "U0415:71"
    for m in DTC_FTB_RE.finditer(text):
        add(m.group(1))
        add(f"{m.group(1)}:{m.group(2)}")

    # 2b. Numeric FTB codes (VW/Audi): 802:004, 835:001 → add as whole unit
    #     Track parts so DTC_BARE_RE (step 11) doesn't re-extract them separately
    _numeric_ftb_parts: set[str] = set()
    for m in DTC_NUMERIC_FTB_RE.finditer(text):
        base, sub = m.group(1), m.group(2)
        add(f"{base}:{sub}")
        _numeric_ftb_parts.add(base)
        _numeric_ftb_parts.add(sub)
        _numeric_ftb_parts.add(base.lstrip("0") or "0")  # also suppress zero-stripped form

    # 3. Standard SAE codes (5-char, hex-extended): P0300, U15E1, B1325
    for m in DTC_FULL_RE.finditer(text):
        add(m.group())

    # 4. Codes fused to word: CODEPO300
    for m in DTC_FUSED_RE.finditer(text):
        add(m.group(1))

    # 5. Letter-O substitution: PO301, PO 130
    for m in DTC_LETTER_O_RE.finditer(text):
        add(m.group())

    # 6. Padded codes: P01297
    for m in DTC_PADDED_RE.finditer(text):
        add(m.group())

    # 7. Short SAE codes: P125, C030
    for m in DTC_SHORT_RE.finditer(text):
        add(m.group())

    # 8. Volvo/proprietary hex-suffix: ECM-120D, 120D, 280C (preserve ECM- prefix)
    # Track numeric prefix (e.g. "120" from "120D") so step 11 won't re-extract it as bare code
    _prop_numeric_parts: set[str] = set()
    for m in DTC_PROP_RE.finditer(text):
        add(m.group(1))
        digits_only = re.search(r"[0-9]+", m.group(1))
        if digits_only:
            _prop_numeric_parts.add(digits_only.group())

    # 8b. Space-separated prop codes: "121 B", "290 B" → canonicalize to "121B", "290B"
    for m in DTC_PROP_SPACED_RE.finditer(text):
        base, suffix = m.group(1), m.group(2).upper()
        add(f"{base}{suffix}")
        _prop_numeric_parts.add(base)

    # 9. System-labelled blocks: "TRAN CODE 18149 8851"
    for m in DTC_LABELLED_RE.finditer(text):
        for token in re.split(r"[\s,]+", m.group(1)):
            if token:
                add(token)

    # Pre-split into paragraphs for context lookup — avoids hardcoded character distances.
    # Paragraph separators: escaped CRLF pairs (<\r><\n><\r><\n>), actual \r\n\r\n, or \n\n.
    _PARA_SEP = re.compile(r'(?:<\\r><\\n>|\r\n|\n){2,}')
    _para_spans: list[tuple[int, int]] = []
    _prev = 0
    for _sep in _PARA_SEP.finditer(text):
        _para_spans.append((_prev, _sep.start()))
        _prev = _sep.end()
    _para_spans.append((_prev, len(text)))

    def _para_ctx(char_pos: int) -> str:
        for _s, _e in _para_spans:
            if _s <= char_pos < _e:
                return text[_s:_e]
        return text  # fallback: whole text

    def _has_dtc_signal(segment: str) -> bool:
        return bool(DTC_FULL_RE.search(segment) or DTC_SHORT_RE.search(segment)
                    or DTC_PROP_RE.search(segment) or DTC_LABELLED_RE.search(segment))

    # 10. 5-digit VW/Audi numeric codes: 16684, 01109 — gate on paragraph-level DTC signal
    for m in DTC_NUMERIC5_RE.finditer(text):
        num = m.group(1)
        if _YEAR_RE.match(num):
            continue
        if _has_dtc_signal(_para_ctx(m.start())):
            add(num)

    # 11. Bare 3-4 digit numeric codes: 8851, 8577 — gate on paragraph-level DTC signal
    # Skip: digit-part of letter-O codes (PO 130 → skip 130)
    # Skip: parts already captured as numeric FTB or prop-code components
    _letter_o_digit_re = re.compile(r"\b[BCPTU][O]\s+([0-9]{2,4})\b", re.IGNORECASE)
    _letter_o_digits = {m2.group(1) for m2 in _letter_o_digit_re.finditer(text)}
    for m in DTC_BARE_RE.finditer(text):
        num = m.group(1)
        if _YEAR_RE.match(num):
            continue
        if num in _letter_o_digits:
            continue
        if num in _numeric_ftb_parts:
            continue
        if num in _prop_numeric_parts:
            continue
        para = _para_ctx(m.start())
        if _has_dtc_signal(para) or DTC_NUMERIC5_RE.search(para):
            add(num)

    # 12. Learned rules from SME feedback (hot-reloaded from sme_feedback/learned.yaml)
    try:
        for pattern in SME_STORE.get_learned_patterns():
            if pattern.get("entity_type") != "dtc_code":
                continue
            rx = pattern.get("regex")
            if not rx:
                continue
            for m in re.finditer(rx, text, re.IGNORECASE):
                add(m.group())
    except Exception:
        pass

    # Subsumption: if BASE:SUBCODE is present, bare BASE is redundant
    # e.g. P0442:01 present → drop P0442; 835:001 present → drop 835
    qualified_bases = {c.split(':')[0].upper() for c in result if ':' in c}
    result = [c for c in result if ':' in c or c.upper() not in qualified_bases]

    # ── SME candidate detection ───────────────────────────────────────────────
    # Find tokens near DTC-signal words that don't match any established rule.
    # These are surfaced for Subject Matter Expert review so patterns can be learned.
    sme_candidates = _find_sme_candidates(text, seen)

    return result, sme_candidates


# Each tuple: (compiled_regex, hint_type)
# hint_type tells the UI what kind of entity this might be: 'dtc' or 'component'
_SME_PATTERNS: list[tuple] = [
    # fault/error/dtc keyword → almost certainly a DTC variant
    (re.compile(
        r"(?:fault|error|dtc|diag(?:nostic)?|malf(?:unction)?)\s*(?:code[s]?)?\s*[:#]?\s*"
        r"([A-Z0-9][A-Z0-9\-]{2,9})\b",
        re.IGNORECASE,
    ), "dtc"),
    # Hyphenated prefix codes: SPN-1234, MIL-1234 (OBD standard SPN numbers, etc.)
    (re.compile(r"\b([A-Z]{2,4}-[0-9]{2,6})\b", re.IGNORECASE), "dtc"),
    # Slash-separated pairs near DTC context: component/part codes like VALVE-BODY/12345
    (re.compile(r"\b([A-Z]{2,}[0-9][A-Z0-9]*)/([A-Z0-9]{3,8})\b", re.IGNORECASE), "component"),
]


def _find_sme_candidates(text: str, already_found: set[str]) -> list[dict]:
    """
    Scan text for DTC-like tokens that didn't match any established rule.
    Returns list of {token, context, hint_type} dicts for SME review.
    hint_type: 'dtc' | 'component' — guides the UI label shown to the reviewer.
    Only tokens that contain at least one digit are returned (pure words filtered out).
    """
    candidates: dict[str, dict] = {}
    for pattern, hint_type in _SME_PATTERNS:
        for m in pattern.finditer(text):
            groups = [g for g in m.groups() if g]
            for g in groups:
                norm = _normalize_dtc(g.strip())
                if norm in already_found:
                    continue
                if _YEAR_RE.match(norm):
                    continue
                # Require at least one digit — filters pure words like NOS, CODED, ASSY
                if not re.search(r"\d", norm):
                    continue
                if len(norm) < 3:
                    continue
                if norm not in candidates:
                    start = max(0, m.start() - 40)
                    end = min(len(text), m.end() + 40)
                    candidates[norm] = {
                        "token": norm,
                        "context": text[start:end].strip(),
                        "hint_type": hint_type,
                    }
    return list(candidates.values())


_SME_LOG_PATH = Path("ner_output/dtc_sme_review.jsonl")


def log_sme_candidates(candidates: list[dict], source_text: str):
    """Append unrecognized DTC candidates to the SME review log for pattern learning."""
    if not candidates:
        return
    _SME_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _SME_LOG_PATH.open("a", encoding="utf-8") as f:
        for c in candidates:
            f.write(json.dumps({
                "token": c["token"],
                "context": c["context"],
                "source_excerpt": source_text[:200],
            }) + "\n")

MAINTENANCE_RE = re.compile(
    r"\b(lube|oil\s*change|oil\s*(and|&|w/)?\s*filter|l\.?o\.?f\.?|"
    # tires — any primary tire job in either word order
    r"tires?|tire\s*(rotat|mount|balanc|swap|replac|install|repair|patch|insp|pressure)|"
    r"(rotat|mount|balanc|swap|install|replac).*tires?|"
    r"wheel\s*(balanc|rotat)|tpms|tire\s*pressure|nitrogen\s*(fill|service)|"
    # filters / wipers
    r"air\s*filter|cabin\s*(air\s*)?filter|pollen\s*filter|"
    r"wiper(\s*blade)?|windshield\s*wiper|"
    # inspections — standalone inspection services
    r"inspection(s)?|multi[\s-]?point(\s*inspect(ion)?)?|mpi\b|mpvi\b|"
    r"vehicle\s*inspect(ion)?|inspect\s*vehicle|annual\s*inspect(ion)?|"
    r"courtesy\s*inspect(ion)?|pre[- ]?(delivery|purchase|sale|owned)\s*inspect(ion)?|"
    r"oil\s*life\s*reset|state\s*inspect(ion)?|safety\s*inspect(ion)?|"
    r"emission\s*(test|inspect(ion)?)|smog\s*(check|inspect(ion)?)|"
    r"brake\s*inspect(ion)?|battery\s*(test|check|inspect(ion)?))\b",
    re.IGNORECASE,
)


# Belt jobs (serpentine/drive/timing/accessory) are a mechanical repair, not
# routine maintenance — checked ahead of MAINTENANCE_RE because classify_sample
# runs on the *combined* wr+wp text, and a belt job co-occurring on the same
# RO as an unrelated inspection job (which MAINTENANCE_RE does match) would
# otherwise mislabel the whole sample as maintenance.
MECHANICAL_OVERRIDE_RE = re.compile(r"\b(serpentine|drive|timing|accessory)\s*belt\b", re.IGNORECASE)


def classify_sample(wr: str, wp: str) -> str:
    text = f"{wr} {wp}"
    if MECHANICAL_OVERRIDE_RE.search(text):
        return "mechanical"
    return "maintenance" if MAINTENANCE_RE.search(text) else "mechanical"

# ── Component taxonomy index ──────────────────────────────────────────────────

def _build_component_index() -> tuple[dict, dict]:
    """
    Build two indexes from component.taxonomy:
    - COMPONENT_INDEX: NPT (lowercased) → {pt, ...}  — for exact lookup
    - TOKEN_INDEX: token → set of NPTs containing it — for subset fallback
    """
    index: dict[str, dict] = {}
    token_idx: dict[str, set] = {}
    taxonomy_path = Path("resources/component.taxonomy")
    if not taxonomy_path.exists():
        return index, token_idx
    with open(taxonomy_path, encoding="utf-8") as f:
        header = f.readline().strip().split("\t")
        col = {h: i for i, h in enumerate(header)}
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 4:
                continue
            pt  = parts[col["PT"]].strip().lower()
            npt = parts[col["NPT"]].strip().lower()
            if npt and pt and npt not in index:
                index[npt] = {"pt": pt}
                for tok in npt.split():
                    token_idx.setdefault(tok, set()).add(npt)
    print(f"[startup] Component taxonomy: {len(index):,} NPT entries → {len(set(v['pt'] for v in index.values())):,} PTs")
    return index, token_idx

COMPONENT_INDEX, TOKEN_INDEX = _build_component_index()


def _token_subset_lookup(raw: str) -> str | None:
    """
    Fallback: find NPTs whose token set is a superset of the query tokens
    (i.e. the query words all appear in the NPT, possibly with extra qualifiers).
    Returns the PT of the shortest matching NPT, or None.
    Requires at least 2 query tokens to avoid single-word false positives.
    """
    query_tokens = raw.strip().lower().split()
    if len(query_tokens) < 2:
        return None
    # Candidates = NPTs that contain every query token
    candidates: set[str] | None = None
    for tok in query_tokens:
        hits = TOKEN_INDEX.get(tok, set())
        candidates = hits if candidates is None else candidates & hits
        if not candidates:
            return None
    # Prefer shortest NPT (fewest extra qualifiers)
    best = min(candidates, key=lambda npt: len(npt.split()))
    return COMPONENT_INDEX[best]["pt"]


def normalize_repairs(repairs: list[str]) -> list[dict]:
    """Map each LLM repair string to its Preferred Term: exact NPT match, then token-subset fallback."""
    results = []
    for raw in repairs:
        key = raw.strip().lower()
        entry = COMPONENT_INDEX.get(key)
        if entry:
            pt = entry["pt"]
        else:
            pt = _token_subset_lookup(key)
        results.append({"raw": raw, "pt": pt})
    return results


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Predii360 Pipeline for Repair Orders")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# ── Sample cache ──────────────────────────────────────────────────────────────
SAMPLES: list[dict] = []
DEMO_SAMPLES: list[dict] = []
DATASOURCES: list[dict] = []  # [{id, label, count}]

# ── Shop-profile cache (separate from the NER SAMPLES pipeline above) ─────────
SHOP_DIR = Path("datasources") / "cornerstone"
SHOP: dict = {}
SHOP_CUSTOMERS: list[dict] = []
SHOP_VEHICLES: list[dict] = []
SHOP_ROS: list[dict] = []


def _load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path) as f:
        return [json.loads(line) for line in f if line.strip()]


def load_shop_data() -> None:
    global SHOP, SHOP_CUSTOMERS, SHOP_VEHICLES, SHOP_ROS
    shop_json = SHOP_DIR / "shop.json"
    if not shop_json.exists():
        print(f"[startup] Shop-profile dir not found, skipping: {SHOP_DIR}")
        return
    SHOP = json.loads(shop_json.read_text())
    SHOP_CUSTOMERS = _load_jsonl(SHOP_DIR / "customers.jsonl")
    SHOP_VEHICLES = _load_jsonl(SHOP_DIR / "vehicles.jsonl")
    SHOP_ROS = _load_jsonl(SHOP_DIR / "repair_orders.jsonl")
    print(f"[startup] Shop profile '{SHOP.get('name')}': {len(SHOP_ROS)} ROs, "
          f"{len(SHOP_CUSTOMERS)} customers, {len(SHOP_VEHICLES)} vehicles")


def _iso(value):
    """Normalize a Mongo date field to an ISO string. WrenchIQ's own writers
    are inconsistent — most store dateIn/dateOut as an ISO string, but some
    code paths hand the Mongo Node driver a native Date, which pymongo then
    deserializes here as a datetime object, not a string. Every downstream
    read in this file (datetime.fromisoformat(ro["check_in_ts"])) assumes a
    string, so this is where that gets normalized once, at ingestion."""
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _mongo_ro_to_shop_ro(doc: dict) -> dict:
    """Transform a WrenchIQ RepairOrder Mongo doc into the flat SHOP_ROS shape
    /api/shop_profile expects (see load_shop_data / _load_jsonl for the local
    JSONL equivalent).

    Known limitation, not papered over: WrenchIQ's schema carries no vendor
    cost-basis field for parts or labor (only price-charged fields like
    lineCost/invoice). total_cost here is therefore parts-price-only, not
    true COGS — margin_pct in the Shop Profile tab will read artificially
    high for the Mongo-sourced share of cornerstone ROs (the 294 curated +
    migrated records; the 1,854 records ingested FROM this same ro-ner-demo
    corpus earlier are excluded below to avoid double-counting, and the
    local JSONL's real total_cost/margin data is what backs those already).
    """
    jobs = doc.get("repairJobs") or []
    parts = []
    for j in jobs:
        for p in (j.get("parts") or []):
            parts.append({
                "name":      p.get("description", "Part"),
                "qty":       1,
                "unit_price": p.get("lineCost", 0),
                "unit_cost":  p.get("lineCost", 0),  # no real cost-basis field — see docstring
                "supplier":  "Unknown",
            })
    return {
        "ro_id":         doc.get("roNumber"),
        "customer_id":   (doc.get("customer") or {}).get("id"),
        "check_in_ts":   _iso(doc.get("dateIn")),
        "completed_ts":  _iso(doc.get("dateOut")),
        "status":        "completed" if doc.get("status") == "closed" else doc.get("status", ""),
        "invoice_total": doc.get("invoice", 0) or 0,
        "total_cost":    sum(p["unit_cost"] for p in parts),
        "repair_jobs":   [j.get("description", "") for j in jobs if j.get("description")],
        "parts":         parts,
    }


def _mongo_ro_to_sample(doc: dict, ds_id: str, id_offset: int) -> dict | None:
    """Transform a WrenchIQ RepairOrder Mongo doc into the SAMPLES shape
    /api/batch/stream draws its NER-extraction pool from (see
    _load_jsonl_records for the local-JSONL equivalent). Returns None for
    docs with no repair-job text to extract from (mirrors _load_jsonl_records
    skipping blank-notes lines)."""
    jobs = doc.get("repairJobs") or []
    work_performed = _normalize_case("; ".join(j.get("description", "") for j in jobs if j.get("description")))
    if not work_performed:
        return None
    work_requested = _normalize_case(doc.get("customerConcern") or "")
    vehicle = doc.get("vehicle") or {}

    return {
        "id": id_offset,
        "datasource": ds_id,
        "source": "labor",
        "category": classify_sample(work_requested, work_performed),
        "count": 1,
        "work_requested": work_requested,
        "work_performed": work_performed,
        "make": vehicle.get("make", ""),
        "model": vehicle.get("model", ""),
        "year": vehicle.get("year", ""),
        "ro_id": doc.get("roNumber"),
        "customer_id": (doc.get("customer") or {}).get("id"),
        "check_in_ts": _iso(doc.get("dateIn")),
        "invoice_total": doc.get("invoice", 0) or 0,
        "total_cost": None,  # no vendor cost-basis field in WrenchIQ's schema — see _mongo_ro_to_shop_ro
    }


def load_mongo_cornerstone() -> None:
    """Merges WrenchIQ's own cornerstone RepairOrder data (the curated story
    ROs + the migrated Peninsula Precision loc-001 ROs) into SHOP_ROS/
    SHOP_CUSTOMERS, so this tool's cornerstone view stays in sync with
    WrenchIQ's "Historical ROs" screen instead of two disconnected datasets
    coincidentally sharing a shop name.

    Deliberately excludes source: 'ro-ner-demo-synthetic-corpus' docs — those
    are this same tool's own local repair_orders.jsonl round-tripped into
    WrenchIQ's Mongo earlier; including them here would double-count them.
    """
    global SHOP_ROS, SHOP_CUSTOMERS, SAMPLES, DATASOURCES

    mongo_cfg = cfg.get("mongo") or {}
    if not mongo_cfg.get("enabled"):
        return

    try:
        client = MongoClient(mongo_cfg["uri"], serverSelectionTimeoutMS=3000)
        db = client[mongo_cfg["db"]]
        coll = db[mongo_cfg["collection"]]
        docs = list(coll.find({
            "shopId": mongo_cfg.get("shop_id", "cornerstone"),
            "source": {"$ne": "ro-ner-demo-synthetic-corpus"},
        }))
        client.close()
    except Exception as e:
        print(f"[startup] MongoDB cornerstone augmentation skipped (unreachable): {e}")
        return

    new_ros = [_mongo_ro_to_shop_ro(d) for d in docs]
    # /api/shop_profile does date arithmetic (datetime.fromisoformat) over
    # every record in SHOP_ROS with no per-record guard — one WrenchIQ RO
    # with a missing/null dateIn would otherwise 500 the entire endpoint for
    # every shop, not just drop that one record. Drop invalid ones here,
    # once, at the merge point, instead of defending every consumer.
    valid_new_ros, skipped_ros = [], 0
    for ro in new_ros:
        ts = ro.get("check_in_ts")
        try:
            datetime.fromisoformat(ts)
            valid_new_ros.append(ro)
        except (TypeError, ValueError):
            skipped_ros += 1
    if skipped_ros:
        print(f"[startup] Skipped {skipped_ros} Mongo cornerstone RO(s) with missing/invalid dateIn")
    SHOP_ROS = SHOP_ROS + valid_new_ros

    existing_ids = {c["customer_id"] for c in SHOP_CUSTOMERS}
    seen_in_mongo = {}
    for d in docs:
        cust = d.get("customer") or {}
        cid = cust.get("id")
        if not cid or cid in existing_ids or cid in seen_in_mongo:
            continue
        seen_in_mongo[cid] = cust.get("name", "Unknown")

    # Real signal, not fabricated: a customer is "repeat" here if this merge
    # actually contains more than one RO for their id.
    visit_counts = Counter(d.get("customer", {}).get("id") for d in docs)
    since_by_customer = {}
    for d in docs:
        cid = (d.get("customer") or {}).get("id")
        date_in = d.get("dateIn")
        if cid and date_in:
            year = date_in[:4]
            if cid not in since_by_customer or year < since_by_customer[cid]:
                since_by_customer[cid] = year

    for cid, name in seen_in_mongo.items():
        SHOP_CUSTOMERS.append({
            "customer_id": cid,
            "name": name,
            "phone": "", "email": "", "address": "", "city": "", "state": "", "zip": "",
            "is_repeat_customer": visit_counts.get(cid, 0) > 1,
            "customer_since": int(since_by_customer.get(cid, "2026")),
        })

    # Also extend SAMPLES — the pool /api/batch/stream draws from for the
    # actual NER extraction runs. Without this, SAMPLES stayed local-only
    # (1,854 records) while SHOP_ROS/Shop Profile reflected the full merge
    # (2,148), so Live Download Analytics / Top N Clusters and Shop Profile
    # would report different RO counts for the same "years" window — the
    # exact inconsistency this augmentation exists to prevent.
    ds_id = mongo_cfg.get("shop_id", "cornerstone")
    id_offset = len(SAMPLES)
    new_samples = []
    for d in docs:
        sample = _mongo_ro_to_sample(d, ds_id, id_offset + len(new_samples))
        if sample:
            new_samples.append(sample)
    SAMPLES = SAMPLES + new_samples
    for entry in DATASOURCES:
        if entry["id"] == ds_id:
            entry["count"] += len(new_samples)
            break

    print(f"[startup] MongoDB cornerstone augmentation: +{len(new_ros)} ROs, "
          f"+{len(seen_in_mongo)} customers, +{len(new_samples)} NER samples "
          f"(excluded ro-ner-demo-synthetic-corpus duplicates already present "
          f"in the local JSONL)")

CATEGORY_LABELS = {
    "standard_maintenance": "Standard Maintenance",
    "symptom_repair":       "Symptom → Repair",
    "dtc_driven":           "DTC / Check Engine",
    "complex_multi":        "Complex / Multi-System",
    "parts_focused":        "Parts Replacement",
}


def _load_tsv_records(ds_id: str, ds_dir: Path, files: dict, min_count: int, sample_size: int, id_offset: int) -> list[dict]:
    records: list[dict] = []
    for fname, source in [
        (files.get("combined", ""), "labor"),
        (files.get("parts", ""), "parts"),
    ]:
        if not fname:
            continue
        p = ds_dir / fname
        if not p.exists():
            continue
        df = pd.read_csv(p, sep="\t", dtype=str, nrows=sample_size, encoding="latin-1", on_bad_lines="skip").fillna("")
        df["count"] = pd.to_numeric(df["count"], errors="coerce").fillna(0).astype(int)
        rows = df[df["count"] >= min_count].to_dict("records")
        for row in rows:
            wr = row.get("WorkRequested", "").strip()
            wp = row.get("WorkPerformed", "").strip()
            if wr or wp:
                records.append({
                    "id": id_offset + len(records),
                    "datasource": ds_id,
                    "source": source,
                    "category": classify_sample(wr, wp),
                    "count": int(row["count"]),
                    "work_requested": wr,
                    "work_performed": wp,
                })
    return records


def _normalize_case(text: str) -> str:
    """Title-case text that is predominantly uppercase (raw shop data)."""
    if not text:
        return text
    letters = [c for c in text if c.isalpha()]
    if letters and sum(1 for c in letters if c.isupper()) / len(letters) > 0.7:
        return text.title()
    return text


def _load_jsonl_records(ds_id: str, ds_dir: Path, sample_size: int, id_offset: int) -> list[dict]:
    records: list[dict] = []
    jsonl_files = sorted(ds_dir.glob("*.jsonl"))
    for jsonl_path in jsonl_files:
        with open(jsonl_path, encoding="utf-8") as f:
            for line in f:
                if len(records) >= sample_size:
                    break
                line = line.strip()
                if not line:
                    continue
                try:
                    ro = json.loads(line)
                except json.JSONDecodeError:
                    continue
                ro_symptoms = _normalize_case(" ".join(ro.get("symptoms", [])))
                # Some datasources (e.g. cornerstone) store one flat RO per line
                # instead of nesting ro_lines — treat the RO itself as its own line.
                ro_lines = ro.get("ro_lines") or ([ro] if ro.get("notes") else [])
                for ro_line in ro_lines:
                    notes = _normalize_case((ro_line.get("notes") or "").strip())
                    if not notes:
                        continue
                    records.append({
                        "id": id_offset + len(records),
                        "datasource": ds_id,
                        "source": "labor",
                        "category": classify_sample(ro_symptoms, notes),
                        "count": 1,
                        "work_requested": ro_symptoms,
                        "work_performed": notes,
                        "make": ro_line.get("make", ""),
                        "model": ro_line.get("model", ""),
                        "year": ro_line.get("year", ""),
                        # Shop-profile passthrough — present only on flat-RO datasets
                        # like cornerstone; harmlessly absent for nested-ro_lines ones.
                        # These ride through untouched into /api/batch/stream results
                        # (which spread **sample alongside the extracted entities),
                        # letting the Shop Profile tab's "From Batch NER" mode compute
                        # real business metrics from actual LLM output.
                        "ro_id": ro_line.get("ro_id"),
                        "customer_id": ro_line.get("customer_id"),
                        "check_in_ts": ro_line.get("check_in_ts"),
                        "invoice_total": ro_line.get("invoice_total"),
                        "total_cost": ro_line.get("total_cost"),
                    })
    return records


def _load_csv_records(ds_id: str, ds_dir: Path, sample_size: int, id_offset: int) -> list[dict]:
    """DMS repair-order exports (e.g. cd/repair_order_export*.csv) are line-per-
    part/operation, not one row per RO. Group by (RONUM, OPERATIONS_sequence) so
    each record is one operation with its complaint/correction text and the
    parts consumed on it — and, critically, the VEHICLE_make/model/modelYear
    columns this export carries that the aggregated WR/WP TSV does not."""
    records: list[dict] = []
    csv_files = sorted(ds_dir.glob("repair_order_export*.csv"))
    if not csv_files:
        return records

    groups: dict[tuple, list[dict]] = {}
    for csv_path in csv_files:
        df = pd.read_csv(csv_path, dtype=str, encoding="utf-8", encoding_errors="replace").fillna("")
        for row in df.to_dict("records"):
            key = (row.get("RONUM", ""), row.get("OPERATIONS_sequence", ""))
            groups.setdefault(key, []).append(row)

    for (ronum, seq), rows in groups.items():
        if len(records) >= sample_size:
            break
        first = rows[0]
        wr = (first.get("OPERATIONS_custComment") or first.get("OPERATIONS_description") or "").strip()
        wp_base = (first.get("OPERATIONS_description") or "").strip()
        parts, seen_parts = [], set()
        for r in rows:
            pd_desc = (r.get("OPERATIONS_parts_part_description") or "").strip()
            if pd_desc and pd_desc not in seen_parts:
                seen_parts.add(pd_desc)
                parts.append(pd_desc)
        wp = f"{wp_base} | PARTS: {', '.join(parts)}" if parts else wp_base
        if not wr and not wp:
            continue
        records.append({
            "id": id_offset + len(records),
            "datasource": ds_id,
            "source": "labor",
            "category": classify_sample(wr, wp),
            "count": 1,
            "work_requested": wr,
            "work_performed": wp,
            "make": (first.get("VEHICLE_make") or "").strip(),
            "model": (first.get("VEHICLE_model") or "").strip(),
            "year": (first.get("VEHICLE_modelYear") or "").strip(),
            "ro_id": ronum,
            # Technician skill-modeling signal: an anonymized tech number and
            # department/op-code survive even though technician name fields
            # are never populated in this export.
            "tech_no": (first.get("OPERATIONS_hours_hrsTechNo") or "").strip(),
            "department": (first.get("OPERATIONS_department") or "").strip(),
            "op_code": (first.get("OPERATIONS_code") or "").strip(),
        })
    return records


def _load_datasource(ds_id: str, ds_dir: Path, files: dict, min_count: int, sample_size: int, id_offset: int) -> tuple[list[dict], list[dict]]:
    demo: list[dict] = []
    demo_path = ds_dir / "demo_samples.json"
    if demo_path.exists():
        entries = json.loads(demo_path.read_text())
        for e in entries:
            e["datasource"] = ds_id
            e["work_requested"] = _normalize_case(e.get("work_requested", ""))
            e["work_performed"] = _normalize_case(e.get("work_performed", ""))
            # Promote vehicle spec out of meta so every sample — demo or raw,
            # any datasource — exposes make/model/year at the same top-level
            # keys the UI reads.
            meta = e.get("meta") or {}
            e.setdefault("make", meta.get("make", ""))
            e.setdefault("model", meta.get("model", ""))
            e.setdefault("year", meta.get("year", ""))
            e.setdefault("tech_no", meta.get("tech_no", ""))
            e.setdefault("department", meta.get("department", ""))
            e.setdefault("op_code", meta.get("op_code", ""))
        demo = entries

    records = _load_tsv_records(ds_id, ds_dir, files, min_count, sample_size, id_offset)
    if len(records) < sample_size:
        csv_records = _load_csv_records(ds_id, ds_dir, sample_size - len(records), id_offset + len(records))
        records.extend(csv_records)
    if len(records) < sample_size:
        jsonl_records = _load_jsonl_records(ds_id, ds_dir, sample_size - len(records), id_offset + len(records))
        records.extend(jsonl_records)

    return records, demo


def load_samples() -> None:
    global SAMPLES, DEMO_SAMPLES, DATASOURCES

    data_cfg = cfg["data"]
    ds_root = Path(data_cfg.get("datasources_dir", "./datasources"))
    files = data_cfg["files"]
    min_count = data_cfg.get("min_count", 0)
    sample_size = data_cfg.get("sample_size", 50000)
    ds_list = data_cfg.get("datasources", [])

    all_records: list[dict] = []
    all_demo: list[dict] = []
    ds_meta: list[dict] = []

    for ds in ds_list:
        if not ds.get("enabled", True):
            continue
        ds_id = ds["id"]
        ds_label = ds.get("label", ds_id)
        ds_dir = ds_root / ds_id
        if not ds_dir.exists():
            print(f"[startup] Datasource dir not found, skipping: {ds_dir}")
            continue
        ds_min_count = ds.get("min_count", min_count)
        records, demo = _load_datasource(ds_id, ds_dir, files, ds_min_count, sample_size, len(all_records))
        all_records.extend(records)
        all_demo.extend(demo)
        ds_meta.append({"id": ds_id, "label": ds_label, "count": len(records)})
        print(f"[startup] Datasource '{ds_id}' ({ds_label}): {len(records)} samples, {len(demo)} demo")

    SAMPLES = all_records
    DEMO_SAMPLES = all_demo
    DATASOURCES = ds_meta
    print(f"[startup] Total: {len(SAMPLES)} raw samples, {len(DEMO_SAMPLES)} demo samples across {len(DATASOURCES)} datasource(s)")


def enrich_cornerstone_customer_names() -> None:
    """SHOP_CUSTOMERS loads after SAMPLES, so backfill customer_name onto the
    cornerstone SAMPLES entries here rather than during _load_jsonl_records."""
    names_by_id = {c["customer_id"]: c["name"] for c in SHOP_CUSTOMERS}
    for s in SAMPLES:
        if s.get("datasource") == "cornerstone":
            s["customer_name"] = names_by_id.get(s.get("customer_id"), "")


load_samples()
load_shop_data()
load_mongo_cornerstone()
enrich_cornerstone_customer_names()

# ── LLM helpers ───────────────────────────────────────────────────────────────


def build_text(wr: str, wp: str) -> str:
    parts = []
    if wr:
        parts.append(f"Work Requested: {wr}")
    if wp:
        parts.append(f"Work Performed: {wp}")
    return "\n".join(parts)


def build_messages(text: str) -> list[dict]:
    return [
        {"role": "system", "content": build_system_prompt(cfg, sme_store=SME_STORE)},
        {"role": "user",   "content": build_user_prompt(text)},
    ]


def safe_list(val) -> list[str]:
    """Extract list from LLM output, strip whitespace, and deduplicate case-insensitively."""
    if isinstance(val, list):
        raw = [str(v).strip() for v in val if str(v).strip()]
    elif isinstance(val, str) and val.strip():
        raw = [val.strip()]
    else:
        return []
    seen: set[str] = set()
    out: list[str] = []
    for item in raw:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out


async def call_llm(client: httpx.AsyncClient, text: str) -> dict:
    payload = {
        "model": LLM_MODEL,
        "messages": build_messages(text),
        "max_tokens": cfg["endpoints"]["llm"].get("max_tokens", 512),
        "temperature": cfg["endpoints"]["llm"].get("temperature", 0),
    }
    resp = await client.post(
        f"{LLM_BASE}/v1/chat/completions", json=payload, timeout=30
    )
    resp.raise_for_status()
    raw = resp.json()["choices"][0]["message"]["content"].strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    parsed = json.loads(raw)
    result = {t: safe_list(parsed.get(t)) for t in ENTITY_TYPES}
    result["dtc_code"], result["dtc_sme_candidates"] = extract_dtcs_from_text(text, result["dtc_code"])
    return result


def canonicalize_entities(entities: dict) -> dict:
    """Normalize symptoms via cache and repairs via component taxonomy, deduplicating after normalization."""
    result = {}
    cache = get_cache()

    symptoms = entities.get("symptom", [])
    if symptoms:
        normed = cache.normalize_list(symptoms)
        # Dedup by canonical form — different raw phrasings that map to the same canonical count once
        seen_canon: set[str] = set()
        deduped: list[dict] = []
        for n in normed:
            key = n["canonical"].lower()
            if key not in seen_canon:
                seen_canon.add(key)
                deduped.append(n)
        result["symptom"] = deduped

    repairs = entities.get("repair", [])
    if repairs:
        normed = normalize_repairs(repairs)
        # Dedup by PT when matched, else by raw — keeps first occurrence of each unique part
        seen_repair: set[str] = set()
        deduped_r: list[dict] = []
        for n in normed:
            key = (n["pt"] or n["raw"]).lower()
            if key not in seen_repair:
                seen_repair.add(key)
                deduped_r.append(n)
        result["repair"] = deduped_r

    return result


# ── Routes ────────────────────────────────────────────────────────────────────


@app.get("/predii_logo.png")
async def logo():
    return FileResponse("predii_logo.png", media_type="image/png")


@app.get("/")
async def index():
    return HTMLResponse(Path("ner_app.html").read_text())


@app.get("/api/health")
async def health():
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(f"{LLM_BASE}/health", timeout=5)
            llm_ok = r.status_code == 200
    except Exception:
        llm_ok = False
    return {"samples": len(SAMPLES), "llm_ok": llm_ok, "llm_url": LLM_BASE}


@app.get("/api/samples/demo")
async def get_demo_samples(category: str = "all", datasources: str = "all"):
    ds_set = None if datasources == "all" else set(datasources.split(","))
    pool = DEMO_SAMPLES if ds_set is None else [s for s in DEMO_SAMPLES if s.get("datasource") in ds_set]
    if category == "all":
        return pool
    return [s for s in pool if s["category"] == category]


@app.get("/api/samples/demo/categories")
async def get_demo_categories():
    from collections import Counter
    counts = Counter(s["category"] for s in DEMO_SAMPLES)
    return [
        {"id": cat, "label": CATEGORY_LABELS.get(cat, cat), "count": counts[cat]}
        for cat in CATEGORY_LABELS if cat in counts
    ]


@app.get("/api/datasources")
async def get_datasources():
    return DATASOURCES


# Generic catch-all line-item labels from the source Peninsula Precision
# data (real source values, not fabricated — see migrateLoc001ToCornerstone.js
# on the WrenchIQ side) that represent bundled labor/parts overhead on an RO,
# not a distinct repair job. Counting them in Top Repair Jobs rankings would
# pollute those rankings the same way a fabricated "Parts" entry would.
_GENERIC_JOB_LABELS = {"labor & parts", "additional service & parts"}


def _real_repair_jobs(ro: dict) -> list[str]:
    return [j for j in (ro.get("repair_jobs") or []) if j.strip().lower() not in _GENERIC_JOB_LABELS]


@app.get("/api/shop_profile")
async def get_shop_profile(years: int | None = Query(None)):
    if not SHOP or not SHOP_ROS:
        return {"shop": None}

    ros = SHOP_ROS
    if years:
        max_year = max(datetime.fromisoformat(ro["check_in_ts"]).year for ro in SHOP_ROS)
        min_year = max_year - years + 1
        ros = [ro for ro in SHOP_ROS if min_year <= datetime.fromisoformat(ro["check_in_ts"]).year <= max_year]

    current_year = max(datetime.fromisoformat(ro["check_in_ts"]).year for ro in ros)
    completed = [ro for ro in ros if ro["status"] == "completed"]
    current_year_ros = [ro for ro in completed
                         if datetime.fromisoformat(ro["check_in_ts"]).year == current_year]

    total_invoice = sum(ro["invoice_total"] for ro in completed)
    total_cost = sum(ro["total_cost"] for ro in completed)
    overall_margin_pct = (total_invoice - total_cost) / total_invoice if total_invoice else 0.0
    avg_ro_value = total_invoice / len(completed) if completed else 0.0
    dates = sorted(ro["check_in_ts"] for ro in ros)

    overall = {
        "ro_count": len(ros),
        "customer_count": len(SHOP_CUSTOMERS),
        "avg_ro_value": round(avg_ro_value, 2),
        "overall_margin_pct": round(overall_margin_pct * 100, 1),
        "date_range": [dates[0][:10], dates[-1][:10]] if dates else [],
    }

    job_counts = Counter()
    for ro in completed:
        job_counts.update(_real_repair_jobs(ro))
    top_repair_jobs = [{"job": j, "count": c} for j, c in job_counts.most_common(15)]

    part_agg = defaultdict(lambda: {"qty": 0, "revenue": 0.0, "cost": 0.0, "suppliers": Counter()})
    for ro in completed:
        for p in ro.get("parts", []):
            a = part_agg[p["name"]]
            a["qty"] += p["qty"]
            a["revenue"] += p["qty"] * p["unit_price"]
            a["cost"] += p["qty"] * p["unit_cost"]
            a["suppliers"][p["supplier"]] += p["qty"]
    top_parts = []
    for name, a in sorted(part_agg.items(), key=lambda kv: kv[1]["revenue"], reverse=True)[:15]:
        avg_price = a["revenue"] / a["qty"] if a["qty"] else 0
        margin_pct = (a["revenue"] - a["cost"]) / a["revenue"] if a["revenue"] else 0
        preferred_supplier = a["suppliers"].most_common(1)[0][0]
        top_parts.append({
            "name": name,
            "preferred_supplier": preferred_supplier,
            "qty_sold": a["qty"],
            "avg_price": round(avg_price, 2),
            "margin_pct": round(margin_pct * 100, 1),
        })

    # Full price/supplier catalog (all parts, not just top 15) — lets the frontend's
    # "From Batch NER" mode join LLM-extracted part names (entities.repair) against
    # real pricing, case-insensitively, even when they didn't make the top-15 cut.
    parts_catalog = {}
    for name, a in part_agg.items():
        avg_price = a["revenue"] / a["qty"] if a["qty"] else 0
        margin_pct = (a["revenue"] - a["cost"]) / a["revenue"] if a["revenue"] else 0
        parts_catalog[name.lower()] = {
            "preferred_supplier": a["suppliers"].most_common(1)[0][0],
            "avg_price": round(avg_price, 2),
            "margin_pct": round(margin_pct * 100, 1),
        }

    customers_by_id = {c["customer_id"]: c for c in SHOP_CUSTOMERS}
    ro_by_customer = defaultdict(list)
    for ro in completed:
        ro_by_customer[ro["customer_id"]].append(ro)

    repeat_customer_ids = {c["customer_id"] for c in SHOP_CUSTOMERS if c.get("is_repeat_customer")}
    top_repeat_customers = []
    for cust_id in repeat_customer_ids:
        ros = ro_by_customer.get(cust_id, [])
        if not ros:
            continue
        cust = customers_by_id[cust_id]
        top_repeat_customers.append({
            "name": cust["name"],
            "customer_since": cust["customer_since"],
            "visit_count": len(ros),
            "lifetime_spend": round(sum(ro["invoice_total"] for ro in ros), 2),
        })
    top_repeat_customers.sort(key=lambda c: c["lifetime_spend"], reverse=True)
    top_repeat_customers = top_repeat_customers[:15]

    repeat_job_counts = Counter()
    for cust_id in repeat_customer_ids:
        for ro in ro_by_customer.get(cust_id, []):
            repeat_job_counts.update(_real_repair_jobs(ro))
    top_jobs_repeat_customers = [{"job": j, "count": c} for j, c in repeat_job_counts.most_common(15)]

    seasonal_profile = build_seasonal_profile(current_year_ros)

    return {
        "shop": SHOP,
        "overall": overall,
        "top_repair_jobs": top_repair_jobs,
        "top_parts": top_parts,
        "top_repeat_customers": top_repeat_customers,
        "top_jobs_repeat_customers": top_jobs_repeat_customers,
        "seasonal_profile": seasonal_profile,
        "parts_catalog": parts_catalog,
    }


# US meteorological seasons (Northern Hemisphere)
SEASON_DEFS = [
    {"name": "Winter", "range": "Dec–Feb", "months": {12, 1, 2}},
    {"name": "Spring", "range": "Mar–May", "months": {3, 4, 5}},
    {"name": "Summer", "range": "Jun–Aug", "months": {6, 7, 8}},
    {"name": "Fall",   "range": "Sep–Nov", "months": {9, 10, 11}},
]
MIN_SAMPLE_FOR_INDEX = 5   # ignore rare jobs/parts when computing seasonal lift — too noisy
TOP_N_PER_SEASON = 8
TOP_N_RECOMMENDATIONS = 5


def build_seasonal_profile(ros: list[dict]) -> list[dict]:
    """For each US season, surface the top repair jobs/parts that occurred, plus a
    'recommended focus' list of jobs/parts whose share of that season's business is
    disproportionately higher than their share of the whole year (a seasonal-lift
    index) — e.g. batteries spiking in winter — rather than just repeating whatever
    is generically most common year-round."""
    total_ros = len(ros)
    if not total_ros:
        return [{**{k: v for k, v in s.items() if k != "months"},
                 "top_repair_jobs": [], "top_parts": [], "recommended_focus": []} for s in SEASON_DEFS]

    ros_by_season = {s["name"]: [ro for ro in ros if datetime.fromisoformat(ro["check_in_ts"]).month in s["months"]]
                      for s in SEASON_DEFS}

    # Year-wide baselines for the lift calculation
    job_total = Counter()
    for ro in ros:
        job_total.update(_real_repair_jobs(ro))

    part_total = Counter()
    for ro in ros:
        for p in ro.get("parts", []):
            part_total[p["name"]] += p["qty"]
    total_part_qty = sum(part_total.values())

    profile = []
    for s in SEASON_DEFS:
        season_ros = ros_by_season[s["name"]]
        season_n = len(season_ros)

        job_season = Counter()
        for ro in season_ros:
            job_season.update(_real_repair_jobs(ro))
        top_repair_jobs = [{"job": j, "count": c} for j, c in job_season.most_common(TOP_N_PER_SEASON)]

        part_season = defaultdict(lambda: {"qty": 0, "revenue": 0.0, "cost": 0.0, "suppliers": Counter()})
        for ro in season_ros:
            for p in ro.get("parts", []):
                a = part_season[p["name"]]
                a["qty"] += p["qty"]
                a["revenue"] += p["qty"] * p["unit_price"]
                a["cost"] += p["qty"] * p["unit_cost"]
                a["suppliers"][p["supplier"]] += p["qty"]
        top_parts = []
        for name, a in sorted(part_season.items(), key=lambda kv: kv[1]["revenue"], reverse=True)[:TOP_N_PER_SEASON]:
            avg_price = a["revenue"] / a["qty"] if a["qty"] else 0
            margin_pct = (a["revenue"] - a["cost"]) / a["revenue"] if a["revenue"] else 0
            top_parts.append({
                "name": name,
                "preferred_supplier": a["suppliers"].most_common(1)[0][0],
                "qty_sold": a["qty"],
                "avg_price": round(avg_price, 2),
                "margin_pct": round(margin_pct * 100, 1),
            })

        # Seasonal-lift index: (share of this season's ROs) / (share of the year's ROs)
        season_part_qty = sum(a["qty"] for a in part_season.values())
        candidates = []
        for job, total_c in job_total.items():
            if total_c < MIN_SAMPLE_FOR_INDEX:
                continue
            season_c = job_season.get(job, 0)
            overall_share = total_c / total_ros
            season_share = season_c / season_n if season_n else 0
            index = season_share / overall_share if overall_share else 0
            if index > 1.15 and season_c >= 2:
                candidates.append({"type": "job", "name": job, "index": round(index, 2), "count": season_c})
        for part, total_c in part_total.items():
            if total_c < MIN_SAMPLE_FOR_INDEX:
                continue
            season_c = part_season.get(part, {}).get("qty", 0)
            overall_share = total_c / total_part_qty if total_part_qty else 0
            season_share = season_c / season_part_qty if season_part_qty else 0
            index = season_share / overall_share if overall_share else 0
            if index > 1.15 and season_c >= 2:
                candidates.append({"type": "part", "name": part, "index": round(index, 2), "count": season_c})

        candidates.sort(key=lambda c: c["index"], reverse=True)
        recommended_focus = candidates[:TOP_N_RECOMMENDATIONS]

        profile.append({
            "name": s["name"],
            "range": s["range"],
            "ro_count": season_n,
            "top_repair_jobs": top_repair_jobs,
            "top_parts": top_parts,
            "recommended_focus": recommended_focus,
        })
    return profile


@app.get("/api/samples")
async def get_samples(
    n: int = Query(20, le=1000),
    source: str = "all",
    category: str = "all",
    top: bool = False,
    datasources: str = "all",
):
    ds_set = None if datasources == "all" else set(datasources.split(","))
    pool = SAMPLES if ds_set is None else [s for s in SAMPLES if s["datasource"] in ds_set]
    pool = pool if source == "all" else [s for s in pool if s["source"] == source]
    if category == "balanced":
        mech  = [s for s in pool if s.get("category") == "mechanical"]
        maint = [s for s in pool if s.get("category") == "maintenance"]
        half  = n // 2
        pool  = (random.sample(mech, min(half, len(mech))) +
                 random.sample(maint, min(n - half, len(maint))))
        random.shuffle(pool)
        return pool
    if category != "all":
        pool = [s for s in pool if s.get("category") == category]
    if top:
        pool = sorted(pool, key=lambda x: x["count"], reverse=True)
        return pool[:n]
    return random.sample(pool, min(n, len(pool)))


class ExtractRequest(BaseModel):
    work_requested: str = ""
    work_performed: str = ""


@app.post("/api/extract")
async def extract(req: ExtractRequest):
    text = build_text(req.work_requested, req.work_performed)
    if not text.strip():
        return {"entities": {t: [] for t in ENTITY_TYPES}, "normalized": {}, "error": "empty input"}
    try:
        async with httpx.AsyncClient() as client:
            entities = await call_llm(client, text)
        normalized = canonicalize_entities(entities)
        # Keep entities.repair in sync with the deduped normalized list (UI zips by index)
        if "repair" in normalized:
            entities["repair"] = [n["raw"] for n in normalized["repair"]]
        sme = entities.pop("dtc_sme_candidates", [])
        log_sme_candidates(sme, text)
        return {"entities": entities, "normalized": normalized, "dtc_sme_candidates": sme}
    except Exception as e:
        return {"entities": {t: [] for t in ENTITY_TYPES}, "normalized": {}, "error": str(e)}


@app.get("/api/cache/symptoms")
async def get_symptom_cache(n: int = Query(30, le=100)):
    cache = get_cache()
    return {"stats": cache.stats(), "top": cache.get_top(n)}


# ── SME feedback endpoints ────────────────────────────────────────────────────

class SMEAcceptRequest(BaseModel):
    token: str
    hint_type: str = "dtc"
    entity_type: str = "dtc_code"
    context: str = ""
    source_excerpt: str = ""


class SMERejectRequest(BaseModel):
    token: str


@app.post("/api/sme/accept")
async def sme_accept(req: SMEAcceptRequest):
    """
    Accept an SME candidate. Increments accept_count; promotes to learned rules
    once the quorum threshold is reached. Learned rules apply on the next extraction
    call without a server restart.
    """
    result = SME_STORE.accept(
        token=req.token,
        hint_type=req.hint_type,
        entity_type=req.entity_type,
        context=req.context,
        source_excerpt=req.source_excerpt,
    )
    return result


@app.post("/api/sme/reject")
async def sme_reject(req: SMERejectRequest):
    """
    Reject a token — removes it from both pending and learned stores immediately.
    Next extraction will not fire the rule.
    """
    return SME_STORE.reject(req.token)


@app.get("/api/sme/pending")
async def sme_pending():
    """List candidates awaiting quorum, sorted by accept_count descending."""
    return {"quorum": SME_STORE.quorum, "pending": SME_STORE.get_pending()}


@app.get("/api/sme/learned")
async def sme_learned():
    """List active learned rules sorted by promotion date descending."""
    return {"prompt_cap": SME_STORE.prompt_cap, "learned": SME_STORE.get_learned()}


@app.get("/api/sme/stats")
async def sme_stats():
    return SME_STORE.stats()


class SummarizeRequest(BaseModel):
    category: str = "all"       # "mechanical" | "maintenance"
    record_count: int = 0
    top_symptoms: list[str] = []
    top_repair_jobs: list[str] = []
    top_repairs: list[str] = []
    top_dtcs: list[str] = []


def _fmt_list(items: list[str]) -> str:
    if not items:
        return "(none)"
    return ", ".join(items[:15])


@app.post("/api/summarize")
async def summarize(req: SummarizeRequest):
    template = _load_prompt("summary.txt")
    prompt = template.format(
        category=req.category.capitalize(),
        record_count=req.record_count,
        top_symptoms=_fmt_list(req.top_symptoms),
        top_repair_jobs=_fmt_list(req.top_repair_jobs),
        top_repairs=_fmt_list(req.top_repairs),
        top_dtcs=_fmt_list(req.top_dtcs),
    )
    payload = {
        "model": LLM_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 400,
        "temperature": cfg["endpoints"]["llm"].get("temperature", 0),
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{LLM_BASE}/v1/chat/completions", json=payload, timeout=60)
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"].strip()
            text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
            return {"summary": text}
    except Exception as e:
        return {"summary": "", "error": str(e)}


class BatchRequest(BaseModel):
    n: int = 20
    source: str = "all"
    category: str = "balanced"
    datasources: list[str] = []  # empty = all
    years: int | None = None     # limit to samples whose check_in_ts falls in the most recent N years


def _filter_by_years(pool: list[dict], years: int | None) -> list[dict]:
    """Keep only samples within the most recent `years` years of check_in_ts.
    Samples without check_in_ts (non-cornerstone datasources) are left untouched —
    the window is only meaningful for datasets that carry real RO dates."""
    if not years:
        return pool
    dated = [s for s in pool if s.get("check_in_ts")]
    if not dated:
        return pool
    max_year = max(datetime.fromisoformat(s["check_in_ts"]).year for s in dated)
    min_year = max_year - years + 1
    return [
        s for s in pool
        if not s.get("check_in_ts") or min_year <= datetime.fromisoformat(s["check_in_ts"]).year <= max_year
    ]


@app.post("/api/batch/stream")
async def batch_stream(req: BatchRequest):
    ds_set = set(req.datasources) if req.datasources else None
    pool = SAMPLES if ds_set is None else [s for s in SAMPLES if s["datasource"] in ds_set]
    pool = pool if req.source == "all" else [s for s in pool if s["source"] == req.source]
    pool = _filter_by_years(pool, req.years)
    if req.category == "balanced":
        mech  = [s for s in pool if s.get("category") == "mechanical"]
        maint = [s for s in pool if s.get("category") == "maintenance"]
        half  = req.n // 2
        samples = (random.sample(mech, min(half, len(mech))) +
                   random.sample(maint, min(req.n - half, len(maint))))
        random.shuffle(samples)
    elif req.category != "all":
        pool    = [s for s in pool if s.get("category") == req.category]
        samples = random.sample(pool, min(req.n, len(pool)))
    else:
        samples = random.sample(pool, min(req.n, len(pool)))
    total = len(samples)

    async def generate() -> AsyncGenerator[str, None]:
        # Runs now process the full selected window (hundreds-thousands of
        # ROs), not a small fixed sample — use the same concurrency the
        # config already defines for offline benchmarking instead of the
        # original small-batch-sized default of 10.
        sem = asyncio.Semaphore(cfg.get("data", {}).get("concurrency", 10))

        async def process(idx: int, sample: dict):
            async with sem:
                text = build_text(sample["work_requested"], sample["work_performed"])
                try:
                    async with httpx.AsyncClient() as client:
                        entities = await call_llm(client, text)
                    normalized = canonicalize_entities(entities)
                    if "repair" in normalized:
                        entities["repair"] = [n["raw"] for n in normalized["repair"]]
                    entities.pop("dtc_sme_candidates", None)
                    return idx, {**sample, "entities": entities, "normalized": normalized, "status": "ok"}
                except Exception as e:
                    return idx, {
                        **sample,
                        "entities": {t: [] for t in ENTITY_TYPES},
                        "normalized": {},
                        "status": "error",
                        "error": str(e),
                    }

        tasks = [asyncio.create_task(process(i, s)) for i, s in enumerate(samples)]
        completed = 0
        for coro in asyncio.as_completed(tasks):
            idx, result = await coro
            completed += 1
            yield f"data: {json.dumps({'progress': completed / total, 'completed': completed, 'total': total, 'result': result})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("RO_NER_PORT", 8090)), reload=False)
