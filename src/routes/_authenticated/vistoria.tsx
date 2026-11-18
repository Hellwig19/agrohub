import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/badges";
import { SEVERIDADE_LABEL, type Severidade } from "@/lib/agrohub-store";
import { useAddLaudo, useCampo, useTalhoes } from "@/lib/campo";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vistoria")({
  head: () => ({
    meta: [
      { title: "Nova Vistoria Técnica — AgroHub" },
      {
        name: "description",
        content:
          "Formulário de vistoria de campo com estádio fenológico, pragas e doenças, severidade e prescrição de manejo.",
      },
      { property: "og:title", content: "Nova Vistoria Técnica — AgroHub" },
      {
        property: "og:description",
        content: "Registro rápido de vistoria agronômica para o produtor acompanhar.",
      },
    ],
  }),
  component: Vistoria,
});

const ESTADIOS_SOJA = ["VE", "V2", "V4", "V6", "R1", "R3", "R5.3", "R7"];
const ESTADIOS_ARROZ = [
  "Emergência",
  "Início de Perfilhamento",
  "Perfilhamento / Irrigação",
  "Emborrachamento",
  "Floração",
  "Enchimento de grãos",
];
const ALVOS_SUGERIDOS = [
  "Ferrugem-asiática",
  "Percevejo-marrom",
  "Lagarta-da-soja",
  "Mancha-parda",
  "Brusone",
  "Arroz-vermelho",
  "Capim-arroz",
];

function Vistoria() {
  const { produtores, produtorId, setProdutorId, isAgronomo } = useCampo();
  const { data: talhoes = [] } = useTalhoes();
  const addLaudo = useAddLaudo();
  const navigate = useNavigate();
  const [talhaoId, setTalhaoId] = useState("");
  const [estadio, setEstadio] = useState("");
  const [alvo, setAlvo] = useState("");
  const [severidade, setSeveridade] = useState<Severidade>("baixa");
  const [recomendacao, setRecomendacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const talhaoAtual = talhoes.find((t) => t.id === talhaoId) ?? talhoes[0];
  const estadios = talhaoAtual?.cultura === "arroz" ? ESTADIOS_ARROZ : ESTADIOS_SOJA;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const alvoId = talhaoAtual?.id;
    if (!alvoId || !estadio || !alvo.trim()) {
      setErro("Informe produtor, talhão, estádio fenológico e o alvo identificado.");
      return;
    }
    try {
      await addLaudo.mutateAsync({
        talhaoId: alvoId,
        estadio,
        alvo: alvo.trim(),
        severidade,
        recomendacao,
      });
      navigate({ to: "/talhoes" });
    } catch {
      setErro("Não foi possível salvar a vistoria. Verifique a conexão e tente novamente.");
    }
  }

  return (
    <AppShell>
      <form onSubmit={salvar} className="mx-auto max-w-2xl space-y-5">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Nova Vistoria</h1>
          <p className="text-sm text-muted-foreground">
            O laudo fica visível na ficha do talhão do produtor escolhido.
          </p>
        </header>

        {isAgronomo && (
          <Card className="space-y-2">
            <label htmlFor="produtor" className="text-sm font-semibold text-foreground">
              Produtor
            </label>
            <select
              id="produtor"
              value={produtorId}
              onChange={(e) => {
                setProdutorId(e.target.value);
                setTalhaoId("");
                setEstadio("");
              }}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary"
            >
              {produtores.length === 0 && <option value="">Nenhum produtor cadastrado</option>}
              {produtores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Card>
        )}

        <Card className="space-y-2">
          <label htmlFor="talhao" className="text-sm font-semibold text-foreground">
            Talhão
          </label>
          <select
            id="talhao"
            value={talhaoAtual?.id ?? ""}
            onChange={(e) => {
              setTalhaoId(e.target.value);
              setEstadio("");
            }}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary"
          >
            {talhoes.length === 0 && (
              <option value="">Este produtor ainda não tem talhões cadastrados</option>
            )}
            {talhoes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} — {t.cultura === "soja" ? "Soja" : "Arroz"} ({t.areaHa} ha)
              </option>
            ))}
          </select>
        </Card>

        <Card className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Estádio fenológico</p>
          <div className="flex flex-wrap gap-2">
            {estadios.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEstadio(e)}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  estadio === e
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <label htmlFor="alvo" className="text-sm font-semibold text-foreground">
            Praga, doença ou invasora
          </label>
          <input
            id="alvo"
            value={alvo}
            onChange={(e) => setAlvo(e.target.value)}
            placeholder="Ex.: Ferrugem-asiática"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary"
          />
          <div className="flex flex-wrap gap-2">
            {ALVOS_SUGERIDOS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAlvo(a)}
                className="rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                {a}
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Nível de severidade</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["baixa", "media", "alta"] as Severidade[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeveridade(s)}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                  severidade === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {SEVERIDADE_LABEL[s]}
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-2">
          <label htmlFor="recomendacao" className="text-sm font-semibold text-foreground">
            Recomendação técnica
          </label>
          <textarea
            id="recomendacao"
            rows={5}
            value={recomendacao}
            onChange={(e) => setRecomendacao(e.target.value)}
            placeholder="Produto, dose, volume de calda e prazo de reavaliação"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary"
          />
        </Card>

        {erro && (
          <p className="rounded-xl border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={addLaudo.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Save className="size-5" />
          {addLaudo.isPending ? "Salvando…" : "Salvar e gerar laudo"}
        </button>
      </form>
    </AppShell>
  );
}
