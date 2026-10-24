import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from 'astro:env/server';

let client: Stripe | undefined;

export function getStripe(): Stripe {
  client ??= new Stripe(STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 2,
  });
  return client;
}

export const webCrypto = Stripe.createSubtleCryptoProvider();

export function formatMoney(amount: number | null | undefined, currency = 'usd'): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}
