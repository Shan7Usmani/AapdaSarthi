import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "ghost" | "outline" | "danger" | "cyan";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  default: "bg-panel border border-border-strong text-foreground hover:border-cyan/60 hover:text-cyan",
  primary: "bg-cyan text-white font-semibold hover:bg-cyan/90 shadow-[0_2px_12px_-2px_rgba(2,132,199,0.5)]",
  ghost: "text-muted hover:text-foreground hover:bg-panel-2",
  outline: "border border-border-strong bg-panel text-foreground hover:border-cyan/60 hover:text-cyan",
  danger: "bg-danger/10 border border-danger/40 text-danger hover:bg-danger/20",
  cyan: "border border-cyan/40 bg-cyan/5 text-cyan hover:bg-cyan/10",
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
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
