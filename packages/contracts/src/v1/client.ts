import { z } from "zod";

import {
  contractEnvelopeSchema,
  emailSchema,
  entityIdSchema,
  nonEmptyStringSchema,
  optionalTrimmedStringSchema,
  phoneSchema,
  tenantIdSchema
} from "./shared";

export const clientSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  codigo: nonEmptyStringSchema,
  nome: nonEmptyStringSchema,
  telefone: phoneSchema,
  email: emailSchema,
  origem: nonEmptyStringSchema
});

export const clientContactInputSchema = z.object({
  codigo: optionalTrimmedStringSchema,
  nome: nonEmptyStringSchema,
  telefone: phoneSchema,
  email: emailSchema,
  origem: nonEmptyStringSchema
});

export type Client = z.infer<typeof clientSchema>;
export type ClientContactInput = z.infer<typeof clientContactInputSchema>;
