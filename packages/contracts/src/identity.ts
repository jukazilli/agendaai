export const adminRoles = ["owner", "manager", "staff"] as const;
export type AdminRole = (typeof adminRoles)[number];

export const tenantContextSources = [
  "session",
  "public_slug",
  "internal_event",
  "system_job"
] as const;
export type TenantContextSource = (typeof tenantContextSources)[number];

export const authActorKinds = ["admin_user", "public_client", "internal_process"] as const;
export type AuthActorKind = (typeof authActorKinds)[number];

export const tenantSlugMinLength = 3;
export const tenantSlugMaxLength = 40;
export const tenantSlugPattern = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export interface TenantContextContract {
  readonly tenantId: string;
  readonly source: TenantContextSource;
  readonly slug?: string;
}

export interface AdminSessionClaimsContract {
  readonly actor: "admin_user";
  readonly sub: string;
  readonly tenantId: string;
  readonly role: AdminRole;
}

export interface PublicTenantRouteContract {
  readonly slug: string;
}

export interface TenantScopedCommandMetaContract {
  readonly tenantId: string;
  readonly source: TenantContextSource;
  readonly requestedBy?: string;
}

export function isValidTenantSlug(value: string): boolean {
  return tenantSlugPattern.test(value);
}

export const authTenancyDecisionSnapshot = {
  adminRoles,
  authActorKinds,
  tenantContextSources,
  tenantSlugMinLength,
  tenantSlugMaxLength
} as const;

