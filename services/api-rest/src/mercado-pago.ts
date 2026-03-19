import https from "node:https";

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
  findPaymentByExternalReference(
    accessToken: string,
    externalReference: string
  ): Promise<MercadoPagoPaymentResponse | undefined>;
}

interface MercadoPagoApiErrorPayload {
  readonly message?: string;
  readonly cause?: Array<{
    readonly code?: string;
    readonly description?: string;
  }>;
}

interface MercadoPagoRequestInit {
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly body?: string;
}

const insecureMercadoPagoAgent =
  process.env.AGENDAAI_INSECURE_MP_TLS === "1"
    ? new https.Agent({
        rejectUnauthorized: false
      })
    : undefined;

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
      const response = await performMercadoPagoRequest(
        fetchImplementation,
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

      if (!response.ok) {
        throw toMercadoPagoApiError(response.status, response.payload);
      }

      return {
        id: readRequiredString(response.payload.id, "id"),
        initPoint: readOptionalString(response.payload.init_point),
        sandboxInitPoint: readOptionalString(response.payload.sandbox_init_point)
      };
    },

    async getPayment(accessToken, paymentId) {
      const response = await performMercadoPagoRequest(
        fetchImplementation,
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw toMercadoPagoApiError(response.status, response.payload);
      }

      return parsePaymentResponse(response.payload);
    },

    async findPaymentByExternalReference(accessToken, externalReference) {
      const url = new URL("https://api.mercadopago.com/v1/payments/search");
      url.searchParams.set("external_reference", externalReference);
      url.searchParams.set("sort", "date_created");
      url.searchParams.set("criteria", "desc");
      url.searchParams.set("limit", "1");

      const response = await performMercadoPagoRequest(fetchImplementation, url, {
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw toMercadoPagoApiError(response.status, response.payload);
      }

      const results = Array.isArray(response.payload.results) ? response.payload.results : [];
      const candidate = results[0];
      if (!isRecord(candidate)) {
        return undefined;
      }

      return parsePaymentResponse(candidate);
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

function parsePaymentResponse(payload: Record<string, unknown>): MercadoPagoPaymentResponse {
  return {
    id: readRequiredString(payload.id, "id"),
    status: readRequiredString(payload.status, "status"),
    statusDetail: readOptionalString(payload.status_detail),
    externalReference: readOptionalString(payload.external_reference)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function performMercadoPagoRequest(
  fetchImplementation: typeof fetch,
  url: string | URL,
  init: MercadoPagoRequestInit
): Promise<{
  status: number;
  ok: boolean;
  payload: Record<string, unknown>;
}> {
  if (!insecureMercadoPagoAgent) {
    const response = await fetchImplementation(url, init);
    return {
      status: response.status,
      ok: response.ok,
      payload: await parseJson<Record<string, unknown>>(response)
    };
  }

  return await performMercadoPagoHttpsRequest(url, init);
}

async function performMercadoPagoHttpsRequest(
  url: string | URL,
  init: MercadoPagoRequestInit
): Promise<{
  status: number;
  ok: boolean;
  payload: Record<string, unknown>;
}> {
  const target = typeof url === "string" ? new URL(url) : url;

  return await new Promise((resolve, reject) => {
    const request = https.request(
      target,
      {
        method: init.method ?? "GET",
        headers: init.headers,
        agent: insecureMercadoPagoAgent
      },
      (response) => {
        let rawPayload = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          rawPayload += chunk;
        });
        response.on("end", () => {
          let payload: Record<string, unknown> = {};
          try {
            payload = rawPayload ? (JSON.parse(rawPayload) as Record<string, unknown>) : {};
          } catch {
            payload = {};
          }

          const status = response.statusCode ?? 500;
          resolve({
            status,
            ok: status >= 200 && status < 300,
            payload
          });
        });
      }
    );

    request.on("error", reject);

    if (init.body) {
      request.write(init.body);
    }

    request.end();
  });
}
