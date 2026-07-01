"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getStoredAccentColor,
  getStoredFontSize,
  getStoredTheme,
  setStoredAccentColor,
  setStoredFontSize,
  setStoredTheme,
} from "../utils/storage";

const ThemeContext = createContext(null);

const THEME_MODES = new Set(["light", "dark", "system"]);
const ACCENT_COLORS = new Set(["azul", "verde", "roxo", "laranja", "rosa"]);
const FONT_SIZES = new Set(["pequena", "media", "grande"]);

function getSystemTheme() {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function normalizeThemeMode(value) {
  const normalized = String(value ?? "").toLowerCase();
  const aliases = {
    claro: "light",
    escuro: "dark",
    sistema: "system",
  };
  const mode = aliases[normalized] ?? normalized;
  return THEME_MODES.has(mode) ? mode : "system";
}

function normalizeAccentColor(value) {
  const normalized = String(value ?? "").toLowerCase();
  return ACCENT_COLORS.has(normalized) ? normalized : "verde";
}

function normalizeFontSize(value) {
  const normalized = String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return FONT_SIZES.has(normalized) ? normalized : "media";
}

function resolveInitialThemeMode() {
  return normalizeThemeMode(getStoredTheme());
}

function resolveInitialAccentColor() {
  return normalizeAccentColor(getStoredAccentColor());
}

function resolveInitialFontSize() {
  return normalizeFontSize(getStoredFontSize());
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(resolveInitialThemeMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const [accentColor, setAccentColorState] = useState(resolveInitialAccentColor);
  const [fontSize, setFontSizeState] = useState(resolveInitialFontSize);

  const theme = themeMode === "system" ? systemTheme : themeMode;

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;

    const handleChange = (event) => setSystemTheme(event.matches ? "dark" : "light");
    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener?.(handleChange);
    return () => media.removeListener?.(handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";

    root.classList.toggle("dark", isDark);
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-theme-mode", themeMode);
    root.style.colorScheme = theme;
    setStoredTheme(themeMode);
  }, [theme, themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-accent-color", accentColor);
    setStoredAccentColor(accentColor);
  }, [accentColor]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-size", fontSize);
    setStoredFontSize(fontSize);
  }, [fontSize]);

  const setThemeMode = useCallback((nextMode) => {
    setThemeModeState(normalizeThemeMode(nextMode));
  }, []);
  const setTheme = setThemeMode;
  const setAccentColor = useCallback((nextColor) => {
    setAccentColorState(normalizeAccentColor(nextColor));
  }, []);
  const setFontSize = useCallback((nextSize) => {
    setFontSizeState(normalizeFontSize(nextSize));
  }, []);
  const toggleTheme = useCallback(() => {
    if (themeMode === "system") {
      setThemeMode(theme === "dark" ? "light" : "dark");
    } else {
      setThemeMode(themeMode === "dark" ? "light" : "dark");
    }
  }, [setThemeMode, theme, themeMode]);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      systemTheme,
      isDark: theme === "dark",
      followSystem: themeMode === "system",
      accentColor,
      fontSize,
      setTheme,
      setThemeMode,
      setAccentColor,
      setFontSize,
      toggleTheme,
    }),
    [accentColor, fontSize, setAccentColor, setFontSize, setTheme, setThemeMode, systemTheme, theme, themeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }

  return context;
}
