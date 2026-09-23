import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function RegisterMaintenance() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles } = useVehicles();

  const vehicle = vehicles.find((v) => v.id === id);
  const [type, setType] = useState("preventiva");

  if (!vehicle) return <Navigate to="/dashboard" replace />;

  return (
    <div>
      <PageHeader
        title="Registrar Mantención"
        subtitle={`${vehicle.code} · ${vehicle.type}`}
        onBack={() => navigate(`/vehiculos/${vehicle.id}`)}
      />
      <div className="px-4 pb-6 space-y-4 lg:px-8">
        <div>
          <label className={t.label}>Vehículo</label>
          <div className={t.fieldBox}>
            <span className={t.vehCode}>{vehicle.code}</span>
            <span className={t.dot}>·</span>
            <span className={`${t.vehType} truncate`}>
              {vehicle.type} · {vehicle.brand}
            </span>
          </div>
        </div>

        <div>
          <label className={t.label}>Tipo de mantención</label>
          <div className="grid grid-cols-2 gap-2">
            {["preventiva", "reactiva"].map((opt) => (
              <button key={opt} onClick={() => setType(opt)} className={t.typeBtn(type === opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={t.label}>Fecha</label>
          <input type="date" className={t.input} />
        </div>

        <div>
          <label className={t.label}>Insumos utilizados</label>
          <textarea
            rows={2}
            placeholder="Ej: Aceite 15W-40 (10L), filtro de aceite"
            className={t.textarea}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={t.label}>Mano de obra ($)</label>
            <input type="number" placeholder="0" className={t.input} />
          </div>
          <div>
            <label className={t.label}>Costo total ($)</label>
            <input type="number" placeholder="0" className={t.input} />
          </div>
        </div>

        <div>
          <label className={t.label}>Taller / Mecánico</label>
          <input type="text" placeholder="Ej: Taller Central Bomberos" className={t.input} />
        </div>

        <button
          onClick={() => navigate(`/vehiculos/${vehicle.id}`)}
          className={t.saveMaintBtn}
        >
          Guardar Mantención
        </button>
      </div>
    </div>
  );
}