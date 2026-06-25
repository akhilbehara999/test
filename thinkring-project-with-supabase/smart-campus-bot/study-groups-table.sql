-- SQL schema for study groups table in Supabase
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS study_groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    created_by_email TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    member_count INTEGER DEFAULT 1
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_study_groups_status ON study_groups(status);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_at ON study_groups(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all study groups" ON study_groups;
DROP POLICY IF EXISTS "Users can create study groups" ON study_groups;
DROP POLICY IF EXISTS "Users can update their own study groups" ON study_groups;
DROP POLICY IF EXISTS "Users can delete their own study groups" ON study_groups;
DROP POLICY IF EXISTS "Admins can manage all study groups" ON study_groups;

-- Create policies for the study_groups table
-- Users can view all study groups (public access)
CREATE POLICY "Users can view all study groups" 
    ON study_groups FOR SELECT 
    USING (true);

-- Users can create study groups
CREATE POLICY "Users can create study groups" 
    ON study_groups FOR INSERT 
    WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Users can update their own study groups
CREATE POLICY "Users can update their own study groups" 
    ON study_groups FOR UPDATE 
    USING (auth.uid() = created_by);

-- Users can delete their own study groups
CREATE POLICY "Users can delete their own study groups" 
    ON study_groups FOR DELETE 
    USING (auth.uid() = created_by);

-- Admins can manage all study groups
CREATE POLICY "Admins can manage all study groups" 
    ON study_groups FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    ));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON TABLE study_groups TO authenticated;
GRANT SELECT ON TABLE study_groups TO anon;