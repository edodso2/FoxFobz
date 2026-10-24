# foxfobz.com

The single-product store for the **Fox Fobz keyless entry kit** (1985–1993 Ford Mustang).

- **Astro 7** (TypeScript). Marketing and policy pages are prerendered static HTML; `/success`, `/admin` and `/api/*` run on demand.
- **Cloudflare Workers with static assets.** This is Cloudflare's successor to Pages, and since v13 it's the only target the official Astro adapter supports. Static files are served free from the edge; the Worker handles only the dynamic routes.
- **Stripe is the single source of truth for orders.** Each order is a succeeded PaymentIntent; fulfillment state lives in its metadata. `/admin` reads and updates orders through the Stripe API (`src/lib/orders.ts`).
- **Cloudflare D1** for email subscribers only (`migrations/`).
- **Stripe Checkout** (hosted) with Stripe Tax. Stripe sends the receipt; Pirate Ship sends tracking. **This codebase sends no email.**
- **Cloudflare Turnstile** on the email signup, **Cloudflare Access** in front of `/admin`, **Cloudflare Web Analytics**.
- **Karla** comes from Google Fonts. Astro's Fonts API downloads it at build time and serves it from foxfobz.com.

```
src/
  site.config.ts          ← business details, copy placeholders, Pirate Ship package defaults
  assets/photos/          ← drop product photos here (see "Photos")
  components/             ← homepage sections (Hero, Kit, Install, AppPromo, …)
  pages/
    index.astro, success.astro, cancel.astro, privacy/terms/shipping/warranty-returns.astro
    admin/index.astro     ← orders dashboard (Cloudflare Access)
    api/checkout.ts       ← POST: creates a Checkout Session, 303 → Stripe
    api/stripe-webhook.ts ← POST: verifies signature, adds a subscriber if they opted in at checkout
    api/subscribe.ts      ← POST: Turnstile + email → subscribers
    api/admin/*.ts        ← mark shipped, CSV exports
  lib/orders.ts           ← orders from Stripe: PaymentIntent search + Checkout Session details
  middleware.ts           ← verifies the Access JWT on /admin + /api/admin
migrations/0001_initial.sql
```

---

## 1. Local development

Requirements: Node 22+, a Stripe account in **test mode**, and the [Stripe CLI](https://docs.stripe.com/stripe-cli).

```sh
npm install
cp .dev.vars.example .dev.vars        # fill in Stripe test keys (see §2)
npm run db:migrate:local              # creates the local D1 database
npm run dev                           # http://localhost:4321
```

In a second terminal, forward Stripe webhooks to your machine:

```sh
npm run stripe:listen                 # prints a whsec_… secret, put it in .dev.vars as STRIPE_WEBHOOK_SECRET
```

Buy a kit with test card `4242 4242 4242 4242`. The order should appear at http://localhost:4321/admin within about a minute (Stripe Search lags slightly behind new payments). Locally, the Access check is skipped in `astro dev`.

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run check` | Type-check everything (`astro check`) |
| `npm run preview` | Production build served by `wrangler dev` (the real Worker runtime; Access is enforced, so `/admin` returns 403) |
| `npm run cf-typegen` | Regenerate `worker-configuration.d.ts` after editing `wrangler.jsonc` |

---

## 2. Stripe

Do all of this in **test mode** first, then repeat in live mode. Test and live have different IDs.

### Product and price
1. **Product catalog → Add product**: "Fox Fobz Keyless Entry". Add a product image and a short description; both appear on the Checkout page.
2. **Tax code:** *Tangible goods* — or the closest motor-vehicle-parts code Stripe suggests.
3. Add a one-time **Price** in USD with **tax behavior "Exclusive"** (tax added on top). Copy the price ID (`price_…`) → `STRIPE_PRICE_KIT`.
4. Put the same amount in `src/site.config.ts` → `product.priceDisplay` (e.g. `'$299'`). The site shows that text; the charge always comes from the Stripe price.

### Shipping rates
**Product catalog → Shipping rates → Create** (e.g. "USPS Ground Advantage — 3–5 business days", $X). Set the rate's **tax behavior** and **tax code** (*Shipping*) so Stripe Tax handles it correctly. Copy each `shr_…` ID into `STRIPE_SHIPPING_RATE_IDS`, comma-separated; the first is the default.

### Stripe Tax
**Tax → Settings**: set your origin address (the business address) and default tax behavior, then **add a registration** for every state where you collect sales tax. Stripe only calculates tax where you're registered. Its *Monitoring* tab shows when you're nearing other states' thresholds.

### Receipts and branding (dashboard only, no code)
- **Settings → Customer emails** → turn on **Successful payments** (receipts) and **Refunds**. This is the order confirmation email.
- **Settings → Branding**: icon, logo, brand color `#E9A23B`, accent `#0D0E10`. These style both Checkout and receipts.
- **Settings → Public details**: business name "Fox Fobz", support email `support@foxfobz.com`, the PO box address, website `https://foxfobz.com`, and links to `/terms` and `/privacy`.
- **Settings → Checkout and Payment Links**: optionally show the terms/privacy links.

### Promotional email consent
Checkout is created with `consent_collection.promotions: 'auto'`. Stripe shows an opt-in checkbox to US customers when it's available for your account. Customers who tick it are added to `subscribers` with source `checkout`. If Stripe ever rejects the option, `/api/checkout` logs a warning and retries without it, so a sale is never blocked.

### Orders live in Stripe
There is no orders table. `/api/checkout` puts this metadata on the **PaymentIntent** (and the fitment on the Checkout Session too):

| Key | Value |
| --- | --- |
| `fulfillment_status` | `unfulfilled`, then `shipped` once marked in `/admin` |
| `year`, `body_style` | the fitment chosen on the site |
| `tracking_number` | set when marked shipped (if entered) |
| `shipped_at` | ISO 8601 UTC, set when marked shipped |

`/admin` finds orders with the PaymentIntents Search API (`status:'succeeded'` plus `fulfillment_status`) and takes the name, email, phone and shipping address from the related Checkout Session (`customer_details` and `collected_information.shipping_details`). Fully refunded payments are hidden; partially refunded ones still show, since they usually still need shipping. You can also view or edit the metadata on the payment in the Stripe Dashboard.

Stripe Search is eventually consistent. New payments and metadata changes usually become searchable within a minute, so the admin says so and offers a **Refresh** button. Don't use Search right after writing data in new code; use the list/retrieve APIs for that.

### Webhook
**Developers → Webhooks → Add destination**
- Endpoint URL: `https://foxfobz.com/api/stripe-webhook`
- Events: `checkout.session.completed`
- Copy the signing secret (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`

The webhook only records promotional email consent (an upsert, so retries are safe). Orders don't depend on it.

### API key
Use a **restricted key** (`rk_live_…`) with **Write** on *Checkout Sessions* and *PaymentIntents* (metadata updates when marking orders shipped), and **Read** on *Charges*, *Products*, *Prices* and *Shipping rates*. Put it in `STRIPE_SECRET_KEY`. A standard secret key also works.

---

## 3. Cloudflare D1

```sh
npx wrangler login
npx wrangler d1 create foxfobz          # paste the printed database_id into wrangler.jsonc
npm run db:migrate:remote               # applies migrations/ to production
```

To change the schema, add `migrations/0002_….sql` and run the migrate script again. To query production:

```sh
npx wrangler d1 execute foxfobz --remote --command "SELECT email, source, consented_at FROM subscribers ORDER BY id DESC LIMIT 20"
```

---

## 4. Turnstile

**Cloudflare dashboard → Turnstile → Add widget**: hostnames `foxfobz.com` and `localhost`, mode **Managed**.

- Site key → `PUBLIC_TURNSTILE_SITE_KEY`. It's public and baked in at **build** time, so set it in the build environment (see §8).
- Secret key → `TURNSTILE_SECRET_KEY` (runtime secret).

The widget loads only when the signup form scrolls near the viewport, and stays invisible unless Cloudflare needs an interaction.

The checkout form doesn't use Turnstile on purpose. It only redirects to Stripe, which runs its own bot and fraud protection (Radar). A challenge there would add friction to every purchase.

---

## 5. Cloudflare Access for `/admin`

1. **Zero Trust → Access → Applications → Add → Self-hosted.**
2. Application domain: `foxfobz.com` path `admin`. Add a second destination `foxfobz.com` path `api/admin`.
3. Policy: **Allow**, *Emails* = your address(es). Login method: one-time PIN, or Google.
4. From the application's **Overview**, copy the **Application Audience (AUD) tag** → `CF_ACCESS_AUD`. Copy your team domain (e.g. `foxfobz.cloudflareaccess.com`) → `CF_ACCESS_TEAM_DOMAIN`.

`src/middleware.ts` also verifies the Access JWT on every admin request. If the Access app is ever misconfigured, the admin returns 403 instead of exposing customer data. `workers_dev` and `preview_urls` are disabled in `wrangler.jsonc` for the same reason.

### Using the admin
- **Export unshipped orders** downloads a CSV of every succeeded payment whose `fulfillment_status` is `unfulfilled`, oldest first. The Order ID column is the Stripe PaymentIntent ID (`pi_…`). In Pirate Ship: **Ship → Import Spreadsheet**, upload the file, confirm the column mapping on first use (Pirate Ship remembers it), and buy labels. Pirate Ship emails tracking to customers. Weight and dimensions come from `shippingPackage` in `src/site.config.ts`. Weigh a packed kit and update those values.
- **Mark shipped**: per row, or tick several rows and use **Mark selected as shipped**. This sets `fulfillment_status`, `shipped_at` and (optionally) `tracking_number` on the PaymentIntent. Pasting a tracking number is optional; typing one also ticks that row. The list can take a minute to show the change.
- **Export subscribers**: a CSV of active subscribers (email, source, consent timestamp) to import into a newsletter tool later.

---

## 6. Email: support@foxfobz.com

**Dashboard → foxfobz.com → Email → Email Routing → Enable.** Cloudflare adds the MX and SPF records. Create a custom address `support@foxfobz.com` that forwards to your personal inbox, and verify the destination address. To reply *as* support@, add it as a "Send mail as" alias in Gmail using an SMTP provider. That isn't needed for this phase.

---

## 7. Analytics

**Dashboard → Analytics & Logs → Web Analytics → Add a site → foxfobz.com.** Because the domain is proxied by Cloudflare, choose **automatic setup** and no code is needed. If you use manual setup instead, set `PUBLIC_CF_BEACON_TOKEN` at build time and the layout adds the beacon script.

---

## 8. Deploying

### Environment variables

| Name | Where | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | runtime secret | live restricted key |
| `STRIPE_WEBHOOK_SECRET` | runtime secret | from the live webhook endpoint |
| `STRIPE_PRICE_KIT` | runtime secret | live `price_…` |
| `STRIPE_SHIPPING_RATE_IDS` | runtime secret | live `shr_…`, comma-separated |
| `TURNSTILE_SECRET_KEY` | runtime secret | |
| `CF_ACCESS_TEAM_DOMAIN` | runtime secret | e.g. `foxfobz.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | runtime secret | Access application AUD tag |
| `PUBLIC_TURNSTILE_SITE_KEY` | **build** variable | public |
| `PUBLIC_CF_BEACON_TOKEN` | build variable (optional) | manual Web Analytics only |

Set runtime secrets once. They persist across deploys because `keep_vars` is set:

```sh
npx wrangler secret put STRIPE_SECRET_KEY
# …repeat for each runtime secret
```

### Option A: deploy from your machine
```sh
PUBLIC_TURNSTILE_SITE_KEY=0x… npm run deploy
```

### Option B: Workers Builds (deploy on every git push)
**Workers & Pages → foxfobz-website → Settings → Builds → Connect** your GitHub repo.
- Build command: `npm run build` · Deploy command: `npx wrangler deploy`
- **Build variables:** `PUBLIC_TURNSTILE_SITE_KEY` (and `PUBLIC_CF_BEACON_TOKEN` if used)

The first deploy attaches `foxfobz.com` and `www.foxfobz.com` as custom domains (see `routes` in `wrangler.jsonc`). The zone must already be on Cloudflare. Run `npm run db:migrate:remote` before the first deploy and again whenever you add a migration.

### Go-live checklist
- [ ] Every `[BRACKETED]` placeholder in `src/site.config.ts` is filled in (price, PO box, legal entity, shipping window, warranty, install time/skill, YouTube ID, app store links)
- [ ] The About paragraph in `src/components/About.astro`
- [ ] Product photos in `src/assets/photos/`
- [ ] Policy pages reviewed (ideally by a lawyer); carriers on `/shipping` are right
- [ ] Stripe live mode: product, price, shipping rates, Tax registrations, receipts on, branding, public details, webhook
- [ ] Live test purchase → order appears in `/admin` → mark it shipped → refund it in Stripe → it drops off the list
- [ ] Access app protects `/admin` and `/api/admin`; a logged-out browser gets the Access login

---

## Photos

Put images in `src/assets/photos/` with these names (any of `.jpg .png .webp .avif`). They're optimized at build time to AVIF/WebP at several sizes. Until a file exists, the design's placeholder box is shown.

| File name | Where | Suggested source size |
| --- | --- | --- |
| `hero` | Hero, square | 1200×1200 |
| `kit` | Kit section main photo, square | 1600×1600 |
| `kit-receiver`, `kit-fobs`, `kit-app` | Kit thumbnails, square | 800×800 |

Alt text is set in `Hero.astro` and `Kit.astro`.

---

## Out of scope (later phase)

Marketing email sending, double opt-in, and the unsubscribe flow. `subscribers.unsubscribed_at` already exists, and the export skips unsubscribed rows. When a newsletter provider is chosen, add those flows and either sync subscribers to it or import the CSV export.
