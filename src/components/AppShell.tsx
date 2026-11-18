import { PwaInstallButton } from "@/components/PwaProvider";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useCampo } from "@/lib/campo";
import { useConta } from "@/lib/conta";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Map,
  ClipboardPlus,
  Menu,
  X,
  Sprout,
  Wrench,
  LogOut,
  Users,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Painel", icon: LayoutDashboard, perfis: ["agronomo", "produtor"] },
  { to: "/talhoes", label: "Talhões", icon: Map, perfis: ["agronomo", "produtor"] },
  { to: "/vistoria", label: "Nova vistoria", icon: ClipboardPlus, perfis: ["agronomo"] },
  { to: "/oficina", label: "Oficina", icon: Wrench, perfis: ["produtor"] },
] as const;

function SeletorProdutor() {
  const { isAgronomo, produtores, produtorId, setProdutorId } = useCampo();
  if (!isAgronomo) return null;

  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
      <Users className="size-4 text-primary" />
      <span className="sr-only">Produtor</span>
      <select
        value={produtorId}
        onChange={(e) => setProdutorId(e.target.value)}
        className="max-w-[9.5rem] bg-transparent text-sm font-semibold text-foreground outline-none sm:max-w-none"
      >
        {produtores.length === 0 && <option value="">Nenhum produtor cadastrado</option>}
        {produtores.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
    </label>
  );
}

function ContaMenu() {
  const { data: conta } = useConta();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <span className="block text-sm font-semibold leading-tight text-foreground">
          {conta?.nome ?? "…"}
        </span>
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-primary">
          {conta?.perfil === "agronomo"
            ? "Agrônomo"
            : conta?.perfil === "gestor"
              ? "Gestor"
              : "Produtor"}
        </span>
      </div>
      <button
        onClick={sair}
        className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const { data: conta } = useConta();
  const perfil = conta?.perfil ?? "produtor";

  const itens = NAV.filter((n) => (n.perfis as readonly string[]).includes(perfil));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <button
            onClick={() => setAberto(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight text-foreground">
                AgroHub
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-primary">
                Gestão Rural
              </span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <SeletorProdutor />
            <ContaMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-card lg:block">
          <nav className="sticky top-16 space-y-1 p-4">
            {itens.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                inactiveProps={{ className: "text-muted-foreground hover:bg-secondary" }}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors"
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </Link>
            ))}
            <div className="pt-4">
              <PwaInstallButton />
            </div>
          </nav>
        </aside>

        {aberto && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              className="absolute inset-0 bg-foreground/40"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
            />
            <nav className="relative h-full w-72 space-y-1 bg-card p-4 shadow-xl">
              <button
                onClick={() => setAberto(false)}
                className="mb-2 ml-auto flex rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                aria-label="Fechar menu"
              >
                <X className="size-5" />
              </button>
              {itens.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setAberto(false)}
                  activeOptions={{ exact: to === "/" }}
                  activeProps={{ className: "bg-primary/10 text-primary" }}
                  inactiveProps={{ className: "text-muted-foreground hover:bg-secondary" }}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium"
                >
                  <Icon className="size-5 shrink-0" />
                  {label}
                </Link>
              ))}
              <div className="pt-4">
                <PwaInstallButton />
              </div>
            </nav>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
