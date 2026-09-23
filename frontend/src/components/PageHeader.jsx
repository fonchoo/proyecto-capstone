import { useTheme } from "../theme.jsx";
import { themes } from "../themeStyles.js";
import { IcArrowLeft } from "./Icons.jsx";

export default function PageHeader({ title, subtitle, onBack }) {
  const { theme } = useTheme();
  const t = themes[theme];

  return (
    <div className="flex items-center gap-3 px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
      {onBack && (
        <button onClick={onBack} className={t.backBtn} aria-label="Volver">
          <IcArrowLeft cls={t.backIcon} />
        </button>
      )}
      <div>
        <h1 className={t.h1}>{title}</h1>
        {subtitle && <p className={t.subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}