// Quality Gate — walks the 43-item checklist for the requested gate (1-4)
// and emits the GO / NO-GO email to the Operations Director.

import { admin, corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { loadKnowledge } from '../_shared/load-knowledge.ts';

const ROLE = `You are the Quality Gate agent for Pro Expo. You validate the
requested gate (1, 2, 3 or 4) for a project, per Ops Manual section 6.

Output (Markdown):

1. PER-ITEM TABLE — # | Item | Owner | Status (PASS / WATCH / FAIL) | Evidence note

2. MISSING EVIDENCE — bulleted list of what the PM still owes before GO.

3. RISK DELTA vs the previous gate (one paragraph max).

4. GO / NO-GO EMAIL — Markdown email block to Operations Director:
   Subject prefix:  [Pro Expo · Gate X · CLIENT] GO   or   NO-GO
   Body: one paragraph summary, then bulleted blockers if any, then the next
   action and owner.

5. RECOMMENDATION — single line:  Recommendation: GO   or   Recommendation: NO-GO due to <reason>

Voice rules: Pro Expo Voice. No em dashes. Decisive. Owners named.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, gateNumber = 1, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const knowledge = await loadKnowledge(['voice']);

    const { data: gate } = project
      ? await admin
          .from('quality_gates')
          .select('*')
          .eq('project_id', project.id)
          .eq('gate_number', gateNumber)
          .maybeSingle()
      : { data: null };

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : '(no project context)',
      `\nGATE TO VALIDATE: ${gateNumber}`,
      `\nCURRENT GATE STATE:\n${JSON.stringify(gate ?? { status: 'pending', checklist: {} }, null, 2)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nValidate the gate now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-quality-gate',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: `${ROLE}\n\n# Pro Expo knowledge\n${knowledge}`,
      user,
      maxTokens: 2400,
      inputForAudit: { projectId, gateNumber, instructions },
    });

    return jsonResponse({ ok: true, agent: 'quality-gate', gateNumber, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
