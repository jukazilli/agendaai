import { z } from "zod";

import {
  contractEnvelopeSchema,
  durationMinutesSchema,
  entityIdSchema,
  moneyAmountSchema,
  nonEmptyStringSchema,
  tenantIdSchema
} from "./shared";

export const serviceStatusSchema = nonEmptyStringSchema;

export const serviceSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  nome: nonEmptyStringSchema,
  duracaoMin: durationMinutesSchema,
  precoBase: moneyAmountSchema,
  exigeSinal: z.boolean(),
  status: serviceStatusSchema
});

export const createServiceSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  nome: nonEmptyStringSchema,
  duracaoMin: durationMinutesSchema,
  precoBase: moneyAmountSchema,
  exigeSinal: z.boolean()
});

export type Service = z.infer<typeof serviceSchema>;
export type CreateServiceCommand = z.infer<typeof createServiceSchema>;
