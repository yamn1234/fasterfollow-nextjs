-- Drop existing admin policy and recreate with proper INSERT support
DROP POLICY IF EXISTS "Admins can manage posts" ON blog_posts;

-- Create separate policies for each operation
CREATE POLICY "Admins can select posts" 
ON blog_posts 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert posts" 
ON blog_posts 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update posts" 
ON blog_posts 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete posts" 
ON blog_posts 
FOR DELETE 
USING (is_admin(auth.uid()));