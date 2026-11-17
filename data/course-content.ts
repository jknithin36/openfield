// Lesson content for the public course player. DEMO ONLY — authors and
// organizations are fictional. Three courses have full, real content (one
// per audience); the rest get short lessons generated from their own details.
import type { Course, Lesson } from "@/lib/types";

type Rich = Required<Pick<Course, "outcomes" | "author">> &
  Pick<Course, "resources"> & { lessons: Lesson[] };

export const RICH: Record<string, Rich> = {
  // ── Parents ────────────────────────────────────────────────────────────────
  "understanding-your-childs-autism-diagnosis": {
    author: { name: "Priya Anand", role: "Autism specialist, Openfield" },
    outcomes: [
      "Explain what autism is in your own words",
      "Know what to do in the first few weeks after a diagnosis",
      "Write down your child's strengths and what they find hard",
      "Find people and services that can help",
    ],
    resources: [
      {
        label: "Strengths and needs worksheet",
        href: "/learn/worksheets/strengths-and-needs.html",
        kind: "link",
        size: "1 printable page",
      },
      {
        label: "Questions to ask your child's doctor",
        href: "/learn/worksheets/questions-for-the-doctor.html",
        kind: "link",
        size: "1 printable page",
      },
    ],
    lessons: [
      {
        id: "what-autism-is",
        title: "What autism is, and what it isn't",
        minutes: 8,
        type: "video",
        video: {
          posterAlt: "A parent and a young child building a tower of blocks together on the floor.",
          captionsAvailable: true,
          transcript: `## Welcome

Hello, I'm Priya. I've worked with autistic children and their families for twelve years. If you're watching this, your child has probably just been diagnosed. You might feel relieved, worried, or both. All of those feelings are normal.

## What autism is

Autism is a difference in how a person's brain works. It affects how someone communicates, how they make sense of the world around them, and how they experience things like sound, light and touch.

Autism is not an illness. It isn't caused by anything you did. It is something your child was born with, and it is part of who they are.

## Every autistic person is different

You may hear people talk about the "autism spectrum". This doesn't mean a line from "a little" to "a lot". It means every autistic person has their own mix of strengths and challenges.

Your child might love patterns, numbers or a favorite topic. They might notice details other people miss. They might also find busy places tiring, or need more time to answer a question.

## What a diagnosis gives you

A diagnosis doesn't change your child. They are the same child they were yesterday. What it gives you is a way to understand them better, and a key to support at school and from services.

In the next lessons, we'll look at the first few weeks, and how to describe your child's strengths and needs.`,
        },
      },
      {
        id: "first-weeks",
        title: "The first few weeks",
        minutes: 10,
        type: "reading",
        body: `## Go at your own pace

You don't have to do everything at once. Many parents say they felt they had to read every book and call every service in the first week. You don't. Your child needs you to be calm and present more than they need a perfect plan.

> **Tip:** Pick one small thing to do this week. That's enough.

## Things that help early on

- **Write down your questions.** Keep a note on your phone. Bring it to your next appointment.
- **Ask for the report.** The team that diagnosed your child should give you a written report. Read it when you feel ready, and ask what any words mean.
- **Tell the people who need to know.** This might be your child's school or childcare. You decide who to tell and when.
- **Look after yourself.** Talk to someone you trust. Our family team is here too.

## Talking to your child

Many families wonder whether to tell their child they are autistic. There's no single right time. Children who learn about their diagnosis early often say it helped them understand themselves.

Keep it simple and positive. For example: "Your brain works in a way called autism. It's why you're so good at puzzles, and why loud places can feel too much."

## Services you can ask about

1. **Early intervention or school support.** Your child may be able to get extra help at school or childcare.
2. **Speech and language therapy.** This can help with communication, in whatever form works for your child.
3. **Occupational therapy.** This can help with everyday skills and sensory needs.
4. **Parent groups.** Meeting other parents who've been through it can be the most helpful thing of all.

> **Remember:** You know your child best. Professionals bring knowledge; you bring the most important expertise there is.`,
      },
      {
        id: "strengths-and-needs",
        title: "Your child's strengths and needs",
        minutes: 15,
        type: "activity",
        body: `## Why this matters

When you talk to teachers, doctors or therapists, it helps to have a clear picture of your child. Starting with strengths reminds everyone that support is about helping your child be themselves, not changing who they are.

## What to do

1. Print the worksheet, or use a notebook.
2. In the first box, write **three things your child is good at or loves**. Be specific: "can name every dinosaur" is better than "clever".
3. In the second box, write **three things your child finds hard**. Think about everyday moments: getting dressed, mealtimes, the school gate.
4. In the third box, write **what helps** with each hard thing. You probably already know more than you think.
5. Keep the sheet. Bring it to your next meeting about your child.

> **Tip:** Ask other people who know your child well, like a grandparent or teacher, to add to the sheet.`,
        worksheet: {
          label: "Strengths and needs worksheet (printable page)",
          href: "/learn/worksheets/strengths-and-needs.html",
        },
      },
      {
        id: "check",
        title: "Check what you've learned",
        minutes: 3,
        type: "check",
        check: {
          question: "Which of these is true about autism?",
          options: [
            { id: "a", text: "It is caused by something the parents did" },
            {
              id: "b",
              text: "It is a difference in how the brain works, and every autistic person is different",
            },
            { id: "c", text: "It always looks the same in every child" },
          ],
          correctId: "b",
          explanation:
            "Autism is a difference in how the brain works. It isn't caused by parenting, and every autistic person has their own mix of strengths and challenges.",
        },
      },
    ],
  },

  // ── Teachers ───────────────────────────────────────────────────────────────
  "visual-supports-in-the-classroom": {
    author: { name: "Hannah Brooks", role: "Inclusive education lead, Openfield" },
    outcomes: [
      "Explain why visual supports help many students, not just some",
      "Make a simple visual timetable for your class",
      "Use first–then boards to help with hard transitions",
      "Check whether a visual support is working",
    ],
    resources: [
      {
        label: "Visual timetable template",
        href: "/learn/worksheets/visual-timetable.html",
        kind: "link",
        size: "1 printable page",
      },
    ],
    lessons: [
      {
        id: "why-visuals",
        title: "Why visual supports work",
        minutes: 8,
        type: "video",
        video: {
          posterAlt:
            "A teacher pointing to a picture timetable on a classroom wall while students watch.",
          captionsAvailable: true,
          transcript: `## Words disappear, pictures stay

When we give instructions out loud, the words are gone the moment we stop talking. A student who was distracted, or who needs more time to process language, misses them.

A picture or written word stays. Students can look back at it as often as they need to.

## Who benefits

Visual supports are often set up for autistic students or students with language needs. But they help almost everyone: students learning English, students who are anxious about what comes next, and students who simply weren't listening the first time.

## Lowering anxiety

Many behavior problems in class come from not knowing what will happen next. A visual timetable answers the question "what are we doing?" before anyone needs to ask it.

## Start small

You don't need to laminate your whole classroom. Start with one support, use it every day for two weeks, and see what changes.`,
        },
      },
      {
        id: "visual-timetable",
        title: "Making a visual timetable",
        minutes: 12,
        type: "reading",
        body: `## What it is

A visual timetable shows the parts of the day in order, using pictures, symbols or words. It goes somewhere every student can see it.

## How to make one

1. **List the main parts of your day.** Keep it to 5–8 items. "Math", "lunch", "reading", "home time".
2. **Pick one picture for each.** Use the same picture every day. Photos of your own classroom work well.
3. **Put them in order, top to bottom or left to right.**
4. **Move or cover each one when it's finished.** This shows progress through the day.

> **Tip:** Show changes, don't hide them. If assembly replaces math today, swap the picture in the morning and talk about it.

## Making it part of the routine

- Go through the timetable at the start of the day.
- Point to it before each change: "Math is finished. Next is lunch."
- Let students take turns moving the cards.

## Individual timetables

Some students need their own, smaller timetable on their desk. It can break a lesson into steps, or show just "now" and "next".`,
      },
      {
        id: "first-then",
        title: "First–then boards for transitions",
        minutes: 10,
        type: "reading",
        body: `## What a first–then board is

A first–then board has two boxes. The first box shows the task that needs doing. The second shows what comes after, usually something the student likes.

**First:** writing. **Then:** computer time.

## When to use one

- When a student finds it hard to start a task
- When moving from a liked activity to a less-liked one
- When a student needs to know the task will end

## Using it well

1. Keep the "first" task short and achievable at the start.
2. Always give the "then" when the "first" is done. Trust is everything.
3. Use calm, few words. Point to the board rather than repeating instructions.

> **Remember:** A first–then board is not a reward chart. The "then" isn't earned by good behavior; it's simply what comes next.`,
      },
      {
        id: "is-it-working",
        title: "Is it working?",
        minutes: 10,
        type: "activity",
        body: `## Watch for two weeks

Pick one visual support you've started using. For two weeks, notice:

- How often does the student look at it?
- Do transitions take less time, or cause less upset?
- Does the student ask "what's next?" less often?

## Write it down

Use the template to note one example each day. Short notes are fine: "Moved to lunch with no reminder."

## Then decide

- **It's helping:** keep going, and think about one more support.
- **It's not used:** check it's at the right height, in the right place, and uses pictures the student understands.
- **It's making things worse:** stop, and talk to the student or their family about what might help instead.`,
        worksheet: {
          label: "Two-week observation sheet (printable page)",
          href: "/learn/worksheets/visual-timetable.html",
        },
      },
      {
        id: "check",
        title: "Check what you've learned",
        minutes: 3,
        type: "check",
        check: {
          question:
            "A student gets upset every day when computer time ends. Which support would help most?",
          options: [
            { id: "a", text: "Removing computer time" },
            {
              id: "b",
              text: "A first–then board showing what comes after, plus a timetable showing when computer time comes back",
            },
            { id: "c", text: "Telling the student more times that it's time to stop" },
          ],
          correctId: "b",
          explanation:
            "Showing what happens next, and when the liked activity returns, makes the change predictable. More spoken reminders often add to the stress.",
        },
      },
    ],
  },

  // ── Employers ──────────────────────────────────────────────────────────────
  "making-reasonable-adjustments-at-work": {
    author: { name: "Ben Carter", role: "Employment advisor, Openfield" },
    outcomes: [
      "Explain what a reasonable adjustment is",
      "Have a helpful first conversation with an employee",
      "Choose simple, low-cost changes that work",
      "Check in and review adjustments over time",
    ],
    resources: [
      {
        label: "Adjustments conversation guide",
        href: "/learn/worksheets/adjustments-conversation.html",
        kind: "link",
        size: "1 printable page",
      },
    ],
    lessons: [
      {
        id: "what-is-an-adjustment",
        title: "What is a reasonable adjustment?",
        minutes: 8,
        type: "reading",
        body: `## The short answer

A reasonable adjustment is a change to a job or workplace that removes a barrier for a disabled employee, so they can do their job well.

## Examples

- Flexible start times for someone whose medication makes mornings hard
- Written instructions as well as spoken ones
- A quieter desk away from the printer and kitchen
- Screen-reading software, or a larger monitor
- Regular short breaks

## Most adjustments cost little or nothing

Many employers expect adjustments to be expensive. In practice, most cost nothing at all, and the rest are usually a one-off cost lower than replacing a member of staff.

> **Remember:** The person is the expert on what they need. Your job is to listen and make it possible.`,
      },
      {
        id: "first-conversation",
        title: "Having the first conversation",
        minutes: 10,
        type: "video",
        video: {
          posterAlt:
            "Two colleagues talking at a small table in a bright office, one taking notes.",
          captionsAvailable: true,
          transcript: `## Make it easy to ask

Many people never ask for an adjustment because they worry how it will be received. Say clearly, to everyone, that adjustments are welcome and normal.

## Questions that help

Keep the conversation about work, not about medical details. You don't need a diagnosis to make a change.

Try questions like:

- "What parts of the job work well for you?"
- "Is there anything that makes your work harder than it needs to be?"
- "What has helped you in other jobs, or at school?"

## Listen, then agree a next step

You don't need to solve everything in one meeting. Agree one or two changes to try, and a date to check in.

## Keep it private

Only share what the employee agrees to share, and only with people who need to know.`,
        },
      },
      {
        id: "plan",
        title: "Write an adjustments plan",
        minutes: 12,
        type: "activity",
        body: `## Why write it down

A short written plan means the adjustments don't get lost if a manager changes, and the employee doesn't have to explain their needs again.

## What to include

1. The barrier, in the employee's words
2. The change you've agreed
3. Who will make it happen, and by when
4. A date to check how it's going

Use the conversation guide to fill it in together. Give the employee a copy.`,
        worksheet: {
          label: "Adjustments conversation guide (printable page)",
          href: "/learn/worksheets/adjustments-conversation.html",
        },
      },
      {
        id: "check",
        title: "Check what you've learned",
        minutes: 3,
        type: "check",
        check: {
          question:
            "An employee asks for written instructions as well as spoken ones. What should you do first?",
          options: [
            { id: "a", text: "Ask for a doctor's letter before agreeing" },
            { id: "b", text: "Agree to try it, and set a date to check how it's going" },
            { id: "c", text: "Explain that everyone else manages with spoken instructions" },
          ],
          correctId: "b",
          explanation:
            "This is a simple, free change. You don't need medical evidence to try it. Agree it, then check in to see if it's working.",
        },
      },
    ],
  },
};

const TYPES: Lesson["type"][] = ["video", "reading", "activity", "reading"];

/** Short, natural lessons for courses without full content. */
export function placeholderLessons(
  c: Pick<Course, "title" | "summary" | "lessons" | "format">,
): Lesson[] {
  const n = c.lessons.length;
  return c.lessons.map((l, k) => {
    const type: Lesson["type"] =
      c.format === "toolkit"
        ? k % 2
          ? "activity"
          : "reading"
        : n === 1
          ? c.format === "webinar-recording"
            ? "video"
            : "reading"
          : TYPES[k % TYPES.length];
    const title =
      n === 1
        ? c.title
        : k === 0
          ? "Getting started"
          : k === n - 1
            ? "Putting it into practice"
            : `Part ${k + 1}`;
    const body = `## About this lesson

This lesson is part of **${c.title}**. ${c.summary}

## What to do

- Read or watch at your own pace.
- Stop and think about how this fits your own situation.
- Write down one idea you want to try this week.

> **Tip:** This demo course has short lessons. The full version would go into more detail here.`;
    return {
      ...l,
      title,
      type,
      ...(type === "video"
        ? {
            video: {
              posterAlt: `A still from the video for ${c.title}.`,
              captionsAvailable: true,
              transcript: body,
            },
          }
        : type === "activity"
          ? {
              body,
              worksheet: {
                label: "Activity sheet (printable page)",
                href: "/learn/worksheets/strengths-and-needs.html",
              },
            }
          : { body }),
    };
  });
}

/** Fill in content for any course that doesn't have it yet. */
export function withContent(c: Course): Course {
  // Older saved data made "child-s" from "child's"; repair it.
  const slug = c.slug.replace(/-s-/g, "s-");
  const rich = RICH[c.slug] ?? RICH[slug];
  if (rich) return { ...c, ...rich, slug: RICH[c.slug] ? c.slug : slug, lessons: rich.lessons };
  return {
    ...c,
    outcomes: c.outcomes ?? [
      `Understand the basics of ${c.title.toLowerCase()}`,
      "Try one practical idea at home or at work",
      "Know where to get more help",
    ],
    author: c.author ?? { name: "Openfield training team", role: "Openfield" },
    lessons: c.lessons.every((l) => l.type) ? c.lessons : placeholderLessons(c),
  };
}
