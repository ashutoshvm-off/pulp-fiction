-- Admin Features for Pulp Fiction
-- Run this in your Supabase SQL Editor to enable admin functionality

-- Create products_admin table to manage product pricing and availability
CREATE TABLE IF NOT EXISTS products_admin (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table to manage admin roles
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin', -- 'admin', 'super_admin'
  permissions TEXT[], -- array of permissions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE products_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view products" ON products_admin;
DROP POLICY IF EXISTS "Admins can update products" ON products_admin;
DROP POLICY IF EXISTS "Admins can insert products" ON products_admin;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Allow admins to view and update products
CREATE POLICY "Admins can view products" ON products_admin
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

CREATE POLICY "Admins can update products" ON products_admin
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

CREATE POLICY "Admins can insert products" ON products_admin
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users)
  );

-- Allow admins to view all orders (override existing RLS)
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users) OR profile_id = auth.uid()
  );

-- Allow admins to update orders
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

-- Allow admins to view all order items
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users) OR
    order_id IN (SELECT id FROM orders WHERE profile_id = auth.uid())
  );

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users) OR id = auth.uid()
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_products_admin_updated_at ON products_admin(updated_at DESC);

-- Function to grant admin access to a user
CREATE OR REPLACE FUNCTION grant_admin_access(user_email TEXT)
RETURNS void AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID from email
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert into admin_users table
  INSERT INTO admin_users (id, role, permissions)
  VALUES (user_id, 'admin', ARRAY['view_orders', 'update_orders', 'manage_products'])
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    permissions = ARRAY['view_orders', 'update_orders', 'manage_products'],
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke admin access
CREATE OR REPLACE FUNCTION revoke_admin_access(user_email TEXT)
RETURNS void AS $$
BEGIN
  DELETE FROM admin_users 
  WHERE id IN (SELECT id FROM auth.users WHERE email = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To grant admin access to a user, run:
-- SELECT grant_admin_access('user@example.com');
--
-- To revoke admin access, run:
-- SELECT revoke_admin_access('user@example.com');
