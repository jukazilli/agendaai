import { z } from "zod";

import {
  adminRoles,
  tenantContextSources,
  tenantSlugMaxLength,
  tenantSlugMinLength,
  tenantSlugPattern
} from "../identity";

export const contractVersion = "v1" as const;

export const entityIdSchema = z.string().min(1);
export const tenantIdSchema = z.string().min(1);
export const nonEmptyStringSchema = z.string().trim().min(1);
export const optionalTrimmedStringSchema = z.string().trim().min(1).optional();

// Timezone normalization still depends on a later cross-cutting decision.
export const dateTimeStringSchema = z.string().trim().min(1);
export const dateStringSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/);

export const emailSchema = z.string().trim().email();
export const phoneSchema = z.string().trim().min(1);
export const moneyAmountSchema = z.number().finite().nonnegative();
export const durationMinutesSchema = z.number().int().positive();
export const weekdayIndexSchema = z.number().int().min(0).max(6);
export const timeOfDaySchema = z.string().regex(/^\d{2}:\d{2}$/);

export const tenantSlugSchema = z
  .string()
  .trim()
  .min(tenantSlugMinLength)
  .max(tenantSlugMaxLength)
  .regex(tenantSlugPattern);

export const tenantContextSourceSchema = z.enum(tenantContextSources);
export const adminRoleSchema = z.enum(adminRoles);

export const tenantScopedMetaSchema = z.object({
  tenantId: tenantIdSchema,
  source: tenantContextSourceSchema,
  requestedBy: optionalTrimmedStringSchema
});

export const bookingStatusValues = [
  "pendente",
  "aguardando pagamento",
  "confirmado",
  "concluido",
  "cancelado",
  "faltou",
  "reagendado"
] as const;

export const bookingStatusSchema = z.enum(bookingStatusValues);

export const contractEnvelopeSchema = z.object({
  version: z.literal(contractVersion)
});
