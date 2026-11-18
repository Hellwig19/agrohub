import { useEffect, useMemo, useRef, useState } from "react";
import {
  GeoJSONSource,
  LngLatBounds,
  Map,
  NavigationControl,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import area from "@turf/area";
import length from "@turf/length";
import { lineString, polygon } from "@turf/helpers";
import { Box, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Talhao } from "@/lib/campo";
import "maplibre-gl/dist/maplibre-gl.css";

export default function TalhoesMapaPremium({
  talhoes,
  destaqueId,
  altura = 380,
}: {
  talhoes: Talhao[];
  destaqueId?: string;
  altura?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapa = useRef<Map | null>(null);
  const [tresD, setTresD] = useState(false);
  const [medindo, setMedindo] = useState(false);
  const [projecoes, setProjecoes] = useState<
    Array<{ id: string; pontos: string; cultura: Talhao["cultura"] }>
  >([]);
  const selecionado = talhoes.find((t) => t.id === destaqueId) ?? talhoes[0];
  const dados = useMemo(() => {
    const features = talhoes
      .filter((t) => t.coords.length >= 3)
      .map((t, index) => {
        const ring: [number, number][] = t.coords.map(([lat, lng]): [number, number] => [
          Number(lng),
          Number(lat),
        ]);
        const primeiro = ring[0];
        if (primeiro) ring.push([primeiro[0], primeiro[1]]);
        return {
          type: "Feature" as const,
          id: index + 1,
          properties: { id: t.id, cultura: t.cultura },
          geometry: { type: "Polygon" as const, coordinates: [ring] },
        };
      });
    return { type: "FeatureCollection" as const, features };
  }, [talhoes]);
  const dadosAtuais = useRef(dados);
  const talhoesAtuais = useRef(talhoes);
  const selecionadoAtual = useRef(selecionado);
  const destaqueAtual = useRef(destaqueId);
  const possuiTalhoes = dados.features.length > 0;
  dadosAtuais.current = dados;
  talhoesAtuais.current = talhoes;
  selecionadoAtual.current = selecionado;
  destaqueAtual.current = destaqueId;
  const medida = useMemo(() => {
    if (!selecionado || selecionado.coords.length < 3) return null;
    const ring = selecionado.coords.map(([lat, lng]) => [lng, lat]);
    const primeiro = ring[0];
    if (!primeiro) return null;
    ring.push(primeiro);
    return {
      hectares: area(polygon([ring])) / 10000,
      perimetro: length(lineString(ring), { units: "kilometers" }),
    };
  }, [selecionado]);

  useEffect(() => {
    if (!el.current || mapa.current || !possuiTalhoes) return;
    const map = new Map({
      container: el.current,
      center: [-51.35, -30.08],
      zoom: 11,
      style: {
        version: 8,
        sources: {
          satelite: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Esri World Imagery",
          },
          talhoes: { type: "geojson", data: dadosAtuais.current },
        },
        layers: [
          { id: "satelite", type: "raster", source: "satelite" },
          {
            id: "talhoes-fill",
            type: "fill",
            source: "talhoes",
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "#f59e0b",
                ["==", ["get", "cultura"], "soja"],
                "#f59e0b",
                "#0ea5e9",
              ],
              "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.58, 0.34],
            },
          },
          {
            id: "talhoes-line-casing",
            type: "line",
            source: "talhoes",
            paint: {
              "line-color": "#111827",
              "line-opacity": 0.9,
              "line-width": ["case", ["==", ["get", "id"], destaqueAtual.current ?? ""], 7, 5],
            },
          },
          {
            id: "talhoes-line",
            type: "line",
            source: "talhoes",
            paint: {
              "line-color": ["case", ["==", ["get", "cultura"], "soja"], "#fbbf24", "#38bdf8"],
              "line-width": ["case", ["==", ["get", "id"], destaqueAtual.current ?? ""], 4, 2],
            },
          },
        ],
      },
      pitch: 0,
    });
    map.addControl(new NavigationControl(), "top-right");
    const atualizarProjecoes = () => {
      setProjecoes(
        talhoesAtuais.current.map((talhao) => ({
          id: talhao.id,
          cultura: talhao.cultura,
          pontos: talhao.coords
            .map(([lat, lng]) => {
              const ponto = map.project([lng, lat]);
              return `${ponto.x},${ponto.y}`;
            })
            .join(" "),
        })),
      );
    };
    map.on("move", atualizarProjecoes);
    map.on("resize", atualizarProjecoes);
    const iniciarTalhoes = () => {
      if (!map.getSource("talhoes")) return;
      const talhaoInicial = selecionadoAtual.current;
      if (talhaoInicial?.coords.length) {
        const bounds = new LngLatBounds();
        talhaoInicial.coords.forEach(([lat, lng]) => bounds.extend([lng, lat]));
        map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 16 });
      }
      atualizarProjecoes();
      let hoverId: string | number | undefined;
      map.on("mousemove", "talhoes-fill", (event: MapLayerMouseEvent) => {
        if (hoverId !== undefined)
          map.setFeatureState({ source: "talhoes", id: hoverId }, { hover: false });
        const feature = event.features?.[0];
        hoverId = feature?.id;
        if (hoverId !== undefined)
          map.setFeatureState({ source: "talhoes", id: hoverId }, { hover: true });
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "talhoes-fill", () => {
        if (hoverId !== undefined)
          map.setFeatureState({ source: "talhoes", id: hoverId }, { hover: false });
        hoverId = undefined;
        map.getCanvas().style.cursor = "";
      });
      map.off("styledata", iniciarTalhoes);
    };
    map.on("styledata", iniciarTalhoes);
    iniciarTalhoes();
    mapa.current = map;
    return () => {
      map.off("styledata", iniciarTalhoes);
      map.off("move", atualizarProjecoes);
      map.off("resize", atualizarProjecoes);
      map.remove();
      mapa.current = null;
    };
  }, [possuiTalhoes]);

  useEffect(() => {
    const map = mapa.current;
    if (!map) return;

    const sincronizarTalhoes = () => {
      if (!map.getSource("talhoes") || !map.getLayer("talhoes-line")) return;
      (map.getSource("talhoes") as GeoJSONSource).setData(dados);
      if (!selecionado?.coords.length) return;
      const bounds = new LngLatBounds();
      selecionado.coords.forEach(([lat, lng]) => bounds.extend([lng, lat]));
      map.fitBounds(bounds, {
        padding: 48,
        duration: map.loaded() ? 900 : 0,
        pitch: tresD ? 55 : 0,
        maxZoom: 16,
      });
      map.setPaintProperty("talhoes-line", "line-width", [
        "case",
        ["==", ["get", "id"], destaqueId ?? ""],
        4,
        2,
      ]);
      map.setPaintProperty("talhoes-line-casing", "line-width", [
        "case",
        ["==", ["get", "id"], destaqueId ?? ""],
        7,
        5,
      ]);
    };

    map.on("load", sincronizarTalhoes);
    map.on("style.load", sincronizarTalhoes);
    sincronizarTalhoes();

    return () => {
      map.off("load", sincronizarTalhoes);
      map.off("style.load", sincronizarTalhoes);
    };
  }, [dados, selecionado, destaqueId, tresD]);

  useEffect(() => {
    const map = mapa.current;
    if (!map) return;

    const aplicarRelevo = () => {
      if (!map.isStyleLoaded()) return;
      if (tresD && !map.getSource("terreno")) {
        map.addSource("terreno", {
          type: "raster-dem",
          tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
          tileSize: 256,
          encoding: "terrarium",
        });
      }
      map.setTerrain(tresD ? { source: "terreno", exaggeration: 1.4 } : null);
      map.easeTo({ pitch: tresD ? 55 : 0, duration: 700 });
    };

    map.on("style.load", aplicarRelevo);
    aplicarRelevo();

    return () => {
      map.off("style.load", aplicarRelevo);
    };
  }, [tresD]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div ref={el} style={{ height: altura }} className="w-full" />
      <svg
        className="pointer-events-none absolute inset-0 size-full overflow-hidden"
        aria-hidden="true"
      >
        {projecoes.map((projecao) => (
          <polygon
            key={projecao.id}
            points={projecao.pontos}
            className={
              projecao.id === destaqueId
                ? "fill-primary/35 stroke-primary"
                : projecao.cultura === "soja"
                  ? "fill-warning/25 stroke-warning"
                  : "fill-accent/25 stroke-accent-foreground"
            }
            strokeWidth={projecao.id === destaqueId ? 4 : 2.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="absolute bottom-3 left-3 flex gap-2">
        <Button
          size="sm"
          variant={tresD ? "default" : "secondary"}
          onClick={() => setTresD((v) => !v)}
        >
          <Box /> Relevo 3D
        </Button>
        <Button
          size="sm"
          variant={medindo ? "default" : "secondary"}
          onClick={() => setMedindo((v) => !v)}
        >
          <Ruler /> Medir
        </Button>
      </div>
      {medindo && medida && (
        <div className="absolute bottom-14 left-3 rounded-md border border-border bg-card/95 px-3 py-2 text-xs shadow-lg">
          <strong className="block text-foreground">{selecionado?.nome}</strong>
          <span className="text-muted-foreground">
            {medida.hectares.toFixed(2)} ha · {medida.perimetro.toFixed(2)} km de perímetro
          </span>
        </div>
      )}
    </div>
  );
}
