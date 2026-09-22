import { createContext, useContext, useState } from "react";

const VehicleContext = createContext(null);

export function VehicleProvider({ children }) {
  const [vehicles, setVehicles] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const setVehicleStatus = (id, status) =>
    setVehicles((vs) => vs.map((v) => (v.id === id ? { ...v, status } : v)));

  return (
    <VehicleContext.Provider value={{ vehicles, setVehicleStatus, maintenance }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  return useContext(VehicleContext);
}