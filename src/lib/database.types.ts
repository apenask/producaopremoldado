export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      produtos: {
        Row: {
          id: string
          nome: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_produtos: {
        Row: {
          id: string
          produto_id: string
          unidades_por_tabua: number | null
          unidades_por_forma: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          produto_id: string
          unidades_por_tabua?: number | null
          unidades_por_forma?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          produto_id?: string
          unidades_por_tabua?: number | null
          unidades_por_forma?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: true
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          }
        ]
      }
      categorias_producao: {
        Row: {
          id: string
          nome: string
          tipo: 'tabuas' | 'formas' | 'unidades'
          descricao: string
          is_protected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          tipo?: 'tabuas' | 'formas' | 'unidades'
          descricao?: string
          is_protected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: 'tabuas' | 'formas' | 'unidades'
          descricao?: string
          is_protected?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      producoes_diarias: {
        Row: {
          id: string
          data: string
          texto_gerado: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          texto_gerado: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          texto_gerado?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      itens_producao: {
        Row: {
          id: string
          producao_id: string
          produto_id: string
          categoria_id: string
          quantidade: number
          unidades_total: number | null
          created_at: string
          tipo_medida: 'tabuas' | 'formas' | 'unidades'
        }
        Insert: {
          id?: string
          producao_id: string
          produto_id: string
          categoria_id: string
          quantidade: number
          unidades_total?: number | null
          created_at?: string
          tipo_medida?: 'tabuas' | 'formas' | 'unidades'
        }
        Update: {
          id?: string
          producao_id?: string
          produto_id?: string
          categoria_id?: string
          quantidade?: number
          unidades_total?: number | null
          created_at?: string
          tipo_medida?: 'tabuas' | 'formas' | 'unidades'
        }
        Relationships: [
          {
            foreignKeyName: "itens_producao_producao_id_fkey"
            columns: ["producao_id"]
            isOneToOne: false
            referencedRelation: "producoes_diarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_producao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_producao_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_producao"
            referencedColumns: ["id"]
          }
        ]
      }
      // INÍCIO DA ALTERAÇÃO: Novas tabelas para controle de diaristas
      diaristas: {
        Row: {
          id: string
          nome: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      controle_diaristas: {
        Row: {
          id: string
          diarista_id: string
          data: string
          status: 'presente' | 'falta' | 'meia_diaria'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          diarista_id: string
          data: string
          status?: 'presente' | 'falta' | 'meia_diaria'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          diarista_id?: string
          data?: string
          status?: 'presente' | 'falta' | 'meia_diaria'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "controle_diaristas_diarista_id_fkey"
            columns: ["diarista_id"]
            isOneToOne: false
            referencedRelation: "diaristas"
            referencedColumns: ["id"]
          }
        ]
      }
      // FIM DA ALTERAÇÃO: Novas tabelas para controle de diaristas
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_tipo: 'tabuas' | 'formas' | 'unidades'
      // INÍCIO DA ALTERAÇÃO: Novo enum para status de diarista
      diarista_status: 'presente' | 'falta' | 'meia_diaria'
      // FIM DA ALTERAÇÃO: Novo enum para status de diarista
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}