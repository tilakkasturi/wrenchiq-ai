# Sample human-authored data — what YOU create vs what the pipeline generates

> **Disclaimer:** all vehicle data, TSB IDs, fix IDs, and tool outputs in this
> sample are fictional and for format illustration only. Replace with your real
> task content.

## What humans author (small, high-leverage)

| Artifact | File | Purpose |
|---|---|---|
| **Task definition** | `task_diag-0142.json` | The task prompt, context, tools available, expected outcome, difficulty, train/heldout split. Aim for 200–2,000 of these. |
| **Verifier** | `verifier_diag_0142.py` | Pass/fail + score for any trajectory on this task. This IS the rejection-sampling filter. Write one per task or per task family. |
| **Gold trajectories** | `trajectory_diag-0142_gold.jsonl` | 50–200 hand-verified ideal trajectories total. Used to (a) calibrate the LLM-as-judge against human labels, (b) sanity-check the pipeline, (c) seed round 1 if teacher generation is unavailable. You do NOT hand-write thousands. |

## What the pipeline generates (large, automatic)

- **Raw trajectories**: your agent (or a teacher model) attempts each task N times at temperature 0.6–0.9 → thousands of JSONL records in the gold file's format.
- **Filtered set**: the verifier keeps ~passes only → your SFT data.
- **Rejected set**: failures like `trajectory_diag-0142_rejected.jsonl` → DPO chosen/rejected pairs.

## How the pieces connect

```
task_diag-0142.json ──prompt+tools──▶ agent ──▶ raw trajectory (JSONL)
                                                        │
verifier_diag_0142.py ──pass/fail──▶ keep? ──yes──▶ SFT training data
                                            └──no───▶ DPO "rejected" example
```

## Format notes

- Trajectories are stored **pre-template** (OpenAI-style `messages` with `tool_calls`).
  Render with `tokenizer.apply_chat_template` at train/inference time so Gemma 4's
  native `<|tool_call|>`, `<|tool_response|>`, `<|think|>` tokens are byte-identical.
- One JSON object per line in `.jsonl` files.
- The verifier's `cites_real_evidence` check is the anti-reward-hacking rule from
  the framework: citations only count if they appeared in a tool response in the
  same trajectory.
