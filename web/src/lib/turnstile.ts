import { TURNSTILE_SECRET_KEY } from 'astro:env/server';

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

export async function verifyTurnstile(token: string, remoteIp: string | null): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  const body = new FormData();
  body.append('secret', TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (remoteIp) body.append('remoteip', remoteIp);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = (await res.json()) as SiteverifyResponse;
    return data.success === true;
  } catch {
    return false;
  }
}
