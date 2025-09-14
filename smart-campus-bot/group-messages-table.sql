-- SQL schema for group messages table in Supabase
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS group_messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES study_groups(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_email TEXT,
    user_name TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_user_id ON group_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view group messages" ON group_messages;
DROP POLICY IF EXISTS "Users can send messages" ON group_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON group_messages;
DROP POLICY IF EXISTS "Group admins can manage messages" ON group_messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON group_messages;

-- Create policies for the group_messages table
-- Users can view messages in groups they belong to
CREATE POLICY "Users can view group messages" 
    ON group_messages FOR SELECT 
    USING (
        -- User is a member of the group
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = group_messages.group_id 
            AND group_members.user_id = auth.uid()
        ) OR
        -- User is the creator of the group (check through study_groups table)
        EXISTS (
            SELECT 1 FROM study_groups 
            WHERE study_groups.id = group_messages.group_id 
            AND study_groups.created_by = auth.uid()
        ) OR
        -- User is a system admin
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Users can send messages to groups they belong to
CREATE POLICY "Users can send messages" 
    ON group_messages FOR INSERT 
    WITH CHECK (
        -- User is a member of the group
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = group_messages.group_id 
            AND group_members.user_id = auth.uid()
        ) OR
        -- User is the creator of the group (check through study_groups table)
        EXISTS (
            SELECT 1 FROM study_groups 
            WHERE study_groups.id = group_messages.group_id 
            AND study_groups.created_by = auth.uid()
        )
    );

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" 
    ON group_messages FOR DELETE 
    USING (auth.uid() = user_id);

-- Group admins can manage messages in their groups
CREATE POLICY "Group admins can manage messages" 
    ON group_messages FOR ALL 
    USING (
        -- Group creator can manage all messages
        EXISTS (
            SELECT 1 FROM study_groups 
            WHERE study_groups.id = group_messages.group_id 
            AND study_groups.created_by = auth.uid()
        ) OR
        -- Group admin can manage messages
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = group_messages.group_id 
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        ) OR
        -- System admins can manage all messages
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can manage all group messages
CREATE POLICY "Admins can manage all messages" 
    ON group_messages FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    ));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE group_messages TO authenticated;