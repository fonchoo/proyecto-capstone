import { createContext, useContext, useEffect, useState } from "react";
import { fecha } from "./utils.js";

const VehicleContext = createContext(null);

// ------------------------------------------------------------
// SESIÓN
// ------------------------------------------------------------
// La sesión vive en una cookie httpOnly que pone la API al hacer
// login (ver Backend/src/auth.js). JavaScript NO puede leerla: el
// navegador la manda sola en cada fetch a /api (mismo origen).
// Por eso el usuario NO se guarda en localStorage: al cargar la app
// se le pregunta a la API quién es (GET /api/auth/me).

// Mapea el estado de la BD al estado de la UI.
const STATUS_MAP = {
  operativo: "operational",
  en_mantencion: "warning",
  no_operativo: "critical",
};

// Convierte una fila de la tabla "vehiculo" (API) a la forma que
// esperan las vistas (code, type, status, brand, plate, etc.).
const mapVehicle = (v) => ({
  id: String(v.id_vehiculo),
  code: v.nomenclatura,
  type: [v.marca, v.modelo].filter(Boolean).join(" ") || "—",
  brand: v.marca || "—",
  model: v.modelo || "—",
  year: v.ano_fabricacion || "—",
  plate: v.patente || "—",
  status: STATUS_MAP[v.estado_vehiculo] || "operational",
  estado_vehiculo: v.estado_vehiculo,
  id_compania: v.id_compania,
  nombre_compania: v.nombre_compania,
  // Mantención preventiva, calculada por la API (Backend/src/preventiva.js).
  lastMaintenance: v.ultima_preventiva ? fecha(v.ultima_preventiva) : "Sin registro",
  nextMaintenance: v.proxima_preventiva ? fecha(v.proxima_preventiva) : "Sin registro",
  daysUntilNext: v.dias_para_preventiva, // null si no hay preventiva
  preventiveStatus: v.estado_preventiva, // sin_registro | vencida | proxima | al_dia
});

// Convierte una fila de la tabla "mantencion" (API) a la forma que
// esperan las vistas (vehicleId, date, type, cost, labor, etc.).
const mapMaintenance = (m) => ({
  id: String(m.id_mantencion),
  vehicleId: String(m.id_vehiculo),
  date: m.fecha_ingreso,
  type: m.tipo_mantencion_nombre,
  // cost = total (repuestos + mano de obra), calculado por la API.
  cost: Number(m.costo_total) || 0,
  parts: Number(m.costo_repuestos) || 0,
  labor: Number(m.mano_obra) || 0,
  description: m.detalle_trabajo || "",
  workshop: m.proveedor || "—",
});

export function VehicleProvider({ children }) {
  const [vehicles, setVehicles] = useState([]);
  // false hasta que termina la primera carga de vehículos (por usuario y
  // compañía elegida). Las páginas de un vehículo lo esperan antes de
  // decidir que "no existe": si no, al recargar o abrir la URL directo
  // redirigían al dashboard mientras la lista seguía vacía.
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [maintenance, setMaintenance] = useState([]);
  const [user, setUser] = useState(null);
  // true mientras se consulta /api/auth/me al cargar la app.
  const [loadingSession, setLoadingSession] = useState(true);

  // Selector de compañía del administrador: "" = todas. Para el resto
  // de los roles la API ya limita todo a su compañía.
  const [companias, setCompanias] = useState([]);
  // Reglas de negocio de la API (p. ej. meses entre preventivas).
  const [config, setConfig] = useState(null);
  const [selectedCompania, setSelectedCompania] = useState("");

  const isAdmin = user?.nombre_rol === "administrador";
  const companiaQuery =
    isAdmin && selectedCompania ? `?id_compania=${selectedCompania}` : "";

  // Sesión vencida o usuario eliminado: la API responde 401.
  const handleUnauthorized = (res) => {
    if (res.status === 401) {
      setUser(null);
      return true;
    }
    return false;
  };

  const refreshVehicles = async () => {
    try {
      const res = await fetch(`/api/vehiculos${companiaQuery}`);
      if (handleUnauthorized(res) || !res.ok) return;
      const rows = await res.json();
      setVehicles(rows.map(mapVehicle));
    } catch {
      // Sin conexión no cambia la lista actual.
    } finally {
      setVehiclesLoaded(true);
    }
  };

  const refreshMaintenance = async () => {
    try {
      const res = await fetch(`/api/mantenimientos${companiaQuery}`);
      if (handleUnauthorized(res) || !res.ok) return;
      const rows = await res.json();
      setMaintenance(rows.map(mapMaintenance));
    } catch {
      // Sin conexión no cambia el historial actual.
    }
  };

  // Al cargar: ¿sigue habiendo sesión?
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setLoadingSession(false));
  }, []);

  // Compañías visibles (la API ya devuelve solo las del alcance) y
  // reglas de negocio.
  useEffect(() => {
    if (!user) {
      setCompanias([]);
      return;
    }
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : null))
      .then(setConfig)
      .catch(() => setConfig(null));
    fetch("/api/companias")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCompanias)
      .catch(() => setCompanias([]));
  }, [user?.id_usuario]);

  // Datos: se recargan al cambiar de usuario o de compañía elegida.
  useEffect(() => {
    setVehiclesLoaded(false);
    if (!user) {
      setVehicles([]);
      setMaintenance([]);
      return;
    }
    refreshVehicles();
    refreshMaintenance();
  }, [user?.id_usuario, companiaQuery]);

  const addVehicle = async (data) => {
    const res = await fetch("/api/vehiculos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || "No se pudo registrar el vehículo");
    }
    await refreshVehicles();
    return body;
  };

  const addMaintenance = async (data) => {
    const res = await fetch("/api/mantenimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || "No se pudo registrar la mantención");
    }
    await refreshVehicles();
    await refreshMaintenance();
    return body;
  };

  // La cookie ya la dejó la API en la respuesta del login; acá solo
  // se guardan los datos del usuario para la UI.
  // Reporte de falla: la API lo guarda y deja el vehículo
  // "no_operativo" en la misma transacción. Se recargan los vehículos
  // para mostrar el estado real de la base.
  const reportFault = async (data) => {
    const res = await fetch("/api/fallas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (handleUnauthorized(res)) throw new Error("La sesión expiró");
    if (!res.ok) {
      throw new Error(body.error || "No se pudo enviar el reporte de falla");
    }
    await refreshVehicles();
    return body;
  };

  const login = (userData) => {
    setSelectedCompania("");
    setUser(userData);
  };
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Aunque falle la red, la sesión local se cierra igual.
    }
    setSelectedCompania("");
    setUser(null);
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        vehiclesLoaded,
        maintenance,
        user,
        loadingSession,
        login,
        logout,
        isAdmin,
        config,
        companias,
        selectedCompania,
        setSelectedCompania,
        refreshVehicles,
        addVehicle,
        addMaintenance,
        reportFault,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  return useContext(VehicleContext);
}