import { useEffect, useState } from "react";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { IcPlus, IcUsers } from "../components/Icons.jsx";
import {
  NOMBRE,
  errorLargo,
  errorPassword,
  esEmail,
  normalizarEmail,
  normalizarRut,
  texto,
} from "../validaciones.js";

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
  active: u.activo !== false,
});

const cargarUsuarios = () =>
  fetch("/api/usuarios")
    .then((r) => r.json())
    .then((rows) => rows.map(mapUser));

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
  // HU16: fila esperando confirmación y acción en curso.
  const [confirmando, setConfirmando] = useState(null);
  const [cambiando, setCambiando] = useState(null);
  const [accionError, setAccionError] = useState("");

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
    const loadUsuarios = cargarUsuarios()
      .then(setUsers)
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

  // Mismas reglas que la API (validarUsuario en Backend/src/routes/usuarios.js).
  const validate = () => {
    const errors = {};
    const nombre = texto(form.nombre_completo);
    if (!nombre) {
      errors.nombre_completo = "El nombre es obligatorio";
    } else if (errorLargo(nombre, NOMBRE.min, NOMBRE.max)) {
      errors.nombre_completo = errorLargo(nombre, NOMBRE.min, NOMBRE.max);
    } else if (!NOMBRE.patron.test(nombre)) {
      errors.nombre_completo = "El nombre solo puede tener letras, espacios, apóstrofo y guion";
    }
    if (!form.rut.trim()) {
      errors.rut = "El RUT es obligatorio";
    } else if (!normalizarRut(form.rut)) {
      errors.rut = "El RUT no es válido (revisa el dígito verificador)";
    }
    const email = normalizarEmail(form.email);
    if (!email) {
      errors.email = "El correo es obligatorio";
    } else if (!esEmail(email)) {
      errors.email = "El correo no tiene un formato válido";
    }
    if (!form.password) {
      errors.password = "La contraseña es obligatoria";
    } else if (errorPassword(form.password)) {
      errors.password = errorPassword(form.password);
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
          rut: normalizarRut(form.rut),
          nombre_completo: texto(form.nombre_completo),
          email: normalizarEmail(form.email),
          password: form.password,
          id_rol: Number(form.id_rol),
          id_compania: Number(form.id_compania),
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 400/409 de la API: cada error bajo su campo (RUT o correo
        // repetido, formato inválido que se haya escapado del front).
        if (body.campos) setFieldErrors(body.campos);
        throw new Error(body.error || "No se pudo crear el usuario");
      }

      setForm(FORM_INICIAL);
      setFormOk("Usuario creado correctamente");
      setShowForm(false);

      setUsers(await cargarUsuarios());
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // HU16: desactivar (con confirmación) o reactivar una cuenta. La API
  // valida todo (no a uno mismo, ya desactivada); acá se muestra su
  // mensaje y se recarga el listado para ver el estado nuevo (CA5).
  const cambiarEstado = async (u, accion) => {
    setConfirmando(null);
    setAccionError("");
    setFormOk("");
    setCambiando(u.id);
    try {
      const res = await fetch(`/api/usuarios/${u.id}/${accion}`, { method: "PATCH" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "No se pudo cambiar el estado de la cuenta");
      setFormOk(
        accion === "desactivar"
          ? `Cuenta de ${u.name} desactivada: ya no puede iniciar sesión`
          : `Cuenta de ${u.name} reactivada`
      );
      setUsers(await cargarUsuarios());
    } catch (err) {
      setAccionError(err.message);
    } finally {
      setCambiando(null);
    }
  };

  const inactivos = users.filter((u) => !u.active).length;

  return (
    <div>
      <PageHeader
        title="Gestión de Usuarios"
        subtitle={`${users.length} usuarios registrados${
          inactivos ? ` · ${inactivos} ${inactivos === 1 ? "desactivado" : "desactivados"}` : ""
        }`}
      />
      <div className="px-4 pb-6 space-y-4 lg:px-8">
        <button
          onClick={() => {
            setFormOk("");
            setShowForm(!showForm);
          }}
          className={t.smallBtn}
        >
          <IcPlus cls="w-4 h-4" />
          {showForm ? "Ocultar formulario" : "Agregar Usuario"}
        </button>

        {/* Fuera del formulario: al guardar, el formulario se cierra y el
            mensaje tiene que seguir visible. */}
        {formOk && <p role="status" className={okCls}>{formOk}</p>}
        {accionError && <p role="alert" className={errorCls}>{accionError}</p>}

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
                placeholder="Mínimo 8, con letras y números"
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
              {users.map((u) => {
                const esYo = u.id === String(user?.id_usuario);
                return (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 px-4 py-4 ${u.active ? "" : "opacity-60"}`}
                  >
                    <div className={t.userAvatar}>
                      <span className={t.userAvatarTxt}>{initials(u.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={t.userName}>{u.name}</p>
                      <p className={t.userEmail}>{u.email}</p>
                      {/* Acciones (HU16). La propia cuenta no se ofrece:
                          la API tampoco lo permite. */}
                      {!esYo && (
                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          {confirmando === u.id ? (
                            <>
                              <span className={t.userConfirmTxt}>¿Desactivar esta cuenta?</span>
                              <button
                                onClick={() => cambiarEstado(u, "desactivar")}
                                className={t.userDangerBtn}
                              >
                                Confirmar
                              </button>
                              <button onClick={() => setConfirmando(null)} className={t.userActionBtn}>
                                Cancelar
                              </button>
                            </>
                          ) : u.active ? (
                            <button
                              onClick={() => {
                                setAccionError("");
                                setConfirmando(u.id);
                              }}
                              disabled={cambiando === u.id}
                              className={t.userDangerBtn}
                            >
                              Desactivar cuenta
                            </button>
                          ) : (
                            <button
                              onClick={() => cambiarEstado(u, "reactivar")}
                              disabled={cambiando === u.id}
                              className={t.userActionBtn}
                            >
                              {cambiando === u.id ? "Reactivando..." : "Reactivar cuenta"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {u.active ? (
                      <span className={t.roleBadge(u.role)}>{roleShort(u.role)}</span>
                    ) : (
                      <span className={t.userInactiveBadge}>Inactivo</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}