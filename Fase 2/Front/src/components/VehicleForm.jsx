import { useState } from "react";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import {
  ANIO_MIN_VEHICULO,
  MODELO_MAX,
  esPatente,
  normalizarNomenclatura,
  normalizarPatente,
  texto,
} from "../validaciones.js";

// Formulario de vehículo, compartido por crear (HU03, Dashboard) y
// editar (HU04, ficha del vehículo): mismos campos y mismas reglas que
// la API (validarVehiculo en Backend/src/routes/vehiculos.js).
// Obligatorios: nomenclatura, tipo, patente, marca, año y compañía.
//
// Tipo y marca son listas cerradas y el modelo se sugiere según la
// marca. Las listas llegan de GET /api/config (config.vehiculos, ver
// Backend/src/catalogoVehiculos.js): no se copian acá para que haya
// una sola fuente.
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

// Opciones de un select cerrado. Si el vehículo que se edita trae un
// valor que ya no está en la lista (datos anteriores al catálogo), se
// muestra igual para que se vea qué tenía; al guardar, la validación
// pide elegir uno de la lista.
const opciones = (lista, actual) =>
  actual && !lista.includes(actual) ? [actual, ...lista] : lista;

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
  const { config } = useVehicles();
  const tipos = config?.vehiculos?.tipos ?? [];
  const catalogoMarcas = config?.vehiculos?.marcas ?? {};
  const marcas = Object.keys(catalogoMarcas).sort((a, b) => a.localeCompare(b, "es"));

  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Modelos sugeridos de la marca elegida (se puede escribir otro).
  const sugerencias = catalogoMarcas[form.marca] ?? [];

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const errors = {};
    const actual = new Date().getFullYear();

    if (!form.nomenclatura.trim()) errors.nomenclatura = "La nomenclatura es obligatoria";
    else if (!normalizarNomenclatura(form.nomenclatura)) {
      errors.nomenclatura = "Usa la sigla y el número del carro, por ejemplo B-1 o BX-2";
    }

    if (!form.tipo) errors.tipo = "El tipo es obligatorio";
    else if (tipos.length && !tipos.includes(form.tipo)) errors.tipo = "Elige un tipo de la lista";

    const patente = normalizarPatente(form.patente);
    if (!patente) errors.patente = "La patente es obligatoria";
    else if (!esPatente(patente)) {
      errors.patente = "La patente debe ser de 4 letras y 2 números (KLHT-21) o de 2 letras y 4 números (AB-1234)";
    }

    if (!form.marca) errors.marca = "La marca es obligatoria";
    else if (marcas.length && !marcas.includes(form.marca)) errors.marca = "Elige una marca de la lista";

    if (texto(form.modelo).length > MODELO_MAX) errors.modelo = `Máximo ${MODELO_MAX} caracteres`;

    const anio = Number(form.ano_fabricacion);
    if (!form.ano_fabricacion || !Number.isInteger(anio) || anio < ANIO_MIN_VEHICULO || anio > actual + 1) {
      errors.ano_fabricacion = form.ano_fabricacion
        ? `Año inválido (${ANIO_MIN_VEHICULO} - ${actual + 1})`
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
        nomenclatura: normalizarNomenclatura(form.nomenclatura),
        tipo: form.tipo,
        patente: normalizarPatente(form.patente),
        marca: form.marca,
        modelo: texto(form.modelo) || null,
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
  const errorDe = (key) =>
    fieldErrors[key] && <p className={`${errorCls} mt-1`}>{fieldErrors[key]}</p>;

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
      {errorDe(key)}
    </div>
  );

  const selectField = (key, label, lista, vacioLabel) => (
    <div>
      <label className={t.label} htmlFor={`veh-${key}`}>{label}</label>
      <select
        id={`veh-${key}`}
        value={form[key]}
        onChange={set(key)}
        className={`${t.select} ${fieldErrors[key] ? t.inputError : ""}`}
      >
        <option value="">{vacioLabel}</option>
        {opciones(lista, initial[key]).map((valor) => (
          <option key={valor} value={valor}>
            {valor}
          </option>
        ))}
      </select>
      {errorDe(key)}
    </div>
  );

  return (
    <div className={`${t.card} p-5 mt-4`}>
      <h2 className={t.cardTitle}>{title}</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {textField("nomenclatura", "Nomenclatura *", "Ej: B-4, BX-1", { maxLength: 8 })}
          {selectField("tipo", "Tipo *", tipos, "Selecciona un tipo...")}
          {textField("patente", "Patente *", "Ej: KLHT-21", { maxLength: 10, autoCapitalize: "characters" })}
          {selectField("marca", "Marca *", marcas, "Selecciona una marca...")}
          {textField("modelo", "Modelo", sugerencias.length ? `Ej: ${sugerencias[0]}` : "Ej: Atego 1726", {
            list: "veh-modelos",
            maxLength: MODELO_MAX,
          })}
          <datalist id="veh-modelos">
            {sugerencias.map((modelo) => (
              <option key={modelo} value={modelo} />
            ))}
          </datalist>

          <div>
            <label className={t.label} htmlFor="veh-ano_fabricacion">Año de fabricación *</label>
            <input
              id="veh-ano_fabricacion"
              type="number"
              min={ANIO_MIN_VEHICULO}
              max={new Date().getFullYear() + 1}
              value={form.ano_fabricacion}
              onChange={set("ano_fabricacion")}
              placeholder={`Ej: ${new Date().getFullYear()}`}
              className={`${t.input} ${fieldErrors.ano_fabricacion ? t.inputError : ""}`}
            />
            {errorDe("ano_fabricacion")}
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
            {errorDe("id_compania")}
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
