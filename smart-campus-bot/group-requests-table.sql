-- SQL schema for group requests table in Supabase
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS group_requests (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES study_groups(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_name TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_group_requests_group_id ON group_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_requests_user_id ON group_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_group_requests_status ON group_requests(status);

-- Enable Row Level Security (RLS)
ALTER TABLE group_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own requests" ON group_requests;
DROP POLICY IF EXISTS "Users can create requests" ON group_requests;
DROP POLICY IF EXISTS "Group admins can manage requests" ON group_requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON group_requests;

-- Create policies for the group_requests table
-- Users can view their own requests
CREATE POLICY "Users can view their own requests" 
    ON group_requests FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can create requests
CREATE POLICY "Users can create requests" 
    ON group_requests FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Group admins can manage requests for their groups
CREATE POLICY "Group admins can manage requests" 
    ON group_requests FOR ALL 
    USING (
        -- Group creator can manage requests
        EXISTS (
            SELECT 1 FROM study_groups 
            WHERE study_groups.id = group_requests.group_id 
            AND study_groups.created_by = auth.uid()
        ) OR
        -- Group admin can manage requests
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = group_requests.group_id 
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        ) OR
        -- System admins can manage all requests
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can manage all group requests
CREATE POLICY "Admins can manage all requests" 
    ON group_requests FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    ));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE group_requests TO authenticated;