"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConfigPanel } from "../components/ConfigPanel.tsx";
import { ConfirmDialog } from "../components/ConfirmDialog.tsx";
import { PaletteSidebar } from "../components/PaletteSidebar.tsx";
import { RecapChart } from "../components/RecapChart.tsx";
import {
  DEFAULT_CONFIG,
  RecapConfigSchema,
  type RecapConfig,
} from "../lib/config.ts";
import { downloadRecapPng } from "../lib/exportPng.ts";
import {
  loadSavedSchemes,
  sameScheme,
  type SavedScheme,
  storeSavedSchemes,
} from "../lib/palettes.ts";
import {
  DEFAULT_THEME,
  type Theme,
  THEME_STORAGE_KEY,
  THEME_VARS,
} from "../lib/theme.ts";

const STORAGE_KEY = "trading-recap:config";

function loadStoredConfig(): RecapConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Configs saved while line shape was a smoothness slider: any curve → Curved
    if (data && data.lineStyle === undefined && data.smoothness > 0) {
      data.lineStyle = "curved";
    }
    const parsed = RecapConfigSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function loadStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw === "light" || raw === "dark" ? raw : null;
  } catch {
    return null;
  }
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export default function PageComponent() {
  const [config, setConfig] = useState<RecapConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [savedSchemes, setSavedSchemes] = useState<SavedScheme[]>([]);
  const [pendingDelete, setPendingDelete] = useState<SavedScheme | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const stored = loadStoredConfig();
    if (stored) setConfig(stored);
    const storedTheme = loadStoredTheme();
    if (storedTheme) setTheme(storedTheme);
    setSavedSchemes(loadSavedSchemes());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Storage unavailable (private mode, etc.) — config just won't persist
    }
  }, [config, loaded]);

  const updateSchemes = (next: SavedScheme[]) => {
    setSavedSchemes(next);
    storeSavedSchemes(next);
  };

  const saveScheme = (name: string) =>
    updateSchemes([
      ...savedSchemes,
      {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        colors: config.colors,
        effects: config.effects,
      },
    ]);

  const deleteScheme = (id: string) =>
    setPendingDelete(savedSchemes.find((s) => s.id === id) ?? null);

  const confirmDelete = () => {
    if (pendingDelete) {
      updateSchemes(savedSchemes.filter((s) => s.id !== pendingDelete.id));
    }
    setPendingDelete(null);
  };

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable — theme just won't persist
    }
  };

  const handleDownload = useCallback(async () => {
    const fontFamily = svgRef.current
      ? getComputedStyle(svgRef.current).fontFamily
      : "sans-serif";
    const slug = `${config.title}-${config.subtitle}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const { width, height } = config.size;
    await downloadRecapPng(
      config,
      fontFamily,
      `${slug || "the-weekly-close"}-${width}x${height}.png`,
    );
  }, [config]);

  return (
    <div
      data-theme={theme}
      style={THEME_VARS[theme]}
      className="flex min-h-screen flex-col text-[var(--tr-text)] lg:h-screen lg:flex-row"
    >
      <aside className="w-full lg:h-screen lg:w-[224px] lg:shrink-0">
        <PaletteSidebar
          config={config}
          onSelect={(scheme) =>
            setConfig({
              ...config,
              colors: scheme.colors,
              effects: scheme.effects ?? {},
            })}
          savedSchemes={savedSchemes}
          onDeleteScheme={deleteScheme}
          header={
            <h1 className="whitespace-nowrap text-lg font-bold tracking-tight">
              The Weekly Close
            </h1>
          }
        />
      </aside>
      <main className="relative flex flex-1 items-center justify-center bg-[var(--tr-canvas)] px-6 pb-6 pt-16 lg:p-10">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          className="absolute right-4 top-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--tr-control)] text-[var(--tr-label)] transition-colors hover:bg-[var(--tr-control-hover)] hover:text-[var(--tr-text)] outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(139,122,244,0.36)]"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
        <div
          // Fit the preview inside the canvas area by width and height so tall
          // phone formats and wide landscape formats both stay fully visible
          className="w-full [--fit-h:65vh] lg:[--fit-h:calc(100vh-80px)]"
          style={{
            maxWidth: `min(100%, calc(var(--fit-h) * ${
              config.size.width / config.size.height
            }))`,
          }}
        >
          <div className="shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <RecapChart ref={svgRef} config={config} />
          </div>
        </div>
      </main>
      <aside className="w-full lg:h-screen lg:w-[340px] lg:shrink-0">
        <ConfigPanel
          config={config}
          onChange={setConfig}
          onReset={() => setConfig(DEFAULT_CONFIG)}
          onDownload={handleDownload}
          onSaveScheme={saveScheme}
          isSchemeSaved={savedSchemes.some((s) =>
            sameScheme(s, config)
          )}
          nextSchemeName={`My Scheme ${savedSchemes.length + 1}`}
        />
      </aside>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete scheme?"
        message={
          <>
            &ldquo;{pendingDelete?.name}&rdquo; will be removed from My Schemes.
            This can&rsquo;t be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
