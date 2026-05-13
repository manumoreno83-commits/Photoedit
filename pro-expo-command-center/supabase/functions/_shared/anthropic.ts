// Shared Anthropic client + agent run logger for all Edge Functions.
// Uses prompt caching on the system block to reuse the Ops Manual context
// across many runs (Pro Expo workflows are stable — high cache hit ratio).

import Anthropic from 'npm:@anthropic-ai/sdk@^0.35.0';
import { createClient } from 'jsr:@supabase/supabase-js@^2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!ANTHROPIC_API_KEY) {
  // Don't throw at module load — let the handler return a clean 500 if invoked.
  console.warn('[anthropic] ANTHROPIC_API_KEY missing.');
}

export const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
export const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export type Model = 'claude-sonnet-4-6' | 'claude-opus-4-7';

export interface AgentCallOpts {
  agent: string;
  projectId?: string | null;
  model: Model;
  system: string;
  user: string;
  maxTokens?: number;
  // Free-form payload echoed back into agent_runs for audit.
  inputForAudit?: Record<string, unknown>;
}

export interface AgentResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

/**
 * Run a single Claude call and persist the run in agent_runs.
 * The Ops Manual digest is sent via cache_control on the system block
 * so repeated runs hit the cache.
 */
export async function runAgent(opts: AgentCallOpts): Promise<AgentResult> {
  const startedAt = new Date().toISOString();
  const { data: run, error: insErr } = await admin
    .from('agent_runs')
    .insert({
      agent: opts.agent,
      project_id: opts.projectId ?? null,
      status: 'running',
      model: opts.model,
      input: opts.inputForAudit ?? {},
      started_at: startedAt,
    })
    .select('id')
    .single();

  if (insErr || !run) {
    throw new Error(`agent_runs insert failed: ${insErr?.message}`);
  }

  try {
    const response = await anthropic.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 2048,
      system: [
        {
          type: 'text',
          text: opts.system,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: opts.user }],
    });

    const text = response.content
      .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    const tokensIn = response.usage.input_tokens;
    const tokensOut = response.usage.output_tokens;
    const cacheReadTokens = (response.usage as { cache_read_input_tokens?: number })
      .cache_read_input_tokens ?? 0;
    const cacheCreationTokens = (response.usage as { cache_creation_input_tokens?: number })
      .cache_creation_input_tokens ?? 0;

    await admin
      .from('agent_runs')
      .update({
        status: 'succeeded',
        output: { text },
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        finished_at: new Date().toISOString(),
      })
      .eq('id', run.id);

    return { text, tokensIn, tokensOut, cacheReadTokens, cacheCreationTokens };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin
      .from('agent_runs')
      .update({
        status: 'failed',
        error: message,
        finished_at: new Date().toISOString(),
      })
      .eq('id', run.id);
    throw e;
  }
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });
}

export function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type, x-client-info, apikey',
    },
  });
}

export async function loadProject(projectId: string) {
  const { data, error } = await admin.from('projects').select('*').eq('id', projectId).single();
  if (error) throw new Error(`project ${projectId} not found: ${error.message}`);
  return data;
}
