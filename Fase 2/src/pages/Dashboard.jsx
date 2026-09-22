import { Link } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import MetricCard from "../components/MetricCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { IcAlert, IcChevron } from "../components/Icons.jsx";

export default function Dashboard() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { vehicles } = useVehicles();

  const now = new Date();
  const dateText =
    theme === "v1"
      ? now.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      : now.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const operational = vehicles.filter((v) => v.status === "operational").length;
  const warning = vehicles.filter((v) => v.status === "warning").length;
  const critical = vehicles.filter((v) => v.status === "critical").length;

  return (
    <div className="px-4 pb-6 lg:px-8">
      <div className="pt-6 pb-5 lg:pt-8 flex items-start justify-between gap-4">
        <div>
          <h1 className={t.h1}>Dashboard</h1>
          <p className={`${t.dashDate} mt-0.5`}>{dateText}</p>
        </div>
        {theme === "v1" && (
          <div className={`flex items-center gap-2 px-3 py-1.5 ${t.pill} rounded-full shrink-0 mt-1`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">En línea</span>
          </div>
        )}
      </div>

      {vehicles.length === 0 ? (
        <div className={t.card}>
          <EmptyState
            icon={<IcAlert cls="w-7 h-7" />}
            title="No hay vehículos registrados"
            subtitle="Cuando se registren vehículos, verás aquí su estado y mantención."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-3">
            <MetricCard value={operational} label="Operativos" accent="emerald" />
            <MetricCard value={warning} label="Mant. Próxima" accent="amber" />
            <MetricCard value={critical} label="No Operativos" accent="red" />
          </div>

          <div className={`${t.card} overflow-hidden`}>
            <div className={`flex items-center justify-between px-4 py-3.5 ${t.cardBorder}`}>
              <h2 className={t.cardTitle}>Flota de Emergencia</h2>
              <span className={t.cardMeta}>{vehicles.length} unidades</span>
            </div>
            <div className={t.divide}>
              {vehicles.map((v) => (
                <Link
                  key={v.id}
                  to={`/vehiculos/${v.id}`}
                  className={`${t.rowBtn} flex items-center gap-3`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={t.vehCode}>{v.code}</span>
                      <span className={t.dot}>·</span>
                      <span className={t.vehType}>{v.type}</span>
                    </div>
                    <p className={t.vehSub}>
                      {v.status === "critical"
                        ? `Vencida hace ${Math.abs(v.daysUntilNext)} días · ${v.nextMaintenance}`
                        : v.status === "warning"
                        ? `Próxima: ${v.nextMaintenance} · ${v.daysUntilNext}d`
                        : `Última: ${v.lastMaintenance}`}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                  <IcChevron cls={t.chevron} />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}