import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStoredFontSize, getStoredTheme, setStoredFontSize, setStoredTheme } from "../utils/storage";

const ThemeContext = createContext(null);
const FONT_SIZE_VALUES = { pequena: "15px", media: "16px", grande: "17px" };

function resolveInitialFontSize() {
  const stored = getStoredFontSize();
  return stored === "pequena" || stored === "media" || stored === "grande" ? stored : "media";
}

function resolveInitialTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);
  const [fontSize, setFontSize] = useState(resolveInitialFontSize);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";
    root.classList.toggle("dark", isDark);
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    setStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-size", fontSize);
    root.style.fontSize = FONT_SIZE_VALUES[fontSize] ?? FONT_SIZE_VALUES.media;
    setStoredFontSize(fontSize);
  }, [fontSize]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark")),
      fontSize,
      setFontSize,
    }),
    [theme, fontSize],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  return context;
}
