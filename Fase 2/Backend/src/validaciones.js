// ============================================================
// src/validaciones.js
// ============================================================
// Reglas de FORMATO de los campos de los formularios, definidas una
// sola vez para toda la API. Las rutas las importan y nunca las
// reimplementan (igual que alcance.js o preventiva.js).
//
// El front repite estas mismas reglas en Front/src/validaciones.js
// para avisar antes de enviar, pero esa copia es solo experiencia de
// usuario: la API se puede llamar sin pasar por el formulario (con
// curl, o abriendo la URL), así que la regla que vale es la de acá.
// Si cambias una, cambia la otra.
//
// Las reglas rigen al GUARDAR: los datos que ya existen no se tocan.

// Texto de una línea: sin espacios al borde ni espacios repetidos.
export const texto = (valor) =>
  typeof valor === "string" ? valor.trim().replace(/\s+/g, " ") : "";

// Texto multilínea (descripciones, detalles): solo se recorta el borde.
export const textoLargo = (valor) => (typeof valor === "string" ? valor.trim() : "");

export const vacio = (valor) => valor === undefined || valor === null || valor === "";

// Mensaje de largo fuera de rango, o null si está dentro.
export function errorLargo(valor, min, max) {
  if (valor.length < min) return `Debe tener al menos ${min} caracteres`;
  if (valor.length > max) return `Máximo ${max} caracteres`;
  return null;
}

// Entero dentro de [min, max], o null si no lo es ("12.5", "abc", -1).
export function enteroEnRango(valor, min, max) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

// ---------- Personas ----------

// RUT chileno: acepta "12.345.678-5", "12345678-5" o "123456785" y
// valida el dígito verificador (módulo 11). Devuelve "12345678-5" (sin
// puntos, DV en mayúscula) o null si no es válido.
export function normalizarRut(valor) {
  const limpio = String(valor ?? "").replace(/[.\s-]/g, "").toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(limpio)) return null;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === esperado ? `${cuerpo}-${dv}` : null;
}

// Nombre: letras (con tildes y ñ), espacios, apóstrofo y guion.
export const NOMBRE = { min: 3, max: 100, patron: /^[\p{L}' -]+$/u };

// Correo: siempre en minúsculas, así "Juan@X.cl" y "juan@x.cl" son el
// mismo usuario (la base lo exige único).
export const normalizarEmail = (valor) => texto(valor).toLowerCase();
export const EMAIL_MAX = 254;
export const esEmail = (valor) =>
  valor.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);

// Contraseña: 8 a 72 caracteres (bcrypt ignora lo que pasa de 72
// bytes), con al menos una letra y un número.
export function errorPassword(valor) {
  if (typeof valor !== "string" || valor.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (valor.length > 72) return "La contraseña puede tener hasta 72 caracteres";
  if (!/\p{L}/u.test(valor) || !/\d/.test(valor)) {
    return "La contraseña debe tener al menos una letra y un número";
  }
  return null;
}

// ---------- Vehículos ----------

// "klht-21" / "KLHT 21" / "kl.ht.21" -> "KLHT21". Así se guarda y así
// se compara para impedir duplicados (HU03 CA5).
export const normalizarPatente = (valor) =>
  String(valor ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();

// Patente chilena: 4 letras + 2 números desde 2007 (sin vocales ni M,
// N, Ñ, Q, para no formar palabras ni confundir letras) o 2 letras +
// 4 números en el formato anterior.
export const esPatente = (patente) =>
  /^[BCDFGHJKLPRSTVWXYZ]{4}\d{2}$/.test(patente) || /^[A-Z]{2}\d{4}$/.test(patente);

// Nomenclatura del carro: sigla de 1 a 3 letras y número ("B-1",
// "BX-2", "RH-10"). "b1" y "B 1" se normalizan a "B-1". Devuelve null
// si no calza.
export function normalizarNomenclatura(valor) {
  const m = String(valor ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .match(/^([A-Z]{1,3})-?(\d{1,3})$/);
  return m ? `${m[1]}-${Number(m[2])}` : null;
}

export const ANIO_MIN_VEHICULO = 1950;

// ---------- Mantenciones ----------

export const KM_MAX = 2_000_000;
// Montos en pesos chilenos: enteros (no hay centavos).
export const MONTO_MAX = 100_000_000;
export const TALLER = { min: 3, max: 100 };
export const DETALLE = { min: 10, max: 2000 };

// ---------- Fallas ----------

export const DESCRIPCION_FALLA = { min: 10, max: 2000 };
