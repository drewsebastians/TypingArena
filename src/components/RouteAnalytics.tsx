"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

/** Records privacy-safe route lifecycle events without collecting query data. */
export default function RouteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) track("route_viewed");
  }, [pathname]);

  return null;
}
