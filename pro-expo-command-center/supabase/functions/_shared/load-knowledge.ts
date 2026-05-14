// Loads the right slice of knowledge_documents per agent so each system prompt
// only carries what that agent needs. In-memory cache (per cold start) keeps
// repeated invocations cheap and stable for prompt caching.

import { admin } from './anthropic.ts';

const TTL_MS = 60_000;
const cache = new Map<string, { content: string; fetched: number }>();

export type KnowledgeType =
  | 'voice'
  | 'suppliers'
  | 'clients'
  | 'margin_policy'
  | 'sustainability'
  | 'tiering'
  | 'venues';

async function fetchOne(type: KnowledgeType): Promise<string> {
  const cached = cache.get(type);
  if (cached && Date.now() - cached.fetched < TTL_MS) return cached.content;

  const { data, error } = await admin
    .from('knowledge_documents')
    .select('name, version, content')
    .eq('type', type)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.warn(`[load-knowledge] ${type} failed: ${error.message}`);
    return '';
  }
  if (!data?.[0]) return '';

  const block = `## ${data[0].name} (${data[0].version})\n${data[0].content}`;
  cache.set(type, { content: block, fetched: Date.now() });
  return block;
}

export async function loadKnowledge(types: KnowledgeType[]): Promise<string> {
  const blocks = await Promise.all(types.map(fetchOne));
  return blocks.filter(Boolean).join('\n\n---\n\n');
}
