-- ==============================================================================
-- DEAR YOU — MIGRATION: MEMORY WALL & INTERACTIVE PHOTO GALLERY ENHANCEMENTS
-- ==============================================================================

-- 1. Add frame styling and positioning attributes to memories table
ALTER TABLE public.memories
ADD COLUMN IF NOT EXISTS frame_style TEXT DEFAULT 'polaroid',
ADD COLUMN IF NOT EXISTS frame_size TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS rotation NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS position_x NUMERIC,
ADD COLUMN IF NOT EXISTS position_y NUMERIC;

-- 2. Add memory wall configuration to gifts table
ALTER TABLE public.gifts
ADD COLUMN IF NOT EXISTS memory_wall_config JSONB DEFAULT '{"layout_mode":"both","enable_hanging_effect":true}'::jsonb;
