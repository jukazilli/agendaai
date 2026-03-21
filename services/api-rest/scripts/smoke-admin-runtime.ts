import { buildApiRestApp } from "../src/app";
import { ApiRestStore } from "../src/store";

type JsonRecord = Record<string, unknown>;

async function main() {
  const app = buildApiRestApp({
    logger: false,
    store: new ApiRestStore()
  });

  try {
    const stamp = Date.now();
    const slug = `smoke-runtime-${stamp}`;
    const email = `owner.runtime.${stamp}@agendaai.test`;

    const onboarding = await injectJson(app, "POST", "/v1/onboarding/tenants", {
      nome: `Smoke Runtime ${stamp}`,
      slug,
      timezone: "America/Sao_Paulo",
      admin: {
        nome: "Owner Runtime QA",
        email,
        telefone: "11999990000",
        senha: "agendaai-demo",
        aceitarTermos: true
      }
    });

    const token = String((onboarding as JsonRecord).session?.token);
    assertTruthy(token, "missing_admin_token");

    const serviceA = await injectJson(app, "POST", "/v1/admin/services", {
      nome: `Corte Runtime ${stamp}`,
      duracaoMin: 30,
      precoBase: 65,
      exigeSinal: false
    }, token);

    const serviceB = await injectJson(app, "POST", "/v1/admin/services", {
      nome: `Escova Runtime ${stamp}`,
      duracaoMin: 45,
      precoBase: 90,
      exigeSinal: true
    }, token);

    const professional = await injectJson(app, "POST", "/v1/admin/professionals", {
      nome: `Ana Runtime ${stamp}`,
      especialidades: [serviceA.id, serviceB.id]
    }, token);

    await injectJson(
      app,
      "PUT",
      `/v1/admin/professionals/${professional.id}/availability`,
      {
        rules: [
          { weekday: 1, faixa: { startTime: "09:00", endTime: "18:00" } },
          { weekday: 2, faixa: { startTime: "09:00", endTime: "18:00" } },
          { weekday: 3, faixa: { startTime: "09:00", endTime: "18:00" } },
          { weekday: 4, faixa: { startTime: "09:00", endTime: "18:00" } },
          { weekday: 5, faixa: { startTime: "09:00", endTime: "18:00" } }
        ]
      },
      token
    );

    const firstSlot = await findFirstSlot(app, slug, serviceA.id as string, professional.id as string);
    const booking = await injectJson(app, "POST", `/v1/public/tenants/${slug}/bookings`, {
      serviceId: serviceA.id,
      professionalId: professional.id,
      startAt: firstSlot.startAt,
      endAt: firstSlot.endAt,
      client: {
        nome: `Cliente Runtime ${stamp}`,
        telefone: `11${String(stamp).slice(-9)}`,
        email: `cliente.runtime.${stamp}@agendaai.test`,
        origem: "google"
      }
    });

    const services = await injectJson(app, "GET", "/v1/admin/services", undefined, token);
    const professionals = await injectJson(app, "GET", "/v1/admin/professionals", undefined, token);
    const clients = await injectJson(app, "GET", "/v1/admin/clients", undefined, token);
    const catalog = await injectJson(app, "GET", "/v1/admin/reporting/catalog", undefined, token);

    const definitionCodes = [
      "RPT-EXECUTIVE",
      "RPT-REVENUE",
      "RPT-TEAM",
      "RPT-OPERATIONS",
      "RPT-RETENTION",
      "RPT-WEEK",
      "RPT-MONTH",
      "RPT-SERVICE-CATALOG",
      "RPT-PROFESSIONAL-REGISTRY",
      "RPT-PAYMENTS"
    ];

    const executions = [];
    for (const code of definitionCodes) {
      const definition = (catalog.systemDefinitions as JsonRecord[]).find(
        (entry) => entry.code === code
      );
      assertTruthy(definition, `missing_definition_${code}`);
      const execution = await injectJson(
        app,
        "POST",
        `/v1/admin/report-definitions/${definition.id}/execute`,
        undefined,
        token
      );
      executions.push({
        code,
        base: definition.base,
        previewExpression: execution.previewExpression,
        kpis: Array.isArray(execution.kpis) ? execution.kpis.length : 0,
        rows: execution.table?.rows ? execution.table.rows.length : 0
      });
    }

    const executiveDefinition = (catalog.systemDefinitions as JsonRecord[]).find(
      (entry) => entry.code === "RPT-EXECUTIVE"
    );
    assertTruthy(executiveDefinition, "missing_executive_definition");

    const savedDefinition = await injectJson(
      app,
      "POST",
      "/v1/admin/report-definitions",
      executiveDefinition,
      token,
      [201]
    );
    const savedClone = await injectJson(
      app,
      "POST",
      "/v1/admin/report-definitions",
      {
        ...savedDefinition,
        name: `${savedDefinition.name} Clone`,
        description: "Clone funcional do modelo salvo",
        authorName: "Smoke Runtime"
      },
      token,
      [201]
    );
    const savedDefinitions = await injectJson(app, "GET", "/v1/admin/report-definitions", undefined, token);

    const invalidServicePatch = await injectJson(
      app,
      "PATCH",
      `/v1/admin/services/${serviceA.id}`,
      { status: "invalid" },
      token,
      [400]
    );
    const invalidProfessionalPatch = await injectJson(
      app,
      "PATCH",
      `/v1/admin/professionals/${professional.id}`,
      { status: "invalid" },
      token,
      [400]
    );

    console.log(
      JSON.stringify(
        {
          tenant: {
            slug,
            email
          },
          cadastros: {
            services: services.items.length,
            professionals: professionals.items.length,
            clients: clients.items.length,
            serviceCodes: services.items.map((item: JsonRecord) => item.codigo),
            professionalCodes: professionals.items.map((item: JsonRecord) => item.codigo),
            clientCodes: clients.items.map((item: JsonRecord) => item.codigo)
          },
          bookingSmoke: {
            bookingId: booking.booking.id,
            clientId: booking.client.id
          },
          reports: {
            bases: catalog.baseOptions.map((item: JsonRecord) => item.id),
            systemDefinitions: catalog.systemDefinitions.map((item: JsonRecord) => item.code),
            executions,
            savedCount: savedDefinitions.items.length,
            savedCodes: savedDefinitions.items.map((item: JsonRecord) => item.code),
            clonedDefinitionCode: savedClone.code
          },
          enumValidation: {
            service: invalidServicePatch.error,
            professional: invalidProfessionalPatch.error
          }
        },
        null,
        2
      )
    );
  } finally {
    await app.close();
  }
}

async function findFirstSlot(
  app: ReturnType<typeof buildApiRestApp>,
  slug: string,
  serviceId: string,
  professionalId: string
) {
  const baseDate = new Date();
  for (let offset = 0; offset < 21; offset += 1) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + offset);
    const isoDate = date.toISOString().slice(0, 10);
    const availability = await injectJson(
      app,
      "GET",
      `/v1/public/tenants/${slug}/availability?serviceId=${serviceId}&professionalId=${professionalId}&date=${isoDate}`
    );
    if (Array.isArray(availability.items) && availability.items.length > 0) {
      return availability.items[0];
    }
  }
  throw new Error("availability_slot_not_found");
}

async function injectJson(
  app: ReturnType<typeof buildApiRestApp>,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  payload?: unknown,
  token?: string,
  acceptStatuses: number[] = [200, 201]
) {
  const response = await app.inject({
    method,
    url,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    payload
  });

  if (!acceptStatuses.includes(response.statusCode)) {
    throw new Error(`unexpected_status_${response.statusCode}_${method}_${url}_${response.body}`);
  }

  return response.body ? JSON.parse(response.body) : undefined;
}

function assertTruthy<T>(value: T, message: string): asserts value is Exclude<T, undefined | null | false | ""> {
  if (!value) {
    throw new Error(message);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
