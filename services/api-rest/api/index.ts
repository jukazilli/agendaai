import type { IncomingMessage, ServerResponse } from "node:http";

import { handleVercelApiRestRequest } from "../src/vercel-handler";

export const config = {
  maxDuration: 30
};

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    await handleVercelApiRestRequest(request, response);
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
