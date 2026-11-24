import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_BASE =
  process.env.ERP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://erp.devrious.lk/api";

function resolveUpstreamBase(req: NextRequest): string {
  const override = req.headers.get("x-bizzrious-api-base")?.trim();
  if (override) {
    try {
      const parsed = new URL(override);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return override.replace(/\/+$/, "");
      }
    } catch {
      // Ignore invalid override header and fall back to configured default
    }
  }
  return DEFAULT_API_BASE.replace(/\/+$/, "");
}

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const upstreamBase = resolveUpstreamBase(req);

  const joined = (path || [])
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");
  const search = req.nextUrl.search || "";
  // Django REST Framework requires trailing slash before query parameters
  const targetUrl = joined
    ? `${upstreamBase}/${joined}/${search}`
    : `${upstreamBase}/${search}`;

  const forwardHeaders = new Headers();
  const authHeader = req.headers.get("authorization");
  if (authHeader) forwardHeaders.set("authorization", authHeader);

  const contentType = req.headers.get("content-type");
  if (contentType) forwardHeaders.set("content-type", contentType);

  const accept = req.headers.get("accept");
  forwardHeaders.set("accept", accept || "application/json");

  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const buf = await req.arrayBuffer();
      if (buf.byteLength > 0) {
        body = buf;
      }
    } catch {
      // Empty body
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (upstreamRes.status === 204 || upstreamRes.status === 304 || req.method === "HEAD") {
      return new NextResponse(null, { status: upstreamRes.status });
    }

    const resBuffer = await upstreamRes.arrayBuffer();
    const resHeaders = new Headers();
    const upstreamCt = upstreamRes.headers.get("content-type");
    if (upstreamCt) resHeaders.set("content-type", upstreamCt);
    const contentDisposition = upstreamRes.headers.get("content-disposition");
    if (contentDisposition) {
      resHeaders.set("content-disposition", contentDisposition);
    }

    return new NextResponse(resBuffer, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  } catch (err) {
    clearTimeout(timeout);
    const message =
      err instanceof Error && err.name === "AbortError"
        ? `Request timed out while contacting Bizzrious ERP API at ${upstreamBase}.`
        : `Unable to reach Bizzrious ERP API server at ${upstreamBase}. Check server availability or update API Server URL in Settings.`;
    return NextResponse.json(
      {
        detail: message,
        upstream: upstreamBase,
        target: targetUrl,
      },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context);
}

export async function HEAD(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Bizzrious-Api-Base",
    },
  });
}
