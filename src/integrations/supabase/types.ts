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
      alertas_estoque: {
        Row: {
          created_at: string | null
          id: string
          limite_amarelo_max: number
          limite_amarelo_min: number
          limite_verde_max: number
          limite_verde_min: number
          limite_vermelho_max: number
          limite_vermelho_min: number
          produto_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          limite_amarelo_max?: number
          limite_amarelo_min?: number
          limite_verde_max?: number
          limite_verde_min?: number
          limite_vermelho_max?: number
          limite_vermelho_min?: number
          produto_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          limite_amarelo_max?: number
          limite_amarelo_min?: number
          limite_verde_max?: number
          limite_verde_min?: number
          limite_vermelho_max?: number
          limite_vermelho_min?: number
          produto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: true
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          codigo_produto: string
          cor_produto: string | null
          created_at: string | null
          id: string
          nome_produto: string
          pedido_id: string | null
          produto_id: string | null
          quantidade_pedida: number
        }
        Insert: {
          codigo_produto: string
          cor_produto?: string | null
          created_at?: string | null
          id?: string
          nome_produto: string
          pedido_id?: string | null
          produto_id?: string | null
          quantidade_pedida: number
        }
        Update: {
          codigo_produto?: string
          cor_produto?: string | null
          created_at?: string | null
          id?: string
          nome_produto?: string
          pedido_id?: string | null
          produto_id?: string | null
          quantidade_pedida?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_venda: {
        Row: {
          codigo_produto: string
          cor_produto: string | null
          created_at: string | null
          id: string
          nome_produto: string
          produto_id: string | null
          quantidade: number
          subtotal: number
          valor_unitario: number
          venda_id: string | null
        }
        Insert: {
          codigo_produto: string
          cor_produto?: string | null
          created_at?: string | null
          id?: string
          nome_produto: string
          produto_id?: string | null
          quantidade: number
          subtotal: number
          valor_unitario: number
          venda_id?: string | null
        }
        Update: {
          codigo_produto?: string
          cor_produto?: string | null
          created_at?: string | null
          id?: string
          nome_produto?: string
          produto_id?: string | null
          quantidade?: number
          subtotal?: number
          valor_unitario?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_venda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cor_alerta: Database["public"]["Enums"]["alert_color"] | null
          created_at: string | null
          data_criacao: string
          data_prevista_entrega: string
          id: string
          numero_pedido: string
          prazo_entrega_dias: number
          status: Database["public"]["Enums"]["order_status"] | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          cor_alerta?: Database["public"]["Enums"]["alert_color"] | null
          created_at?: string | null
          data_criacao?: string
          data_prevista_entrega: string
          id?: string
          numero_pedido: string
          prazo_entrega_dias: number
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          cor_alerta?: Database["public"]["Enums"]["alert_color"] | null
          created_at?: string | null
          data_criacao?: string
          data_prevista_entrega?: string
          id?: string
          numero_pedido?: string
          prazo_entrega_dias?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          codigo: string
          codigo_barras: string | null
          cor: string | null
          created_at: string | null
          estoque_atual: number
          fornecedor: string | null
          foto_url: string | null
          id: string
          markup: number | null
          nome: string
          updated_at: string | null
          valor_unitario: number
          valor_venda: number
        }
        Insert: {
          codigo: string
          codigo_barras?: string | null
          cor?: string | null
          created_at?: string | null
          estoque_atual?: number
          fornecedor?: string | null
          foto_url?: string | null
          id?: string
          markup?: number | null
          nome: string
          updated_at?: string | null
          valor_unitario: number
          valor_venda: number
        }
        Update: {
          codigo?: string
          codigo_barras?: string | null
          cor?: string | null
          created_at?: string | null
          estoque_atual?: number
          fornecedor?: string | null
          foto_url?: string | null
          id?: string
          markup?: number | null
          nome?: string
          updated_at?: string | null
          valor_unitario?: number
          valor_venda?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome: string
          permissoes: Json | null
          senha_temporaria: boolean | null
          tipo_acesso: Database["public"]["Enums"]["user_access_type"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nome: string
          permissoes?: Json | null
          senha_temporaria?: boolean | null
          tipo_acesso?: Database["public"]["Enums"]["user_access_type"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          permissoes?: Json | null
          senha_temporaria?: boolean | null
          tipo_acesso?: Database["public"]["Enums"]["user_access_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vendas: {
        Row: {
          created_at: string | null
          id: string
          troco: number | null
          usuario_id: string | null
          valor_recebido: number
          valor_total: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          troco?: number | null
          usuario_id?: string | null
          valor_recebido: number
          valor_total: number
        }
        Update: {
          created_at?: string | null
          id?: string
          troco?: number | null
          usuario_id?: string | null
          valor_recebido?: number
          valor_total?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_order_alert_color: {
        Args: { data_criacao: string; prazo_entrega_dias: number }
        Returns: Database["public"]["Enums"]["alert_color"]
      }
      generate_order_number: { Args: never; Returns: string }
      generate_product_code: { Args: never; Returns: string }
    }
    Enums: {
      alert_color: "verde" | "amarelo" | "vermelho" | "sem_cor"
      order_status:
        | "emitido"
        | "em_transito"
        | "atrasado"
        | "recebido"
        | "devolvido"
        | "cancelado"
      user_access_type: "admin" | "common"
      user_access_type_new: "admin" | "comum"
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
      alert_color: ["verde", "amarelo", "vermelho", "sem_cor"],
      order_status: [
        "emitido",
        "em_transito",
        "atrasado",
        "recebido",
        "devolvido",
        "cancelado",
      ],
      user_access_type: ["admin", "common"],
      user_access_type_new: ["admin", "comum"],
    },
  },
} as const
