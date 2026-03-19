import { z } from "zod";

import {
  adminRoleSchema,
  contractEnvelopeSchema,
  emailSchema,
  entityIdSchema,
  nonEmptyStringSchema,
  optionalTrimmedStringSchema,
  tenantIdSchema,
  tenantSlugSchema
} from "./shared";

export const tenantStatusSchema = nonEmptyStringSchema;
export const adminUserStatusSchema = nonEmptyStringSchema;
export const tenantBrandAccentColorSchema = z.string().trim().regex(/^#([0-9a-fA-F]{6})$/);
export const tenantBrandingSchema = z.object({
  tagline: optionalTrimmedStringSchema,
  accentColor: tenantBrandAccentColorSchema.optional()
});

export const tenantSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  slug: tenantSlugSchema,
  nome: nonEmptyStringSchema,
  status: tenantStatusSchema,
  timezone: nonEmptyStringSchema,
  branding: tenantBrandingSchema
});

export const adminUserSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  nome: nonEmptyStringSchema,
  email: emailSchema,
  role: adminRoleSchema,
  status: adminUserStatusSchema
});

export const createTenantSchema = contractEnvelopeSchema.extend({
  nome: nonEmptyStringSchema,
  slug: tenantSlugSchema,
  timezone: nonEmptyStringSchema,
  admin: z.object({
    nome: nonEmptyStringSchema,
    email: emailSchema,
    telefone: optionalTrimmedStringSchema,
    senha: nonEmptyStringSchema,
    aceitarTermos: z.literal(true)
  })
});

export const configureTenantSlugSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  slug: tenantSlugSchema
});

export const configureTenantBrandingSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  branding: tenantBrandingSchema
});

export const publicTenantRouteSchema = contractEnvelopeSchema.extend({
  slug: tenantSlugSchema
});

export type TenantBranding = z.infer<typeof tenantBrandingSchema>;
export type Tenant = z.infer<typeof tenantSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type CreateTenantCommand = z.infer<typeof createTenantSchema>;
export type ConfigureTenantSlugCommand = z.infer<typeof configureTenantSlugSchema>;
export type ConfigureTenantBrandingCommand = z.infer<typeof configureTenantBrandingSchema>;
export type PublicTenantRoute = z.infer<typeof publicTenantRouteSchema>;
