import { randomUUID } from "node:crypto";

import cors from "@fastify/cors";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";

import {
  bankMovementTypeValues,
  bookingStatusValues,
  createBankBalanceSchema,
  createBankMovementSchema,
  createBankPaymentSchema,
  createBankReceiptSchema,
  createBankSchema,
  createBankTransferSchema,
  createCashCloseSchema,
  createExpenseScheduleSchema,
  createRevenueScheduleSchema,
  clientContactInputSchema,
  configureTenantBrandingSchema,
  configureTenantSlugSchema,
  contractVersion,
  createBookingCommandSchema,
  expenseScheduleStatusValues,
  financialRangeValues,
  financialSituationValues,
  createProfessionalSchema,
  reportDefinitionSchema,
  reportExecutionRequestSchema,
  revenueScheduleStatusValues,
  reverseBankMovementSchema,
  createServiceSchema,
  createTenantSchema,
  paymentWebhookNotificationSchema,
  publicCreateBookingInputSchema,
  reportingRangeValues,
  reportingReturnWindowValues,
  servicePaymentPolicySchema,
  serviceStatusValues,
  setAvailabilityRulesSchema,
  tenantPaymentSettingsSchema,
  professionalStatusValues,
  type Booking,
  type BankMovementType,
  type FinancialRange,
  type FinancialSituation,
  type CashEntry,
  type CashEntryKind,
  type Client,
  type PaymentIntent,
  type Professional,
  type ReportDefinition,
  type ReportingRange,
  type ReportingReturnWindow,
  type Service,
  type TenantPaymentSettings
} from "@agendaai/contracts";

import {
  type AdminSessionRecord,
  type ApiRestStorePort,
  type BookingPatchInput,
  type ClientPatchInput,
  type ProfessionalPatchInput,
  type ServicePatchInput
} from "./store";
import {
  AdminSessionTokenError,
  resolveAdminJwtSecret,
  signAdminSessionToken,
  verifyAdminSessionToken
} from "./admin-session-token";
import {
  createMercadoPagoGateway,
  MercadoPagoApiError,
  type MercadoPagoGateway
} from "./mercado-pago";
import { createConfiguredStore } from "./postgres-store";
import { buildAdminFinancialReadModel } from "./financial-read-model";
import {
  buildSystemReportDefinitions,
  createReportBuilderCatalog,
  executeReportDefinition
} from "./report-builder";
import { buildAdminReportsReadModel } from "./reporting-read-model";

declare module "fastify" {
  interface FastifyRequest {
    adminSession?: AdminSessionRecord;
  }
}

export interface BuildApiRestAppOptions {
  readonly logger?: boolean;
  readonly store?: ApiRestStorePort;
  readonly mercadoPagoGateway?: MercadoPagoGateway;
  readonly adminJwtSecret?: string;
  readonly readOnlyMode?: boolean;
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

  void app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization"]
  });

  const store = options.store ?? createConfiguredStore();
  const mercadoPagoGateway = options.mercadoPagoGateway ?? createMercadoPagoGateway();
  const adminJwtSecret = resolveAdminJwtSecret(options.adminJwtSecret);
  const readOnlyMode = options.readOnlyMode ?? parseBooleanEnv(process.env.READ_ONLY_MODE);

  app.addHook("preHandler", async (request, reply) => {
    if (!readOnlyMode || isReadOnlyAllowedRequest(request)) {
      return;
    }

    reply.status(503).send({
      error: "degraded_mode_write_blocked",
      message: "This runtime is in degraded read-only mode. Retry this write against the primary API."
    });
  });

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

    if (runtimeError instanceof AdminSessionTokenError) {
      reply.status(401).send({
        error: runtimeError.code,
        message: runtimeError.message
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

    if (runtimeError instanceof MercadoPagoApiError) {
      reply.status(502).send({
        error: "mercado_pago_error",
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
      runtimeError.message === "professional_not_found" ||
      runtimeError.message === "bank_not_found" ||
      runtimeError.message === "revenue_not_found" ||
      runtimeError.message === "expense_not_found" ||
      runtimeError.message === "cash_entry_not_found" ||
      runtimeError.message === "bank_movement_not_found"
    ) {
      reply.status(404).send({
        error: runtimeError.message,
        message: "Referenced tenant resource was not found."
      });
      return;
    }

    if (
      runtimeError.message === "availability_rule_invalid" ||
      runtimeError.message === "booking_time_invalid" ||
      runtimeError.message === "booking_time_in_past" ||
      runtimeError.message === "bank_destination_required" ||
      runtimeError.message === "bank_origin_required" ||
      runtimeError.message === "distinct_banks_required" ||
      runtimeError.message === "bank_transfer_invalid" ||
      runtimeError.message === "bank_reversal_invalid" ||
      runtimeError.message === "bank_movement_already_reversed" ||
      runtimeError.message === "cash_close_item_not_available"
    ) {
      reply.status(400).send({
        error: runtimeError.message,
        message: "Availability or booking payload is invalid."
      });
      return;
    }

    if (runtimeError.message === "bank_account_already_exists") {
      reply.status(409).send({
        error: "bank_account_already_exists",
        message: "Bank account already exists for this tenant."
      });
      return;
    }

    if (
      runtimeError.message === "bank_in_use" ||
      runtimeError.message === "bank_balance_in_use" ||
      runtimeError.message === "schedule_in_use"
    ) {
      reply.status(409).send({
        error: runtimeError.message,
        message: "The selected financial record is already linked to operational movements."
      });
      return;
    }

    if (runtimeError.message === "payment_required") {
      reply.status(409).send({
        error: "payment_required",
        message: "This service requires deposit payment before online confirmation."
      });
      return;
    }

    if (runtimeError.message === "payment_not_required") {
      reply.status(409).send({
        error: "payment_not_required",
        message: "This service does not require online payment before confirmation."
      });
      return;
    }

    if (runtimeError.message === "payment_settings_inactive") {
      reply.status(409).send({
        error: "payment_settings_inactive",
        message: "Payment settings are not active for this tenant."
      });
      return;
    }

    if (runtimeError.message === "payment_checkout_mode_not_supported") {
      reply.status(409).send({
        error: "payment_checkout_mode_not_supported",
        message: "This checkout mode is not available in the current public booking flow."
      });
      return;
    }

    if (runtimeError.message === "payment_intent_not_found") {
      reply.status(404).send({
        error: "payment_intent_not_found",
        message: "Payment intent was not found for this tenant."
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

  app.get("/ready", async (_request, reply) => {
    const readiness = await store.checkReadiness();
    if (!readiness.ready) {
      reply.status(503);
    }

    return {
      serviceName: "@agendaai/api-rest",
      status: readiness.ready ? "ready" : "not_ready",
      contractVersion,
      storage: readiness.storage,
      reason: readiness.reason
    };
  });

  app.post("/v1/onboarding/tenants", async (request, reply) => {
    const body = requireRecord(request.body);
    const command = createTenantSchema.parse({
      ...body,
      version: contractVersion
    });

    const result = await store.createTenant(command);
    reply.status(201);
    return {
      ...result,
      session: issueAdminSession(result.session, adminJwtSecret)
    };
  });

  app.post("/v1/admin/auth/sessions", async (request) => {
    const body = requireRecord(request.body);
    const credentials = parseCredentials(body);
    const session = await store.login(credentials.email, credentials.password);

    if (!session) {
      throw new ApiHttpError(401, "invalid_credentials", "Email or password is invalid.");
    }

    return issueAdminSession(session, adminJwtSecret);
  });

  app.get("/v1/public/tenants/:slug", async (request) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const tenant = await store.getPublicTenantProfile(slug);

    if (!tenant) {
      throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
    }

    return tenant;
  });

  app.get("/v1/public/tenants/:slug/catalog", async (request) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const catalog = await store.getPublicCatalog(slug);

    if (!catalog) {
      throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
    }

    return catalog;
  });

  app.get("/v1/public/tenants/:slug/services", async (request) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const catalog = await store.getPublicCatalog(slug);

    if (!catalog) {
      throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
    }

    return {
      items: catalog.services
    };
  });

  app.get("/v1/public/tenants/:slug/professionals", async (request) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const tenant = await store.getTenantBySlug(slug);

    if (!tenant) {
      throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
    }

    const query = (request.query ?? {}) as Record<string, unknown>;
    const serviceId =
      typeof query.serviceId === "string" && query.serviceId.trim().length > 0
        ? query.serviceId.trim()
        : undefined;

    return {
      items: await store.listProfessionalsForService(tenant.id, serviceId)
    };
  });

  app.get("/v1/public/tenants/:slug/availability", async (request) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const tenant = await store.getTenantBySlug(slug);

    if (!tenant) {
      throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
    }

    const query = (request.query ?? {}) as Record<string, unknown>;
    const professionalId = readRequiredString(query.professionalId, "professionalId");
    const serviceId = readRequiredString(query.serviceId, "serviceId");
    const date = readDateString(query.date, "date");

    return {
      items: await store.listAvailableSlots(tenant.id, serviceId, professionalId, date)
    };
  });

  app.post("/v1/public/tenants/:slug/bookings", async (request, reply) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const body = requireRecord(request.body);
    const command = publicCreateBookingInputSchema.parse({
      ...body,
      version: contractVersion,
      slug
    });

    const result = await store.createPublicBooking(command);
    await syncCashEntriesForBooking(store, result.booking.tenantId, result.booking.id);
    reply.status(201);
    return result;
  });

  app.post("/v1/public/tenants/:slug/payment-intents", async (request, reply) => {
    const slug = readRequiredString((request.params as Record<string, unknown>).slug, "slug");
    const body = requireRecord(request.body);
    const command = publicCreateBookingInputSchema.parse({
      ...body,
      version: contractVersion,
      slug
    });

    const bookingContext = await store.createPublicPaymentBooking(command);
    const paymentSettings = await store.getPaymentSettings(bookingContext.booking.tenantId);
    assertActivePaymentSettings(paymentSettings);

    const checkoutMode =
      bookingContext.service.paymentPolicy.checkoutMode ?? paymentSettings.checkoutMode;
    if (checkoutMode !== "checkout_pro") {
      await store.updateBooking(bookingContext.booking.tenantId, bookingContext.booking.id, {
        status: "cancelado"
      });
      throw new Error("payment_checkout_mode_not_supported");
    }

    const paymentIntentId = randomUUID();
    const externalReference = buildExternalReference(
      bookingContext.booking.tenantId,
      bookingContext.booking.id,
      paymentIntentId
    );
    const amount = resolvePaymentAmount(bookingContext.service);
    const notificationUrl = appendQueryParams(paymentSettings.notificationUrl as string, {
      tenantId: bookingContext.booking.tenantId,
      slug,
      paymentIntentId
    });
    const backUrls = buildCheckoutBackUrls(paymentSettings, {
      slug,
      bookingId: bookingContext.booking.id,
      paymentIntentId
    });

    try {
      const preference = await mercadoPagoGateway.createPreference({
        accessToken: paymentSettings.accessToken as string,
        payload: buildCheckoutPreferencePayload({
          slug,
          paymentIntentId,
          bookingContext,
          paymentSettings,
          notificationUrl,
          backUrls,
          externalReference,
          amount
        })
      });

      const paymentIntent = await store.recordPaymentIntent({
        version: contractVersion,
        id: paymentIntentId,
        tenantId: bookingContext.booking.tenantId,
        bookingId: bookingContext.booking.id,
        provider: "mercado_pago",
        checkoutMode,
        amount,
        currencyId: bookingContext.service.paymentPolicy.currencyId,
        externalReference,
        description: `${bookingContext.service.nome} - ${bookingContext.tenant.nome}`,
        capture: bookingContext.service.paymentPolicy.capture,
        notificationUrl,
        installments:
          bookingContext.service.paymentPolicy.maxInstallments ??
          paymentSettings.defaultInstallments,
        payer: buildPayer(bookingContext.client.nome, bookingContext.client.email),
        metadata: {
          tenantId: bookingContext.booking.tenantId,
          slug,
          bookingId: bookingContext.booking.id,
          serviceId: bookingContext.service.id,
          professionalId: bookingContext.professional.id,
          clientId: bookingContext.client.id
        },
        status: "pending",
        preferenceId: preference.id,
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint
      });

      reply.status(201);
      return {
        ...bookingContext,
        paymentIntent
      };
    } catch (error) {
      await store.updateBooking(bookingContext.booking.tenantId, bookingContext.booking.id, {
        status: "cancelado"
      });
      throw error;
    }
  });

  app.get("/v1/public/tenants/:slug/payment-intents/:paymentIntentId", async (request) => {
    const params = request.params as Record<string, unknown>;
    const slug = readRequiredString(params.slug, "slug");
    const paymentIntentId = readRequiredString(params.paymentIntentId, "paymentIntentId");
    return await readPublicPaymentIntentState(store, slug, paymentIntentId);
  });

  app.post(
    "/v1/public/tenants/:slug/payment-intents/:paymentIntentId/sync",
    async (request) => {
      const params = request.params as Record<string, unknown>;
      const slug = readRequiredString(params.slug, "slug");
      const paymentIntentId = readRequiredString(params.paymentIntentId, "paymentIntentId");
      const body = request.body ? requireRecord(request.body) : {};
      const paymentId =
        "paymentId" in body ? readRequiredString(body.paymentId, "paymentId") : undefined;

      return await syncPublicPaymentIntent(store, mercadoPagoGateway, slug, paymentIntentId, paymentId);
    }
  );

  app.post("/v1/webhooks/mercado-pago", async (request) => {
    const body = request.body ? requireRecord(request.body) : {};
    const notification = paymentWebhookNotificationSchema.parse(body);
    if (notification.type !== "payment") {
      return {
        acknowledged: true
      };
    }

    const query = (request.query ?? {}) as Record<string, unknown>;
    const tenantId = readRequiredString(query.tenantId, "tenantId");
    const paymentIntentId = readRequiredString(query.paymentIntentId, "paymentIntentId");
    const paymentSettings = await store.getPaymentSettings(tenantId);
    assertActivePaymentSettings(paymentSettings);

    const payment = await mercadoPagoGateway.getPayment(
      paymentSettings.accessToken as string,
      notification.data.id
    );

    return await reconcilePaymentState(store, tenantId, paymentIntentId, payment);
  });

  app.register(
    async (adminRoutes) => {
      adminRoutes.addHook("preHandler", async (request, reply) => {
        await authenticateAdminRequest(request, reply, adminJwtSecret);
      });

      adminRoutes.get("/auth/session", async (request) => {
        const claims = requireAdminSession(request).claims;
        const tenant = await store.getTenantById(claims.tenantId);

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
        const tenant = await store.getTenantById(claims.tenantId);

        if (!tenant) {
          throw new ApiHttpError(404, "tenant_not_found", "Tenant from session was not found.");
        }

        return tenant;
      });

      adminRoutes.get("/payment-settings", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          item: await store.getPaymentSettings(claims.tenantId)
        };
      });

      adminRoutes.put("/payment-settings", async (request) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const command = createTenantPaymentSettings(body, claims.tenantId);
        return await store.upsertPaymentSettings(command);
      });

      adminRoutes.patch("/tenant/slug", async (request) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const command = configureTenantSlugSchema.parse({
          ...body,
          version: contractVersion,
          tenantId: claims.tenantId
        });

        return await store.updateTenantSlug(command);
      });

      adminRoutes.patch("/tenant/branding", async (request) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const command = configureTenantBrandingSchema.parse({
          ...body,
          version: contractVersion,
          tenantId: claims.tenantId
        });

        return await store.updateTenantBranding(command);
      });

      adminRoutes.post("/services", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const command = createServiceSchema.parse({
          ...body,
          version: contractVersion,
          tenantId: claims.tenantId
        });

        const service = await store.createService(command);
        reply.status(201);
        return service;
      });

      adminRoutes.get("/services", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listServices(claims.tenantId)
        };
      });

      adminRoutes.get("/services/:serviceId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const serviceId = readRequiredString(
          (request.params as Record<string, unknown>).serviceId,
          "serviceId"
        );
        const service = await store.getService(claims.tenantId, serviceId);

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
        const service = await store.updateService(claims.tenantId, serviceId, patch);

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
        const deleted = await store.deleteService(claims.tenantId, serviceId);

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

        const professional = await store.createProfessional(command);
        reply.status(201);
        return professional;
      });

      adminRoutes.get("/professionals", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listProfessionals(claims.tenantId)
        };
      });

      adminRoutes.get("/professionals/:professionalId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const professionalId = readRequiredString(
          (request.params as Record<string, unknown>).professionalId,
          "professionalId"
        );
        const professional = await store.getProfessional(claims.tenantId, professionalId);

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
        const professional = await store.updateProfessional(claims.tenantId, professionalId, patch);

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
        const deleted = await store.deleteProfessional(claims.tenantId, professionalId);

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
          items: await store.replaceAvailabilityRules(
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

        const professional = await store.getProfessional(claims.tenantId, professionalId);
        if (!professional) {
          throw new ApiHttpError(
            404,
            "professional_not_found",
            "Professional was not found for this tenant."
          );
        }

        return {
          items: await store.listAvailabilityRules(claims.tenantId, professionalId)
        };
      });

      adminRoutes.get("/availability/slots", async (request) => {
        const claims = requireAdminSession(request).claims;
        const query = (request.query ?? {}) as Record<string, unknown>;
        const professionalId = readRequiredString(query.professionalId, "professionalId");
        const serviceId = readRequiredString(query.serviceId, "serviceId");
        const date = readDateString(query.date, "date");

        return {
          items: await store.listAvailableSlots(claims.tenantId, serviceId, professionalId, date)
        };
      });

      adminRoutes.post("/clients", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const input = clientContactInputSchema.parse(body);
        const client = await store.createClient(claims.tenantId, input);

        reply.status(201);
        return client;
      });

      adminRoutes.get("/clients", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listClients(claims.tenantId)
        };
      });

      adminRoutes.get("/clients/:clientId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const clientId = readRequiredString(
          (request.params as Record<string, unknown>).clientId,
          "clientId"
        );
        const client = await store.getClient(claims.tenantId, clientId);

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
        const client = await store.updateClient(claims.tenantId, clientId, patch);

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
        const deleted = await store.deleteClient(claims.tenantId, clientId);

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

        const booking = await store.createBooking(command);
        await syncCashEntriesForBooking(store, claims.tenantId, booking.id);
        reply.status(201);
        return booking;
      });

      adminRoutes.get("/bookings", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listBookings(claims.tenantId)
        };
      });

      adminRoutes.get("/payment-intents", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listPaymentIntents(claims.tenantId)
        };
      });

      adminRoutes.get("/cash-entries", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listCashEntries(claims.tenantId)
        };
      });

      adminRoutes.post("/banks", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const command = createBankSchema.parse({
          ...requireRecord(request.body),
          version: contractVersion,
          tenantId: claims.tenantId
        });
        const bank = await store.createBank(command);
        reply.status(201);
        return bank;
      });

      adminRoutes.get("/banks", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listBanks(claims.tenantId)
        };
      });

      adminRoutes.patch("/banks/:bankId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const bankId = readRequiredString((request.params as Record<string, unknown>).bankId, "bankId");
        const bank = await store.updateBank(claims.tenantId, bankId, parseBankPatch(requireRecord(request.body)));
        if (!bank) {
          throw new ApiHttpError(404, "bank_not_found", "Bank was not found for this tenant.");
        }
        return bank;
      });

      adminRoutes.delete("/banks/:bankId", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const bankId = readRequiredString((request.params as Record<string, unknown>).bankId, "bankId");
        const deleted = await store.deleteBank(claims.tenantId, bankId);
        if (!deleted) {
          throw new ApiHttpError(404, "bank_not_found", "Bank was not found for this tenant.");
        }
        reply.status(204);
      });

      adminRoutes.post("/bank-balances", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const command = createBankBalanceSchema.parse({
          ...requireRecord(request.body),
          version: contractVersion,
          tenantId: claims.tenantId
        });
        const balance = await store.createBankBalance(command);
        reply.status(201);
        return balance;
      });

      adminRoutes.get("/bank-balances", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listBankBalances(claims.tenantId)
        };
      });

      adminRoutes.patch("/bank-balances/:balanceId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const balanceId = readRequiredString(
          (request.params as Record<string, unknown>).balanceId,
          "balanceId"
        );
        const balance = await store.updateBankBalance(
          claims.tenantId,
          balanceId,
          parseBankBalancePatch(requireRecord(request.body))
        );
        if (!balance) {
          throw new ApiHttpError(404, "bank_not_found", "Bank balance was not found for this tenant.");
        }
        return balance;
      });

      adminRoutes.delete("/bank-balances/:balanceId", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const balanceId = readRequiredString(
          (request.params as Record<string, unknown>).balanceId,
          "balanceId"
        );
        const deleted = await store.deleteBankBalance(claims.tenantId, balanceId);
        if (!deleted) {
          throw new ApiHttpError(404, "bank_not_found", "Bank balance was not found for this tenant.");
        }
        reply.status(204);
      });

      adminRoutes.post("/revenues", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const command = createRevenueScheduleSchema.parse({
          ...requireRecord(request.body),
          version: contractVersion,
          tenantId: claims.tenantId
        });
        const items = await store.createRevenueSchedule(command);
        reply.status(201);
        return { items };
      });

      adminRoutes.get("/revenues", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listRevenueSchedules(claims.tenantId)
        };
      });

      adminRoutes.patch("/revenues/:revenueId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const revenueId = readRequiredString(
          (request.params as Record<string, unknown>).revenueId,
          "revenueId"
        );
        const revenue = await store.updateRevenueSchedule(
          claims.tenantId,
          revenueId,
          parseRevenuePatch(requireRecord(request.body))
        );
        if (!revenue) {
          throw new ApiHttpError(404, "revenue_not_found", "Revenue was not found for this tenant.");
        }
        return revenue;
      });

      adminRoutes.delete("/revenues/:revenueId", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const revenueId = readRequiredString(
          (request.params as Record<string, unknown>).revenueId,
          "revenueId"
        );
        const deleted = await store.deleteRevenueSchedule(claims.tenantId, revenueId);
        if (!deleted) {
          throw new ApiHttpError(404, "revenue_not_found", "Revenue was not found for this tenant.");
        }
        reply.status(204);
      });

      adminRoutes.post("/expenses", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const command = createExpenseScheduleSchema.parse({
          ...requireRecord(request.body),
          version: contractVersion,
          tenantId: claims.tenantId
        });
        const items = await store.createExpenseSchedule(command);
        reply.status(201);
        return { items };
      });

      adminRoutes.get("/expenses", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listExpenseSchedules(claims.tenantId)
        };
      });

      adminRoutes.patch("/expenses/:expenseId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const expenseId = readRequiredString(
          (request.params as Record<string, unknown>).expenseId,
          "expenseId"
        );
        const expense = await store.updateExpenseSchedule(
          claims.tenantId,
          expenseId,
          parseExpensePatch(requireRecord(request.body))
        );
        if (!expense) {
          throw new ApiHttpError(404, "expense_not_found", "Expense was not found for this tenant.");
        }
        return expense;
      });

      adminRoutes.delete("/expenses/:expenseId", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const expenseId = readRequiredString(
          (request.params as Record<string, unknown>).expenseId,
          "expenseId"
        );
        const deleted = await store.deleteExpenseSchedule(claims.tenantId, expenseId);
        if (!deleted) {
          throw new ApiHttpError(404, "expense_not_found", "Expense was not found for this tenant.");
        }
        reply.status(204);
      });

      adminRoutes.get("/bank-movements", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listBankMovements(claims.tenantId)
        };
      });

      adminRoutes.post("/bank-movements", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const command = createBankMovementSchema.parse({
          ...requireRecord(request.body),
          version: contractVersion,
          tenantId: claims.tenantId
        });
        const movement = await store.createBankMovement(command);
        reply.status(201);
        return movement;
      });

      adminRoutes.patch("/bank-movements/:movementId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const movementId = readRequiredString(
          (request.params as Record<string, unknown>).movementId,
          "movementId"
        );
        const movement = await store.updateBankMovement(
          claims.tenantId,
          movementId,
          parseBankMovementPatch(requireRecord(request.body))
        );
        if (!movement) {
          throw new ApiHttpError(404, "bank_movement_not_found", "Bank movement was not found for this tenant.");
        }
        return movement;
      });

      adminRoutes.post("/bank-movements/receive", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const command = createBankReceiptSchema.parse({
          ...requireRecord(request.body),
          version: contractVersion,
          tenantId: claims.tenantId
        });
        const movement = await store.receiveRevenue(command);
        reply.status(201);
        return movement;
      });

      adminRoutes.post("/bank-movements/pay", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const command = createBankPaymentSchema.parse({
          ...requireRecord(request.body),
          version: contractVersion,
          tenantId: claims.tenantId
        });
        const movement = await store.payExpense(command);
        reply.status(201);
        return movement;
      });

      adminRoutes.post("/bank-movements/transfer", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const command = createBankTransferSchema.parse({
          ...requireRecord(request.body),
          version: contractVersion,
          tenantId: claims.tenantId
        });
        const movement = await store.transferBetweenBanks(command);
        reply.status(201);
        return movement;
      });

      adminRoutes.post("/bank-movements/:movementId/reverse", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const movementId = readRequiredString(
          (request.params as Record<string, unknown>).movementId,
          "movementId"
        );
        const body = requireRecord(request.body);
        const command = reverseBankMovementSchema.parse({
          ...body,
          version: contractVersion,
          tenantId: claims.tenantId,
          movementId
        });
        const movement = await store.reverseBankMovement(command);
        reply.status(201);
        return movement;
      });

      adminRoutes.get("/cash-closes", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listCashCloses(claims.tenantId)
        };
      });

      adminRoutes.get("/cash-closes/preview", async (request) => {
        const claims = requireAdminSession(request).claims;
        const query = (request.query ?? {}) as Record<string, unknown>;
        const bankId = readRequiredString(query.bankId, "bankId");
        const dateFrom = readRequiredString(query.dateFrom, "dateFrom");
        const dateTo = readRequiredString(query.dateTo, "dateTo");

        return await store.previewCashClose(claims.tenantId, bankId, dateFrom, dateTo);
      });

      adminRoutes.get("/cash-closes/:cashCloseId/items", async (request) => {
        const claims = requireAdminSession(request).claims;
        const cashCloseId = readRequiredString(
          (request.params as Record<string, unknown>).cashCloseId,
          "cashCloseId"
        );
        return {
          items: await store.listCashCloseItems(claims.tenantId, cashCloseId)
        };
      });

      adminRoutes.post("/cash-closes", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const command = createCashCloseSchema.parse({
          ...requireRecord(request.body),
          version: contractVersion,
          tenantId: claims.tenantId
        });
        const result = await store.createCashClose(command);
        reply.status(201);
        return result;
      });

      adminRoutes.get("/read-models/financial", async (request) => {
        const claims = requireAdminSession(request).claims;
        const query = (request.query ?? {}) as Record<string, unknown>;
        const range = readStringEnum(query.range ?? "30d", financialRangeValues, "range") as FinancialRange;
        const situation = readStringEnum(
          query.situation ?? "all",
          financialSituationValues,
          "situation"
        ) as FinancialSituation;
        const bankId =
          typeof query.bankId === "string" && query.bankId.trim().length > 0 ? query.bankId.trim() : undefined;

        return buildAdminFinancialReadModel({
          range,
          bankId,
          situation,
          banks: await store.listBanks(claims.tenantId),
          balances: await store.listBankBalances(claims.tenantId),
          revenues: await store.listRevenueSchedules(claims.tenantId),
          expenses: await store.listExpenseSchedules(claims.tenantId),
          movements: await store.listBankMovements(claims.tenantId),
          cashEntries: await store.listCashEntries(claims.tenantId)
        });
      });

      adminRoutes.get("/reporting/catalog", async (request) => {
        const claims = requireAdminSession(request).claims;
        return createReportBuilderCatalog({
          tenantId: claims.tenantId
        });
      });

      adminRoutes.get("/report-definitions", async (request) => {
        const claims = requireAdminSession(request).claims;
        return {
          items: await store.listReportDefinitions(claims.tenantId)
        };
      });

      adminRoutes.post("/report-definitions", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const body = requireRecord(request.body);
        const payload = reportDefinitionSchema.parse({
          ...body,
          version: contractVersion,
          id: randomUUID(),
          tenantId: claims.tenantId,
          source: "saved",
          code: buildNextReportDefinitionCode(await store.listReportDefinitions(claims.tenantId)),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          locked: false
        });

        const saved = await store.saveReportDefinition(payload);
        reply.status(201);
        return saved;
      });

      adminRoutes.patch("/report-definitions/:definitionId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const definitionId = readRequiredString(
          (request.params as Record<string, unknown>).definitionId,
          "definitionId"
        );
        const existing = await store.getReportDefinition(claims.tenantId, definitionId);

        if (!existing) {
          throw new ApiHttpError(404, "report_definition_not_found", "Report definition was not found for this tenant.");
        }

        const body = requireRecord(request.body);
        const payload = reportDefinitionSchema.parse({
          ...existing,
          ...body,
          version: contractVersion,
          id: existing.id,
          tenantId: claims.tenantId,
          source: "saved",
          code: existing.code,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
          locked: false
        });

        return await store.saveReportDefinition(payload);
      });

      adminRoutes.delete("/report-definitions/:definitionId", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const definitionId = readRequiredString(
          (request.params as Record<string, unknown>).definitionId,
          "definitionId"
        );
        const deleted = await store.deleteReportDefinition(claims.tenantId, definitionId);
        if (!deleted) {
          throw new ApiHttpError(404, "report_definition_not_found", "Report definition was not found for this tenant.");
        }

        reply.status(204);
      });

      adminRoutes.post("/report-definitions/:definitionId/execute", async (request) => {
        const claims = requireAdminSession(request).claims;
        const definitionId = readRequiredString(
          (request.params as Record<string, unknown>).definitionId,
          "definitionId"
        );
        const savedDefinition = await store.getReportDefinition(claims.tenantId, definitionId);
        const definition =
          savedDefinition ??
          buildSystemReportDefinitions(claims.tenantId).find((entry) => entry.id === definitionId);

        if (!definition) {
          throw new ApiHttpError(404, "report_definition_not_found", "Report definition was not found for this tenant.");
        }

        return await executeDefinitionAgainstStore(store, claims.tenantId, definition);
      });

      adminRoutes.post("/reporting/execute", async (request) => {
        const claims = requireAdminSession(request).claims;
        const payload = reportExecutionRequestSchema.parse({
          ...requireRecord(request.body),
          version: contractVersion
        });
        const definition = {
          ...payload.definition,
          tenantId: claims.tenantId
        };

        return await executeDefinitionAgainstStore(store, claims.tenantId, definition);
      });

      adminRoutes.get("/read-models/reports", async (request) => {
        const claims = requireAdminSession(request).claims;
        const query = (request.query ?? {}) as Record<string, unknown>;
        const range = readStringEnum(
          query.range ?? "30d",
          reportingRangeValues,
          "range"
        ) as ReportingRange;
        const returnWindow = readStringEnum(
          query.returnWindow ?? "30d",
          reportingReturnWindowValues,
          "returnWindow"
        ) as ReportingReturnWindow;
        const serviceId =
          typeof query.serviceId === "string" && query.serviceId.trim().length > 0
            ? query.serviceId.trim()
            : undefined;
        const professionalId =
          typeof query.professionalId === "string" && query.professionalId.trim().length > 0
            ? query.professionalId.trim()
            : undefined;

        return buildAdminReportsReadModel({
          range,
          serviceId,
          professionalId,
          returnWindow,
          clients: await store.listClients(claims.tenantId),
          bookings: await store.listBookings(claims.tenantId),
          services: await store.listServices(claims.tenantId),
          professionals: await store.listProfessionals(claims.tenantId),
          paymentIntents: await store.listPaymentIntents(claims.tenantId),
          cashEntries: await store.listCashEntries(claims.tenantId)
        });
      });

      adminRoutes.get("/bookings/:bookingId", async (request) => {
        const claims = requireAdminSession(request).claims;
        const bookingId = readRequiredString(
          (request.params as Record<string, unknown>).bookingId,
          "bookingId"
        );
        const booking = await store.getBooking(claims.tenantId, bookingId);

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
        const booking = await store.updateBooking(claims.tenantId, bookingId, patch);

        if (!booking) {
          throw new ApiHttpError(404, "booking_not_found", "Booking was not found for this tenant.");
        }

        await syncCashEntriesForBooking(store, claims.tenantId, booking.id);

        return booking;
      });

      adminRoutes.post("/payment-intents/:paymentIntentId/sync", async (request) => {
        const claims = requireAdminSession(request).claims;
        const paymentIntentId = readRequiredString(
          (request.params as Record<string, unknown>).paymentIntentId,
          "paymentIntentId"
        );
        const body = request.body ? requireRecord(request.body) : {};
        const paymentId =
          "paymentId" in body ? readRequiredString(body.paymentId, "paymentId") : undefined;

        return await syncPaymentIntentByTenantId(
          store,
          mercadoPagoGateway,
          claims.tenantId,
          paymentIntentId,
          paymentId
        );
      });

      adminRoutes.delete("/bookings/:bookingId", async (request, reply) => {
        const claims = requireAdminSession(request).claims;
        const bookingId = readRequiredString(
          (request.params as Record<string, unknown>).bookingId,
          "bookingId"
        );
        await reverseCashEntriesForBooking(store, claims.tenantId, bookingId);
        const deleted = await store.deleteBooking(claims.tenantId, bookingId);

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

async function authenticateAdminRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  adminJwtSecret: string
): Promise<void> {
  const authorization = request.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    reply.status(401).send({
      error: "missing_bearer_token",
      message: "Admin routes require a bearer token."
    });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
  try {
    const claims = verifyAdminSessionToken(token, adminJwtSecret);
    request.adminSession = {
      token,
      claims
    };
  } catch (error) {
    const runtimeError = asErrorLike(error);
    reply.status(401).send({
      error:
        runtimeError instanceof AdminSessionTokenError ? runtimeError.code : "invalid_session",
      message: runtimeError.message
    });
  }
}

function requireAdminSession(request: FastifyRequest): AdminSessionRecord {
  if (!request.adminSession) {
    throw new ApiHttpError(401, "missing_admin_session", "Admin session was not resolved.");
  }

  return request.adminSession;
}

function issueAdminSession(session: AdminSessionRecord, adminJwtSecret: string): AdminSessionRecord {
  return {
    token: signAdminSessionToken(session.claims, adminJwtSecret),
    claims: session.claims
  };
}

function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function isReadOnlyAllowedRequest(request: FastifyRequest): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const routePath = readRequestPath(request);
  return method === "POST" && routePath === "/v1/admin/auth/sessions";
}

function readRequestPath(request: FastifyRequest): string {
  const routePath = request.routeOptions.url;
  if (typeof routePath === "string" && routePath.length > 0) {
    return routePath;
  }

  return request.url.split("?")[0] ?? request.url;
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
  if ("paymentPolicy" in payload) {
    patch.paymentPolicy = servicePaymentPolicySchema.parse(payload.paymentPolicy);
  }
  if ("status" in payload) {
    patch.status = readServiceStatus(payload.status, "status");
  }

  return requireNonEmptyPatch(patch, "service");
}

function parseProfessionalPatch(payload: Record<string, unknown>): ProfessionalPatchInput {
  const patch: ProfessionalPatchInput = {};

  if ("nome" in payload) {
    patch.nome = readRequiredString(payload.nome, "nome");
  }
  if ("status" in payload) {
    patch.status = readProfessionalStatus(payload.status, "status");
  }
  if ("especialidades" in payload) {
    patch.especialidades = readStringArray(payload.especialidades, "especialidades");
  }
  if ("bankId" in payload) {
    patch.bankId = readOptionalId(payload.bankId, "bankId");
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

function parseBankPatch(payload: Record<string, unknown>) {
  const patch: {
    codigo?: string;
    bacenCode?: string;
    nomeBanco?: string;
    agencia?: string;
    conta?: string;
    ativo?: boolean;
  } = {};

  if ("codigo" in payload) {
    patch.codigo = readRequiredString(payload.codigo, "codigo");
  }
  if ("bacenCode" in payload) {
    patch.bacenCode = readBankCode(payload.bacenCode, "bacenCode");
  }
  if ("nomeBanco" in payload) {
    patch.nomeBanco = readRequiredString(payload.nomeBanco, "nomeBanco");
  }
  if ("agencia" in payload) {
    patch.agencia = readRequiredString(payload.agencia, "agencia");
  }
  if ("conta" in payload) {
    patch.conta = readRequiredString(payload.conta, "conta");
  }
  if ("ativo" in payload) {
    patch.ativo = readBoolean(payload.ativo, "ativo");
  }

  return requireNonEmptyPatch(patch, "bank");
}

function parseBankBalancePatch(payload: Record<string, unknown>) {
  const patch: {
    codigo?: string;
    saldoInicial?: number;
    dataSaldoInicial?: string;
    observacao?: string | undefined;
  } = {};

  if ("codigo" in payload) {
    patch.codigo = readRequiredString(payload.codigo, "codigo");
  }
  if ("saldoInicial" in payload) {
    patch.saldoInicial = readNonNegativeNumber(payload.saldoInicial, "saldoInicial");
  }
  if ("dataSaldoInicial" in payload) {
    patch.dataSaldoInicial = readDateString(payload.dataSaldoInicial, "dataSaldoInicial");
  }
  if ("observacao" in payload) {
    patch.observacao =
      typeof payload.observacao === "string" ? payload.observacao.trim() || undefined : undefined;
  }

  return requireNonEmptyPatch(patch, "bank balance");
}

function parseRevenuePatch(payload: Record<string, unknown>) {
  const patch: {
    codigo?: string;
    descricao?: string;
    valor?: number;
    dataVencimento?: string;
    tipo?: "unica" | "recorrente";
    recorrencia?: "semanal" | "mensal" | undefined;
    quantidadeOcorrencias?: number | undefined;
    diaSemanaVencimento?: number | undefined;
    status?: (typeof revenueScheduleStatusValues)[number];
    bankId?: string | undefined;
    baixaAutomatica?: "sim" | "nao";
    clientId?: string | undefined;
    serviceId?: string | undefined;
    professionalId?: string | undefined;
    bookingId?: string | undefined;
  } = {};

  if ("codigo" in payload) {
    patch.codigo = readRequiredString(payload.codigo, "codigo");
  }
  if ("descricao" in payload) {
    patch.descricao = readRequiredString(payload.descricao, "descricao");
  }
  if ("valor" in payload) {
    patch.valor = readNonNegativeNumber(payload.valor, "valor");
  }
  if ("dataVencimento" in payload) {
    patch.dataVencimento = readDateString(payload.dataVencimento, "dataVencimento");
  }
  if ("tipo" in payload) {
    patch.tipo = readStringEnum(payload.tipo, ["unica", "recorrente"] as const, "tipo");
  }
  if ("recorrencia" in payload) {
    patch.recorrencia = readOptionalStringEnum(
      payload.recorrencia,
      ["semanal", "mensal"] as const,
      "recorrencia"
    );
  }
  if ("quantidadeOcorrencias" in payload) {
    patch.quantidadeOcorrencias =
      payload.quantidadeOcorrencias == null
        ? undefined
        : readPositiveInteger(payload.quantidadeOcorrencias, "quantidadeOcorrencias");
  }
  if ("diaSemanaVencimento" in payload) {
    patch.diaSemanaVencimento =
      payload.diaSemanaVencimento == null
        ? undefined
        : readWeekday(payload.diaSemanaVencimento, "diaSemanaVencimento");
  }
  if ("status" in payload) {
    patch.status = readStringEnum(payload.status, revenueScheduleStatusValues, "status");
  }
  if ("bankId" in payload) {
    patch.bankId = readOptionalId(payload.bankId, "bankId");
  }
  if ("baixaAutomatica" in payload) {
    patch.baixaAutomatica = readStringEnum(payload.baixaAutomatica, ["sim", "nao"] as const, "baixaAutomatica");
  }
  if ("clientId" in payload) {
    patch.clientId = readOptionalId(payload.clientId, "clientId");
  }
  if ("serviceId" in payload) {
    patch.serviceId = readOptionalId(payload.serviceId, "serviceId");
  }
  if ("professionalId" in payload) {
    patch.professionalId = readOptionalId(payload.professionalId, "professionalId");
  }
  if ("bookingId" in payload) {
    patch.bookingId = readOptionalId(payload.bookingId, "bookingId");
  }

  return requireNonEmptyPatch(patch, "revenue");
}

function parseExpensePatch(payload: Record<string, unknown>) {
  const patch: {
    codigo?: string;
    descricao?: string;
    valor?: number;
    dataVencimento?: string;
    tipo?: "unica" | "recorrente";
    recorrencia?: "semanal" | "mensal" | undefined;
    quantidadeOcorrencias?: number | undefined;
    diaSemanaVencimento?: number | undefined;
    status?: (typeof expenseScheduleStatusValues)[number];
    beneficiarioNome?: string | undefined;
    bankId?: string | undefined;
    baixaAutomatica?: "sim" | "nao";
  } = {};

  if ("codigo" in payload) {
    patch.codigo = readRequiredString(payload.codigo, "codigo");
  }
  if ("descricao" in payload) {
    patch.descricao = readRequiredString(payload.descricao, "descricao");
  }
  if ("valor" in payload) {
    patch.valor = readNonNegativeNumber(payload.valor, "valor");
  }
  if ("dataVencimento" in payload) {
    patch.dataVencimento = readDateString(payload.dataVencimento, "dataVencimento");
  }
  if ("tipo" in payload) {
    patch.tipo = readStringEnum(payload.tipo, ["unica", "recorrente"] as const, "tipo");
  }
  if ("recorrencia" in payload) {
    patch.recorrencia = readOptionalStringEnum(
      payload.recorrencia,
      ["semanal", "mensal"] as const,
      "recorrencia"
    );
  }
  if ("quantidadeOcorrencias" in payload) {
    patch.quantidadeOcorrencias =
      payload.quantidadeOcorrencias == null
        ? undefined
        : readPositiveInteger(payload.quantidadeOcorrencias, "quantidadeOcorrencias");
  }
  if ("diaSemanaVencimento" in payload) {
    patch.diaSemanaVencimento =
      payload.diaSemanaVencimento == null
        ? undefined
        : readWeekday(payload.diaSemanaVencimento, "diaSemanaVencimento");
  }
  if ("status" in payload) {
    patch.status = readStringEnum(payload.status, expenseScheduleStatusValues, "status");
  }
  if ("beneficiarioNome" in payload) {
    patch.beneficiarioNome = readOptionalString(payload.beneficiarioNome, "beneficiarioNome");
  }
  if ("bankId" in payload) {
    patch.bankId = readOptionalId(payload.bankId, "bankId");
  }
  if ("baixaAutomatica" in payload) {
    patch.baixaAutomatica = readStringEnum(payload.baixaAutomatica, ["sim", "nao"] as const, "baixaAutomatica");
  }

  return requireNonEmptyPatch(patch, "expense");
}

function parseBankMovementPatch(payload: Record<string, unknown>) {
  const patch: {
    tipo?: BankMovementType;
    bankIdOrigem?: string | undefined;
    bankIdDestino?: string | undefined;
    valor?: number;
    historico?: string;
    beneficiarioNome?: string | undefined;
    dataMovimento?: string;
  } = {};

  if ("tipo" in payload) {
    patch.tipo = readStringEnum(payload.tipo, bankMovementTypeValues, "tipo");
  }
  if ("bankIdOrigem" in payload) {
    patch.bankIdOrigem = readOptionalId(payload.bankIdOrigem, "bankIdOrigem");
  }
  if ("bankIdDestino" in payload) {
    patch.bankIdDestino = readOptionalId(payload.bankIdDestino, "bankIdDestino");
  }
  if ("valor" in payload) {
    patch.valor = readNonNegativeNumber(payload.valor, "valor");
  }
  if ("historico" in payload) {
    patch.historico = readRequiredString(payload.historico, "historico");
  }
  if ("beneficiarioNome" in payload) {
    patch.beneficiarioNome = readOptionalString(payload.beneficiarioNome, "beneficiarioNome");
  }
  if ("dataMovimento" in payload) {
    patch.dataMovimento = readRequiredString(payload.dataMovimento, "dataMovimento");
  }

  return requireNonEmptyPatch(patch, "bank movement");
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

function readServiceStatus(value: unknown, fieldName: string): ServicePatchInput["status"] {
  const candidate = readRequiredString(value, fieldName).toLowerCase();
  if (!serviceStatusValues.includes(candidate as (typeof serviceStatusValues)[number])) {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must be a known service status.`);
  }
  return candidate as ServicePatchInput["status"];
}

function readProfessionalStatus(value: unknown, fieldName: string): ProfessionalPatchInput["status"] {
  const candidate = readRequiredString(value, fieldName).toLowerCase();
  if (!professionalStatusValues.includes(candidate as (typeof professionalStatusValues)[number])) {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must be a known professional status.`);
  }
  return candidate as ProfessionalPatchInput["status"];
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

function readBankCode(value: unknown, fieldName: string): string {
  const candidate = readRequiredString(value, fieldName);
  if (!/^\d{3}$/.test(candidate)) {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must use a 3-digit BACEN code.`);
  }
  return candidate;
}

function readOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must be a string.`);
  }
  const candidate = value.trim();
  return candidate.length > 0 ? candidate : undefined;
}

function readOptionalId(value: unknown, fieldName: string): string | undefined {
  if (value == null) {
    return undefined;
  }
  return readRequiredString(value, fieldName);
}

function readWeekday(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 6) {
    throw new ApiHttpError(400, "invalid_body", `Field '${fieldName}' must be an integer from 0 to 6.`);
  }
  return value;
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

function readStringEnum<const TValues extends readonly string[]>(
  value: unknown,
  values: TValues,
  fieldName: string
): TValues[number] {
  const candidate = readRequiredString(value, fieldName);
  if (!values.includes(candidate as TValues[number])) {
    throw new ApiHttpError(
      400,
      "invalid_body",
      `Field '${fieldName}' must be one of: ${values.join(", ")}.`
    );
  }

  return candidate as TValues[number];
}

function readOptionalStringEnum<const TValues extends readonly string[]>(
  value: unknown,
  values: TValues,
  fieldName: string
): TValues[number] | undefined {
  if (value == null) {
    return undefined;
  }
  return readStringEnum(value, values, fieldName);
}

function createTenantPaymentSettings(
  payload: Record<string, unknown>,
  tenantId: string
) {
  return tenantPaymentSettingsSchema.parse({
    ...payload,
    version: contractVersion,
    tenantId,
    provider: "mercado_pago"
  });
}

function assertActivePaymentSettings(
  paymentSettings?: TenantPaymentSettings
): asserts paymentSettings is TenantPaymentSettings {
  if (
    !paymentSettings ||
    paymentSettings.status !== "active" ||
    !paymentSettings.accessToken ||
    !paymentSettings.notificationUrl ||
    !paymentSettings.backUrls
  ) {
    throw new Error("payment_settings_inactive");
  }
}

function buildExternalReference(tenantId: string, bookingId: string, paymentIntentId: string): string {
  return `agendaai:${tenantId}:${bookingId}:${paymentIntentId}`;
}

function resolvePaymentAmount(service: Service): number {
  const policy = service.paymentPolicy;
  if (policy.collectionMode === "none") {
    throw new Error("payment_not_required");
  }

  if (policy.chargeType === "fixed" && policy.fixedAmount !== undefined) {
    return roundCurrency(policy.fixedAmount);
  }

  const percentage = policy.percentage ?? (policy.collectionMode === "full" ? 100 : 30);
  return roundCurrency((service.precoBase * percentage) / 100);
}

function buildCheckoutBackUrls(
  paymentSettings: TenantPaymentSettings,
  params: Record<string, string>
) {
  if (!paymentSettings.backUrls) {
    throw new Error("payment_settings_inactive");
  }

  const backUrls = paymentSettings.backUrls;
  return {
    success: appendQueryParams(backUrls.success, params),
    pending: appendQueryParams(backUrls.pending, params),
    failure: appendQueryParams(backUrls.failure, params)
  };
}

function appendQueryParams(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function buildCheckoutPreferencePayload(input: {
  slug: string;
  paymentIntentId: string;
  bookingContext: {
    tenant: { slug: string; nome: string; timezone: string };
    client: { id: string; nome: string; email: string };
    service: Service;
    professional: { id: string; nome: string };
    booking: Booking;
  };
  paymentSettings: TenantPaymentSettings;
  notificationUrl: string;
  backUrls: {
    success: string;
    pending: string;
    failure: string;
  };
  externalReference: string;
  amount: number;
}): Record<string, unknown> {
  const { firstName, lastName } = splitName(input.bookingContext.client.nome);
  const policy = input.bookingContext.service.paymentPolicy;
  const expirationMinutes =
    policy.expirationMinutes ?? input.paymentSettings.expirationMinutes ?? 60;
  const expirationDate = new Date(Date.now() + expirationMinutes * 60_000).toISOString();

  return {
    items: [
      {
        id: input.bookingContext.service.id,
        title: input.bookingContext.service.nome,
        description: `${input.bookingContext.tenant.nome} / ${input.bookingContext.professional.nome}`,
        quantity: 1,
        currency_id: policy.currencyId,
        unit_price: input.amount
      }
    ],
    payer: {
      email: input.bookingContext.client.email,
      name: firstName,
      surname: lastName
    },
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    back_urls: input.backUrls,
    auto_return: input.paymentSettings.autoReturn ?? "approved",
    binary_mode: input.paymentSettings.binaryMode,
    statement_descriptor: input.paymentSettings.statementDescriptor,
    sponsor_id: input.paymentSettings.sponsorId,
    expires: true,
    expiration_date_to: expirationDate,
    metadata: {
      slug: input.slug,
      paymentIntentId: input.paymentIntentId,
      bookingId: input.bookingContext.booking.id,
      tenantId: input.bookingContext.booking.tenantId,
      clientId: input.bookingContext.client.id,
      serviceId: input.bookingContext.service.id,
      professionalId: input.bookingContext.professional.id
    }
  };
}

function buildPayer(name: string, email: string): PaymentIntent["payer"] {
  const { firstName, lastName } = splitName(name);
  return {
    email,
    firstName,
    lastName
  };
}

async function readPublicPaymentIntentState(
  store: ApiRestStorePort,
  slug: string,
  paymentIntentId: string
) {
  const tenant = await store.getTenantBySlug(slug);
  if (!tenant) {
    throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
  }

  return await readPaymentIntentStateByTenantId(store, tenant.id, paymentIntentId);
}

async function syncPublicPaymentIntent(
  store: ApiRestStorePort,
  mercadoPagoGateway: MercadoPagoGateway,
  slug: string,
  paymentIntentId: string,
  paymentId?: string
) {
  const tenant = await store.getTenantBySlug(slug);
  if (!tenant) {
    throw new ApiHttpError(404, "tenant_not_found", "Tenant slug was not found.");
  }

  return await syncPaymentIntentByTenantId(
    store,
    mercadoPagoGateway,
    tenant.id,
    paymentIntentId,
    paymentId
  );
}

async function readPaymentIntentStateByTenantId(
  store: ApiRestStorePort,
  tenantId: string,
  paymentIntentId: string
) {
  const paymentIntent = await store.getPaymentIntent(tenantId, paymentIntentId);
  if (!paymentIntent) {
    throw new Error("payment_intent_not_found");
  }

  const booking = await store.getBooking(tenantId, paymentIntent.bookingId);
  if (!booking) {
    throw new ApiHttpError(404, "booking_not_found", "Booking was not found for this payment.");
  }

  return {
    item: paymentIntent,
    booking
  };
}

async function syncCashEntriesForBooking(
  store: ApiRestStorePort,
  tenantId: string,
  bookingId: string
): Promise<void> {
  const booking = await store.getBooking(tenantId, bookingId);
  if (!booking) {
    return;
  }

  const [service, client, professional, paymentIntents] = await Promise.all([
    store.getService(tenantId, booking.serviceId),
    store.getClient(tenantId, booking.clientId),
    store.getProfessional(tenantId, booking.professionalId),
    store.listPaymentIntents(tenantId)
  ]);

  if (!service || !client || !professional) {
    return;
  }

  const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
  const recognizedRevenueStatus: CashEntry["status"] =
    booking.status === "concluido" ? "open" : "reversed";
  await upsertBookingCashEntry(store, {
    tenantId,
    booking,
    service,
    client,
    professional,
    paymentIntent,
    kind: "recognized_revenue",
    source: "booking_completion",
    status: recognizedRevenueStatus,
    amount: service.precoBase,
    occurredAt: booking.endAt,
    description: `Receita reconhecida - ${service.nome}`
  });

  const isOnlinePaymentApproved =
    paymentIntent?.status === "approved" || paymentIntent?.status === "authorized";
  const existingOnlinePaymentEntry = await store.getCashEntryByBookingAndKind(
    tenantId,
    booking.id,
    "online_payment"
  );
  await upsertBookingCashEntry(store, {
    tenantId,
    booking,
    service,
    client,
    professional,
    paymentIntent,
    existingEntry: existingOnlinePaymentEntry,
    kind: "online_payment",
    source: "payment_reconciliation",
    status: isOnlinePaymentApproved ? "open" : "reversed",
    amount: paymentIntent?.amount ?? 0,
    occurredAt: existingOnlinePaymentEntry?.occurredAt ?? new Date().toISOString(),
    description: `Entrada online aprovada - ${service.nome}`
  });
}

async function reverseCashEntriesForBooking(
  store: ApiRestStorePort,
  tenantId: string,
  bookingId: string
): Promise<void> {
  const entries = await store.listCashEntries(tenantId);
  const bookingEntries = entries.filter((entry) => entry.bookingId === bookingId);
  for (const entry of bookingEntries) {
    if (entry.status === "reversed") {
      continue;
    }
    await store.saveCashEntry({
      ...entry,
      status: "reversed"
    });
  }
}

async function upsertBookingCashEntry(
  store: ApiRestStorePort,
  input: {
    tenantId: string;
    booking: Booking;
    service: Service;
    client: Client;
    professional: Professional;
    paymentIntent?: PaymentIntent;
    existingEntry?: CashEntry;
    kind: CashEntryKind;
    source: CashEntry["source"];
    status: CashEntry["status"];
    amount: number;
    occurredAt: string;
    description: string;
  }
): Promise<void> {
  const existingEntry =
    input.existingEntry ??
    (await store.getCashEntryByBookingAndKind(input.tenantId, input.booking.id, input.kind));

  if (!existingEntry && input.status === "reversed") {
    return;
  }

  await store.saveCashEntry({
    version: contractVersion,
    id: existingEntry?.id ?? randomUUID(),
    tenantId: input.tenantId,
    bookingId: input.booking.id,
    clientId: input.client.id,
    serviceId: input.service.id,
    professionalId: input.professional.id,
    paymentIntentId: input.paymentIntent?.id,
    kind: input.kind,
    source: input.source,
    status: input.status,
    currencyId: input.paymentIntent?.currencyId ?? input.service.paymentPolicy.currencyId,
    amount: roundCurrency(input.amount),
    occurredAt: input.occurredAt,
    description: `${input.description} - ${input.client.nome}`,
    note:
      input.kind === "online_payment" && input.paymentIntent
        ? `paymentIntent ${input.paymentIntent.id}`
        : undefined
  });
}

async function syncPaymentIntentByTenantId(
  store: ApiRestStorePort,
  mercadoPagoGateway: MercadoPagoGateway,
  tenantId: string,
  paymentIntentId: string,
  paymentId?: string
) {
  const paymentIntent = await store.getPaymentIntent(tenantId, paymentIntentId);
  if (!paymentIntent) {
    throw new Error("payment_intent_not_found");
  }

  if (!paymentId && !paymentIntent.paymentId) {
    const paymentSettings = await store.getPaymentSettings(tenantId);
    if (!canSearchMercadoPagoPayment(paymentSettings)) {
      return await readPaymentIntentStateByTenantId(store, tenantId, paymentIntentId);
    }

    const payment = await mercadoPagoGateway.findPaymentByExternalReference(
      paymentSettings.accessToken,
      paymentIntent.externalReference
    );
    if (!payment) {
      return await readPaymentIntentStateByTenantId(store, tenantId, paymentIntentId);
    }

    return await reconcilePaymentState(store, tenantId, paymentIntentId, payment);
  }

  const paymentSettings = await store.getPaymentSettings(tenantId);
  assertActivePaymentSettings(paymentSettings);

  const payment = await mercadoPagoGateway.getPayment(
    paymentSettings.accessToken as string,
    paymentId ?? (paymentIntent.paymentId as string)
  );

  return await reconcilePaymentState(store, tenantId, paymentIntentId, payment);
}

function canSearchMercadoPagoPayment(
  paymentSettings?: TenantPaymentSettings
): paymentSettings is TenantPaymentSettings & { accessToken: string } {
  return Boolean(
    paymentSettings &&
      paymentSettings.provider === "mercado_pago" &&
      paymentSettings.status === "active" &&
      paymentSettings.accessToken
  );
}

async function reconcilePaymentState(
  store: ApiRestStorePort,
  tenantId: string,
  paymentIntentId: string,
  payment: {
    id: string;
    status: string;
    statusDetail?: string;
    externalReference?: string;
  }
) {
  const paymentIntent = await store.getPaymentIntent(tenantId, paymentIntentId);
  if (!paymentIntent) {
    throw new Error("payment_intent_not_found");
  }

  if (
    payment.externalReference &&
    payment.externalReference !== paymentIntent.externalReference
  ) {
    throw new ApiHttpError(409, "payment_reference_mismatch", "Payment reference does not match.");
  }

  const nextPaymentIntent = await store.updatePaymentIntent(tenantId, paymentIntentId, {
    paymentId: payment.id,
    status: mapMercadoPagoStatusToIntentStatus(payment.status),
    statusDetail: payment.statusDetail
  });

  const nextBooking = await store.updateBooking(tenantId, paymentIntent.bookingId, {
    status: mapMercadoPagoStatusToBookingStatus(payment.status)
  });

  await syncCashEntriesForBooking(store, tenantId, paymentIntent.bookingId);

  return {
    item: nextPaymentIntent,
    booking: nextBooking
  };
}

function mapMercadoPagoStatusToIntentStatus(status: string): PaymentIntent["status"] {
  const normalizedStatus = status.trim().toLowerCase();
  switch (normalizedStatus) {
    case "approved":
      return "approved";
    case "authorized":
      return "authorized";
    case "in_process":
      return "in_process";
    case "in_mediation":
      return "in_mediation";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "charged_back":
      return "charged_back";
    case "expired":
      return "expired";
    default:
      return "pending";
  }
}

function mapMercadoPagoStatusToBookingStatus(status: string): Booking["status"] {
  const normalizedStatus = status.trim().toLowerCase();
  switch (normalizedStatus) {
    case "approved":
    case "authorized":
      return "confirmado";
    case "rejected":
    case "cancelled":
    case "expired":
      return "cancelado";
    default:
      return "aguardando pagamento";
  }
}

async function executeDefinitionAgainstStore(
  store: ApiRestStorePort,
  tenantId: string,
  definition: ReportDefinition
) {
  const professionals = await store.listProfessionals(tenantId);
  const availabilityRules = (
    await Promise.all(
      professionals.map((professional) => store.listAvailabilityRules(tenantId, professional.id))
    )
  ).flat();

  return executeReportDefinition({
    definition,
    clients: await store.listClients(tenantId),
    bookings: await store.listBookings(tenantId),
    services: await store.listServices(tenantId),
    professionals,
    availabilityRules,
    paymentIntents: await store.listPaymentIntents(tenantId),
    cashEntries: await store.listCashEntries(tenantId)
  });
}

function buildNextReportDefinitionCode(definitions: readonly ReportDefinition[]): string {
  const maxNumber = definitions.reduce((currentMax, definition) => {
    const match = definition.code.match(/(\d+)$/);
    if (!match) {
      return currentMax;
    }
    return Math.max(currentMax, Number(match[1]));
  }, 0);

  return `RPT-${String(maxNumber + 1).padStart(4, "0")}`;
}

function splitName(value: string): { firstName?: string; lastName?: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return {};
  }

  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined
  };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
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
