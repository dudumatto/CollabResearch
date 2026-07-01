import { expect, type APIRequestContext } from "@playwright/test";
import { API_URL } from "./api.helper";

export async function cleanupTestData(
  request: APIRequestContext,
  adminToken: string
): Promise<void> {
  const response = await request.post(`${API_URL}/api/test/cleanup`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (response.status() === 404) {
    console.error(
      "[CLEANUP] Endpoint /api/test/cleanup not found. " +
      "Backend must run with --spring.profiles.active=test"
    );
  }

  expect(
    response.status(),
    "[CLEANUP] Failed — data may persist in database"
  ).toBe(204);
}