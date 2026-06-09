# VisaLark Web — UI Overhaul Spec (shadcn/ui adoption)

Status: **PLAN ONLY — not yet implemented**. Date: 2026-06-09.
Target: `apps/web` (Next.js 15 App Router, React 19, Tailwind v3, i18n, dark mode).
Source of truth for shadcn workflow: `D:\agent-resources\skills\shadcn` (official skill + rules).

---

## 1. Goal & design posture

Make the public site **more beautiful and more powerful** while preserving VisaLark's
brand identity (lark/feather palette) and its core emotional job: **look trustworthy,
calm, technical — never like a sketchy "grabber" tool.** No flashy gradients-for-the-sake-of-it,
no aggressive motion. shadcn gives us accessible, consistent primitives and a real token
system; we keep the existing visual language and route it through tokens.

## 2. Theme direction — **keep custom palette, route through shadcn tokens**

Do **not** adopt a named preset (nova/vega/etc.). The lark/feather identity is already
coherent. Instead `init` shadcn and map the existing palette onto semantic tokens.

- `init` (no preset): `npx`/`pnpm dlx shadcn@latest init` in `apps/web`. This is a monorepo
  workspace — run inside `apps/web` and confirm `components.json` lands there with the right
  aliases (`@/components`, `@/lib/utils`).
- Token mapping in `apps/web/src/app/globals.css` (`tailwindCssFile`):
  - `--primary` ← lark-600; `--primary-foreground` ← white
  - `--accent` / warning surface ← feather (used for the "honest note" + disclaimer)
  - `--ring` ← lark-400 (matches current focus rings)
  - `--background`/`--foreground`/`--card`/`--muted`/`--border` → light + **`.dark`** block
    reusing the current `dark:bg-slate-950 / text-slate-200` choices.
- Keep the `lark`/`feather` Tailwind color scales in `tailwind.config` — they stay valid for
  bespoke accents (mascot art, hero glow), but **component chrome migrates to tokens.**
- Keep `darkMode: ["class"]` and the existing `theme-toggle.tsx` (shadcn `.dark` slots in cleanly).

## 3. Components to add (mapped to real pages)

Priority order (high-leverage first):

| Component | Replaces / powers | Page(s) |
|-----------|-------------------|---------|
| `button` | `.btn`/`.btn-primary`/`.btn-ghost` classes | everywhere |
| `card` | `.card` class | What / Safety / Features / Install |
| `badge` | `.badge` class | hero, safety planes, compare header |
| `table` | hand-rolled `<table>` | `CompareSection` |
| `alert` | custom feather disclaimer div + hero honest-note | `DisclaimerSection`, hero |
| `accordion` | docs sections / FAQ | `/docs`, install steps |
| `tabs` | demo mode switching | `/demo` |
| `navigation-menu` | `site-header.tsx` nav | header |
| `separator` | manual border divs | footer, sections |
| `tooltip` | safety "Why →" explainers | Safety pillars |
| `sonner` | (new) copy-install-command toast | Install |

Keep as-is (no shadcn equivalent / brand art): hero mascot+banner art, `bg-grid` backdrop,
`section.tsx` layout wrapper, locale toggle, i18n strings.

## 4. Page-by-page upgrade

**Hero** (`app/page.tsx`): CTAs → `Button` (`variant="default"` install, `variant="outline"`
demo/docs, with `data-icon`). Badge → `Badge variant="secondary"`. Honest-note box → `Alert`
(feather/warning tone). Keep mascot art + glow. Trust row → keep, but use `CheckIcon` via
lucide consistently.

**WhatSection / FeaturesSection** (`landing-sections.tsx`): `.card` → full `Card` composition
(`CardHeader`/`CardTitle`/`CardContent`). Feature icon tiles keep the lark gradient (brand
accent is fine here). Hover lift via `className`, not custom.

**SafetySection**: pillars → `Card`; the "Why →" note → `Alert` or `Tooltip`/`HoverCard`.
Two-plane diagram → `Card` with `Badge` labels (data plane = `default`, control plane =
`outline`/dashed). This is the trust centerpiece — keep it clean and legible.

**CompareSection**: hand-rolled table → `Table` (`TableHeader`/`TableRow`/`TableHead`/`TableCell`).
"Us" column accent = `--primary`; check icons via lucide `Check`. Zebra rows via `data-` + token.

**InstallSection**: 3 steps → `Card`; CTAs → `Button`; install command → `InputGroup` +
copy `Button` firing a `sonner` toast (real "powerful" upgrade vs static `<pre>`).

**DisclaimerSection**: custom feather box → `Alert` (`variant` mapped to feather warning tone),
keep the warning-triangle icon.

**Docs** (`/docs`, `docs-content.tsx`): long-form → `Accordion` for collapsible sections +
keep `.prose-doc` for body copy (or migrate to `@tailwindcss/typography` later — out of scope).

**Demo** (`/demo`, `demo-widgets.tsx`): wrap interactive widgets in `Tabs` + `Card`; status
states use `Badge` + `Alert`. (Demo holds zero secrets — pure mock, safe to make lively.)

**Header/Footer** (`site-header.tsx`/`site-footer.tsx`): nav → `NavigationMenu`; mobile →
`Sheet`; dividers → `Separator`.

## 5. Custom CSS: keep vs replace

- **Replace** `.btn*`, `.card`, `.badge` `@layer components` classes once their consumers move
  to shadcn (delete only after grep shows zero usages).
- **Keep** `.container-page`, `.eyebrow`, `.prose-doc`, `.bg-grid`, hero glow/float animations.
- **Migrate** raw `text-slate-900 dark:text-white` etc. in `section.tsx`/components → tokens
  (`text-foreground`, `text-muted-foreground`) so dark mode is token-driven, not per-element.

## 6. Motion & dark mode

- Motion: keep framer-motion `animate-fade-up`/`animate-float` for hero only; respect
  `prefers-reduced-motion`. No new motion on trust/safety content (calm = trustworthy).
- Dark mode: token-driven via `.dark` block; remove scattered `dark:` color overrides as
  components migrate (per shadcn styling rule: no manual `dark:` color overrides).

## 7. Migration risks

1. **Monorepo init**: shadcn must write `components.json` + utils into `apps/web`, not repo root.
   Verify aliases resolve against `apps/web/tsconfig`. (`packages/*` are not React UI — leave them.)
2. **Palette collision**: `lark`/`feather` scales vs new semantic tokens. Mitigation: tokens for
   chrome, named scales for brand accents only. Document the boundary in `components.json` PR.
3. **`.btn`/`.card` class removal**: must be incremental + grep-verified to avoid unstyled flashes.
4. **i18n**: components are presentational; all copy stays in `lib/i18n.ts`. No string hardcoding
   in migrated components.
5. **SSR/RSC**: `app/page.tsx` is already `"use client"` (uses locale ctx). New interactive
   shadcn bits (Tabs, Accordion, Sheet, sonner) need `"use client"`; static ones don't.

## 8. Sequencing

1. `init` shadcn in `apps/web` + token mapping + `.dark` block + verify build/dark toggle.
2. Add primitive set (`button card badge table alert separator tabs accordion tooltip navigation-menu sonner`).
3. Migrate **hero + landing-sections** (highest visibility) → verify.
4. Migrate **compare table + install + disclaimer** → verify.
5. Migrate **header/footer/docs/demo** → verify.
6. Delete dead `.btn/.card/.badge` classes after grep-clean → final build + dark-mode pass.

Verify `pnpm --filter @visa-lark/web build` + `typecheck` after each step.
