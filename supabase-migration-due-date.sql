-- Run in Supabase Dashboard → SQL Editor to add due_date if missing or ensure it's timestamptz.
-- If your documents table already has due_date as `date`, this alters it to timestamptz.

-- Add column if it doesn't exist
alter table public.documents
  add column if not exists due_date timestamptz not null default (now() + interval '2 days');

-- If due_date exists as `date` type, uncomment and run to convert to timestamptz:
-- alter table public.documents
--   alter column due_date type timestamptz using due_date::timestamptz;
