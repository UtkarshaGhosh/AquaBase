-- Create datasets table to store user-uploaded dataset metadata
create extension if not exists pgcrypto;

create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  user_id uuid references auth.users(id) on delete set null,
  visibility text default 'public' check (visibility in ('public','private')),
  row_count integer,
  time_range tsrange,
  sample_stats jsonb,
  file_url text,
  created_at timestamptz default now()
);

create index if not exists datasets_user_id_idx on public.datasets(user_id);
create index if not exists datasets_created_at_idx on public.datasets(created_at desc);

-- Optional materialized table for aggregated statistics per dataset (useful for performance)
create table if not exists public.dataset_stats (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid references public.datasets(id) on delete cascade,
  stat_date date not null,
  metrics jsonb,
  created_at timestamptz default now()
);
create index if not exists dataset_stats_dataset_idx on public.dataset_stats(dataset_id);

-- Example grant: allow anon/select only for public datasets (adjust to your security needs)
-- grant select on public.datasets to anon;

-- Example function to mark dataset visibility (optional)

-- To populate sample_stats, you can run queries that compute min/max/mean per column and save as jsonb.

-- NOTE: Run these statements in your Supabase SQL editor or via psql connected to your DB.
