-- ==============================================================================
-- DEAR YOU — MIGRATION: GRANT PUBLIC SCHEMA PRIVILEGES TO ROLES
-- ==============================================================================
-- In PostgreSQL / Supabase, PostgREST accesses tables as 'anon', 'authenticated', 
-- or 'service_role'. Table privileges must be granted to these roles so that 
-- Row Level Security (RLS) can be evaluated.

-- 1. Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant privileges on all existing tables, sequences, and routines
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Ensure future tables and sequences automatically inherit privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
