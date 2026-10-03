// Fecha "YYYY-MM-DD" (como la entrega la API) en formato chileno:
// "2026-09-10" -> "10-09-2026". Sin pasar por Date: así no hay
// corrimientos de día por zona horaria.
export function fecha(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}

// Suma meses a una fecha "YYYY-MM-DD" igual que Postgres
// ("+ interval 'N months'"): si el día no existe en el mes destino,
// usa el último día. 2026-08-31 + 6 -> 2027-02-28.
export function sumarMeses(iso, meses) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  const total = m - 1 + meses;
  const anio = y + Math.floor(total / 12);
  const mes = total % 12; // 0 = enero
  const ultimoDia = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const dia = Math.min(d, ultimoDia);
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

const dias = (n) => `${n} día${n === 1 ? "" : "s"}`;

// Texto y nivel del estado de la preventiva de un vehículo (lo calcula
// la API, ver Backend/src/preventiva.js).
//   nivel: "critical" (vencida) | "warning" (próxima) | "ok" | "none"
export function estadoPreventiva(v) {
  switch (v.preventiveStatus) {
    case "vencida":
      return {
        nivel: "critical",
        texto: `Preventiva vencida hace ${dias(-v.daysUntilNext)} · ${v.nextMaintenance}`,
      };
    case "proxima":
      return {
        nivel: "warning",
        texto:
          v.daysUntilNext === 0
            ? `Preventiva vence hoy · ${v.nextMaintenance}`
            : `Preventiva en ${dias(v.daysUntilNext)} · ${v.nextMaintenance}`,
      };
    case "al_dia":
      return { nivel: "ok", texto: `Próxima preventiva: ${v.nextMaintenance}` };
    default:
      return { nivel: "none", texto: "Sin preventiva registrada" };
  }
}

export function clp(n) {
  return `$${n.toLocaleString("es-CL")}`;
}