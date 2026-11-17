-- Execute in your new Supabase project's SQL editor.
-- A user-owned JSON state document for MVP persistence. RLS prevents cross-user reads/writes.
create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
create policy "read own state" on public.app_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own state" on public.app_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own state" on public.app_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Future normalized schema can split exercise logs, runs, nutrition, goals and tasks.
