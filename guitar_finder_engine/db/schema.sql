-- PostgreSQL / Supabase starter schema

create table artists (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  normalized_name text not null unique
);

create table guitar_models (
  id uuid primary key default gen_random_uuid(),
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
  pickup_type text not null,
  body_style text not null,
  typical_new_price numeric,
  typical_used_low numeric,
  typical_used_high numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guitar_tuning_suitability (
  guitar_model_id uuid not null references guitar_models(id) on delete cascade,
  tuning text not null,
  confidence numeric not null default 1,
  primary key (guitar_model_id, tuning)
);

create table guitar_genre_fit (
  guitar_model_id uuid not null references guitar_models(id) on delete cascade,
  genre text not null,
  score numeric not null,
  confidence numeric not null default 1,
  reasons jsonb not null default '[]'::jsonb,
  primary key (guitar_model_id, genre)
);

create table guitar_artist_relationships (
  guitar_model_id uuid not null references guitar_models(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  relationship_type text not null,
  confidence numeric not null,
  source_url text not null,
  checked_at timestamptz not null default now(),
  primary key (guitar_model_id, artist_id, relationship_type)
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  guitar_model_id uuid not null references guitar_models(id),
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
  raw_payload jsonb
);

create table ingestion_review_queue (
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
