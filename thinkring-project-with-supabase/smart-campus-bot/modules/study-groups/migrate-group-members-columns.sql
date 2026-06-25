-- Migration script to add user_email and user_name columns to existing group_members table
-- Run this in the Supabase SQL editor

-- Add the new columns to the group_members table
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_group_members_user_email ON group_members(user_email);
CREATE INDEX IF NOT EXISTS idx_group_members_user_name ON group_members(user_name);

-- Update existing records with user information (conceptual - would need to be done programmatically)
-- This is just a placeholder to show what you might do
-- In practice, you would need to run a script that:
-- 1. Gets all group members
-- 2. For each member, looks up their user information from the auth schema
-- 3. Updates their record with the email and name

-- Example of how you might update a specific group member (run this for each member):
-- UPDATE group_members 
-- SET user_email = (SELECT email FROM auth.users WHERE id = group_members.user_id),
--     user_name = (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = group_members.user_id)
-- WHERE user_email IS NULL AND user_name IS NULL AND user_id = 'SPECIFIC_USER_ID';