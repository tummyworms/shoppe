-- Run this once in your Supabase project:
-- Dashboard → SQL Editor → New query → paste this → Run.

-- 1) Inventory table
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  note text,
  images jsonb not null default '[]'::jsonb,
  sold boolean not null default false,
  created_at timestamptz not null default now()
);

-- Optional columns (free text). Safe to re-run.
alter table public.items add column if not exists price text;
alter table public.items add column if not exists sku text;

-- Lock the table down: only the server (service role key) can touch it.
alter table public.items enable row level security;

-- 2) Public bucket for uploaded photos
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Allow anyone to VIEW photos (needed so <img> tags load in the browser).
-- Uploads/deletes still go through the server's service role key only.
create policy "Public read for photos"
  on storage.objects for select
  using (bucket_id = 'photos');
