import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { canManageVehicles } from "../permissions.js";
import MetricCard from "../components/MetricCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import VehicleForm, { VEHICULO_VACIO } from "../components/VehicleForm.jsx";
import { IcAlert, IcChevron, IcPlus } from "../components/Icons.jsx";
import { estadoPreventiva, unidades } from "../utils.js";

// Filtros de la tabla de la flota: cada indicador filtra por su estado.
// La clave va en la URL (?estado=no_operativo), así el filtro se mantiene
// al entrar a una ficha y volver atrás, y se puede compartir el enlace.
const FILTROS = {
  operativo: { etiqueta: "Operativos", cumple: (v) => v.status === "operational" },
  en_mantencion: { etiqueta: "En mantención", cumple: (v) => v.status === "warning" },
  no_operativo: { etiqueta: "No operativos", cumple: (v) => v.status === "critical" },
  preventiva_proxima: { etiqueta: "Preventiva próxima", cumple: (v) => v.preventiveStatus === "proxima" },
  preventiva_vencida: { etiqueta: "Preventiva vencida", cumple: (v) => v.preventiveStatus === "vencida" },
};

export default function Dashboard() {
  const { theme } = useTheme();
  const t = themes[theme];
  const { vehicles, user, addVehicle, companias, selectedCompania, isAdmin, config } =
    useVehicles();
  const diasAviso = config?.preventiva?.dias_aviso ?? 30;
  // HU03: solo Teniente Tercero en adelante registra vehículos.
  const allowCreate = canManageVehicles(user?.nombre_rol);

  const [showForm, setShowForm] = useState(false);
  const [formOk, setFormOk] = useState("");

  const now = new Date();
  const dateText =
    theme === "v1"
      ? now.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      : now.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Estado operativo (estado_vehiculo) y estado de la preventiva son
  // dos cosas distintas: un carro puede estar operativo con la
  // preventiva vencida.
  // HU12: operativos, en mantención y no operativos, por separado.
  const operational = vehicles.filter((v) => v.status === "operational").length;
  const inMaintenance = vehicles.filter((v) => v.status === "warning").length;
  const notOperational = vehicles.filter((v) => v.status === "critical").length;
  const preventiveSoon = vehicles.filter((v) => v.preventiveStatus === "proxima").length;
  const preventiveOverdue = vehicles.filter((v) => v.preventiveStatus === "vencida").length;

  // Filtro activo (o null). Una clave desconocida en la URL se ignora.
  const [params, setParams] = useSearchParams();
  const filtro = FILTROS[params.get("estado")] ? params.get("estado") : null;
  const lista = filtro ? vehicles.filter(FILTROS[filtro].cumple) : vehicles;
  // Presionar el indicador activo quita el filtro. "replace" para no
  // llenar el historial con cada clic.
  const alternarFiltro = (clave) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (n.get("estado") === clave) n.delete("estado");
        else n.set("estado", clave);
        return n;
      },
      { replace: true }
    );
  const quitarFiltro = () => filtro && alternarFiltro(filtro);
  const tarjeta = (clave) => ({ onClick: () => alternarFiltro(clave), active: filtro === clave });

  // Compañía preseleccionada: la elegida en el TopNav (administrador)
  // o, si no hay, la del usuario. El selector solo ofrece las del
  // alcance (la API devuelve solo esas).
  const companiaInicial = String(selectedCompania || user?.id_compania || "");

  const crearVehiculo = async (datos) => {
    await addVehicle(datos);
    setFormOk("Vehículo registrado correctamente");
    setShowForm(false);
  };

  const okCls = theme === "v1" ? "text-xs text-emerald-400" : "text-sm text-emerald-600";

  return (
    <div className="px-4 pb-6 lg:px-8">
      <div className="pt-6 pb-5 lg:pt-8 flex items-start justify-between gap-4">
        <div>
          <h1 className={t.h1}>Dashboard</h1>
          <p className={`${t.dashDate} mt-0.5`}>{dateText}</p>
        </div>
        {theme === "v1" && (
          <div className={`flex items-center gap-2 px-3 py-1.5 ${t.pill} rounded-full shrink-0 mt-1`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">En línea</span>
          </div>
        )}
      </div>

      {allowCreate && (
        <button
          onClick={() => {
            setFormOk("");
            setShowForm((s) => !s);
          }}
          className={t.smallBtn}
        >
          <IcPlus cls="w-4 h-4" />
          {showForm ? "Ocultar formulario" : "Registrar vehículo"}
        </button>
      )}

      {/* Fuera del formulario: al guardar, el formulario se cierra y el
          mensaje tiene que seguir visible (MTC_0070). */}
      {formOk && <p role="status" className={`${okCls} mt-3`}>{formOk}</p>}

      {showForm && (
        <VehicleForm
          title="Nuevo vehículo"
          initial={{ ...VEHICULO_VACIO, id_compania: companiaInicial }}
          companias={companias}
          showEstado
          submitLabel="Registrar vehículo"
          savingLabel="Registrando..."
          onSubmit={crearVehiculo}
          onCancel={() => setShowForm(false)}
        />
      )}

      {vehicles.length === 0 ? (
        <div className={`${t.card} mt-4`}>
          <EmptyState
            icon={<IcAlert cls="w-7 h-7" />}
            title="No hay vehículos registrados"
            subtitle={allowCreate ? "Usa el botón 'Registrar vehículo' para agregar el primero." : undefined}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 mb-6 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-6">
            {/* HU12: estado operativo de la flota (estado_vehiculo). */}
            <section className="lg:col-span-3" aria-label="Estado de la flota">
              <h2 className={t.label}>Estado de la flota</h2>
              <div className="grid grid-cols-3 gap-3">
                <MetricCard value={operational} label="Operativos" accent="emerald" {...tarjeta("operativo")} />
                <MetricCard value={inMaintenance} label="En mantención" accent="amber" {...tarjeta("en_mantencion")} />
                <MetricCard value={notOperational} label="No operativos" accent="red" {...tarjeta("no_operativo")} />
              </div>
            </section>
            {/* HU09: vencimiento de la mantención preventiva. */}
            <section className="lg:col-span-2" aria-label="Mantención preventiva">
              <h2 className={t.label}>Mantención preventiva</h2>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard value={preventiveSoon} label={`Próxima (${diasAviso} días)`} accent="amber" {...tarjeta("preventiva_proxima")} />
                <MetricCard value={preventiveOverdue} label="Vencida" accent="red" {...tarjeta("preventiva_vencida")} />
              </div>
            </section>
          </div>

          <div className={`${t.card} overflow-hidden`}>
            <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3.5 ${t.cardBorder}`}>
              <h2 className={t.cardTitle}>Flota de Emergencia</h2>
              {filtro ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={t.cardMeta} role="status">
                    {lista.length} de {unidades(vehicles.length)} · {FILTROS[filtro].etiqueta}
                  </span>
                  <button type="button" onClick={quitarFiltro} className={t.userActionBtn}>
                    Quitar filtro
                  </button>
                </div>
              ) : (
                <span className={t.cardMeta}>{unidades(vehicles.length)}</span>
              )}
            </div>
            {lista.length === 0 && (
              <EmptyState
                icon={<IcAlert cls="w-7 h-7" />}
                title={`No hay vehículos en «${FILTROS[filtro].etiqueta}»`}
                subtitle="Presiona el indicador otra vez o «Quitar filtro» para ver toda la flota."
              />
            )}
            <div className={t.divide}>
              {lista.map((v) => {
                const prev = estadoPreventiva(v);
                return (
                <Link
                  key={v.id}
                  to={`/vehiculos/${v.id}`}
                  className={`${t.rowBtn} flex items-center gap-3`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={t.vehCode}>{v.code}</span>
                      <span className={t.dot}>·</span>
                      <span className={t.vehType}>{v.type}</span>
                      {/* Solo el administrador ve varias compañías: le
                          indica de cuál es cada vehículo. En el teléfono
                          va en su propia línea (abajo) para no comerse el
                          modelo. */}
                      {isAdmin && v.nombre_compania && (
                        <span className={`${t.companyTag} hidden sm:inline-block`} title={v.nombre_compania}>
                          {v.nombre_compania}
                        </span>
                      )}
                    </div>
                    <p
                      className={
                        prev.nivel === "critical" || prev.nivel === "warning"
                          ? t.alertSub(prev.nivel)
                          : t.vehSub
                      }
                    >
                      {prev.texto}
                    </p>
                    {isAdmin && v.nombre_compania && (
                      <span className={`${t.companyTag} inline-block mt-1.5 sm:hidden`} title={v.nombre_compania}>
                        {v.nombre_compania}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={v.status} />
                  <IcChevron cls={t.chevron} />
                </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}