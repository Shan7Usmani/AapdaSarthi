"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </MotionConfig>
  );
}