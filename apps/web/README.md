# @visa-lark/web

The site at <https://visa-lark.vercel.app>: landing page, docs and an offline demo with made-up
data. Next.js 15 (App Router) and Tailwind. It holds no secrets and never contacts the visa site.

- `/` landing page, `/docs` setup and safety notes, `/demo` mock dashboard (no network requests).
- Copy is in `src/lib/i18n.ts` for zh, en, ja and ko; the long docs page is zh and en only.
- `public/popup.png` is a screenshot of the built extension (same as `docs/img/popup.png`) and
  serves as the hero fallback and link preview image; `public/mascot.png` is the favicon.

```bash
pnpm --filter @visa-lark/web dev
pnpm --filter @visa-lark/web build
pnpm --filter @visa-lark/web lint
pnpm --filter @visa-lark/web typecheck
```

To deploy on Vercel, import the repo with root directory `apps/web`; `vercel.json` only sets the
framework to Next.js. There are no environment variables.
