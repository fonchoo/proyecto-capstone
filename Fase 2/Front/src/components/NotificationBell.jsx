import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { IcBell } from "./Icons.jsx";

// Notificaciones dentro de la app (HU11 y aviso al Inspector de HU06).
// Campana con el número de no leídas; al abrirla muestra las últimas.
// Al elegir una, se marca como leída y se abre la ficha del vehículo en
// la pestaña Historial, donde está el reporte de falla (HU11 CA5).
// Las notificaciones las mantiene el store (consulta periódica).

export default function NotificationBell() {
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();
  const { notifications, unreadCount, refreshNotifications, markNotificationRead, markAllNotificationsRead } =
    useVehicles();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = () => {
    // Al abrir se refresca, sin esperar la próxima consulta periódica.
    if (!open) refreshNotifications();
    setOpen(!open);
  };

  const elegir = async (n) => {
    setOpen(false);
    if (!n.leida_en) await markNotificationRead(n.id_notificacion);
    navigate(`/vehiculos/${n.id_vehiculo}?tab=historial`);
  };

  const cuando = (iso) =>
    new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className={t.notifBtn}
        aria-label={unreadCount > 0 ? `Notificaciones: ${unreadCount} sin leer` : "Notificaciones"}
        title="Notificaciones"
      >
        <IcBell cls="w-4 h-4" />
        {unreadCount > 0 && (
          <span className={t.notifBadge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={t.notifPanel} role="dialog" aria-label="Notificaciones">
          <div className="flex items-center justify-between px-2 pb-2">
            <p className={t.menuLabel}>Notificaciones</p>
            {unreadCount > 0 && (
              <button onClick={markAllNotificationsRead} className={t.notifLink}>
                Marcar todas como leídas
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className={`${t.notifDate} px-3 py-4 text-center`}>No tienes notificaciones</p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-0.5">
              {notifications.map((n) => (
                <button key={n.id_notificacion} onClick={() => elegir(n)} className={t.notifItem(!n.leida_en)}>
                  <p className={t.notifMsg(!n.leida_en)}>{n.mensaje}</p>
                  <p className={t.notifDate}>{cuando(n.creada_en)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
