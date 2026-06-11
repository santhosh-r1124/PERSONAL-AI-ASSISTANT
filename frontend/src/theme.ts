// Theme management with localStorage persistence
// Professional two-theme system: Light and Dark with cyberpunk accents

export interface ThemeColors {
  bg: string;
  bgElevated: string;
  bgSurface: string;
  borderOutline: string;
  fg: string;
  fgSecondary: string;
  muted: string;
  accent: string; // Neon purple
  accentLight: string;
  neonPurple: string;
  neonPurpleGlow: string;
  chipBg: string;
  chipFg: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  gradient: string;
}

export const themes: Record<string, Theme> = {
  dark: {
    name: "Dark",
    colors: {
      bg: "#000000",
      bgElevated: "#0a0a0a",
      bgSurface: "#111111",
      borderOutline: "#1a1a1a",
      fg: "#ffffff",
      fgSecondary: "#e5e5e5",
      muted: "#888888",
      accent: "#a855f7", // Neon purple
      accentLight: "#7c3aed",
      neonPurple: "#a855f7",
      neonPurpleGlow: "rgba(168, 85, 247, 0.5)",
      chipBg: "#1a1a1a",
      chipFg: "#e5e5e5",
      success: "#10b981",
      successLight: "#064e3b",
      warning: "#f59e0b",
      warningLight: "#78350f",
      danger: "#ef4444",
      dangerLight: "#7f1d1d",
    },
    gradient: `
      radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.03) 0%, transparent 50%),
      linear-gradient(135deg, #000000 0%, #0a0a0a 100%)
    `,
  },
  light: {
    name: "Light",
    colors: {
      bg: "#ffffff",
      bgElevated: "#fafafa",
      bgSurface: "#f5f5f5",
      borderOutline: "#e5e5e5",
      fg: "#000000",
      fgSecondary: "#1a1a1a",
      muted: "#666666",
      accent: "#000000",
      accentLight: "#1a1a1a",
      neonPurple: "#a855f7", // Still purple for Vizoro name
      neonPurpleGlow: "rgba(168, 85, 247, 0.3)",
      chipBg: "#f5f5f5",
      chipFg: "#1a1a1a",
      success: "#10b981",
      successLight: "#d1fae5",
      warning: "#f59e0b",
      warningLight: "#fef3c7",
      danger: "#ef4444",
      dangerLight: "#fee2e2",
    },
    gradient: `
      radial-gradient(circle at 20% 50%, rgba(0, 0, 0, 0.02) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.01) 0%, transparent 50%),
      linear-gradient(135deg, #ffffff 0%, #fafafa 100%)
    `,
  },
};

export function getTheme(): Theme {
  const saved = localStorage.getItem("theme") || "dark";
  return themes[saved] || themes.dark;
}

export function setTheme(themeName: string) {
  localStorage.setItem("theme", themeName);
  applyTheme(themes[themeName], themeName);
}

export function applyTheme(theme: Theme, themeName: string | null = null) {
  const root = document.documentElement;
  root.style.setProperty("--bg", theme.colors.bg);
  root.style.setProperty("--bg-elevated", theme.colors.bgElevated);
  root.style.setProperty("--bg-surface", theme.colors.bgSurface);
  root.style.setProperty("--border-outline", theme.colors.borderOutline);
  root.style.setProperty("--fg", theme.colors.fg);
  root.style.setProperty("--fg-secondary", theme.colors.fgSecondary);
  root.style.setProperty("--muted", theme.colors.muted);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--accent-light", theme.colors.accentLight);
  root.style.setProperty("--neon-purple", theme.colors.neonPurple);
  root.style.setProperty("--neon-purple-glow", theme.colors.neonPurpleGlow);
  root.style.setProperty("--chip-bg", theme.colors.chipBg);
  root.style.setProperty("--chip-fg", theme.colors.chipFg);
  root.style.setProperty("--success", theme.colors.success);
  root.style.setProperty("--success-light", theme.colors.successLight);
  root.style.setProperty("--warning", theme.colors.warning);
  root.style.setProperty("--warning-light", theme.colors.warningLight);
  root.style.setProperty("--danger", theme.colors.danger);
  root.style.setProperty("--danger-light", theme.colors.dangerLight);
  root.style.setProperty("--gradient", theme.gradient);
  document.body.style.background = theme.gradient;
  // Add class for light mode wave styling
  const currentTheme = themeName || localStorage.getItem("theme") || "dark";
  if (currentTheme === "light") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }
}
