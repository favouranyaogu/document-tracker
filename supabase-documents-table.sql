-- Run this in Supabase Dashboard → SQL Editor if the documents table does not exist.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null check (status in ('pending', 'in_progress', 'completed')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Optional: enable RLS so users only see their own documents
alter table public.documents enable row level security;

create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = created_by);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = created_by);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = created_by);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = created_by);
