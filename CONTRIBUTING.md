# Contributing

Thanks for helping. A few things keep this template easy for everyone to use.

## Before you open a pull request

```bash
npm run check   # type-check, lint, format check and tests
npm run build
```

CI runs the same checks on every pull request.

## Code style

- TypeScript strict. No `any`.
- Prettier formats everything (`npm run format`); it also sorts Tailwind classes.
- Put logic in pure functions in `lib/` (selectors and rules), not in components.
- Store actions validate first, and return `{ ok: false, reason }` with a reason written for the person using the page.
- Use shadcn/ui components and Hugeicons. Don't add hand-drawn SVG illustrations.
- Read "now" (`new Date()`) only in the browser, so pages can be prerendered.

## Accessibility is required

Every change should keep these true:

- One `h1` per page and a logical heading order.
- Every control has a visible label. Hints are linked with `aria-describedby`.
- Forms use the GOV.UK pattern: an error summary that takes focus, and inline errors that say what to do.
- Status is in words, never color alone.
- Touch targets are at least 44px, and the amber focus ring stays visible.
- It works with a keyboard only, at 400% zoom, and at a 375px screen width.

## Writing

Plain language, aiming for reading grade 8 or below. Short sentences. Say what to do ("Enter your email address"), not what went wrong ("Invalid input").

## Demo data

Keep every name, place, organization and number fictional. Use `.example` email domains and `(555)` phone numbers.
