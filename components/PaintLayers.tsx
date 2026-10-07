import { useId } from "react";
import type { LinearGradient, Paint } from "../lib/effects.ts";

// SVG renderings of a computed Paint. Gradient/filter ids come from useId() so
// the preview and every sidebar thumbnail can share a page without clashing.

function Stops({ stops }: { stops: LinearGradient["stops"] }) {
  return stops.map((s, i) => (
    <stop key={i} offset={s.offset} stopColor={s.color} />
  ));
}

function Linear({ id, g }: { id: string; g: LinearGradient }) {
  return (
    <linearGradient
      id={id}
      gradientUnits="userSpaceOnUse"
      x1={g.x1}
      y1={g.y1}
      x2={g.x2}
      y2={g.y2}
    >
      <Stops stops={g.stops} />
    </linearGradient>
  );
}

/** Background fill, solid or gradient. */
export function PaintBackground({
  paint,
  width,
  height,
}: {
  paint: Paint;
  width: number;
  height: number;
}) {
  const id = useId();
  const bg = paint.background;
  return (
    <>
      <defs>
        {typeof bg !== "string" && <Linear id={`${id}bg`} g={bg} />}
      </defs>
      <rect
        width={width}
        height={height}
        fill={typeof bg === "string" ? bg : `url(#${id}bg)`}
      />
    </>
  );
}

/** The line, solid or gradient. */
export function PaintLine({
  paint,
  strokeWidth,
  strokeLinejoin,
}: {
  paint: Paint;
  strokeWidth: number;
  strokeLinejoin: "miter" | "round";
}) {
  const id = useId();
  const { d, stroke } = paint.line;
  return (
    <>
      <defs>
        {typeof stroke !== "string" && <Linear id={`${id}line`} g={stroke} />}
      </defs>
      <path
        d={d}
        fill="none"
        stroke={typeof stroke === "string" ? stroke : `url(#${id}line)`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin={strokeLinejoin}
      />
    </>
  );
}
