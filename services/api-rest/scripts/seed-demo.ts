import { PostgresApiRestStore } from "../src/postgres-store";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed demo data.");
  }

  const store = new PostgresApiRestStore({ connectionString });
  const slug = process.env.AGENDAAI_DEMO_SLUG ?? "demo-studio";

  let tenant = await store.getTenantBySlug(slug);

  if (!tenant) {
    const onboarding = await store.createTenant({
      version: "v1",
      nome: "Demo Studio",
      slug,
      timezone: "America/Sao_Paulo",
      admin: {
        nome: "Owner Demo",
        email: "owner@agendaai.demo",
        telefone: "11999990000",
        senha: "agendaai-demo",
        aceitarTermos: true
      }
    });

    tenant = onboarding.tenant;
    console.log(`Tenant demo criado: ${tenant.slug}`);
  } else {
    console.log(`Tenant demo reutilizado: ${tenant.slug}`);
  }

  const existingServices = await store.listServices(tenant.id);
  const corteRapido =
    existingServices.find((service) => service.nome === "Corte Rapido") ??
    (await store.createService({
      version: "v1",
      tenantId: tenant.id,
      nome: "Corte Rapido",
      duracaoMin: 30,
      precoBase: 65,
      exigeSinal: false
    }));

  const escova =
    existingServices.find((service) => service.nome === "Escova") ??
    (await store.createService({
      version: "v1",
      tenantId: tenant.id,
      nome: "Escova",
      duracaoMin: 45,
      precoBase: 90,
      exigeSinal: false
    }));

  const existingProfessionals = await store.listProfessionals(tenant.id);
  const professional =
    existingProfessionals.find((item) => item.nome === "Ana Lima") ??
    (await store.createProfessional({
      version: "v1",
      tenantId: tenant.id,
      nome: "Ana Lima",
      especialidades: [corteRapido.id, escova.id]
    }));

  const existingRules = await store.listAvailabilityRules(tenant.id, professional.id);
  if (existingRules.length === 0) {
    await store.replaceAvailabilityRules(tenant.id, professional.id, [
      { weekday: 1, faixa: { startTime: "09:00", endTime: "18:00" } },
      { weekday: 2, faixa: { startTime: "09:00", endTime: "18:00" } },
      { weekday: 3, faixa: { startTime: "09:00", endTime: "18:00" } },
      { weekday: 4, faixa: { startTime: "09:00", endTime: "18:00" } },
      { weekday: 5, faixa: { startTime: "09:00", endTime: "18:00" } },
      { weekday: 6, faixa: { startTime: "09:00", endTime: "13:00" } }
    ]);
  }

  console.log(`Demo pronta em /${tenant.slug}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
