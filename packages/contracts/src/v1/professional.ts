import { z } from "zod";

import {
  contractEnvelopeSchema,
  entityIdSchema,
  nonEmptyStringSchema,
  tenantIdSchema
} from "./shared";

export const professionalStatusSchema = nonEmptyStringSchema;
export const specialtyIdsSchema = z.array(entityIdSchema);

export const professionalSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  nome: nonEmptyStringSchema,
  status: professionalStatusSchema,
  especialidades: specialtyIdsSchema
});

export const createProfessionalSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  nome: nonEmptyStringSchema,
  especialidades: specialtyIdsSchema
});

export type Professional = z.infer<typeof professionalSchema>;
export type CreateProfessionalCommand = z.infer<typeof createProfessionalSchema>;
