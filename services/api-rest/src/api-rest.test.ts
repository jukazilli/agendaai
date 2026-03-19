import assert from "node:assert/strict";
import test from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApiRestApp } from "./index";
import type { MercadoPagoGateway } from "./mercado-pago";

interface OnboardingResult {
  readonly tenant: {
    readonly id: string;
    readonly slug: string;
  };
  readonly session: {
    readonly token: string;
  };
}

function authHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`
  };
}

async function createApp(mercadoPagoGateway?: MercadoPagoGateway): Promise<FastifyInstance> {
  const app = buildApiRestApp({
    mercadoPagoGateway
  });
  await app.ready();
  return app;
}

async function onboardTenant(app: FastifyInstance, suffix: string): Promise<OnboardingResult> {
  const response = await app.inject({
    method: "POST",
    url: "/v1/onboarding/tenants",
    payload: {
      nome: `Tenant ${suffix}`,
      slug: `tenant-${suffix}`,
      timezone: "America/Sao_Paulo",
      admin: {
        nome: `Admin ${suffix}`,
        email: `admin-${suffix}@agendaai.test`,
        telefone: "11999999999",
        senha: "senha-forte",
        aceitarTermos: true
      }
    }
  });

  assert.equal(response.statusCode, 201);
  return response.json();
}

async function createService(app: FastifyInstance, token: string, overrides: Record<string, unknown> = {}) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/admin/services",
    headers: authHeaders(token),
    payload: {
      nome: "Servico Base",
      duracaoMin: 60,
      precoBase: 100,
      exigeSinal: false,
      ...overrides
    }
  });

  assert.equal(response.statusCode, 201);
  return response.json();
}

async function createProfessional(
  app: FastifyInstance,
  token: string,
  especialidades: string[],
  overrides: Record<string, unknown> = {}
) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/admin/professionals",
    headers: authHeaders(token),
    payload: {
      nome: "Profissional Base",
      especialidades,
      ...overrides
    }
  });

  assert.equal(response.statusCode, 201);
  return response.json();
}

async function createClient(
  app: FastifyInstance,
  token: string,
  overrides: Record<string, unknown> = {}
) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/admin/clients",
    headers: authHeaders(token),
    payload: {
      nome: "Cliente Base",
      telefone: "11999990000",
      email: `cliente-${Math.random().toString(16).slice(2)}@agendaai.test`,
      origem: "site",
      ...overrides
    }
  });

  assert.equal(response.statusCode, 201);
  return response.json();
}

async function createBooking(
  app: FastifyInstance,
  token: string,
  payload: Record<string, unknown>
) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/admin/bookings",
    headers: authHeaders(token),
    payload
  });

  assert.equal(response.statusCode, 201, response.body);
  return response.json();
}

async function setAvailability(
  app: FastifyInstance,
  token: string,
  professionalId: string,
  rules: Array<{ weekday: number; faixa: { startTime: string; endTime: string } }>
) {
  const response = await app.inject({
    method: "PUT",
    url: `/v1/admin/professionals/${professionalId}/availability`,
    headers: authHeaders(token),
    payload: {
      rules
    }
  });

  assert.equal(response.statusCode, 200);
  return response.json();
}

function createFakeMercadoPagoGateway(overrides: {
  createPreference?: (payload: Record<string, unknown>) => {
    id: string;
    initPoint?: string;
    sandboxInitPoint?: string;
  };
  getPayment?: (paymentId: string) => {
    id: string;
    status: string;
    statusDetail?: string;
    externalReference?: string;
  };
  findPaymentByExternalReference?: (externalReference: string) =>
    | {
        id: string;
        status: string;
        statusDetail?: string;
        externalReference?: string;
      }
    | undefined;
} = {}): MercadoPagoGateway {
  return {
    async createPreference(request) {
      const payload = request.payload;
      return overrides.createPreference?.(payload) ?? {
        id: "pref-test-123",
        initPoint: "https://mercadopago.test/checkout/pref-test-123",
        sandboxInitPoint: "https://sandbox.mercadopago.test/checkout/pref-test-123"
      };
    },
    async getPayment(_accessToken, paymentId) {
      return overrides.getPayment?.(paymentId) ?? {
        id: paymentId,
        status: "approved",
        externalReference: "external-ref"
      };
    },
    async findPaymentByExternalReference(_accessToken, externalReference) {
      return overrides.findPaymentByExternalReference?.(externalReference);
    }
  };
}

function buildIsoWindow(
  daysOffset: number,
  startHour: number,
  startMinute: number,
  durationMinutes: number
) {
  const startAt = new Date();
  startAt.setHours(startHour, startMinute, 0, 0);
  startAt.setDate(startAt.getDate() + daysOffset);

  const endAt = new Date(startAt.getTime() + durationMinutes * 60000);
  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString()
  };
}

test("onboarding emite sessao admin e lookup publico por slug", async () => {
  const app = await createApp();

  try {
    const onboarding = await onboardTenant(app, "alpha");

    const sessionResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/auth/session",
      headers: authHeaders(onboarding.session.token)
    });

    assert.equal(sessionResponse.statusCode, 200);
    const sessionPayload = sessionResponse.json();
    assert.equal(sessionPayload.claims.tenantId, onboarding.tenant.id);
    assert.equal(sessionPayload.tenant.slug, onboarding.tenant.slug);

    const publicResponse = await app.inject({
      method: "GET",
      url: `/v1/public/tenants/${onboarding.tenant.slug}`
    });

    assert.equal(publicResponse.statusCode, 200);
    const publicPayload = publicResponse.json();
    assert.equal(publicPayload.slug, onboarding.tenant.slug);
  } finally {
    await app.close();
  }
});

test("tenant context administrativo e resolvido pela sessao e isola servicos", async () => {
  const app = await createApp();

  try {
    const alpha = await onboardTenant(app, "alpha");
    const beta = await onboardTenant(app, "beta");

    const createServiceResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/services",
      headers: authHeaders(alpha.session.token),
      payload: {
        tenantId: beta.tenant.id,
        nome: "Corte Executivo",
        duracaoMin: 45,
        precoBase: 120,
        exigeSinal: false
      }
    });

    assert.equal(createServiceResponse.statusCode, 201);
    const createdService = createServiceResponse.json();
    assert.equal(createdService.tenantId, alpha.tenant.id);

    const alphaServices = await app.inject({
      method: "GET",
      url: "/v1/admin/services",
      headers: authHeaders(alpha.session.token)
    });

    const betaServices = await app.inject({
      method: "GET",
      url: "/v1/admin/services",
      headers: authHeaders(beta.session.token)
    });

    assert.equal(alphaServices.statusCode, 200);
    assert.equal(betaServices.statusCode, 200);
    assert.equal(alphaServices.json().items.length, 1);
    assert.equal(betaServices.json().items.length, 0);

    const forbiddenRead = await app.inject({
      method: "GET",
      url: `/v1/admin/services/${createdService.id}`,
      headers: authHeaders(beta.session.token)
    });

    assert.equal(forbiddenRead.statusCode, 404);
  } finally {
    await app.close();
  }
});

test("profissionais, catalogo publico e disponibilidade por slug operam por tenant", async () => {
  const app = await createApp();

  try {
    const alpha = await onboardTenant(app, "catalog-alpha");
    const beta = await onboardTenant(app, "catalog-beta");

    const service = await createService(app, alpha.session.token, {
      nome: "Consulta",
      duracaoMin: 30
    });

    const professional = await createProfessional(app, alpha.session.token, [service.id], {
      nome: "Dra. Ana"
    });

    await setAvailability(app, alpha.session.token, professional.id, [
      {
        weekday: 5,
        faixa: {
          startTime: "09:00",
          endTime: "11:00"
        }
      }
    ]);

    const publicCatalog = await app.inject({
      method: "GET",
      url: `/v1/public/tenants/${alpha.tenant.slug}/catalog`
    });

    assert.equal(publicCatalog.statusCode, 200);
    assert.equal(publicCatalog.json().services.length, 1);
    assert.equal(publicCatalog.json().professionals.length, 1);

    const publicProfessionals = await app.inject({
      method: "GET",
      url: `/v1/public/tenants/${alpha.tenant.slug}/professionals?serviceId=${service.id}`
    });

    assert.equal(publicProfessionals.statusCode, 200);
    assert.equal(publicProfessionals.json().items.length, 1);
    assert.equal(publicProfessionals.json().items[0].id, professional.id);

    const publicAvailability = await app.inject({
      method: "GET",
      url: `/v1/public/tenants/${alpha.tenant.slug}/availability?serviceId=${service.id}&professionalId=${professional.id}&date=2026-03-20`
    });

    assert.equal(publicAvailability.statusCode, 200);
    assert.equal(publicAvailability.json().items.length, 4);
    assert.equal(publicAvailability.json().items[0].startTime, "09:00");
    assert.equal(publicAvailability.json().items[3].endTime, "11:00");

    const betaCatalog = await app.inject({
      method: "GET",
      url: `/v1/public/tenants/${beta.tenant.slug}/catalog`
    });

    assert.equal(betaCatalog.statusCode, 200);
    assert.equal(betaCatalog.json().services.length, 0);
    assert.equal(betaCatalog.json().professionals.length, 0);
  } finally {
    await app.close();
  }
});

test("bookings respeitam especialidade, disponibilidade e conflito no mesmo tenant", async () => {
  const app = await createApp();

  try {
    const onboarding = await onboardTenant(app, "gamma");

    const service = await createService(app, onboarding.session.token, {
      nome: "Consulta Inicial",
      duracaoMin: 60,
      precoBase: 150,
      exigeSinal: true
    });

    const professional = await createProfessional(app, onboarding.session.token, [service.id], {
      nome: "Dr. Bruno"
    });

    await setAvailability(app, onboarding.session.token, professional.id, [
      {
        weekday: 5,
        faixa: {
          startTime: "13:00",
          endTime: "16:00"
        }
      }
    ]);

    const clientResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/clients",
      headers: authHeaders(onboarding.session.token),
      payload: {
        nome: "Maria Souza",
        telefone: "11988887777",
        email: "maria@agendaai.test",
        origem: "instagram"
      }
    });
    assert.equal(clientResponse.statusCode, 201);
    const client = clientResponse.json();

    const bookingResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/bookings",
      headers: authHeaders(onboarding.session.token),
      payload: {
        clientId: client.id,
        serviceId: service.id,
        professionalId: professional.id,
        status: "pendente",
        startAt: "2026-03-20T13:00:00-03:00",
        endAt: "2026-03-20T14:00:00-03:00"
      }
    });
    assert.equal(bookingResponse.statusCode, 201);
    const booking = bookingResponse.json();

    const conflictResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/bookings",
      headers: authHeaders(onboarding.session.token),
      payload: {
        clientId: client.id,
        serviceId: service.id,
        professionalId: professional.id,
        status: "pendente",
        startAt: "2026-03-20T13:00:00-03:00",
        endAt: "2026-03-20T14:00:00-03:00"
      }
    });
    assert.equal(conflictResponse.statusCode, 409);
    assert.equal(conflictResponse.json().error, "slot_unavailable");

    const publicAvailabilityAfterBooking = await app.inject({
      method: "GET",
      url: `/v1/public/tenants/${onboarding.tenant.slug}/availability?serviceId=${service.id}&professionalId=${professional.id}&date=2026-03-20`
    });
    assert.equal(publicAvailabilityAfterBooking.statusCode, 200);
    assert.equal(
      publicAvailabilityAfterBooking
        .json()
        .items.some((slot: { startTime: string }) => slot.startTime === "13:00"),
      false
    );

    const bookingPatch = await app.inject({
      method: "PATCH",
      url: `/v1/admin/bookings/${booking.id}`,
      headers: authHeaders(onboarding.session.token),
      payload: {
        status: "confirmado"
      }
    });
    assert.equal(bookingPatch.statusCode, 200);
    assert.equal(bookingPatch.json().status, "confirmado");

    const bookingList = await app.inject({
      method: "GET",
      url: "/v1/admin/bookings",
      headers: authHeaders(onboarding.session.token)
    });
    assert.equal(bookingList.statusCode, 200);
    assert.equal(bookingList.json().items.length, 1);

    const bookingCancel = await app.inject({
      method: "PATCH",
      url: `/v1/admin/bookings/${booking.id}`,
      headers: authHeaders(onboarding.session.token),
      payload: {
        status: "cancelado"
      }
    });
    assert.equal(bookingCancel.statusCode, 200);
    assert.equal(bookingCancel.json().status, "cancelado");

    const publicAvailabilityAfterCancel = await app.inject({
      method: "GET",
      url: `/v1/public/tenants/${onboarding.tenant.slug}/availability?serviceId=${service.id}&professionalId=${professional.id}&date=2026-03-20`
    });
    assert.equal(publicAvailabilityAfterCancel.statusCode, 200);
    assert.equal(
      publicAvailabilityAfterCancel
        .json()
        .items.some((slot: { startTime: string }) => slot.startTime === "13:00"),
      true
    );
  } finally {
    await app.close();
  }
});

test("booking publico confirma servico sem sinal e bloqueia servico com pagamento pendente", async () => {
  const app = await createApp();

  try {
    const onboarding = await onboardTenant(app, "publico");

    const service = await createService(app, onboarding.session.token, {
      nome: "Sessao Expressa",
      duracaoMin: 30,
      precoBase: 80,
      exigeSinal: false
    });

    const professional = await createProfessional(app, onboarding.session.token, [service.id], {
      nome: "Ana Lima"
    });

    await setAvailability(app, onboarding.session.token, professional.id, [
      {
        weekday: 5,
        faixa: {
          startTime: "09:00",
          endTime: "12:00"
        }
      }
    ]);

    const publicBookingResponse = await app.inject({
      method: "POST",
      url: `/v1/public/tenants/${onboarding.tenant.slug}/bookings`,
      payload: {
        serviceId: service.id,
        professionalId: professional.id,
        startAt: "2026-03-20T09:00:00-03:00",
        endAt: "2026-03-20T09:30:00-03:00",
        client: {
          nome: "Julia Ramos",
          telefone: "11977776666",
          email: "julia@agendaai.test",
          origem: "google"
        }
      }
    });

    assert.equal(publicBookingResponse.statusCode, 201);
    const publicPayload = publicBookingResponse.json();
    assert.equal(publicPayload.booking.status, "confirmado");
    assert.equal(publicPayload.client.email, "julia@agendaai.test");

    const adminBookings = await app.inject({
      method: "GET",
      url: "/v1/admin/bookings",
      headers: authHeaders(onboarding.session.token)
    });

    assert.equal(adminBookings.statusCode, 200);
    assert.equal(adminBookings.json().items.length, 1);

    const serviceWithSignal = await createService(app, onboarding.session.token, {
      nome: "Coloracao Premium",
      duracaoMin: 60,
      precoBase: 180,
      exigeSinal: true
    });

    const blockedResponse = await app.inject({
      method: "POST",
      url: `/v1/public/tenants/${onboarding.tenant.slug}/bookings`,
      payload: {
        serviceId: serviceWithSignal.id,
        professionalId: professional.id,
        startAt: "2026-03-20T10:00:00-03:00",
        endAt: "2026-03-20T11:00:00-03:00",
        client: {
          nome: "Julia Ramos",
          telefone: "11977776666",
          email: "julia@agendaai.test",
          origem: "google"
        }
      }
    });

    assert.equal(blockedResponse.statusCode, 409);
    assert.equal(blockedResponse.json().error, "payment_required");
  } finally {
    await app.close();
  }
});

test("admin configura Mercado Pago e politica de cobranca por servico", async () => {
  const app = await createApp();

  try {
    const onboarding = await onboardTenant(app, "pagamentos");

    const paymentSettingsResponse = await app.inject({
      method: "PUT",
      url: "/v1/admin/payment-settings",
      headers: authHeaders(onboarding.session.token),
      payload: {
        status: "active",
        checkoutMode: "checkout_pro",
        publicKey: "APP_USR-public-key",
        accessToken: "APP_USR-access-token",
        notificationUrl: "https://agendaai.test/api/webhooks/mercado-pago",
        backUrls: {
          success: "https://agendaai.test/app/pagamentos/sucesso",
          pending: "https://agendaai.test/app/pagamentos/pendente",
          failure: "https://agendaai.test/app/pagamentos/falha"
        },
        autoReturn: "approved",
        binaryMode: true,
        defaultInstallments: 1,
        expirationMinutes: 60
      }
    });

    assert.equal(paymentSettingsResponse.statusCode, 200);
    assert.equal(paymentSettingsResponse.json().provider, "mercado_pago");
    assert.equal(paymentSettingsResponse.json().checkoutMode, "checkout_pro");

    const paymentSettingsRead = await app.inject({
      method: "GET",
      url: "/v1/admin/payment-settings",
      headers: authHeaders(onboarding.session.token)
    });

    assert.equal(paymentSettingsRead.statusCode, 200);
    assert.equal(paymentSettingsRead.json().item.status, "active");
    assert.equal(paymentSettingsRead.json().item.notificationUrl.includes("mercado-pago"), true);

    const service = await createService(app, onboarding.session.token, {
      nome: "Combo Glow",
      paymentPolicy: {
        collectionMode: "deposit",
        checkoutMode: "checkout_pro",
        chargeType: "percentage",
        percentage: 30,
        currencyId: "BRL",
        acceptedMethods: ["pix", "credit_card"],
        maxInstallments: 1,
        capture: true,
        expirationMinutes: 45
      }
    });

    assert.equal(service.exigeSinal, true);
    assert.equal(service.paymentPolicy.collectionMode, "deposit");
    assert.equal(service.paymentPolicy.percentage, 30);

    const serviceRead = await app.inject({
      method: "GET",
      url: `/v1/admin/services/${service.id}`,
      headers: authHeaders(onboarding.session.token)
    });

    assert.equal(serviceRead.statusCode, 200);
    assert.equal(serviceRead.json().paymentPolicy.collectionMode, "deposit");
    assert.equal(serviceRead.json().paymentPolicy.checkoutMode, "checkout_pro");
  } finally {
    await app.close();
  }
});

test("read model administrativo de relatorios agrega financeiro minimo e recorrencia basica", async () => {
  const app = await createApp();

  try {
    const onboarding = await onboardTenant(app, "read-model");
    const service = await createService(app, onboarding.session.token, {
      nome: "Corte Recorrente",
      duracaoMin: 45,
      precoBase: 65,
      exigeSinal: false
    });
    const professional = await createProfessional(app, onboarding.session.token, [service.id], {
      nome: "Ana Lima"
    });

    await setAvailability(
      app,
      onboarding.session.token,
      professional.id,
      Array.from({ length: 7 }, (_, weekday) => ({
        weekday,
        faixa: {
          startTime: "08:00",
          endTime: "18:00"
        }
      }))
    );

    const returningClient = await createClient(app, onboarding.session.token, {
      nome: "Cliente Retorno",
      email: "retorno@agendaai.test"
    });
    const inactiveClient = await createClient(app, onboarding.session.token, {
      nome: "Cliente Inativo",
      email: "inativo@agendaai.test"
    });
    const neverCompletedClient = await createClient(app, onboarding.session.token, {
      nome: "Cliente Novo",
      email: "novo@agendaai.test"
    });

    await createBooking(app, onboarding.session.token, {
      clientId: returningClient.id,
      serviceId: service.id,
      professionalId: professional.id,
      status: "concluido",
      ...buildIsoWindow(-20, 9, 30, 45)
    });
    await createBooking(app, onboarding.session.token, {
      clientId: returningClient.id,
      serviceId: service.id,
      professionalId: professional.id,
      status: "concluido",
      ...buildIsoWindow(-5, 9, 30, 45)
    });
    await createBooking(app, onboarding.session.token, {
      clientId: inactiveClient.id,
      serviceId: service.id,
      professionalId: professional.id,
      status: "concluido",
      ...buildIsoWindow(-50, 10, 15, 45)
    });
    await createBooking(app, onboarding.session.token, {
      clientId: neverCompletedClient.id,
      serviceId: service.id,
      professionalId: professional.id,
      status: "pendente",
      ...buildIsoWindow(-2, 11, 0, 45)
    });

    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/read-models/reports?range=30d&returnWindow=30d",
      headers: authHeaders(onboarding.session.token)
    });

    assert.equal(response.statusCode, 200);
    const payload = response.json();

    assert.equal(payload.current.bookingsCount, 3);
    assert.equal(payload.current.completedCount, 2);
    assert.equal(payload.current.recognizedRevenue, 130);
    assert.equal(payload.previous?.recognizedRevenue, 65);
    assert.equal(payload.services.length, 1);
    assert.equal(payload.professionals.length, 1);
    assert.equal(payload.clientRecurrence.returningCount, 1);
    assert.equal(payload.clientRecurrence.inactiveCount, 1);
    assert.equal(payload.clientRecurrence.neverCompletedCount, 1);
    assert.equal(payload.clientRecurrence.clientsWithRecurrence, 1);
    assert.equal(payload.clientRecurrence.averageRecurrenceDays, 15);
    assert.equal(
      payload.clientRecurrence.returnBuckets.find((item: { id: string }) => item.id === "return_0_30")
        ?.clientsCount,
      1
    );
    assert.equal(
      payload.clientRecurrence.returnBuckets.find((item: { id: string }) => item.id === "return_31_60")
        ?.clientsCount,
      1
    );
    assert.equal(
      payload.clientRecurrence.returnBuckets.find((item: { id: string }) => item.id === "never_completed")
        ?.clientsCount,
      1
    );
  } finally {
    await app.close();
  }
});

test("payment intent publica cria booking aguardando pagamento e retorna checkout pro", async () => {
  const app = await createApp(
    createFakeMercadoPagoGateway({
      createPreference(payload) {
        const metadata = payload.metadata as Record<string, string>;
        assert.equal(metadata.slug, "tenant-checkout");
        return {
          id: "pref-checkout-001",
          initPoint: "https://mercadopago.test/checkout/pref-checkout-001",
          sandboxInitPoint: "https://sandbox.mercadopago.test/checkout/pref-checkout-001"
        };
      }
    })
  );

  try {
    const onboarding = await onboardTenant(app, "checkout");

    const paymentSettingsResponse = await app.inject({
      method: "PUT",
      url: "/v1/admin/payment-settings",
      headers: authHeaders(onboarding.session.token),
      payload: {
        status: "active",
        checkoutMode: "checkout_pro",
        publicKey: "APP_USR-public-key",
        accessToken: "APP_USR-access-token",
        notificationUrl: "https://agendaai.test/api/webhooks/mercado-pago",
        backUrls: {
          success: "https://agendaai.test/tenant-checkout",
          pending: "https://agendaai.test/tenant-checkout",
          failure: "https://agendaai.test/tenant-checkout"
        },
        autoReturn: "approved",
        binaryMode: true,
        defaultInstallments: 1,
        expirationMinutes: 45
      }
    });
    assert.equal(paymentSettingsResponse.statusCode, 200);

    const service = await createService(app, onboarding.session.token, {
      nome: "Coloracao Premium",
      duracaoMin: 60,
      precoBase: 180,
      paymentPolicy: {
        collectionMode: "deposit",
        checkoutMode: "checkout_pro",
        chargeType: "percentage",
        percentage: 30,
        currencyId: "BRL",
        acceptedMethods: ["pix", "credit_card"],
        capture: true
      }
    });

    const professional = await createProfessional(app, onboarding.session.token, [service.id], {
      nome: "Ana Lima"
    });

    await setAvailability(app, onboarding.session.token, professional.id, [
      {
        weekday: 5,
        faixa: {
          startTime: "09:00",
          endTime: "12:00"
        }
      }
    ]);

    const response = await app.inject({
      method: "POST",
      url: `/v1/public/tenants/${onboarding.tenant.slug}/payment-intents`,
      payload: {
        serviceId: service.id,
        professionalId: professional.id,
        startAt: "2026-03-20T09:00:00-03:00",
        endAt: "2026-03-20T10:00:00-03:00",
        client: {
          nome: "Julia Ramos",
          telefone: "11977776666",
          email: "julia@agendaai.test",
          origem: "instagram"
        }
      }
    });

    assert.equal(response.statusCode, 201);
    const payload = response.json();
    assert.equal(payload.booking.status, "aguardando pagamento");
    assert.equal(payload.paymentIntent.preferenceId, "pref-checkout-001");
    assert.equal(
      payload.paymentIntent.initPoint,
      "https://mercadopago.test/checkout/pref-checkout-001"
    );
  } finally {
    await app.close();
  }
});

test("sync e webhook reconciliam pagamento aprovado e confirmam booking", async () => {
  let externalReference = "";

  const app = await createApp(
    createFakeMercadoPagoGateway({
      createPreference(payload) {
        externalReference = String(payload.external_reference);
        return {
          id: "pref-checkout-002",
          initPoint: "https://mercadopago.test/checkout/pref-checkout-002"
        };
      },
      getPayment(paymentId) {
        return {
          id: paymentId,
          status: "approved",
          externalReference
        };
      }
    })
  );

  try {
    const onboarding = await onboardTenant(app, "checkout-sync");

    await app.inject({
      method: "PUT",
      url: "/v1/admin/payment-settings",
      headers: authHeaders(onboarding.session.token),
      payload: {
        status: "active",
        checkoutMode: "checkout_pro",
        publicKey: "APP_USR-public-key",
        accessToken: "APP_USR-access-token",
        notificationUrl: "https://agendaai.test/api/webhooks/mercado-pago",
        backUrls: {
          success: "https://agendaai.test/tenant-checkout-sync",
          pending: "https://agendaai.test/tenant-checkout-sync",
          failure: "https://agendaai.test/tenant-checkout-sync"
        },
        autoReturn: "approved",
        binaryMode: true,
        defaultInstallments: 1,
        expirationMinutes: 45
      }
    });

    const service = await createService(app, onboarding.session.token, {
      nome: "Escova Glow",
      duracaoMin: 45,
      precoBase: 120,
      paymentPolicy: {
        collectionMode: "deposit",
        checkoutMode: "checkout_pro",
        chargeType: "percentage",
        percentage: 50,
        currencyId: "BRL",
        acceptedMethods: ["pix"],
        capture: true
      }
    });

    const professional = await createProfessional(app, onboarding.session.token, [service.id], {
      nome: "Bianca"
    });

    await setAvailability(app, onboarding.session.token, professional.id, [
      {
        weekday: 5,
        faixa: {
          startTime: "10:00",
          endTime: "13:00"
        }
      }
    ]);

    const paymentIntentResponse = await app.inject({
      method: "POST",
      url: `/v1/public/tenants/${onboarding.tenant.slug}/payment-intents`,
      payload: {
        serviceId: service.id,
        professionalId: professional.id,
        startAt: "2026-03-20T10:00:00-03:00",
        endAt: "2026-03-20T10:45:00-03:00",
        client: {
          nome: "Paula Gomes",
          telefone: "11966665555",
          email: "paula@agendaai.test",
          origem: "google"
        }
      }
    });

    assert.equal(paymentIntentResponse.statusCode, 201);
    const created = paymentIntentResponse.json();

    const adminPaymentIntentsResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/payment-intents",
      headers: authHeaders(onboarding.session.token)
    });

    assert.equal(adminPaymentIntentsResponse.statusCode, 200);
    assert.equal(adminPaymentIntentsResponse.json().items.length, 1);
    assert.equal(adminPaymentIntentsResponse.json().items[0].bookingId, created.booking.id);

    const syncResponse = await app.inject({
      method: "POST",
      url: `/v1/public/tenants/${onboarding.tenant.slug}/payment-intents/${created.paymentIntent.id}/sync`,
      payload: {
        paymentId: "payment-123"
      }
    });

    assert.equal(syncResponse.statusCode, 200);
    assert.equal(syncResponse.json().item.status, "approved");
    assert.equal(syncResponse.json().booking.status, "confirmado");

    const adminSyncResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/payment-intents/${created.paymentIntent.id}/sync`,
      headers: authHeaders(onboarding.session.token)
    });

    assert.equal(adminSyncResponse.statusCode, 200);
    assert.equal(adminSyncResponse.json().item.status, "approved");
    assert.equal(adminSyncResponse.json().booking.status, "confirmado");

    const webhookResponse = await app.inject({
      method: "POST",
      url: `/v1/webhooks/mercado-pago?tenantId=${onboarding.tenant.id}&paymentIntentId=${created.paymentIntent.id}`,
      payload: {
        action: "payment.updated",
        data: {
          id: "payment-123"
        },
        id: "webhook-1",
        type: "payment"
      }
    });

    assert.equal(webhookResponse.statusCode, 200);
    assert.equal(webhookResponse.json().item.status, "approved");
  } finally {
    await app.close();
  }
});

test("sync encontra pagamento por external reference quando paymentId ainda nao foi salvo", async () => {
  let externalReference = "";

  const app = await createApp(
    createFakeMercadoPagoGateway({
      createPreference(payload) {
        externalReference = String(payload.external_reference);
        return {
          id: "pref-checkout-003",
          initPoint: "https://mercadopago.test/checkout/pref-checkout-003"
        };
      },
      getPayment() {
        throw new Error("getPayment should not be called in external reference sync.");
      },
      findPaymentByExternalReference(candidateExternalReference) {
        if (candidateExternalReference !== externalReference) {
          return undefined;
        }

        return {
          id: "payment-search-001",
          status: "approved",
          externalReference: candidateExternalReference
        };
      }
    })
  );

  try {
    const onboarding = await onboardTenant(app, "checkout-search");

    await app.inject({
      method: "PUT",
      url: "/v1/admin/payment-settings",
      headers: authHeaders(onboarding.session.token),
      payload: {
        status: "active",
        checkoutMode: "checkout_pro",
        publicKey: "APP_USR-public-key",
        accessToken: "APP_USR-access-token",
        notificationUrl: "https://agendaai.test/api/webhooks/mercado-pago",
        backUrls: {
          success: "https://agendaai.test/tenant-checkout-search",
          pending: "https://agendaai.test/tenant-checkout-search",
          failure: "https://agendaai.test/tenant-checkout-search"
        },
        autoReturn: "approved",
        binaryMode: true,
        defaultInstallments: 1,
        expirationMinutes: 45
      }
    });

    const service = await createService(app, onboarding.session.token, {
      nome: "Manicure Completa",
      duracaoMin: 60,
      precoBase: 150,
      paymentPolicy: {
        collectionMode: "deposit",
        checkoutMode: "checkout_pro",
        chargeType: "percentage",
        percentage: 40,
        currencyId: "BRL",
        acceptedMethods: ["pix", "credit_card"],
        capture: true
      }
    });

    const professional = await createProfessional(app, onboarding.session.token, [service.id], {
      nome: "Rafaela"
    });

    await setAvailability(app, onboarding.session.token, professional.id, [
      {
        weekday: 1,
        faixa: {
          startTime: "09:00",
          endTime: "12:00"
        }
      }
    ]);

    const paymentIntentResponse = await app.inject({
      method: "POST",
      url: `/v1/public/tenants/${onboarding.tenant.slug}/payment-intents`,
      payload: {
        serviceId: service.id,
        professionalId: professional.id,
        startAt: "2026-03-23T09:00:00-03:00",
        endAt: "2026-03-23T10:00:00-03:00",
        client: {
          nome: "Marina Teixeira",
          telefone: "11933334444",
          email: "marina@agendaai.test",
          origem: "instagram"
        }
      }
    });

    assert.equal(paymentIntentResponse.statusCode, 201);
    const created = paymentIntentResponse.json();

    const syncResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/payment-intents/${created.paymentIntent.id}/sync`,
      headers: authHeaders(onboarding.session.token)
    });

    assert.equal(syncResponse.statusCode, 200);
    assert.equal(syncResponse.json().item.status, "approved");
    assert.equal(syncResponse.json().item.paymentId, "payment-search-001");
    assert.equal(syncResponse.json().booking.status, "confirmado");
  } finally {
    await app.close();
  }
});
