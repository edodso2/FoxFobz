import type { APIRoute } from 'astro';
import type Stripe from 'stripe';
import { STRIPE_PRICE_KIT, STRIPE_SHIPPING_RATE_IDS } from 'astro:env/server';
import { getStripe } from '../../lib/stripe';
import { product, type BodyStyle } from '../../site.config';

export const prerender = false;

const backToKit = (origin: string, error: string) => Response.redirect(`${origin}/?checkout_error=${error}#kit`, 303);

export const POST: APIRoute = async ({ request, url }) => {
  const origin = url.origin;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return backToKit(origin, 'invalid');
  }

  const year = Number(form.get('year'));
  const bodyStyle = String(form.get('body_style') ?? '') as BodyStyle;
  const quantity = Number(form.get('quantity') ?? 1);

  if (
    !(product.years as readonly number[]).includes(year) ||
    !product.bodyStyles.includes(bodyStyle) ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > product.maxQuantity
  ) {
    return backToKit(origin, 'invalid');
  }

  const fitment = { year: String(year), body_style: bodyStyle };
  const shippingRates = STRIPE_SHIPPING_RATE_IDS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    line_items: [{ price: STRIPE_PRICE_KIT, quantity }],
    metadata: fitment,
    // On the PaymentIntent too, so /admin can find orders with the Search API.
    payment_intent_data: { metadata: { fulfillment_status: 'unfulfilled', ...fitment } },
    shipping_address_collection: { allowed_countries: ['US'] },
    phone_number_collection: { enabled: true },
    shipping_options: shippingRates.map((shipping_rate) => ({ shipping_rate })),
    automatic_tax: { enabled: true },
    consent_collection: { promotions: 'auto' },
    custom_text: {
      submit: { message: `Fitment: ${year} Mustang ${bodyStyle}. Tracking is emailed when your order ships.` },
    },
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cancel`,
  };

  const stripe = getStripe();
  try {
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(params);
    } catch (err) {
      // Promotional consent is only offered to some accounts; never let it block a sale.
      const e = err as Stripe.errors.StripeError;
      if (e.type === 'StripeInvalidRequestError' && e.param?.startsWith('consent_collection')) {
        console.warn('consent_collection rejected by Stripe; retrying without it:', e.message);
        const { consent_collection: _omit, ...rest } = params;
        session = await stripe.checkout.sessions.create(rest);
      } else {
        throw err;
      }
    }
    if (!session.url) throw new Error('Checkout Session has no URL');
    return Response.redirect(session.url, 303);
  } catch (err) {
    console.error('Failed to create Checkout Session', err);
    return backToKit(origin, 'unavailable');
  }
};
