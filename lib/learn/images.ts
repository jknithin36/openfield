// Course illustrations: 1680 × 600 WebP files in public/learn/courses/,
// named by course slug. Courses without their own picture reuse the closest
// one. To add a new picture, save it as /public/learn/courses/<slug>.webp
// and add a line to PICTURES with a short description for screen readers.

const PICTURES: Record<string, string> = {
  "understanding-your-childs-autism-diagnosis":
    "A parent kneels beside a young child who is lining up colourful blocks.",
  "visual-supports-in-the-classroom":
    "A teacher points to a column of picture cards while two children sit and watch.",
  "making-reasonable-adjustments-at-work":
    "One worker in a wheelchair at a desk with a large screen, and another at a standing desk wearing headphones.",
  "getting-started-with-aac":
    "A child holds a tablet showing picture symbols, sitting beside a parent, with small speech bubbles above them.",
  "calm-down-strategies-at-home":
    "A child rests on a big cushion under a soft tent, with a glowing lamp and a sand timer nearby.",
  "writing-a-good-iep-goal":
    "Three people sit around a table with one shared sheet of paper, below three steps leading to a flag.",
  "planning-the-move-to-adult-services":
    "A young person and a parent walk along a path from a school towards a home, a workplace and a community building.",
  "sign-language-basics-for-families":
    "A parent and a child sit facing each other, using their hands to sign.",
  "supporting-siblings":
    "Two children sit side by side, one with an arm around the other, with a parent behind them.",
  "early-signs-and-early-help":
    "A baby crawls towards stacking toys while a caregiver sits close by, with small shoots growing all around.",
  "switch-access-for-beginners":
    "A child in a wheelchair presses a large button switch connected to a laptop showing a star.",
  "inclusive-playground-activities":
    "Children play together in a park: on a wheelchair-accessible roundabout, at a sand table and on a supported swing.",
  "self-advocacy-at-work":
    "A young adult stands and speaks at a meeting table while two colleagues listen.",
  "behavior-is-communication":
    "A child sits hugging their knees while an adult kneels at a distance, listening calmly.",
  "benefits-explained":
    "Two people look through papers and a calculator at a table, with a house and a shield shape behind them.",
  "tactile-communication":
    "One pair of hands rests gently on another, with a ball, a ridged block and a soft fabric square nearby.",
};

/** Courses without their own picture borrow the closest match. */
const REUSE: Record<string, string> = {
  "hiring-inclusively": "self-advocacy-at-work",
  "accessible-documents-in-30-minutes": "making-reasonable-adjustments-at-work",
  "eye-gaze-in-the-classroom": "switch-access-for-beginners",
  "toilet-training-with-visual-supports": "visual-supports-in-the-classroom",
  "respite-care-finding-a-break": "supporting-siblings",
  "fax-based-referrals-old-process": "benefits-explained",
  "2019-conference-highlights": "writing-a-good-iep-goal",
  "using-the-old-booking-system": "getting-started-with-aac",
};

export type CourseImage = { src: string; alt: string };

export function courseImage(slug: string): CourseImage | null {
  const file = PICTURES[slug] ? slug : REUSE[slug];
  return file && PICTURES[file]
    ? { src: `/learn/courses/${file}.webp`, alt: PICTURES[file] }
    : null;
}
