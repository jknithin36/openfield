import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ContactsList } from "@/components/dashboard/contacts/contacts-list";

// Contacts: "Everything we know about this person, in one place."
export default function ContactsPage() {
  return (
    <Suspense fallback={<PageHeader title="Contacts" description="Loading…" />}>
      <ContactsList />
    </Suspense>
  );
}
