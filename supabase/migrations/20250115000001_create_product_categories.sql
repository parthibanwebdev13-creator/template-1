-- Create product_categories table
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add category_id column to products table
ALTER TABLE public.products
ADD COLUMN category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL;

-- Enable RLS on product_categories table
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_categories
-- Allow all users to read active categories
CREATE POLICY "Anyone can view active categories" ON public.product_categories
  FOR SELECT USING (is_active = true);

-- Allow only admins to manage categories
CREATE POLICY "Only admins can insert categories" ON public.product_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update categories" ON public.product_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete categories" ON public.product_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert some sample categories
INSERT INTO public.product_categories (name, slug, description) VALUES
  ('Engine Oil', 'engine-oil', 'High-quality engine oils for various vehicle types'),
  ('Transmission Oil', 'transmission-oil', 'Transmission fluids for smooth gear shifting'),
  ('Hydraulic Oil', 'hydraulic-oil', 'Hydraulic fluids for industrial and automotive applications'),
  ('Gear Oil', 'gear-oil', 'Specialized gear oils for differentials and gearboxes'),
  ('Brake Fluid', 'brake-fluid', 'Brake fluids for optimal braking performance'),
  ('Coolant', 'coolant', 'Engine coolants and antifreeze solutions'),
  ('Grease', 'grease', 'Lubricating greases for various applications'),
  ('Fuel Additives', 'fuel-additives', 'Additives to improve fuel efficiency and engine performance');
