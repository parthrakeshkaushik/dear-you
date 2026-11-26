-- ==============================================================================
-- DEAR YOU — PERSONALIZED BACKGROUND MUSIC SYSTEM MIGRATION
-- Adds per-gift independent audio configuration, custom upload storage,
-- and the platform music library registry.
-- ==============================================================================

-- 1. Extend public.gifts table with independent per-gift music configuration
ALTER TABLE public.gifts
ADD COLUMN IF NOT EXISTS music_enabled BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS music_source TEXT DEFAULT 'library' CHECK (music_source IN ('library', 'upload', 'none')),
ADD COLUMN IF NOT EXISTS library_track_id TEXT,
ADD COLUMN IF NOT EXISTS custom_audio_storage_path TEXT,
ADD COLUMN IF NOT EXISTS custom_audio_filename TEXT,
ADD COLUMN IF NOT EXISTS audio_duration NUMERIC,
ADD COLUMN IF NOT EXISTS playback_start_time NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS playback_end_time NUMERIC,
ADD COLUMN IF NOT EXISTS loop_enabled BOOLEAN DEFAULT TRUE NOT NULL;

-- 2. Create Developer Music Library Table
CREATE TABLE IF NOT EXISTS public.music_tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Romantic', 'Birthday', 'Friendship', 'Peaceful', 'Cinematic', 'Celebration', 'Instrumental', 'Emotional')),
    duration NUMERIC NOT NULL,
    artist TEXT NOT NULL DEFAULT 'Dear You Music',
    attribution TEXT,
    audio_url TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Seed pre-approved music library tracks
INSERT INTO public.music_tracks (id, title, category, duration, artist, attribution, audio_url, description, is_active, display_order)
VALUES
    ('lib-gentle-moments', 'Gentle Moments', 'Romantic', 184, 'Dear You Originals', 'Licensed for Dear You Digital Keepsakes', '/audio/gentle-moments.mp3', 'Warm, soft acoustic piano with delicate strings for intimate love notes.', true, 1),
    ('lib-celestial-waltz', 'Celestial Waltz', 'Cinematic', 212, 'Acoustic Reverie', 'Royalty-Free Keepsake Ensemble', '/audio/celestial-waltz.mp3', 'Grand orchestral waltz evoking sweeping cinematic memories and wonder.', true, 2),
    ('lib-joyful-celebration', 'Joyful Celebration', 'Birthday', 156, 'Sunny Day Ensemble', 'Creative Commons 0 / Dear You Master', '/audio/joyful-celebration.mp3', 'Breezy acoustic guitars and uplifting chimes for celebratory milestones.', true, 3),
    ('lib-cherished-memories', 'Cherished Memories', 'Friendship', 198, 'Kindred Spirits', 'Dear You Authorized Library', '/audio/cherished-memories.mp3', 'Nostalgic folk-acoustic picking celebrating years of companionship.', true, 4),
    ('lib-serene-horizon', 'Serene Horizon', 'Peaceful', 225, 'Morning Mist', 'Dear You Authorized Library', '/audio/serene-horizon.mp3', 'Calm ambient pads and soft harp glissandos for peaceful reflections.', true, 5),
    ('lib-sparkling-fireworks', 'Sparkling Fireworks', 'Celebration', 175, 'Festive Strings Guild', 'Dear You Soundworks', '/audio/sparkling-fireworks.mp3', 'Vibrant orchestral crescendos, bells, and joyous festive harmonies.', true, 6),
    ('lib-velvet-reverie', 'Velvet Reverie', 'Instrumental', 192, 'Midnight Keys', 'Dear You Master Archive', '/audio/velvet-reverie.mp3', 'Solo acoustic grand piano with natural felt hammer resonance.', true, 7),
    ('lib-timeless-echoes', 'Timeless Echoes', 'Emotional', 204, 'Solace Strings', 'Licensed for Dear You Platform', '/audio/timeless-echoes.mp3', 'Deep expressive cello layered over soft ambient chords for heartfelt letters.', true, 8)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    duration = EXCLUDED.duration,
    artist = EXCLUDED.artist,
    audio_url = EXCLUDED.audio_url,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- 4. Create Private Storage Bucket for Custom Audio Uploads (if not present)
INSERT INTO storage.buckets (id, name, public)
VALUES ('gift-audio', 'gift-audio', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage Access Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Authenticated creators can upload custom audio'
    ) THEN
        CREATE POLICY "Authenticated creators can upload custom audio"
            ON storage.objects FOR INSERT
            WITH CHECK (
                (bucket_id = 'gift-audio' OR bucket_id = 'gifts') AND
                auth.role() = 'authenticated'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Authenticated creators can update their audio'
    ) THEN
        CREATE POLICY "Authenticated creators can update their audio"
            ON storage.objects FOR UPDATE
            USING (
                (bucket_id = 'gift-audio' OR bucket_id = 'gifts') AND
                auth.role() = 'authenticated'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Authenticated creators can delete their audio'
    ) THEN
        CREATE POLICY "Authenticated creators can delete their audio"
            ON storage.objects FOR DELETE
            USING (
                (bucket_id = 'gift-audio' OR bucket_id = 'gifts') AND
                auth.role() = 'authenticated'
            );
    END IF;
END $$;

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gifts_music_source ON public.gifts(music_source);
CREATE INDEX IF NOT EXISTS idx_gifts_library_track_id ON public.gifts(library_track_id);
CREATE INDEX IF NOT EXISTS idx_music_tracks_category ON public.music_tracks(category);
CREATE INDEX IF NOT EXISTS idx_music_tracks_is_active ON public.music_tracks(is_active);
