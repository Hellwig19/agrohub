export type Cultura = "soja" | "arroz";
export type Severidade = "baixa" | "media" | "alta";
export type Perfil = "agronomo" | "produtor";
export type TipoOperacao = "adubacao" | "aplicacao" | "semeadura" | "correcao";

export const OPERACAO_LABEL: Record<TipoOperacao, string> = {
  adubacao: "Adubação",
  aplicacao: "Aplicação",
  semeadura: "Semeadura",
  correcao: "Correção de solo",
};

export const SEVERIDADE_LABEL: Record<Severidade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta — requer intervenção",
};

export function formatarData(iso: string) {
  if (!iso) return "";
  const data = iso.length <= 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface TalhaoImportado {
  nome: string;
  cultura: Cultura;
  areaHa: number;
  dispositivo: string;
  estadio: string;
  coords: [number, number][];
}

export function parseGpx(texto: string, nomeArquivo: string): TalhaoImportado[] {
  const doc = new DOMParser().parseFromString(texto, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Arquivo GPX inválido.");
  const trilhas = Array.from(doc.querySelectorAll("trk, rte"));
  const dispositivo =
    doc.querySelector("metadata > name")?.textContent?.trim() ||
    doc.documentElement.getAttribute("creator") ||
    "Garmin (GPX)";

  const grupos = trilhas.length
    ? trilhas.map((t) => ({
        nome: t.querySelector("name")?.textContent?.trim() || nomeArquivo.replace(/\.gpx$/i, ""),
        pontos: Array.from(t.querySelectorAll("trkpt, rtept")),
      }))
    : [
        {
          nome: nomeArquivo.replace(/\.gpx$/i, ""),
          pontos: Array.from(doc.querySelectorAll("wpt")),
        },
      ];

  return grupos
    .map((g) => {
      const coords = g.pontos
        .map(
          (p) =>
            [
              p.hasAttribute("lat") ? Number(p.getAttribute("lat")) : NaN,
              p.hasAttribute("lon") ? Number(p.getAttribute("lon")) : NaN,
            ] as [number, number],
        )
        .filter(
          ([a, b]) =>
            Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180,
        );
      if (coords.length < 3) return null;
      return {
        nome: g.nome,
        cultura: "soja" as Cultura,
        areaHa: areaHectares(coords),
        dispositivo,
        estadio: "A definir",
        coords,
      };
    })
    .filter((t): t is TalhaoImportado => t !== null);
}

function areaHectares(coords: [number, number][]) {
  const latMedia = (coords.reduce((s, c) => s + c[0], 0) / coords.length) * (Math.PI / 180);
  const mPorGrauLat = 111132;
  const mPorGrauLng = 111320 * Math.cos(latMedia);
  let soma = 0;
  for (let i = 0; i < coords.length; i++) {
    const a = coords[i]!;
    const b = coords[(i + 1) % coords.length]!;
    soma += a[1] * mPorGrauLng * (b[0] * mPorGrauLat) - b[1] * mPorGrauLng * (a[0] * mPorGrauLat);
  }
  return Math.round((Math.abs(soma) / 2 / 10000) * 10) / 10;
}
