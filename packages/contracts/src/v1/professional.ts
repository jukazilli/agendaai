import { z } from "zod";

import {
  contractEnvelopeSchema,
  entityIdSchema,
  nonEmptyStringSchema,
  optionalTrimmedStringSchema,
  tenantIdSchema
} from "./shared";

export const professionalStatusValues = ["active", "inactive"] as const;
export const professionalStatusSchema = z.enum(professionalStatusValues);
export const specialtyIdsSchema = z.array(entityIdSchema);

export const professionalSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  codigo: nonEmptyStringSchema,
  nome: nonEmptyStringSchema,
  status: professionalStatusSchema,
  especialidades: specialtyIdsSchema
});

export const createProfessionalSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  codigo: optionalTrimmedStringSchema,
  nome: nonEmptyStringSchema,
  especialidades: specialtyIdsSchema
});

export type Professional = z.infer<typeof professionalSchema>;
export type CreateProfessionalCommand = z.infer<typeof createProfessionalSchema>;
export type ProfessionalStatus = z.infer<typeof professionalStatusSchema>;
