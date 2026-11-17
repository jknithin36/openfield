// ~30 inbox messages. DEMO ONLY — fictional people. Dates relative to now.
import type {
  Contact,
  Message,
  MessageSource,
  MessageStatus,
  MessageTopic,
  Team,
} from "@/lib/types";

type Seed = {
  c: number | null;
  name?: string;
  email?: string;
  topic: MessageTopic;
  source: MessageSource;
  subject: string;
  body: string;
  ago: number;
  status: MessageStatus;
  team?: Team;
  assignedTo?: string;
  reply?: string;
  note?: string;
};

const SEEDS: Seed[] = [
  // Unanswered (5), oldest 3 days
  {
    c: 6,
    topic: "library",
    source: "website",
    subject: "Question about the sensory kit return",
    body: "Hi, we still have the Sensory Starter Kit. My daughter really likes the weighted lap pad. Is it possible to keep it a little longer, or buy one?",
    ago: 3,
    status: "unanswered",
  },
  {
    c: null,
    name: "Jordan Pike",
    email: "jordan.pike@example.com",
    topic: "training",
    source: "email",
    subject: "Training for our staff team",
    body: "I run a small after-school club. Do you offer training on inclusive activities for staff? We have about 8 people.",
    ago: 2.4,
    status: "unanswered",
  },
  {
    c: 3,
    topic: "accessibility",
    source: "website",
    subject: "Reasonable adjustments guide",
    body: "Is there a printable version of the workplace adjustments guide? I'd like to share it with our managers.",
    ago: 1.6,
    status: "unanswered",
  },
  {
    c: 11,
    topic: "library",
    source: "phone",
    subject: "Phone call: can I borrow two kits?",
    body: "Leo called asking if he can borrow the Visual Schedule Kit and the Calm-Down Corner Kit at the same time. Wants a call back.",
    ago: 1.2,
    status: "unanswered",
  },
  {
    c: 4,
    topic: "events",
    source: "website",
    subject: "Family night: ASL interpreter?",
    body: "My partner is Deaf. Will there be an ASL interpreter at Family night? We'd both like to come.",
    ago: 0.3,
    status: "unanswered",
  },
  // Assigned (8)
  {
    c: 9,
    topic: "library",
    source: "email",
    subject: "Returning the Big-Button Phone",
    body: "I'd like to return the phone first and keep the video set a bit longer. How do I get a new return label?",
    ago: 4,
    status: "assigned",
    team: "library",
    assignedTo: "s2",
    note: "Send a new label. He has 3 items out.",
  },
  {
    c: 14,
    topic: "training",
    source: "website",
    subject: "Certificate for the visual supports course",
    body: "I finished the course but can't find my certificate.",
    ago: 5,
    status: "assigned",
    team: "content",
    assignedTo: "s4",
  },
  {
    c: 20,
    topic: "events",
    source: "website",
    subject: "Can I bring my son to the Try-it day?",
    body: "He's 9 and uses a communication tablet. Is the event suitable for children?",
    ago: 3.5,
    status: "assigned",
    team: "events",
    assignedTo: "s3",
  },
  {
    c: 2,
    topic: "family-support",
    source: "phone",
    subject: "Phone call: IEP meeting next week",
    body: "James asked for help preparing for an IEP meeting next week. Wants the checklist and someone to talk to.",
    ago: 2.8,
    status: "assigned",
    team: "family",
  },
  {
    c: 33,
    topic: "library",
    source: "email",
    subject: "Lost reading pen",
    body: "I'm so sorry, I think I left the reading pen on the bus. What should I do?",
    ago: 47,
    status: "assigned",
    team: "library",
    assignedTo: "s2",
    reply:
      "Thanks for letting us know. Please check with the bus company's lost and found — we'll mark it lost if it doesn't turn up.",
  },
  {
    c: 25,
    topic: "general",
    source: "website",
    subject: "Volunteering",
    body: "Do you take volunteers? I'm a retired teacher.",
    ago: 6,
    status: "assigned",
    team: "admin",
    assignedTo: "s1",
  },
  {
    c: 12,
    topic: "library",
    source: "website",
    subject: "Fine motor kit request",
    body: "Just checking you got my request for the Fine Motor Kit.",
    ago: 0.8,
    status: "assigned",
    team: "library",
  },
  {
    c: 40,
    topic: "accessibility",
    source: "email",
    subject: "Large print materials",
    body: "Are your printed guides available in large print?",
    ago: 7,
    status: "assigned",
    team: "content",
    assignedTo: "s4",
  },
  // Waiting on them (2)
  {
    c: 7,
    topic: "library",
    source: "email",
    subject: "Switch interface request",
    body: "I sent a request for the Switch Interface Box. I live just outside Riverbend — can I still borrow it?",
    ago: 4,
    status: "waiting-on-them",
    team: "library",
    assignedTo: "s2",
    reply:
      "Thanks Marcus. Our library is for people in the Riverbend region, but we can sometimes help nearby. Can you tell us which town you live in?",
  },
  {
    c: 18,
    topic: "events",
    source: "website",
    subject: "Conference childcare",
    body: "Is there childcare at the conference?",
    ago: 8,
    status: "waiting-on-them",
    team: "events",
    assignedTo: "s3",
    reply: "Yes! How many children, and what ages? We'll book places for you.",
  },
  // Resolved (15)
  ...Array.from({ length: 15 }, (_, k): Seed => {
    const topics: MessageTopic[] = [
      "library",
      "training",
      "family-support",
      "events",
      "general",
      "accessibility",
    ];
    const subjects = [
      "Thank you for the tablet loan",
      "Course login help",
      "Respite care question",
      "Webinar recording",
      "Opening hours",
      "Accessible parking",
      "Return label",
      "Certificate name spelling",
      "Sibling support",
      "Event parking",
      "Address change",
      "Device setup help",
      "Guide translation",
      "Workshop slides",
      "Newsletter sign-up",
    ];
    const topic = topics[k % topics.length];
    return {
      c: k === 4 ? null : 41 + k,
      name: k === 4 ? "Morgan Reyes" : undefined,
      email: k === 4 ? "morgan.r@example.com" : undefined,
      topic,
      source: (["website", "email", "phone"] as MessageSource[])[k % 3],
      subject: subjects[k],
      body: `Hello, a quick question about ${subjects[k].toLowerCase()}. Thanks for your help.`,
      ago: 9 + k * 4,
      status: "resolved",
      team:
        topic === "library"
          ? "library"
          : topic === "events"
            ? "events"
            : topic === "training"
              ? "content"
              : "family",
      reply:
        "Thanks for getting in touch — here's what you need. Let us know if anything else comes up.",
    };
  }),
];

export function createMessages(contacts: Contact[], now: Date = new Date()): Message[] {
  const people = new Map(contacts.map((c) => [c.id, c]));
  const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();
  return SEEDS.map((m, i) => {
    const contact = m.c !== null ? people.get(`c${String(m.c).padStart(2, "0")}`) : undefined;
    const receivedAt = at(m.ago);
    return {
      id: `M-${String(i + 1).padStart(3, "0")}`,
      contactId: contact?.id ?? null,
      name: contact?.name ?? m.name ?? "Unknown",
      email: contact?.email ?? m.email ?? "",
      phone: contact?.phone,
      topic: m.topic,
      subject: m.subject,
      body: m.body,
      receivedAt,
      source: m.source,
      status: m.status,
      team: m.team,
      assignedTo: m.assignedTo,
      replies: m.reply
        ? [
            {
              at: at(Math.max(m.ago - 0.5, 0.1)),
              by:
                m.status === "resolved"
                  ? "Sam Morgan"
                  : m.assignedTo === "s3"
                    ? "Diego Marín"
                    : "Leah Okonjo",
              body: m.reply,
            },
          ]
        : [],
      internalNotes: m.note
        ? [{ at: at(Math.max(m.ago - 0.2, 0.05)), by: "Sam Morgan", body: m.note }]
        : [],
      resolvedAt: m.status === "resolved" ? at(Math.max(m.ago - 1, 0.1)) : undefined,
    };
  });
}
