import { defineMiddleware } from 'astro:middleware';
import { verifyAccessJwt } from './lib/access';

const isAdminPath = (p: string) => p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/admin/');

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (isAdminPath(pathname) && !context.isPrerendered && !import.meta.env.DEV) {
    const result = await verifyAccessJwt(context.request);
    if (!result.ok) {
      console.warn(`Blocked admin request to ${pathname}: ${result.reason}`);
      return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
    context.locals.adminEmail = result.email;
  }

  let response = await next();

  if (!context.isPrerendered) {
    // Responses like Response.redirect() have immutable headers; copy them first.
    try {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    } catch {
      response = new Response(response.body, response);
    }
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (isAdminPath(pathname)) {
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      if (!response.headers.has('Cache-Control')) response.headers.set('Cache-Control', 'no-store');
    }
  }
  return response;
});
