import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { themes, getChartColors } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { clp, fecha } from "../utils.js";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { IcBarChart, IcDownload } from "../components/Icons.jsx";

// Mes abrev. para las opciones del filtro y del PDF.
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MESES_ABBR = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Extrae "2026-09" de una fecha ISO (YYYY-MM-DDT...).
const mesClave = (iso) => (iso || "").slice(0, 7);

// Etiqueta legible de una clave año-mes: "Septiembre 2026".
const etiquetaMes = (clave) => {
  const [y, m] = clave.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
};

function CostBarChart({ data }) {
  const { theme } = useTheme();
  const c = getChartColors(theme);

  const max = Math.max(...data.map((d) => d.cost));
  const H = 140, barW = 32, gap = 18;
  const pL = 52, pR = 12, pT = 24, pB = 32;
  const W = data.length * (barW + gap) - gap;
  const svgW = W + pL + pR;
  const svgH = H + pT + pB;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ height: 210 }}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = pT + H - f * H;
        const val = f * max;
        const lbl =
          val >= 1000000 ? `${(val / 1e6).toFixed(1)}M` : val > 0 ? `${Math.round(val / 1000)}K` : "0";
        return (
          <g key={f}>
            <line x1={pL} y1={y} x2={pL + W} y2={y} stroke={c.grid} strokeWidth="1" strokeDasharray={f === 0 ? undefined : "3 3"} />
            <text x={pL - 6} y={y + 4} textAnchor="end" fontSize="9" fill={c.axis} fontFamily={theme === "v1" ? "JetBrains Mono, monospace" : undefined}>
              {lbl}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = pL + i * (barW + gap);
        const h = Math.max(3, (d.cost / max) * H);
        const y = pT + H - h;
        const lbl = d.cost >= 1e6 ? `${(d.cost / 1e6).toFixed(1)}M` : `${Math.round(d.cost / 1000)}K`;
        return (
          <g key={d.code}>
            <rect x={x} y={y} width={barW} height={h} rx="4" fill={c.bar} fillOpacity={c.barOpacity} />
            <rect x={x} y={y} width={barW} height={Math.min(h, 5)} rx="4" fill={c.barTop} />
            <text x={x + barW / 2} y={y - 7} textAnchor="middle" fontSize="9" fill={c.barLabel} fontFamily={theme === "v1" ? "JetBrains Mono, monospace" : undefined}>
              {lbl}
            </text>
            <text x={x + barW / 2} y={svgH - 5} textAnchor="middle" fontSize="10" fill={c.code} fontFamily={theme === "v1" ? "JetBrains Mono, monospace" : undefined}>
              {d.code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Reports() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { vehicles, maintenance } = useVehicles();

  // Opciones de período a partir de fechas reales de mantenciones.
  const periodOptions = useMemo(() => {
    const claves = [...new Set(maintenance.map((m) => mesClave(m.date)))].sort().reverse();
    return [
      { value: "all", label: "Todo el período" },
      ...claves.map((c) => ({ value: c, label: etiquetaMes(c) })),
      // HU13: rango de fechas libre (los meses quedan como atajos, RF-27).
      { value: "custom", label: "Rango personalizado…" },
    ];
  }, [maintenance]);

  const [period, setPeriod] = useState("all");
  // Rango personalizado ("YYYY-MM-DD"; vacío = sin límite por ese lado).
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const isCustom = period === "custom";
  const rangoInvalido = isCustom && desde && hasta && desde > hasta;

  // La fecha de referencia es la de INGRESO de la mantención: una que
  // entra el 28-09 y sale el 05-10 cuenta en septiembre.
  const filtered = useMemo(() => {
    if (period === "all") return maintenance;
    if (period === "custom") {
      if (rangoInvalido) return [];
      return maintenance.filter(
        (m) => (!desde || m.date >= desde) && (!hasta || m.date <= hasta)
      );
    }
    return maintenance.filter((m) => mesClave(m.date) === period);
  }, [maintenance, period, desde, hasta, rangoInvalido]);

  const total = filtered.reduce((s, m) => s + m.cost, 0);

  const perVehicle = vehicles
    .map((v) => ({
      code: v.code,
      cost: filtered.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0),
    }))
    .filter((d) => d.cost > 0);

  const sorted = [...perVehicle].sort((a, b) => b.cost - a.cost);
  const maxCost = sorted.length > 0 ? sorted[0].cost : 0;
  const hasData = filtered.length > 0 && perVehicle.length > 0;

  const periodLabel = !isCustom
    ? periodOptions.find((o) => o.value === period)?.label || "Todo el período"
    : desde && hasta
    ? `${fecha(desde)} al ${fecha(hasta)}`
    : desde
    ? `Desde ${fecha(desde)}`
    : hasta
    ? `Hasta ${fecha(hasta)}`
    : "Todo el período";

  const formatFecha = (iso) => {
    const [y, m, d] = (iso || "").slice(0, 10).split("-").map(Number);
    return `${d}/${MESES_ABBR[m - 1]}/${y}`;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const hoy = new Date();
    const emision = `${hoy.getDate()}/${MESES_ABBR[hoy.getMonth()]}/${hoy.getFullYear()}`;

    // Cabecera
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Reporteria y Costos de Mantenciones", 14, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Periodo: ${periodLabel}`, 14, 25);
    doc.text(`Emitido: ${emision}`, 14, 30);

    // Resumen
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Resumen", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${filtered.length} mantenciones`, 14, 46);
    doc.text(`Costo total: $${total.toLocaleString("es-CL")}`, 14, 51);

    // Tabla por vehículo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Costo por vehiculo", 14, 62);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Vehiculo", 14, 68);
    doc.text("Monto", 70, 68);
    doc.setFont("helvetica", "normal");
    doc.text("-".repeat(58), 14, 71);
    let y = 76;
    sorted.forEach((d) => {
      doc.text(d.code, 14, y);
      doc.text(`$${d.cost.toLocaleString("es-CL")}`, 70, y);
      y += 6;
    });
    doc.text("-".repeat(58), 14, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Total", 14, y);
    doc.text(`$${total.toLocaleString("es-CL")}`, 70, y);

    // Detalle de mantenciones (nueva página si es necesario)
    let yy = 44;
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detalle de mantenciones", 14, 18);
    doc.setFontSize(9);
    doc.text("Fecha", 14, 24);
    doc.text("Vehiculo", 40, 24);
    doc.text("Tipo", 70, 24);
    doc.text("Taller", 100, 24);
    doc.text("Monto", 170, 24);
    doc.setFont("helvetica", "normal");
    doc.text("-".repeat(75), 14, 27);
    filtered.forEach((m) => {
      if (yy > 280) {
        doc.addPage();
        yy = 20;
      }
      doc.text(formatFecha(m.date), 14, yy);
      doc.text(m.vehicleId ? (vehicles.find((v) => v.id === m.vehicleId)?.code || m.vehicleId) : "", 40, yy);
      doc.text(m.type || "", 70, yy);
      doc.text((m.workshop || "").slice(0, 30), 100, yy);
      doc.text(`$${m.cost.toLocaleString("es-CL")}`, 170, yy);
      yy += 6;
    });

    const nombre =
      period === "all"
        ? "reporte-costos"
        : isCustom
        ? `reporte-costos-${desde || "inicio"}_${hasta || "hoy"}`
        : `reporte-costos-${period}`;
    doc.save(`${nombre}.pdf`);
  };

  return (
    <div>
      <PageHeader
        title="Reportería y Costos"
        subtitle={
          period === "all"
            ? `${filtered.length} mantenciones registradas`
            : `${filtered.length} mantenciones · ${periodLabel}`
        }
      />
      <div className="px-4 pb-6 space-y-4 lg:px-8">
        {maintenance.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={t.select}
                aria-label="Período del reporte"
              >
                {periodOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                onClick={exportPDF}
                disabled={!hasData}
                className={`${t.smallBtn} shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <IcDownload cls="w-4 h-4" />
                Exportar PDF
              </button>
            </div>
            {isCustom && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={t.label} htmlFor="rango-desde">Desde</label>
                  <input
                    id="rango-desde"
                    type="date"
                    value={desde}
                    max={hasta || undefined}
                    onChange={(e) => setDesde(e.target.value)}
                    className={`${t.input} ${rangoInvalido ? t.inputError : ""}`}
                  />
                </div>
                <div>
                  <label className={t.label} htmlFor="rango-hasta">Hasta</label>
                  <input
                    id="rango-hasta"
                    type="date"
                    value={hasta}
                    min={desde || undefined}
                    onChange={(e) => setHasta(e.target.value)}
                    className={`${t.input} ${rangoInvalido ? t.inputError : ""}`}
                  />
                </div>
                <p className={`col-span-2 ${rangoInvalido ? (theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600") : t.histFooter}`}>
                  {rangoInvalido
                    ? "La fecha \"Desde\" no puede ser posterior a \"Hasta\"."
                    : "Se consideran las mantenciones por su fecha de ingreso."}
                </p>
              </div>
            )}
          </div>
        )}

        {!hasData ? (
          <div className={t.card}>
            <EmptyState
              icon={<IcBarChart cls="w-7 h-7" />}
              title="No hay datos para reportar"
              subtitle={maintenance.length === 0
                ? "Registra mantenciones para visualizar costos y gráficos."
                : "No hay mantenciones para el período seleccionado."}
            />
          </div>
        ) : (
          <>

            <div className={`${t.card} p-5`}>
              <p className={t.totalLabel}>Costo total de mantenciones{period !== "all" ? ` · ${periodLabel}` : ""}</p>
              <p className={t.totalValue}>{clp(total)}</p>
              <p className={t.totalSub}>
                {filtered.length} mantenciones · {perVehicle.length} vehículos
              </p>
            </div>

            <div className={`${t.card} p-5`}>
              <h2 className={t.chartTitle}>Costo por vehículo (CLP)</h2>
              <CostBarChart data={perVehicle} />
            </div>

            <div className={`${t.card} overflow-hidden`}>
              <div className={`px-4 py-3.5 ${t.cardBorder}`}>
                <h2 className={t.cardTitle}>Detalle por vehículo</h2>
              </div>
              <div className={t.divide}>
                {sorted.map((d) => (
                  <div key={d.code} className="flex items-center gap-3 px-4 py-3.5">
                    <span className={t.detCode}>{d.code}</span>
                    <div className="flex-1">
                      <div className={t.detTrack}>
                        <div className={t.detFill} style={{ width: `${maxCost > 0 ? (d.cost / maxCost) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <span className={t.detCost}>{clp(d.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}