-- Create storage bucket for product images
-- This migration ensures the product-images bucket exists

-- First, check if bucket exists and create if it doesn't
DO $$
BEGIN
    -- Check if the bucket already exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE id = 'product-images'
    ) THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'product-images', 
            'product-images', 
            true,
            5242880, -- 5MB file size limit
            ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        );
    END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Create RLS policies for product images
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'));
