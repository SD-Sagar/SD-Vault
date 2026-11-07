-- ==============================================================================
-- SD-Vault Supabase Database Schema & Row Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Vault Favorites Table
CREATE TABLE IF NOT EXISTS public.vault_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, file_id)
);

-- Enable RLS on favorites
ALTER TABLE public.vault_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own favorites
CREATE POLICY "Users can view own favorites"
    ON public.vault_favorites
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
    ON public.vault_favorites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
    ON public.vault_favorites
    FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Vault Activity Log Table
CREATE TABLE IF NOT EXISTS public.vault_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- e.g. 'upload', 'delete', 'rename', 'reconnect'
    item_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on activity
ALTER TABLE public.vault_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own activity
CREATE POLICY "Users can view own activity"
    ON public.vault_activity
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own activity
CREATE POLICY "Users can insert own activity"
    ON public.vault_activity
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_vault_favorites_user_id ON public.vault_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_activity_user_id ON public.vault_activity(user_id, created_at DESC);

