// Client Communicator — drafts a client email in Pro Expo Voice, matched to
// the client typology and intent. Optional Gmail Drafts push (Phase 5).

import { corsPreflight, jsonResponse, loadProject, runAgent } from '../_shared/anthropic.ts';
import { loadKnowledge } from '../_shared/load-knowledge.ts';

type Intent = 'status_update' | 'change_request_response' | 'cost_escalation' | 'decline' | 'follow_up';

const ROLE = `You are the Client Communicator agent for Pro Expo. You draft
client emails in Pro Expo Voice, matched to the client typology and intent.

Output (Markdown):

1. SUBJECT — one line, max 70 chars. Lead with the answer.
2. EMAIL BODY — 3 to 6 short paragraphs. No greetings filler. End with the
   next concrete action and who owns it.
3. INTERNAL NOTE (optional) — 1 to 2 lines for the PM, what to watch.
4. RECOMMENDATION — single line:  Recommendation: send | hold | escalate to OD

Tone matrix:
- experience_seeker -> direct, allows a creative claim
- brand_sensitive   -> formal, evidence-led, brand-respecting
- price_sensitive   -> numbers first, scope-bound
- repeat            -> concise, no introductions, treats them as insider

Voice rules:
- No em dashes.
- No "leverage", "seamless", "synergies".
- No "I hope this finds you well", no "we are excited".
- Default English. Spanish if the input thread is Spanish.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const {
      projectId,
      intent,
      situation,
      threadHistory,
      instructions,
    } = (await req.json()) as {
      projectId?: string;
      intent?: Intent;
      situation?: string;
      threadHistory?: string;
      instructions?: string;
    };

    const project = projectId ? await loadProject(projectId) : null;
    const knowledge = await loadKnowledge(['voice', 'clients']);

    const user = [
      project ? `PROJECT:\n${JSON.stringify(project, null, 2)}` : '(no project context)',
      `\nINTENT: ${intent ?? 'status_update'}`,
      situation ? `\nSITUATION:\n${situation}` : '',
      threadHistory ? `\nTHREAD SO FAR:\n${threadHistory}` : '',
      instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : '',
      '\nDraft the email now.',
    ].join('\n');

    const result = await runAgent({
      agent: 'agent-client-communicator',
      projectId: project?.id ?? null,
      model: 'claude-sonnet-4-6',
      system: `${ROLE}\n\n# Pro Expo knowledge\n${knowledge}`,
      user,
      maxTokens: 1800,
      inputForAudit: { projectId, intent, hasSituation: !!situation, hasThread: !!threadHistory },
    });

    return jsonResponse({ ok: true, agent: 'client-communicator', ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
