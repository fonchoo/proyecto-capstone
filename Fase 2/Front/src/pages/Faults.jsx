import { useState } from "react";
import { Link } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { canRegisterMaintenance } from "../permissions.js";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { IcCheck } from "../components/Icons.jsx";

// ============================================================
// Panel de reportes de falla (HU06)
// ============================================================
//   Pendientes: el Teniente Tercero los revisa ordenados por urgencia
//               y los deriva al Inspector de Material Mayor.
//   Derivados:  esperan la mantención que los resuelve (HU07). El
//               Inspector la registra desde acá.
// Los reportes resueltos quedan en el historial de cada vehículo.
// ============================================================

const PESO_URGENCIA = { alta: 0, media: 1, baja: 2 };

// Más urgente primero; a igual urgencia, el más antiguo primero.
const porUrgencia = (a, b) =>
  PESO_URGENCIA[a.urgencia] - PESO_URGENCIA[b.urgencia] ||
  new Date(a.fecha_reporte) - new Date(b.fecha_reporte);

const fechaHora = (iso) =>
  new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });

export default function Faults() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { user, isAdmin, openFaults, deriveFault } = useVehicles();
  const [derivando, setDerivando] = useState(null);
  const [error, setError] = useState("");

  const pendientes = openFaults.filter((f) => f.estado_reporte === "pendiente").sort(porUrgencia);
  const derivados = openFaults.filter((f) => f.estado_reporte === "derivado").sort(porUrgencia);
  const puedeRegistrar = canRegisterMaintenance(user?.nombre_rol);

  const derivar = async (id) => {
    setError("");
    setDerivando(id);
    try {
      await deriveFault(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setDerivando(null);
    }
  };

  const errorCls = theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600";

  // Datos comunes de una fila de reporte.
  const encabezado = (f) => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={t.urgChip(f.urgencia)}>{f.urgencia}</span>
      <Link to={`/vehiculos/${f.id_vehiculo}`} className={`${t.vehCode} hover:underline`}>
        {f.nomenclatura}
      </Link>
      <span className={t.vehType}>{[f.marca, f.modelo].filter(Boolean).join(" ")}</span>
      {isAdmin && (
        <span className={t.companyTag} title={f.nombre_compania}>
          {f.nombre_compania}
        </span>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Reportes de falla"
        subtitle={`${pendientes.length} pendiente${pendientes.length !== 1 ? "s" : ""} · ${derivados.length} derivado${derivados.length !== 1 ? "s" : ""}`}
      />
      <div className="px-4 pb-6 space-y-4 lg:px-8">
        {error && <p className={errorCls}>{error}</p>}

        {/* ---------------- Pendientes ---------------- */}
        <section className={`${t.card} overflow-hidden`} aria-label="Reportes pendientes">
          <div className={`flex items-center justify-between px-4 py-3.5 ${t.cardBorder}`}>
            <h2 className={t.cardTitle}>Pendientes de derivar</h2>
            <span className={t.cardMeta}>ordenados por urgencia</span>
          </div>
          {pendientes.length === 0 ? (
            <EmptyState
              icon={<IcCheck cls="w-7 h-7" />}
              title="Sin reportes pendientes"
              subtitle="Los reportes nuevos aparecerán aquí."
            />
          ) : (
            <div className={t.divide}>
              {pendientes.map((f) => (
                <div key={f.id_reporte_falla} className="px-4 py-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {encabezado(f)}
                    <p className={t.histDesc}>{f.descripcion}</p>
                    <p className={t.histFooter}>
                      Reportado por {f.usuario_nombre} · {fechaHora(f.fecha_reporte)}
                    </p>
                  </div>
                  <button
                    onClick={() => derivar(f.id_reporte_falla)}
                    disabled={derivando === f.id_reporte_falla}
                    className={t.secondaryBtn}
                  >
                    {derivando === f.id_reporte_falla ? "Derivando..." : "Derivar al Inspector"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- Derivados ---------------- */}
        <section className={`${t.card} overflow-hidden`} aria-label="Reportes derivados">
          <div className={`flex items-center justify-between px-4 py-3.5 ${t.cardBorder}`}>
            <h2 className={t.cardTitle}>Derivados al Inspector</h2>
            <span className={t.cardMeta}>esperan mantención</span>
          </div>
          {derivados.length === 0 ? (
            <p className={theme === "v1" ? "text-sm text-gray-600 text-center py-10" : "text-sm text-gray-400 text-center py-10"}>
              Sin reportes derivados
            </p>
          ) : (
            <div className={t.divide}>
              {derivados.map((f) => (
                <div key={f.id_reporte_falla} className="px-4 py-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {encabezado(f)}
                    <p className={t.histDesc}>{f.descripcion}</p>
                    <p className={t.histFooter}>
                      Derivado por {f.derivado_por} · {fechaHora(f.fecha_derivacion)}
                    </p>
                  </div>
                  {f.id_mantencion ? (
                    <span className={t.stateChip("warning")}>En el taller</span>
                  ) : (
                    puedeRegistrar && (
                      <Link
                        to={`/vehiculos/${f.id_vehiculo}/registrar-mantencion?reporte=${f.id_reporte_falla}`}
                        className={t.secondaryBtn}
                      >
                        Registrar mantención
                      </Link>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
