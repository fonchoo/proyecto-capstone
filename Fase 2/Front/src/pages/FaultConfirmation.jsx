import { useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { IcCheck } from "../components/Icons.jsx";

export default function FaultConfirmation() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, vehiclesLoaded } = useVehicles();
  // Reporte recién creado (lo pasa ReportFault al navegar). Si se entra
  // directo a esta URL no hay reporte: se vuelve al vehículo.
  const reporte = useLocation().state?.reporte;

  const vehicle = vehicles.find((v) => v.id === id);
  if (!vehicle) return vehiclesLoaded ? <Navigate to="/dashboard" replace /> : null;
  if (!reporte) return <Navigate to={`/vehiculos/${vehicle.id}`} replace />;

  const fecha = new Date(reporte.fecha_reporte).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 pb-6 lg:px-8">
      <div className="w-full max-w-sm text-center">
        <div
          className={`${t.confirmCircle} ${
            theme === "v1" ? "w-24 h-24 mb-7 border border-emerald-500/20" : "w-20 h-20 mb-6"
          } mx-auto rounded-full flex items-center justify-center`}
        >
          <IcCheck cls={t.confirmCheck} />
        </div>
        <h2 className={`${t.confirmTitle} mt-0`}>Reporte Enviado</h2>
        <p className={`${t.confirmText} mb-1.5`}>
          El reporte de falla N° {reporte.id_reporte_falla} fue registrado exitosamente.
        </p>
        <p className={`${t.confirmText} mb-8`}>
          El <span className={theme === "v1" ? "text-white font-semibold" : "text-gray-900 font-semibold"}>Teniente Tercero de guardia</span> ha sido notificado{" "}
          {theme === "v1" && "y escalará la situación."}
        </p>

        <div className={`${t.summaryCard} mb-8 text-left`}>
          <p className={t.summaryLabel}>Estado actualizado</p>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={t.summaryCode}>{vehicle.code}</span>
                <span className={t.summaryType}>{vehicle.type}</span>
              </div>
              <p className={t.summarySub}>
                {vehicle.brand} {vehicle.model}
              </p>
            </div>
            <StatusBadge status={vehicle.status} />
          </div>
          <div className={`${t.menuDivider} my-3`} />
          <p className={t.summarySub}>
            Urgencia <span className="font-semibold capitalize">{reporte.urgencia}</span> · {fecha}
          </p>
        </div>

        <button onClick={() => navigate("/dashboard")} className={t.backDashBtn}>
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}