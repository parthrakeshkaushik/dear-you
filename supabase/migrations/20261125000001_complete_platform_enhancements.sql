-- ==============================================================================
-- DEAR YOU — CONSOLIDATED PRODUCTION MIGRATION
-- (Run this script once in Supabase SQL Editor: https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Extend gifts table with moderation, soft-deletion & download/republish features
ALTER TABLE public.gifts
ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'paused', 'unpublished', 'deleted')),
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS download_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_downloaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS republished_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS source_gift_id UUID REFERENCES public.gifts(id) ON DELETE SET NULL;

-- 2. Extend admin_users table for mobile registration, country code, and verification
ALTER TABLE public.admin_users
ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_method TEXT NOT NULL DEFAULT 'email' CHECK (registration_method IN ('email', 'mobile')),
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+91',
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- 3. Create OTP verification and security audit table
CREATE TABLE IF NOT EXISTS public.otp_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination TEXT NOT NULL,
    destination_type TEXT NOT NULL CHECK (destination_type IN ('email', 'mobile')),
    action_type TEXT NOT NULL CHECK (action_type IN ('signup', 'login', 'recovery')),
    attempts_count INT NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address TEXT,
    user_agent TEXT,
    captcha_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ
);

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_gifts_moderation_status ON public.gifts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_gifts_deleted_at ON public.gifts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_gifts_source_gift_id ON public.gifts(source_gift_id);
CREATE INDEX IF NOT EXISTS idx_gifts_republished_at ON public.gifts(republished_at);
CREATE INDEX IF NOT EXISTS idx_gifts_download_count ON public.gifts(download_count);
CREATE INDEX IF NOT EXISTS idx_admin_users_account_status ON public.admin_users(account_status);
CREATE INDEX IF NOT EXISTS idx_admin_users_email_verified ON public.admin_users(email_verified);
CREATE INDEX IF NOT EXISTS idx_admin_users_phone ON public.admin_users(phone);
CREATE INDEX IF NOT EXISTS idx_admin_users_registration_method ON public.admin_users(registration_method);
CREATE INDEX IF NOT EXISTS idx_admin_users_phone_verified ON public.admin_users(phone_verified);
CREATE INDEX IF NOT EXISTS idx_otp_logs_destination ON public.otp_verification_logs(destination);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created_at ON public.otp_verification_logs(created_at);

-- 5. Backwards compatibility
UPDATE public.admin_users
SET registration_method = 'email'
WHERE registration_method IS NULL;

-- 6. Grant permissions to Supabase PostgREST roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
