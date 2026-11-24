import { useTheme } from "../theme.jsx";

// Indicador numérico del Dashboard. Si recibe onClick funciona como
// filtro de la tabla de la flota: es un <button> con aria-pressed, así se
// puede usar con teclado y el lector de pantalla anuncia si está activo.
// Sin onClick es solo informativo (un <div>, como antes).

const ACCENTS = {
  emerald: { num: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/15", activo: "border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-500/10", hover: "hover:border-emerald-500/40" },
  amber: { num: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/15", activo: "border-amber-400 ring-2 ring-amber-500/40 bg-amber-500/10", hover: "hover:border-amber-500/40" },
  red: { num: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/15", activo: "border-red-400 ring-2 ring-red-500/40 bg-red-500/10", hover: "hover:border-red-500/40" },
  blue: { num: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/15", activo: "border-blue-400 ring-2 ring-blue-500/40 bg-blue-500/10", hover: "hover:border-blue-500/40" },
};

// Tema v2 (claro): el número es neutro, así que el activo se marca con
// el borde y un anillo del color del estado.
const ACCENTS_V2 = {
  emerald: "border-emerald-500 ring-2 ring-emerald-500/30",
  amber: "border-amber-500 ring-2 ring-amber-500/30",
  red: "border-red-500 ring-2 ring-red-500/30",
  blue: "border-blue-500 ring-2 ring-blue-500/30",
};

export default function MetricCard({ value, label, accent, onClick, active = false }) {
  const { theme } = useTheme();
  const clickable = typeof onClick === "function";

  let cls;
  if (theme === "v1") {
    const c = ACCENTS[accent];
    cls = `${active ? c.activo : `${c.bg} border ${c.border}`} border rounded-xl p-4`;
    if (clickable) cls += ` ${active ? "" : c.hover} cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`;
  } else {
    cls = `bg-white rounded-2xl border shadow-sm p-4 ${active ? ACCENTS_V2[accent] : "border-gray-100"}`;
    if (clickable) cls += ` ${active ? "" : "hover:border-gray-300"} cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900`;
  }

  const numCls = theme === "v1"
    ? `text-4xl font-bold font-mono leading-none ${ACCENTS[accent].num}`
    : "text-4xl font-bold text-gray-900 leading-none";

  const contenido = (
    <>
      <p className={numCls}>{value}</p>
      <p className="text-xs text-gray-500 mt-2 leading-snug">{label}</p>
    </>
  );

  if (!clickable) return <div className={cls}>{contenido}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={active ? "Quitar el filtro" : `Ver solo: ${label}`}
      className={`${cls} w-full text-left`}
    >
      {contenido}
    </button>
  );
}
