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
      cantinho_areas: {
        Row: {
          created_at: string
          descricao: string
          emoji: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          emoji?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          emoji?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cantinho_diarios: {
        Row: {
          area_id: string
          atualizado_em: string
          conteudo: string
          created_at: string
          criado_em: string
          data: string
          id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id: string
          atualizado_em?: string
          conteudo?: string
          created_at?: string
          criado_em?: string
          data?: string
          id?: string
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: string
          atualizado_em?: string
          conteudo?: string
          created_at?: string
          criado_em?: string
          data?: string
          id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cantinho_diarios_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "cantinho_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cantinho_diarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cantinho_media: {
        Row: {
          area_id: string
          created_at: string
          id: string
          legenda: string
          mime_type: string | null
          origem: string
          significado: string
          storage_path: string | null
          tamanho_bytes: number | null
          tipo: string
          titulo: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string
          id?: string
          legenda?: string
          mime_type?: string | null
          origem?: string
          significado?: string
          storage_path?: string | null
          tamanho_bytes?: number | null
          tipo: string
          titulo?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string
          id?: string
          legenda?: string
          mime_type?: string | null
          origem?: string
          significado?: string
          storage_path?: string | null
          tamanho_bytes?: number | null
          tipo?: string
          titulo?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cantinho_media_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "cantinho_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      carta_enfrentamento_leituras: {
        Row: {
          created_at: string
          data: string
          id: string
          quantidade: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          quantidade?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          quantidade?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carta_enfrentamento_leituras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conquista_notificacoes: {
        Row: {
          conquista_tipo: string
          id: string
          recebido_em: string
          user_id: string
        }
        Insert: {
          conquista_tipo: string
          id?: string
          recebido_em?: string
          user_id: string
        }
        Update: {
          conquista_tipo?: string
          id?: string
          recebido_em?: string
          user_id?: string
        }
        Relationships: []
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
      editor_templates: {
        Row: {
          conteudo_html: string
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo_html?: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo_html?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      espelhos_autotraicao: {
        Row: {
          arrependimento: string
          categoria: string
          created_at: string
          distancia: string
          futuro: string
          id: string
          instante: string
          negociacao: string
          pacto: string
          preco: string
          promessa: string
          reconquista: string
          sabia: string
          sonhos: string
          user_id: string
          verdade: string
        }
        Insert: {
          arrependimento: string
          categoria?: string
          created_at?: string
          distancia: string
          futuro: string
          id?: string
          instante: string
          negociacao: string
          pacto: string
          preco: string
          promessa: string
          reconquista: string
          sabia: string
          sonhos: string
          user_id: string
          verdade: string
        }
        Update: {
          arrependimento?: string
          categoria?: string
          created_at?: string
          distancia?: string
          futuro?: string
          id?: string
          instante?: string
          negociacao?: string
          pacto?: string
          preco?: string
          promessa?: string
          reconquista?: string
          sabia?: string
          sonhos?: string
          user_id?: string
          verdade?: string
        }
        Relationships: []
      }
      espelhos_responsabilidade: {
        Row: {
          aconteceu: string
          buscava: string
          categoria: string
          created_at: string
          fiz: string
          id: string
          pote_biscoito_id: string | null
          proxima_vez: string
          sob_controle: string
          user_id: string
        }
        Insert: {
          aconteceu: string
          buscava: string
          categoria?: string
          created_at?: string
          fiz: string
          id?: string
          pote_biscoito_id?: string | null
          proxima_vez: string
          sob_controle: string
          user_id: string
        }
        Update: {
          aconteceu?: string
          buscava?: string
          categoria?: string
          created_at?: string
          fiz?: string
          id?: string
          pote_biscoito_id?: string | null
          proxima_vez?: string
          sob_controle?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "espelhos_responsabilidade_pote_biscoito_id_fkey"
            columns: ["pote_biscoito_id"]
            isOneToOne: false
            referencedRelation: "pote_biscoitos"
            referencedColumns: ["id"]
          },
        ]
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
          quantidade_atual: number
          user_id: string
        }
        Insert: {
          completado?: boolean
          criado_em?: string
          data?: string
          habito_id: string
          id?: string
          quantidade_atual?: number
          user_id: string
        }
        Update: {
          completado?: boolean
          criado_em?: string
          data?: string
          habito_id?: string
          id?: string
          quantidade_atual?: number
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
          quantidade_meta: number
          texto_apoio_html: string | null
          tipo: string
          tipo_tarefa: string
          updated_at: string
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome: string
          peso_dano_cura?: number
          peso_ouro?: number
          peso_xp?: number
          quantidade_meta?: number
          texto_apoio_html?: string | null
          tipo: string
          tipo_tarefa?: string
          updated_at?: string
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
          peso_dano_cura?: number
          peso_ouro?: number
          peso_xp?: number
          quantidade_meta?: number
          texto_apoio_html?: string | null
          tipo?: string
          tipo_tarefa?: string
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
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
      jejum_ativo: {
        Row: {
          atualizado_em: string
          inicio: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          inicio: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          inicio?: string
          user_id?: string
        }
        Relationships: []
      }
      jejum_sessoes: {
        Row: {
          autodominio: number
          criado_em: string
          fim: string
          id: string
          inicio: string
          minutos: number
          ouro: number
          user_id: string
          vida: number
          xp: number
        }
        Insert: {
          autodominio?: number
          criado_em?: string
          fim: string
          id?: string
          inicio: string
          minutos: number
          ouro?: number
          user_id: string
          vida?: number
          xp?: number
        }
        Update: {
          autodominio?: number
          criado_em?: string
          fim?: string
          id?: string
          inicio?: string
          minutos?: number
          ouro?: number
          user_id?: string
          vida?: number
          xp?: number
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
      pote_biscoitos: {
        Row: {
          created_at: string
          descricao: string
          id: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      presencas_diarias: {
        Row: {
          criado_em: string
          data: string
          id: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          data: string
          id?: string
          user_id: string
        }
        Update: {
          criado_em?: string
          data?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_diarias_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      user_app_state: {
        Row: {
          chave: string
          created_at: string
          updated_at: string
          user_id: string
          valor: Json
        }
        Insert: {
          chave: string
          created_at?: string
          updated_at?: string
          user_id: string
          valor?: Json
        }
        Update: {
          chave?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_app_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          agua_meta_ml: number | null
          agua_reset_at: string | null
          avatar_equipado: Json
          carta_enfrentamento: string | null
          criado_em: string
          id: string
          itens_desbloqueados: string[]
          jejum_reset_at: string | null
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
          agua_meta_ml?: number | null
          agua_reset_at?: string | null
          avatar_equipado?: Json
          carta_enfrentamento?: string | null
          criado_em?: string
          id: string
          itens_desbloqueados?: string[]
          jejum_reset_at?: string | null
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
          agua_meta_ml?: number | null
          agua_reset_at?: string | null
          avatar_equipado?: Json
          carta_enfrentamento?: string | null
          criado_em?: string
          id?: string
          itens_desbloqueados?: string[]
          jejum_reset_at?: string | null
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
      admin_preparar_agua_jejum: { Args: never; Returns: Json }
      claim_conquista_reward: {
        Args: { p_conquista_id: string; p_user_id: string }
        Returns: Json
      }
      delete_editor_template: {
        Args: { p_template_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      registrar_leitura_carta_enfrentamento: {
        Args: { p_data?: string }
        Returns: {
          premiada: boolean
          quantidade: number
        }[]
      }
      registrar_presenca_diaria: { Args: { p_data: string }; Returns: number }
      registrar_recebimento_conquista: {
        Args: { p_conquista_tipo: string }
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
