import { forwardRef } from "react";
import { computeLayout, type RecapConfig } from "../lib/config.ts";
import { chartPaint } from "../lib/effects.ts";
import { PaintBackground, PaintLine } from "./PaintLayers.tsx";

export const RecapChart = forwardRef<SVGSVGElement, { config: RecapConfig }>(
  function RecapChart({ config }, ref) {
    const layout = computeLayout(config);
    const paint = chartPaint(config, layout);

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="w-full h-auto"
        role="img"
        aria-label={`${config.title} ${config.subtitle}`}
      >
        <PaintBackground paint={paint} width={layout.width} height={layout.height} />
        <line
          x1={layout.axis.x1}
          x2={layout.axis.x2}
          y1={layout.axis.y}
          y2={layout.axis.y}
          stroke={config.colors.text}
          strokeWidth={layout.axis.strokeWidth}
        />
        <PaintLine
          paint={paint}
          strokeWidth={layout.line.strokeWidth}
          strokeLinejoin="miter"
        />
        {layout.texts.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={t.y}
            fontSize={t.size}
            textAnchor={t.anchor}
            dominantBaseline={t.baseline === "middle" ? "middle" : "auto"}
            fill={config.colors.text}
          >
            {t.text}
          </text>
        ))}
      </svg>
    );
  },
);
