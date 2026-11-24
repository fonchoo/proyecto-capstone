import { createContext, useContext, useEffect, useState } from "react";

// Tema visual: "v1" (oscuro, el de por defecto) o "v2" (claro).
//
// La elección se guarda en localStorage para que sobreviva al recargar
// la página. Es una preferencia de cada dispositivo y no tiene datos
// sensibles (a diferencia de la sesión, que NO va en localStorage: ver
// store.jsx). index.html lee la misma clave antes de que cargue React
// para pintar el fondo correcto desde el primer momento.
//
// localStorage puede fallar (modo privado, almacenamiento bloqueado):
// por eso se usa con try/catch y, si falla, el tema simplemente no se
// recuerda.

const ThemeContext = createContext(null);

export const CLAVE_TEMA = "sigmave_tema";
const TEMAS = ["v1", "v2"];

// Fondo de la página según el tema (mismos colores que "shell" en
// themeStyles.js). Va en <html> para que nunca se vea blanco donde la
// app no alcanza a pintar (p. ej. en el teléfono, bajo el contenido o
// al rebotar el scroll).
const FONDO = { v1: "#030712", v2: "#f9fafb" };

function temaGuardado() {
  try {
    const t = localStorage.getItem(CLAVE_TEMA);
    return TEMAS.includes(t) ? t : "v1";
  } catch {
    return "v1";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(temaGuardado);
  const toggle = () => setTheme((t) => (t === "v1" ? "v2" : "v1"));

  useEffect(() => {
    document.documentElement.style.backgroundColor = FONDO[theme];
    try {
      localStorage.setItem(CLAVE_TEMA, theme);
    } catch {
      // Sin almacenamiento disponible: el tema rige solo en esta visita.
    }
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
