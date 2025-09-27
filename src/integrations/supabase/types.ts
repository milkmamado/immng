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
      medical_info: {
        Row: {
          biopsy_result: string | null
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
          biopsy_result?: string | null
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
          biopsy_result?: string | null
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
            referencedRelation: "patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_info_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
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
            referencedRelation: "patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          admission_date: string | null
          age: number | null
          assigned_manager: string
          created_at: string
          discharge_date: string | null
          emergency_contact: string | null
          first_visit_date: string | null
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id: string
          name: string
          patient_number: string
          phone: string | null
          referral_source: string | null
          resident_number_masked: string | null
          updated_at: string
          visit_type: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          age?: number | null
          assigned_manager: string
          created_at?: string
          discharge_date?: string | null
          emergency_contact?: string | null
          first_visit_date?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          name: string
          patient_number: string
          phone?: string | null
          referral_source?: string | null
          resident_number_masked?: string | null
          updated_at?: string
          visit_type?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          age?: number | null
          assigned_manager?: string
          created_at?: string
          discharge_date?: string | null
          emergency_contact?: string | null
          first_visit_date?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          name?: string
          patient_number?: string
          phone?: string | null
          referral_source?: string | null
          resident_number_masked?: string | null
          updated_at?: string
          visit_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      treatment_history: {
        Row: {
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
            referencedRelation: "patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          assigned_by: string | null
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
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      manager_stats: {
        Row: {
          email: string | null
          id: string | null
          manager_name: string | null
          new_patients_this_month: number | null
          total_outstanding: number | null
          total_patients: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      patient_summary: {
        Row: {
          age: number | null
          assigned_manager: string | null
          cancer_stage: string | null
          cancer_type: string | null
          created_at: string | null
          first_visit_date: string | null
          gender: string | null
          id: string | null
          manager_name: string | null
          name: string | null
          outstanding_balance: number | null
          package_type: string | null
          patient_number: string | null
          phone: string | null
          total_cost: number | null
          updated_at: string | null
          visit_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_patient_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_approved: {
        Args: { _user_id: string }
        Returns: boolean
      }
      setup_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      user_role: "master" | "manager"
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
      user_role: ["master", "manager"],
    },
  },
} as const
