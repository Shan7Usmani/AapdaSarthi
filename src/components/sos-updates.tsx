"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import type { SosItem } from "@/store/sos-store";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Live ground-info thread on a single SOS/rescue. Any role with an in-progress
 * rescue can post an update; the full object (including `updates`) syncs
 * through the normal store -> Supabase upsert -> Realtime path, so the HQ board
 * and the rescuer's "My rescues" always reflect the latest field info.
 */
export function SosUpdates({
  sos,
  onPost,
  placeholder,
}: {
  sos: SosItem;
  onPost: (text: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const updates = sos.updates ?? [];
  const readOnly = sos.status === "delivered";

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border bg-panel-2/50 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
          Ground updates
        </span>
        {updates.length > 0 && (
          <span className="font-mono text-[8px] text-muted">{updates.length}</span>
        )}
      </div>

      {updates.length === 0 && (
        <p className="text-[11px] text-muted">No field updates posted yet.</p>
      )}

      {updates.map((u) => (
        <div key={u.id} className="flex items-start gap-1.5">
          <span
            className={cn(
              "mt-px shrink-0 rounded px-1 py-px font-mono text-[8px] uppercase tracking-wider",
              u.role === "hq"
                ? "border border-cyan/30 bg-cyan/10 text-cyan"
                : "border border-warn/30 bg-warn/10 text-warn"
            )}
          >
            {u.role}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] leading-snug text-foreground/90">{u.text}</p>
            <p className="font-mono text-[8px] text-muted">
              {u.by} · {timeAgo(u.at)}
            </p>
          </div>
        </div>
      ))}

      {!readOnly && (
        <div className="mt-0.5 flex gap-1.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) {
                onPost(text.trim());
                setText("");
              }
            }}
            placeholder={placeholder ?? "Update command centre on ground info…"}
            className="min-w-0 flex-1 rounded-md border border-border-strong bg-slate-50 px-2 py-1.5 text-[11px] text-foreground placeholder:text-muted/40 focus:border-cyan/60 focus:outline-none"
          />
          <Button
            variant="primary"
            size="sm"
            className="!h-6 !px-2.5 !text-[9px]"
            disabled={!text.trim()}
            onClick={() => {
              onPost(text.trim());
              setText("");
            }}
          >
            <Send className="h-2.5 w-2.5" /> Post
          </Button>
        </div>
      )}
    </div>
  );
}