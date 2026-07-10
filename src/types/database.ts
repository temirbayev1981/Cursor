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
