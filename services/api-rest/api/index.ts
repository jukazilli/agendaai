import type { IncomingMessage, ServerResponse } from "node:http";

import { handleVercelApiRestRequest } from "../src/vercel-handler";

export const config = {
  maxDuration: 30
};

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  await handleVercelApiRestRequest(request, response);
}
