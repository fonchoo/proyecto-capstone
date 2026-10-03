import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { IcCamera, IcCheck } from "../components/Icons.jsx";

export default function ReportFault() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, vehiclesLoaded, reportFault } = useVehicles();

  const vehicle = vehicles.find((v) => v.id === id);
  const [urgency, setUrgency] = useState("alta");
  const [description, setDescription] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [descError, setDescError] = useState("");
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);

  if (!vehicle) return vehiclesLoaded ? <Navigate to="/dashboard" replace /> : null;

  const errorCls = theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600";

  // Guarda el reporte en la API (tabla reporte_falla). La API deja el
  // vehículo "no_operativo" y registra quién reporta (la sesión).
  const onSubmit = async () => {
    setFormError("");
    if (!description.trim()) {
      setDescError("Describe la falla antes de enviar el reporte");
      return;
    }

    setSending(true);
    try {
      const reporte = await reportFault({
        id_vehiculo: Number(vehicle.id),
        urgencia: urgency,
        descripcion: description.trim(),
      });
      // La confirmación muestra el reporte recién creado.
      navigate(`/vehiculos/${vehicle.id}/reportar-falla/enviado`, {
        replace: true,
        state: { reporte },
      });
    } catch (err) {
      setFormError(err.message);
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reportar Falla"
        subtitle={`${vehicle.code} · ${vehicle.type} · ${vehicle.brand}`}
        onBack={() => navigate(`/vehiculos/${vehicle.id}`)}
      />
      <div className="px-4 pb-6 space-y-5 lg:px-8">
        <div>
          <label className={t.label}>Vehículo</label>
          <div className={t.fieldBox}>
            <span className={t.vehCode}>{vehicle.code}</span>
            <span className={t.dot}>·</span>
            <span className={`${t.vehType} flex-1`}>
              {vehicle.type} · {vehicle.brand}
            </span>
            <StatusBadge status={vehicle.status} />
          </div>
        </div>

        <div>
          <label className={t.label}>Urgencia</label>
          <div className="grid grid-cols-3 gap-2">
            {(["alta", "media", "baja"]).map((opt) => (
              <button key={opt} onClick={() => setUrgency(opt)} className={t.urgBtn(opt, urgency === opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={t.label}>Descripción de la falla</label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (descError) setDescError("");
            }}
            rows={5}
            maxLength={2000}
            placeholder="Describe la falla con precisión: síntomas observados, cuándo ocurre, sistemas afectados..."
            className={`${t.textarea} ${descError ? t.inputError : ""}`}
          />
          {descError && <p className={`${errorCls} mt-1`}>{descError}</p>}
        </div>

        <button onClick={() => setHasPhoto(!hasPhoto)} className={t.photoBtn(hasPhoto)}>
          <IcCamera cls={`w-4 h-4 shrink-0 ${t.photoIcon}`} />
          <span className="flex-1 text-left">
            {hasPhoto ? "1 foto adjunta" : "Adjuntar foto (opcional)"}
          </span>
          {hasPhoto && <IcCheck cls={t.checkIcon} />}
        </button>

        {formError && <p className={errorCls}>{formError}</p>}

        <button
          onClick={onSubmit}
          disabled={sending}
          className={`${t.submitReportBtn} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {sending
            ? "Enviando..."
            : theme === "v1"
            ? "Enviar Reporte de Falla"
            : "Enviar Reporte"}
        </button>
        <p className={t.note}>
          El reporte será enviado al Teniente Tercero de guardia.
        </p>
      </div>
    </div>
  );
}