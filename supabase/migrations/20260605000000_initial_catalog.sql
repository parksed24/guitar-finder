-- Production-oriented Supabase catalog schema.
-- Public clients can read approved catalog rows. Server-side service-role clients
-- bypass RLS for inserts, edits, approvals, deletes, and development seeding.

create table if not exists artists (
  id text primary key,
  name text not null unique,
  normalized_name text not null unique
);

create table if not exists guitar_models (
  id text primary key,
  canonical_slug text not null unique,
  brand text not null,
  family text not null,
  model text not null,
  variant text,
  finish text,
  year_start int,
  year_end int,
  production_status text not null,
  strings int not null,
  scale_length numeric,
  bridge_type text not null,
  pickup_configuration text not null,
  pickup_type text not null check (pickup_type in ('active', 'passive', 'mixed')),
  body_style text not null,
  typical_new_price numeric,
  typical_used_low numeric,
  typical_used_high numeric,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists guitar_tuning_suitability (
  guitar_model_id text not null references guitar_models(id) on delete cascade,
  tuning text not null,
  confidence numeric not null default 1,
  primary key (guitar_model_id, tuning)
);

create table if not exists guitar_genre_fit (
  guitar_model_id text not null references guitar_models(id) on delete cascade,
  genre text not null,
  score numeric not null,
  confidence numeric not null default 1,
  reasons jsonb not null default '[]'::jsonb,
  primary key (guitar_model_id, genre)
);

create table if not exists guitar_sources (
  guitar_model_id text not null references guitar_models(id) on delete cascade,
  source_url text not null,
  source_type text not null,
  checked_at timestamptz not null,
  primary key (guitar_model_id, source_url)
);

create table if not exists guitar_artist_relationships (
  guitar_model_id text not null references guitar_models(id) on delete cascade,
  artist_id text not null references artists(id) on delete cascade,
  relationship_type text not null,
  confidence numeric not null,
  source_url text not null,
  checked_at timestamptz not null default now(),
  primary key (guitar_model_id, artist_id, relationship_type)
);

create table if not exists listings (
  id text primary key,
  guitar_model_id text not null references guitar_models(id),
  seller_name text not null,
  seller_type text not null,
  condition text not null,
  item_price numeric not null,
  shipping numeric not null default 0,
  estimated_tax numeric not null default 0,
  estimated_import numeric not null default 0,
  currency text not null default 'USD',
  country text not null,
  source_url text not null unique,
  checked_at timestamptz not null,
  approved boolean not null default false,
  raw_payload jsonb
);

create table if not exists ingestion_review_queue (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  candidate_payload jsonb not null,
  issue_codes jsonb not null default '[]'::jsonb,
  confidence numeric not null,
  source_url text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table artists enable row level security;
alter table guitar_models enable row level security;
alter table guitar_tuning_suitability enable row level security;
alter table guitar_genre_fit enable row level security;
alter table guitar_sources enable row level security;
alter table guitar_artist_relationships enable row level security;
alter table listings enable row level security;
alter table ingestion_review_queue enable row level security;

create policy "approved guitar models are public"
on guitar_models for select
using (approved = true);

create policy "approved listings are public"
on listings for select
using (
  approved = true
  and exists (
    select 1 from guitar_models
    where guitar_models.id = listings.guitar_model_id
    and guitar_models.approved = true
  )
);

create policy "approved tunings are public"
on guitar_tuning_suitability for select
using (
  exists (
    select 1 from guitar_models
    where guitar_models.id = guitar_tuning_suitability.guitar_model_id
    and guitar_models.approved = true
  )
);

create policy "approved genre fits are public"
on guitar_genre_fit for select
using (
  exists (
    select 1 from guitar_models
    where guitar_models.id = guitar_genre_fit.guitar_model_id
    and guitar_models.approved = true
  )
);

create policy "approved model sources are public"
on guitar_sources for select
using (
  exists (
    select 1 from guitar_models
    where guitar_models.id = guitar_sources.guitar_model_id
    and guitar_models.approved = true
  )
);

create policy "approved artist relationships are public"
on guitar_artist_relationships for select
using (
  exists (
    select 1 from guitar_models
    where guitar_models.id = guitar_artist_relationships.guitar_model_id
    and guitar_models.approved = true
  )
);

create policy "artists referenced by approved models are public"
on artists for select
using (
  exists (
    select 1 from guitar_artist_relationships gar
    join guitar_models gm on gm.id = gar.guitar_model_id
    where gar.artist_id = artists.id
    and gm.approved = true
  )
);

create index if not exists guitar_models_lookup_idx
on guitar_models (brand, family, model, finish);

create index if not exists listings_model_approved_idx
on listings (guitar_model_id, approved);
