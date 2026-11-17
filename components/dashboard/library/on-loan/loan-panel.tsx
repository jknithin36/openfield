"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import type { LibraryData } from "@/lib/types";
import { dueWording, formatDay, plural } from "@/lib/format";
import { canExtend } from "@/lib/library/rules";
import { join, ROLE_LABEL } from "@/lib/library/views";
import { ItemIcon } from "@/components/dashboard/item-icon";
import { PanelFacts, PanelSection, RecordPanel } from "@/components/dashboard/shared/record-panel";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { ExtendForm } from "@/components/dashboard/library/on-loan/extend-form";
import { NoteConfirmForm } from "@/components/dashboard/library/on-loan/lost-form";
import { ReminderPreview } from "@/components/dashboard/library/on-loan/reminder-preview";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focus}`;

export type LoanAction =
  | { kind: "remind" }
  | { kind: "extend"; weeks: number }
  | { kind: "check-in" }
  | { kind: "lost"; note: string };

type Mode = "view" | "remind" | "extend" | "lost";

export function LoanPanel({
  data,
  id,
  now,
  returnFocusRef,
  onClose,
  onAction,
}: {
  data: LibraryData;
  id: string | null;
  now: Date;
  returnFocusRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onAction: (id: string, action: LoanAction) => boolean;
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [modeFor, setModeFor] = useState(id);
  if (modeFor !== id) {
    setModeFor(id);
    setMode("view");
  }

  const j = id
    ? join(
        data,
        data.requests.filter((r) => r.id === id && r.status === "on-loan"),
      )[0]
    : undefined;
  if (!j)
    return (
      <RecordPanel open={false} onClose={onClose} returnFocusRef={returnFocusRef} title="">
        {null}
      </RecordPanel>
    );

  const { request, item, contact } = j;
  const due = request.dueAt ? dueWording(request.dueAt, now) : null;
  const extend = canExtend(data, request);
  const act = (a: LoanAction) => {
    if (onAction(request.id, a)) setMode("view");
  };

  const extensionText =
    (request.extensionCount ?? 0) > 0
      ? `Extended by ${plural(Math.round((request.extendedBy ?? 0) / 7), "week", "weeks")}`
      : `${plural(item.maxExtensions, "extension", "extensions")} allowed`;

  return (
    <RecordPanel
      open
      recordKey={request.id}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      eyebrow={request.id}
      title={`${item.name} · ${contact.name}`}
      meta={
        due?.late ? (
          <StatusText tone="danger">{due.text.replace("late", "overdue")}</StatusText>
        ) : (
          <>Due {due?.text}</>
        )
      }
      actions={
        mode === "view" ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setMode("remind")}
                className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
              >
                Send reminder
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode("extend")}
                className={`h-11 px-4 ${focus}`}
              >
                Extend loan
              </Button>
              <Button
                variant="outline"
                onClick={() => act({ kind: "check-in" })}
                className={`h-11 px-4 ${focus}`}
              >
                Check in return
                <span className="sr-only">
                  : {item.name} from {contact.name}
                </span>
              </Button>
            </div>
            <Button
              variant="link"
              onClick={() => setMode("lost")}
              className={`h-11 w-fit px-0 text-red-700 underline underline-offset-4 ${focus}`}
            >
              Mark lost
            </Button>
          </div>
        ) : undefined
      }
    >
      {mode === "remind" && (
        <ReminderPreview
          request={request}
          item={item}
          contact={contact}
          now={now}
          onSend={() => act({ kind: "remind" })}
          onCancel={() => setMode("view")}
        />
      )}
      {mode === "extend" && request.dueAt && (
        <ExtendForm
          dueAt={request.dueAt}
          weeks={data.settings.extensionWeeks}
          allowed={extend}
          onSave={(weeks) => act({ kind: "extend", weeks })}
          onCancel={() => setMode("view")}
        />
      )}
      {mode === "lost" && (
        <section className="border-t border-border px-5 py-4">
          <h3 className="sr-only">Mark as lost</h3>
          <NoteConfirmForm
            id="lost-note"
            intro={
              <>
                Mark {item.name} as lost? This removes one copy from the catalog. You can undo it
                straight after.
              </>
            }
            label="What happened?"
            requiredMessage="Write a note about what happened"
            confirmLabel="Mark lost"
            onConfirm={(note) => act({ kind: "lost", note })}
            onCancel={() => setMode("view")}
          />
        </section>
      )}

      {mode === "view" && (
        <>
          <PanelSection title="Loan">
            <div className="mb-2 flex items-center gap-3">
              <ItemIcon item={item} />
              <Link href={`/dashboard/library/catalog/${item.id}`} className={link}>
                {item.name}
              </Link>
            </div>
            <PanelFacts
              facts={[
                [
                  "Sent",
                  request.shippedAt ? (
                    <time key="s" dateTime={request.shippedAt}>
                      {formatDay(request.shippedAt)}
                    </time>
                  ) : (
                    "—"
                  ),
                ],
                [
                  "Due",
                  request.dueAt ? (
                    <time key="d" dateTime={request.dueAt}>
                      {formatDay(request.dueAt)}
                    </time>
                  ) : (
                    "—"
                  ),
                ],
                ["Extension", extensionText],
              ]}
            />
            {!extend.ok && <p className="mt-2 text-sm text-neutral-700">{extend.reason}</p>}
          </PanelSection>

          <PanelSection title="Borrower">
            <PanelFacts
              facts={[
                ["Name", contact.name],
                ["Role", ROLE_LABEL[contact.role]],
                [
                  "Email",
                  <a key="e" href={`mailto:${contact.email}`} className={link}>
                    {contact.email}
                  </a>,
                ],
                [
                  "Phone",
                  <a key="p" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className={link}>
                    {contact.phone}
                  </a>,
                ],
              ]}
            />
            <Link
              href={`/dashboard/contacts/${contact.id}`}
              className={`${link} mt-2 inline-flex items-center gap-1`}
            >
              View contact
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                aria-hidden="true"
                className="size-4"
              />
            </Link>
          </PanelSection>

          <PanelSection title="Reminders">
            {request.reminders.length === 0 ? (
              <p className="text-neutral-600">No reminders sent</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {[...request.reminders].reverse().map((r) => (
                  <li key={r.at} className="flex justify-between gap-4">
                    <time dateTime={r.at} className="text-ink">
                      {formatDay(r.at)}
                    </time>
                    <span className="text-neutral-700">
                      {r.channel === "email" ? "Email" : "Phone call"} ·{" "}
                      {r.by === "auto" ? "Automatic" : r.by}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
        </>
      )}
    </RecordPanel>
  );
}
