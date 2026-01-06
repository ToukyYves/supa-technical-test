-- Email logs table for tracking sent emails
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  to_email text not null,
  subject text not null,
  body text not null,
  gmail_message_id text,
  success boolean not null,
  error_message text,
  created_at timestamptz default now()
);

alter table public.email_logs enable row level security;

-- Policies for email logs
drop policy if exists read_own_email_logs on public.email_logs;
create policy read_own_email_logs on public.email_logs
  for select
  to authenticated
  using ((SELECT auth.uid()) = user_id);

drop policy if exists insert_own_email_logs on public.email_logs;
create policy insert_own_email_logs on public.email_logs
  for insert
  to authenticated
  with check ((SELECT auth.uid()) = user_id);
