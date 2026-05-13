-- Odoo integration columns + sync log + companion tables.

-- 1. Projects / suppliers: add Odoo linkage ------------------------------

alter table projects
  add column if not exists odoo_id          bigint unique,
  add column if not exists odoo_partner_id  bigint,
  add column if not exists odoo_model       text,
  add column if not exists odoo_synced_at   timestamptz,
  add column if not exists raw              jsonb;

alter table suppliers
  add column if not exists odoo_id          bigint unique,
  add column if not exists odoo_model       text,
  add column if not exists odoo_synced_at   timestamptz,
  add column if not exists raw              jsonb;

-- 2. Clients: first-class table (was only a text column on projects) ----

create table if not exists clients (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  email           text,
  country         text,
  city            text,
  odoo_id         bigint unique,
  odoo_model      text,
  odoo_synced_at  timestamptz,
  raw             jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists clients_name_idx on clients (name);
alter table clients enable row level security;
create policy "clients_read"  on clients for select using (auth.role() = 'authenticated');
create policy "clients_write" on clients for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 3. Odoo quotations cache (sale.order) ---------------------------------

create table if not exists odoo_quotations (
  id              uuid primary key default uuid_generate_v4(),
  odoo_id         bigint unique not null,
  odoo_model      text not null default 'sale.order',
  name            text not null,
  partner_odoo_id bigint,
  project_odoo_id bigint,
  amount_total    numeric(12,2),
  amount_untaxed  numeric(12,2),
  state           text,
  date_order      date,
  odoo_synced_at  timestamptz not null default now(),
  raw             jsonb
);
create index if not exists odoo_quotations_state_idx on odoo_quotations (state);
create index if not exists odoo_quotations_partner_idx on odoo_quotations (partner_odoo_id);
alter table odoo_quotations enable row level security;
create policy "odoo_quotations_read"  on odoo_quotations for select using (auth.role() = 'authenticated');
create policy "odoo_quotations_write" on odoo_quotations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 4. Sync log -----------------------------------------------------------

create table if not exists odoo_sync_log (
  id          uuid primary key default uuid_generate_v4(),
  status      text not null check (status in ('running','succeeded','failed')),
  counts      jsonb,
  error       text,
  started_at  timestamptz not null default now()
);
create index if not exists odoo_sync_log_started_idx on odoo_sync_log (started_at desc);
alter table odoo_sync_log enable row level security;
create policy "odoo_sync_log_read" on odoo_sync_log for select using (auth.role() = 'authenticated');

-- 5. Convenience view for the UI ----------------------------------------

create or replace view odoo_last_sync as
select
  status,
  counts,
  error,
  started_at,
  now() - started_at as age
from odoo_sync_log
order by started_at desc
limit 1;
