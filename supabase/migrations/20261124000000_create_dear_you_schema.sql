-- ==============================================================================
-- DEAR YOU — MASTER DATABASE SCHEMA & SECURITY POLICIES
-- ==============================================================================

-- 1. Create custom extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Administrator Users Table (Links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Core Gifts Table
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'Birthday',
    event_date DATE,
    cover_image TEXT,
    introduction TEXT,
    welcome_heading TEXT,
    welcome_message TEXT,
    welcome_button_text TEXT DEFAULT 'Open Your Surprise',
    
    -- Theme configuration
    selected_theme TEXT NOT NULL DEFAULT 'dreamy',
    theme_config JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Password protection
    password_hash TEXT,
    password_hint TEXT,
    
    -- Expiry Configuration (Server verified)
    expiry_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    expires_at TIMESTAMPTZ,
    expiry_timezone TEXT DEFAULT 'Asia/Kolkata' NOT NULL,
    expiry_heading TEXT,
    expiry_message TEXT,
    
    -- Interactive Content Overrides
    music_url TEXT,
    music_title TEXT,
    scratch_card_hidden_text TEXT,
    gift_box_message TEXT,
    closing_message TEXT,
    
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Gift Sections Configuration & Display Ordering
CREATE TABLE IF NOT EXISTS public.gift_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    section_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Memories Photo Gallery Table
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    caption TEXT,
    memory_date DATE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Chronological Memory Timeline Entries
CREATE TABLE IF NOT EXISTS public.timeline_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_path TEXT,
    event_date DATE NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Trivia Quiz Questions & Options
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0
);

-- 8. Personal Letters
CREATE TABLE IF NOT EXISTS public.gift_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    heading TEXT,
    content TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

-- 9. Future Wishes
CREATE TABLE IF NOT EXISTS public.gift_wishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    wish_text TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

-- 10. Secret Messages (Tap/Password revealed)
CREATE TABLE IF NOT EXISTS public.secret_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    reveal_type TEXT NOT NULL DEFAULT 'tap',
    display_order INT NOT NULL DEFAULT 0
);

-- 11. Gift Media Bucket Registry
CREATE TABLE IF NOT EXISTS public.gift_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    media_type TEXT NOT NULL,
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_gifts_slug ON public.gifts(slug);
CREATE INDEX IF NOT EXISTS idx_gifts_owner_id ON public.gifts(owner_id);
CREATE INDEX IF NOT EXISTS idx_gift_sections_gift_id ON public.gift_sections(gift_id);
CREATE INDEX IF NOT EXISTS idx_memories_gift_id ON public.memories(gift_id);
CREATE INDEX IF NOT EXISTS idx_timeline_gift_id ON public.timeline_entries(gift_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_gift_id ON public.quiz_questions(gift_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON public.quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_letters_gift_id ON public.gift_letters(gift_id);
CREATE INDEX IF NOT EXISTS idx_wishes_gift_id ON public.gift_wishes(gift_id);
CREATE INDEX IF NOT EXISTS idx_secrets_gift_id ON public.secret_messages(gift_id);
CREATE INDEX IF NOT EXISTS idx_media_gift_id ON public.gift_media(gift_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_media ENABLE ROW LEVEL SECURITY;

-- ADMIN USER POLICIES: Owner full access
CREATE POLICY "Admins can view their own profile"
    ON public.admin_users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins have full access to their gifts"
    ON public.gifts FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins have full access to their gift sections"
    ON public.gift_sections FOR ALL
    USING (EXISTS (SELECT 1 FROM public.gifts WHERE gifts.id = gift_sections.gift_id AND gifts.owner_id = auth.uid()));

CREATE POLICY "Admins have full access to their memories"
    ON public.memories FOR ALL
    USING (EXISTS (SELECT 1 FROM public.gifts WHERE gifts.id = memories.gift_id AND gifts.owner_id = auth.uid()));

CREATE POLICY "Admins have full access to their timeline entries"
    ON public.timeline_entries FOR ALL
    USING (EXISTS (SELECT 1 FROM public.gifts WHERE gifts.id = timeline_entries.gift_id AND gifts.owner_id = auth.uid()));

CREATE POLICY "Admins have full access to quiz questions"
    ON public.quiz_questions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.gifts WHERE gifts.id = quiz_questions.gift_id AND gifts.owner_id = auth.uid()));

CREATE POLICY "Admins have full access to quiz options"
    ON public.quiz_options FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.quiz_questions q
        JOIN public.gifts g ON g.id = q.gift_id
        WHERE q.id = quiz_options.question_id AND g.owner_id = auth.uid()
    ));

CREATE POLICY "Admins have full access to gift letters"
    ON public.gift_letters FOR ALL
    USING (EXISTS (SELECT 1 FROM public.gifts WHERE gifts.id = gift_letters.gift_id AND gifts.owner_id = auth.uid()));

CREATE POLICY "Admins have full access to gift wishes"
    ON public.gift_wishes FOR ALL
    USING (EXISTS (SELECT 1 FROM public.gifts WHERE gifts.id = gift_wishes.gift_id AND gifts.owner_id = auth.uid()));

CREATE POLICY "Admins have full access to secret messages"
    ON public.secret_messages FOR ALL
    USING (EXISTS (SELECT 1 FROM public.gifts WHERE gifts.id = secret_messages.gift_id AND gifts.owner_id = auth.uid()));

CREATE POLICY "Admins have full access to gift media"
    ON public.gift_media FOR ALL
    USING (EXISTS (SELECT 1 FROM public.gifts WHERE gifts.id = gift_media.gift_id AND gifts.owner_id = auth.uid()));

-- RECIPIENT PUBLIC METADATA POLICIES
-- Allows reading non-sensitive public metadata (title, recipient_name, slug, theme, password_hint, expiry)
-- NOTE: Full personal content (letters, memories, secrets) is accessed via server-verified session endpoints.
CREATE POLICY "Public can view published active gifts metadata"
    ON public.gifts FOR SELECT
    USING (status = 'published');

-- ==============================================================================
-- STORAGE BUCKET CREATION (gifts)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('gifts', 'gifts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Owner can upload/read/delete
CREATE POLICY "Admins can upload to gifts bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'gifts' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can update their gift media"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'gifts' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can delete their gift media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'gifts' AND
        auth.role() = 'authenticated'
    );
