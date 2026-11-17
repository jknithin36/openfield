"use client";

import { toast } from "sonner";

import { undoAnywhere } from "@/lib/undo-registry";
import "@/store/register-undo";
import type { ActionResult } from "@/lib/types";
import { announce } from "@/components/dashboard/shared/announcer";

/**
 * Report a store action: toast + announcement. Successful actions get an
 * "Undo" button that restores the exact previous state. Toasts never take
 * focus. Returns true when the action succeeded.
 */
export function notifyResult(
  result: ActionResult,
  messages: { success: string; undone?: string; description?: string },
): boolean {
  if (!result.ok) {
    announce(result.reason);
    toast.error(result.reason);
    return false;
  }
  const { undoId } = result;
  announce(messages.success);
  toast(messages.success, {
    description: messages.description,
    action: {
      label: "Undo",
      onClick: () => {
        if (undoAnywhere(undoId)) announce(messages.undone ?? "Undone");
      },
    },
  });
  return true;
}
