-- ==============================================================================
-- DEAR YOU — PASSWORD REVOCATION & DEMO CARD ENHANCEMENTS
-- ==============================================================================

ALTER TABLE public.gifts
ADD COLUMN IF NOT EXISTS password_version INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_gifts_is_demo ON public.gifts(is_demo);
CREATE INDEX IF NOT EXISTS idx_gifts_password_version ON public.gifts(password_version);
