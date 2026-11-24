-- ==============================================================================
-- DEAR YOU — MIGRATION: EMAIL/MOBILE OTP AUTHENTICATION & CAPTCHA AUDIT
-- ==============================================================================

-- 1. Make email column nullable to support pure mobile registrations
ALTER TABLE public.admin_users 
ALTER COLUMN email DROP NOT NULL;

-- 2. Add phone, verification and registration method columns to admin_users
ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_method TEXT NOT NULL DEFAULT 'email' CHECK (registration_method IN ('email', 'mobile')),
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+91';

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_phone ON public.admin_users(phone);
CREATE INDEX IF NOT EXISTS idx_admin_users_registration_method ON public.admin_users(registration_method);
CREATE INDEX IF NOT EXISTS idx_admin_users_phone_verified ON public.admin_users(phone_verified);

-- 4. OTP and Security Verification Log table for audit and anti-abuse
CREATE TABLE IF NOT EXISTS public.otp_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination TEXT NOT NULL, -- normalized email or E.164 phone
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

CREATE INDEX IF NOT EXISTS idx_otp_logs_destination ON public.otp_verification_logs(destination);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created_at ON public.otp_verification_logs(created_at);

-- 5. Safe backward compatibility: Ensure existing accounts are marked as registration_method='email'
UPDATE public.admin_users
SET registration_method = 'email'
WHERE registration_method IS NULL;

-- 6. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
