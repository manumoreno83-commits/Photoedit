// Ops Orchestrator — the only Opus 4.7 agent. Reads the full ops state each
// morning and drafts the OD's day, deciding which sub-agents to dispatch.

import { admin, corsPreflight, jsonResponse, runAgent } from '../_shared/anthropic.ts';
import { OPS_CONTEXT_DIGEST } from '../_shared/ops-context.ts';

const SYSTEM = `${OPS_CONTEXT_DIGEST}

ROLE: Operations Orchestrator (meta-agent).
Audience: Manuel Moreno (Operations Director).
Goal: produce his morning brief — short, decisive, action-oriented. Output:

1) "Top 5 actions today" — ranked list. Each item:
   - One sentence describing the action
   - Why it matters today (deadline, blocker, money on the line)
   - Owner (Manuel / PM initials)
2) "Decisions waiting on Manuel" — list with explicit choices to make and the
   single line of context needed to decide each.
3) "Agent dispatch plan" — for each of the 5 sub-agents (procurement,
   technical-brief, quick-costing, quality-gate, ce-reconciliation), state
   either "no run" or "run for project X because Y".
4) "Borderline 85-95k classification" — list every active project in that band
   and propose Functional / Strategic with reasoning per Ops Manual §1.2.
5) End with a "Recommendation:" line summarising the single most important
   action for the day.

Tone: calm, direct, no filler. Bullet points and tables — not paragraphs.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { instructions } = await req.json().catch(() => ({}));

    const [{ data: projects }, { data: gates }, { data: rfqs }] = await Promise.all([
      admin
        .from('projects')
        .select('*')
        .not('stage', 'in', '(closed,lost)')
        .order('event_date', { ascending: true }),
      admin.from('quality_gates').select('*').neq('status', 'go'),
      admin.from('rfqs').select('*').neq('status', 'confirmed'),
    ]);

    const user = [
      `ACTIVE PROJECTS:\n${JSON.stringify(projects ?? [], null, 2)}`,
      `\nOPEN GATES:\n${JSON.stringify(gates ?? [], null, 2)}`,
      `\nOPEN RFQs:\n${JSON.stringify(rfqs ?? [], null, 2)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nProduce the morning brief now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-ops-orchestrator',
      projectId: null,
      model: 'claude-opus-4-7',
      system: SYSTEM,
      user,
      maxTokens: 3000,
      inputForAudit: { instructions },
    });

    return jsonResponse({ ok: true, agent: 'ops-orchestrator', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
