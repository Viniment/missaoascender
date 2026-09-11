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
      avisos: {
        Row: {
          ativo: boolean
          criado_em: string
          criado_por: string | null
          id: string
          mensagem: string
          tipo: string
          titulo: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          id?: string
          mensagem: string
          tipo?: string
          titulo: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          id?: string
          mensagem?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      avisos_lidos: {
        Row: {
          aviso_id: string
          lido_em: string
          user_id: string
        }
        Insert: {
          aviso_id: string
          lido_em?: string
          user_id: string
        }
        Update: {
          aviso_id?: string
          lido_em?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_lidos_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "avisos"
            referencedColumns: ["id"]
          },
        ]
      }
      conquista_recompensas: {
        Row: {
          atributo: string
          atributo_delta: number
          conquista_id: string
          conquista_tipo: string
          criado_em: string
          id: string
          ouro: number
          user_id: string
          vida: number
          xp: number
        }
        Insert: {
          atributo: string
          atributo_delta?: number
          conquista_id: string
          conquista_tipo: string
          criado_em?: string
          id?: string
          ouro?: number
          user_id: string
          vida?: number
          xp?: number
        }
        Update: {
          atributo?: string
          atributo_delta?: number
          conquista_id?: string
          conquista_tipo?: string
          criado_em?: string
          id?: string
          ouro?: number
          user_id?: string
          vida?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "conquista_recompensas_conquista_id_fkey"
            columns: ["conquista_id"]
            isOneToOne: false
            referencedRelation: "conquistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conquista_recompensas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
      estudo_categorias: {
        Row: {
          banner_pos: number
          banner_preset: string | null
          banner_url: string | null
          banner_zoom: number
          criado_em: string
          descricao: string | null
          emoji: string
          id: string
          nome: string
          ordem: number
          updated_at: string
          user_id: string
        }
        Insert: {
          banner_pos?: number
          banner_preset?: string | null
          banner_url?: string | null
          banner_zoom?: number
          criado_em?: string
          descricao?: string | null
          emoji?: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          banner_pos?: number
          banner_preset?: string | null
          banner_url?: string | null
          banner_zoom?: number
          criado_em?: string
          descricao?: string | null
          emoji?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      estudo_notas: {
        Row: {
          categoria_id: string | null
          conteudo: Json | null
          conteudo_texto: string
          criado_em: string
          excluida_em: string | null
          favorita: boolean
          fixada: boolean
          id: string
          na_lixeira: boolean
          tags: string[]
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria_id?: string | null
          conteudo?: Json | null
          conteudo_texto?: string
          criado_em?: string
          excluida_em?: string | null
          favorita?: boolean
          fixada?: boolean
          id?: string
          na_lixeira?: boolean
          tags?: string[]
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria_id?: string | null
          conteudo?: Json | null
          conteudo_texto?: string
          criado_em?: string
          excluida_em?: string | null
          favorita?: boolean
          fixada?: boolean
          id?: string
          na_lixeira?: boolean
          tags?: string[]
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estudo_notas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "estudo_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      fissuras: {
        Row: {
          contexto: string | null
          criado_em: string
          desejo: string | null
          duracao_relatada: string | null
          emocao: string | null
          finalizado_em: string | null
          id: string
          intensidade_final: number | null
          intensidade_inicial: number
          missao_concluida: boolean
          missao_imediata: string | null
          protocolo: Json | null
          resolvida: boolean
          tecnicas_usadas: string[] | null
          tipo_detectado: string | null
          user_id: string
        }
        Insert: {
          contexto?: string | null
          criado_em?: string
          desejo?: string | null
          duracao_relatada?: string | null
          emocao?: string | null
          finalizado_em?: string | null
          id?: string
          intensidade_final?: number | null
          intensidade_inicial: number
          missao_concluida?: boolean
          missao_imediata?: string | null
          protocolo?: Json | null
          resolvida?: boolean
          tecnicas_usadas?: string[] | null
          tipo_detectado?: string | null
          user_id: string
        }
        Update: {
          contexto?: string | null
          criado_em?: string
          desejo?: string | null
          duracao_relatada?: string | null
          emocao?: string | null
          finalizado_em?: string | null
          id?: string
          intensidade_final?: number | null
          intensidade_inicial?: number
          missao_concluida?: boolean
          missao_imediata?: string | null
          protocolo?: Json | null
          resolvida?: boolean
          tecnicas_usadas?: string[] | null
          tipo_detectado?: string | null
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
          peso_ouro: number
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
          peso_ouro?: number
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
          peso_ouro?: number
          peso_xp?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hero_attributes: {
        Row: {
          autodominio: number
          consciencia: number
          coragem: number
          disciplina: number
          foco: number
          gestao: number
          resiliencia: number
          updated_at: string
          user_id: string
        }
        Insert: {
          autodominio?: number
          consciencia?: number
          coragem?: number
          disciplina?: number
          foco?: number
          gestao?: number
          resiliencia?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          autodominio?: number
          consciencia?: number
          coragem?: number
          disciplina?: number
          foco?: number
          gestao?: number
          resiliencia?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hero_attributes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      pensamentos: {
        Row: {
          ai_analise: Json | null
          comportamento: string | null
          consequencia: string | null
          continuum_cem: string | null
          continuum_motivo: string | null
          continuum_valor: number | null
          continuum_zero: string | null
          created_at: string
          distanciamento_status: string | null
          distanciamento_texto: string | null
          distorcoes: string[] | null
          emocao: string | null
          emocoes: string[] | null
          evidencias_contra: string | null
          evidencias_favor: string | null
          id: string
          intensidade_emocao: number | null
          intensidade_final: number | null
          pensamento_alternativo: string | null
          pensamento_automatico: string
          sem_alternativo: boolean
          situacao: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analise?: Json | null
          comportamento?: string | null
          consequencia?: string | null
          continuum_cem?: string | null
          continuum_motivo?: string | null
          continuum_valor?: number | null
          continuum_zero?: string | null
          created_at?: string
          distanciamento_status?: string | null
          distanciamento_texto?: string | null
          distorcoes?: string[] | null
          emocao?: string | null
          emocoes?: string[] | null
          evidencias_contra?: string | null
          evidencias_favor?: string | null
          id?: string
          intensidade_emocao?: number | null
          intensidade_final?: number | null
          pensamento_alternativo?: string | null
          pensamento_automatico: string
          sem_alternativo?: boolean
          situacao: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analise?: Json | null
          comportamento?: string | null
          consequencia?: string | null
          continuum_cem?: string | null
          continuum_motivo?: string | null
          continuum_valor?: number | null
          continuum_zero?: string | null
          created_at?: string
          distanciamento_status?: string | null
          distanciamento_texto?: string | null
          distorcoes?: string[] | null
          emocao?: string | null
          emocoes?: string[] | null
          evidencias_contra?: string | null
          evidencias_favor?: string | null
          id?: string
          intensidade_emocao?: number | null
          intensidade_final?: number | null
          pensamento_alternativo?: string | null
          pensamento_automatico?: string
          sem_alternativo?: boolean
          situacao?: string
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
      trataka_sessoes: {
        Row: {
          concluida: boolean
          criado_em: string
          duracao_alvo_seg: number
          duracao_seg: number
          id: string
          modo: string
          som_ambiente: string | null
          user_id: string
        }
        Insert: {
          concluida?: boolean
          criado_em?: string
          duracao_alvo_seg?: number
          duracao_seg?: number
          id?: string
          modo?: string
          som_ambiente?: string | null
          user_id: string
        }
        Update: {
          concluida?: boolean
          criado_em?: string
          duracao_alvo_seg?: number
          duracao_seg?: number
          id?: string
          modo?: string
          som_ambiente?: string | null
          user_id?: string
        }
        Relationships: []
      }
      urge_surfs: {
        Row: {
          cedeu: boolean | null
          ciclos_respiracao: number
          created_at: string
          desejo: string | null
          duracao_seg: number
          id: string
          intensidade_final: number | null
          intensidade_inicial: number
          user_id: string
        }
        Insert: {
          cedeu?: boolean | null
          ciclos_respiracao?: number
          created_at?: string
          desejo?: string | null
          duracao_seg?: number
          id?: string
          intensidade_final?: number | null
          intensidade_inicial: number
          user_id: string
        }
        Update: {
          cedeu?: boolean | null
          ciclos_respiracao?: number
          created_at?: string
          desejo?: string | null
          duracao_seg?: number
          id?: string
          intensidade_final?: number | null
          intensidade_inicial?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_equipado: Json
          carta_enfrentamento: string | null
          criado_em: string
          id: string
          itens_desbloqueados: string[]
          nivel: number
          nome: string
          ouro: number
          streak_atual: number
          titulo: string | null
          ultimo_bau_data: string | null
          updated_at: string
          vida_atual: number
          vida_max: number
          xp_atual: number
          xp_proximo_nivel: number
        }
        Insert: {
          avatar_equipado?: Json
          carta_enfrentamento?: string | null
          criado_em?: string
          id: string
          itens_desbloqueados?: string[]
          nivel?: number
          nome?: string
          ouro?: number
          streak_atual?: number
          titulo?: string | null
          ultimo_bau_data?: string | null
          updated_at?: string
          vida_atual?: number
          vida_max?: number
          xp_atual?: number
          xp_proximo_nivel?: number
        }
        Update: {
          avatar_equipado?: Json
          carta_enfrentamento?: string | null
          criado_em?: string
          id?: string
          itens_desbloqueados?: string[]
          nivel?: number
          nome?: string
          ouro?: number
          streak_atual?: number
          titulo?: string | null
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
      claim_conquista_reward: {
        Args: { p_conquista_id: string; p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      xp_for_level_reward: { Args: { p_level: number }; Returns: number }
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
