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
  const [form, setFormState] = useState<PathBundle | undefined>(base);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setFormState(base);
  }, [base, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = useCallback((fn: (b: PathBundle) => PathBundle) => {
    setFormState((f) => (f ? fn(structuredClone(f)) : f));
    setDirty(true);
  }, []);

  const save = useCallback(() => {
    if (!form) return;
    dispatch({ type: "catalog/saveDraft", pathId, bundle: form, now: new Date().toISOString() });
    setDirty(false);
  }, [dispatch, form, pathId]);

  const revert = useCallback(() => {
    setFormState(base);
    setDirty(false);
  }, [base]);

  return { entry, form, update, dirty, save, revert };
}
