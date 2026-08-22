const TOKEN_KEY = "tcc_auth_token";
const THEME_KEY = "tcc_theme";
const FONT_SIZE_KEY = "collabresearch_font_size";

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

export function getStoredFontSize() {
  return localStorage.getItem(FONT_SIZE_KEY);
}

export function setStoredFontSize(size) {
  localStorage.setItem(FONT_SIZE_KEY, size);
}
