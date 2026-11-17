// Library data model — the single source of truth for every Library page.
// DEMO ONLY: all people, places and items are fictional.

export type ItemType = "device" | "kit" | "book" | "video" | "assessment";

export type Role = "parent" | "teacher" | "provider" | "employer" | "self-advocate";

/** Topic center slugs (match the public site's centers). */
export type CenterSlug =
  | "autism"
  | "assistive-technology"
  | "early-childhood"
  | "inclusive-learning"
  | "life-transitions"
  | "deaf-blind"
  | "family-support";

/**
 * The loan journey. One state machine; every page is a view of it.
 *
 * waiting ─approve─▶ approved ─ship/pickup─▶ on-loan ─check in─▶ returned ─checked─▶ closed
 *    ├─waitlist─▶ waitlisted                    └─mark lost─▶ lost  └─needs repair─▶ in-repair ─▶ closed
 *    └─decline──▶ declined
 */
export type RequestStatus =
  | "waiting"
  | "waitlisted"
  | "approved"
  | "on-loan"
  | "returned"
  | "in-repair"
  | "closed"
  | "declined"
  | "lost";

export type Delivery = "ship" | "pickup";
export type ReminderChannel = "email" | "phone";
export type ReturnCondition = "good" | "needs-repair";
export type DeclineReason = "not-eligible" | "not-suitable" | "duplicate" | "other";

export type Reminder = {
  at: string;
  channel: ReminderChannel;
  /** "auto" or a staff member's name. */
  by: string;
};

export type ReturnCheck = {
  partsReturned: string[];
  condition: ReturnCondition;
  cleaned: boolean;
  notes?: string;
  checkedBy?: string;
  checkedAt?: string;
};

export type LibraryItem = {
  id: string;
  slug: string;
  name: string;
  type: ItemType;
  center: CenterSlug;
  description: string;
  ageRange: string;
  loanDays: number;
  maxExtensions: number;
  copies: number;
  parts: string[];
  archived: boolean;
  addedAt: string;
};

export type ContactNote = { id: string; at: string; by: string; body: string };

export type Contact = {
  id: string;
  name: string;
  role: Role;
  email: string;
  phone: string;
  address: string;
  region: string;
  inRegion: boolean;
  // Profile fields (filled in by the contacts store)
  tags?: string[];
  preferredContact?: "email" | "phone" | "text";
  /** Free text the person chose to share, e.g. "Prefers large print". */
  accessibilityNeeds?: string;
  consent?: { newsletter: boolean; storiesAndPhotos: boolean; changedAt?: string };
  createdAt?: string;
  notes?: ContactNote[];
};

/** All dates are ISO strings so they survive localStorage. */
export type LoanRequest = {
  id: string;
  itemId: string;
  contactId: string;
  note: string;
  delivery: Delivery;
  /** Where the request came from (older demo data has none = staff). */
  source?: "website" | "phone" | "staff";
  /** Shipping address given with the request. */
  shipTo?: string;
  status: RequestStatus;
  requestedAt: string;
  approvedAt?: string;
  shippedAt?: string;
  readyForPickupAt?: string;
  dueAt?: string;
  /** Total days added by extensions. */
  extendedBy?: number;
  /** Number of extensions granted (needed to enforce maxExtensions). */
  extensionCount?: number;
  returnedAt?: string;
  closedAt?: string;
  declineReason?: DeclineReason;
  declineNote?: string;
  lostNote?: string;
  /** Note when an item is retired from repair. */
  retireNote?: string;
  packedParts: string[];
  reminders: Reminder[];
  returnCheck?: ReturnCheck;
};

export type LibrarySettings = {
  /** Default loan length for new items (days). */
  defaultLoanDays?: number;
  loanLimitPerPerson: number;
  waitingTargetDays: number;
  extensionWeeks: number[];
};

export type LibraryData = {
  items: LibraryItem[];
  contacts: Contact[];
  requests: LoanRequest[];
  settings: LibrarySettings;
};

/** Every store action reports success or a plain-language reason. */
export type ActionResult = { ok: true; undoId: string } | { ok: false; reason: string };

export type RuleResult = { ok: true } | { ok: false; reason: string };

// ═══ Events ═════════════════════════════════════════════════════════════════
/**
 * Event:        draft ─publish─▶ published ─(end passes)─▶ completed
 *                                    └─cancel─▶ cancelled
 * Registration: registered ─check in─▶ attended (or no-show after the event)
 *                   ├─cancel─▶ cancelled (frees a seat → oldest waitlisted promoted)
 *               waitlisted ─promote─▶ registered
 * Accommodation: requested ─arrange─▶ arranged | ─can't arrange─▶ unable
 */
export type EventType = "conference" | "webinar" | "workshop" | "family-night";
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventFormat = "online" | "in-person" | "hybrid";
export type AccessFeature =
  "captions" | "asl" | "wheelchair-access" | "quiet-room" | "childcare" | "large-print";

export type EventReadiness = {
  venueConfirmed: boolean;
  materialsReady: boolean;
  remindersSent: boolean;
};

export type OFEvent = {
  id: string;
  slug: string;
  title: string;
  type: EventType;
  center: CenterSlug | null;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  format: EventFormat;
  venue?: { name: string; address: string };
  onlineLink?: string;
  seats: number;
  /** 0 = free */
  price: number;
  summary: string;
  description: string;
  accessibilityProvided: AccessFeature[];
  readiness: EventReadiness;
  followUp?: { sentAt: string; resourcesUrl?: string };
  cancelReason?: string;
};

export type RegistrationStatus = "registered" | "waitlisted" | "attended" | "no-show" | "cancelled";
export type RegistrationSource = "website" | "phone" | "staff";

export type Registration = {
  id: string;
  eventId: string;
  contactId: string;
  status: RegistrationStatus;
  registeredAt: string;
  checkedInAt?: string;
  cancelledAt?: string;
  source: RegistrationSource;
  notes?: string;
  /** People coming with them (each takes a seat). */
  guests?: number;
  /** Public booking reference, e.g. E-1042 (website bookings). */
  ref?: string;
};

export type AccommodationType =
  "asl" | "captions" | "wheelchair-space" | "childcare" | "large-print" | "quiet-room" | "other";
export type AccommodationStatus = "requested" | "arranged" | "unable";

export type AccommodationRequest = {
  id: string;
  registrationId: string;
  type: AccommodationType;
  details: string;
  status: AccommodationStatus;
  arrangedAt?: string;
  arrangedBy?: string;
  note?: string;
};

export type EventSettings = {
  /** Days before the event an accommodation must be booked. */
  leadTimeDays: Record<AccommodationType, number>;
  /** Most extra people one booking can bring (default 3). */
  maxGuests?: number;
};

export type EventsData = {
  events: OFEvent[];
  registrations: Registration[];
  accommodations: AccommodationRequest[];
  /** People added from Events (walk-ins, phone sign-ups). Library contacts are shared. */
  contacts: Contact[];
  settings: EventSettings;
};

// ═══ Inbox ══════════════════════════════════════════════════════════════════
export type MessageTopic =
  | "general"
  | "library"
  | "training"
  | "family-support"
  | "events"
  | "accessibility"
  | "volunteering"
  | "careers";
export type MessageSource = "website" | "phone" | "email";
export type MessageStatus = "unanswered" | "assigned" | "waiting-on-them" | "resolved";
export type Team = "library" | "events" | "family" | "content" | "admin";
export type ThreadEntry = { at: string; by: string; body: string };

export type Message = {
  id: string;
  /** null = unknown sender */
  contactId: string | null;
  name: string;
  email: string;
  phone?: string;
  topic: MessageTopic;
  subject: string;
  body: string;
  receivedAt: string;
  source: MessageSource;
  status: MessageStatus;
  assignedTo?: string;
  team?: Team;
  replies: ThreadEntry[];
  internalNotes: ThreadEntry[];
  resolvedAt?: string;
  /** Topic page it came from ("Ask the team"), so the Inbox can filter by it. */
  center?: CenterSlug;
};

// ═══ Centers (topic pages) ══════════════════════════════════════════════════
export type CenterPerson = { name: string; role: string; bio: string };
export type Center = {
  slug: CenterSlug;
  /** Plain, what people search for. */
  name: string;
  shortName: string;
  /** One sentence: what help you'll find here. */
  summary: string;
  whoItsFor: string[];
  startHere: Array<{ question: string; answer: string; link?: { label: string; href: string } }>;
  team: CenterPerson[];
  contactEmail: string;
  featuredGuideSlugs?: string[];
};

// ═══ Content ════════════════════════════════════════════════════════════════
export type CourseFormat = "course" | "mini-lesson" | "webinar-recording" | "toolkit";
export type CourseLevel = "intro" | "intermediate" | "advanced";
export type ContentStatus = "draft" | "published" | "archived";

export type Course = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  center: CenterSlug;
  format: CourseFormat;
  audiences: Role[];
  level: CourseLevel;
  lessons: Lesson[];
  /** "By the end you'll be able to…" */
  outcomes?: string[];
  author?: { name: string; role: string };
  resources?: Array<{ label: string; href: string; kind: "pdf" | "link"; size?: string }>;
  /** "Was this course useful?" answers from the public site. */
  feedback?: Array<{ at: string; useful: boolean; comment?: string }>;
  certificate: boolean;
  status: ContentStatus;
  featured: boolean;
  accessibility: {
    captions: boolean;
    transcript: boolean;
    plainLanguage: boolean;
    audioDescription: boolean;
  };
  enrollments: number;
  completions: number;
  /** Completions by audience, for the stats panel. */
  completionsByAudience?: Partial<Record<Role, number>>;
  rating?: number;
  updatedAt: string;
  reviewDueAt: string;
};

export type LessonType = "video" | "reading" | "activity" | "check";
export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  type?: LessonType;
  /** Markdown: ## headings, paragraphs, - lists, 1. lists, **bold**, "> " callouts. */
  body?: string;
  video?: { posterAlt: string; transcript: string; captionsAvailable: boolean };
  check?: {
    question: string;
    options: Array<{ id: string; text: string }>;
    correctId: string;
    explanation: string;
  };
  /** Activity lessons: a printable worksheet. */
  worksheet?: { label: string; href: string };
};

export type AgeStage = "diagnosis" | "birth-5" | "school-age" | "teen" | "adult";

export type FamilyGuide = {
  id: string;
  slug: string;
  title: string;
  ageStage: AgeStage;
  summary: string;
  /** Markdown */
  body: string;
  readMinutes: number;
  status: ContentStatus;
  /** Staff id */
  owner: string;
  lastReviewedAt: string;
  reviewEveryMonths: number;
  /** US school grade (Flesch-Kincaid) */
  readingLevel: number;
  helpfulYes: number;
  helpfulNo: number;
  comments: Array<{ at: string; body: string; helpful: boolean }>;
  reviewNotes?: ThreadEntry[];
  views: number;
};

// ═══ Settings ═══════════════════════════════════════════════════════════════
export type StaffRole = "admin" | "library" | "events" | "content";

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  team: Team;
  active: boolean;
  lastActiveAt: string;
};

export type OrganizationSettings = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
  regionName: string;
  social: { label: string; url: string }[];
};

export type InboxRules = { replyTargetDays: number };
export type ContentRules = { guideReviewMonths: number; maxReadingLevel: number };

// ═══ About pages ════════════════════════════════════════════════════════════
export type FundingKind = "government" | "foundation" | "individual" | "earned";
export type FundingYear = {
  year: number;
  sources: Array<{ name: string; kind: FundingKind; amount: number }>;
  costs: {
    library: number;
    training: number;
    events: number;
    familySupport: number;
    admin: number;
  };
};
export type Job = {
  id: string;
  title: string;
  team: string;
  hours: string;
  pay: string;
  location: string;
  /** YYYY-MM-DD */
  closingDate: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  adjustmentsNote: string;
};
export type AboutData = {
  story: string[];
  principles: Array<{ title: string; text: string }>;
  board: Array<{ name: string; role: string; background: string }>;
  advisoryGroup: { description: string; memberCount: number; meets: string };
  funding: FundingYear[];
  jobs: Job[];
  volunteerRoles: Array<{ title: string; commitment: string; summary: string }>;
  documents: Array<{ title: string; kind: string; size: string; year: number; href: string }>;
  /** Public role and one-line bio for dashboard staff, by staff id. */
  staffBios: Record<string, { role: string; bio: string }>;
};
