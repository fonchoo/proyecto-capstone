// ============================================================
// src/permissions.js
// ============================================================
// Matriz de roles -> acceso por vista.
//
//   Roles (BD): bombero | teniente_tercero | inspector_material_mayor | administrador
//
//   Vista                     Bombero  Ten. 3  Insp. M.M.  Admin
//   Dashboard                    x        x        x         x
//   Detalle vehículo             x        x        x         x
//   Reportar falla               x        x        x         x
//   Registrar mantención         -        x        x         x
//   Alertas                      x        x        x         x
//   Fallas (derivar, HU06)       -        x        x         x
//   Reportería y costos          -        -        x         x
//   Gestión de usuarios          -        -        -         x

export const ALL_ROLES = [
  "bombero",
  "teniente_tercero",
  "inspector_material_mayor",
  "administrador",
];

// Tabs de navegación visibles por rol.
const NAV_BY_ROLE = {
  bombero: ["dashboard", "alerts"],
  teniente_tercero: ["dashboard", "faults", "alerts"],
  inspector_material_mayor: ["dashboard", "faults", "alerts", "reports"],
  administrador: ["dashboard", "faults", "alerts", "reports", "users"],
};

export const navTabsFor = (role) => {
  const allowed = NAV_BY_ROLE[role] || NAV_BY_ROLE.bombero;
  return allowed;
};

export const canViewTab = (role, tabId) => {
  const allowed = NAV_BY_ROLE[role] || NAV_BY_ROLE.bombero;
  return allowed.includes(tabId);
};

export const canReportFault = () => true;

export const canRegisterMaintenance = (role) =>
  ["teniente_tercero", "inspector_material_mayor", "administrador"].includes(role);

export const canViewUsers = (role) => role === "administrador";

// Panel de fallas y derivación (HU06): misma regla que la API
// (ROLES_MANTENCION en Backend/src/auth.js).
export const canDeriveFault = (role) =>
  ["teniente_tercero", "inspector_material_mayor", "administrador"].includes(role);

// Contador de la pestaña "Fallas": lo que le toca atender a cada rol
// (es el aviso dentro de la app al Teniente y al Inspector).
//   Teniente Tercero -> reportes pendientes de derivar.
//   Inspector        -> reportes derivados sin mantención asignada.
//   Administrador    -> ambos.
export function faultBadgeCount(role, openFaults) {
  const pendientes = openFaults.filter((f) => f.estado_reporte === "pendiente").length;
  const porAtender = openFaults.filter(
    (f) => f.estado_reporte === "derivado" && !f.id_mantencion
  ).length;
  if (role === "teniente_tercero") return pendientes;
  if (role === "inspector_material_mayor") return porAtender;
  if (role === "administrador") return pendientes + porAtender;
  return 0;
}

// Decide si un rol puede acceder a una ruta (match por prefijo).
export function canAccessRoute(role, pathname) {
  if (pathname === "/") return true;

  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/alertas")) return true;

  if (pathname.startsWith("/usuarios")) return canViewUsers(role);

  if (pathname.startsWith("/fallas")) return canDeriveFault(role);

  if (pathname.startsWith("/reportes")) {
    return ["inspector_material_mayor", "administrador"].includes(role);
  }

  if (pathname.startsWith("/vehiculos")) {
    if (pathname.includes("/registrar-mantencion")) {
      return canRegisterMaintenance(role);
    }
    // Detalle, reportar-falla y su confirmación: accesibles para todos.
    return true;
  }

  return false;
}

// Nombre legible de un rol.
export const roleName = (role) =>
  ({
    bombero: "Bombero Voluntario",
    teniente_tercero: "Teniente Tercero",
    inspector_material_mayor: "Inspector de Material Mayor",
    administrador: "Administrador",
  }[role] || role);