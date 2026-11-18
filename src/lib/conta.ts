import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PerfilConta = "agronomo" | "produtor" | "gestor";

export interface Conta {
  id: string;
  email: string;
  nome: string;
  perfil: PerfilConta;
}

export function useConta() {
  return useQuery<Conta | null>({
    queryKey: ["conta"],
    enabled: typeof window !== "undefined",
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;
      const { data: perfilRow, error } = await supabase
        .from("profiles")
        .select("nome, perfil")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return {
        id: user.id,
        email: user.email ?? "",
        nome: perfilRow?.nome || (user.email ?? "").split("@")[0] || "Conta",
        perfil: (perfilRow?.perfil as PerfilConta) ?? "produtor",
      };
    },
  });
}
