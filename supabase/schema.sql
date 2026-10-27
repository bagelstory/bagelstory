-- =============================================================
-- Bagel Story — Schéma Supabase
-- À exécuter dans Supabase > SQL Editor
-- =============================================================

create extension if not exists pgcrypto;

-- Types ----------------------------------------------------------
do $$ begin
  create type public.order_type as enum ('sur_place', 'a_emporter');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('nouvelle', 'en_preparation', 'prete', 'annulee');
exception when duplicate_object then null; end $$;

-- Table orders ---------------------------------------------------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  -- Numéro court lisible (ticket / appel au comptoir)
  order_number  integer generated always as identity,
  type          public.order_type   not null,
  table_number  smallint check (table_number between 1 and 26),
  -- Snapshot des articles au moment de la commande (nom, options, prix)
  items         jsonb not null
                check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  -- Montants en centimes : pas d'erreurs d'arrondi
  total_cents   integer not null check (total_cents >= 0),
  status        public.order_status not null default 'nouvelle',
  customer_note text check (char_length(customer_note) <= 500),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Sur place => table obligatoire ; à emporter => pas de table
  constraint orders_table_coherence check (
    (type = 'sur_place'  and table_number is not null) or
    (type = 'a_emporter' and table_number is null)
  )
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx     on public.orders (status);

-- updated_at automatique -----------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Sécurité (RLS) -------------------------------------------------
-- Les clients N'ÉCRIVENT PAS directement dans la table :
-- la commande passe par la route API Next.js /api/orders, qui
-- recalcule les prix côté serveur (clé service_role) → impossible
-- de modifier un prix depuis le navigateur.
-- Seul le personnel connecté (iPad admin) peut lire et mettre à jour.
alter table public.orders enable row level security;

drop policy if exists "staff_select_orders" on public.orders;
create policy "staff_select_orders" on public.orders
  for select to authenticated using (true);

drop policy if exists "staff_update_orders" on public.orders;
create policy "staff_update_orders" on public.orders
  for update to authenticated using (true) with check (true);

-- IMPORTANT : dans Supabase > Authentication > Providers > Email,
-- désactivez "Allow new users to sign up" et créez un seul compte
-- staff à la main. Sinon n'importe qui pourrait créer un compte
-- et lire les commandes.

-- Realtime -------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;
