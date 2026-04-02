import type {
  Booking,
  Client,
  PaymentIntent,
  Professional,
  Service,
  TenantBranding
} from "@agendaai/contracts";

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === "development" ? "http://127.0.0.1:3333" : "https://api.agendaai.com";

export interface PublicTenantProfile {
  readonly slug: string;
  readonly nome: string;
  readonly timezone: string;
  readonly branding: TenantBranding;
}

export interface PublicCatalogSnapshot {
  readonly tenant: PublicTenantProfile;
  readonly services: Service[];
  readonly professionals: Professional[];
}

export interface PublicAvailabilitySlot {
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly startAt: string;
  readonly endAt: string;
}

export interface PublicBookingResponse {
  readonly tenant: PublicTenantProfile;
  readonly client: Client;
  readonly service: Service;
  readonly professional: Professional;
  readonly booking: Booking;
}

export interface PublicPaymentIntentResponse extends PublicBookingResponse {
  readonly paymentIntent: PaymentIntent;
}

export interface PublicPaymentIntentStateResponse {
  readonly item: PaymentIntent;
  readonly booking: Booking;
}

export interface PublicApiErrorPayload {
  readonly error?: string;
  readonly message?: string;
}

export class PublicApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function resolvePublicApiUrl(pathname: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return new URL(pathname, baseUrl).toString();
}

export async function getPublicCatalog(slug: string): Promise<PublicCatalogSnapshot> {
  const response = await fetch(resolvePublicApiUrl(`/v1/public/tenants/${slug}/catalog`), {
    cache: "no-store"
  });

  if (!response.ok) {
    throw await toPublicApiError(response);
  }

  return (await response.json()) as PublicCatalogSnapshot;
}

export async function toPublicApiError(response: Response): Promise<PublicApiError> {
  let payload: PublicApiErrorPayload | undefined;

  try {
    payload = (await response.json()) as PublicApiErrorPayload;
  } catch {
    payload = undefined;
  }

  return new PublicApiError(
    response.status,
    payload?.message ?? `Public API request failed with status ${response.status}.`,
    payload?.error
  );
}
