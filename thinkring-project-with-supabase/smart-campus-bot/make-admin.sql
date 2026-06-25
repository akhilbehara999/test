-- SQL script to make akhilbehara97@gmail.com an admin
-- Run this in the Supabase SQL editor after the user has signed up

-- First, find the user ID for akhilbehara97@gmail.com
-- Then update their role to 'admin'

UPDATE users 
SET role = 'admin' 
WHERE email = 'akhilbehara97@gmail.com';

-- If the user doesn't exist in the users table yet, insert them
INSERT INTO users (id, email, username, role)
SELECT 
    id, 
    'akhilbehara97@gmail.com', 
    'Akhil Behara', 
    'admin'
FROM auth.users 
WHERE email = 'akhilbehara97@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'akhilbehara97@gmail.com'
);

-- Also update the auth.users metadata if needed
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"admin"'
) 
WHERE email = 'akhilbehara97@gmail.com';