"use client";

import { create } from "zustand";

// One polite live region for the whole dashboard. Call `announce()` after
// any action; screen readers read it without moving focus.
type AnnouncerState = { message: string; nonce: number };

const useAnnouncerStore = create<AnnouncerState>(() => ({ message: "", nonce: 0 }));

export function announce(message: string): void {
  // The nonce makes repeated identical messages re-render (and re-announce).
  useAnnouncerStore.setState((s) => ({ message, nonce: s.nonce + 1 }));
}

export function Announcer() {
  const { message, nonce } = useAnnouncerStore();
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      <span key={nonce}>{message}</span>
    </div>
  );
}
