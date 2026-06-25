-- Create chatbot knowledge base table for storing predefined Q&A pairs
CREATE TABLE IF NOT EXISTS chatbot_kb (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Ensure unique questions
    UNIQUE(question)
);

-- Enable Row Level Security
ALTER TABLE chatbot_kb ENABLE ROW LEVEL SECURITY;

-- Create policies for chatbot_kb table
-- Admins can view, insert, update, and delete knowledge base entries
CREATE POLICY "Admins can manage chatbot knowledge base" ON chatbot_kb
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Students can only view active knowledge base entries
CREATE POLICY "Students can view active chatbot knowledge base" ON chatbot_kb
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_chatbot_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_chatbot_kb_updated_at 
    BEFORE UPDATE ON chatbot_kb 
    FOR EACH ROW 
    EXECUTE FUNCTION update_chatbot_kb_updated_at();

-- Insert sample knowledge base entries
INSERT INTO chatbot_kb (question, answer, category, is_active, created_by)
VALUES 
    ('library hours', 'The library is open from 9 AM to 9 PM, Monday to Friday.', 'facilities', true, NULL),
    ('cafeteria', 'The main cafeteria is located on the ground floor of the Student Union building.', 'facilities', true, NULL),
    ('exam schedule', 'You can find the exam schedule on the university portal under the Academics section.', 'academics', true, NULL),
    ('wifi access', 'Students can connect to the campus WiFi using their student credentials.', 'technology', true, NULL),
    ('student services', 'Student services are available in the Student Union building, room 101.', 'support', true, NULL)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON chatbot_kb TO authenticated;