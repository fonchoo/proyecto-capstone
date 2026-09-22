import { Link, useLocation } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { IcHome, IcBell, IcBarChart, IcUsers } from "./Icons.jsx";

export default function BottomNav() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { pathname } = useLocation();

  const activeTab = pathname.startsWith("/vehiculos")
    ? "vehicles"
    : pathname.startsWith("/alertas")
    ? "alerts"
    : pathname.startsWith("/reportes")
    ? "reports"
    : pathname.startsWith("/usuarios")
    ? "users"
    : "dashboard";

  const tabs = [
    { id: "dashboard", Icon: IcHome, label: "Dashboard", to: "/dashboard" },
    { id: "alerts", Icon: IcBell, label: "Alertas", to: "/alertas" },
    { id: "reports", Icon: IcBarChart, label: "Reportería", to: "/reportes" },
    { id: "users", Icon: IcUsers, label: "Usuarios", to: "/usuarios" },
  ];

  const isActive = (id) => id === activeTab || (id === "dashboard" && activeTab === "vehicles");

  return (
    <div className="flex items-center px-1 py-2">
      {tabs.map(({ id, Icon, label, to }) => (
        <Link key={id} to={to} className={t.bottomTab(isActive(id))}>
          <Icon cls="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </Link>
      ))}
    </div>
  );
}