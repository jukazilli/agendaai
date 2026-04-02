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
  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const finalize = (callback: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      callback();
    };

    const cleanup = (): void => {
      response.off("finish", onFinish);
      response.off("close", onClose);
      response.off("error", onError);
    };

    const onFinish = (): void => {
      finalize(resolve);
    };

    const onClose = (): void => {
      finalize(resolve);
    };

    const onError = (error: Error): void => {
      finalize(() => reject(error));
    };

    response.once("finish", onFinish);
    response.once("close", onClose);
    response.once("error", onError);

    try {
      app.server.emit("request", request, response);
    } catch (error) {
      finalize(() => reject(error instanceof Error ? error : new Error("vercel_request_dispatch_failed")));
    }
  });
}
