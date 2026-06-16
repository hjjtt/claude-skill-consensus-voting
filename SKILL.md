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

### Step 0.5: User Preference Loading (Betting Workflows Only)

Before spawning any research agents or voters, the parent agent **MUST** inspect memory files under `C:\Users\84988\.claude\projects\C--Users-84988\memory\` (primarily `user-lottery-priority.md`) using `view_file`.
- **Parsing Preference**: If the memory states "prioritize per-bet hit-rate" or "命中优先", the agent **must** automatically choose **Mode A (Hit-rate first)** as the default recommendation mode.
- **Preference Citation**: The final report **must** append a citation at the very top:
  `[Loaded User Preference: user-lottery-priority ➔ Selected Mode A (Hit-rate first)]`

### Step 1: Context Harvest

Before voting, gather structured data. Assign 1-2 parallel research agents:

```javascript
const research = await parallel([
  () => agent("Research factor group A: [venue, environment, external conditions]", { model: "sonnet" }),
  () => agent("Research factor group B: [actors, capabilities, recent performance]", { model: "sonnet" }),
])
```

**Rule:** Each research agent covers a different dimension. Never have two agents research the same thing — waste of tokens.

**Search tool (MCP preferred, fallback OK):**
1. `mcp__web-search-prime__web_search_prime` — preferred (Zhipu/BigModel)
2. `mcp__web-reader__webReader` — for full-page reads
3. `WebSearch` / `WebFetch` — usable fallback if MCP unavailable

**Search discipline (HARD CAPS — exceed these and stop):**
- Max **5 search queries + 3 page fetches per agent (8 tool calls total)**
- Max 4 minutes wall-clock per agent
- Stop the moment you have **2 independent TIER-1 sources** confirming each key fact

If all search tools fail after 2 attempts, return `{"status": "search_unavailable", "reason": "No live web results retrieved."}` — never fall back to training-data fabrication.

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

### Step 3.5: Bet Recommendation Mode (lottery / betting workflows only)

If the workflow is producing **lottery or betting recommendations**, the judge must choose an explicit mode before picking a bet.

**Mode A — Hit-rate first (default for casual bettors):** Pick the option with the **highest model probability** of occurring. EV is secondary. Use this when the user wants the ticket to *win*, not necessarily to be the most "smart" or +EV bet.

**Mode B — EV first (default for sharp bettors):** Pick the option with the **highest expected value**: `EV = P(model) × odds − (1 − P(model))`. Use this when the user is optimizing long-term ROI.

**How to choose:**
1. If user memory or recent message explicitly states a preference (e.g. "我追求胜率"), use that mode.
2. If unclear, ask the user before recommending. Don't silently default to one — both modes produce different bets.
3. **If running in non-interactive / batch mode (no user feedback possible) and mode is unspecified**: do NOT silently default. Output a **Dual-Output table** showing both Mode A and Mode B picks side-by-side.

### Step 3.6: Handicap Reading & Push Rules (China sports lottery / Asian handicap)

#### Rule 1: Handicap Parsing Table (Never Infer, Always Mirror)

The `+N` / `-N` sign in betting handicaps is **not** "who is favorite". It is "who gets/gives goals". Read the literal sign from the bet app screenshot or source data — do not infer from team strength.

| Symbol | Meaning | Mathematical Resolution |
|--------|---------|-------------------------|
| `[+N]` or `+N` | 受让球 (Gets goals) | Adjusted Score = Actual Goals + N |
| `[-N]` or `-N` | 让球 (Gives goals) | Adjusted Score = Actual Goals − N |

A weak home team can be `[+1]` (underdog bonus). A strong away team can be `[-1]` (favorite penalty). Both formats appear in the same column in the bet app.

**Voter/Judge Debug requirement:** All voters and the judge must print the raw label and parsing formula in their internal thought process (e.g. `Saudi Arabia [+1] ➔ Saudi gets 1 goal. Formula: G_home + 1`).

**Selective Presentation:** The final user-facing output should only print this parsing label for *counter-intuitive / error-prone* matches (e.g. when the weaker home team receives a positive handicap, or high-push-risk lines). Conventional matches stay clean.

#### Rule 2: Push (走盘) is NOT a Win in Mode A

A handicap push (refund) occurs when the adjusted score is a draw (e.g. Home wins 2-1 on a -1 handicap). The bet is refunded.

- **Formula:** `WP (Win Probability) + PP (Push Probability) + LP (Loss Probability) = 1.0`
- **Mode A constraint:** A push is "no loss" but **must not** be counted as a "win". Sort and select options using **WP only**.
- **Display requirement:** Display win, push, and loss probabilities separately: `Win Prob: XX% | Push Prob: YY% | Loss Prob: ZZ%`. Never sum WP and PP into a single "hit rate".

**Outcome Resolution Table:**

| Market | Option | Win (WP) | Push (PP) | Loss (LP) |
|--------|--------|----------|-----------|-----------|
| SPF | 主胜 | G_home > G_away | n/a | G_home ≤ G_away |
| Handicap -1 | 客胜 (Away +1) | G_home < G_away + 1 | G_home = G_away + 1 | G_home > G_away + 1 |
| Handicap -1 | 主胜 (Home -1) | G_home − 1 > G_away | G_home − 1 = G_away | G_home − 1 < G_away |
| Handicap +1 | 客胜 (Away -1) | G_away − 1 > G_home | G_away − 1 = G_home | G_away − 1 < G_home |
| Handicap +1 | 主胜 (Home +1) | G_home + 1 > G_away | G_home + 1 = G_away | G_home + 1 < G_away |

**Tie-break between SPF and Handicap (when both allowed):**
1. Compute real win probability (WP, excluding push) for each market.
2. If `WP(Handicap) − WP(SPF) ≤ 3%` → prefer SPF (simpler, no push tracking).
3. If `WP(Handicap) − WP(SPF) > 3%` → prefer Handicap.

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
