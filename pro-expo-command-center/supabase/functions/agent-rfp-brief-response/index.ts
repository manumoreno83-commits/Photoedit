// RFP Brief Response — drafts the client-facing proposal in Pro Expo Voice.
// Pulls 2-3 case studies from prior projects matching the vertical.

import { admin, corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { loadKnowledge } from '../_shared/load-knowledge.ts';

const ROLE = `You are the RFP Brief Response agent for Pro Expo. You draft the
client-facing proposal in Pro Expo Voice.

Structure (Markdown):

1. ONE-LINE POSITIONING — what we will deliver, in one sentence.
2. UNDERSTANDING — three bullets summarising the brief in our words.
3. APPROACH — sectioned proposal:
   - Spatial concept
   - Visitor journey
   - Production approach (carpentry typology, AV intensity, materials)
   - Sustainability stance
4. WHY US (CASE STUDIES) — 2 to 3 prior projects matching the vertical, each
   with: client, event, sqm, year, single-line outcome.
5. NEXT STEPS — concrete: who acts, by when.

Voice rules:
- Direct, decisive. Short sentences.
- No em dashes. No "leverage", "seamless", "synergies".
- Always include exact sqm, budget figures, dates.
- Default English. Switch to Spanish if the input brief is Spanish.
- No "we are excited" / "we are thrilled" / "I hope this finds you well".`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, briefText, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const knowledge = await loadKnowledge(['voice', 'margin_policy', 'sustainability']);

    // Vertical-matched case studies for the WHY US section.
    let caseStudies: unknown[] = [];
    if (project?.vertical) {
      const { data } = await admin
        .from('projects')
        .select('code, client, event, venue, sqm, sell_price, event_date')
        .eq('vertical', project.vertical)
        .neq('id', project.id)
        .order('event_date', { ascending: false })
        .limit(5);
      caseStudies = data ?? [];
    }

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : '(no project context)',
      briefText ? `\nORIGINAL BRIEF:\n${briefText}` : '',
      `\nVERTICAL CASE STUDIES (pick 2-3):\n${JSON.stringify(caseStudies, null, 2)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nDraft the proposal now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-rfp-brief-response',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: `${ROLE}\n\n# Pro Expo knowledge\n${knowledge}`,
      user,
      maxTokens: 3200,
      inputForAudit: { projectId, hasBriefText: !!briefText, instructions },
    });

    return jsonResponse({ ok: true, agent: 'rfp-brief-response', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
