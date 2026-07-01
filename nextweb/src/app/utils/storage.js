const TOKEN_KEY = "tcc_auth_token";
const THEME_KEY = "tcc_theme";
const ACCENT_COLOR_KEY = "tcc_accent_color";
const FONT_SIZE_KEY = "tcc_font_size";

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

export function getStoredAccentColor() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCENT_COLOR_KEY);
}

export function setStoredAccentColor(color) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCENT_COLOR_KEY, color);
}

export function getStoredFontSize() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FONT_SIZE_KEY);
}

export function setStoredFontSize(size) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FONT_SIZE_KEY, size);
}
