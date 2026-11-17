// Shared undo machinery for the dashboard stores. A store's data is a set of
// collections (arrays of records with an `id`). Each action produces a
// Change; `applyChange` returns the next data plus an UndoEntry holding the
// exact previous versions, and `revertEntry` puts them back.
import type { ActionResult, RuleResult } from "@/lib/types";

type WithId = { id: string };
export type CollectionData = { [key: string]: unknown };

export type Change = {
  /** Records to replace (matched by id), per collection. */
  updated?: Record<string, object[]>;
  /** New records to append, per collection. */
  created?: Record<string, object[]>;
  /** Ids to delete, per collection. */
  deleted?: Record<string, string[]>;
  /** Plain (non-collection) fields to set, e.g. settings. */
  fields?: Record<string, unknown>;
};

export type UndoEntry = {
  id: string;
  label: string;
  at: string;
  before: Record<string, WithId[]>;
  createdIds: Record<string, string[]>;
  fieldsBefore: Record<string, unknown>;
};

export const newId = () => `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export const nowIso = () => new Date().toISOString();
export const fail = (r: RuleResult): ActionResult =>
  r.ok ? { ok: false, reason: "Something went wrong." } : { ok: false, reason: r.reason };

const list = (data: CollectionData, key: string) => (data[key] as WithId[] | undefined) ?? [];

export function applyChange<D extends CollectionData>(
  data: D,
  label: string,
  change: Change,
): { next: D; entry: UndoEntry } {
  const next: CollectionData = { ...data };
  const before: Record<string, WithId[]> = {};
  const createdIds: Record<string, string[]> = {};
  const fieldsBefore: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(change.updated ?? {})) {
    const recs = raw as WithId[];
    const ids = new Set(recs.map((r) => r.id));
    before[key] = [...(before[key] ?? []), ...list(data, key).filter((r) => ids.has(r.id))];
    const map = new Map(recs.map((r) => [r.id, r]));
    next[key] = list(next, key).map((r) => map.get(r.id) ?? r);
  }
  for (const [key, ids] of Object.entries(change.deleted ?? {})) {
    const set = new Set(ids);
    before[key] = [...(before[key] ?? []), ...list(data, key).filter((r) => set.has(r.id))];
    next[key] = list(next, key).filter((r) => !set.has(r.id));
  }
  for (const [key, raw] of Object.entries(change.created ?? {})) {
    const recs = raw as WithId[];
    createdIds[key] = recs.map((r) => r.id);
    next[key] = [...list(next, key), ...recs];
  }
  for (const [key, value] of Object.entries(change.fields ?? {})) {
    fieldsBefore[key] = data[key];
    next[key] = value;
  }
  return {
    next: next as D,
    entry: { id: newId(), label, at: nowIso(), before, createdIds, fieldsBefore },
  };
}

export function revertEntry<D extends CollectionData>(data: D, entry: UndoEntry): D {
  const next: CollectionData = { ...data };
  for (const [key, ids] of Object.entries(entry.createdIds)) {
    const set = new Set(ids);
    next[key] = list(next, key).filter((r) => !set.has(r.id));
  }
  for (const [key, recs] of Object.entries(entry.before)) {
    const present = new Set(list(next, key).map((r) => r.id));
    const map = new Map(recs.map((r) => [r.id, r]));
    next[key] = [
      ...list(next, key).map((r) => map.get(r.id) ?? r),
      ...recs.filter((r) => !present.has(r.id)), // deleted records come back
    ];
  }
  for (const [key, value] of Object.entries(entry.fieldsBefore)) next[key] = value;
  return next as D;
}

export const MAX_UNDO = 50;

/** Commit + undo helpers for a store whose state is { data, undoStack }. */
export function storeKit<D extends CollectionData>(
  get: () => { data: D | null; undoStack: UndoEntry[] },
  set: (partial: { data?: D | null; undoStack?: UndoEntry[] }) => void,
) {
  return {
    commit(label: string, change: Change): string {
      const { next, entry } = applyChange(get().data!, label, change);
      set({ data: next, undoStack: [...get().undoStack, entry].slice(-MAX_UNDO) });
      return entry.id;
    },
    undo(undoId: string): boolean {
      const entry = get().undoStack.find((e) => e.id === undoId);
      const data = get().data;
      if (!entry || !data) return false;
      set({
        data: revertEntry(data, entry),
        undoStack: get().undoStack.filter((e) => e.id !== undoId),
      });
      return true;
    },
  };
}
