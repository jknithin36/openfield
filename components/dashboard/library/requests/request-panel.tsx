"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import type { DeclineReason, LibraryData } from "@/lib/types";
import { dueWording, formatMonthDay, plural, relativeDay } from "@/lib/format";
import {
  activeLoansFor,
  getAvailability,
  getCopyAvailableIds,
  getEligibilityWarnings,
  getNextReturnDate,
  pastLoansFor,
} from "@/lib/library/selectors";
import { DECLINE_LABEL, join, ROLE_LABEL, TYPE_LABEL } from "@/lib/library/views";
import { ItemIcon } from "@/components/dashboard/item-icon";
import { PanelFacts, PanelSection, RecordPanel } from "@/components/dashboard/shared/record-panel";
import { REQUEST_STATUS, StatusText } from "@/components/dashboard/shared/status-text";
import { DeclineForm } from "@/components/dashboard/library/requests/decline-form";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focus}`;

export type RequestAction =
  | { kind: "approve" }
  | { kind: "waitlist" }
  | { kind: "decline"; reason: DeclineReason; note: string };

export function RequestPanel({
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
  onAction: (id: string, action: RequestAction) => void;
}) {
  const [declining, setDeclining] = useState(false);
  const [decliningFor, setDecliningFor] = useState(id);
  if (decliningFor !== id) {
    setDecliningFor(id);
    setDeclining(false);
  }

  const j = id
    ? join(
        data,
        data.requests.filter((r) => r.id === id),
      )[0]
    : undefined;
  if (!j)
    return (
      <RecordPanel open={false} onClose={onClose} returnFocusRef={returnFocusRef} title="">
        {null}
      </RecordPanel>
    );

  const { request, item, contact } = j;
  const avail = getAvailability(data, item.id);
  const nextBack = getNextReturnDate(data, item.id);
  const warnings = getEligibilityWarnings(data, contact);
  const copyAvailable = getCopyAvailableIds(data).has(request.id);
  const decidable = request.status === "waiting" || copyAvailable;
  const canApproveNow = avail.free > 0;
  const nextBackText = nextBack ? (
    <time dateTime={nextBack}>
      {dueWording(nextBack, now).late
        ? `Overdue (due ${formatMonthDay(nextBack)})`
        : formatMonthDay(nextBack)}
    </time>
  ) : (
    <>Not known yet</>
  );

  return (
    <RecordPanel
      open
      recordKey={request.id}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      eyebrow={request.id}
      title={`${item.name} for ${contact.name}`}
      meta={
        <>
          {copyAvailable
            ? "Copy available for this waitlisted request"
            : REQUEST_STATUS[request.status].label}{" "}
          · requested{" "}
          <time dateTime={request.requestedAt}>{relativeDay(request.requestedAt, now)}</time>
        </>
      }
      actions={
        decidable && !declining ? (
          <div className="flex flex-col gap-3">
            {!canApproveNow && (
              <p className="text-sm text-neutral-700">
                No copy is free. Next copy back: <span className="font-medium">{nextBackText}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {canApproveNow ? (
                <Button
                  onClick={() => onAction(request.id, { kind: "approve" })}
                  className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
                >
                  Approve
                </Button>
              ) : request.status === "waiting" ? (
                <Button
                  onClick={() => onAction(request.id, { kind: "waitlist" })}
                  className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
                >
                  Add to waitlist
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() => setDeclining(true)}
                className={`h-11 px-4 ${focus}`}
              >
                Decline
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {decidable && warnings.length > 0 && (
        <section className="mx-5 mb-4 rounded-md border border-amber-300 bg-amber-50 p-3">
          <h3 className="text-sm font-semibold text-amber-900">
            <StatusText tone="warning">Check eligibility</StatusText>
          </h3>
          <ul className="mt-1.5 list-disc pl-6 text-[15px] text-ink">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {declining ? (
        <section className="border-t border-border px-5 py-4">
          <h3 className="sr-only">Decline this request</h3>
          <DeclineForm
            onCancel={() => setDeclining(false)}
            onSubmit={(reason, note) => onAction(request.id, { kind: "decline", reason, note })}
          />
        </section>
      ) : (
        <>
          <PanelSection title="The item">
            <div className="mb-2 flex items-center gap-3">
              <ItemIcon item={item} />
              <Link href={`/dashboard/library/catalog/${item.id}`} className={link}>
                {item.name}
              </Link>
            </div>
            <PanelFacts
              facts={[
                ["Type", TYPE_LABEL[item.type]],
                ["Copies free", `${avail.free} of ${avail.total}`],
                ["Waitlist", plural(avail.waitlist, "person", "people")],
                ["Next copy back", nextBackText],
              ]}
            />
          </PanelSection>

          <PanelSection title="The person">
            <PanelFacts
              facts={[
                ["Name", contact.name],
                ["Role", ROLE_LABEL[contact.role]],
                [
                  "Region",
                  contact.inRegion ? "Riverbend region" : `${contact.region} (outside the region)`,
                ],
                ["Active loans", activeLoansFor(data, contact.id)],
                ["Past loans", pastLoansFor(data, contact.id)],
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

          <PanelSection title="Their note">
            {request.note ? (
              <p className="leading-relaxed text-neutral-800">{request.note}</p>
            ) : (
              <p className="text-neutral-600">No note was added.</p>
            )}
          </PanelSection>

          {request.status === "declined" && request.declineReason && (
            <PanelSection title="Why it was declined">
              <p className="text-neutral-800">{DECLINE_LABEL[request.declineReason]}</p>
              {request.declineNote && (
                <p className="mt-1 text-neutral-700">{request.declineNote}</p>
              )}
            </PanelSection>
          )}
        </>
      )}
    </RecordPanel>
  );
}
