"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/* ─── Page Transition Wrapper ─── */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Scroll Reveal ─── */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const directionMap = {
    up: { y: 30, x: 0 },
    left: { y: 0, x: -30 },
    right: { y: 0, x: 30 },
    scale: { y: 0, x: 0 },
  };

  const d = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: d.y, x: d.x, scale: direction === "scale" ? 0.95 : 1 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, x: 0, scale: 1 }
          : { opacity: 0, y: d.y, x: d.x, scale: direction === "scale" ? 0.95 : 1 }
      }
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stagger Container ─── */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ─── Animated Counter (count-up) ─── */
export function AnimatedCounter({
  value,
  className,
  duration = 1.2,
  prefix = "",
  suffix = "",
}: {
  value: number;
  className?: string;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* ─── Glass Card (animated) ─── */
export function GlassCard({
  children,
  className,
  depth = 2,
  hover = true,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  depth?: 1 | 2 | 3;
  hover?: boolean;
  delay?: number;
}) {
  const depthClass = depth === 1 ? "glass-1" : depth === 2 ? "glass-2" : "glass-3";
  return (
    <motion.div
      className={cn(depthClass, "rounded-2xl", hover && "glass-hover", className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Glow Text ─── */
export function GlowText({
  children,
  className,
  color = "blue",
}: {
  children: ReactNode;
  className?: string;
  color?: "blue" | "red" | "green" | "cyan" | "amber";
}) {
  const colorMap = {
    blue: "neon-blue",
    red: "neon-red",
    green: "neon-green",
    cyan: "neon-cyan",
    amber: "neon-amber",
  };
  return <span className={cn(colorMap[color], className)}>{children}</span>;
}

/* ─── Skeleton Loading ─── */
export function SkeletonGlass({
  className,
  count = 1,
}: {
  className?: string;
  count?: number;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-4 w-full rounded-lg" />
      ))}
    </div>
  );
}

/* ─── Ripple Button ─── */
export function RippleButton({
  children,
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    onClick?.(e);
  }

  return (
    <button ref={ref} className={cn("ripple-effect", className)} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
