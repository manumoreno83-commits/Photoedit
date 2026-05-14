-- Phase 1 brief alignment: data model now matches the spec.
-- Aditive migration. Existing data preserved. New columns nullable; the seed
-- in 0006 populates them.
--
-- Key changes:
--  - projects gains sell_price, target_cost, pm_user_id, designer_user_id,
--    contractor_supplier_id, phase_id, status, vertical
--  - new tables: project_phases, budget_items, supplier_quotes (richer than rfqs),
--    timeline_events, files, users, pre_pitch_questions, knowledge_documents
--  - knowledge_entries kept as a thin alias view (back-compat with the existing UI
--    until the routes flip to knowledge_documents)

-- 1. project_phases (ordered enum-as-rows so the UI can render the spine) ---

create table if not exists project_phases (
  id          smallint primary key,
  name        text not null unique,
  ordinal     smallint not null
);

insert into project_phases (id, name, ordinal) values
  (1, 'Briefing',     1),
  (2, 'Design',       2),
  (3, 'Proposal',     3),
  (4, 'Presentation', 4),
  (5, 'Quotation',    5),
  (6, 'Production',   6),
  (7, 'Setup',        7),
  (8, 'Live',         8)
on conflict (id) do nothing;

-- 2. users (Pro Expo team — populated from auth.users via trigger) ----------

create table if not exists users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        text not null default 'pm',  -- ops_director | pm | designer | sales | admin
  avatar_url  text,
  created_at  timestamptz not null default now()
);
alter table users enable row level security;
create policy if not exists "users_read"  on users for select using (auth.role() = 'authenticated');
create policy if not exists "users_self_write" on users for update using (id = auth.uid()) with check (id = auth.uid());

-- 3. clients gains vertical + tier --------------------------------------------

alter table clients
  add column if not exists vertical    text,           -- pharma, tech, hvac, transport, gaming, etc.
  add column if not exists profile_notes text,
  add column if not exists tier         text;          -- whale | tuna | salmon | fish_tank | sardine

-- 4. projects gains the brief fields ----------------------------------------

alter table projects
  add column if not exists client_id              uuid references clients(id) on delete set null,
  add column if not exists vertical               text,
  add column if not exists sell_price             numeric(12,2),
  add column if not exists target_cost            numeric(12,2),
  add column if not exists pm_user_id             uuid references users(id) on delete set null,
  add column if not exists designer_user_id       uuid references users(id) on delete set null,
  add column if not exists contractor_supplier_id uuid references suppliers(id) on delete set null,
  add column if not exists phase_id               smallint references project_phases(id) on delete set null,
  add column if not exists status                 text default 'active',  -- active | won | lost | paused | closed
  add column if not exists tier                   text;                   -- whale | tuna | salmon | fish_tank | sardine

-- Backfill sell_price / target_cost from the legacy columns so nothing breaks.
update projects set sell_price = pvp_client where sell_price is null and pvp_client is not null;
update projects set target_cost = precio_objetivo where target_cost is null and precio_objetivo is not null;

-- 5. budget_items -----------------------------------------------------------

create table if not exists budget_items (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  category        text not null,             -- construction | av | logistics | venue | furniture | design | reuse_credit | pm
  detail          text,
  internal_cost   numeric(12,2) not null default 0,
  markup_pct      numeric(5,2)  not null default 0,
  client_price    numeric(12,2) generated always as (round(internal_cost * (1 + markup_pct / 100), 2)) stored,
  currency        text not null default 'EUR',
  created_at      timestamptz not null default now()
);
create index if not exists budget_items_project_idx on budget_items (project_id);
alter table budget_items enable row level security;
create policy if not exists "budget_items_read"  on budget_items for select using (auth.role() = 'authenticated');
create policy if not exists "budget_items_write" on budget_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 6. supplier_quotes (richer than rfqs — keeps both for now, deprecate later)

create table if not exists supplier_quotes (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  supplier_id  uuid not null references suppliers(id) on delete restrict,
  price        numeric(12,2),
  status       text not null default 'pending',  -- selected | high | low | unavailable | pending
  label        text,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists supplier_quotes_project_idx on supplier_quotes (project_id);
alter table supplier_quotes enable row level security;
create policy if not exists "supplier_quotes_read"  on supplier_quotes for select using (auth.role() = 'authenticated');
create policy if not exists "supplier_quotes_write" on supplier_quotes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 7. timeline_events --------------------------------------------------------

create table if not exists timeline_events (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  date         date not null,
  title        text not null,
  description  text,
  done         boolean not null default false,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists timeline_events_project_idx on timeline_events (project_id, date);
alter table timeline_events enable row level security;
create policy if not exists "timeline_events_read"  on timeline_events for select using (auth.role() = 'authenticated');
create policy if not exists "timeline_events_write" on timeline_events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 8. files ------------------------------------------------------------------

create table if not exists files (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  name         text not null,
  type         text,
  size_bytes   bigint,
  drive_url    text,
  storage_path text,
  uploaded_at  timestamptz not null default now()
);
create index if not exists files_project_idx on files (project_id);
alter table files enable row level security;
create policy if not exists "files_read"  on files for select using (auth.role() = 'authenticated');
create policy if not exists "files_write" on files for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 9. pre_pitch_questions ---------------------------------------------------

create table if not exists pre_pitch_questions (
  id            uuid primary key default uuid_generate_v4(),
  category      text not null,
  ordinal       smallint not null,
  question_en   text not null,
  question_es   text,
  is_must_ask   boolean not null default false
);
create index if not exists pre_pitch_questions_cat_idx on pre_pitch_questions (category, ordinal);
alter table pre_pitch_questions enable row level security;
create policy if not exists "pre_pitch_questions_read" on pre_pitch_questions for select using (auth.role() = 'authenticated');

-- 10. knowledge_documents (richer than knowledge_entries) ------------------

create table if not exists knowledge_documents (
  id                uuid primary key default uuid_generate_v4(),
  type              text not null,             -- voice | suppliers | clients | margin_policy | sustainability | tiering | venues
  name              text not null,
  version           text not null default 'v1',
  content           text not null,
  embeddings_status text not null default 'pending',  -- pending | ready | failed
  updated_at        timestamptz not null default now()
);
create index if not exists knowledge_documents_type_idx on knowledge_documents (type);
alter table knowledge_documents enable row level security;
create policy if not exists "knowledge_documents_read" on knowledge_documents for select using (auth.role() = 'authenticated');
create policy if not exists "knowledge_documents_write" on knowledge_documents for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 11. agent_runs gains cost_usd + user_id (brief specs) -------------------

alter table agent_runs
  add column if not exists user_id   uuid references users(id) on delete set null,
  add column if not exists cost_usd  numeric(10,4);

-- 12. Auto-row in users on auth.users insert (with @pro-expo.net gate) ----

create or replace function ensure_app_user()
returns trigger language plpgsql as $$
begin
  if new.email is null or position('@pro-expo.net' in new.email) = 0 then
    raise exception 'Only @pro-expo.net accounts are allowed (got %)', new.email;
  end if;
  insert into users (id, name, email, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'pm',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function ensure_app_user();
