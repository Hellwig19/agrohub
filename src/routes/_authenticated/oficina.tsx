import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Gauge, Plus, Wrench, AlertTriangle, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/badges";
import { supabase } from "@/integrations/supabase/client";
import { useConta } from "@/lib/conta";
import tratorVerde from "@/assets/trator-verde.jpg";
import tratorVermelho from "@/assets/trator-vermelho.jpg";
import colheitadeiraImg from "@/assets/colheitadeira.jpg";

export const Route = createFileRoute("/_authenticated/oficina")({
  head: () => ({
    meta: [
      { title: "Oficina & Máquinas — AgroHub" },
      {
        name: "description",
        content:
          "Horímetro das máquinas via sensores nos tratores, próximas manutenções e histórico de serviços realizados.",
      },
      { property: "og:title", content: "Oficina & Máquinas — AgroHub" },
      {
        property: "og:description",
        content: "Horas de motor, manutenções previstas e histórico de serviços.",
      },
    ],
  }),
  component: Oficina,
});

interface Maquina {
  id: string;
  nome: string;
  modelo: string;
  tipo: string;
  horimetro: number;
  intervalo_manutencao_h: number;
  ultima_manutencao_h: number;
  device_token: string;
  motor_ligado: boolean;
  ultima_leitura_em: string | null;
  foto_url: string;
}

interface Servico {
  id: string;
  maquina_id: string;
  descricao: string;
  custo: number;
  horimetro: number;
  realizado_em: string;
}

const CAMPO =
  "mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";

const EXEMPLOS = [
  {
    nome: "Trator 1 — Sede",
    modelo: "John Deere 6110J",
    tipo: "trator",
    horimetro: 4820.5,
    intervalo_manutencao_h: 250,
    ultima_manutencao_h: 4640,
    foto_url: "",
  },
  {
    nome: "Trator 2 — Coxilha",
    modelo: "Case IH Farmall 80",
    tipo: "trator",
    horimetro: 2310,
    intervalo_manutencao_h: 250,
    ultima_manutencao_h: 2295,
    foto_url: "",
  },
  {
    nome: "Colheitadeira",
    modelo: "John Deere S440",
    tipo: "colheitadeira",
    horimetro: 1780.2,
    intervalo_manutencao_h: 300,
    ultima_manutencao_h: 1740,
    foto_url: "",
  },
];

function fotoDe(m: { foto_url?: string; modelo: string; tipo: string }) {
  if (m.foto_url) return m.foto_url;
  if (m.tipo === "colheitadeira") return colheitadeiraImg;
  return /case|valtra|massey|new holland|ls |mahindra/i.test(m.modelo)
    ? tratorVermelho
    : tratorVerde;
}

function horasRestantes(m: Maquina) {
  return Math.round(m.ultima_manutencao_h + m.intervalo_manutencao_h - m.horimetro);
}

function Oficina() {
  const { data: conta } = useConta();
  const qc = useQueryClient();
  const [novaAberta, setNovaAberta] = useState(false);
  const [selecionada, setSelecionada] = useState<string | null>(null);

  const maquinas = useQuery({
    queryKey: ["maquinas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maquinas")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Maquina[];
    },
  });

  const servicos = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .order("realizado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Servico[];
    },
  });

  const criarMaquina = useMutation({
    mutationFn: async (form: {
      nome: string;
      modelo: string;
      tipo: string;
      horimetro: number;
      intervalo: number;
      foto_url: string;
    }) => {
      if (!conta) throw new Error("Sem conta");
      const { error } = await supabase.from("maquinas").insert({
        owner_id: conta.id,
        nome: form.nome,
        modelo: form.modelo,
        tipo: form.tipo,
        horimetro: form.horimetro,
        intervalo_manutencao_h: form.intervalo,
        ultima_manutencao_h: form.horimetro,
        foto_url: form.foto_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNovaAberta(false);
      qc.invalidateQueries({ queryKey: ["maquinas"] });
    },
  });

  const criarExemplos = useMutation({
    mutationFn: async () => {
      if (!conta) throw new Error("Sem conta");
      const { error } = await supabase
        .from("maquinas")
        .insert(EXEMPLOS.map((e) => ({ ...e, owner_id: conta.id })));
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maquinas"] }),
  });

  const registrarServico = useMutation({
    mutationFn: async (form: {
      maquina: Maquina;
      descricao: string;
      custo: number;
      data: string;
    }) => {
      if (!conta) throw new Error("Sem conta");
      const { error } = await supabase.from("servicos").insert({
        owner_id: conta.id,
        maquina_id: form.maquina.id,
        descricao: form.descricao,
        custo: form.custo,
        horimetro: form.maquina.horimetro,
        realizado_em: form.data,
      });
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("maquinas")
        .update({ ultima_manutencao_h: form.maquina.horimetro })
        .eq("id", form.maquina.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      setSelecionada(null);
      qc.invalidateQueries({ queryKey: ["servicos"] });
      qc.invalidateQueries({ queryKey: ["maquinas"] });
    },
  });

  const lista = maquinas.data ?? [];
  const somenteLeitura = conta?.perfil === "agronomo";
  const alertas = lista.filter((m) => horasRestantes(m) <= 0);

  if (somenteLeitura) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          A Oficina é da gestão do produtor. Como agrônomo, você acompanha os talhões, laudos e
          safras.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Oficina</h1>
            <p className="text-sm text-muted-foreground">
              Horas de motor enviadas pelos sensores dos tratores, manutenções previstas e serviços
              já realizados.
            </p>
          </div>
          {!somenteLeitura && (
            <button
              onClick={() => setNovaAberta((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" /> Nova máquina
            </button>
          )}
        </header>

        {alertas.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p className="text-sm text-foreground">
              <strong>{alertas.length}</strong>{" "}
              {alertas.length === 1 ? "máquina passou" : "máquinas passaram"} do intervalo de
              manutenção: {alertas.map((m) => m.nome).join(", ")}.
            </p>
          </div>
        )}

        {novaAberta && !somenteLeitura && (
          <Card>
            <h2 className="font-semibold text-foreground">Cadastrar máquina</h2>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                criarMaquina.mutate({
                  nome: String(f.get("nome")),
                  modelo: String(f.get("modelo")),
                  tipo: String(f.get("tipo")),
                  horimetro: Number(f.get("horimetro") || 0),
                  intervalo: Number(f.get("intervalo") || 250),
                  foto_url: String(f.get("foto_url") || ""),
                });
              }}
            >
              <label className="text-sm font-medium text-foreground">
                Nome
                <input name="nome" required className={CAMPO} placeholder="Trator 1" />
              </label>
              <label className="text-sm font-medium text-foreground">
                Modelo
                <input name="modelo" className={CAMPO} placeholder="John Deere 6110J" />
              </label>
              <label className="text-sm font-medium text-foreground">
                Tipo
                <select name="tipo" className={CAMPO} defaultValue="trator">
                  <option value="trator">Trator</option>
                  <option value="colheitadeira">Colheitadeira</option>
                  <option value="pulverizador">Pulverizador</option>
                  <option value="implemento">Implemento</option>
                </select>
              </label>
              <label className="text-sm font-medium text-foreground">
                Horímetro atual (h)
                <input
                  name="horimetro"
                  type="number"
                  step="0.1"
                  defaultValue={0}
                  className={CAMPO}
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Manutenção a cada (h)
                <input name="intervalo" type="number" defaultValue={250} className={CAMPO} />
              </label>
              <label className="text-sm font-medium text-foreground sm:col-span-2">
                Foto da máquina (link) — opcional
                <input
                  name="foto_url"
                  className={CAMPO}
                  placeholder="Cole o link de uma foto; sem link usamos uma imagem genérica"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={criarMaquina.isPending}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  Salvar máquina
                </button>
              </div>
            </form>
          </Card>
        )}

        {maquinas.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

        {!maquinas.isLoading && lista.length === 0 && (
          <Card>
            <p className="text-sm text-muted-foreground">
              Nenhuma máquina cadastrada ainda. Cadastre um trator ou comece com três máquinas de
              exemplo (dois tratores e uma colheitadeira) para ver como funciona.
            </p>
            {!somenteLeitura && (
              <button
                onClick={() => criarExemplos.mutate()}
                disabled={criarExemplos.isPending}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70 disabled:opacity-60"
              >
                <Sparkles className="size-4" /> Adicionar máquinas de exemplo
              </button>
            )}
          </Card>
        )}

        <div className="grid gap-4">
          {lista.map((m) => {
            const restam = horasRestantes(m);
            const pct = Math.min(
              100,
              Math.max(
                0,
                ((m.horimetro - m.ultima_manutencao_h) / (m.intervalo_manutencao_h || 1)) * 100,
              ),
            );
            const hist = (servicos.data ?? []).filter((s) => s.maquina_id === m.id);
            return (
              <Card key={m.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={fotoDe(m)}
                      alt={`${m.nome} — ${m.modelo || "máquina agrícola"}`}
                      loading="lazy"
                      width={768}
                      height={512}
                      className="size-16 shrink-0 rounded-xl object-cover sm:size-20"
                    />
                    <div>
                      <h3 className="font-semibold text-foreground">{m.nome}</h3>
                      <p className="text-xs text-muted-foreground">
                        {m.modelo || "Modelo não informado"} · {m.tipo}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      m.motor_ligado
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {m.motor_ligado ? "Motor em funcionamento" : "Motor desligado"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Gauge className="size-3.5" /> Horímetro
                    </p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                      {Number(m.horimetro).toFixed(1)} h
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Próxima manutenção
                    </p>
                    <p
                      className={`mt-1 text-xl font-bold ${
                        restam <= 0
                          ? "text-destructive"
                          : restam <= 25
                            ? "text-soja-foreground"
                            : "text-foreground"
                      }`}
                    >
                      {restam <= 0 ? `${Math.abs(restam)} h atrasada` : `em ${restam} h`}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Última leitura do sensor
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {m.ultima_leitura_em
                        ? new Date(m.ultima_leitura_em).toLocaleString("pt-BR")
                        : "Aguardando sensor"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${restam <= 0 ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Wrench className="size-4" /> Histórico de serviços
                  </p>
                  {hist.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">Nenhum serviço registrado.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {hist.map((s) => (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm"
                        >
                          <span className="text-foreground">{s.descricao}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(`${s.realizado_em}T12:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                            {Number(s.horimetro).toFixed(0)} h · R${" "}
                            {Number(s.custo).toFixed(2).replace(".", ",")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {!somenteLeitura && (
                  <div className="mt-4">
                    {selecionada === m.id ? (
                      <form
                        className="grid gap-3 sm:grid-cols-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          registrarServico.mutate({
                            maquina: m,
                            descricao: String(f.get("descricao")),
                            custo: Number(f.get("custo") || 0),
                            data: String(f.get("data")),
                          });
                        }}
                      >
                        <label className="text-sm font-medium text-foreground sm:col-span-2">
                          Serviço realizado
                          <input
                            name="descricao"
                            required
                            className={CAMPO}
                            placeholder="Troca de óleo e filtros"
                          />
                        </label>
                        <label className="text-sm font-medium text-foreground">
                          Custo (R$)
                          <input
                            name="custo"
                            type="number"
                            step="0.01"
                            defaultValue={0}
                            className={CAMPO}
                          />
                        </label>
                        <label className="text-sm font-medium text-foreground">
                          Data
                          <input
                            name="data"
                            type="date"
                            defaultValue={new Date().toISOString().slice(0, 10)}
                            className={CAMPO}
                          />
                        </label>
                        <div className="flex gap-2 sm:col-span-4">
                          <button
                            type="submit"
                            disabled={registrarServico.isPending}
                            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                          >
                            Registrar e zerar contagem
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelecionada(null)}
                            className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-muted-foreground"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setSelecionada(m.id)}
                        className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70"
                      >
                        Registrar manutenção feita
                      </button>
                    )}
                  </div>
                )}

                {!somenteLeitura && (
                  <p className="mt-4 break-all rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                    Código do sensor (ESP32): <span className="font-mono">{m.device_token}</span>
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
