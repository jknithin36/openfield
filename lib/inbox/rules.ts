import type { Message, RuleResult } from "@/lib/types";

const OK: RuleResult = { ok: true };
const no = (reason: string): RuleResult => ({ ok: false, reason });

export const canReply = (m: Message, body: string): RuleResult =>
  !body.trim()
    ? no("Write your reply")
    : m.status === "resolved"
      ? no("Reopen the message before replying.")
      : OK;
export const canAddNote = (body: string): RuleResult => (body.trim() ? OK : no("Write the note"));
export const canAssign = (m: Message): RuleResult =>
  m.status === "resolved" ? no("Reopen the message first.") : OK;
export const canMarkWaiting = (m: Message): RuleResult =>
  m.status === "resolved"
    ? no("Reopen the message first.")
    : m.status === "waiting-on-them"
      ? no("Already waiting on them.")
      : OK;
export const canResolve = (m: Message): RuleResult =>
  m.status === "resolved" ? no("Already resolved.") : OK;
export const canReopen = (m: Message): RuleResult =>
  m.status === "resolved" ? OK : no("This message is still open.");
