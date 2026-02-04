-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow public read access to product images
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow anyone to upload product images (admin validation done at app level)
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

-- Allow anyone to update product images
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
CREATE POLICY "Anyone can update product images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'product-images');

-- Allow anyone to delete product images
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;
CREATE POLICY "Anyone can delete product images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'product-images');

-- Create products table to store product data in database
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image TEXT, -- URL to image in Supabase Storage
  category TEXT NOT NULL DEFAULT 'juice',
  ingredients TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  is_best_seller BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read access to products
DROP POLICY IF EXISTS "Public read access for products" ON products;
CREATE POLICY "Public read access for products"
ON products FOR SELECT
TO public
USING (true);

-- Anyone can insert products (admin validation done at app level)
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
CREATE POLICY "Anyone can insert products"
ON products FOR INSERT
TO public
WITH CHECK (true);

-- Anyone can update products (admin validation done at app level)
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
CREATE POLICY "Anyone can update products"
ON products FOR UPDATE
TO public
USING (true);

-- Anyone can delete products (admin validation done at app level)
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;
CREATE POLICY "Anyone can delete products"
ON products FOR DELETE
TO public
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_product_updated_at();
