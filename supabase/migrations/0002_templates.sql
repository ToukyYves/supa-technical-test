-- Email templates table (same as above)
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.email_templates enable row level security;

-- Create policies only if they do not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'email_templates'
      AND p.policyname = 'Read own templates'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Read own templates" ON public.email_templates
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'email_templates'
      AND p.policyname = 'Insert own templates'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Insert own templates" ON public.email_templates
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'email_templates'
      AND p.policyname = 'Update own templates'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Update own templates" ON public.email_templates
      FOR UPDATE
      USING ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'email_templates'
      AND p.policyname = 'Delete own templates'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Delete own templates" ON public.email_templates
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
    $sql$;
  END IF;
END;
$$;