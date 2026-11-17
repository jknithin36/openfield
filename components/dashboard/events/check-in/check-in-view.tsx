"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEventsStore } from "@/store/events";
import { undoAnywhere } from "@/lib/undo-registry";
import "@/store/register-undo";
import type { Contact, EventsData, OFEvent, Role } from "@/lib/types";
import { ACC_TYPE_LABEL, eventById, registrationsFor } from "@/lib/events/selectors";
import { ROLE_LABEL } from "@/lib/library/views";
import { announce } from "@/components/dashboard/shared/announcer";
import { useEvents } from "@/components/dashboard/shared/use-events";

// Door check-in for a tablet: big text, ≥ 56px targets, no dashboard chrome.
const focus = "focus-visible:ring-4 focus-visible:ring-ring";
const big = "min-h-14 text-lg";

export function CheckInView({ id }: { id: string }) {
  const ev = useEvents();
  if (!ev) return <p className="p-8 text-lg">Loading…</p>;
  const event = eventById(ev.data, id);
  if (!event) return <p className="p-8 text-lg">Event not found.</p>;
  return <Door data={ev.data} contacts={ev.contacts} event={event} />;
}

function Door({
  data,
  contacts,
  event,
}: {
  data: EventsData;
  contacts: Contact[];
  event: OFEvent;
}) {
  const [q, setQ] = useState("");
  const [walkIn, setWalkIn] = useState(false);
  const [undoIds, setUndoIds] = useState<Record<string, string>>({});
  const people = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const needs = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of data.accommodations)
      m.set(a.registrationId, [
        ...(m.get(a.registrationId) ?? []),
        ACC_TYPE_LABEL[a.type].toLowerCase(),
      ]);
    return m;
  }, [data.accommodations]);

  const regs = registrationsFor(data, event.id)
    .filter((r) => r.status === "registered" || r.status === "attended")
    .flatMap((r) => {
      const c = people.get(r.contactId);
      return c ? [{ r, c }] : [];
    })
    .sort((a, b) => a.c.name.localeCompare(b.c.name));
  const shown = regs.filter(
    ({ c }) => !q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const checked = regs.filter(({ r }) => r.status === "attended").length;

  const checkIn = (regId: string, name: string) => {
    const res = useEventsStore.getState().checkIn(regId);
    if (!res.ok) return announce(res.reason);
    setUndoIds((u) => ({ ...u, [regId]: res.undoId }));
    announce(`${name} checked in. ${checked + 1} of ${regs.length} checked in.`);
  };
  const undo = (regId: string, name: string) => {
    if (undoIds[regId] && undoAnywhere(undoIds[regId])) {
      setUndoIds((u) => {
        const n = { ...u };
        delete n[regId];
        return n;
      });
      announce(`${name} check-in undone.`);
    }
  };

  return (
    <div className="min-h-svh bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-border bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold text-ink sm:text-2xl">{event.title}</h1>
            <p className="text-lg text-neutral-700 tabular-nums">
              <span className="font-semibold text-ink">
                {checked} of {regs.length}
              </span>{" "}
              checked in
            </p>
          </div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/dashboard/events/${event.id}`} />}
            className={`${big} gap-2 px-5 ${focus}`}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" />
            Exit check-in
          </Button>
        </div>
      </header>

      <main id="main-content" className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="door-search" className="text-lg font-medium text-ink">
            Find a name
          </Label>
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-6 -translate-y-1/2 text-neutral-500"
            />
            <Input
              id="door-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              className={`h-16 bg-white pl-14 text-xl ${focus}`}
            />
          </div>
        </div>

        <Button
          onClick={() => setWalkIn((w) => !w)}
          variant="outline"
          aria-expanded={walkIn}
          className={`${big} w-fit gap-2 px-5 ${focus}`}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
          Walk-in
        </Button>
        {walkIn && <WalkIn event={event} onDone={() => setWalkIn(false)} />}

        {shown.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-white px-6 py-10 text-center text-lg text-neutral-600">
            No names match “{q}”. Add them as a walk-in.
          </p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Registered people, A to Z">
            {shown.map(({ r, c }) => {
              const done = r.status === "attended";
              const need = needs.get(r.id);
              return (
                <li
                  key={r.id}
                  className={`flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between ${done ? "border-emerald-300" : "border-border"}`}
                >
                  <div>
                    <p className="text-xl font-medium text-ink">{c.name}</p>
                    <p className="text-base text-neutral-600">{ROLE_LABEL[c.role]}</p>
                    {need && (
                      <p className="mt-1 text-base font-medium text-amber-900">
                        Needs: {need.join(", ")}
                      </p>
                    )}
                  </div>
                  {done ? (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-2 text-lg font-medium text-emerald-800">
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="size-6"
                        />
                        Checked in
                      </span>
                      {undoIds[r.id] && (
                        <Button
                          variant="ghost"
                          onClick={() => undo(r.id, c.name)}
                          className={`${big} px-4 underline underline-offset-4 ${focus}`}
                        >
                          Undo<span className="sr-only"> check-in for {c.name}</span>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => checkIn(r.id, c.name)}
                      className={`${big} min-w-40 bg-brand px-6 text-white hover:bg-brand-hover ${focus}`}
                    >
                      Check in<span className="sr-only"> {c.name}</span>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

const ROLES: Role[] = ["parent", "teacher", "provider", "employer", "self-advocate"];

function WalkIn({ event, onDone }: { event: OFEvent; onDone: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("parent");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return setError("Enter the person's name");
        const res = useEventsStore.getState().walkIn(event.id, { name, role, email });
        if (!res.ok) return setError(res.reason);
        announce(`${name} added as a walk-in and checked in.`);
        onDone();
      }}
      noValidate
    >
      <h2 className="text-lg font-semibold text-ink">Add a walk-in</h2>
      <div>
        <Label htmlFor="walk-name" className="text-lg">
          Name
        </Label>
        {error && (
          <p id="walk-error" role="alert" className="text-base font-semibold text-red-700">
            <span className="sr-only">Error: </span>
            {error}
          </p>
        )}
        <Input
          id="walk-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "walk-error" : undefined}
          className={`mt-1 h-14 text-lg ${focus}`}
        />
      </div>
      <fieldset>
        <legend className="text-lg">Role</legend>
        <RadioGroup
          value={role}
          onValueChange={(v) => setRole(v as Role)}
          className="mt-1 grid grid-cols-2 gap-x-4"
        >
          {ROLES.map((r) => (
            <div key={r} className="flex min-h-14 items-center gap-3">
              <RadioGroupItem value={r} id={`walk-${r}`} className={`size-6 ${focus}`} />
              <Label htmlFor={`walk-${r}`} className="text-lg font-normal">
                {ROLE_LABEL[r]}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>
      <div>
        <Label htmlFor="walk-email" className="text-lg">
          Email (optional)
        </Label>
        <Input
          id="walk-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-1 h-14 text-lg ${focus}`}
        />
      </div>
      <div className="flex gap-3">
        <Button
          type="submit"
          className={`${big} bg-brand px-6 text-white hover:bg-brand-hover ${focus}`}
        >
          Add and check in
        </Button>
        <Button type="button" variant="outline" onClick={onDone} className={`${big} px-6 ${focus}`}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
