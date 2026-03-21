import { Pool } from "pg";

import { PostgresApiRestStore } from "../src/postgres-store";
import { DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD, seedDemoTenant } from "./seed-demo-lib";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to reset staging.");
  }

  const slug = process.env.AGENDAAI_DEMO_SLUG ?? "demo-studio";
  const pool = new Pool({
    connectionString,
    max: 1
  });

  try {
    await pool.query("drop table if exists report_definitions");
    await pool.query("drop table if exists agendaai_runtime_snapshots");
  } finally {
    await pool.end();
  }

  const store = new PostgresApiRestStore({ connectionString });
  try {
    const seeded = await seedDemoTenant(store, { slug });
    const tenant = await store.getTenantBySlug(seeded.tenant.slug);
    const session = await store.login(DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD);

    if (!tenant) {
      throw new Error("staging_reset_failed_tenant_missing");
    }

    if (!session) {
      throw new Error("staging_reset_failed_login_missing");
    }

    console.log(`Staging resetado e seedado com sucesso para /${tenant.slug}`);
    console.log(`Owner demo validado: ${DEMO_OWNER_EMAIL}`);
  } finally {
    await store.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
