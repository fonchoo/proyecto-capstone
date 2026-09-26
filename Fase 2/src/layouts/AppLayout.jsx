import { Outlet } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";

export default function AppLayout() {
  const { theme } = useTheme();
  const t = themes[theme];

  return (
    <div className={`flex flex-col h-full ${t.shell}`}>
      <TopNav />

      <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full pb-20 lg:pb-8">
            <Outlet />
          </div>
        </main>

        <nav className={t.bottomBar}>
          <BottomNav />
        </nav>
      </div>
    </div>
  );
}