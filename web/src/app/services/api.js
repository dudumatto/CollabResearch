import { clearStoredToken, getStoredToken } from "../utils/storage";
import { ApiError } from "../utils/apiError";

const API_BASE_URL = (
  import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || ""
).replace(/\/$/, "");

const GET_DEDUPE_TTL_MS = 750;
const getRequestCache = new Map();

function buildRequestUrl(path) {
  const requestPath = path.startsWith("/") ? path : `/${path}`;

  if (API_BASE_URL.endsWith("/api") && requestPath.startsWith("/api/")) {
    return `${API_BASE_URL}${requestPath.slice(4)}`;
  }

  return `${API_BASE_URL}${requestPath}`;
}

function getRequestCacheKey(url, headers) {
  return `${headers.get("Authorization") ?? ""}|${url}`;
}

function rememberGetResult(cacheKey, value) {
  const expiresAt = Date.now() + GET_DEDUPE_TTL_MS;
  getRequestCache.set(cacheKey, { value, expiresAt });
  setTimeout(() => {
    const cached = getRequestCache.get(cacheKey);
    if (cached?.expiresAt === expiresAt) {
      getRequestCache.delete(cacheKey);
    }
  }, GET_DEDUPE_TTL_MS);
}

async function performRequest(url, options, headers) {
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
    }

    const payloadObject = typeof payload === "object" && payload !== null ? payload : null;
    const message =
      typeof payload === "string"
        ? payload
        : payloadObject?.message || payloadObject?.error || "Não foi possível concluir a requisição.";

    throw new ApiError(message, {
      status: response.status,
      code: payloadObject?.code ?? undefined,
      details: Array.isArray(payloadObject?.errors)
        ? payloadObject.errors.map((e) => ({
            field: e?.field ?? null,
            message: e?.message ?? null,
          }))
        : [],
      payload: payloadObject ?? undefined,
    });
  }

  return payload;
}

function clearGetRequestCache() {
  getRequestCache.clear();
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers ?? {});
  const method = String(options.method ?? "GET").toUpperCase();
  const url = buildRequestUrl(path);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (method !== "GET") {
    clearGetRequestCache();
    return performRequest(url, options, headers);
  }

  const cacheKey = getRequestCacheKey(url, headers);
  const cached = getRequestCache.get(cacheKey);
  if (cached?.promise) return cached.promise;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const promise = performRequest(url, options, headers);
  getRequestCache.set(cacheKey, { promise });

  try {
    const result = await promise;
    rememberGetResult(cacheKey, result);
    return result;
  } catch (err) {
    if (getRequestCache.get(cacheKey)?.promise === promise) {
      getRequestCache.delete(cacheKey);
    }
    throw err;
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body, options = {}) =>
    request(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  put: (path, body, options = {}) =>
    request(path, {
      method: "PUT",
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  patch: (path, body, options = {}) =>
    request(path, {
      method: "PATCH",
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  delete: (path) =>
    request(path, {
      method: "DELETE",
    }),
  getBlob: (path) =>
    fetch(buildRequestUrl(path), {
      headers: {
        Authorization: `Bearer ${getStoredToken()}`,
      },
    }).then(async (res) => {
      if (!res.ok) {
        throw new ApiError("Erro ao carregar arquivo.", {
          status: res.status,
          code: `HTTP_${res.status}`,
        });
      }
      return res.blob();
    }),
  baseUrl: API_BASE_URL,
};
