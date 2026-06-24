import { test, expect } from "@playwright/test";
import {
  prepareHeadersUser,
  getResponseHeaders,
  checkHeader,
  checkCacheControl,
  checkReferrerPolicy,
  checkPermissionsPolicy,
  HEADER_CHECKS,
  type HeaderResult,
} from "./headers.robot";

type EndpointConfig = {
  path: string;
  name: string;
  requiresAuth: boolean;
  isFrontend: boolean;
};

const BACKEND_ENDPOINTS: EndpointConfig[] = [
  { path: "/api/health", name: "GET /api/health", requiresAuth: false, isFrontend: false },
  { path: "/api/auth/login", name: "POST /api/auth/login", requiresAuth: false, isFrontend: false },
  { path: "/api/projetos", name: "GET /api/projetos", requiresAuth: true, isFrontend: false },
  { path: "/api/usuarios/me", name: "GET /api/usuarios/me", requiresAuth: true, isFrontend: false },
];

test.describe("security headers", () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const user = await prepareHeadersUser(request);
    token = user.token;
  });

  for (const endpoint of BACKEND_ENDPOINTS) {
    test.describe(endpoint.name, () => {
      let headers: Record<string, string | null>;

      test.beforeAll(async ({ request }) => {
        const authToken = endpoint.requiresAuth ? token : null;
        headers = await getResponseHeaders(request, authToken, endpoint.path);
      });

      for (const check of HEADER_CHECKS) {
        if (check.name === "cache-control") continue;
        if (check.name === "referrer-policy") continue;
        if (check.name === "permissions-policy") continue;

        const effectiveCheck = (!endpoint.isFrontend && check.name === "content-security-policy")
          ? { ...check, severity: "Warning" as const, description: "CSP opcional em endpoints API JSON (Warning)" }
          : check;

        test(`${effectiveCheck.name}: ${effectiveCheck.description}`, async () => {
          const result = checkHeader(effectiveCheck.name, headers[effectiveCheck.name], effectiveCheck);
          if (result.severity === "Critical") {
            expect(result.message, `CRITICAL: ${result.message}`).toBeFalsy();
          }
        });
      }

      test("cache-control: validação de cache", async () => {
        const result = checkCacheControl(headers["cache-control"], endpoint.requiresAuth);
        if (result.severity === "Critical") {
          expect(result.message, `CRITICAL: ${result.message}`).toBeFalsy();
        }
      });

      test("referrer-policy: validação de referrer", async () => {
        const result = checkReferrerPolicy(headers["referrer-policy"]);
        if (result.severity === "Critical") {
          expect(result.message, `CRITICAL: ${result.message}`).toBeFalsy();
        }
      });

      test("permissions-policy: validação de permissões", async () => {
        const result = checkPermissionsPolicy(headers["permissions-policy"]);
        if (result.severity === "Critical") {
          expect(result.message, `CRITICAL: ${result.message}`).toBeFalsy();
        }
      });
    });
  }
});

test.describe("security headers report", () => {
  let token: string;
  let allResults: Array<{ endpoint: string; results: HeaderResult[] }> = [];

  test.beforeAll(async ({ request }) => {
    const user = await prepareHeadersUser(request);
    token = user.token;

    for (const endpoint of BACKEND_ENDPOINTS) {
      const authToken = endpoint.requiresAuth ? token : null;
      const headers = await getResponseHeaders(request, authToken, endpoint.path);
      const results: HeaderResult[] = [];

      for (const check of HEADER_CHECKS) {
        const effectiveCheck = (!endpoint.isFrontend && check.name === "content-security-policy")
          ? { ...check, severity: "Warning" as const }
          : check;

        if (check.name === "cache-control") {
          results.push(checkCacheControl(headers[check.name], endpoint.requiresAuth));
        } else if (check.name === "referrer-policy") {
          results.push(checkReferrerPolicy(headers[check.name]));
        } else if (check.name === "permissions-policy") {
          results.push(checkPermissionsPolicy(headers[check.name]));
        } else {
          results.push(checkHeader(check.name, headers[check.name], effectiveCheck));
        }
      }

      allResults.push({ endpoint: endpoint.name, results });
    }
  });

  test("gera relatório de headers para todos os endpoints", async () => {
    expect(allResults.length).toBe(BACKEND_ENDPOINTS.length);

    for (const { endpoint, results } of allResults) {
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(result.severity).toMatch(/^(OK|Warning|Critical)$/);
      }
    }
  });

  test("nenhum header crítico ausente em rotas autenticadas", async () => {
    const authenticatedEndpoints = allResults.filter((_, i) => BACKEND_ENDPOINTS[i].requiresAuth);
    for (const { endpoint, results } of authenticatedEndpoints) {
      const criticalMissing = results.filter(
        (r) => r.severity === "Critical" && r.status === "missing"
      );
      expect(
        criticalMissing.length,
        `${endpoint} tem ${criticalMissing.length} headers críticos ausentes: ${criticalMissing.map((r) => r.header).join(", ")}`,
      ).toBe(0);
    }
  });
});
