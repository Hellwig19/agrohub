import { useQuery } from "@tanstack/react-query";
import { CloudRain, Droplets, Gauge, MapPin, Thermometer, Wind } from "lucide-react";
import { useState } from "react";
import type { Talhao } from "@/lib/campo";

interface ClimaResposta {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  daily: { precipitation_sum: number[] };
}

function centro(talhao?: Talhao) {
  if (!talhao?.coords.length) return { lat: -30.08, lng: -51.35 };
  return {
    lat: talhao.coords.reduce((s, p) => s + p[0], 0) / talhao.coords.length,
    lng: talhao.coords.reduce((s, p) => s + p[1], 0) / talhao.coords.length,
  };
}

function direcao(graus: number) {
  return ["N", "NE", "L", "SE", "S", "SO", "O", "NO"][Math.round(graus / 45) % 8];
}

function janela(vento: number, umidade: number, temp: number) {
  if (vento > 12 || vento < 1 || umidade < 45) {
    return {
      label: "Inadequado",
      classe: "border-destructive/30 bg-destructive/10 text-destructive",
      texto: "Adie a aplicação e reavalie as condições.",
    };
  }
  if (vento >= 3 && vento <= 10 && umidade > 55 && temp < 30) {
    return {
      label: "Ideal",
      classe: "border-primary/30 bg-primary/10 text-primary",
      texto: "Condições favoráveis para pulverização.",
    };
  }
  return {
    label: "Atenção",
    classe: "border-soja/40 bg-soja/15 text-soja-foreground",
    texto: "Condições limítrofes; monitore antes de aplicar.",
  };
}

export function ClimaAgricola({ talhoes }: { talhoes: Talhao[] }) {
  const [talhaoId, setTalhaoId] = useState("");
  const talhao = talhoes.find((t) => t.id === talhaoId) ?? talhoes[0];
  const local = centro(talhao);
  const clima = useQuery({
    queryKey: ["clima", local.lat.toFixed(4), local.lng.toFixed(4)],
    queryFn: async () => {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.search = new URLSearchParams({
        latitude: String(local.lat),
        longitude: String(local.lng),
        current:
          "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m",
        daily: "precipitation_sum",
        timezone: "America/Sao_Paulo",
        forecast_days: "1",
      }).toString();
      const resposta = await fetch(url);
      if (!resposta.ok) throw new Error("Clima indisponível");
      return resposta.json() as Promise<ClimaResposta>;
    },
    staleTime: 10 * 60 * 1000,
  });

  const atual = clima.data?.current;
  const condicao = atual
    ? janela(atual.wind_speed_10m, atual.relative_humidity_2m, atual.temperature_2m)
    : null;
  const metricas = atual
    ? [
        {
          icon: Thermometer,
          label: "Temperatura",
          valor: `${Math.round(atual.temperature_2m)}°C`,
          apoio: `Sensação ${Math.round(atual.apparent_temperature)}°C`,
        },
        {
          icon: Droplets,
          label: "Umidade",
          valor: `${Math.round(atual.relative_humidity_2m)}%`,
          apoio: "Umidade relativa",
        },
        {
          icon: Wind,
          label: "Vento",
          valor: `${Math.round(atual.wind_speed_10m)} km/h`,
          apoio: `Direção ${direcao(atual.wind_direction_10m)}`,
        },
        {
          icon: CloudRain,
          label: "Chuva hoje",
          valor: `${(clima.data?.daily.precipitation_sum[0] ?? 0).toFixed(1)} mm`,
          apoio: "Acumulado previsto",
        },
      ]
    : [];

  return (
    <section
      className="overflow-hidden rounded-lg border border-border bg-card"
      aria-labelledby="clima-titulo"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 id="clima-titulo" className="flex items-center gap-2 font-semibold text-foreground">
            <Gauge className="size-5 text-primary" /> Central de clima agrícola
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Condições no centro do talhão · atualização automática
          </p>
        </div>
        {talhoes.length > 0 && (
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <MapPin className="size-4" />
            <span className="sr-only">Talhão do clima</span>
            <select
              value={talhao?.id ?? ""}
              onChange={(e) => setTalhaoId(e.target.value)}
              className="rounded-md border border-input bg-background px-2.5 py-2 text-sm font-semibold text-foreground"
            >
              {talhoes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {clima.isLoading ? (
        <div className="h-32 animate-pulse bg-secondary/50" />
      ) : clima.isError || !atual ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">
          Não foi possível atualizar o clima agora.
        </p>
      ) : (
        <div className="grid lg:grid-cols-[1fr_17rem]">
          <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
            {metricas.map(({ icon: Icon, label, valor, apoio }) => (
              <div key={label} className="p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                  <Icon className="size-4 text-primary" />
                  {label}
                </p>
                <p className="mt-2 text-xl font-bold text-foreground">{valor}</p>
                <p className="text-xs text-muted-foreground">{apoio}</p>
              </div>
            ))}
          </div>
          {condicao && (
            <div className={`m-3 rounded-md border p-4 ${condicao.classe}`}>
              <p className="text-xs font-semibold uppercase">Janela de pulverização</p>
              <p className="mt-1 text-xl font-bold">{condicao.label}</p>
              <p className="mt-1 text-xs leading-relaxed">{condicao.texto}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
