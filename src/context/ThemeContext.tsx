"use client";

import React, { createContext, useContext, useSyncExternalStore, useCallback } from "react";
import { AppTheme } from "@/lib/types";

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "cyber",
  setTheme: () => {},
});

const THEME_STORAGE_KEY = "docmorph-theme";
const VALID_THEMES: AppTheme[] = ["cyber", "brutalist", "minimal", "retro"];

function getThemeSnapshot(): AppTheme {
  if (typeof window === "undefined") return "cyber";
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
  if (saved && VALID_THEMES.includes(saved)) {
    return saved;
  }
  return "cyber";
}

function getServerSnapshot(): AppTheme {
  return "cyber";
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("docmorph-theme-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("docmorph-theme-change", callback);
  };
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);

  const setTheme = useCallback((newTheme: AppTheme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      window.dispatchEvent(new Event("docmorph-theme-change"));
    } catch (e) {
      console.warn("Could not write theme to storage:", e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
