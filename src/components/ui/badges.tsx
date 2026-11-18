import type { Cultura, Severidade } from "@/lib/agrohub-store";
import { SEVERIDADE_LABEL } from "@/lib/agrohub-store";

const SEV_CLASS: Record<Severidade, string> = {
  baixa: "bg-primary/10 text-primary",
  media: "bg-soja/15 text-soja-foreground",
  alta: "bg-destructive/10 text-destructive",
};

export function SeveridadeBadge({ nivel }: { nivel: Severidade }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${SEV_CLASS[nivel]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {SEVERIDADE_LABEL[nivel]}
    </span>
  );
}

export function CulturaBadge({ cultura }: { cultura: Cultura }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        cultura === "soja" ? "bg-soja/15 text-soja-foreground" : "bg-arroz/15 text-arroz-foreground"
      }`}
    >
      {cultura === "soja" ? "Soja" : "Arroz"}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 shadow-sm shadow-foreground/5 ${className}`}
    >
      {children}
    </div>
  );
}
