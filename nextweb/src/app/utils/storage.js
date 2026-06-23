const TOKEN_KEY = "tcc_auth_token";
const THEME_KEY = "tcc_theme";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredTheme() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(THEME_KEY);
}

export function setStoredTheme(theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, theme);
}
