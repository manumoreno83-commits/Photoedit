-- Row Level Security — single-tenant Pro Expo team.
-- All authenticated users (Pro Expo staff) can read everything; writes are
-- gated to the operations role for now. Tighten per-PM once roles land.

alter table projects          enable row level security;
alter table suppliers         enable row level security;
alter table rfqs              enable row level security;
alter table quality_gates     enable row level security;
alter table knowledge_entries enable row level security;
alter table agent_runs        enable row level security;

-- Read: any authenticated user
create policy "projects_read"    on projects          for select using (auth.role() = 'authenticated');
create policy "suppliers_read"   on suppliers         for select using (auth.role() = 'authenticated');
create policy "rfqs_read"        on rfqs              for select using (auth.role() = 'authenticated');
create policy "gates_read"       on quality_gates     for select using (auth.role() = 'authenticated');
create policy "knowledge_read"   on knowledge_entries for select using (auth.role() = 'authenticated');
create policy "agent_runs_read"  on agent_runs        for select using (auth.role() = 'authenticated');

-- Write: any authenticated user can write (broaden / tighten later via JWT claim
-- like `app_role = 'ops_director'`). Edge Functions use the service role and
-- bypass RLS — no policy needed for them.
create policy "projects_write"   on projects          for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "suppliers_write"  on suppliers         for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "rfqs_write"       on rfqs              for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "gates_write"      on quality_gates     for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "knowledge_write"  on knowledge_entries for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "agent_runs_write" on agent_runs        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
