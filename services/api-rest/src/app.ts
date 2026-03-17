import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";

import {
  bookingStatusValues,
  clientContactInputSchema,
  configureTenantSlugSchema,
  contractVersion,
  createBookingCommandSchema,
  createProfessionalSchema,
  createServiceSchema,
  createTenantSchema,
  setAvailabilityRulesSchema
} from "@agendaai/contracts";

import {
  ApiRestStore,
  type AdminSessionRecord,
  type BookingPatchInput,
  type ClientPatchInput,
  type ProfessionalPatchInput,
  type ServicePatchInput
} from "./store";

declare module "fastify" {
  interface FastifyRequest {
    adminSession?: AdminSessionRecord;
  }
}

export interface BuildApiRestAppOptions {
  readonly logger?: boolean;
  readonly store?: ApiRestStore;
}

class ApiHttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function buildApiRestApp(options: BuildApiRestAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? false
  });

  const store = options.store ?? new ApiRestStore();

  app.setErrorHandler((error, _request, reply) => {
    const runtimeError = asErrorLike(error);

    if (isZodLikeError(runtimeError)) {
      reply.status(400).send({
        error: "validation_error",
        message: "Request body failed schema validation.",
        issues: runtimeError.issues
      });
      return;
    }

    if (runtimeError instanceof ApiHttpError) {
      reply.status(runtimeError.statusCode).send({
        error: runtimeError.code,
        message: runtimeError.message
      });
      return;
    }

    if (runtimeError.message === "slug_already_exists") {
      reply.status(409).send({
        error: "slug_already_exists",
        message: "Slug already belongs to another tenant."
      });
      return;
    }

    if (runtimeError.message === "admin_email_already_exists") {
      reply.status(409).send({
        error: "admin_email_already_exists",
        message: "Admin email already belongs to another account."
      });
      return;
    }

    if (
      runtimeError.message === "client_not_found" ||
      runtimeError.message === "service_not_found" ||
      runtimeError.message === "professional_not_found"
    ) {
      reply.status(404).send({
        error: runtimeError.message,
        message: "Referenced tenant resource was not found."
      });
      return;
    }

    if (
      runtimeError.message === "availability_rule_invalid" ||
      runtimeError.message === "booking_time_invalid"
    ) {
      reply.status(400).send({
        error: runtimeError.message,
        message: "Availability or booking payload is invalid."
      });
      return;
    }

    if (
      runtimeError.message === "service_not_available_for_professional" ||
      runtimeError.message === "professional_inactive" ||
      runtimeError.message === "slot_unavailable" ||
      runtimeError.message === "booking_conflict"
    ) {
      reply.status(409).send({
        error: runtimeError.message,
        message: "Requested scheduling operation conflicts with current tenant availability."
      });
      return;
    }

    reply.status(500).send({
      error: "internal_error",
      message: "Unexpected api-rest failure."
    });
  });

  app.get("/health", async () => ({
    serviceName: "@agendaai/api-rest",
    status: "ok",
    contractVersion
  }));

  app.post("/v1/onboarding/tenants", async (request, reply) => {
    const body = requireRecord(request.body);
    const command = createTenantSchema.parse({
      ...body,
      version: contractVersion
    });

    const result = store.createTenant(command);
    reply.status(201);
    return result;
  });

  app.post("/v1/admin/auth/sessions", async (request) => {
    const body = requireRecord(request.body);
    const credentials = parseCredentials(body);
    const session = store.login(credentials.email, credentials.password);

    if (!session) {
      throw new ApiHttpError(401, "invalid_credentials", "Email or password is invalid.");
    }

    return session;
  });

  app.get("/v1/public/tenants/:slug", async (request) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const tenant = store.getPublicTenantProfile(slug);

    if (!tenant) {
      throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
    }

    return tenant;
  });

  app.get("/v1/public/tenants/:slug/catalog", async (request) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const catalog = store.getPublicCatalog(slug);

    if (!catalog) {
      throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
    }

    return catalog;
  });

  app.get("/v1/public/tenants/:slug/services", async (request) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const catalog = store.getPublicCatalog(slug);

    if (!catalog) {
      throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
    }

    return {
      items: catalog.services
    };
  });

  app.get("/v1/public/tenants/:slug/professionals", async (request) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const tenant = store.getTenantBySlug(slug);

    if (!tenant) {
      throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
    }

    const query = (request.query ?? {}) as Record<string, unknown>;
    const serviceId =
      typeof query.serviceId === "string" && query.serviceId.trim().length > 0
        ? query.serviceId.trim()
        : undefined;

    return {
      items: store.listProfessionalsForService(tenant.id, serviceId)
    };
  });

  app.get("/v1/public/tenants/:slug/availability", async (request) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const tenant = store.getTenantBySlug(slug);

    if (!tenant) {
      throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
    }

    const query = (request.query ?? {}) as Record<string, unknown>;
    const professionalId = readRequiredString(query.professionalId, "professionalId");
    const serviceId = readRequiredString(query.serviceId, "serviceId");
    const date = readDateString(query.date, "date");

    return {
      items: store.listAvailableSlots(tenant.id, serviceId, professionalId, date)
    };
  });

  app.register(
    async (adminRoutes) => {
      adminRoutes.addHook("preHandler", async (request, reply) => {
        authenticateAdminRequest(store, request, reply);
      });

      adminRoutes.get("/auth/session", async (request) => {
        const claims = requireAdminSession(request).claims;
        const tenant = store.getTenantById(claims.tenantId);

        if (!tenant) {
          throw new ApiHttpError(404, "tenant_not_found", "Tenant from session was not found.");
        }

        return {
          claims,
          tenant
        };
      });

      adminRoutes.get("/tenant", async (request) => {
        const claims = requireAdminSession(request).claims;
        const tenant = store.getTenantById(claims.tenantId);

        if (!tenant) {
          throw new ApiHttpError(404, "tenant_not_found", "Tenant from session was not found.");
        }

        return tenant;
      });

      adminRoutes.patch("/tenant/slug", async (request) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const command = configureTenantSlugSchema.parse({
          ...body,
          version: contractVersion,
          tenantId: claims.tenantId
        });

        return store.updateTenantSlug(command);
      });

      adminRoutes.post("/services", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const command = createServiceSchema.parse({
          ...body,
          version: contractVersion,
          tenantId: claims.tenantId
        });

        const service = store.createService(command);
        reply.status(201);
        return service;
      });

      adminRoutes.get("/services", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: store.listServices(claims.tenantId)
        };
      });

      adminRoutes.get("/services/:serviceId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const serviceId = readRequiredString(
          (request.params as Record<string, unknown>).serviceId,
          "serviceId"
        );
        const service = store.getService(claims.tenantId, serviceId);

        if (!service) {
          throw new ApiHttpError(404, "service_not_found", "Service was not found for this tenant.");
        }

        return service;
      });

      adminRoutes.patch("/services/:serviceId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const serviceId = readRequiredString(
          (request.params as Record<string, unknown>).serviceId,
          "serviceId"
        );
        const patch = parseServicePatch(requireRecord(request.body));
        const service = store.updateService(claims.tenantId, serviceId, patch);

        if (!service) {
          throw new ApiHttpError(404, "service_not_found", "Service was not found for this tenant.");
        }

        return service;
      });

      adminRoutes.delete("/services/:serviceId", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const serviceId = readRequiredString(
          (request.params as Record<string, unknown>).serviceId,
          "serviceId"
        );
        const deleted = store.deleteService(claims.tenantId, serviceId);

        if (!deleted) {
          throw new ApiHttpError(404, "service_not_found", "Service was not found for this tenant.");
        }

        reply.status(204);
      });

      adminRoutes.post("/professionals", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const command = createProfessionalSchema.parse({
          ...body,
          version: contractVersion,
          tenantId: claims.tenantId
        });

        const professional = store.createProfessional(command);
        reply.status(201);
        return professional;
      });

      adminRoutes.get("/professionals", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: store.listProfessionals(claims.tenantId)
        };
      });

      adminRoutes.get("/professionals/:professionalId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const professionalId = readRequiredString(
          (request.params as Record<string, unknown>).professionalId,
          "professionalId"
        );
        const professional = store.getProfessional(claims.tenantId, professionalId);

        if (!professional) {
          throw new ApiHttpError(
            404,
            "professional_not_found",
            "Professional was not found for this tenant."
          );
        }

        return professional;
      });

      adminRoutes.patch("/professionals/:professionalId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const professionalId = readRequiredString(
          (request.params as Record<string, unknown>).professionalId,
          "professionalId"
        );
        const patch = parseProfessionalPatch(requireRecord(request.body));
        const professional = store.updateProfessional(claims.tenantId, professionalId, patch);

        if (!professional) {
          throw new ApiHttpError(
            404,
            "professional_not_found",
            "Professional was not found for this tenant."
          );
        }

        return professional;
      });

      adminRoutes.delete("/professionals/:professionalId", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const professionalId = readRequiredString(
          (request.params as Record<string, unknown>).professionalId,
          "professionalId"
        );
        const deleted = store.deleteProfessional(claims.tenantId, professionalId);

        if (!deleted) {
          throw new ApiHttpError(
            404,
            "professional_not_found",
            "Professional was not found for this tenant."
          );
        }

        reply.status(204);
      });

      adminRoutes.put("/professionals/:professionalId/availability", async (request) => {
        const claims = requireAdminSession(request).claims;
        const professionalId = readRequiredString(
          (request.params as Record<string, unknown>).professionalId,
          "professionalId"
        );
        const body = requireRecord(request.body);
        const command = setAvailabilityRulesSchema.parse({
          ...body,
          version: contractVersion,
          tenantId: claims.tenantId,
          professionalId
        });

        return {
          items: store.replaceAvailabilityRules(
            claims.tenantId,
            professionalId,
            command.rules
          )
        };
      });

      adminRoutes.get("/professionals/:professionalId/availability", async (request) => {
        const claims = requireAdminSession(request).claims;
        const professionalId = readRequiredString(
          (request.params as Record<string, unknown>).professionalId,
          "professionalId"
        );

        const professional = store.getProfessional(claims.tenantId, professionalId);
        if (!professional) {
          throw new ApiHttpError(
            404,
            "professional_not_found",
            "Professional was not found for this tenant."
          );
        }

        return {
          items: store.listAvailabilityRules(claims.tenantId, professionalId)
        };
      });

      adminRoutes.get("/availability/slots", async (request) => {
        const claims = requireAdminSession(request).claims;
        const query = (request.query ?? {}) as Record<string, unknown>;
        const professionalId = readRequiredString(query.professionalId, "professionalId");
        const serviceId = readRequiredString(query.serviceId, "serviceId");
        const date = readDateString(query.date, "date");

        return {
          items: store.listAvailableSlots(claims.tenantId, serviceId, professionalId, date)
        };
      });

      adminRoutes.post("/clients", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const input = clientContactInputSchema.parse(body);
        const client = store.createClient(claims.tenantId, input);

        reply.status(201);
        return client;
      });

      adminRoutes.get("/clients", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: store.listClients(claims.tenantId)
        };
      });

      adminRoutes.get("/clients/:clientId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const clientId = readRequiredString(
          (request.params as Record<string, unknown>).clientId,
          "clientId"
        );
        const client = store.getClient(claims.tenantId, clientId);

        if (!client) {
          throw new ApiHttpError(404, "client_not_found", "Client was not found for this tenant.");
        }

        return client;
      });

      adminRoutes.patch("/clients/:clientId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const clientId = readRequiredString(
          (request.params as Record<string, unknown>).clientId,
          "clientId"
        );
        const patch = parseClientPatch(requireRecord(request.body));
        const client = store.updateClient(claims.tenantId, clientId, patch);

        if (!client) {
          throw new ApiHttpError(404, "client_not_found", "Client was not found for this tenant.");
        }

        return client;
      });

      adminRoutes.delete("/clients/:clientId", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const clientId = readRequiredString(
          (request.params as Record<string, unknown>).clientId,
          "clientId"
        );
        const deleted = store.deleteClient(claims.tenantId, clientId);

        if (!deleted) {
          throw new ApiHttpError(404, "client_not_found", "Client was not found for this tenant.");
        }

        reply.status(204);
      });

      adminRoutes.post("/bookings", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const command = createBookingCommandSchema.parse({
          ...body,
          version: contractVersion,
          tenantId: claims.tenantId
        });

        const booking = store.createBooking(command);
        reply.status(201);
        return booking;
      });

      adminRoutes.get("/bookings", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: store.listBookings(claims.tenantId)
        };
      });

      adminRoutes.get("/bookings/:bookingId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const bookingId = readRequiredString(
          (request.params as Record<string, unknown>).bookingId,
          "bookingId"
        );
        const booking = store.getBooking(claims.tenantId, bookingId);

        if (!booking) {
          throw new ApiHttpError(404, "booking_not_found", "Booking was not found for this tenant.");
        }

        return booking;
      });

      adminRoutes.patch("/bookings/:bookingId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const bookingId = readRequiredString(
          (request.params as Record<string, unknown>).bookingId,
          "bookingId"
        );
        const patch = parseBookingPatch(requireRecord(request.body));
        const booking = store.updateBooking(claims.tenantId, bookingId, patch);

        if (!booking) {
          throw new ApiHttpError(404, "booking_not_found", "Booking was not found for this tenant.");
        }

        return booking;
      });

      adminRoutes.delete("/bookings/:bookingId", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const bookingId = readRequiredString(
          (request.params as Record<string, unknown>).bookingId,
          "bookingId"
        );
        const deleted = store.deleteBooking(claims.tenantId, bookingId);

        if (!deleted) {
          throw new ApiHttpError(404, "booking_not_found", "Booking was not found for this tenant.");
        }

        reply.status(204);
      });
    },
    { prefix: "/v1/admin" }
  );

  return app;
}

function authenticateAdminRequest(
  store: ApiRestStore,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const authorization = request.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    reply.status(401).send({
      error: "missing_bearer_token",
      message: "Admin routes require a bearer token."
    });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
  const session = store.getSession(token);
  if (!session) {
    reply.status(401).send({
      error: "invalid_session",
      message: "Bearer token does not map to an active admin session."
    });
    return;
  }

  request.adminSession = session;
}

function requireAdminSession(request: FastifyRequest): AdminSessionRecord {
  if (!request.adminSession) {
    throw new ApiHttpError(401, "missing_admin_session", "Admin session was not resolved.");
  }

  return request.adminSession;
}

function parseCredentials(payload: Record<string, unknown>): { email: string; password: string } {
  return {
    email: readRequiredString(payload.email, "email").toLowerCase(),
    password: readRequiredString(payload.password, "password")
  };
}

function parseServicePatch(payload: Record<string, unknown>): ServicePatchInput {
  const patch: ServicePatchInput = {};

  if ("nome" in payload) {
    patch.nome = readRequiredString(payload.nome, "nome");
  }
  if ("duracaoMin" in payload) {
    patch.duracaoMin = readPositiveInteger(payload.duracaoMin, "duracaoMin");
  }
  if ("precoBase" in payload) {
    patch.precoBase = readNonNegativeNumber(payload.precoBase, "precoBase");
  }
  if ("exigeSinal" in payload) {
    patch.exigeSinal = readBoolean(payload.exigeSinal, "exigeSinal");
  }
  if ("status" in payload) {
    patch.status = readRequiredString(payload.status, "status");
  }

  return requireNonEmptyPatch(patch, "service");
}

function parseProfessionalPatch(payload: Record<string, unknown>): ProfessionalPatchInput {
  const patch: ProfessionalPatchInput = {};

  if ("nome" in payload) {
    patch.nome = readRequiredString(payload.nome, "nome");
  }
  if ("status" in payload) {
    patch.status = readRequiredString(payload.status, "status");
  }
  if ("especialidades" in payload) {
    patch.especialidades = readStringArray(payload.especialidades, "especialidades");
  }

  return requireNonEmptyPatch(patch, "professional");
}

function parseClientPatch(payload: Record<string, unknown>): ClientPatchInput {
  const patch: ClientPatchInput = {};

  if ("nome" in payload) {
    patch.nome = readRequiredString(payload.nome, "nome");
  }
  if ("telefone" in payload) {
    patch.telefone = readRequiredString(payload.telefone, "telefone");
  }
  if ("email" in payload) {
    patch.email = readRequiredString(payload.email, "email").toLowerCase();
  }
  if ("origem" in payload) {
    patch.origem = readRequiredString(payload.origem, "origem");
  }

  return requireNonEmptyPatch(patch, "client");
}

function parseBookingPatch(payload: Record<string, unknown>): BookingPatchInput {
  const patch: BookingPatchInput = {};

  if ("clientId" in payload) {
    patch.clientId = readRequiredString(payload.clientId, "clientId");
  }
  if ("serviceId" in payload) {
    patch.serviceId = readRequiredString(payload.serviceId, "serviceId");
  }
  if ("professionalId" in payload) {
    patch.professionalId = readRequiredString(payload.professionalId, "professionalId");
  }
  if ("status" in payload) {
    patch.status = readBookingStatus(payload.status, "status");
  }
  if ("startAt" in payload) {
    patch.startAt = readRequiredString(payload.startAt, "startAt");
  }
  if ("endAt" in payload) {
    patch.endAt = readRequiredString(payload.endAt, "endAt");
  }

  return requireNonEmptyPatch(patch, "booking");
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiHttpError(400, "invalid_body", "Request body must be a JSON object.");
  }

  return value as Record<string, unknown>;
}

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must be a non-empty string.`);
  }

  return value.trim();
}

function readPositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must be a positive integer.`);
  }

  return value;
}

function readNonNegativeNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must be a non-negative number.`);
  }

  return value;
}

function readBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must be a boolean.`);
  }

  return value;
}

function readDateString(value: unknown, fieldName: string): string {
  const candidate = readRequiredString(value, fieldName);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must use YYYY-MM-DD.`);
  }

  return candidate;
}

function readStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must be an array.`);
  }

  return value.map((item, index) => readRequiredString(item, `${fieldName}[${index}]`));
}

function readBookingStatus(
  value: unknown,
  fieldName: string
): BookingPatchInput["status"] {
  const candidate = readRequiredString(value, fieldName);
  if (!bookingStatusValues.includes(candidate as (typeof bookingStatusValues)[number])) {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must be a known booking status.`);
  }

  return candidate as BookingPatchInput["status"];
}

function requireNonEmptyPatch<T extends object>(patch: T, entityName: string): T {
  if (Object.keys(patch).length === 0) {
    throw new ApiHttpError(400, "invalid_body", `${entityName} patch did not provide any supported fields.`);
  }

  return patch;
}

function isZodLikeError(error: unknown): error is { issues: unknown } {
  return Boolean(
    error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name?: string }).name === "ZodError" &&
      "issues" in error
  );
}

function asErrorLike(error: unknown): Error {
  return error instanceof Error ? error : new Error("unknown_error");
}
