import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "sentinel_theme";

function systemPrefersDark() {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }) {
  // explicit: null = follow system; "light"/"dark" = user has chosen.
  const [explicit, setExplicit] = useState(() => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  });
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  const dark = explicit ? explicit === "dark" : systemDark;

  // Follow system changes until the user explicitly toggles.
  useEffect(() => {
    if (explicit) return;
    let mql;
    try {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }
    const handler = (e) => setSystemDark(e.matches);
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else if (mql.addListener) mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else if (mql.removeListener) mql.removeListener(handler);
    };
  }, [explicit]);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  function toggle() {
    setExplicit((prev) => {
      const currentlyDark = prev ? prev === "dark" : systemDark;
      const next = currentlyDark ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {}
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);