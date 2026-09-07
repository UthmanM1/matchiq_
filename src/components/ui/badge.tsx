import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Variant = "default" | "outline" | "success" | "warning" | "danger" | "info" | "muted";

const variants: Record<Variant, string> = {
  default: "bg-slate-900 text-white",
  outline: "border border-slate-300 text-slate-700 bg-white",
  success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  warning: "bg-amber-100 text-amber-800 border border-amber-200",
  danger: "bg-rose-100 text-rose-800 border border-rose-200",
  info: "bg-sky-100 text-sky-800 border border-sky-200",
  muted: "bg-slate-100 text-slate-600 border border-slate-200",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-tight",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
