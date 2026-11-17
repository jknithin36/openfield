// Each store registers its undo function; a toast's "Undo" asks them in turn.
// A combined id ("a|b|c") undoes several store changes at once, newest first.
type UndoFn = (undoId: string) => boolean;
const fns: UndoFn[] = [];

export function registerUndo(fn: UndoFn): void {
  fns.push(fn);
}

export function undoAnywhere(undoId: string): boolean {
  const ids = undoId.split("|").filter(Boolean).reverse();
  return ids.map((id) => fns.some((fn) => fn(id))).some(Boolean);
}
