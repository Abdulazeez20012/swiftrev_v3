-- Add RLS Policies for the users table
-- This ensures that users can at least see their own records after authentication.

-- 1. Enable RLS (already done, but safe to repeat)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they somehow exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Public lookup" ON users;

-- 3. Create a policy that allows anyone to lookup by email (needed for initial login check if not using service role)
-- Actually, we'll make it smarter: users can see their own profile.
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (
    email = auth.email() OR id = auth.uid()
);

-- 4. Create a policy for Super Admins
CREATE POLICY "Admins can view all profiles" ON users
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM roles 
        WHERE id = (SELECT role_id FROM users WHERE id = auth.uid()) 
        AND name = 'super_admin'
    )
);

-- 5. Grant necessary permissions
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON hospitals TO authenticated;
