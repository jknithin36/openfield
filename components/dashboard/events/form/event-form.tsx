"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useEventsStore } from "@/store/events";
import type {
  AccessFeature,
  CenterSlug,
  EventFormat,
  EventsData,
  EventType,
  OFEvent,
} from "@/lib/types";
import { canLowerSeats, validateEvent, type EventInput } from "@/lib/events/rules";
import {
  ACCESS_LABEL,
  EVENT_TYPE_LABEL,
  effectiveStatus,
  eventById,
  seatsTaken,
} from "@/lib/events/selectors";
import { CENTER_LABEL } from "@/lib/library/views";
import { OPENFIELD_VENUE } from "@/data/events";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { useEvents } from "@/components/dashboard/shared/use-events";
import { SelectField } from "@/components/dashboard/shared/fields";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const field = `h-11 bg-background text-base ${focus}`;
/** ISO → value for <input type="datetime-local"> (local time). */
const toLocal = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : "");
const FIELD_ID: Record<string, string> = {
  title: "ev-title",
  summary: "ev-summary",
  start: "ev-start",
  end: "ev-end",
  venue: "ev-venue",
  link: "ev-link",
  seats: "ev-seats",
  price: "ev-price",
};

export function EventForm({ id }: { id?: string }) {
  const ev = useEvents();
  if (!ev) return <PageHeader title={id ? "Edit event" : "New event"} description="Loading…" />;
  const existing = id ? eventById(ev.data, id) : undefined;
  if (id && !existing) return <PageHeader title="Event not found" />;
  return <Form data={ev.data} existing={existing} />;
}

function Form({ data, existing }: { data: EventsData; existing?: OFEvent }) {
  const router = useRouter();
  const [now] = useState(() => new Date());
  const start0 =
    existing?.startsAt ??
    new Date(now.getTime() + 14 * 86400000).toISOString().replace(/T.*/, "T18:00:00");
  const [v, setV] = useState({
    title: existing?.title ?? "",
    type: (existing?.type ?? "workshop") as EventType,
    center: (existing?.center ?? "") as CenterSlug | "",
    summary: existing?.summary ?? "",
    description: existing?.description ?? "",
    start: toLocal(start0),
    end: toLocal(
      existing?.endsAt ?? new Date(new Date(start0).getTime() + 2 * 3600000).toISOString(),
    ),
    format: (existing?.format ?? "in-person") as EventFormat,
    venueName: existing?.venue?.name ?? OPENFIELD_VENUE.name,
    venueAddress: existing?.venue?.address ?? OPENFIELD_VENUE.address,
    link: existing?.onlineLink ?? "",
    seats: String(existing?.seats ?? 30),
    price: String(existing?.price ?? 0),
    access: existing?.accessibilityProvided ?? (["wheelchair-access"] as AccessFeature[]),
  });
  const [notify, setNotify] = useState(true);
  const [errors, setErrors] = useState<FormError[]>([]);
  const registered = existing ? seatsTaken(data, existing.id) : 0;
  const published = existing && effectiveStatus(existing, now) === "published";

  const input = (): EventInput => ({
    title: v.title,
    type: v.type,
    center: v.center || null,
    summary: v.summary,
    description: v.description,
    startsAt: fromLocal(v.start),
    endsAt: fromLocal(v.end),
    format: v.format,
    venue: v.format === "online" ? undefined : { name: v.venueName, address: v.venueAddress },
    onlineLink: v.format === "in-person" ? undefined : v.link,
    seats: /^\d+$/.test(v.seats) ? Number(v.seats) : NaN,
    price: /^\d+(\.\d+)?$/.test(v.price) ? Number(v.price) : NaN,
    accessibilityProvided: v.access,
  });

  const submit = (publish: boolean) => {
    const i = input();
    const errs = validateEvent(i).map((e) => ({ fieldId: FIELD_ID[e.field], message: e.message }));
    if (existing && Number.isInteger(i.seats)) {
      const s = canLowerSeats(data, existing.id, i.seats);
      if (!s.ok) errs.push({ fieldId: "ev-seats", message: s.reason });
    }
    setErrors(errs);
    if (errs.length) return;
    const store = useEventsStore.getState();
    const res = existing ? store.updateEvent(existing.id, i) : store.createEvent(i, publish);
    const msg = existing
      ? `Changes saved.${published && registered && notify ? ` ${registered} people will be told about the changes.` : ""}`
      : publish
        ? `${i.title} is published.`
        : `${i.title} saved as a draft.`;
    if (notifyResult(res, { success: msg, undone: "Undone" }) && res.ok)
      router.push(`/dashboard/events/${res.id ?? existing?.id}`);
    else if (!res.ok) setErrors([{ fieldId: "ev-title", message: res.reason }]);
  };

  const err = (k: string) => errors.find((e) => e.fieldId === FIELD_ID[k])?.message;
  const text = (
    k: string,
    label: string,
    value: string,
    set: (s: string) => void,
    opts: { type?: string; hint?: string; inputMode?: "numeric" | "decimal" } = {},
  ) => (
    <div className={errorGroupClass(!!err(k))}>
      <Label htmlFor={FIELD_ID[k] ?? k} className="text-[15px] font-medium text-ink">
        {label}
      </Label>
      {opts.hint && (
        <p id={`${FIELD_ID[k] ?? k}-hint`} className="text-sm text-neutral-600">
          {opts.hint}
        </p>
      )}
      <FieldError id={`${FIELD_ID[k] ?? k}-error`} message={err(k)} />
      <Input
        id={FIELD_ID[k] ?? k}
        type={opts.type ?? "text"}
        inputMode={opts.inputMode}
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-invalid={!!err(k)}
        aria-describedby={
          [opts.hint && `${FIELD_ID[k] ?? k}-hint`, err(k) && `${FIELD_ID[k] ?? k}-error`]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`mt-1.5 ${field}`}
      />
    </div>
  );
  const section = (title: string, children: React.ReactNode) => (
    <section className="flex flex-col gap-5 border-t border-border pt-6">
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      {children}
    </section>
  );
  const radios = <T extends string>(
    name: string,
    legend: string,
    value: T,
    opts: Record<T, string>,
    set: (v: T) => void,
  ) => (
    <fieldset>
      <legend className="text-[15px] font-medium text-ink">{legend}</legend>
      <RadioGroup
        value={value}
        onValueChange={(x) => set(x as T)}
        className="mt-1 grid gap-x-6 sm:grid-cols-2"
      >
        {(Object.keys(opts) as T[]).map((o) => (
          <div key={o} className="flex min-h-11 items-center gap-2.5">
            <RadioGroupItem value={o} id={`${name}-${o}`} className={`size-5 ${focus}`} />
            <Label htmlFor={`${name}-${o}`} className="text-[15px] font-normal">
              {opts[o]}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(!existing ? false : true);
      }}
      noValidate
      className="flex max-w-3xl flex-col gap-8"
    >
      <PageHeader
        breadcrumb={[
          { label: "Events", href: "/dashboard/events" },
          ...(existing
            ? [{ label: existing.title, href: `/dashboard/events/${existing.id}` }]
            : []),
          { label: existing ? "Edit" : "New event" },
        ]}
        title={existing ? `Edit ${existing.title}` : "New event"}
        description={
          existing
            ? "Changes show on the website straight away."
            : "Save as a draft to keep working on it, or publish it now."
        }
      />
      <ErrorSummary errors={errors} />

      {section(
        "Basics",
        <>
          {text("title", "Title", v.title, (s) => setV({ ...v, title: s }))}
          {radios("ev-type", "Type", v.type, EVENT_TYPE_LABEL, (t) => setV({ ...v, type: t }))}
          <SelectField
            id="ev-center"
            label="Topic"
            value={v.center}
            options={CENTER_LABEL}
            noneLabel="No specific topic"
            onChange={(c) => setV({ ...v, center: c })}
          />
          {text("summary", "Short summary", v.summary, (s) => setV({ ...v, summary: s }), {
            hint: "One sentence for the events list.",
          })}
          <div>
            <Label htmlFor="ev-description" className="text-[15px] font-medium text-ink">
              Description
            </Label>
            <Textarea
              id="ev-description"
              rows={4}
              value={v.description}
              onChange={(e) => setV({ ...v, description: e.target.value })}
              className={`mt-1.5 bg-background text-base ${focus}`}
            />
          </div>
        </>,
      )}

      {section(
        "When and where",
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            {text("start", "Starts", v.start, (s) => setV({ ...v, start: s }), {
              type: "datetime-local",
            })}
            {text("end", "Ends", v.end, (s) => setV({ ...v, end: s }), { type: "datetime-local" })}
          </div>
          {radios(
            "ev-format",
            "Format",
            v.format,
            { "in-person": "In person", online: "Online", hybrid: "Hybrid (both)" },
            (f) => setV({ ...v, format: f }),
          )}
          {v.format !== "online" && (
            <div className="grid gap-5 sm:grid-cols-2">
              {text("venue", "Venue name", v.venueName, (s) => setV({ ...v, venueName: s }))}
              {text("venueAddress", "Venue address", v.venueAddress, (s) =>
                setV({ ...v, venueAddress: s }),
              )}
            </div>
          )}
          {v.format !== "in-person" &&
            text("link", "Online link", v.link, (s) => setV({ ...v, link: s }), {
              type: "url",
              hint: "Sent to people who register.",
            })}
        </>,
      )}

      {section(
        "Seats and price",
        <div className="grid gap-5 sm:grid-cols-2">
          {text("seats", "Seats", v.seats, (s) => setV({ ...v, seats: s }), {
            inputMode: "numeric",
            hint: existing ? `${registered} people are registered.` : undefined,
          })}
          {text("price", "Price in dollars", v.price, (s) => setV({ ...v, price: s }), {
            inputMode: "decimal",
            hint: "Use 0 for a free event.",
          })}
        </div>,
      )}

      {section(
        "Accessibility provided",
        <fieldset>
          <legend className="sr-only">Accessibility provided</legend>
          <ul className="grid gap-x-6 sm:grid-cols-2">
            {(Object.keys(ACCESS_LABEL) as AccessFeature[]).map((a) => (
              <li key={a} className="flex min-h-11 items-center gap-2.5">
                <Checkbox
                  id={`ev-acc-${a}`}
                  checked={v.access.includes(a)}
                  onCheckedChange={(c) =>
                    setV({
                      ...v,
                      access: c === true ? [...v.access, a] : v.access.filter((x) => x !== a),
                    })
                  }
                  className={`size-5 ${focus}`}
                />
                <Label htmlFor={`ev-acc-${a}`} className="text-[15px] font-normal">
                  {ACCESS_LABEL[a]}
                </Label>
              </li>
            ))}
          </ul>
        </fieldset>,
      )}

      {section(
        existing ? "Save" : "Publish",
        <>
          {published && registered > 0 && (
            <div className="flex min-h-11 items-center gap-2.5">
              <Checkbox
                id="ev-notify"
                checked={notify}
                onCheckedChange={(c) => setNotify(c === true)}
                className={`size-5 ${focus}`}
              />
              <Label htmlFor="ev-notify" className="text-[15px] font-normal">
                {registered} people are registered. Notify them of changes?
              </Label>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {existing ? (
              <Button
                type="button"
                onClick={() => submit(true)}
                className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
              >
                Save changes
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => submit(true)}
                  className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
                >
                  Publish
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => submit(false)}
                  className={`h-11 px-4 ${focus}`}
                >
                  Save as draft
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className={`h-11 px-4 ${focus}`}
            >
              Cancel
            </Button>
          </div>
        </>,
      )}
    </form>
  );
}
