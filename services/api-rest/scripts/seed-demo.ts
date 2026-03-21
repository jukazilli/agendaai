import { PostgresApiRestStore } from "../src/postgres-store";
import { seedDemoTenant } from "./seed-demo-lib";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed demo data.");
  }

  const store = new PostgresApiRestStore({ connectionString });
  try {
    const slug = process.env.AGENDAAI_DEMO_SLUG ?? "demo-studio";
    const existingTenant = await store.getTenantBySlug(slug);
    const seeded = await seedDemoTenant(store, { slug });
    console.log(
      existingTenant
        ? `Tenant demo reutilizado: ${seeded.tenant.slug}`
        : `Tenant demo criado: ${seeded.tenant.slug}`
    );
    console.log(`Demo pronta em /${seeded.tenant.slug}`);
  } finally {
    await store.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
