// About pages. DEMO ONLY — every person, organization and amount is fictional.
import type { AboutData } from "@/lib/types";

export const ABOUT: AboutData = {
  story: [
    "Openfield was started in 2008 by a group of parents, teachers and therapists in the Riverbend region. They kept meeting the same problem: families were told to try a communication device, but couldn't afford to buy one just to find out if it worked.",
    "So they put the devices they had on a shelf in a school library and lent them out. Word spread. Parents asked for training, teachers asked for courses, and the shelf became a room, then a building.",
    "Today we're a regional center with a lending library, free courses, events and a family team. Everything we offer is still free for the people who use it.",
  ],
  principles: [
    {
      title: "Free at the point of use",
      text: "You never pay to borrow, learn or get advice from us. Some conference tickets have a small fee, and we waive it if it's a barrier.",
    },
    {
      title: "Plain language",
      text: "We write so anyone can understand us the first time. If something we wrote is unclear, tell us and we'll fix it.",
    },
    {
      title: "Built with disabled people",
      text: "Our advisory group of disabled people and parents reviews every new service before it launches, and is paid for their time.",
    },
    {
      title: "Based on evidence",
      text: "Our courses and guides are checked by specialists and reviewed at least once a year.",
    },
    {
      title: "Accessible by default",
      text: "Captions, transcripts, step-free venues and quiet rooms are standard, not extras you have to ask for.",
    },
  ],
  board: [
    {
      name: "Dr. Elaine Foster",
      role: "Chair",
      background: "Retired school principal and parent of an autistic adult",
    },
    {
      name: "Marcus Webb",
      role: "Vice chair",
      background: "Disability rights advocate and wheelchair user",
    },
    { name: "Nadia Rahman", role: "Treasurer", background: "Accountant at a local credit union" },
    { name: "Joel Ortiz", role: "Board member", background: "Parent of a deaf-blind teenager" },
    {
      name: "Sasha Klein",
      role: "Board member",
      background: "Autistic self-advocate and software tester",
    },
    { name: "Ruth Adeyemi", role: "Board member", background: "Speech and language therapist" },
  ],
  advisoryGroup: {
    description:
      "Disabled people and parents who test our services and tell us what to change before anything launches.",
    memberCount: 14,
    meets: "every two months, online and in person",
  },
  funding: [
    {
      year: 2026,
      sources: [
        { name: "Riverbend Regional Council", kind: "government", amount: 520000 },
        {
          name: "State Department of Education (training grant)",
          kind: "government",
          amount: 210000,
        },
        { name: "Hollis Family Foundation", kind: "foundation", amount: 180000 },
        { name: "Northgate Community Trust", kind: "foundation", amount: 95000 },
        { name: "Individual donors", kind: "individual", amount: 142000 },
        { name: "Conference tickets and training for employers", kind: "earned", amount: 93000 },
      ],
      costs: {
        library: 410000,
        training: 300000,
        events: 160000,
        familySupport: 240000,
        admin: 130000,
      },
    },
    {
      year: 2025,
      sources: [
        { name: "Riverbend Regional Council", kind: "government", amount: 495000 },
        {
          name: "State Department of Education (training grant)",
          kind: "government",
          amount: 190000,
        },
        { name: "Hollis Family Foundation", kind: "foundation", amount: 160000 },
        { name: "Northgate Community Trust", kind: "foundation", amount: 90000 },
        { name: "Individual donors", kind: "individual", amount: 128000 },
        { name: "Conference tickets and training for employers", kind: "earned", amount: 77000 },
      ],
      costs: {
        library: 385000,
        training: 270000,
        events: 150000,
        familySupport: 215000,
        admin: 120000,
      },
    },
  ],
  jobs: [
    {
      id: "family-support-worker",
      title: "Family support worker",
      team: "Family support",
      hours: "Full time, 37.5 hours a week",
      pay: "$46,000 to $51,000 a year",
      location: "Openfield Center, Riverbend, with some home visits",
      closingDate: "2027-01-15",
      summary:
        "Help parents and carers through the months after a diagnosis, by phone, at home visits and at our family nights.",
      responsibilities: [
        "Talk with families by phone and in person",
        "Help parents prepare for school meetings",
        "Run monthly family nights with a colleague",
        "Keep simple, private notes in our contact system",
      ],
      requirements: [
        "Experience supporting families, paid or unpaid",
        "Patience, warmth and good listening",
        "A driver's license, or another way to reach home visits",
      ],
      adjustmentsNote:
        "You can apply by email, by phone, or in another format. Tell us about any adjustments you need for the interview.",
    },
    {
      id: "library-assistant",
      title: "Library assistant (part time)",
      team: "Library",
      hours: "Part time, 20 hours a week (Tuesday to Thursday)",
      pay: "$19 to $21 an hour",
      location: "Openfield Center, Riverbend",
      closingDate: "2026-12-12",
      summary:
        "Check, clean, pack and ship devices and kits so every family gets a complete, working item.",
      responsibilities: [
        "Check returned items and clean them",
        "Pack orders and print shipping labels",
        "Keep the catalog up to date",
        "Answer simple questions from borrowers",
      ],
      requirements: [
        "Careful and organized",
        "Comfortable using a computer",
        "Able to lift boxes up to 20 lbs, or we'll adjust the role",
      ],
      adjustmentsNote:
        "You can apply by email, by phone, or in another format. Tell us about any adjustments you need for the interview.",
    },
  ],
  volunteerRoles: [
    {
      title: "Event helper",
      commitment: "2–4 events a year, about 3 hours each",
      summary: "Welcome people, show them to the quiet room and help the day run smoothly.",
    },
    {
      title: "Library packer",
      commitment: "One morning a week",
      summary: "Help check, clean and pack items with our library team.",
    },
    {
      title: "Course tester",
      commitment: "A few hours, from home, when a new course is ready",
      summary: "Try new courses before they launch and tell us what was unclear.",
    },
  ],
  documents: [
    {
      title: "Annual report 2025",
      kind: "Web page",
      size: "4 pages to print",
      year: 2025,
      href: "/about/docs/annual-report-2025.html",
    },
    {
      title: "Financial statement 2025",
      kind: "Web page",
      size: "2 pages to print",
      year: 2025,
      href: "/about/docs/financial-statement-2025.html",
    },
  ],
  staffBios: {
    s1: {
      role: "Director",
      bio: "Has led Openfield since 2019, after ten years as a special education teacher.",
    },
    s2: {
      role: "Library coordinator",
      bio: "Looks after every device and kit, and makes sure each one goes out clean and charged.",
    },
    s3: {
      role: "Events coordinator",
      bio: "Plans our events and makes sure interpreters, captions and childcare are booked in time.",
    },
    s4: {
      role: "Learning and content lead",
      bio: "Writes and checks our courses and family guides, so they're clear and up to date.",
    },
  },
};
