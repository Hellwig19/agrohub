import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CulturaBadge, SeveridadeBadge } from "@/components/ui/badges";
import { formatarData } from "@/lib/agrohub-store";
import { useCampo, useLaudos, useTalhoes } from "@/lib/campo";
import { ClimaAgricola } from "@/components/ClimaAgricola";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "AgroHub — Gestão de lavouras de soja e arroz" },
      {
        name: "description",
        content:
          "Painel AgroHub com área gerida, vistorias técnicas recentes e estádios fenológicos de soja e arroz.",
      },
      { property: "og:title", content: "AgroHub — Gestão de lavouras de soja e arroz" },
      {
        property: "og:description",
        content: "Consultoria agronômica, laudos de manejo e mapas de talhões em um só painel.",
      },
    ],
  }),
  component: Dashboard,
});

function Indicador({
  titulo,
  valor,
  tom,
}: {
  titulo: string;
  valor: string;
  tom: "primary" | "soja" | "arroz";
}) {
  const cores = {
    primary: "bg-primary/10 text-primary",
    soja: "bg-soja/15 text-soja-foreground",
    arroz: "bg-arroz/15 text-arroz-foreground",
  }[tom];
  return (
    <Card>
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cores}`}>
        {titulo}
      </span>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{valor}</p>
      <p className="text-sm text-muted-foreground">hectares</p>
    </Card>
  );
}

function Dashboard() {
  const { isAgronomo, produtores, produtorId } = useCampo();
  const { data: talhoes = [] } = useTalhoes();
  const { data: laudos = [] } = useLaudos();

  const total = Math.round(talhoes.reduce((s, t) => s + t.areaHa, 0) * 10) / 10;
  const soja =
    Math.round(talhoes.filter((t) => t.cultura === "soja").reduce((s, t) => s + t.areaHa, 0) * 10) /
    10;
  const arroz = Math.round((total - soja) * 10) / 10;
  const nomeTalhao = (id: string) => talhoes.find((t) => t.id === id)?.nome ?? "Talhão removido";
  const produtorNome = produtores.find((p) => p.id === produtorId)?.nome;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isAgronomo ? "Painel do Agrônomo" : "Painel do Produtor"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAgronomo
              ? produtorNome
                ? `Acompanhando as lavouras de ${produtorNome}. Troque de produtor no topo da tela.`
                : "Nenhum produtor cadastrado ainda."
              : "Acompanhe os laudos recebidos e a situação das suas lavouras."}
          </p>
        </header>

        <ClimaAgricola talhoes={talhoes} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Indicador titulo="Área Total Gerida" valor={`${total}`} tom="primary" />
          <Indicador titulo="Área com Soja" valor={`${soja}`} tom="soja" />
          <Indicador titulo="Área com Arroz" valor={`${arroz}`} tom="arroz" />
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Últimas vistorias técnicas</h2>
            <Link to="/talhoes" className="text-sm font-semibold text-primary hover:underline">
              Ver por talhão
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {laudos.slice(0, 5).map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{nomeTalhao(v.talhaoId)}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {v.alvo} · {v.estadio} · {formatarData(v.data)}
                  </p>
                </div>
                <SeveridadeBadge nivel={v.severidade} />
              </li>
            ))}
            {!laudos.length && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma vistoria registrada.
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Estádios fenológicos atuais
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {talhoes.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-secondary/50 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium text-foreground">{t.nome}</p>
                  <CulturaBadge cultura={t.cultura} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.estadio} · {t.areaHa} ha
                </p>
              </div>
            ))}
            {!talhoes.length && (
              <p className="text-sm text-muted-foreground">Nenhum talhão cadastrado ainda.</p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
