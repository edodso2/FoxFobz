# Fox Fobz — Business Plan

*Last updated: October 20, 2026*

For day-to-day tasks, see the operations manual: [OPERATIONS.md](OPERATIONS.md).

---

## 1. Overview

**Fox Fobz** makes a modern keyless entry system for 1985–1993 Ford Mustangs (Fox body). Fox Fobz designs every part of the product in-house.

**The kit includes:**

- A custom, small receiver board built with modern components
- Two New Edge Mustang–style key fobs with custom boards compatible with the reciever
- Access to the Fox Fobz mobile app

**What sets it apart:** the receiver measures the door lock circuit. That lets the app:

- **Monitor actuator health.** It detects when a door lock actuator is starting to fail.
- **Send current draw alerts.** It flags when an actuator draws more amps than usual and needs servicing.
- **Configure unlock behavior.** One press unlocks both doors, or the first press unlocks only the driver door and a second press unlocks both.

No generic aftermarket remote kit tells a Fox owner that their 30-plus-year-old lock actuators are wearing out. No generic remote kit is as small. No generic remote kit has plug and play install. 

---

## 2. Target Customer

The target customer owns a 1985–1993 Mustang (LX, GT, or Cobra in coupe, hatchback, or convertible) and wants a clean, modern convenience upgrade that respects the car.

Before buying, they will be asking three questions:

1. **Does it fit my car?** The site answers this with the year and body style selector and its fit confirmation.
2. **Can I install it myself?** The site answers this with the full install video.
3. **Is it worth it compared with a generic remote kit?** The site answers this with the app diagnostics, the New Edge–style fobs, and the in-house design.

---

## 3. Sales Channel Strategy

**Phase 1: dedicated site (foxfobz.com).** We start with our own site so that we:

- keep the customer relationship (emails, feedback, reviews)
- keep full margin, with no marketplace fees
- build **Fox Fobz** as a brand people can find directly

**Later phase: marketplaces (eBay, Amazon, others).** Marketplace listings should point people back to the brand. When we add marketplaces, we keep SKU names consistent with the Stripe products from day one.

---

## 4. Website

### Goals, in priority order

1. **Convert** Fox owners who land on the site into buyers.
2. **Own the customer list** through email signups and customers who opt in.
3. **Build the brand** so that every other channel feeds back to Fox Fobz.

### Home page layout

1. Hero: "Keyless entry, re-engineered for the Fox," with a Shop button
2. Three short feature points: receiver, fobs, app
3. **Product listing:** year and body style selectors, fit confirmation, what's in the box, quantity, Add to Cart
4. **Install video** with chapter steps
5. **App promo:** lock health, current draw alerts, unlock mode
6. Designed in-house / brand story
7. Email signup
8. Footer: PO box address, "not affiliated with or endorsed by Ford Motor Company" disclaimer, links

### Design direction

- Premium, dark graphite background, warm off-white text, one amber accent color
- **Karla ExtraLight (200)** for headlines; regular weights (300–600) for body text, so small text stays readable on the dark background
- Design canvas: https://claude.ai/artifact/FV7Aite2dPysFcbq9XRpuN

---

## 5. Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| Site framework | **Astro** (TypeScript) | Fast, mostly static site; ideal for one product. Small server endpoints where needed. |
| Hosting, DNS, functions | **Cloudflare** (Pages and Workers) | **Allows commercial use**, low or no cost at our scale, global CDN. Hosting, DNS, database, email forwarding and bot protection in one account. |
| Database | **Cloudflare D1** (SQLite) | Stores orders and mailing list signups. |
| Payments | **Stripe Checkout** (hosted) | Stripe handles card data, Apple Pay and Google Pay, address collection, shipping rates and receipts. We never touch card numbers. |
| Sales tax | **Stripe Tax** | Calculates tax at checkout. |
| Shipping labels and tracking emails | **Pirate Ship** | Discounted USPS labels; customizable tracking emails. |
| Spam protection | **Cloudflare Turnstile** | Keeps bots out of the signup form. |
| Install video | **YouTube** (embedded) | Fox owners search YouTube, so the video doubles as marketing. |
| Analytics | **Cloudflare Web Analytics** | Privacy-friendly; no cookie banner needed. |
| Business email | **Zoho Mail (Forever Free plan)** | Real foxfobz.com mailboxes (such as support@) for free: up to 5 users, 5 GB each. Web and mobile app access only on the free plan (no IMAP/POP). |

### Why we're not using Shopify (for now)

AI coding agents make a custom storefront cheap to build. For a single-product store, Shopify's monthly fees and app costs aren't justified yet. What Shopify really provides is operations: order management, shipping, tax and inventory. We cover each of these with lightweight services instead:

| Operations need | How we handle it now |
|---|---|
| Payments and receipts | Stripe |
| Sales tax | Stripe Tax |
| Order list and admin | Stripe dashboard plus a simple `/admin` page |
| Shipping labels and tracking | Pirate Ship |
| Inventory | Manual (one SKU) |

---

## 6. Decision: Stripe + Pirate Ship

**Decision:** At launch, Stripe handles payments and order confirmation emails, and Pirate Ship handles shipping labels and tracking emails. **No separate email-sending service (such as Resend) at launch.**

**Why:**

- **Simplicity.** Two services we need anyway now cover both order emails. That means one less vendor, one less bill and less code.
- **Stripe receipts.** These are sent automatically on successful payment, branded with our logo and color in the Stripe dashboard. Stripe also notifies us of each new payment, so we don't need a custom new-order alert.
- **Pirate Ship tracking emails.** These are sent automatically after we buy a label, with a delay we can set (one hour by default). They're fully customizable in HTML with our own sender name, can be sent from a verified foxfobz.com address with DKIM records, and can BCC us.

**Known gap and workaround:**

- Pirate Ship has no direct Stripe integration. It does accept spreadsheet uploads.
- **Workaround:** the `/admin` page has an **"Export unshipped orders"** button that downloads a CSV in Pirate Ship's format, including the customer's email so tracking emails go out.

**Trade-off we accept:** the confirmation email looks like a Stripe receipt rather than a fully custom Fox Fobz email. That's fine at launch.

### Order workflow

1. A customer checks out on Stripe. Stripe sends their receipt and notifies us.
2. A Stripe webhook saves the order (with year and body style) to the database. The webhook sends no emails.
3. We open `/admin` and export unshipped orders as a CSV.
4. We upload the CSV to Pirate Ship and buy labels. Pirate Ship emails each customer their tracking.
5. We mark the orders shipped in `/admin`.

---

## 7. Decision: Email and Mailing List

**Decision:** Collect mailing list signups now. **Send no marketing email until we choose a newsletter provider.**

- **Where the list lives:** our own database (the `subscribers` table in D1). We own the list and can move it anywhere.
- **Signup sources:**
  - the email signup form on the site, protected by Turnstile, with a consent timestamp stored
  - customers who opt in to promotional email at Stripe Checkout
- **When we start marketing:** choose a newsletter provider, export the list from `/admin` as a CSV, and import it.
- **Requirements when we start sending:**
  - double opt-in, or a confirmation pass, for list quality
  - a working unsubscribe link in every email
  - **a physical mailing address in every marketing email**, as US anti-spam law requires; the PO box qualifies
  - SPF, DKIM and DMARC records set up on foxfobz.com
  - a separate sending subdomain for marketing (such as `news.foxfobz.com`) so marketing email can't hurt delivery of order emails

**Why:** collecting the list from day one keeps our most valuable marketing asset growing. Deferring the sending tools keeps launch simple.

---

## 8. Decision: Hosting on Cloudflare

**Decision:** Host the site, functions and database on Cloudflare.

**Why:**

- **Cloudflare's plans allow commercial use.** Some competitors' free tiers are limited to non-commercial projects.
- Low or no cost at launch volume.
- Hosting, DNS, D1, Turnstile, Web Analytics and Access (for protecting `/admin`) all live in one account. Company email is on Zoho Mail instead (see Section 5).

**Revisit if:** the mobile app needs user accounts or cloud sync. In that case, consider Supabase (Postgres plus auth) for the backend before building app features on D1.

---

## 9. Business Structure

- **At launch:** operate as a sole proprietor.
- **Trigger to form an LLC:** **revenue of $2,000+ per month**, at the same time as the Shopify migration (see Section 10).
- **When forming the LLC** (step-by-step setup in [LLC_SETUP.md](LLC_SETUP.md)):
  - register the LLC in Maryland
  - get an EIN
  - open a business bank account
  - move Stripe, Pirate Ship, Cloudflare and the domain into the business's name
  - review product liability insurance
  - review where we're required to collect sales tax, with an accountant

> **Note:** we sell an electrical product installed in cars, so liability protection may be worth having earlier than the revenue trigger. Talk to an attorney or accountant before launch, even if we keep $2K/month as the plan.

---

## 10. Scaling Plan

### Main trigger: $2,000+ per month in revenue

When revenue sustains **$2K+ per month**:

1. **Migrate to Shopify headless.**
   - Keep our custom Astro front end and design.
   - Use Shopify as the back end for products, checkout, orders, inventory and fulfillment.
   - Benefits: real order management, inventory sync across marketplaces, Pirate Ship's direct Shopify integration, and an app ecosystem for reviews, email and returns.
2. **Form the LLC** (Section 9).
3. Move the mailing list and email marketing to a dedicated provider, if we haven't already.

### Other signals to watch

| Signal | Action |
|---|---|
| Listing on eBay or Amazon | Inventory sync becomes the hard problem; it may justify moving to Shopify before $2K/month. |
| Exporting and uploading CSVs to Pirate Ship gets tedious | Automate labels (Shopify integration, or Shippo/EasyPost). |
| Need for fully branded order emails | Add an email service (such as Resend), or rely on Shopify after migration. |
| Mobile app needs accounts or cloud sync | Add Supabase or a similar backend. |

---

## 11. Pre-Launch Checklist

### Business and legal

- [ ] **Rent a PO box in Libertytown, MD** (https://poboxes.usps.com/findBox.html?q=libertytown%20maryland)
  - [ ] Choose **Medium or larger**, or confirm parcel locker access, so returned kits fit
  - [ ] Ask whether the location offers a street address with the box; without it, UPS and FedEx can't deliver returns, so returns must come by USPS
- [ ] Use the PO box as the return address on labels, in the website footer, and for public support info
- [ ] Confirm what address Stripe needs for the account itself
- [ ] Talk to an accountant or attorney: sales tax obligations and liability (see Section 9 note)
- [ ] Write the legal pages: privacy policy, terms, shipping policy, warranty and returns

### Domain and email

- [ ] Register or confirm **foxfobz.com** and move DNS to Cloudflare
- [ ] Sign up for **Zoho Mail Forever Free** and verify foxfobz.com
- [ ] Create the support@foxfobz.com mailbox (and orders@ as a mailbox or alias, if desired)
- [ ] Add Zoho's MX records in Cloudflare DNS (don't turn on Cloudflare Email Routing; it also uses MX records)
- [ ] Add SPF, DKIM and DMARC records (SPF includes Zoho; DKIM from Zoho's admin console)

### Stripe

- [ ] Create the Stripe account and verify the business
- [ ] Create products and prices: the kit [PRICE], spare fob [CONFIRM IF OFFERED]
- [ ] Enable **Stripe Tax**
- [ ] Set up shipping rates: US only to start [CONFIRM flat rate or calculated]
- [ ] **Turn on automatic receipt emails**; add logo and brand color
- [ ] Turn on payment notification emails to us
- [ ] Set up the webhook endpoint and secret

### Pirate Ship

- [ ] Create the account
- [ ] Set **Return Address** to the PO box
- [ ] Set the tracking email template: sender name "Fox Fobz", branded HTML, BCC ourselves
- [ ] Verify the foxfobz.com sender address and add DKIM and Return-Path records
- [ ] Confirm package weight and dimensions for the CSV export defaults

### Website content

- [ ] Product photos: full kit, receiver board, fobs in hand, app screen
- [ ] Install video (YouTube): fill in install time and skill level
- [ ] Confirm what's in the box (install hardware)
- [ ] Confirm app platforms (iOS and Android) and app store links
- [ ] Shipping window and warranty terms
- [ ] Brand story copy
- [ ] FAQ: factory alarm compatibility, aftermarket door locks, fob battery type

### Technical

- [ ] Protect `/admin` with Cloudflare Access
- [ ] Set up Turnstile keys
- [ ] Run D1 migrations
- [ ] Set up Cloudflare Web Analytics
- [ ] End-to-end test: Stripe test purchase → webhook saves order → CSV export → Pirate Ship upload → tracking email received

---

## 12. Roadmap

**Phase 1: Launch**

- Home page, Stripe Checkout, webhook, order storage
- `/admin` with Pirate Ship CSV export and subscriber export
- Email signup (collect only), analytics, legal pages

**Phase 2: Polish**

- FAQ, customer car gallery, reviews
- First newsletter: choose a provider and import the list

**Phase 3: Growth (at the $2K/month trigger)**

- Shopify headless migration, LLC
- Marketplace listings (eBay, Amazon)
- Support and warranty claim form, app download links

---

## 13. Open Questions

- [ ] Does the app talk only to the car over Bluetooth, or does it need a cloud backend (accounts, firmware updates, warranty registration)? This decides D1 vs. Supabase.
- [ ] Will we offer spare fobs as a separate SKU?
- [ ] Will we ship internationally?
- [ ] Flat-rate or calculated shipping?
- [ ] Warranty length and return window?

---

## 14. Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-10-20 | Launch on a dedicated site (foxfobz.com) before marketplaces | Own the customer and the brand; keep margin. |
| 2026-10-20 | Custom site (Astro) instead of Shopify | AI makes custom code cheap; avoid SaaS fees for a single product. |
| 2026-10-20 | Host on Cloudflare | Allows commercial use; low cost; all-in-one platform. |
| 2026-10-20 | Stripe Checkout and Stripe Tax for payments | Hosted, secure checkout; automatic receipts; tax calculation. |
| 2026-10-20 | Stripe receipts as order confirmation emails | Simplicity; no separate email service at launch. |
| 2026-10-20 | Pirate Ship for labels and tracking emails | Discounted labels; customizable branded tracking emails. |
| 2026-10-20 | CSV export from `/admin` into Pirate Ship | No direct Stripe integration in Pirate Ship. |
| 2026-10-20 | Collect the mailing list in our own database; defer sending | Own the list; keep launch simple. |
| 2026-10-20 | Zoho Mail Forever Free for company email | Free real mailboxes on foxfobz.com, not just forwarding. |
| 2026-10-20 | Libertytown, MD PO box as public and return address | Required in marketing emails; keeps home address private. |
| 2026-10-20 | Migrate to Shopify headless and form an LLC at $2K+/month | Scale operations and liability protection with revenue. |
