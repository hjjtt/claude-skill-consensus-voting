---
name: consensus-voting
description: Use when the user needs high-confidence analysis, prediction, or decision-making — multi-source verification, forecasting, risk assessment, competitive analysis, strategic recommendations, or any scenario where a single-model answer isn't reliable enough. Trigger keywords: "high accuracy", "multi-model", "consensus", "voting", "compare models", "predict", "forecast", "2串1", "parlay", "betting", "verify accuracy".
---

# Consensus Voting — Multi-Model Adversarial Agreement

When stakes are high and a single model's bias can cost you, spin up N independent models, let them argue from different angles, then have a judge synthesize the disagreement into a ranked consensus.

## Core Principle

> One model's blind spot is another model's strength.
> Agreement across diverse models = signal. Disagreement = uncertainty to quantify.

## Architecture

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

## When To Activate

| Scene | Why consensus helps |
|-------|-------------------|
| Sports match prediction | Altitude, form, injuries — no single model weights them all correctly |
| Investment/financial analysis | Bull vs bear models catch different risks |
| Code architecture decision | Multiple lenses (perf, maintainability, DX) prevent blind spots |
| Medical/diagnostic reasoning | Cross-check reduces anchoring bias |
| Legal/contract review | Different models catch different clause risks |
| Competitive strategy | Opponent modeling benefits from diverse assumptions |
| Any "irreversible decision" | When being wrong costs more than running 3 extra models |

## Execution Pattern

### Step 1: Context Harvest

Before voting, gather structured data. Assign 1-2 parallel research agents:

```javascript
const research = await parallel([
  () => agent("Research factor group A: [venue, environment, external conditions]", { model: "sonnet" }),
  () => agent("Research factor group B: [actors, capabilities, recent performance]", { model: "sonnet" }),
])
```

**Rule:** Each research agent covers a different dimension. Never have two agents research the same thing — waste of tokens.

### Step 2: N-Model Independent Vote

Spawn 3-5 voters in parallel. Each gets:
- The same raw data
- A different analytical lens (this is critical — identical prompts produce correlated outputs, which defeats the purpose)

```javascript
const votes = await parallel([
  () => agent(
    `${sharedContext}\n\nLens: Deep structural analysis. Weight long-term patterns heavily.`,
    { model: "opus", label: "Voter-A (Deep)" }
  ),
  () => agent(
    `${sharedContext}\n\nLens: Recent momentum and form. Weight last 5 data points 2x.`,
    { model: "sonnet", label: "Voter-B (Momentum)" }
  ),
  () => agent(
    `${sharedContext}\n\nLens: Fast pattern matching. Focus on the 2-3 biggest differentiators only.`,
    { model: "haiku", label: "Voter-C (Signal)" }
  ),
  () => agent(
    `${sharedContext}\n\nLens: Narrative and psychological factors. Consider pressure, motivation, and historical patterns.`,
    { model: "fable", label: "Voter-D (Narrative)" }
  ),
])
```

### Step 3: Judge Synthesis

One judge reads ALL votes and produces:

```javascript
const consensus = await agent(`
  You are the JUDGE. ${votes.length} independent models voted.

  === VOTES ===
  ${votes.map((v, i) => `VOTER ${String.fromCharCode(65+i)}:\n${v}`).join('\n\n===\n\n')}

  Your output MUST include:
  1. CONSENSUS ITEMS — what ≥75% of voters agree on
  2. DISSENT ITEMS — where voters diverge, and why
  3. FINAL RECOMMENDATION — with explicit confidence score (1-10)
  4. RISK MATRIX — what could invalidate the consensus, ranked by probability
  5. KEY VARIABLE — the single piece of info that, if known, would most change the answer
`, { model: "opus", label: "Consensus Judge" })
```

### Step 4: Present Results

Format the output as:

```
📊 MULTI-MODEL CONSENSUS RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗳️ Vote Tally:
  [Option A]: ██░░ 3/4 models
  [Option B]: █░░░ 1/4 models

🎯 Consensus: [Final answer] @ [Confidence]/10

⚠️ Key Risk: [What breaks this prediction]
🔑 Pivot Variable: [The one thing that matters most]
```

## Lens Design Rules

The quality of consensus depends on voter **diversity**, not voter **count**. Follow these rules:

1. **No two voters share the same analytical axis.** If Voter A weights data, Voter B must weight narrative. Redundant voters add cost without signal.

2. **Each lens must be defensible in isolation.** A voter that "just guesses" adds noise. Each lens should represent a real expert perspective (statistician, psychologist, domain expert, contrarian).

3. **Model selection matches lens depth:**
   - `opus` — Deep structural analysis, multi-factor reasoning
   - `sonnet` — Balanced data-driven analysis
   - `haiku` — Fast signal extraction, top-3 factors only
   - `fable` — Narrative, creative, psychological angles

4. **Minimum 3 voters for meaningful consensus.** Below 3, you can't distinguish agreement from coincidence.

5. **Odd numbers prevent ties.** Use 3 or 5 voters. If you use 4, the judge must be the tiebreaker.

## Confidence Calibration

| Confidence | Meaning | Action |
|-----------|---------|--------|
| 9-10 | Near-unanimous + strong structural factors | Proceed without hedging |
| 7-8 | Majority consensus, moderate dissent | Proceed with stated risks |
| 5-6 | Split vote, single variable dominates | Hedge or wait for pivot info |
| 3-4 | No clear consensus | Present options, don't recommend |
| 1-2 | Models actively contradict | Flag as unpredictable, refuse to recommend |

## Anti-Patterns

| Bad | Good |
|-----|------|
| Same prompt to all models | Different analytical lenses per voter |
| 5 voters, all Opus | Mix model tiers to match lens complexity |
| Judge ignores minority dissent | Judge must explain why dissent was overruled |
| No confidence score | Always output calibrated confidence |
| One-shot, no research phase | Always harvest context before voting |
| Present consensus as fact | Always present with risk matrix |

## Cost Awareness

| Setup | Agents | Token Cost |
|-------|--------|-----------|
| Minimal (3 voters + 1 judge) | 4 + research | ~$0.15-0.30 |
| Standard (4 voters + 1 judge) | 5 + research | ~$0.25-0.50 |
| Exhaustive (5 voters + 2 research + 1 judge) | 8 | ~$0.50-1.00 |

The user asked for "high accuracy" — don't cheap out. But also don't run 10 agents on a $5 question.
