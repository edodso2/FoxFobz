// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://foxfobz.com',
  // Pages are prerendered by default; API routes, /success and /admin opt out
  // with `export const prerender = false`.
  output: 'static',
  adapter: cloudflare({
    // Optimize images at build time with sharp; the Worker serves the results.
    imageService: 'compile',
  }),
  // No sessions needed, so don't provision a KV namespace for them.
  session: false,
  // The CSS is small; inlining it removes a render-blocking request.
  build: { inlineStylesheets: 'always' },
  fonts: [
    {
      // Downloaded from Google Fonts at build time and served from our own origin.
      provider: fontProviders.google(),
      name: 'Karla',
      cssVariable: '--font-karla',
      weights: ['200 600'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
      display: 'swap',
    },
  ],
  env: {
    schema: {
      // Runtime secrets/config — set with `wrangler secret put` (prod) or .dev.vars (local).
      STRIPE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
      STRIPE_WEBHOOK_SECRET: envField.string({ context: 'server', access: 'secret' }),
      STRIPE_PRICE_KIT: envField.string({ context: 'server', access: 'secret' }),
      // Comma-separated Stripe shipping rate IDs (shr_...), first one is the default.
      STRIPE_SHIPPING_RATE_IDS: envField.string({ context: 'server', access: 'secret' }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
      // Cloudflare Access (defense in depth for /admin): e.g. "foxfobz.cloudflareaccess.com"
      CF_ACCESS_TEAM_DOMAIN: envField.string({ context: 'server', access: 'secret', optional: true }),
      CF_ACCESS_AUD: envField.string({ context: 'server', access: 'secret', optional: true }),

      // Public, inlined into the client bundle at build time.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', default: '1x00000000000000000000AA' }),
      PUBLIC_CF_BEACON_TOKEN: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
