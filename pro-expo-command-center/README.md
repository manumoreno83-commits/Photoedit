# Pro Expo · Operations Center

Internal AI-powered Operations Center for Pro Expo. Consolidates the ops surfaces that today live across Google Drive, Odoo, Gmail and Slack into one app.

## Three surfaces

1. **Overview** — Today across every project and agent. Cards, decisions waiting, agent activity.
2. **Operations Center** — Six specialised AI agents. Each replaces a high-cost, high-stability process documented in *Ops Manual v6*.
3. **Operations Cockpit** — Live list of all active projects with detail views (gates, RFQs, margin).
4. **Knowledge Base** — Voice, suppliers, clients, margins, sustainability, venues.

## The six agents

| Agent | Replaces | Model | Saves (h/yr) |
|---|---|---|---|
| Procurement | COMPARATIVA CARPINTEROS Excel | Sonnet 4.6 | ~400 |
| Technical Brief | Day 1-2 manual brief authoring | Sonnet 4.6 | ~700 |
| Quick Costing | Pre-Costing Matrix Excel | Sonnet 4.6 | ~500 |
| Quality Gate | OD-led 43-item × 4-gate validation | Sonnet 4.6 | ~200 |
| CE Reconciliation | `CE_EVENT_YEAR_Client.xlsx` fill-in | Sonnet 4.6 | ~300 |
| Ops Orchestrator (meta) | Ad-hoc daily planning | **Opus 4.7** | ~250 |

Process selection follows the analysis in this branch: highest **operational cost × stability** → highest automation ROI (see Ops Manual v6 §3.2 Pre-Costing Matrix and §6.1-6.5 Quality Gates for the source of truth).

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

# Push schema + seed
supabase db push

# Set the Claude API key as a Function secret (NEVER expose as VITE_)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Deploy the 6 edge functions
supabase functions deploy agent-procurement
supabase functions deploy agent-technical-brief
supabase functions deploy agent-quick-costing
supabase functions deploy agent-quality-gate
supabase functions deploy agent-ce-reconciliation
supabase functions deploy agent-ops-orchestrator
```

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
