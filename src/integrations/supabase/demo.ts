import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const DEMO_PASSWORD = "AgroTeste123!";
export const DEMO_ACCOUNTS = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    email: "produtor@agrohub.test",
    nome: "Produtor de teste",
    perfil: "produtor",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    email: "agronomo@agrohub.test",
    nome: "Agrônomo de teste",
    perfil: "agronomo",
  },
] as const;

type Row = Record<string, unknown>;
type DemoData = Record<string, Row[]>;
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
const DATA_KEY = "agrohub-demo-data-v1";
const SESSION_KEY = "agrohub-demo-session-v1";

function initialData(): DemoData {
  const owner = DEMO_ACCOUNTS[0].id;
  return {
    profiles: DEMO_ACCOUNTS.map((a) => ({ ...a })),
    talhoes: [
      {
        id: "talhao-demo",
        owner_id: owner,
        nome: "Talhão Sede",
        cultura: "soja",
        area_ha: 48,
        dispositivo: "GPX de exemplo",
        estadio: "V4",
        coords: [
          [-30.05, -51.35],
          [-30.044, -51.35],
          [-30.044, -51.342],
          [-30.05, -51.342],
        ],
      },
    ],
    operacoes: [
      {
        id: "operacao-demo",
        owner_id: owner,
        talhao_id: "talhao-demo",
        safra: "2026/2027",
        tipo: "semeadura",
        produto: "Soja",
        dose: "48 kg/ha",
        data: "2026-10-28",
        observacao: "Dados fictícios para teste.",
      },
    ],
    safras: [
      {
        id: "safra-demo",
        owner_id: owner,
        talhao_id: "talhao-demo",
        nome: "2025/2026",
        cultura: "soja",
        area_ha: 48,
        produtividade: 64,
        plantio: "2025-10-28",
        colheita: "2026-03-18",
        observacao: "Safra demonstrativa.",
      },
    ],
    vistorias: [
      {
        id: "vistoria-demo",
        owner_id: owner,
        autor_id: DEMO_ACCOUNTS[1].id,
        talhao_id: "talhao-demo",
        estadio: "V4",
        alvo: "Percevejo",
        severidade: "baixa",
        recomendacao: "Monitorar semanalmente.",
        created_at: "2026-11-10T12:00:00Z",
      },
    ],
    maquinas: [
      {
        id: "maquina-demo",
        owner_id: owner,
        nome: "Trator da sede",
        modelo: "John Deere 6110J",
        tipo: "trator",
        horimetro: 4820,
        intervalo_manutencao_h: 250,
        ultima_manutencao_h: 4640,
        device_token: "demo-sem-telemetria",
        motor_ligado: false,
        ultima_leitura_em: null,
        foto_url: "",
        created_at: "2026-11-01T12:00:00Z",
      },
    ],
    servicos: [],
  };
}

export function createDemoClient(storage: Storage): SupabaseClient<Database> {
  const listeners = new Set<(event: string) => void>();
  const account = () => DEMO_ACCOUNTS.find((a) => a.id === storage.getItem(SESSION_KEY)) ?? null;
  const user = () => {
    const a = account();
    return a ? { id: a.id, email: a.email } : null;
  };
  const emit = (event: string) => listeners.forEach((fn) => fn(event));
  function read(): DemoData {
    const raw = storage.getItem(DATA_KEY);
    return raw ? JSON.parse(raw) : initialData();
  }
  const client = {
    auth: {
      getUser: async () => ({ data: { user: user() }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const a = DEMO_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase());
        if (!a || password !== DEMO_PASSWORD)
          return { error: new Error("Invalid login credentials") };
        storage.setItem(SESSION_KEY, a.id);
        emit("SIGNED_IN");
        return { data: { user: user() }, error: null };
      },
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error("Use as contas de demonstração indicadas abaixo."),
      }),
      signOut: async () => {
        storage.removeItem(SESSION_KEY);
        emit("SIGNED_OUT");
        return { error: null };
      },
      onAuthStateChange: (fn: (event: string) => void) => {
        listeners.add(fn);
        return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } };
      },
    },
    from(table: string) {
      let operation = "select";
      let values: Row[] = [];
      let single = false;
      let ordering: { column: string; ascending: boolean } | undefined;
      const filters: [string, unknown][] = [];
      const builder = {
        select: (_columns?: string) => builder,
        eq: (column: string, value: unknown) => {
          filters.push([column, value]);
          return builder;
        },
        order: (column: string, options?: { ascending?: boolean }) => {
          ordering = { column, ascending: options?.ascending ?? true };
          return builder;
        },
        maybeSingle: () => {
          single = true;
          return builder;
        },
        insert: (rows: Row | Row[]) => {
          operation = "insert";
          values = Array.isArray(rows) ? rows : [rows];
          return builder;
        },
        update: (row: Row) => {
          operation = "update";
          values = [row];
          return builder;
        },
        then(
          resolve: (result: { data: Row[] | Row | null; error: Error | null }) => unknown,
          reject?: (error: unknown) => unknown,
        ) {
          return Promise.resolve()
            .then(() => {
              const a = account();
              if (!a) throw new Error("Faça login para continuar.");
              const data = read();
              const rows = data[table];
              if (!rows) throw new Error(`Tabela não suportada na demonstração: ${table}`);
              const visible = (r: Row) =>
                table === "profiles"
                  ? a.perfil === "agronomo" || r["id"] === a.id
                  : r["owner_id"] === a.id ||
                    (a.perfil === "agronomo" && table !== "maquinas" && table !== "servicos");
              const matches = (r: Row) => visible(r) && filters.every(([k, v]) => r[k] === v);
              let result = rows.filter(matches);
              if (operation !== "select") {
                if (a.perfil === "agronomo" && table !== "vistorias")
                  throw new Error("Acesso somente para leitura neste perfil.");
                if (operation === "insert") {
                  if (
                    values.some((r) =>
                      a.perfil === "produtor"
                        ? r["owner_id"] !== a.id
                        : r["autor_id"] !== a.id ||
                          !data["talhoes"]?.some(
                            (t) => t["id"] === r["talhao_id"] && t["owner_id"] === r["owner_id"],
                          ),
                    )
                  )
                    throw new Error("Registro não autorizado.");
                  result = values.map((v) => ({
                    id: crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                    motor_ligado: false,
                    ultima_leitura_em: null,
                    device_token: "demo-sem-telemetria",
                    ...v,
                  }));
                  rows.push(...result);
                } else result.forEach((r) => Object.assign(r, values[0]));
                storage.setItem(DATA_KEY, JSON.stringify(data));
              }
              if (ordering) {
                const { column, ascending } = ordering;
                result.sort(
                  (a, b) =>
                    String(a[column] ?? "").localeCompare(String(b[column] ?? ""), "pt-BR", {
                      numeric: true,
                    }) * (ascending ? 1 : -1),
                );
              }
              return { data: single ? (result[0] ?? null) : result, error: null };
            })
            .catch((error: Error) => ({ data: null, error }))
            .then(resolve, reject);
        },
      };
      return builder;
    },
  };
  return client as unknown as SupabaseClient<Database>;
}
