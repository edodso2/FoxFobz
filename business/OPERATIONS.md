# Fox Fobz — Operations Manual

*Last updated: October 20, 2026*

This manual covers everything needed to run Fox Fobz day to day. It's written so that someone new could follow it without help. For why things are set up this way, see the business plan in [README.md](README.md).

Anything marked **[CONFIRM]** still needs to be filled in.

---

## Task List

**Daily (or each day orders come in)**

1. Check email
2. Check new orders in Stripe
3. Buy shipping labels
4. Pack orders
5. Ship packages
6. Mark orders shipped

**Weekly**

7. Check the PO box
8. Check inventory and supplies

**Monthly**

9. Do the books and sales tax
10. Run the monthly health check

**As needed**

11. Handle returns, refunds and warranty claims
12. Handle payment disputes (chargebacks)
13. Export the mailing list

---

## Accounts and Logins

**Never write passwords in this file.** Keep them in a password manager such as Bitwarden or 1Password, in a shared vault named "Fox Fobz". If you hire someone, add them as their own user where the service allows it (noted below), not by sharing the owner login.

| Service | What it's for | URL | Login | Separate user for a helper? |
|---|---|---|---|---|
| Zoho Mail | Company email | https://mail.zoho.com/zm/#mail/folder/inbox | admin@foxfobz.com | Yes: create them a mailbox (free plan allows 5 users) |
| Zoho Mail Admin | Manage mailboxes and aliases | https://mailadmin.zoho.com | admin@foxfobz.com | Owner only |
| Stripe | Payments, orders, refunds | https://dashboard.stripe.com | admin@foxfobz.com | Yes: Settings → Team |
| Fox Fobz Admin | Export orders, mark shipped, export mailing list | https://foxfobz.com/admin | Approved email; a one-time code is sent to that inbox | Yes: add their email in Cloudflare Access |
| Pirate Ship | Shipping labels and tracking emails | https://ship.pirateship.com | admin@foxfobz.com | [CONFIRM] |
| Cloudflare | Website, DNS, database, admin access | https://dash.cloudflare.com | admin@foxfobz.com | Yes: Manage Account → Members |
| YouTube Studio | Install video, comments | https://studio.youtube.com | [CONFIRM] | Yes: Settings → Permissions |
| USPS PO Box | Returns and mail | Libertytown, MD Post Office, box [CONFIRM #] | Physical key | Give them a key |
| Domain registrar | foxfobz.com renewal | [CONFIRM] (Cloudflare if registered there) | [CONFIRM] | Owner only |

Turn on two-factor authentication for every account. Store backup codes in the password manager.

---

## What Happens Automatically

You don't need to do any of these, but it helps to know they're happening:

- **Order receipt:** when a customer pays, Stripe emails them a receipt and emails us a payment notification.
- **Order saved:** the website saves the order, with the car's year and body style, to our database. It then shows up in `/admin` as unshipped.
- **Tracking email:** after we buy a label, Pirate Ship emails the customer their tracking number (one hour later by default) and BCCs us.
- **Sales tax:** Stripe Tax adds the right tax at checkout. Filing it is manual (Task 9).
- **Payouts:** Stripe deposits sales into the bank account on a set schedule.
- **Mailing list:** signups from the site and opt-ins at checkout are saved to our database. **No marketing email goes out** until we choose a newsletter provider.

---

## 1. Check Email

**When:** at least once a day, ideally morning and afternoon.
**Where:** https://mail.zoho.com/zm/#mail/folder/inbox (log in as admin@foxfobz.com)

On the free plan, Zoho Mail works only in the browser and in the Zoho Mail mobile app (iOS or Android). It can't be added to Apple Mail, Outlook or Gmail.

**Steps:**

1. Open the inbox. Check the support@ and orders@ messages too, if they're set up as aliases or separate mailboxes.
2. Sort each message:
   - **Stripe payment notification:** a new order. Go to Task 2.
   - **Pirate Ship tracking BCC:** confirms the customer got tracking. No action needed.
   - **Customer question** (fit, install, app, "where's my order"): reply within 1 business day. Use the replies below.
   - **Return or warranty request:** go to Task 11.
   - **Stripe dispute notice:** go to Task 12. **This one is urgent.**
3. File or archive anything handled so the inbox shows only open items.

**Common replies:**

- **"Will it fit my car?"** Every 1985–1993 Mustang (LX, GT or Cobra; coupe, hatchback or convertible) with factory power locks is supported. [CONFIRM: any exceptions, such as cars without power locks]
- **"How do I install it?"** Link the install video: [CONFIRM YouTube link].
- **"Where's my order?"** Look up the order in Pirate Ship (Shipments) by name and send the tracking link. If no label exists yet, tell them when it will ship.

---

## 2. Check New Orders in Stripe

**When:** daily, after checking email.
**Where:** https://dashboard.stripe.com/payments

**Steps:**

1. Open Payments and filter to **Succeeded** payments since the last check.
2. For each new order, glance at:
   - **Status:** it should say Succeeded. Ignore Incomplete or Failed; the customer didn't finish paying.
   - **Risk:** Stripe shows a risk level. If it's **Elevated or Highest**, don't ship yet. Check the name, billing and shipping addresses for a mismatch, and email the customer to confirm. If it looks like fraud, refund it (see Task 11) instead of shipping.
   - **Car year and body style:** shown in the order details and in `/admin`. [CONFIRM: does the kit change by year or body style? If yes, note which version to pack.]
3. Open https://foxfobz.com/admin and confirm the same orders appear as **unshipped**. If a paid order is missing from `/admin`, the webhook didn't save it. Note it and fix it (see Troubleshooting).

---

## 3. Buy Shipping Labels

**When:** once a day, if there are unshipped orders. Ship within [CONFIRM: shipping window, such as 2 business days] of the order.
**Where:** https://foxfobz.com/admin, then https://ship.pirateship.com

**Steps:**

1. In `/admin`, click **"Export unshipped orders."** A CSV file downloads.
2. In Pirate Ship, go to **Ship** and choose **Upload a Spreadsheet**. Select the CSV.
3. Check that each row looks right: name, address, email, package weight and dimensions.
   - Default package: [CONFIRM: box size, such as 8 × 6 × 4 in] and [CONFIRM: weight, such as 1 lb 2 oz].
   - Fix any address Pirate Ship flags as invalid. If you can't tell what it should be, email the customer before buying the label.
4. Choose the service: [CONFIRM: USPS Ground Advantage or Priority Mail].
5. Buy the labels and print them. [CONFIRM: printer, such as a 4 × 6 thermal label printer]
6. Pirate Ship emails each customer their tracking automatically. You don't need to send anything.

---

## 4. Pack Orders

**When:** right after printing labels.
**Where:** [CONFIRM: where inventory and packing supplies are kept]

**Packing checklist, for each order:**

- [ ] Receiver board
- [ ] 2 × New Edge–style key fobs, batteries installed [CONFIRM battery type]
- [ ] Install hardware [CONFIRM what's included: wiring, connectors, zip ties, mounting tape]
- [ ] Quick start card with QR codes for the install video and app download [CONFIRM]
- [ ] Correct version for the car's year and body style, if it differs [CONFIRM]

**Steps:**

1. Test the fobs with a bench receiver before packing, if possible. [CONFIRM: test procedure]
2. Put the parts in the box with padding so nothing rattles.
3. Tape the box shut and stick on the label. Make sure the barcode lies flat and isn't covered by tape seams.
4. Match each label to the right box. Check the name on the label against the order if the kits differ.

---

## 5. Ship Packages

**When:** same day as packing.

**Options:**

- **Drop off** at the Libertytown, MD Post Office (also where the PO box is).
- **Free USPS pickup:** schedule it in Pirate Ship or at https://tools.usps.com/schedule-pickup-steps.htm. Schedule it the day before, or early that morning.

Labels are prepaid, so you don't need to wait in line. Hand them over at the counter or use the drop slot for prepaid packages.

---

## 6. Mark Orders Shipped

**When:** right after the packages are handed off.
**Where:** https://foxfobz.com/admin

**Steps:**

1. Find each order you shipped today.
2. Click **Mark shipped**. [CONFIRM: is there a field for the tracking number?]
3. Check that the unshipped list is now empty, or shows only orders you're holding on purpose.

**This step matters:** if an order isn't marked shipped, it shows up in the next CSV export and could be shipped twice.

---

## 7. Check the PO Box

**When:** weekly, plus whenever a customer says they've sent a return.
**Where:** Libertytown, MD Post Office, box [CONFIRM #]. Lobby hours: [CONFIRM].

**Steps:**

1. Empty the box. If there's a yellow parcel slip, take it to the counter, or use the parcel locker key if one is left in the box.
2. Returned kits: match each one to the customer's email and the order in Stripe. Then follow Task 11.
3. Business mail (bills, tax notices, government letters): photograph or scan it and file it. Pass anything from the IRS or the State of Maryland to the owner right away.
4. Renew the box before it expires: [CONFIRM renewal date]. You can renew online at https://poboxes.usps.com.

---

## 8. Check Inventory and Supplies

**When:** weekly.

**Count what's on hand and reorder when below the reorder point:**

| Item | Supplier | Reorder at | Order quantity |
|---|---|---|---|
| Receiver boards | [CONFIRM: PCB maker or assembly service] | [CONFIRM] | [CONFIRM] |
| Fob boards and shells | [CONFIRM] | [CONFIRM] | [CONFIRM] |
| Fob batteries | [CONFIRM] | [CONFIRM] | [CONFIRM] |
| Install hardware | [CONFIRM] | [CONFIRM] | [CONFIRM] |
| Shipping boxes | [CONFIRM] (Pirate Ship can order free USPS Priority boxes, if using Priority) | [CONFIRM] | [CONFIRM] |
| Padding and tape | [CONFIRM] | [CONFIRM] | [CONFIRM] |
| Labels | [CONFIRM] | [CONFIRM] | [CONFIRM] |
| Quick start cards | [CONFIRM: printer] | [CONFIRM] | [CONFIRM] |

**If stock runs out:** stop sales before orders come in that can't be filled. In Stripe, go to **Product catalog**, open the kit, and archive the price or deactivate the payment link. [CONFIRM: how the site shows "sold out"]

---

## 9. Do the Books and Sales Tax

**When:** monthly, in the first week of the month.

**Steps:**

1. **Revenue:** in Stripe, go to **Reports** (https://dashboard.stripe.com/reports) and download last month's balance summary. Note gross sales, refunds and Stripe fees.
2. **Payouts:** check that Stripe payouts (https://dashboard.stripe.com/payouts) arrived in the bank account.
3. **Shipping costs:** in Pirate Ship, go to **Reports** or billing history and download last month's label charges.
4. **Other costs:** record parts orders, supplies, PO box rent, domain and any subscriptions.
5. Record everything in [CONFIRM: spreadsheet or accounting tool].
6. **Sales tax:** in Stripe, go to **Tax → Reports** (https://dashboard.stripe.com/tax) to see tax collected by state. File and pay the Maryland return at https://interactive.marylandtaxes.gov. Filing frequency: [CONFIRM: monthly, quarterly or annual, as assigned by Maryland]. Check with the accountant about any other state where we must register.
7. **Check the $2,000/month trigger:** if revenue has been $2K+ for the month, flag it to the owner. That's the trigger for forming the LLC and moving to Shopify (see README Section 10).

---

## 10. Run the Monthly Health Check

**When:** monthly, alongside Task 9.

- [ ] **Website up:** visit https://foxfobz.com, run through to checkout, and confirm the Stripe checkout page loads. You don't need to pay.
- [ ] **Unshipped orders:** nothing in `/admin` older than the shipping window.
- [ ] **Disputes:** none open at https://dashboard.stripe.com/disputes.
- [ ] **Analytics:** in Cloudflare, go to **Analytics & Logs → Web Analytics**. Note visitors and top pages.
- [ ] **YouTube:** answer new comments on the install video at https://studio.youtube.com. They are often install questions.
- [ ] **Renewals:** domain (foxfobz.com) and PO box are not about to expire.
- [ ] **Zoho storage:** each mailbox has 5 GB on the free plan. Delete or archive old attachments if one is getting full.

---

## 11. Handle Returns, Refunds and Warranty Claims

**When:** whenever a customer asks.
**Policy:** return window [CONFIRM: such as 30 days]; warranty [CONFIRM: such as 1 year]. See the shipping, warranty and returns pages on the site.

**Return (customer wants their money back):**

1. Confirm the order is within the return window (check the order date in Stripe).
2. Reply with return instructions: ship to the PO box address below, by **USPS only**. UPS and FedEx can't deliver to a PO box. [CONFIRM: who pays return shipping]
3. When it arrives (Task 7), check that everything is there and undamaged.
4. Refund in Stripe: open the payment at https://dashboard.stripe.com/payments, click **Refund**, and choose full or partial. Stripe emails the customer automatically.
5. Put the returned parts back into inventory if they can be resold, or set them aside to inspect.

**Warranty claim (part failed):**

1. Ask for the order name or email, what failed, and a photo or short video if helpful.
2. Try troubleshooting first: fob battery, re-pairing, wiring check. [CONFIRM: troubleshooting steps]
3. If it's a real failure, send a replacement part. Create a label in Pirate Ship manually (**Ship → Single Label**). Ask for the failed part back if it's useful for diagnosis.
4. Log the claim: date, customer, part, cause. Repeated failures of the same part are a product problem to flag to the owner.

**Fraud or cancellation before shipping:** refund the full amount in Stripe and don't ship. If a label was already bought, void it in Pirate Ship (**Shipments**, select it, **Request refund**) before it's scanned.

**PO box address for returns:**

```
Fox Fobz
PO Box [CONFIRM #]
Libertytown, MD 21762
```

---

## 12. Handle Payment Disputes (Chargebacks)

**When:** as soon as Stripe emails a dispute notice. **There is a deadline.** Missing it means losing automatically.
**Where:** https://dashboard.stripe.com/disputes

**Steps:**

1. Open the dispute and note the reason (such as "fraudulent" or "product not received") and the response deadline.
2. Gather evidence:
   - the order details and receipt from Stripe
   - the tracking number and delivery confirmation from Pirate Ship
   - any emails with the customer from Zoho
3. Submit the evidence in Stripe before the deadline.
4. If the customer simply wants a refund, it's usually cheaper to accept the dispute. Ask the owner if unsure.

---

## 13. Export the Mailing List

**When:** only once we've picked a newsletter provider (not at launch).
**Where:** https://foxfobz.com/admin

**Steps:**

1. In `/admin`, click the subscriber export. A CSV downloads.
2. Import it into the newsletter provider.
3. Before sending anything, check the rules in README Section 7: unsubscribe link, PO box address in every email, and a separate sending subdomain.

---

## Troubleshooting

| Problem | What to do |
|---|---|
| Paid order in Stripe but not in `/admin` | In Stripe, go to **Developers → Webhooks** (https://dashboard.stripe.com/webhooks). Open the endpoint and look for failed events, then click **Resend**. If it keeps failing, contact the owner or developer. |
| Can't log in to `/admin` | Check that the email is on the Cloudflare Access allow list (https://one.dash.cloudflare.com → Access → Applications). Check spam for the one-time code. |
| Customer didn't get tracking email | Check the Pirate Ship BCC in Zoho. If it went out, ask them to check spam. Otherwise send the tracking link by hand from Zoho. |
| Customer didn't get receipt | In Stripe, open the payment and click **Send receipt**. |
| Pirate Ship rejects the CSV | Check that the file wasn't opened and re-saved in Excel, which can change the format. Export again from `/admin` and upload the fresh file. |
| Website is down | Check https://www.cloudflarestatus.com. Then check the latest deploy in Cloudflare (**Workers & Pages** → foxfobz). Contact the owner or developer. |
| Email not arriving in Zoho | Check https://status.zoho.com. In Cloudflare DNS, confirm Zoho's MX records are still there and Cloudflare Email Routing is turned off. |

---

## Key Contacts

| Who | For | Contact |
|---|---|---|
| Owner | Anything not covered here | [CONFIRM] |
| Developer | Website, `/admin`, webhook problems | [CONFIRM] |
| Accountant | Sales tax, books | [CONFIRM] |
| Stripe support | Payments, disputes | https://support.stripe.com |
| Pirate Ship support | Labels, CSV import | https://support.pirateship.com |
| Zoho support | Email | https://www.zoho.com/mail/help |
