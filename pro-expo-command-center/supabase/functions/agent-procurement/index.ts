// Procurement — drafts the full RFQ pack and the Comparativa Carpinteros row.
// Replaces the COMPARATIVA Excel.

import { admin, corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { loadKnowledge } from '../_shared/load-knowledge.ts';

const ROLE = `You are the Procurement agent for Pro Expo. You produce the RFQ
pack for a project, in this order:

1. SHORTLIST — 3 to 5 best-fit suppliers from the Capacity Dashboard, with
   one-sentence rationale each.
2. RFQ EMAILS — one per shortlisted supplier (Markdown blocks). Each email:
   - Subject: project name, event, sqm, response deadline T+5 working days
   - Project facts: venue, hall, stand, sqm, setup window
   - BoQ placeholders the supplier must price
   - Currency: EUR. VAT excluded.
3. COMPARATIVA ROW — Markdown table matching:
   PM | Stand# | sqm | PVP Client | Precio Objetivo | <one column per supplier>
4. POLISH SAVING ESTIMATE — if Polish suppliers can save more than 20% vs
   local for this project, state the absolute and percentage delta.
5. RECOMMENDATION — single line:  Recommendation: prioritise <Supplier> for <reason>

Voice rules: Pro Expo Voice. No em dashes. EUR only.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const knowledge = await loadKnowledge(['voice', 'suppliers', 'margin_policy']);

    const { data: suppliers } = await admin
      .from('suppliers')
      .select('name, tier, country, category, max_concurrent, active_projects, rating, notes')
      .order('tier', { ascending: true });

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : '(no project context)',
      `\nCAPACITY DASHBOARD:\n${JSON.stringify(suppliers ?? [], null, 2)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nProduce the RFQ pack now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-procurement',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: `${ROLE}\n\n# Pro Expo knowledge\n${knowledge}`,
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
