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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ajustes_clinicos: {
        Row: {
          autor: string
          avaliacao_id: string
          campos_ajuste: Json | null
          created_at: string
          criado_por: string | null
          id: string
          mensagem: string
          tipo_ajuste: string | null
          user_id: string
        }
        Insert: {
          autor: string
          avaliacao_id: string
          campos_ajuste?: Json | null
          created_at?: string
          criado_por?: string | null
          id?: string
          mensagem: string
          tipo_ajuste?: string | null
          user_id: string
        }
        Update: {
          autor?: string
          avaliacao_id?: string
          campos_ajuste?: Json | null
          created_at?: string
          criado_por?: string | null
          id?: string
          mensagem?: string
          tipo_ajuste?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_clinicos_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          created_at: string
          id: string
          imc: number | null
          respostas: Json
          score_risco: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          imc?: number | null
          respostas?: Json
          score_risco?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          imc?: number | null
          respostas?: Json
          score_risco?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      configuracoes_produtos: {
        Row: {
          ativo: boolean
          id: string
          nome: string
          preco: number
          preco_original: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
          preco: number
          preco_original?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
          preco?: number
          preco_original?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      consent_logs: {
        Row: {
          checkboxes_accepted: Json
          consent_timestamp: string
          created_at: string
          document_hash: string
          email_resend_id: string | null
          email_sent: boolean
          email_sent_at: string | null
          id: string
          ip_address: string
          revocation_reason: string | null
          revoked_at: string | null
          scroll_completed: boolean
          terms_version: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          checkboxes_accepted?: Json
          consent_timestamp: string
          created_at?: string
          document_hash: string
          email_resend_id?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          ip_address: string
          revocation_reason?: string | null
          revoked_at?: string | null
          scroll_completed?: boolean
          terms_version?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          checkboxes_accepted?: Json
          consent_timestamp?: string
          created_at?: string
          document_hash?: string
          email_resend_id?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          ip_address?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          scroll_completed?: boolean
          terms_version?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cupons: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          desconto_percentual: number
          id: string
          uso_atual: number
          uso_maximo: number | null
          validade: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          desconto_percentual: number
          id?: string
          uso_atual?: number
          uso_maximo?: number | null
          validade?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          desconto_percentual?: number
          id?: string
          uso_atual?: number
          uso_maximo?: number | null
          validade?: string | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          avaliacao_id: string | null
          conteudo: Json
          created_at: string
          criado_por: string | null
          id: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avaliacao_id?: string | null
          conteudo?: Json
          created_at?: string
          criado_por?: string | null
          id?: string
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avaliacao_id?: string | null
          conteudo?: Json
          created_at?: string
          criado_por?: string | null
          id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      enderecos: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          estado: string | null
          id: string
          is_default: boolean | null
          logradouro: string | null
          numero: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          is_default?: boolean | null
          logradouro?: string | null
          numero?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          is_default?: boolean | null
          logradouro?: string | null
          numero?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mensagens_acompanhamento: {
        Row: {
          autor: string
          created_at: string
          id: string
          imagem_url: string | null
          lida: boolean
          mensagem: string | null
          user_id: string
        }
        Insert: {
          autor: string
          created_at?: string
          id?: string
          imagem_url?: string | null
          lida?: boolean
          mensagem?: string | null
          user_id: string
        }
        Update: {
          autor?: string
          created_at?: string
          id?: string
          imagem_url?: string | null
          lida?: boolean
          mensagem?: string | null
          user_id?: string
        }
        Relationships: []
      }
      metas_diarias: {
        Row: {
          concluida: boolean | null
          created_at: string
          data: string
          id: string
          titulo: string
          user_id: string
        }
        Insert: {
          concluida?: boolean | null
          created_at?: string
          data?: string
          id?: string
          titulo: string
          user_id: string
        }
        Update: {
          concluida?: boolean | null
          created_at?: string
          data?: string
          id?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      metricas_funil: {
        Row: {
          created_at: string
          data: string
          id: string
          tipo: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          tipo: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          tipo?: string
          valor?: number | null
        }
        Relationships: []
      }
      mfa_otp_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          mfa_enabled: boolean
          preferred_method: string | null
          totp_secret: string | null
          totp_verified: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          mfa_enabled?: boolean
          preferred_method?: string | null
          totp_secret?: string | null
          totp_verified?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          mfa_enabled?: boolean
          preferred_method?: string | null
          totp_secret?: string | null
          totp_verified?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notas_impedimento: {
        Row: {
          avaliacao_id: string | null
          created_at: string
          criado_por: string | null
          id: string
          nota: string
          user_id: string
        }
        Insert: {
          avaliacao_id?: string | null
          created_at?: string
          criado_por?: string | null
          id?: string
          nota: string
          user_id: string
        }
        Update: {
          avaliacao_id?: string | null
          created_at?: string
          criado_por?: string | null
          id?: string
          nota?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_impedimento_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          avaliacao_id: string | null
          created_at: string
          id: string
          lida: boolean
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          avaliacao_id?: string | null
          created_at?: string
          id?: string
          lida?: boolean
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          avaliacao_id?: string | null
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          status: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          status?: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          status?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      prescricoes: {
        Row: {
          aprovado_por: string | null
          avaliacao_id: string | null
          created_at: string
          dosagem: string | null
          id: string
          observacoes: string | null
          tratamento: string
          user_id: string
        }
        Insert: {
          aprovado_por?: string | null
          avaliacao_id?: string | null
          created_at?: string
          dosagem?: string | null
          id?: string
          observacoes?: string | null
          tratamento: string
          user_id: string
        }
        Update: {
          aprovado_por?: string | null
          avaliacao_id?: string | null
          created_at?: string
          dosagem?: string | null
          id?: string
          observacoes?: string | null
          tratamento?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescricoes_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          foto_url: string | null
          has_accepted_terms: boolean | null
          id: string
          nome: string | null
          tema_preferencia: string | null
          terms_accepted_at: string | null
          terms_version_accepted: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          foto_url?: string | null
          has_accepted_terms?: boolean | null
          id?: string
          nome?: string | null
          tema_preferencia?: string | null
          terms_accepted_at?: string | null
          terms_version_accepted?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          foto_url?: string | null
          has_accepted_terms?: boolean | null
          id?: string
          nome?: string | null
          tema_preferencia?: string | null
          terms_accepted_at?: string | null
          terms_version_accepted?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      tratamentos: {
        Row: {
          created_at: string
          data_inicio: string | null
          data_proxima_renovacao: string | null
          documento_pdf_url: string | null
          id: string
          observacoes: string | null
          plano: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_inicio?: string | null
          data_proxima_renovacao?: string | null
          documento_pdf_url?: string | null
          id?: string
          observacoes?: string | null
          plano?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_inicio?: string | null
          data_proxima_renovacao?: string | null
          documento_pdf_url?: string | null
          id?: string
          observacoes?: string | null
          plano?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_used_at: string
          trusted_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_used_at?: string
          trusted_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_used_at?: string
          trusted_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          aceito: boolean
          aceito_em: string
          created_at: string
          id: string
          termo: string
          user_id: string
        }
        Insert: {
          aceito?: boolean
          aceito_em?: string
          created_at?: string
          id?: string
          termo: string
          user_id: string
        }
        Update: {
          aceito?: boolean
          aceito_em?: string
          created_at?: string
          id?: string
          termo?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_mfa_data: { Args: never; Returns: undefined }
      get_public_profile: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          foto_url: string
          id: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_clinical_staff: { Args: never; Returns: boolean }
      sanitize_text_input: { Args: { input_text: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user" | "medico" | "assistente" | "nutricionista"
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
      app_role: ["admin", "user", "medico", "assistente", "nutricionista"],
    },
  },
} as const
