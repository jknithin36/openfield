// Single source of truth for site content used by the home page sections and
// the header search. PLACEHOLDER DATA — replace with real content before launch.

export const PAGES = [
  { href: "/centers", label: "Topics", hint: "Find help by topic" },
  { href: "/learn", label: "Learn", hint: "Courses and webinars" },
  { href: "/library", label: "Library", hint: "Borrow books and devices" },
  { href: "/events", label: "Events", hint: "Conference, webinars, workshops" },
  { href: "/families", label: "Families", hint: "Guides for parents" },
  { href: "/about", label: "About", hint: "Who we are" },
  { href: "/contact", label: "Contact us", hint: "Get in touch" },
  { href: "/donate", label: "Donate", hint: "Keep our help free" },
] as const;

export const LIBRARY_ITEMS = [
  {
    slug: "talk-easy-tablet",
    name: "Talk-Easy Tablet",
    type: "Device",
    available: true,
    status: "Available",
    loan: "6-week loan",
  },
  {
    slug: "sensory-starter-kit",
    name: "Sensory Starter Kit",
    type: "Kit",
    available: false,
    status: "On loan – back Feb 9",
    loan: "4-week loan",
  },
  {
    slug: "visual-schedule-kit",
    name: "Visual Schedule Kit",
    type: "Kit",
    available: true,
    status: "Available",
    loan: "4-week loan",
  },
  {
    slug: "every-learner-belongs",
    name: "Every Learner Belongs",
    type: "Book",
    available: true,
    status: "Available",
    loan: "4-week loan",
  },
] as const;

export const EVENTS = [
  {
    slug: "getting-ready-for-an-iep-meeting",
    image: "/events/webinar-iep.jpg",
    alt: "A smiling young woman waves at a video call on her laptop.",
    date: "2026-12-03",
    day: "Thu, Dec 3",
    title: "Getting ready for an IEP meeting",
    description: "What to bring, which questions to ask, and your rights.",
    type: "Webinar",
    details: "Webinar · 7–8 pm ET · Online · Free",
  },
  {
    slug: "try-it-day-communication-devices",
    image: "/events/try-it-day-tablet.jpg",
    alt: "A smiling girl in a rainbow headband uses a tablet at a table.",
    date: "2026-12-10",
    day: "Thu, Dec 10",
    title: "Try-it day: communication devices",
    description: "Try devices with our specialists before you borrow one.",
    type: "Workshop",
    details: "Workshop · 10 am–1 pm ET · In person · Free",
  },
  {
    slug: "planning-for-life-after-high-school",
    image: "/events/after-high-school.jpg",
    alt: "A young woman holding a notebook smiles in a busy classroom.",
    date: "2027-01-14",
    day: "Thu, Jan 14",
    title: "Planning for life after high school",
    description: "Work, college and benefits: a plan for the years after 18.",
    type: "Webinar",
    details: "Webinar · 6:30–7:30 pm ET · Online · Free",
  },
  {
    slug: "openfield-annual-conference",
    image: "/events/conference.jpg",
    alt: "A large audience listens to a talk at a conference.",
    date: "2027-03-04",
    day: "Mar 4–5, 2027",
    title: "Openfield Annual Conference 2027",
    description: "Two days of talks and workshops on autism and disability.",
    type: "Conference",
    details: "Conference · In person and livestreamed",
  },
] as const;

/** Photos for events, by slug. Events without one show a plain date block. */
/** Events without a photo reuse the closest course illustration. */
const EVENT_ILLUSTRATION: Record<string, { file: string; alt: string }> = {
  "calm-spaces-at-home": {
    file: "calm-down-strategies-at-home",
    alt: "A child rests on a big cushion under a soft tent, with a glowing lamp and a sand timer nearby.",
  },
  "family-night-iep-meetings": {
    file: "writing-a-good-iep-goal",
    alt: "Three people sit around a table with one shared sheet of paper, below three steps leading to a flag.",
  },
  "sign-language-for-families": {
    file: "sign-language-basics-for-families",
    alt: "A parent and a child sit facing each other, using their hands to sign.",
  },
  "coffee-morning-for-dads": {
    file: "supporting-siblings",
    alt: "Two children sit side by side, one with an arm around the other, with a parent behind them.",
  },
  "visual-supports-in-the-classroom-workshop": {
    file: "visual-supports-in-the-classroom",
    alt: "A teacher points to a column of picture cards while two children sit and watch.",
  },
  "assistive-tech-open-house": {
    file: "switch-access-for-beginners",
    alt: "A child in a wheelchair presses a large button switch connected to a laptop showing a star.",
  },
};

/** Pictures for events, by slug: a photo, or a matching course illustration. */
export const EVENT_IMAGE: Record<string, { src: string; alt: string }> = {
  ...Object.fromEntries(
    Object.entries(EVENT_ILLUSTRATION).map(([slug, x]) => [
      slug,
      { src: `/learn/courses/${x.file}.webp`, alt: x.alt },
    ]),
  ),
  ...Object.fromEntries(EVENTS.map((e) => [e.slug, { src: e.image, alt: e.alt }])),
};

export const FAMILY_GUIDES = [
  { href: "/families/just-got-a-diagnosis", label: "Just got a diagnosis" },
  { href: "/families/starting-school", label: "Starting school" },
  { href: "/families/teen-years", label: "Teen years" },
  { href: "/families/turning-18", label: "Turning 18" },
] as const;
