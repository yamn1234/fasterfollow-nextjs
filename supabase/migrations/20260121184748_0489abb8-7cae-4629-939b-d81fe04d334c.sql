-- Add order_number column to orders table with proper sequence
ALTER TABLE public.orders ADD COLUMN order_number INTEGER;

-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START WITH 1001;

-- Set default value for new orders
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT nextval('orders_order_number_seq');

-- Update existing orders with sequential numbers based on creation date
WITH numbered_orders AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) + 1000 as new_number
  FROM public.orders
)
UPDATE public.orders o
SET order_number = no.new_number
FROM numbered_orders no
WHERE o.id = no.id;

-- Update the sequence to continue from the max order number
SELECT setval('orders_order_number_seq', COALESCE((SELECT MAX(order_number) FROM public.orders), 1000) + 1);

-- Make order_number NOT NULL after populating
ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;

-- Create unique index
CREATE UNIQUE INDEX idx_orders_order_number ON public.orders(order_number);