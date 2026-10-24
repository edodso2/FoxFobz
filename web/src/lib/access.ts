// Verifies the Cloudflare Access JWT on /admin requests. Access already blocks
// unauthenticated requests at the edge; this makes sure the admin can't be
// reached if the Access application is ever misconfigured or bypassed
// (e.g. through the *.workers.dev hostname).
import { CF_ACCESS_AUD, CF_ACCESS_TEAM_DOMAIN } from 'astro:env/server';

interface Jwk extends JsonWebKey {
  kid: string;
}

let cachedKeys: { keys: Jwk[]; fetchedAt: number } | undefined;

async function getKeys(teamDomain: string, forceRefresh = false): Promise<Jwk[]> {
  if (!forceRefresh && cachedKeys && Date.now() - cachedKeys.fetchedAt < 60 * 60 * 1000) return cachedKeys.keys;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access certs fetch failed: ${res.status}`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  cachedKeys = { keys, fetchedAt: Date.now() };
  return keys;
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const decodeJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlDecode(s)));

export type AccessResult = { ok: true; email: string | null } | { ok: false; reason: string };

export async function verifyAccessJwt(request: Request): Promise<AccessResult> {
  if (!CF_ACCESS_TEAM_DOMAIN || !CF_ACCESS_AUD) {
    return { ok: false, reason: 'CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD are not configured' };
  }
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return { ok: false, reason: 'Missing Access token' };

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'Malformed token' };
  const [headerB64, payloadB64, sigB64] = parts;

  let header: { kid?: string; alg?: string };
  let payload: { aud?: string | string[]; exp?: number; nbf?: number; iss?: string; email?: string };
  try {
    header = decodeJson(headerB64);
    payload = decodeJson(payloadB64);
  } catch {
    return { ok: false, reason: 'Malformed token' };
  }
  if (header.alg !== 'RS256') return { ok: false, reason: 'Unexpected algorithm' };

  let keys = await getKeys(CF_ACCESS_TEAM_DOMAIN);
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    keys = await getKeys(CF_ACCESS_TEAM_DOMAIN, true); // keys rotated
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) return { ok: false, reason: 'Unknown signing key' };

  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlDecode(sigB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  );
  if (!valid) return { ok: false, reason: 'Bad signature' };

  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(CF_ACCESS_AUD)) return { ok: false, reason: 'Wrong audience' };
  if (payload.iss !== `https://${CF_ACCESS_TEAM_DOMAIN}`) return { ok: false, reason: 'Wrong issuer' };
  if (!payload.exp || payload.exp < now) return { ok: false, reason: 'Expired' };
  if (payload.nbf && payload.nbf > now + 60) return { ok: false, reason: 'Not yet valid' };

  return { ok: true, email: payload.email ?? null };
}
