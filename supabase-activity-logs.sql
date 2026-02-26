-- Run in Supabase Dashboard → SQL Editor to create the activity_logs table.

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  action text not null,
  old_value text,
  new_value text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_document_id on public.activity_logs(document_id);

alter table public.activity_logs enable row level security;

create policy "Activity logs viewable by authenticated users"
  on public.activity_logs for select
  to authenticated
  using (true);

create policy "Activity logs insert by authenticated users"
  on public.activity_logs for insert
  to authenticated
  with check (true);
