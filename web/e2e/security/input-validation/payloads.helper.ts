import { type APIRequestContext } from "@playwright/test";
import { API_URL } from "../../helpers/api.helper";
import { registerAndLogin, type AuthenticatedUser } from "../helpers/security.helper";

export async function prepareValidationUser(request: APIRequestContext): Promise<AuthenticatedUser> {
  return registerAndLogin(request, "validation-user");
}

const MALFORMED_JSON_PAYLOADS = [
  '{invalid}',
  '{"foo"',
  '{"titulo":',
  '{"titulo": "ok",}',
  '[1,2,3]',
  'null',
  '"just a string"',
  '123',
  'true',
];

export function malformedJsonPayloads(): string[] {
  return MALFORMED_JSON_PAYLOADS;
}

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '"><script>alert(1)</script>',
  "';alert(1)//",
  '<iframe src="javascript:alert(1)">',
  '<body onload=alert(1)>',
  '<<script>alert(1)//<</script>',
  '<img ""><script>alert(1)</script>',
  '<math><mtext><table><mglyph><svg><mtext><textarea><path id="</textarea><img onerror=alert(1) src=1>">',
];

export function xssPayloads(): string[] {
  return XSS_PAYLOADS;
}

const SQL_LIKE_PAYLOADS = [
  "' OR 1=1 --",
  "admin'--",
  "'; DROP TABLE usuarios; --",
  "' UNION SELECT * FROM usuarios --",
  "1' AND '1'='1",
  "1; DROP TABLE usuarios",
  "' OR ''='",
  "admin' OR '1'='1' --",
  "1' WAITFOR DELAY '0:0:5' --",
  "1' AND (SELECT COUNT(*) FROM usuarios) > 0 --",
];

export function sqlLikePayloads(): string[] {
  return SQL_LIKE_PAYLOADS;
}

export function invalidIds(): number[] {
  return [-1, 0, 999999999, 2147483647];
}

export function sendMalformedJson(request: APIRequestContext, path: string, rawBody: string) {
  return request.post(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    data: rawBody as unknown as object,
  });
}

export function sendMalformedJsonWithAuth(request: APIRequestContext, token: string, path: string, rawBody: string) {
  return request.post(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: rawBody as unknown as object,
  });
}

export function sendWrongContentType(request: APIRequestContext, token: string, path: string, contentType: string, body: string) {
  return request.post(`${API_URL}${path}`, {
    headers: {
      "Content-Type": contentType,
      Authorization: `Bearer ${token}`,
    },
    data: body,
  });
}

export function sendGetWithInvalidId(request: APIRequestContext, token: string, resourcePath: string, id: number) {
  return request.get(`${API_URL}${resourcePath}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function sendDeleteWithInvalidId(request: APIRequestContext, token: string, resourcePath: string, id: number) {
  return request.delete(`${API_URL}${resourcePath}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
