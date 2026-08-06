"""
Symptom canonicalization cache.

Flow:
  raw extracted term → fuzzy match against all aliases → canonical form
  If score >= AUTO_THRESHOLD  : auto-map, add alias to cache
  If score in [REVIEW_LO, AUTO): flag as uncertain, keep raw
  If score < REVIEW_LO        : treat as new symptom, add as new canonical
"""

import json
import threading
from pathlib import Path

from rapidfuzz import fuzz, process as rf_process

AUTO_THRESHOLD   = 80   # auto-canonicalize
REVIEW_THRESHOLD = 60   # flag for review but keep raw

CACHE_PATH = Path("ro/symptom_cache.json")

# ── Default canonical seeds ───────────────────────────────────────────────────

DEFAULT_CANONICALS = [
    {
        "canonical": "Check Engine Light On",
        "aliases": [
            "check engine light", "check engine light on", "cel light on", "cel on",
            "cel", "check engine", "service engine soon", "service engine soon light",
            "mil on", "malfunction indicator lamp", "engine light on", "engine warning light",
            "check engine light illuminated", "check engine lamp on",
        ],
    },
    {
        "canonical": "Rough Idle",
        "aliases": [
            "rough idle", "rough at idle", "rough idling", "engine rough at idle",
            "idle rough", "rough engine idle", "choppy idle", "lumpy idle",
            "engine shaking at idle", "shakes at idle",
        ],
    },
    {
        "canonical": "Engine Misfire",
        "aliases": [
            "misfire", "engine misfire", "cylinder misfire", "misfiring",
            "engine missing", "engine miss", "rough running",
        ],
    },
    {
        "canonical": "Hard to Start / No Start",
        "aliases": [
            "hard to start", "no start", "won't start", "will not start",
            "cranks but won't start", "cranks no start", "no crank no start",
            "slow crank", "slow cranking", "difficult to start",
            "vehicle won't start", "engine won't fire",
        ],
    },
    {
        "canonical": "Overheating",
        "aliases": [
            "overheating", "overheats", "running hot", "engine overheating",
            "temperature gauge in red", "temp gauge high", "coolant temp high",
            "engine running hot", "hot engine", "high temperature warning",
        ],
    },
    {
        "canonical": "Brake Noise",
        "aliases": [
            "brake noise", "brakes squealing", "brake squeal", "grinding brakes",
            "brake grinding", "brakes squeaking", "squeaking brakes",
            "squealing brakes", "noisy brakes", "brake squeak",
        ],
    },
    {
        "canonical": "Vibration / Shaking",
        "aliases": [
            "vibration", "shaking", "vibrates", "shakes", "steering wheel vibration",
            "vibration at highway speeds", "vibration at speed",
            "shudder", "shuddering", "shimmy", "wheel shimmy",
            "body vibration", "floorboard vibration",
        ],
    },
    {
        "canonical": "Vehicle Pulling",
        "aliases": [
            "pulling", "pulls to the left", "pulls to the right", "pull to one side",
            "vehicle pulls", "drifts left", "drifts right", "steering pull",
            "car pulls", "pulling when braking",
        ],
    },
    {
        "canonical": "AC Not Cooling",
        "aliases": [
            "ac not cooling", "ac not cold", "air conditioning not working",
            "no cold air", "ac blowing warm", "warm air from ac",
            "ac not blowing cold", "air conditioner not cooling",
            "ac warm", "ac inoperative", "no ac",
        ],
    },
    {
        "canonical": "Transmission Slipping",
        "aliases": [
            "transmission slipping", "transmission slip", "slipping transmission",
            "trans slipping", "gear slipping", "slips out of gear",
            "hard shift", "rough shifting", "delayed engagement",
            "transmission shudder", "transmission hesitation",
        ],
    },
    {
        "canonical": "Oil Leak",
        "aliases": [
            "oil leak", "leaking oil", "oil drip", "engine oil leak",
            "oil on driveway", "oil puddle", "oil seeping",
            "valve cover leak", "oil pan leak",
        ],
    },
    {
        "canonical": "Coolant Leak",
        "aliases": [
            "coolant leak", "leaking coolant", "antifreeze leak",
            "radiator leak", "coolant loss", "losing coolant",
            "coolant drip", "green puddle", "coolant seeping",
        ],
    },
    {
        "canonical": "Battery / Charging Issue",
        "aliases": [
            "battery dead", "battery failure", "battery warning light",
            "battery light on", "charging system warning",
            "alternator light", "battery not charging",
            "dead battery", "battery drain", "slow crank battery",
        ],
    },
    {
        "canonical": "Clunk / Rattle Noise",
        "aliases": [
            "clunk", "clunking", "clunking noise", "rattle", "rattling",
            "rattling noise", "knocking", "knocking noise",
            "suspension clunk", "clunk over bumps", "rattle over bumps",
            "front end clunk", "rear clunk",
        ],
    },
    {
        "canonical": "Steering Issue",
        "aliases": [
            "steering issue", "stiff steering", "hard steering",
            "power steering loss", "no power steering",
            "steering noise", "groaning steering", "steering vibration",
            "loose steering", "steering wheel shaking",
        ],
    },
    {
        "canonical": "ABS / Traction Control Warning",
        "aliases": [
            "abs light on", "abs warning light", "traction control light",
            "traction control off", "abs inoperative", "abs fault",
            "stability control light", "esc light on",
        ],
    },
    {
        "canonical": "Exhaust Smoke",
        "aliases": [
            "smoke from exhaust", "white smoke", "blue smoke", "black smoke",
            "exhaust smoke", "smoking exhaust", "burning oil smoke",
            "smoke from engine", "steam from exhaust",
        ],
    },
    {
        "canonical": "Fuel / Burning Smell",
        "aliases": [
            "fuel smell", "gas smell", "burning smell", "burning oil smell",
            "smell of gas", "fuel odor", "exhaust smell inside",
            "burning smell from engine", "chemical smell",
        ],
    },
    {
        "canonical": "TPMS / Tire Pressure Warning",
        "aliases": [
            "tpms light", "tpms warning", "tire pressure light",
            "tire pressure warning", "low tire pressure",
            "tpms on", "tire pressure sensor",
        ],
    },
    {
        "canonical": "Power / Performance Loss",
        "aliases": [
            "loss of power", "power loss", "reduced power", "sluggish",
            "no power", "lacks power", "engine hesitation",
            "hesitation under acceleration", "reduced engine power",
            "engine sluggish", "poor acceleration",
        ],
    },
]


# ── Cache class ───────────────────────────────────────────────────────────────

class SymptomCache:
    def __init__(self, path: Path = CACHE_PATH):
        self._path = path
        self._lock = threading.Lock()
        self.canonicals: list[dict] = []
        self._alias_map: dict[str, str] = {}   # alias_lower → canonical
        self._load()

    def _load(self):
        if self._path.exists():
            data = json.loads(self._path.read_text())
            self.canonicals = data.get("canonicals", [])
        else:
            self.canonicals = [
                {**c, "count": 0, "seen_raw": []} for c in DEFAULT_CANONICALS
            ]
            self._save()
        self._rebuild_alias_map()

    def _rebuild_alias_map(self):
        self._alias_map = {}
        for entry in self.canonicals:
            for alias in entry.get("aliases", []):
                self._alias_map[alias.lower().strip()] = entry["canonical"]

    def _save(self):
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps({"canonicals": self.canonicals}, indent=2))

    # ── Public API ────────────────────────────────────────────────────────────

    def normalize(self, raw: str) -> dict:
        """
        Returns:
          {raw, canonical, confidence, matched, new_canonical}
        """
        key = raw.lower().strip()

        # 1. Exact alias match
        if key in self._alias_map:
            canonical = self._alias_map[key]
            self._increment(canonical, raw)
            return {"raw": raw, "canonical": canonical, "confidence": 1.0, "matched": True, "new_canonical": False}

        # 2. Fuzzy match against all aliases
        all_aliases = list(self._alias_map.keys())
        if all_aliases:
            match, score, _ = rf_process.extractOne(
                key, all_aliases, scorer=fuzz.token_sort_ratio
            )
            if score >= AUTO_THRESHOLD:
                canonical = self._alias_map[match]
                self._add_alias(canonical, raw)
                return {"raw": raw, "canonical": canonical, "confidence": score / 100, "matched": True, "new_canonical": False}
            if score >= REVIEW_THRESHOLD:
                canonical = self._alias_map[match]
                return {"raw": raw, "canonical": canonical, "confidence": score / 100, "matched": False, "new_canonical": False, "review": True}

        # 3. New symptom — add as canonical
        canonical = self._title_case(raw)
        self._add_canonical(canonical, raw)
        return {"raw": raw, "canonical": canonical, "confidence": 1.0, "matched": True, "new_canonical": True}

    def normalize_list(self, raws: list[str]) -> list[dict]:
        return [self.normalize(r) for r in raws]

    def get_top(self, n: int = 20) -> list[dict]:
        with self._lock:
            return sorted(self.canonicals, key=lambda x: x.get("count", 0), reverse=True)[:n]

    def stats(self) -> dict:
        with self._lock:
            return {
                "total_canonicals": len(self.canonicals),
                "total_aliases": sum(len(c.get("aliases", [])) for c in self.canonicals),
                "total_seen": sum(c.get("count", 0) for c in self.canonicals),
            }

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _increment(self, canonical: str, raw: str):
        with self._lock:
            for entry in self.canonicals:
                if entry["canonical"] == canonical:
                    entry["count"] = entry.get("count", 0) + 1
                    seen = entry.setdefault("seen_raw", [])
                    if raw not in seen:
                        seen.append(raw)
                    break
            self._save()

    def _add_alias(self, canonical: str, raw: str):
        with self._lock:
            for entry in self.canonicals:
                if entry["canonical"] == canonical:
                    entry["count"] = entry.get("count", 0) + 1
                    aliases = entry.setdefault("aliases", [])
                    if raw.lower().strip() not in [a.lower() for a in aliases]:
                        aliases.append(raw)
                    seen = entry.setdefault("seen_raw", [])
                    if raw not in seen:
                        seen.append(raw)
                    break
            self._rebuild_alias_map()
            self._save()

    def _add_canonical(self, canonical: str, raw: str):
        with self._lock:
            entry = {
                "canonical": canonical,
                "aliases": [raw.lower().strip()],
                "count": 1,
                "seen_raw": [raw],
            }
            self.canonicals.append(entry)
            self._alias_map[raw.lower().strip()] = canonical
            self._save()

    @staticmethod
    def _title_case(s: str) -> str:
        LOWER = {"a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "of"}
        words = s.strip().split()
        return " ".join(
            w.capitalize() if i == 0 or w.lower() not in LOWER else w.lower()
            for i, w in enumerate(words)
        )


# ── Singleton ─────────────────────────────────────────────────────────────────
_cache: SymptomCache | None = None


def get_cache() -> SymptomCache:
    global _cache
    if _cache is None:
        _cache = SymptomCache()
    return _cache
