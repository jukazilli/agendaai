import type {
  AdminSessionClaimsContract,
  AvailabilityRule,
  Booking,
  Client,
  CreateTenantCommand,
  PaymentIntent,
  Professional,
  Service,
  Tenant,
  TenantPaymentSettings
} from "@agendaai/contracts";

export const DEFAULT_ADMIN_API_BASE_URL = "http://127.0.0.1:3333";

export interface AdminSessionRecord {
  readonly token: string;
  readonly claims: AdminSessionClaimsContract;
}

export interface AdminSessionEnvelope {
  readonly claims: AdminSessionClaimsContract;
  readonly tenant: Tenant;
}

export interface TenantOnboardingResponse {
  readonly tenant: Tenant;
  readonly session: AdminSessionRecord;
}

export interface AdminBootstrapPayload {
  readonly session: AdminSessionEnvelope;
  readonly paymentSettings?: TenantPaymentSettings;
  readonly paymentIntents: PaymentIntent[];
  readonly services: Service[];
  readonly professionals: Professional[];
  readonly clients: Client[];
  readonly bookings: Booking[];
}

interface JsonRequestOptions {
  readonly method?: "GET" | "POST" | "PATCH" | "PUT";
  readonly token?: string;
  readonly body?: unknown;
}

export interface BookingPatchPayload {
  readonly clientId?: string;
  readonly serviceId?: string;
  readonly professionalId?: string;
  readonly status?: Booking["status"];
  readonly startAt?: string;
  readonly endAt?: string;
}

export interface PaymentIntentSyncPayload {
  readonly paymentId?: string;
}

interface ApiErrorPayload {
  readonly error?: string;
  readonly message?: string;
}

export class AdminApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function resolveAdminApiBaseUrl(value: string): string {
  const trimmed = value.trim();
  const candidate = trimmed.length > 0 ? trimmed : DEFAULT_ADMIN_API_BASE_URL;
  return candidate.replace(/\/+$/, "");
}

export async function loginAdmin(
  apiBaseUrl: string,
  email: string,
  password: string
): Promise<AdminSessionRecord> {
  return await requestJson<AdminSessionRecord>(apiBaseUrl, "/v1/admin/auth/sessions", {
    method: "POST",
    body: {
      email,
      password
    }
  });
}

export async function createTenantOnboarding(
  apiBaseUrl: string,
  payload: Omit<CreateTenantCommand, "version">
): Promise<TenantOnboardingResponse> {
  const response = await requestJson<{
    tenant: Tenant;
    session: AdminSessionRecord;
  }>(apiBaseUrl, "/v1/onboarding/tenants", {
    method: "POST",
    body: payload
  });

  return {
    tenant: response.tenant,
    session: response.session
  };
}

export async function fetchAdminBootstrap(
  apiBaseUrl: string,
  token: string
): Promise<AdminBootstrapPayload> {
  const [session, paymentSettings, paymentIntents, services, professionals, clients, bookings] =
    await Promise.all([
    requestJson<AdminSessionEnvelope>(apiBaseUrl, "/v1/admin/auth/session", {
      token
    }),
    requestJson<{ item?: TenantPaymentSettings }>(apiBaseUrl, "/v1/admin/payment-settings", {
      token
    }),
    requestJson<{ items: PaymentIntent[] }>(apiBaseUrl, "/v1/admin/payment-intents", {
      token
    }),
    requestJson<{ items: Service[] }>(apiBaseUrl, "/v1/admin/services", {
      token
    }),
    requestJson<{ items: Professional[] }>(apiBaseUrl, "/v1/admin/professionals", {
      token
    }),
    requestJson<{ items: Client[] }>(apiBaseUrl, "/v1/admin/clients", {
      token
    }),
    requestJson<{ items: Booking[] }>(apiBaseUrl, "/v1/admin/bookings", {
      token
    })
  ]);

  return {
    session,
    paymentSettings: paymentSettings.item,
    paymentIntents: paymentIntents.items,
    services: services.items,
    professionals: professionals.items,
    clients: clients.items,
    bookings: bookings.items
  };
}

export async function updateTenantSlug(
  apiBaseUrl: string,
  token: string,
  slug: string
): Promise<Tenant> {
  return await requestJson<Tenant>(apiBaseUrl, "/v1/admin/tenant/slug", {
    method: "PATCH",
    token,
    body: {
      slug
    }
  });
}

export async function savePaymentSettings(
  apiBaseUrl: string,
  token: string,
  payload: Omit<TenantPaymentSettings, "version" | "tenantId" | "provider">
): Promise<TenantPaymentSettings> {
  return await requestJson<TenantPaymentSettings>(apiBaseUrl, "/v1/admin/payment-settings", {
    method: "PUT",
    token,
    body: payload
  });
}

export async function createService(
  apiBaseUrl: string,
  token: string,
  payload: {
    nome: string;
    duracaoMin: number;
    precoBase: number;
    exigeSinal: boolean;
    paymentPolicy?: Service["paymentPolicy"];
  }
): Promise<Service> {
  return await requestJson<Service>(apiBaseUrl, "/v1/admin/services", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateService(
  apiBaseUrl: string,
  token: string,
  serviceId: string,
  payload: {
    nome: string;
    duracaoMin: number;
    precoBase: number;
    exigeSinal: boolean;
    paymentPolicy: Service["paymentPolicy"];
    status: string;
  }
): Promise<Service> {
  return await requestJson<Service>(apiBaseUrl, `/v1/admin/services/${serviceId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function createProfessional(
  apiBaseUrl: string,
  token: string,
  payload: {
    nome: string;
    especialidades: string[];
  }
): Promise<Professional> {
  return await requestJson<Professional>(apiBaseUrl, "/v1/admin/professionals", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateProfessional(
  apiBaseUrl: string,
  token: string,
  professionalId: string,
  payload: {
    nome: string;
    status: string;
    especialidades: string[];
  }
): Promise<Professional> {
  return await requestJson<Professional>(
    apiBaseUrl,
    `/v1/admin/professionals/${professionalId}`,
    {
      method: "PATCH",
      token,
      body: payload
    }
  );
}

export async function fetchProfessionalAvailability(
  apiBaseUrl: string,
  token: string,
  professionalId: string
): Promise<AvailabilityRule[]> {
  const response = await requestJson<{ items: AvailabilityRule[] }>(
    apiBaseUrl,
    `/v1/admin/professionals/${professionalId}/availability`,
    {
      token
    }
  );

  return response.items;
}

export async function saveProfessionalAvailability(
  apiBaseUrl: string,
  token: string,
  professionalId: string,
  rules: Array<{
    weekday: number;
    faixa: {
      startTime: string;
      endTime: string;
    };
  }>
): Promise<AvailabilityRule[]> {
  const response = await requestJson<{ items: AvailabilityRule[] }>(
    apiBaseUrl,
    `/v1/admin/professionals/${professionalId}/availability`,
    {
      method: "PUT",
      token,
      body: {
        rules
      }
    }
  );

  return response.items;
}

export async function updateBooking(
  apiBaseUrl: string,
  token: string,
  bookingId: string,
  payload: BookingPatchPayload
): Promise<Booking> {
  return await requestJson<Booking>(apiBaseUrl, `/v1/admin/bookings/${bookingId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function syncPaymentIntent(
  apiBaseUrl: string,
  token: string,
  paymentIntentId: string,
  payload?: PaymentIntentSyncPayload
): Promise<{ item: PaymentIntent; booking: Booking }> {
  return await requestJson<{ item: PaymentIntent; booking: Booking }>(
    apiBaseUrl,
    `/v1/admin/payment-intents/${paymentIntentId}/sync`,
    {
      method: "POST",
      token,
      body: payload
    }
  );
}

async function requestJson<T>(
  apiBaseUrl: string,
  pathname: string,
  options: JsonRequestOptions = {}
): Promise<T> {
  const response = await fetch(new URL(pathname, `${resolveAdminApiBaseUrl(apiBaseUrl)}/`).toString(), {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    throw await toAdminApiError(response);
  }

  return (await response.json()) as T;
}

async function toAdminApiError(response: Response): Promise<AdminApiError> {
  let payload: ApiErrorPayload | undefined;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = undefined;
  }

  return new AdminApiError(
    response.status,
    payload?.message ?? `Admin API request failed with status ${response.status}.`,
    payload?.error
  );
}
