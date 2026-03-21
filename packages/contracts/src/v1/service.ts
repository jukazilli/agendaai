import { z } from "zod";

import {
  contractEnvelopeSchema,
  durationMinutesSchema,
  entityIdSchema,
  moneyAmountSchema,
  nonEmptyStringSchema,
  optionalTrimmedStringSchema,
  tenantIdSchema
} from "./shared";
import { servicePaymentPolicySchema } from "./payment";

export const serviceStatusValues = ["active", "inactive"] as const;
export const serviceStatusSchema = z.enum(serviceStatusValues);

export const serviceSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  codigo: nonEmptyStringSchema,
  nome: nonEmptyStringSchema,
  duracaoMin: durationMinutesSchema,
  precoBase: moneyAmountSchema,
  exigeSinal: z.boolean(),
  paymentPolicy: servicePaymentPolicySchema,
  status: serviceStatusSchema
});

export const createServiceSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  codigo: optionalTrimmedStringSchema,
  nome: nonEmptyStringSchema,
  duracaoMin: durationMinutesSchema,
  precoBase: moneyAmountSchema,
  exigeSinal: z.boolean(),
  paymentPolicy: servicePaymentPolicySchema.optional()
});

export type Service = z.infer<typeof serviceSchema>;
export type CreateServiceCommand = z.infer<typeof createServiceSchema>;
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
