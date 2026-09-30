# Rejection-Sampled Trajectory Training — Framework for Your Own Data
### (Open-weight model · agentic loop · enterprise use case)

This is the same technique Meta described for Muse Spark 1.2 — record your agent's attempts as trajectories, keep only the successful ones (rejection sampling), and fine-tune on them — adapted to an open-weight stack you control.

---

## 0. The loop in one picture

```
Tasks with verifiable outcomes
        │
        ▼
┌─ Generate trajectories ─┐  (your agent, N attempts per task, temp > 0)
│  log: prompt → thought → tool call → tool result → … → final answer
        │
        ▼
┌─ Rejection-sample ──────┐  (verifier decides keep / drop)
│  keep: verifier passes + quality filters
│  optional: failures → "rejected" examples for DPO
        │
        ▼
┌─ Fine-tune ─────────────┐  (SFT on kept trajectories; optionally DPO/GRPO)
        │
        ▼
┌─ Evaluate ──────────────┐  (held-out tasks; success rate, efficiency, regressions)
        │
        ▼
  Repeat with the improved model on harder tasks  ← the self-improvement loop
```

The single most important thing to internalize: **the verifier is the ceiling.** Rejection sampling can only distill what your success signal can recognize. A weak verifier produces a confident, wrong model. Spend the most design effort there.

---

## 1. Model selection (open-weight)

Pick a base with strong tool-calling and long context, since trajectories are long.

| Model | Why | Watch out |
|---|---|---|
| **Qwen3** (8B / 32B / 70B) | Best-in-class open tool-calling, long context variants, strong agent benchmarks | Chat template must match exactly at train and inference |
| **Llama 3.3 70B / Llama 4** | Solid instruction-following, wide ecosystem support | Tool-calling slightly behind Qwen3 |
| **Mistral Large / Medium 3** | Good European option, strong function-calling | Smaller community for agent fine-tuning recipes |
| **DeepSeek-R1-Distill-Qwen** | If you want reasoning traces baked in | Verbose; distill the reasoning style deliberately or not at all |

Practical rule: **start at 8–32B.** You'll iterate 3–5x faster, and trajectory SFT transfers well. Scale up once the pipeline works.

---

## 2. Phase 1 — Build the task set

You need 200–2,000 tasks minimum for a first useful round (more is better, but quality beats quantity).

Each task needs three things:

1. **The starting state** — user request + context + available tools (same harness your agent runs in; this is the "co-training with the harness" idea — train in the environment you'll deploy in).
2. **A verifier** — a function that takes a completed trajectory and returns pass/fail (and ideally a score). Types, in order of reliability:
   - *Programmatic:* unit tests, exact-match on structured output, schema validation, state-diff checks ("did the ticket end up in the right status?"). Gold standard — deterministic, cheap, scalable.
   - *LLM-as-judge:* rubric-scored grading of the final answer and key intermediate steps. Calibrate it: hand-label 100–200 trajectories, measure judge-vs-human agreement, and don't trust the filter until agreement is high (Cohen's κ ≥ ~0.7).
   - *Human spot-check:* always keep a human review lane for a sample — it catches verifier blind spots (reward hacking).
3. **Difficulty stratification** — tag tasks easy/medium/hard so you can balance the dataset and measure where the model actually improves.

**Anti-reward-hacking rule:** the verifier must check the *outcome through an independent path*, not just the agent's claimed answer. If the agent can pass by writing "done" without doing the work, your filter will happily select for lying.

---

## 3. Phase 2 — Collect trajectories

### 3a. Instrument the loop
Log every step in a standard schema. JSONL, one trajectory per line:

```json
{
  "task_id": "diag-0142",
  "messages": [
    {"role": "system", "content": "…"},
    {"role": "user", "content": "…"},
    {"role": "assistant", "content": "I'll check the fault codes first.",
     "tool_calls": [{"name": "query_dtcs", "arguments": "{\"vin\": \"…\"}"}]},
    {"role": "tool", "name": "query_dtcs", "content": "{…tool output…}"},
    {"role": "assistant", "content": "The root cause is …"}
  ],
  "verifier": {"passed": true, "score": 0.92},
  "meta": {"model": "qwen3-32b", "temperature": 0.7, "tool_calls": 6, "tokens": 4200}
}
```

Use your harness's native chat template (ChatML / Llama / Qwen) — **the template used at training must be byte-identical at inference.**

### 3b. Generate attempts
- **N attempts per task** (4–16), temperature 0.6–0.9 for diversity. You want varied *successful* paths, not 16 copies of the same one.
- **Two generation strategies:**
  - *Self-generation:* your current open model attempts the tasks. Cheapest, and it's what powers the iterative loop. Yield is low early on — that's fine.
  - *Teacher distillation (recommended bootstrap):* a frontier model (Claude/GPT) generates the trajectories; you fine-tune your open model on them. Much higher yield on hard tasks, much faster first win. ⚠️ Check the teacher provider's ToS — some prohibit training competing models on outputs.

Start with teacher trajectories for round 1, then switch to self-generation once your model is competent — that's the self-improvement loop.

---

## 4. Phase 3 — Rejection sampling (the filter)

Keep a trajectory only if it passes **all** of these:

1. **Verifier passes** (score ≥ threshold; tune the threshold on your calibration set).
2. **No degenerate patterns:** cap tool calls (e.g., ≤ 25), cap tokens (e.g., ≤ 16k), drop trajectories with repeated identical tool calls (looping), empty reasoning, or final answers that ignore tool outputs.
3. **Diversity caps:** max K kept trajectories per task (e.g., 3–5), and balance across task types / difficulty — otherwise the model overfits to your most common task shape.
4. **Safety screen:** drop anything with prompt-injection artifacts, PII leakage, or unsafe tool use. For enterprise deployment this is non-negotiable.

**Keep the failures too** — store them with their verifier scores. Successful-vs-failed pairs on the same task become preference data for DPO in Phase 5.

Target for round 1: **1,000–5,000 kept trajectories.** Fewer than ~500 and you're mostly measuring noise.

---

## 5. Phase 4 — Fine-tune

### Stack (pick one)
- **LLaMA-Factory** — fastest to a working run, good defaults, web UI.
- **Axolotl** — best YAML-config reproducibility for serious iteration.
- **HuggingFace TRL** (`SFTTrainer`) — most flexible, direct control of loss masking.
- **torchtune** — if you're already in the PyTorch ecosystem.

### The recipe
- **Method:** start with **LoRA** (r=32–64, alpha=2r, targets: all attention + MLP projections). Move to full fine-tune only if LoRA plateaus — full FT on 70B is 8× H100 territory.
- **Loss masking:** compute loss **only on assistant tokens** (including its `tool_call` tokens), never on user/tool outputs. In TRL this is `assistant_only_loss` / `DataCollatorForCompletionOnlyLM`; Axolotl and LLaMA-Factory expose it as a flag. Getting this wrong is the most common silent failure — the model learns to hallucinate tool outputs.
- **Starting hyperparameters:**
  - LoRA: lr 1e-4, 2–3 epochs, batch size as large as memory allows, cosine schedule, 3–5% warmup.
  - Full FT: lr 1–2e-5, 1–2 epochs.
- **Data mixing:** don't train on trajectories alone — mix in ~10–20% general instruction data so the model doesn't lose conversational ability (regression guard).
- **Rough compute:** LoRA on 8B ≈ single 4090/A100 with QLoRA; LoRA on 32B ≈ 1–2 H100s; LoRA on 70B ≈ 2–4 H100s.

### Optional round 2: preference training
Once you have chosen/rejected pairs from Phase 3, run **DPO** on top of the SFT model — it sharpens the boundary between good and bad trajectories (full recipe: Appendix B). **GRPO** (group-relative policy optimization, the DeepSeek-R1-style method) is the heavier alternative: it trains directly against verifier rewards without needing pairs, but needs substantially more engineering.

---

## 6. Phase 5 — Evaluate (before you trust it)

- **Held-out task set, never trained on.** Not "tasks the model hasn't seen" — tasks *from a disjoint pool* collected the same way. This is where most teams fool themselves.
- **Metrics:**
  - Task success rate (verifier pass %) — the headline number.
  - Efficiency: median tool calls and tokens per success (you want this *down*).
  - Your existing eval: LLM-as-judge scores, trace quality.
  - Regression suite: general instruction-following / chat quality (the 10–20% mix in §5 protects this — verify it did).
- **A/B the base model vs. fine-tuned** on the same held-out set, same harness, same temperature. Ship only on a real delta.

---

## 7. Phase 6 — Iterate (close the loop)

1. Take the improved model → generate trajectories on **harder tasks** (ones the previous round failed).
2. Rejection-sample with the same verifier (improve the verifier too — it should get stricter as the model gets better).
3. Fine-tune again (SFT → DPO).
4. Stop when held-out success rate plateaus for two rounds — further rounds mostly distill the verifier's biases.

---

## 8. Suggested repo layout

```
trajectory-training/
├── tasks/                  # task definitions + verifiers (the crown jewels)
│   ├── pool_train/
│   ├── pool_heldout/        # never touched by training
│   └── verifiers/
├── trajectories/
│   ├── raw/                 # everything generated, with verifier scores
│   └── filtered/            # kept SFT data + chosen/rejected DPO pairs
├── configs/                 # axolotl/trl YAMLs, one per round (version them)
├── evals/                   # eval scripts + results per round
└── models/                  # checkpoints per round (never overwrite)
```

## 9. Minimal viable first round (this week)

1. Assemble 300–500 tasks with programmatic verifiers (even simple ones).
2. Generate trajectories with a frontier teacher model at temp 0.7, 8 attempts/task.
3. Filter to ~1,500–2,500 kept trajectories.
4. LoRA SFT on Qwen3-32B (or 8B) via LLaMA-Factory — one GPU-day.
5. Eval on 100 held-out tasks vs. base. If success rate moves, you have a working loop — then invest in verifier quality and scale.

---

*Mapping to what Meta described: your harness = their Muse Code; your verifiers = their task success criteria; your filter = their rejection sampling; rounds 1→N = their self-improvement loop (1.1 generating data for 1.2). The difference is you own every piece and can see the data.*

---

## Appendix A — Gemma 4 26B A4B specifics (round 1)

**Why it fits:** 3.8B active params per forward pass means trajectory generation and eval are cheap (runs ~like a 4B model), while the 25.2B total gives you headroom the dense 4B-class models don't have. 256K context, native function calling, Apache 2.0.

**Checkpoint:** `google/gemma-4-26B-A4B-it` (instruction-tuned; start here, not the base).

**Four things that differ from the generic recipe:**

1. **16-bit LoRA, not QLoRA.** 4-bit quantization + MoE routing interact poorly on this model — quantized experts destabilize routing. Train in bf16.
2. **LoRA targets = shared modules only.** The 128 routed experts use 3D parameter tensors PEFT can't target. Target `q/k/v/o_proj` + `gate/up/down_proj` on the shared paths; verify with `named_modules()` that nothing resolves under `*.experts.*`.
3. **Halve the learning rate.** Start at 5e-5 for LoRA (not 1e-4). MoE routing is update-sensitive; community fine-tunes of this checkpoint halved LR vs their dense pipelines for stability.
4. **Use the native template, always.** Render every trajectory with `tokenizer.apply_chat_template` — never hand-format `<|tool_call|>`, `<|tool_response|>`, or `<|think|>` yourself. Template mismatch between train and inference is a silent killer on Gemma 4 (tool calls loop or malform without it).

**Thinking mode:** leave it ON for trajectory generation and training (include `<|think|>` tokens in the loss — they're assistant tokens). It helps on multi-step tasks. Watch for thinking-tag leakage in eval outputs and validate.

**Serving (generation + eval):** vLLM with `--reasoning-parser gemma4 --tool-call-parser gemma4` per the official recipe.

**Hardware plan:** bf16 weights ≈ 52 GB → 2× 80GB GPUs (H100/A100) with gradient checkpointing at 16k seq len. Unsloth's Gemma 4 kernels if you need to squeeze onto less.

**Round-1 config:** see `gemma4-26b-a4b-round1-axolotl.yaml` (Axolotl). Fill in your filtered-trajectory path and run.

---

## Appendix B — Round 2: DPO preference training

Round 1 (SFT) teaches the model *what good trajectories look like*. Round 2 (DPO) teaches it to *prefer* good trajectories over bad ones — sharpening the boundary the verifier drew. It runs on the failures you stored in Phase 3, so it costs no new data generation.

### B.1 What DPO is (30-second version)

Direct Preference Optimization (Rafailov et al., 2023) replaces the RLHF stack (reward model + PPO) with a single supervised-style loss. For each prompt you provide two completions — chosen and rejected — and the loss pushes the model to assign relatively higher likelihood to the chosen one:

```
loss = −log σ( β · [ (log π(chosen) − log π_ref(chosen)) − (log π(rejected) − log π_ref(rejected)) ] )
```

π is your model, π_ref is a **frozen copy of the round-1 SFT model** (the anchor that prevents drift), β controls how hard you push (start at 0.1). No reward model, no online rollouts, ordinary gradients — which is why it meets the bar for stable, maintainable, and predictable.

### B.2 Building chosen/rejected pairs

Source: the rejected trajectories stored in Phase 3. Pair each with an accepted trajectory on the **same task** (`task_id` match).

1. **Prefer near-miss rejected examples.** A trajectory that diagnosed correctly but cited a TSB that never appeared in a tool response (failed only the `cites_real_evidence` check) teaches the boundary far better than one that answered with no tools at all. Rank rejected candidates by verifier score, highest first.
2. **Cap pairs per task** (2–3) and balance across task types/difficulties — same discipline as Phase 3.
3. **Dedupe.** Don't pair one chosen trajectory against ten trivially-bad rejected ones; that teaches the model "everything beats garbage," which it already knows.
4. **Target size:** 2,000–10,000 pairs. Pair quality beats pair count.

Pair format (JSONL, one pair per line). `prompt` = everything through the user's request; `chosen`/`rejected` = the assistant's full trajectory from there. Tool outputs ride along as context — the preference signal applies to the assistant's tokens:

```json
{
  "prompt": [
    {"role": "system", "content": "You are a diagnostic assistant for automotive technicians..."},
    {"role": "user", "content": "Vehicle: 2021 Ford F-150 3.5L EcoBoost, 62,400 miles..."}
  ],
  "chosen": [
    {"role": "assistant", "content": "Two misfire codes: P0301 is cylinder-specific...",
     "tool_calls": [{"name": "lookup_tsb", "arguments": "{...}"}]},
    {"role": "tool", "name": "lookup_tsb", "content": "{...TSB-24-2081...}"},
    {"role": "assistant", "content": "Most likely root cause: degraded ignition coil on cylinder 1..."}
  ],
  "rejected": [
    {"role": "assistant", "content": "The root cause is probably worn spark plugs. I recommend replacing all six spark plugs..."}
  ]
}
```

(Truncated for readability — the real file carries full tool outputs. This is the `trajectory_diag-0142_gold` vs `trajectory_diag-0142_rejected` pair from `sample-data/`.)

**Conversion script sketch** (adapt to your harness log format):

```python
import json

pairs = []
by_task = {}  # task_id -> {"accepted": [...], "rejected": [...]}

for line in open("trajectories_raw.jsonl"):
    t = json.loads(line)
    by_task.setdefault(t["task_id"], {"accepted": [], "rejected": []})
    bucket = "accepted" if t["verifier"]["passed"] else "rejected"
    by_task[t["task_id"]][bucket].append(t)

for task_id, b in by_task.items():
    if not b["accepted"] or not b["rejected"]:
        continue
    # near-miss rejected first: highest verifier score among failures
    b["rejected"].sort(key=lambda t: t["verifier"]["score"], reverse=True)
    for chosen in b["accepted"][:3]:           # cap accepted per task
        for rej in b["rejected"][:2]:          # cap rejected per task
            msgs = chosen["messages"]
            # split: prompt = through the last user message
            cut = max(i for i, m in enumerate(msgs) if m["role"] == "user")
            pairs.append({
                "prompt": msgs[:cut + 1],
                "chosen": msgs[cut + 1:],
                "rejected": rej["messages"][cut + 1:],
            })

with open("dpo_pairs.jsonl", "w") as f:
    for p in pairs:
        f.write(json.dumps(p) + "\n")
print(f"wrote {len(pairs)} pairs")
```

### B.3 Training config — Axolotl (LoRA DPO on top of round 1)

```yaml
# Round 2 — DPO on top of the round-1 SFT model.
# π_ref must be the round-1 model FROZEN (no further updates).
# Practical path: merge the round-1 LoRA into a full model dir, use it as
# base_model, and train a fresh LoRA adapter with the DPO loss.
base_model: /path/to/gemma4-26b-a4b-round1-merged
model_type: AutoModelForCausalLM
tokenizer_type: AutoTokenizer

rl: dpo
dpo_beta: 0.1              # start here; lower = stronger push, more drift risk

adapter: lora              # same LoRA targets as round 1 (shared modules only)
lora_r: 32
lora_alpha: 64
lora_dropout: 0.05
lora_target_modules:
  - q_proj
  - k_proj
  - v_proj
  - o_proj
  - gate_proj
  - up_proj
  - down_proj
lora_target_linear: false

datasets:
  - path: /path/to/dpo_pairs.jsonl
    type: dpo
    field_prompt: prompt
    field_chosen: chosen
    field_rejected: rejected

sequence_len: 16384
sample_packing: false      # keep pairs intact; packing can split chosen/rejected

# --- Optimization: MUCH gentler than SFT ---
micro_batch_size: 1
gradient_accumulation_steps: 8
num_epochs: 1               # DPO overfits fast; one epoch is the norm
learning_rate: 0.000005   # ~1/10 of the round-1 SFT rate
lr_scheduler: cosine
warmup_steps: 20

bf16: true
fp16: false
load_in_8bit: false
load_in_4bit: false
gradient_checkpointing: true

output_dir: ./models/gemma4-26b-a4b-round2-dpo
wandb_project: trajectory-dpo
wandb_name: gemma4-26b-a4b-round2
logging_steps: 10
save_steps: 200
```

Verify the DPO dataset field names against your installed Axolotl version before launching — that schema has changed across releases.

### B.4 Training code — TRL `DPOTrainer` alternative

```python
from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model
from datasets import load_dataset
import torch

BASE = "/path/to/gemma4-26b-a4b-round1-merged"  # round-1 model, merged

model = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.bfloat16, device_map="auto")
ref_model = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.bfloat16, device_map="auto")
for p in ref_model.parameters():
    p.requires_grad = False                        # π_ref stays frozen

tokenizer = AutoTokenizer.from_pretrained("google/gemma-4-26B-A4B-it")

lora_cfg = LoraConfig(r=32, lora_alpha=64, lora_dropout=0.05,
                      target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                                      "gate_proj", "up_proj", "down_proj"])
model = get_peft_model(model, lora_cfg)

dataset = load_dataset("json", data_files="/path/to/dpo_pairs.jsonl", split="train")
# dataset items: {"prompt": [...], "chosen": [...], "rejected": [...]}
# as message lists; the chat template renders them (same byte-identical
# template rule as round 1 — never hand-format control tokens).

args = DPOConfig(
    output_dir="./models/gemma4-26b-a4b-round2-dpo",
    beta=0.1,
    learning_rate=5e-6,
    num_train_epochs=1,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    gradient_checkpointing=True,
    gradient_checkpointing_kwargs={"use_reentrant": False},
    bf16=True,
    max_length=16384,
    logging_steps=10,
    save_steps=200,
)

trainer = DPOTrainer(model=model, ref_model=ref_model, args=args,
                     train_dataset=dataset, processing_class=tokenizer)
trainer.train()
```

### B.5 What to expect — and when to stop

- **Expect a smaller delta than round 1.** SFT teaches new behavior; DPO sharpens preferences. A good outcome: +2–5 pts verifier pass rate on held-out tasks and fewer near-miss failures (invented citations, ignored tool output).
- **Watch for over-optimization.** DPO can overfit to pair quirks — e.g., always preferring longer answers if your chosen trajectories happen to be longer. If held-out efficiency (tokens per success) degrades while pass rate rises, your pairs are teaching verbosity: rebuild them with length-controlled rejected examples.
- **Beta tuning:** outputs drifting in format or getting preachy → raise β toward 0.2–0.5. Nothing moving → lower toward 0.05.
- **Ship rule:** same as round 1 — A/B against the round-1 model on the held-out set, plus the regression suite. No delta, no ship.
- **What comes after:** if DPO plateaus and the remaining failures are *exploration* failures (the model never attempts the right strategy at all), that's the principled signal for online methods (GRPO) — budgeted for deliberately, not stumbled into.

---

## Appendix C — Determinism: what this technique guarantees (and what it doesn't)

**Short answer:** rejection-sampled SFT + DPO does not make the agent deterministic. It makes it *statistically predictable*. Be skeptical of anyone promising byte-identical responses from a fine-tuned LLM.

### What training changes

- **Shifts the output distribution.** Good trajectories become much more likely; bad ones much less likely.
- **Raises the floor.** Catastrophic failures — no tool use, invented citations, ignored evidence — get trained out. The variance that remains is mostly *which* good path the agent takes, not *whether* it succeeds.
- **Instills consistent behavior patterns.** Tool discipline, citation habits, stopping criteria become the model's default character even when exact wording varies.

### What training cannot change

- The model remains a sampler. At temperature > 0, the same query can take different valid paths across runs. Even at temperature 0, GPU floating-point behavior means byte-identical output isn't guaranteed across hardware.
- Fine-tuning changes the odds, not the mechanism.

### What "predictable enough for enterprise" actually means

1. **A measured success rate on held-out tasks** — reproducible and contractual. "Resolves 87% of diagnostic tasks within tool budget" is a number you can stand behind.
2. **Low/zero temperature at inference** for the most reproducible behavior practically available.
3. **True determinism is architectural, not training:**
   - Constrained decoding (grammar / JSON-schema) for structured steps.
   - The verifier as a **runtime gate**, not just a training filter — every final answer passes the checks before it counts.
   - Human-in-the-loop on high-stakes actions.

### The reframe

Enterprise doesn't need the agent to say the same words every time. It needs the agent to *succeed* every time — or to fail loudly and measurably when it can't. Verifier + held-out evals deliver outcome reliability with a number attached, which is a stronger promise than determinism: a deterministic system that confidently produces the wrong answer is worse than a sampled one that succeeds 95% of the time and flags the other 5%.
