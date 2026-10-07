"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button.tsx";
import { concatClassNames } from "@/components/utils/classNames.ts";
import {
  CUSTOM_SIZE_ID,
  type Effects,
  MAX_SIZE,
  MIN_SIZE,
  type RecapConfig,
  type RecapPoint,
  SIZE_PRESETS,
} from "../lib/config.ts";
import { mixHex } from "../lib/effects.ts";

const PRESET_GROUPS = Array.from(new Set(SIZE_PRESETS.map((p) => p.group)));

const inputClass =
  "h-9 w-full min-w-0 rounded-lg border-0 bg-[var(--tr-control)] px-3 text-sm font-semibold text-[var(--tr-text)] placeholder:text-[var(--tr-faint)] outline-none focus:ring-[3px] focus:ring-[rgba(139,122,244,0.36)]";

/**
 * Number input that keeps its own text so intermediate states like "-" or ""
 * can be typed without being coerced to 0 mid-edit. ArrowUp/ArrowDown step the
 * value by 1 (or 10 with Shift), clamped to `min`/`max` when given.
 */
function NumberInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  min = -Infinity,
  max = Infinity,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  ariaLabel: string;
  min?: number;
  max?: number;
}) {
  const [text, setText] = useState(value === undefined ? "" : String(value));

  useEffect(() => {
    const parsed = text.trim() === "" ? undefined : Number(text);
    if (parsed !== value) {
      setText(value === undefined ? "" : String(value));
    }
    // Only resync when the external value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      className={inputClass}
      value={text}
      placeholder={placeholder}
      // Snap back to the committed value if the text was rejected
      onBlur={() => setText(value === undefined ? "" : String(value))}
      onKeyDown={(e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1);
        const current = Number.isFinite(Number(text)) ? Number(text) : value ?? 0;
        // Round away float noise from decimal values (e.g. 0.1 + 1)
        const next = Math.min(
          max,
          Math.max(min, Math.round((current + step) * 1e6) / 1e6),
        );
        setText(String(next));
        onChange(next);
      }}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        if (next.trim() === "") {
          onChange(undefined);
          return;
        }
        const n = Number(next);
        if (Number.isFinite(n)) {
          onChange(n);
        }
      }}
    />
  );
}

/** Swatch + hex text field, like haikei's color rows. */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [hex, setHex] = useState(value.replace("#", ""));

  useEffect(() => {
    setHex(value.replace("#", ""));
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-[var(--tr-label)]">{label}</span>
      <div className="flex items-center gap-2">
        <label
          className="relative h-9 w-9 shrink-0 cursor-pointer rounded-lg border-2 border-[var(--tr-swatch-border)] focus-within:ring-[3px] focus-within:ring-[rgba(139,122,244,0.36)]"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            aria-label={`${label} color picker`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--tr-faint)]">
            #
          </span>
          <input
            aria-label={`${label} hex`}
            className={concatClassNames(inputClass, "pl-7 uppercase")}
            value={hex}
            maxLength={7}
            spellCheck={false}
            onBlur={() => setHex(value.replace("#", ""))}
            onChange={(e) => {
              const next = e.target.value.replace("#", "");
              setHex(next);
              if (/^[0-9a-f]{6}$/i.test(next)) {
                onChange(`#${next.toLowerCase()}`);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-semibold text-[var(--tr-label)]">{children}</span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

/** Collapsible sidebar section with an uppercase header and chevron. */
function Section({
  title,
  children,
  collapsible = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="border-b border-[var(--tr-border)] px-4 py-5">
      {collapsible
        ? (
          <button
            type="button"
            aria-expanded={open}
            className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--tr-text)] outline-none"
            onClick={() => setOpen((o) => !o)}
          >
            {title}
            <Chevron className={open ? "" : "rotate-180"} />
          </button>
        )
        : (
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--tr-text)]">
            {title}
          </h2>
        )}
      {open && <div className="mt-4 flex flex-col gap-4">{children}</div>}
    </section>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={concatClassNames("h-4 w-4 transition-transform", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 10l4-4 4 4" />
    </svg>
  );
}

/** Pill-style two-or-more option toggle, like haikei's Style/Interpolation. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex gap-1 rounded-lg bg-[var(--tr-control)] p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={concatClassNames(
            "h-8 flex-1 rounded-md text-sm font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(139,122,244,0.36)]",
            value === o.value
              ? "bg-[var(--tr-control-active)] text-[var(--tr-text)] shadow-sm"
              : "text-[var(--tr-faint)] hover:text-[var(--tr-text)]",
          )}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * A color with an optional gradient end. Switching to Solid and back restores
 * the last end color used; otherwise the end starts from `defaultEnd`.
 */
function GradientColorField({
  label,
  value,
  end,
  defaultEnd,
  onChange,
  onEndChange,
}: {
  label: string;
  value: string;
  end: string | undefined;
  defaultEnd: string;
  onChange: (value: string) => void;
  onEndChange: (end: string | undefined) => void;
}) {
  const [lastEnd, setLastEnd] = useState(end);

  useEffect(() => {
    if (end) setLastEnd(end);
  }, [end]);

  return (
    <div className="flex flex-col gap-3">
      <ColorField label={label} value={value} onChange={onChange} />
      <Segmented
        ariaLabel={`${label} fill`}
        value={end ? "gradient" : "solid"}
        options={[
          { value: "solid", label: "Solid" },
          { value: "gradient", label: "Gradient" },
        ]}
        onChange={(v) =>
          onEndChange(v === "gradient" ? lastEnd ?? defaultEnd : undefined)}
      />
      {end && (
        <ColorField label={`${label} end`} value={end} onChange={onEndChange} />
      )}
    </div>
  );
}

/** "Save scheme" button that expands into a name field + Save/Cancel. */
function SaveSchemeForm({
  isSaved,
  defaultName,
  onSave,
}: {
  isSaved: boolean;
  defaultName: string;
  onSave: (name: string) => void;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  if (!naming) {
    return (
      <Button
        variant="muted"
        className="w-full"
        disabled={isSaved}
        onClick={() => {
          setName(defaultName);
          setNaming(true);
        }}
      >
        {isSaved ? "Saved to My Schemes" : "Save scheme"}
      </Button>
    );
  }

  const submit = () => {
    onSave(name.trim() || defaultName);
    setNaming(false);
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Field label="Scheme name">
        <input
          autoFocus
          className={inputClass}
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setNaming(false);
          }}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="accent" type="submit">
          Save
        </Button>
        <Button variant="muted" onClick={() => setNaming(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function ConfigPanel({
  config,
  onChange,
  onReset,
  onDownload,
  onSaveScheme,
  isSchemeSaved,
  nextSchemeName,
}: {
  config: RecapConfig;
  onChange: (config: RecapConfig) => void;
  onReset: () => void;
  onDownload: () => void;
  onSaveScheme: (name: string) => void;
  isSchemeSaved: boolean;
  nextSchemeName: string;
}) {
  const set = <K extends keyof RecapConfig>(key: K, value: RecapConfig[K]) =>
    onChange({ ...config, [key]: value });

  // Unset effects are left out entirely (not stored as undefined) so a
  // scheme matches a preset that never set them
  const setEffect = <K extends keyof Effects>(key: K, value: Effects[K]) => {
    const effects = { ...config.effects };
    if (value === undefined) delete effects[key];
    else effects[key] = value;
    set("effects", effects);
  };

  const setColor = (key: keyof RecapConfig["colors"], value: string) =>
    set("colors", { ...config.colors, [key]: value });

  const setPoint = (i: number, patch: Partial<RecapPoint>) =>
    set(
      "points",
      config.points.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    );

  const movePoint = (from: number, to: number) => {
    if (from === to || to < 0 || to >= config.points.length) return;
    const points = [...config.points];
    const [moved] = points.splice(from, 1);
    points.splice(to, 0, moved);
    set("points", points);
  };

  // Drag-to-reorder via pointer events (works for mouse and touch). Rows
  // reorder live as the pointer crosses them.
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const rowIndexAt = (clientY: number) => {
    const rows = rowRefs.current.slice(0, config.points.length);
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i]?.getBoundingClientRect();
      if (rect && clientY < rect.bottom) return i;
    }
    return rows.length - 1;
  };

  const onHandlePointerMove = (e: React.PointerEvent) => {
    if (dragIndex === null) return;
    const target = rowIndexAt(e.clientY);
    if (target !== dragIndex) {
      movePoint(dragIndex, target);
      setDragIndex(target);
    }
  };

  const removePoint = (i: number) =>
    set("points", config.points.filter((_, j) => j !== i));

  const addPoint = () =>
    set("points", [...config.points, { label: "", value: 0 }]);

  const selectPreset = (id: string) => {
    const preset = SIZE_PRESETS.find((p) => p.id === id);
    set(
      "size",
      preset
        ? { preset: preset.id, width: preset.width, height: preset.height }
        : { ...config.size, preset: CUSTOM_SIZE_ID },
    );
  };

  // Editing a dimension by hand switches to "Custom". Out-of-range values are
  // ignored until they're valid so typing "1" on the way to "1080" is fine.
  const setDimension = (key: "width" | "height", value: number | undefined) => {
    if (value === undefined) return;
    const n = Math.round(value);
    if (n < MIN_SIZE || n > MAX_SIZE) return;
    set("size", { ...config.size, preset: CUSTOM_SIZE_ID, [key]: n });
  };

  const activePreset = SIZE_PRESETS.find((p) => p.id === config.size.preset);

  return (
    <div className="flex h-full flex-col bg-[var(--tr-panel)] text-[var(--tr-text)]">
      <div className="flex-1 lg:overflow-y-auto">
        <Section title="Canvas" collapsible={false}>
          {/* Card that shows the current size; a transparent native select on
              top handles picking (keeps keyboard + mobile pickers for free). */}
          <div className="relative rounded-lg bg-[var(--tr-control)] px-4 py-3 transition-colors hover:bg-[var(--tr-control-hover)] focus-within:ring-[3px] focus-within:ring-[rgba(139,122,244,0.36)]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">
                  {activePreset
                    ? `${activePreset.group} · ${activePreset.label}`
                    : "Custom"}
                </div>
                <div className="text-xs font-semibold text-[var(--tr-label)]">
                  {config.size.width} x {config.size.height}
                </div>
              </div>
              <Chevron className="rotate-90 text-[var(--tr-label)]" />
            </div>
            <select
              aria-label="Canvas size preset"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              value={config.size.preset}
              onChange={(e) => selectPreset(e.target.value)}
            >
              {PRESET_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {SIZE_PRESETS.filter((p) => p.group === group).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} — {p.width}×{p.height}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value={CUSTOM_SIZE_ID}>Custom</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Width">
              <NumberInput
                ariaLabel="Width in pixels"
                value={config.size.width}
                min={MIN_SIZE}
                max={MAX_SIZE}
                onChange={(v) => setDimension("width", v)}
              />
            </Field>
            <Field label="Height">
              <NumberInput
                ariaLabel="Height in pixels"
                value={config.size.height}
                min={MIN_SIZE}
                max={MAX_SIZE}
                onChange={(v) => setDimension("height", v)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Text">
          <Field label="Title">
            <input
              className={inputClass}
              value={config.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          <Field label="Subtitle">
            <input
              className={inputClass}
              value={config.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
            />
          </Field>
          <Field label="Unit">
            <input
              className={inputClass}
              value={config.unit}
              onChange={(e) => set("unit", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Plot points">
          <div className="flex flex-col gap-2">
            {config.points.map((p, i) => (
              <div
                key={i}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                className={concatClassNames(
                  "flex items-center gap-2 rounded-lg transition-shadow",
                  dragIndex === i &&
                    "bg-[var(--tr-control-hover)] shadow-lg shadow-black/20 ring-1 ring-[var(--tr-border)]",
                )}
              >
                <button
                  type="button"
                  aria-label={`Reorder point ${i + 1} (drag, or use arrow keys)`}
                  className={concatClassNames(
                    "shrink-0 touch-none select-none rounded px-1 text-lg leading-none text-[var(--tr-faint)] hover:text-[var(--tr-text)] outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(139,122,244,0.36)]",
                    dragIndex === i ? "cursor-grabbing" : "cursor-grab",
                  )}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDragIndex(i);
                  }}
                  onPointerMove={onHandlePointerMove}
                  onPointerUp={() => setDragIndex(null)}
                  onPointerCancel={() => setDragIndex(null)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                      const to = i + (e.key === "ArrowUp" ? -1 : 1);
                      movePoint(i, to);
                      rowRefs.current[to]?.querySelector("button")?.focus();
                    }
                  }}
                >
                  ⠿
                </button>
                <input
                  aria-label={`Label for point ${i + 1}`}
                  className={inputClass}
                  value={p.label}
                  placeholder="Label"
                  onChange={(e) => setPoint(i, { label: e.target.value })}
                />
                <NumberInput
                  ariaLabel={`Value for point ${i + 1}`}
                  value={p.value}
                  onChange={(v) => setPoint(i, { value: v ?? 0 })}
                />
                <Button
                  variant="icon"
                  aria-label="Remove point"
                  disabled={config.points.length === 1}
                  onClick={() => removePoint(i)}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
          <Button variant="muted" className="w-full" onClick={addPoint}>
            + Add point
          </Button>
          <div className="flex flex-col gap-2">
            <Label>Line</Label>
            <Segmented
              ariaLabel="Line style"
              value={config.lineStyle}
              options={[
                { value: "straight", label: "Straight" },
                { value: "curved", label: "Curved" },
              ]}
              onChange={(v) => set("lineStyle", v)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Deltas</Label>
            <Segmented
              ariaLabel="Show deltas"
              value={config.showDeltas ? "show" : "hide"}
              options={[
                { value: "show", label: "Show" },
                { value: "hide", label: "Hide" },
              ]}
              onChange={(v) => set("showDeltas", v === "show")}
            />
          </div>
        </Section>

        <Section title="Color">
          <GradientColorField
            label="Background"
            value={config.colors.background}
            end={config.effects.backgroundTo}
            defaultEnd={mixHex(config.colors.background, config.colors.line, 0.25)}
            onChange={(v) => setColor("background", v)}
            onEndChange={(v) => setEffect("backgroundTo", v)}
          />
          <GradientColorField
            label="Line"
            value={config.colors.line}
            end={config.effects.lineTo}
            defaultEnd={mixHex(config.colors.line, config.colors.text, 0.5)}
            onChange={(v) => setColor("line", v)}
            onEndChange={(v) => setEffect("lineTo", v)}
          />
          <ColorField
            label="Text"
            value={config.colors.text}
            onChange={(v) => setColor("text", v)}
          />
          <SaveSchemeForm
            isSaved={isSchemeSaved}
            defaultName={nextSchemeName}
            onSave={onSaveScheme}
          />
        </Section>
      </div>

      <div className="border-t border-[var(--tr-border)] px-4 py-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--tr-text)]">
          Download
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="accent" onClick={onDownload}>
            PNG
          </Button>
          <Button variant="muted" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
