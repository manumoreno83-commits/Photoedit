// CE Reconciliation Agent — turns invoices into a populated CE and a margin
// learning feedback row.

import { corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { OPS_CONTEXT_DIGEST } from '../_shared/ops-context.ts';

const SYSTEM = `${OPS_CONTEXT_DIGEST}

ROLE: CE Reconciliation Agent.
Goal: build the project Cuenta de Explotación and produce the margin feedback
that feeds back into the Pre-Costing Matrix. Output:
1) Markdown table CE rows by category (Construction / AV / Logistics / Venue /
   Furniture / PM + Travel / Reused inventory). VAT excluded. Include PLEO.
2) BoQ baseline vs Actuals: per-category delta in EUR and %. Flag any > 10%.
3) Final margin: PVP client · Production cost · Margin EUR · Margin %.
4) Lessons-learned: top 3 deltas, one sentence each, with a clear action for
   the next quote (e.g. "Bump AV typology by +10€/sqm" or
   "Add freight buffer 8% for Germany").
5) End with "Recommendation:" — a single Pre-Costing Matrix update to apply.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, invoices = [], instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : 'No project context provided.',
      `\nINVOICES (raw):\n${JSON.stringify(invoices, null, 2)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nReconcile the CE now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-ce-reconciliation',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: SYSTEM,
      user,
      maxTokens: 2400,
      inputForAudit: { projectId, invoiceCount: invoices?.length ?? 0, instructions },
    });

    return jsonResponse({ ok: true, agent: 'ce-reconciliation', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
