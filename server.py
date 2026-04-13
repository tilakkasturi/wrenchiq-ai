"""
WrenchIQ API + Static File Server
Serves /opt/predii/wrenchiq/dist as static files and provides
knowledge-graph API endpoints backed by MongoDB.
"""

import os
import json
import re
import time
import threading
import urllib.request
import urllib.error
from collections import Counter, defaultdict
from flask import Flask, request, jsonify, send_from_directory, abort

from pymongo import MongoClient

# ── Config ──────────────────────────────────────────────────────────────────
DIST_DIR   = os.path.join(os.path.dirname(__file__), "dist")
MONGO_URI  = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME    = os.getenv("MONGO_DB",  "wrenchiq")
PORT       = int(os.getenv("PORT",  "8000"))
API_KEY    = os.getenv("ANTHROPIC_API_KEY", "")

# ── Mongo ────────────────────────────────────────────────────────────────────
client = MongoClient(MONGO_URI)
db     = client[DB_NAME]
ros    = db["wrenchiq_ro"]
clusters_col = db["wrenchiq_clusters"]

# ── Flask ────────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=DIST_DIR)

# ── Simple TTL Cache ──────────────────────────────────────────────────────────
_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 300  # 5 minutes

def cache_get(key):
    with _cache_lock:
        entry = _cache.get(key)
        if entry and time.time() - entry["ts"] < CACHE_TTL:
            return entry["data"]
    return None

def cache_set(key, data):
    with _cache_lock:
        _cache[key] = {"data": data, "ts": time.time()}


# ── Helpers ──────────────────────────────────────────────────────────────────

def ro_count():
    return ros.count_documents({})


def cluster_nodes():
    """Return list of cluster summary dicts for graph display (cached)."""
    cached = cache_get("cluster_nodes")
    if cached is not None:
        return cached

    # Build a real ro_count for vgen clusters from the actual RO collection
    vgen_counts = {}
    try:
        for agg in ros.aggregate([
            {"$group": {
                "_id": {
                    "make":  {"$toLower": "$vehicle.make"},
                    "model": {"$toLower": "$vehicle.model"},
                    "year":  "$vehicle.year"
                },
                "count": {"$sum": 1}
            }}
        ]):
            k = agg["_id"]
            vgen_counts[(k.get("make",""), k.get("model",""), k.get("year"))] = agg["count"]
    except Exception:
        pass

    nodes = []
    for c in clusters_col.find({}, {"_id": 0}):
        ctype = c.get("cluster_type", "")
        label = c.get("cluster_id", "")
        node_type = "vgen_cluster" if "vehicle" in ctype else "eng_cluster"

        # Compute actual ro_count for vgen clusters
        actual_ro_count = c.get("ro_count", 0)
        if node_type == "vgen_cluster" and c.get("normalized_make") and c.get("normalized_model"):
            yr_s = c.get("year_bucket_start")
            yr_e = c.get("year_bucket_end")
            make_lower  = c["normalized_make"].lower()
            model_lower = c["normalized_model"].lower()
            actual_ro_count = sum(
                cnt for (mk, mo, yr), cnt in vgen_counts.items()
                if mk == make_lower and mo == model_lower
                and yr_s is not None and yr_e is not None
                and yr_s <= (yr or 0) <= yr_e
            ) or c.get("ro_count", 0)
            label = f"{c['normalized_make']} {c['normalized_model']} {yr_s}–{yr_e}"

        nodes.append({
            "id":    c.get("cluster_id", label),
            "label": label,
            "type":  node_type,
            "meta":  {
                "ro_count":        actual_ro_count,
                "top_repair_jobs": [j["repair_job"] for j in c.get("top_repair_jobs", [])[:3]],
                "makes":           c.get("makes", []),
            }
        })

    nodes.sort(key=lambda n: n["meta"]["ro_count"], reverse=True)
    cache_set("cluster_nodes", nodes)
    return nodes


def sample_ros(limit=200):
    """Return a representative sample of repair orders."""
    return list(ros.aggregate([{"$sample": {"size": limit}}, {"$project": {"_id": 0}}]))


def build_context_from_data(question: str) -> str:
    """Build a context string from MongoDB data to answer the question."""
    q_lower = question.lower()

    # --- stats always included ---
    total = ro_count()
    lines = [f"Total repair orders in database: {total:,}"]

    # --- clusters summary ---
    cluster_docs = list(clusters_col.find(
        {}, {"_id": 0, "cluster_id": 1, "normalized_make": 1, "normalized_model": 1,
             "year_bucket_start": 1, "year_bucket_end": 1, "ro_count": 1,
             "top_repair_jobs": 1, "part_affinity": 1}
    ).sort("ro_count", -1).limit(15))

    lines.append("\nTop vehicle/engine clusters (by repair order volume):")
    for c in cluster_docs:
        cid   = c.get("cluster_id", "")
        make  = c.get("normalized_make", "")
        model = c.get("normalized_model", "")
        cnt   = c.get("ro_count", 0)
        jobs  = [j["repair_job"] for j in c.get("top_repair_jobs", [])[:5]]
        if make and model:
            yrs   = f"{c.get('year_bucket_start','')}–{c.get('year_bucket_end','')}"
            label = f"{make} {model} ({yrs})"
        else:
            label = cid
        lines.append(f"  {label}: {cnt} ROs | top jobs: {', '.join(jobs)}")

    # --- aggregate job frequencies from ROs ---
    if any(kw in q_lower for kw in ["common", "frequent", "top repair", "pattern", "trend",
                                     "popular", "most", "often", "upsell", "bundle",
                                     "recommend", "oil", "brake", "tire"]):
        pipeline = [
            {"$unwind": "$repair_jobs"},
            {"$group": {"_id": "$repair_jobs.repair_job", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 20}
        ]
        try:
            top_jobs = list(ros.aggregate(pipeline))
            if top_jobs:
                lines.append("\nTop 20 repair jobs by frequency:")
                for j in top_jobs:
                    lines.append(f"  {j['_id']}: {j['count']:,} occurrences")
        except Exception:
            pass

    # --- make/model breakdown if asked ---
    if any(kw in q_lower for kw in ["make", "model", "toyota", "honda", "ford", "nissan",
                                     "chevy", "chevrolet", "gm", "dodge", "vehicle"]):
        pipeline = [
            {"$group": {"_id": {"make": "$vehicle.make", "model": "$vehicle.model"}, "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 15}
        ]
        try:
            top_vehicles = list(ros.aggregate(pipeline))
            if top_vehicles:
                lines.append("\nTop vehicle makes/models by RO count:")
                for v in top_vehicles:
                    mk = v["_id"].get("make", "")
                    mo = v["_id"].get("model", "")
                    lines.append(f"  {mk} {mo}: {v['count']:,} ROs")
        except Exception:
            pass

    # --- revenue / ARO if asked ---
    if any(kw in q_lower for kw in ["revenue", "aro", "average", "value", "dollar",
                                     "cost", "price", "expensive", "high value"]):
        pipeline = [
            {"$group": {
                "_id":     None,
                "avg_aro": {"$avg": "$totals.total"},
                "max_aro": {"$max": "$totals.total"},
                "min_aro": {"$min": "$totals.total"}
            }}
        ]
        try:
            stats = list(ros.aggregate(pipeline))
            if stats and stats[0].get("avg_aro"):
                s = stats[0]
                lines.append(f"\nRepair order financials:")
                lines.append(f"  Average RO total: ${s['avg_aro']:,.2f}")
                lines.append(f"  Max RO total: ${s['max_aro']:,.2f}")
                lines.append(f"  Min RO total: ${s['min_aro']:,.2f}")
        except Exception:
            pass

        # top jobs by revenue
        pipeline2 = [
            {"$unwind": "$repair_jobs"},
            {"$group": {"_id": "$repair_jobs.repair_job",
                        "avg_revenue": {"$avg": "$repair_jobs.line_cost"},
                        "count": {"$sum": 1}}},
            {"$sort": {"avg_revenue": -1}},
            {"$limit": 10}
        ]
        try:
            top_rev = list(ros.aggregate(pipeline2))
            if top_rev:
                lines.append("\nTop 10 jobs by average revenue per occurrence:")
                for j in top_rev:
                    lines.append(f"  {j['_id']}: avg ${j['avg_revenue']:,.2f} ({j['count']:,} times)")
        except Exception:
            pass

    return "\n".join(lines)


def ask_claude(question: str, history: list, context: str) -> dict:
    """Call Claude API and return structured answer."""
    import anthropic as ac

    c = ac.Anthropic(api_key=API_KEY)

    system = (
        "You are WrenchIQ, an AI assistant for auto repair shops. "
        "Answer questions using the repair order data provided. "
        "Be specific, cite numbers, and keep answers actionable for service advisors. "
        "Format your answer with these exact sections (use the bold headers):\n"
        "**Bottom Line:** One sentence summary.\n"
        "**What the data shows:**\n1. Finding one\n2. Finding two\n3. Finding three\n"
        "**Why this answer:** Brief explanation of how you derived this.\n"
        "**At the counter:** One concrete action the service advisor should take.\n\n"
        f"SHOP DATA:\n{context}"
    )

    messages = []
    for h in (history or []):
        if h.get("role") in ("user", "assistant"):
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": question})

    resp = c.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=messages
    )
    answer = resp.content[0].text

    suggested = [
        "What are the most common repairs across all vehicles?",
        "Which jobs are done together most often?",
        "What are the top upsell opportunities for oil change visits?",
        "Which vehicle makes generate the highest revenue?",
        "What should I know about brake jobs?"
    ]
    return {"answer": answer, "suggested_questions": suggested, "data_used": ["wrenchiq_ro", "wrenchiq_clusters"]}


def answer_without_llm(question: str, context: str) -> dict:
    """Simple data-driven fallback when no API key is set."""
    answer = (
        "**Bottom Line:** Here is a data summary from your repair order database.\n\n"
        "**What the data shows:**\n" + context[:1500] + "\n\n"
        "**Why this answer:** Pulled directly from MongoDB aggregation.\n\n"
        "**At the counter:** Review the top repair jobs above and proactively recommend "
        "the most common companion services to every customer."
    )
    return {
        "answer": answer,
        "suggested_questions": [
            "What are the most common repairs?",
            "Which vehicle makes come in most?",
            "What are the top upsell opportunities?"
        ],
        "data_used": ["wrenchiq_ro", "wrenchiq_clusters"]
    }


# ── Recommendations ───────────────────────────────────────────────────────────

def build_recommendations():
    """
    Generate AI insight recommendations from live MongoDB data.
    Returns a list of recommendation objects matching the UI's expected schema:
      { id, priority, domain, screenContext, headline, explanation,
        roNumber (optional), metrics, personas }
    Only 'high' priority items appear in the AI Insights banner.
    """
    recs = []

    # 1. Top repair job (revenue opportunity)
    try:
        top_jobs = list(ros.aggregate([
            {"$unwind": "$repair_jobs"},
            {"$group": {"_id": "$repair_jobs.repair_job", "count": {"$sum": 1},
                        "avg_sale": {"$avg": "$repair_jobs.line_cost"}}},
            {"$sort": {"count": -1}}, {"$limit": 3}
        ]))
        if top_jobs:
            j = top_jobs[0]
            recs.append({
                "id": "rec-top-job-001",
                "priority": "high",
                "domain": "revenue",
                "screenContext": ["dashboard", "orders"],
                "headline": f"Top job today: {j['_id']} ({j['count']:,} ROs)",
                "explanation": (
                    f"{j['_id']} appears in {j['count']:,} repair orders"
                    + (f" with avg revenue of ${j['avg_sale']:,.0f}" if j.get('avg_sale') else "")
                    + ". Proactively recommend this service at intake."
                ),
                "metrics": {"count": j["count"], "avg_revenue": round(j.get("avg_sale") or 0, 2)},
                "personas": {
                    "advisor": {
                        "headline": f"Pitch {j['_id']} to every customer today",
                        "explanation": f"It's your highest-volume job — {j['count']:,} ROs in the database."
                    }
                }
            })
    except Exception:
        pass

    # 2. Top vehicle make — utilization insight
    try:
        top_makes = list(ros.aggregate([
            {"$group": {"_id": "$vehicle.make", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}, {"$limit": 1}
        ]))
        if top_makes:
            mk = top_makes[0]
            recs.append({
                "id": "rec-top-make-001",
                "priority": "high",
                "domain": "utilization",
                "screenContext": ["dashboard"],
                "headline": f"{mk['_id']} leads your bay count ({mk['count']:,} ROs)",
                "explanation": (
                    f"{mk['_id']} vehicles account for {mk['count']:,} repair orders — "
                    "ensure your techs are stocked with the right parts and fluids."
                ),
                "metrics": {"ro_count": mk["count"]},
                "personas": {
                    "advisor": {
                        "headline": f"{mk['_id']} is your #1 make — know common jobs cold",
                        "explanation": "Review top repair patterns for this make before the morning rush."
                    }
                }
            })
    except Exception:
        pass

    # 3. Upsell bundle opportunity
    try:
        # Find jobs that commonly co-occur (via clusters)
        top_cluster = clusters_col.find_one(
            {"ro_count": {"$gt": 0}}, sort=[("ro_count", -1)]
        )
        if top_cluster:
            jobs_list = [j["repair_job"] for j in top_cluster.get("top_repair_jobs", [])[:3]]
            make  = top_cluster.get("normalized_make", "")
            model = top_cluster.get("normalized_model", "")
            label = f"{make} {model}" if make else top_cluster.get("cluster_id", "")
            recs.append({
                "id": "rec-bundle-001",
                "priority": "high",
                "domain": "revenue",
                "screenContext": ["dashboard", "orders"],
                "headline": f"Bundle opportunity: {label} customers often need {jobs_list[0]}",
                "explanation": (
                    f"For {label} vehicles, the top co-occurring services are: "
                    f"{', '.join(jobs_list)}. Recommend these together to increase ARO."
                ),
                "metrics": {"ro_count": top_cluster.get("ro_count", 0)},
                "personas": {
                    "advisor": {
                        "headline": f"Upsell tip for {label}: bundle {jobs_list[0]} + {jobs_list[1] if len(jobs_list)>1 else 'inspection'}",
                        "explanation": "Data shows these jobs happen together — pitch the bundle."
                    }
                }
            })
    except Exception:
        pass

    # 4. High-value RO anomaly — flag any RO with unusually high line count as proxy
    try:
        agg = list(ros.aggregate([
            {"$group": {"_id": None, "avg": {"$avg": "$line_count"},
                        "stddev": {"$stdDevPop": "$line_count"}}}
        ]))
        if agg and agg[0].get("avg"):
            avg_val = agg[0]["avg"]
            std_val = agg[0].get("stddev", avg_val * 0.5)
            threshold = avg_val + 2 * std_val
            high_ro = ros.find_one(
                {"line_count": {"$gt": threshold}},
                sort=[("line_count", -1)],
                projection={"ro_number": 1, "line_count": 1, "vehicle": 1, "customer": 1}
            )
            if high_ro:
                ro_num     = high_ro.get("ro_number", "")
                line_count = high_ro.get("line_count", 0)
                cust       = high_ro.get("customer", {}).get("name", "")
                veh        = f"{high_ro.get('vehicle',{}).get('year','')} {high_ro.get('vehicle',{}).get('make','')} {high_ro.get('vehicle',{}).get('model','')}".strip()
                recs.append({
                    "id": "rec-anomaly-001",
                    "priority": "high",
                    "domain": "anomaly",
                    "screenContext": ["dashboard", "orders"],
                    "roNumber": ro_num,
                    "headline": f"Complex RO flagged: {ro_num} — {line_count} line items",
                    "explanation": (
                        f"{cust}'s {veh} has {line_count} line items "
                        f"(avg is {avg_val:.1f}). Verify all parts are available and estimate is approved."
                    ),
                    "metrics": {"line_count": line_count, "avg_line_count": round(avg_val, 1)},
                    "personas": {
                        "advisor": {
                            "headline": f"Flag: {ro_num} ({line_count} lines) — confirm approval",
                            "explanation": "This RO is unusually complex. Make sure the customer has approved the full estimate."
                        }
                    }
                })
    except Exception:
        pass

    return recs


# ── API Routes ────────────────────────────────────────────────────────────────

@app.route("/api/recommendations", methods=["POST", "GET"])
def api_recommendations():
    # Body params (shopId, edition, persona) accepted but not required
    recs = build_recommendations()
    return jsonify({
        "recommendations": recs,
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z"
    })


@app.route("/api/knowledge-graph/stats")
def api_stats():
    cached = cache_get("stats")
    if cached:
        return jsonify(cached)

    total         = ro_count()
    cluster_count = clusters_col.count_documents({})

    try:
        make_counts = list(ros.aggregate([
            {"$group": {"_id": "$vehicle.make", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}, {"$limit": 10}
        ]))
    except Exception:
        make_counts = []

    try:
        job_counts = list(ros.aggregate([
            {"$unwind": "$repair_jobs"},
            {"$group": {"_id": "$repair_jobs.repair_job", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}, {"$limit": 20}
        ]))
    except Exception:
        job_counts = []

    try:
        shop_names = list(ros.aggregate([
            {"$group": {"_id": "$shop.name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}, {"$limit": 20}
        ]))
    except Exception:
        shop_names = []

    try:
        customers = list(ros.aggregate([
            {"$group": {
                "_id":      "$customer.id",
                "name":     {"$first": "$customer.name"},
                "ro_count": {"$sum": 1}
            }},
            {"$sort": {"ro_count": -1}}, {"$limit": 50}
        ]))
    except Exception:
        customers = []

    result = {
        "ro_count":      total,
        "cluster_count": cluster_count,
        "node_count":    cluster_count,
        "top_makes":     [{"make": m["_id"], "count": m["count"]} for m in make_counts],
        "top_jobs":      [{"job": j["_id"], "count": j["count"]} for j in job_counts if j["_id"]],
        "ro_by_shop":    [{"name": s["_id"], "count": s["count"]} for s in shop_names if s["_id"]],
        "customers":     [{"id": c["_id"] or "", "name": c["name"] or "", "ro_count": c["ro_count"]}
                          for c in customers if c.get("name")],
    }
    cache_set("stats", result)
    return jsonify(result)


@app.route("/api/knowledge-graph/clusters")
def api_clusters():
    limit = int(request.args.get("limit", 25))
    nodes  = cluster_nodes()
    total  = ro_count()
    nodes_limited = nodes[:limit]  # already sorted by ro_count desc in cluster_nodes()

    # `clusters` field: flat list expected by AM3C writer component
    clusters_flat = [
        {
            "_id":           n["id"],
            "cluster_label": n["label"],
            "ro_count":      n["meta"]["ro_count"],
            "type":          n["type"],
            "makes":         n["meta"].get("makes", []),
            "top_jobs":      n["meta"].get("top_repair_jobs", []),
        }
        for n in nodes_limited
    ]

    return jsonify({
        "nodes":         nodes_limited,
        "clusters":      clusters_flat,   # AM3C writer reads this
        "cluster_count": len(nodes),
        "node_count":    len(nodes),
        "ro_count":      total,
        "total_ros":     total
    })


@app.route("/api/knowledge-graph")
def api_graph():
    limit = int(request.args.get("limit", 25))
    nodes = cluster_nodes()
    # Build simple links between clusters that share top repair jobs
    links = []
    seen  = set()
    job_to_clusters = defaultdict(list)
    for n in nodes:
        for job in n["meta"].get("top_repair_jobs", []):
            job_to_clusters[job].append(n["id"])
    for job, cids in job_to_clusters.items():
        for i in range(len(cids)):
            for j in range(i + 1, len(cids)):
                key = tuple(sorted([cids[i], cids[j]]))
                if key not in seen:
                    seen.add(key)
                    links.append({"source": cids[i], "target": cids[j], "label": job})

    total = ro_count()
    return jsonify({
        "nodes":      nodes[:limit],
        "links":      links[:limit * 3],
        "node_count": len(nodes),
        "link_count": len(links),
        "ro_count":   total
    })


@app.route("/api/knowledge-graph/ask", methods=["POST"])
def api_ask():
    body     = request.get_json(force=True, silent=True) or {}
    question = (body.get("question") or "").strip()
    history  = body.get("history") or []

    if not question:
        return jsonify({"error": "question is required"}), 400

    context = build_context_from_data(question)

    if API_KEY:
        try:
            result = ask_claude(question, history, context)
        except Exception as e:
            result = answer_without_llm(question, context)
            result["_warn"] = str(e)
    else:
        result = answer_without_llm(question, context)

    return jsonify(result)


# ── API proxy — forward unknown /api/* to Express on :3001 ───────────────────
EXPRESS_BASE = "http://127.0.0.1:3001"

@app.route("/api/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def api_proxy(path):
    target_url = f"{EXPRESS_BASE}/api/{path}"
    if request.query_string:
        target_url += "?" + request.query_string.decode()

    body = request.get_data()
    headers = {k: v for k, v in request.headers
               if k.lower() not in ("host", "content-length", "transfer-encoding")}

    req = urllib.request.Request(
        target_url, data=body or None, headers=headers, method=request.method
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read()
            content_type = resp.headers.get("Content-Type", "application/json")
            return app.response_class(data, status=resp.status, mimetype=content_type)
    except urllib.error.HTTPError as e:
        data = e.read()
        return app.response_class(data, status=e.code, mimetype="application/json")
    except Exception as e:
        return jsonify({"error": str(e)}), 502


# ── Static Files ──────────────────────────────────────────────────────────────

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def static_files(path):
    # Serve static assets
    if path and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    # SPA fallback — serve index.html for unknown routes
    return send_from_directory(DIST_DIR, "index.html")


# ── Main ──────────────────────────────────────────────────────────────────────

def warm_cache():
    """Pre-build heavy caches in a background thread so first requests are fast."""
    try:
        cluster_nodes()
        print("Cache warmed: cluster_nodes")
    except Exception as e:
        print(f"Cache warm failed: {e}")

if __name__ == "__main__":
    llm_status = "Claude API enabled" if API_KEY else "no ANTHROPIC_API_KEY — data-only mode"
    print(f"WrenchIQ server starting on port {PORT} | {llm_status}")
    threading.Thread(target=warm_cache, daemon=True).start()
    app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)
