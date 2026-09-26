import { createContext, useContext, useEffect, useState } from "react";

const VehicleContext = createContext(null);

// Clave de persistencia de la sesión en localStorage.
const SESSION_KEY = "sigmave_user";

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
  nextMaintenance: "Sin registro",
  lastMaintenance: "Sin registro",
  daysUntilNext: 0,
});

// Convierte una fila de la tabla "mantencion" (API) a la forma que
// esperan las vistas (vehicleId, date, type, cost, labor, etc.).
const mapMaintenance = (m) => ({
  id: String(m.id_mantencion),
  vehicleId: String(m.id_vehiculo),
  date: m.fecha_ingreso,
  type: m.tipo_mantencion_nombre,
  cost: Number(m.costo_total) || 0,
  labor: Number(m.mano_obra) || 0,
  description: m.detalle_trabajo || "",
  workshop: m.proveedor || "—",
});

export function VehicleProvider({ children }) {
  const [vehicles, setVehicles] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setVehicleStatus = (id, status) =>
    setVehicles((vs) => vs.map((v) => (v.id === id ? { ...v, status } : v)));

  const refreshVehicles = async () => {
    try {
      const res = await fetch("/api/vehiculos");
      if (!res.ok) return;
      const rows = await res.json();
      setVehicles(rows.map(mapVehicle));
    } catch {
      // Sin conexión no cambia la lista actual.
    }
  };

  const refreshMaintenance = async () => {
    try {
      const res = await fetch("/api/mantenimientos");
      if (!res.ok) return;
      const rows = await res.json();
      setMaintenance(rows.map(mapMaintenance));
    } catch {
      // Sin conexión no cambia el historial actual.
    }
  };

  useEffect(() => {
    refreshVehicles();
    refreshMaintenance();
  }, []);

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

  const login = (userData) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    setUser(userData);
  };
  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        setVehicleStatus,
        maintenance,
        user,
        login,
        logout,
        refreshVehicles,
        addVehicle,
        addMaintenance,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  return useContext(VehicleContext);
}