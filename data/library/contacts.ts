// 60 fictional contacts. A few live outside the Riverbend region.
import type { Contact, Role } from "@/lib/types";

const NAMES = [
  "Maria Lopez",
  "James Carter",
  "Aisha Khan",
  "Priya Nair",
  "Daniel Okafor",
  "Hannah Lee",
  "Marcus Bell",
  "Sofia Rossi",
  "Ethan Brooks",
  "Grace Kim",
  "Leo Martins",
  "Nora Walsh",
  "Olivia Grant",
  "Samuel Price",
  "Chloe Bennett",
  "Noah Fischer",
  "Amara Osei",
  "Lucas Moreau",
  "Zoe Turner",
  "Ibrahim Saleh",
  "Mia Novak",
  "Jonah Reyes",
  "Elena Petrova",
  "Owen Hughes",
  "Layla Haddad",
  "Theo Clarke",
  "Ruby Sandoval",
  "Felix Andersen",
  "Isla Murphy",
  "Kai Nakamura",
  "Freya Lindqvist",
  "Omar Farouk",
  "Tessa Wright",
  "Rafael Duarte",
  "Ava Kowalski",
  "Henry Adeyemi",
  "Lily Chen",
  "Mateo Alvarez",
  "Sienna Brooks",
  "Arjun Mehta",
  "Clara Dubois",
  "Elijah Ward",
  "Hana Yamamoto",
  "Victor Ionescu",
  "Maya Goldberg",
  "Rowan Fletcher",
  "Esther Mensah",
  "Dylan O'Connor",
  "Iris Holm",
  "Kofi Asante",
  "Bella Ricci",
  "Sami Haddad",
  "Nadia Karim",
  "Gabriel Costa",
  "Julia Weber",
  "Tomas Silva",
  "Leah Rosen",
  "Ravi Shah",
  "Anna Larsen",
  "Caleb Morgan",
];

const ROLES: Role[] = [
  "parent",
  "parent",
  "teacher",
  "provider",
  "parent",
  "employer",
  "self-advocate",
  "teacher",
];
const STREETS = [
  "Willow Lane",
  "Orchard Close",
  "Cedar Avenue",
  "Elm Court",
  "Meadow View",
  "Birch Row",
  "Linden Street",
  "Poplar Way",
  "Aspen Drive",
  "Rowan Street",
];

/** Contacts (by index) who live outside the region. */
const OUTSIDE: Record<number, string> = {
  6: "Eastvale",
  21: "Northport",
  37: "Eastvale",
  52: "Northport",
};

export function createContacts(): Contact[] {
  return NAMES.map((name, i) => {
    const [first, ...rest] = name.split(" ");
    const last = rest.join("").replace(/[^a-z]/gi, "");
    const region = OUTSIDE[i] ?? "Riverbend";
    const n = i + 1;
    return {
      id: `c${String(n).padStart(2, "0")}`,
      name,
      // Marcus Bell is a self-advocate; Ethan Brooks a parent, etc.
      role: i === 6 ? "self-advocate" : ROLES[i % ROLES.length],
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `(555) 01${n % 10}-${String(2000 + n * 37).padStart(4, "0")}`,
      address: `${((n * 7) % 90) + 2} ${STREETS[i % STREETS.length]}, ${region}`,
      region,
      inRegion: region === "Riverbend",
    };
  });
}
