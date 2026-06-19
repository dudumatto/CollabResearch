import { createContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { notificationService } from "../services/notificationService";
import { projectService } from "../services/projectService";
import { userService } from "../services/userService";
import { clearStoredToken, getStoredToken, setStoredToken } from "../utils/storage";
import { decodeJwt } from "../utils/token";

export const AuthContext = createContext(null);

function buildIdentity(token) {
  const payload = decodeJwt(token);
  if (!payload) return null;

  return {
    email: payload.sub ?? "",
    tipo: payload.tipo ?? "",
    exp: payload.exp ?? null,
  };
}

async function resolveCurrentUser(identity) {
  if (!identity?.email) return null;

  const currentUser = await userService.getCurrentUser().catch(() => null);
  if (currentUser?.email === identity.email) {
    return currentUser;
  }

  // Fallback (se o getCurrentUser falhar ou não retornar o usuário esperado)
  const users = await userService.list().catch(() => []);
  if (Array.isArray(users)) {
    const matchedUser = users.find((item) => item.email === identity.email);
    if (matchedUser) return matchedUser;
  }

  const notifications = await notificationService.listMine().catch(() => []);
  const userFromNotifications = Array.isArray(notifications)
    ? notifications.find((item) => item.usuario?.email === identity.email)?.usuario
    : null;
  if (userFromNotifications) return userFromNotifications;

  const projects = await projectService.list().catch(() => []);
  const projectMatch = Array.isArray(projects)
    ? projects.find(
        (item) =>
          item.orientador?.usuario?.email === identity.email ||
          item.alunoCriador?.usuario?.email === identity.email,
      )
    : null;

  if (projectMatch?.orientador?.usuario?.email === identity.email) {
    return projectMatch.orientador.usuario;
  }

  if (projectMatch?.alunoCriador?.usuario?.email === identity.email) {
    return projectMatch.alunoCriador.usuario;
  }

  return {
    nome: identity.email.split("@")[0],
    email: identity.email,
    tipo: identity.tipo,
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [identity, setIdentity] = useState(() => (token ? buildIdentity(token) : null));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    function handleUnauthorized() {
      clearStoredToken();
      setToken(null);
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!token) {
      setIdentity(null);
      setUser(null);
      setLoading(false);
      return;
    }

    const nextIdentity = buildIdentity(token);
    if (nextIdentity?.exp && Number(nextIdentity.exp) * 1000 <= Date.now()) {
      clearStoredToken();
      setToken(null);
      setLoading(false);
      return;
    }
    setIdentity(nextIdentity);
    setLoading(true);

    resolveCurrentUser(nextIdentity)
      .then((resolvedUser) => {
        setUser(resolvedUser ?? null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const login = async (payload) => {
    const response = await authService.login(payload);
    setStoredToken(response.token);
    setToken(response.token);
    return response;
  };

  const register = async (payload) => {
    const response = await authService.register(payload);
    setStoredToken(response.token);
    setToken(response.token);
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Mantem logout local mesmo se a API falhar.
    }

    clearStoredToken();
    setToken(null);
  };

  const refreshUser = async () => {
    if (!identity) return null;
    const resolved = await resolveCurrentUser(identity);
    setUser(resolved ?? null);
    return resolved;
  };

  const value = useMemo(
    () => ({
      token,
      identity,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      refreshUser,
    }),
    [token, identity, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
