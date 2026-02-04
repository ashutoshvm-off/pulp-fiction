-- Admin Authentication and Management
-- Run this in your Supabase SQL Editor

-- Drop existing table if it has wrong column names
DROP TABLE IF EXISTS admin_audit_log;
DROP TABLE IF EXISTS admin_credentials;

-- Create admin_credentials table
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- In production, use proper password hashing!
  name TEXT NOT NULL,
  email TEXT,
  can_manage_admins BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_credentials_admin_id ON admin_credentials(admin_id);

-- Enable RLS
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow login" ON admin_credentials;
DROP POLICY IF EXISTS "Allow public select" ON admin_credentials;
DROP POLICY IF EXISTS "Allow public read" ON admin_credentials;

-- Allow public/anon select for login (TO public means all roles including anon)
CREATE POLICY "Allow public read" ON admin_credentials
  FOR SELECT TO public USING (true);

-- Allow insert for adding new admins
DROP POLICY IF EXISTS "Allow insert for admins" ON admin_credentials;
DROP POLICY IF EXISTS "Allow public insert" ON admin_credentials;
CREATE POLICY "Allow public insert" ON admin_credentials
  FOR INSERT TO public WITH CHECK (true);

-- Allow update for password changes
DROP POLICY IF EXISTS "Allow public update" ON admin_credentials;
CREATE POLICY "Allow public update" ON admin_credentials
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Allow delete for removing admins
DROP POLICY IF EXISTS "Allow public delete" ON admin_credentials;
CREATE POLICY "Allow public delete" ON admin_credentials
  FOR DELETE TO public USING (true);

-- Create initial super admin (default credentials)
-- Admin ID: admin
-- Password: admin123
-- Change these immediately in production!
INSERT INTO admin_credentials (admin_id, password, name, email, can_manage_admins)
VALUES ('admin', 'admin123', 'Super Admin', 'admin@pulpfiction.com', true)
ON CONFLICT (admin_id) DO NOTHING;

-- Audit log table (optional)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_credentials(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- IMPORTANT NOTES:
-- 1. Change the default admin password immediately!
--    UPDATE admin_credentials SET password = 'your_secure_password' WHERE admin_id = 'admin';
--
-- 2. In production, implement proper password hashing (bcrypt, scrypt, etc.)
--    The current plaintext storage is only for development!
