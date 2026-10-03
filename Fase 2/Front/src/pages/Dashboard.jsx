import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import MetricCard from "../components/MetricCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { IcAlert, IcChevron, IcPlus } from "../components/Icons.jsx";
import { estadoPreventiva } from "../utils.js";

const ESTADOS = [
  { value: "operativo", label: "Operativo" },
  { value: "en_mantencion", label: "En mantención" },
  { value: "no_operativo", label: "No operativo" },
];

const FORM_INICIAL = {
  nomenclatura: "",
  patente: "",
  marca: "",
  modelo: "",
  ano_fabricacion: "",
  estado_vehiculo: "operativo",
  id_compania: "",
};

export default function Dashboard() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { vehicles, user, addVehicle, selectedCompania, isAdmin, config } = useVehicles();
  const diasAviso = config?.preventiva?.dias_aviso ?? 30;

  const [showForm, setShowForm] = useState(false);
  const [companias, setCompanias] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const dateText =
    theme === "v1"
      ? now.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      : now.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Estado operativo (estado_vehiculo) y estado de la preventiva son
  // dos cosas distintas: un carro puede estar operativo con la
  // preventiva vencida.
  // HU12: operativos, en mantención y no operativos, por separado.
  const operational = vehicles.filter((v) => v.status === "operational").length;
  const inMaintenance = vehicles.filter((v) => v.status === "warning").length;
  const notOperational = vehicles.filter((v) => v.status === "critical").length;
  const preventiveSoon = vehicles.filter((v) => v.preventiveStatus === "proxima").length;
  const preventiveOverdue = vehicles.filter((v) => v.preventiveStatus === "vencida").length;

  // Carga las compañías para el selector (la API devuelve solo las
  // del alcance del usuario) y preselecciona la elegida en el TopNav
  // (administrador) o, si no hay, la del usuario autenticado.
  useEffect(() => {
    let mounted = true;
    fetch("/api/companias")
      .then((r) => r.json())
      .then((rows) => {
        if (!mounted) return;
        setCompanias(rows);
        setForm((f) => ({
          ...f,
          id_compania: selectedCompania
            ? String(selectedCompania)
            : user?.id_compania
            ? String(user.id_compania)
            : f.id_compania,
        }));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [user?.id_compania, selectedCompania]);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!form.nomenclatura.trim()) {
      errors.nomenclatura = "La nomenclatura es obligatoria";
    }
    if (form.ano_fabricacion) {
      const anio = Number(form.ano_fabricacion);
      const actual = new Date().getFullYear();
      if (!Number.isInteger(anio) || anio < 1900 || anio > actual + 1) {
        errors.ano_fabricacion = `Año inválido (1900 - ${actual + 1})`;
      }
    }
    if (!form.id_compania) {
      errors.id_compania = "Selecciona una compañía";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormOk("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await addVehicle({
        nomenclatura: form.nomenclatura.trim(),
        patente: form.patente.trim() || null,
        marca: form.marca.trim() || null,
        modelo: form.modelo.trim() || null,
        ano_fabricacion: form.ano_fabricacion ? Number(form.ano_fabricacion) : null,
        estado_vehiculo: form.estado_vehiculo,
        id_compania: Number(form.id_compania),
      });
      setForm(FORM_INICIAL);
      setFormOk("Vehículo registrado correctamente");
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const errorCls = theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600";
  const okCls = theme === "v1" ? "text-xs text-emerald-400" : "text-sm text-emerald-600";

  return (
    <div className="px-4 pb-6 lg:px-8">
      <div className="pt-6 pb-5 lg:pt-8 flex items-start justify-between gap-4">
        <div>
          <h1 className={t.h1}>Dashboard</h1>
          <p className={`${t.dashDate} mt-0.5`}>{dateText}</p>
        </div>
        {theme === "v1" && (
          <div className={`flex items-center gap-2 px-3 py-1.5 ${t.pill} rounded-full shrink-0 mt-1`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">En línea</span>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowForm((s) => !s)}
        className={t.smallBtn}
      >
        <IcPlus cls="w-4 h-4" />
        {showForm ? "Ocultar formulario" : "Registrar vehículo"}
      </button>

      {showForm && (
        <div className={`${t.card} p-5 mt-4`}>
          <h2 className={t.cardTitle}>Nuevo vehículo</h2>
          <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={t.label}>Nomenclatura *</label>
                <input
                  type="text"
                  value={form.nomenclatura}
                  onChange={set("nomenclatura")}
                  placeholder="Ej: B-4, Z-1"
                  className={`${t.input} ${fieldErrors.nomenclatura ? t.inputError : ""}`}
                />
                {fieldErrors.nomenclatura && <p className={`${errorCls} mt-1`}>{fieldErrors.nomenclatura}</p>}
              </div>

              <div>
                <label className={t.label}>Patente</label>
                <input
                  type="text"
                  value={form.patente}
                  onChange={set("patente")}
                  placeholder="Ej: KXPF-11"
                  className={t.input}
                />
              </div>

              <div>
                <label className={t.label}>Marca</label>
                <input
                  type="text"
                  value={form.marca}
                  onChange={set("marca")}
                  placeholder="Ej: Mercedes-Benz"
                  className={t.input}
                />
              </div>

              <div>
                <label className={t.label}>Modelo</label>
                <input
                  type="text"
                  value={form.modelo}
                  onChange={set("modelo")}
                  placeholder="Ej: Atego"
                  className={t.input}
                />
              </div>

              <div>
                <label className={t.label}>Año de fabricación</label>
                <input
                  type="number"
                  value={form.ano_fabricacion}
                  onChange={set("ano_fabricacion")}
                  placeholder={`Ej: ${new Date().getFullYear()}`}
                  className={`${t.input} ${fieldErrors.ano_fabricacion ? t.inputError : ""}`}
                />
                {fieldErrors.ano_fabricacion && <p className={`${errorCls} mt-1`}>{fieldErrors.ano_fabricacion}</p>}
              </div>

              <div>
                <label className={t.label}>Estado</label>
                <select
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

              <div className="sm:col-span-2">
                <label className={t.label}>Compañía *</label>
                <select
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
            {formOk && <p className={okCls}>{formOk}</p>}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className={t.saveUserBtn}>
                {saving ? "Registrando..." : "Registrar vehículo"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className={t.cancelBtn}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className={`${t.card} mt-4`}>
          <EmptyState
            icon={<IcAlert cls="w-7 h-7" />}
            title="No hay vehículos registrados"
            subtitle="Usa el botón 'Registrar vehículo' para agregar el primero."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 mb-6 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-6">
            {/* HU12: estado operativo de la flota (estado_vehiculo). */}
            <section className="lg:col-span-3" aria-label="Estado de la flota">
              <h2 className={t.label}>Estado de la flota</h2>
              <div className="grid grid-cols-3 gap-3">
                <MetricCard value={operational} label="Operativos" accent="emerald" />
                <MetricCard value={inMaintenance} label="En mantención" accent="amber" />
                <MetricCard value={notOperational} label="No operativos" accent="red" />
              </div>
            </section>
            {/* HU09: vencimiento de la mantención preventiva. */}
            <section className="lg:col-span-2" aria-label="Mantención preventiva">
              <h2 className={t.label}>Mantención preventiva</h2>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard value={preventiveSoon} label={`Próxima (${diasAviso} días)`} accent="amber" />
                <MetricCard value={preventiveOverdue} label="Vencida" accent="red" />
              </div>
            </section>
          </div>

          <div className={`${t.card} overflow-hidden`}>
            <div className={`flex items-center justify-between px-4 py-3.5 ${t.cardBorder}`}>
              <h2 className={t.cardTitle}>Flota de Emergencia</h2>
              <span className={t.cardMeta}>{vehicles.length} unidades</span>
            </div>
            <div className={t.divide}>
              {vehicles.map((v) => {
                const prev = estadoPreventiva(v);
                return (
                <Link
                  key={v.id}
                  to={`/vehiculos/${v.id}`}
                  className={`${t.rowBtn} flex items-center gap-3`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={t.vehCode}>{v.code}</span>
                      <span className={t.dot}>·</span>
                      <span className={t.vehType}>{v.type}</span>
                      {/* Solo el administrador ve varias compañías: le
                          indica de cuál es cada vehículo. */}
                      {isAdmin && v.nombre_compania && (
                        <span className={t.companyTag} title={v.nombre_compania}>
                          {v.nombre_compania}
                        </span>
                      )}
                    </div>
                    <p
                      className={
                        prev.nivel === "critical" || prev.nivel === "warning"
                          ? t.alertSub(prev.nivel)
                          : t.vehSub
                      }
                    >
                      {prev.texto}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                  <IcChevron cls={t.chevron} />
                </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}