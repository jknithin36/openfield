// Topic pages. DEMO ONLY — every person, email and detail is fictional.
// Slugs match the `center` field on items, courses and events.
import type { Center } from "@/lib/types";

export const CENTERS: Center[] = [
  {
    slug: "autism",
    name: "Autism",
    shortName: "Autism",
    summary: "Practical help for autistic people and the families and teachers who support them.",
    whoItsFor: [
      "Parents of autistic children",
      "Autistic teens and adults",
      "Teachers and support staff",
    ],
    startHere: [
      {
        question: "We just got a diagnosis. What now?",
        answer:
          "Take it one step at a time. You don't need to do everything this week. Our short guide explains the first few weeks, and our family team can talk it through with you.",
        link: { label: "Read: Just got a diagnosis", href: "/families/just-got-a-diagnosis" },
      },
      {
        question: "How can I help with meltdowns at home?",
        answer:
          "Meltdowns are often a sign of being overwhelmed, not bad behavior. A calm, quiet space and fewer words can help. Our mini-lesson shows simple ideas you can try tonight.",
        link: {
          label: "Watch: Calm-down strategies at home",
          href: "/learn/calm-down-strategies-at-home",
        },
      },
      {
        question: "What support can my child get at school?",
        answer:
          "Your child may be able to get a plan for extra help at school. You can ask the school for a meeting. Our guide explains your rights in plain words.",
        link: { label: "Read: Starting school", href: "/families/starting-school" },
      },
      {
        question: "Can we try sensory tools before we buy them?",
        answer:
          "Yes. You can borrow sensory kits, weighted blankets and visual timers for free from our library.",
        link: { label: "Borrow autism items", href: "/library?topic=autism" },
      },
    ],
    team: [
      {
        name: "Priya Anand",
        role: "Autism specialist",
        bio: "Supports families after a diagnosis and runs our calm-spaces workshops.",
      },
      {
        name: "Tom Becker",
        role: "Family support worker",
        bio: "Helps parents get ready for school meetings.",
      },
      {
        name: "Mara Ellis",
        role: "Training lead",
        bio: "Writes our autism courses for teachers and support staff.",
      },
    ],
    contactEmail: "autism@openfield.example",
    featuredGuideSlugs: [
      "just-got-a-diagnosis",
      "what-happens-at-an-assessment",
      "making-friends-at-school",
    ],
  },
  {
    slug: "assistive-technology",
    name: "Assistive technology",
    shortName: "Assistive technology",
    summary: "Find, try and borrow tools that help people talk, learn and do things on their own.",
    whoItsFor: [
      "People who don't use speech, or use it a little",
      "Families and carers",
      "Teachers and therapists",
    ],
    startHere: [
      {
        question: "What is a communication device?",
        answer:
          "It's a tablet or button that speaks for someone. Some use pictures, some use words. Many people use one alongside speech, signs or gestures.",
        link: { label: "Watch: Getting started with AAC", href: "/learn/getting-started-with-aac" },
      },
      {
        question: "Can we try a device before we buy one?",
        answer:
          "Yes. Borrow one free for 6 weeks, or come to a try-it day and test several with our specialists.",
        link: { label: "See devices to borrow", href: "/library?topic=assistive-technology" },
      },
      {
        question: "Who pays for a device?",
        answer:
          "Sometimes health insurance, a school or a benefits program will pay. We can help you fill in the forms.",
      },
    ],
    team: [
      {
        name: "Jonah Reyes",
        role: "Assistive technology specialist",
        bio: "Matches people with the right device and helps set it up.",
      },
      {
        name: "Leah Okonjo",
        role: "Library coordinator",
        bio: "Looks after our devices and makes sure each one goes out clean and charged.",
      },
    ],
    contactEmail: "at@openfield.example",
    featuredGuideSlugs: ["starting-school", "finding-work"],
  },
  {
    slug: "early-childhood",
    name: "Early childhood (birth to 5)",
    shortName: "Early childhood",
    summary:
      "Help for babies and young children who are developing differently, at home and in childcare.",
    whoItsFor: [
      "Parents of babies and toddlers",
      "Childcare and preschool staff",
      "Early intervention providers",
    ],
    startHere: [
      {
        question: "I'm worried my child is behind. What should I do?",
        answer:
          "Trust your feeling and ask for a check. It's free to ask for an early intervention assessment. You don't need a doctor's letter first.",
        link: {
          label: "Read: Early help for babies and toddlers",
          href: "/families/early-help-for-babies-and-toddlers",
        },
      },
      {
        question: "What does a speech therapist do?",
        answer:
          "A speech therapist helps children understand and use words, signs or pictures. They also help with eating and swallowing. Sessions are often play-based.",
      },
      {
        question: "How do I choose a preschool?",
        answer:
          "Visit more than one. Ask how they support children who need extra help, and how they talk with parents.",
        link: { label: "Read: Choosing a preschool", href: "/families/choosing-a-preschool" },
      },
    ],
    team: [
      {
        name: "Grace Liu",
        role: "Early years specialist",
        bio: "Visits families and childcare settings to share play-based ideas.",
      },
      {
        name: "Daniel Osei",
        role: "Family support worker",
        bio: "Helps parents find their way through early intervention.",
      },
    ],
    contactEmail: "earlyyears@openfield.example",
    featuredGuideSlugs: [
      "early-help-for-babies-and-toddlers",
      "choosing-a-preschool",
      "what-happens-at-an-assessment",
    ],
  },
  {
    slug: "inclusive-learning",
    name: "Inclusive learning",
    shortName: "Inclusive learning",
    summary: "Classroom ideas and training so every student can learn together.",
    whoItsFor: [
      "Teachers and classroom assistants",
      "School leaders",
      "Parents working with their child's school",
    ],
    startHere: [
      {
        question: "What is an IEP?",
        answer:
          "An IEP is a written plan for a child's support at school. It says what help the school will give and how progress is checked. Parents are part of the team that writes it.",
        link: {
          label: "Read: Your rights at an IEP meeting",
          href: "/families/your-rights-at-an-iep-meeting",
        },
      },
      {
        question: "How do I write a good IEP goal?",
        answer:
          "A good goal is clear, can be measured, and fits the student. Our course walks through real examples.",
        link: {
          label: "Take the course: Writing a good IEP goal",
          href: "/learn/writing-a-good-iep-goal",
        },
      },
      {
        question: "Can you train our school staff?",
        answer:
          "Yes. We run free sessions for schools in our region, in person or online. Ask the team below.",
      },
    ],
    team: [
      {
        name: "Hannah Brooks",
        role: "Inclusive education lead",
        bio: "A former teacher who now trains school staff across the region.",
      },
      {
        name: "Marcus Hale",
        role: "Training coordinator",
        bio: "Plans our school sessions and webinars.",
      },
    ],
    contactEmail: "schools@openfield.example",
    featuredGuideSlugs: [
      "starting-school",
      "your-rights-at-an-iep-meeting",
      "homework-without-tears",
    ],
  },
  {
    slug: "life-transitions",
    name: "Life after school",
    shortName: "Life after school",
    summary: "Planning for work, college, money and living more independently after high school.",
    whoItsFor: ["Teens and young adults", "Parents and carers", "Employers"],
    startHere: [
      {
        question: "When should we start planning for after high school?",
        answer:
          "Around age 14 is a good time. Planning early gives you time to try things, like work experience or a college visit.",
        link: {
          label: "Read: Planning for life after high school",
          href: "/families/planning-for-life-after-high-school",
        },
      },
      {
        question: "What changes when my child turns 18?",
        answer:
          "Your child becomes a legal adult. Some decisions move to them. There are ways to keep supporting them, and our guide explains each one.",
        link: { label: "Read: Turning 18", href: "/families/turning-18" },
      },
      {
        question: "How do I make my workplace more accessible?",
        answer:
          "Small changes often help most, like clear instructions or flexible hours. Our short course for employers explains where to start.",
        link: {
          label: "Take the course: Making reasonable adjustments at work",
          href: "/learn/making-reasonable-adjustments-at-work",
        },
      },
    ],
    team: [
      {
        name: "Sofia Marín",
        role: "Transition planner",
        bio: "Helps young people and families plan the move to adult life.",
      },
      {
        name: "Ben Carter",
        role: "Employment advisor",
        bio: "Works with local employers to open up jobs and work experience.",
      },
    ],
    contactEmail: "transition@openfield.example",
    featuredGuideSlugs: ["planning-for-life-after-high-school", "turning-18", "finding-work"],
  },
  {
    slug: "deaf-blind",
    name: "Deaf-blind",
    shortName: "Deaf-blind",
    summary: "Help for people with combined hearing and vision loss, and those who support them.",
    whoItsFor: ["Deaf-blind children and adults", "Families", "Interpreters and support workers"],
    startHere: [
      {
        question: "What does deaf-blind mean?",
        answer:
          "It means having some loss of both hearing and sight. Most deaf-blind people have some hearing or sight. Everyone's needs are different.",
      },
      {
        question: "How can our family start to communicate?",
        answer:
          "Start with touch and a few simple signs. Our course for families teaches everyday signs, and you can borrow practice cards.",
        link: {
          label: "Take the course: Sign language basics for families",
          href: "/learn/sign-language-basics-for-families",
        },
      },
      {
        question: "Can I borrow a magnifier or amplifier?",
        answer:
          "Yes. You can borrow video magnifiers, sound amplifiers and a braille display for free.",
        link: { label: "See items to borrow", href: "/library?topic=deaf-blind" },
      },
    ],
    team: [
      {
        name: "Ivy Thornton",
        role: "Deaf-blind specialist",
        bio: "Supports families with communication and getting around safely.",
      },
      {
        name: "Omar Haddad",
        role: "Interpreter coordinator",
        bio: "Books interpreters and guides for our events.",
      },
    ],
    contactEmail: "deafblind@openfield.example",
    featuredGuideSlugs: ["just-got-a-diagnosis", "turning-18"],
  },
];

export const centerBySlug = (slug: string): Center | undefined =>
  CENTERS.find((c) => c.slug === slug);
