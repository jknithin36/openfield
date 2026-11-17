# Openfield

An open-source website and staff dashboard template for a disability resource center: a lending library, free courses, events, family guides and an inbox, built to GOV.UK-style accessibility standards.

> **Demo only.** Openfield is a fictional organization. Every person, place, email address and number in this repo is made up. Data is saved in your browser (localStorage), so nothing leaves your machine.

## What's inside

**Public website**

- **Lending library**: search and filter, item pages with live availability, a step-by-step request form with "check your answers", and a page to check a request's status.
- **Free courses**: catalog with filters, course pages, a lesson player (video transcripts, readings, activities, knowledge checks), progress saved on the device, and printable certificates.
- **Events**: list grouped by month, event pages with "Add to calendar", step-by-step registration with access needs, waitlists, and "Manage your booking".
- **Family guides**: guides by life stage, with plain explanations of jargon, a text size control, and "Was this helpful?" feedback.
- **Topics, About, Contact, and the accessibility statement, privacy and terms pages.**

**Staff dashboard** (`/dashboard`, demo sign-in)

- **Today**: what needs doing.
- **Library**: Requests, To ship, On loan, Returns, Catalog.
- **Events**: event list, accommodations, and door check-in.
- **People and content**: Inbox, Contacts, Courses, Family guides.
- **Admin**: Reports (CSV and print) and Settings.
- **Roles**: Admin, Library, Events and Content, each seeing only their sections.

The public site and the dashboard share the same stores. A request, booking or message sent on the website appears in the dashboard straight away.

## Tech stack

- [Next.js 16](https://nextjs.org) App Router with Cache Components
- [React 19](https://react.dev), TypeScript (strict)
- [Tailwind CSS v4](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com) (Base UI)
- [Hugeicons](https://hugeicons.com) for all icons
- [Zustand](https://zustand.docs.pmnd.rs) stores, persisted to localStorage
- [Vitest](https://vitest.dev), ESLint and Prettier

## Getting started

Requires Node.js 22 (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. To explore the dashboard, go to **Staff sign in** and choose **Try the demo dashboard**.

To start again with fresh demo data, go to **Dashboard › Settings › Demo data › Reset all demo data**.

## Scripts

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start the dev server                             |
| `npm run build`        | Production build                                 |
| `npm run start`        | Serve the production build                       |
| `npm run typecheck`    | TypeScript, no emit                              |
| `npm run lint`         | ESLint                                           |
| `npm run format`       | Format everything with Prettier                  |
| `npm run format:check` | Check formatting                                 |
| `npm test`             | Run the flow tests (Vitest)                      |
| `npm run check`        | Type-check, lint, format check and tests in turn |

## Project structure

```
app/
  (site)/        Public website (header and footer layout)
  (dashboard)/   Staff dashboard (sidebar layout, sign-in check)
  (auth)/        Sign in and password reset
  (checkin)/     Full-screen event check-in for a tablet
  (print)/       Print-only pages (packing slips, reports, certificates)
components/
  ui/            shadcn/ui components (only the ones in use)
  dashboard/     Dashboard sections and shared pieces (forms, tables, panels)
  site/          Public website sections
data/            Demo data generators (fictional), dates relative to "now"
lib/             Pure logic: types, selectors and rules per section
store/           Zustand stores (one per area) with validated actions and undo
tests/           Flow tests that run real store actions end to end
```

**How the code is organized**

- **Selectors and rules are pure** (`lib/**/selectors.ts`, `lib/**/rules.ts`). Pages never store counts; they derive them.
- **Store actions validate first** and return `{ ok: true, undoId }` or `{ ok: false, reason }`. The reason is written for the person using the page.
- **Contacts are the single source of truth.** Forms match people by email before adding anyone new.
- **Dates read "now" only in the browser**, so pages can be prerendered.

## Make it yours

- **Organization details** (name, phone, address, hours, region): edit them in **Dashboard › Settings › Organization**, or change `DEFAULT_ORG` in `data/settings.ts`.
- **Rules** (loan limits, reply targets, review cycles): in **Settings › Rules**, or the defaults in `data/`.
- **Colors and type**: the design tokens are in `app/globals.css`. Navy (`--brand`) is the single primary color, and the focus ring is amber.
- **Content**: courses (`data/content.ts`, `data/course-content.ts`), library items (`data/library/`), events (`data/events/`), topics (`data/centers.ts`) and About pages (`data/about.ts`).
- **More UI components**: run `npx shadcn add <component>`.
- **Real data**: each store's actions sit behind one interface. Swap the localStorage persistence for API calls, and add a real auth check in `app/(dashboard)/dashboard/layout.tsx`.

## Accessibility

Built to aim for WCAG 2.2 AA:

- **Structure**: one `h1` per page, landmarks, skip links, and a visible amber focus ring.
- **Touch targets**: at least 44px.
- **Forms**: follow the GOV.UK pattern, with an error summary that takes focus, inline errors that say what to do, and radios rather than selects where possible.
- **Status**: always in words, never color alone.
- **Screen readers**: changes are announced through a live region.
- **Motion**: respects `prefers-reduced-motion`.
- **Zoom**: works at 400% and at a 375px screen width.

See `/accessibility` for the statement template.

## SEO

- **Metadata**: per-page titles and descriptions, a default share image (`app/opengraph-image.tsx`), and `sitemap.xml` and `robots.txt`. Robots keeps the dashboard and form steps out of search.
- **Structured data**: Organization, WebSite and Course.
- **Site URL**: set `NEXT_PUBLIC_SITE_URL` (see `.env.example`).

## Deploy

Deploys to [Vercel](https://vercel.com/new) with no configuration. Optionally, set `NEXT_PUBLIC_SITE_URL` to your domain.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
