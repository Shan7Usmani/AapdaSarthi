import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "ghost" | "outline" | "danger" | "cyan";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  default:
    "glass-1 text-foreground hover:border-[rgba(0,180,216,0.35)] hover:text-[#00b4d8] hover:shadow-[0_0_16px_rgba(0,180,216,0.12)]",
  primary:
    "bg-gradient-to-r from-[#00b4d8] to-[#0096b7] text-white font-semibold shadow-[0_2px_16px_-2px_rgba(0,180,216,0.5)] hover:shadow-[0_4px_24px_-2px_rgba(0,180,216,0.6)] hover:from-[#00c4e8] hover:to-[#00b4d8]",
  ghost:
    "text-muted hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]",
  outline:
    "glass-1 text-foreground hover:border-[rgba(0,180,216,0.35)] hover:text-[#00b4d8]",
  danger:
    "bg-[rgba(255,59,92,0.12)] border border-[rgba(255,59,92,0.4)] text-[#ff6b8a] hover:bg-[rgba(255,59,92,0.2)] hover:shadow-[0_0_16px_rgba(255,59,92,0.15)]",
  cyan:
    "border border-[rgba(0,180,216,0.35)] bg-[rgba(0,180,216,0.08)] text-[#00b4d8] hover:bg-[rgba(0,180,216,0.15)] hover:shadow-[0_0_16px_rgba(0,180,216,0.12)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-9 w-9 justify-center",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,180,216,0.5)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
