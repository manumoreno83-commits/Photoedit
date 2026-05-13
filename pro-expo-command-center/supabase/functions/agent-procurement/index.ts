// Procurement Agent — drafts the RFQ pack and the Comparativa Carpinteros row.
// Replaces COMPARATIVA CARPINTEROS Excel.

import { corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { OPS_CONTEXT_DIGEST } from '../_shared/ops-context.ts';
import { admin } from '../_shared/anthropic.ts';

const SYSTEM = `${OPS_CONTEXT_DIGEST}

ROLE: Procurement Agent.
Goal: produce the RFQ pack for a project — three things, in this order:
1) A shortlist of 3-5 best-fit suppliers from the Capacity Dashboard, with
   rationale (cost vs venue proximity vs current load).
2) One ready-to-send RFQ email per shortlisted supplier (Markdown), with:
   - Project name, event, venue, sqm, setup window
   - Bill of Quantities placeholders
   - Response deadline (T+5 working days)
3) A Comparativa row matching the Pro Expo schema:
   PM | Stand# | sqm | PVP Client | Precio Objetivo | <supplier columns>
Then a single-line "Recommendation:" stating which supplier to prioritise and why.
End with the Polish-vs-local saving estimate if applicable.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const { data: suppliers } = await admin
      .from('suppliers')
      .select('name, tier, country, category, max_concurrent, active_projects, rating')
      .order('tier', { ascending: true });

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : 'No project context provided.',
      `\nCAPACITY DASHBOARD:\n${JSON.stringify(suppliers ?? [], null, 2)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nProduce the RFQ pack now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-procurement',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: SYSTEM,
      user,
      maxTokens: 2400,
      inputForAudit: { projectId, instructions },
    });

    return jsonResponse({ ok: true, agent: 'procurement', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
