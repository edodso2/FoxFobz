import { env } from 'cloudflare:workers';

export const db = () => env.DB;

export interface SubscriberRow {
  id: number;
  email: string;
  source: 'site' | 'checkout';
  consented_at: string;
  unsubscribed_at: string | null;
}

export const nowIso = () => new Date().toISOString();

/**
 * Add or re-consent a subscriber. A returning address keeps its original
 * source, gets a fresh consent timestamp, and is no longer unsubscribed.
 */
export function upsertSubscriber(email: string, source: 'site' | 'checkout', consentedAt = nowIso()) {
  return db()
    .prepare(
      `INSERT INTO subscribers (email, source, consented_at)
       VALUES (?1, ?2, ?3)
       ON CONFLICT (email) DO UPDATE SET
         consented_at = excluded.consented_at,
         unsubscribed_at = NULL`,
    )
    .bind(email.trim().toLowerCase(), source, consentedAt);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (email: string) => email.length <= 254 && EMAIL_RE.test(email);
