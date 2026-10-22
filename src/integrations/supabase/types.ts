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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          master_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          master_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          master_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_reviews: {
        Row: {
          author_id: string | null
          author_name: string
          created_at: string
          id: string
          master_id: string
          rating: number
          text: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          master_id: string
          rating: number
          text: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          master_id?: string
          rating?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_reviews_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      master_achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          master_id: string
          place: string
          title: string
          verified: boolean
          year: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          master_id: string
          place?: string
          title: string
          verified?: boolean
          year?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          master_id?: string
          place?: string
          title?: string
          verified?: boolean
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "master_achievements_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      master_cafes: {
        Row: {
          city: string
          created_at: string
          id: string
          master_id: string
          name: string
          note: string
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          master_id: string
          name: string
          note?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          master_id?: string
          name?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_cafes_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      master_drinks: {
        Row: {
          created_at: string
          description: string
          id: string
          master_id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          master_id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          master_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_drinks_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      masters: {
        Row: {
          avatar_url: string | null
          bio: string
          card_style: string
          city: string
          created_at: string
          id: string
          is_demo: boolean
          kind: string
          name: string
          title: string
          updated_at: string
          user_id: string | null
          workplace: string
          years_experience: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          card_style?: string
          city?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          kind: string
          name: string
          title?: string
          updated_at?: string
          user_id?: string | null
          workplace?: string
          years_experience?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          card_style?: string
          city?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          kind?: string
          name?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          workplace?: string
          years_experience?: number
        }
        Relationships: []
      }
      peer_endorsements: {
        Row: {
          author_master_id: string
          created_at: string
          id: string
          master_id: string
          text: string
        }
        Insert: {
          author_master_id: string
          created_at?: string
          id?: string
          master_id: string
          text: string
        }
        Update: {
          author_master_id?: string
          created_at?: string
          id?: string
          master_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_endorsements_author_master_id_fkey"
            columns: ["author_master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_endorsements_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
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
      demo_visible: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_master: { Args: { _master_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
