import { Link, useLocation } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { canViewTab, faultBadgeCount } from "../permissions.js";
import { IcHome, IcBell, IcBarChart, IcUsers, IcAlert } from "./Icons.jsx";

export default function BottomNav() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { pathname } = useLocation();
  const { user, openFaults } = useVehicles();
  const faultCount = faultBadgeCount(user?.nombre_rol, openFaults);

  const activeTab = pathname.startsWith("/vehiculos")
    ? "vehicles"
    : pathname.startsWith("/alertas")
    ? "alerts"
    : pathname.startsWith("/fallas")
    ? "faults"
    : pathname.startsWith("/reportes")
    ? "reports"
    : pathname.startsWith("/usuarios")
    ? "users"
    : "dashboard";

  const tabs = [
    { id: "dashboard", Icon: IcHome, label: "Dashboard", to: "/dashboard" },
    { id: "faults", Icon: IcAlert, label: "Fallas", to: "/fallas" },
    { id: "alerts", Icon: IcBell, label: "Alertas", to: "/alertas" },
    { id: "reports", Icon: IcBarChart, label: "Reportería", to: "/reportes" },
    { id: "users", Icon: IcUsers, label: "Usuarios", to: "/usuarios" },
  ].filter((tab) => canViewTab(user?.nombre_rol, tab.id));

  const isActive = (id) => id === activeTab || (id === "dashboard" && activeTab === "vehicles");

  return (
    <div className="flex items-center px-1 py-2">
      {tabs.map(({ id, Icon, label, to }) => (
        <Link key={id} to={to} className={t.bottomTab(isActive(id))}>
          <span className="relative">
            <Icon cls="w-5 h-5" />
            {id === "faults" && faultCount > 0 && (
              <span className={`${t.navBadge} absolute -top-1.5 -right-2.5`} aria-label={`${faultCount} por atender`}>
                {faultCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">{label}</span>
        </Link>
      ))}
    </div>
  );
}