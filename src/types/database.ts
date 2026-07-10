export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          address: string
          logo_url: string | null
          subscription_plan: string
          settings: Json
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['companies']['Row']>
        Update: Partial<Database['public']['Tables']['companies']['Row']>
      }
      profiles: {
        Row: {
          id: string
          company_id: string
          email: string
          full_name: string
          role: string
          avatar_url: string | null
          phone: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      customers: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string
          phone: string
          address: string
          type: string
          notes: string | null
          total_revenue: number
          job_count: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['customers']['Row']>
        Update: Partial<Database['public']['Tables']['customers']['Row']>
      }
      properties: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          name: string
          address: string
          property_type: string
          unit_number: string | null
          access_notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['properties']['Row']>
        Update: Partial<Database['public']['Tables']['properties']['Row']>
      }
      employees: {
        Row: {
          id: string
          company_id: string
          profile_id: string | null
          name: string
          role: string
          hourly_wage: number
          billing_rate: number
          payroll_tax_rate: number
          insurance_cost_monthly: number
          benefits_monthly: number
          overhead_allocation: number
          is_active: boolean
          skills: string[]
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['employees']['Row']>
        Update: Partial<Database['public']['Tables']['employees']['Row']>
      }
      jobs: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          property_id: string | null
          title: string
          description: string
          status: string
          priority: string
          scheduled_date: string | null
          completed_date: string | null
          assigned_technician_id: string | null
          estimated_hours: number
          actual_hours: number
          revenue: number
          labor_cost: number
          material_cost: number
          fuel_cost: number
          overhead_cost: number
          profit: number
          profit_margin: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['jobs']['Row']>
        Update: Partial<Database['public']['Tables']['jobs']['Row']>
      }
      estimates: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          property_id: string | null
          job_id: string | null
          title: string
          status: string
          labor_hours: number
          labor_rate: number
          material_cost: number
          markup_percent: number
          total: number
          valid_until: string
          line_items: Json
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['estimates']['Row']>
        Update: Partial<Database['public']['Tables']['estimates']['Row']>
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          job_id: string | null
          invoice_number: string
          status: string
          subtotal: number
          tax: number
          total: number
          amount_paid: number
          due_date: string
          paid_date: string | null
          line_items: Json
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['invoices']['Row']>
        Update: Partial<Database['public']['Tables']['invoices']['Row']>
      }
      materials: {
        Row: {
          id: string
          company_id: string
          name: string
          category: string
          supplier: string
          cost: number
          markup_percent: number
          customer_price: number
          quantity: number
          reorder_level: number
          unit: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['materials']['Row']>
        Update: Partial<Database['public']['Tables']['materials']['Row']>
      }
      vehicles: {
        Row: {
          id: string
          company_id: string
          name: string
          type: string
          make: string
          model: string
          year: number
          license_plate: string
          mileage: number
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['vehicles']['Row']>
        Update: Partial<Database['public']['Tables']['vehicles']['Row']>
      }
      expenses: {
        Row: {
          id: string
          company_id: string
          category: string
          description: string
          amount: number
          date: string
          job_id: string | null
          vehicle_id: string | null
          receipt_url: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['expenses']['Row']>
        Update: Partial<Database['public']['Tables']['expenses']['Row']>
      }
      schedule_events: {
        Row: {
          id: string
          company_id: string
          job_id: string | null
          technician_id: string | null
          title: string
          location: string
          start_time: string
          end_time: string
          status: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['schedule_events']['Row']>
        Update: Partial<Database['public']['Tables']['schedule_events']['Row']>
      }
      vendor_po_records: {
        Row: {
          id: string
          company_id: string
          vendor_po_number: string
          client_po_number: string | null
          priority: string | null
          order_type: string | null
          nte_amount: number
          service_date: string | null
          work_summary: string | null
          service_description: string | null
          service_address: string | null
          status: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['vendor_po_records']['Row']>
        Update: Partial<Database['public']['Tables']['vendor_po_records']['Row']>
      }
      work_orders: {
        Row: {
          id: string
          company_id: string
          customer_id: string | null
          property_id: string | null
          source: string
          status: string
          raw_content: string | null
          ai_extracted_data: Json | null
          document_url: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['work_orders']['Row']>
        Update: Partial<Database['public']['Tables']['work_orders']['Row']>
      }
      service_catalog: {
        Row: {
          id: string
          company_id: string
          name: string
          category: string
          avg_labor_hours: number
          difficulty: string
          suggested_price: number
          profit_margin: number
          materials: string[]
          tools: string[]
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['service_catalog']['Row']>
        Update: Partial<Database['public']['Tables']['service_catalog']['Row']>
      }
      job_tasks: {
        Row: {
          id: string
          job_id: string
          title: string
          description: string | null
          status: string
          estimated_hours: number
          actual_hours: number
          sort_order: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['job_tasks']['Row']>
        Update: Partial<Database['public']['Tables']['job_tasks']['Row']>
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          amount: number
          method: string
          stripe_payment_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['payments']['Row']>
        Update: Partial<Database['public']['Tables']['payments']['Row']>
      }
      fuel_logs: {
        Row: {
          id: string
          vehicle_id: string
          date: string
          miles: number
          gallons: number
          fuel_price: number
          total_cost: number
          job_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['fuel_logs']['Row']>
        Update: Partial<Database['public']['Tables']['fuel_logs']['Row']>
      }
      inventory: {
        Row: {
          id: string
          material_id: string
          job_id: string | null
          quantity_change: number
          transaction_type: string
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['inventory']['Row']>
        Update: Partial<Database['public']['Tables']['inventory']['Row']>
      }
      documents: {
        Row: {
          id: string
          company_id: string
          entity_type: string
          entity_id: string
          name: string
          file_url: string
          file_type: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['documents']['Row']>
        Update: Partial<Database['public']['Tables']['documents']['Row']>
      }
      photos: {
        Row: {
          id: string
          company_id: string
          job_id: string | null
          property_id: string | null
          url: string
          caption: string | null
          ai_analysis: Json | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['photos']['Row']>
        Update: Partial<Database['public']['Tables']['photos']['Row']>
      }
      ai_results: {
        Row: {
          id: string
          company_id: string
          source_type: string
          source_id: string | null
          input_data: Json | null
          output_data: Json
          model: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['ai_results']['Row']>
        Update: Partial<Database['public']['Tables']['ai_results']['Row']>
      }
      notifications: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notifications']['Row']>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      audit_logs: {
        Row: {
          id: string
          company_id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['audit_logs']['Row']>
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>
      }
      portal_tokens: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          portal_type: string
          token: string
          email: string | null
          expires_at: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['portal_tokens']['Row']>
        Update: Partial<Database['public']['Tables']['portal_tokens']['Row']>
      }
      team_invites: {
        Row: {
          id: string
          company_id: string
          email: string
          role: string
          token: string
          invited_by: string | null
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['team_invites']['Row']>
        Update: Partial<Database['public']['Tables']['team_invites']['Row']>
      }
      time_entries: {
        Row: {
          id: string
          company_id: string
          job_id: string
          employee_id: string | null
          profile_id: string | null
          start_time: string
          end_time: string | null
          lat: number | null
          lng: number | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['time_entries']['Row']>
        Update: Partial<Database['public']['Tables']['time_entries']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: {
      validate_portal_token: {
        Args: { p_token: string }
        Returns: Array<{ customer_id: string; portal_type: string; company_id: string }>
      }
      get_team_invite: {
        Args: { p_token: string }
        Returns: Array<{
          email: string
          role: string
          company_id: string
          company_name: string
          expires_at: string
          accepted_at: string | null
        }>
      }
      accept_team_invite: {
        Args: { p_token: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
