// Sustainability Audit — scores a design against the Pro Expo rubric
// (EcoVadis Bronze + Better Stands Gold) and recommends concrete swaps.

import { corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { loadKnowledge } from '../_shared/load-knowledge.ts';

const ROLE = `You are the Sustainability Audit agent for Pro Expo. You audit a
project design or production sheet against the Sustainability rubric below.

Output (Markdown):

1. SCORE — total 0 to 100, plus tier (None / Bronze / Gold).
   Show the per-criterion breakdown as a table:
   Criterion | Weight | Score | Notes

2. AUTO-BLOCK FLAGS — list any auto-blocks tripped (single-use plastic
   giveaway, undisclosed material origin, uncertified PM on Reuse Protocol).

3. TOP 3 SWAP RECOMMENDATIONS — table:
   Swap | EUR delta | Score impact | Effort

4. SLACK POST DRAFT — a 3-line Markdown block ready to paste into
   #sustainability, owner Irazu, with the score, the worst gap, and the next
   action.

5. RECOMMENDATION — single line:  Recommendation: <approve / iterate / block>

Voice rules: Pro Expo Voice. Numbers first. No em dashes.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, designSummary, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const knowledge = await loadKnowledge(['voice', 'sustainability']);

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : '(no project context)',
      designSummary ? `\nDESIGN / PRODUCTION SUMMARY:\n${designSummary}` : '',
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nAudit now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-sustainability-audit',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: `${ROLE}\n\n# Pro Expo knowledge\n${knowledge}`,
      user,
      maxTokens: 2200,
      inputForAudit: { projectId, hasDesign: !!designSummary, instructions },
    });

    return jsonResponse({ ok: true, agent: 'sustainability-audit', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
