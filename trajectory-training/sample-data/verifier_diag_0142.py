"""Sample verifier for task diag-0142.

Humans write one verifier per task (or per task family). The verifier is the
rejection-sampling filter: it decides which generated trajectories become
training data. Design it to check the OUTCOME through an independent path,
not the agent's claims about itself.

Run:  python verifier_diag_0142.py trajectory_diag-0142_gold.jsonl
"""
import json
import re
import sys

EXPECTED_CAUSE_KEYWORDS = ["ignition coil", "cylinder 1"]
MIN_DISTINCT_TOOLS = 2
MAX_TOOL_CALLS = 12


def verify(trajectory: dict) -> dict:
    messages = trajectory["messages"]
    tool_names: set[str] = set()
    tool_call_count = 0
    tool_output_text: list[str] = []
    final_text = ""

    for m in messages:
        if m["role"] == "assistant" and m.get("tool_calls"):
            for tc in m["tool_calls"]:
                tool_names.add(tc["name"])
                tool_call_count += 1
        if m["role"] == "tool":
            tool_output_text.append(m.get("content", ""))
        if m["role"] == "assistant" and not m.get("tool_calls"):
            final_text = m.get("content", "")  # last non-tool assistant message

    # Anti-reward-hacking: a cited TSB only counts if it actually appeared
    # in a tool response earlier in THIS trajectory. The agent cannot pass
    # by inventing a plausible-sounding citation.
    cited = set(re.findall(r"TSB-\d+-\d+", final_text))
    evidenced = set()
    for out in tool_output_text:
        evidenced.update(re.findall(r"TSB-\d+-\d+", out))

    checks = {
        "used_enough_tools": len(tool_names) >= MIN_DISTINCT_TOOLS,
        "within_call_budget": tool_call_count <= MAX_TOOL_CALLS,
        "names_root_cause": all(k in final_text.lower() for k in EXPECTED_CAUSE_KEYWORDS),
        "cites_real_evidence": bool(cited & evidenced),
    }
    passed = all(checks.values())
    return {
        "passed": passed,
        "score": round(sum(checks.values()) / len(checks), 2),
        "checks": checks,
    }


if __name__ == "__main__":
    with open(sys.argv[1]) as f:
        traj = json.loads(f.readline())
    print(json.dumps(verify(traj), indent=2))
