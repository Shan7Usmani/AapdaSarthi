import * as React from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/types";

const sevClasses: Record<Severity | string, string> = {
  CRITICAL: "sev-critical",
  HIGH: "sev-high",
  MODERATE: "sev-moderate",
  LOW: "sev-low",
};

export function Badge({
  className,
  severity,
  children,
}: {
  className?: string;
  severity?: Severity;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider",
        severity ? sevClasses[severity] : "bg-panel-2 border border-border-strong text-muted",
        className
      )}
    >
      {children}
    </span>
  );
}
