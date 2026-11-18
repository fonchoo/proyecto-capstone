// ============================================================
// src/validaciones.js
// ============================================================
// Copia de las reglas de formato de Backend/src/validaciones.js, para
// avisar bajo cada campo ANTES de enviar. Es solo experiencia de
// usuario: la API valida lo mismo y su respuesta es la que vale (si
// algo se escapa acá, el error de la API llega igual bajo el campo).
// Hay que mantenerla sincronizada a mano, igual que permissions.js.
//
// El catálogo de tipos y marcas de vehículo NO se copia: llega desde
// GET /api/config (Backend/src/catalogoVehiculos.js).

// Texto de una línea: sin espacios al borde ni espacios repetidos.
export const texto = (valor) => String(valor ?? "").trim().replace(/\s+/g, " ");

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
export function normalizarRut(rut) {
  const limpio = String(rut ?? "").replace(/[.\s-]/g, "").toUpperCase();
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

export const NOMBRE = { min: 3, max: 100, patron: /^[\p{L}' -]+$/u };

export const normalizarEmail = (valor) => texto(valor).toLowerCase();
export const esEmail = (valor) =>
  valor.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);

// 8 a 72 caracteres, con al menos una letra y un número.
export function errorPassword(valor) {
  if (valor.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (valor.length > 72) return "La contraseña puede tener hasta 72 caracteres";
  if (!/\p{L}/u.test(valor) || !/\d/.test(valor)) {
    return "La contraseña debe tener al menos una letra y un número";
  }
  return null;
}

// ---------- Vehículos ----------

export const normalizarPatente = (valor) =>
  String(valor ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();

// 4 letras + 2 números desde 2007 (sin vocales ni M, N, Ñ, Q) o
// 2 letras + 4 números en el formato anterior.
export const esPatente = (patente) =>
  /^[BCDFGHJKLPRSTVWXYZ]{4}\d{2}$/.test(patente) || /^[A-Z]{2}\d{4}$/.test(patente);

// "b1" / "B 1" / "bx-02" -> "B-1" / "BX-2"; null si no calza.
export function normalizarNomenclatura(valor) {
  const m = String(valor ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .match(/^([A-Z]{1,3})-?(\d{1,3})$/);
  return m ? `${m[1]}-${Number(m[2])}` : null;
}

export const ANIO_MIN_VEHICULO = 1950;
export const MODELO_MAX = 60;

// ---------- Mantenciones ----------

export const KM_MAX = 2_000_000;
export const MONTO_MAX = 100_000_000;
export const TALLER = { min: 3, max: 100 };
export const DETALLE = { min: 10, max: 2000 };

// Monto en pesos: vacío vale (se decide aparte si es obligatorio);
// si viene, entero entre 0 y MONTO_MAX. Devuelve el mensaje o null.
export function errorMonto(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  return enteroEnRango(valor, 0, MONTO_MAX) === null
    ? "Debe ser un monto en pesos, sin decimales, entre $0 y $100.000.000"
    : null;
}

// ---------- Fallas ----------

export const DESCRIPCION_FALLA = { min: 10, max: 2000 };
