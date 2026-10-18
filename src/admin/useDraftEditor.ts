"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PathBundle } from "@/domain/types";
import { useApp } from "@/state/AppState";
import { workingCopy } from "./helpers";

/** Local, unsaved edits on top of a path's working copy, with explicit save. */
export function useDraftEditor(pathId: string) {
  const { state, dispatch } = useApp();
  const entry = state.catalog.entries[pathId];
  const base = useMemo(() => (entry ? workingCopy(entry) : undefined), [entry]);
  // Local edits exist only while dirty; otherwise the form IS the stored working copy.
  const [local, setLocal] = useState<PathBundle | undefined>();
  const dirty = local !== undefined;
  const form = local ?? base;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = useCallback(
    (fn: (b: PathBundle) => PathBundle) => setLocal((cur) => {
      const from = cur ?? base;
      return from ? fn(structuredClone(from)) : cur;
    }),
    [base],
  );

  const save = useCallback(() => {
    if (!form) return;
    dispatch({ type: "catalog/saveDraft", pathId, bundle: form, now: new Date().toISOString() });
    setLocal(undefined);
  }, [dispatch, form, pathId]);

  const revert = useCallback(() => setLocal(undefined), []);

  return { entry, form, update, dirty, save, revert };
}
