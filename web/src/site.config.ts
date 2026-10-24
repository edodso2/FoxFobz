// Business details and copy that isn't secret. Anything still in [BRACKETS]
// is a placeholder from the design and needs a real value before launch.

export const site = {
  name: 'Fox Fobz',
  url: 'https://foxfobz.com',
  supportEmail: 'support@foxfobz.com',
  legalName: 'Fox Fobz [LEGAL ENTITY NAME, e.g. "Fox Fobz LLC"]',
  // Business mailing address. Returns go here via USPS only.
  poBox: {
    line1: 'PO Box [NUMBER]',
    city: '[CITY]',
    state: '[ST]',
    zip: '[ZIP]',
  },
  // Governing-law state for the Terms page.
  governingState: '[STATE]',
  lastUpdated: 'October 20, 2026',
} as const;

export const product = {
  name: 'Fox Fobz Keyless Entry',
  // Display only — the amount charged comes from STRIPE_PRICE_KIT in Stripe.
  // Keep this in sync with the Stripe price.
  priceDisplay: '[PRICE]',
  years: [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993] as const,
  bodyStyles: ['Coupe', 'Hatchback', 'Convertible'] as const,
  defaultYear: 1990,
  defaultBodyStyle: 'Hatchback',
  maxQuantity: 10,
  inTheBox: [
    'Fox Fobz receiver board',
    'Two New Edge–style key fobs',
    'Install hardware [CONFIRM CONTENTS]',
    'Fox Fobz app access — iOS & Android [CONFIRM]',
  ],
  shippingWindow: '[SHIPPING WINDOW]', // e.g. "in 2–3 business days"
  warrantyLength: '[WARRANTY]', // e.g. "1-year"
  returnWindowDays: '[30]',
  installTime: '[X] min',
  installSkill: '[LEVEL]',
  // YouTube video ID for the install video (the part after v=). Empty = "coming soon".
  installVideoId: '',
  installChapters: [
    'Disconnect the battery',
    'Access the lock wiring',
    'Mount the receiver',
    'Connect and test the locks',
    'Pair the fobs and the app',
  ],
  appStoreUrl: '', // empty = placeholder badge linking to the email signup
  googlePlayUrl: '',
} as const;

// Defaults for the Pirate Ship CSV export. Weight is per package; each
// additional kit in the same order adds `extraKitWeightOz`.
export const shippingPackage = {
  weightOz: 16, // [CONFIRM] packed weight of one kit, in ounces
  extraKitWeightOz: 12, // [CONFIRM]
  lengthIn: 8, // [CONFIRM]
  widthIn: 6, // [CONFIRM]
  heightIn: 4, // [CONFIRM]
  description: 'Fox Fobz keyless entry kit',
} as const;

export type BodyStyle = (typeof product.bodyStyles)[number];

export function formatAddressLines() {
  const { line1, city, state, zip } = site.poBox;
  return [site.name, line1, `${city}, ${state} ${zip}`];
}
