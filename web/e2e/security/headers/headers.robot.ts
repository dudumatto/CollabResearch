import { expect, type APIRequestContext } from "@playwright/test";
import { API_URL } from "../../helpers/api.helper";
import { registerAndLogin, type AuthenticatedUser } from "../helpers/security.helper";

export type HeaderSeverity = "OK" | "Warning" | "Critical";

export type HeaderCheck = {
  name: string;
  expected: string | null;
  severity: HeaderSeverity;
  description: string;
};

export type EndpointHeaders = {
  endpoint: string;
  headers: Record<string, string | null>;
  checks: HeaderResult[];
};

export type HeaderResult = {
  header: string;
  value: string | null;
  severity: HeaderSeverity;
  status: "present" | "missing" | "wrong-value";
  message: string;
};

export async function prepareHeadersUser(request: APIRequestContext): Promise<AuthenticatedUser> {
  return registerAndLogin(request, "headers-user");
}

export async function getResponseHeaders(request: APIRequestContext, token: string | null, path: string): Promise<Record<string, string | null>> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request.get(`${API_URL}${path}`, { headers });
  const responseHeaders: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(response.headers())) {
    responseHeaders[key.toLowerCase()] = value;
  }
  return responseHeaders;
}

export const HEADER_CHECKS: HeaderCheck[] = [
  {
    name: "strict-transport-security",
    expected: "max-age=31536000",
    severity: "Critical",
    description: "HSTS deve estar presente com max-age >= 31536000",
  },
  {
    name: "content-security-policy",
    expected: null,
    severity: "Critical",
    description: "CSP deve estar presente no frontend",
  },
  {
    name: "x-frame-options",
    expected: null,
    severity: "Warning",
    description: "X-Frame-Options deve estar presente (DENY ou SAMEORIGIN)",
  },
  {
    name: "x-content-type-options",
    expected: "nosniff",
    severity: "Warning",
    description: "X-Content-Type-Options deve ser 'nosniff'",
  },
  {
    name: "cache-control",
    expected: null,
    severity: "Warning",
    description: "Cache-Control deve estar presente em rotas autenticadas/API",
  },
  {
    name: "referrer-policy",
    expected: null,
    severity: "Warning",
    description: "Referrer-Policy deve estar presente",
  },
  {
    name: "permissions-policy",
    expected: null,
    severity: "Warning",
    description: "Permissions-Policy deve estar presente",
  },
  {
    name: "x-powered-by",
    expected: null,
    severity: "Warning",
    description: "X-Powered-By NÃO deve estar presente",
  },
  {
    name: "server",
    expected: null,
    severity: "Warning",
    description: "Server não deve expor versão detalhada",
  },
  {
    name: "access-control-allow-origin",
    expected: null,
    severity: "Critical",
    description: "Access-Control-Allow-Origin NÃO deve ser '*' em rotas autenticadas",
  },
];

export function checkHeader(
  headerName: string,
  actualValue: string | null,
  check: HeaderCheck,
): HeaderResult {
  const lowerName = headerName.toLowerCase();

  if (lowerName === "x-powered-by") {
    if (actualValue) {
      return {
        header: headerName,
        value: actualValue,
        severity: check.severity,
        status: "present",
        message: `${check.name} está presente: "${actualValue}"`,
      };
    }
    return {
      header: headerName,
      value: null,
      severity: "OK",
      status: "missing",
      message: `${check.name} ausente (correto)`,
    };
  }

  if (lowerName === "access-control-allow-origin") {
    if (actualValue === "*") {
      return {
        header: headerName,
        value: actualValue,
        severity: "Critical",
        status: "wrong-value",
        message: `${check.name} é '*', deve ser restrito`,
      };
    }
    if (actualValue) {
      return {
        header: headerName,
        value: actualValue,
        severity: "OK",
        status: "present",
        message: `${check.name} presente: "${actualValue}"`,
      };
    }
    return {
      header: headerName,
      value: null,
      severity: "OK",
      status: "missing",
      message: `${check.name} ausente ( aceitável)`,
    };
  }

  if (lowerName === "server") {
    if (actualValue) {
      const hasVersion = /\d+\.\d+/.test(actualValue);
      return {
        header: headerName,
        value: actualValue,
        severity: hasVersion ? "Warning" : "OK",
        status: "present",
        message: hasVersion
          ? `${check.name} expõe versão: "${actualValue}"`
          : `${check.name} presente sem versão: "${actualValue}"`,
      };
    }
    return {
      header: headerName,
      value: null,
      severity: "OK",
      status: "missing",
      message: `${check.name} ausente`,
    };
  }

  if (lowerName === "strict-transport-security") {
    if (!actualValue) {
      return {
        header: headerName,
        value: null,
        severity: check.severity,
        status: "missing",
        message: `${check.name} ausente`,
      };
    }
    const match = actualValue.match(/max-age=(\d+)/);
    const maxAge = match ? parseInt(match[1]) : 0;
    if (maxAge < 31536000) {
      return {
        header: headerName,
        value: actualValue,
        severity: "Warning",
        status: "wrong-value",
        message: `${check.name} max-age muito baixo: ${maxAge}`,
      };
    }
    return {
      header: headerName,
      value: actualValue,
      severity: "OK",
      status: "present",
      message: `${check.name} presente e correto`,
    };
  }

  if (lowerName === "content-security-policy") {
    if (!actualValue) {
      return {
        header: headerName,
        value: null,
        severity: check.severity,
        status: "missing",
        message: `${check.name} ausente`,
      };
    }
    return {
      header: headerName,
      value: actualValue,
      severity: "OK",
      status: "present",
      message: `${check.name} presente`,
    };
  }

  if (lowerName === "x-frame-options") {
    if (!actualValue) {
      return {
        header: headerName,
        value: null,
        severity: check.severity,
        status: "missing",
        message: `${check.name} ausente`,
      };
    }
    const valid = ["DENY", "SAMEORIGIN"].includes(actualValue.toUpperCase());
    return {
      header: headerName,
      value: actualValue,
      severity: valid ? "OK" : "Warning",
      status: valid ? "present" : "wrong-value",
      message: valid
        ? `${check.name} presente: "${actualValue}"`
        : `${check.name} valor inesperado: "${actualValue}"`,
    };
  }

  if (check.expected) {
    if (!actualValue) {
      return {
        header: headerName,
        value: null,
        severity: check.severity,
        status: "missing",
        message: `${check.name} ausente`,
      };
    }
    if (actualValue.includes(check.expected)) {
      return {
        header: headerName,
        value: actualValue,
        severity: "OK",
        status: "present",
        message: `${check.name} presente e correto`,
      };
    }
    return {
      header: headerName,
      value: actualValue,
      severity: "Warning",
      status: "wrong-value",
      message: `${check.name} valor inesperado`,
    };
  }

  if (actualValue) {
    return {
      header: headerName,
      value: actualValue,
      severity: "OK",
      status: "present",
      message: `${check.name} presente`,
    };
  }

  return {
    header: headerName,
    value: null,
    severity: check.severity,
    status: "missing",
    message: `${check.name} ausente`,
  };
}

export function checkCacheControl(
  actualValue: string | null,
  isProtectedRoute: boolean,
): HeaderResult {
  if (!isProtectedRoute) {
    return {
      header: "cache-control",
      value: actualValue,
      severity: "OK",
      status: "missing",
      message: "Cache-Control não obrigatório em rotas públicas",
    };
  }

  if (!actualValue) {
    return {
      header: "cache-control",
      value: null,
      severity: "Warning",
      status: "missing",
      message: "Cache-Control ausente em rota protegida/API",
    };
  }

  const hasNoStore = actualValue.includes("no-store");
  const hasNoCache = actualValue.includes("no-cache");
  const hasPrivate = actualValue.includes("private");

  if (hasNoStore || hasNoCache || hasPrivate) {
    return {
      header: "cache-control",
      value: actualValue,
      severity: "OK",
      status: "present",
      message: `Cache-Control presente: "${actualValue}"`,
    };
  }

  return {
    header: "cache-control",
    value: actualValue,
    severity: "Warning",
    status: "wrong-value",
    message: `Cache-Control deve incluir no-store, no-cache ou private`,
  };
}

export function checkReferrerPolicy(actualValue: string | null): HeaderResult {
  if (!actualValue) {
    return {
      header: "referrer-policy",
      value: null,
      severity: "Warning",
      status: "missing",
      message: "Referrer-Policy ausente",
    };
  }
  return {
    header: "referrer-policy",
    value: actualValue,
    severity: "OK",
    status: "present",
    message: `Referrer-Policy presente: "${actualValue}"`,
  };
}

export function checkPermissionsPolicy(actualValue: string | null): HeaderResult {
  if (!actualValue) {
    return {
      header: "permissions-policy",
      value: null,
      severity: "Warning",
      status: "missing",
      message: "Permissions-Policy ausente",
    };
  }
  return {
    header: "permissions-policy",
    value: actualValue,
    severity: "OK",
    status: "present",
    message: `Permissions-Policy presente`,
  };
}
