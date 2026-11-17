"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useContactsStore, type ContactInput } from "@/store/contacts";
import type { Role } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { formatMonthDay } from "@/lib/format";
import {
  activeLoanCount,
  findDuplicate,
  lastContact,
  upcomingEventCount,
} from "@/lib/contacts/selectors";
import { validateContact } from "@/lib/contacts/rules";
import { parseOne, ROLE_LABEL } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/shared/data-table";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { focusRing } from "@/components/dashboard/shared/fields";
import { ListPagination, paginate } from "@/components/dashboard/shared/list-pagination";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { Toolbar } from "@/components/dashboard/shared/toolbar";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { useWorkspace, type Workspace } from "@/components/dashboard/shared/use-workspace";
import { ContactForm } from "@/components/dashboard/contacts/contact-form";

const TABS = ["all", "parent", "teacher", "provider", "employer", "self-advocate"] as const;
const TAB_LABEL = {
  all: "All",
  parent: "Parents",
  teacher: "Teachers",
  provider: "Providers",
  employer: "Employers",
  "self-advocate": "Self-advocates",
} as const;

export function ContactsList() {
  const w = useWorkspace();
  return w ? <Content w={w} /> : <PageHeader title="Contacts" description="Loading…" />;
}

function Content({ w }: { w: Workspace }) {
  const [now] = useState(() => new Date());
  const router = useRouter();
  const { searchParams, setParams } = useUrlState();
  const [adding, setAdding] = useState(searchParams.get("new") === "1");
  const [importing, setImporting] = useState(false);
  const addTrigger = useRef<HTMLElement | null>(null);
  const tab = parseOne(searchParams.get("tab"), TABS, "all");
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const region = searchParams.get("region");
  const loan = searchParams.get("loan");
  const upcoming = searchParams.get("event");

  const rows = useMemo(() => {
    return w.contacts
      .filter((c) => tab === "all" || c.role === tab)
      .filter((c) => !region || (region === "in" ? c.inRegion : !c.inRegion))
      .filter((c) => !loan || activeLoanCount(c.id, w.lib) > 0)
      .filter((c) => !upcoming || upcomingEventCount(c.id, w.ev.data, now) > 0)
      .filter(
        (c) =>
          !q ||
          [c.name, c.email, c.phone, ...(c.tags ?? [])].some((x) => x.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [w, tab, q, region, loan, upcoming, now]);
  const { page, pageCount, pageRows } = paginate(rows, searchParams.get("page"), 15);
  const counts = Object.fromEntries(
    TABS.map((t) => [
      t,
      t === "all" ? w.contacts.length : w.contacts.filter((c) => c.role === t).length,
    ]),
  ) as Record<(typeof TABS)[number], number>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "People" }, { label: "Contacts" }]}
        title="Contacts"
        count={`(${w.contacts.length})`}
        description="Everyone we've helped, with their loans, events and messages."
        primaryAction={{
          label: "Add contact",
          onClick: () => {
            addTrigger.current = document.activeElement as HTMLElement | null;
            setAdding(true);
          },
          icon: <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} aria-hidden="true" />,
        }}
        moreActions={[
          { label: "Import CSV", onSelect: () => setImporting(true) },
          {
            label: "Export CSV",
            onSelect: () =>
              downloadCsv(`openfield-contacts-${tab}`, [
                [
                  "Name",
                  "Role",
                  "Email",
                  "Phone",
                  "Address",
                  "Region",
                  "Tags",
                  "Active loans",
                  "Upcoming events",
                ],
                ...rows.map((c) => [
                  c.name,
                  ROLE_LABEL[c.role],
                  c.email,
                  c.phone,
                  c.address,
                  c.region,
                  (c.tags ?? []).join("; "),
                  activeLoanCount(c.id, w.lib),
                  upcomingEventCount(c.id, w.ev.data, now),
                ]),
              ]),
          },
        ]}
        tabs={{
          label: "Role",
          param: "tab",
          current: tab,
          defaultValue: "all",
          items: TABS.map((t) => ({ value: t, label: TAB_LABEL[t], count: counts[t] })),
        }}
      />

      <Toolbar
        searchLabel="Search contacts"
        searchPlaceholder="Name, email, phone or tag"
        filters={[
          {
            key: "region",
            label: "Region",
            options: [
              { value: "in", label: "Riverbend region" },
              { value: "out", label: "Outside the region" },
            ],
          },
          {
            key: "loan",
            label: "Active loan",
            options: [{ value: "yes", label: "Has an active loan" }],
          },
          {
            key: "event",
            label: "Upcoming event",
            options: [{ value: "yes", label: "Registered for an event" }],
          },
        ]}
      />

      <DataTable
        caption="Contacts, A to Z"
        rows={pageRows}
        rowKey={(c) => c.id}
        openText={(c) => c.name}
        openLabel={(c) => `Open ${c.name}`}
        onOpen={(c) => router.push(`/dashboard/contacts/${c.id}`)}
        empty={
          <EmptyState>
            {q || region || loan || upcoming
              ? "No contacts match your search."
              : "No contacts yet."}
          </EmptyState>
        }
        columns={[
          {
            header: "Name",
            cell: (c) => (
              <span className="text-sm text-neutral-600">
                {ROLE_LABEL[c.role]}
                {!c.inRegion && " · outside the region"}
                {c.accessibilityNeeds && (
                  <span className="block text-amber-900">{c.accessibilityNeeds}</span>
                )}
              </span>
            ),
          },
          {
            header: "Contact",
            cell: (c) => (
              <span className="flex flex-col text-[15px]">
                <span>{c.email || "—"}</span>
                <span className="text-sm text-neutral-600">{c.phone}</span>
              </span>
            ),
          },
          {
            header: "Active loans",
            cell: (c) => {
              const n = activeLoanCount(c.id, w.lib);
              return n ? (
                <span className="tabular-nums">{n}</span>
              ) : (
                <span aria-label="None">—</span>
              );
            },
          },
          {
            header: "Upcoming events",
            cell: (c) => {
              const n = upcomingEventCount(c.id, w.ev.data, now);
              return n ? (
                <span className="tabular-nums">{n}</span>
              ) : (
                <span aria-label="None">—</span>
              );
            },
          },
          {
            header: "Last contact",
            cell: (c) => {
              const l = lastContact(c, w.lib, w.ev.data, w.messages);
              return l ? (
                <span>
                  <time dateTime={l.at}>{formatMonthDay(l.at)}</time>, {l.what}
                </span>
              ) : (
                <span aria-label="Never">—</span>
              );
            },
          },
        ]}
      />
      <ListPagination
        page={page}
        pageCount={pageCount}
        total={rows.length}
        size={15}
        label="Contact pages"
      />

      <ContactForm
        open={adding}
        onOpenChange={(o) => {
          setAdding(o);
          if (!o && searchParams.get("new")) setParams({ new: null });
        }}
        contacts={w.contacts}
        returnFocusRef={addTrigger}
        onSaved={(id) => id && router.push(`/dashboard/contacts/${id}`)}
      />
      <ImportDialog open={importing} onOpenChange={setImporting} w={w} />
    </div>
  );
}

const ROLE_BY_WORD: Record<string, Role> = {
  parent: "parent",
  teacher: "teacher",
  provider: "provider",
  employer: "employer",
  "self-advocate": "self-advocate",
  "self advocate": "self-advocate",
};

/** Parse simple CSV: name,email,phone,role (header row optional). */
function parseCsv(text: string): ContactInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const cells = (l: string) =>
    l
      .match(/("([^"]|"")*"|[^,]*)(,|$)/g)
      ?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
  const rows = lines.map(cells);
  const body = rows[0]?.[0]?.toLowerCase() === "name" ? rows.slice(1) : rows;
  return body.map(([name = "", email = "", phone = "", role = ""]) => ({
    name,
    email,
    phone,
    role: ROLE_BY_WORD[role.toLowerCase()] ?? "parent",
    address: "",
    region: "Riverbend",
    inRegion: true,
  }));
}

function ImportDialog({
  open,
  onOpenChange,
  w,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  w: Workspace;
}) {
  const [text, setText] = useState("");
  const parsed = text.trim() ? parseCsv(text) : [];
  const checked = parsed.map((p) => ({
    p,
    errors: validateContact(p),
    dup: findDuplicate(w.contacts, p.email, p.phone),
  }));
  const ok = checked.filter((r) => !r.errors.length && !r.dup);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setText("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import contacts from CSV</DialogTitle>
          <DialogDescription>
            Columns: name, email, phone, role. Duplicates and rows with problems are skipped.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="csv-file">Choose a CSV file</Label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setText(await f.text());
            }}
            className={`text-[15px] file:mr-3 file:h-11 file:rounded-md file:border file:border-border file:bg-white file:px-3 ${focusRing}`}
          />
          <Label htmlFor="csv-text" className="mt-2">
            Or paste it here
          </Label>
          <Textarea
            id="csv-text"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"name,email,phone,role\nRosa Lind,rosa@example.com,(555) 019-2211,parent"}
            className={`font-mono text-sm ${focusRing}`}
          />
        </div>
        {checked.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-[15px]">
              <caption className="sr-only">Import preview</caption>
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th scope="col" className="p-2">
                    Name
                  </th>
                  <th scope="col" className="p-2">
                    Email
                  </th>
                  <th scope="col" className="p-2">
                    Role
                  </th>
                  <th scope="col" className="p-2">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {checked.map(({ p, errors, dup }, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-2">{p.name || "—"}</td>
                    <td className="p-2">{p.email || "—"}</td>
                    <td className="p-2">{ROLE_LABEL[p.role]}</td>
                    <td className="p-2">
                      {errors.length ? (
                        <StatusText tone="danger">{errors[0].message}</StatusText>
                      ) : dup ? (
                        <StatusText tone="warning">Already exists: {dup.name}</StatusText>
                      ) : (
                        <StatusText tone="success">Will be added</StatusText>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={`h-11 px-4 ${focusRing}`}
          >
            Cancel
          </Button>
          <Button
            disabled={!ok.length}
            onClick={() => {
              const res = useContactsStore.getState().addMany(ok.map((r) => r.p));
              if (
                notifyResult(res, {
                  success: `${ok.length} ${ok.length === 1 ? "contact" : "contacts"} imported.`,
                  undone: "Import undone",
                })
              ) {
                setText("");
                onOpenChange(false);
              }
            }}
            className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
          >
            Import {ok.length || ""} {ok.length === 1 ? "contact" : "contacts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
