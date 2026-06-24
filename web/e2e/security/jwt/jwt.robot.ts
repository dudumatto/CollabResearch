import { expect, type APIRequestContext } from "@playwright/test";
import { registerAndLogin, type AuthenticatedUser } from "../helpers/security.helper";
import { API_URL } from "../../helpers/api.helper";

export type JwtScenario = {
  userA: AuthenticatedUser;
  userB: AuthenticatedUser;
};

export async function prepareJwtScenario(request: APIRequestContext): Promise<JwtScenario> {
  const userA = await registerAndLogin(request, "jwt-user-a");
  const userB = await registerAndLogin(request, "jwt-user-b");
  return { userA, userB };
}

export async function logout(request: APIRequestContext, token: string) {
  return request.post(`${API_URL}/api/auth/logout`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getMe(request: APIRequestContext, token: string) {
  return request.get(`${API_URL}/api/usuarios/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function requestWithToken(request: APIRequestContext, token: string, path: string) {
  return request.get(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function requestWithoutAuth(request: APIRequestContext, path: string) {
  return request.get(`${API_URL}${path}`);
}

export async function requestWithGarbageToken(request: APIRequestContext, path: string) {
  return request.get(`${API_URL}${path}`, {
    headers: { Authorization: "Bearer abc.def.ghi" },
  });
}

export async function requestWithTruncatedToken(request: APIRequestContext, token: string, path: string) {
  const truncated = token.slice(0, Math.floor(token.length / 2));
  return request.get(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${truncated}` },
  });
}

export async function requestWithTamperedToken(request: APIRequestContext, token: string, path: string) {
  const parts = token.split(".");
  if (parts.length === 3) {
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    payload.sub = "hacker@evil.com";
    parts[1] = Buffer.from(JSON.stringify(payload)).toString("base64").replace(/=/g, "");
  }
  const tampered = parts.join(".");
  return request.get(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${tampered}` },
  });
}

export async function requestWithWrongSignature(request: APIRequestContext, token: string, path: string) {
  const parts = token.split(".");
  if (parts.length === 3) {
    parts[2] = "invalidsignature";
  }
  const wrongSig = parts.join(".");
  return request.get(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${wrongSig}` },
  });
}
