-- ============================================================
-- NUMMARKET DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  wallet_balance numeric(12,2) not null default 0.00,
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CATEGORIES (e.g. "Virtual Numbers", "Social Media", "Email Accounts")
-- ============================================================
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SERVICES (e.g. "WhatsApp Number", "Instagram Account")
-- ============================================================
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.categories on delete cascade not null,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- LISTINGS (actual items for sale)
-- ============================================================
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  service_id uuid references public.services on delete cascade not null,
  country_code char(2) not null,           -- ISO 3166-1 alpha-2
  country_name text not null,
  price numeric(10,2) not null,
  stock int not null default 0,
  is_active boolean not null default true,
  delivery_type text not null default 'instant' check (delivery_type in ('instant', 'manual')),
  notes text,                               -- admin notes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- LISTING ITEMS (the actual credentials/numbers delivered)
-- ============================================================
create table public.listing_items (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings on delete cascade not null,
  content text not null,                    -- the number/account info (encrypted ideally)
  is_sold boolean not null default false,
  sold_at timestamptz,
  order_id uuid,                            -- set when purchased
  created_at timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete set null,
  listing_id uuid references public.listings on delete set null,
  listing_item_id uuid references public.listing_items on delete set null,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','completed','refunded','failed')),
  country_code char(2),
  country_name text,
  service_name text,
  category_name text,
  delivered_content text,                   -- copy of what was delivered
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add FK back from listing_items to orders
alter table public.listing_items
  add constraint listing_items_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete set null;

-- ============================================================
-- WALLET TRANSACTIONS
-- ============================================================
create table public.wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  type text not null check (type in ('topup','purchase','refund')),
  amount numeric(12,2) not null,
  balance_before numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  reference text unique,                    -- payment gateway reference
  gateway text,                             -- flutterwave | paypal | crypto | bank
  status text not null default 'pending' check (status in ('pending','success','failed')),
  metadata jsonb default '{}'::jsonb,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SITE SETTINGS
-- ============================================================
create table public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value) values
  ('site_name', 'NumMarket'),
  ('maintenance_mode', 'false'),
  ('min_topup_amount', '5'),
  ('max_topup_amount', '5000');

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_listings_updated_at before update on public.listings
  for each row execute procedure public.set_updated_at();
create trigger set_orders_updated_at before update on public.orders
  for each row execute procedure public.set_updated_at();

-- Update listing stock when item is marked sold
create or replace function public.update_listing_stock()
returns trigger language plpgsql security definer as $$
begin
  if new.is_sold = true and old.is_sold = false then
    update public.listings set stock = stock - 1 where id = new.listing_id and stock > 0;
  end if;
  if new.is_sold = false and old.is_sold = true then
    update public.listings set stock = stock + 1 where id = new.listing_id;
  end if;
  return new;
end;
$$;

create trigger on_listing_item_sold after update on public.listing_items
  for each row execute procedure public.update_listing_stock();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.listings enable row level security;
alter table public.listing_items enable row level security;
alter table public.orders enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.site_settings enable row level security;

-- Profiles: users see own, admins see all
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins full access to profiles" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Categories & Services: public read, admin write
create policy "Public can view active categories" on public.categories for select using (is_active = true);
create policy "Admins manage categories" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Public can view active services" on public.services for select using (is_active = true);
create policy "Admins manage services" on public.services for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Listings: public read active, admin write all
create policy "Public can view active listings" on public.listings for select using (is_active = true and stock > 0);
create policy "Admins manage listings" on public.listings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Listing items: only admins and the purchasing user
create policy "Admins manage listing items" on public.listing_items for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Orders: user sees own orders
create policy "Users view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users insert own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Admins manage orders" on public.orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Wallet: user sees own transactions
create policy "Users view own wallet transactions" on public.wallet_transactions for select using (auth.uid() = user_id);
create policy "Admins manage wallet transactions" on public.wallet_transactions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Site settings: public read
create policy "Public can read site settings" on public.site_settings for select using (true);
create policy "Admins manage site settings" on public.site_settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- SEED: default categories
-- ============================================================
insert into public.categories (name, slug, description, icon, sort_order) values
  ('Virtual Phone Numbers', 'virtual-numbers', 'SMS-enabled virtual numbers for any service', '📱', 1),
  ('Social Media Accounts', 'social-media', 'Ready-to-use social media accounts', '🌐', 2),
  ('Email Accounts', 'email-accounts', 'Verified email accounts', '📧', 3),
  ('Streaming Accounts', 'streaming', 'Netflix, Spotify, and more', '🎬', 4),
  ('Crypto Wallets', 'crypto-wallets', 'Pre-generated crypto wallets', '₿', 5);
