import { useEffect, useState } from "react";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { IcPlus, IcUsers } from "../components/Icons.jsx";

// Nombres de rol en BD -> etiquetas mostradas en la UI.
const ROLE_LABELS = {
  bombero: "Bombero Voluntario",
  teniente_tercero: "Teniente Tercero",
  inspector_material_mayor: "Inspector de Material Mayor",
  administrador: "Administrador",
};

// Mapea una fila de "usuario" (API) a la forma que espera la vista.
const mapUser = (u) => ({
  id: String(u.id_usuario),
  rut: u.rut,
  name: u.nombre_completo,
  email: u.email,
  role: ROLE_LABELS[u.nombre_rol] || u.nombre_rol,
});

const FORM_INICIAL = {
  rut: "",
  nombre_completo: "",
  email: "",
  password: "",
  id_rol: "",
  id_compania: "",
};

export default function Users() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { user } = useVehicles();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [companias, setCompanias] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");
  const [loading, setLoading] = useState(false);

  const errorCls = theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600";
  const okCls = theme === "v1" ? "text-xs text-emerald-400" : "text-sm text-emerald-600";

  const roleShort = (role) =>
    role === "Inspector de Material Mayor" ? "Insp. Mat. Mayor" : role;

  const initials = (name) =>
    name.split(" ").slice(0, 2).map((n) => n[0]).join("");

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((er) => ({ ...er, [key]: "" }));
  };

  // Carga los usuarios, roles y compañías.
  useEffect(() => {
    const loadUsuarios = fetch("/api/usuarios")
      .then((r) => r.json())
      .then((rows) => setUsers(rows.map(mapUser)))
      .catch(() => {});

    const loadRoles = fetch("/api/roles")
      .then((r) => r.json())
      .then((rows) => setRoles(rows))
      .catch(() => {});

    const loadCompanias = fetch("/api/companias")
      .then((r) => r.json())
      .then((rows) => setCompanias(rows))
      .catch(() => {});

    Promise.all([loadUsuarios, loadRoles, loadCompanias]).then(() => {
      // Preselecciona la compañía del usuario autenticado.
      setForm((f) => ({
        ...f,
        id_compania: user?.id_compania ? String(user.id_compania) : f.id_compania,
      }));
    });
  }, [user?.id_compania]);

  const validate = () => {
    const errors = {};
    if (!form.nombre_completo.trim()) {
      errors.nombre_completo = "El nombre es obligatorio";
    }
    if (!form.rut.trim()) {
      errors.rut = "El RUT es obligatorio";
    } else {
      const limpio = form.rut.trim().replace(/[^0-9kK-]/g, "").replace(/^0+/, "");
      const sinDV = limpio.replace(/-/g, "");
      const soloDigitos = sinDV.replace(/[kK-]/g, "");
      if (!/^\d{7,8}$/.test(soloDigitos) && !/^\d{7,8}[kK]$/.test(sinDV)) {
        errors.rut = "El RUT no tiene un formato válido";
      }
    }
    if (!form.email.trim()) {
      errors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "El correo no tiene un formato válido";
    }
    if (!form.password) {
      errors.password = "La contraseña es obligatoria";
    } else if (form.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    if (!form.id_rol) {
      errors.id_rol = "Selecciona un rol";
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

    setLoading(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rut: form.rut.trim(),
          nombre_completo: form.nombre_completo.trim(),
          email: form.email.trim(),
          password: form.password,
          id_rol: Number(form.id_rol),
          id_compania: Number(form.id_compania),
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || "No se pudo crear el usuario");
      }

      setForm(FORM_INICIAL);
      setFormOk("Usuario creado correctamente");
      setShowForm(false);

      const rows = await fetch("/api/usuarios").then((r) => r.json());
      setUsers(rows.map(mapUser));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Gestión de Usuarios" subtitle={`${users.length} usuarios registrados`} />
      <div className="px-4 pb-6 space-y-4 lg:px-8">
        <button onClick={() => setShowForm(!showForm)} className={t.smallBtn}>
          <IcPlus cls="w-4 h-4" />
          {showForm ? "Ocultar formulario" : "Agregar Usuario"}
        </button>

        {showForm && (
          <div className={t.addForm}>
            <p className={t.formTitle}>Nuevo Usuario</p>
            <div>
              <label className={t.label}>Nombre completo *</label>
              <input
                value={form.nombre_completo}
                onChange={set("nombre_completo")}
                placeholder="Ej: Juan Pérez"
                className={`${t.input} ${fieldErrors.nombre_completo ? t.inputError : ""}`}
              />
              {fieldErrors.nombre_completo && (
                <p className={`${errorCls} mt-1`}>{fieldErrors.nombre_completo}</p>
              )}
            </div>
            <div>
              <label className={t.label}>RUT *</label>
              <input
                value={form.rut}
                onChange={set("rut")}
                placeholder="Ej: 12345678-5"
                className={`${t.input} ${fieldErrors.rut ? t.inputError : ""}`}
              />
              {fieldErrors.rut && <p className={`${errorCls} mt-1`}>{fieldErrors.rut}</p>}
            </div>
            <div>
              <label className={t.label}>Correo electrónico *</label>
              <input
                value={form.email}
                onChange={set("email")}
                placeholder="correo@1cbmaipuvoluntario.cl"
                className={`${t.input} ${fieldErrors.email ? t.inputError : ""}`}
              />
              {fieldErrors.email && <p className={`${errorCls} mt-1`}>{fieldErrors.email}</p>}
            </div>
            <div>
              <label className={t.label}>Contraseña *</label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="Mínimo 6 caracteres"
                className={`${t.input} ${fieldErrors.password ? t.inputError : ""}`}
              />
              {fieldErrors.password && <p className={`${errorCls} mt-1`}>{fieldErrors.password}</p>}
            </div>
            <div>
              <label className={t.label}>Rol *</label>
              <select
                value={form.id_rol}
                onChange={set("id_rol")}
                className={`${t.select} ${fieldErrors.id_rol ? t.inputError : ""}`}
              >
                <option value="">Selecciona un rol...</option>
                {roles.map((r) => (
                  <option key={r.id_rol} value={r.id_rol}>
                    {ROLE_LABELS[r.nombre_rol] || r.nombre_rol}
                  </option>
                ))}
              </select>
              {fieldErrors.id_rol && <p className={`${errorCls} mt-1`}>{fieldErrors.id_rol}</p>}
            </div>
            <div>
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
              {fieldErrors.id_compania && (
                <p className={`${errorCls} mt-1`}>{fieldErrors.id_compania}</p>
              )}
            </div>

            {formError && <p className={errorCls}>{formError}</p>}
            {formOk && <p className={okCls}>{formOk}</p>}

            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} disabled={loading} className={t.saveUserBtn}>
                {loading ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => setShowForm(false)} className={t.cancelBtn}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className={`${t.card} overflow-hidden`}>
          {users.length === 0 ? (
            <EmptyState
              icon={<IcUsers cls="w-7 h-7" />}
              title="No hay usuarios registrados"
              subtitle="Usa 'Agregar Usuario' para crear el primero."
            />
          ) : (
            <div className={t.divide}>
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-4">
                  <div className={t.userAvatar}>
                    <span className={t.userAvatarTxt}>{initials(u.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={t.userName}>{u.name}</p>
                    <p className={t.userEmail}>{u.email}</p>
                  </div>
                  <span className={t.roleBadge(u.role)}>{roleShort(u.role)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}