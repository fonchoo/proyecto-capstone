import { Link } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { IcAlert, IcCheck, IcChevron } from "../components/Icons.jsx";

export default function Alerts() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { vehicles } = useVehicles();

  const alerts = vehicles
    .filter((v) => v.status !== "operational")
    .sort((a, b) => a.daysUntilNext - b.daysUntilNext);

  return (
    <div>
      <PageHeader
        title="Alertas"
        subtitle={
          vehicles.length === 0
            ? "Sin vehículos registrados"
            : `${alerts.length} vehículo${alerts.length !== 1 ? "s" : ""} requieren atención`
        }
      />
      <div className="px-4 pb-6 lg:px-8">
        {vehicles.length === 0 ? (
          <div className={t.card}>
            <EmptyState
              icon={<IcAlert cls="w-7 h-7" />}
              title="No hay vehículos registrados"
              subtitle="Registra vehículos para monitorear su mantención."
            />
          </div>
        ) : alerts.length === 0 ? (
          <div className={t.card}>
            <EmptyState
              icon={<IcCheck cls="w-7 h-7" />}
              title="Flota en óptimas condiciones"
              subtitle="No hay alertas pendientes"
            />
          </div>
        ) : (
          <div className={`${t.card} overflow-hidden`}>
            <div className={t.divide}>
              {alerts.map((v) => (
                <Link
                  key={v.id}
                  to={`/vehiculos/${v.id}`}
                  className={`${t.rowBtn} w-full flex items-center gap-4 px-4 py-4`}
                >
                  <div className={t.alertIconBox(v.status)}>
                    <IcAlert cls={t.alertIcon(v.status)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={t.vehCode}>{v.code}</span>
                      <span className={t.vehType}>{v.type}</span>
                    </div>
                    <p className={t.alertSub(v.status)}>
                      {v.daysUntilNext < 0
                        ? `Vencida hace ${Math.abs(v.daysUntilNext)} días`
                        : `Vence en ${v.daysUntilNext} días · ${v.nextMaintenance}`}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                  <IcChevron cls={t.chevron} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}