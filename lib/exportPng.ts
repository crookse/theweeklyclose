import { computeLayout, type RecapConfig } from "./config.ts";
import {
  chartPaint,
  type LinearGradient,
} from "./effects.ts";

const FONT_WEIGHT = 400;

function fillStyle(
  ctx: CanvasRenderingContext2D,
  paint: string | LinearGradient,
): string | CanvasGradient {
  if (typeof paint === "string") return paint;
  const g = ctx.createLinearGradient(paint.x1, paint.y1, paint.x2, paint.y2);
  for (const s of paint.stops) g.addColorStop(s.offset, s.color);
  return g;
}

/**
 * Draws the recap onto a canvas (using the same layout as the SVG preview) and
 * downloads it as a PNG. Drawing to canvas directly — rather than rasterizing
 * the SVG — lets it use the page's already-loaded web font.
 */
export async function downloadRecapPng(
  config: RecapConfig,
  fontFamily: string,
  filename = "the-weekly-close.png",
) {
  await document.fonts.load(`${FONT_WEIGHT} 64px ${fontFamily}`);
  await document.fonts.ready;

  const layout = computeLayout(config);

  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable");
  }

  const paint = chartPaint(config, layout);

  // Same layer order as the SVG preview (RecapChart)
  ctx.fillStyle = fillStyle(ctx, paint.background);
  ctx.fillRect(0, 0, layout.width, layout.height);

  ctx.strokeStyle = config.colors.text;
  ctx.lineWidth = layout.axis.strokeWidth;
  ctx.beginPath();
  ctx.moveTo(layout.axis.x1, layout.axis.y);
  ctx.lineTo(layout.axis.x2, layout.axis.y);
  ctx.stroke();

  ctx.strokeStyle = fillStyle(ctx, paint.line.stroke);
  ctx.lineWidth = layout.line.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "miter";
  ctx.stroke(new Path2D(paint.line.d));

  ctx.fillStyle = config.colors.text;
  for (const t of layout.texts) {
    ctx.font = `${FONT_WEIGHT} ${t.size}px ${fontFamily}`;
    ctx.textAlign = t.anchor === "middle"
      ? "center"
      : t.anchor === "end"
      ? "right"
      : "left";
    ctx.textBaseline = t.baseline;
    ctx.fillText(t.text, t.x, t.y);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) {
    throw new Error("Failed to encode PNG");
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
