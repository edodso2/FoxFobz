# Fox Fobz — LLC Setup

*Last updated: October 20, 2026*

This covers what to set up once **Nostalgia Fuel LLC** exists, so Fox Fobz officially belongs to it. For when and why we form the LLC, see the business plan in [README.md](README.md) (Section 9). For day-to-day tasks, see [OPERATIONS.md](OPERATIONS.md).

Anything marked **[CONFIRM]** still needs to be filled in.

---

## How the Pieces Fit

- **Nostalgia Fuel LLC** is the legal owner. It holds the EIN, the bank account and the contracts.
- **Fox Fobz** is a brand (DBA) of the LLC. It's the name customers see.
- Future brands become additional DBAs of the same LLC.

---

## 1. Register "Fox Fobz" as a DBA of the LLC

**When:** right after the LLC is formed.
**Where:** Maryland calls this a **trade name**. File it with the Maryland Department of Assessments and Taxation (SDAT) through Maryland Business Express: https://egov.maryland.gov/BusinessExpress [CONFIRM: current fee and renewal period]

1. File a trade name for **Fox Fobz** under **Nostalgia Fuel LLC**.
2. Save the approved filing in the business records. Banks sometimes ask for it before they'll deposit payments made out to "Fox Fobz".
3. Give a copy to the bank when opening the business account (see below).

**Why:** it's usually cheap and quick, and it makes the brand officially belong to the LLC.

**Later brands:** repeat this filing for each new brand.

---

## 2. Set Up Stripe

**Where:** https://dashboard.stripe.com/settings/business

Before starting, have ready:

- the LLC's EIN
- a business bank account in the LLC's name

| Setting | Value | What it does |
|---|---|---|
| Legal business name | Nostalgia Fuel LLC | Who Stripe pays and reports to the IRS. Must match the EIN. |
| Public business name | Fox Fobz | What customers see on Checkout and receipts. |
| Statement descriptor | FOXFOBZ.COM | What appears on the customer's card statement. |
| Bank account for payouts | The LLC's business account | Where Stripe deposits sales. |

**The statement descriptor matters more than people expect.** If the card statement says "NOSTALGIA FUEL" and the customer has never heard of it, we get "I don't recognize this charge" disputes. Every dispute costs a fee, even when we win (see OPERATIONS.md Task 12).

**Moving the existing account:** the current Stripe account was set up for the sole proprietorship. [CONFIRM: whether Stripe lets us change the business type and EIN on the existing account, or whether we need a new account for the LLC.]

**Later brands:** one Stripe login can hold several accounts, all owned by the same LLC. Give each brand its own account so branding, receipts, descriptors and reporting stay separate. Fox Fobz just needs one for now.

---

## Checklist

- [ ] LLC formed in Maryland
- [ ] EIN obtained
- [ ] "Fox Fobz" trade name filed under Nostalgia Fuel LLC
- [ ] Business bank account opened in the LLC's name
- [ ] Stripe legal name, EIN and bank account updated to the LLC
- [ ] Stripe public business name set to Fox Fobz
- [ ] Stripe statement descriptor set to FOXFOBZ.COM
- [ ] Pirate Ship, Cloudflare and the domain moved into the LLC's name (README Section 9)
