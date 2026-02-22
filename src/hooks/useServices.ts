import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceCategory {
  id: string;
  name: string;
  name_ar: string | null;
  icon: string | null;
  image_url: string | null;
  slug: string;
}

export interface Service {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: number;
  min_quantity: number | null;
  max_quantity: number | null;
  category_id: string | null;
  slug: string;
  requires_comments: boolean | null;
  delivery_time: string | null;
  category?: ServiceCategory;
}

export const useServices = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesRes, servicesRes] = await Promise.all([
        supabase
          .from('service_categories')
          .select('id, name, name_ar, icon, image_url, slug')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('services')
          .select(`
            id, name, name_ar, description, description_ar, 
            price, min_quantity, max_quantity, category_id, slug, requires_comments, delivery_time,
            service_categories(id, name, name_ar, icon, image_url, slug)
          `)
          .eq('is_active', true)
          .eq('is_archived', false)
          .order('sort_order')
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (servicesRes.error) throw servicesRes.error;

      setCategories(categoriesRes.data || []);
      setServices(
        (servicesRes.data || []).map((s: any) => ({
          ...s,
          category: s.service_categories
        }))
      );
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getServicesByCategory = (categoryId: string | null) => {
    if (!categoryId) return services;
    return services.filter(s => s.category_id === categoryId);
  };

  const getServiceById = (id: string) => {
    return services.find(s => s.id === id);
  };

  const getServiceBySlug = (slug: string) => {
    return services.find(s => s.slug === slug);
  };

  return {
    categories,
    services,
    loading,
    error,
    refetch: fetchData,
    getServicesByCategory,
    getServiceById,
    getServiceBySlug
  };
};
