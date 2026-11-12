import { useState } from "react";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";

// Formulario de vehículo, compartido por crear (HU03, Dashboard) y
// editar (HU04, ficha del vehículo): mismos campos y mismas reglas que
// la API (validarVehiculo en Backend/src/routes/vehiculos.js).
// Obligatorios: nomenclatura, tipo, patente, marca, año y compañía.
//
// onSubmit(datos) es async: si lanza un Error, se muestra su mensaje y,
// si trae error.campos (400/409 de la API), cada uno bajo su input.
// El mensaje de éxito lo muestra la página: este formulario se cierra
// al guardar (ver MTC_0070).

const ESTADOS = [
  { value: "operativo", label: "Operativo" },
  { value: "en_mantencion", label: "En mantención" },
  { value: "no_operativo", label: "No operativo" },
];

// Sugerencias para "tipo"; se puede escribir cualquier otro.
const TIPOS_SUGERIDOS = ["Bomba", "Rescate", "Escala", "Cisterna", "Forestal", "Materiales peligrosos"];

export const VEHICULO_VACIO = {
  nomenclatura: "",
  tipo: "",
  patente: "",
  marca: "",
  modelo: "",
  ano_fabricacion: "",
  estado_vehiculo: "operativo",
  id_compania: "",
};

export default function VehicleForm({
  title,
  initial,
  companias,
  showEstado = false,
  submitLabel,
  savingLabel,
  onSubmit,
  onCancel,
}) {
  const { theme } = useTheme();
  const t = themes[theme];

  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!form.nomenclatura.trim()) errors.nomenclatura = "La nomenclatura es obligatoria";
    if (!form.tipo.trim()) errors.tipo = "El tipo es obligatorio";
    if (!form.patente.trim()) errors.patente = "La patente es obligatoria";
    if (!form.marca.trim()) errors.marca = "La marca es obligatoria";
    const anio = Number(form.ano_fabricacion);
    const actual = new Date().getFullYear();
    if (!form.ano_fabricacion || !Number.isInteger(anio) || anio < 1900 || anio > actual + 1) {
      errors.ano_fabricacion = form.ano_fabricacion
        ? `Año inválido (1900 - ${actual + 1})`
        : "El año es obligatorio";
    }
    if (!form.id_compania) errors.id_compania = "Selecciona una compañía";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({
        nomenclatura: form.nomenclatura.trim(),
        tipo: form.tipo.trim(),
        patente: form.patente.trim(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim() || null,
        ano_fabricacion: Number(form.ano_fabricacion),
        ...(showEstado ? { estado_vehiculo: form.estado_vehiculo } : {}),
        id_compania: Number(form.id_compania),
      });
    } catch (err) {
      setFormError(err.message);
      if (err.campos) setFieldErrors(err.campos);
      setSaving(false);
    }
  };

  const errorCls = theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600";

  const textField = (key, label, placeholder, extra = {}) => (
    <div>
      <label className={t.label} htmlFor={`veh-${key}`}>{label}</label>
      <input
        id={`veh-${key}`}
        type="text"
        value={form[key]}
        onChange={set(key)}
        placeholder={placeholder}
        className={`${t.input} ${fieldErrors[key] ? t.inputError : ""}`}
        {...extra}
      />
      {fieldErrors[key] && <p className={`${errorCls} mt-1`}>{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <div className={`${t.card} p-5 mt-4`}>
      <h2 className={t.cardTitle}>{title}</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {textField("nomenclatura", "Nomenclatura *", "Ej: B-4, Z-1")}
          {textField("tipo", "Tipo *", "Ej: Bomba", { list: "veh-tipos" })}
          <datalist id="veh-tipos">
            {TIPOS_SUGERIDOS.map((tipo) => (
              <option key={tipo} value={tipo} />
            ))}
          </datalist>
          {textField("patente", "Patente *", "Ej: KXPF-11")}
          {textField("marca", "Marca *", "Ej: Mercedes-Benz")}
          {textField("modelo", "Modelo", "Ej: Atego")}

          <div>
            <label className={t.label} htmlFor="veh-ano_fabricacion">Año de fabricación *</label>
            <input
              id="veh-ano_fabricacion"
              type="number"
              value={form.ano_fabricacion}
              onChange={set("ano_fabricacion")}
              placeholder={`Ej: ${new Date().getFullYear()}`}
              className={`${t.input} ${fieldErrors.ano_fabricacion ? t.inputError : ""}`}
            />
            {fieldErrors.ano_fabricacion && <p className={`${errorCls} mt-1`}>{fieldErrors.ano_fabricacion}</p>}
          </div>

          {showEstado && (
            <div>
              <label className={t.label} htmlFor="veh-estado">Estado</label>
              <select
                id="veh-estado"
                value={form.estado_vehiculo}
                onChange={set("estado_vehiculo")}
                className={t.select}
              >
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={showEstado ? "" : "sm:col-span-2"}>
            <label className={t.label} htmlFor="veh-compania">Compañía *</label>
            <select
              id="veh-compania"
              value={form.id_compania}
              onChange={set("id_compania")}
              className={`${t.select} ${fieldErrors.id_compania ? t.inputError : ""}`}
            >
              <option value="">Selecciona una compañía...</option>
              {companias.map((c) => (
                <option key={c.id_compania} value={c.id_compania}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {fieldErrors.id_compania && <p className={`${errorCls} mt-1`}>{fieldErrors.id_compania}</p>}
          </div>
        </div>

        {formError && <p className={errorCls}>{formError}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className={t.saveUserBtn}>
            {saving ? savingLabel : submitLabel}
          </button>
          <button type="button" onClick={onCancel} className={t.cancelBtn}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
