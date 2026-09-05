import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("panel-glow rounded-xl bg-panel border border-border", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5 border-b border-border", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm font-semibold text-foreground", className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-3", className)}>{children}</div>;
}
