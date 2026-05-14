// RFP Triage — extracts structured data from any incoming RFP, classifies on
// the Whale / Tuna / Salmon / Fish Tank / Sardine spectrum, and recommends bid
// effort. Opus 4.7 because tier classification is high stakes and benefits
// from deeper reasoning.

import { admin, corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { loadKnowledge } from '../_shared/load-knowledge.ts';

const ROLE = `You are the RFP Triage agent for Pro Expo. You read any incoming
RFP (forwarded email, PDF text, or pasted brief) and produce a structured
triage report.

Output (Markdown, in this exact order):

1. EXTRACTED FIELDS
   Markdown table with: client, vertical, event, venue, sqm, budget (or budget
   indication), deadline, contact name + seniority, source channel.
   Use "unknown" only when truly absent. Do not invent.

2. TIER CLASSIFICATION
   Apply the Tiering rubric below.
   Output: tier name + one sentence rationale citing sqm / budget / strategic value.

3. BUDGET REALISM CHECK
   Apply the Pre-Costing Matrix in the margin policy below.
   Output: typology pick + EUR/sqm range + verdict (within range / 15% above /
   significantly off).

4. RISK FLAGS
   List with severity (high / medium / low):
   - Incomplete brief
   - Wrong contact seniority (junior procurement vs C-level)
   - Logistics complexity (venue, timeline, customs)
   - Competitive dynamics (mentioned other agencies, RFP language signals)
   - Budget realism

5. RECOMMENDATION
   Single line:  Recommendation: BID HARD | BID LIGHT | PASS
   Followed by one sentence of why and the next concrete action.

Voice rules: Pro Expo Voice doc below. No em dashes. No filler. Numbers exact.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const { projectId, rfpText, instructions } = await req.json();
    const project = projectId ? await loadProject(projectId) : null;

    const knowledge = await loadKnowledge(['voice', 'tiering', 'margin_policy']);

    const { data: priorClients } = project?.client
      ? await admin
          .from('projects')
          .select('code, client, event, sqm, sell_price, target_cost')
          .ilike('client', `%${String(project.client).split(' ')[0]}%`)
          .limit(5)
      : { data: [] };

    const user = [
      'INCOMING RFP:',
      rfpText ?? (project ? JSON.stringify(project, null, 2) : '(none provided)'),
      project ? `\nLINKED PROJECT (if pre-created):\n${JSON.stringify(project, null, 2)}` : '',
      `\nPRIOR PROJECTS WITH THIS CLIENT:\n${JSON.stringify(priorClients ?? [], null, 2)}`,
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nProduce the triage report now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-rfp-triage',
      projectId: project?.id ?? null,
      model: 'claude-opus-4-7',
      system: `${ROLE}\n\n# Pro Expo knowledge\n${knowledge}`,
      user,
      maxTokens: 2400,
      inputForAudit: { projectId, hasRfpText: !!rfpText, instructions },
    });

    return jsonResponse({ ok: true, agent: 'rfp-triage', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
