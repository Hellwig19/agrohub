import { createFileRoute } from "@tanstack/react-router";
import { telemetriaSchema } from "@/lib/telemetria";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/telemetria")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        const parsed = telemetriaSchema.safeParse(body);
        if (!parsed.success) return json({ error: "invalid_payload" }, 400);
        const payload = parsed.data;
        const token = payload.device_token;
        const horas = payload.horas_motor;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: maquina, error } = await supabaseAdmin
          .from("maquinas")
          .select("id, owner_id, horimetro")
          .eq("device_token", token)
          .maybeSingle();

        if (error) return json({ error: "lookup_failed" }, 500);
        if (!maquina) return json({ error: "device_not_found" }, 404);

        const absoluto = payload.horimetro;
        const novoHorimetro =
          absoluto !== undefined
            ? Math.max(Number(maquina.horimetro), absoluto)
            : Number(maquina.horimetro) + horas;

        const { error: insertError } = await supabaseAdmin.from("telemetria").insert({
          maquina_id: maquina.id,
          owner_id: maquina.owner_id,
          motor_ligado: payload.motor_ligado ?? true,
          horas_motor: horas,
        });
        if (insertError) return json({ error: "insert_failed" }, 500);

        const { error: updateError } = await supabaseAdmin
          .from("maquinas")
          .update({
            horimetro: novoHorimetro,
            motor_ligado: payload.motor_ligado ?? true,
            ultima_leitura_em: new Date().toISOString(),
          })
          .eq("id", maquina.id);

        if (updateError) return json({ error: "update_failed" }, 500);

        return json({ ok: true, horimetro: novoHorimetro });
      },
    },
  },
});
