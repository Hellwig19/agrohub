import test from "node:test";
import assert from "node:assert/strict";
import { telemetriaSchema } from "../src/lib/telemetria.ts";

test("telemetry rejects malformed objects instead of throwing in the handler", () => {
  for (const body of [
    null,
    [],
    { device_token: 123 },
    { device_token: "valid-device-token", horimetro: null },
    { device_token: "valid-device-token", motor_ligado: "false" },
    { device_token: "valid-device-token", horas_motor: -1 },
  ]) {
    assert.equal(telemetriaSchema.safeParse(body).success, false);
  }
});

test("omitted absolute hour meter stays undefined so elapsed hours are used", () => {
  const result = telemetriaSchema.parse({ device_token: "valid-device-token", horas_motor: 2 });
  assert.equal(result.horimetro, undefined);
  assert.equal(result.horas_motor, 2);
});
