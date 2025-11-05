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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admission_cycles: {
        Row: {
          admission_date: string
          admission_type: string | null
          branch: Database["public"]["Enums"]["branch_type"]
          created_at: string
          cycle_number: number
          discharge_date: string | null
          discharge_reason: string | null
          id: string
          patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admission_date: string
          admission_type?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          cycle_number: number
          discharge_date?: string | null
          discharge_reason?: string | null
          id?: string
          patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admission_date?: string
          admission_type?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          cycle_number?: number
          discharge_date?: string | null
          discharge_reason?: string | null
          id?: string
          patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_cycles_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_patient_status: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"]
          created_at: string
          created_by: string
          id: string
          notes: string | null
          patient_id: string
          status_date: string
          status_type: string
          updated_at: string
        }
        Insert: {
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          patient_id: string
          status_date: string
          status_type: string
          updated_at?: string
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          patient_id?: string
          status_date?: string
          status_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_patient_status_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosis_options: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      hospital_options: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: []
      }
      insurance_type_options: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      manager_supervisors: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          manager_id: string
          supervisor_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          manager_id: string
          supervisor_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          manager_id?: string
          supervisor_id?: string
        }
        Relationships: []
      }
      medical_info: {
        Row: {
          admission_cycle_id: string | null
          biopsy_result: string | null
          branch: Database["public"]["Enums"]["branch_type"]
          cancer_stage: string | null
          cancer_type: string
          created_at: string
          diagnosis_date: string | null
          id: string
          metastasis_sites: string[] | null
          metastasis_status: boolean | null
          patient_id: string
          primary_doctor: string | null
          updated_at: string
        }
        Insert: {
          admission_cycle_id?: string | null
          biopsy_result?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          cancer_stage?: string | null
          cancer_type: string
          created_at?: string
          diagnosis_date?: string | null
          id?: string
          metastasis_sites?: string[] | null
          metastasis_status?: boolean | null
          patient_id: string
          primary_doctor?: string | null
          updated_at?: string
        }
        Update: {
          admission_cycle_id?: string | null
          biopsy_result?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          cancer_stage?: string | null
          cancer_type?: string
          created_at?: string
          diagnosis_date?: string | null
          id?: string
          metastasis_sites?: string[] | null
          metastasis_status?: boolean | null
          patient_id?: string
          primary_doctor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_info_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      package_management: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"]
          count_balance: number | null
          count_total: number | null
          count_used: number | null
          created_at: string
          customer_number: string | null
          deposit_balance: number | null
          deposit_total: number | null
          deposit_used: number | null
          id: string
          last_synced_at: string | null
          patient_id: string
          reward_balance: number | null
          reward_total: number | null
          reward_used: number | null
          updated_at: string
        }
        Insert: {
          branch?: Database["public"]["Enums"]["branch_type"]
          count_balance?: number | null
          count_total?: number | null
          count_used?: number | null
          created_at?: string
          customer_number?: string | null
          deposit_balance?: number | null
          deposit_total?: number | null
          deposit_used?: number | null
          id?: string
          last_synced_at?: string | null
          patient_id: string
          reward_balance?: number | null
          reward_total?: number | null
          reward_used?: number | null
          updated_at?: string
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch_type"]
          count_balance?: number | null
          count_total?: number | null
          count_used?: number | null
          created_at?: string
          customer_number?: string | null
          deposit_balance?: number | null
          deposit_total?: number | null
          deposit_used?: number | null
          id?: string
          last_synced_at?: string | null
          patient_id?: string
          reward_balance?: number | null
          reward_total?: number | null
          reward_used?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_management_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      package_transactions: {
        Row: {
          amount: number
          branch: Database["public"]["Enums"]["branch_type"]
          count: number | null
          created_at: string
          customer_number: string | null
          date_from: string | null
          date_to: string | null
          id: string
          note: string | null
          patient_id: string
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          branch?: Database["public"]["Enums"]["branch_type"]
          count?: number | null
          created_at?: string
          customer_number?: string | null
          date_from?: string | null
          date_to?: string | null
          id?: string
          note?: string | null
          patient_id: string
          transaction_date: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          branch?: Database["public"]["Enums"]["branch_type"]
          count?: number | null
          created_at?: string
          customer_number?: string | null
          date_from?: string | null
          date_to?: string | null
          id?: string
          note?: string | null
          patient_id?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          admission_cycle_id: string | null
          branch: Database["public"]["Enums"]["branch_type"]
          created_at: string
          end_date: string
          has_private_insurance: boolean | null
          id: string
          included_treatments: string[] | null
          insurance_coverage: number | null
          insurance_limit: number | null
          insurance_type: string | null
          insurance_used: number | null
          outstanding_balance: number | null
          package_amount: number
          package_type: string
          patient_id: string
          patient_payment: number
          payment_date: string | null
          payment_method: string | null
          start_date: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          admission_cycle_id?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          end_date: string
          has_private_insurance?: boolean | null
          id?: string
          included_treatments?: string[] | null
          insurance_coverage?: number | null
          insurance_limit?: number | null
          insurance_type?: string | null
          insurance_used?: number | null
          outstanding_balance?: number | null
          package_amount: number
          package_type: string
          patient_id: string
          patient_payment: number
          payment_date?: string | null
          payment_method?: string | null
          start_date: string
          total_cost: number
          updated_at?: string
        }
        Update: {
          admission_cycle_id?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          end_date?: string
          has_private_insurance?: boolean | null
          id?: string
          included_treatments?: string[] | null
          insurance_coverage?: number | null
          insurance_limit?: number | null
          insurance_type?: string | null
          insurance_used?: number | null
          outstanding_balance?: number | null
          package_amount?: number
          package_type?: string
          patient_id?: string
          patient_payment?: number
          payment_date?: string | null
          payment_method?: string | null
          start_date?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notes: {
        Row: {
          admission_cycle_id: string | null
          branch: Database["public"]["Enums"]["branch_type"]
          content: string
          created_at: string
          created_by: string
          id: string
          is_important: boolean | null
          note_type: string
          patient_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          admission_cycle_id?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_important?: boolean | null
          note_type?: string
          patient_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          admission_cycle_id?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_important?: boolean | null
          note_type?: string
          patient_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notes_admission_cycle_id_fkey"
            columns: ["admission_cycle_id"]
            isOneToOne: false
            referencedRelation: "admission_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_reconnect_tracking: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"]
          created_at: string
          created_by: string
          id: string
          is_reconnected: boolean
          patient_id: string
          reconnect_notes: string | null
          reconnected_at: string | null
          updated_at: string
        }
        Insert: {
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          created_by: string
          id?: string
          is_reconnected?: boolean
          patient_id: string
          reconnect_notes?: string | null
          reconnected_at?: string | null
          updated_at?: string
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          created_by?: string
          id?: string
          is_reconnected?: boolean
          patient_id?: string
          reconnect_notes?: string | null
          reconnected_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_reconnect_tracking_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_status_options: {
        Row: {
          created_at: string
          created_by: string | null
          exclude_from_daily_tracking: boolean
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          exclude_from_daily_tracking?: boolean
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          exclude_from_daily_tracking?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          admission_date: string | null
          age: number | null
          assigned_manager: string
          branch: Database["public"]["Enums"]["branch_type"]
          chart_number: string | null
          consultation_date: string | null
          counseling_content: string | null
          counselor: string | null
          created_at: string
          crm_memo: string | null
          customer_number: string | null
          detailed_diagnosis: string | null
          diagnosis_category: string | null
          diagnosis_detail: string | null
          diet_info: string | null
          discharge_date: string | null
          display_order: number | null
          emergency_contact: string | null
          examination_schedule: string | null
          failure_reason: string | null
          first_visit_date: string | null
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          hospital_branch: string | null
          hospital_category: string | null
          hospital_treatment: string | null
          id: string
          inflow_date: string | null
          inflow_status: string | null
          insurance_type: string | null
          korean_doctor: string | null
          last_visit_date: string | null
          management_status: string | null
          manager_name: string | null
          memo1: string | null
          monthly_avg_days: number | null
          name: string
          patient_number: string
          patient_or_guardian: string | null
          payment_amount: number | null
          phone: string | null
          previous_hospital: string | null
          referral_source: string | null
          resident_number_masked: string | null
          special_note_1: string | null
          special_note_2: string | null
          treatment_memo_1: string | null
          treatment_memo_2: string | null
          treatment_plan: string | null
          updated_at: string
          visit_motivation: string | null
          visit_type: string | null
          western_doctor: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          age?: number | null
          assigned_manager: string
          branch?: Database["public"]["Enums"]["branch_type"]
          chart_number?: string | null
          consultation_date?: string | null
          counseling_content?: string | null
          counselor?: string | null
          created_at?: string
          crm_memo?: string | null
          customer_number?: string | null
          detailed_diagnosis?: string | null
          diagnosis_category?: string | null
          diagnosis_detail?: string | null
          diet_info?: string | null
          discharge_date?: string | null
          display_order?: number | null
          emergency_contact?: string | null
          examination_schedule?: string | null
          failure_reason?: string | null
          first_visit_date?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          hospital_branch?: string | null
          hospital_category?: string | null
          hospital_treatment?: string | null
          id?: string
          inflow_date?: string | null
          inflow_status?: string | null
          insurance_type?: string | null
          korean_doctor?: string | null
          last_visit_date?: string | null
          management_status?: string | null
          manager_name?: string | null
          memo1?: string | null
          monthly_avg_days?: number | null
          name: string
          patient_number: string
          patient_or_guardian?: string | null
          payment_amount?: number | null
          phone?: string | null
          previous_hospital?: string | null
          referral_source?: string | null
          resident_number_masked?: string | null
          special_note_1?: string | null
          special_note_2?: string | null
          treatment_memo_1?: string | null
          treatment_memo_2?: string | null
          treatment_plan?: string | null
          updated_at?: string
          visit_motivation?: string | null
          visit_type?: string | null
          western_doctor?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          age?: number | null
          assigned_manager?: string
          branch?: Database["public"]["Enums"]["branch_type"]
          chart_number?: string | null
          consultation_date?: string | null
          counseling_content?: string | null
          counselor?: string | null
          created_at?: string
          crm_memo?: string | null
          customer_number?: string | null
          detailed_diagnosis?: string | null
          diagnosis_category?: string | null
          diagnosis_detail?: string | null
          diet_info?: string | null
          discharge_date?: string | null
          display_order?: number | null
          emergency_contact?: string | null
          examination_schedule?: string | null
          failure_reason?: string | null
          first_visit_date?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          hospital_branch?: string | null
          hospital_category?: string | null
          hospital_treatment?: string | null
          id?: string
          inflow_date?: string | null
          inflow_status?: string | null
          insurance_type?: string | null
          korean_doctor?: string | null
          last_visit_date?: string | null
          management_status?: string | null
          manager_name?: string | null
          memo1?: string | null
          monthly_avg_days?: number | null
          name?: string
          patient_number?: string
          patient_or_guardian?: string | null
          payment_amount?: number | null
          phone?: string | null
          previous_hospital?: string | null
          referral_source?: string | null
          resident_number_masked?: string | null
          special_note_1?: string | null
          special_note_2?: string | null
          treatment_memo_1?: string | null
          treatment_memo_2?: string | null
          treatment_plan?: string | null
          updated_at?: string
          visit_motivation?: string | null
          visit_type?: string | null
          western_doctor?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"]
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      treatment_detail_options: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      treatment_history: {
        Row: {
          admission_cycle_id: string | null
          branch: Database["public"]["Enums"]["branch_type"]
          created_at: string
          end_date: string | null
          hospital_name: string | null
          id: string
          notes: string | null
          patient_id: string
          start_date: string | null
          treatment_name: string
          treatment_type: string
        }
        Insert: {
          admission_cycle_id?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          end_date?: string | null
          hospital_name?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          start_date?: string | null
          treatment_name: string
          treatment_type: string
        }
        Update: {
          admission_cycle_id?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          end_date?: string | null
          hospital_name?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          start_date?: string | null
          treatment_name?: string
          treatment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"]
          created_at: string
          created_by: string
          id: string
          is_paid: boolean
          patient_id: string
          payment_date: string | null
          treatment_amount: number
          treatment_detail: string
          updated_at: string
        }
        Insert: {
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          created_by: string
          id?: string
          is_paid?: boolean
          patient_id: string
          payment_date?: string | null
          treatment_amount?: number
          treatment_detail: string
          updated_at?: string
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          created_by?: string
          id?: string
          is_paid?: boolean
          patient_id?: string
          payment_date?: string | null
          treatment_amount?: number
          treatment_detail?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          assigned_by: string | null
          branch: Database["public"]["Enums"]["branch_type"]
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          assigned_by?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          assigned_by?: string | null
          branch?: Database["public"]["Enums"]["branch_type"]
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      approved_users: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by_name: string | null
          branch: Database["public"]["Enums"]["branch_type"] | null
          email: string | null
          id: string | null
          joined_at: string | null
          name: string | null
          phone: string | null
          requested_at: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Relationships: []
      }
      manager_patient_stats: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"] | null
          last_patient_added: string | null
          manager_email: string | null
          manager_id: string | null
          manager_name: string | null
          new_patients_this_month: number | null
          outstanding_balance: number | null
          total_patients: number | null
          total_revenue: number | null
          visits_this_week: number | null
        }
        Relationships: []
      }
      pending_approvals: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          branch: Database["public"]["Enums"]["branch_type"] | null
          email: string | null
          id: string | null
          joined_at: string | null
          name: string | null
          phone: string | null
          requested_at: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_stay_days: {
        Args: { admission_date: string; discharge_date?: string }
        Returns: number
      }
      get_next_cycle_number: { Args: { patient_uuid: string }; Returns: number }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["user_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _branch?: Database["public"]["Enums"]["branch_type"]
              _role: Database["public"]["Enums"]["user_role"]
              _user_id: string
            }
            Returns: boolean
          }
      is_master_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      branch_type: "강서" | "광명" | "성동"
      user_role: "master" | "manager" | "admin"
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
      approval_status: ["pending", "approved", "rejected"],
      branch_type: ["강서", "광명", "성동"],
      user_role: ["master", "manager", "admin"],
    },
  },
} as const
