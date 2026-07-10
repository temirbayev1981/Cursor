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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
