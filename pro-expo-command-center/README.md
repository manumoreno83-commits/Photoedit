# Pro Expo · Operations Center

Internal AI-powered Operations Center for Pro Expo. Consolidates the ops surfaces that today live across Google Drive, Odoo, Gmail and Slack into one app.

## Surfaces

1. **Overview** · Today across every project and agent. Decisions waiting, recent activity.
2. **Operations Center** · Nine specialised AI agents in a 3 × 3 grid.
3. **Operations Cockpit** · Live list of all active projects with detail views (gates, supplier quotes, margin).
4. **Knowledge Base** · Voice, suppliers, clients, margins, sustainability, venues, tiering.

## The nine agents

| # | Agent | Replaces | Model | Status |
|---|---|---|---|---|
| 1 | Client Communicator | Manual Gmail drafting | Sonnet 4.6 | live |
| 2 | RFP Triage | Ad-hoc qualification | **Opus 4.7** | live |
| 3 | RFP Brief Response | Manual proposal authoring | Sonnet 4.6 | live |
| 4 | Procurement | COMPARATIVA CARPINTEROS Excel | Sonnet 4.6 | live |
| 5 | Supplier Decision | Gut call across COMPARATIVA + WhatsApp | Sonnet 4.6 | live |
| 6 | Project Plan Builder | Manual schedule + calendar invites | **Opus 4.7** | live |
| 7 | Quick Costing | Pre-Costing Matrix Excel | Sonnet 4.6 | live |
| 8 | Quality Gate | OD-led 43-item × 4-gate validation | Sonnet 4.6 | live |
| 9 | Sustainability Audit | Ad-hoc sign-off | Sonnet 4.6 | live |

Each agent loads its own slice of `knowledge_documents` (Voice, Tiering, Margin policy, Sustainability rubric, Suppliers) at runtime, so editing the doc in the database updates every agent without redeploying.

All AI calls are logged in `agent_runs` with `tokens_in`, `tokens_out`, `cost_usd`, cache hits, status and the full input. See per-month spend with `select agent, sum(cost_usd) from agent_runs group by 1`.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 + shadcn-style primitives |
| Routing | TanStack Router |
| Server state | TanStack Query |
| Client state | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| AI | Anthropic Claude API — Sonnet 4.6 (routine), Opus 4.7 (orchestrator) |
| Deployment | Vercel (frontend) · Supabase Cloud (backend) |

## Project structure

```
pro-expo-command-center/
├─ src/
│  ├─ components/
│  │  ├─ layout/        AppShell, Sidebar, Topbar
│  │  ├─ shared/        PageHeader, StatTile
│  │  └─ ui/            Button, Card, Badge, Input, Progress, …
│  ├─ data/             agents.ts, seed.ts (Drive-sourced)
│  ├─ lib/              supabase.ts, query-client.ts, format.ts, cn.ts
│  ├─ routes/
│  │  ├─ overview.tsx
│  │  ├─ operations-center/{index,agent}.tsx
│  │  ├─ cockpit/{index,project}.tsx
│  │  └─ knowledge/{index,category}.tsx
│  ├─ store/            ui.ts (Zustand)
│  ├─ types/            db.ts
│  ├─ styles/           globals.css (Tailwind layers + Pro Expo dark theme)
│  ├─ main.tsx
│  └─ router.tsx
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/       0001_init.sql, 0002_rls.sql, 0003_seed.sql
│  └─ functions/
│     ├─ _shared/{anthropic,ops-context}.ts
│     ├─ agent-procurement/
│     ├─ agent-technical-brief/
│     ├─ agent-quick-costing/
│     ├─ agent-quality-gate/
│     ├─ agent-ce-reconciliation/
│     └─ agent-ops-orchestrator/
├─ tailwind.config.js   Pro Expo brand tokens
├─ index.html
├─ package.json
└─ vite.config.ts
```

## Local setup

```bash
# 1. Install
pnpm install     # or npm install / yarn

# 2. Env
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Dev server
pnpm dev         # http://localhost:5173
```

## Supabase

```bash
# Install Supabase CLI: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref <your-ref>

# Push schema + seed (migrations 0001-0006)
supabase db push

# Set secrets (NEVER expose any of these via VITE_)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set ODOO_URL=https://pro-expo.odoo.com
supabase secrets set ODOO_DB=pro-expo
supabase secrets set ODOO_LOGIN=ops@pro-expo.net
supabase secrets set ODOO_API_KEY=...   # rotate any key that touched chat/email

# Deploy the 9 agent functions + Odoo sync
for fn in \
  agent-client-communicator \
  agent-rfp-triage \
  agent-rfp-brief-response \
  agent-procurement \
  agent-supplier-decision \
  agent-project-plan-builder \
  agent-quick-costing \
  agent-quality-gate \
  agent-sustainability-audit \
  sync-odoo
do
  supabase functions deploy "$fn"
done
```

## Auth (Google SSO, restricted to @pro-expo.net)

Phase 1 uses Google SSO only. Reuses the same OAuth client we will need for Drive / Calendar / Gmail in Phase 5, so users grant scopes once.

### Google Cloud Console

1. `console.cloud.google.com` → create project `pro-expo-ops`.
2. APIs & Services → Library → enable: **Google Drive API**, **Google Calendar API**, **Gmail API**.
3. OAuth consent screen:
   - User Type: **Internal** (Google Workspace).
   - Authorized domain: `pro-expo.net`.
   - Scopes: `openid`, `email`, `profile`, `drive.readonly`, `drive.file`, `calendar.events`, `gmail.compose`.
4. Credentials → Create Credentials → OAuth Client ID → **Web application**.
   - Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`.
5. Save the **Client ID** and **Client Secret**.

### Supabase

1. Authentication → Providers → **Google** → Enable.
2. Paste Client ID + Client Secret. Add the scopes above.
3. Authentication → URL Configuration → Site URL: your Vercel URL (or `http://localhost:5173` for dev).

### Domain enforcement

Migration `0005_phase1_alignment.sql` installs a trigger on `auth.users` that rejects any email not ending in `@pro-expo.net`. Belt and braces with the same check in the React `AuthProvider`.

## Odoo integration

XML-RPC connector against `pro-expo.odoo.com` (Odoo 16). The Edge Function
`sync-odoo` pulls these models into local tables:

| Odoo model | Local table | Direction |
|---|---|---|
| `res.partner` (customer_rank > 0) | `clients` | Odoo → local |
| `res.partner` (supplier_rank > 0) | `suppliers` | Odoo → local |
| `project.project` | `projects` | Odoo → local |
| `sale.order` | `odoo_quotations` (cache) | Odoo → local |

Linkage columns: every synced row carries `odoo_id` (unique), `odoo_model`,
`odoo_synced_at` and a `raw` JSONB of the full Odoo payload.

### Trigger a sync

```bash
# One-shot, manual
supabase functions invoke sync-odoo

# Or, scheduled every 10 min via pg_cron + pg_net
select cron.schedule(
  'sync-odoo-every-10min',
  '*/10 * * * *',
  $$ select net.http_post(
       url := '<project>.supabase.co/functions/v1/sync-odoo',
       headers := jsonb_build_object('authorization', 'Bearer ' || current_setting('app.svc_role'))
     ) $$
);
```

### Inspect the last run

```sql
select * from odoo_last_sync;
-- or
select * from odoo_sync_log order by started_at desc limit 5;
```

### Notes

- The Odoo API key is read only from Supabase Function secrets. It is never
  shipped in the bundle and never logged.
- Stage mapping (Odoo Kanban → local `project_stage`) lives in
  `supabase/functions/sync-odoo/index.ts` (constant `STAGE_MAP`). Adjust when
  you rename a Kanban column in Odoo.
- For Odoo 19 migration: the XML-RPC endpoints (`/xmlrpc/2/common`,
  `/xmlrpc/2/object`) are stable across versions — only the field names on
  `project.project` and `sale.order` might need a small map update.

## Brand tokens

The Pro Expo palette is defined once in `tailwind.config.js` and consumed by every component. Core swatches:

| Token | Hex |
|---|---|
| `bg` | `#0a1224` |
| `bg-elev` | `#0f1a30` |
| `bg-elev-2` | `#14213d` |
| `text` | `#e8ecf5` |
| `mute` | `#8a9bb8` |
| `magenta` | `#FF4DB8` |
| `purple` | `#6B3FD4` |
| `blue` | `#1E4FB8` |
| `teal` | `#3FD4C6` |

The `bg-brand-gradient` utility renders the magenta → purple → blue diagonal used across primary actions and the logo.

## Roadmap

- [ ] Wire Supabase live data into routes (currently seeded from `src/data/seed.ts`)
- [ ] Auth (Supabase magic link, restricted to `@pro-expo.net`)
- [ ] Storage buckets for exhibitor manuals, renders, PDFs
- [ ] Streaming agent responses in the run console
- [ ] Odoo two-way sync (project stage, RFQ statuses)
- [ ] CE invoice ingestion via Drive watcher

## Sources (Pro Expo internal)

- *Operations System Manual v6 — April 2026*
- *Protocolo de Diseño y Project Management v3*
- *COMPARATIVA CARPINTEROS 2026*
- *ProExpo Workshop PreWork (May 2026)*

Confidential — Pro Expo internal use only.
