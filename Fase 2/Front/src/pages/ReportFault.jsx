import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { DESCRIPCION_FALLA, errorLargo } from "../validaciones.js";

export default function ReportFault() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, vehiclesLoaded, reportFault } = useVehicles();

  const vehicle = vehicles.find((v) => v.id === id);
  // Sin urgencia por defecto: quien reporta tiene que elegirla (antes
  // venía marcada "alta" y se enviaba sin pensarla).
  const [urgency, setUrgency] = useState("");
  const [urgencyError, setUrgencyError] = useState("");
  const [description, setDescription] = useState("");
  const [descError, setDescError] = useState("");
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);

  if (!vehicle) return vehiclesLoaded ? <Navigate to="/dashboard" replace /> : null;

  const errorCls = theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600";

  // Guarda el reporte en la API (tabla reporte_falla). La API deja el
  // vehículo "no_operativo" y registra quién reporta (la sesión).
  const onSubmit = async () => {
    setFormError("");
    // Mismas reglas que la API (POST /api/fallas).
    const desc = description.trim();
    const errDesc = !desc
      ? "Describe la falla antes de enviar el reporte"
      : errorLargo(desc, DESCRIPCION_FALLA.min, DESCRIPCION_FALLA.max) || "";
    const errUrg = urgency ? "" : "Elige la urgencia de la falla";
    setDescError(errDesc);
    setUrgencyError(errUrg);
    if (errDesc || errUrg) return;

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
      if (err.campos?.descripcion) setDescError(err.campos.descripcion);
      if (err.campos?.urgencia) setUrgencyError(err.campos.urgencia);
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
          <label className={t.label}>Urgencia *</label>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Urgencia">
            {(["alta", "media", "baja"]).map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={urgency === opt}
                onClick={() => {
                  setUrgency(opt);
                  setUrgencyError("");
                }}
                className={t.urgBtn(opt, urgency === opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          {urgencyError && <p className={`${errorCls} mt-1`}>{urgencyError}</p>}
        </div>

        <div>
          <label className={t.label}>Descripción de la falla *</label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (descError) setDescError("");
            }}
            rows={5}
            maxLength={DESCRIPCION_FALLA.max}
            placeholder="Describe la falla con precisión: síntomas observados, cuándo ocurre, sistemas afectados..."
            className={`${t.textarea} ${descError ? t.inputError : ""}`}
          />
          {descError ? (
            <p className={`${errorCls} mt-1`}>{descError}</p>
          ) : (
            <p className={`${t.note} mt-1`}>
              {description.trim().length}/{DESCRIPCION_FALLA.max} · mínimo {DESCRIPCION_FALLA.min} caracteres
            </p>
          )}
        </div>

        {/* Adjuntar foto: oculto hasta implementarlo. El botón venía del
            prototipo y solo marcaba «1 foto adjunta» sin elegir ni enviar
            ningún archivo (no hay columna, bucket de Storage ni ruta en la
            API). Los estilos photoBtn/photoIcon quedan en themeStyles.js. */}

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