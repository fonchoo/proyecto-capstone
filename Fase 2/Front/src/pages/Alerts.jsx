import { Link } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { IcAlert, IcCheck, IcChevron } from "../components/Icons.jsx";
import { estadoPreventiva } from "../utils.js";

// ============================================================
// Alertas de mantención PREVENTIVA (reglas en Backend/src/preventiva.js):
//   - Vencidas: primero, de la más atrasada a la menos.
//   - Próximas: vencen dentro de los días de aviso (30), de la más
//     cercana a la más lejana.
//   - Sin preventiva registrada: aparte, para que se registre la última
//     preventiva y el sistema pueda calcular su vencimiento.
// ============================================================

export default function Alerts() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { vehicles, isAdmin, config } = useVehicles();
  const diasAviso = config?.preventiva?.dias_aviso ?? 30;

  const porDias = (a, b) => a.daysUntilNext - b.daysUntilNext;
  const vencidas = vehicles.filter((v) => v.preventiveStatus === "vencida").sort(porDias);
  const proximas = vehicles.filter((v) => v.preventiveStatus === "proxima").sort(porDias);
  const alerts = [...vencidas, ...proximas];
  const sinRegistro = vehicles.filter((v) => v.preventiveStatus === "sin_registro");

  const companyTag = (v) =>
    isAdmin &&
    v.nombre_compania && (
      <span className={t.companyTag} title={v.nombre_compania}>
        {v.nombre_compania}
      </span>
    );

  return (
    <div>
      <PageHeader
        title="Alertas"
        subtitle={
          vehicles.length === 0
            ? "Sin vehículos registrados"
            : `${alerts.length} vehículo${alerts.length !== 1 ? "s" : ""} requieren mantención preventiva`
        }
      />
      <div className="px-4 pb-6 space-y-4 lg:px-8">
        {vehicles.length === 0 ? (
          <div className={t.card}>
            <EmptyState
              icon={<IcAlert cls="w-7 h-7" />}
              title="No hay vehículos registrados"
              subtitle="Registra vehículos para monitorear su mantención."
            />
          </div>
        ) : (
          <>
            {alerts.length === 0 ? (
              <div className={t.card}>
                <EmptyState
                  icon={<IcCheck cls="w-7 h-7" />}
                  title="Preventivas al día"
                  subtitle={`Ningún vehículo vence en los próximos ${diasAviso} días`}
                />
              </div>
            ) : (
              <div className={`${t.card} overflow-hidden`}>
                <div className={t.divide}>
                  {alerts.map((v) => {
                    const prev = estadoPreventiva(v);
                    return (
                      <Link
                        key={v.id}
                        to={`/vehiculos/${v.id}`}
                        className={`${t.rowBtn} w-full flex items-center gap-4 px-4 py-4`}
                      >
                        <div className={t.alertIconBox(prev.nivel)}>
                          <IcAlert cls={t.alertIcon(prev.nivel)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={t.vehCode}>{v.code}</span>
                            <span className={t.vehType}>{v.type}</span>
                            {companyTag(v)}
                          </div>
                          <p className={t.alertSub(prev.nivel)}>{prev.texto}</p>
                        </div>
                        <StatusBadge status={v.status} />
                        <IcChevron cls={t.chevron} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {sinRegistro.length > 0 && (
              <div className={`${t.card} overflow-hidden`}>
                <div className={`flex items-center justify-between px-4 py-3.5 ${t.cardBorder}`}>
                  <h2 className={t.cardTitle}>Sin preventiva registrada</h2>
                  <span className={t.cardMeta}>{sinRegistro.length} unidades</span>
                </div>
                <div className={t.divide}>
                  {sinRegistro.map((v) => (
                    <Link
                      key={v.id}
                      to={`/vehiculos/${v.id}`}
                      className={`${t.rowBtn} flex items-center gap-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={t.vehCode}>{v.code}</span>
                          <span className={t.vehType}>{v.type}</span>
                          {companyTag(v)}
                        </div>
                        <p className={t.vehSub}>
                          Registra su última preventiva para calcular el vencimiento
                        </p>
                      </div>
                      <StatusBadge status={v.status} />
                      <IcChevron cls={t.chevron} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
