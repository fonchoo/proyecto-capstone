import { useNavigate, useParams, Navigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { clp } from "../utils.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { IcAlert, IcTool } from "../components/Icons.jsx";

export default function VehicleDetail() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, maintenance } = useVehicles();

  const vehicle = vehicles.find((v) => v.id === id);
  if (!vehicle) return <Navigate to="/dashboard" replace />;

  const vehicleMaintenance = maintenance.filter((m) => m.vehicleId === vehicle.id);

  const infoFields = [
    ["Año", vehicle.year.toString()],
    ["Patente", vehicle.plate],
    ["Última mant.", vehicle.lastMaintenance],
    ["Próxima mant.", vehicle.nextMaintenance],
  ];

  return (
    <div>
      <PageHeader
        title={`${vehicle.code} · ${vehicle.type}`}
        onBack={() => navigate("/dashboard")}
      />
      <div className="px-4 pb-6 space-y-4 lg:px-8">
        <div className={`${t.card} p-5`}>
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <span className={`block ${t.vehCodeLg}`}>{vehicle.code}</span>
              <p className={t.detailBrand}>
                {vehicle.brand} {vehicle.model} · {vehicle.year}
              </p>
            </div>
            <StatusBadge status={vehicle.status} large />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {infoFields.map(([l, v]) => (
              <div key={l} className={t.infoTile}>
                <p className={t.infoTileLabel}>{l}</p>
                <p className={t.infoTileValue}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/vehiculos/${vehicle.id}/reportar-falla`)}
            className={t.reportFaultBtn}
          >
            <IcAlert cls="w-4 h-4" />
            Reportar Falla
          </button>
          <button
            onClick={() => navigate(`/vehiculos/${vehicle.id}/registrar-mantencion`)}
            className={t.registerBtn}
          >
            <IcTool cls="w-4 h-4" />
            Registrar Mantención
          </button>
        </div>

        <div className={`${t.card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-4 py-3.5 ${t.cardBorder}`}>
            <h2 className={t.cardTitle}>Historial de Mantenciones</h2>
            <span className={t.cardMeta}>{vehicleMaintenance.length} registros</span>
          </div>
          {vehicleMaintenance.length === 0 ? (
            <p className={theme === "v1" ? "text-sm text-gray-600 text-center py-10" : "text-sm text-gray-400 text-center py-10"}>
              {theme === "v1" ? "Sin registros de mantención" : "Sin registros"}
            </p>
          ) : (
            <div className={t.divide}>
              {vehicleMaintenance.map((m) => (
                <div key={m.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={t.histDate}>{m.date}</span>
                      <span className={t.histChip(m.type)}>{m.type}</span>
                    </div>
                    <span className={t.histCost}>{clp(m.cost)}</span>
                  </div>
                  <p className={t.histDesc}>{m.description}</p>
                  <p className={t.histFooter}>
                    {m.workshop} · M.O. {clp(m.labor)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}