// 6/17 4 镜投票 workflow 脚本
// - 4 场研究并行(180s/agent)
// - 4 镜投票并行(90s/agent)
// - Judge 1 个(180s)
// - 每阶段用 Promise.race 卡死防卡
// - 父层 ScheduleWakeup 8 分钟兜底
//
// REVISED 2026-06-17 (Case 11 fix):
// - Subagents MUST use mcp__web-search-prime__web_search_prime, NOT WebSearch
// - WebSearch returns 0 results in subagent context (verified)
// - Groups corrected: M1/M4 are Group J (not I); M2/M3 are Group I

export const meta = {
  name: 'wc-20260617-4match-vote',
  description: '6/17 4-match 4-mirror vote (ARG, FRA, IRQ, AUT) with watchdog timeouts + MCP search',
  phases: [
    { title: 'Research M1 (ARG-ALG, Group J)' },
    { title: 'Research M2 (FRA-SEN, Group I)' },
    { title: 'Research M3 (IRQ-NOR, Group I)' },
    { title: 'Research M4 (AUT-JOR, Group J)' },
    { title: 'Vote A (Deep)' },
    { title: 'Vote B (Momentum)' },
    { title: 'Vote C (Signal)' },
    { title: 'Vote D (Narrative)' },
    { title: 'Judge' },
  ],
}

// Watchdog helper: race a promise against a timeout.
// On timeout, resolves to null (not reject) so parallel() can continue.
const withTimeout = (p, ms, label) => {
  let to
  const timeout = new Promise(resolve => {
    to = setTimeout(() => {
      log(`⏰ ${label} TIMEOUT after ${ms/1000}s — returning null`)
      resolve(null)
    }, ms)
  })
  return Promise.race([p, timeout]).finally(() => clearTimeout(to))
}

const RESEARCH_TIMEOUT = 180_000   // 3 min per research agent
const VOTE_TIMEOUT     =  90_000   // 1.5 min per voter
const JUDGE_TIMEOUT    = 180_000   // 3 min for judge

// === 4 matches to research ===
const MATCHES = [
  { id: 'M1', time: '06/18 08:00 BJT (Kansas City)', home: 'Argentina',   away: 'Algeria',  group: 'J' },
  { id: 'M2', time: '06/18 09:00 BJT (NY/NJ Stadium)', home: 'France',      away: 'Senegal', group: 'I' },
  { id: 'M3', time: '06/18 07:00 BJT (Boston Stadium)', home: 'Iraq',        away: 'Norway',  group: 'I' },
  { id: 'M4', time: '06/18 10:00 BJT', home: 'Austria',     away: 'Jordan',  group: 'J' },
]

const researchPrompts = MATCHES.map(m => `
You are a sports research analyst. Use MCP search to gather facts.

🚨 CRITICAL TOOL REQUIREMENT 🚨
You MUST use these MCP tools for ALL searches and page reads:
- mcp__web-search-prime__web_search_prime — for web searches
- mcp__web-reader__webReader — for full-page reads

DO NOT use WebSearch or WebFetch — they return 0 results in your subagent context.
If you cannot find these MCP tools, call ToolSearch({query: "select:mcp__web-search-prime,mcp__web-reader"}) first to load them.

Match: ${m.home} vs ${m.away} (Group ${m.group}, kickoff ${m.time})
Tournament: 2026 FIFA World Cup — first round of group stage.

Search the web for:
1. Starting lineups (any leaks 24h before)
2. Key injuries / suspensions / yellow card risks
3. Recent form (last 5 matches, both teams)
4. Head-to-head history
5. Tactical / formation notes from pre-match press
6. xG / advanced stats if available
7. World Cup 2026 tournament-stage context (first round "cold start" effect)
8. Lambda / goal expectations from any data source (Opta, FBref, etc.)
9. Betting market odds (FanDuel, BetMGM, DraftKings) — FanDuel has reliable moneyline data

Search discipline (HARD):
- Max 5 search queries + 3 page fetches (8 tool calls)
- Stop the moment 2 independent sources confirm a key fact
- ABORT ON EMPTY: if first 2 searches return 0 results each, return immediately with {"status": "search_unavailable", "reason": "..."}
- NEVER fabricate stats. If a fact cannot be verified, write "unverified" next to it.

Return a structured JSON object:
{
  "match_id": "${m.id}",
  "home": "${m.home}",
  "away": "${m.away}",
  "kickoff": "${m.time}",
  "lambda_home_raw": <float, your best estimate based on data>,
  "lambda_away_raw": <float>,
  "key_injuries": [...],
  "key_factors": [...],
  "head_to_head": "...",
  "uncertainties": [...],
  "sources_consulted": [...]
}
`.trim())

// === Stage 1: parallel research with 180s cap each ===
log('Starting 4 parallel research agents (180s cap each)')
const research = await parallel(researchPrompts.map((p, i) =>
  () => withTimeout(
    agent(p, { label: `Research ${MATCHES[i].id} (${MATCHES[i].home}-${MATCHES[i].away})` }),
    RESEARCH_TIMEOUT,
    `Research-${MATCHES[i].id}`
  )
))

const validResearch = research.filter(Boolean)
log(`Research: ${validResearch.length}/4 agents returned in time`)

// === Format shared context for voters ===
const sharedContext = `

=== 4 MATCHES TO PREDICT (2026 World Cup, June 17-18 BJT) ===

${MATCHES.map((m, i) => `
MATCH ${m.id} — ${m.home} vs ${m.away} (Group ${m.group}, ${m.time})
${research[i] ? JSON.stringify(research[i], null, 2) : '⚠️ RESEARCH FAILED/TIMEOUT — rely on prior knowledge + base rate.'}
`).join('\n---\n')}

CRITICAL RULES:
- Apply X1-X5 lambda corrections (tournament first-round, lambda conservation, heavy-tail scorelines)
- WP + PP + LP = 1.0 (no push as win in Mode A)
- Read handicap [+] and [-] LITERALLY from app (not from team strength)
- Mode A (hit-rate first) is the user's preference
- Sample-size gate (X5): tier 7-8 currently at 14.3% hit rate over 7 samples — DOWNGRADE anything claiming 7+ confidence
`.trim()

// === Stage 2: 4-mirror vote with 90s cap each ===
const votePrompts = [
  `${sharedContext}\n\n=== LENS A: Deep Structural Analysis ===\nWeight long-term patterns, xG averages, formation matchups, tournament first-round effects. Provide lambda (with X1-X5 corrections), top-3 scorelines with probabilities, recommended pick with confidence (1-10), and Mode A/B recommendation.`,
  `${sharedContext}\n\n=== LENS B: Recent Momentum & Form ===\nWeight last 5 matches 2x. Focus on injuries, suspensions, recent lineup trends. Be decisive on who has the momentum edge.`,
  `${sharedContext}\n\n=== LENS C: Fast Signal Extraction ===\nIdentify the 2-3 biggest differentiators per match. Be concise. No hedging — pick the most likely outcome per match with a single-line justification.`,
  `${sharedContext}\n\n=== LENS D: Narrative & Psychology ===\nConsider pressure, motivation, historical patterns, group context, "cold start" effects. Group I has 3 strong teams — does the schedule favor or hurt any?`,
]

log('Starting 4-mirror vote (90s cap each)')
const votes = await parallel(votePrompts.map((p, i) =>
  () => withTimeout(
    agent(p, { label: `Vote ${String.fromCharCode(65+i)}` }),
    VOTE_TIMEOUT,
    `Vote-${String.fromCharCode(65+i)}`
  )
))

const validVotes = votes.filter(Boolean)
log(`Vote: ${validVotes.length}/4 voters returned in time`)

// === Stage 3: Judge synthesis with 180s cap ===
const CAL_PATH = ['C:', '\\Users\\84988', '\\.claude\\scratch\\consensus-voting\\calibration_history.json'].join('')
const judgePrompt = `
You are the JUDGE. ${validVotes.length}/4 voters returned (some may have timed out — note this in confidence).

=== CALIBRATION CONTEXT (MANDATORY) ===
Read ${CAL_PATH}
Current 7-8 tier: 7 predictions, 1 win, 14.3% rate — DOWNGRADE all 7+ claims to 5.
Current 5-6 tier: 1 prediction, 1 win, 100% rate — small sample, cap at 5.
Current 3-4 tier: 0 — calibrate based on 7-8 rate (14.3%).

=== VOTES ===
${votes.map((v, i) => `VOTER ${String.fromCharCode(65+i)}${v ? '' : ' (TIMED OUT — null)'}:\n${v || 'null'}`).join('\n\n===\n\n')}

Output MUST include for EACH of the 4 matches:
1. CONSENSUS pick (>=75% agreement)
2. DISSENT items
3. WIN PROBABILITY (WP), PUSH PROB (PP, if handicap), LOSS PROB (LP) — sum = 1.0
4. Confidence score (1-10) WITH calibration downgrade applied
5. Mode A (hit-rate) pick
6. Risk factors

Then provide a FINAL betting plan table:
| Match | Market | Pick | Stake | WP | PP | LP | Confidence |

Tier 7+ claims must be downgraded to 5 unless ALL X5 sample-size gates pass.
`.trim()

log('Starting Judge synthesis (180s cap)')
const consensus = await withTimeout(
  agent(judgePrompt, { label: 'Judge' }),
  JUDGE_TIMEOUT,
  'Judge'
)

return {
  research: research.map((r, i) => ({ match_id: MATCHES[i].id, status: r ? 'ok' : 'timeout', data: r })),
  votes: votes.map((v, i) => ({ voter: String.fromCharCode(65+i), status: v ? 'ok' : 'timeout', data: v })),
  consensus,
}
