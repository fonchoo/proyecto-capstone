import { useTheme } from "../theme.jsx";

export default function EmptyState({ icon, title, subtitle }) {
  const { theme } = useTheme();

  const circle =
    theme === "v1"
      ? "w-16 h-16 rounded-full bg-gray-800/60 border border-gray-700/60 flex items-center justify-center"
      : "w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center";
  const iconCls = theme === "v1" ? "w-7 h-7 text-gray-500" : "w-6 h-6 text-gray-400";

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className={`${circle} mb-4`}>{icon && <span className={iconCls}>{icon}</span>}</div>
      <p className={theme === "v1" ? "text-gray-400 font-medium" : "text-sm font-semibold text-gray-700"}>
        {title}
      </p>
      {subtitle && (
        <p className={theme === "v1" ? "text-gray-600 text-sm mt-1" : "text-sm text-gray-400 mt-1"}>
          {subtitle}
        </p>
      )}
    </div>
  );
}