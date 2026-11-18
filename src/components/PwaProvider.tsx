import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Download, RefreshCw, WifiOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
interface PwaState {
  installed: boolean;
  prompt: InstallPrompt | null;
  clearPrompt(): void;
}
const PwaContext = createContext<PwaState | null>(null);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [offline, setOffline] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const reloadAfterUpdate = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const syncInstalled = () =>
      setInstalled(
        media.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
    const syncNetwork = () => setOffline(!navigator.onLine);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    syncInstalled();
    syncNetwork();
    media.addEventListener("change", syncInstalled);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", syncNetwork);
    window.addEventListener("offline", syncNetwork);
    return () => {
      media.removeEventListener("change", syncInstalled);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", syncNetwork);
      window.removeEventListener("offline", syncNetwork);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !window.isSecureContext || !("serviceWorker" in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const cleanups: (() => void)[] = [];
    const controllerChanged = () => {
      if (reloadAfterUpdate.current) window.location.reload();
    };
    const checkUpdate = () => {
      void registration?.update().catch(() => undefined);
    };
    navigator.serviceWorker.addEventListener("controllerchange", controllerChanged);
    window.addEventListener("focus", checkUpdate);
    window.addEventListener("online", checkUpdate);
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        if (disposed) return;
        registration = reg;
        const checkWaiting = () => {
          if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        };
        const trackInstalling = () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", checkWaiting);
          cleanups.push(() => worker.removeEventListener("statechange", checkWaiting));
        };
        checkWaiting();
        trackInstalling();
        reg.addEventListener("updatefound", trackInstalling);
        cleanups.push(() => reg.removeEventListener("updatefound", trackInstalling));
      })
      .catch((error: unknown) =>
        console.error("Não foi possível preparar a instalação do AgroHub.", error),
      );
    return () => {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
      navigator.serviceWorker.removeEventListener("controllerchange", controllerChanged);
      window.removeEventListener("focus", checkUpdate);
      window.removeEventListener("online", checkUpdate);
    };
  }, []);

  return (
    <PwaContext.Provider value={{ installed, prompt, clearPrompt: () => setPrompt(null) }}>
      {children}
      {(offline || waiting) && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md space-y-2 pb-[env(safe-area-inset-bottom)]">
          {offline && (
            <p
              role="status"
              className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm shadow-lg"
            >
              <WifiOff className="size-5 shrink-0" />
              Sem conexão. Consultas e salvamento precisam de internet.
            </p>
          )}
          {waiting && (
            <div role="status" className="rounded-xl border bg-card p-4 text-sm shadow-lg">
              <p className="font-semibold">Uma nova versão está disponível</p>
              <p className="mt-1 text-muted-foreground">
                Salve suas alterações antes de atualizar.
              </p>
              <button
                type="button"
                disabled={offline}
                onClick={() => {
                  reloadAfterUpdate.current = true;
                  waiting.postMessage({ type: "SKIP_WAITING" });
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
              >
                <RefreshCw className="size-4" />
                Atualizar aplicativo
              </button>
            </div>
          )}
        </div>
      )}
    </PwaContext.Provider>
  );
}

export function PwaInstallButton() {
  const state = useContext(PwaContext);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!state || state.installed) return null;
  async function install() {
    if (!state?.prompt) return;
    setBusy(true);
    setError("");
    try {
      await state.prompt.prompt();
      const result = await state.prompt.userChoice;
      if (result.outcome === "accepted") setOpen(false);
    } catch {
      setError("Use o menu do navegador para instalar o aplicativo.");
    } finally {
      state.clearPrompt();
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 px-3 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          <Download className="size-4" />
          Instalar aplicativo
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Leve o AgroHub para o campo</DialogTitle>
          <DialogDescription>
            Instale no seu celular ou computador e abra direto pela tela inicial. Disponível para
            produtores e agrônomos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {state.prompt && (
            <button
              type="button"
              onClick={() => void install()}
              disabled={busy}
              className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Aguarde…" : "Instalar agora"}
            </button>
          )}
          <section>
            <h3 className="font-semibold">iPhone e iPad</h3>
            <p className="mt-1 text-muted-foreground">
              Abra este endereço no Safari. Toque em Compartilhar, escolha Adicionar à Tela de
              Início e confirme em Adicionar. Se aparecer, mantenha Abrir como App ativado.
            </p>
          </section>
          <section>
            <h3 className="font-semibold">Android</h3>
            <p className="mt-1 text-muted-foreground">
              Abra no Chrome. Toque em Instalar agora, quando disponível, ou use o menu ⋮ e escolha
              Instalar aplicativo ou Adicionar à tela inicial.
            </p>
          </section>
          <section>
            <h3 className="font-semibold">Computador</h3>
            <p className="mt-1 text-muted-foreground">
              No Chrome ou Edge, use o ícone de instalação na barra de endereço ou a opção de
              instalar no menu do navegador. No Safari do Mac, use Adicionar ao Dock, quando
              disponível.
            </p>
          </section>
          <p className="rounded-xl bg-secondary p-3 text-muted-foreground">
            O mesmo login funciona no aplicativo instalado. Você precisa de internet para consultar
            informações e salvar registros.
          </p>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
