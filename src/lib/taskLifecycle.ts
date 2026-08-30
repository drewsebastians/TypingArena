export type TaskLifecycle = "idle" | "configuring" | "ready" | "active" | "completing" | "result";

export const TASK_LIFECYCLE_STATES: readonly TaskLifecycle[] = [
  "idle",
  "configuring",
  "ready",
  "active",
  "completing",
  "result",
];

export function isActiveTaskState(state: TaskLifecycle): boolean {
  return state === "active" || state === "completing";
}

export function isResultTaskState(state: TaskLifecycle): boolean {
  return state === "result";
}
