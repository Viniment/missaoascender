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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      conquistas: {
        Row: {
          desbloqueada_em: string
          descricao: string | null
          id: string
          tipo: string
          titulo: string | null
          user_id: string
        }
        Insert: {
          desbloqueada_em?: string
          descricao?: string | null
          id?: string
          tipo: string
          titulo?: string | null
          user_id: string
        }
        Update: {
          desbloqueada_em?: string
          descricao?: string | null
          id?: string
          tipo?: string
          titulo?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habito_logs: {
        Row: {
          completado: boolean
          criado_em: string
          data: string
          habito_id: string
          id: string
          user_id: string
        }
        Insert: {
          completado?: boolean
          criado_em?: string
          data?: string
          habito_id: string
          id?: string
          user_id: string
        }
        Update: {
          completado?: boolean
          criado_em?: string
          data?: string
          habito_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habito_logs_habito_id_fkey"
            columns: ["habito_id"]
            isOneToOne: false
            referencedRelation: "habitos"
            referencedColumns: ["id"]
          },
        ]
      }
      habitos: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          nome: string
          peso_dano_cura: number
          peso_xp: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome: string
          peso_dano_cura?: number
          peso_xp?: number
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
          peso_dano_cura?: number
          peso_xp?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inimigo: {
        Row: {
          ativo: boolean
          avatar_config: Json | null
          criado_em: string
          derrotado_em: string | null
          gatilho: string | null
          hp_atual: number
          hp_max: number
          id: string
          mentiras: string[]
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          avatar_config?: Json | null
          criado_em?: string
          derrotado_em?: string | null
          gatilho?: string | null
          hp_atual?: number
          hp_max?: number
          id?: string
          mentiras?: string[]
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          avatar_config?: Json | null
          criado_em?: string
          derrotado_em?: string | null
          gatilho?: string | null
          hp_atual?: number
          hp_max?: number
          id?: string
          mentiras?: string[]
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mini_vitorias: {
        Row: {
          concluida: boolean
          concluida_em: string | null
          criado_em: string
          id: string
          recompensa_ouro: number
          recompensa_vida: number
          recompensa_xp: number
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concluida?: boolean
          concluida_em?: string | null
          criado_em?: string
          id?: string
          recompensa_ouro?: number
          recompensa_vida?: number
          recompensa_xp?: number
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concluida?: boolean
          concluida_em?: string | null
          criado_em?: string
          id?: string
          recompensa_ouro?: number
          recompensa_vida?: number
          recompensa_xp?: number
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_respostas: {
        Row: {
          criado_em: string
          custo_procrastinacao: string | null
          desculpas: string[] | null
          funcao_protetora: string | null
          id: string
          sonho: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          custo_procrastinacao?: string | null
          desculpas?: string[] | null
          funcao_protetora?: string | null
          id?: string
          sonho?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          criado_em?: string
          custo_procrastinacao?: string | null
          desculpas?: string[] | null
          funcao_protetora?: string | null
          id?: string
          sonho?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transacoes_ouro: {
        Row: {
          data: string
          descricao: string | null
          id: string
          origem: string
          user_id: string
          valor: number
        }
        Insert: {
          data?: string
          descricao?: string | null
          id?: string
          origem: string
          user_id: string
          valor: number
        }
        Update: {
          data?: string
          descricao?: string | null
          id?: string
          origem?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          criado_em: string
          id: string
          nivel: number
          nome: string
          ouro: number
          streak_atual: number
          ultimo_bau_data: string | null
          updated_at: string
          vida_atual: number
          vida_max: number
          xp_atual: number
          xp_proximo_nivel: number
        }
        Insert: {
          criado_em?: string
          id: string
          nivel?: number
          nome?: string
          ouro?: number
          streak_atual?: number
          ultimo_bau_data?: string | null
          updated_at?: string
          vida_atual?: number
          vida_max?: number
          xp_atual?: number
          xp_proximo_nivel?: number
        }
        Update: {
          criado_em?: string
          id?: string
          nivel?: number
          nome?: string
          ouro?: number
          streak_atual?: number
          ultimo_bau_data?: string | null
          updated_at?: string
          vida_atual?: number
          vida_max?: number
          xp_atual?: number
          xp_proximo_nivel?: number
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
    Enums: {},
  },
} as const
