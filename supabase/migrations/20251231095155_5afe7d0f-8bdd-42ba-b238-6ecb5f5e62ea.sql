-- Add admin policy for viewing all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Add admin policy for updating all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Fix the orders RLS - ensure admins can read all orders
-- First check if there's already an admin select policy on orders
-- We need to add this since the existing ALL policy might not work for select
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Add admin policy for transactions
CREATE POLICY "Users can create transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert any transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));