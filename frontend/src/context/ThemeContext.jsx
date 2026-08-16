import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext(null);

// MarKendrick is a light-theme-only brand. No toggle, no dark mode.
export function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
  }, []);

  return <ThemeContext.Provider value={{ theme: "light" }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
