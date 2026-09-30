"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initial load - sync with localStorage and system preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("moeen-theme") as Theme | null;
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = stored || (systemPrefersDark ? "dark" : "light");
      setThemeState(initial);
    } catch (_) {}
    setMounted(true);
  }, []);

  // Reactive application - apply class whenever state changes
  useEffect(() => {
    if (!mounted) return;

    const applyTheme = (currentTheme: Theme) => {
      const root = document.documentElement;
      const body = document.body;
      if (currentTheme === "dark") {
        root.classList.add("dark");
        body?.classList.add("dark");
      } else {
        root.classList.remove("dark");
        body?.classList.remove("dark");
      }
      localStorage.setItem("moeen-theme", currentTheme);
    };

    applyTheme(theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setThemeState(newTheme);

    // Immediate DOM update for instant feedback
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const body = document.body;
      if (newTheme === "dark") {
        root.classList.add("dark");
        body?.classList.add("dark");
      } else {
        root.classList.remove("dark");
        body?.classList.remove("dark");
      }
    }

    // Call API to sync database preference
    fetch("/api/users/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ darkMode: newTheme === "dark" }),
    }).catch((err) => console.error("Failed to sync theme preference:", err));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const body = document.body;
      if (t === "dark") {
        root.classList.add("dark");
        body?.classList.add("dark");
      } else {
        root.classList.remove("dark");
        body?.classList.remove("dark");
      }
      localStorage.setItem("moeen-theme", t);
    }

    // Call API to sync database preference
    fetch("/api/users/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ darkMode: t === "dark" }),
    }).catch((err) => console.error("Failed to sync theme preference:", err));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {mounted ? (
        children
      ) : (
        <div style={{ visibility: "hidden" }}>{children}</div>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
