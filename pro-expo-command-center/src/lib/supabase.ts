import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surface this early in dev so a missing env doesn't show up as a runtime 401 later.
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing. Copy .env.example to .env and fill them in.',
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export function invokeAgent<T = unknown>(
  agent:
    | 'agent-client-communicator'
    | 'agent-rfp-triage'
    | 'agent-rfp-brief-response'
    | 'agent-procurement'
    | 'agent-supplier-decision'
    | 'agent-project-plan-builder'
    | 'agent-quick-costing'
    | 'agent-quality-gate'
    | 'agent-sustainability-audit',
  body: Record<string, unknown>,
) {
  return supabase.functions.invoke<T>(agent, { body });
}
