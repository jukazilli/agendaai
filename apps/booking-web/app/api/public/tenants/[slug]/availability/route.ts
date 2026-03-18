import { NextRequest, NextResponse } from "next/server";

import { resolvePublicApiUrl } from "../../../../../../lib/public-api";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const query = request.nextUrl.searchParams.toString();
  const suffix = query.length > 0 ? `?${query}` : "";

  const response = await fetch(
    resolvePublicApiUrl(`/v1/public/tenants/${slug}/availability${suffix}`),
    {
      cache: "no-store"
    }
  );

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json"
    }
  });
}
