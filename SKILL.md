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

**🚨 CRITICAL — Subagent Search Tool (revised 2026-06-16 after real failure):**
Subagents inside the **Workflow tool** MUST use `mcp__web-search-prime__web_search_prime` and `mcp__web-reader__webReader`. **`WebSearch` / `WebFetch` is UNRELIABLE in subagent contexts** — see Case 11 below.

```javascript
// Inside the Workflow script — subagents MUST use MCP, not WebSearch
const research = await parallel([
  () => agent(
    "Research factor group A: [venue, environment, external conditions]. " +
    "Use mcp__web-search-prime__web_search_prime for searches. " +
    "Use mcp__web-reader__webReader for full-page reads. " +
    "DO NOT use WebSearch or WebFetch — they return 0 results in subagent context.",
    { label: "Research-A" }
  ),
  () => agent(
    "Research factor group B: [actors, capabilities, recent performance]. " +
    "Use mcp__web-search-prime__web_search_prime. DO NOT use WebSearch.",
    { label: "Research-B" }
  ),
])
```

**Rule:** Each research agent covers a different dimension. Never have two agents research the same thing — waste of tokens.

**Search tool priority (subagents — REVISED 2026-06-16):**
1. `mcp__web-search-prime__web_search_prime` — **MANDATORY for subagents** (WebSearch returns 0 results in this context)
2. `mcp__web-reader__webReader` — **MANDATORY for full-page reads** (WebFetch unreliable in subagents)
3. `WebSearch` / `WebFetch` — **DO NOT USE in subagent context** (silent failure mode)
4. Parent agent (non-workflow) — still uses MCP-first per legacy preference

**Why this was changed (Case 11 — 2026-06-16 wc-20260617-4match run):**
- 4 research subagents inside the Workflow tool used `WebSearch` (default, per the prior version of this rule)
- All 4 returned `search_unavailable` after 4 queries each
- 3 of 4 matches (ARG-ALG, FRA-SEN, AUT-JOR) were PASSED by the judge due to "no data"
- Direct test by parent agent using `mcp__web-search-prime` for the same 3 matches returned **10+ highly relevant results each** (ESPN, RotoWire, Goal.com predicted XIs, betting odds, Group J preview)
- The data was there — only the wrong tool was used
- Lost betting opportunity: 3 PASSED matches had clear favorite ML picks at 1.34-1.41 odds
- **Fix:** Force subagents to load `mcp__web-search-prime` via ToolSearch at workflow start, then explicitly direct them to use it. Do not let subagents "default" to WebSearch.

**Search discipline (HARD CAPS — exceed these and stop):**
- Max **5 search queries + 3 page fetches per agent (8 tool calls total)**
- Max 4 minutes wall-clock per agent
- Stop the moment you have **2 independent TIER-1 sources** confirming each key fact
- **ABORT ON EMPTY**: If the first 2 search calls return 0 results each, the agent MUST immediately return `{"status": "search_unavailable", "reason": "2 consecutive empty results"}` and exit. Do NOT continue searching — empty results are a signal, not a condition to retry.

If all search tools fail after 2 attempts, return `{"status": "search_unavailable", "reason": "No live web results retrieved."}` — never fall back to training-data fabrication.

### Step 2: N-Model Independent Vote (MUST use Workflow tool)

> **CRITICAL — User-mandated rule (2026-06-16):** 4-mirror voting **MUST** be executed via the **Workflow tool** (`workflow({script: "..."})` or a named workflow). The Workflow tool internally dispatches to genuinely different models (opus / sonnet / haiku / fable). Direct `Agent` calls in the user's environment collapse to a single model (`minimax-m3`), which destroys model diversity and defeats the entire purpose of adversarial agreement. See [[user-workflow-tool-mandatory]].

#### Step 2.0: Shared Math Foundation (all 4 lenses MUST use this)

All 4 voters compute probabilities the same way to avoid "lens drift" (lens A says λ=2.5, lens B says λ=1.8, no shared ground truth). Three primitives, applied in this order:

**A. Poisson distribution — scoreline probabilities**
$$P(X=k) = \frac{\lambda^k e^{-\lambda}}{k!}$$

- `X` = goals scored by one team
- `λ` (lambda) = expected goals for that team (a single number, not a range)
- Two independent Poisson (home, away) → scoreline probability: `P(home=i, away=j) = P_h(i) × P_a(j)`

**B. Bayesian update — turn prior into posterior**

$$P(\text{favorite wins} \mid \text{new data}) \propto P(\text{favorite wins}) \times \prod_k \text{likelihood ratio}_k$$

- **Prior** = market-implied probability from decimal odds: `p_market = 1 / decimal_odds`
- **New data likelihoods** = the X1-X5 corrections (each is a multiplier between 0.5 and 1.5):
  - X1 cold-start: × 0.70 (absolute first match of tournament) or × 0.95 (second+ match)
  - X2 home advantage cap: × 1.00 if home underdog, × 0.85 if heavy home favorite
  - X3 heavy-tail boost: × 0.90 for top-2 scorelines (don't overweight 0-0/1-0)
  - X4 tactical overlay: × 0.85-1.15 depending on formation matchup
  - X5 sample-size gate: × 0.70 if tier 7-8 (forces downgrade to 5-6)
- **Posterior** = the model's "true" probability after seeing market + new data

**C. Kelly criterion — stake sizing (only used in Mode B, not Mode A)**

$$f^* = \frac{bp - q}{b}$$

- `b` = net odds (decimal odds − 1)
- `p` = your posterior probability
- `q` = 1 − p
- **If f\* < 0 → no bet** (no edge). In practice, use **half-Kelly** (f\*/2) to be robust to p-estimation error.

**Worked example (6/17 Iraq vs Norway, from real data):**
- Market odds: Norway -460 → decimal 1.217 → `p_market` = 1/1.217 = **82.2%**
- X1 (Norway 28-yr absence, cold start dampening): × 0.92
- X4 (Iraq compact 4-4-2 blocks Norway attack): × 0.93
- X5 (tier 7-8 historically 14.3% hit rate, force downgrade): × 0.70
- Posterior: 82.2% × 0.92 × 0.93 × 0.70 = **49.2%** Norway win
- Double-select (win + draw) at decimal ~1.40: p_combined = 49.2% + 21% draw = **70.2%**
- Half-Kelly: f\* = (0.40 × 0.702 − 0.298) / 0.40 = 0.103 → half = **5.1% of bankroll**

**Why this is mandatory:** without shared math, lens prompts produce inconsistent λ's because each lens "feels" the prior differently. The 2026-06-15/16 collapse (4/4 strong-team picks missed) was partly this: each lens had its own ad-hoc λ reduction, summing to double-counted pessimism. Shared math = auditable disagreement.

The Workflow script fans out 4 voters in parallel. Each voter gets:
- The same raw data (from Step 1 research)
- A different analytical lens (this is critical — identical prompts produce correlated outputs, which defeats the purpose)
- **The same math foundation (Step 2.0) so λ differences are explainable, not vibes**
- Implicitly, a different model tier (the Workflow tool rotates across opus / sonnet / haiku / fable)

**Reference template (use as a saved workflow OR pass inline):**

```javascript
// File: consensus-vote-4mirror.js
export const meta = {
  name: 'consensus-vote-4mirror',
  description: '4-mirror independent vote + judge synthesis. Use for high-stakes predictions.',
  phases: [
    { title: 'Voter A (Deep)' },
    { title: 'Voter B (Momentum)' },
    { title: 'Voter C (Signal)' },
    { title: 'Voter D (Narrative)' },
    { title: 'Judge' },
  ],
}

const sharedContext = args.sharedContext  // passed by parent
const calData = args.calibrationData       // passed by parent (or agent reads it)

const votes = await parallel([
  () => agent(`${sharedContext}\n\nLens: Deep structural analysis. Weight long-term patterns, Poisson xG, and tactical matchups heavily.`, { label: 'Voter A (Deep)' }),
  () => agent(`${sharedContext}\n\nLens: Recent momentum and form. Weight last 5 data points 2x. Focus on injuries, suspensions, and tactical shifts.`, { label: 'Voter B (Momentum)' }),
  () => agent(`${sharedContext}\n\nLens: Fast signal extraction. Identify the 2-3 biggest differentiators only. Be decisive.`, { label: 'Voter C (Signal)' }),
  () => agent(`${sharedContext}\n\nLens: Narrative and psychological factors. Pressure, motivation, historical patterns, derby/cup context.`, { label: 'Voter D (Narrative)' }),
])

const consensus = await agent(`
You are the JUDGE. 4 independent models voted.

=== CONFIDENCE CALIBRATION DATA (MANDATORY) ===
Historical rates per tier: ${JSON.stringify(calData?.tiers || 'see calibration_history.json')}
- DOWNGRADE RULE: If a tier has ≥3 samples and rate < 50%, downgrade confidence by 1.5-2.0 points.
- SAMPLE-SIZE GATE (X5): 7-8 tier needs N≥5 with rate≥40%; 9-10 tier needs N≥5 with rate≥70%; otherwise cap.
- APPEND calibration context: "🎯 [Pick] @ X/10 (Historical Calibrated Rate: YY% over N samples, downgraded from Z)"

=== VOTES ===
${votes.map((v, i) => `VOTER ${String.fromCharCode(65+i)}:\n${v}`).join('\n\n===\n\n')}

Output MUST include:
1. CONSENSUS ITEMS — what ≥75% of voters agree on
2. DISSENT ITEMS — where voters diverge, and why
3. FINAL RECOMMENDATION — with explicit confidence score (1-10) and Mode (A hit-rate / B EV) if betting
4. RISK MATRIX — what could invalidate the consensus
5. KEY VARIABLE — the single info that would most change the answer
`, { label: 'Judge (Synthesis)' })

return { votes, consensus }
```

**Invocation:**

```javascript
// From the parent agent:
const result = await workflow('consensus-vote-4mirror', {
  sharedContext: researchContext,
  calibrationData: { tiers: { '7-8': { rate: 0.143, predictions: 7 } } },
})
```

**Failure recovery:** If the Workflow stalls (no progress for 5+ min), the parent may call `TaskStop` on the workflow task_id, then fall back to direct `Agent` calls — but **only** if the user has been informed. Direct Agent fallback is acceptable as a degradation, not the default.

### Step 3: Judge Synthesis

> The Judge **also runs inside the Workflow tool** (see Step 2). The parent does not call `agent()` directly for the judge — that would defeat model diversity. The Workflow script orchestrates: parallel voters → barrier → judge.

One judge reads ALL votes and produces:

**Reference (last stage of consensus-vote-4mirror.js from Step 2):**

```javascript
const consensus = await agent(`
  You are the JUDGE. ${votes.length} independent models voted.

  === CONFIDENCE CALIBRATION DATA (MANDATORY) ===
  Before assigning the final confidence rating (1-10), you MUST read C:\Users\84988\.claude\scratch\consensus-voting\calibration_history.json using the view_file tool.
  Look up the historical win rate ("rate") for your target confidence tier.
  - DOWNGRADE RULE: If the target tier has at least 3 historical samples (predictions >= 3) and its win rate is less than 50% (rate < 0.50), you MUST downgrade the confidence score by 1.5 to 2.0 points, capping it at the next-lower tier.
  - SAMPLE-SIZE GATE (X5): tier 7-8 needs N≥5 with rate≥40%; tier 9-10 needs N≥5 with rate≥70%; tier 5-6 needs N≥3 with rate≥30%. Otherwise cap at the next-lower tier.
  - You MUST append the historical calibration context to your rating, e.g.:
    "🎯 Consensus: [Pick] @ 6.0/10 (Historical Calibrated Rate: 33.3% over 3 samples, downgraded from 7.5 due to low calibration history)"

  === VOTES ===
  ${votes.map((v, i) => `VOTER ${String.fromCharCode(65+i)}:\n${v}`).join('\n\n===\n\n')}

  Your output MUST include:
  1. CONSENSUS ITEMS — what ≥75% of voters agree on
  2. DISSENT ITEMS — where voters diverge, and why
  3. FINAL RECOMMENDATION — with explicit confidence score (1-10) and Mode (A hit-rate / B EV) if betting
  4. RISK MATRIX — what could invalidate the consensus, ranked by probability
  5. KEY VARIABLE — the single piece of info that, if known, would most change the answer
`, { label: 'Consensus Judge' })
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

### Step 3.7: Sports-Specific Lambda Corrections (Tournament-Stage Aware)

Five empirically-derived corrections to the default Poisson model. Addresses the 8-match World Cup 2026-06-15/16 collapse (2 wins / 6 losses / 25% hit rate; tier 7-8 confidence at 14.3% actual vs 70-80% nominal). Without these, the model systematically over-predicts home wins and inflates strong-team lambdas.

#### X1 — Tournament First-Round Lambda Discount (-30% on strong teams)

Strong teams in their first World Cup / Euros / major tournament match consistently under-perform their historical xG. Apply a **30% downward adjustment** to `λ_home` for any team matching ALL of:
- Ranked in the FIFA top 10
- ELO > 1900
- "Cold start" (no competitive match in last 21 days, OR first match of group stage)

**Exemption:** if the team has played ≥5 competitive matches in the last 30 days, the discount does not apply.

**Empirical basis:** Spain λ=3.20 produced 0-0; Iran λ=1.55 produced 0-0. A 30% discount predicts Spain λ=2.24 (still heavy favorite, but acknowledging cold start).

#### X2 — Home Advantage Cap = 0 for Heavy Underdogs

When the home team is a clear underdog (ranked ≥ 30 places below the away team, OR ELO gap > 150), **set home advantage to 0**. Tournament first-round referees apply a "balance correction" against the host; weak home teams play a 5-defender "death bus" that nullifies the natural home boost; home crowd pressure can backfire on weak teams.

#### X3 — Lambda Conservation (Total Goals Constrained)

When adjusting individual lambdas (X1, X2, or any other source), the **sum of lambdas (total expected goals) must stay within ±0.4 of the market consensus total**. Splits the gap evenly, OR shifts the larger lambda 70% of the way and the smaller 30%.

#### X4 — Heavy-Tail Scorelines Always Listed

The top-N most-likely scorelines must always include **0-0, 1-0, 0-1** even if their model probability is < 1%. Forcing these to be listed (even at the bottom with `forced-line (under-listed-prob)` flag) keeps them in scope for cases like "Spain 0-0" where the model probability is non-trivial but is absent from the top-5 list.

#### X5 — Confidence Floor / Sample-Size Gate

A confidence score of 7+ requires a minimum historical hit-rate at that tier:

| Tier | Minimum N required | Minimum historical rate | If N<min or rate<min |
|------|---------------------|------------------------|----------------------|
| 7-8  | 5 predictions       | 40%                    | Cap at 5-6 (downgrade 1.5-2.0) |
| 9-10 | 5 predictions       | 70%                    | Cap at 7-8 (downgrade 1.5-2.0) |
| 5-6  | 3 predictions       | 30%                    | Cap at 3-4 (downgrade 1.5) |

This is stricter than the inline DOWNGRADE RULE in Step 3 (which fires at N≥3, rate<50%). X5 prevents the "vague high confidence → collapse" pattern observed across all 4 strong-team predictions in the 6/16 run.

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

## Real Failure Cases (additions)

### Case 9 — Judge over-ride voter D's "double-select" suggestion
**Scenario:** 2026-06-17 Iraq vs Norway 4-mirror vote. Three voters (A/B/C) recommended away-win single-select (mean 71% P_away); voter D (narrative lens) recommended "away-win or draw" double-select due to perceived narrative risk (Norway's historical 0-win in WC, first match pressure). The judge overruled D, citing "double-select abandons 25-30pp of pure away-win probability premium."

**Reality:** The judge's reasoning was mathematically wrong. Double-select INCREASES hit-rate from 70% (single away) to 88% (away OR draw), at the cost of lower payout per win. The "premium" claim was inverted — single-select had HIGHER EV variance but the same +EV calculation missed the variance reduction that double-select provides.

**Math check:** With λ_away=2.35, λ_home=0.45 → P_away=0.70, P_draw=0.18, P_home=0.12. Single-select away: EV ≈ -9.15u per 20u bet (loses 0.30 × 20 = 6u per 100u bet on average). Double-select away+draw: EV ≈ +0.02u (essentially breakeven but with 88% win probability, much safer for casual bettors who value hit-rate).

**Lesson:** When a voter suggests a more conservative option (double-select) in a high-confidence direction, the judge should respect the user's "hit-rate first" preference (Mode A) and accept the lower payout per win. The "probability premium" argument only holds if EV is being optimized (Mode B). Skill should add: **In Mode A, always prefer double-select over single-select when user has signaled "hit-rate first" preference.**

**Skill update needed:** Step 3.5 should explicitly note that in Mode A, double-select (covering the top-2 most likely outcomes) is preferred over single-select when both options are available. The "Mode A = highest model probability" rule is misleading — Mode A is actually "highest hit-rate with acceptable odds," which double-select achieves more reliably.

### Case 11 — Subagent WebSearch silent zero-result failure (2026-06-17 wc-20260617-4match)
**Scenario:** Ran the wc-20260617-4match-vote workflow with 4 research subagents. Each subagent was instructed (per the prior version of Step 1) to use `WebSearch` for context harvest. All 4 subagents returned `{"status": "search_unavailable"}` after 4 queries each — 0 result content for the 2026 World Cup fixtures (ARG vs ALG, FRA vs SEN, IRQ vs NOR, AUT vs JOR).

**The 4-mirror vote therefore received empty research data for 3 of 4 matches.** The judge — correctly applying the "no fabrication" rule — PASSED those 3 matches. Only M3 (Iraq vs Norway) had partial data and was given an actionable pick (Norway ML @ 5 confidence, X5-capped).

**Reality (verified by parent using `mcp__web-search-prime`):** All 3 PASSED matches had abundant data available:
- **M1 ARG vs ALG** — Group J opener at Kansas City, ESPN/Rotowire/365scores all had predicted XIs, betting odds, and tactical previews. Argentina -245 ML, Mahrez-led Algeria, Messi 200-club narrative.
- **M2 FRA vs SEN** — Group I "group of death" opener, full predicted XIs (Maignan/Tchouameni/Mbappe vs Mendy/Koulibaly/Mané), odds France -250.
- **M4 AUT vs JOR** — Group J second match, Austria -295 ML, lineup notes (Alaba captain), Jordan first-ever WC game.

**Root cause:** The 2026-06-16 Step 1 update instructed subagents to use `WebSearch` "for performance" (avoiding MCP overhead). This was wrong — `WebSearch` in the subagent context appears to return 0 results for any non-trivial query. `mcp__web-search-prime` works fine in the same context. The "performance" rationale was a false economy: empty results forced the judge to PASS 3 matches, losing actionable picks.

**Loss assessment:** 3 actionable picks lost. Had the correct tool been used, the 4-mirror vote would have produced 4 picks (likely all heavy favorites at -245 to -460 ML) instead of 1 pick + 3 PASSes.

**Lesson:** Subagent tool selection is NOT the same as parent agent tool selection. The "lighter is better" intuition fails when the lighter tool is silently broken. **Hard rule:** Subagents in Workflow tools MUST use `mcp__web-search-prime__web_search_prime`. `WebSearch` is forbidden in subagent context.

**Skill update applied:** Step 1 (this update). Search tool priority reversed — MCP is mandatory for subagents, not optional.
