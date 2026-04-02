import type { IncomingMessage, ServerResponse } from "node:http";

import type { FastifyInstance } from "fastify";

import { buildApiRestApp } from "./app";
import { createConfiguredStore } from "./postgres-store";

let appPromise: Promise<FastifyInstance> | undefined;

async function getOrCreateVercelApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = (async () => {
      try {
        const app = buildApiRestApp({
          logger: false,
          store: createConfiguredStore()
        });
        await app.ready();
        return app;
      } catch (error) {
        appPromise = undefined;
        throw error;
      }
    })();
  }

  return await appPromise;
}

export async function handleVercelApiRestRequest(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const app = await getOrCreateVercelApp();
  app.server.emit("request", request, response);
}
