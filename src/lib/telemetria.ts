import { z } from "zod";

export const telemetriaSchema = z.object({
  device_token: z.string().trim().min(16),
  motor_ligado: z.boolean().default(true),
  horas_motor: z.number().finite().min(0).max(24).default(0),
  horimetro: z.number().finite().min(0).optional(),
});
