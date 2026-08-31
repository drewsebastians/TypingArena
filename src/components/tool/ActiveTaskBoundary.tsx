"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { TaskLifecycle } from "@/lib/taskLifecycle";
import { isActiveTaskState } from "@/lib/taskLifecycle";

const ActiveTaskContext = createContext(false);

export function useActiveTask(): boolean {
  return useContext(ActiveTaskContext);
}

export default function ActiveTaskBoundary({
  active,
  state,
  children,
  className = "",
}: {
  active?: boolean;
  state?: TaskLifecycle;
  children: ReactNode;
  className?: string;
}) {
  const isActive = active ?? (state ? isActiveTaskState(state) : false);

  useEffect(() => {
    if (isActive) document.documentElement.setAttribute("data-exercise-active", "");
    return () => {
      // An engine may own the attribute while this boundary is being
      // replaced. Removing it here is safe because the next engine effect
      // reapplies it when needed.
      if (isActive) document.documentElement.removeAttribute("data-exercise-active");
    };
  }, [isActive]);

  return (
    <ActiveTaskContext.Provider value={isActive}>
      <div data-task-state={state ?? (isActive ? "active" : "idle")} className={className}>
        {children}
      </div>
    </ActiveTaskContext.Provider>
  );
}
