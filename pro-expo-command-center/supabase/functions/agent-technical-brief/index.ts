// Technical Brief Agent — assembles the Day 1-2 brief.

import { corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { OPS_CONTEXT_DIGEST } from '../_shared/ops-context.ts';
import { admin } from '../_shared/anthropic.ts';

const SYSTEM = `${OPS_CONTEXT_DIGEST}

ROLE: Technical Brief Agent.
Goal: produce a complete Technical Brief draft within the 2-day SLA. Output a
single Markdown document with these sections, every section filled or marked
"PENDING — owner: PM":
- Venue & hall regulations (rigging kg, fire B1, electrical kW)
- Floor plan constraints
- Mounting timelines & setup window
- Structural & rigging limitations
- Logistics constraints (transport route, dock access)
- Previous project references (closest 2-3 prior builds with key numbers)
- Risk register (5-7 rows: risk · severity · mitigation)
End with a "Recommendation:" line that summarises the single biggest risk to flag at kick-off.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    let priorRefs: unknown[] = [];
    if (project) {
      const { data } = await admin
        .from('projects')
        .select('code, client, event, venue, sqm, pvp_client, precio_objetivo, stage')
        .neq('id', project.id)
        .eq('event', project.event)
        .limit(3);
      priorRefs = data ?? [];
    }

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : 'No project context provided.',
      `\nPRIOR REFERENCES (same event):\n${JSON.stringify(priorRefs, null, 2)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nProduce the Technical Brief now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-technical-brief',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: SYSTEM,
      user,
      maxTokens: 2400,
      inputForAudit: { projectId, instructions },
    });

    return jsonResponse({ ok: true, agent: 'technical-brief', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
