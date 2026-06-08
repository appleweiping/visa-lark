# @visa-lark/web

The public face of [VisaLark](../../DESIGN.md): marketing landing page, docs, and
an interactive **mock** dashboard demo. Next.js 15 (App Router) + Tailwind,
deploys to Vercel.

> **Holds ZERO secrets and never touches usvisa-info.** This app is part of the
> control plane (DESIGN.md §2). It depends on workspace packages for **types**
> and `FACILITY_SEEDS` reference data only — no visa network code, no adapter
> logic, no credentials.

## Pages

- **`/`** — landing. Honest positioning per DESIGN.md §10 (no "guaranteed grab" /
  "秒级抢到"), the two-plane safety model with *why it protects your account*, a
  feature grid, an honest comparison vs paid proxy grabbers, install CTAs, and a
  prominent legal disclaimer.
- **`/docs`** — getting started, the safety model, booking modes & auto-book
  interlocks, notifications, and self-hosting the optional control plane, plus an
  FAQ. Bilingual with an on-page table of contents.
- **`/demo`** — a fully offline, interactive mock dashboard: availability board
  per consulate (有位/紧缺/无位 badges + last-updated), a 7×24 calendar heatmap
  with a "best time to check" card, a monitor config form, and a notification
  settings preview. **Makes zero network requests.**

## Bilingual & theming

- zh (primary) / en, switchable in the header; the choice is persisted and the
  initial language is guessed from `navigator.language`. Copy lives in
  `src/lib/i18n.ts` as a typed dictionary so both languages stay in sync.
- Dark mode (Tailwind `class` strategy) with a no-flash inline script in
  `layout.tsx`; toggle persists to `localStorage`.

## Mascot art

The二次元 lark mascot art is generated later. The hero references `/banner.png`
and `/mascot.png` (placeholder PNGs ship in `public/`) with descriptive `alt`
text. Replace those two files to drop in the real art.

## Develop

```bash
pnpm --filter @visa-lark/web dev        # next dev
pnpm --filter @visa-lark/web build      # next build (static export of all routes)
pnpm --filter @visa-lark/web start      # next start
pnpm --filter @visa-lark/web lint       # eslint (next lint)
pnpm --filter @visa-lark/web typecheck  # tsc --noEmit
```

## Deploy to Vercel

Standard Next.js app — no custom `vercel.json` needed. Point Vercel at this
package (root `apps/web`) with the monorepo build command
`pnpm --filter @visa-lark/web... build`, or use Vercel's auto-detected pnpm
workspace support. Set the production domain and you're done; there are no
environment secrets because this app holds none.
