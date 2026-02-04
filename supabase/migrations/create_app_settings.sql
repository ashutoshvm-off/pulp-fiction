-- Create app_settings table for storing configuration like fees
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default fees
INSERT INTO app_settings (key, value) VALUES (
    'extra_fees',
    '{
        "shipping_fee": 50,
        "packaging_fee": 10,
        "handling_fee": 0,
        "tax_percentage": 0,
        "free_shipping_threshold": 500,
        "is_active": true
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access for all authenticated users
CREATE POLICY "Allow read access" ON app_settings
    FOR SELECT USING (true);

-- Allow update only for admin users (you may need to adjust this based on your auth setup)
CREATE POLICY "Allow admin update" ON app_settings
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'email' IN ('admin@pulpfiction.com') -- Add your admin emails
    );
