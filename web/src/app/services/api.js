import { clearStoredToken, getStoredToken } from "../utils/storage";

const API_BASE_URL = (
  import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || ""
).replace(/\/$/, "");

function buildRequestUrl(path) {
  const requestPath = path.startsWith("/") ? path : `/${path}`;

  if (API_BASE_URL.endsWith("/api") && requestPath.startsWith("/api/")) {
    return `${API_BASE_URL}${requestPath.slice(4)}`;
  }

  return `${API_BASE_URL}${requestPath}`;
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers ?? {});

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildRequestUrl(path), {
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

    const message =
      typeof payload === "string"
        ? payload
        : payload?.message || payload?.error || "Não foi possível concluir a requisição.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
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
        const error = new Error("Erro ao carregar arquivo.");
        error.status = res.status;
        throw error;
      }
      return res.blob();
    }),
  baseUrl: API_BASE_URL,
};
