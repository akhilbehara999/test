-- SQL schema for group members table in Supabase
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    group_id INTEGER REFERENCES study_groups(id) NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_email TEXT,
    user_name TEXT,
    UNIQUE(user_id, group_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

-- Enable Row Level Security (RLS)
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON group_members;

-- Create policies for the group_members table
-- Users can view members of groups they belong to
CREATE POLICY "Users can view group members" 
    ON group_members FOR SELECT 
    USING (
        -- User is a member of the group
        user_id = auth.uid() OR
        -- User is the creator of the group (check through study_groups table)
        EXISTS (
            SELECT 1 FROM study_groups 
            WHERE study_groups.id = group_members.group_id 
            AND study_groups.created_by = auth.uid()
        ) OR
        -- User is a system admin
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Users can join groups (insert their own membership)
CREATE POLICY "Users can join groups" 
    ON group_members FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can leave groups (delete their own membership)
CREATE POLICY "Users can leave groups" 
    ON group_members FOR DELETE 
    USING (auth.uid() = user_id);

-- Group admins can manage memberships in their groups
CREATE POLICY "Group admins can manage members" 
    ON group_members FOR ALL 
    USING (
        -- Group creator can manage all members
        EXISTS (
            SELECT 1 FROM study_groups 
            WHERE study_groups.id = group_members.group_id 
            AND study_groups.created_by = auth.uid()
        ) OR
        -- System admins can manage all members
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can manage all group memberships
CREATE POLICY "Admins can manage all memberships" 
    ON group_members FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    ));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON TABLE group_members TO authenticated;