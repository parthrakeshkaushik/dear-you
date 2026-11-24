-- ==============================================================================
-- DEAR YOU — MIGRATION: REPUBLISHING, DUPLICATION & DOWNLOAD AUDIT
-- ==============================================================================

-- 1. Extend gifts table with download tracking, republish tracking, and duplication provenance
ALTER TABLE public.gifts
ADD COLUMN IF NOT EXISTS download_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_downloaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS republished_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS source_gift_id UUID REFERENCES public.gifts(id) ON DELETE SET NULL;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_gifts_source_gift_id ON public.gifts(source_gift_id);
CREATE INDEX IF NOT EXISTS idx_gifts_republished_at ON public.gifts(republished_at);
CREATE INDEX IF NOT EXISTS idx_gifts_download_count ON public.gifts(download_count);

-- 3. Refresh schema permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
