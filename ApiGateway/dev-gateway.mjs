import { createServer } from "node:http";
import { Buffer } from "node:buffer";

const PORT = Number(process.env.GATEWAY_PORT || 8080);
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://127.0.0.1:8000";
const EARNINGS_SERVICE_URL = process.env.EARNINGS_SERVICE_URL || "http://127.0.0.1:3001";
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || "http://127.0.0.1:8003";
const ANOMALY_SERVICE_URL = process.env.ANOMALY_SERVICE_URL || "http://127.0.0.1:8002";
const GRIEVANCE_SERVICE_URL = process.env.GRIEVANCE_SERVICE_URL || "http://127.0.0.1:3002";
const CERTIFICATE_SERVICE_URL = process.env.CERTIFICATE_SERVICE_URL || "http://127.0.0.1:8004";
const INTROSPECT_URL = process.env.AUTH_INTROSPECT_URL || `${AUTH_SERVICE_URL}/api/auth/introspect`;

const ROUTES = [
  { prefix: "/api/auth/", target: AUTH_SERVICE_URL, requiresAuth: false },
  { prefix: "/api/earnings/", target: EARNINGS_SERVICE_URL, requiresAuth: true },
  { prefix: "/api/analytics/", target: ANALYTICS_SERVICE_URL, requiresAuth: true },
  { prefix: "/api/anomaly/", target: ANOMALY_SERVICE_URL, requiresAuth: true },
  { prefix: "/api/grievances/", target: GRIEVANCE_SERVICE_URL, requiresAuth: true },
  { prefix: "/api/certificate/", target: CERTIFICATE_SERVICE_URL, requiresAuth: true },
];

const FORWARDED_USER_HEADERS = ["x-user-id", "x-user-role", "x-user-email", "x-user-status"];
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] || "Authorization,Content-Type"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    req.headers["access-control-request-method"] || "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
}

function matchesRoutePrefix(pathname, prefix) {
  const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  return pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`);
}

function resolveRoute(pathname) {
  return ROUTES.find((route) => matchesRoutePrefix(pathname, route.prefix));
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function buildForwardHeaders(reqHeaders, userHeaders = {}) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(reqHeaders)) {
    if (!value || HOP_BY_HOP_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === "host") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else {
      headers.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(userHeaders)) {
    headers.set(key, value);
  }

  return headers;
}

async function introspectToken(authorization) {
  if (!authorization) {
    return {
      ok: false,
      status: 401,
      body: Buffer.from(JSON.stringify({ detail: "Missing Authorization header" })),
      contentType: "application/json",
    };
  }

  const authResponse = await fetch(INTROSPECT_URL, {
    method: "GET",
    headers: {
      authorization,
    },
  });

  const body = Buffer.from(await authResponse.arrayBuffer());

  if (!authResponse.ok) {
    return {
      ok: false,
      status: authResponse.status,
      body,
      contentType: authResponse.headers.get("content-type") || "application/json",
    };
  }

  const forwardedHeaders = {};
  for (const headerName of FORWARDED_USER_HEADERS) {
    const value = authResponse.headers.get(headerName);
    if (value) {
      forwardedHeaders[headerName] = value;
    }
  }

  return { ok: true, forwardedHeaders };
}

async function proxyRequest(req, res, route, extraHeaders = {}) {
  const requestUrl = new URL(req.url || "/", route.target).toString();
  const method = req.method || "GET";

  const hasBody = !["GET", "HEAD"].includes(method.toUpperCase());
  const requestBody = hasBody ? await readRequestBody(req) : undefined;

  const headers = buildForwardHeaders(req.headers, extraHeaders);
  if (req.headers.host && !headers.has("x-forwarded-host")) {
    headers.set("x-forwarded-host", req.headers.host);
  }
  if (!headers.has("x-forwarded-proto")) {
    headers.set("x-forwarded-proto", "http");
  }
  if (!requestBody || requestBody.length === 0) {
    headers.delete("content-length");
  }

  const upstreamResponse = await fetch(requestUrl, {
    method,
    headers,
    body: requestBody && requestBody.length > 0 ? requestBody : undefined,
    redirect: "manual",
  });

  setCorsHeaders(req, res);
  res.statusCode = upstreamResponse.status;

  for (const [headerKey, headerValue] of upstreamResponse.headers.entries()) {
    if (HOP_BY_HOP_HEADERS.has(headerKey.toLowerCase())) {
      continue;
    }
    if (headerKey.toLowerCase() === "content-length") {
      continue;
    }
    res.setHeader(headerKey, headerValue);
  }

  const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());
  res.setHeader("Content-Length", String(responseBody.length));
  res.end(responseBody);
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      setCorsHeaders(req, res);
      res.statusCode = 204;
      res.end();
      return;
    }

    if (requestUrl.pathname === "/health") {
      setCorsHeaders(req, res);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "ok", service: "api-gateway" }));
      return;
    }

    const route = resolveRoute(requestUrl.pathname);
    if (!route) {
      setCorsHeaders(req, res);
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ detail: "Route not found in API gateway" }));
      return;
    }

    if (!route.requiresAuth) {
      await proxyRequest(req, res, route);
      return;
    }

    const authResult = await introspectToken(req.headers.authorization);
    if (!authResult.ok) {
      setCorsHeaders(req, res);
      res.statusCode = authResult.status;
      res.setHeader("Content-Type", authResult.contentType || "application/json");
      res.end(authResult.body);
      return;
    }

    await proxyRequest(req, res, route, authResult.forwardedHeaders);
  } catch (error) {
    setCorsHeaders(req, res);
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        detail: "Gateway upstream error",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    );
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`FairGig API gateway listening on http://0.0.0.0:${PORT}`);
});
