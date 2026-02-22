-- First, create completed orders for each service to link reviews to
-- We need to use existing user_id

-- Create sample orders for all services (with status completed)
INSERT INTO orders (user_id, service_id, quantity, price, link, status, created_at, completed_at)
SELECT 
  'b61844e8-55b4-48de-8239-efb3376a4493'::uuid,
  s.id,
  1000,
  s.price,
  'https://example.com/sample',
  'completed'::order_status,
  NOW() - (random() * INTERVAL '30 days'),
  NOW() - (random() * INTERVAL '10 days')
FROM services s
WHERE s.is_active = true AND s.is_archived = false
ON CONFLICT DO NOTHING;