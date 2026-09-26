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
  teniente_tercero: ["dashboard", "alerts"],
  inspector_material_mayor: ["dashboard", "alerts", "reports"],
  administrador: ["dashboard", "alerts", "reports", "users"],
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

// Decide si un rol puede acceder a una ruta (match por prefijo).
export function canAccessRoute(role, pathname) {
  if (pathname === "/") return true;

  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/alertas")) return true;

  if (pathname.startsWith("/usuarios")) return canViewUsers(role);

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