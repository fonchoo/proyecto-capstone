import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

// Fondo de la página según el tema (mismos colores que "shell" en
// themeStyles.js). Va en <html> para que nunca se vea blanco donde la
// app no alcanza a pintar (p. ej. en el teléfono, bajo el contenido o
// al rebotar el scroll).
const FONDO = { v1: "#030712", v2: "#f9fafb" };

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("v1");
  const toggle = () => setTheme((t) => (t === "v1" ? "v2" : "v1"));

  useEffect(() => {
    document.documentElement.style.backgroundColor = FONDO[theme];
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
