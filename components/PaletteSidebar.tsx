"use client";

import { concatClassNames } from "@/components/utils/classNames.ts";
import {
  cumulative,
  lineYRange,
  type RecapConfig,
} from "../lib/config.ts";
import { computePaint } from "../lib/effects.ts";
import {
  type Palette,
  PALETTES,
  type SavedScheme,
  sameScheme,
} from "../lib/palettes.ts";
import { PaintBackground, PaintLine } from "./PaintLayers.tsx";

const THUMB_W = 160;
const THUMB_H = 100;

/** Small card preview: the current data's line drawn in the palette colors. */
function PaletteThumb({
  palette,
  points,
  lineStyle,
}: {
  palette: Palette;
  points: RecapConfig["points"];
  lineStyle: RecapConfig["lineStyle"];
}) {
  const sums = cumulative(points);
  const n = sums.length;
  const left = 24;
  const right = THUMB_W - 24;
  const x = (i: number) => (n === 1 ? THUMB_W / 2 : left + (i * (right - left)) / (n - 1));
  // Fit the line as drawn (including any curve bulge) so it stays clear of
  // the palette name above it
  const [lowest, highest] = lineYRange(
    [{ x: left - 8, y: 0 }, ...sums.map((v, i) => ({ x: x(i), y: v }))],
    lineStyle,
  );
  const min = Math.min(0, lowest);
  const max = Math.max(0, highest);
  const range = max - min || 1;
  const top = 46;
  const bottom = 86;
  const y = (v: number) => bottom - ((v - min) / range) * (bottom - top);

  const paint = computePaint(palette.colors, palette.effects ?? {}, lineStyle, {
    width: THUMB_W,
    height: THUMB_H,
    points: [
      { x: left - 8, y: y(0) },
      ...sums.map((v, i) => ({ x: x(i), y: y(v) })),
    ],
  });

  return (
    <svg viewBox={`0 0 ${THUMB_W} ${THUMB_H}`} className="block h-full w-full" aria-hidden>
      <PaintBackground paint={paint} width={THUMB_W} height={THUMB_H} />
      <line x1={left - 8} x2={x(n - 1)} y1={y(0)} y2={y(0)} stroke={palette.colors.text} strokeOpacity={0.5} strokeWidth={1} />
      <PaintLine
        paint={paint}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <text
        x={THUMB_W / 2}
        y={28}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fill={palette.colors.text}
      >
        {palette.name}
      </text>
    </svg>
  );
}

function PaletteCard({
  palette,
  config,
  onSelect,
  onDelete,
}: {
  palette: Palette;
  config: RecapConfig;
  onSelect: (scheme: Palette) => void;
  onDelete?: () => void;
}) {
  const active = sameScheme(palette, config);
  return (
    <div className="group relative w-36 shrink-0 lg:w-full">
      <button
        type="button"
        role="option"
        aria-selected={active}
        aria-label={`${palette.name} palette`}
        onClick={() => onSelect(palette)}
        className={concatClassNames(
          "block aspect-[8/5] w-full overflow-hidden rounded-lg transition-[box-shadow,transform] outline-none hover:scale-[1.02] focus-visible:ring-[3px] focus-visible:ring-[rgba(139,122,244,0.36)]",
          active
            ? "ring-[3px] ring-[var(--tr-text)] ring-offset-2 ring-offset-[var(--tr-panel)]"
            : "ring-1 ring-[var(--tr-border)]",
        )}
      >
        <PaletteThumb
          palette={palette}
          points={config.points}
          lineStyle={config.lineStyle}
        />
      </button>
      {onDelete && (
        <button
          type="button"
          aria-label={`Delete ${palette.name} scheme`}
          title="Delete scheme"
          onClick={onDelete}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-100 transition-opacity outline-none hover:bg-black/80 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-[rgba(139,122,244,0.36)] lg:opacity-0 lg:group-hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="hidden text-xs font-bold uppercase tracking-wider text-[var(--tr-text)] lg:block">
      {children}
    </h2>
  );
}

export function PaletteSidebar({
  config,
  onSelect,
  savedSchemes,
  onDeleteScheme,
  header,
}: {
  config: RecapConfig;
  onSelect: (scheme: Palette) => void;
  savedSchemes: SavedScheme[];
  onDeleteScheme: (id: string) => void;
  header: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-[var(--tr-panel)]">
      <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[var(--tr-border)] px-4">
        {header}
      </div>
      {/* On mobile both sections flow into one horizontal strip (headings
          hidden); on desktop they stack vertically with headings. */}
      <div className="flex gap-3 overflow-x-auto p-4 lg:flex-1 lg:flex-col lg:gap-6 lg:overflow-y-auto lg:overflow-x-hidden">
        <div
          role="listbox"
          aria-label="My schemes"
          className="contents lg:flex lg:flex-col lg:gap-4"
        >
          <SectionHeading>My Schemes</SectionHeading>
          {savedSchemes.length === 0
            ? (
              <p className="hidden text-xs font-semibold leading-relaxed text-[var(--tr-label)] lg:block">
                Save colors from the Color panel to keep them here.
              </p>
            )
            : savedSchemes.map((scheme) => (
              <PaletteCard
                key={scheme.id}
                palette={scheme}
                config={config}
                onSelect={onSelect}
                onDelete={() => onDeleteScheme(scheme.id)}
              />
            ))}
        </div>
        <div
          role="listbox"
          aria-label="Preset palettes"
          className="contents lg:flex lg:flex-col lg:gap-4"
        >
          <SectionHeading>Presets</SectionHeading>
          {PALETTES.map((palette) => (
            <PaletteCard
              key={palette.name}
              palette={palette}
              config={config}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
