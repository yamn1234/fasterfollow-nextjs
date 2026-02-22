-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'support', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create permissions table
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    module TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage permissions"
ON public.permissions
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (true);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role app_role NOT NULL,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (role, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role_permissions"
ON public.role_permissions
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view role_permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- Create service_categories table
CREATE TABLE public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.service_categories(id),
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active categories"
ON public.service_categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON public.service_categories
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create services table with SEO
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.service_categories(id),
    provider_id UUID REFERENCES public.api_providers(id),
    external_service_id TEXT,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    price NUMERIC NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 1,
    max_quantity INTEGER DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    -- SEO fields
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    canonical_url TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    twitter_title TEXT,
    twitter_description TEXT,
    twitter_image TEXT,
    is_indexable BOOLEAN DEFAULT true,
    schema_markup JSONB,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    archived_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active services"
ON public.services
FOR SELECT
USING (is_active = true AND is_archived = false);

CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create orders table with status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'in_progress', 'completed', 'partial', 'cancelled', 'refunded', 'failed');

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    service_id UUID REFERENCES public.services(id) NOT NULL,
    provider_id UUID REFERENCES public.api_providers(id),
    external_order_id TEXT,
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    link TEXT NOT NULL,
    status order_status DEFAULT 'pending',
    start_count INTEGER,
    remains INTEGER,
    refill_id TEXT,
    error_message TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders"
ON public.orders
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create transactions table
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'purchase', 'refund', 'bonus', 'manual', 'referral');

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    type transaction_type NOT NULL,
    amount NUMERIC NOT NULL,
    balance_before NUMERIC NOT NULL DEFAULT 0,
    balance_after NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    payment_method TEXT,
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions"
ON public.transactions
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create payment_gateways table
CREATE TABLE public.payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    config JSONB,
    is_active BOOLEAN DEFAULT true,
    min_amount NUMERIC DEFAULT 1,
    max_amount NUMERIC DEFAULT 10000,
    fee_percentage NUMERIC DEFAULT 0,
    fee_fixed NUMERIC DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active gateways"
ON public.payment_gateways
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage gateways"
ON public.payment_gateways
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create coupons table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create pages table (CMS)
CREATE TABLE public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    content_ar TEXT,
    is_published BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    -- SEO
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    canonical_url TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    is_indexable BOOLEAN DEFAULT true,
    schema_markup JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published pages"
ON public.pages
FOR SELECT
USING (is_published = true AND is_archived = false);

CREATE POLICY "Admins can manage pages"
ON public.pages
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create blog_categories table
CREATE TABLE public.blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    description_ar TEXT,
    seo_title TEXT,
    seo_description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active blog categories"
ON public.blog_categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage blog categories"
ON public.blog_categories
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create blog_posts table
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) NOT NULL,
    category_id UUID REFERENCES public.blog_categories(id),
    title TEXT NOT NULL,
    title_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    excerpt_ar TEXT,
    content TEXT,
    content_ar TEXT,
    featured_image TEXT,
    tags TEXT[],
    status TEXT DEFAULT 'draft',
    is_archived BOOLEAN DEFAULT false,
    -- SEO
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    canonical_url TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    twitter_title TEXT,
    twitter_description TEXT,
    is_indexable BOOLEAN DEFAULT true,
    schema_markup JSONB,
    -- Stats
    views_count INTEGER DEFAULT 0,
    reading_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published posts"
ON public.blog_posts
FOR SELECT
USING (status = 'published' AND is_archived = false);

CREATE POLICY "Admins can manage posts"
ON public.blog_posts
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create site_settings table
CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    group_name TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.site_settings
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create admin_activity_logs table
CREATE TABLE public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL,
    module TEXT,
    target_id TEXT,
    target_type TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert activity logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Create referrals table
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES auth.users(id) NOT NULL,
    referred_id UUID REFERENCES auth.users(id) NOT NULL,
    commission_rate NUMERIC DEFAULT 0.05,
    total_earnings NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (referrer_id, referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Admins can manage referrals"
ON public.referrals
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_ar TEXT,
    content TEXT,
    content_ar TEXT,
    type TEXT DEFAULT 'info',
    is_active BOOLEAN DEFAULT true,
    show_on_homepage BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active announcements"
ON public.announcements
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage announcements"
ON public.announcements
FOR ALL
USING (public.is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_service_categories_updated_at
BEFORE UPDATE ON public.service_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_gateways_updated_at
BEFORE UPDATE ON public.payment_gateways
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions
INSERT INTO public.permissions (name, description, module) VALUES
('users.view', 'View users', 'users'),
('users.create', 'Create users', 'users'),
('users.edit', 'Edit users', 'users'),
('users.delete', 'Delete users', 'users'),
('orders.view', 'View orders', 'orders'),
('orders.edit', 'Edit orders', 'orders'),
('orders.refund', 'Refund orders', 'orders'),
('services.view', 'View services', 'services'),
('services.create', 'Create services', 'services'),
('services.edit', 'Edit services', 'services'),
('services.delete', 'Delete services', 'services'),
('providers.view', 'View providers', 'providers'),
('providers.manage', 'Manage providers', 'providers'),
('payments.view', 'View payments', 'payments'),
('payments.manage', 'Manage payments', 'payments'),
('content.view', 'View content', 'content'),
('content.manage', 'Manage content', 'content'),
('blog.view', 'View blog', 'blog'),
('blog.manage', 'Manage blog', 'blog'),
('settings.view', 'View settings', 'settings'),
('settings.manage', 'Manage settings', 'settings'),
('reports.view', 'View reports', 'reports');