-- Create API configuration table for storing AI service configurations
CREATE TABLE IF NOT EXISTS api_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_name VARCHAR(50) NOT NULL, -- e.g., 'quiz', 'code-explainer', 'book'
    api_provider VARCHAR(100) NOT NULL, -- e.g., 'OpenRouter', 'OpenAI'
    api_endpoint TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL, -- Store encrypted API keys for security
    model_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Ensure only one active config per module per provider
    UNIQUE(module_name, api_provider, is_active)
);

-- Enable Row Level Security
ALTER TABLE api_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for api_configs table
-- Admins can view, insert, update, and delete configurations
CREATE POLICY "Admins can manage API configs" ON api_configs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Students can only view active configurations
CREATE POLICY "Students can view active API configs" ON api_configs
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_api_configs_updated_at 
    BEFORE UPDATE ON api_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration for quiz module
INSERT INTO api_configs (module_name, api_provider, api_endpoint, api_key_encrypted, model_name, is_active, created_by)
VALUES 
    ('quiz', 'OpenRouter', 'https://openrouter.ai/api/v1/chat/completions', 'PLACEHOLDER_ENCRYPTED_KEY', 'openai/gpt-oss-20b:free', true, NULL)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON api_configs TO authenticated;