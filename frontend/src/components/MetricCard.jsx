import { useTheme } from "../theme.jsx";

const ACCENTS = {
  emerald: { num: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/15" },
  amber: { num: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/15" },
  red: { num: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/15" },
  blue: { num: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/15" },
};

export default function MetricCard({ value, label, accent }) {
  const { theme } = useTheme();

  if (theme === "v1") {
    const c = ACCENTS[accent];
    return (
      <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
        <p className={`text-4xl font-bold font-mono leading-none ${c.num}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-2 leading-snug">{label}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-4xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-2 leading-snug">{label}</p>
    </div>
  );
}