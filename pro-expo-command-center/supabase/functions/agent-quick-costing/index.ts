// Quick Costing Agent — applies Pre-Costing Matrix + markups + reuse credit.

import { corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { OPS_CONTEXT_DIGEST } from '../_shared/ops-context.ts';

const SYSTEM = `${OPS_CONTEXT_DIGEST}

ROLE: Quick Costing Agent.
Goal: produce the pre-cost envelope during the 4-day kick-off window. Output:
1) Typology pick (Standard Custom / Premium / Double Height / AV-Heavy / Modular)
   with one sentence of rationale based on sqm + brief signals.
2) A Markdown table: Element · Qty/sqm · Rate (€/sqm) · Subtotal · Markup % ·
   Client Price. Use the standard markups (45/20/25/15/Design 50-80/Reused 60-80).
3) Reuse credit row (deduct 40-60% of new-build cost for warehouse assets) — only
   include if reusable elements are listed in the brief or it's a repeat client.
4) Final totals: production cost EUR, client price EUR, EUR/sqm, target margin %.
5) Sanity check vs Pre-Costing Matrix range — flag if > 15% above the typology
   range with a single-line "Recommendation:".`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : 'No project context provided.',
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nProduce the Quick Costing now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-quick-costing',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: SYSTEM,
      user,
      maxTokens: 1800,
      inputForAudit: { projectId, instructions },
    });

    return jsonResponse({ ok: true, agent: 'quick-costing', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
