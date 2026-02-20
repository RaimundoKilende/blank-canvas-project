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
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          sender_id: string
          service_request_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          sender_id: string
          service_request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          sender_id?: string
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          delivery_person_id: string | null
          id: string
          order_id: string
          picked_up_at: string | null
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_person_id?: string | null
          id?: string
          order_id: string
          picked_up_at?: string | null
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_person_id?: string | null
          id?: string
          order_id?: string
          picked_up_at?: string | null
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_persons: {
        Row: {
          active: boolean | null
          availability: string | null
          available: boolean | null
          certifications: string | null
          completed_deliveries: number | null
          created_at: string
          documents: string[] | null
          id: string
          latitude: number | null
          license_number: string | null
          license_plate: string | null
          longitude: number | null
          motivation: string | null
          previous_experience: string | null
          rating: number | null
          review_count: number | null
          updated_at: string
          user_id: string
          vehicle_type: string | null
          verified: boolean | null
          wallet_balance: number
          work_areas: string[] | null
          years_experience: string | null
        }
        Insert: {
          active?: boolean | null
          availability?: string | null
          available?: boolean | null
          certifications?: string | null
          completed_deliveries?: number | null
          created_at?: string
          documents?: string[] | null
          id?: string
          latitude?: number | null
          license_number?: string | null
          license_plate?: string | null
          longitude?: number | null
          motivation?: string | null
          previous_experience?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          user_id: string
          vehicle_type?: string | null
          verified?: boolean | null
          wallet_balance?: number
          work_areas?: string[] | null
          years_experience?: string | null
        }
        Update: {
          active?: boolean | null
          availability?: string | null
          available?: boolean | null
          certifications?: string | null
          completed_deliveries?: number | null
          created_at?: string
          documents?: string[] | null
          id?: string
          latitude?: number | null
          license_number?: string | null
          license_plate?: string | null
          longitude?: number | null
          motivation?: string | null
          previous_experience?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string | null
          verified?: boolean | null
          wallet_balance?: number
          work_areas?: string[] | null
          years_experience?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          service_request_id: string | null
          technician_id: string | null
          type: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          description: string
          id?: string
          service_request_id?: string | null
          technician_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          service_request_id?: string | null
          technician_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string
          created_at: string
          delivery_address: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          id: string
          notes: string | null
          payment_method: string
          status: string
          total_price: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          delivery_address?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          id?: string
          notes?: string | null
          payment_method?: string
          status?: string
          total_price?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          delivery_address?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          id?: string
          notes?: string | null
          payment_method?: string
          status?: string
          total_price?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          photos: string[] | null
          price: number
          stock: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          photos?: string[] | null
          price?: number
          stock?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          photos?: string[] | null
          price?: number
          stock?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vendor_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_type: string | null
          company_name: string | null
          created_at: string
          email: string
          id: string
          name: string
          nif: string | null
          organization_type: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          client_type?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          nif?: string | null
          organization_type?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          client_type?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          nif?: string | null
          organization_type?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          service_request_id: string
          technician_id: string
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          service_request_id: string
          technician_id: string
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          service_request_id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          active: boolean | null
          base_price: number
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          base_price?: number
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          base_price?: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          accepted_at: string | null
          address: string
          admin_discount: number | null
          admin_discount_reason: string | null
          audio_url: string | null
          base_price: number
          cancellation_fee: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          category_id: string
          client_id: string
          completed_at: string | null
          completion_code: string | null
          completion_photos: string[] | null
          created_at: string
          description: string
          extras: Json | null
          feedback: string | null
          id: string
          latitude: number | null
          longitude: number | null
          photos: string[] | null
          quote_amount: number | null
          quote_approved_at: string | null
          quote_description: string | null
          quote_sent_at: string | null
          quote_status: string | null
          rating: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          scheduling_type: string
          started_at: string | null
          status: Database["public"]["Enums"]["service_status"]
          technician_id: string | null
          total_price: number
          unresponded_alert_sent: boolean | null
          urgency: string | null
        }
        Insert: {
          accepted_at?: string | null
          address: string
          admin_discount?: number | null
          admin_discount_reason?: string | null
          audio_url?: string | null
          base_price?: number
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category_id: string
          client_id: string
          completed_at?: string | null
          completion_code?: string | null
          completion_photos?: string[] | null
          created_at?: string
          description: string
          extras?: Json | null
          feedback?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          photos?: string[] | null
          quote_amount?: number | null
          quote_approved_at?: string | null
          quote_description?: string | null
          quote_sent_at?: string | null
          quote_status?: string | null
          rating?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          scheduling_type?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          technician_id?: string | null
          total_price?: number
          unresponded_alert_sent?: boolean | null
          urgency?: string | null
        }
        Update: {
          accepted_at?: string | null
          address?: string
          admin_discount?: number | null
          admin_discount_reason?: string | null
          audio_url?: string | null
          base_price?: number
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category_id?: string
          client_id?: string
          completed_at?: string | null
          completion_code?: string | null
          completion_photos?: string[] | null
          created_at?: string
          description?: string
          extras?: Json | null
          feedback?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          photos?: string[] | null
          quote_amount?: number | null
          quote_approved_at?: string | null
          quote_description?: string | null
          quote_sent_at?: string | null
          quote_status?: string | null
          rating?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          scheduling_type?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          technician_id?: string | null
          total_price?: number
          unresponded_alert_sent?: boolean | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          base_price: number
          category_id: string
          commission_percentage: number
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          price_type: string
          suggested_price_max: number | null
          suggested_price_min: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          base_price?: number
          category_id: string
          commission_percentage?: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          price_type?: string
          suggested_price_max?: number | null
          suggested_price_min?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          base_price?: number
          category_id?: string
          commission_percentage?: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          price_type?: string
          suggested_price_max?: number | null
          suggested_price_min?: number | null
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
        ]
      }
      specialties: {
        Row: {
          active: boolean | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          service_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialties_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialties_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          against_id: string | null
          created_at: string
          description: string
          evidence_photos: string[] | null
          id: string
          reporter_id: string
          reporter_role: string
          resolution: string | null
          resolved_at: string | null
          response_deadline: string | null
          service_request_id: string | null
          status: string
          subject: string
          technician_response: string | null
          ticket_type: string
          updated_at: string
          verdict: string | null
          verdict_notes: string | null
        }
        Insert: {
          admin_notes?: string | null
          against_id?: string | null
          created_at?: string
          description: string
          evidence_photos?: string[] | null
          id?: string
          reporter_id: string
          reporter_role: string
          resolution?: string | null
          resolved_at?: string | null
          response_deadline?: string | null
          service_request_id?: string | null
          status?: string
          subject: string
          technician_response?: string | null
          ticket_type?: string
          updated_at?: string
          verdict?: string | null
          verdict_notes?: string | null
        }
        Update: {
          admin_notes?: string | null
          against_id?: string | null
          created_at?: string
          description?: string
          evidence_photos?: string[] | null
          id?: string
          reporter_id?: string
          reporter_role?: string
          resolution?: string | null
          resolved_at?: string | null
          response_deadline?: string | null
          service_request_id?: string | null
          status?: string
          subject?: string
          technician_response?: string | null
          ticket_type?: string
          updated_at?: string
          verdict?: string | null
          verdict_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          active: boolean | null
          availability: string | null
          bio: string | null
          certifications: string | null
          completed_jobs: number | null
          created_at: string
          credits: number | null
          documents: string[] | null
          has_own_tools: boolean | null
          has_transport: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          motivation: string | null
          portfolio_photos: string[] | null
          previous_experience: string | null
          rating: number | null
          rejected: boolean | null
          review_count: number | null
          specialties: string[] | null
          suspended: boolean | null
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
          wallet_balance: number
          work_areas: string[] | null
          years_experience: string | null
        }
        Insert: {
          active?: boolean | null
          availability?: string | null
          bio?: string | null
          certifications?: string | null
          completed_jobs?: number | null
          created_at?: string
          credits?: number | null
          documents?: string[] | null
          has_own_tools?: boolean | null
          has_transport?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          motivation?: string | null
          portfolio_photos?: string[] | null
          previous_experience?: string | null
          rating?: number | null
          rejected?: boolean | null
          review_count?: number | null
          specialties?: string[] | null
          suspended?: boolean | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          wallet_balance?: number
          work_areas?: string[] | null
          years_experience?: string | null
        }
        Update: {
          active?: boolean | null
          availability?: string | null
          bio?: string | null
          certifications?: string | null
          completed_jobs?: number | null
          created_at?: string
          credits?: number | null
          documents?: string[] | null
          has_own_tools?: boolean | null
          has_transport?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          motivation?: string | null
          portfolio_photos?: string[] | null
          previous_experience?: string | null
          rating?: number | null
          rejected?: boolean | null
          review_count?: number | null
          specialties?: string[] | null
          suspended?: boolean | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          wallet_balance?: number
          work_areas?: string[] | null
          years_experience?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_categories: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      vendor_chat_messages: {
        Row: {
          client_id: string
          created_at: string
          id: string
          message: string
          read: boolean | null
          sender_id: string
          vendor_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          sender_id: string
          vendor_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          sender_id?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          active: boolean | null
          address: string | null
          availability: string | null
          certifications: string | null
          completed_orders: number | null
          created_at: string
          documents: string[] | null
          id: string
          latitude: number | null
          longitude: number | null
          motivation: string | null
          previous_experience: string | null
          rating: number | null
          review_count: number | null
          store_description: string | null
          store_logo: string | null
          store_name: string | null
          updated_at: string
          user_id: string
          vendor_type: string
          verified: boolean | null
          wallet_balance: number
          work_areas: string[] | null
          years_experience: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          availability?: string | null
          certifications?: string | null
          completed_orders?: number | null
          created_at?: string
          documents?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          motivation?: string | null
          previous_experience?: string | null
          rating?: number | null
          review_count?: number | null
          store_description?: string | null
          store_logo?: string | null
          store_name?: string | null
          updated_at?: string
          user_id: string
          vendor_type?: string
          verified?: boolean | null
          wallet_balance?: number
          work_areas?: string[] | null
          years_experience?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          availability?: string | null
          certifications?: string | null
          completed_orders?: number | null
          created_at?: string
          documents?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          motivation?: string | null
          previous_experience?: string | null
          rating?: number | null
          review_count?: number | null
          store_description?: string | null
          store_logo?: string | null
          store_name?: string | null
          updated_at?: string
          user_id?: string
          vendor_type?: string
          verified?: boolean | null
          wallet_balance?: number
          work_areas?: string[] | null
          years_experience?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delivery_person_id: string | null
          description: string
          entity_code: string | null
          id: string
          payment_type: string
          reference_number: string | null
          service_request_id: string | null
          status: string
          technician_id: string | null
          type: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delivery_person_id?: string | null
          description: string
          entity_code?: string | null
          id?: string
          payment_type?: string
          reference_number?: string | null
          service_request_id?: string | null
          status?: string
          technician_id?: string | null
          type: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delivery_person_id?: string | null
          description?: string
          entity_code?: string | null
          id?: string
          payment_type?: string
          reference_number?: string | null
          service_request_id?: string | null
          status?: string
          technician_id?: string | null
          type?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      technician_has_active_service: {
        Args: { tech_user_id: string }
        Returns: boolean
      }
      validate_completion_code: {
        Args: { code: string; request_id: string }
        Returns: boolean
      }
    }
    Enums: {
      service_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      user_role: "admin" | "technician" | "client" | "vendor" | "delivery"
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
      service_status: [
        "pending",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      user_role: ["admin", "technician", "client", "vendor", "delivery"],
    },
  },
} as const
