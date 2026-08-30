import { describe, expect, it } from "vitest";
import { GOALS } from "@/lib/goals";
import { INDEXABLE_ROUTES, ROUTES, getRouteById, getRouteByPath } from "@/lib/routeRegistry";
import { generateCapabilityToken, parseManageFragment, redactSecret, stripManageFragment } from "@/lib/resourceAccess";
import { TASK_LIFECYCLE_STATES, isActiveTaskState, isResultTaskState } from "@/lib/taskLifecycle";

describe("Goal-First contracts", () => {
  it("keeps exactly six actionable goals mapped to real routes", () => {
    expect(GOALS).toHaveLength(6);
    for (const goal of GOALS) {
      expect(getRouteByPath(goal.destination)?.id).toBeTruthy();
      for (const relatedId of goal.relatedRouteIds) expect(getRouteById(relatedId)).toBeTruthy();
    }
  });

  it("keeps route ids, paths, and related links internally consistent", () => {
    expect(new Set(ROUTES.map((route) => route.id)).size).toBe(ROUTES.length);
    expect(new Set(ROUTES.map((route) => route.path)).size).toBe(ROUTES.length);
    expect(INDEXABLE_ROUTES.map((route) => String(route.id))).not.toContain("progress");
    for (const route of ROUTES) {
      for (const relatedId of route.relatedRouteIds) expect(getRouteById(relatedId)).toBeTruthy();
    }
  });

  it("accepts only high-entropy management fragments and can strip them", () => {
    const token = generateCapabilityToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(parseManageFragment(`#manage=${token}&keep=1`)).toBe(token);
    expect(parseManageFragment("#manage=too-short")).toBeNull();
    expect(stripManageFragment(`#keep=1&manage=${token}`)).toBe("#keep=1");
    expect(redactSecret(token)).toBe(`${token.slice(0, 4)}…${token.slice(-4)}`);
  });

  it("defines the task states needed for ad and result boundaries", () => {
    expect(TASK_LIFECYCLE_STATES).toEqual(["idle", "configuring", "ready", "active", "completing", "result"]);
    expect(isActiveTaskState("active")).toBe(true);
    expect(isActiveTaskState("completing")).toBe(true);
    expect(isActiveTaskState("result")).toBe(false);
    expect(isResultTaskState("result")).toBe(true);
  });
});
