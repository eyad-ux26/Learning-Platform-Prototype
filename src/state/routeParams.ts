"use client";

import { useParams } from "next/navigation";

/** Route params from the router, or explicit ones when rendered by the static-hosting fallback. */
export function useRouteParams<T extends Record<string, string>>(override?: Record<string, string>): T {
  const fromRouter = useParams();
  return (override ?? fromRouter) as T;
}
