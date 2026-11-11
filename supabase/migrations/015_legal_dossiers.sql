-- Dagdossier voor de DBA-analyse: actuele rechtspraak, handhaving en wetgeving.
-- Gevuld door /api/cron/legal-dossier. De analyse leest de nieuwste rij met status 'active'.
-- Idempotent.
create table if not exists public.legal_dossiers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'rejected')),
  content jsonb not null,
  sources jsonb not null default '[]'::jsonb,
  model text,
  search_count integer
);

create index if not exists legal_dossiers_active_idx
  on public.legal_dossiers (created_at desc)
  where status = 'active';

-- Alleen de server (service role) leest en schrijft. Geen policies = geen toegang voor gebruikers.
alter table public.legal_dossiers enable row level security;
