export interface MercadoPagoPreferenceRequest {
  readonly accessToken: string;
  readonly payload: Record<string, unknown>;
}

export interface MercadoPagoPreferenceResponse {
  readonly id: string;
  readonly initPoint?: string;
  readonly sandboxInitPoint?: string;
}

export interface MercadoPagoPaymentResponse {
  readonly id: string;
  readonly status: string;
  readonly statusDetail?: string;
  readonly externalReference?: string;
}

export interface MercadoPagoGateway {
  createPreference(request: MercadoPagoPreferenceRequest): Promise<MercadoPagoPreferenceResponse>;
  getPayment(accessToken: string, paymentId: string): Promise<MercadoPagoPaymentResponse>;
}

interface MercadoPagoApiErrorPayload {
  readonly message?: string;
  readonly cause?: Array<{
    readonly code?: string;
    readonly description?: string;
  }>;
}

export class MercadoPagoApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function createMercadoPagoGateway(
  fetchImplementation: typeof fetch = fetch
): MercadoPagoGateway {
  return {
    async createPreference(request) {
      const response = await fetchImplementation(
        "https://api.mercadopago.com/checkout/preferences",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${request.accessToken}`,
            "content-type": "application/json"
          },
          body: JSON.stringify(request.payload)
        }
      );

      const payload = await parseJson<Record<string, unknown>>(response);
      if (!response.ok) {
        throw toMercadoPagoApiError(response.status, payload);
      }

      return {
        id: readRequiredString(payload.id, "id"),
        initPoint: readOptionalString(payload.init_point),
        sandboxInitPoint: readOptionalString(payload.sandbox_init_point)
      };
    },

    async getPayment(accessToken, paymentId) {
      const response = await fetchImplementation(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            authorization: `Bearer ${accessToken}`
          }
        }
      );

      const payload = await parseJson<Record<string, unknown>>(response);
      if (!response.ok) {
        throw toMercadoPagoApiError(response.status, payload);
      }

      return {
        id: readRequiredString(payload.id, "id"),
        status: readRequiredString(payload.status, "status"),
        statusDetail: readOptionalString(payload.status_detail),
        externalReference: readOptionalString(payload.external_reference)
      };
    }
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function toMercadoPagoApiError(
  status: number,
  payload: Record<string, unknown>
): MercadoPagoApiError {
  const errorPayload = payload as MercadoPagoApiErrorPayload;
  const causeDescription = errorPayload.cause?.[0]?.description;
  return new MercadoPagoApiError(
    status,
    causeDescription ?? errorPayload.message ?? `Mercado Pago request failed with status ${status}.`
  );
}

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  throw new Error(`Mercado Pago response is missing required field '${fieldName}'.`);
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}
