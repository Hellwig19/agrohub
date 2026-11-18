export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      assinaturas: {
        Row: {
          created_at: string;
          expira_em: string;
          forma_recebimento: string;
          observacoes_internas: string;
          plano: string;
          produtor_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          expira_em?: string;
          forma_recebimento?: string;
          observacoes_internas?: string;
          plano?: string;
          produtor_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          expira_em?: string;
          forma_recebimento?: string;
          observacoes_internas?: string;
          plano?: string;
          produtor_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assinaturas_produtor_id_fkey";
            columns: ["produtor_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      manutencoes: {
        Row: {
          created_at: string;
          descricao: string;
          horas_previstas: number | null;
          id: string;
          maquina_id: string;
          owner_id: string;
          prevista_em: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          descricao: string;
          horas_previstas?: number | null;
          id?: string;
          maquina_id: string;
          owner_id: string;
          prevista_em?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          descricao?: string;
          horas_previstas?: number | null;
          id?: string;
          maquina_id?: string;
          owner_id?: string;
          prevista_em?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manutencoes_maquina_id_fkey";
            columns: ["maquina_id"];
            isOneToOne: false;
            referencedRelation: "maquinas";
            referencedColumns: ["id"];
          },
        ];
      };
      maquinas: {
        Row: {
          created_at: string;
          device_token: string;
          foto_url: string;
          horimetro: number;
          id: string;
          intervalo_manutencao_h: number;
          modelo: string;
          motor_ligado: boolean;
          nome: string;
          owner_id: string;
          tipo: string;
          ultima_leitura_em: string | null;
          ultima_manutencao_h: number;
        };
        Insert: {
          created_at?: string;
          device_token?: string;
          foto_url?: string;
          horimetro?: number;
          id?: string;
          intervalo_manutencao_h?: number;
          modelo?: string;
          motor_ligado?: boolean;
          nome: string;
          owner_id: string;
          tipo?: string;
          ultima_leitura_em?: string | null;
          ultima_manutencao_h?: number;
        };
        Update: {
          created_at?: string;
          device_token?: string;
          foto_url?: string;
          horimetro?: number;
          id?: string;
          intervalo_manutencao_h?: number;
          modelo?: string;
          motor_ligado?: boolean;
          nome?: string;
          owner_id?: string;
          tipo?: string;
          ultima_leitura_em?: string | null;
          ultima_manutencao_h?: number;
        };
        Relationships: [];
      };
      operacoes: {
        Row: {
          created_at: string;
          data: string;
          dose: string;
          id: string;
          observacao: string;
          owner_id: string;
          produto: string;
          safra: string;
          talhao_id: string;
          tipo: string;
        };
        Insert: {
          created_at?: string;
          data?: string;
          dose?: string;
          id?: string;
          observacao?: string;
          owner_id: string;
          produto?: string;
          safra?: string;
          talhao_id: string;
          tipo?: string;
        };
        Update: {
          created_at?: string;
          data?: string;
          dose?: string;
          id?: string;
          observacao?: string;
          owner_id?: string;
          produto?: string;
          safra?: string;
          talhao_id?: string;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operacoes_talhao_id_fkey";
            columns: ["talhao_id"];
            isOneToOne: false;
            referencedRelation: "talhoes";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          nome: string;
          perfil: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          created_at?: string;
          id: string;
          nome?: string;
          perfil?: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          created_at?: string;
          id?: string;
          nome?: string;
          perfil?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      safras: {
        Row: {
          area_ha: number;
          colheita: string | null;
          created_at: string;
          cultura: string;
          id: string;
          nome: string;
          observacao: string;
          owner_id: string;
          plantio: string | null;
          produtividade: number;
          talhao_id: string;
        };
        Insert: {
          area_ha?: number;
          colheita?: string | null;
          created_at?: string;
          cultura?: string;
          id?: string;
          nome: string;
          observacao?: string;
          owner_id: string;
          plantio?: string | null;
          produtividade?: number;
          talhao_id: string;
        };
        Update: {
          area_ha?: number;
          colheita?: string | null;
          created_at?: string;
          cultura?: string;
          id?: string;
          nome?: string;
          observacao?: string;
          owner_id?: string;
          plantio?: string | null;
          produtividade?: number;
          talhao_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "safras_talhao_id_fkey";
            columns: ["talhao_id"];
            isOneToOne: false;
            referencedRelation: "talhoes";
            referencedColumns: ["id"];
          },
        ];
      };
      servicos: {
        Row: {
          created_at: string;
          custo: number;
          descricao: string;
          horimetro: number;
          id: string;
          maquina_id: string;
          owner_id: string;
          realizado_em: string;
        };
        Insert: {
          created_at?: string;
          custo?: number;
          descricao: string;
          horimetro?: number;
          id?: string;
          maquina_id: string;
          owner_id: string;
          realizado_em?: string;
        };
        Update: {
          created_at?: string;
          custo?: number;
          descricao?: string;
          horimetro?: number;
          id?: string;
          maquina_id?: string;
          owner_id?: string;
          realizado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "servicos_maquina_id_fkey";
            columns: ["maquina_id"];
            isOneToOne: false;
            referencedRelation: "maquinas";
            referencedColumns: ["id"];
          },
        ];
      };
      talhoes: {
        Row: {
          area_ha: number;
          coords: Json;
          created_at: string;
          cultura: string;
          dispositivo: string;
          estadio: string;
          id: string;
          nome: string;
          owner_id: string;
        };
        Insert: {
          area_ha?: number;
          coords?: Json;
          created_at?: string;
          cultura?: string;
          dispositivo?: string;
          estadio?: string;
          id?: string;
          nome: string;
          owner_id: string;
        };
        Update: {
          area_ha?: number;
          coords?: Json;
          created_at?: string;
          cultura?: string;
          dispositivo?: string;
          estadio?: string;
          id?: string;
          nome?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
      telemetria: {
        Row: {
          horas_motor: number;
          id: string;
          maquina_id: string;
          motor_ligado: boolean;
          owner_id: string;
          recebido_em: string;
        };
        Insert: {
          horas_motor?: number;
          id?: string;
          maquina_id: string;
          motor_ligado?: boolean;
          owner_id: string;
          recebido_em?: string;
        };
        Update: {
          horas_motor?: number;
          id?: string;
          maquina_id?: string;
          motor_ligado?: boolean;
          owner_id?: string;
          recebido_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "telemetria_maquina_id_fkey";
            columns: ["maquina_id"];
            isOneToOne: false;
            referencedRelation: "maquinas";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      vistorias: {
        Row: {
          alvo: string;
          autor_id: string;
          created_at: string;
          estadio: string;
          id: string;
          owner_id: string;
          recomendacao: string;
          severidade: string;
          talhao_id: string;
        };
        Insert: {
          alvo?: string;
          autor_id: string;
          created_at?: string;
          estadio?: string;
          id?: string;
          owner_id: string;
          recomendacao?: string;
          severidade?: string;
          talhao_id: string;
        };
        Update: {
          alvo?: string;
          autor_id?: string;
          created_at?: string;
          estadio?: string;
          id?: string;
          owner_id?: string;
          recomendacao?: string;
          severidade?: string;
          talhao_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vistorias_talhao_id_fkey";
            columns: ["talhao_id"];
            isOneToOne: false;
            referencedRelation: "talhoes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "agronomo" | "produtor" | "gestor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["agronomo", "produtor", "gestor"],
    },
  },
} as const;
