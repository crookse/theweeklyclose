import type { CSSProperties } from "react";

export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "light";

export const THEME_STORAGE_KEY = "trading-recap:theme";

/**
 * UI palette as CSS variables, applied on the app root. Components reference
 * them via Tailwind arbitrary values (e.g. `bg-[var(--tr-panel)]`). The dark
 * set follows haikei.app; the light set is its inverse.
 */
export const THEME_VARS: Record<Theme, CSSProperties> = {
  light: {
    "--tr-canvas": "#ebebeb",
    "--tr-panel": "#ffffff",
    "--tr-control": "#f0f0f0",
    "--tr-control-hover": "#e4e4e4",
    "--tr-control-active": "#ffffff",
    "--tr-border": "rgba(0, 0, 0, 0.08)",
    "--tr-text": "#171717",
    "--tr-label": "#6b6b6b",
    "--tr-faint": "#a3a3a3",
    "--tr-swatch-border": "#d4d4d4",
    colorScheme: "light",
  } as CSSProperties,
  dark: {
    "--tr-canvas": "#000000",
    "--tr-panel": "#242424",
    "--tr-control": "#303030",
    "--tr-control-hover": "#424242",
    "--tr-control-active": "#424242",
    "--tr-border": "rgba(255, 255, 255, 0.075)",
    "--tr-text": "#ffffff",
    "--tr-label": "#878787",
    "--tr-faint": "#6b6b6b",
    "--tr-swatch-border": "#424242",
    colorScheme: "dark",
  } as CSSProperties,
};
