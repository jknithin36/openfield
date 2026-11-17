"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useContactsStore, type ContactInput } from "@/store/contacts";
import type { Contact, Role } from "@/lib/types";
import { findDuplicate } from "@/lib/contacts/selectors";
import { validateContact } from "@/lib/contacts/rules";
import { ROLE_LABEL } from "@/lib/library/views";
import { ErrorSummary, type FormError } from "@/components/dashboard/shared/form-errors";
import { focusRing, RadioField, TextField } from "@/components/dashboard/shared/fields";
import { notifyResult } from "@/components/dashboard/shared/notify";

const blank: ContactInput = {
  name: "",
  role: "parent",
  email: "",
  phone: "",
  address: "",
  region: "Riverbend",
  inRegion: true,
  tags: [],
  preferredContact: "email",
  accessibilityNeeds: "",
};

/** Add or edit a contact (side panel). Warns about duplicates by email/phone. */
export function ContactForm({
  open,
  onOpenChange,
  contact,
  contacts,
  onSaved,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contact?: Contact;
  contacts: Contact[];
  onSaved?: (id: string) => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const [v, setV] = useState<ContactInput>(blank);
  const [tags, setTags] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);
  const [allowDup, setAllowDup] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Fill the form each time it opens (during render, not in an effect).
  const openKey = open ? (contact?.id ?? "new") : null;
  const [filledFor, setFilledFor] = useState<string | null>(null);
  if (filledFor !== openKey) {
    setFilledFor(openKey);
    if (open) {
      setV(
        contact
          ? {
              name: contact.name,
              role: contact.role,
              email: contact.email,
              phone: contact.phone,
              address: contact.address,
              region: contact.region,
              inRegion: contact.inRegion,
              preferredContact: contact.preferredContact ?? "email",
              accessibilityNeeds: contact.accessibilityNeeds ?? "",
            }
          : blank,
      );
      setTags((contact?.tags ?? []).join(", "));
      setErrors([]);
      setAllowDup(false);
    }
  }

  const dup = findDuplicate(contacts, v.email, v.phone, contact?.id);
  const err = (f: string) => errors.find((e) => e.fieldId === `ct-${f}`)?.message;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateContact(v).map((x) => ({
      fieldId: `ct-${x.field}`,
      message: x.message,
    }));
    if (dup && !allowDup)
      errs.push({
        fieldId: "ct-dup",
        message: `${dup.name} already has this ${dup.email.toLowerCase() === v.email.trim().toLowerCase() ? "email" : "phone number"}. Open their record, or tick “Add anyway”.`,
      });
    setErrors(errs);
    if (errs.length) return;
    const input = {
      ...v,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const store = useContactsStore.getState();
    const res = contact ? store.updateContact(contact.id, input) : store.addContact(input);
    if (
      notifyResult(res, {
        success: contact ? `${v.name} saved.` : `${v.name} added.`,
        undone: "Undone",
      })
    ) {
      onOpenChange(false);
      const newId = "id" in res && typeof res.id === "string" ? res.id : "";
      onSaved?.(contact?.id ?? newId);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        initialFocus={titleRef}
        finalFocus={returnFocusRef}
        className="w-full gap-0 p-0 sm:max-w-lg"
      >
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6">
            <SheetTitle
              ref={titleRef}
              tabIndex={-1}
              className="pr-10 text-xl font-medium text-ink outline-none"
            >
              {contact ? `Edit ${contact.name}` : "Add contact"}
            </SheetTitle>
            <SheetDescription className="mt-1 text-[15px] text-neutral-700">
              Only record what the person is happy to share.
            </SheetDescription>
            <div className="mt-5 flex flex-col gap-5">
              <ErrorSummary errors={errors} />
              <TextField
                id="ct-name"
                label="Full name"
                value={v.name}
                onChange={(s) => setV({ ...v, name: s })}
                error={err("name")}
                autoComplete="off"
              />
              <RadioField
                id="ct-role"
                legend="Role"
                value={v.role}
                options={ROLE_LABEL as Record<Role, string>}
                onChange={(r) => setV({ ...v, role: r })}
              />
              <TextField
                id="ct-email"
                label="Email"
                type="email"
                value={v.email}
                onChange={(s) => setV({ ...v, email: s })}
                error={err("email")}
              />
              <TextField
                id="ct-phone"
                label="Phone"
                type="tel"
                value={v.phone}
                onChange={(s) => setV({ ...v, phone: s })}
              />
              {dup && (
                <div
                  id="ct-dup"
                  tabIndex={-1}
                  className="rounded-md border border-amber-300 bg-amber-50 p-3 text-[15px] text-amber-950 outline-none"
                >
                  <p>
                    <strong>{dup.name}</strong> already has this{" "}
                    {dup.email.toLowerCase() === v.email.trim().toLowerCase()
                      ? "email"
                      : "phone number"}
                    .{" "}
                    <Link
                      href={`/dashboard/contacts/${dup.id}`}
                      className={`rounded-sm font-medium text-brand underline underline-offset-4 outline-none ${focusRing}`}
                    >
                      Open their record
                    </Link>
                  </p>
                  <div className="mt-2 flex min-h-11 items-center gap-2.5">
                    <Checkbox
                      id="ct-allow-dup"
                      checked={allowDup}
                      onCheckedChange={(c) => setAllowDup(c === true)}
                      className={`size-5 ${focusRing}`}
                    />
                    <Label htmlFor="ct-allow-dup" className="font-normal">
                      Add anyway (it&apos;s a different person)
                    </Label>
                  </div>
                </div>
              )}
              <TextField
                id="ct-address"
                label="Address"
                value={v.address}
                onChange={(s) => setV({ ...v, address: s })}
              />
              <RadioField
                id="ct-region"
                legend="Region"
                value={v.inRegion ? "in" : "out"}
                options={{ in: "Riverbend region", out: "Outside the region" }}
                onChange={(r) =>
                  setV({
                    ...v,
                    inRegion: r === "in",
                    region:
                      r === "in" ? "Riverbend" : v.region === "Riverbend" ? "Outside" : v.region,
                  })
                }
              />
              <RadioField
                id="ct-pref"
                legend="Preferred contact"
                value={v.preferredContact ?? "email"}
                options={{
                  email: "Email",
                  phone: "Phone",
                  text: "Text message",
                }}
                onChange={(p) => setV({ ...v, preferredContact: p })}
                columns={3}
              />
              <TextField
                id="ct-needs"
                label="Accessibility needs (optional)"
                hint="Only what the person chose to share, e.g. “Prefers large print”."
                value={v.accessibilityNeeds ?? ""}
                onChange={(s) => setV({ ...v, accessibilityNeeds: s })}
              />
              <TextField
                id="ct-tags"
                label="Tags (optional)"
                hint="Separate with commas, e.g. speech therapist, school district"
                value={tags}
                onChange={setTags}
              />
            </div>
          </div>
          <footer className="flex gap-2 border-t border-border bg-white px-5 py-4">
            <Button
              type="submit"
              className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
            >
              {contact ? "Save changes" : "Add contact"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={`h-11 px-4 ${focusRing}`}
            >
              Cancel
            </Button>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}
