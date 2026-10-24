// Stripe is the single source of truth for orders. An order is a succeeded
// PaymentIntent created by /api/checkout; fulfillment state lives in its
// metadata, and customer/shipping details live on the related Checkout Session.
import type Stripe from 'stripe';
import { getStripe } from './stripe';

export type FulfillmentStatus = 'unfulfilled' | 'shipped';

export interface Order {
  id: string; // PaymentIntent ID
  livemode: boolean;
  created: number; // Unix seconds
  amount: number; // smallest currency unit (cents)
  currency: string;
  quantity: number;
  year: string | null;
  bodyStyle: string | null;
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber: string | null;
  shippedAt: string | null; // ISO 8601 UTC
  name: string | null;
  email: string | null;
  phone: string | null;
  address: Stripe.Address | null;
}

const isFulfillmentStatus = (s: string | undefined): s is FulfillmentStatus => s === 'unfulfilled' || s === 'shipped';

// Only PaymentIntents from our checkout carry fulfillment_status.
const queryFor = (status?: FulfillmentStatus) =>
  `status:'succeeded' AND ` +
  (status ? `metadata['fulfillment_status']:'${status}'` : `-metadata['fulfillment_status']:null`);

/**
 * Succeeded, not fully refunded orders, newest first. Stripe Search is
 * eventually consistent: payments and metadata changes from the last minute
 * or so may not be reflected yet. Search results have no guaranteed order, so
 * everything up to `limit` is fetched and sorted here; `truncated` says
 * whether there were more.
 */
export async function searchOrders({
  status,
  limit,
}: {
  status?: FulfillmentStatus;
  limit: number;
}): Promise<{ orders: Order[]; truncated: boolean }> {
  const stripe = getStripe();
  const found = await stripe.paymentIntents
    .search({ query: queryFor(status), limit: 100, expand: ['data.latest_charge'] })
    .autoPagingToArray({ limit: limit + 1 });
  const truncated = found.length > limit;

  const intents = found
    .slice(0, limit)
    // Search matches on a cached copy but returns current objects, so recheck
    // (e.g. an order marked shipped seconds ago must not be exported again).
    .filter((pi) => pi.status === 'succeeded')
    .filter((pi) => (status ? pi.metadata.fulfillment_status === status : isFulfillmentStatus(pi.metadata.fulfillment_status)))
    // Partial refunds (e.g. a shipping credit) still need shipping.
    .filter((pi) => !(typeof pi.latest_charge === 'object' && pi.latest_charge?.refunded))
    .sort((a, b) => b.created - a.created);

  const sessions = await sessionsFor(intents);
  return { orders: intents.map((pi) => toOrder(pi, sessions.get(pi.id))), truncated };
}

/**
 * Completed Checkout Sessions keyed by PaymentIntent ID. One paginated list
 * covers the whole batch; a session is created at most 24 hours before its
 * PaymentIntent, since that's the longest a session stays open.
 */
async function sessionsFor(intents: Stripe.PaymentIntent[]): Promise<Map<string, Stripe.Checkout.Session>> {
  const byIntent = new Map<string, Stripe.Checkout.Session>();
  if (intents.length === 0) return byIntent;

  const stripe = getStripe();
  const oldest = Math.min(...intents.map((pi) => pi.created));
  const add = (s: Stripe.Checkout.Session) => {
    const pi = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id;
    if (pi) byIntent.set(pi, s);
  };

  const listed = await stripe.checkout.sessions
    .list({ status: 'complete', created: { gte: oldest - 24 * 60 * 60 }, limit: 100, expand: ['data.line_items'] })
    .autoPagingToArray({ limit: 10_000 });
  listed.forEach(add);

  // Anything the batch missed (it shouldn't happen) is looked up individually.
  const missing = intents.filter((pi) => !byIntent.has(pi.id));
  const found = await Promise.all(
    missing.map((pi) =>
      stripe.checkout.sessions.list({ payment_intent: pi.id, limit: 1, expand: ['data.line_items'] }).then((r) => r.data[0]),
    ),
  );
  found.forEach((s) => s && add(s));

  return byIntent;
}

function toOrder(pi: Stripe.PaymentIntent, session: Stripe.Checkout.Session | undefined): Order {
  const customer = session?.customer_details;
  const shipping = session?.collected_information?.shipping_details;
  const quantity = session?.line_items?.data.reduce((sum, li) => sum + (li.quantity ?? 0), 0) || 1;
  return {
    id: pi.id,
    livemode: pi.livemode,
    created: pi.created,
    amount: pi.amount_received,
    currency: pi.currency,
    quantity,
    year: pi.metadata.year || null,
    bodyStyle: pi.metadata.body_style || null,
    fulfillmentStatus: pi.metadata.fulfillment_status as FulfillmentStatus,
    trackingNumber: pi.metadata.tracking_number || null,
    shippedAt: pi.metadata.shipped_at || null,
    name: shipping?.name ?? customer?.name ?? null,
    email: customer?.email ?? null,
    phone: customer?.phone ?? null,
    address: shipping?.address ?? customer?.address ?? null,
  };
}

/**
 * Marks an unfulfilled order as shipped. Returns false if the PaymentIntent
 * isn't an unfulfilled order (e.g. it was already marked shipped), so a
 * resubmitted form never overwrites the original tracking number or date.
 */
export async function markShipped(id: string, trackingNumber: string | null, shippedAt: string): Promise<boolean> {
  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(id);
  if (pi.status !== 'succeeded' || pi.metadata.fulfillment_status !== 'unfulfilled') return false;
  await stripe.paymentIntents.update(id, {
    metadata: {
      fulfillment_status: 'shipped',
      shipped_at: shippedAt,
      ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
    },
  });
  return true;
}

export const isPaymentIntentId = (id: string) => /^pi_[A-Za-z0-9]+$/.test(id);

export const dashboardUrl = (o: Pick<Order, 'id' | 'livemode'>) =>
  `https://dashboard.stripe.com/${o.livemode ? '' : 'test/'}payments/${o.id}`;
