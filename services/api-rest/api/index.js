import { buildApiRestApp, createConfiguredStore } from "../dist/index.js";

export const config = {
  maxDuration: 30
};

let appPromise;

async function getOrCreateVercelApp() {
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

export default async function handler(request, response) {
  try {
    const app = await getOrCreateVercelApp();
    await new Promise((resolve, reject) => {
      let settled = false;

      const finalize = (callback) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        callback();
      };

      const cleanup = () => {
        response.off("finish", onFinish);
        response.off("close", onClose);
        response.off("error", onError);
      };

      const onFinish = () => {
        finalize(resolve);
      };

      const onClose = () => {
        finalize(resolve);
      };

      const onError = (error) => {
        finalize(() => reject(error));
      };

      response.once("finish", onFinish);
      response.once("close", onClose);
      response.once("error", onError);

      try {
        app.server.emit("request", request, response);
      } catch (error) {
        finalize(() =>
          reject(error instanceof Error ? error : new Error("vercel_request_dispatch_failed"))
        );
      }
    });
  } catch (error) {
    console.error("vercel_api_rest_handler_failed", error);

    if (response.headersSent) {
      if (!response.writableEnded) {
        response.end();
      }
      return;
    }

    response.statusCode = 500;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(
      JSON.stringify({
        error: "vercel_handler_failed",
        message: error instanceof Error ? error.message : "unknown_error"
      })
    );
  }
}
