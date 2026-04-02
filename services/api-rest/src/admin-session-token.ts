import { createHmac, timingSafeEqual } from "node:crypto";

import {
  adminRoles,
  type AdminRole,
  type AdminSessionClaimsContract
} from "@agendaai/contracts";

const JWT_HEADER = {
  alg: "HS256",
  typ: "JWT"
} as const;
const DEFAULT_ADMIN_JWT_ISSUER = "agendaai-admin";
const DEFAULT_ADMIN_JWT_TTL_SECONDS = 60 * 60 * 12;
const DEVELOPMENT_ADMIN_JWT_SECRET = "agendaai-local-admin-secret";

interface AdminSessionTokenPayload extends AdminSessionClaimsContract {
  readonly iss: string;
  readonly iat: number;
  readonly exp: number;
}

export class AdminSessionTokenError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function resolveAdminJwtSecret(secret = process.env.ADMIN_JWT_SECRET): string {
  if (typeof secret === "string" && secret.trim().length > 0) {
    return secret.trim();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("admin_jwt_secret_missing");
  }

  return DEVELOPMENT_ADMIN_JWT_SECRET;
}

export function signAdminSessionToken(
  claims: AdminSessionClaimsContract,
  secret: string,
  options: {
    readonly issuer?: string;
    readonly expiresInSeconds?: number;
  } = {}
): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: AdminSessionTokenPayload = {
    ...claims,
    iss: options.issuer ?? DEFAULT_ADMIN_JWT_ISSUER,
    iat: issuedAt,
    exp: issuedAt + (options.expiresInSeconds ?? DEFAULT_ADMIN_JWT_TTL_SECONDS)
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(JWT_HEADER));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = createSignature(`${encodedHeader}.${encodedPayload}`, secret);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string,
  secret: string,
  options: {
    readonly issuer?: string;
    readonly now?: number;
  } = {}
): AdminSessionClaimsContract {
  const [encodedHeader, encodedPayload, encodedSignature, ...extraParts] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature || extraParts.length > 0) {
    throw new AdminSessionTokenError("invalid_token", "Bearer token must use JWT compact format.");
  }

  const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`, secret);
  if (!signaturesMatch(encodedSignature, expectedSignature)) {
    throw new AdminSessionTokenError("invalid_signature", "Bearer token signature is invalid.");
  }

  const header = parseJsonRecord(encodedHeader, "invalid_token_header");
  if (header.alg !== JWT_HEADER.alg || header.typ !== JWT_HEADER.typ) {
    throw new AdminSessionTokenError("invalid_token_header", "Bearer token header is invalid.");
  }

  const payload = parseJsonRecord(encodedPayload, "invalid_token_payload");
  const issuer = options.issuer ?? DEFAULT_ADMIN_JWT_ISSUER;
  const now = options.now ?? Math.floor(Date.now() / 1000);

  if (payload.iss !== issuer) {
    throw new AdminSessionTokenError("invalid_issuer", "Bearer token issuer is invalid.");
  }

  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= now) {
    throw new AdminSessionTokenError("expired_token", "Bearer token has expired.");
  }

  if (typeof payload.iat !== "number" || !Number.isFinite(payload.iat) || payload.iat > now + 60) {
    throw new AdminSessionTokenError("invalid_token_payload", "Bearer token issued-at timestamp is invalid.");
  }

  return {
    actor: readActor(payload.actor),
    sub: readRequiredString(payload.sub, "sub"),
    tenantId: readRequiredString(payload.tenantId, "tenantId"),
    role: readRole(payload.role)
  };
}

function createSignature(input: string, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

function signaturesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parseJsonRecord(value: string, errorCode: string): Record<string, unknown> {
  try {
    const decoded = decodeBase64Url(value);
    const parsed = JSON.parse(decoded) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid_json_record");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new AdminSessionTokenError(errorCode, "Bearer token is not valid JSON.");
  }
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function readActor(value: unknown): "admin_user" {
  if (value !== "admin_user") {
    throw new AdminSessionTokenError("invalid_actor", "Bearer token actor is invalid.");
  }
  return "admin_user";
}

function readRole(value: unknown): AdminRole {
  if (typeof value !== "string" || !adminRoles.includes(value as AdminRole)) {
    throw new AdminSessionTokenError("invalid_role", "Bearer token role is invalid.");
  }
  return value as AdminRole;
}

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AdminSessionTokenError(
      "invalid_token_payload",
      `Bearer token field '${fieldName}' must be a non-empty string.`
    );
  }

  return value.trim();
}
