import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { canViewTab } from "../permissions.js";
import { IcFlame, IcLogOut, IcMoon, IcSun } from "./Icons.jsx";

export default function TopNav() {
  const { theme, toggle } = useTheme();
  const t = themes[theme];
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout,
    isAdmin,
    companias,
    selectedCompania,
    setSelectedCompania,
  } = useVehicles();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeTab = pathname.startsWith("/vehiculos")
    ? "vehicles"
    : pathname.startsWith("/alertas")
    ? "alerts"
    : pathname.startsWith("/reportes")
    ? "reports"
    : pathname.startsWith("/usuarios")
    ? "users"
    : "dashboard";

  const items = [
    { id: "dashboard", label: "Dashboard", to: "/dashboard" },
    { id: "alerts", label: "Alertas", to: "/alertas" },
    { id: "reports", label: "Reportería y Costos", to: "/reportes" },
    { id: "users", label: "Usuarios", to: "/usuarios" },
  ].filter((item) => canViewTab(user?.nombre_rol, item.id));

  // Usuario autenticado: nombre por defecto y iniciales derivadas.
  const userName = user?.nombre_completo || "Usuario";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Se espera al logout: si se navega antes, el login todavía ve al
  // usuario y lo devuelve al dashboard.
  const logoutSession = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <header className={t.topNav}>
      <div className="flex items-center gap-2.5 mr-6 lg:mr-8 shrink-0">
        <div className={t.logoBox}>
          <IcFlame cls={t.logoIcon} />
        </div>
        <span className={t.brand}>1ª Cía. CBM</span>
      </div>

      <nav className="hidden lg:flex items-center gap-0.5 flex-1">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className={t.navBtn(item.id === activeTab || (item.id === "dashboard" && activeTab === "vehicles"))}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 ml-auto lg:ml-4 shrink-0">
        {/* Solo el administrador ve todas las compañías y elige cuál
            revisar. El resto ve siempre la suya (lo limita la API). */}
        {isAdmin && companias.length > 0 && (
          <select
            value={selectedCompania}
            onChange={(e) => setSelectedCompania(e.target.value)}
            className={t.companySelect}
            aria-label="Compañía a visualizar"
            title="Compañía a visualizar"
          >
            <option value="">Todas las compañías</option>
            {companias.map((c) => (
              <option key={c.id_compania} value={c.id_compania}>
                {c.nombre}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={toggle}
          className={t.toggleBtn}
          aria-label="Cambiar de tema"
          title={theme === "v1" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        >
          {theme === "v1" ? <IcSun cls="w-4 h-4" /> : <IcMoon cls="w-4 h-4" />}
        </button>
        <div className="relative" ref={menuRef}>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={t.avatarBtn}
              aria-label="Menú de usuario"
            >
              <span className={t.avatarInitials}>{initials}</span>
            </button>
            <span className={t.userName}>{userName}</span>
            <span className={t.userNameShort}>{userName}</span>
          </div>
          {menuOpen && (
            <div className={t.userMenu}>
              <p className={t.menuLabel}>Sesión iniciada</p>
              <p className={t.menuName}>{userName}</p>
              <p className={t.menuEmail}>{user?.email}</p>
              {user?.nombre_compania && (
                <p className={t.menuEmail}>{user.nombre_compania}</p>
              )}
              <div className={t.menuDivider} />
              <button onClick={logoutSession} className={t.logoutBtn}>
                <IcLogOut cls={t.logoutIcon} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}