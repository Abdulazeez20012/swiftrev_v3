-- Add logo_url to hospitals
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add avatar_url to users (public users table)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create profiles bucket if it doesn't exist (This might need to be done via Supabase CLI or Dashboard, but I'll provide the RPC/SQL for reference if possible)
-- For now, we assume the bucket is created manually or via a script.
