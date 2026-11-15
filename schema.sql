-- Verdant Bowl — Supabase PostgreSQL Database Schema
-- Compatible with Supabase PostgreSQL (SQL Editor)
-- Project ID: gecshzcbzetimjbqoudh

-- Enable pgcrypto for gen_random_uuid() if not already enabled
create extension if not exists pgcrypto;

-- 1. Plans Table
create table if not exists public.plans (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique check (slug in ('basic', 'standard', 'premium')),
  tagline text not null,
  salads_per_day integer not null default 1 check (salads_per_day >= 1),
  days_per_month integer not null default 20 check (days_per_month >= 1),
  monthly_price numeric(10, 2) not null check (monthly_price >= 0),
  discount_percent numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  free_delivery boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Users Table
create table if not exists public.users (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null unique,
  password_hash text not null,
  phone text not null,
  address text not null default '',
  role text not null default 'member' check (role in ('admin', 'member')),
  plan_id text references public.plans(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Salads Table
create table if not exists public.salads (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text not null,
  price numeric(10, 2) not null check (price >= 0),
  calories integer not null check (calories >= 0),
  protein integer not null default 0 check (protein >= 0),
  carbs integer not null default 0 check (carbs >= 0),
  fats integer not null default 0 check (fats >= 0),
  fiber integer not null default 0 check (fiber >= 0),
  dietary_type text not null default 'veg' check (dietary_type in ('veg', 'vegan', 'high-protein')),
  tags jsonb not null default '[]'::jsonb,
  ingredients_list jsonb not null default '[]'::jsonb,
  image_url text not null,
  is_available boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Ingredients Table
create table if not exists public.ingredients (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category text not null check (category in ('base', 'protein', 'topping', 'dressing')),
  price numeric(10, 2) not null check (price >= 0),
  calories integer not null check (calories >= 0),
  protein integer not null default 0 check (protein >= 0),
  dietary_tag text not null default 'vegan' check (dietary_tag in ('vegan', 'veg', 'non-veg')),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Custom Salads Table
create table if not exists public.custom_salads (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users(id) on delete cascade,
  name text not null,
  base_id text not null references public.ingredients(id) on delete restrict,
  base_name text not null,
  protein_ids jsonb not null default '[]'::jsonb,
  protein_names jsonb not null default '[]'::jsonb,
  topping_ids jsonb not null default '[]'::jsonb,
  topping_names jsonb not null default '[]'::jsonb,
  dressing_id text not null references public.ingredients(id) on delete restrict,
  dressing_name text not null,
  special_instructions text not null default '',
  total_price numeric(10, 2) not null check (total_price >= 0),
  total_calories integer not null check (total_calories >= 0),
  total_protein integer not null default 0 check (total_protein >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Subscriptions Table
create table if not exists public.subscriptions (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users(id) on delete cascade,
  plan_id text not null references public.plans(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  paused_at timestamptz,
  delivery_address text not null,
  time_slot text not null,
  razorpay_payment_id text not null default '',
  razorpay_order_id text not null default '',
  auto_renew boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. Orders Table
create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  order_number text not null unique,
  user_id text not null references public.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  discount_percent numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  delivery_address text not null,
  time_slot text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')),
  order_type text not null default 'one-time' check (order_type in ('one-time', 'subscription')),
  subscription_id text references public.subscriptions(id) on delete set null,
  scheduled_date timestamptz not null default now(),
  payment_status text not null default 'paid' check (payment_status in ('paid', 'pending')),
  payment_id text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Payments Table
create table if not exists public.payments (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users(id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  purpose text not null check (purpose in ('subscription', 'order')),
  reference_id text not null default '',
  razorpay_order_id text not null,
  razorpay_payment_id text not null default '',
  razorpay_signature text not null default '',
  status text not null default 'created' check (status in ('captured', 'created', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Appointments Table
create table if not exists public.appointments (
  id text primary key default gen_random_uuid()::text,
  user_id text references public.users(id) on delete set null,
  member_name text not null,
  member_email text not null,
  phone text not null,
  goal text not null default 'Balanced Nutrition',
  appointment_date text not null,
  time_slot text not null,
  notes text not null default '',
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for relational lookups & filtering
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_plan_id on public.users(plan_id);
create index if not exists idx_salads_dietary_type on public.salads(dietary_type);
create index if not exists idx_ingredients_category on public.ingredients(category);
create index if not exists idx_custom_salads_user_id on public.custom_salads(user_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_plan_id on public.subscriptions(plan_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_subscription_id on public.orders(subscription_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_appointments_user_id on public.appointments(user_id);
create index if not exists idx_appointments_email on public.appointments(member_email);

-- Automatic updated_at timestamp trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_plans_updated_at on public.plans;
create trigger trg_plans_updated_at before update on public.plans for each row execute function public.set_updated_at();

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users for each row execute function public.set_updated_at();

drop trigger if exists trg_salads_updated_at on public.salads;
create trigger trg_salads_updated_at before update on public.salads for each row execute function public.set_updated_at();

drop trigger if exists trg_ingredients_updated_at on public.ingredients;
create trigger trg_ingredients_updated_at before update on public.ingredients for each row execute function public.set_updated_at();

drop trigger if exists trg_custom_salads_updated_at on public.custom_salads;
create trigger trg_custom_salads_updated_at before update on public.custom_salads for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();

-- Permissions for Supabase Publishable Key (anon & authenticated roles)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;

-- Enable Row Level Security with open access policies for app tables
alter table public.plans enable row level security;
alter table public.users enable row level security;
alter table public.salads enable row level security;
alter table public.ingredients enable row level security;
alter table public.custom_salads enable row level security;
alter table public.subscriptions enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "verdant_plans_all" on public.plans;
create policy "verdant_plans_all" on public.plans for all to anon, authenticated using (true) with check (true);

drop policy if exists "verdant_users_all" on public.users;
create policy "verdant_users_all" on public.users for all to anon, authenticated using (true) with check (true);

drop policy if exists "verdant_salads_all" on public.salads;
create policy "verdant_salads_all" on public.salads for all to anon, authenticated using (true) with check (true);

drop policy if exists "verdant_ingredients_all" on public.ingredients;
create policy "verdant_ingredients_all" on public.ingredients for all to anon, authenticated using (true) with check (true);

drop policy if exists "verdant_custom_salads_all" on public.custom_salads;
create policy "verdant_custom_salads_all" on public.custom_salads for all to anon, authenticated using (true) with check (true);

drop policy if exists "verdant_subscriptions_all" on public.subscriptions;
create policy "verdant_subscriptions_all" on public.subscriptions for all to anon, authenticated using (true) with check (true);

drop policy if exists "verdant_orders_all" on public.orders;
create policy "verdant_orders_all" on public.orders for all to anon, authenticated using (true) with check (true);

drop policy if exists "verdant_payments_all" on public.payments;
create policy "verdant_payments_all" on public.payments for all to anon, authenticated using (true) with check (true);

drop policy if exists "verdant_appointments_all" on public.appointments;
create policy "verdant_appointments_all" on public.appointments for all to anon, authenticated using (true) with check (true);

