// sync-odoo — pulls projects, partners (clients + suppliers) and quotations from
// Odoo into Supabase. Idempotent (UPSERT by odoo_id). Designed to run on a cron
// (5-15 min) via pg_cron + pg_net OR triggered ad-hoc from the UI.
//
// Auth: requires the caller to have a valid Supabase JWT (Edge Function default).
// Reads ODOO_* secrets from the function environment (NEVER from the request).

import { admin } from '../_shared/anthropic.ts';
import { corsPreflight, jsonResponse } from '../_shared/anthropic.ts';
import { ODOO_CONFIG, searchRead } from '../_shared/odoo.ts';

// Field selections --------------------------------------------------------

const PROJECT_FIELDS = [
  'id',
  'name',
  'partner_id',
  'stage_id',
  'date_start',
  'date',
  'user_id',
  'description',
  'active',
];

const PARTNER_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'country_id',
  'city',
  'is_company',
  'customer_rank',
  'supplier_rank',
  'category_id',
  'comment',
];

const SALE_ORDER_FIELDS = [
  'id',
  'name',
  'partner_id',
  'date_order',
  'amount_total',
  'amount_untaxed',
  'state',
  'project_id',
  'user_id',
];

// Helpers -----------------------------------------------------------------

interface SyncCounts {
  projects: number;
  clients: number;
  suppliers: number;
  quotations: number;
}

async function logSync(status: 'running' | 'succeeded' | 'failed', counts: SyncCounts | null, error?: string) {
  await admin.from('odoo_sync_log').insert({
    status,
    counts,
    error: error ?? null,
  });
}

function many2oneId(value: unknown): number | null {
  // Odoo returns Many2one fields as either [id, label] or false.
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0];
  return null;
}

function many2oneLabel(value: unknown): string | null {
  if (Array.isArray(value) && typeof value[1] === 'string') return value[1];
  return null;
}

// Mapping helpers map Odoo stage names → our local stages. Tweak the mapping
// here when the Odoo Kanban columns get renamed.
const STAGE_MAP: Record<string, string> = {
  Briefing: 'briefing',
  Design: 'design',
  Quotation: 'quotation',
  Delivered: 'delivered',
  Won: 'won',
  Lost: 'lost',
  'In Production': 'production',
  Production: 'production',
  Setup: 'setup',
  Closed: 'closed',
};

function mapStage(label: string | null): string {
  if (!label) return 'briefing';
  return STAGE_MAP[label] ?? STAGE_MAP[label.trim()] ?? 'briefing';
}

// Sync entrypoint ---------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'method not allowed' }, 405);
  }

  await logSync('running', null);
  const counts: SyncCounts = { projects: 0, clients: 0, suppliers: 0, quotations: 0 };

  try {
    // --- Partners (clients + suppliers, single call, split by rank) ----
    const partners = await searchRead<Record<string, unknown>>('res.partner', {
      domain: ['|', ['customer_rank', '>', 0], ['supplier_rank', '>', 0]],
      fields: PARTNER_FIELDS,
      limit: 1000,
      order: 'id desc',
    });

    const clientUpserts: Record<string, unknown>[] = [];
    const supplierUpserts: Record<string, unknown>[] = [];

    for (const p of partners) {
      const id = Number(p.id);
      const isSupplier = Number(p.supplier_rank ?? 0) > 0;
      const isClient = Number(p.customer_rank ?? 0) > 0;
      const base = {
        odoo_id: id,
        odoo_model: 'res.partner',
        odoo_synced_at: new Date().toISOString(),
        raw: p,
      };
      if (isSupplier) {
        supplierUpserts.push({
          name: String(p.name ?? `Supplier ${id}`),
          tier: 2, // default — promote manually to 1 when capacity confirms
          country: many2oneLabel(p.country_id),
          category: 'Unclassified',
          max_concurrent: 3,
          active_projects: 0,
          notes: typeof p.comment === 'string' ? p.comment : null,
          ...base,
        });
      }
      if (isClient) {
        clientUpserts.push({
          name: String(p.name ?? `Client ${id}`),
          email: typeof p.email === 'string' ? p.email : null,
          country: many2oneLabel(p.country_id),
          city: typeof p.city === 'string' ? p.city : null,
          ...base,
        });
      }
    }

    if (supplierUpserts.length > 0) {
      const { error } = await admin.from('suppliers').upsert(supplierUpserts, { onConflict: 'odoo_id' });
      if (error) throw new Error(`suppliers upsert: ${error.message}`);
      counts.suppliers = supplierUpserts.length;
    }
    if (clientUpserts.length > 0) {
      const { error } = await admin.from('clients').upsert(clientUpserts, { onConflict: 'odoo_id' });
      if (error) throw new Error(`clients upsert: ${error.message}`);
      counts.clients = clientUpserts.length;
    }

    // --- Projects ------------------------------------------------------
    const odooProjects = await searchRead<Record<string, unknown>>('project.project', {
      domain: [['active', '=', true]],
      fields: PROJECT_FIELDS,
      limit: 500,
      order: 'id desc',
    });

    const projectUpserts = odooProjects.map((p) => {
      const id = Number(p.id);
      const name = String(p.name ?? `Project ${id}`);
      return {
        code: name.slice(0, 64).toUpperCase().replace(/\s+/g, '-'),
        client: many2oneLabel(p.partner_id) ?? '—',
        event: name,
        sqm: 0, // Odoo doesn't store sqm natively — manually filled in our app
        stage: mapStage(many2oneLabel(p.stage_id)),
        classification: 'functional' as const,
        pm_initials: many2oneLabel(p.user_id)?.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase() ?? null,
        event_date: typeof p.date === 'string' ? p.date.slice(0, 10) : null,
        setup_start: typeof p.date_start === 'string' ? p.date_start.slice(0, 10) : null,
        odoo_id: id,
        odoo_partner_id: many2oneId(p.partner_id),
        odoo_model: 'project.project',
        odoo_synced_at: new Date().toISOString(),
        raw: p,
      };
    });

    if (projectUpserts.length > 0) {
      const { error } = await admin.from('projects').upsert(projectUpserts, { onConflict: 'odoo_id' });
      if (error) throw new Error(`projects upsert: ${error.message}`);
      counts.projects = projectUpserts.length;
    }

    // --- Quotations (sale.order, all states) ---------------------------
    const sos = await searchRead<Record<string, unknown>>('sale.order', {
      fields: SALE_ORDER_FIELDS,
      limit: 500,
      order: 'date_order desc',
    });

    if (sos.length > 0) {
      const quotationUpserts = sos.map((s) => ({
        odoo_id: Number(s.id),
        odoo_model: 'sale.order',
        name: String(s.name ?? `SO-${s.id}`),
        partner_odoo_id: many2oneId(s.partner_id),
        project_odoo_id: many2oneId(s.project_id),
        amount_total: typeof s.amount_total === 'number' ? s.amount_total : null,
        amount_untaxed: typeof s.amount_untaxed === 'number' ? s.amount_untaxed : null,
        state: typeof s.state === 'string' ? s.state : null,
        date_order: typeof s.date_order === 'string' ? s.date_order.slice(0, 10) : null,
        odoo_synced_at: new Date().toISOString(),
        raw: s,
      }));
      const { error } = await admin
        .from('odoo_quotations')
        .upsert(quotationUpserts, { onConflict: 'odoo_id' });
      if (error) throw new Error(`quotations upsert: ${error.message}`);
      counts.quotations = quotationUpserts.length;
    }

    await logSync('succeeded', counts);
    return jsonResponse({ ok: true, counts, odoo: { url: ODOO_CONFIG.url, db: ODOO_CONFIG.db } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logSync('failed', counts, message);
    return jsonResponse({ ok: false, error: message, counts }, 500);
  }
});
