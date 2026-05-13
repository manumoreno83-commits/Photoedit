// Quality Gate Agent — walks the 43-item checklist and emits GO / NO-GO.

import { corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { OPS_CONTEXT_DIGEST } from '../_shared/ops-context.ts';
import { admin } from '../_shared/anthropic.ts';

const SYSTEM = `${OPS_CONTEXT_DIGEST}

ROLE: Quality Gate Agent.
Goal: validate the requested gate (1, 2, 3 or 4) for a project. Output:
1) Per-item table with: # · Item · Owner · Status (✅ / ⚠️ / ❌) · Evidence note.
2) Missing evidence list — what the PM still owes before GO.
3) Risk delta vs last gate.
4) Draft GO / NO-GO email to the Operations Director (Manuel Moreno):
   - Subject prefix "[Pro Expo · Gate X · CLIENT] GO" or "NO-GO"
   - Body: one paragraph summary, then bulleted blockers if any.
5) End with a single line "Recommendation: GO" or "Recommendation: NO-GO — {reason}".`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, gateNumber = 1, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const { data: gate } = project
      ? await admin
          .from('quality_gates')
          .select('*')
          .eq('project_id', project.id)
          .eq('gate_number', gateNumber)
          .maybeSingle()
      : { data: null };

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : 'No project context provided.',
      `\nGATE TO VALIDATE: ${gateNumber}`,
      `\nCURRENT GATE STATE:\n${JSON.stringify(gate ?? { status: 'pending', checklist: {} }, null, 2)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nValidate the gate now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-quality-gate',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: SYSTEM,
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
