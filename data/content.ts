// Courses and family guides. DEMO ONLY — fictional. Dates relative to now.
import { withContent } from "@/data/course-content";
import type {
  AgeStage,
  CenterSlug,
  ContentStatus,
  Course,
  CourseFormat,
  CourseLevel,
  FamilyGuide,
  Role,
} from "@/lib/types";

type C = [
  title: string,
  center: CenterSlug,
  format: CourseFormat,
  audiences: Role[],
  level: CourseLevel,
  status: ContentStatus,
  lessons: number,
  certificate: boolean,
];

const COURSES: C[] = [
  [
    "Understanding your child's autism diagnosis",
    "autism",
    "course",
    ["parent"],
    "intro",
    "published",
    4,
    false,
  ],
  [
    "Visual supports in the classroom",
    "inclusive-learning",
    "course",
    ["teacher"],
    "intermediate",
    "published",
    6,
    true,
  ],
  [
    "Making reasonable adjustments at work",
    "life-transitions",
    "course",
    ["employer"],
    "intro",
    "published",
    3,
    false,
  ],
  [
    "Getting started with AAC",
    "assistive-technology",
    "course",
    ["parent", "teacher", "provider"],
    "intro",
    "published",
    5,
    true,
  ],
  [
    "Calm-down strategies at home",
    "autism",
    "mini-lesson",
    ["parent"],
    "intro",
    "published",
    1,
    false,
  ],
  [
    "Writing a good IEP goal",
    "inclusive-learning",
    "course",
    ["teacher", "parent"],
    "intermediate",
    "published",
    5,
    true,
  ],
  [
    "Planning the move to adult services",
    "life-transitions",
    "course",
    ["parent", "self-advocate"],
    "intro",
    "published",
    4,
    false,
  ],
  [
    "Sign language basics for families",
    "deaf-blind",
    "course",
    ["parent"],
    "intro",
    "published",
    6,
    false,
  ],
  [
    "Supporting siblings",
    "family-support",
    "mini-lesson",
    ["parent"],
    "intro",
    "published",
    1,
    false,
  ],
  [
    "Early signs and early help",
    "early-childhood",
    "course",
    ["parent", "provider"],
    "intro",
    "published",
    4,
    false,
  ],
  [
    "Switch access for beginners",
    "assistive-technology",
    "webinar-recording",
    ["teacher", "provider"],
    "intro",
    "published",
    1,
    false,
  ],
  [
    "Inclusive playground activities",
    "early-childhood",
    "toolkit",
    ["teacher", "provider"],
    "intro",
    "published",
    3,
    false,
  ],
  [
    "Self-advocacy at work",
    "life-transitions",
    "course",
    ["self-advocate"],
    "intro",
    "published",
    4,
    true,
  ],
  [
    "Behavior is communication",
    "autism",
    "course",
    ["teacher", "provider"],
    "advanced",
    "published",
    6,
    true,
  ],
  [
    "Benefits explained",
    "family-support",
    "webinar-recording",
    ["parent", "self-advocate"],
    "intro",
    "published",
    1,
    false,
  ],
  [
    "Tactile communication",
    "deaf-blind",
    "course",
    ["provider", "teacher"],
    "advanced",
    "published",
    5,
    true,
  ],
  [
    "Accessible documents in 30 minutes",
    "inclusive-learning",
    "toolkit",
    ["employer", "teacher"],
    "intro",
    "published",
    2,
    false,
  ],
  [
    "Hiring inclusively",
    "life-transitions",
    "mini-lesson",
    ["employer"],
    "intro",
    "published",
    1,
    false,
  ],
  [
    "Eye-gaze in the classroom",
    "assistive-technology",
    "course",
    ["teacher"],
    "intermediate",
    "draft",
    4,
    true,
  ],
  [
    "Toilet training with visual supports",
    "early-childhood",
    "mini-lesson",
    ["parent"],
    "intro",
    "draft",
    1,
    false,
  ],
  [
    "Respite care: finding a break",
    "family-support",
    "course",
    ["parent"],
    "intro",
    "draft",
    3,
    false,
  ],
  [
    "Fax-based referrals (old process)",
    "family-support",
    "toolkit",
    ["provider"],
    "intro",
    "archived",
    2,
    false,
  ],
  [
    "2019 conference highlights",
    "autism",
    "webinar-recording",
    ["parent", "teacher"],
    "intro",
    "archived",
    1,
    false,
  ],
  [
    "Using the old booking system",
    "assistive-technology",
    "mini-lesson",
    ["provider"],
    "intro",
    "archived",
    1,
    false,
  ],
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function createCourses(now: Date = new Date()): Course[] {
  const day = 86400000;
  return COURSES.map(
    ([title, center, format, audiences, level, status, lessonCount, certificate], i) => {
      const enrollments =
        status === "published" ? 60 + ((i * 47) % 420) : status === "archived" ? 30 + i * 5 : 0;
      const completions = Math.round(enrollments * (0.35 + ((i * 13) % 45) / 100));
      const missingCaptions = i === 10 || i === 14; // two published videos without captions
      return {
        id: `course-${slug(title)}`,
        slug: slug(title),
        title,
        summary: `A ${format === "mini-lesson" ? "short" : "practical"} ${format.replace("-", " ")} for ${audiences.join(" and ")}s.`,
        center,
        format,
        audiences,
        level,
        lessons: Array.from({ length: lessonCount }, (_, k) => ({
          id: `l${i}-${k}`,
          title: lessonCount === 1 ? title : `Lesson ${k + 1}`,
          minutes: format === "mini-lesson" ? 8 : 10 + ((i + k * 7) % 20),
        })),
        certificate,
        status,
        featured: i === 0 || i === 3 || i === 6,
        accessibility: {
          captions: format !== "toolkit" && !missingCaptions,
          transcript: format !== "toolkit" && i !== 14,
          plainLanguage: i % 4 !== 3,
          audioDescription: i % 5 === 0,
        },
        enrollments,
        completions,
        completionsByAudience: Object.fromEntries(
          audiences.map((a, k) => [
            a,
            Math.round(completions / audiences.length) +
              (k === 0 ? completions % audiences.length : 0),
          ]),
        ),
        rating: status === "published" ? 4 + ((i * 3) % 10) / 10 : undefined,
        updatedAt: new Date(now.getTime() - (10 + i * 9) * day).toISOString(),
        reviewDueAt: new Date(now.getTime() + (200 - i * 12) * day).toISOString(),
      };
    },
  ).map(withContent);
}

type G = [
  title: string,
  stage: AgeStage,
  status: ContentStatus,
  monthsSinceReview: number,
  owner: string,
  body: string,
];

const PLAIN = (topic: string) => `## What this guide covers

This guide is about ${topic}. It is short. You can read it in a few minutes.

## Where to start

Start with one small step. Write down your questions. Bring them to your next meeting.

## Who can help

Our family team can talk with you. Call us or send a message. We are here to help.`;

const DENSE = (topic: string) => `## Understanding ${topic}

When families are navigating the complex landscape of ${topic}, it is essential to understand that the Individualized Education Program, commonly referred to as the IEP, establishes the legally binding framework through which accommodations, modifications and related services are determined, documented and subsequently evaluated by the multidisciplinary team.

## Assistive technology considerations

Assistive technology evaluations should be requested in writing, and the transition planning process, which typically commences during adolescence, necessitates comprehensive coordination between educational institutions, vocational rehabilitation agencies and community-based service providers.`;

const GUIDES: G[] = [
  [
    "Just got a diagnosis",
    "diagnosis",
    "published",
    14,
    "s4",
    PLAIN("the first weeks after a diagnosis"),
  ],
  [
    "What happens at an assessment",
    "diagnosis",
    "published",
    3,
    "s4",
    PLAIN("what happens at an assessment"),
  ],
  [
    "Early help for babies and toddlers",
    "birth-5",
    "published",
    5,
    "s4",
    PLAIN("early help for babies and toddlers"),
  ],
  ["Choosing a preschool", "birth-5", "published", 15, "s1", PLAIN("choosing a preschool")],
  ["Starting school", "school-age", "published", 2, "s4", PLAIN("starting school")],
  ["Your rights at an IEP meeting", "school-age", "published", 6, "s4", DENSE("special education")],
  [
    "Making friends at school",
    "school-age",
    "published",
    8,
    "s1",
    PLAIN("making friends at school"),
  ],
  ["Homework without tears", "school-age", "published", 13, "s4", PLAIN("homework")],
  ["Teen years", "teen", "published", 4, "s4", PLAIN("the teen years")],
  [
    "Planning for life after high school",
    "teen",
    "published",
    7,
    "s4",
    DENSE("transition services"),
  ],
  ["Puberty and body changes", "teen", "published", 18, "s1", PLAIN("puberty and body changes")],
  ["Turning 18", "adult", "published", 9, "s4", PLAIN("turning 18")],
  ["Finding work", "adult", "published", 1, "s4", PLAIN("finding work")],
  ["Benefits explained", "adult", "published", 10, "s1", PLAIN("benefits")],
  ["Finding respite care", "diagnosis", "draft", 0, "s4", PLAIN("finding respite care")],
  ["Old referral process", "school-age", "archived", 30, "s1", PLAIN("an old referral process")],
];

/** Reading grade for demo data (the editor recomputes it live). */
const gradeFor = (body: string) =>
  body.includes("multidisciplinary") || body.includes("vocational") ? 14 : 5;

export function createGuides(now: Date = new Date()): FamilyGuide[] {
  const day = 86400000;
  return GUIDES.map(([title, ageStage, status, months, owner, body], i) => ({
    id: `guide-${slug(title)}`,
    slug: slug(title),
    title,
    ageStage,
    summary: `A plain-language guide to ${title.toLowerCase()}.`,
    body,
    readMinutes: Math.max(2, Math.round(body.split(/\s+/).length / 200) + 2),
    status,
    owner,
    lastReviewedAt: new Date(now.getTime() - months * 30.4 * day).toISOString(),
    reviewEveryMonths: 12,
    readingLevel: gradeFor(body),
    helpfulYes: 40 + ((i * 37) % 200),
    helpfulNo: 4 + ((i * 11) % 30),
    views: 300 + ((i * 173) % 2400),
    comments: [
      {
        at: new Date(now.getTime() - (3 + i) * day).toISOString(),
        body: "This was really clear, thank you.",
        helpful: true,
      },
      ...(i % 3 === 0
        ? [
            {
              at: new Date(now.getTime() - (6 + i) * day).toISOString(),
              body: "Could you add something about what to do if the school says no?",
              helpful: false,
            },
          ]
        : []),
    ],
  }));
}
