import assert from "node:assert/strict";
import test from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApiRestApp } from "./index";

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

async function createApp(): Promise<FastifyInstance> {
  const app = buildApiRestApp();
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
  } finally {
    await app.close();
  }
});
