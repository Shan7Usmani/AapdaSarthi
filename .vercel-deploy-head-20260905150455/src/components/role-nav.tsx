"use client";

import Link from "next/link";
import { ArrowLeft, Siren, ShieldAlert, Activity, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/citizen", label: "Citizen", icon: Siren },
  { href: "/rescuer", label: "Rescuer", icon: ShieldAlert },
  { href: "/hq", label: "HQ", icon: Activity },
];

export function RoleNav({ active }: { active: "citizen" | "rescuer" | "hq" }) {
  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-cyan cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="mx-1 h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan text-white shadow-sm">
            <Waves className="h-4 w-4" />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {active} console
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer",
                  active === l.href.replace("/", "")
                    ? "border-cyan bg-cyan/10 text-cyan"
                    : "border-slate-200 bg-white text-slate-500 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
