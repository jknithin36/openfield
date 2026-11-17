"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
import { useContactsStore } from "@/store/contacts";
import { useInboxStore } from "@/store/inbox";
import type { Contact, MessageTopic } from "@/lib/types";
import { TOPIC_LABEL } from "@/lib/inbox/selectors";
import { ROLE_LABEL } from "@/lib/library/views";
import { ErrorSummary, type FormError } from "@/components/dashboard/shared/form-errors";
import {
  focusRing,
  RadioField,
  SelectField,
  TextField,
} from "@/components/dashboard/shared/fields";
import { notifyResult } from "@/components/dashboard/shared/notify";

/** "+ Log a phone call": pick or create a contact, topic, summary → message. */
export function LogCallDialog({
  open,
  onOpenChange,
  contacts,
  presetContactId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contacts: Contact[];
  presetContactId?: string;
}) {
  const router = useRouter();
  const preset = presetContactId ? contacts.find((c) => c.id === presetContactId) : undefined;
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(presetContactId ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState<MessageTopic | "">("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);
  const results = q.trim()
    ? contacts
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q.toLowerCase()) ||
            c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "~"),
        )
        .slice(0, 6)
    : [];
  const reset = () => {
    setMode("existing");
    setQ("");
    setPicked(presetContactId ?? "");
    setName("");
    setPhone("");
    setTopic("");
    setSubject("");
    setBody("");
    setErrors([]);
  };

  const submit = () => {
    const errs: FormError[] = [];
    if (!preset && mode === "existing" && !picked)
      errs.push({ fieldId: "call-search", message: "Find and choose who called" });
    if (!preset && mode === "new" && !name.trim())
      errs.push({ fieldId: "call-name", message: "Enter the caller's name" });
    if (!topic) errs.push({ fieldId: "call-topic", message: "Choose a topic" });
    if (!subject.trim())
      errs.push({ fieldId: "call-subject", message: "Enter a short summary of the call" });
    setErrors(errs);
    if (errs.length || !topic) return;
    let contact = preset ?? contacts.find((c) => c.id === picked);
    if (!preset && mode === "new") {
      const res = useContactsStore.getState().addContact({
        name,
        role: "parent",
        email: "",
        phone,
        address: "",
        region: "Riverbend",
        inRegion: true,
      });
      if (!res.ok || !res.id)
        return setErrors([
          { fieldId: "call-name", message: res.ok ? "Couldn't add the contact." : res.reason },
        ]);
      contact = useContactsStore.getState().data?.contacts.find((c) => c.id === res.id);
    }
    if (!contact) return;
    const res = useInboxStore.getState().create({
      contactId: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      topic,
      subject: `Phone call: ${subject.trim()}`,
      body,
      source: "phone",
    });
    if (
      notifyResult(res, {
        success: `Call with ${contact.name} logged.`,
        undone: "Call log removed",
      })
    ) {
      reset();
      onOpenChange(false);
      if (res.ok && res.id) router.push(`/dashboard/inbox?status=all&id=${res.id}`);
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
          <DialogTitle>Log a phone call</DialogTitle>
          <DialogDescription>
            {preset
              ? `Call with ${preset.name}.`
              : "It goes to the inbox so the team can follow up."}
          </DialogDescription>
        </DialogHeader>
        <ErrorSummary errors={errors} />
        {!preset && (
          <>
            <RadioField
              id="call-mode"
              legend="Who called?"
              value={mode}
              options={{ existing: "Someone we know", new: "A new person" }}
              onChange={setMode}
            />
            {mode === "existing" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="call-search">Find by name or phone</Label>
                {err("call-search") && (
                  <p className="text-sm font-semibold text-red-700">
                    <span className="sr-only">Error: </span>
                    {err("call-search")}
                  </p>
                )}
                <Input
                  id="call-search"
                  type="search"
                  autoComplete="off"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPicked("");
                  }}
                  className={`h-11 text-base ${focusRing}`}
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
                          id={`call-p-${c.id}`}
                          className={`size-5 ${focusRing}`}
                        />
                        <Label
                          htmlFor={`call-p-${c.id}`}
                          className="flex flex-col items-start font-normal"
                        >
                          <span className="font-medium text-ink">{c.name}</span>
                          <span className="text-sm text-neutral-600">
                            {ROLE_LABEL[c.role]}
                            {c.phone ? ` · ${c.phone}` : ""}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="call-name"
                  label="Name"
                  value={name}
                  onChange={setName}
                  error={err("call-name")}
                />
                <TextField
                  id="call-phone"
                  label="Phone (optional)"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                />
              </div>
            )}
          </>
        )}
        <SelectField
          id="call-topic"
          label="Topic"
          value={topic}
          options={TOPIC_LABEL}
          onChange={setTopic}
          placeholder="Choose a topic"
          error={err("call-topic")}
        />
        <TextField
          id="call-subject"
          label="Summary"
          hint="One line, e.g. “Wants to borrow two kits”."
          value={subject}
          onChange={setSubject}
          error={err("call-subject")}
        />
        <TextField
          id="call-body"
          label="Notes (optional)"
          value={body}
          onChange={setBody}
          multiline
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={`h-11 px-4 ${focusRing}`}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
          >
            Log the call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
