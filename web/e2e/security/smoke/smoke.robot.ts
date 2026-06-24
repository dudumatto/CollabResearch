import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { registerAndLogin, assertUnauthorized, assertOk } from "../helpers/security.helper";
import { API_URL } from "../../helpers/api.helper";

export async function requestWithoutAuth(request: APIRequestContext, path: string) {
  return request.get(`${API_URL}${path}`);
}

export async function requestWithEmptyToken(request: APIRequestContext, path: string) {
  return request.get(`${API_URL}${path}`, {
    headers: { Authorization: "" },
  });
}

export async function requestWithBearerEmpty(request: APIRequestContext, path: string) {
  return request.get(`${API_URL}${path}`, {
    headers: { Authorization: "Bearer " },
  });
}

export async function requestWithGarbageToken(request: APIRequestContext, path: string) {
  return request.get(`${API_URL}${path}`, {
    headers: { Authorization: "Bearer abc.def.ghi" },
  });
}

export async function prepareSmokeUsers(request: APIRequestContext) {
  const userA = await registerAndLogin(request, "smoke-a");
  const userB = await registerAndLogin(request, "smoke-b");
  return { userA, userB };
}
