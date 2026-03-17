import { pathToFileURL } from "node:url";

import { buildApiRestApp, type BuildApiRestAppOptions } from "./app";
import { ApiRestStore } from "./store";

export { buildApiRestApp, type BuildApiRestAppOptions } from "./app";
export {
  ApiRestStore,
  type AdminSessionRecord,
  type PublicAvailabilitySlot,
  type PublicCatalogSnapshot,
  type PublicTenantProfile
} from "./store";

export const apiRestFoundation = {
  serviceName: "@agendaai/api-rest",
  status: "implemented",
  nextStep: "B-07 abrir o booking publico em cima do catalogo, equipe e slots ja materializados."
} as const;

export async function startApiRestServer(
  options: BuildApiRestAppOptions & { readonly host?: string; readonly port?: number } = {}
) {
  const app = buildApiRestApp({
    logger: options.logger ?? true,
    store: options.store ?? new ApiRestStore()
  });

  const port = options.port ?? Number(process.env.PORT ?? 3333);
  const host = options.host ?? process.env.HOST ?? "0.0.0.0";

  await app.listen({ host, port });
  return app;
}

const mainModule = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;

if (mainModule === import.meta.url) {
  startApiRestServer().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
