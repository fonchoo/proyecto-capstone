import { useTheme } from "../theme.jsx";

const VARIANTS = {
  v1: {
    operational: { dot: "bg-emerald-400", small: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", large: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25" },
    warning: { dot: "bg-amber-400", small: "bg-amber-500/10 text-amber-400 border border-amber-500/20", large: "bg-amber-500/15 text-amber-300 border border-amber-500/25" },
    critical: { dot: "bg-red-400", small: "bg-red-500/10 text-red-400 border border-red-500/20", large: "bg-red-500/15 text-red-300 border border-red-500/25" },
  },
  v2: {
    operational: { dot: "bg-emerald-500", small: "bg-emerald-50 text-emerald-700" },
    warning: { dot: "bg-amber-500", small: "bg-amber-50 text-amber-700" },
    critical: { dot: "bg-red-500", small: "bg-red-50 text-red-700" },
  },
};

const LABELS = { operational: "Operativo", warning: "Mant. Próxima", critical: "No Operativo" };

export default function StatusBadge({ status, large = false }) {
  const { theme } = useTheme();
  const v = VARIANTS[theme][status];

  if (large && theme === "v1") {
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${v.large}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${v.dot}`} />
        {LABELS[status].toUpperCase()}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${v.small}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} />
      {LABELS[status]}
    </span>
  );
}