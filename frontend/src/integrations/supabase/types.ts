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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_validations: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          invoice_id: string | null
          message: string
          passed: boolean
          timesheet_id: string | null
          validation_type: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          invoice_id?: string | null
          message: string
          passed: boolean
          timesheet_id?: string | null
          validation_type: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          invoice_id?: string | null
          message?: string
          passed?: boolean
          timesheet_id?: string | null
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_validations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_validations_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plans: {
        Row: {
          approved_services: string[] | null
          client_id: string
          created_at: string | null
          document_url: string | null
          end_date: string | null
          goals: string[] | null
          id: string
          plan_name: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_services?: string[] | null
          client_id: string
          created_at?: string | null
          document_url?: string | null
          end_date?: string | null
          goals?: string[] | null
          id?: string
          plan_name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_services?: string[] | null
          client_id?: string
          created_at?: string | null
          document_url?: string | null
          end_date?: string | null
          goals?: string[] | null
          id?: string
          plan_name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      case_notes: {
        Row: {
          category: string | null
          client_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_confidential: boolean | null
          note_date: string
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          client_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_confidential?: boolean | null
          note_date?: string
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          client_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_confidential?: boolean | null
          note_date?: string
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_notes_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      client_funding: {
        Row: {
          approved_categories: string[] | null
          budget_used: number | null
          client_id: string
          created_at: string | null
          funding_program: string
          id: string
          notes: string | null
          plan_end_date: string | null
          plan_number: string | null
          plan_start_date: string | null
          status: string | null
          total_budget: number | null
          updated_at: string | null
        }
        Insert: {
          approved_categories?: string[] | null
          budget_used?: number | null
          client_id: string
          created_at?: string | null
          funding_program: string
          id?: string
          notes?: string | null
          plan_end_date?: string | null
          plan_number?: string | null
          plan_start_date?: string | null
          status?: string | null
          total_budget?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_categories?: string[] | null
          budget_used?: number | null
          client_id?: string
          created_at?: string | null
          funding_program?: string
          id?: string
          notes?: string | null
          plan_end_date?: string | null
          plan_number?: string | null
          plan_start_date?: string | null
          status?: string | null
          total_budget?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_funding_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_staff_assignments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          staff_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          staff_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_staff_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string
          funding_type: string | null
          id: string
          last_name: string
          ndis_number: string | null
          ndis_plan_end: string | null
          ndis_plan_start: string | null
          notes: string | null
          phone: string | null
          preferred_name: string | null
          primary_disability: string | null
          status: string
          support_needs: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name: string
          funding_type?: string | null
          id?: string
          last_name: string
          ndis_number?: string | null
          ndis_plan_end?: string | null
          ndis_plan_start?: string | null
          notes?: string | null
          phone?: string | null
          preferred_name?: string | null
          primary_disability?: string | null
          status?: string
          support_needs?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string
          funding_type?: string | null
          id?: string
          last_name?: string
          ndis_number?: string | null
          ndis_plan_end?: string | null
          ndis_plan_start?: string | null
          notes?: string | null
          phone?: string | null
          preferred_name?: string | null
          primary_disability?: string | null
          status?: string
          support_needs?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compliance_flags: {
        Row: {
          created_at: string | null
          description: string
          details: Json | null
          flag_type: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          resource_id: string | null
          resource_type: string
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          details?: Json | null
          flag_type: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          resource_id?: string | null
          resource_type: string
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          details?: Json | null
          flag_type?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          resource_id?: string | null
          resource_type?: string
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_records: {
        Row: {
          created_at: string
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          notes: string | null
          record_name: string
          record_type: string
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          record_name: string
          record_type: string
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          record_name?: string
          record_type?: string
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          immediate_action: string | null
          incident_date: string
          incident_type: string
          injury_occurred: boolean | null
          location: string | null
          medical_attention_required: boolean | null
          reported_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          immediate_action?: string | null
          incident_date: string
          incident_type: string
          injury_occurred?: boolean | null
          location?: string | null
          medical_attention_required?: boolean | null
          reported_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          immediate_action?: string | null
          incident_date?: string
          incident_type?: string
          injury_occurred?: boolean | null
          location?: string | null
          medical_attention_required?: boolean | null
          reported_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          description: string
          funding_program: string | null
          hours: number
          id: string
          invoice_id: string
          rate: number
          service_category_id: string | null
          service_date: string | null
          timesheet_id: string | null
        }
        Insert: {
          amount?: number
          client_id?: string | null
          created_at?: string
          description: string
          funding_program?: string | null
          hours?: number
          id?: string
          invoice_id: string
          rate?: number
          service_category_id?: string | null
          service_date?: string | null
          timesheet_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          description?: string
          funding_program?: string | null
          hours?: number
          id?: string
          invoice_id?: string
          rate?: number
          service_category_id?: string | null
          service_date?: string | null
          timesheet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          abn: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          gst: number
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          staff_id: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          abn?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          gst?: number
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          staff_id: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          abn?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          gst?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          staff_id?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: string
          title: string
          message: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      onboarding_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          staff_id: string
          status: string
          task_name: string
          task_type: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          staff_id: string
          status?: string
          task_name: string
          task_type?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          staff_id?: string
          status?: string
          task_name?: string
          task_type?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          document_url: string | null
          id: string
          policy_category: string
          published_date: string | null
          requires_acknowledgement: boolean | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          id?: string
          policy_category: string
          published_date?: string | null
          requires_acknowledgement?: boolean | null
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          id?: string
          policy_category?: string
          published_date?: string | null
          requires_acknowledgement?: boolean | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      policy_acknowledgements: {
        Row: {
          acknowledged_at: string
          id: string
          ip_address: string | null
          policy_id: string
          staff_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          ip_address?: string | null
          policy_id: string
          staff_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          ip_address?: string | null
          policy_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_acknowledgements_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_acknowledgements_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          staff_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          staff_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          staff_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          resource: string
          role: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          resource: string
          role: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          resource?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_agreements: {
        Row: {
          agreement_date: string
          client_id: string
          created_at: string | null
          document_url: string | null
          id: string
          notes: string | null
          signed: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agreement_date?: string
          client_id: string
          created_at?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          signed?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agreement_date?: string
          client_id?: string
          created_at?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          signed?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_agreements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          category_code: string
          category_name: string
          created_at: string | null
          description: string | null
          funding_program: string
          gst_applicable: boolean | null
          id: string
          is_active: boolean | null
          max_rate: number | null
          public_holiday_rate_multiplier: number | null
          requires_qualification: string[] | null
          updated_at: string | null
          weekend_rate_multiplier: number | null
        }
        Insert: {
          category_code: string
          category_name: string
          created_at?: string | null
          description?: string | null
          funding_program: string
          gst_applicable?: boolean | null
          id?: string
          is_active?: boolean | null
          max_rate?: number | null
          public_holiday_rate_multiplier?: number | null
          requires_qualification?: string[] | null
          updated_at?: string | null
          weekend_rate_multiplier?: number | null
        }
        Update: {
          category_code?: string
          category_name?: string
          created_at?: string | null
          description?: string | null
          funding_program?: string
          gst_applicable?: boolean | null
          id?: string
          is_active?: boolean | null
          max_rate?: number | null
          public_holiday_rate_multiplier?: number | null
          requires_qualification?: string[] | null
          updated_at?: string | null
          weekend_rate_multiplier?: number | null
        }
        Relationships: []
      }
      shift_checkins: {
        Row: {
          check_in_address: string | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_in_time: string | null
          check_out_address: string | null
          check_out_lat: number | null
          check_out_lng: number | null
          check_out_time: string | null
          client_name: string | null
          created_at: string
          id: string
          notes: string | null
          shift_date: string
          staff_id: string | null
          staff_name: string
          status: string
          updated_at: string
        }
        Insert: {
          check_in_address?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_time?: string | null
          check_out_address?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          check_out_time?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_date?: string
          staff_id?: string | null
          staff_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          check_in_address?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_time?: string | null
          check_out_address?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          check_out_time?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_date?: string
          staff_id?: string | null
          staff_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_checkins_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_type: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          preferred_name: string | null
          qualifications: string[] | null
          role: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type?: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          preferred_name?: string | null
          qualifications?: string[] | null
          role?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          preferred_name?: string | null
          qualifications?: string[] | null
          role?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          break_minutes: number | null
          client_id: string | null
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          rate_per_hour: number | null
          service_category_id: string | null
          shift_date: string
          staff_id: string
          start_time: string
          status: string
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          client_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          rate_per_hour?: number | null
          service_category_id?: string | null
          shift_date: string
          staff_id: string
          start_time: string
          status?: string
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          client_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          rate_per_hour?: number | null
          service_category_id?: string | null
          shift_date?: string
          staff_id?: string
          start_time?: string
          status?: string
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          certificate_url: string | null
          completion_date: string | null
          created_at: string
          created_by: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          provider: string | null
          staff_id: string
          status: string
          training_name: string
          training_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          staff_id: string
          status?: string
          training_name: string
          training_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          staff_id?: string
          status?: string
          training_name?: string
          training_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      generate_invoice_number: { Args: never; Returns: string }
      get_user_staff_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
