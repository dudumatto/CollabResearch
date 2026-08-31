import { createContext, startTransition, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
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

function buildUserFromIdentity(identity) {
  if (!identity?.email) return null;

  return {
    nome: identity.email.split("@")[0],
    email: identity.email,
    tipo: identity.tipo,
  };
}

async function resolveCurrentUser(identity) {
  const fallbackUser = buildUserFromIdentity(identity);
  if (!identity?.email) return fallbackUser;

  const currentUser = await userService.getCurrentUser().catch(() => null);
  if (currentUser?.email === identity.email) {
    return currentUser;
  }

  return fallbackUser;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [identity, setIdentity] = useState(() => (token ? buildIdentity(token) : null));
  const [user, setUser] = useState(() => buildUserFromIdentity(identity));
  const [loading, setLoading] = useState(false);

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
    if (!nextIdentity || (nextIdentity.exp && Number(nextIdentity.exp) * 1000 <= Date.now())) {
      clearStoredToken();
      setToken(null);
      setLoading(false);
      return;
    }
    setIdentity(nextIdentity);
    setUser(buildUserFromIdentity(nextIdentity));
    setLoading(false);

    let cancelled = false;
    resolveCurrentUser(nextIdentity).then((resolvedUser) => {
      if (!cancelled) {
        setUser(resolvedUser ?? null);
      }
    });

    return () => {
      cancelled = true;
    };
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
    startTransition(() => {
      setUser(resolved ?? null);
    });
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
