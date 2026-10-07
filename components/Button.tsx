import { concatClassNames } from "@/components/utils/classNames.ts";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "accent" | "muted" | "danger" | "icon";
};

const base =
  "inline-flex items-center justify-center rounded-lg text-sm font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(139,122,244,0.36)] disabled:cursor-not-allowed disabled:opacity-40";

const variants = {
  accent: "h-9 px-4 bg-[#715DF2] text-white hover:bg-[#8B7AF4]",
  danger: "h-9 px-4 bg-[#dc2626] text-white hover:bg-[#ef4444]",
  muted:
    "h-9 px-4 bg-[var(--tr-control)] text-[var(--tr-text)] hover:bg-[var(--tr-control-hover)]",
  icon:
    "h-9 w-9 shrink-0 bg-[var(--tr-control)] text-[var(--tr-label)] hover:bg-[var(--tr-control-hover)] hover:text-[var(--tr-text)]",
};

export function Button({
  variant = "muted",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={concatClassNames(base, variants[variant], className)}
      {...props}
    />
  );
}
