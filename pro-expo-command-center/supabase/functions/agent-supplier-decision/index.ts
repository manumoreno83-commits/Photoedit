// Supplier Decision — picks the top 3 suppliers from the Capacity Dashboard
// for a given project profile, with rationale and savings estimate.

import { admin, corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { loadKnowledge } from '../_shared/load-knowledge.ts';

const ROLE = `You are the Supplier Decision agent for Pro Expo. Given a project
profile and the live Capacity Dashboard, recommend the top 3 suppliers.

Output (Markdown):

1. SHORTLIST — Markdown table with columns:
   Rank | Supplier | Tier | Country | Why fit | Estimated EUR | Capacity status

2. POLAND DEFAULT CHECK — apply the rule "Polish default when saving exceeds
   20% vs local AND venue is Central or Northern Europe". State whether it
   triggers and the saving estimate.

3. CONCENTRATION RISK — flag if any single supplier holds more than 40% of
   active projects.

4. RECOMMENDATION — single line:  Recommendation: lock <Supplier> for <reason>
   followed by the next action (request quote, soft-reserve, escalate to OD).

Voice rules: Pro Expo Voice. No em dashes. Use real EUR figures.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const knowledge = await loadKnowledge(['voice', 'suppliers', 'margin_policy']);

    const [{ data: suppliers }, { data: existingQuotes }] = await Promise.all([
      admin
        .from('suppliers')
        .select('name, tier, country, category, max_concurrent, active_projects, rating, notes')
        .order('tier', { ascending: true }),
      project
        ? admin
            .from('supplier_quotes')
            .select('supplier_id, price, status, label')
            .eq('project_id', project.id)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : '(no project context)',
      `\nCAPACITY DASHBOARD:\n${JSON.stringify(suppliers ?? [], null, 2)}`,
      `\nEXISTING QUOTES:\n${JSON.stringify(existingQuotes ?? [], null, 2)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nMake the supplier decision now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-supplier-decision',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: `${ROLE}\n\n# Pro Expo knowledge\n${knowledge}`,
      user,
      maxTokens: 2000,
      inputForAudit: { projectId, instructions },
    });

    return jsonResponse({ ok: true, agent: 'supplier-decision', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
