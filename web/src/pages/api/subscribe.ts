import type { APIRoute } from 'astro';
import { isValidEmail, upsertSubscriber } from '../../lib/db';
import { verifyTurnstile } from '../../lib/turnstile';

export const prerender = false;

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

// Stores the address with a consent timestamp. Sends no email (no provider yet).
export const POST: APIRoute = async ({ request }) => {
  let email = '';
  let token = '';
  try {
    const form = await request.formData();
    email = String(form.get('email') ?? '').trim().toLowerCase();
    token = String(form.get('cf-turnstile-response') ?? '');
  } catch {
    return json({ ok: false, error: 'Something went wrong. Please try again.' }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ ok: false, field: 'email', error: 'Enter a valid email address, like you@example.com.' }, 400);
  }

  const human = await verifyTurnstile(token, request.headers.get('CF-Connecting-IP'));
  if (!human) {
    return json({ ok: false, error: 'We couldn’t verify you’re human. Please try again.' }, 400);
  }

  try {
    await upsertSubscriber(email, 'site').run();
  } catch (err) {
    console.error('subscribe insert failed', err);
    return json({ ok: false, error: 'Something went wrong on our end. Please try again.' }, 500);
  }

  return json({ ok: true });
};
