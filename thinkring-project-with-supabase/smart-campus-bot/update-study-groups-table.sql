-- SQL script to update study groups table with new fields for the requested features
-- Run this in the Supabase SQL editor

-- Add visibility column to study_groups table
ALTER TABLE study_groups 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

-- Add updated_at column to study_groups table
ALTER TABLE study_groups 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add current_admin column to study_groups table for ownership transfer
ALTER TABLE study_groups 
ADD COLUMN IF NOT EXISTS current_admin UUID REFERENCES auth.users(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_study_groups_visibility ON study_groups(visibility);
CREATE INDEX IF NOT EXISTS idx_study_groups_current_admin ON study_groups(current_admin);

-- Update existing groups to set current_admin to created_by
UPDATE study_groups 
SET current_admin = created_by 
WHERE current_admin IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS update_study_groups_updated_at ON study_groups;
CREATE TRIGGER update_study_groups_updated_at 
    BEFORE UPDATE ON study_groups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();