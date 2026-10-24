import type { APIRoute } from 'astro';
import { nowIso } from '../../../lib/db';
import { isPaymentIntentId, markShipped } from '../../../lib/orders';

export const prerender = false;

// Form POST from /admin. `single` marks one order; otherwise every checked `id`.
// IDs are PaymentIntent IDs. Tracking numbers come from `tracking_<id>` inputs
// and are optional.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const single = form.get('single');
  const ids = [...new Set((single ? [single] : form.getAll('id')).map(String))].filter(isPaymentIntentId);

  if (ids.length === 0) return redirect('/admin?notice=none-selected', 303);

  const shippedAt = nowIso();
  const results = await Promise.allSettled(
    ids.map((id) => {
      const tracking = String(form.get(`tracking_${id}`) ?? '').trim().slice(0, 64) || null;
      return markShipped(id, tracking, shippedAt);
    }),
  );
  const changed = results.filter((r) => r.status === 'fulfilled' && r.value).length;
  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((r) => console.error('Failed to mark order shipped', (r as PromiseRejectedResult).reason));

  return redirect(`/admin?notice=shipped&count=${changed}${failed.length ? `&failed=${failed.length}` : ''}`, 303);
};
