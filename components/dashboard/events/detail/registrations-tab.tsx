"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEventsStore, type NewPerson } from "@/store/events";
import type {
  AccommodationType,
  Contact,
  EventsData,
  OFEvent,
  Registration,
  Role,
} from "@/lib/types";
import { formatDay } from "@/lib/format";
import {
  ACC_TYPE_LABEL,
  effectiveStatus,
  REG_STATUS_LABEL,
  registrationsFor,
  SOURCE_LABEL,
  waitlistFor,
} from "@/lib/events/selectors";
import { ROLE_LABEL } from "@/lib/library/views";
import { DataTable } from "@/components/dashboard/shared/data-table";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import {
  ErrorSummary,
  FieldError,
  type FormError,
} from "@/components/dashboard/shared/form-errors";
import { notifyResult } from "@/components/dashboard/shared/notify";
import {
  PanelFacts,
  PanelSection,
  RecordPanel,
  useRecordParam,
} from "@/components/dashboard/shared/record-panel";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { SelectField } from "@/components/dashboard/shared/fields";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focus}`;

type Row = { reg: Registration; contact: Contact; needs: string[] };

export function RegistrationsTab({
  data,
  contacts,
  event,
  now,
}: {
  data: EventsData;
  contacts: Contact[];
  event: OFEvent;
  now: Date;
}) {
  const record = useRecordParam("reg");
  const [adding, setAdding] = useState(false);
  const people = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const accByReg = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of data.accommodations)
      m.set(a.registrationId, [
        ...(m.get(a.registrationId) ?? []),
        `${ACC_TYPE_LABEL[a.type]} (${a.status === "requested" ? "not arranged" : a.status})`,
      ]);
    return m;
  }, [data.accommodations]);
  const rows: Row[] = registrationsFor(data, event.id)
    .filter((r) => r.status !== "waitlisted")
    .flatMap((reg) => {
      const contact = people.get(reg.contactId);
      return contact ? [{ reg, contact, needs: accByReg.get(reg.id) ?? [] }] : [];
    })
    .sort((a, b) => a.contact.name.localeCompare(b.contact.name));
  const waitlist = waitlistFor(data, event.id);
  const open = effectiveStatus(event, now) === "published";
  const store = () => useEventsStore.getState();
  const current = record.id ? data.registrations.find((r) => r.id === record.id) : undefined;
  const currentContact = current && people.get(current.contactId);

  const cancel = (reg: Registration, name: string) => {
    const res = store().cancelRegistration(reg.id);
    const promoted =
      res.ok && res.message ? (people.get(res.message)?.name ?? "the next person") : null;
    if (
      notifyResult(res, {
        success: promoted
          ? `${name}'s registration cancelled. ${promoted} moved off the waitlist.`
          : `${name}'s registration cancelled.`,
        undone: "Undone",
      })
    )
      record.close();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-ink">Registrations</h2>
        {open && (
          <Button
            onClick={() => setAdding(true)}
            className={`h-11 gap-1.5 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
            Add registration
          </Button>
        )}
      </div>

      <DataTable
        caption={`Registrations for ${event.title}, by name`}
        rows={rows}
        rowKey={(r) => r.reg.id}
        openText={(r) => r.contact.name}
        openLabel={(r) => `Open registration for ${r.contact.name}`}
        onOpen={(r, t) => record.open(r.reg.id, t)}
        empty={<EmptyState>No registrations yet.</EmptyState>}
        columns={[
          {
            header: "Name",
            cell: (r) => (
              <span className="text-sm text-neutral-600">{ROLE_LABEL[r.contact.role]}</span>
            ),
          },
          {
            header: "Registered",
            cell: (r) => <time dateTime={r.reg.registeredAt}>{formatDay(r.reg.registeredAt)}</time>,
          },
          { header: "Source", cell: (r) => SOURCE_LABEL[r.reg.source] },
          {
            header: "Status",
            cell: (r) => (
              <StatusText
                tone={
                  r.reg.status === "attended"
                    ? "success"
                    : r.reg.status === "no-show" || r.reg.status === "cancelled"
                      ? "warning"
                      : "neutral"
                }
                icon={false}
              >
                {REG_STATUS_LABEL[r.reg.status]}
              </StatusText>
            ),
          },
          {
            header: "Needs",
            cell: (r) =>
              r.needs.length ? r.needs.join(", ") : <span aria-label="No accommodations">—</span>,
          },
        ]}
      />

      <section aria-labelledby="waitlist-heading">
        <h2 id="waitlist-heading" className="text-lg font-medium text-ink">
          Waitlist ({waitlist.length})
        </h2>
        {waitlist.length === 0 ? (
          <p className="mt-2 text-[15px] text-neutral-600">Nobody is waiting.</p>
        ) : (
          <ol className="mt-3 flex flex-col divide-y divide-border rounded-lg border border-border bg-white">
            {waitlist.map((w, i) => {
              const c = people.get(w.contactId);
              return (
                <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <span className="flex items-center gap-3">
                    <span
                      className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand tabular-nums"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span className="sr-only">Position {i + 1}: </span>
                      {c ? (
                        <Link href={`/dashboard/contacts/${c.id}`} className={link}>
                          {c.name}
                        </Link>
                      ) : (
                        "Unknown"
                      )}
                      <span className="text-sm text-neutral-600">
                        {" "}
                        · since <time dateTime={w.registeredAt}>{formatDay(w.registeredAt)}</time>
                      </span>
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        notifyResult(store().promote(w.id), {
                          success: `${c?.name ?? "They"} moved from the waitlist.`,
                          undone: "Undone",
                        })
                      }
                      className={`h-11 px-3 ${focus}`}
                    >
                      Move from waitlist<span className="sr-only">: {c?.name}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => cancel(w, c?.name ?? "This person")}
                      className={`h-11 px-3 text-red-700 ${focus}`}
                    >
                      Remove<span className="sr-only"> {c?.name} from the waitlist</span>
                    </Button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <RecordPanel
        open={!!current && !!currentContact}
        recordKey={current?.id}
        onClose={record.close}
        returnFocusRef={record.returnFocusRef}
        eyebrow={current ? REG_STATUS_LABEL[current.status] : undefined}
        title={currentContact?.name ?? ""}
        meta={
          current ? (
            <>
              Registered{" "}
              <time dateTime={current.registeredAt}>{formatDay(current.registeredAt)}</time> via{" "}
              {SOURCE_LABEL[current.source].toLowerCase()}
            </>
          ) : null
        }
        actions={
          current && currentContact && current.status === "registered" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  notifyResult(store().checkIn(current.id), {
                    success: `${currentContact.name} marked as attended.`,
                    undone: "Undone",
                  })
                }
                className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
              >
                Mark attended<span className="sr-only">: {currentContact.name}</span>
              </Button>
              {open && (
                <Button
                  variant="outline"
                  onClick={() => cancel(current, currentContact.name)}
                  className={`h-11 px-4 ${focus}`}
                >
                  Cancel registration<span className="sr-only"> for {currentContact.name}</span>
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {current && currentContact && (
          <>
            <PanelSection title="Person">
              <PanelFacts
                facts={[
                  ["Role", ROLE_LABEL[currentContact.role]],
                  ["Email", currentContact.email || "—"],
                  ["Phone", currentContact.phone || "—"],
                ]}
              />
              <Link
                href={`/dashboard/contacts/${currentContact.id}`}
                className={`${link} mt-2 inline-block`}
              >
                View contact
              </Link>
            </PanelSection>
            <PanelSection title="Accommodations">
              {(accByReg.get(current.id) ?? []).length ? (
                <ul className="list-disc pl-5">
                  {accByReg.get(current.id)!.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-neutral-600">None requested.</p>
              )}
            </PanelSection>
          </>
        )}
      </RecordPanel>

      <AddRegistrationDialog
        open={adding}
        onOpenChange={setAdding}
        event={event}
        contacts={contacts}
      />
    </div>
  );
}

const ROLES: Role[] = ["parent", "teacher", "provider", "employer", "self-advocate"];

function AddRegistrationDialog({
  open,
  onOpenChange,
  event,
  contacts,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  event: OFEvent;
  contacts: Contact[];
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState("");
  const [person, setPerson] = useState<NewPerson>({ name: "", role: "parent", email: "" });
  const [accType, setAccType] = useState<AccommodationType | "">("");
  const [accDetails, setAccDetails] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);
  const results = q.trim()
    ? contacts
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q.toLowerCase()) ||
            c.email.toLowerCase().includes(q.toLowerCase()),
        )
        .slice(0, 6)
    : [];
  const reset = () => {
    setQ("");
    setPicked("");
    setPerson({ name: "", role: "parent", email: "" });
    setAccType("");
    setAccDetails("");
    setErrors([]);
    setMode("existing");
  };
  const submit = () => {
    const errs: FormError[] = [];
    if (mode === "existing" && !picked)
      errs.push({ fieldId: "reg-search", message: "Find and choose a person" });
    if (mode === "new" && !person.name.trim())
      errs.push({ fieldId: "reg-name", message: "Enter the person's name" });
    setErrors(errs);
    if (errs.length) return;
    const res = useEventsStore
      .getState()
      .addRegistration(
        event.id,
        mode === "existing" ? { contactId: picked } : { person },
        "phone",
        accType ? [{ type: accType, details: accDetails }] : [],
      );
    const name = mode === "existing" ? contacts.find((c) => c.id === picked)?.name : person.name;
    if (
      notifyResult(res, {
        success:
          res.ok && res.message
            ? `${name} added to the waitlist (event is full).`
            : `${name} registered.`,
        undone: "Registration removed",
      })
    ) {
      reset();
      onOpenChange(false);
    }
  };
  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add registration</DialogTitle>
          <DialogDescription>For phone sign-ups to {event.title}.</DialogDescription>
        </DialogHeader>
        <ErrorSummary errors={errors} />
        <fieldset>
          <legend className="text-[15px] font-medium text-ink">Who is it?</legend>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as "existing" | "new")}
            className="mt-1 flex gap-6"
          >
            {(["existing", "new"] as const).map((m) => (
              <div key={m} className="flex min-h-11 items-center gap-2.5">
                <RadioGroupItem value={m} id={`reg-mode-${m}`} className={`size-5 ${focus}`} />
                <Label htmlFor={`reg-mode-${m}`} className="font-normal">
                  {m === "existing" ? "Someone we know" : "A new person"}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>

        {mode === "existing" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-search">Find a person</Label>
            <FieldError id="reg-search-error" message={err("reg-search")} />
            <Input
              id="reg-search"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPicked("");
              }}
              placeholder="Name or email"
              autoComplete="off"
              className={`h-11 text-base ${focus}`}
            />
            {results.length > 0 && (
              <RadioGroup
                value={picked}
                onValueChange={(v) => setPicked(String(v))}
                aria-label="Matching people"
                className="gap-1"
              >
                {results.map((c) => (
                  <div
                    key={c.id}
                    className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-neutral-50"
                  >
                    <RadioGroupItem
                      value={c.id}
                      id={`reg-p-${c.id}`}
                      className={`size-5 ${focus}`}
                    />
                    <Label
                      htmlFor={`reg-p-${c.id}`}
                      className="flex flex-col items-start font-normal"
                    >
                      <span className="font-medium text-ink">{c.name}</span>
                      <span className="text-sm text-neutral-600">
                        {ROLE_LABEL[c.role]}
                        {c.email ? ` · ${c.email}` : ""}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="reg-name">Full name</Label>
              <FieldError id="reg-name-error" message={err("reg-name")} />
              <Input
                id="reg-name"
                value={person.name}
                onChange={(e) => setPerson({ ...person, name: e.target.value })}
                className={`mt-1.5 h-11 text-base ${focus}`}
              />
            </div>
            <fieldset>
              <legend className="text-[15px] font-medium text-ink">Role</legend>
              <RadioGroup
                value={person.role}
                onValueChange={(v) => setPerson({ ...person, role: v as Role })}
                className="mt-1 grid grid-cols-2 gap-x-4"
              >
                {ROLES.map((r) => (
                  <div key={r} className="flex min-h-11 items-center gap-2.5">
                    <RadioGroupItem value={r} id={`reg-role-${r}`} className={`size-5 ${focus}`} />
                    <Label htmlFor={`reg-role-${r}`} className="font-normal">
                      {ROLE_LABEL[r]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>
            <div>
              <Label htmlFor="reg-email">Email (optional)</Label>
              <Input
                id="reg-email"
                type="email"
                value={person.email}
                onChange={(e) => setPerson({ ...person, email: e.target.value })}
                className={`mt-1.5 h-11 text-base ${focus}`}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <SelectField
            id="reg-acc"
            label="Accessibility needs (optional)"
            value={accType}
            options={ACC_TYPE_LABEL}
            noneLabel="None"
            onChange={setAccType}
          />
          {accType && (
            <>
              <Label htmlFor="reg-acc-details">Details</Label>
              <Input
                id="reg-acc-details"
                value={accDetails}
                onChange={(e) => setAccDetails(e.target.value)}
                placeholder="e.g. 2 children, ages 4 and 7"
                className={`h-11 text-base ${focus}`}
              />
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={`h-11 px-4 ${focus}`}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
          >
            Add registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
