import { z } from "zod";
import { type Effects, EffectsSchema, type RecapConfig } from "./config.ts";

export type Palette = {
  name: string;
  colors: RecapConfig["colors"];
  effects?: Effects;
};

/** Predefined chart color sets shown in the left sidebar. */
export const PALETTES: Palette[] = [
  { name: "Classic", colors: { background: "#f9fafc", line: "#334155", text: "#334155" } },
  { name: "Win", colors: { background: "#f9fafc", line: "#12d25d", text: "#334155" } },
  { name: "Loss", colors: { background: "#f9fafc", line: "#d21413", text: "#334155" } },
  { name: "Emerald", colors: { background: "#ecfdf5", line: "#059669", text: "#064e3b" } },
  { name: "Rose", colors: { background: "#fff1f2", line: "#e11d48", text: "#881337" } },
  { name: "Paper", colors: { background: "#fdf6e3", line: "#b45309", text: "#44403c" } },
  { name: "Midnight", colors: { background: "#0f172a", line: "#38bdf8", text: "#e2e8f0" } },
  { name: "Deep Sea", colors: { background: "#002233", line: "#0066ff", text: "#ffffff" } },
  { name: "Violet", colors: { background: "#1e1b4b", line: "#a78bfa", text: "#ede9fe" } },
  { name: "Gold", colors: { background: "#1c1917", line: "#f59e0b", text: "#fef3c7" } },
];

function sameColors(a: Palette["colors"], b: Palette["colors"]) {
  return (
    a.background.toLowerCase() === b.background.toLowerCase() &&
    a.line.toLowerCase() === b.line.toLowerCase() &&
    a.text.toLowerCase() === b.text.toLowerCase()
  );
}

function sameEffects(a: Effects = {}, b: Effects = {}) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<
    keyof Effects
  >;
  return [...keys].every((k) => {
    const x = a[k];
    const y = b[k];
    return typeof x === "string" && typeof y === "string"
      ? x.toLowerCase() === y.toLowerCase()
      : x === y;
  });
}

/** Whether two schemes look identical: same colors and same effects. */
export function sameScheme(
  a: Pick<Palette, "colors" | "effects">,
  b: Pick<Palette, "colors" | "effects">,
) {
  return sameColors(a.colors, b.colors) && sameEffects(a.effects, b.effects);
}

// ----------------------------------------------------------------------------
// Saved schemes ("My Schemes"), stored per browser
// ----------------------------------------------------------------------------

export const SavedSchemeSchema = z.object({
  id: z.string(),
  name: z.string().max(40),
  colors: z.object({
    background: z.string(),
    line: z.string(),
    text: z.string(),
  }),
  effects: EffectsSchema.default({}),
});

export type SavedScheme = z.infer<typeof SavedSchemeSchema>;

const SCHEMES_STORAGE_KEY = "trading-recap:schemes";

export function loadSavedSchemes(): SavedScheme[] {
  try {
    const raw = localStorage.getItem(SCHEMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = z.array(SavedSchemeSchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function storeSavedSchemes(schemes: SavedScheme[]) {
  try {
    localStorage.setItem(SCHEMES_STORAGE_KEY, JSON.stringify(schemes));
  } catch {
    // Storage unavailable — schemes just won't persist
  }
}
