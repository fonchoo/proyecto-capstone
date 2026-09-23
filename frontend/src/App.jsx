import { Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vehiculos/:id" element={<VehicleDetail />} />
        <Route path="/vehiculos/:id/reportar-falla" element={<ReportFault />} />
        <Route path="/vehiculos/:id/reportar-falla/enviado" element={<FaultConfirmation />} />
        <Route path="/vehiculos/:id/registrar-mantencion" element={<RegisterMaintenance />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/reportes" element={<Reports />} />
        <Route path="/usuarios" element={<Users />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}