import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConta } from "@/lib/conta";
import type { Cultura, Severidade, TipoOperacao } from "@/lib/agrohub-store";

export interface Talhao {
  id: string;
  ownerId: string;
  nome: string;
  cultura: Cultura;
  areaHa: number;
  dispositivo: string;
  estadio: string;
  coords: [number, number][];
}

export interface Operacao {
  id: string;
  talhaoId: string;
  safra: string;
  tipo: TipoOperacao;
  produto: string;
  dose: string;
  data: string;
  observacao: string;
}

export interface Safra {
  id: string;
  talhaoId: string;
  nome: string;
  cultura: Cultura;
  areaHa: number;
  produtividade: number;
  plantio: string;
  colheita: string;
  observacao: string;
}

export interface Laudo {
  id: string;
  talhaoId: string;
  autorId: string;
  estadio: string;
  alvo: string;
  severidade: Severidade;
  recomendacao: string;
  data: string;
}

interface CampoCtx {
  isAgronomo: boolean;
  isGestor: boolean;
  produtorId: string;
  setProdutorId: (id: string) => void;
  produtores: { id: string; nome: string }[];
}

const CampoContext = createContext<CampoCtx | null>(null);

export function CampoProvider({ children }: { children: ReactNode }) {
  const { data: conta } = useConta();
  const isAgronomo = conta?.perfil === "agronomo";
  const isGestor = conta?.perfil === "gestor";
  const [escolhido, setEscolhido] = useState("");

  const { data: produtores } = useQuery({
    queryKey: ["produtores"],
    enabled: !!isAgronomo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome")
        .eq("perfil", "produtor")
        .order("nome");
      if (error) throw error;
      return data.map((p) => ({ id: p.id, nome: p.nome || "Produtor sem nome" }));
    },
  });

  const lista = useMemo(() => produtores ?? [], [produtores]);

  useEffect(() => {
    if (isAgronomo && !escolhido && lista[0]) setEscolhido(lista[0].id);
  }, [isAgronomo, escolhido, lista]);

  const value = useMemo<CampoCtx>(
    () => ({
      isAgronomo: !!isAgronomo,
      isGestor: !!isGestor,
      produtorId: isAgronomo ? escolhido : (conta?.id ?? ""),
      setProdutorId: setEscolhido,
      produtores: lista,
    }),
    [isAgronomo, isGestor, escolhido, conta?.id, lista],
  );

  return <CampoContext.Provider value={value}>{children}</CampoContext.Provider>;
}

export function useCampo() {
  const ctx = useContext(CampoContext);
  if (!ctx) throw new Error("useCampo precisa estar dentro de CampoProvider");
  return ctx;
}

export function useTalhoes() {
  const { produtorId } = useCampo();
  return useQuery({
    queryKey: ["talhoes", produtorId],
    enabled: !!produtorId,
    queryFn: async (): Promise<Talhao[]> => {
      const { data, error } = await supabase
        .from("talhoes")
        .select("*")
        .eq("owner_id", produtorId)
        .order("nome");
      if (error) throw error;
      return data.map((t) => ({
        id: t.id,
        ownerId: t.owner_id,
        nome: t.nome,
        cultura: t.cultura as Cultura,
        areaHa: Number(t.area_ha),
        dispositivo: t.dispositivo,
        estadio: t.estadio,
        coords: (t.coords as [number, number][]) ?? [],
      }));
    },
  });
}

export function useOperacoes() {
  const { produtorId } = useCampo();
  return useQuery({
    queryKey: ["operacoes", produtorId],
    enabled: !!produtorId,
    queryFn: async (): Promise<Operacao[]> => {
      const { data, error } = await supabase
        .from("operacoes")
        .select("*")
        .eq("owner_id", produtorId)
        .order("data", { ascending: false });
      if (error) throw error;
      return data.map((o) => ({
        id: o.id,
        talhaoId: o.talhao_id,
        safra: o.safra,
        tipo: o.tipo as TipoOperacao,
        produto: o.produto,
        dose: o.dose,
        data: o.data,
        observacao: o.observacao,
      }));
    },
  });
}

export function useSafras() {
  const { produtorId } = useCampo();
  return useQuery({
    queryKey: ["safras", produtorId],
    enabled: !!produtorId,
    queryFn: async (): Promise<Safra[]> => {
      const { data, error } = await supabase
        .from("safras")
        .select("*")
        .eq("owner_id", produtorId)
        .order("nome", { ascending: false });
      if (error) throw error;
      return data.map((s) => ({
        id: s.id,
        talhaoId: s.talhao_id,
        nome: s.nome,
        cultura: s.cultura as Cultura,
        areaHa: Number(s.area_ha),
        produtividade: Number(s.produtividade),
        plantio: s.plantio ?? "",
        colheita: s.colheita ?? "",
        observacao: s.observacao,
      }));
    },
  });
}

export function useLaudos() {
  const { produtorId } = useCampo();
  return useQuery({
    queryKey: ["vistorias", produtorId],
    enabled: !!produtorId,
    queryFn: async (): Promise<Laudo[]> => {
      const { data, error } = await supabase
        .from("vistorias")
        .select("*")
        .eq("owner_id", produtorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((v) => ({
        id: v.id,
        talhaoId: v.talhao_id,
        autorId: v.autor_id,
        estadio: v.estadio,
        alvo: v.alvo,
        severidade: v.severidade as Severidade,
        recomendacao: v.recomendacao,
        data: v.created_at,
      }));
    },
  });
}

function useInvalidar() {
  const qc = useQueryClient();
  const { produtorId } = useCampo();
  return (chave: string) => qc.invalidateQueries({ queryKey: [chave, produtorId] });
}

export function useAddTalhoes() {
  const { produtorId } = useCampo();
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (novos: Omit<Talhao, "id" | "ownerId">[]) => {
      const { data, error } = await supabase
        .from("talhoes")
        .insert(
          novos.map((t) => ({
            owner_id: produtorId,
            nome: t.nome,
            cultura: t.cultura,
            area_ha: t.areaHa,
            dispositivo: t.dispositivo,
            estadio: t.estadio,
            coords: t.coords,
          })),
        )
        .select("id");
      if (error) throw error;
      return data.map((r) => r.id);
    },
    onSuccess: () => invalidar("talhoes"),
  });
}

export function useAddOperacao() {
  const { produtorId } = useCampo();
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (o: Omit<Operacao, "id">) => {
      const { error } = await supabase.from("operacoes").insert({
        owner_id: produtorId,
        talhao_id: o.talhaoId,
        safra: o.safra,
        tipo: o.tipo,
        produto: o.produto,
        dose: o.dose,
        data: o.data,
        observacao: o.observacao,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidar("operacoes"),
  });
}

export function useAddSafra() {
  const { produtorId } = useCampo();
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (s: Omit<Safra, "id">) => {
      const { error } = await supabase.from("safras").insert({
        owner_id: produtorId,
        talhao_id: s.talhaoId,
        nome: s.nome,
        cultura: s.cultura,
        area_ha: s.areaHa,
        produtividade: s.produtividade,
        plantio: s.plantio || null,
        colheita: s.colheita || null,
        observacao: s.observacao,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidar("safras"),
  });
}

export function useAddLaudo() {
  const { produtorId } = useCampo();
  const { data: conta } = useConta();
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (v: {
      talhaoId: string;
      estadio: string;
      alvo: string;
      severidade: Severidade;
      recomendacao: string;
    }) => {
      const { error } = await supabase.from("vistorias").insert({
        owner_id: produtorId,
        autor_id: conta?.id ?? produtorId,
        talhao_id: v.talhaoId,
        estadio: v.estadio,
        alvo: v.alvo,
        severidade: v.severidade,
        recomendacao: v.recomendacao,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidar("vistorias"),
  });
}

function poligono(lat: number, lng: number, d: number): [number, number][] {
  return [
    [lat, lng],
    [lat + d, lng + d * 0.9],
    [lat + d * 0.7, lng + d * 2],
    [lat - d * 0.4, lng + d * 1.6],
  ];
}

export function useSeedExemplo() {
  const { produtorId } = useCampo();
  const { data: conta } = useConta();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const base = [
        {
          nome: "Talhão Sede Norte",
          cultura: "soja",
          area_ha: 180,
          dispositivo: "Garmin eTrex 32x",
          estadio: "V4",
          coords: poligono(-30.05, -51.35, 0.012),
        },
        {
          nome: "Talhão Coxilha",
          cultura: "soja",
          area_ha: 120,
          dispositivo: "Garmin GPSMAP 66i",
          estadio: "V6",
          coords: poligono(-30.08, -51.32, 0.01),
        },
        {
          nome: "Quadra Banhado",
          cultura: "arroz",
          area_ha: 95,
          dispositivo: "Garmin eTrex 22x",
          estadio: "Perfilhamento / Irrigação",
          coords: poligono(-30.11, -51.38, 0.009),
        },
      ].map((t) => ({ ...t, owner_id: produtorId }));

      const { data: criados, error } = await supabase
        .from("talhoes")
        .insert(base)
        .select("id, nome, cultura, area_ha");
      if (error) throw error;
      const porNome = (n: string) => criados.find((c) => c.nome === n)!;
      const t1 = porNome("Talhão Sede Norte");
      const t2 = porNome("Talhão Coxilha");
      const t3 = porNome("Quadra Banhado");

      const { error: operacoesError } = await supabase.from("operacoes").insert([
        {
          owner_id: produtorId,
          talhao_id: t1.id,
          safra: "2025/2026",
          tipo: "correcao",
          produto: "Calcário dolomítico",
          dose: "2,2 t/ha",
          data: "2025-08-18",
          observacao: "pH corrigido para 5,8 conforme análise de solo.",
        },
        {
          owner_id: produtorId,
          talhao_id: t1.id,
          safra: "2025/2026",
          tipo: "adubacao",
          produto: "MAP 11-52-00 + KCl 60%",
          dose: "170 kg/ha + 120 kg/ha",
          data: "2025-10-26",
          observacao: "Adubação de base no sulco de semeadura.",
        },
        {
          owner_id: produtorId,
          talhao_id: t2.id,
          safra: "2025/2026",
          tipo: "semeadura",
          produto: "Soja BMX Ativa RR — 12 sem/m",
          dose: "48 kg/ha",
          data: "2025-10-30",
          observacao: "Espaçamento de 45 cm.",
        },
        {
          owner_id: produtorId,
          talhao_id: t3.id,
          safra: "2024/2025",
          tipo: "adubacao",
          produto: "Ureia protegida (cobertura)",
          dose: "130 kg/ha em duas parcelas",
          data: "2024-11-20",
          observacao: "Primeira parcela antes da entrada da água.",
        },
      ]);

      if (operacoesError) throw operacoesError;
      const { error: safrasError } = await supabase.from("safras").insert([
        {
          owner_id: produtorId,
          talhao_id: t1.id,
          nome: "2023/2024",
          cultura: "soja",
          area_ha: 180,
          produtividade: 58,
          plantio: "2023-11-05",
          colheita: "2024-03-22",
          observacao: "Veranico em janeiro reduziu o enchimento de grãos.",
        },
        {
          owner_id: produtorId,
          talhao_id: t1.id,
          nome: "2024/2025",
          cultura: "soja",
          area_ha: 180,
          produtividade: 64,
          plantio: "2024-10-28",
          colheita: "2025-03-18",
          observacao: "Duas aplicações de fungicida controlaram a ferrugem.",
        },
        {
          owner_id: produtorId,
          talhao_id: t3.id,
          nome: "2024/2025",
          cultura: "arroz",
          area_ha: 95,
          produtividade: 152,
          plantio: "2023-10-12",
          colheita: "2024-03-05",
          observacao: "Lâmina de água bem conduzida.",
        },
        {
          owner_id: produtorId,
          talhao_id: t2.id,
          nome: "2025/2026",
          cultura: "soja",
          area_ha: 120,
          produtividade: 0,
          plantio: "2025-10-30",
          colheita: null,
          observacao: "Safra em andamento.",
        },
      ]);

      if (safrasError) throw safrasError;
      const { error: vistoriasError } = await supabase.from("vistorias").insert([
        {
          owner_id: produtorId,
          autor_id: conta?.id ?? produtorId,
          talhao_id: t1.id,
          estadio: "V4",
          alvo: "Percevejo-marrom",
          severidade: "media",
          recomendacao:
            "Nível de dano econômico próximo do limite. Monitorar em 5 dias e programar inseticida se ultrapassar 2 percevejos/pano.",
        },
        {
          owner_id: produtorId,
          autor_id: conta?.id ?? produtorId,
          talhao_id: t2.id,
          estadio: "V6",
          alvo: "Ferrugem-asiática",
          severidade: "alta",
          recomendacao:
            "Aplicar fungicida triazol + estrobilurina com volume de 150 L/ha e boa cobertura do baixeiro.",
        },
      ]);
      if (vistoriasError) throw vistoriasError;
    },
    onSuccess: () => {
      for (const chave of ["talhoes", "operacoes", "safras", "vistorias"]) {
        qc.invalidateQueries({ queryKey: [chave, produtorId] });
      }
    },
  });
}
