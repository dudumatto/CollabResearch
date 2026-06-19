const TOKEN_KEY = "tcc_auth_token";
const THEME_KEY = "tcc_theme";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY);
}

export function setStoredTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
