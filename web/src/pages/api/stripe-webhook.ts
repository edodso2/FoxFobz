import type { APIRoute } from 'astro';
import type Stripe from 'stripe';
import { STRIPE_WEBHOOK_SECRET } from 'astro:env/server';
import { getStripe, webCrypto } from '../../lib/stripe';
import { upsertSubscriber } from '../../lib/db';

export const prerender = false;

// Orders live in Stripe, so the only thing recorded here is promotional email
// consent. Sends no emails: Stripe sends the receipt, Pirate Ship sends tracking.
export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(payload, signature, STRIPE_WEBHOOK_SECRET, undefined, webCrypto);
  } catch (err) {
    console.warn('Webhook signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email;
      if (session.consent?.promotions === 'opt_in' && email) {
        await upsertSubscriber(email, 'checkout').run();
      }
    }
  } catch (err) {
    // A 500 makes Stripe retry; the upsert makes retries safe.
    console.error(`Failed to handle ${event.type} ${event.id}`, err);
    return new Response('Handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
};
