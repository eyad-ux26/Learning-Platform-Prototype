"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/components/ui";

/**
 * Below lg the questions live in a dock under the interface. The dock can collapse to a summary so the interface gets the screen,
 * and its footer (Next / Decide / Submit) is always visible. From lg the same pieces simply stack as a normal column.
 */
export interface DockState {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  /** Submit the response (the mobile dock has no separate action bar). */
  submit?: () => void;
}

export const DockContext = createContext<DockState>({ collapsed: false, setCollapsed: () => {} });
export const useDock = () => useContext(DockContext);

export function DockLayout({ head, summary, body, foot, className }: { head?: ReactNode; summary?: ReactNode; body: ReactNode; foot?: ReactNode; className?: string }) {
  const { collapsed } = useDock();
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2.5 lg:block lg:space-y-4", className)}>
      {head}
      {summary && collapsed && <div className="lg:hidden">{summary}</div>}
      <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain max-lg:-mx-1 max-lg:px-1 lg:overflow-visible", collapsed && "hidden lg:block")}>{body}</div>
      {foot && <div className="flex-none">{foot}</div>}
    </div>
  );
}
