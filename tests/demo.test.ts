import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemoClient,
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
} from "../src/integrations/supabase/demo.ts";

function fixture() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  return { storage, client: createDemoClient(storage) };
}

test("demo rejects invalid credentials and anonymous queries", async () => {
  const { client } = fixture();
  assert.ok(
    (await client.auth.signInWithPassword({ email: DEMO_ACCOUNTS[0].email, password: "wrong" }))
      .error,
  );
  assert.equal((await client.auth.getUser()).data.user, null);
  assert.ok((await client.from("talhoes").select("*")).error);
});

test("producer can persist operations and sign out without leaking the session", async () => {
  const { client, storage } = fixture();
  await client.auth.signInWithPassword({ email: DEMO_ACCOUNTS[0].email, password: DEMO_PASSWORD });
  const { data: fields } = await client.from("talhoes").select("*");
  assert.equal(fields?.length, 1);
  const result = await client.from("operacoes").insert({
    owner_id: DEMO_ACCOUNTS[0].id,
    talhao_id: "talhao-demo",
    tipo: "adubacao",
    produto: "MAP",
    dose: "100 kg/ha",
    data: "2026-11-12",
  });
  assert.equal(result.error, null);
  const reloaded = createDemoClient(storage);
  assert.equal((await reloaded.auth.getUser()).data.user?.id, DEMO_ACCOUNTS[0].id);
  assert.equal((await reloaded.from("operacoes").select("*")).data?.length, 2);
  await reloaded.auth.signOut();
  assert.equal((await client.auth.getUser()).data.user, null);
});

test("agronomist can inspect fields and create reports but cannot change producer assets", async () => {
  const { client } = fixture();
  await client.auth.signInWithPassword({ email: DEMO_ACCOUNTS[1].email, password: DEMO_PASSWORD });
  assert.equal((await client.from("talhoes").select("*")).data?.length, 1);
  assert.ok(
    (await client.from("talhoes").update({ nome: "Changed" }).eq("id", "talhao-demo")).error,
  );
  assert.equal((await client.from("maquinas").select("*")).data?.length, 0);
  const report = await client.from("vistorias").insert({
    owner_id: DEMO_ACCOUNTS[0].id,
    autor_id: DEMO_ACCOUNTS[1].id,
    talhao_id: "talhao-demo",
    estadio: "V4",
    alvo: "Teste",
    severidade: "baixa",
    recomendacao: "Monitorar",
  });
  assert.equal(report.error, null);
});
