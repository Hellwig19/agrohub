import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CulturaBadge, SeveridadeBadge } from "@/components/ui/badges";
import {
  OPERACAO_LABEL,
  formatarData,
  parseGpx,
  type TalhaoImportado,
  type TipoOperacao,
} from "@/lib/agrohub-store";
import {
  useAddOperacao,
  useAddSafra,
  useAddTalhoes,
  useCampo,
  useLaudos,
  useOperacoes,
  useSafras,
  useSeedExemplo,
  useTalhoes,
} from "@/lib/campo";
import { Satellite, Upload } from "lucide-react";

const TalhoesMapaPremium = lazy(() => import("@/components/TalhoesMapaPremium"));

const CAMPO =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

export const Route = createFileRoute("/_authenticated/talhoes")({
  head: () => ({
    meta: [
      { title: "Talhões, adubação e laudos — AgroHub" },
      {
        name: "description",
        content:
          "Selecione um talhão e veja adubação aplicada, aplicações, laudos de manejo e safras anteriores, com importação de GPX do Garmin.",
      },
      { property: "og:title", content: "Talhões, adubação e laudos — AgroHub" },
      {
        property: "og:description",
        content:
          "Ficha completa do talhão: adubação, aplicações, laudos técnicos e histórico de safras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Talhoes,
});

type Aba = "manejo" | "laudos" | "safras";

const ABAS: { valor: Aba; label: string }[] = [
  { valor: "manejo", label: "Adubação e aplicações" },
  { valor: "laudos", label: "Laudos" },
  { valor: "safras", label: "Safras" },
];

const TIPO_COR: Record<TipoOperacao, string> = {
  adubacao: "text-soja-foreground bg-soja/15",
  aplicacao: "text-primary bg-primary/10",
  semeadura: "text-arroz-foreground bg-arroz/15",
  correcao: "text-muted-foreground bg-secondary",
};

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h2>
  );
}

function Talhoes() {
  const { isAgronomo, produtores, produtorId } = useCampo();
  const { data: talhoes = [], isLoading } = useTalhoes();
  const { data: operacoes = [] } = useOperacoes();
  const { data: safras = [] } = useSafras();
  const { data: laudos = [] } = useLaudos();
  const addTalhoes = useAddTalhoes();
  const addOperacao = useAddOperacao();
  const addSafra = useAddSafra();
  const seed = useSeedExemplo();

  const [selecionado, setSelecionado] = useState("");
  const [aba, setAba] = useState<Aba>("manejo");
  const [aviso, setAviso] = useState<string | null>(null);
  const [form, setForm] = useState<"operacao" | "safra" | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const talhao = talhoes.find((t) => t.id === selecionado) ?? talhoes[0];
  const somenteLeitura = isAgronomo;
  const produtorNome = produtores.find((p) => p.id === produtorId)?.nome;

  const dados = useMemo(() => {
    const id = talhao?.id;
    return {
      operacoes: operacoes.filter((o) => o.talhaoId === id),
      laudos: laudos.filter((v) => v.talhaoId === id),
      safras: safras.filter((s) => s.talhaoId === id),
    };
  }, [talhao?.id, operacoes, laudos, safras]);

  async function importar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    const novos: TalhaoImportado[] = [];
    for (const arquivo of Array.from(arquivos)) {
      novos.push(...parseGpx(await arquivo.text(), arquivo.name));
    }
    if (!novos.length) {
      setAviso("Nenhuma trilha com pontos suficientes foi encontrada no arquivo GPX.");
      return;
    }
    const ids = await addTalhoes.mutateAsync(novos);
    if (ids[0]) setSelecionado(ids[0]);
    setAviso(`${novos.length} talhão(ões) importado(s) do GPX.`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Talhões</h1>
            <p className="text-sm text-muted-foreground">
              {somenteLeitura
                ? produtorNome
                  ? `Lavouras de ${produtorNome} — consulta e laudos.`
                  : "Escolha um produtor no topo da tela."
                : "Escolha um talhão para ver adubação, aplicações, laudos e safras anteriores."}
            </p>
          </div>
          {!somenteLeitura && (
            <>
              <button
                onClick={() => input.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                <Upload className="size-4 text-primary" />
                Importar GPX do Garmin
              </button>
              <input
                ref={input}
                type="file"
                accept=".gpx,application/gpx+xml"
                multiple
                className="hidden"
                onChange={(e) => importar(e.target.files)}
              />
            </>
          )}
        </header>

        {aviso && (
          <p className="rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
            {aviso}
          </p>
        )}

        {!isLoading && !talhoes.length && (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {somenteLeitura
                ? "Este produtor ainda não cadastrou talhões."
                : "Nenhum talhão cadastrado. Importe um arquivo GPX do Garmin ou comece com dados de exemplo."}
            </p>
            {!somenteLeitura && (
              <button
                onClick={() => seed.mutate()}
                disabled={seed.isPending}
                className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {seed.isPending ? "Criando…" : "Adicionar talhões de exemplo"}
              </button>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[31rem_minmax(0,1fr)]">
          <div className="space-y-3">
            <Titulo>Área mapeada</Titulo>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {talhoes.map((t) => {
                const ativo = t.id === talhao?.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setSelecionado(t.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        ativo ? "bg-primary/5" : "hover:bg-secondary/60"
                      }`}
                    >
                      <span
                        className={`h-9 w-1 shrink-0 rounded-full ${
                          t.cultura === "soja" ? "bg-soja" : "bg-arroz"
                        } ${ativo ? "" : "opacity-30"}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {t.nome}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {t.areaHa} ha · {t.estadio}
                        </span>
                      </span>
                      <CulturaBadge cultura={t.cultura} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="overflow-hidden rounded-xl border border-border bg-card p-2">
              <ClientOnly
                fallback={
                  <div className="grid h-[420px] place-items-center rounded-lg bg-secondary text-sm text-muted-foreground lg:h-[500px]">
                    Carregando mapa…
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="grid h-[420px] place-items-center rounded-lg bg-secondary text-sm text-muted-foreground lg:h-[500px]">
                      Carregando mapa…
                    </div>
                  }
                >
                  <TalhoesMapaPremium
                    talhoes={talhoes}
                    destaqueId={talhao?.id ?? ""}
                    altura={500}
                  />
                </Suspense>
              </ClientOnly>
              <p className="mt-2 flex items-center gap-2 px-1 pb-1 text-xs text-muted-foreground">
                <Satellite className="size-3.5" /> Mapa de satélite · talhão selecionado em
                destaque.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {talhao ? (
              <>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        {talhao.nome}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Estádio {talhao.estadio} · levantado com {talhao.dispositivo}
                      </p>
                    </div>
                    <p className="text-right">
                      <span className="block text-2xl font-semibold tracking-tight text-foreground">
                        {talhao.areaHa} ha
                      </span>
                      <span className="text-xs text-muted-foreground">área demarcada</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 border-b border-border">
                  {ABAS.map((a) => (
                    <button
                      key={a.valor}
                      onClick={() => setAba(a.valor)}
                      className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                        aba === a.valor
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                  {!somenteLeitura && aba !== "laudos" && (
                    <button
                      onClick={() =>
                        setForm(
                          aba === "safras"
                            ? form === "safra"
                              ? null
                              : "safra"
                            : form === "operacao"
                              ? null
                              : "operacao",
                        )
                      }
                      className="ml-auto mb-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/70"
                    >
                      {aba === "safras" ? "Registrar safra" : "Registrar operação"}
                    </button>
                  )}
                </div>

                {form === "operacao" && aba === "manejo" && (
                  <Card>
                    <form
                      className="grid gap-3 sm:grid-cols-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        await addOperacao.mutateAsync({
                          talhaoId: talhao.id,
                          safra: String(f.get("safra") || ""),
                          tipo: String(f.get("tipo")) as TipoOperacao,
                          produto: String(f.get("produto")),
                          dose: String(f.get("dose") || ""),
                          data: String(f.get("data")),
                          observacao: String(f.get("observacao") || ""),
                        });
                        setForm(null);
                        setAviso("Operação registrada na ficha do talhão.");
                      }}
                    >
                      <label className="text-sm font-medium text-foreground">
                        Tipo
                        <select name="tipo" className={CAMPO} defaultValue="adubacao">
                          {Object.entries(OPERACAO_LABEL).map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Produto / formulação
                        <input
                          name="produto"
                          required
                          placeholder="Ex.: MAP 11-52-00"
                          className={CAMPO}
                        />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Dose
                        <input name="dose" placeholder="Ex.: 180 kg/ha" className={CAMPO} />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Data
                        <input name="data" type="date" required className={CAMPO} />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Safra
                        <input name="safra" placeholder="2025/2026" className={CAMPO} />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Observação
                        <input name="observacao" placeholder="Condição, alvo" className={CAMPO} />
                      </label>
                      <div className="sm:col-span-2">
                        <button
                          type="submit"
                          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          Salvar operação
                        </button>
                      </div>
                    </form>
                  </Card>
                )}

                {form === "safra" && aba === "safras" && (
                  <Card>
                    <form
                      className="grid gap-3 sm:grid-cols-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        await addSafra.mutateAsync({
                          nome: String(f.get("nome")),
                          talhaoId: talhao.id,
                          cultura: talhao.cultura,
                          areaHa: talhao.areaHa,
                          produtividade: Number(f.get("produtividade") || 0),
                          plantio: String(f.get("plantio") || ""),
                          colheita: String(f.get("colheita") || ""),
                          observacao: String(f.get("observacao") || ""),
                        });
                        setForm(null);
                        setAviso("Safra registrada no histórico do talhão.");
                      }}
                    >
                      <label className="text-sm font-medium text-foreground">
                        Safra
                        <input name="nome" required placeholder="2025/2026" className={CAMPO} />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Produtividade (sc/ha)
                        <input
                          name="produtividade"
                          type="number"
                          step="0.1"
                          defaultValue={0}
                          className={CAMPO}
                        />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Plantio
                        <input name="plantio" type="date" className={CAMPO} />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Colheita
                        <input name="colheita" type="date" className={CAMPO} />
                      </label>
                      <label className="text-sm font-medium text-foreground sm:col-span-2">
                        Observação
                        <input
                          name="observacao"
                          placeholder="Clima, manejo, ocorrências"
                          className={CAMPO}
                        />
                      </label>
                      <div className="sm:col-span-2">
                        <button
                          type="submit"
                          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          Salvar safra
                        </button>
                      </div>
                    </form>
                  </Card>
                )}

                {aba === "manejo" && (
                  <div className="space-y-3">
                    {dados.operacoes.map((o) => (
                      <article
                        key={o.id}
                        className="rounded-xl border border-border bg-card px-4 py-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TIPO_COR[o.tipo]}`}
                          >
                            {OPERACAO_LABEL[o.tipo]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatarData(o.data)}
                            {o.safra && ` · safra ${o.safra}`}
                          </span>
                        </div>
                        <p className="mt-2 font-medium text-foreground">{o.produto}</p>
                        {o.dose && <p className="text-sm font-semibold text-primary">{o.dose}</p>}
                        {o.observacao && (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {o.observacao}
                          </p>
                        )}
                      </article>
                    ))}
                    {!dados.operacoes.length && (
                      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                        Nenhuma adubação ou aplicação registrada neste talhão.
                      </p>
                    )}
                  </div>
                )}

                {aba === "laudos" && (
                  <div className="space-y-3">
                    {dados.laudos.map((v) => (
                      <article
                        key={v.id}
                        className="rounded-xl border border-border bg-card px-4 py-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-foreground">{v.alvo}</p>
                          <SeveridadeBadge nivel={v.severidade} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatarData(v.data)} · estádio {v.estadio}
                        </p>
                        {v.recomendacao && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {v.recomendacao}
                          </p>
                        )}
                      </article>
                    ))}
                    {!dados.laudos.length && (
                      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                        Nenhum laudo emitido para este talhão.
                      </p>
                    )}
                  </div>
                )}

                {aba === "safras" && (
                  <div className="space-y-3">
                    {dados.safras.map((s) => (
                      <article
                        key={s.id}
                        className="rounded-xl border border-border bg-card px-4 py-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-foreground">Safra {s.nome}</p>
                          <span className="flex items-center gap-2">
                            <CulturaBadge cultura={s.cultura} />
                            <span className="text-sm font-semibold text-foreground">
                              {s.produtividade > 0 ? `${s.produtividade} sc/ha` : "Em andamento"}
                            </span>
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.areaHa} ha
                          {s.plantio && ` · plantio ${formatarData(s.plantio)}`}
                          {s.colheita && ` · colheita ${formatarData(s.colheita)}`}
                        </p>
                        {s.observacao && (
                          <p className="mt-1 text-sm text-muted-foreground">{s.observacao}</p>
                        )}
                      </article>
                    ))}
                    {!dados.safras.length && (
                      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                        Nenhuma safra registrada para este talhão.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
