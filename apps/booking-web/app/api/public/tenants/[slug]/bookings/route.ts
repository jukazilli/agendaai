import { NextRequest, NextResponse } from "next/server";

import { resolvePublicApiUrl } from "../../../../../../lib/public-api";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const body = await request.text();

  const response = await fetch(resolvePublicApiUrl(`/v1/public/tenants/${slug}/bookings`), {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body,
    cache: "no-store"
  });

  const responseBody = await response.text();
  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json"
    }
  });
}
