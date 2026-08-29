import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const severityOrder: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MODERATE: 2,
  LOW: 1,
};

export function sortBySeverity<T extends { severity: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
}

export function formatNum(n: number): string {
  return n.toLocaleString("en-IN");
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
