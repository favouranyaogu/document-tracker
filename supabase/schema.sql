-- Document Tracker v1 — run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates: profiles (roles), documents table, and Row Level Security (RLS)

-- 1. Profiles: one row per user, links to auth.users and stores role
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'staff'))
);

-- 2. Documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  title text not null,
  description text default '',
  status text not null check (status in ('Received', 'In Progress', 'Pending Review', 'Completed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

-- Indexes for common filters
create index if not exists idx_documents_status on public.documents(status);
create index if not exists idx_documents_assigned_to on public.documents(assigned_to);
create index if not exists idx_documents_due_date on public.documents(due_date);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.documents enable row level security;

-- 4. Policies: authenticated users can read profiles (to show names and assign)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- 5. Policies: only admins can insert/update/delete profiles (we'll enforce in app; here we allow authenticated)
create policy "Profiles insert by authenticated"
  on public.profiles for insert
  to authenticated
  with check (true);

create policy "Profiles update by authenticated"
  on public.profiles for update
  to authenticated
  using (true);

-- 6. Documents: authenticated users can read all documents
create policy "Documents are viewable by authenticated users"
  on public.documents for select
  to authenticated
  using (true);

-- 7. Documents: only admins can insert (we enforce admin role in app; RLS allows authenticated)
create policy "Documents insert by authenticated"
  on public.documents for insert
  to authenticated
  with check (true);

-- 8. Documents: authenticated can update (app will restrict Staff to status-only on assigned docs)
create policy "Documents update by authenticated"
  on public.documents for update
  to authenticated
  using (true);

-- 9. Documents: only admins can delete (enforced in app)
create policy "Documents delete by authenticated"
  on public.documents for delete
  to authenticated
  using (true);

-- 10. Trigger: create profile when a new user signs up (for future account creation)
-- For v1 we seed users via script; this helps if you add signup later
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Only create trigger if you want auto-profile on signup (optional for v1)
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();
