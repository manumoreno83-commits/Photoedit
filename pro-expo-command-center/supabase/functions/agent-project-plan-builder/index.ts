// Project Plan Builder — generates the full schedule from kickoff to delivery,
// mapped to the PM Protocol Quality Gates. Opus 4.7 for chain-of-thought
// scheduling. Future: emits Calendar API payloads.

import { admin, corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { loadKnowledge } from '../_shared/load-knowledge.ts';

const ROLE = `You are the Project Plan Builder for Pro Expo. Given a confirmed
project, the event date and the scope, you build the end-to-end schedule.

Output (Markdown):

1. PHASE TABLE — for each PM Protocol phase (Briefing, Design, Proposal,
   Presentation, Quotation, Production, Setup, Live):
   Phase | Start | End | Duration (working days) | Key milestones | Owner

2. QUALITY GATE MAP — list Gates 1 to 4 with the date each must clear, the
   item count, and the validator (always Operations Director).

3. CRITICAL PATH — three to five activities that, if delayed by 1 day, push
   the event date. State each clearly.

4. CALENDAR EVENTS — JSON array with:
   { "title", "date" (YYYY-MM-DD), "duration_min", "description", "attendees" }
   Output as a fenced code block tagged "json" so the caller can pipe it to
   Google Calendar API.

5. RECOMMENDATION — single line:  Recommendation: <one critical action>

Constraints:
- Every date must respect Pro Expo's 4-day kick-off window (Briefing -> kick-off
  meeting within 4 working days of brief receipt).
- Setup window is typically 5-7 days before event date; verify in the input.
- All dates ISO format. All durations in working days unless stated.

Voice rules: Pro Expo Voice. No em dashes. Decisive. Owners named.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;
    if (!project) return jsonResponse({ error: 'projectId required' }, 400);

    const knowledge = await loadKnowledge(['voice']);

    const { data: phases } = await admin
      .from('project_phases')
      .select('id, name, ordinal')
      .order('ordinal');

    const user = [
      `PROJECT:\n${JSON.stringify(project, null, 2)}`,
      `\nPHASES:\n${JSON.stringify(phases ?? [], null, 2)}`,
      `\nTODAY: ${new Date().toISOString().slice(0, 10)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nBuild the project plan now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-project-plan-builder',
      projectId: project.id,
      model: 'claude-opus-4-7',
      system: `${ROLE}\n\n# Pro Expo knowledge\n${knowledge}`,
      user,
      maxTokens: 3200,
      inputForAudit: { projectId, instructions },
    });

    return jsonResponse({ ok: true, agent: 'project-plan-builder', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
