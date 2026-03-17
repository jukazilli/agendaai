import { z } from "zod";

import {
  contractEnvelopeSchema,
  emailSchema,
  entityIdSchema,
  nonEmptyStringSchema,
  phoneSchema,
  tenantIdSchema
} from "./shared";

export const clientSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  nome: nonEmptyStringSchema,
  telefone: phoneSchema,
  email: emailSchema,
  origem: nonEmptyStringSchema
});

export const clientContactInputSchema = z.object({
  nome: nonEmptyStringSchema,
  telefone: phoneSchema,
  email: emailSchema,
  origem: nonEmptyStringSchema
});

export type Client = z.infer<typeof clientSchema>;
export type ClientContactInput = z.infer<typeof clientContactInputSchema>;
