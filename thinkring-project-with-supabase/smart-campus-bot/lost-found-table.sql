-- SQL schema for lost and found items table in Supabase
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS lost_found_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('lost', 'found')) NOT NULL,
    category TEXT,
    date DATE NOT NULL,
    location TEXT,
    contact TEXT,
    image_url TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reported_by TEXT,
    user_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'resolved', 'rejected')),
    is_flagged BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lost_found_type ON lost_found_items(type);
CREATE INDEX IF NOT EXISTS idx_lost_found_status ON lost_found_items(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_category ON lost_found_items(category);
CREATE INDEX IF NOT EXISTS idx_lost_found_date ON lost_found_items(date);
CREATE INDEX IF NOT EXISTS idx_lost_found_user_id ON lost_found_items(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;

-- Create policies for the lost_found_items table
-- Users can view all items (public access)
CREATE POLICY "Users can view all lost and found items" 
    ON lost_found_items FOR SELECT 
    USING (true);

-- Users can insert their own items
CREATE POLICY "Users can insert their own lost and found items" 
    ON lost_found_items FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own items
CREATE POLICY "Users can update their own lost and found items" 
    ON lost_found_items FOR UPDATE 
    USING (auth.uid() = user_id);

-- Users can delete their own items
CREATE POLICY "Users can delete their own lost and found items" 
    ON lost_found_items FOR DELETE 
    USING (auth.uid() = user_id);

-- Admins can manage all items
CREATE POLICY "Admins can manage all lost and found items" 
    ON lost_found_items FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    ));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON TABLE lost_found_items TO authenticated;
GRANT SELECT ON TABLE lost_found_items TO anon;