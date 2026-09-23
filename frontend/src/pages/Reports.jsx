import { themes, getChartColors } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { clp } from "../utils.js";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { IcBarChart, IcDownload } from "../components/Icons.jsx";

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

  const total = maintenance.reduce((s, m) => s + m.cost, 0);

  const perVehicle = vehicles
    .map((v) => ({
      code: v.code,
      cost: maintenance.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0),
    }))
    .filter((d) => d.cost > 0);

  const sorted = [...perVehicle].sort((a, b) => b.cost - a.cost);
  const maxCost = sorted.length > 0 ? sorted[0].cost : 0;
  const hasData = maintenance.length > 0 && perVehicle.length > 0;

  return (
    <div>
      <PageHeader
        title="Reportería y Costos"
        subtitle={`${maintenance.length} mantenciones registradas`}
      />
      <div className="px-4 pb-6 space-y-4 lg:px-8">
        {!hasData ? (
          <div className={t.card}>
            <EmptyState
              icon={<IcBarChart cls="w-7 h-7" />}
              title="No hay datos para reportar"
              subtitle="Registra mantenciones para visualizar costos y gráficos."
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <select defaultValue="year" className={t.select}>
                <option value="oct">Octubre 2024</option>
                <option value="nov">Noviembre 2024</option>
                <option value="year">Todo el año 2024</option>
              </select>
              <button className={`${t.smallBtn} shrink-0`}>
                <IcDownload cls="w-4 h-4" />
                Exportar PDF
              </button>
            </div>

            <div className={`${t.card} p-5`}>
              <p className={t.totalLabel}>Costo total de mantenciones</p>
              <p className={t.totalValue}>{clp(total)}</p>
              <p className={t.totalSub}>
                {maintenance.length} mantenciones · {vehicles.length} vehículos
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