import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { canRegisterMaintenance } from "../permissions.js";
import { clp, estadoPreventiva, fecha } from "../utils.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { IcAlert, IcTool } from "../components/Icons.jsx";

// Nombre legible del estado de un reporte de falla.
const ESTADO_FALLA = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelto: "Resuelto",
};

export default function VehicleDetail() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, vehiclesLoaded, maintenance, user, isAdmin } = useVehicles();

  const vehicle = vehicles.find((v) => v.id === id);

  // Historial de fallas del vehículo (tabla reporte_falla). Va ANTES
  // del return de abajo: los hooks no pueden quedar condicionados.
  const [faults, setFaults] = useState([]);
  useEffect(() => {
    if (!vehicle) return;
    let mounted = true;
    fetch(`/api/fallas?id_vehiculo=${vehicle.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => mounted && setFaults(rows))
      .catch(() => mounted && setFaults([]));
    return () => {
      mounted = false;
    };
  }, [vehicle?.id]);

  if (!vehicle) return vehiclesLoaded ? <Navigate to="/dashboard" replace /> : null;

  const vehicleMaintenance = maintenance.filter((m) => m.vehicleId === vehicle.id);

  const allowMaintenance = canRegisterMaintenance(user?.nombre_rol);

  const prev = estadoPreventiva(vehicle);

  const infoFields = [
    ["Año", vehicle.year.toString()],
    ["Patente", vehicle.plate],
    ["Última preventiva", vehicle.lastMaintenance],
    ["Próxima preventiva", vehicle.nextMaintenance],
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
              {/* Compañía de origen: solo para el administrador. */}
              {isAdmin && vehicle.nombre_compania && (
                <span className={`inline-block mt-2 ${t.companyTag}`}>
                  {vehicle.nombre_compania}
                </span>
              )}
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
          {/* Aviso solo cuando la preventiva está próxima o vencida. */}
          {(prev.nivel === "critical" || prev.nivel === "warning") && (
            <p className={`${t.alertSub(prev.nivel)} mt-3`}>{prev.texto}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/vehiculos/${vehicle.id}/reportar-falla`)}
            className={t.reportFaultBtn}
          >
            <IcAlert cls="w-4 h-4" />
            Reportar Falla
          </button>
          {allowMaintenance && (
            <button
              onClick={() => navigate(`/vehiculos/${vehicle.id}/registrar-mantencion`)}
              className={t.registerBtn}
            >
              <IcTool cls="w-4 h-4" />
              Registrar Mantención
            </button>
          )}
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
                      <span className={t.histDate}>{fecha(m.date)}</span>
                      <span className={t.histChip(m.type)}>{m.type}</span>
                    </div>
                    <span className={t.histCost}>{clp(m.cost)}</span>
                  </div>
                  <p className={t.histDesc}>{m.description}</p>
                  <p className={t.histFooter}>
                    {m.workshop} · Repuestos {clp(m.parts)} · M.O. {clp(m.labor)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${t.card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-4 py-3.5 ${t.cardBorder}`}>
            <h2 className={t.cardTitle}>Historial de Fallas</h2>
            <span className={t.cardMeta}>{faults.length} reportes</span>
          </div>
          {faults.length === 0 ? (
            <p className={theme === "v1" ? "text-sm text-gray-600 text-center py-10" : "text-sm text-gray-400 text-center py-10"}>
              Sin fallas reportadas
            </p>
          ) : (
            <div className={t.divide}>
              {faults.map((f) => (
                <div key={f.id_reporte_falla} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={t.histDate}>
                        {new Date(f.fecha_reporte).toLocaleString("es-CL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <span className={t.urgChip(f.urgencia)}>{f.urgencia}</span>
                    </div>
                    <span className={t.histFooter}>{ESTADO_FALLA[f.estado_reporte] || f.estado_reporte}</span>
                  </div>
                  <p className={t.histDesc}>{f.descripcion}</p>
                  <p className={t.histFooter}>Reportado por {f.usuario_nombre}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}