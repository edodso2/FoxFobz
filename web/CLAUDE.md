# Web — notes for Claude

foxfobz.com storefront: **Astro 7** on **Cloudflare Workers** (static assets + server routes), Stripe Checkout, Cloudflare D1 (email subscribers only — Stripe is the source of truth for orders), Turnstile, Cloudflare Access on `/admin`. Full setup/deploy guide: [README.md](README.md).

- Commands (run in `web/`): `npm ci`, `npm run dev`, `npm run build`, `npm run deploy` (`astro build && wrangler deploy` — production; only when the user asks).
- Env vars are declared in `astro.config.mjs` (`envField`); local values in `.dev.vars` (gitignored, template `.dev.vars.example`). Never commit secrets.
- Cloudflare Workers Builds (git-push deploys) must use root directory `web/` and watch path `web/**`.
- Business copy/placeholders live in `src/site.config.ts`.
- Version: `package.json` `version`; tag production deploys `web/vX.Y.Z` (the user tags).
- Launch work (Stripe live, LLC details, marketing) is deferred until the product passes field testing (M5).
