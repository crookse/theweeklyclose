import { z } from "zod";

// ----------------------------------------------------------------------------
// Output sizes
// ----------------------------------------------------------------------------

export type SizePreset = {
  id: string;
  group: string;
  label: string;
  width: number;
  height: number;
};

export const CUSTOM_SIZE_ID = "custom";
export const MIN_SIZE = 200;
export const MAX_SIZE = 4096;

export const SIZE_PRESETS: SizePreset[] = [
  { id: "instagram-portrait", group: "Instagram", label: "Post — Portrait (4:5)", width: 1080, height: 1350 },
  { id: "instagram-square", group: "Instagram", label: "Post — Square (1:1)", width: 1080, height: 1080 },
  { id: "instagram-story", group: "Instagram", label: "Story / Reel (9:16)", width: 1080, height: 1920 },
  { id: "tiktok", group: "TikTok", label: "Video / Photo (9:16)", width: 1080, height: 1920 },
  { id: "iphone-pro", group: "iPhone", label: "iPhone 17 Pro / 16 Pro", width: 1206, height: 2622 },
  { id: "iphone-pro-max", group: "iPhone", label: "iPhone 17 Pro Max / 16 Pro Max", width: 1320, height: 2868 },
  { id: "iphone-standard", group: "iPhone", label: "iPhone 15 / 16", width: 1179, height: 2556 },
  { id: "android-fhd", group: "Android", label: "FHD+ (20:9)", width: 1080, height: 2400 },
  { id: "android-qhd", group: "Android", label: "QHD+ (20:9)", width: 1440, height: 3200 },
  { id: "x-landscape", group: "Other", label: "X / Twitter (16:9)", width: 1600, height: 900 },
  { id: "linkedin-square", group: "Other", label: "LinkedIn (1:1)", width: 1200, height: 1200 },
  { id: "youtube-thumbnail", group: "Other", label: "YouTube Thumbnail (16:9)", width: 1280, height: 720 },
];

export const DEFAULT_SIZE = SIZE_PRESETS[0];

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------

export const RecapPointSchema = z.object({
  label: z.string().max(40),
  value: z.number().finite(),
});

/**
 * Optional visual effects layered on the flat colors. Only presets set these;
 * editing a color keeps whatever effects are active.
 */
export const EffectsSchema = z.object({
  /** Background fades top-to-bottom from `colors.background` to this. */
  backgroundTo: z.string().optional(),
  /** Line fades left-to-right from `colors.line` to this. */
  lineTo: z.string().optional(),
});

export type Effects = z.infer<typeof EffectsSchema>;

export const RecapConfigSchema = z.object({
  title: z.string().max(80),
  subtitle: z.string().max(80),
  unit: z.string().max(20),
  points: z.array(RecapPointSchema).min(1).max(31),
  colors: z.object({
    background: z.string(),
    line: z.string(),
    text: z.string(),
  }),
  effects: EffectsSchema.default({}),
  showDeltas: z.boolean(),
  lineStyle: z.enum(["straight", "curved"]).default("straight"),
  size: z.object({
    preset: z.string(),
    width: z.number().int().min(MIN_SIZE).max(MAX_SIZE),
    height: z.number().int().min(MIN_SIZE).max(MAX_SIZE),
  }).default({
    preset: DEFAULT_SIZE.id,
    width: DEFAULT_SIZE.width,
    height: DEFAULT_SIZE.height,
  }),
});

export type RecapPoint = z.infer<typeof RecapPointSchema>;
export type RecapConfig = z.infer<typeof RecapConfigSchema>;

export const DEFAULT_CONFIG: RecapConfig = {
  title: "Weekly Recap",
  subtitle: "July 27-31",
  unit: "pts",
  points: [
    { label: "Mon", value: 0 },
    { label: "Tue", value: 194 },
    { label: "Wed", value: 0 },
    { label: "Thu", value: 200 },
    { label: "Fri", value: -50 },
  ],
  colors: {
    background: "#f9fafc",
    line: "#334155",
    text: "#334155",
  },
  effects: {},
  showDeltas: true,
  lineStyle: "straight",
  size: {
    preset: DEFAULT_SIZE.id,
    width: DEFAULT_SIZE.width,
    height: DEFAULT_SIZE.height,
  },
};

/**
 * Running total through each point (inclusive), so the last point always
 * equals the sum of all values.
 */
export function cumulative(points: RecapPoint[]): number[] {
  let sum = 0;
  return points.map((p) => (sum += p.value));
}

export function total(config: RecapConfig): number {
  return config.points.reduce((acc, p) => acc + p.value, 0);
}

export function formatDelta(n: number): string {
  if (n > 0) return `+${n}`;
  return `${n}`;
}

export type LineStyle = RecapConfig["lineStyle"];

type Pt = { x: number; y: number };

/**
 * The line as cubic Bézier segments [start, control1, control2, end].
 *
 * "curved" is a Catmull-Rom spline: a smooth cubic curve through every point,
 * with each point's tangent set by the slope between its neighbors. It's fully
 * smooth, but can dip/bulge between points (e.g. on flat stretches).
 * "straight" segments put the controls on the segment itself.
 */
/**
 * How far each curved control handle reaches along its tangent, as a fraction
 * of the segment's width. 1/3 is a standard Catmull-Rom spline; longer handles
 * give fuller, rounder sweeps between points. Keep it under 0.5 so a segment's
 * two handles can't cross and loop the curve back on itself.
 */
const CURVE_HANDLE = .33;

function bezierSegments(pts: Pt[], style: LineStyle): [Pt, Pt, Pt, Pt][] {
  const n = pts.length;
  if (n < 2) return [];
  const h = pts.slice(1).map((p, i) => p.x - pts[i].x);
  const m = pts.slice(1).map((p, i) => (p.y - pts[i].y) / (h[i] || 1));

  // Tangent (dy/dx) at each point; straight segments use their own slope
  const curved = style === "curved" && n > 2;
  const t = new Array<number>(n);
  if (curved) {
    for (let i = 1; i < n - 1; i++) {
      t[i] = (pts[i + 1].y - pts[i - 1].y) / (pts[i + 1].x - pts[i - 1].x || 1);
    }
    t[0] = (3 * m[0] - t[1]) / 2;
    t[n - 1] = (3 * m[n - 2] - t[n - 2]) / 2;
  }

  return pts.slice(1).map((end, i) => {
    const start = pts[i];
    const dx = h[i] * (curved ? CURVE_HANDLE : 1 / 3);
    const t0 = curved ? t[i] : m[i];
    const t1 = curved ? t[i + 1] : m[i];
    return [
      start,
      { x: start.x + dx, y: start.y + t0 * dx },
      { x: end.x - dx, y: end.y - t1 * dx },
      end,
    ];
  });
}

/**
 * SVG path data through `pts`. The same string feeds both the SVG preview and
 * the canvas export (via Path2D).
 */
export function linePath(pts: Pt[], style: LineStyle): string {
  if (pts.length === 0) return "";
  const move = `M${pts[0].x},${pts[0].y}`;
  if (pts.length === 1) return `${move}L${pts[0].x},${pts[0].y}`;
  if (style === "straight" || pts.length === 2) {
    return move + pts.slice(1).map((p) => `L${p.x},${p.y}`).join("");
  }
  return move + bezierSegments(pts, style)
    .map(([, c1, c2, e]) => `C${c1.x},${c1.y} ${c2.x},${c2.y} ${e.x},${e.y}`)
    .join("");
}

/**
 * The [min, max] y the drawn line actually reaches — for curves this includes
 * any bulge between points, not just the points themselves.
 */
export function lineYRange(pts: Pt[], style: LineStyle): [number, number] {
  let lo = Math.min(...pts.map((p) => p.y));
  let hi = Math.max(...pts.map((p) => p.y));
  if (style === "straight") return [lo, hi];

  for (const [p0, p1, p2, p3] of bezierSegments(pts, style)) {
    // Roots of the derivative of the cubic's y component, in (0, 1)
    const a = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
    const b = 2 * (p0.y - 2 * p1.y + p2.y);
    const c = p1.y - p0.y;
    const roots: number[] = [];
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) > 1e-12) roots.push(-c / b);
    } else {
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const sq = Math.sqrt(disc);
        roots.push((-b + sq) / (2 * a), (-b - sq) / (2 * a));
      }
    }
    for (const r of roots) {
      if (r <= 0 || r >= 1) continue;
      const u = 1 - r;
      const y = u * u * u * p0.y + 3 * u * u * r * p1.y +
        3 * u * r * r * p2.y + r * r * r * p3.y;
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
  }
  return [lo, hi];
}

// ----------------------------------------------------------------------------
// Layout
// ----------------------------------------------------------------------------
//
// Geometry is computed once here and rendered by both the SVG preview and the
// canvas PNG export so the two never drift apart.
//
// The design is authored in a 1080x1350 (4:5) base frame. For other output
// sizes it is scaled to fit the width or height (whichever is tighter) and
// centered; most spare space goes to the plot so tall phone formats get a
// taller chart and landscape formats a wider one, rather than a small chart
// floating in empty space.

const BASE_WIDTH = 1080;
const BASE_HEIGHT = 1350;

const AXIS_LEFT = 171;
const PLOT_LEFT = 265;
const PLOT_RIGHT = 838;
const PLOT_BOTTOM = 914;
/** Lowest point a negative running total may reach (just above day labels). */
const NEGATIVE_FLOOR = 1100;

/** Headline total ("344pts") baseline and font size, in base units. */
const TOTAL_BASELINE = 479;
const TOTAL_SIZE = 60;
/** Space below the baseline for descenders (the "p" in "pts"), in ems. */
const DESCENT_EM = 0.25;
/** Minimum gap in output pixels between the total text and the line's top. */
const TOTAL_MARGIN = 20;
/** Line stroke width, in base units. */
const LINE_WIDTH = 6;

/** Share of spare space (in base units) given to the plot's height/width. */
const PLOT_GROWTH_SHARE = 0.6;

export type LayoutText = {
  x: number;
  y: number;
  text: string;
  size: number;
  anchor: "start" | "middle" | "end";
  baseline: "alphabetic" | "middle";
};

export type Layout = {
  width: number;
  height: number;
  axis: { x1: number; x2: number; y: number; strokeWidth: number };
  line: { points: { x: number; y: number }[]; strokeWidth: number };
  texts: LayoutText[];
};

export function computeLayout(config: RecapConfig): Layout {
  const { width, height } = config.size;
  const s = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);

  // Spare space, expressed in base units
  const extraY = height / s - BASE_HEIGHT;
  const plotGrowth = extraY * PLOT_GROWTH_SHARE;
  const topPad = (extraY - plotGrowth) / 2;
  const extraX = width / s - BASE_WIDTH;
  const plotGrowthX = extraX * PLOT_GROWTH_SHARE;
  const leftPad = (extraX - plotGrowthX) / 2;

  // Map base-frame coordinates into output pixels. Anything below the plot top
  // shifts down by the vertical plot growth; anything right of the plot's left
  // edge shifts right by the horizontal plot growth.
  const X = (x: number, rightOfPlotLeft = false) =>
    (x + leftPad + (rightOfPlotLeft ? plotGrowthX : 0)) * s;
  const Y = (y: number, belowPlotTop = false) =>
    (y + topPad + (belowPlotTop ? plotGrowth : 0)) * s;

  const sums = cumulative(config.points);

  const plotLeft = X(PLOT_LEFT);
  const plotRight = X(PLOT_RIGHT, true);
  const n = config.points.length;
  const xFor = (i: number) =>
    n === 1
      ? (plotLeft + plotRight) / 2
      : plotLeft + (i * (plotRight - plotLeft)) / (n - 1);
  const originX = X(AXIS_LEFT);

  // The headline total ("344pts") sits above the plot. The painted line (its
  // centerline plus half the stroke) must stay at least TOTAL_MARGIN px below
  // the bottom of that text, descenders included.
  const totalBaseline = Y(TOTAL_BASELINE);
  const totalSize = TOTAL_SIZE * s;
  const lineWidth = LINE_WIDTH * s;
  const plotTop = totalBaseline + totalSize * DESCENT_EM + TOTAL_MARGIN +
    lineWidth / 2;

  // The zero axis is pinned at the plot bottom and never moves. Positive
  // totals rise into the space above it; negative totals dip below it, into
  // the gap above the day labels. One shared scale is chosen so whichever side
  // is tighter still fits — measured on the line as drawn, so a curve's bulge
  // past its highest/lowest point is contained too. (Scaling is linear in the
  // values, so the drawn curve's range scales with it.)
  const axisY = Y(PLOT_BOTTOM, true);
  const belowLimit = Y(NEGATIVE_FLOOR, true);
  const [lowest, highest] = lineYRange(
    [{ x: originX, y: 0 }, ...sums.map((v, i) => ({ x: xFor(i), y: v }))],
    config.lineStyle,
  );
  const max = Math.max(0, highest);
  const min = Math.min(0, lowest);
  const scale = Math.min(
    max > 0 ? (axisY - plotTop) / max : Infinity,
    min < 0 ? (belowLimit - axisY) / -min : Infinity,
  );
  const yFor = (v: number) =>
    Number.isFinite(scale) ? axisY - v * scale : axisY;

  const center = width / 2;

  const texts: LayoutText[] = [
    {
      x: center,
      y: Y(268),
      text: config.title,
      size: 64 * s,
      anchor: "middle",
      baseline: "alphabetic",
    },
    {
      x: center,
      y: Y(338),
      text: config.subtitle,
      size: 64 * s,
      anchor: "middle",
      baseline: "alphabetic",
    },
    {
      x: center,
      y: totalBaseline,
      text: `${total(config)}${config.unit}`,
      size: totalSize,
      anchor: "middle",
      baseline: "alphabetic",
    },
    {
      x: X(AXIS_LEFT - 18),
      y: axisY,
      text: "0",
      size: 22 * s,
      anchor: "end",
      baseline: "middle",
    },
  ];

  config.points.forEach((p, i) => {
    if (config.showDeltas) {
      texts.push({
        x: xFor(i),
        y: axisY + 30 * s,
        text: formatDelta(p.value),
        size: 22 * s,
        anchor: "middle",
        baseline: "alphabetic",
      });
    }
    texts.push({
      x: xFor(i),
      y: Y(1160, true),
      text: p.label,
      size: 24 * s,
      anchor: "middle",
      baseline: "alphabetic",
    });
  });

  return {
    width,
    height,
    axis: {
      // Ends at the last day so no line runs past the day labels
      x1: X(AXIS_LEFT),
      x2: xFor(n - 1),
      y: axisY,
      strokeWidth: 1.5 * s,
    },
    line: {
      // The line starts at 0 at the left end of the axis (the "0" mark), then
      // runs through each point's running total.
      points: [
        { x: originX, y: axisY },
        ...sums.map((v, i) => ({ x: xFor(i), y: yFor(v) })),
      ],
      strokeWidth: lineWidth,
    },
    texts,
  };
}
