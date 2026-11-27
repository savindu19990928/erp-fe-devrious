import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API_BASE = (
  process.env.ERP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://erp.devrious.lk/api"
).replace(/\/+$/, "");

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;

  const joined = (path || [])
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");
  const search = req.nextUrl.search || "";
  // Django REST Framework requires trailing slash before query parameters
  const targetUrl = joined
    ? `${UPSTREAM_API_BASE}/${joined}/${search}`
    : `${UPSTREAM_API_BASE}/${search}`;

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
        ? "Request timed out while contacting Bizzrious ERP API server."
        : "Unable to reach Bizzrious ERP API server. Please verify server availability and try again.";
    return NextResponse.json(
      {
        detail: message,
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
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
