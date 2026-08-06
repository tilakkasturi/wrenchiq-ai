"""
SME feedback store — three-tier controlled learning loop.

Tiers:
  1. SME accepts a candidate → pending.yaml (accept_count=1)
  2. Same token accepted N times → promoted to learned.yaml (active rule)
  3. Learned rules hot-reload into extraction + inject capped examples into prompt

Guardrails:
  - Quorum N (default 3) before promotion — single accept never promotes
  - Prompt examples capped per entity type (default 10) — oldest age out
  - Reject is immediate and synchronous
  - Audit log is append-only for traceability
"""

import json
import re
import threading
from datetime import datetime, timezone
from pathlib import Path

import yaml

FEEDBACK_DIR = Path(__file__).parent / "sme_feedback"
PENDING_PATH = FEEDBACK_DIR / "pending.yaml"
LEARNED_PATH = FEEDBACK_DIR / "learned.yaml"
AUDIT_PATH = FEEDBACK_DIR / "audit.jsonl"

DEFAULT_QUORUM = 3
DEFAULT_PROMPT_CAP = 10
MAX_CONTEXTS = 3


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_yaml(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _save_yaml(path: Path, data: dict) -> None:
    FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=True)


def _append_audit(event: dict) -> None:
    FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
    with AUDIT_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event) + "\n")


def _token_to_regex(token: str, hint_type: str) -> str:
    """Generate a regex string from a learned token."""
    escaped = re.escape(token.upper())
    if hint_type == "dtc":
        return rf"\b{escaped}\b"
    return rf"\b{escaped}\b"


class SMEStore:
    """Thread-safe store for SME feedback. Singleton — use sme_store.get()."""

    def __init__(self, quorum: int = DEFAULT_QUORUM, prompt_cap: int = DEFAULT_PROMPT_CAP):
        self._lock = threading.RLock()
        self.quorum = quorum
        self.prompt_cap = prompt_cap
        self._pending: dict = {}
        self._learned: dict = {}
        self._learned_mtime: float = 0.0
        self._reload()

    def _reload(self) -> None:
        self._pending = _load_yaml(PENDING_PATH)
        self._learned = _load_yaml(LEARNED_PATH)
        self._learned_mtime = LEARNED_PATH.stat().st_mtime if LEARNED_PATH.exists() else 0.0

    def _check_hot_reload(self) -> None:
        """Reload learned.yaml if it changed on disk (e.g. manual edit or external tool)."""
        mtime = LEARNED_PATH.stat().st_mtime if LEARNED_PATH.exists() else 0.0
        if mtime != self._learned_mtime:
            self._learned = _load_yaml(LEARNED_PATH)
            self._learned_mtime = mtime

    # ── Public API ─────────────────────────────────────────────────────────────

    def accept(self, token: str, hint_type: str, entity_type: str,
               context: str = "", source_excerpt: str = "") -> dict:
        """
        Record an SME acceptance. Returns the updated entry and whether it was promoted.
        entity_type: 'dtc_code' | 'symptom' | 'repair' | etc.
        """
        norm = token.strip().upper()
        with self._lock:
            self._check_hot_reload()

            entry = self._pending.get(norm, {
                "token": norm,
                "hint_type": hint_type,
                "entity_type": entity_type,
                "accept_count": 0,
                "first_seen": _now(),
                "contexts": [],
                "source_excerpts": [],
            })
            entry["accept_count"] = entry.get("accept_count", 0) + 1
            entry["last_seen"] = _now()
            if context and context not in entry["contexts"]:
                entry["contexts"] = (entry["contexts"] + [context])[-MAX_CONTEXTS:]
            if source_excerpt and source_excerpt not in entry["source_excerpts"]:
                entry["source_excerpts"] = (entry["source_excerpts"] + [source_excerpt])[-MAX_CONTEXTS:]

            self._pending[norm] = entry
            _save_yaml(PENDING_PATH, self._pending)

            promoted = False
            if entry["accept_count"] >= self.quorum and norm not in self._learned:
                self._promote(norm, entry)
                promoted = True

            _append_audit({
                "event": "accept",
                "token": norm,
                "entity_type": entity_type,
                "accept_count": entry["accept_count"],
                "promoted": promoted,
                "ts": _now(),
            })

            return {"token": norm, "accept_count": entry["accept_count"],
                    "promoted": promoted, "quorum": self.quorum}

    def reject(self, token: str) -> dict:
        """Remove token from both pending and learned. Immediate effect on next extraction."""
        norm = token.strip().upper()
        with self._lock:
            self._check_hot_reload()
            was_learned = norm in self._learned
            was_pending = norm in self._pending
            self._learned.pop(norm, None)
            self._pending.pop(norm, None)
            _save_yaml(LEARNED_PATH, self._learned)
            _save_yaml(PENDING_PATH, self._pending)
            self._learned_mtime = LEARNED_PATH.stat().st_mtime if LEARNED_PATH.exists() else 0.0
            _append_audit({"event": "reject", "token": norm,
                           "was_learned": was_learned, "ts": _now()})
            return {"token": norm, "removed_from_learned": was_learned,
                    "removed_from_pending": was_pending}

    def get_learned_patterns(self) -> list[dict]:
        """Return active learned rules. Hot-reloads if learned.yaml changed."""
        with self._lock:
            self._check_hot_reload()
            return [v for v in self._learned.values() if v.get("active", True)]

    def get_prompt_examples(self, entity_type: str, cap: int | None = None) -> list[str]:
        """
        Return up to `cap` learned tokens for the given entity type, sorted by
        promoted_at descending (newest first). Used for dynamic prompt injection.
        """
        cap = cap or self.prompt_cap
        with self._lock:
            self._check_hot_reload()
            entries = [
                v for v in self._learned.values()
                if v.get("entity_type") == entity_type and v.get("active", True)
            ]
            entries.sort(key=lambda e: e.get("promoted_at", ""), reverse=True)
            return [e["token"] for e in entries[:cap]]

    def get_pending(self) -> list[dict]:
        with self._lock:
            return sorted(self._pending.values(),
                          key=lambda e: e.get("accept_count", 0), reverse=True)

    def get_learned(self) -> list[dict]:
        with self._lock:
            self._check_hot_reload()
            return sorted(self._learned.values(),
                          key=lambda e: e.get("promoted_at", ""), reverse=True)

    def stats(self) -> dict:
        with self._lock:
            return {
                "pending_count": len(self._pending),
                "learned_count": len(self._learned),
                "quorum": self.quorum,
                "prompt_cap": self.prompt_cap,
            }

    # ── Internal ───────────────────────────────────────────────────────────────

    def _promote(self, norm: str, entry: dict) -> None:
        learned_entry = {
            "token": norm,
            "hint_type": entry.get("hint_type", "dtc"),
            "entity_type": entry.get("entity_type", "dtc_code"),
            "regex": _token_to_regex(norm, entry.get("hint_type", "dtc")),
            "promoted_at": _now(),
            "accept_count": entry["accept_count"],
            "contexts": entry.get("contexts", []),
            "active": True,
        }
        self._learned[norm] = learned_entry
        _save_yaml(LEARNED_PATH, self._learned)
        self._learned_mtime = LEARNED_PATH.stat().st_mtime if LEARNED_PATH.exists() else 0.0


# ── Singleton ──────────────────────────────────────────────────────────────────

_store: SMEStore | None = None
_store_lock = threading.Lock()


def get(cfg: dict | None = None) -> SMEStore:
    global _store
    if _store is None:
        with _store_lock:
            if _store is None:
                sme_cfg = (cfg or {}).get("sme", {})
                quorum = sme_cfg.get("quorum", DEFAULT_QUORUM)
                prompt_cap = sme_cfg.get("prompt_cap", DEFAULT_PROMPT_CAP)
                _store = SMEStore(quorum=quorum, prompt_cap=prompt_cap)
    return _store
