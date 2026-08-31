import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStoredFontSize, getStoredTheme, setStoredFontSize, setStoredTheme } from "../utils/storage";

const ThemeContext = createContext(null);

function resolveInitialTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme === "dark" || storedTheme === "light" || storedTheme === "system") {
    return storedTheme;
  }

  return "light";
}

function resolveSystemTheme() {
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function resolveInitialFontSize() {
  const stored = getStoredFontSize();
  return ["small", "medium", "large"].includes(stored) ? stored : "medium";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);
  const [fontSize, setFontSize] = useState(resolveInitialFontSize);
  const [systemTheme, setSystemTheme] = useState(resolveSystemTheme);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;

    const handleChange = () => setSystemTheme(resolveSystemTheme());
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const resolvedTheme = theme === "system" ? systemTheme : theme;
    const isDark = resolvedTheme === "dark";

    root.classList.toggle("dark", isDark);
    root.setAttribute("data-theme", resolvedTheme);
    root.setAttribute("data-theme-preference", theme);
    root.style.colorScheme = resolvedTheme;
    setStoredTheme(theme);
  }, [theme, systemTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-size", fontSize);
    setStoredFontSize(fontSize);
  }, [fontSize]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: theme === "system" ? systemTheme : theme,
      isDark: (theme === "system" ? systemTheme : theme) === "dark",
      fontSize,
      setTheme,
      setFontSize,
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark")),
    }),
    [theme, systemTheme, fontSize],
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
