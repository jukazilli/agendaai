interface Env {
  PRIMARY_API_ORIGIN: string;
  SECONDARY_API_ORIGIN: string;
  PRIMARY_TIMEOUT_MS?: string;
  SECONDARY_TIMEOUT_MS?: string;
}

type GatewayOrigin = "render" | "vercel";

const DEFAULT_PRIMARY_TIMEOUT_MS = 2500;
const DEFAULT_SECONDARY_TIMEOUT_MS = 5000;
const FAILOVER_STATUS_CODES = new Set([502, 503, 504]);
const FALLBACK_WRITE_ALLOWLIST = new Set(["POST /v1/admin/auth/sessions"]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestUrl = new URL(request.url);
    const requestKey = `${request.method.toUpperCase()} ${requestUrl.pathname}`;
    const primaryTargetUrl = buildTargetUrl(requestUrl, env.PRIMARY_API_ORIGIN);
    const secondaryTargetUrl = buildTargetUrl(requestUrl, env.SECONDARY_API_ORIGIN);

    const primaryResult = await proxyRequest(request, primaryTargetUrl, resolveTimeoutMs(env.PRIMARY_TIMEOUT_MS, DEFAULT_PRIMARY_TIMEOUT_MS));
    if (primaryResult.response && !shouldFailover(primaryResult.response.status)) {
      return decorateGatewayResponse(primaryResult.response, "render", false);
    }

    if (!isFallbackAllowed(requestKey, request.method)) {
      return createDegradedWriteBlockedResponse(primaryResult.error);
    }

    const secondaryResult = await proxyRequest(
      request,
      secondaryTargetUrl,
      resolveTimeoutMs(env.SECONDARY_TIMEOUT_MS, DEFAULT_SECONDARY_TIMEOUT_MS)
    );

    if (secondaryResult.response) {
      return decorateGatewayResponse(secondaryResult.response, "vercel", true);
    }

    return createGatewayUnavailableResponse(primaryResult.error, secondaryResult.error);
  }
};

async function proxyRequest(
  originalRequest: Request,
  targetUrl: URL,
  timeoutMs: number
): Promise<{ response?: Response; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("request_timeout"), timeoutMs);

  try {
    const forwardedRequest = new Request(targetUrl.toString(), originalRequest.clone());
    const response = await fetch(forwardedRequest, {
      signal: controller.signal
    });
    return { response };
  } catch (error) {
    return {
      error: toGatewayErrorMessage(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildTargetUrl(requestUrl: URL, origin: string): URL {
  const normalizedOrigin = origin.trim().replace(/\/+$/, "");
  return new URL(`${requestUrl.pathname}${requestUrl.search}`, `${normalizedOrigin}/`);
}

function resolveTimeoutMs(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function shouldFailover(statusCode: number): boolean {
  return FAILOVER_STATUS_CODES.has(statusCode);
}

function isFallbackAllowed(requestKey: string, method: string): boolean {
  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod === "GET" || normalizedMethod === "HEAD") {
    return true;
  }

  return FALLBACK_WRITE_ALLOWLIST.has(requestKey);
}

function decorateGatewayResponse(
  response: Response,
  origin: GatewayOrigin,
  degraded: boolean
): Response {
  const headers = new Headers(response.headers);
  headers.set("x-agendaai-origin", origin);
  headers.set("x-agendaai-degraded", String(degraded));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function createDegradedWriteBlockedResponse(primaryError?: string): Response {
  return new Response(
    JSON.stringify({
      error: "degraded_mode_write_blocked",
      message:
        "The primary API is unavailable and this write route is blocked on the read-only fallback runtime.",
      primaryError
    }),
    {
      status: 503,
      headers: buildGatewayJsonHeaders("render", true, "gateway-write-blocked")
    }
  );
}

function createGatewayUnavailableResponse(primaryError?: string, secondaryError?: string): Response {
  return new Response(
    JSON.stringify({
      error: "gateway_unavailable",
      message: "Both API runtimes are currently unavailable.",
      primaryError,
      secondaryError
    }),
    {
      status: 503,
      headers: buildGatewayJsonHeaders("vercel", true, "gateway-double-failure")
    }
  );
}

function buildGatewayJsonHeaders(
  origin: GatewayOrigin,
  degraded: boolean,
  detail: string
): Headers {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8"
  });
  headers.set("x-agendaai-origin", origin);
  headers.set("x-agendaai-degraded", String(degraded));
  headers.set("x-agendaai-origin-detail", detail);
  return headers;
}

function toGatewayErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "gateway_request_failed";
}
