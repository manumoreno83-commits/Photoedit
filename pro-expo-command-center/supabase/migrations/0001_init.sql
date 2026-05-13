-- Pro Expo Operations Center — base schema
-- Mirrors src/types/db.ts. Apply with `supabase db push`.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums --------------------------------------------------------------------

create type project_classification as enum ('functional', 'strategic', 'borderline');
create type project_stage as enum (
  'briefing', 'design', 'quotation', 'delivered',
  'won', 'lost', 'production', 'setup', 'closed'
);
create type client_typology as enum (
  'experience_seeker', 'brand_sensitive', 'price_sensitive', 'repeat'
);
create type rfq_status as enum ('pending', 'received', 'unavailable', 'confirmed');
create type gate_status as enum ('pending', 'in_review', 'go', 'no_go');
create type agent_run_status as enum ('queued', 'running', 'succeeded', 'failed');
create type knowledge_category as enum (
  'voice', 'suppliers', 'clients', 'margins', 'sustainability', 'venues'
);

-- Tables -------------------------------------------------------------------

create table projects (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null unique,
  client          text not null,
  event           text not null,
  venue           text,
  hall            text,
  stand_no        text,
  sqm             numeric(10,2) not null check (sqm > 0),
  pvp_client      numeric(12,2),
  precio_objetivo numeric(12,2),
  classification  project_classification not null default 'functional',
  client_typology client_typology,
  stage           project_stage not null default 'briefing',
  pm_initials     text,
  creative_lead   text,
  event_date      date,
  setup_start     date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index projects_stage_idx on projects (stage);
create index projects_event_date_idx on projects (event_date);

create table suppliers (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null unique,
  tier             smallint not null check (tier between 1 and 3),
  country          text,
  category         text not null,
  max_concurrent   smallint not null default 3,
  active_projects  smallint not null default 0,
  rating           numeric(3,2) check (rating between 0 and 5),
  notes            text,
  created_at       timestamptz not null default now()
);
create index suppliers_tier_idx on suppliers (tier);

create table rfqs (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  supplier_id   uuid not null references suppliers(id) on delete restrict,
  status        rfq_status not null default 'pending',
  amount        numeric(12,2),
  scope_note    text,
  requested_at  timestamptz not null default now(),
  responded_at  timestamptz,
  unique (project_id, supplier_id)
);
create index rfqs_project_idx on rfqs (project_id);

create table quality_gates (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  gate_number   smallint not null check (gate_number between 1 and 4),
  status        gate_status not null default 'pending',
  checklist     jsonb not null default '{}'::jsonb,
  validated_by  text,
  validated_at  timestamptz,
  unique (project_id, gate_number)
);

create table knowledge_entries (
  id          uuid primary key default uuid_generate_v4(),
  category    knowledge_category not null,
  title       text not null,
  body        text not null,
  tags        text[] not null default '{}',
  updated_at  timestamptz not null default now()
);
create index knowledge_category_idx on knowledge_entries (category);
create index knowledge_tags_idx on knowledge_entries using gin (tags);

create table agent_runs (
  id           uuid primary key default uuid_generate_v4(),
  agent        text not null,
  project_id   uuid references projects(id) on delete set null,
  status       agent_run_status not null default 'queued',
  input        jsonb not null default '{}'::jsonb,
  output       jsonb,
  model        text not null,
  tokens_in    integer,
  tokens_out   integer,
  error        text,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz
);
create index agent_runs_agent_idx on agent_runs (agent);
create index agent_runs_project_idx on agent_runs (project_id);

-- updated_at triggers ------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger projects_set_updated_at before update on projects
  for each row execute function set_updated_at();

create trigger knowledge_set_updated_at before update on knowledge_entries
  for each row execute function set_updated_at();
