"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  Database01Icon,
  SlidersHorizontalIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardStore, ROLE_LABELS, type DashboardRole } from "@/store/dashboard";
import { useEventsStore } from "@/store/events";
import { useLibraryStore } from "@/store/library";
import { exportAll, importAll, resetAllDemoData } from "@/store/reset";
import { useSettingsStore } from "@/store/settings";
import type { AccommodationType, OrganizationSettings, StaffRole } from "@/lib/types";
import { relativeDay } from "@/lib/format";
import { ACC_TYPE_LABEL } from "@/lib/events/selectors";
import { parseOne } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { announce } from "@/components/dashboard/shared/announcer";
import { ErrorSummary, type FormError } from "@/components/dashboard/shared/form-errors";
import { focusRing, RadioField, TextField } from "@/components/dashboard/shared/fields";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { useWorkspace, type Workspace } from "@/components/dashboard/shared/use-workspace";

const SECTIONS = ["organization", "staff", "rules", "demo"] as const;
type Section = (typeof SECTIONS)[number];
const SECTION: Record<Section, { label: string; hint: string; icon: typeof UserGroupIcon }> = {
  organization: {
    label: "Organization",
    hint: "Name and contact details on the website",
    icon: Building03Icon,
  },
  staff: { label: "Staff and roles", hint: "Who can use the dashboard", icon: UserGroupIcon },
  rules: { label: "Rules", hint: "Loans, events, inbox and guides", icon: SlidersHorizontalIcon },
  demo: { label: "Demo data", hint: "Reset, export and import", icon: Database01Icon },
};
const primary = `h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`;
const whole = (s: string) => (/^\d+$/.test(s.trim()) ? Number(s) : NaN);

export function SettingsView() {
  const w = useWorkspace();
  return w ? <Settings w={w} /> : <PageHeader title="Settings" description="Loading…" />;
}

function Settings({ w }: { w: Workspace }) {
  const { searchParams, hrefWith } = useUrlState();
  const section = parseOne(searchParams.get("section"), SECTIONS, "organization");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Settings" }]}
        title="Settings"
        description="Only admins can see this page. Changes apply straight away and can be undone."
      />
      <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-6">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {SECTIONS.map((s) => {
              const current = s === section;
              return (
                <li key={s} className="shrink-0">
                  <Link
                    href={hrefWith({ section: s === "organization" ? null : s })}
                    scroll={false}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-11 items-start gap-3 rounded-lg px-3 py-2.5 outline-none ${focusRing} ${current ? "bg-brand-soft text-brand" : "text-neutral-700 hover:bg-neutral-100"}`}
                  >
                    <HugeiconsIcon
                      icon={SECTION[s].icon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0"
                    />
                    <span className="flex flex-col">
                      <span className="text-[15px] font-medium">{SECTION[s].label}</span>
                      <span
                        className={`hidden text-sm lg:block ${current ? "text-brand/80" : "text-neutral-600"}`}
                      >
                        {SECTION[s].hint}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0">
          {section === "organization" && (
            <Organization key={JSON.stringify(w.settings.org)} w={w} />
          )}
          {section === "staff" && <StaffSection w={w} />}
          {section === "rules" && (
            <Rules
              key={JSON.stringify([
                w.lib.settings,
                w.ev.data.settings,
                w.settings.inboxRules,
                w.settings.contentRules,
              ])}
              w={w}
            />
          )}
          {section === "demo" && <Demo w={w} />}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`p-${title}`}
      className="rounded-xl border border-border bg-white p-6"
    >
      <h2 id={`p-${title}`} className="text-lg font-medium text-ink">
        {title}
      </h2>
      {description && <p className="mt-1 text-[15px] text-neutral-600">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

// ── Organization ──────────────────────────────────────────────────────────
function Organization({ w }: { w: Workspace }) {
  const [f, setF] = useState<OrganizationSettings>(w.settings.org);
  const [errors, setErrors] = useState<FormError[]>([]);
  const set = (k: keyof OrganizationSettings) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const save = () => {
    const errs: FormError[] = [];
    if (!f.name.trim())
      errs.push({ fieldId: "org-name", message: "Enter the organization's name" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
      errs.push({
        fieldId: "org-email",
        message: "Enter an email address in the right format, like help@example.com",
      });
    if (!f.phone.trim()) errs.push({ fieldId: "org-phone", message: "Enter a phone number" });
    setErrors(errs);
    if (!errs.length)
      notifyResult(useSettingsStore.getState().setOrg(f), {
        success: "Organization details saved. The website shows them now.",
        undone: "Previous details restored",
      });
  };
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-6"
    >
      <ErrorSummary errors={errors} />
      <Panel
        title="Organization"
        description="Shown in the website header, footer and contact page, and on printed reports."
      >
        <div className="flex flex-col gap-5">
          <TextField
            id="org-name"
            label="Name"
            value={f.name}
            onChange={set("name")}
            error={err("org-name")}
          />
          <TextField
            id="org-tagline"
            label="Tagline"
            value={f.tagline}
            onChange={set("tagline")}
            hint="One line under the name in the footer."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="org-email"
              label="Email"
              type="email"
              inputMode="email"
              value={f.email}
              onChange={set("email")}
              error={err("org-email")}
            />
            <TextField
              id="org-phone"
              label="Phone"
              type="tel"
              inputMode="tel"
              value={f.phone}
              onChange={set("phone")}
              error={err("org-phone")}
            />
          </div>
          <TextField id="org-address" label="Address" value={f.address} onChange={set("address")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="org-hours"
              label="Opening hours"
              value={f.hours}
              onChange={set("hours")}
              hint="For example: Mon–Fri, 9 am–5 pm"
            />
            <TextField
              id="org-region"
              label="Service region"
              value={f.regionName}
              onChange={set("regionName")}
              hint="Who can borrow from the library."
            />
          </div>
        </div>
      </Panel>
      <Button type="submit" className={`${primary} w-fit`}>
        Save organization details
      </Button>
    </form>
  );
}

// ── Staff ─────────────────────────────────────────────────────────────────
function StaffSection({ w }: { w: Workspace }) {
  const [inviting, setInviting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole | "">("");
  const [errors, setErrors] = useState<FormError[]>([]);
  const [changing, setChanging] = useState<{ id: string; role: StaffRole } | null>(null);
  const store = () => useSettingsStore.getState();
  const staff = [...w.settings.staff].sort(
    (a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name),
  );
  const now = new Date();
  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const person = changing && w.settings.staff.find((s) => s.id === changing.id);

  const invite = () => {
    const errs: FormError[] = [];
    if (!name.trim()) errs.push({ fieldId: "inv-name", message: "Enter their name" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.push({
        fieldId: "inv-email",
        message: "Enter an email address in the right format, like name@example.com",
      });
    if (!role) errs.push({ fieldId: "inv-role", message: "Choose what they can do" });
    setErrors(errs);
    if (errs.length || !role) return;
    if (
      notifyResult(store().invite(name, email, role), {
        success: `${name.trim()} invited as ${ROLE_LABELS[role].toLowerCase()}.`,
        undone: "Invite cancelled",
      })
    ) {
      setInviting(false);
      setName("");
      setEmail("");
      setRole("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Staff and roles"
        description="Each role sees only the sections it needs. Admins see everything."
      >
        <div className="mb-4 grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
          <p>
            <span className="font-medium text-ink">Library staff:</span> Library, Inbox, Contacts
          </p>
          <p>
            <span className="font-medium text-ink">Event coordinator:</span> Events, Inbox, Contacts
          </p>
          <p>
            <span className="font-medium text-ink">Content editor:</span> Courses, Family guides,
            Inbox, Contacts
          </p>
          <p>
            <span className="font-medium text-ink">Admin:</span> Everything, plus Reports and
            Settings
          </p>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {staff.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span
                aria-hidden="true"
                className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${s.active ? "bg-brand-soft text-brand" : "bg-neutral-100 text-neutral-500"}`}
              >
                {s.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div className="min-w-48 flex-1">
                <p className="text-[15px] font-medium text-ink">
                  {s.name}
                  {s.id === w.me?.id && (
                    <span className="font-normal text-neutral-600"> (you)</span>
                  )}
                </p>
                <p className="text-sm text-neutral-600">{s.email}</p>
              </div>
              <div className="w-40 text-[15px]">
                <p>{ROLE_LABELS[s.role]}</p>
                <p className="text-sm text-neutral-600">
                  {s.active ? (
                    `Active ${relativeDay(s.lastActiveAt, now)}`
                  ) : (
                    <StatusText tone="neutral" icon={false}>
                      Deactivated
                    </StatusText>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {s.active && (
                  <Button
                    variant="outline"
                    onClick={() => setChanging({ id: s.id, role: s.role })}
                    className={`h-11 px-3 ${focusRing}`}
                  >
                    Change role<span className="sr-only"> for {s.name}</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() =>
                    notifyResult(store().setActive(s.id, !s.active), {
                      success: s.active
                        ? `${s.name} deactivated. They can't sign in.`
                        : `${s.name} reactivated.`,
                      undone: "Undone",
                    })
                  }
                  className={`h-11 px-3 ${s.active ? "text-red-700 hover:text-red-800" : "text-brand"} ${focusRing}`}
                >
                  {s.active ? "Deactivate" : "Reactivate"}
                  <span className="sr-only"> {s.name}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <Button
          onClick={() => {
            setErrors([]);
            setInviting(true);
          }}
          className={`${primary} mt-5`}
        >
          Invite someone
        </Button>
      </Panel>

      <Dialog open={inviting} onOpenChange={setInviting}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite someone</DialogTitle>
            <DialogDescription>
              They&apos;ll get an email with a link to set up their account. (Demo: no email is
              sent.)
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            id="invite-form"
            onSubmit={(e) => {
              e.preventDefault();
              invite();
            }}
            className="flex flex-col gap-5"
          >
            <ErrorSummary errors={errors} />
            <TextField
              id="inv-name"
              label="Full name"
              value={name}
              onChange={setName}
              error={err("inv-name")}
              autoComplete="off"
            />
            <TextField
              id="inv-email"
              label="Work email"
              type="email"
              inputMode="email"
              value={email}
              onChange={setEmail}
              error={err("inv-email")}
              autoComplete="off"
            />
            <RadioField
              id="inv-role"
              legend="What can they do?"
              columns={1}
              value={role}
              options={ROLE_LABELS}
              onChange={setRole}
              error={err("inv-role")}
            />
          </form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviting(false)}
              className={`h-11 px-4 ${focusRing}`}
            >
              Cancel
            </Button>
            <Button type="submit" form="invite-form" className={primary}>
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!changing} onOpenChange={(o) => !o && setChanging(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change {person?.name}&apos;s role</DialogTitle>
            <DialogDescription>
              Their sidebar changes the next time they open the dashboard.
            </DialogDescription>
          </DialogHeader>
          {changing && (
            <RadioField
              id="chg-role"
              legend="Role"
              columns={1}
              value={changing.role}
              options={ROLE_LABELS}
              onChange={(r) => setChanging({ ...changing, role: r })}
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChanging(null)}
              className={`h-11 px-4 ${focusRing}`}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!changing || !person) return;
                if (
                  notifyResult(store().changeRole(changing.id, changing.role), {
                    success: `${person.name} is now ${ROLE_LABELS[changing.role].toLowerCase()}.`,
                    undone: "Role restored",
                  })
                )
                  setChanging(null);
              }}
              className={primary}
            >
              Save role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Rules ─────────────────────────────────────────────────────────────────
function Rules({ w }: { w: Workspace }) {
  const lib = w.lib.settings;
  const ev = w.ev.data.settings;
  const [f, setF] = useState({
    loanLimit: String(lib.loanLimitPerPerson),
    loanDays: String(lib.defaultLoanDays ?? 28),
    waiting: String(lib.waitingTargetDays),
    extensions: lib.extensionWeeks.join(", "),
    lead: Object.fromEntries(
      Object.entries(ev.leadTimeDays).map(([k, v]) => [k, String(v)]),
    ) as Record<AccommodationType, string>,
    reply: String(w.settings.inboxRules.replyTargetDays),
    review: String(w.settings.contentRules.guideReviewMonths),
    level: String(w.settings.contentRules.maxReadingLevel),
  });
  const [errors, setErrors] = useState<FormError[]>([]);
  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const set = (k: Exclude<keyof typeof f, "lead">) => (v: string) =>
    setF((p) => ({ ...p, [k]: v }));

  const save = () => {
    const errs: FormError[] = [];
    const n = (id: string, v: string, label: string, min: number, max: number) => {
      const x = whole(v);
      if (Number.isNaN(x) || x < min || x > max)
        errs.push({
          fieldId: id,
          message: `Enter ${label} as a whole number from ${min} to ${max}`,
        });
      return x;
    };
    const loanLimit = n("r-limit", f.loanLimit, "the loan limit", 1, 20);
    const loanDays = n("r-days", f.loanDays, "the loan length", 7, 120);
    const waiting = n("r-waiting", f.waiting, "the decision target", 0, 30);
    const ext = f.extensions
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number);
    if (!ext.length || ext.some((x) => !Number.isInteger(x) || x < 1 || x > 12))
      errs.push({
        fieldId: "r-ext",
        message: "Enter extension options as weeks, separated by commas, like 1, 2, 4",
      });
    const lead = Object.fromEntries(
      (Object.keys(f.lead) as AccommodationType[]).map((k) => [
        k,
        n(`r-lead-${k}`, f.lead[k], `days for ${ACC_TYPE_LABEL[k].toLowerCase()}`, 0, 60),
      ]),
    ) as Record<AccommodationType, number>;
    const reply = n("r-reply", f.reply, "the reply target", 1, 14);
    const review = n("r-review", f.review, "the review cycle", 1, 36);
    const level = n("r-level", f.level, "the reading level", 3, 16);
    setErrors(errs);
    if (errs.length) return;
    const results = [
      useLibraryStore.getState().setSettings({
        ...lib,
        loanLimitPerPerson: loanLimit,
        defaultLoanDays: loanDays,
        waitingTargetDays: waiting,
        extensionWeeks: [...new Set(ext)].sort((a, b) => a - b),
      }),
      useEventsStore.getState().setSettings({ ...ev, leadTimeDays: lead }),
      useSettingsStore.getState().setInboxRules({ replyTargetDays: reply }),
      useSettingsStore
        .getState()
        .setContentRules({ guideReviewMonths: review, maxReadingLevel: level }),
    ];
    const bad = results.find((r) => !r.ok);
    if (bad && !bad.ok) return notifyResult(bad, { success: "" });
    notifyResult(
      { ok: true, undoId: results.map((r) => (r.ok ? r.undoId : "")).join("|") },
      {
        success: "Rules saved. Counts and badges use them now.",
        undone: "Previous rules restored",
      },
    );
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-6"
    >
      <ErrorSummary errors={errors} />
      <Panel title="Lending library">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="r-limit"
            label="Items per person at once"
            inputMode="numeric"
            value={f.loanLimit}
            onChange={set("loanLimit")}
            error={err("r-limit")}
          />
          <TextField
            id="r-days"
            label="Loan length for new items (days)"
            inputMode="numeric"
            value={f.loanDays}
            onChange={set("loanDays")}
            error={err("r-days")}
          />
          <TextField
            id="r-waiting"
            label="Decide on requests within (days)"
            inputMode="numeric"
            value={f.waiting}
            onChange={set("waiting")}
            error={err("r-waiting")}
            hint="Older requests show as late."
          />
          <TextField
            id="r-ext"
            label="Extension options (weeks)"
            value={f.extensions}
            onChange={set("extensions")}
            error={err("r-ext")}
            hint="Separate with commas, like 1, 2, 4"
          />
        </div>
      </Panel>
      <Panel
        title="Event accommodations"
        description="How many days before an event each one must be booked. Later requests show as overdue."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(f.lead) as AccommodationType[]).map((k) => (
            <TextField
              key={k}
              id={`r-lead-${k}`}
              label={`${ACC_TYPE_LABEL[k]} (days)`}
              inputMode="numeric"
              value={f.lead[k]}
              onChange={(v) => setF((p) => ({ ...p, lead: { ...p.lead, [k]: v } }))}
              error={err(`r-lead-${k}`)}
            />
          ))}
        </div>
      </Panel>
      <Panel title="Inbox and guides">
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            id="r-reply"
            label="Reply to messages within (days)"
            inputMode="numeric"
            value={f.reply}
            onChange={set("reply")}
            error={err("r-reply")}
          />
          <TextField
            id="r-review"
            label="Review guides every (months)"
            inputMode="numeric"
            value={f.review}
            onChange={set("review")}
            error={err("r-review")}
          />
          <TextField
            id="r-level"
            label="Highest reading grade"
            inputMode="numeric"
            value={f.level}
            onChange={set("level")}
            error={err("r-level")}
            hint="8 is a good target for families."
          />
        </div>
      </Panel>
      <Button type="submit" className={`${primary} w-fit`}>
        Save rules
      </Button>
    </form>
  );
}

// ── Demo ──────────────────────────────────────────────────────────────────
function Demo({ w }: { w: Workspace }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [importError, setImportError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const setRole = useDashboardStore((s) => s.setRole);

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="View the dashboard as"
        description="Try each role to see what that person sees. This only changes your view."
      >
        <RadioField<DashboardRole>
          id="demo-role"
          legend="Role"
          value={w.role}
          options={ROLE_LABELS}
          onChange={(r) => {
            setRole(r);
            announce(`Now viewing as ${ROLE_LABELS[r].toLowerCase()}.`);
            if (r !== "admin") router.push("/dashboard");
          }}
        />
      </Panel>

      <Panel
        title="Export and import"
        description="Save everything to a JSON file, or load a file you saved before."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([JSON.stringify(exportAll(), null, 2)], {
                type: "application/json",
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `openfield-demo-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
              announce("Export downloaded.");
            }}
            className={`h-11 px-4 ${focusRing}`}
          >
            Export all data
          </Button>
          <Button
            variant="outline"
            onClick={() => file.current?.click()}
            className={`h-11 px-4 ${focusRing}`}
          >
            Import a file
          </Button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              let parsed: unknown;
              try {
                parsed = JSON.parse(await f.text());
              } catch {
                parsed = null;
              }
              const problem = importAll(parsed);
              setImportError(problem ?? "");
              announce(problem ?? "Data imported.");
              if (!problem) toast(`Imported ${f.name}.`);
            }}
          />
        </div>
        {importError && (
          <p role="alert" className="mt-3 text-[15px] font-semibold text-red-700">
            <span className="sr-only">Error: </span>
            {importError}
          </p>
        )}
      </Panel>

      <Panel
        title="Start again"
        description="Put back the original demo data. Everything you changed is lost, and it can't be undone."
      >
        <Button
          onClick={() => setConfirm(true)}
          className={`h-11 bg-red-700 px-4 text-white hover:bg-red-800 ${focusRing}`}
        >
          Reset all demo data
        </Button>
      </Panel>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
            <AlertDialogDescription>
              Loans, events, messages, contacts, courses, guides and settings go back to how they
              started. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={`h-11 px-4 ${focusRing}`}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetAllDemoData();
                announce("Demo data reset.");
                toast("Demo data reset.");
              }}
              className={`h-11 bg-red-700 px-4 text-white hover:bg-red-800 ${focusRing}`}
            >
              Reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
