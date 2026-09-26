import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import PageHeader from "../components/PageHeader.jsx";

const FORM_INICIAL = {
  fecha_ingreso: "",
  fecha_salida: "",
  kilometraje_ingreso: "",
  detalle_trabajo: "",
  proveedor: "",
  costo_total: "",
  mano_obra: "",
};

export default function RegisterMaintenance() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, user, addMaintenance } = useVehicles();

  const vehicle = vehicles.find((v) => v.id === id);

  const [tipos, setTipos] = useState([]);
  const [idTipo, setIdTipo] = useState("");
  const [form, setForm] = useState(FORM_INICIAL);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const errorCls = theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600";

  // Carga los tipos de mantención disponibles.
  useEffect(() => {
    let mounted = true;
    fetch("/api/tipos-mantencion")
      .then((r) => r.json())
      .then((rows) => {
        if (!mounted) return;
        setTipos(rows);
        if (rows.length > 0) setIdTipo(String(rows[0].id_tipo_mantencion));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!vehicle) return <Navigate to="/dashboard" replace />;

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!form.fecha_ingreso) {
      errors.fecha_ingreso = "La fecha es obligatoria";
    }
    if (form.fecha_salida && form.fecha_ingreso && form.fecha_salida < form.fecha_ingreso) {
      errors.fecha_salida = "La fecha de salida no puede ser anterior al ingreso";
    }
    if (form.kilometraje_ingreso && Number(form.kilometraje_ingreso) < 0) {
      errors.kilometraje_ingreso = "El kilometraje no puede ser negativo";
    }
    if (form.costo_total && Number(form.costo_total) < 0) {
      errors.costo_total = "El costo no puede ser negativo";
    }
    if (form.mano_obra && Number(form.mano_obra) < 0) {
      errors.mano_obra = "El costo no puede ser negativo";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!user) {
      setFormError("Debes iniciar sesión para registrar una mantención");
      return;
    }

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await addMaintenance({
        fecha_ingreso: form.fecha_ingreso,
        fecha_salida: form.fecha_salida || null,
        kilometraje_ingreso: form.kilometraje_ingreso ? Number(form.kilometraje_ingreso) : null,
        detalle_trabajo: form.detalle_trabajo.trim() || null,
        proveedor: form.proveedor.trim() || null,
        costo_total: form.costo_total ? Number(form.costo_total) : null,
        mano_obra: form.mano_obra ? Number(form.mano_obra) : null,
        id_vehiculo: Number(vehicle.id),
        id_tipo_mantencion: Number(idTipo),
        id_usuario: user.id_usuario,
      });
      navigate(`/vehiculos/${vehicle.id}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Registrar Mantención"
        subtitle={`${vehicle.code} · ${vehicle.type}`}
        onBack={() => navigate(`/vehiculos/${vehicle.id}`)}
      />
      <div className="px-4 pb-6 space-y-6 lg:px-8">
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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className={t.label}>Tipo de mantención</label>
            <select
              value={idTipo}
              onChange={(e) => setIdTipo(e.target.value)}
              className={t.select}
            >
              {tipos.map((tm) => (
                <option key={tm.id_tipo_mantencion} value={tm.id_tipo_mantencion}>
                  {tm.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={t.label}>Fecha de ingreso *</label>
              <input
                type="date"
                value={form.fecha_ingreso}
                onChange={set("fecha_ingreso")}
                className={`${t.input} ${fieldErrors.fecha_ingreso ? t.inputError : ""}`}
              />
              {fieldErrors.fecha_ingreso && (
                <p className={`${errorCls} mt-1`}>{fieldErrors.fecha_ingreso}</p>
              )}
            </div>
            <div>
              <label className={t.label}>Fecha de salida</label>
              <input
                type="date"
                value={form.fecha_salida}
                onChange={set("fecha_salida")}
                className={`${t.input} ${fieldErrors.fecha_salida ? t.inputError : ""}`}
              />
              {fieldErrors.fecha_salida && (
                <p className={`${errorCls} mt-1`}>{fieldErrors.fecha_salida}</p>
              )}
            </div>
          </div>

          <div>
            <label className={t.label}>Kilometraje de ingreso (km)</label>
            <input
              type="number"
              value={form.kilometraje_ingreso}
              onChange={set("kilometraje_ingreso")}
              placeholder="Ej: 58000"
              className={`${t.input} ${fieldErrors.kilometraje_ingreso ? t.inputError : ""}`}
            />
            {fieldErrors.kilometraje_ingreso && (
              <p className={`${errorCls} mt-1`}>{fieldErrors.kilometraje_ingreso}</p>
            )}
          </div>

          <div>
            <label className={t.label}>Detalle del trabajo / Insumos utilizados</label>
            <textarea
              rows={2}
              value={form.detalle_trabajo}
              onChange={set("detalle_trabajo")}
              placeholder="Ej: Cambio de aceite 15W-40, filtro de aceite, revisión de frenos"
              className={t.textarea}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={t.label}>Mano de obra ($)</label>
              <input
                type="number"
                value={form.mano_obra}
                onChange={set("mano_obra")}
                placeholder="0"
                className={`${t.input} ${fieldErrors.mano_obra ? t.inputError : ""}`}
              />
              {fieldErrors.mano_obra && (
                <p className={`${errorCls} mt-1`}>{fieldErrors.mano_obra}</p>
              )}
            </div>
            <div>
              <label className={t.label}>Costo total ($)</label>
              <input
                type="number"
                value={form.costo_total}
                onChange={set("costo_total")}
                placeholder="0"
                className={`${t.input} ${fieldErrors.costo_total ? t.inputError : ""}`}
              />
              {fieldErrors.costo_total && (
                <p className={`${errorCls} mt-1`}>{fieldErrors.costo_total}</p>
              )}
            </div>
          </div>

          <div>
            <label className={t.label}>Taller / Mecánico</label>
            <input
              type="text"
              value={form.proveedor}
              onChange={set("proveedor")}
              placeholder="Ej: Taller Central Bomberos"
              className={t.input}
            />
          </div>

          {formError && <p className={errorCls}>{formError}</p>}

          <button type="submit" disabled={saving} className={t.saveMaintBtn}>
            {saving ? "Guardando..." : "Guardar Mantención"}
          </button>
        </form>
      </div>
    </div>
  );
}