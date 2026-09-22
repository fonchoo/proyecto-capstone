import { useTheme } from "../theme.jsx";

function StrokeIcon({ children, cls = "", stroke = 2 }) {
  const { theme } = useTheme();
  const sw = stroke === 2.5 ? 2.5 : theme === "v1" ? 2 : 1.75;
  return (
    <svg
      className={cls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function IcFlame({ cls = "" }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C10 5.5 7 9 7 12.5a5 5 0 0 0 10 0C17 9 14 5.5 12 2zm0 8c0 0-2 1.5-2 3a2 2 0 0 0 4 0c0-1.5-2-3-2-3z" />
    </svg>
  );
}

export function IcHome({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </StrokeIcon>
  );
}

export function IcBell({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </StrokeIcon>
  );
}

export function IcBarChart({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </StrokeIcon>
  );
}

export function IcUsers({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </StrokeIcon>
  );
}

export function IcArrowLeft({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </StrokeIcon>
  );
}

export function IcChevron({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <polyline points="9 18 15 12 9 6" />
    </StrokeIcon>
  );
}

export function IcCheck({ cls = "" }) {
  return (
    <StrokeIcon cls={cls} stroke={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </StrokeIcon>
  );
}

export function IcPlus({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </StrokeIcon>
  );
}

export function IcLogOut({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </StrokeIcon>
  );
}

export function IcAlert({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </StrokeIcon>
  );
}

export function IcCamera({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </StrokeIcon>
  );
}

export function IcDownload({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </StrokeIcon>
  );
}

export function IcTool({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </StrokeIcon>
  );
}

export function IcSun({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </StrokeIcon>
  );
}

export function IcMoon({ cls = "" }) {
  return (
    <StrokeIcon cls={cls}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </StrokeIcon>
  );
}