-- Seed 10 sample products
INSERT INTO public.products (name, description, image_url, price_per_litre, offer_price_per_litre, stock_quantity, is_active, featured_in_offers)
VALUES
  ('Cold-Pressed Groundnut Oil', 'Rich in antioxidants and vitamin E. Ideal for everyday cooking.', NULL, 220.00, 199.00, 150, true, true),
  ('Extra Virgin Olive Oil', 'Premium olive oil for salads and light sautéing.', NULL, 650.00, NULL, 80, true, false),
  ('Wood-Pressed Coconut Oil', 'Aromatic and pure. Great for frying and baking.', NULL, 380.00, 349.00, 120, true, false),
  ('Mustard Oil (Kachi Ghani)', 'Traditional pungent mustard oil for authentic flavors.', NULL, 240.00, 219.00, 200, true, true),
  ('Sunflower Oil', 'Light and healthy, suitable for deep frying.', NULL, 180.00, NULL, 300, true, false),
  ('Rice Bran Oil', 'Heart-healthy oil with natural oryzanol.', NULL, 200.00, 179.00, 160, true, false),
  ('Sesame (Gingelly) Oil', 'Nutty flavor; perfect for stir-fries and pickles.', NULL, 420.00, 399.00, 90, true, true),
  ('Avocado Oil', 'High smoke point and mild taste; great for grilling.', NULL, 850.00, NULL, 40, true, false),
  ('Flaxseed (Alsi) Oil', 'Omega-3 rich cold-pressed oil for dressings.', NULL, 520.00, 489.00, 60, true, false),
  ('Safflower Oil', 'Neutral taste, suitable for baking and deep frying.', NULL, 260.00, NULL, 110, true, false);


