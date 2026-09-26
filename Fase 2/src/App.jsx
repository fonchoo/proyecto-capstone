import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import VehicleDetail from "./pages/VehicleDetail.jsx";
import ReportFault from "./pages/ReportFault.jsx";
import FaultConfirmation from "./pages/FaultConfirmation.jsx";
import RegisterMaintenance from "./pages/RegisterMaintenance.jsx";
import Alerts from "./pages/Alerts.jsx";
import Reports from "./pages/Reports.jsx";
import Users from "./pages/Users.jsx";
import { useVehicles } from "./store.jsx";
import { canAccessRoute } from "./permissions.js";

// Guard de ruta: falta sesión -> /login; rol sin acceso -> /dashboard.
function Protected({ children }) {
  const { user } = useVehicles();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;

  if (!canAccessRoute(user.nombre_rol, location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function protectedRoute(node) {
  return <Protected>{node}</Protected>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={protectedRoute(<Dashboard />)} />
        <Route path="/vehiculos/:id" element={protectedRoute(<VehicleDetail />)} />
        <Route path="/vehiculos/:id/reportar-falla" element={protectedRoute(<ReportFault />)} />
        <Route path="/vehiculos/:id/reportar-falla/enviado" element={protectedRoute(<FaultConfirmation />)} />
        <Route path="/vehiculos/:id/registrar-mantencion" element={protectedRoute(<RegisterMaintenance />)} />
        <Route path="/alertas" element={protectedRoute(<Alerts />)} />
        <Route path="/reportes" element={protectedRoute(<Reports />)} />
        <Route path="/usuarios" element={protectedRoute(<Users />)} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}