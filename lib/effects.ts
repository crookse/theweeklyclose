import {
  type Effects,
  type Layout,
  type LineStyle,
  linePath,
  type RecapConfig,
} from "./config.ts";

// ----------------------------------------------------------------------------
// Paint
// ----------------------------------------------------------------------------
//
// Resolves a config's colors + effects against chart geometry into plain data
// (colors, gradient coordinates, path strings). The SVG preview, the canvas
// PNG export and the sidebar thumbnails all draw from this so they match.

type Pt = { x: number; y: number };

export type GradientStop = { offset: number; color: string };

export type LinearGradient = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: GradientStop[];
};

export type Paint = {
  /** Solid color, or a gradient when the background fades. */
  background: string | LinearGradient;
  line: {
    d: string;
    stroke: string | LinearGradient;
  };
};

export type PaintGeometry = {
  width: number;
  height: number;
  /** The line's points, starting at the zero mark on the axis. */
  points: Pt[];
};

export function computePaint(
  colors: RecapConfig["colors"],
  effects: Effects,
  lineStyle: LineStyle,
  geo: PaintGeometry,
): Paint {
  const { height, points } = geo;
  const d = linePath(points, lineStyle);

  const background = effects.backgroundTo
    ? {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: height,
      stops: [
        { offset: 0, color: colors.background },
        { offset: 1, color: effects.backgroundTo },
      ],
    }
    : colors.background;

  const firstX = points[0]?.x ?? 0;
  const lastX = points[points.length - 1]?.x ?? 0;
  const stroke = effects.lineTo && lastX > firstX
    ? {
      x1: firstX,
      y1: 0,
      x2: lastX,
      y2: 0,
      stops: [
        { offset: 0, color: colors.line },
        { offset: 1, color: effects.lineTo },
      ],
    }
    : colors.line;

  return { background, line: { d, stroke } };
}

// ----------------------------------------------------------------------------
// Colors
// ----------------------------------------------------------------------------

type Rgba = [number, number, number, number];

/** Parses #rgb, #rgba, #rrggbb, #rrggbbaa, rgb() and rgba(). */
function parseColor(color: string): Rgba | null {
  const c = color.trim().toLowerCase();
  const hex = c.match(/^#([0-9a-f]{3,8})$/)?.[1];
  if (hex && [3, 4, 6, 8].includes(hex.length)) {
    const full = hex.length <= 4 ? [...hex].map((h) => h + h).join("") : hex;
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1];
  }
  const fn = c.match(/^rgba?\(([^)]+)\)$/)?.[1];
  if (fn) {
    const parts = fn.split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.every(Number.isFinite)) {
      return [parts[0], parts[1], parts[2], parts[3] ?? 1];
    }
  }
  return null;
}

/** Opaque #rrggbb blend of two colors, for seeding color pickers. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return a;
  const hex = (i: number) =>
    Math.round(ca[i] + (cb[i] - ca[i]) * t).toString(16).padStart(2, "0");
  return `#${hex(0)}${hex(1)}${hex(2)}`;
}

/** Paint for the full-size chart (preview and PNG export). */
export function chartPaint(config: RecapConfig, layout: Layout): Paint {
  return computePaint(config.colors, config.effects, config.lineStyle, {
    width: layout.width,
    height: layout.height,
    points: layout.line.points,
  });
}
