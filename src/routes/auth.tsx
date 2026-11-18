import { PwaInstallButton } from "@/components/PwaProvider";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sprout } from "lucide-react";
import { supabase, isDemoMode } from "@/integrations/supabase/client";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/integrations/supabase/demo";
import type { PerfilConta } from "@/lib/conta";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — AgroHub" },
      {
        name: "description",
        content:
          "Acesse o AgroHub como agrônomo consultor ou produtor rural para acompanhar talhões, laudos e a oficina das máquinas.",
      },
      { property: "og:title", content: "Entrar — AgroHub" },
      {
        property: "og:description",
        content: "Login de agrônomos e produtores no AgroHub.",
      },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState<PerfilConta>("produtor");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    Promise.resolve()
      .then(() => supabase.auth.getUser())
      .then(({ data }) => {
        if (data.user) navigate({ to: "/", replace: true });
      })
      .catch(() =>
        setErro("O acesso está temporariamente indisponível. Tente novamente mais tarde."),
      );
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin, data: { nome: nome.trim(), perfil } },
        });
        if (error) throw error;
        if (!data.session) {
          setAviso("Confira seu e-mail para confirmar o cadastro. Depois, entre com sua senha.");
          setModo("entrar");
          return;
        }
      }
      navigate({ to: "/", replace: true });
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message === "Invalid login credentials"
            ? "E-mail ou senha incorretos."
            : err.message
          : "Não foi possível concluir. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="size-6" />
          </span>
          <span>
            <span className="block text-xl font-bold tracking-tight text-foreground">AgroHub</span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-primary">
              Gestão de soja e arroz
            </span>
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex rounded-full bg-secondary p-1">
            {(["entrar", "criar"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModo(m)}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  modo === m
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "entrar" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={enviar} className="space-y-4">
            {modo === "criar" && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground" htmlFor="nome">
                    Nome completo
                  </label>
                  <input
                    id="nome"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">Você é</span>
                  <div className="mt-1 flex gap-2">
                    {(["produtor", "agronomo"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPerfil(p)}
                        className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                          perfil === p
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p === "produtor" ? "Produtor rural" : "Agrônomo"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                minLength={6}
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {erro && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {erro}
              </p>
            )}
            {aviso && (
              <p role="status" className="text-sm text-primary">
                {aviso}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta e entrar"}
            </button>
          </form>
          <div className="mt-5">
            <PwaInstallButton />
          </div>
          {isDemoMode && (
            <aside className="mt-6 rounded-xl border border-border bg-secondary p-4 text-sm">
              <p className="font-semibold">Demonstração local</p>
              <p className="mt-1 text-muted-foreground">
                Senha: {DEMO_PASSWORD}. Os dados de teste ficam neste navegador.
              </p>
              {DEMO_ACCOUNTS.map((conta) => (
                <button
                  key={conta.id}
                  type="button"
                  className="mt-3 block text-left text-primary underline"
                  onClick={() => {
                    setModo("entrar");
                    setEmail(conta.email);
                    setSenha(DEMO_PASSWORD);
                    setErro(null);
                  }}
                >
                  {conta.nome}: {conta.email}
                </button>
              ))}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
