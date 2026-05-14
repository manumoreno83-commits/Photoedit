// Quick Costing — applies the Pre-Costing Matrix and standard markups,
// deducts reuse credit, and flags off-typology pricing.

import { corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { loadKnowledge } from '../_shared/load-knowledge.ts';

const ROLE = `You are the Quick Costing agent for Pro Expo. You generate the
pre-cost envelope during the 4-day kick-off window.

Output (Markdown):

1. TYPOLOGY PICK — Standard Custom / Premium Custom / Double Height /
   AV-Heavy / Modular / Hybrid, with one-sentence rationale based on sqm and
   brief signals.

2. QUICK COSTING TABLE — Markdown table matching this schema:
   Element | Qty | Rate (EUR/sqm) | Subtotal | Markup % | Client Price
   Apply standard markups: Construction 45 / AV 20 / Logistics 25 /
   Venue 15 / Design 50-80 / Reused 60-80.

3. REUSE CREDIT — only if reusable elements are listed or it is a repeat
   client. Deduct 40 to 60% of new-build cost.

4. TOTALS — Production cost EUR, Client price EUR, EUR/sqm, target margin %.

5. SANITY CHECK — compare project EUR/sqm vs the Pre-Costing Matrix range.
   Flag if more than 15% above.

6. RECOMMENDATION — single line:  Recommendation: <within range / iterate / OD review>

Voice rules: Pro Expo Voice. EUR only. No em dashes.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const knowledge = await loadKnowledge(['voice', 'margin_policy']);

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : '(no project context)',
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nProduce the Quick Costing now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-quick-costing',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: `${ROLE}\n\n# Pro Expo knowledge\n${knowledge}`,
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
