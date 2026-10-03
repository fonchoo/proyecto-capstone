import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { canRegisterMaintenance } from "../permissions.js";
import { clp, estadoPreventiva, fecha, hoyChile } from "../utils.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { IcAlert, IcTool } from "../components/Icons.jsx";

// Estado de un reporte de falla: texto y tono de la etiqueta.
const ESTADO_FALLA = {
  pendiente: ["Pendiente", "warning"],
  derivado: ["Derivado", "info"],
  resuelto: ["Resuelto", "ok"],
};

export default function VehicleDetail() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, vehiclesLoaded, maintenance, user, isAdmin, finishMaintenance } =
    useVehicles();

  const vehicle = vehicles.find((v) => v.id === id);

  // Historial de fallas del vehículo (tabla reporte_falla). Va ANTES
  // del return de abajo: los hooks no pueden quedar condicionados.
  const [faults, setFaults] = useState([]);
  // Finalizar mantención (HU07): { id, date } de la que se está cerrando.
  const [finishing, setFinishing] = useState(null);
  const [finishError, setFinishError] = useState("");
  const [savingFinish, setSavingFinish] = useState(false);
  // Se recarga también cuando cambian las mantenciones: al finalizar
  // una, sus reportes pasan a "resuelto".
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
  }, [vehicle?.id, maintenance]);

  if (!vehicle) return vehiclesLoaded ? <Navigate to="/dashboard" replace /> : null;

  const vehicleMaintenance = maintenance.filter((m) => m.vehicleId === vehicle.id);

  const allowMaintenance = canRegisterMaintenance(user?.nombre_rol);

  const prev = estadoPreventiva(vehicle);
  const errorCls = theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600";

  const confirmFinish = async () => {
    setFinishError("");
    setSavingFinish(true);
    try {
      await finishMaintenance(finishing.id, finishing.date);
      setFinishing(null);
    } catch (err) {
      setFinishError(err.message);
    } finally {
      setSavingFinish(false);
    }
  };

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
            <span className={t.cardMeta}>
              {vehicleMaintenance.length} registro{vehicleMaintenance.length !== 1 ? "s" : ""}
            </span>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={t.histDate}>
                        {fecha(m.date)}
                        {m.exitDate ? ` → ${fecha(m.exitDate)}` : ""}
                      </span>
                      <span className={t.histChip(m.type)}>{m.type}</span>
                      <span className={t.stateChip(m.status === "en_proceso" ? "warning" : "ok")}>
                        {m.status === "en_proceso" ? "En proceso" : "Finalizada"}
                      </span>
                    </div>
                    <span className={t.histCost}>{clp(m.cost)}</span>
                  </div>
                  <p className={t.histDesc}>{m.description}</p>
                  <p className={t.histFooter}>
                    {m.workshop} · Repuestos {clp(m.parts)} · M.O. {clp(m.labor)}
                    {m.linkedReports > 0 &&
                      ` · Resuelve ${m.linkedReports} falla${m.linkedReports !== 1 ? "s" : ""}`}
                  </p>

                  {/* HU07: cerrar la mantención registrando la salida. */}
                  {m.status === "en_proceso" && allowMaintenance && (
                    finishing?.id === m.id ? (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <label className={t.histFooter} htmlFor={`salida-${m.id}`}>
                          Fecha de salida
                        </label>
                        <input
                          id={`salida-${m.id}`}
                          type="date"
                          value={finishing.date}
                          min={m.date}
                          max={hoyChile()}
                          onChange={(e) => setFinishing({ ...finishing, date: e.target.value })}
                          className={`${t.input} !w-auto !py-1.5`}
                        />
                        <button
                          onClick={confirmFinish}
                          disabled={savingFinish || !finishing.date}
                          className={t.secondaryBtn}
                        >
                          {savingFinish ? "Guardando..." : "Confirmar"}
                        </button>
                        <button
                          onClick={() => {
                            setFinishing(null);
                            setFinishError("");
                          }}
                          className={t.secondaryBtn}
                        >
                          Cancelar
                        </button>
                        {finishError && <p className={`${errorCls} w-full`}>{finishError}</p>}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setFinishError("");
                          setFinishing({ id: m.id, date: hoyChile() });
                        }}
                        className={`${t.secondaryBtn} mt-3`}
                      >
                        Finalizar mantención
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${t.card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-4 py-3.5 ${t.cardBorder}`}>
            <h2 className={t.cardTitle}>Historial de Fallas</h2>
            <span className={t.cardMeta}>
              {faults.length} reporte{faults.length !== 1 ? "s" : ""}
            </span>
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
                    <span className={t.stateChip(ESTADO_FALLA[f.estado_reporte]?.[1])}>
                      {ESTADO_FALLA[f.estado_reporte]?.[0] || f.estado_reporte}
                    </span>
                  </div>
                  <p className={t.histDesc}>{f.descripcion}</p>
                  <p className={t.histFooter}>
                    Reportado por {f.usuario_nombre}
                    {f.derivado_por && ` · Derivado por ${f.derivado_por}`}
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