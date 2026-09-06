"use client";

import Link from "next/link";
import { ArrowLeft, Siren, ShieldAlert, Activity, Waves, History, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const LINKS = [
  { href: "/citizen", label: "Citizen", icon: Siren, color: "text-[#ff3b5c]" },
  { href: "/rescuer", label: "Rescuer", icon: ShieldAlert, color: "text-[#ffb02e]" },
  { href: "/hq", label: "HQ", icon: Activity, color: "text-[#00b4d8]" },
];

export function RoleNav({ active }: { active: "citizen" | "rescuer" | "hq" | "risk" }) {
  return (
    <div className="sticky top-0 z-40 glass-1 border-b border-[rgba(255,255,255,0.07)]">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-muted transition-colors hover:text-[#00b4d8] hover:bg-[rgba(255,255,255,0.05)] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="mx-1 h-6 w-px bg-[rgba(255,255,255,0.08)]" />
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#00b4d8] to-[#0096b7] text-white shadow-[0_0_12px_rgba(0,180,216,0.3)]">
            <Waves className="h-4 w-4" />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
            {active} console
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {LINKS.map((l) => {
            const Icon = l.icon;
            const isActive = active === l.href.replace("/", "");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer",
                  isActive
                    ? "text-[#00b4d8]"
                    : "text-muted hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navPill"
                    className="absolute inset-0 rounded-lg bg-[rgba(0,180,216,0.12)] border border-[rgba(0,180,216,0.3)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className={cn("h-3.5 w-3.5 relative z-10", isActive && l.color)} />
                <span className="hidden sm:inline relative z-10">{l.label}</span>
              </Link>
            );
          })}
          <Link
            href="/risk"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer",
              active === "risk"
                ? "text-[#ffb02e]"
                : "text-muted hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]"
            )}
          >
            <Radar className={cn("h-3.5 w-3.5", active === "risk" && "text-[#ffb02e]")} />
            <span className="hidden sm:inline">Risk</span>
          </Link>
          <Link
            href="/logs"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-muted hover:text-foreground hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
          >
            <History className="h-3.5 w-3.5 text-[#ffb02e]" />
            <span className="hidden sm:inline">Logs</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
