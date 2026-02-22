export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          module: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string | null
          content_ar: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          show_on_homepage: boolean | null
          starts_at: string | null
          title: string
          title_ar: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          content_ar?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          show_on_homepage?: boolean | null
          starts_at?: string | null
          title: string
          title_ar?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          content_ar?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          show_on_homepage?: boolean | null
          starts_at?: string | null
          title?: string
          title_ar?: string | null
          type?: string | null
        }
        Relationships: []
      }
      api_providers: {
        Row: {
          api_key: string
          api_url: string
          balance: number | null
          created_at: string
          currency: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          api_url: string
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          api_url?: string
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          archived_at: string | null
          author_id: string
          canonical_url: string | null
          category_id: string | null
          content: string | null
          content_ar: string | null
          created_at: string
          excerpt: string | null
          excerpt_ar: string | null
          featured_image: string | null
          id: string
          is_archived: boolean | null
          is_indexable: boolean | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          published_at: string | null
          reading_time: number | null
          scheduled_at: string | null
          schema_markup: Json | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          title_ar: string | null
          twitter_description: string | null
          twitter_title: string | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          archived_at?: string | null
          author_id: string
          canonical_url?: string | null
          category_id?: string | null
          content?: string | null
          content_ar?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_ar?: string | null
          featured_image?: string | null
          id?: string
          is_archived?: boolean | null
          is_indexable?: boolean | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_at?: string | null
          schema_markup?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          title_ar?: string | null
          twitter_description?: string | null
          twitter_title?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          archived_at?: string | null
          author_id?: string
          canonical_url?: string | null
          category_id?: string | null
          content?: string | null
          content_ar?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_ar?: string | null
          featured_image?: string | null
          id?: string
          is_archived?: boolean | null
          is_indexable?: boolean | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_at?: string | null
          schema_markup?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          twitter_description?: string | null
          twitter_title?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_settings: {
        Row: {
          bonus_percentage: number
          created_at: string
          id: string
          is_active: boolean
          min_amount: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          bonus_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_amount?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          bonus_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_amount?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          amount: number
          coupon_id: string
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          coupon_id: string
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          coupon_id?: string
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          balance_amount: number | null
          code: string
          coupon_type: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          uses_count: number | null
        }
        Insert: {
          balance_amount?: number | null
          code: string
          coupon_type?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          uses_count?: number | null
        }
        Update: {
          balance_amount?: number | null
          code?: string
          coupon_type?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          uses_count?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          comments: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          external_order_id: string | null
          id: string
          ip_address: string | null
          link: string
          order_number: number
          price: number
          provider_id: string | null
          quantity: number
          refill_id: string | null
          remains: number | null
          service_id: string
          start_count: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          external_order_id?: string | null
          id?: string
          ip_address?: string | null
          link: string
          order_number?: number
          price: number
          provider_id?: string | null
          quantity: number
          refill_id?: string | null
          remains?: number | null
          service_id: string
          start_count?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          external_order_id?: string | null
          id?: string
          ip_address?: string | null
          link?: string
          order_number?: number
          price?: number
          provider_id?: string | null
          quantity?: number
          refill_id?: string | null
          remains?: number | null
          service_id?: string
          start_count?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "api_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          archived_at: string | null
          canonical_url: string | null
          content: string | null
          content_ar: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          is_indexable: boolean | null
          is_published: boolean | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          published_at: string | null
          schema_markup: Json | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          canonical_url?: string | null
          content?: string | null
          content_ar?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_indexable?: boolean | null
          is_published?: boolean | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          published_at?: string | null
          schema_markup?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          canonical_url?: string | null
          content?: string | null
          content_ar?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_indexable?: boolean | null
          is_published?: boolean | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          published_at?: string | null
          schema_markup?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      password_resets: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          ip_address: string | null
          used: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          ip_address?: string | null
          used?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          used?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          config: Json | null
          created_at: string
          fee_fixed: number | null
          fee_percentage: number | null
          gateway_type: string | null
          id: string
          image_url: string | null
          instructions: string | null
          instructions_ar: string | null
          is_active: boolean | null
          max_amount: number | null
          min_amount: number | null
          name: string
          redirect_url: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          fee_fixed?: number | null
          fee_percentage?: number | null
          gateway_type?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          instructions_ar?: string | null
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name: string
          redirect_url?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          fee_fixed?: number | null
          fee_percentage?: number | null
          gateway_type?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          instructions_ar?: string | null
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          redirect_url?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          created_at: string
          full_name: string | null
          id: string
          is_suspended: boolean
          suspended_at: string | null
          suspension_reason: string | null
          two_factor_backup_codes: string[] | null
          two_factor_enabled: boolean
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          suspended_at?: string | null
          suspension_reason?: string | null
          two_factor_backup_codes?: string[] | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          suspended_at?: string | null
          suspension_reason?: string | null
          two_factor_backup_codes?: string[] | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_rate: number | null
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          status: string | null
          total_earnings: number | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          status?: string | null
          total_earnings?: number | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string | null
          total_earnings?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_note: string | null
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          is_rejected: boolean | null
          order_id: string
          rating: number
          service_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_rejected?: boolean | null
          order_id: string
          rating: number
          service_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_rejected?: boolean | null
          order_id?: string
          rating?: number
          service_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_ar: string | null
          parent_id: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          parent_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          parent_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          archived_at: string | null
          average_rating: number | null
          canonical_url: string | null
          category_id: string | null
          created_at: string
          delivery_time: string | null
          description: string | null
          description_ar: string | null
          external_service_id: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_archived: boolean | null
          is_indexable: boolean | null
          max_quantity: number | null
          min_quantity: number | null
          name: string
          name_ar: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          price: number
          provider_id: string | null
          requires_comments: boolean | null
          reviews_count: number | null
          schema_markup: Json | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          sort_order: number | null
          twitter_description: string | null
          twitter_image: string | null
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          average_rating?: number | null
          canonical_url?: string | null
          category_id?: string | null
          created_at?: string
          delivery_time?: string | null
          description?: string | null
          description_ar?: string | null
          external_service_id?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_archived?: boolean | null
          is_indexable?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          name: string
          name_ar?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          price?: number
          provider_id?: string | null
          requires_comments?: boolean | null
          reviews_count?: number | null
          schema_markup?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          average_rating?: number | null
          canonical_url?: string | null
          category_id?: string | null
          created_at?: string
          delivery_time?: string | null
          description?: string | null
          description_ar?: string | null
          external_service_id?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_archived?: boolean | null
          is_indexable?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string
          name_ar?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          price?: number
          provider_id?: string | null
          requires_comments?: boolean | null
          reviews_count?: number | null
          schema_markup?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "api_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          group_name: string | null
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          group_name?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          group_name?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      ticket_replies: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          payment_method: string | null
          payment_reference: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          ip_address: string | null
          used: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          ip_address?: string | null
          used?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          used?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_password_resets: { Args: never; Returns: undefined }
      cleanup_expired_two_factor_codes: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "support" | "user"
      order_status:
        | "pending"
        | "processing"
        | "in_progress"
        | "completed"
        | "partial"
        | "cancelled"
        | "refunded"
        | "failed"
      transaction_type:
        | "deposit"
        | "purchase"
        | "refund"
        | "bonus"
        | "manual"
        | "referral"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "support", "user"],
      order_status: [
        "pending",
        "processing",
        "in_progress",
        "completed",
        "partial",
        "cancelled",
        "refunded",
        "failed",
      ],
      transaction_type: [
        "deposit",
        "purchase",
        "refund",
        "bonus",
        "manual",
        "referral",
      ],
    },
  },
} as const
