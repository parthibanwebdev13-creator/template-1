-- Add litres_per_unit column to products table
ALTER TABLE public.products
ADD COLUMN litres_per_unit DECIMAL(10,2) NOT NULL DEFAULT 1.0;

-- Add comment to explain the column
COMMENT ON COLUMN public.products.litres_per_unit IS 'Amount of litres contained in one unit of this product (e.g., 1.0 for 1L bottle, 0.5 for 500ml bottle)';

