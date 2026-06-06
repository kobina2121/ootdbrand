"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

type ThemeProviderProps = {
  children: ReactNode;
  attribute?: "class";
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

const STORAGE_KEY = "theootd-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(theme: ResolvedTheme, disableTransitionOnChange?: boolean) {
  const root = document.documentElement;

  if (disableTransitionOnChange) {
    root.classList.add("theme-changing");
  }

  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;

  if (disableTransitionOnChange) {
    window.setTimeout(() => root.classList.remove("theme-changing"), 0);
  }
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "light",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  void attribute;

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    return storedTheme ?? defaultTheme;
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    typeof window === "undefined" ? "light" : getSystemTheme(),
  );
  const resolvedTheme: ResolvedTheme =
    theme === "system" && enableSystem ? systemTheme : theme === "dark" ? "dark" : "light";

  useEffect(() => {
    applyThemeClass(resolvedTheme, disableTransitionOnChange);
  }, [disableTransitionOnChange, resolvedTheme]);

  useEffect(() => {
    if (!enableSystem || theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setSystemTheme(getSystemTheme());
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [enableSystem, theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
    if (nextTheme === "system" && enableSystem) {
      setSystemTheme(getSystemTheme());
    }
  }, [enableSystem]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
