-- Clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure RLS is enabled for clients
alter table public.clients enable row level security;

-- Policies: owner can do everything on own rows
drop policy if exists read_own_clients on public.clients;
create policy read_own_clients on public.clients
  for select
  to authenticated
  using ((SELECT auth.uid()) = user_id);

drop policy if exists insert_own_clients on public.clients;
create policy insert_own_clients on public.clients
  for insert
  to authenticated
  with check ((SELECT auth.uid()) = user_id);

drop policy if exists update_own_clients on public.clients;
create policy update_own_clients on public.clients
  for update
  to authenticated
  using ((SELECT auth.uid()) = user_id)
  with check ((SELECT auth.uid()) = user_id);

drop policy if exists delete_own_clients on public.clients;
create policy delete_own_clients on public.clients
  for delete
  to authenticated
  using ((SELECT auth.uid()) = user_id);

-- User tokens table (for Google access/refresh tokens)
create table if not exists public.user_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'google',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.user_tokens enable row level security;

drop policy if exists users_read_own_tokens on public.user_tokens;
create policy users_read_own_tokens on public.user_tokens
  for select
  to authenticated
  using ((SELECT auth.uid()) = user_id);

drop policy if exists users_upsert_own_tokens on public.user_tokens;
create policy users_upsert_own_tokens on public.user_tokens
  for all
  to authenticated
  using ((SELECT auth.uid()) = user_id)
  with check ((SELECT auth.uid()) = user_id);