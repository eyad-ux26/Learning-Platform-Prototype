/**
 * Persistence boundary. Screens never touch localStorage directly; they go
 * through this interface, so it can be replaced by an API client later.
 */
import { createInitialState, isValidState, SEED_FINGERPRINT, type PrototypeState } from "./state";

export type LoadStatus = "fresh" | "restored" | "recovered-invalid" | "content-refreshed" | "unavailable";

export interface PrototypeRepository {
  load(): { state: PrototypeState; status: LoadStatus };
  save(state: PrototypeState): void;
  clear(): void;
}

const KEY = "skillbench.prototype.v1";
const BACKUP_KEY = "skillbench.prototype.invalid-backup";

export function createLocalStorageRepository(storage: Storage | undefined = typeof window !== "undefined" ? window.localStorage : undefined): PrototypeRepository {
  return {
    load() {
      if (!storage) return { state: createInitialState(), status: "unavailable" };
      let raw: string | null = null;
      try {
        raw = storage.getItem(KEY);
      } catch {
        return { state: createInitialState(), status: "unavailable" };
      }
      if (!raw) return { state: createInitialState(), status: "fresh" };
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!isValidState(parsed)) throw new Error("invalid");
        if (parsed.seedFingerprint !== SEED_FINGERPRINT) {
          // Seed content changed during development: keep nothing that could reference missing content.
          return { state: createInitialState(), status: "content-refreshed" };
        }
        return { state: parsed, status: "restored" };
      } catch {
        try {
          storage.setItem(BACKUP_KEY, raw);
        } catch {
          /* ignore */
        }
        return { state: createInitialState(), status: "recovered-invalid" };
      }
    },
    save(state) {
      if (!storage) return;
      try {
        storage.setItem(KEY, JSON.stringify(state));
      } catch {
        /* Storage full or blocked: the prototype keeps working in memory. */
      }
    },
    clear() {
      try {
        storage?.removeItem(KEY);
      } catch {
        /* ignore */
      }
    },
  };
}

export function createMemoryRepository(initial?: PrototypeState): PrototypeRepository {
  let current = initial;
  return {
    load: () => ({ state: current ?? createInitialState(), status: current ? "restored" : "fresh" }),
    save: (s) => {
      current = s;
    },
    clear: () => {
      current = undefined;
    },
  };
}
