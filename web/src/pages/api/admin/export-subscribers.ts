import type { APIRoute } from 'astro';
import { db, type SubscriberRow } from '../../../lib/db';
import { csvResponse, toCsv } from '../../../lib/csv';

export const prerender = false;

// Active (not unsubscribed) subscribers, for importing into a newsletter tool.
export const GET: APIRoute = async () => {
  const { results } = await db()
    .prepare(`SELECT * FROM subscribers WHERE unsubscribed_at IS NULL ORDER BY consented_at ASC`)
    .all<SubscriberRow>();

  const rows = results.map((s) => [s.email, s.source, s.consented_at]);
  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(['Email', 'Source', 'Consented At (UTC)'], rows), `foxfobz-subscribers-${date}.csv`);
};
