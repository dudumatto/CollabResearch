export class ApiError extends Error {
  constructor(message, { status, code, details, payload } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code ?? `HTTP_${status ?? 0}`;
    this.details = details ?? [];
    this.payload = payload;
  }

  get isDomainError() {
    return Boolean(this.code && this.payload && typeof this.payload === "object");
  }

  isStatus(...statuses) {
    return statuses.includes(this.status);
  }

  isCode(...codes) {
    return codes.includes(this.code);
  }
}

export function getErrorMessage(error, fallback = "Não foi possível concluir a requisição.") {
  if (error instanceof ApiError) return error.message;
  return error?.message ?? fallback;
}

export function getErrorCode(error) {
  return error?.code ?? null;
}

export function getErrorDetails(error) {
  if (!Array.isArray(error?.details)) return [];
  return error.details;
}

export function normalizeError(error) {
  if (error instanceof ApiError) return error;

  if (error instanceof Error && error.status) {
    return new ApiError(error.message, {
      status: error.status,
      code: error.code,
      details: error.details,
      payload: error.payload,
    });
  }

  return new ApiError(error?.message ?? "Não foi possível concluir a requisição.");
}
