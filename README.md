# Consensus Voting — Claude Code Skill

> **Multi-model adversarial agreement** for high-stakes decisions.
> Spin up N independent voters with different analytical lenses, then synthesize via a judge.

[![Claude Code](https://img.shields.io/badge/Claude%20Code-Skill-orange)](https://claude.com/claude-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

---

## ✨ Why this skill exists

A single LLM has blind spots. Ask one model to predict a match, audit a contract, or pick an architecture, and you get *that model's* bias — not the truth.

**Consensus Voting** runs multiple models with **deliberately different analytical lenses** in parallel, then has a judge synthesize where they agree (signal) and where they disagree (uncertainty to quantify).

> Agreement across diverse models = signal.
> Disagreement = uncertainty you should not paper over.

---

## 🎯 When to use

| Scenario | Why consensus helps |
|---|---|
| Sports / match prediction | Form, injuries, altitude — no single lens weights them all correctly |
| Investment & financial analysis | Bull vs bear lenses catch different risks |
| Code architecture decisions | Performance / maintainability / DX prevent blind spots |
| Medical / diagnostic reasoning | Cross-check reduces anchoring bias |
| Legal / contract review | Different lenses catch different clause risks |
| Strategic / competitive analysis | Opponent modeling benefits from diverse assumptions |
| Any irreversible decision | When being wrong costs more than running 3 extra models |

**Trigger keywords**: `high accuracy`, `multi-model`, `consensus`, `voting`, `compare models`, `predict`, `forecast`, `2串1`, `parlay`, `betting`, `verify accuracy`.

---

## 🏗️ Architecture

```
                    ┌─────────────────────┐
                    │   User Question      │
                    └─────────┬───────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
         ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
         │  Voter A   │ │  Voter B   │ │  Voter C   │
         │  (Opus)    │ │  (Sonnet)  │ │  (Haiku)   │
         │ Deep logic │ │ Data-driven│ │ Fast gut   │
         └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
               │              │              │
               └──────────────┼──────────────┘
                              │
                    ┌─────────▼───────────┐
                    │    Judge (Opus)     │
                    │  Synthesize + Rank  │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │  Final Consensus    │
                    │  + Confidence Score │
                    └─────────────────────┘
```

The skill enforces **lens diversity**: each voter argues from a distinct analytical axis (data / momentum / signal / narrative / psychology). Identical prompts produce correlated outputs, which defeats the entire purpose.

---

## 🚀 Installation

Drop the skill into your Claude Code skills directory:

### macOS / Linux
```bash
git clone https://github.com/hjjtt/claude-skill-consensus-voting.git \
  ~/.claude/skills/consensus-voting
```

### Windows (PowerShell)
```powershell
git clone https://github.com/hjjtt/claude-skill-consensus-voting.git `
  $env:USERPROFILE\.claude\skills\consensus-voting
```

Restart Claude Code. The skill is now available to all sessions.

---

## 💡 Usage

Just ask Claude in natural language — the skill auto-activates on trigger keywords:

```
> Predict the World Cup quarterfinals with high accuracy
> Use consensus voting to evaluate these 3 architecture options
> Run a multi-model check on this contract clause
> 2串1 最稳方案
```

Or invoke explicitly:
```
> /consensus-voting Should I migrate to Postgres or stay on MySQL?
```

### Example — Sports Prediction (Real Output)

```
📊 MULTI-MODEL CONSENSUS RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗳️ Vote Tally:
  Switzerland Win: ████ 4/4 models
  Draw:           ░░░░ 0/4 models
  Qatar Win:      ░░░░ 0/4 models

🎯 Consensus: Switzerland 2-0 @ 8.4/10 confidence
   Probability: SUI 77% / Draw 16% / QAT 7%

⚠️ Key Risk: Switzerland rotation if group already secured
🔑 Pivot Variable: Whether Xhaka starts
```

---

## 🧪 The 4-Step Pattern

### Step 1 — Context Harvest
Parallel research agents gather raw data. Each covers a *different* dimension.

### Step 2 — N-Model Independent Vote
3-5 voters in parallel. Each gets the same data but a **different analytical lens**:
- `opus` — Deep structural analysis, multi-factor reasoning
- `sonnet` — Balanced data-driven analysis
- `haiku` — Fast signal extraction, top-3 factors only
- `fable` — Narrative, creative, psychological angles

### Step 3 — Judge Synthesis
A single judge reads all votes and produces:
1. **CONSENSUS ITEMS** — what ≥75% of voters agree on
2. **DISSENT ITEMS** — where voters diverge, and why
3. **FINAL RECOMMENDATION** — with explicit 1-10 confidence
4. **RISK MATRIX** — what could invalidate the consensus
5. **KEY VARIABLE** — the single info that, if known, would most change the answer

### Step 4 — Present Results
Vote tally + consensus + confidence + risks, in scannable format.

---

## 📐 Lens Design Rules

Quality depends on **voter diversity**, not voter count:

1. **No two voters share the same analytical axis** — redundant voters add cost without signal
2. **Each lens must be defensible in isolation** — no "just guess" voters
3. **Match model tier to lens depth** — don't run 5 Opus voters when 1 Haiku covers fast pattern matching
4. **Minimum 3 voters** — below 3, you can't distinguish agreement from coincidence
5. **Odd numbers prevent ties** — use 3 or 5; if 4, judge breaks ties

---

## 📊 Confidence Calibration

| Confidence | Meaning | Action |
|---|---|---|
| **9-10** | Near-unanimous + strong structural factors | Proceed without hedging |
| **7-8** | Majority consensus, moderate dissent | Proceed with stated risks |
| **5-6** | Split vote, single variable dominates | Hedge or wait for pivot info |
| **3-4** | No clear consensus | Present options, don't recommend |
| **1-2** | Models actively contradict | Flag as unpredictable, refuse to recommend |

---

## 💰 Cost Awareness

| Setup | Agents | Approx. Cost |
|---|---|---|
| Minimal (3 voters + 1 judge) | 4 + research | ~$0.15–0.30 |
| Standard (4 voters + 1 judge) | 5 + research | ~$0.25–0.50 |
| Exhaustive (5 voters + 2 research + 1 judge) | 8 | ~$0.50–1.00 |

> Don't cheap out on high-stakes calls. Don't run 10 agents on a $5 question.

---

## ⚠️ Anti-Patterns

| ❌ Bad | ✅ Good |
|---|---|
| Same prompt to all models | Different analytical lenses per voter |
| 5 voters, all Opus | Mix model tiers to match lens complexity |
| Judge ignores minority dissent | Judge explains why dissent was overruled |
| No confidence score | Always output calibrated confidence |
| One-shot, no research phase | Always harvest context before voting |
| Present consensus as fact | Always present with risk matrix |

---

## 🛠️ Requirements

- [Claude Code](https://claude.com/claude-code) ≥ recent version with Workflow tool
- Access to multiple Claude model tiers (Opus / Sonnet / Haiku / Fable)

---

## 📄 License

MIT — use freely, attribute kindly.

---

## 🙏 Credits

Authored with [Claude Code](https://claude.com/claude-code).
Architecture inspired by adversarial agreement and ensemble methods.

---

**If this skill saved you from a bad single-model call, consider starring the repo ⭐**
