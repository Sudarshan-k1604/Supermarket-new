export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          crop: string | null
          date: string
          description: string
          expense_date: string | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          crop?: string | null
          date: string
          description: string
          expense_date?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          crop?: string | null
          date?: string
          description?: string
          expense_date?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          barcode: string | null
          category: string
          created_at: string | null
          id: string
          item_name: string
          low_stock_alert: number | null
          low_stock_threshold: number | null
          quantity: number
          unit_price: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          barcode?: string | null
          category: string
          created_at?: string | null
          id?: string
          item_name: string
          low_stock_alert?: number | null
          low_stock_threshold?: number | null
          quantity?: number
          unit_price: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string
          created_at?: string | null
          id?: string
          item_name?: string
          low_stock_alert?: number | null
          low_stock_threshold?: number | null
          quantity?: number
          unit_price?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          created_at: string
          crop_name: string
          crop_name_kn: string
          currency: string
          district: string
          id: string
          last_updated: string
          price_change: number | null
          price_per_kg: number
          source_url: string | null
          trend: string
        }
        Insert: {
          created_at?: string
          crop_name: string
          crop_name_kn: string
          currency?: string
          district: string
          id?: string
          last_updated?: string
          price_change?: number | null
          price_per_kg: number
          source_url?: string | null
          trend?: string
        }
        Update: {
          created_at?: string
          crop_name?: string
          crop_name_kn?: string
          currency?: string
          district?: string
          id?: string
          last_updated?: string
          price_change?: number | null
          price_per_kg?: number
          source_url?: string | null
          trend?: string
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          created_at: string | null
          id: string
          month: number
          net_profit: number | null
          report_data: Json | null
          report_url: string | null
          total_expenses: number | null
          total_sales: number | null
          user_id: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: number
          net_profit?: number | null
          report_data?: Json | null
          report_url?: string | null
          total_expenses?: number | null
          total_sales?: number | null
          user_id?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: number
          net_profit?: number | null
          report_data?: Json | null
          report_url?: string | null
          total_expenses?: number | null
          total_sales?: number | null
          user_id?: string | null
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          bill_url: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          items: Json
          qr_code_url: string | null
          total_amount: number
          user_id: string | null
        }
        Insert: {
          bill_url?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items: Json
          qr_code_url?: string | null
          total_amount: number
          user_id?: string | null
        }
        Update: {
          bill_url?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          qr_code_url?: string | null
          total_amount?: number
          user_id?: string | null
        }
        Relationships: []
      }
      schemes: {
        Row: {
          benefit: string
          category: string
          created_at: string
          description: string
          due_date: string | null
          eligibility: string
          id: string
          name: string
          reminder: boolean | null
          status: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          benefit: string
          category: string
          created_at?: string
          description: string
          due_date?: string | null
          eligibility: string
          id?: string
          name: string
          reminder?: boolean | null
          status?: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          benefit?: string
          category?: string
          created_at?: string
          description?: string
          due_date?: string | null
          eligibility?: string
          id?: string
          name?: string
          reminder?: boolean | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          due_date: string | null
          id: string
          priority: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          priority: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
